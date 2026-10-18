import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { approveCheckin } from "../src/api/controllers/checkin.controller.js";
import { User, Program, CheckinSubmission } from "../src/api/models/index.js";
import sequelize from "../src/api/config/database.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"));
const CODE = "TEST_DECOUPLED_APP_001";

const createSamplePlan = () => JSON.parse(JSON.stringify(buildMasterEngineV2({
  intake: {
    gender: "male", age: "28", height_cm: "178", weight_kg: "85",
    circumferences: { neck_cm: "38", waist_cm: "92", hips_cm: "102" },
    primary_goal: "fat_loss", neat_level: "moderate", occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
    medical_conditions: { has_conditions: false, selected: ["none"] }, injuries_map: { has_injuries: false, selected_areas: ["none"] },
    religion: "MUSLIM", strict_allergies: ["none"], meal_structure: { meals_count: "3_meals", intermittent_fasting: "none" },
    training_environment: "commercial_gym", training_logistics: { days_per_week: 4, experience_level: "intermediate" }, recent_training: "ACTIVE",
  },
  evaluationContext: { system_time: "2026-10-01T08:00:00.000Z", assessmentDate: "2026-10-01" },
  nutritionFoodCatalog: CATALOG,
  options: {},
})));

const kcalOf = (data) => Number(data?.nutrition?.targets?.calories ?? data?.nutrition_program?.macro_targets?.calories_kcal);

test.after(async () => {
  await sequelize.close().catch(() => {});
});

test("Decoupled Check-in Approval: Coach reviews and gives feedback WITHOUT modifying active program or draft", async () => {
  const existing = await User.findOne({ where: { client_code: CODE } });
  if (existing) {
    await CheckinSubmission.destroy({ where: { user_id: existing.id } });
    await Program.destroy({ where: { user_id: existing.id } });
    await existing.destroy();
  }

  const client = await User.create({ client_code: CODE, phone_number: "01099112233", full_name: "Decoupled Trainee", role: "CLIENT", gender: "male" });

  try {
    const basePlanData = createSamplePlan();
    const activeProgram = await Program.create({ user_id: client.id, status: "ACTIVE", program_data: basePlanData });
    const draftProgram = await Program.create({ user_id: client.id, status: "DRAFT", program_data: { ...basePlanData, cycle_number: 2 } });

    const initialActiveKcal = kcalOf(activeProgram.program_data);
    const initialDraftKcal = kcalOf(draftProgram.program_data);

    // Trainee submits a check-in with rapid weight loss flag that would normally trigger +150 kcal
    const checkin = await CheckinSubmission.create({
      user_id: client.id,
      week_number: 1,
      daily_weights_kg: [83.0],
      average_weight_kg: 83.0,
      nutrition_adherence_percent: 95,
      workouts_completed: 4,
      workouts_scheduled: 4,
      biofeedback: {},
      pain_reports: [],
      analysis_status: "RAPID_LOSS_WARNING",
      analysis_output: { analysis_status: "RAPID_LOSS_WARNING", suggested_calorie_delta: 150 },
      status: "PENDING_REVIEW",
    });

    // 1. Coach reviews and leaves feedback ONLY (apply_program_adaptation not true)
    const out1 = {};
    const feedbackNote = "التزامك رائع يا بطل، سنحافظ على نفس الأرقام هذا الأسبوع لمراقبة استقرار الوزن.";
    await approveCheckin(
      { params: { checkinId: checkin.id }, body: { coach_notes: feedbackNote } },
      { status(c) { out1.status = c; return this; }, json(b) { out1.body = b; return this; } }
    );

    assert.equal(out1.status, 200);
    assert.equal(out1.body.success, true);
    assert.equal(out1.body.program_adapted, false);

    // Verify Check-in was approved and coach notes saved
    await checkin.reload();
    assert.equal(checkin.status, "APPROVED");
    assert.equal(checkin.coach_notes, feedbackNote);
    assert.equal(checkin.adapted_program_id, null, "adapted_program_id must remain null when program is not adapted");

    // CRUCIAL: Active program and draft MUST remain 100% UNCHANGED
    await activeProgram.reload();
    await draftProgram.reload();
    assert.equal(kcalOf(activeProgram.program_data), initialActiveKcal, "Active program calories must NOT change");
    assert.equal(kcalOf(draftProgram.program_data), initialDraftKcal, "Draft program calories must NOT change");

    // 2. Coach explicitly decides to adapt program (apply_program_adaptation: true)
    const out2 = {};
    await approveCheckin(
      { params: { checkinId: checkin.id }, body: { coach_notes: "تم تعديل السعرات لكسر النزول السريع", apply_program_adaptation: true } },
      { status(c) { out2.status = c; return this; }, json(b) { out2.body = b; return this; } }
    );

    assert.equal(out2.status, 200);
    assert.equal(out2.body.success, true);
    assert.equal(out2.body.program_adapted, true);

    await activeProgram.reload();
    await draftProgram.reload();
    assert.equal(kcalOf(activeProgram.program_data), initialActiveKcal + 150, "Active program calories should now take the +150 adjustment");
    assert.equal(kcalOf(draftProgram.program_data), initialDraftKcal + 150, "Draft program calories should now take the +150 adjustment");

    await checkin.reload();
    assert.equal(checkin.adapted_program_id, activeProgram.id);
  } finally {
    await CheckinSubmission.destroy({ where: { user_id: client.id } }).catch(() => {});
    await Program.destroy({ where: { user_id: client.id } }).catch(() => {});
    await client.destroy().catch(() => {});
  }
});

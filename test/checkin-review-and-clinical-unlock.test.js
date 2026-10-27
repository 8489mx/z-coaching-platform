import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { approveCheckin, unlockClinicalSafety } from "../src/api/controllers/checkin.controller.js";
import { User, Program, CheckinSubmission } from "../src/api/models/index.js";
import sequelize from "../src/api/config/database.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"));
const CODE = "TEST_FIX09_FIX10_001";

const createSamplePlan = () => JSON.parse(JSON.stringify(buildMasterEngineV2({
  intake: {
    gender: "male", age: "30", height_cm: "178", weight_kg: "85",
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

test("FIX-09 & FIX-10: Clinical unlock requires clearance notes, and repeated approveCheckin does not double-apply calorie delta", async () => {
  const existing = await User.findOne({ where: { client_code: CODE } });
  if (existing) {
    await CheckinSubmission.destroy({ where: { user_id: existing.id } });
    await Program.destroy({ where: { user_id: existing.id } });
    await existing.destroy();
  }

  const client = await User.create({ client_code: CODE, phone_number: "01088776655", full_name: "Fix0910 Trainee", role: "CLIENT", gender: "male" });
  const coach = await User.create({ client_code: "COACH_" + CODE, phone_number: "01088776644", full_name: "Fix0910 Coach", role: "ADMIN", gender: "male" });

  try {
    const basePlanData = createSamplePlan();
    const activeProgram = await Program.create({ user_id: client.id, status: "ACTIVE", program_data: basePlanData });
    const initialActiveKcal = kcalOf(activeProgram.program_data);

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
      analysis_output: {
        analysis_status: "RAPID_LOSS_WARNING",
        suggested_calorie_delta: 150,
        training_locked: true
      },
      status: "PENDING_REVIEW",
    });

    // 1. FIX-09: Unlocking clinical safety without clearance_notes must fail with 400
    const unlockMissingNotes = {};
    await unlockClinicalSafety(
      {
        user: { id: coach.id, role: "COACH" },
        params: { checkinId: checkin.id },
        body: { medical_clearance_confirmed: true, clearance_notes: "   " }
      },
      { status(c) { unlockMissingNotes.status = c; return this; }, json(b) { unlockMissingNotes.body = b; return this; } }
    );
    assert.equal(unlockMissingNotes.status, 400, "Clinical unlock must reject empty clearance_notes");

    // 2. FIX-09: Unlocking with valid clearance_notes succeeds and persists training_locked: false
    const unlockOk = {};
    await unlockClinicalSafety(
      {
        user: { id: coach.id, role: "COACH" },
        params: { checkinId: checkin.id },
        body: {
          medical_clearance_confirmed: true,
          clearance_notes: "تم مراجعة تخطيط القلب والتصريح الطبي باستئناف التدريب معتمد."
        }
      },
      { status(c) { unlockOk.status = c; return this; }, json(b) { unlockOk.body = b; return this; } }
    );
    assert.equal(unlockOk.status, 200);
    await checkin.reload();
    assert.equal(checkin.analysis_output.training_locked, false);
    assert.equal(checkin.analysis_output.clinical_unlock.unlocked, true);

    // 3. FIX-10: First adaptation applies +150 kcal once
    const approve1 = {};
    await approveCheckin(
      {
        user: { id: coach.id, role: "COACH" },
        params: { checkinId: checkin.id },
        body: { coach_notes: "اعتماد وتحديث الخطة", apply_program_adaptation: true }
      },
      { status(c) { approve1.status = c; return this; }, json(b) { approve1.body = b; return this; } }
    );
    assert.equal(approve1.status, 200);
    await activeProgram.reload();
    assert.equal(kcalOf(activeProgram.program_data), initialActiveKcal + 150);

    // 4. FIX-10: Calling approveCheckin a second time on the already-adapted checkin must NOT add +150 kcal again
    const approve2 = {};
    await approveCheckin(
      {
        user: { id: coach.id, role: "COACH" },
        params: { checkinId: checkin.id },
        body: { coach_notes: "تحديث الملاحظة فقط بعد الاعتماد", apply_program_adaptation: true }
      },
      { status(c) { approve2.status = c; return this; }, json(b) { approve2.body = b; return this; } }
    );
    assert.equal(approve2.status, 200);
    await activeProgram.reload();
    assert.equal(
      kcalOf(activeProgram.program_data),
      initialActiveKcal + 150,
      "Repeated approveCheckin on same checkin must be idempotent and not double-apply +150 kcal"
    );

    // 5. Verify CheckinReviewDashboard UI contains separated approval buttons, clinical unlock card, and period summary bar
    const dashboardSource = fs.readFileSync(path.join(ROOT, "frontend/src/pages/CheckinReviewDashboard.jsx"), "utf8");
    assert.ok(dashboardSource.includes("apply_program_adaptation"), "CheckinReviewDashboard must explicitly send apply_program_adaptation");
    assert.ok(dashboardSource.includes("unlock-clinical-safety"), "CheckinReviewDashboard must wire clinical safety unlock endpoint");
    assert.ok(dashboardSource.includes("اعتماد المراجعة فقط"), "CheckinReviewDashboard must provide review-only approval button");
  } finally {
    await CheckinSubmission.destroy({ where: { user_id: client.id } }).catch(() => {});
    await Program.destroy({ where: { user_id: client.id } }).catch(() => {});
    await client.destroy().catch(() => {});
    await coach.destroy().catch(() => {});
  }
});

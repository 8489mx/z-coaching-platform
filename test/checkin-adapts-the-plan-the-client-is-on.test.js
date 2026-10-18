import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { approveCheckin } from "../src/api/controllers/checkin.controller.js";
import { User, Program, CheckinSubmission } from "../src/api/models/index.js";
import sequelize from "../src/api/config/database.js";

/**
 * While the next cycle waits for the coach as a draft, the client still trains and eats on the
 * active plan. Approving a check-in adapted "the newest plan" - the draft - so the calorie change
 * never reached the client until the coach published, and the active plan stayed stale.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"));
const CODE = "TEST_ADAPT_ACTIVE_941";

const plan = () => JSON.parse(JSON.stringify(buildMasterEngineV2({
  intake: {
    gender: "female", age: "30", height_cm: "165", weight_kg: "70", circumferences: { neck_cm: "33", waist_cm: "80", hips_cm: "100" },
    primary_goal: "fat_loss", neat_level: "moderate", occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
    medical_conditions: { has_conditions: false, selected: ["none"] }, injuries_map: { has_injuries: false, selected_areas: ["none"] },
    religion: "MUSLIM", strict_allergies: ["none"], meal_structure: { meals_count: "3_meals", intermittent_fasting: "none" },
    training_environment: "commercial_gym", training_logistics: { days_per_week: 3, experience_level: "beginner" }, recent_training: "ACTIVE",
  },
  evaluationContext: { system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" },
  nutritionFoodCatalog: CATALOG,
  options: {},
})));
const kcalOf = (data) => Number(data?.nutrition?.targets?.calories ?? data?.nutrition_program?.macro_targets?.calories_kcal);

test.after(async () => {
  await sequelize.close().catch(() => {});
});

test("a check-in approved while the next cycle waits as a draft adapts the active plan", async () => {
  const existing = await User.findOne({ where: { client_code: CODE } });
  if (existing) {
    await CheckinSubmission.destroy({ where: { user_id: existing.id } });
    await Program.destroy({ where: { user_id: existing.id } });
    await existing.destroy();
  }
  const client = await User.create({ client_code: CODE, phone_number: "01099000941", full_name: "Adapt", role: "CLIENT", gender: "female" });
  try {
    const active = await Program.create({ user_id: client.id, status: "ACTIVE", program_data: plan() });
    const draft = await Program.create({ user_id: client.id, status: "DRAFT", program_data: { ...plan(), cycle_number: 2 } });
    const before = kcalOf(active.program_data);
    const checkin = await CheckinSubmission.create({
      user_id: client.id, week_number: 4, daily_weights_kg: [68], average_weight_kg: 68, nutrition_adherence_percent: 95,
      workouts_completed: 3, workouts_scheduled: 3, biofeedback: {}, pain_reports: [],
      analysis_status: "RAPID_LOSS_WARNING", analysis_output: { analysis_status: "RAPID_LOSS_WARNING" }, status: "PENDING_REVIEW",
    });

    const out = {};
    await approveCheckin({ params: { checkinId: checkin.id }, body: { apply_program_adaptation: true } }, { status(c) { out.status = c; return this; }, json(b) { out.body = b; return this; } });
    assert.equal(out.status, 200, JSON.stringify(out.body));

    await active.reload();
    await draft.reload();
    assert.equal(kcalOf(active.program_data), before + 150, "the plan the client is on took the rapid-loss +150");
    assert.equal(kcalOf(draft.program_data), before + 150, "the waiting cycle carries the same targets when it is published");
  } finally {
    await CheckinSubmission.destroy({ where: { user_id: client.id } }).catch(() => {});
    await Program.destroy({ where: { user_id: client.id } }).catch(() => {});
    await client.destroy().catch(() => {});
  }
});

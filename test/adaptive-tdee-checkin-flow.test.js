import test from "node:test";
import assert from "node:assert/strict";

import { submitCheckin } from "../src/api/controllers/checkin.controller.js";
import { buildAdaptedPlan } from "../src/adaptation-engine/index.js";
import { User, IntakeSubmission, Program, CheckinSubmission } from "../src/api/models/index.js";
import { encryptMedicalData } from "../src/utils/crypto.js";
import sequelize from "../src/api/config/database.js";

const CODE = "TEST_TDEE_908";

function mockRes() {
  const out = { status: 200, body: null };
  const res = { status(c) { out.status = c; return res; }, json(b) { out.body = b; return res; } };
  return { res, out };
}

async function cleanup() {
  const user = await User.findOne({ where: { client_code: CODE } });
  if (!user) return;
  await CheckinSubmission.destroy({ where: { user_id: user.id } }).catch(() => {});
  await Program.destroy({ where: { user_id: user.id } }).catch(() => {});
  await IntakeSubmission.destroy({ where: { user_id: user.id } }).catch(() => {});
  await user.destroy().catch(() => {});
}

test("three web check-ins produce an observed TDEE that the adaptation engine applies", async (t) => {
  await cleanup();
  const user = await User.create({ client_code: CODE, phone_number: "01099000908", full_name: "TDEE Test", role: "CLIENT" });
  try {
    await IntakeSubmission.create({
      user_id: user.id,
      status: "APPROVED",
      answers: { _isEncrypted: true, data: encryptMedicalData({ answers: { gender: "male", age: "35", height_cm: "178", weight_kg: "90", primary_goal: "fat_loss" } }) },
    });
    const program = await Program.create({
      user_id: user.id,
      status: "ACTIVE",
      program_data: {
        nutrition: { targets: { calories: 2000, protein: 180, carbs: 180, fats: 60 } },
        nutrition_program: { targets: { tdee: 2500 }, macro_targets: { calories_kcal: 2000, protein_g: 180, carbohydrate_g: 180, fat_g: 60 } },
      },
    });

    const submit = async (week, body) => {
      const r = mockRes();
      await submitCheckin({ body: { user_id: CODE, week_number: week, nutrition_adherence_percent: 90, workouts_completed: 3, occupation_type: "FIELD_MOBILE", sleep_stress_composite: 4, ...body } }, r.res);
      assert.equal(r.out.status, 201, JSON.stringify(r.out.body));
      return r.out.body.analysis;
    };

    await t.test("weeks 1-2: not enough trend, formula stays", async () => {
      assert.equal((await submit(1, { weight_kg: 90 })).adaptive_tdee.ready, false);
      assert.equal((await submit(2, { weight_kg: 89.5 })).adaptive_tdee.ready, false);
    });

    let week3;
    await t.test("week 3 with 7 daily weights: observed TDEE = 2000 + 0.5 x 7700/7 = 2550", async () => {
      week3 = await submit(3, { weight_kg: 89, daily_weights_kg: [89.3, 89.1, 89.0, 88.9, 89.0, 88.8, 88.9] });
      const stored = await CheckinSubmission.findOne({ where: { user_id: user.id, week_number: 3 } });
      assert.equal(stored.average_weight_kg, 89);
      assert.equal(stored.daily_weights_kg.length, 7);
      assert.equal(week3.adaptive_tdee.ready, true);
      assert.equal(week3.adaptive_tdee.observed_tdee_kcal, 2550);
      assert.equal(week3.plan_target_kcal, 2000);
      // Fat loss: 2550 x 0.8 = 2040 -> +40 kcal
      assert.equal(week3.adaptive_tdee.recommended_target_kcal, 2040);
    });

    await t.test("the stored analysis drives the adapted plan", async () => {
      const stored = await CheckinSubmission.findOne({ where: { user_id: user.id, week_number: 3 } });
      const adapted = buildAdaptedPlan({ currentMasterProgram: program.program_data, checkinAnalysis: stored.analysis_output });
      assert.ok(JSON.stringify(adapted).includes('"target_calories_kcal":2040'));
    });
  } finally {
    await cleanup();
    await sequelize.close().catch(() => {});
  }
});

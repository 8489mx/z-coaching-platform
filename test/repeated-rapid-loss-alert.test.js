import test from "node:test";
import assert from "node:assert/strict";

import { submitCheckin } from "../src/api/controllers/checkin.controller.js";
import { User, CheckinSubmission, IntakeSubmission, Program } from "../src/api/models/index.js";
import sequelize from "../src/api/config/database.js";

/**
 * A nursing mother losing 1.1 kg a week got RAPID_LOSS_WARNING at every check-in for four months
 * and nothing more. The +150 kcal still applies; two rapid-loss check-ins running in a client whose
 * file needs medical review now also put a clinical alert in front of the coach.
 */
const INTAKE = (selected, femaleCases = {}) => ({
  answers: {
    gender: "female", age: "29", height_cm: "165", weight_kg: "76", primary_goal: "fat_loss", dangerous_symptoms: ["NONE"],
    medical_conditions: { has_conditions: selected.length > 0, selected, female_cases: { is_pcos: false, is_lactating: false, is_postpartum: false, ...femaleCases } },
    injuries_map: { has_injuries: false, selected_areas: ["none"] }, training_logistics: { days_per_week: 3, experience_level: "beginner" },
  },
});

test.after(async () => {
  await sequelize.close().catch(() => {});
});

async function twoRapidLossCheckins(code, phone, intake) {
  const existing = await User.findOne({ where: { client_code: code } });
  if (existing) {
    await CheckinSubmission.destroy({ where: { user_id: existing.id } });
    await IntakeSubmission.destroy({ where: { user_id: existing.id } });
    await existing.destroy();
  }
  const user = await User.create({ client_code: code, phone_number: phone, full_name: code, role: "CLIENT" });
  const original = IntakeSubmission.findOne;
  IntakeSubmission.findOne = async () => ({ answers: intake });
  const outputs = [];
  try {
    for (const [week, weight] of [[1, 76], [2, 74.4], [3, 72.8]]) {
      const out = {};
      await submitCheckin({ user: { id: user.id, role: "CLIENT" }, body: {
        user_id: user.id, week_number: week, weight_kg: weight, nutrition_adherence_percent: 95, workouts_completed: 3, workouts_scheduled: 3,
        biofeedback: { hunger_level: 3, energy_level: 3, sleep_quality: 3, sleep_hours: 6, stress_level: 2 },
      } }, { status(c) { out.status = c; return this; }, json(b) { out.body = b; return this; } });
      assert.ok(out.status < 300, JSON.stringify(out.body));
      outputs.push(out.body.checkin);
    }
    return outputs;
  } finally {
    IntakeSubmission.findOne = original;
    await CheckinSubmission.destroy({ where: { user_id: user.id } }).catch(() => {});
    await Program.destroy({ where: { user_id: user.id } }).catch(() => {});
    await user.destroy().catch(() => {});
  }
}

test("two rapid-loss check-ins running in a client needing medical review alert the coach", async () => {
  const [, second, third] = await twoRapidLossCheckins("TEST_RAPID_MED_961", "01099000961", INTAKE(["hepatic"]));
  assert.equal(second.analysis_status, "RAPID_LOSS_WARNING");
  assert.equal(second.analysis_output.clinical_alert, undefined, "one rapid-loss week is not yet an alert");
  assert.equal(third.analysis_status, "RAPID_LOSS_WARNING");
  assert.equal(third.analysis_output.clinical_alert?.code, "REPEATED_RAPID_LOSS_MEDICAL_CLIENT");
  assert.match(third.analysis_output.coach_action, /تنبيه طبي/);
});

test("the same weeks in a client without medical flags stay a calorie adjustment", async () => {
  const [, , third] = await twoRapidLossCheckins("TEST_RAPID_PLAIN_962", "01099000962", INTAKE([]));
  assert.equal(third.analysis_status, "RAPID_LOSS_WARNING");
  assert.equal(third.analysis_output.clinical_alert, undefined);
});

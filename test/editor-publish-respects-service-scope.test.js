import test from "node:test";
import assert from "node:assert/strict";

import { updateCustomProgram } from "../src/api/controllers/program.controller.js";
import { User, IntakeSubmission, Program } from "../src/api/models/index.js";
import sequelize from "../src/api/config/database.js";

/** The coach's manual editor does not publish a plan for a case outside the service either. */
const CODE = "TEST_EDITOR_SCOPE_111";
const answers = (selected) => ({ answers: {
  gender: "female", age: "34", height_cm: "165", weight_kg: "80", primary_goal: "fat_loss", dangerous_symptoms: ["NONE"],
  medical_conditions: { has_conditions: selected.length > 0, selected, female_cases: { is_pcos: false, is_lactating: false, is_postpartum: false, answered: true } },
  injuries_map: { has_injuries: false, selected_areas: ["none"] }, strict_allergies: ["none"],
  training_logistics: { days_per_week: 3, experience_level: "beginner" },
} });
let client;
let coach;

test.before(async () => {
  const existing = await User.findOne({ where: { client_code: CODE } });
  if (existing) {
    await Program.destroy({ where: { user_id: existing.id } });
    await IntakeSubmission.destroy({ where: { user_id: existing.id } });
    await existing.destroy();
  }
  client = await User.create({ client_code: CODE, phone_number: "01099000111", full_name: "Editor scope", role: "CLIENT" });
  // S4-1: updateCustomProgram is coach-only, so the editor calls use a coach requester.
  coach = await User.create({ client_code: "TEST_EDITOR_COACH_111", phone_number: "01099000112", full_name: "Editor coach", role: "ADMIN" });
});
test.after(async () => {
  await Program.destroy({ where: { user_id: client.id } }).catch(() => {});
  await IntakeSubmission.destroy({ where: { user_id: client.id } }).catch(() => {});
  await client?.destroy().catch(() => {});
  await coach?.destroy().catch(() => {});
  await sequelize.close().catch(() => {});
});

const publish = async (extra = {}) => {
  const out = {};
  await updateCustomProgram({ body: { client_code: CODE, program_data: { nutrition: {} }, publish: true, ...extra }, user: { id: coach.id } },
    { status(c) { out.status = c; return this; }, json(b) { out.body = b; return this; } });
  return out;
};

test("a kidney client's plan is not published from the editor, even with a medical confirmation", async () => {
  await IntakeSubmission.destroy({ where: { user_id: client.id } });
  await IntakeSubmission.create({ user_id: client.id, answers: answers(["renal"]), status: "PENDING_COACH_REVIEW" });
  const forced = await publish({ medical_review_confirmed: true });
  assert.equal(forced.status, 422, JSON.stringify(forced.body));
  assert.equal(forced.body.code, "OUTSIDE_SERVICE_SCOPE");
  assert.equal(await Program.count({ where: { user_id: client.id, status: "ACTIVE" } }), 0);
});

test("an ordinary client still publishes from the editor", async () => {
  await IntakeSubmission.destroy({ where: { user_id: client.id } });
  await IntakeSubmission.create({ user_id: client.id, answers: answers([]), status: "PENDING_COACH_REVIEW" });
  const out = await publish();
  assert.equal(out.status, 200, JSON.stringify(out.body).slice(0, 200));
});

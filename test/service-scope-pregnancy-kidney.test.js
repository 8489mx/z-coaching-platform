import test from "node:test";
import assert from "node:assert/strict";

import { assessServiceScope } from "../src/api/services/serviceScope.js";
import { generateDraftFromIntake, approveAndPublishIntake } from "../src/api/controllers/intake.controller.js";
import { User, IntakeSubmission, Program } from "../src/api/models/index.js";
import sequelize from "../src/api/config/database.js";

/**
 * Pregnancy and kidney disease are followed by the client's own doctor, so the service does not plan
 * for them: no draft is generated and nothing is published, whatever a coach clicks. Breastfeeding,
 * a recent birth and every other condition stay inside the service.
 */
const base = () => ({
  health_data_consent: { accepted: true, version: "PDPL-2026-09", accepted_at: new Date().toISOString() },
  gender: "female", age: "32", height_cm: "165", weight_kg: "80",
  circumferences: { neck_cm: "34", waist_cm: "90", hips_cm: "105" },
  primary_goal: "fat_loss", neat_level: "moderate", occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
  medical_conditions: { has_conditions: false, selected: [], female_cases: { is_pcos: false, is_lactating: false, is_postpartum: false, answered: true }, diabetes: { type: "type2", uses_insulin: false } },
  injuries_map: { has_injuries: false, selected_areas: ["none"] },
  religion: "MUSLIM", strict_allergies: ["none"], meal_structure: { meals_count: "3_meals", intermittent_fasting: "none" },
  training_environment: "commercial_gym", training_logistics: { days_per_week: 3, experience_level: "beginner" }, recent_training: "ACTIVE",
});
const pregnant = () => ({ ...base(), female_pregnancy: "PREGNANT", pregnancy_trimester: "2" });
const kidney = () => ({ ...base(), medical_conditions: { ...base().medical_conditions, has_conditions: true, selected: ["renal"] } });
const breastfeeding = () => ({ ...base(), medical_conditions: { ...base().medical_conditions, has_conditions: true, selected: [], female_cases: { is_pcos: false, is_lactating: true, is_postpartum: true, answered: true } } });

test("the scope rule reads the form's own answers", () => {
  assert.equal(assessServiceScope(base()).supported, true);
  assert.equal(assessServiceScope(breastfeeding()).supported, true);
  const p = assessServiceScope(pregnant());
  assert.equal(p.supported, false);
  assert.deepEqual(p.cases, ["PREGNANCY"]);
  assert.match(p.reasons_ar[0], /الحمل/);
  const k = assessServiceScope(kidney());
  assert.equal(k.supported, false);
  assert.deepEqual(k.cases, ["KIDNEY_DISEASE"]);
  // The stored wrapper ({ answers: {...} }) is read the same way.
  assert.equal(assessServiceScope({ answers: kidney() }).supported, false);
});

const call = async (fn, req) => { const out = {}; await fn(req, { status(c) { out.status = c; return this; }, json(b) { out.body = b; return this; } }); return out; };
const CODES = ["TEST_SCOPE_PREG_101", "TEST_SCOPE_KIDNEY_102", "TEST_SCOPE_OK_103"];
const made = [];

test.after(async () => {
  for (const user of made) {
    await Program.destroy({ where: { user_id: user.id } }).catch(() => {});
    await IntakeSubmission.destroy({ where: { user_id: user.id } }).catch(() => {});
    await user.destroy().catch(() => {});
  }
  await sequelize.close().catch(() => {});
});

async function submissionFor(code, phone, answers) {
  const existing = await User.findOne({ where: { client_code: code } });
  if (existing) {
    await Program.destroy({ where: { user_id: existing.id } });
    await IntakeSubmission.destroy({ where: { user_id: existing.id } });
    await existing.destroy();
  }
  const user = await User.create({ client_code: code, phone_number: phone, full_name: code, role: "CLIENT", gender: "female" });
  made.push(user);
  const submission = await IntakeSubmission.create({ user_id: user.id, answers: { answers }, status: "PENDING_COACH_REVIEW" });
  return { user, submission };
}

test("a pregnant client gets no plan, and none can be published", async () => {
  const { user, submission } = await submissionFor(CODES[0], "01099000101", pregnant());
  const draft = await call(generateDraftFromIntake, { params: { submission_id: submission.id }, user: { id: user.id, role: "COACH" } });
  assert.equal(draft.status, 422, JSON.stringify(draft.body));
  assert.equal(draft.body.code, "OUTSIDE_SERVICE_SCOPE");
  assert.match(draft.body.reasons_ar[0], /الحمل/);
  assert.equal(await Program.count({ where: { user_id: user.id } }), 0, "no plan was created");

  const publish = await call(approveAndPublishIntake, { params: { submission_id: submission.id }, body: {}, user: { id: user.id, role: "COACH" } });
  assert.equal(publish.status, 422);
  assert.equal(publish.body.code, "OUTSIDE_SERVICE_SCOPE");
});

test("a kidney client gets no plan either", async () => {
  const { user, submission } = await submissionFor(CODES[1], "01099000102", kidney());
  const draft = await call(generateDraftFromIntake, { params: { submission_id: submission.id }, user: { id: user.id, role: "COACH" } });
  assert.equal(draft.status, 422, JSON.stringify(draft.body));
  assert.match(draft.body.reasons_ar[0], /الكلى/);
  assert.equal(await Program.count({ where: { user_id: user.id } }), 0);
});

test("an ordinary client still gets her plan", async () => {
  const { user, submission } = await submissionFor(CODES[2], "01099000103", base());
  const draft = await call(generateDraftFromIntake, { params: { submission_id: submission.id }, user: { id: user.id, role: "COACH" } });
  assert.equal(draft.status, 200, JSON.stringify(draft.body).slice(0, 300));
  assert.ok(await Program.count({ where: { user_id: user.id } }) > 0);
});

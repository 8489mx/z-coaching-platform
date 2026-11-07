import test from "node:test";
import assert from "node:assert/strict";

import {
  submitPublicIntake,
  generateDraftFromIntake,
  approveAndPublishIntake,
} from "../src/api/controllers/intake.controller.js";
import { User, Program, IntakeSubmission } from "../src/api/models/index.js";
import { encryptMedicalData } from "../src/utils/crypto.js";
import sequelize from "../src/api/config/database.js";

/**
 * B6-3 — fifth save path (gap #7 follow-up from B5-3): approveAndPublishIntake
 * flips an existing draft to ACTIVE with a plain `program.save()` and no
 * archive call, so if the client already has an ACTIVE program (from an
 * earlier intake) and the coach approves a new draft from a new intake,
 * both rows end up ACTIVE — and two different readers can each pick a
 * different live plan. B5-3 closed the same hole for the four create paths
 * in program.controller.js (gap #7) and for the cycle/editor republish
 * paths (gap #11); this package closes the last publish path the same way:
 * the existing-row status flip is followed by the shared archive helper,
 * exactly as updateCustomProgram's republish path already does.
 *
 * Design note (deviation from the brief's literal instruction, disclosed):
 * the brief says to route the publish through `createProgramRow`, but that
 * helper CREATES a new row — it cannot flip the existing draft row that
 * approveAndPublishIntake already found. Deleting the draft and recreating
 * it would change the program id, lose its version, and break the audit
 * event's program_id. The codebase's own comments prescribe the correct
 * shape for a status flip: createProgramRow's doc says "the existing-row
 * republish path in updateCustomProgram (status flip + save) is not a
 * create, so it keeps its own archive call" — and that is exactly what
 * this package does for approveAndPublishIntake, importing the same
 * `archiveSupersededActivePrograms` helper. Both helpers are module-private
 * today, so the fix adds `export` to the archive helper in
 * program.controller.js (one word; no behaviour change there).
 */
const CLIENT1 = "TEST_B6_APPROVE_961";
const CLIENT2 = "TEST_B6_APPROVE_963";
const CLIENT3 = "TEST_B6_APPROVE_965";
const CLIENT4 = "TEST_B6_APPROVE_967";

// Stored exactly like submitPublicIntake does: { answers: { ...form } }, encrypted.
const storedIntake = () => ({
  _isEncrypted: true,
  data: encryptMedicalData({
    answers: {
      gender: "male", age: "45", height_cm: "175", weight_kg: "82", primary_goal: "fat_loss",
      dangerous_symptoms: ["NONE"],
      medical_conditions: { has_conditions: false, selected: [] },
      cardio: { walkingAbility: "EASY" },
      training_logistics: { days_per_week: 3, experience_level: "beginner" },
    },
  }),
});

// Healthy full form (e2e shape, flags cleared) for the submit -> draft path.
const healthyFormAnswers = () => ({
  health_data_consent: { accepted: true, version: "PDPL-2026-09", accepted_at: "2026-09-01T10:00:00.000Z" },
  gender: "male", age: "34", height_cm: "176", weight_kg: "91",
  circumferences: { neck_cm: "", waist_cm: "99", hips_cm: "", chest_cm: "", arm_cm: "", thigh_cm: "" },
  primary_goal: "general_fitness", neat_level: "sedentary", occupation_type: "DESK_OFFICE",
  dangerous_symptoms: ["NONE"],
  medical_conditions: {
    has_conditions: false, selected: [],
    bariatric: { is_operated: false, meal_capacity_grams: "150_200", dumping_syndrome: false },
    diabetes: { type: "type2", uses_insulin: false, icr_ratio: "", hba1c: "" },
    favism_g6pd: false, renal_hepatic_issue: false, thyroid: "hypo", gi_issues: [],
    female_cases: { is_pcos: false, is_lactating: false, is_postpartum: false },
    hypertension: false, gout: false, cholecystectomy: false, other_notes: "",
  },
  injuries_map: { has_injuries: false, selected_areas: ["none"] },
  smoking_status: "non_smoker", current_meds_supplements_list: [], current_meds_supplements: "",
  religion: "MUSLIM", christianFastingStyle: "PESCATARIAN_ALLOWED",
  strict_allergies: ["none"], other_allergies: "",
  cuisine_preference: "egyptian_traditional", food_budget: "MEDIUM", food_prep_ability: "FULL_KITCHEN",
  meal_structure: { meals_count: "4_to_5_meals", intermittent_fasting: "14_10" },
  cravings_pattern: "controlled", beverage_sugar_intake: "zero_or_sweetener",
  sleep_schedule: { pattern: "regular_night", average_hours: "7_8", bedtime_hour: "00:30" },
  disliked_foods: [], disliked_foods_text: "",
  training_environment: "home_gym",
  training_logistics: { days_per_week: 3, experience_level: "beginner", has_other_sports: false, sports_name: "", hours_per_week: "0" },
  recent_training: "ACTIVE", focus_muscles: [],
  media_uploads: { front_url: "", side_url: "", back_url: "", inbody_report_url: "", medical_reports_urls: [] },
});

function mockRes() {
  const out = { status: 200, body: null };
  const res = { status(c) { out.status = c; return res; }, json(b) { out.body = b; return res; } };
  return { res, out };
}

async function fresh(code, phone) {
  const existing = await User.findOne({ where: { client_code: code } });
  if (existing) {
    await Program.destroy({ where: { user_id: existing.id } }).catch(() => {});
    await IntakeSubmission.destroy({ where: { user_id: existing.id } }).catch(() => {});
    await existing.destroy();
  }
  return User.create({ client_code: code, phone_number: phone, full_name: code, role: "CLIENT" });
}

async function countActive(userId) {
  return Program.count({ where: { user_id: userId, status: "ACTIVE" } });
}

async function approve(submissionId) {
  const r = mockRes();
  await approveAndPublishIntake({ params: { submission_id: submissionId }, body: {} }, r.res);
  return r.out;
}

test.after(async () => {
  await sequelize.close().catch(() => {});
});

test("approving a new draft while an ACTIVE program exists leaves exactly one ACTIVE program — the old one is archived", async () => {
  const client = await fresh(CLIENT1, "01099001081");
  try {
    const submission = await IntakeSubmission.create({ user_id: client.id, answers: storedIntake(), status: "PENDING_COACH_REVIEW" });
    const oldProgram = await Program.create({ user_id: client.id, program_data: { cycle_number: 1, nutrition: {} }, status: "ACTIVE" });
    const draft = await Program.create({ user_id: client.id, program_data: { cycle_number: 2, nutrition: {} }, status: "DRAFT" });

    const out = await approve(submission.id);
    assert.equal(out.status, 200, JSON.stringify(out.body));
    assert.equal(out.body.program.id, draft.id, "the approved draft is the published program");

    assert.equal(await countActive(client.id), 1, "exactly one ACTIVE program per client");
    const oldAfter = await Program.findByPk(oldProgram.id);
    assert.equal(oldAfter.status, "ARCHIVED", "the superseded program is archived, not left ACTIVE");
    const draftAfter = await Program.findByPk(draft.id);
    assert.equal(draftAfter.status, "ACTIVE", "the approved draft is the ACTIVE one");
    const submissionAfter = await IntakeSubmission.findByPk(submission.id);
    assert.equal(submissionAfter.status, "APPROVED", "the submission is marked APPROVED");
  } finally {
    await Program.destroy({ where: { user_id: client.id } }).catch(() => {});
    await IntakeSubmission.destroy({ where: { user_id: client.id } }).catch(() => {});
    await client.destroy().catch(() => {});
  }
});

test("approving a draft with no ACTIVE program works", async () => {
  const client = await fresh(CLIENT2, "01099001083");
  try {
    const submission = await IntakeSubmission.create({ user_id: client.id, answers: storedIntake(), status: "PENDING_COACH_REVIEW" });
    const draft = await Program.create({ user_id: client.id, program_data: { cycle_number: 1, nutrition: {} }, status: "DRAFT" });

    const out = await approve(submission.id);
    assert.equal(out.status, 200, JSON.stringify(out.body));
    assert.equal(await countActive(client.id), 1, "the approved draft is the single ACTIVE program");
    const draftAfter = await Program.findByPk(draft.id);
    assert.equal(draftAfter.status, "ACTIVE");
  } finally {
    await Program.destroy({ where: { user_id: client.id } }).catch(() => {});
    await IntakeSubmission.destroy({ where: { user_id: client.id } }).catch(() => {});
    await client.destroy().catch(() => {});
  }
});

test("re-publishing the already-ACTIVE latest program leaves exactly one ACTIVE program", async () => {
  const client = await fresh(CLIENT3, "01099000965");
  try {
    const submission = await IntakeSubmission.create({ user_id: client.id, answers: storedIntake(), status: "PENDING_COACH_REVIEW" });
    const live = await Program.create({ user_id: client.id, program_data: { cycle_number: 1, nutrition: {} }, status: "ACTIVE" });

    const out = await approve(submission.id);
    assert.equal(out.status, 200, JSON.stringify(out.body));
    assert.equal(await countActive(client.id), 1, "re-publishing archives nothing of its own");
    const liveAfter = await Program.findByPk(live.id);
    assert.equal(liveAfter.status, "ACTIVE", "the same row stays ACTIVE");
  } finally {
    await Program.destroy({ where: { user_id: client.id } }).catch(() => {});
    await IntakeSubmission.destroy({ where: { user_id: client.id } }).catch(() => {});
    await client.destroy().catch(() => {});
  }
});

test("the old ACTIVE row is archived in place — same id and program_data, only the status changes", async () => {
  const client = await fresh(CLIENT4, "01099000967");
  try {
    const submission = await IntakeSubmission.create({ user_id: client.id, answers: storedIntake(), status: "PENDING_COACH_REVIEW" });
    const oldData = { cycle_number: 1, nutrition: { targets: { calories: 2400 } }, marker: "keep-me" };
    const oldProgram = await Program.create({ user_id: client.id, program_data: oldData, status: "ACTIVE" });
    await Program.create({ user_id: client.id, program_data: { cycle_number: 2, nutrition: {} }, status: "DRAFT" });

    const out = await approve(submission.id);
    assert.equal(out.status, 200, JSON.stringify(out.body));

    const oldAfter = await Program.findByPk(oldProgram.id);
    assert.equal(oldAfter.status, "ARCHIVED");
    assert.equal(oldAfter.program_data.marker, "keep-me", "the archived row keeps its data — it is archived, not deleted and recreated");
    assert.equal(oldAfter.program_data.nutrition.targets.calories, 2400);
  } finally {
    await Program.destroy({ where: { user_id: client.id } }).catch(() => {});
    await IntakeSubmission.destroy({ where: { user_id: client.id } }).catch(() => {});
    await client.destroy().catch(() => {});
  }
});

test("generating a new draft while an ACTIVE program exists leaves the ACTIVE program untouched", async () => {
  const client = await fresh("TEST_B6_APPROVE_969", "01099000969");
  try {
    const oldProgram = await Program.create({ user_id: client.id, program_data: { cycle_number: 1, nutrition: {} }, status: "ACTIVE" });

    const submit = mockRes();
    await submitPublicIntake({ body: { client_code: "TEST_B6_APPROVE_969", phone_number: "01099000969", answers: healthyFormAnswers() } }, submit.res);
    assert.equal(submit.out.status, 201, JSON.stringify(submit.out.body));

    const draft = mockRes();
    await generateDraftFromIntake({ params: { submission_id: submit.out.body.submission_id } }, draft.res);
    assert.equal(draft.out.status, 200, JSON.stringify(draft.out.body));

    const created = await Program.findByPk(draft.out.body.program_id);
    assert.equal(created.status, "DRAFT", "draft generation never publishes");
    assert.equal(await countActive(client.id), 1, "the old ACTIVE program is still the only ACTIVE one");
    const oldAfter = await Program.findByPk(oldProgram.id);
    assert.equal(oldAfter.status, "ACTIVE", "the old program is untouched by draft generation");
  } finally {
    await Program.destroy({ where: { user_id: client.id } }).catch(() => {});
    await IntakeSubmission.destroy({ where: { user_id: client.id } }).catch(() => {});
    await client.destroy().catch(() => {});
  }
});

import test from "node:test";
import assert from "node:assert/strict";

import { submitPublicIntake, generateDraftFromIntake, approveAndPublishIntake } from "../src/api/controllers/intake.controller.js";
import { getActiveProgramByUserId, resolveClientBedtimeHour, resolveClientPrimaryGoal } from "../src/api/controllers/program.controller.js";
import { User, IntakeSubmission, Program } from "../src/api/models/index.js";
import sequelize from "../src/api/config/database.js";

// Exact request body sent by frontend/src/pages/FullIntakeForm.jsx on submit.
const CODE = "TEST_E2E_906";
const PHONE = "01099000906";
const formAnswers = () => ({
  gender: "male", age: "34", height_cm: "176", weight_kg: "91",
  circumferences: { neck_cm: "", waist_cm: "99", hips_cm: "", chest_cm: "", arm_cm: "", thigh_cm: "" },
  primary_goal: "general_fitness", neat_level: "sedentary", occupation_type: "DESK_OFFICE",
  dangerous_symptoms: ["NONE"],
  medical_conditions: {
    has_conditions: true, selected: ["favism_g6pd"],
    bariatric: { is_operated: false, meal_capacity_grams: "150_200", dumping_syndrome: false },
    diabetes: { type: "type2", uses_insulin: false, icr_ratio: "", hba1c: "" },
    favism_g6pd: false, renal_hepatic_issue: false, thyroid: "hypo", gi_issues: [],
    female_cases: { is_pcos: false, is_lactating: false, is_postpartum: false },
    hypertension: false, gout: false, cholecystectomy: false, other_notes: "",
  },
  injuries_map: { has_injuries: true, selected_areas: ["knee"], knee: [], spine_back: [], shoulder: [], core: [], other_joints: [], injury_nature: "chronic", pain_relieved_by_rest: true },
  smoking_status: "non_smoker", current_meds_supplements_list: [], current_meds_supplements: "",
  religion: "MUSLIM", christianFastingStyle: "PESCATARIAN_ALLOWED",
  strict_allergies: ["gluten_celiac"], other_allergies: "",
  cuisine_preference: "egyptian_traditional", food_budget: "MEDIUM", food_prep_ability: "FULL_KITCHEN",
  meal_structure: { meals_count: "4_to_5_meals", intermittent_fasting: "14_10" },
  cravings_pattern: "controlled", beverage_sugar_intake: "zero_or_sweetener",
  sleep_schedule: { pattern: "regular_night", average_hours: "7_8", bedtime_hour: "00:30" },
  disliked_foods: [], disliked_foods_text: "",
  training_environment: "home_gym",
  training_logistics: { days_per_week: 3, experience_level: "beginner", has_other_sports: true, sports_name: "football_padel", hours_per_week: "4" },
  recent_training: "ACTIVE", focus_muscles: [],
  media_uploads: { front_url: "", side_url: "", back_url: "", inbody_report_url: "", medical_reports_urls: [] },
});

function mockRes() {
  const out = { status: 200, body: null };
  const res = {
    status(code) { out.status = code; return res; },
    json(body) { out.body = body; return res; },
  };
  return { res, out };
}

async function cleanup() {
  const user = await User.findOne({ where: { client_code: CODE } });
  if (!user) return;
  await Program.destroy({ where: { user_id: user.id } }).catch(() => {});
  await IntakeSubmission.destroy({ where: { user_id: user.id } }).catch(() => {});
  await user.destroy().catch(() => {});
}

test("real form submit -> draft -> approve -> active program carries every linked answer", async (t) => {
  await cleanup();
  await User.create({ client_code: CODE, phone_number: PHONE, full_name: "E2E Test", role: "CLIENT" });

  try {
    const submit = mockRes();
    await submitPublicIntake({ body: { client_code: CODE, phone_number: PHONE, answers: formAnswers() } }, submit.res);
    assert.equal(submit.out.status < 300, true, `submit failed: ${JSON.stringify(submit.out.body)}`);

    const user = await User.findOne({ where: { client_code: CODE } });
    const submission = await IntakeSubmission.findOne({ where: { user_id: user.id }, order: [["id", "DESC"]] });

    const draft = mockRes();
    await generateDraftFromIntake({ params: { submission_id: submission.id } }, draft.res);
    assert.equal(draft.out.status, 200, `draft failed: ${JSON.stringify(draft.out.body)}`);
    const program = draft.out.body.master_program;

    await t.test("goal, home equipment, meal count, fasting protocol and injury reach the engines", () => {
      const targets = program.nutrition_program.targets;
      assert.equal(program.intake_decision.plan_status === "BLOCKED", false);
      assert.equal(targets.meals_count, 4);
      assert.equal(targets.diet_framework, "INTERMITTENT_FASTING");
      assert.equal(targets.fasting_window.fasting_hours, 14);
      const codes = program.training.weeks[0].sessions.flatMap((s) => s.exercises.map((e) => e.exercise_code));
      assert.ok(codes.length > 0);
      assert.ok(!codes.some((c) => /^BARBELL_|MACHINE|CABLE/.test(c)), `home trainee got gym equipment: ${codes.join(", ")}`);
      assert.ok(!codes.some((c) => /LUNGE|SPLIT_SQUAT|BACK_SQUAT/.test(c)), `knee injury got ${codes.join(", ")}`);
    });

    await t.test("meals never contain legumes for the favism client", () => {
      const foods = program.nutrition.meals.flatMap((m) => m.items.flatMap((it) => [it.food_code, ...(it.swaps || []).map((s) => s.food_code || s.code || s.id)]));
      assert.deepEqual(foods.filter((c) => /FAVA|FUL|BEAN|LENTIL|CHICKPEA|LEGUM/i.test(String(c))), []);
    });

    const approve = mockRes();
    await approveAndPublishIntake({ params: { submission_id: submission.id }, body: {} }, approve.res);
    assert.equal(approve.out.status, 200);

    await t.test("active program returns the client-app clinical constraints, bedtime and goal", async () => {
      const active = mockRes();
      await getActiveProgramByUserId({ params: { user_id: CODE }, user: { id: user.id } }, active.res);
      assert.equal(active.out.status, 200, JSON.stringify(active.out.body));
      assert.equal(active.out.body.has_program, true);
      assert.equal(active.out.body.clinical_constraints.is_g6pd, true);
      assert.equal(active.out.body.clinical_constraints.is_celiac, true);
      assert.equal(active.out.body.lifestyle.bedtime_hour, "00:30");
      assert.equal(await resolveClientBedtimeHour(user.id), "00:30");
      assert.equal(await resolveClientPrimaryGoal(user.id), "GENERAL_HEALTH");
    });
  } finally {
    await cleanup();
    await sequelize.close().catch(() => {});
  }
});

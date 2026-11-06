// H4: a withheld engine object must not contain a servable complete plan.
// Before this package, every withheld object leaked a full nutrition plan
// (culinary meals + targets + quantized plan) and — except minors — a full
// 5-week training program, while only cardio was withheld. Minors leaked
// full adult nutrition. T1D clients carried the wrong (liver/stomach)
// flag message, duplicated, and the merge engine rewrote withheld targets
// (kidney 2105 -> 2631) while the status stayed WITHHELD.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { adaptIntakePayloadToCanonicalEngine } from "../src/intake-decision-engine/adapters/intake-adapter.js";
import { evaluateIntake } from "../src/intake-decision-engine/index.js";
import { mergeAdaptedPlanIntoProgram } from "../src/api/utils/planMergeEngine.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const catalog = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "data", "catalogs", "core-global-food-batch-v1.json"), "utf8")
);

const evaluationContext = Object.freeze({
  system_time: "2026-10-21T00:00:00.000Z",
  assessmentDate: "2026-10-21",
});

// Flat intake shape, as used by the longitudinal harness builder.
function flatIntake(overrides = {}) {
  return {
    gender: "male",
    age: "30",
    height_cm: "178",
    weight_kg: "80",
    primary_goal: "fat_loss",
    neat_level: "MODERATE",
    occupation_type: "DESK_OFFICE",
    dangerous_symptoms: ["NONE"],
    medical_conditions: { has_conditions: false, selected: [] },
    injuries_map: { has_injuries: false, selected_areas: [] },
    religion: "MUSLIM",
    strict_allergies: [],
    meal_structure: { meals_count: 4, intermittent_fasting: "NONE" },
    training_environment: "commercial_gym",
    training_logistics: { days_per_week: 3, experience_level: "beginner" },
    recent_training: "ACTIVE",
    cardio: { walkingAbility: "GOOD", averageDailySteps: 7000, maxSessionsPerWeek: 2, maxDurationMinutes: 30 },
    sleep_hours: 7,
    sleep_schedule: { pattern: "REGULAR", average_hours: 7 },
    ...overrides,
  };
}

function build(rawIntake) {
  const canonical = adaptIntakePayloadToCanonicalEngine(rawIntake);
  const decision = evaluateIntake(canonical, evaluationContext);
  const master = buildMasterEngineV2({
    intake: canonical,
    evaluationContext,
    nutritionFoodCatalog: catalog,
  });
  return { canonical, decision, master };
}

function flagsOf(master, code) {
  return (master.intake_decision?.review_flags || []).filter((f) => f.code === code);
}

function assertNoServableNutrition(master, label) {
  const np = master.nutrition_program;
  assert.equal(np.status, "WITHHELD", `${label}: nutrition status must stay WITHHELD`);
  assert.equal(np.withheld, true, `${label}: nutrition must carry withheld: true`);
  assert.ok(!np.culinary_meals || np.culinary_meals.length === 0, `${label}: no culinary meals may leak`);
  assert.ok(!np.quantized_plan, `${label}: no quantized plan may leak`);
  assert.equal(np.macro_targets, undefined, `${label}: no headline macro targets may leak`);
  assert.equal(np.targets?.calories_kcal, undefined, `${label}: no calorie number may leak`);
  assert.equal(np.targets?.target_calories_kcal, undefined, `${label}: no target-calorie number may leak`);
  assert.equal(np.targets?.protein_g, undefined, `${label}: no protein number may leak`);
  assert.equal(np.targets?.carbohydrate_g, undefined, `${label}: no carb number may leak`);
  assert.equal(np.targets?.fat_g, undefined, `${label}: no fat number may leak`);
  assert.equal(np.stages?.energy_target?.target_calories_kcal, undefined, `${label}: no stage calorie number may leak`);
  assert.equal(np.stages?.portion_solver, undefined, `${label}: no portion-solver meals may leak`);
  // The withheld-stage signal the check-in auto-apply gate reads must survive.
  assert.equal(np.stages?.energy_target?.status, "WITHHELD", `${label}: energy stage stays WITHHELD`);
  assert.equal(np.stages?.macro_targets?.status, "WITHHELD", `${label}: macro stage stays WITHHELD`);
  assert.equal(np.culinary_preflight, undefined, `${label}: no culinary preflight may leak`);
}

function assertNoServableTraining(master, label) {
  const tp = master.training_program;
  assert.equal(tp.status, "WITHHELD", `${label}: training status must be WITHHELD`);
  assert.equal(tp.withheld, true, `${label}: training must carry withheld: true`);
  assert.ok(!tp.weeks || tp.weeks.length === 0, `${label}: no training weeks may leak`);
  assert.equal(tp.total_weeks, 0, `${label}: total weeks must be 0`);
}

function assertWithheldShape(master, label) {
  assertNoServableNutrition(master, label);
  assertNoServableTraining(master, label);
  // Circadian timing carries per-meal macro targets — it must be held too.
  assert.deepEqual(master.circadian_timing?.timeline, [], `${label}: no circadian timeline may leak`);
  assert.equal(master.circadian_timing?.status, "HELD_FOR_COACH_REVIEW", `${label}: circadian timing stays held`);
  // The review reason itself must survive: flags, reasons, client profile.
  assert.ok((master.intake_decision?.review_flags || []).length > 0, `${label}: review flags must survive`);
  assert.ok(master.client_profile, `${label}: client profile must survive`);
}

test("H4: T1D adult — withheld object carries no servable plan, correct diabetes flag once", () => {
  const { decision, master } = build(flatIntake({
    gender: "female",
    age: "28",
    height_cm: "170",
    weight_kg: "72",
    medical_conditions: { has_conditions: true, selected: ["TYPE_1_DIABETES"] },
    current_meds_supplements_list: ["INSULIN"],
    training_logistics: { days_per_week: 4, experience_level: "intermediate" },
  }));
  assert.equal(decision.plan_status, "MEDICAL_REVIEW_REQUIRED");
  assert.equal(master.intake_decision.plan_status, "MEDICAL_REVIEW_REQUIRED");
  assertWithheldShape(master, "T1D adult");
  // The diabetes flag is the client's own, exactly once — never the
  // liver/stomach message, never duplicated.
  assert.equal(flagsOf(master, "INSULIN_SAFETY_REVIEW_REQUIRED").length, 1, "insulin flag exactly once");
  assert.equal(flagsOf(master, "ORGAN_CONDITION_REQUIRES_MEDICAL_REVIEW").length, 0, "no organ flag for a diabetes client");
  assert.ok(
    !(master.intake_decision.review_flags || []).some((f) => (f.message || "").includes("Liver disease or a stomach that has been operated on")),
    "no diabetes client may see the liver/stomach message"
  );
  // Safety metadata the coach needs survives: the hypoglycemia guard.
  assert.equal(master.nutrition_program.targets?.clinical_guardrails?.hypoglycemia_guard_active, true);
  assert.equal(master.hypoglycemia_guard?.active, true);
});

test("H4: kidney adult — withheld object carries no servable plan", () => {
  const { decision, master } = build(flatIntake({
    gender: "male",
    age: "45",
    height_cm: "175",
    weight_kg: "88",
    medical_conditions: { has_conditions: true, selected: ["KIDNEY_CONDITION"] },
  }));
  assert.equal(decision.plan_status, "MEDICAL_REVIEW_REQUIRED");
  assertWithheldShape(master, "kidney adult");
  assert.equal(flagsOf(master, "KIDNEY_REQUIRES_MEDICAL_REVIEW").length, 1);
});

test("H4: heart adult — withheld object carries no servable plan", () => {
  const { decision, master } = build(flatIntake({
    gender: "male",
    age: "55",
    height_cm: "176",
    weight_kg: "92",
    medical_conditions: { has_conditions: true, selected: ["HEART_CONDITION"] },
  }));
  assert.equal(decision.plan_status, "MEDICAL_REVIEW_REQUIRED");
  assertWithheldShape(master, "heart adult");
  assert.equal(flagsOf(master, "HEART_CLEARANCE_MUST_BE_SEEN").length, 1);
});

test("H4: pregnancy — withheld object carries no servable plan", () => {
  const { decision, master } = build(flatIntake({
    gender: "female",
    age: "30",
    height_cm: "165",
    weight_kg: "68",
    primary_goal: "weight_maintenance",
    female_pregnancy: "PREGNANT",
    training_logistics: { days_per_week: 2, experience_level: "beginner" },
  }));
  assert.equal(decision.plan_status, "MEDICAL_REVIEW_REQUIRED");
  assertWithheldShape(master, "pregnancy");
});

test("H4: minor 14 — blocked object carries no adult nutrition at all", () => {
  const { decision, master } = build(flatIntake({
    gender: "female",
    age: "14",
    date_of_birth: "2012-06-15",
    height_cm: "160",
    weight_kg: "55",
    primary_goal: "muscle_gain",
  }));
  assert.equal(decision.plan_status, "BLOCKED");
  assertWithheldShape(master, "minor 14");
  // Minors leak no nutrition numbers at all — not even guardrail figures.
  assert.equal(master.nutrition_program.targets, undefined, "minors carry no nutrition targets object");
});

test("H4: bariatric adult — withheld object carries no servable plan and no fabricated day total", () => {
  const { decision, master } = build(flatIntake({
    gender: "female",
    age: "42",
    height_cm: "164",
    weight_kg: "95",
    medical_conditions: { has_conditions: true, selected: ["BARIATRIC_SURGERY"] },
  }));
  assert.equal(decision.plan_status, "MEDICAL_REVIEW_REQUIRED");
  assertWithheldShape(master, "bariatric adult");
  // No meals at all, so no day total can be fabricated (before: 1458 vs 1925 target).
  const organ = flagsOf(master, "ORGAN_CONDITION_REQUIRES_MEDICAL_REVIEW");
  assert.equal(organ.length, 1, "bariatric flag exactly once");
  assert.ok((organ[0].message || "").includes("operated on"), "bariatric message names the operated stomach");
  assert.ok(!(organ[0].message || "").includes("Liver disease"), "bariatric message never mentions liver disease");
});

test("H4: liver adult — organ flag carries the liver message, not the stomach message", () => {
  const { decision, master } = build(flatIntake({
    gender: "male",
    age: "50",
    height_cm: "175",
    weight_kg: "85",
    medical_conditions: { has_conditions: true, selected: ["LIVER_CONDITION"] },
  }));
  assert.equal(decision.plan_status, "MEDICAL_REVIEW_REQUIRED");
  assertWithheldShape(master, "liver adult");
  const organ = flagsOf(master, "ORGAN_CONDITION_REQUIRES_MEDICAL_REVIEW");
  assert.equal(organ.length, 1, "liver flag exactly once");
  assert.ok((organ[0].message || "").includes("Liver"), "liver message names liver disease");
  assert.ok(!(organ[0].message || "").includes("stomach"), "liver message never mentions the stomach");
});

test("H4: insulin in medications only — the insulin flag still fires exactly once", () => {
  const { decision, master } = build(flatIntake({
    gender: "female",
    age: "35",
    height_cm: "165",
    weight_kg: "72",
    medical_conditions: { has_conditions: false, selected: [] },
    current_meds_supplements_list: ["Lantus 20 IU", "Metformin 500mg"],
  }));
  assert.equal(decision.plan_status, "MEDICAL_REVIEW_REQUIRED");
  assertWithheldShape(master, "insulin via meds");
  assert.equal(flagsOf(master, "INSULIN_SAFETY_REVIEW_REQUIRED").length, 1, "medication-scan insulin flag exactly once");
});

test("H4: merge engine refuses a withheld program and leaves its targets untouched", () => {
  const { master } = build(flatIntake({
    gender: "male",
    age: "45",
    height_cm: "175",
    weight_kg: "88",
    medical_conditions: { has_conditions: true, selected: ["KIDNEY_CONDITION"] },
  }));
  assert.equal(master.intake_decision.plan_status, "MEDICAL_REVIEW_REQUIRED");
  const before = JSON.stringify(master);
  assert.throws(
    () => mergeAdaptedPlanIntoProgram(master, { suggested_calorie_delta: 526 }),
    (err) => err?.code === "PROGRAM_WITHHELD",
    "merging into a withheld program must throw PROGRAM_WITHHELD"
  );
  assert.equal(JSON.stringify(master), before, "the refused merge must not touch the input program");
});

test("H4: a servable first plan is NOT stripped (no regression on the normal path)", () => {
  const { decision, master } = build(flatIntake({
    gender: "male",
    age: "30",
    height_cm: "178",
    weight_kg: "80",
  }));
  assert.ok(
    decision.plan_status === "READY_FOR_DRAFT" || decision.plan_status === "COACH_REVIEW_REQUIRED",
    `healthy first plan stays servable, got ${decision.plan_status}`
  );
  assert.ok((master.nutrition_program?.culinary_meals || []).length > 0, "healthy plan keeps its meals");
  assert.ok((master.training_program?.weeks || []).length > 0, "healthy plan keeps its training weeks");
  assert.ok((master.circadian_timing?.timeline || []).length > 0, "healthy plan keeps its circadian timeline");
});

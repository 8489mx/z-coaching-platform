import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { EXERCISE_CATALOG_V2, getExerciseV2ByCode } from "../src/exercise-catalog-v2/index.js";

/**
 * R1 RE-HUNT: the two HIGH bugs the final verification filed (2026-11-06).
 * HO-1: home-bodyweight plans ship empty held slots (C06 4/week, C15 3/week)
 * and C06's decision is READY_FOR_DRAFT with zero flags, so the gap is silent.
 * HO-2: X14's lunch and dinner carry no protein food at all (day 63 g vs 80 g).
 * Fail-first: every assertion below failed on the D1 base (2026-11-06).
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"));
const CTX = Object.freeze({ system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" });

const PROFILES = {
  C06: { sex: "male", age: 22, height_cm: 175, weight_kg: 78, waist_cm: 80, goal: "muscle_gain", neat_level: "moderate", experience: "BEGINNER", days_per_week: 3, training_environment: "home_bodyweight", injuries: [], medical: [], meds: [], allergies: [], disliked_foods: [], intolerances: ["LACTOSE"], meals_count: "4_meals", fasting: "none", sleep_hours: 8, sleep_pattern: "regular_night", steps: 8000, walking: "EASY" },
  C15: { sex: "female", age: 23, height_cm: 158, weight_kg: 55, waist_cm: null, goal: "fat_loss", neat_level: "moderate", experience: "BEGINNER", days_per_week: 2, training_environment: "home_bodyweight", injuries: [], medical: [], meds: [], allergies: [], disliked_foods: [], intolerances: [], meals_count: "3_meals_snack", fasting: "none", sleep_hours: 5, sleep_pattern: "irregular", steps: 7500, walking: "EASY" },
  X14: { sex: "female", age: 30, height_cm: 165, weight_kg: 40, waist_cm: 58, goal: "fat_loss", neat_level: "moderate", experience: "beginner", days_per_week: 3, training_environment: "commercial_gym", injuries: [], medical: [], meds: [], allergies: [], disliked_foods: [], intolerances: [], meals_count: "4_meals", fasting: "none", sleep_hours: 7.5, sleep_pattern: "regular_night", steps: 8000, walking: "EASY" },
  C14: { sex: "male", age: 44, height_cm: 180, weight_kg: 98, waist_cm: 100, goal: "fat_loss", neat_level: "light", experience: "BEGINNER", days_per_week: 3, training_environment: "commercial_gym", injuries: [], medical: [], meds: [], allergies: [], disliked_foods: [], intolerances: [], meals_count: "3_meals", fasting: "16_8", sleep_hours: 6, sleep_pattern: "night_shift", steps: 6500, walking: "EASY" },
};

function flatIntake(p) {
  const intake = {
    gender: p.sex, age: String(p.age), height_cm: String(p.height_cm),
    weight_kg: String(p.weight_kg),
    ...(p.waist_cm ? { waist_cm: String(p.waist_cm) } : {}),
    primary_goal: p.goal, neat_level: p.neat_level, occupation_type: "DESK_OFFICE",
    dangerous_symptoms: ["NONE"],
    medical_conditions: { has_conditions: p.medical.length > 0, selected: p.medical },
    injuries_map: {
      has_injuries: p.injuries.length > 0,
      selected_areas: p.injuries.map((i) => i.area),
      ...(p.injuries[0]?.pain_level != null ? { pain_level: p.injuries[0].pain_level } : {}),
    },
    ...(p.injuries[0]?.severity ? { injury_severity: p.injuries[0].severity } : {}),
    religion: "MUSLIM",
    strict_allergies: p.allergies,
    ...(p.disliked_foods.length ? { disliked_foods: p.disliked_foods } : {}),
    meal_structure: { meals_count: p.meals_count, intermittent_fasting: p.fasting },
    training_environment: p.training_environment,
    training_logistics: { days_per_week: p.days_per_week, experience_level: p.experience },
    recent_training: "ACTIVE",
    cardio: { walkingAbility: p.walking, averageDailySteps: p.steps, maxSessionsPerWeek: 2, maxDurationMinutes: 30 },
    sleep_hours: p.sleep_hours,
    sleep_schedule: { pattern: p.sleep_pattern, average_hours: p.sleep_hours },
    ...(p.meds.length ? { current_meds_supplements_list: p.meds } : {}),
  };
  if (p.intolerances.length) {
    intake.nutrition = { preferredMealCount: 4, allergies: [], excludedFoodsList: [], dislikedFoods: [], intolerances: [{ substance: "LACTOSE", severity: "MODERATE", medicallyDiagnosed: true }], digestiveIssues: [], budget: "MEDIUM", foodStorageAvailable: true, foodReheatingAvailable: true };
  }
  return intake;
}

function build(id) {
  return buildMasterEngineV2({
    intake: flatIntake(PROFILES[id]),
    evaluationContext: CTX,
    nutritionFoodCatalog: CATALOG,
    options: {},
  });
}

function heldSlotsPerWeek(program) {
  const perWeek = {};
  for (const w of program.training_program?.weeks || []) {
    let count = 0;
    for (const s of w.sessions || []) {
      for (const e of s.exercises || []) {
        if (String(e.exercise_code || "").startsWith("HELD_SLOT")) count += 1;
      }
    }
    perWeek[w.week_number] = count;
  }
  return perWeek;
}

function decisionFlagCodes(program) {
  return (program.intake_decision?.review_flags || []).map((f) => (typeof f === "string" ? f : f.code || f.type));
}

function culinaryMeals(program) {
  return program.nutrition_program?.culinary_meals || [];
}

test("R1 HO-1: the catalog has a second bodyweight hip-extension exercise", () => {
  const ex = getExerciseV2ByCode("SINGLE_LEG_GLUTE_BRIDGE");
  assert.ok(ex, "SINGLE_LEG_GLUTE_BRIDGE must exist in the V2 catalog");
  assert.equal(ex.slot_code, "HIP_EXTENSION");
  assert.deepEqual(ex.equipment_requirements.map((r) => r.equipment_code), ["BODYWEIGHT"]);
  assert.equal(ex.primary_muscle, "GLUTES");
  assert.ok(EXERCISE_CATALOG_V2.exercises.some((e) => e.exercise_code === "SINGLE_LEG_GLUTE_BRIDGE"));
});

test("R1 HO-1: C06 hip-extension slot is filled with real bodyweight work, not held", () => {
  const program = build("C06");
  const week1B = program.training_program.weeks[0].sessions.find((s) => s.session_code === "FULL_BODY_B");
  const hipExt = week1B.exercises.find((e) => e.slot_code === "HIP_EXTENSION");
  assert.ok(hipExt, "FULL_BODY_B must still carry a HIP_EXTENSION slot");
  assert.equal(hipExt.exercise_code, "SINGLE_LEG_GLUTE_BRIDGE", `hip-extension slot must be the single-leg glute bridge, got ${hipExt.exercise_code}`);
  assert.equal(hipExt.sets, 2, "the substitute carries a real dose, not a held null");
  // No Nordic and no machine exercise may come back with the substitute.
  const all = program.training_program.weeks.flatMap((w) => w.sessions.flatMap((s) => s.exercises));
  assert.equal(all.filter((e) => e.exercise_code === "NORDIC_HAMSTRING_CURL").length, 0);
  assert.equal(all.filter((e) => e.exercise_code === "GLUTE_BIASED_45_HYPEREXTENSION").length, 0);
});

test("R1 HO-1: held slots drop — C06 4 to 3 per week, C15 3 to 2 per week", () => {
  for (const [id, expected] of [["C06", 3], ["C15", 2]]) {
    const program = build(id);
    const perWeek = heldSlotsPerWeek(program);
    for (const [week, count] of Object.entries(perWeek)) {
      assert.equal(count, expected, `${id} week ${week}: expected ${expected} held slots, got ${count}`);
    }
    const remaining = program.training_program.weeks.flatMap((w) => w.sessions.flatMap((s) => s.exercises))
      .filter((e) => String(e.exercise_code || "").startsWith("HELD_SLOT"))
      .map((e) => e.slot_code);
    assert.ok(remaining.every((slot) => slot === "SHOULDER_ABDUCTION" || slot === "ELBOW_FLEXION"),
      `${id}: only slots with no bodyweight substitute in the catalog may stay held, got ${JSON.stringify(remaining)}`);
  }
});

test("R1 HO-1: a held slot is never silent — the decision flags it and is not READY", () => {
  const c06 = build("C06");
  assert.ok(decisionFlagCodes(c06).includes("EQUIPMENT_SLOT_HELD_FOR_REVIEW"),
    `C06 decision must flag the held slots, got: ${JSON.stringify(decisionFlagCodes(c06))}`);
  assert.equal(c06.intake_decision.plan_status, "COACH_REVIEW_REQUIRED", "a plan with held slots is not READY_FOR_DRAFT");
  const c15 = build("C15");
  assert.ok(decisionFlagCodes(c15).includes("EQUIPMENT_SLOT_HELD_FOR_REVIEW"),
    `C15 decision must flag the held slots, got: ${JSON.stringify(decisionFlagCodes(c15))}`);
  assert.equal(c15.intake_decision.plan_status, "COACH_REVIEW_REQUIRED");
  // The flag names the held slots, one per slot.
  const c06Slots = c06.intake_decision.review_flags
    .filter((f) => f.code === "EQUIPMENT_SLOT_HELD_FOR_REVIEW")
    .map((f) => f.message);
  assert.equal(c06Slots.length, 2, `one decision flag per held slot, got ${JSON.stringify(c06Slots)}`);
  assert.ok(c06Slots.some((m) => m.includes("SHOULDER_ABDUCTION")));
  assert.ok(c06Slots.some((m) => m.includes("ELBOW_FLEXION")));
});

test("R1 HO-1 guard: a client with no held slots keeps a clean READY decision", () => {
  const program = build("C14");
  assert.equal(program.intake_decision.plan_status, "READY_FOR_DRAFT", "C14 is the READY proof and must stay READY");
  assert.deepEqual(decisionFlagCodes(program), [], "no held-slot flag may leak onto a client with no held slots");
});

test("R1 HO-2: X14 lunch and dinner each carry a protein food", () => {
  const program = build("X14");
  const meals = culinaryMeals(program);
  for (const n of [2, 3]) {
    const meal = meals.find((m) => m.meal_number === n);
    assert.ok(meal, `meal ${n} must exist`);
    const protein = (meal.items || []).filter((i) => String(i.category || "").toUpperCase() === "PROTEIN");
    assert.ok(protein.length > 0, `meal ${n} must carry a protein food, got: ${JSON.stringify((meal.items || []).map((i) => i.food_code))}`);
    // The fallback sizes the rescue to the protein remainder, so a small
    // remainder legitimately yields a small-but-real portion (meal 3 needs
    // only ~6 g and gets 27 g of beef); a token is a few grams, never 20+.
    assert.ok(protein.every((i) => Number(i.portion_g) >= 20), `a rescue protein is a real portion, not a token: ${JSON.stringify(protein.map((i) => [i.food_code, i.portion_g]))}`);
    assert.ok(Math.abs(Number(meal.actual_macros?.protein_g || 0) - Number(meal.target_macros?.protein_g || 0)) <= 3,
      `meal ${n} protein ${meal.actual_macros?.protein_g} g must land within 3 g of its ${meal.target_macros?.protein_g} g target`);
  }
});

test("R1 HO-2: X14 day protein lands within tolerance of its 80 g target", () => {
  const program = build("X14");
  const meals = culinaryMeals(program);
  const dayProtein = meals.reduce((s, m) => s + (Number(m.actual_macros?.protein_g) || 0), 0);
  const target = Number(program.nutrition_program?.targets?.protein_g) || 80;
  assert.ok(Math.abs(dayProtein - target) <= 8, `day protein ${dayProtein} g must be within 8 g of the ${target} g target`);
  const issues = (program.nutrition_program?.culinary_preflight?.issues || [])
    .concat(...meals.map((m) => m.culinary_issues || []));
  assert.ok(!issues.some((i) => String(i.code || i).includes("MISSING_PROTEIN")),
    `no meal may be flagged missing protein: ${JSON.stringify(issues)}`);
  // The day total still reconciles to its calorie target after the rescue.
  const dayKcal = meals.reduce((s, m) => s + (Number(m.actual_macros?.calories_kcal) || 0), 0);
  const kcalTarget = Number(program.nutrition_program?.targets?.target_calories) || 0;
  assert.ok(Math.abs(dayKcal - kcalTarget) <= 30, `day calories ${dayKcal} must stay within 30 kcal of ${kcalTarget} after the rescue`);
});

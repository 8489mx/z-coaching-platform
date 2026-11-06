import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";

/**
 * H8 rejected-plans sweep: the 10 day-0 plans a real coach would NOT hand
 * over (hands-on engine test, 2026-11-05, worker A), plus the systemic
 * faults found across all 44 plans. Each test names the fault it pins.
 * Fail-first: every assertion below failed on the H7 base (2026-11-06).
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"));
const CTX = Object.freeze({ system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" });

// Profiles: the longitudinal/matrix profiles, verbatim fields the intake
// builder reads (de-identified test clients, no real people).
const PROFILES = {
  C03: { sex: "female", age: 31, height_cm: 160, weight_kg: 82, waist_cm: 92, goal: "fat_loss", neat_level: "light", experience: "BEGINNER", days_per_week: 3, training_environment: "minimal_equipment", injuries: [{ area: "shoulder", pain_level: 5, severity: "MODERATE" }], medical: [], meds: [], allergies: [], disliked_foods: [], intolerances: [], meals_count: "4_meals", fasting: "none", sleep_hours: 7, sleep_pattern: "regular_night", steps: 6000, walking: "EASY" },
  C06: { sex: "male", age: 22, height_cm: 175, weight_kg: 78, waist_cm: 80, goal: "muscle_gain", neat_level: "moderate", experience: "BEGINNER", days_per_week: 3, training_environment: "home_bodyweight", injuries: [], medical: [], meds: [], allergies: [], disliked_foods: [], intolerances: ["LACTOSE"], meals_count: "4_meals", fasting: "none", sleep_hours: 8, sleep_pattern: "regular_night", steps: 8000, walking: "EASY" },
  C13: { sex: "female", age: 25, height_cm: 170, weight_kg: 61, waist_cm: 68, goal: "muscle_gain", neat_level: "high", experience: "INTERMEDIATE", days_per_week: 4, training_environment: "commercial_gym", injuries: [], medical: [], meds: [], allergies: [], disliked_foods: ["صدور دجاج", "لحم بقري مفروم", "تونة", "سمك سلمون", "سمك بلطي"], intolerances: [], meals_count: "4_meals", fasting: "none", sleep_hours: 8, sleep_pattern: "regular_night", steps: 11000, walking: "EASY" },
  C15: { sex: "female", age: 23, height_cm: 158, weight_kg: 55, waist_cm: null, goal: "fat_loss", neat_level: "moderate", experience: "BEGINNER", days_per_week: 2, training_environment: "home_bodyweight", injuries: [], medical: [], meds: [], allergies: [], disliked_foods: [], intolerances: [], meals_count: "3_meals_snack", fasting: "none", sleep_hours: 5, sleep_pattern: "irregular", steps: 7500, walking: "EASY" },
  C16: { sex: "male", age: 37, height_cm: 178, weight_kg: 120, waist_cm: 118, goal: "fat_loss", neat_level: "sedentary", experience: "INTERMEDIATE", days_per_week: 4, training_environment: "commercial_gym", injuries: [{ area: "spine_back", pain_level: 6, severity: "MODERATE" }, { area: "knee", pain_level: 6, severity: "MODERATE" }], medical: [], meds: [], allergies: [], disliked_foods: [], intolerances: [], meals_count: "4_meals", fasting: "none", sleep_hours: 6.5, sleep_pattern: "regular_night", steps: 3000, walking: "EASY" },
  C18: { sex: "male", age: 29, height_cm: 172, weight_kg: 72, waist_cm: 78, goal: "muscle_gain", neat_level: "high", experience: "ADVANCED", days_per_week: 5, training_environment: "commercial_gym", injuries: [{ area: "HIP", pain_level: 3, severity: "MILD" }], medical: [], meds: [], allergies: [], disliked_foods: [], intolerances: [], meals_count: "4_meals", fasting: "none", sleep_hours: 7.5, sleep_pattern: "regular_night", steps: 14000, walking: "EASY" },
  L09: { sex: "female", age: 85, height_cm: 158, weight_kg: 70, waist_cm: 92, goal: "fat_loss", neat_level: "light", experience: "beginner", days_per_week: 2, training_environment: "commercial_gym", injuries: [], medical: ["HYPERTENSION"], meds: [], allergies: [], disliked_foods: [], intolerances: [], meals_count: "4_meals", fasting: "none", sleep_hours: 7, sleep_pattern: "regular_night", steps: 4000, walking: "EASY" },
  L13: { sex: "female", age: 38, height_cm: 165, weight_kg: 66, waist_cm: 78, goal: "weight_maintenance", neat_level: "moderate", experience: "intermediate", days_per_week: 4, training_environment: "commercial_gym", injuries: [], medical: ["THYROID_CONDITION"], meds: ["EUTHYROX"], allergies: [], disliked_foods: [], intolerances: [], meals_count: "4_meals", fasting: "none", sleep_hours: 7.5, sleep_pattern: "regular_night", steps: 9000, walking: "EASY" },
  X08: { sex: "male", age: 72, height_cm: 170, weight_kg: 112, waist_cm: 118, goal: "fat_loss", neat_level: "light", experience: "beginner", days_per_week: 3, training_environment: "commercial_gym", injuries: [{ area: "knee", pain_level: 3, severity: "moderate" }, { area: "shoulder", pain_level: 3, severity: "moderate" }], medical: ["DIABETES", "HYPERTENSION", "ASTHMA_OR_RESPIRATORY_CONDITION", "THYROID_CONDITION"], meds: ["METFORMIN", "EUTHYROX"], allergies: ["PEANUT"], disliked_foods: [], intolerances: ["LACTOSE"], meals_count: "3_meals", fasting: "16_8", sleep_hours: 5.5, sleep_pattern: "night_shift", steps: 5000, walking: "EASY" },
  X14: { sex: "female", age: 30, height_cm: 165, weight_kg: 40, waist_cm: 58, goal: "fat_loss", neat_level: "moderate", experience: "beginner", days_per_week: 3, training_environment: "commercial_gym", injuries: [], medical: [], meds: [], allergies: [], disliked_foods: [], intolerances: [], meals_count: "4_meals", fasting: "none", sleep_hours: 7.5, sleep_pattern: "regular_night", steps: 8000, walking: "EASY" },
  L11: { sex: "female", age: 75, height_cm: 160, weight_kg: 78, waist_cm: 96, goal: "fat_loss", neat_level: "light", experience: "beginner", days_per_week: 2, training_environment: "commercial_gym", injuries: [], medical: [], meds: [], allergies: [], disliked_foods: [], intolerances: [], meals_count: "4_meals", fasting: "none", sleep_hours: 7, sleep_pattern: "regular_night", steps: 5000, walking: "EASY" },
  L12: { sex: "male", age: 65, height_cm: 175, weight_kg: 105, waist_cm: 112, goal: "fat_loss", neat_level: "light", experience: "beginner", days_per_week: 3, training_environment: "commercial_gym", injuries: [], medical: [], meds: [], allergies: [], disliked_foods: [], intolerances: [], meals_count: "4_meals", fasting: "none", sleep_hours: 6.5, sleep_pattern: "regular_night", steps: 5000, walking: "EASY" },
  L21: { sex: "female", age: 70, height_cm: 160, weight_kg: 65, waist_cm: 84, goal: "fat_loss", neat_level: "light", experience: "beginner", days_per_week: 2, training_environment: "commercial_gym", injuries: [], medical: ["OSTEOPOROSIS"], meds: [], allergies: [], disliked_foods: [], intolerances: [], meals_count: "4_meals", fasting: "none", sleep_hours: 7, sleep_pattern: "regular_night", steps: 5000, walking: "EASY" },
  L17: { sex: "male", age: 48, height_cm: 178, weight_kg: 95, waist_cm: 104, goal: "fat_loss", neat_level: "moderate", experience: "intermediate", days_per_week: 4, training_environment: "commercial_gym", injuries: [], medical: ["HIGH_CHOLESTEROL"], meds: [], allergies: [], disliked_foods: [], intolerances: [], meals_count: "4_meals", fasting: "none", sleep_hours: 7, sleep_pattern: "regular_night", steps: 8000, walking: "EASY" },
  C11: { sex: "female", age: 38, height_cm: 164, weight_kg: 66, waist_cm: 72, goal: "weight_maintenance", neat_level: "moderate", experience: "ADVANCED", days_per_week: 4, training_environment: "commercial_gym", injuries: [], medical: ["THYROID_CONDITION"], meds: ["EUTHYROX"], allergies: [], disliked_foods: [], intolerances: [], meals_count: "4_meals", fasting: "none", sleep_hours: 7.5, sleep_pattern: "regular_night", steps: 10000, walking: "EASY" },
};

// Flat public-form payload, same shape the longitudinal harness feeds the engine.
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

function decisionFlagCodes(program) {
  return (program.intake_decision?.review_flags || []).map((f) => (typeof f === "string" ? f : f.code || f.type));
}
function allExercises(program) {
  return (program.training_program?.weeks || []).flatMap((w) => (w.sessions || []).flatMap((s) => (s.exercises || []).map((e) => ({ ...e, session: s.session_code, week: w.week_number }))));
}
function culinaryMeals(program) {
  return program.nutrition_program?.culinary_meals || [];
}
function dayTotals(program) {
  const meals = culinaryMeals(program);
  return {
    kcal: meals.reduce((s, m) => s + (m.actual_macros?.calories_kcal || 0), 0),
    protein: meals.reduce((s, m) => s + (m.actual_macros?.protein_g || 0), 0),
  };
}
const DAIRY = new Set(["COTTAGE_CHEESE", "YOGURT_PLAIN_LOW_FAT", "SKIM_MILK", "HALLOUMI_LIGHT", "LABNEH_LIGHT", "GREEK_YOGURT", "WHOLE_MILK", "CHEDDAR_CHEESE"]);
const LEGUMES = ["LENTIL", "CHICKPEA", "BEAN", "FAVA", "FOUL", "LUPINI", "LEGUME"];
const HIP_EXTENSION_FAMILY = new Set(["BARBELL_HIP_THRUST", "HIP_THRUST", "GLUTE_BRIDGE", "BODYWEIGHT_GLUTE_BRIDGE", "KAS_GLUTE_BRIDGE", "DUMBBELL_GLUTE_BRIDGE"]);

test("H8 C03: shoulder client at home gets real triceps work, no Nordic, no token oil", () => {
  const program = build("C03");
  const exercises = allExercises(program);
  const heldElbow = exercises.filter((e) => String(e.exercise_code || "").startsWith("HELD_SLOT_ELBOW_EXTENSION"));
  assert.equal(heldElbow.length, 0, `elbow-extension slot must be filled, not held: ${JSON.stringify(heldElbow.map((e) => e.session))}`);
  const triceps = exercises.filter((e) => /TRICEPS/.test(e.exercise_code || ""));
  assert.ok(triceps.length > 0, "a shoulder-injured home client must still get triceps work every week");
  assert.ok(!triceps.some((e) => /OVERHEAD/.test(e.exercise_code || "")), "no overhead-arm triceps for a shoulder injury");
  assert.equal(exercises.filter((e) => e.exercise_code === "NORDIC_HAMSTRING_CURL").length, 0, "Nordic curl needs a foot anchor a home client does not have");
  const cottage = culinaryMeals(program).flatMap((m) => m.items || []).filter((i) => i.food_code === "COTTAGE_CHEESE");
  assert.ok(cottage.length > 0, "cottage cheese is the breakfast anchor here");
  assert.ok(cottage.every((i) => i.portion_g <= 150), `cottage cheese over its 150 g cap: ${JSON.stringify(cottage.map((i) => i.portion_g))}`);
  const oil = culinaryMeals(program).flatMap((m) => m.items || []).filter((i) => i.food_code === "OLIVE_OIL");
  assert.ok(oil.every((i) => i.portion_g >= 5), `token olive oil under 5 g: ${JSON.stringify(oil.map((i) => i.portion_g))}`);
});

test("H8 C06/C15: home clients never get a machine exercise or a Nordic curl", () => {
  for (const id of ["C06", "C15"]) {
    const program = build(id);
    const exercises = allExercises(program);
    assert.equal(exercises.filter((e) => e.exercise_code === "NORDIC_HAMSTRING_CURL").length, 0, `${id}: Nordic curl at home with no anchor`);
    assert.equal(exercises.filter((e) => e.exercise_code === "GLUTE_BIASED_45_HYPEREXTENSION").length, 0, `${id}: 45-degree hyperextension needs a bench the home client does not own`);
  }
});

test("H8 C15: 5 hours of sleep is a decision-level flag, and the omelette name tells the truth", () => {
  const program = build("C15");
  assert.ok(decisionFlagCodes(program).includes("SHORT_SLEEP_REQUIRES_COACH_REVIEW"), `5 h sleep must flag the decision, got: ${JSON.stringify(decisionFlagCodes(program))}`);
  assert.equal(program.intake_decision.plan_status, "COACH_REVIEW_REQUIRED", "a short-sleep plan is not READY");
  const omelette = culinaryMeals(program).flatMap((m) => m.items || []).find((i) => i.food_code === "EGGS_OMELETTE");
  assert.ok(omelette, "expected an omelette in the plan");
  const eggsInName = Number((omelette.name_ar || "").match(/([\d.]+)\s*بيض/)?.[1]);
  assert.ok(Number.isFinite(eggsInName), `omelette name must state its egg count, got: ${omelette.name_ar}`);
  assert.ok(Math.abs(eggsInName - omelette.portion_g / 50) <= 0.5, `omelette name says ${eggsInName} eggs but the portion is ${omelette.portion_g} g`);
});

test("H8 C16: no triple hip-extension duplication, no held unilateral slot", () => {
  const program = build("C16");
  for (const week of program.training_program.weeks || []) {
    for (const session of week.sessions || []) {
      const codes = (session.exercises || []).map((e) => e.exercise_code);
      const familyCount = codes.filter((c) => HIP_EXTENSION_FAMILY.has(c)).length;
      // The triple is gone. A double survives only as a knee-guard substitute
      // (the only safe quad-slot work for a knee-injured client) next to the
      // template's own glute bridge - a heavy thrust + a bridge is the floor
      // for a knee+back-injured client, not template redundancy.
      assert.ok(familyCount <= 2, `week ${week.week_number} ${session.session_code}: ${familyCount} hip-extension variants in one session (${codes.filter((c) => HIP_EXTENSION_FAMILY.has(c)).join(", ")})`);
    }
  }
  const heldUnilateral = allExercises(program).filter((e) => String(e.exercise_code || "").startsWith("HELD_SLOT_UNILATERAL_LOWER"));
  assert.equal(heldUnilateral.length, 0, `unilateral lower slot must be filled, not held: ${JSON.stringify(heldUnilateral.map((e) => `${e.session} w${e.week}`))}`);
});

test("H8 C18: a MILD hip injury regresses the leg day, it does not gut it", () => {
  const program = build("C18");
  const held = allExercises(program).filter((e) => String(e.exercise_code || "").startsWith("HELD_SLOT"));
  assert.equal(held.length, 0, `mild hip pain (3/10) must regress, not hold: ${held.length} held slots (${held.slice(0, 4).map((e) => e.exercise_code).join(", ")})`);
  for (const week of program.training_program.weeks || []) {
    for (const session of week.sessions || []) {
      if (!/LOWER|LEG/.test(session.session_code)) continue;
      const real = (session.exercises || []).filter((e) => !String(e.exercise_code || "").startsWith("HELD_SLOT"));
      assert.ok(real.length >= 4, `week ${week.week_number} ${session.session_code}: leg day must keep real work, got ${real.length} exercises`);
    }
  }
});

test("H8 X14: underweight goal redirect is a decision flag, and week 1 has no barbell on a 40 kg beginner", () => {
  const program = build("X14");
  assert.ok(decisionFlagCodes(program).includes("GOAL_REDIRECTED_REQUIRES_COACH_REVIEW"), `goal redirect must flag the decision, got: ${JSON.stringify(decisionFlagCodes(program))}`);
  assert.equal(program.intake_decision.plan_status, "COACH_REVIEW_REQUIRED", "a redirected goal is never READY");
  const week1 = program.training_program.weeks.find((w) => w.week_number === 1);
  const week1Codes = (week1.sessions || []).flatMap((s) => (s.exercises || []).map((e) => e.exercise_code));
  assert.ok(!week1Codes.includes("BARBELL_BACK_SQUAT"), `week 1 must not put a barbell on a 40 kg beginner: ${week1Codes.join(", ")}`);
});

test("H8 elderly: protein rate capped at 1.6 g/kg, carbs at least 30%, guard visible in the decision", () => {
  for (const id of ["L09", "L11", "L12", "L21"]) {
    const program = build(id);
    const t = program.nutrition_program.targets;
    assert.ok(t.protein_per_kg <= 1.6, `${id}: protein ${t.protein_per_kg} g/kg at 65+ with unknown kidneys`);
    const carbShare = (t.carbohydrate_g * 4) / t.target_calories;
    assert.ok(carbShare >= 0.3, `${id}: carbs ${(carbShare * 100).toFixed(0)}% of calories — an elderly deficit must not collapse to near-ketogenic`);
    assert.ok(decisionFlagCodes(program).includes("ELDERLY_HIGH_BMI"), `${id}: elderly guard must be visible in the decision, got: ${JSON.stringify(decisionFlagCodes(program))}`);
    assert.ok(decisionFlagCodes(program).includes("ELDERLY_PROTEIN_KIDNEY_CHECK"), `${id}: elderly protein/kidney check must be flagged`);
    assert.equal(program.intake_decision.plan_status, "COACH_REVIEW_REQUIRED", `${id}: an elderly plan is not READY`);
  }
});

test("H8 hypertension: a sodium limit and guidance reach the plan", () => {
  for (const id of ["L09", "X08"]) {
    const program = build(id);
    assert.equal(program.biomarker_analysis?.dietary_modifications?.sodium_limit_mg, 2300, `${id}: sodium limit must be 2300 mg/day`);
    assert.ok(program.nutrition_program.targets.clinical_guardrails?.hypertension_diet_note_ar, `${id}: hypertension diet guidance must be present`);
  }
});

test("H8 C13: a vegetarian gets legumes, and no meal carries a token starch or three starches", () => {
  const program = build("C13");
  const codes = culinaryMeals(program).flatMap((m) => (m.items || []).map((i) => i.food_code));
  assert.ok(codes.some((c) => LEGUMES.some((l) => c.includes(l))), `vegetarian week must include legumes, got: ${[...new Set(codes)].join(", ")}`);
  // A split of one oversized starch across two real portions (rice + pasta is koshari) is a
  // legitimate plate; what is not legitimate is a third starch in the same meal, or a split
  // part that is a crumb (under 40 g and under 10 g of carbohydrate - the P5 crumb rule).
  const STARCH = ["RICE", "PASTA", "BREAD", "POTATO", "OATS", "QUINOA", "FREEKEH", "KABSA", "TAMEES", "SAJ", "TOAST"];
  for (const meal of culinaryMeals(program)) {
    const items = meal.items || [];
    const starches = items.filter((i) => STARCH.some((s) => i.food_code.includes(s)));
    assert.ok(starches.length <= 2, `meal ${meal.meal_number}: three starches in one plate (${starches.map((i) => i.food_code).join(", ")})`);
    for (const item of starches) {
      assert.ok(!(item.portion_g < 40 && (Number(item.carb_g) || 0) < 10),
        `meal ${meal.meal_number}: token starch ${item.food_code} ${item.portion_g} g`);
    }
  }
});

test("H8 portions: cottage 150 g, tuna one can, omelette two eggs, no token portions", () => {
  for (const id of ["C03", "C06", "C13", "C15", "C16", "C18", "L09", "L11", "L12", "L21", "L17", "X14"]) {
    const meals = culinaryMeals(build(id));
    for (const meal of meals) {
      for (const item of meal.items || []) {
        if (item.food_code === "COTTAGE_CHEESE") assert.ok(item.portion_g <= 150, `${id} meal ${meal.meal_number}: cottage ${item.portion_g} g over 150 g cap`);
        if (item.food_code === "CANNED_TUNA") assert.ok(item.portion_g <= 120, `${id} meal ${meal.meal_number}: tuna ${item.portion_g} g over one can (120 g)`);
        if (item.food_code === "EGGS_OMELETTE") assert.ok(item.portion_g <= 100, `${id} meal ${meal.meal_number}: omelette ${item.portion_g} g over two eggs (100 g)`);
        if (item.food_code === "OLIVE_OIL") assert.ok(item.portion_g >= 5, `${id} meal ${meal.meal_number}: olive oil token ${item.portion_g} g`);
        if (item.food_code === "CHICKEN_BREAST") assert.ok(item.portion_g >= 50, `${id} meal ${meal.meal_number}: chicken token ${item.portion_g} g`);
        if (item.food_code === "SWEET_POTATO") assert.ok(item.portion_g >= 50, `${id} meal ${meal.meal_number}: sweet potato token ${item.portion_g} g`);
      }
    }
  }
});

test("H8 day totals: the served day lands within 30 kcal of its target", () => {
  for (const id of ["C03", "C06", "C13", "C15", "C16", "C18", "L09", "L13", "X08", "X14", "L11", "L12", "L21", "L17", "C11"]) {
    const program = build(id);
    const target = program.nutrition_program.targets.target_calories;
    const served = dayTotals(program).kcal;
    assert.ok(Math.abs(served - target) <= 30, `${id}: served day ${served} kcal vs target ${target} kcal (drift ${served - target})`);
  }
});

test("H8 H2/H7 still hold: no dairy at breakfast for Euthyrox, no dairy anywhere for lactose", () => {
  for (const id of ["L13", "X08", "C11"]) {
    const program = build(id);
    const breakfast = culinaryMeals(program)[0] || { items: [] };
    const bfDairy = (breakfast.items || []).filter((i) => DAIRY.has(i.food_code));
    assert.equal(bfDairy.length, 0, `${id}: dairy at breakfast despite Euthyrox: ${JSON.stringify(bfDairy.map((i) => i.food_code))}`);
  }
  const x08 = build("X08");
  const allDairy = culinaryMeals(x08).flatMap((m) => (m.items || []).filter((i) => DAIRY.has(i.food_code)));
  assert.equal(allDairy.length, 0, `X08: dairy served despite lactose intolerance: ${JSON.stringify(allDairy.map((i) => i.food_code))}`);
});

test("H8 new condition codes: osteoporosis and high cholesterol are real codes with guards", () => {
  const l21 = build("L21");
  assert.ok(decisionFlagCodes(l21).includes("OSTEOPOROSIS_REQUIRES_COACH_REVIEW"), `osteoporosis must flag the decision, got: ${JSON.stringify(decisionFlagCodes(l21))}`);
  const l21Codes = allExercises(l21).map((e) => e.exercise_code);
  assert.ok(!l21Codes.includes("BARBELL_BACK_SQUAT"), "osteoporosis: no barbell on the back");
  assert.ok(!l21Codes.includes("DUMBBELL_ROMANIAN_DEADLIFT"), "osteoporosis: no loaded spinal hinge");
  assert.ok(!l21Codes.includes("BARBELL_DEADLIFT") && !l21Codes.includes("BARBELL_CONVENTIONAL_DEADLIFT"), "osteoporosis: no loaded deadlift");
  const l17 = build("L17");
  assert.ok(decisionFlagCodes(l17).includes("HIGH_CHOLESTEROL_REQUIRES_COACH_REVIEW"), `high cholesterol must flag the decision, got: ${JSON.stringify(decisionFlagCodes(l17))}`);
  assert.ok(l17.nutrition_program.targets.clinical_guardrails?.cholesterol_guidance_ar, "cholesterol guidance must be present");
  const eggGrams = culinaryMeals(l17).flatMap((m) => (m.items || []).filter((i) => i.food_code === "EGGS_OMELETTE")).reduce((s, i) => s + (i.portion_g || 0), 0);
  assert.ok(eggGrams <= 100, `high cholesterol: whole eggs ${eggGrams} g/day over the two-egg cap`);
});

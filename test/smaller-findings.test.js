/**
 * PACKAGE S1 — smaller findings (round 2).
 *
 * Fail-first tests for the items S1 fixes. Each test names the matrix
 * client or the exact behaviour it guards, so a regression shows up here
 * before it reaches a real plan.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { adaptIntakePayloadToCanonicalEngine } from "../src/intake-decision-engine/adapters/intake-adapter.js";
import { evaluateIntake, MealCountStrategy } from "../src/intake-decision-engine/index.js";
import { buildTrainingMesoCycle } from "../src/training-engine-v2/index.js";
import { decideIntroWeek } from "../src/intake-decision-engine/rules/training-rules.js";
import { analyzeBloodworkBiomarkers } from "../src/execution-engines/biomarker-engine.js";
import { isSwapFoodSafe } from "../src/api/services/liveFoodSwapSafety.js";
import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { mergeAdaptedPlanIntoProgram } from "../src/api/utils/planMergeEngine.js";
import { completeIntake, ASSESSMENT_CONTEXT } from "./fixtures/complete-intake.js";
import {
  buildNutritionMealDistribution,
  NUTRITION_MEAL_DISTRIBUTION_VERSION,
} from "z-coaching-intake-decision-engine/nutrition-meal-distribution";
import {
  buildNutritionPlanningSnapshot,
  NUTRITION_PLANNING_SNAPSHOT_VERSION,
} from "z-coaching-intake-decision-engine/nutrition-planning-snapshot";
import {
  NUTRITION_MACRO_TARGETS_VERSION,
  NutritionMacroCalculationPolicy,
  NutritionMacroTargetsStatus,
} from "z-coaching-intake-decision-engine/nutrition-macro-targets";

const CTX = { assessmentDate: "2026-09-19" };
const CATALOG = JSON.parse(
  fs.readFileSync(new URL("../data/catalogs/core-global-food-batch-v1.json", import.meta.url), "utf8"),
);
const EVAL_CTX = JSON.parse(
  fs.readFileSync(new URL("../examples/evaluation-context.json", import.meta.url), "utf8"),
);

// ---------- mesocycle helper (modelled on training-injury-firewall-slots) ----------
function mesocycle({
  injuries = [],
  experience = "BEGINNER",
  days = 3,
  location = "GYM",
  setup,
  equipment,
  age = 30,
  weightKg = 85,
  heightCm = 178,
} = {}) {
  const canonical = adaptIntakePayloadToCanonicalEngine({
    personal: { sex: "MALE", age },
    body: { weightKg, heightCm },
    goals: { primary: "FAT_LOSS" },
    medical: { hasInjuries: injuries.length > 0, injuries, conditions: [] },
    cardio: { averageDailySteps: 7000, walkingAbility: "EASY" },
    ...(setup ? { training_environment: setup } : {}),
    training: {
      preferredDaysPerWeek: days,
      experience,
      environment: location === "HOME" ? "HOME" : "COMMERCIAL_GYM",
      location,
      ...(equipment !== undefined ? { equipment } : {}),
    },
    lifestyle: {},
  });
  return buildTrainingMesoCycle(evaluateIntake(canonical, CTX), { rawIntake: canonical, experience });
}

const allExercises = (meso) => meso.weeks.flatMap((w) => w.sessions).flatMap((s) => s.exercises);
const weekExercises = (meso, weekNumber) =>
  meso.weeks.find((w) => w.week_number === weekNumber).sessions.flatMap((s) => s.exercises);

// ---------- item 2: knee guard regresses to leg extension, not hip thrust ----------
test("S1 item 2 (C02): moderate knee pain (6/10) regresses the squat slot to the leg extension machine in the gym", () => {
  const meso = mesocycle({
    injuries: [{ area: "KNEE", painLevel: 6 }],
    experience: "INTERMEDIATE",
    days: 5,
    location: "GYM",
  });
  const exs = allExercises(meso);
  // Direct quad work survives: the knee-dominant slot becomes a leg extension.
  assert.ok(
    exs.some((e) => e.exercise_code === "LEG_EXTENSION_MACHINE"),
    "a moderate knee injury must keep direct quad work (LEG_EXTENSION_MACHINE)",
  );
  // The squat slot is a leg extension, not a hip thrust.
  const kneeDominant = exs.filter((e) => e.slot_code === "KNEE_DOMINANT");
  assert.ok(kneeDominant.length > 0, "leg days must still carry a KNEE_DOMINANT slot");
  assert.ok(
    kneeDominant.every((e) => e.exercise_code === "LEG_EXTENSION_MACHINE"),
    `KNEE_DOMINANT slots must be leg extensions, got ${kneeDominant.map((e) => e.exercise_code).join(",")}`,
  );
  // The regression is scoped to the quad slot: a lunge in another slot must
  // not become a second leg extension and hold its slot.
  const legSessions = meso.weeks[0].sessions.filter((s) => /LOWER|LEG/.test(s.session_code));
  for (const session of legSessions) {
    assert.ok(
      !session.exercises.some((e) => String(e.exercise_code || "").startsWith("HELD_SLOT")),
      `${session.session_code} must not gain a held slot from the knee regression`,
    );
  }
});

test("S1 item 2: severe (8/10) or unknown knee pain keeps the fail-closed hip-thrust conversion", () => {
  for (const injuries of [[{ area: "KNEE", painLevel: 8 }], [{ area: "KNEE", painLevel: null }]]) {
    const meso = mesocycle({ injuries, experience: "INTERMEDIATE", days: 5, location: "GYM" });
    const exs = allExercises(meso);
    assert.ok(
      !exs.some((e) => e.exercise_code === "LEG_EXTENSION_MACHINE"),
      "severe/unknown knee pain must not be given loaded knee extension",
    );
    assert.ok(
      exs.some((e) => e.exercise_code === "BARBELL_HIP_THRUST"),
      "severe/unknown knee pain keeps the hip-thrust conversion",
    );
  }
});

// ---------- item 10: push-up regresses for a moderate shoulder injury ----------
test("S1 item 10 (C03): a push-up in the horizontal-push slot regresses for a moderate shoulder injury", () => {
  // Home with dumbbells (C03 trains minimal_equipment): floor press.
  const home = mesocycle({
    injuries: [{ area: "SHOULDER", painLevel: 5 }],
    experience: "INTERMEDIATE",
    days: 3,
    location: "HOME",
    equipment: [{ equipmentCode: "DUMBBELLS", otherEquipmentText: null, loadCapacity: "HEAVY" }],
  });
  const homeExs = allExercises(home);
  assert.ok(
    !homeExs.some((e) => e.exercise_code === "PUSH_UP" || e.exercise_code === "INCLINE_PUSH_UP"),
    "no push-up may survive in a horizontal-push slot with a moderate shoulder injury",
  );
  assert.ok(
    homeExs.some((e) => e.exercise_code === "DUMBBELL_FLOOR_PRESS"),
    "home with dumbbells: the push-up becomes a dumbbell floor press",
  );

  // Gym: machine chest press.
  const gym = mesocycle({
    injuries: [{ area: "SHOULDER", painLevel: 5 }],
    experience: "INTERMEDIATE",
    days: 3,
    location: "GYM",
  });
  const gymExs = allExercises(gym);
  assert.ok(
    !gymExs.some((e) => e.exercise_code === "PUSH_UP" || e.exercise_code === "INCLINE_PUSH_UP"),
    "no push-up may survive in a horizontal-push slot with a moderate shoulder injury (gym)",
  );
  assert.ok(
    gymExs.some((e) => e.exercise_code === "MACHINE_CHEST_PRESS"),
    "gym: the push-up becomes a machine chest press",
  );
});

test("S1 item 10: home bodyweight-only with a shoulder injury holds the push-up slot instead of inventing dumbbell work", () => {
  const meso = mesocycle({
    injuries: [{ area: "SHOULDER", painLevel: 5 }],
    experience: "INTERMEDIATE",
    days: 3,
    location: "HOME",
    setup: "home_bodyweight",
  });
  const exs = allExercises(meso);
  assert.ok(
    !exs.some((e) => e.exercise_code === "PUSH_UP" || e.exercise_code === "INCLINE_PUSH_UP"),
    "no push-up may survive with a shoulder injury",
  );
  assert.ok(
    !exs.some((e) => e.exercise_code === "DUMBBELL_FLOOR_PRESS"),
    "a client who owns no dumbbells must not be served dumbbell work",
  );
  assert.ok(
    exs.some((e) => String(e.exercise_code || "").startsWith("HELD_SLOT")),
    "the push-up slot is held for the coach when no safe substitute exists",
  );
});

// ---------- item 11: elderly week-1 hip thrust regresses ----------
test("S1 item 11 (C20): elderly/high-BMI week 1 contains no barbell hip thrust", () => {
  const meso = mesocycle({
    experience: "BEGINNER",
    days: 2,
    location: "GYM",
    age: 58,
    weightKg: 130,
    heightCm: 176, // BMI 42: the elderly/high-BMI week-1 guard applies
  });
  const week1 = weekExercises(meso, 1);
  assert.ok(
    !week1.some((e) => e.exercise_code === "BARBELL_HIP_THRUST"),
    "week 1 must not open with a loaded barbell hip thrust",
  );
  assert.ok(
    week1.some((e) => e.exercise_code === "BODYWEIGHT_GLUTE_BRIDGE"),
    "week 1 regresses the hip thrust to a bodyweight glute bridge",
  );
});

// ---------- item 5: intro week for every beginner ----------
test("S1 item 5: decideIntroWeek requires an intro week for a BEGINNER with known history", () => {
  const result = decideIntroWeek({
    training: { experience: "BEGINNER", recentTraining: "ACTIVE" },
  });
  assert.equal(result.introWeekRequired, true);
  assert.ok(result.reasons.some((r) => r.code === "INTRO_WEEK_BEGINNER"));
});

test("S1 item 5 (C01): a beginner's week 1 is capped at 2 sets per exercise and below week 2", () => {
  const meso = mesocycle({ experience: "BEGINNER", days: 4, location: "GYM" });
  const week1 = weekExercises(meso, 1);
  const week2 = weekExercises(meso, 2);
  const sets = (list) => list.reduce((sum, e) => sum + Number(e.prescription?.sets || e.sets || 0), 0);
  assert.ok(
    week1.every((e) => Number(e.prescription?.sets || e.sets || 0) <= 2),
    "week 1 sets are capped at 2 for a beginner intro week",
  );
  assert.ok(sets(week1) < sets(week2), `week 1 (${sets(week1)} sets) must be below week 2 (${sets(week2)} sets)`);
});

// ---------- item 4: one allergy, one flag ----------
const FLAT_BASE = {
  gender: "male",
  age: "41",
  height_cm: "176",
  weight_kg: "88",
  circumferences: { neck_cm: "40", waist_cm: "96", hips_cm: "100" },
  primary_goal: "fat_loss",
  neat_level: "moderate",
  occupation_type: "DESK_OFFICE",
  dangerous_symptoms: ["NONE"],
  medical_conditions: { has_conditions: false, selected: ["none"] },
  injuries_map: { has_injuries: false, selected_areas: ["none"] },
  religion: "MUSLIM",
  meal_structure: { meals_count: "4_meals", intermittent_fasting: "none" },
  training_logistics: { days_per_week: 4, experience_level: "intermediate" },
  recent_training: "ACTIVE",
  training_environment: "commercial_gym",
  strict_allergies: [],
};

test("S1 item 4 (C17): one reported fish allergy produces exactly one allergy flag", () => {
  const canonical = adaptIntakePayloadToCanonicalEngine({ ...FLAT_BASE, strict_allergies: ["FISH"] });
  const decision = evaluateIntake(canonical, CTX);
  const flags = (decision.review_flags || []).filter((f) => f.code === "UNCONFIRMED_FOOD_ALLERGY");
  assert.equal(flags.length, 1, `expected 1 UNCONFIRMED_FOOD_ALLERGY flag, got ${flags.length}`);
  const pending = (decision.missing_or_uncertain_data || []).filter(
    (d) => d.code === "FOOD_ALLERGY_CONFIRMATION_PENDING",
  );
  assert.equal(pending.length, 1, `expected 1 FOOD_ALLERGY_CONFIRMATION_PENDING entry, got ${pending.length}`);
});

// ---------- item 8: water scales with body weight ----------
test("S1 item 8 (C15): the water floor no longer dominates for a light client, and clinical raises stay", () => {
  const plain = analyzeBloodworkBiomarkers({});
  assert.equal(
    plain.dietary_modifications.daily_water_target_liters,
    2.0,
    "the default water floor is 2.0 L so the weight formula rules",
  );
  const renal = analyzeBloodworkBiomarkers({ egfr_ml_min: 50, gender: "FEMALE" });
  assert.equal(renal.dietary_modifications.daily_water_target_liters, 4.0, "the renal raise stays at 4.0 L");
  const gout = analyzeBloodworkBiomarkers({ uric_acid_mg_dl: 8.5, gender: "MALE" });
  assert.equal(gout.dietary_modifications.daily_water_target_liters, 4.0, "the gout raise stays at 4.0 L");
});

// ---------- item 9: vegetarian field ----------
const VEGETARIAN_CODES = ["CHICKEN_BREAST", "LEAN_BEEF", "CANNED_TUNA", "SALMON_FISH", "TILAPIA_FISH"];
const MEAT_FISH = /CHICKEN|BEEF|TUNA|SALMON|TILAPIA|MACKEREL|TURKEY|CAMEL|LAMB|SHRIMP|FISH/;

test("S1 item 9: dietary_preference vegetarian maps to the full meat/fish exclusion in the adapter", () => {
  const canonical = adaptIntakePayloadToCanonicalEngine({
    ...FLAT_BASE,
    gender: "female",
    age: "25",
    height_cm: "170",
    weight_kg: "61",
    primary_goal: "muscle_gain",
    dietary_preference: "vegetarian",
  });
  const disliked = canonical.nutrition?.dislikedFoods || [];
  for (const code of VEGETARIAN_CODES) {
    assert.ok(disliked.includes(code), `vegetarian must exclude ${code}`);
  }
  assert.equal(canonical.nutrition?.dietType, "VEGETARIAN");
});

test("S1 item 9: a vegetarian client is served no meat or fish anywhere in the plan", () => {
  const intake = {
    ...FLAT_BASE,
    gender: "female",
    age: "25",
    height_cm: "170",
    weight_kg: "61",
    primary_goal: "muscle_gain",
    training_logistics: { days_per_week: 4, experience_level: "intermediate" },
    dietary_preference: "vegetarian",
  };
  const raw = buildMasterEngineV2({ intake, evaluationContext: EVAL_CTX, nutritionFoodCatalog: CATALOG, options: {} });
  const np = raw.nutrition_program;
  const pipeItems = (np.stages?.portion_solver?.meals || []).flatMap((m) => m.items || []);
  const culinaryItems = (np.culinary_meals || []).flatMap((m) => m.items || []);
  for (const item of [...pipeItems, ...culinaryItems]) {
    assert.doesNotMatch(
      String(item.food_code || ""),
      MEAT_FISH,
      `vegetarian plan must not serve ${item.food_code}`,
    );
  }
});

// ---------- item 14: B-API-5 zero-delta merge leaves the culinary meals untouched ----------
function buildTestMasterProgram() {
  return buildMasterEngineV2({
    intake: completeIntake(),
    evaluationContext: Object.freeze({
      system_time: new Date(ASSESSMENT_CONTEXT.assessmentDate).toISOString(),
      assessmentDate: ASSESSMENT_CONTEXT.assessmentDate,
    }),
    nutritionFoodCatalog: CATALOG,
  });
}

test("S1 item 14 (B-API-5): a zero-delta merge does not re-quantize the culinary meals, but still advances the week", () => {
  const baseProgram = buildTestMasterProgram();
  const before = JSON.parse(JSON.stringify(baseProgram.nutrition_program.culinary_meals));
  const week2 = structuredClone(baseProgram.training_program.weeks[1]);
  const merged = mergeAdaptedPlanIntoProgram(baseProgram, {
    adapted_week_number: 2,
    adapted_training_week: week2,
    adaptation_action: "MAINTENANCE",
    suggested_calorie_delta: 0,
  });
  assert.deepEqual(
    merged.nutrition_program.culinary_meals,
    before,
    "a zero-delta merge must leave every culinary meal byte-identical",
  );
  assert.equal(merged.current_training_week, 2, "the training-week advance still rides the same merge");
});

// ---------- item 16: snack fat — FILED, not fixed ----------
function makeSnapshot({ preferredMealCount = 4 } = {}) {
  return {
    snapshot_version: NUTRITION_PLANNING_SNAPSHOT_VERSION,
    meal_preferences: {
      preferred_meal_count: preferredMealCount,
      meal_count_strategy: MealCountStrategy.USE_CLIENT_PREFERENCE,
      unavailable_eating_windows: [],
    },
  };
}

function makeMacroTargets(snapshot, { targetCalories = 1953, protein = 131, fat = 66, carbohydrate = 209, fiber = 28 } = {}) {
  return {
    macro_targets_version: NUTRITION_MACRO_TARGETS_VERSION,
    source_snapshot_version: snapshot.snapshot_version,
    status: NutritionMacroTargetsStatus.READY,
    calculation_policy: NutritionMacroCalculationPolicy.Z_COACHING_MACRO_POLICY_V1,
    target_calories: targetCalories,
    protein: { target_g: protein, calories: protein * 4 },
    fat: { target_g: fat, calories: fat * 9 },
    carbohydrate: { target_g: carbohydrate, calories: carbohydrate * 4 },
    fiber_target_g: fiber,
    macro_calories_total: protein * 4 + fat * 9 + carbohydrate * 4,
    calorie_difference: protein * 4 + fat * 9 + carbohydrate * 4 - targetCalories,
    constraints: [],
    reasons: [],
  };
}

// B5-2 (Option C) supersedes the reverted half-weight experiment below:
// the experiment halved the snack's fat weight and left the freed calories
// unreturned, so the snack fell to ~13% and broke the locked Q28 invariant
// (a snack's planned calories must sit on its calorie weight). This package
// halves the same weight AND derives the snack's carbohydrate target from
// its own calorie budget, so the freed calories return as carbohydrate and
// Q28 holds: on this fixture the snack sits at exactly 15% (293 kcal of a
// 1953 kcal day), the day's fat still closes exactly at 66 g, and the
// snack's fat is 5 g (half of its 10 g full-weight share) with 42 g of
// carbohydrate. This test now locks the new behaviour: half-weight fat,
// full-weight calories. A future package must not silently restore the
// full-weight fat share (the served snack cannot carry it — see B5-2) and
// must not break the Q28 calorie guard.
test("S1 item 16 (B5-2): the snack takes a half-weight fat share and keeps its calorie weight — the carb-budget derivation returns the freed calories", () => {
  const snapshot = makeSnapshot({ preferredMealCount: 4 });
  const distribution = buildNutritionMealDistribution({
    nutritionPlanningSnapshot: snapshot,
    nutritionMacroTargets: makeMacroTargets(snapshot),
  });
  const snack = distribution.meals.find((m) => m.role === "SNACK");
  // Half weight: 66 * 15/100 / 2 = 5 g (largest-remainder may give 4 or 5).
  assert.ok(snack.fat_g >= 4 && snack.fat_g <= 5, `snack fat must sit at its half-weight share, got ${snack.fat_g} g`);
  assert.equal(snack.carbohydrate_g, 42, `the snack's carbohydrate target is derived from its own calorie budget, got ${snack.carbohydrate_g} g`);
  assert.ok(Math.abs(snack.actual_calorie_percent - 15) <= 0.5, `the snack's planned calories still sit on its 15% calorie weight (Q28), got ${snack.actual_calorie_percent}%`);
  const totalFat = distribution.meals.reduce((sum, m) => sum + m.fat_g, 0);
  assert.equal(totalFat, 66, "the day's fat still closes exactly");
});

// ---------- item 17: Euthyrox breakfast lock in the swap path ----------
const SWAP_CONTEXT_LOCKED = Object.freeze({
  isLevothyroxineBreakfastDairyLocked: true,
  dislikedFoodCodes: new Set(),
  allergenSet: new Set(),
  intoleranceSet: new Set(),
  clinicalFlags: new Set(),
  conditions: [],
  medications: [],
  nutritionContext: {},
});

test("S1 item 17: the swap path refuses dairy at breakfast for a levothyroxine client, and allows it elsewhere", () => {
  assert.equal(
    isSwapFoodSafe("GREEK_YOGURT", SWAP_CONTEXT_LOCKED, null, "BREAKFAST"),
    false,
    "dairy at breakfast is refused while the levothyroxine lock is on",
  );
  assert.equal(
    isSwapFoodSafe("GREEK_YOGURT", SWAP_CONTEXT_LOCKED, null, "MAIN_MEAL"),
    true,
    "dairy at a main meal is allowed for the same client",
  );
  assert.equal(
    isSwapFoodSafe("CHICKEN_BREAST_COOKED", SWAP_CONTEXT_LOCKED, null, "BREAKFAST"),
    true,
    "non-dairy at breakfast is allowed for the same client",
  );
  assert.equal(
    isSwapFoodSafe("GREEK_YOGURT", { ...SWAP_CONTEXT_LOCKED, isLevothyroxineBreakfastDairyLocked: false }, null, "BREAKFAST"),
    true,
    "dairy at breakfast is allowed when the lock is off",
  );
});

test("S1 item 17 (filed gap): with no meal context the lock cannot apply, so dairy is allowed", () => {
  assert.equal(
    isSwapFoodSafe("GREEK_YOGURT", SWAP_CONTEXT_LOCKED, null, null),
    true,
    "unknown meal: the lock has nothing to attach to (filed — the app must send meal_context)",
  );
});

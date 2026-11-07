import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { MealCountStrategy } from "../src/intake-decision-engine/index.js";
import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import {
  buildNutritionPlanningSnapshot,
  NUTRITION_PLANNING_SNAPSHOT_VERSION,
} from "z-coaching-intake-decision-engine/nutrition-planning-snapshot";
import {
  buildNutritionMacroTargets,
  NUTRITION_MACRO_TARGETS_VERSION,
  NutritionMacroCalculationPolicy,
  NutritionMacroTargetsStatus,
} from "z-coaching-intake-decision-engine/nutrition-macro-targets";
import {
  buildNutritionMealDistribution,
  NutritionMealRole,
} from "z-coaching-intake-decision-engine/nutrition-meal-distribution";

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

function makeMacroTargets(snapshot, {
  targetCalories = 2310,
  proteinG = 115,
  fatG = 65,
  carbG = 316,
  fiberG = 25,
} = {}) {
  const macroCaloriesTotal = proteinG * 4 + fatG * 9 + carbG * 4;
  return {
    macro_targets_version: NUTRITION_MACRO_TARGETS_VERSION,
    source_snapshot_version: snapshot.snapshot_version,
    status: NutritionMacroTargetsStatus.READY,
    calculation_policy:
      NutritionMacroCalculationPolicy.Z_COACHING_MACRO_POLICY_V1,
    target_calories: targetCalories,
    protein: { target_g: proteinG, calories: proteinG * 4 },
    fat: { target_g: fatG, calories: fatG * 9 },
    carbohydrate: { target_g: carbG, calories: carbG * 4 },
    fiber_target_g: fiberG,
    macro_calories_total: macroCaloriesTotal,
    calorie_difference: macroCaloriesTotal - targetCalories,
    constraints: [],
    reasons: [],
  };
}

function distribute({ mealCount = 4, ...targets } = {}) {
  const snapshot = makeSnapshot({ preferredMealCount: mealCount });
  return buildNutritionMealDistribution({
    nutritionPlanningSnapshot: snapshot,
    nutritionMacroTargets: makeMacroTargets(snapshot, targets),
  });
}

// B5-2 (Option C): the pipeline portion solver serves day fat 2-7 g below
// headline in 18/20 matrix clients because every SNACK_DAIRY_FRUIT snack
// is asked to carry a calorie-weight fat share its food pool cannot serve —
// the solver deliberately drops the snack's ADDED_FAT slot (oil stirred
// into yogurt and fruit is not a snack a client will eat), leaving low-fat
// dairy + fruit that carry ~45% of the share — and compensates with carbs.
// The distribution therefore gives snacks a half-weight fat share (the
// freed share flows to full meals with oil slots) and derives each snack's
// carb target from its own calorie budget, so the day still closes exactly
// and each snack's planned calories stay on its calorie-weight share.
test("B5-2: a snack's fat share is half its calorie weight (Option C)", () => {
  const four = distribute({ mealCount: 4 });
  // Day fat 65 g over weights [25, 30, 15, 30]: the 15% snack used to get
  // 10 g; at half weight (effective weights [25, 30, 7.5, 30]) it gets 5 g.
  assert.deepEqual(
    four.meals.map((meal) => meal.fat_g),
    [18, 21, 5, 21],
  );
  assert.equal(
    four.meals.reduce((total, meal) => total + meal.fat_g, 0),
    65,
  );
  const five = distribute({ mealCount: 5 });
  // Two 10% snacks over effective weights [20, 5, 30, 5, 30]: 7 g -> 4 g
  // and 6 g -> 3 g (was [13, 7, 20, 6, 19]).
  assert.deepEqual(
    five.meals.map((meal) => meal.fat_g),
    [14, 4, 22, 3, 22],
  );
  assert.equal(
    five.meals.reduce((total, meal) => total + meal.fat_g, 0),
    65,
  );
});

test("B5-2: a snack's carbs fill its own calorie budget (Option C)", () => {
  const four = distribute({ mealCount: 4 });
  // Snack: 17 g protein (68 kcal) + 5 g fat (45 kcal); budget 2309 x 15%
  // = 346 kcal, so carbs = (346 - 68 - 45) / 4 = 58 g (was 47 g).
  // Mains take the remaining 258 g by largest remainder over [25, 30, 30].
  assert.deepEqual(
    four.meals.map((meal) => meal.carbohydrate_g),
    [76, 91, 58, 91],
  );
  assert.equal(
    four.meals.reduce((total, meal) => total + meal.carbohydrate_g, 0),
    316,
  );
  // The snack's planned calories stay on its 15% weight share (Q28):
  // 68 + 45 + 232 = 345 kcal, within 5 kcal of 2310 x 15%.
  assert.equal(four.meals[2].role, NutritionMealRole.SNACK);
  assert.ok(Math.abs(four.meals[2].planned_calories - 2310 * 0.15) <= 5);
  const five = distribute({ mealCount: 5 });
  assert.deepEqual(
    five.meals.map((meal) => meal.carbohydrate_g),
    [60, 37, 90, 40, 89],
  );
  assert.equal(
    five.meals.reduce((total, meal) => total + meal.carbohydrate_g, 0),
    316,
  );
});

// B5-2 (Option C), C09: her snack carb target was 15 g while the yogurt
// alone carries 7 g, so a 50 g potato (10 g carbs) put the snack 4 g over
// target and the trim cut the potato back to a token that was deleted —
// the -29 kcal snack outlier. With the budget-derived target her snack
// (day P152 / C101 / F54, 4 meals) gets ~24 g of carbohydrate, leaving
// room for the potato: 7 g yogurt + 10 g potato + ~2 g nuts = 19 g.
test("B5-2: C09-shaped day gives the snack room for a 50 g potato (Option C)", () => {
  const c09 = distribute({
    mealCount: 4,
    targetCalories: 1499,
    proteinG: 152,
    fatG: 54,
    carbG: 101,
    fiberG: 28,
  });
  const snack = c09.meals[2];
  assert.equal(snack.role, NutritionMealRole.SNACK);
  assert.equal(snack.fat_g, 4);
  assert.equal(snack.carbohydrate_g, 24);
  // Yogurt (7 g) + 50 g potato (10 g) + nuts (~2 g) = ~19 g, inside the
  // 24 g target with room to spare — the trim tolerance (3 g) no longer
  // forces the potato out.
  assert.ok(snack.carbohydrate_g - 19 >= 3);
  assert.equal(
    c09.meals.reduce((total, meal) => total + meal.carbohydrate_g, 0),
    101,
  );
  assert.equal(
    c09.meals.reduce((total, meal) => total + meal.fat_g, 0),
    54,
  );
  assert.equal(
    c09.meals.reduce((total, meal) => total + meal.planned_calories, 0),
    152 * 4 + 54 * 9 + 101 * 4,
  );
});

test("B5-2: snack-less meal counts are unchanged (Option C)", () => {
  // Two- and three-meal maps have no SNACK role, so the old uniform
  // allocation must come out byte-for-byte identical.
  const two = distribute({ mealCount: 2 });
  assert.deepEqual(
    two.meals.map((meal) => [meal.fat_g, meal.carbohydrate_g]),
    [[33, 158], [32, 158]],
  );
  const three = distribute({ mealCount: 3 });
  assert.deepEqual(
    three.meals.map((meal) => [meal.fat_g, meal.carbohydrate_g]),
    [[19, 95], [23, 111], [23, 110]],
  );
});

// --- B6-1 (Option C, served half) ---
// The pipeline distribution fix (B5-2) never reaches the client: the
// culinary stage reads meal_distribution from the universal targets, which
// the master engine computes itself with the SAME uniform-share flaw in a
// second, independent distribution (SNACK_ENERGY_SHARE; snacks get
// cRatio = fRatio = snackShare). The same two rules therefore apply here:
// snacks count at half their calorie weight for fat, and a snack's carb
// target is derived from its own calorie budget. The fixture below is the
// one test/the-day-is-shared-the-way-it-is-eaten.test.js uses (85 kg male,
// fat loss, 2230 kcal, P171/C263/F55); the expected values are hand-computed
// from the rules, not copied from a run.
const B61_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const B61_CATALOG = JSON.parse(
  fs.readFileSync(path.join(B61_ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"),
);
const B61_CTX = { system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" };

function b61Targets(meals) {
  const intake = {
    gender: "male", age: "30", height_cm: "178", weight_kg: "85",
    circumferences: { neck_cm: "40", waist_cm: "95", hips_cm: "100" },
    primary_goal: "fat_loss", neat_level: "moderate", occupation_type: "DESK_OFFICE",
    dangerous_symptoms: ["NONE"],
    medical_conditions: { has_conditions: false, selected: ["none"] },
    injuries_map: { has_injuries: false, selected_areas: ["none"] },
    religion: "MUSLIM", strict_allergies: ["none"],
    meal_structure: { meals_count: meals, intermittent_fasting: "none" },
    training_environment: "commercial_gym",
    training_logistics: { days_per_week: 4, experience_level: "intermediate" },
    recent_training: "ACTIVE",
  };
  return buildMasterEngineV2({
    intake, evaluationContext: B61_CTX, nutritionFoodCatalog: B61_CATALOG, options: {},
  }).nutrition_program.targets;
}

test("B6-1: the served snack's fat share is half its calorie weight (Option C, served half)", () => {
  const four = b61Targets("3_meals_snack");
  // Day fat 55 g over effective weights [0.2833, 0.2833, 0.2833, 0.075]:
  // the 15% snack used to get 8 g; at half weight it gets 4 g, and the
  // freed share flows to the full meals (16 g -> 17 g each).
  assert.deepEqual(
    four.meal_distribution.map((meal) => meal.fat_g),
    [17, 17, 17, 4],
  );
  assert.equal(
    four.meal_distribution.reduce((total, meal) => total + meal.fat_g, 0),
    55,
  );
  const five = b61Targets("5_meals");
  // Two 14% snacks over effective weights [0.2867, 0.2867, 0.2867, 0.07, 0.07]:
  // 8 g -> 4 g each (was [13, 13, 13, 8, 8]).
  assert.deepEqual(
    five.meal_distribution.map((meal) => meal.fat_g),
    [16, 16, 15, 4, 4],
  );
  assert.equal(
    five.meal_distribution.reduce((total, meal) => total + meal.fat_g, 0),
    55,
  );
});

test("B6-1: the served snack's carbs fill its own calorie budget (Option C, served half)", () => {
  const four = b61Targets("3_meals_snack");
  // Snack: 26 g protein (104 kcal) + 4 g fat (36 kcal); budget
  // 2230 x 15% = 335 kcal, so carbs = (335 - 104 - 36) / 4 = 49 g (was 39 g).
  // Mains take the remaining 214 g by largest remainder over equal weights.
  assert.deepEqual(
    four.meal_distribution.map((meal) => meal.carb_g),
    [72, 71, 71, 49],
  );
  assert.equal(
    four.meal_distribution.reduce((total, meal) => total + meal.carb_g, 0),
    263,
  );
  // The snack's planned calories stay on its 15% weight share (Q28):
  // 104 + 196 + 36 = 336 kcal, within 5 kcal of 2230 x 15%.
  const snack = four.meal_distribution[3];
  assert.ok(Math.abs(snack.calories_kcal - 2230 * 0.15) <= 5);
  const five = b61Targets("5_meals");
  // Each snack: 24 g protein (96 kcal) + 4 g fat (36 kcal); budget
  // 2230 x 14% = 312 kcal, so carbs = (312 - 96 - 36) / 4 = 45 g (was 37 g).
  assert.deepEqual(
    five.meal_distribution.map((meal) => meal.carb_g),
    [58, 58, 57, 45, 45],
  );
  assert.equal(
    five.meal_distribution.reduce((total, meal) => total + meal.carb_g, 0),
    263,
  );
  for (const meal of five.meal_distribution.slice(3)) {
    assert.ok(Math.abs(meal.calories_kcal - 2230 * 0.14) <= 5);
  }
});

test("B6-1: served protein allocation is unchanged (Option C, served half)", () => {
  // Protein follows the same (uniform) energy weights as before — the fix
  // moves fat and carbs only, so the per-meal protein pins stay byte-identical.
  const four = b61Targets("3_meals_snack");
  assert.deepEqual(
    four.meal_distribution.map((meal) => meal.protein_g),
    [49, 48, 48, 26],
  );
  const five = b61Targets("5_meals");
  assert.deepEqual(
    five.meal_distribution.map((meal) => meal.protein_g),
    [41, 41, 41, 24, 24],
  );
});

test("B6-1: snack-less served days are unchanged (Option C, served half)", () => {
  // Three-meal maps have no snack, so the old uniform allocation must come
  // out byte-for-byte identical.
  const three = b61Targets("3_meals");
  assert.deepEqual(
    three.meal_distribution.map((meal) => [meal.protein_g, meal.carb_g, meal.fat_g]),
    [[53, 79, 18], [65, 105, 18], [53, 79, 18]],
  );
});

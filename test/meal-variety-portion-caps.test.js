import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import {
  splitOversizedPortions,
  carbPortionLimit,
} from "../src/nutrition-meal-context-v2/build-culinary-meals.js";
import { sanitizeMealPlan } from "../src/nutrition-meal-context-v2/index.js";

/**
 * Meal variety (Package 5): one food must not dominate a meal, and a yogurt
 * snack must never carry olive oil.
 *
 * Evidence (20-client stress matrix, 2026-11-05): raw tomato 325-400 g in a
 * single meal 15 times across 11 clients; 10 g olive oil stirred into the
 * yogurt-and-fruit snack in 19/20 plans; C06's meal 2 serves 404 g basmati
 * rice; C13's meals carry 192-198 g baladi bread; dry oats 110 g at
 * breakfast (C06). Caps come from the catalog's own portion rules and the
 * ErgonomicPortionCaps already in the codebase (tomato/cucumber 150 g,
 * carrot 100 g, cooked rice/potato 250 g, dry oats 80 g; baladi bread 180 g
 * is two medium loaves at 85-90 g per the food's own unit label).
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"));
const EVAL_CTX = { system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" };

// C06 (matrix): young man, lean muscle, home no equipment, lactose intolerance.
const C06_INTAKE = {
  gender: "male", age: "22", height_cm: "175", weight_kg: "78", waist_cm: "80",
  primary_goal: "muscle_gain", neat_level: "moderate", occupation_type: "DESK_OFFICE",
  dangerous_symptoms: ["NONE"],
  medical_conditions: { has_conditions: false, selected: [] },
  injuries_map: { has_injuries: false, selected_areas: [] },
  religion: "MUSLIM", strict_allergies: [],
  meal_structure: { meals_count: "4_meals", intermittent_fasting: "none" },
  training_environment: "home_bodyweight",
  training_logistics: { days_per_week: 3, experience_level: "BEGINNER" },
  recent_training: "ACTIVE",
  cardio: { walkingAbility: "EASY", averageDailySteps: 8000, maxSessionsPerWeek: 2, maxDurationMinutes: 30 },
  sleep_hours: 8, sleep_schedule: { pattern: "regular_night", average_hours: 8 },
  nutrition: {
    preferredMealCount: 4, allergies: [], excludedFoodsList: [], dislikedFoods: [],
    intolerances: [{ substance: "LACTOSE", severity: "MODERATE", medicallyDiagnosed: true }],
    digestiveIssues: [], budget: "MEDIUM", foodStorageAvailable: true, foodReheatingAvailable: true,
  },
};

// C13 (matrix): young woman, shaping/muscle, vegetarian via disliked foods.
const C13_INTAKE = {
  gender: "female", age: "25", height_cm: "170", weight_kg: "61", waist_cm: "68",
  primary_goal: "muscle_gain", neat_level: "high", occupation_type: "DESK_OFFICE",
  dangerous_symptoms: ["NONE"],
  medical_conditions: { has_conditions: false, selected: [] },
  injuries_map: { has_injuries: false, selected_areas: [] },
  religion: "MUSLIM", strict_allergies: [],
  disliked_foods: ["صدور دجاج", "لحم بقري مفروم", "تونة", "سمك سلمون", "سمك بلطي"],
  meal_structure: { meals_count: "4_meals", intermittent_fasting: "none" },
  training_environment: "commercial_gym",
  training_logistics: { days_per_week: 4, experience_level: "INTERMEDIATE" },
  recent_training: "ACTIVE",
  cardio: { walkingAbility: "EASY", averageDailySteps: 11000, maxSessionsPerWeek: 2, maxDurationMinutes: 30 },
  sleep_hours: 8, sleep_schedule: { pattern: "regular_night", average_hours: 8 },
};

function buildProgram(intake) {
  return buildMasterEngineV2({
    intake,
    evaluationContext: EVAL_CTX,
    nutritionFoodCatalog: CATALOG,
    options: {},
  });
}

function pipelineMeals(program) {
  return program.nutrition_program.stages?.portion_solver?.meals || [];
}

function culinaryMeals(program) {
  return program.nutrition_program.culinary_meals || [];
}

const PIPELINE_CAPS = {
  TOMATO_RED_RAW: 150,
  CUCUMBER_WITH_PEEL_RAW: 150,
  CARROT_RAW: 100,
  RICE_WHITE_LONG_GRAIN_COOKED: 250,
  POTATO_BOILED_WITHOUT_SKIN: 250,
  OATS_ROLLED_DRY: 80,
};

test("pipeline meals never serve one food over its realistic per-meal cap (C06 + C13)", () => {
  for (const [name, intake] of [["C06", C06_INTAKE], ["C13", C13_INTAKE]]) {
    const meals = pipelineMeals(buildProgram(intake));
    assert.ok(meals.length > 0, `${name}: expected pipeline meals`);
    for (const meal of meals) {
      for (const item of meal.items || []) {
        const cap = PIPELINE_CAPS[item.food_code];
        if (cap !== undefined) {
          assert.ok(
            item.grams <= cap,
            `${name} meal ${meal.sequence} (${meal.selected_pattern_code}): ${item.food_code} ${item.grams} g over cap ${cap} g`,
          );
        }
      }
    }
  }
});

test("a capped breakfast rebalances with a second starch and keeps every nutrient it already had (C06)", () => {
  // Meal variety (Package 5): C06's breakfast targets 104 g carbs, but its
  // oats are capped at 80 g and the breakfast starch candidates are oats
  // and bread only. The solver adds bread as a supplement — and the trial
  // search protects the nutrients already in tolerance, so it lands on
  // bread 75 g with oats 50 g (not bread 100 g, which would fix the carbs
  // and break the fiber). Calories come back inside tolerance; only the
  // carbohydrate target stays out, because 104 g cannot be served with
  // oats and bread alone inside the fiber band — that ceiling belongs to
  // the breakfast starch candidates, not to the portion solver.
  const meals = pipelineMeals(buildProgram(C06_INTAKE));
  const breakfast = meals.find((m) => m.role === "BREAKFAST");
  assert.ok(breakfast, "C06: expected a breakfast meal");
  const bread = (breakfast.items || []).find((i) => i.food_code === "BREAD_WHOLE_WHEAT");
  assert.ok(bread, "C06 breakfast: expected a bread supplement");
  assert.equal(bread.selection_source, "PORTION_SOLVER_ADDITION");
  assert.equal(breakfast.within_tolerance?.calories_kcal, true, `C06 breakfast: kcal ${JSON.stringify(breakfast.totals)} vs target ${JSON.stringify(breakfast.target)}`);
  assert.equal(breakfast.within_tolerance?.fiber_g, true, `C06 breakfast: fiber ${JSON.stringify(breakfast.totals)} vs target ${JSON.stringify(breakfast.target)}`);
  assert.equal(breakfast.within_tolerance?.protein_g, true);
  assert.equal(breakfast.within_tolerance?.fat_g, true);
});

test("a yogurt snack never carries olive oil, and still holds its calories (C06 + C13)", () => {
  for (const [name, intake] of [["C06", C06_INTAKE], ["C13", C13_INTAKE]]) {
    const meals = pipelineMeals(buildProgram(intake));
    const snacks = meals.filter((m) => m.role === "SNACK");
    assert.ok(snacks.length > 0, `${name}: expected a snack meal`);
    for (const snack of snacks) {
      const codes = (snack.items || []).map((i) => i.food_code);
      const hasYogurt = codes.some((c) => c.includes("YOGURT"));
      if (hasYogurt) {
        assert.ok(!codes.includes("OLIVE_OIL"), `${name} snack ${snack.sequence}: olive oil in a yogurt snack`);
      }
      const kcal = (snack.items || []).reduce((s, i) => s + (i.nutrition?.calories_kcal || 0), 0);
      const target = snack.target?.planned_calories || 0;
      assert.ok(
        Math.abs(kcal - target) / target < 0.15,
        `${name} snack ${snack.sequence}: ${kcal} kcal vs target ${target} kcal (rebalance, not truncation)`,
      );
    }
  }
});

test("a capped high-carb main meal rebalances with a second starch instead of serving an under-target meal (C06)", () => {
  // Meal variety (Package 5): C06's main meal targets 124 g carbs, but its
  // rice is capped at 250 g (70 g carbs) and its vegetables are capped too,
  // so the optimizer alone lands at 92 g carbs / 6.7 g fiber — under target.
  // The solver must rebalance with another food (a second starch from the
  // slot's own candidate list), not serve the short meal and not breach a cap.
  const meals = pipelineMeals(buildProgram(C06_INTAKE));
  const main = meals.find((m) => m.role === "MAIN_MEAL");
  assert.ok(main, "C06: expected a main meal");
  assert.equal(main.within_tolerance?.carbohydrate_g, true, `C06 main: carbs ${JSON.stringify(main.totals)} vs target ${JSON.stringify(main.target)}`);
  assert.equal(main.within_tolerance?.fiber_g, true, `C06 main: fiber ${JSON.stringify(main.totals)} vs target ${JSON.stringify(main.target)}`);
  const starches = new Set((main.items || []).map((i) => i.food_code));
  assert.ok(starches.size >= 2, `C06 main: expected a second starch to rebalance, got ${[...starches].join(", ")}`);
  for (const item of main.items || []) {
    const cap = PIPELINE_CAPS[item.food_code];
    if (cap !== undefined) assert.ok(item.grams <= cap, `C06 main: ${item.food_code} ${item.grams} g over cap ${cap} g`);
  }
});

test("the culinary splitter folds a crumb back only within the limit, never 10 g over it (C14 basmati 257 g)", () => {
  // Meal variety (Package 5): C14's meal 2 serves 257 g basmati against a
  // 250 g limit. The split leaves a 7 g crumb of the next swap; folding it
  // back used to be allowed up to limit + 10 g, which served 257 g. A fold
  // must respect the limit strictly — the crumb becomes a real part instead.
  const rice = { food_code: "BASMATI_RICE", category: "CARBS", portion_g: 257, protein_g: 7, carb_g: 72, fat_g: 1, calories_kcal: 334,
    swaps: [{ food_code: "KABSA_SPICED_RICE", equivalent_grams: 257, protein_g: 7, carb_g: 72, fat_g: 1, calories_kcal: 334 }] };
  const [meal] = splitOversizedPortions([{ items: [rice] }], carbPortionLimit({ diabetic: false }));
  assert.ok(meal.items.every((i) => i.portion_g <= 250), meal.items.map((i) => `${i.food_code} ${i.portion_g}`).join(", "));
  assert.ok(meal.items.length >= 2, `expected the crumb to become a real part, got ${meal.items.map((i) => `${i.food_code} ${i.portion_g}`).join(", ")}`);
  assert.ok(Math.abs(meal.items.reduce((s, i) => s + i.carb_g, 0) - 72) <= 2);
});

test("culinary meals never serve basmati over 250 g or baladi bread over 180 g (C06 + C13)", () => {
  for (const [name, intake] of [["C06", C06_INTAKE], ["C13", C13_INTAKE]]) {
    const meals = culinaryMeals(buildProgram(intake));
    assert.ok(meals.length > 0, `${name}: expected culinary meals`);
    for (const meal of meals) {
      for (const item of meal.items || []) {
        if (item.food_code === "BASMATI_RICE") {
          assert.ok(item.portion_g <= 250, `${name} meal ${meal.meal_number}: basmati ${item.portion_g} g over 250 g`);
        }
        if (item.food_code === "BALADI_BREAD") {
          assert.ok(item.portion_g <= 180, `${name} meal ${meal.meal_number}: baladi bread ${item.portion_g} g over 180 g`);
        }
      }
    }
  }
});

test("carbPortionLimit caps rice at 250 g and baladi bread at 180 g, leaves the rest at 400 g", () => {
  const limit = carbPortionLimit({ diabetic: false });
  assert.equal(limit("BASMATI_RICE"), 250);
  assert.equal(limit("EGYPTIAN_RICE"), 250);
  assert.equal(limit("KABSA_SPICED_RICE"), 250);
  assert.equal(limit("BALADI_BREAD"), 180);
  assert.equal(limit("SWEET_POTATO"), 400);
  assert.equal(limit("WHOLE_WHEAT_PASTA"), 400);
  const diabeticLimit = carbPortionLimit({ diabetic: true });
  assert.equal(diabeticLimit("POTATO"), 200);
});

test("the culinary splitter honours the per-food caps and keeps the meal's macros", () => {
  const rice = { food_code: "BASMATI_RICE", category: "CARBS", portion_g: 404, protein_g: 11, carb_g: 113, fat_g: 1, calories_kcal: 526,
    swaps: [{ food_code: "WHOLE_WHEAT_PASTA", equivalent_grams: 400, protein_g: 20, carb_g: 113, fat_g: 3, calories_kcal: 560 }] };
  const [meal] = splitOversizedPortions([{ items: [rice] }], carbPortionLimit({ diabetic: false }));
  assert.ok(meal.items.every((i) => i.portion_g <= 250), meal.items.map((i) => `${i.food_code} ${i.portion_g}`).join(", "));
  assert.ok(Math.abs(meal.items.reduce((s, i) => s + i.carb_g, 0) - 113) <= 2);

  const bread = { food_code: "BALADI_BREAD", category: "CARBS", portion_g: 242, protein_g: 22, carb_g: 126, fat_g: 2, calories_kcal: 629,
    swaps: [{ food_code: "BROWN_TOAST", equivalent_grams: 200, protein_g: 20, carb_g: 126, fat_g: 4, calories_kcal: 600 }] };
  const [breadMeal] = splitOversizedPortions([{ items: [bread] }], carbPortionLimit({ diabetic: false }));
  assert.ok(breadMeal.items.every((i) => i.portion_g <= 180), breadMeal.items.map((i) => `${i.food_code} ${i.portion_g}`).join(", "));
  assert.ok(Math.abs(breadMeal.items.reduce((s, i) => s + i.carb_g, 0) - 126) <= 2);
});

test("sanitize caps cooked rice at 250 g like the other ergonomic caps", () => {
  const rawPlan = {
    meals: [
      {
        sequence: 2,
        role: "MAIN_MEAL",
        items: [
          { food_code: "CHICKEN_BREAST_ROASTED_SKINLESS", grams: 150 },
          { food_code: "RICE_WHITE_LONG_GRAIN_COOKED", grams: 350 },
        ],
      },
    ],
  };
  const sanitized = sanitizeMealPlan(rawPlan);
  const rice = sanitized.meals[0].items.find((i) => i.food_code === "RICE_WHITE_LONG_GRAIN_COOKED");
  assert.equal(rice.grams, 250);
});

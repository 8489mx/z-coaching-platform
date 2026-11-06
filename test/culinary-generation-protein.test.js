import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildCulinaryRecipeMeals,
  trimMealsToTarget,
} from "../src/nutrition-meal-context-v2/build-culinary-meals.js";
import {
  reconcileDayCaloriesToTarget,
  splitOversizedProteinPortions,
} from "../src/nutrition-meal-context-v2/culinary-portion-passes.js";
import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";

/**
 * Batch 1, Agent B — LO-1 Alt 2 (generation under-serves protein) + HO-4
 * (meal-level kcal see-saw) + HO-8 (breakfast protein stacking).
 *
 * Fail-first: every test below fails on the base head and passes with the fix.
 * The C02-like CASE D plate is the reference: 4 meals, 2390 kcal, P209/C258/F58.
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"));

const C02_DISTRIBUTION = [
  { meal_number: 1, meal_name: "وجبة 1", protein_g: 59, carb_g: 73, fat_g: 16, calories_kcal: 676 },
  { meal_number: 2, meal_name: "وجبة 2", protein_g: 59, carb_g: 73, fat_g: 16, calories_kcal: 676 },
  { meal_number: 3, meal_name: "وجبة 3", protein_g: 59, carb_g: 73, fat_g: 16, calories_kcal: 676 },
  { meal_number: 4, meal_name: "وجبة 4", protein_g: 32, carb_g: 39, fat_g: 9, calories_kcal: 361 },
];

const plainIntake = (conditions = []) => ({
  nutrition: {},
  medical: { conditions: conditions.map((conditionCode) => ({ conditionCode })) },
  training: { experience: "INTERMEDIATE" },
});

const sum = (meals, key) => meals.reduce(
  (total, meal) => total + (meal.items || []).reduce((s, item) => s + (Number(item[key]) || 0), 0),
  0,
);
const mealSum = (meal, key) => (meal.items || []).reduce((s, item) => s + (Number(item[key]) || 0), 0);
const breakfastOf = (meals) => meals.find((meal) => meal.meal_number === 1);
const proteinCodesOf = (meal) => [...new Set(
  (meal.items || []).filter((item) => String(item.category).toUpperCase() === "PROTEIN").map((item) => item.food_code),
)];

test("Alt 2: generation serves day protein at its target for a C02-like CASE D plate", () => {
  const meals = buildCulinaryRecipeMeals({ meal_distribution: C02_DISTRIBUTION }, plainIntake());
  const protein = sum(meals, "protein_g");
  assert.ok(Math.abs(protein - 209) <= 3, `day protein ${protein} for target 209`);
});

test("Alt 2: generation serves breakfast protein at its target for a C02-like CASE D plate", () => {
  const meals = buildCulinaryRecipeMeals({ meal_distribution: C02_DISTRIBUTION }, plainIntake());
  const breakfast = breakfastOf(meals);
  const protein = mealSum(breakfast, "protein_g");
  assert.ok(Math.abs(protein - 59) <= 3, `breakfast protein ${protein} for target 59`);
});

test("Alt 2: a 3-egg breakfast with a small protein remainder gets the egg-white bridge", () => {
  const meals = buildCulinaryRecipeMeals({ meal_distribution: C02_DISTRIBUTION }, plainIntake());
  const breakfast = breakfastOf(meals);
  const codes = (breakfast.items || []).map((item) => item.food_code);
  assert.ok(codes.includes("EGG_WHITE_COOKED"), `breakfast has no egg-white bridge: ${codes.join(", ")}`);
  assert.ok(!codes.includes("EGG_WHOLE_HARD_BOILED"), `bridge must be whites, not a whole boiled egg: ${codes.join(", ")}`);
  const whites = breakfast.items.find((item) => item.food_code === "EGG_WHITE_COOKED");
  assert.equal(whites.portion_g, 66, `bridge must be 2 whites (66g): ${whites.portion_g}g`);
});

test("Alt 2: the egg-white bridge still fires for high cholesterol (whites carry no yolk, so the H8 whole-egg cap does not apply)", () => {
  const meals = buildCulinaryRecipeMeals({ meal_distribution: C02_DISTRIBUTION }, plainIntake(["HIGH_CHOLESTEROL"]));
  const breakfast = breakfastOf(meals);
  const codes = (breakfast.items || []).map((item) => item.food_code);
  assert.ok(!codes.includes("EGG_WHOLE_HARD_BOILED"), `high-cholesterol breakfast must not add a whole boiled egg: ${codes.join(", ")}`);
  assert.ok(codes.includes("EGG_WHITE_COOKED"), `high-cholesterol breakfast may still bridge with whites: ${codes.join(", ")}`);
  const protein = mealSum(breakfast, "protein_g");
  assert.ok(Math.abs(protein - 59) <= 3, `high-cholesterol breakfast protein ${protein} for target 59`);
});

test("Trim re-add never scales an item past its portion cap", () => {
  const meal = {
    meal_number: 1,
    target_macros: { protein_g: 59, carb_g: 73, fat_g: 16, calories_kcal: 676 },
    items: [
      { food_code: "EGGS_OMELETTE", category: "PROTEIN", portion_g: 165, protein_g: 20, carb_g: 1, fat_g: 15, calories_kcal: 215, swaps: [] },
      { food_code: "MEDITERRANEAN_SALAD", category: "VEGGIES", portion_g: 150, protein_g: 2, carb_g: 4, fat_g: 0, calories_kcal: 25, swaps: [] },
      { food_code: "COTTAGE_CHEESE", category: "PROTEIN", portion_g: 150, protein_g: 18, carb_g: 5, fat_g: 2, calories_kcal: 113, swaps: [] },
      { food_code: "BALADI_BREAD", category: "CARBS", portion_g: 121, protein_g: 11, carb_g: 63, fat_g: 1, calories_kcal: 315, swaps: [] },
    ],
  };
  const [trimmed] = trimMealsToTarget([meal]);
  const omelette = trimmed.items.find((item) => item.food_code === "EGGS_OMELETTE");
  const cottage = trimmed.items.find((item) => item.food_code === "COTTAGE_CHEESE");
  assert.ok(omelette.portion_g <= 165, `omelette scaled past its plate portion: ${omelette.portion_g}g`);
  assert.ok(cottage.portion_g <= 150, `cottage scaled past its 150g cap: ${cottage.portion_g}g`);
  assert.ok(
    (trimmed.trim_notes_ar || []).some((note) => /البروتين ناقص/.test(note)),
    "an unrestorable protein shortfall must be flagged, never silent",
  );
});

test("Trim re-add scales the leanest protein first, not the fattiest", () => {
  const meal = {
    meal_number: 1,
    target_macros: { protein_g: 43, carb_g: 100, fat_g: 16, calories_kcal: 545 },
    items: [
      { food_code: "EGGS_OMELETTE", category: "PROTEIN", portion_g: 100, protein_g: 12.1, carb_g: 1, fat_g: 9.1, calories_kcal: 130, swaps: [] },
      { food_code: "COTTAGE_CHEESE", category: "PROTEIN", portion_g: 100, protein_g: 12, carb_g: 3, fat_g: 1.5, calories_kcal: 75, swaps: [] },
      { food_code: "BALADI_BREAD", category: "CARBS", portion_g: 121, protein_g: 11, carb_g: 63, fat_g: 1, calories_kcal: 315, swaps: [] },
      { food_code: "MEDITERRANEAN_SALAD", category: "VEGGIES", portion_g: 150, protein_g: 2, carb_g: 4, fat_g: 0, calories_kcal: 25, swaps: [] },
    ],
  };
  const [trimmed] = trimMealsToTarget([meal]);
  const omelette = trimmed.items.find((item) => item.food_code === "EGGS_OMELETTE");
  const cottage = trimmed.items.find((item) => item.food_code === "COTTAGE_CHEESE");
  assert.ok(cottage.portion_g > 100, `lean cottage was not scaled up: ${cottage.portion_g}g`);
  assert.ok(cottage.portion_g <= 150, `cottage scaled past its 150g cap: ${cottage.portion_g}g`);
  assert.ok(omelette.portion_g <= 100, `fatty omelette was scaled before the lean cottage: ${omelette.portion_g}g`);
});

test("Split keeps a 3-egg omelette whole and still splits a truly oversized one", () => {
  const shakshoukaSwap = {
    food_code: "SHAKSHOUKA_EGGS", name_ar: "شكشوكة", name_en: "Shakshouka",
    equivalent_grams: 47, protein_g: 5.1, carb_g: 1.4, fat_g: 3.7, calories_kcal: 61,
  };
  const normal = [{
    meal_number: 1,
    items: [
      { food_code: "EGGS_OMELETTE", category: "PROTEIN", portion_g: 165, protein_g: 20, carb_g: 1, fat_g: 15, calories_kcal: 215, swaps: [shakshoukaSwap] },
      { food_code: "COTTAGE_CHEESE", category: "PROTEIN", portion_g: 150, protein_g: 18, carb_g: 5, fat_g: 2, calories_kcal: 113, swaps: [] },
    ],
  }];
  const [kept] = splitOversizedProteinPortions(normal);
  assert.ok(!kept.items.some((item) => item.food_code === "SHAKSHOUKA_EGGS"), "a 3-egg omelette must not be split into a second egg dish");
  assert.equal(kept.items.find((item) => item.food_code === "EGGS_OMELETTE").portion_g, 165);

  const oversized = [{
    meal_number: 1,
    items: [
      { food_code: "EGGS_OMELETTE", category: "PROTEIN", portion_g: 280, protein_g: 33.6, carb_g: 1.7, fat_g: 25.5, calories_kcal: 364, swaps: [shakshoukaSwap] },
      { food_code: "COTTAGE_CHEESE", category: "PROTEIN", portion_g: 150, protein_g: 18, carb_g: 5, fat_g: 2, calories_kcal: 113, swaps: [] },
    ],
  }];
  const [split] = splitOversizedProteinPortions(oversized);
  assert.equal(split.items.find((item) => item.food_code === "EGGS_OMELETTE").portion_g, 165, "an oversized omelette is cut to the 3-egg cap");
  assert.ok(split.items.some((item) => item.food_code === "SHAKSHOUKA_EGGS"), "an oversized omelette still splits its excess into a partner");
});

test("Reconcile cuts over-target meals before under-target meals (HO-4 see-saw)", () => {
  const rice = (grams) => ({
    food_code: "BASMATI_RICE", category: "CARBS", portion_g: grams,
    protein_g: +(grams * 0.028).toFixed(1), carb_g: +(grams * 0.28).toFixed(1),
    fat_g: +(grams * 0.004).toFixed(1), calories_kcal: Math.round(grams * 1.3), swaps: [],
  });
  const bread = (grams) => ({
    food_code: "BALADI_BREAD", category: "CARBS", portion_g: grams,
    protein_g: +(grams * 0.09).toFixed(1), carb_g: +(grams * 0.52).toFixed(1),
    fat_g: +(grams * 0.01).toFixed(1), calories_kcal: Math.round(grams * 2.6), swaps: [],
  });
  const chicken = (grams) => ({
    food_code: "CHICKEN_BREAST", category: "PROTEIN", portion_g: grams,
    protein_g: +(grams * 0.31).toFixed(1), carb_g: 0,
    fat_g: +(grams * 0.03).toFixed(1), calories_kcal: Math.round(grams * 1.65), swaps: [],
  });
  const oil = (grams) => ({
    food_code: "OLIVE_OIL", category: "FATS", portion_g: grams,
    protein_g: 0, carb_g: 0, fat_g: grams, calories_kcal: grams * 9, swaps: [],
  });
  // Served: m1 659 (+60 over), m2 625 (+30 over), m3 555 (-40 under); day 1839, drift +39.
  // Meal 3 holds the LARGEST single donor (300 g rice), so the legacy
  // largest-first order guts the one meal that is already under target.
  const raw = [
    [chicken(100), rice(200), bread(90)],
    [chicken(100), rice(250), oil(15)],
    [chicken(100), rice(300)],
  ];
  const deltas = [60, 30, -40];
  const meals = raw.map((items, index) => {
    const served = items.reduce((s, item) => s + (Number(item.calories_kcal) || 0), 0);
    const protein = items.reduce((s, item) => s + (Number(item.protein_g) || 0), 0);
    const carbs = items.reduce((s, item) => s + (Number(item.carb_g) || 0), 0);
    const fat = items.reduce((s, item) => s + (Number(item.fat_g) || 0), 0);
    return {
      meal_number: index + 1,
      target_macros: {
        protein_g: +protein.toFixed(1), carb_g: +carbs.toFixed(1), fat_g: +fat.toFixed(1),
        calories_kcal: served - deltas[index],
      },
      items,
    };
  });
  const dayTarget = meals.reduce((s, meal) => s + meal.target_macros.calories_kcal, 0);
  const servedBefore = meals.map((meal) => mealSum(meal, "calories_kcal"));
  const dayBefore = servedBefore.reduce((a, b) => a + b, 0);
  assert.ok(dayBefore - dayTarget > 30, `fixture drift must exceed tolerance: ${dayBefore} vs ${dayTarget}`);
  const fixed = reconcileDayCaloriesToTarget(meals, dayTarget);
  const servedAfter = fixed.map((meal) => mealSum(meal, "calories_kcal"));
  const dayAfter = servedAfter.reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(dayAfter - dayTarget) <= 30, `day ${dayAfter} for target ${dayTarget}`);
  assert.equal(servedAfter[2], servedBefore[2], `under-target meal 3 must not be cut: ${servedBefore[2]} -> ${servedAfter[2]}`);
  assert.ok(servedAfter[0] < servedBefore[0], "over-target meal 1 must absorb the cut");
  assert.ok(servedAfter[1] < servedBefore[1], "over-target meal 2 must absorb the cut");
});

test("Reconcile prefers oil over starch when protein is short and fat is over", () => {
  const rice = (grams) => ({
    food_code: "BASMATI_RICE", category: "CARBS", portion_g: grams,
    protein_g: +(grams * 0.028).toFixed(1), carb_g: +(grams * 0.28).toFixed(1),
    fat_g: +(grams * 0.004).toFixed(1), calories_kcal: Math.round(grams * 1.3), swaps: [],
  });
  const oil = (grams) => ({
    food_code: "OLIVE_OIL", category: "FATS", portion_g: grams,
    protein_g: 0, carb_g: 0, fat_g: grams, calories_kcal: grams * 9, swaps: [],
  });
  const chicken = (grams) => ({
    food_code: "CHICKEN_BREAST", category: "PROTEIN", portion_g: grams,
    protein_g: +(grams * 0.31).toFixed(1), carb_g: 0,
    fat_g: +(grams * 0.03).toFixed(1), calories_kcal: Math.round(grams * 1.65), swaps: [],
  });
  const meals = [{
    meal_number: 1,
    target_macros: { protein_g: 60, carb_g: 70, fat_g: 15, calories_kcal: 650 },
    items: [chicken(150), rice(200), oil(20)],
  }];
  const proteinBefore = sum(meals, "protein_g");
  const dayBefore = sum(meals, "calories_kcal");
  assert.ok(dayBefore - 650 > 30, `fixture drift must exceed tolerance: ${dayBefore}`);
  const [fixed] = reconcileDayCaloriesToTarget(meals, 650);
  const oilAfter = fixed.items.find((item) => item.food_code === "OLIVE_OIL");
  const riceAfter = fixed.items.find((item) => item.food_code === "BASMATI_RICE");
  const proteinAfter = sum([fixed], "protein_g");
  const dayAfter = sum([fixed], "calories_kcal");
  assert.ok(Math.abs(dayAfter - 650) <= 30, `day ${dayAfter} for target 650`);
  assert.ok(oilAfter.portion_g < 20, `oil must be cut before starch: ${oilAfter.portion_g}g`);
  assert.equal(riceAfter.portion_g, 200, `starch must not be touched while oil room covers the drift: rice ${riceAfter.portion_g}g`);
  assert.ok(proteinAfter >= proteinBefore - 1.5, `protein shortfall must not be worsened by starch cuts: ${proteinBefore} -> ${proteinAfter}`);
});

const c02Plan = () => buildMasterEngineV2({
  // The intake is shaped exactly like the matrix runner's C02 buildIntake
  // (top-level waist_cm, no neck circumference, selected: []): that shape
  // produces the matrix targets 2390 kcal / P209 / C258 / F58.
  intake: {
    gender: "male", age: "28", height_cm: "178", weight_kg: "95", waist_cm: "102",
    primary_goal: "fat_loss", neat_level: "moderate", occupation_type: "DESK_OFFICE",
    dangerous_symptoms: ["NONE"],
    medical_conditions: { has_conditions: false, selected: [] },
    injuries_map: { has_injuries: true, selected_areas: ["knee"], pain_level: 6 },
    injury_severity: "MODERATE",
    religion: "MUSLIM", strict_allergies: [],
    meal_structure: { meals_count: "4_meals", intermittent_fasting: "none" },
    training_environment: "commercial_gym",
    training_logistics: { days_per_week: 5, experience_level: "INTERMEDIATE" },
    recent_training: "ACTIVE",
    cardio: { walkingAbility: "EASY", averageDailySteps: 11000, maxSessionsPerWeek: 2, maxDurationMinutes: 30 },
    sleep_hours: 7, sleep_schedule: { pattern: "regular_night", average_hours: 7 },
  },
  evaluationContext: { system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" },
  nutritionFoodCatalog: CATALOG,
  options: {},
}).nutrition_program;

test("HO-4 end-to-end: every C02-like meal lands within 30 kcal of its own target", () => {
  const program = c02Plan();
  const dayTarget = 2390;
  const day = sum(program.culinary_meals, "calories_kcal");
  assert.ok(Math.abs(day - dayTarget) <= 30, `day ${day} for target ${dayTarget}`);
  for (const meal of program.culinary_meals) {
    const target = Number(meal.target_macros?.calories_kcal);
    const actual = mealSum(meal, "calories_kcal");
    assert.ok(Math.abs(actual - target) <= 30, `meal ${meal.meal_number}: ${actual} for target ${target}`);
    assert.ok(Math.abs(actual - target) <= Math.max(30, target * 0.1), `meal ${meal.meal_number} over 10%: ${actual} for ${target}`);
  }
});

test("HO-8 end-to-end: a C02-like breakfast stacks at most 3 protein foods", () => {
  const program = c02Plan();
  const breakfast = breakfastOf(program.culinary_meals);
  const codes = proteinCodesOf(breakfast);
  assert.ok(codes.length <= 3, `breakfast stacks ${codes.length} protein foods: ${codes.join(", ")}`);
});

test("Alt 2 end-to-end: a C02-like day lands its protein and carbs, not just its calories", () => {
  const program = c02Plan();
  const protein = sum(program.culinary_meals, "protein_g");
  const carbs = sum(program.culinary_meals, "carb_g");
  assert.ok(Math.abs(protein - 209) <= 5, `day protein ${protein} for target 209`);
  assert.ok(Math.abs(carbs - 258) <= 258 * 0.05, `day carbs ${carbs} for target 258`);
});

// F5 (HO-4): the generator must never serve a 1-4 g olive-oil portion —
// dropTokenPortions removes any oil below 5 g, so a 3-4 g serving silently
// loses its fat and its kcal (C07 breakfast: 3 g oil, -27 kcal at meal 1).
// A 3-4 g remainder is clamped up to the 5 g minimum real portion; a 1-2 g
// remainder is skipped entirely. Fail-first: on the base head the C07-like
// breakfast below serves a 3 g oil.
test("HO-4: generation never serves a 1-4 g olive-oil portion", () => {
  const c07LikeDistribution = [
    { meal_number: 1, meal_name: "وجبة 1", protein_g: 46, carb_g: 34, fat_g: 15, calories_kcal: 456 },
    { meal_number: 2, meal_name: "وجبة 2", protein_g: 59, carb_g: 73, fat_g: 16, calories_kcal: 676 },
    { meal_number: 3, meal_name: "وجبة 3", protein_g: 59, carb_g: 73, fat_g: 16, calories_kcal: 676 },
    { meal_number: 4, meal_name: "وجبة 4", protein_g: 32, carb_g: 39, fat_g: 9, calories_kcal: 361 },
  ];
  const intake = { nutrition: { allergies: ["GLUTEN"] }, medical: { conditions: [] }, training: { experience: "INTERMEDIATE" } };
  const meals = buildCulinaryRecipeMeals({ meal_distribution: c07LikeDistribution }, intake);
  for (const meal of meals) {
    for (const item of meal.items || []) {
      if (item.food_code !== "OLIVE_OIL") continue;
      assert.ok(item.portion_g === 0 || item.portion_g >= 5,
        `meal ${meal.meal_number}: oil ${item.portion_g}g is below the 5 g minimum real portion`);
    }
  }
  const breakfast = breakfastOf(meals);
  const oil = (breakfast.items || []).find((item) => item.food_code === "OLIVE_OIL");
  assert.ok(oil && oil.portion_g === 5, `C07-like breakfast oil must be clamped to 5 g, got ${oil ? `${oil.portion_g}g` : "no oil"}`);
});

// F6 (HO-4): the trim's protein re-add is fat-aware. Scaling the omelette
// up to restore protein drags its fat along, and the second trim round's
// fat pass then cuts the omelette back down — and shaves the olive oil with
// it, one gram per trim call, until dropTokenPortions removes it entirely.
// A re-add the fat cannot afford must be skipped (and flagged), not paid
// for with the oil. Fail-first: on the pre-fix code one trim call takes the
// oil 5 g -> 4 g and the omelette 110 g -> 111 g while protein stays -4 g.
test("HO-4: the trim re-add never shaves the olive oil to pay for protein", () => {
  const item = (code, grams, protein, carb, fat, kcal, category) => ({
    food_code: code, name_ar: code, name_en: code, category,
    portion_g: grams, household_measurement: `${grams} جم`,
    protein_g: protein, carb_g: carb, fat_g: fat, calories_kcal: kcal, swaps: [],
  });
  const meal = {
    meal_number: 1,
    target_macros: { protein_g: 46, carb_g: 34, fat_g: 15, calories_kcal: 456 },
    items: [
      item("EGGS_OMELETTE", 110, 13, 1, 10, 142, "PROTEIN"),
      item("MEDITERRANEAN_SALAD", 150, 2, 4, 0, 25, "VEGGIES"),
      item("COTTAGE_CHEESE", 150, 18, 5, 2, 113, "PROTEIN"),
      item("ROASTED_POTATOES", 120, 2, 24, 0, 108, "CARBS"),
      item("EGG_WHITE_COOKED", 66, 7.1, 1.6, 0, 34, "PROTEIN"),
      item("OLIVE_OIL", 5, 0, 0, 5, 45, "FATS"),
    ],
  };
  const [trimmed] = trimMealsToTarget([meal]);
  const oil = trimmed.items.find((entry) => entry.food_code === "OLIVE_OIL");
  const omelette = trimmed.items.find((entry) => entry.food_code === "EGGS_OMELETTE");
  assert.equal(oil.portion_g, 5, `oil must survive the trim intact: ${oil.portion_g}g`);
  assert.equal(omelette.portion_g, 110, `omelette must not be scaled up and cut back: ${omelette.portion_g}g`);
  assert.ok((trimmed.trim_notes_ar || []).some((note) => note.includes("البروتين ناقص 4 جم")),
    `the unrestorable protein shortfall must be flagged: ${JSON.stringify(trimmed.trim_notes_ar)}`);
});

// Regression guard for F6: the fat-aware cap must not disable the re-add
// when the fat headroom can afford it — without any oil on the plate the
// same shortfall still scales the omelette 110 g -> ~144 g.
test("HO-4: the re-add still restores protein when the fat headroom allows it", () => {
  const item = (code, grams, protein, carb, fat, kcal, category) => ({
    food_code: code, name_ar: code, name_en: code, category,
    portion_g: grams, household_measurement: `${grams} جم`,
    protein_g: protein, carb_g: carb, fat_g: fat, calories_kcal: kcal, swaps: [],
  });
  const meal = {
    meal_number: 1,
    target_macros: { protein_g: 46, carb_g: 34, fat_g: 15, calories_kcal: 456 },
    items: [
      item("EGGS_OMELETTE", 110, 13, 1, 10, 142, "PROTEIN"),
      item("MEDITERRANEAN_SALAD", 150, 2, 4, 0, 25, "VEGGIES"),
      item("COTTAGE_CHEESE", 150, 18, 5, 2, 113, "PROTEIN"),
      item("ROASTED_POTATOES", 120, 2, 24, 0, 108, "CARBS"),
      item("EGG_WHITE_COOKED", 66, 7.1, 1.6, 0, 34, "PROTEIN"),
    ],
  };
  const [trimmed] = trimMealsToTarget([meal]);
  const omelette = trimmed.items.find((entry) => entry.food_code === "EGGS_OMELETTE");
  assert.ok(omelette.portion_g >= 140, `omelette must scale up when fat allows: ${omelette.portion_g}g`);
  assert.ok(Math.abs(mealSum(trimmed, "protein_g") - 46) <= 3, `protein must land near target: ${mealSum(trimmed, "protein_g")}g`);
});

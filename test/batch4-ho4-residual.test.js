import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { reconcileDayCaloriesToTarget } from "../src/nutrition-meal-context-v2/culinary-portion-passes.js";
import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";

/**
 * Batch 4, B4-3 — B2-4 HO-4 residual: per-meal outliers + snack sweet-potato
 * minimum. Fail-first: every test below fails on the base head and passes
 * with the fix.
 *
 * The defect (re-probed on the 20-client matrix at base 2f19675b): 6
 * per-meal outliers while every day total sits within +/-26 kcal, so the
 * day reconciliation (which fires only when |day drift| > 30) never runs:
 * C07 m4 -35, C19 m4 -34, C13 m2 -43 / m3 +38, C20 m2 +33, C09 m4 -29.
 * The 3 snack outliers are generation-side (the snack builder sizes a
 * ~39 g sweet potato that dropTokenPortions deletes as below the 50 g
 * real-portion minimum); the 3 main-meal outliers are fixed by a per-meal
 * reconcile pass in culinary-portion-passes.js. One snack, C09, is the
 * exception: her snack carb target (15 g) cannot hold a 50 g potato
 * (10 g carbs) next to the yogurt (7 g), so the trim cuts it back below
 * the minimum and the token pass deletes it — the carb gate leaves her
 * snack at its base value instead of making it worse, and her -29 is
 * filed for batch 5 (portion solver / meal distribution).
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"));

const mealSum = (meal, key) => (meal.items || []).reduce((s, item) => s + (Number(item[key]) || 0), 0);
const daySum = (meals, key) => meals.reduce((s, meal) => s + mealSum(meal, key), 0);
// A meal is an outlier when it sits further from its own target than the
// smaller of 30 kcal and 10% of that meal's target.
const mealThreshold = (targetKcal) => Math.min(30, targetKcal * 0.1);
const assertMealOnTarget = (meal) => {
  const target = Number(meal.target_macros.calories_kcal);
  const actual = mealSum(meal, "calories_kcal");
  assert.ok(
    Math.abs(actual - target) <= mealThreshold(target),
    `meal ${meal.meal_number}: ${actual} for target ${target} (threshold ${mealThreshold(target)})`,
  );
};

const rice = (grams) => ({
  food_code: "BASMATI_RICE", category: "CARBS", portion_g: grams,
  protein_g: +(grams * 0.028).toFixed(1), carb_g: +(grams * 0.28).toFixed(1),
  fat_g: +(grams * 0.004).toFixed(1), calories_kcal: Math.round(grams * 1.3), swaps: [],
});
const pasta = (grams) => ({
  food_code: "WHOLE_WHEAT_PASTA", category: "CARBS", portion_g: grams,
  protein_g: +(grams * 0.06).toFixed(1), carb_g: +(grams * 0.30).toFixed(1),
  fat_g: +(grams * 0.017).toFixed(1), calories_kcal: Math.round(grams * 1.6), swaps: [],
});
const bread = (grams) => ({
  food_code: "BALADI_BREAD", category: "CARBS", portion_g: grams,
  protein_g: +(grams * 0.09).toFixed(1), carb_g: +(grams * 0.52).toFixed(1),
  fat_g: +(grams * 0.01).toFixed(1), calories_kcal: Math.round(grams * 2.6), swaps: [],
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
const legumeStew = (grams) => ({
  food_code: "MIXED_LEGUMES_STEW", category: "PROTEIN", portion_g: grams,
  protein_g: +(grams * 0.09).toFixed(1), carb_g: +(grams * 0.20).toFixed(1),
  fat_g: +(grams * 0.015).toFixed(1), calories_kcal: Math.round(grams * 1.3), swaps: [],
});
const veggies = (grams) => ({
  food_code: "SAUTEED_VEGGIES", category: "VEGETABLES", portion_g: grams,
  protein_g: +(grams * 0.013).toFixed(1), carb_g: +(grams * 0.027).toFixed(1),
  fat_g: 0, calories_kcal: Math.round(grams * 0.17), swaps: [],
});

test("B4-3 Option A: an under-target main meal is topped up when the day looks fine (C13 m2 -43)", () => {
  // Day drift -18 (inside +/-30, so the day pass never fires) while meal 2
  // sits -43 under its own 737 target — the exact shape of the re-probe.
  const m1 = {
    meal_number: 1,
    target_macros: { protein_g: 43.5, carb_g: 96, fat_g: 4.6, calories_kcal: 600 },
    items: [chicken(100), rice(200), bread(77)],
  };
  const m2 = {
    meal_number: 2,
    target_macros: { protein_g: 35, carb_g: 109, fat_g: 18, calories_kcal: 737 },
    items: [rice(168), pasta(146), legumeStew(167), veggies(150)],
  };
  const meals = [m1, m2];
  const dayTarget = 600 + 737;
  assert.ok(Math.abs(daySum(meals, "calories_kcal") - dayTarget) <= 30, "fixture day must look fine");
  assert.ok(Math.abs(mealSum(m2, "calories_kcal") - 737) > 30, "fixture meal 2 must start as an outlier");
  const fixed = reconcileDayCaloriesToTarget(meals, dayTarget);
  assertMealOnTarget(fixed[1]);
  assert.equal(mealSum(fixed[0], "calories_kcal"), mealSum(m1, "calories_kcal"), "meal 1 must not move");
  assert.ok(Math.abs(daySum(fixed, "calories_kcal") - dayTarget) <= 30, "day must stay within +/-30");
});

test("B4-3 Option A: an over-target main meal is shaved bread-first, not oil-first (C13 m3 +38)", () => {
  // Meal 3 is +38 over its 733 target with bread 173 g and oil 14 g. With
  // real carb targets the harm order ranks carb-heavy bread below oil, so
  // the shave must land in the bread and leave the oil (and the fat) alone.
  const m1 = {
    meal_number: 1,
    target_macros: { protein_g: 43.5, carb_g: 96, fat_g: 4.6, calories_kcal: 600 },
    items: [chicken(100), rice(200), bread(60)],
  };
  const m3 = {
    meal_number: 3,
    target_macros: { protein_g: 34, carb_g: 109, fat_g: 18, calories_kcal: 733 },
    items: [
      { food_code: "BALADI_BREAD", category: "CARBS", portion_g: 173, protein_g: 15.3, carb_g: 90.6, fat_g: 2, calories_kcal: 451, swaps: [] },
      { food_code: "TAMEES_BREAD_WHOLEWHEAT", category: "CARBS", portion_g: 20, protein_g: 2, carb_g: 11, fat_g: 0, calories_kcal: 57, swaps: [] },
      { food_code: "COTTAGE_CHEESE", category: "PROTEIN", portion_g: 150, protein_g: 15, carb_g: 4.5, fat_g: 2.2, calories_kcal: 112, swaps: [] },
      { food_code: "OLIVE_OIL", category: "FATS", portion_g: 14, protein_g: 0, carb_g: 0, fat_g: 14, calories_kcal: 126, swaps: [] },
      { food_code: "MEDITERRANEAN_SALAD", category: "VEGETABLES", portion_g: 150, protein_g: 2, carb_g: 4, fat_g: 0, calories_kcal: 25, swaps: [] },
    ],
  };
  const meals = [m1, m3];
  const dayTarget = 600 + 733;
  assert.ok(Math.abs(daySum(meals, "calories_kcal") - dayTarget) <= 30, "fixture day must look fine");
  const fixed = reconcileDayCaloriesToTarget(meals, dayTarget);
  assertMealOnTarget(fixed[1]);
  const breadAfter = fixed[1].items.find((item) => item.food_code === "BALADI_BREAD");
  const oilAfter = fixed[1].items.find((item) => item.food_code === "OLIVE_OIL");
  assert.ok(breadAfter.portion_g < 173, `bread must take the shave: ${breadAfter.portion_g}g`);
  assert.equal(oilAfter.portion_g, 14, `oil must not be cut while bread room covers the drift: ${oilAfter.portion_g}g`);
  assert.ok(Math.abs(daySum(fixed, "calories_kcal") - dayTarget) <= 30, "day must stay within +/-30");
});

test("B4-3 Option A: an over-target meal with an oil donor is shaved from the oil (C20 m2 +33)", () => {
  const m1 = {
    meal_number: 1,
    target_macros: { protein_g: 43.5, carb_g: 96, fat_g: 4.6, calories_kcal: 600 },
    items: [chicken(100), rice(200), bread(60)],
  };
  const m2 = {
    meal_number: 2,
    target_macros: { protein_g: 56, carb_g: 38, fat_g: 22, calories_kcal: 574 },
    items: [rice(121), chicken(165), oil(17), veggies(150)],
  };
  const meals = [m1, m2];
  const dayTarget = 600 + 574;
  assert.ok(Math.abs(daySum(meals, "calories_kcal") - dayTarget) <= 30, "fixture day must look fine");
  const fixed = reconcileDayCaloriesToTarget(meals, dayTarget);
  assertMealOnTarget(fixed[1]);
  const oilAfter = fixed[1].items.find((item) => item.food_code === "OLIVE_OIL");
  const riceAfter = fixed[1].items.find((item) => item.food_code === "BASMATI_RICE");
  assert.ok(oilAfter.portion_g < 17, `oil must take the shave: ${oilAfter.portion_g}g`);
  assert.equal(riceAfter.portion_g, 121, `rice must not be touched while oil room covers the drift: ${riceAfter.portion_g}g`);
  assert.ok(Math.abs(daySum(fixed, "calories_kcal") - dayTarget) <= 30, "day must stay within +/-30");
});

test("B4-3 Option A: a meal without targets is skipped, and a meal with no donors is left alone", () => {
  const m1 = {
    meal_number: 1,
    target_macros: { protein_g: 43.5, carb_g: 96, fat_g: 4.6, calories_kcal: 600 },
    items: [chicken(100), rice(200), bread(77)],
  };
  // No target_macros at all: the pass must not invent a target for it.
  const m2 = { meal_number: 2, items: [chicken(150), rice(200)] };
  // A target but no starch/oil donor on the plate: nothing to move.
  const m3 = {
    meal_number: 3,
    target_macros: { protein_g: 40, carb_g: 30, fat_g: 10, calories_kcal: 500 },
    items: [chicken(150)],
  };
  const meals = [m1, m2, m3];
  // The day looks fine (served 625 + 508 + 248 = 1381, drift 0), so the
  // day pass never fires — this test guards the per-meal pass only: it must
  // skip a meal with no targets and leave a meal with no donors alone.
  // (Guard test: it passes on the base head too; the four tests above are
  // the fail-first ones.)
  const dayTarget = 625 + 508 + 248;
  const fixed = reconcileDayCaloriesToTarget(meals, dayTarget);
  assert.equal(fixed[1], meals[1], "a meal without targets must come back untouched");
  assert.equal(mealSum(fixed[2], "calories_kcal"), mealSum(m3, "calories_kcal"), "a meal with no donors must not move");
});

// C07 as the matrix runner builds her (profiles.json s1check-before):
// 29F, 162 cm, 74 kg, waist 84, fat loss, light NEAT, PCOS, GLUTEN allergy,
// 4 meals, commercial gym, 4 days/week, INTERMEDIATE, 5000 steps.
const c07Plan = () => buildMasterEngineV2({
  intake: {
    gender: "female", age: "29", height_cm: "162", weight_kg: "74", waist_cm: "84",
    primary_goal: "fat_loss", neat_level: "light", occupation_type: "DESK_OFFICE",
    dangerous_symptoms: ["NONE"],
    medical_conditions: { has_conditions: true, selected: ["PCOS"] },
    injuries_map: { has_injuries: false, selected_areas: [] },
    religion: "MUSLIM", strict_allergies: ["GLUTEN"],
    meal_structure: { meals_count: "4_meals", intermittent_fasting: "none" },
    training_environment: "commercial_gym",
    training_logistics: { days_per_week: 4, experience_level: "INTERMEDIATE" },
    recent_training: "ACTIVE",
    cardio: { walkingAbility: "EASY", averageDailySteps: 5000, maxSessionsPerWeek: 2, maxDurationMinutes: 30 },
    sleep_hours: 7, sleep_schedule: { pattern: "regular_night", average_hours: 7 },
  },
  evaluationContext: { system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" },
  nutritionFoodCatalog: CATALOG,
  options: {},
}).nutrition_program;

// C09 as the matrix runner builds her: 33F, 158 cm, 90 kg, waist 100,
// fat loss, sedentary, type 2 diabetes, 4 meals, commercial gym,
// 3 days/week, BEGINNER, 4000 steps. B6-1 (Option C, served half) raised
// her snack carb target from 15 g to 24 g (budget-derived) and halved its
// fat share (8 g -> 4 g), so a 50 g potato (10 g carbs) now FITS: the
// yogurt (7 g) + potato (10 g) + nuts (~2 g) = ~19 g sits inside the
// 24 g target with room to spare, and the snack lands on target instead
// of the -29 kcal outlier. The B4-3 carb gate's "cannot fit" premise
// therefore no longer occurs for C09 — the gate code path remains in the
// snack builder for snacks whose target stays below the yogurt+potato
// floor, and the C07 end-to-end test below still covers the
// potato-survives path.
const c09Plan = () => buildMasterEngineV2({
  intake: {
    gender: "female", age: "33", height_cm: "158", weight_kg: "90", waist_cm: "100",
    primary_goal: "fat_loss", neat_level: "sedentary", occupation_type: "DESK_OFFICE",
    dangerous_symptoms: ["NONE"],
    medical_conditions: { has_conditions: true, selected: ["DIABETES"] },
    injuries_map: { has_injuries: false, selected_areas: [] },
    religion: "MUSLIM", strict_allergies: [],
    meal_structure: { meals_count: "4_meals", intermittent_fasting: "none" },
    training_environment: "commercial_gym",
    training_logistics: { days_per_week: 3, experience_level: "BEGINNER" },
    recent_training: "ACTIVE",
    cardio: { walkingAbility: "EASY", averageDailySteps: 4000, maxSessionsPerWeek: 2, maxDurationMinutes: 30 },
    sleep_hours: 7, sleep_schedule: { pattern: "regular_night", average_hours: 7 },
  },
  evaluationContext: { system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" },
  nutritionFoodCatalog: CATALOG,
  options: {},
}).nutrition_program;

test("B6-1 (Option C, served half): the C09 snack now carries a real potato and lands on target", () => {
  const program = c09Plan();
  const snack = program.culinary_meals.find((meal) => meal.meal_number === 4);
  assert.ok(snack, "C09 must have a 4th meal (snack)");
  // The snack's targets moved by design: carbs 15 g -> 24 g (budget-derived),
  // fat 8 g -> 4 g (half weight). The potato now fits and survives as a real
  // portion, and the snack lands on its new target instead of the -29 kcal
  // outlier (197 kcal against a 226 kcal target).
  assert.equal(Number(snack.target_macros.carb_g), 24, "snack carb target must be the budget-derived 24 g");
  assert.equal(Number(snack.target_macros.fat_g), 4, "snack fat target must be the half-weight 4 g");
  const potato = (snack.items || []).find((item) => item.food_code === "SWEET_POTATO");
  assert.ok(potato, "the snack must carry a sweet potato now that it fits its carb target");
  assert.ok(potato.portion_g >= 50, `sweet potato must be a real portion, not a token: ${potato.portion_g}g`);
  assert.equal(potato.portion_g, 77, `sweet potato portion: ${potato.portion_g}g`);
  const nuts = (snack.items || []).find((item) => item.food_code === "RAW_ALMONDS");
  assert.ok(nuts, "the snack must keep its nuts");
  assert.equal(nuts.portion_g, 6, `the nuts shrink with the halved fat target: ${nuts.portion_g}g`);
  const target = Number(snack.target_macros.calories_kcal);
  const actual = (snack.items || []).reduce((s, item) => s + (Number(item.calories_kcal) || 0), 0);
  assert.ok(
    Math.abs(actual - target) <= mealThreshold(target),
    `snack: ${actual} for target ${target} (threshold ${mealThreshold(target)})`,
  );
});

test("B4-3 Option B1 end-to-end: the C07 snack keeps a real 50 g sweet potato and lands on target", () => {
  // On the base head the snack builder sizes ~39 g of sweet potato from the
  // leftover carbs and dropTokenPortions deletes it (below the 50 g
  // real-portion minimum), so the snack serves yogurt + almonds only at
  // 209 kcal against a 244 target (-35). With the fix the potato is sized
  // to the 50 g minimum and the extra kcal come from the nuts, so the
  // snack lands on its target with a real portion on the plate.
  const program = c07Plan();
  const snack = program.culinary_meals.find((meal) => meal.meal_number === 4);
  assert.ok(snack, "C07 must have a 4th meal (snack)");
  const potato = (snack.items || []).find((item) => item.food_code === "SWEET_POTATO");
  assert.ok(potato, "the snack must carry a sweet potato (it was dropped as a token on the base head)");
  assert.ok(potato.portion_g >= 50, `sweet potato must be a real portion, not a token: ${potato.portion_g}g`);
  const target = Number(snack.target_macros.calories_kcal);
  const actual = (snack.items || []).reduce((s, item) => s + (Number(item.calories_kcal) || 0), 0);
  assert.ok(
    Math.abs(actual - target) <= mealThreshold(target),
    `snack: ${actual} for target ${target} (threshold ${mealThreshold(target)})`,
  );
});

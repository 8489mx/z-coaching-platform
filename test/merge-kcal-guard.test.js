/* R2 RE-HUNT, LO-1: the first merge after a fresh plan inflates the served
 * food. The day-0 plate is macro-short of the headline (protein 2-9%,
 * carbs up to 23%) because reconcile fixes kcal by cutting starch only;
 * the merge then scales PROTEIN/CARBS items by ratios > 1.0 even when the
 * calorie target falls, and nothing checks the resulting day total.
 *
 * Fix: a post-scale kcal guard inside rebalanceCulinaryMeals — if the
 * scaled day total exceeds the new calorie target by more than the 30 kcal
 * reconcile tolerance, scale all macro-category items down uniformly so
 * the served food lands on target. Direction-neutral: it only ever scales
 * down, never up. Veggies/beverages stay locked at 1.0.
 *
 * Fixtures are the real served day-0 plates (C02 from the saved debug
 * plan; C07/L15 replicated step by step by the R2 investigation) with the
 * real week-2 targets from the longitudinal journeys.
 *
 * Fail-first: on the R1 base C02 merges to 2451 (+97 over target 2354),
 * C07 to 1662 (+64 over 1598), L15 to 2052 (+140 over 1912). */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { completeIntake, ASSESSMENT_CONTEXT } from "./fixtures/complete-intake.js";
import {
  mergeAdaptedPlanIntoProgram,
  rebalanceCulinaryMeals,
} from "../src/api/utils/planMergeEngine.js";

const evaluationContext = Object.freeze({
  system_time: new Date(ASSESSMENT_CONTEXT.assessmentDate).toISOString(),
  assessmentDate: ASSESSMENT_CONTEXT.assessmentDate,
});

const nutritionFoodCatalog = JSON.parse(
  fs.readFileSync(new URL("../data/catalogs/core-global-food-batch-v1.json", import.meta.url), "utf8"),
);

/* Served day-0 plate, C02 — headline 2390 / P209 / C258 / F58, served
 * 2391 / P200.9 / C243.4 / F60.3. Week-2 targets 2354 / P209 / C249 / F58. */
const C02_SERVED = [
  { meal_number: 1, items: [
    { food_code: "EGGS_OMELETTE", category: "PROTEIN", portion_g: 100, protein_g: 11.9, carb_g: 0.7, fat_g: 9.1, calories_kcal: 130 },
    { food_code: "MEDITERRANEAN_SALAD", category: "VEGGIES", portion_g: 150, protein_g: 2, carb_g: 4, fat_g: 0, calories_kcal: 25 },
    { food_code: "COTTAGE_CHEESE", category: "PROTEIN", portion_g: 150, protein_g: 18, carb_g: 5, fat_g: 2.2, calories_kcal: 113 },
    { food_code: "BALADI_BREAD", category: "CARBS", portion_g: 121, protein_g: 11, carb_g: 63, fat_g: 1, calories_kcal: 315 },
    { food_code: "SHAKSHOUKA_EGGS", category: "PROTEIN", portion_g: 47, protein_g: 5.1, carb_g: 1.4, fat_g: 3.7, calories_kcal: 61 },
    { food_code: "LABNEH_LIGHT", category: "PROTEIN", portion_g: 69, protein_g: 7, carb_g: 2.5, fat_g: 3.5, calories_kcal: 70 },
  ] },
  { meal_number: 2, items: [
    { food_code: "SAUTEED_VEGGIES", category: "VEGGIES", portion_g: 150, protein_g: 2, carb_g: 4, fat_g: 0, calories_kcal: 25 },
    { food_code: "BASMATI_RICE", category: "CARBS", portion_g: 242, protein_g: 6.9, carb_g: 67.9, fat_g: 1, calories_kcal: 315 },
    { food_code: "CHICKEN_BREAST", category: "PROTEIN", portion_g: 161, protein_g: 50, carb_g: 0, fat_g: 5, calories_kcal: 266 },
    { food_code: "OLIVE_OIL", category: "FATS", portion_g: 10, protein_g: 0, carb_g: 0, fat_g: 10, calories_kcal: 90 },
  ] },
  { meal_number: 3, items: [
    { food_code: "MEDITERRANEAN_SALAD", category: "VEGGIES", portion_g: 150, protein_g: 2, carb_g: 4, fat_g: 0, calories_kcal: 25 },
    { food_code: "BALADI_BREAD", category: "CARBS", portion_g: 100, protein_g: 9, carb_g: 51.9, fat_g: 0.8, calories_kcal: 260 },
    { food_code: "CHICKEN_BREAST", category: "PROTEIN", portion_g: 145, protein_g: 45, carb_g: 0, fat_g: 4, calories_kcal: 239 },
    { food_code: "OLIVE_OIL", category: "FATS", portion_g: 11, protein_g: 0, carb_g: 0, fat_g: 11, calories_kcal: 99 },
  ] },
  { meal_number: 4, items: [
    { food_code: "SWEET_POTATO", category: "CARBS", portion_g: 130, protein_g: 3, carb_g: 27, fat_g: 0, calories_kcal: 117 },
    { food_code: "GREEK_YOGURT", category: "PROTEIN", portion_g: 245, protein_g: 25, carb_g: 9, fat_g: 1, calories_kcal: 145 },
    { food_code: "RAW_ALMONDS", category: "FATS", portion_g: 16, protein_g: 3, carb_g: 3, fat_g: 8, calories_kcal: 96 },
  ] },
];

/* Served day-0 plate, C07 — headline 1613 / P163 / C121 / F53, served
 * 1613 / P160.5 / C98.1 / F58.7. Week-2 targets 1598 / P163 / C117 / F53. */
const C07_SERVED = [
  { meal_number: 1, items: [
    { food_code: "EGGS_OMELETTE", category: "PROTEIN", portion_g: 77, protein_g: 9, carb_g: 1, fat_g: 7, calories_kcal: 99 },
    { food_code: "MEDITERRANEAN_SALAD", category: "VEGGIES", portion_g: 150, protein_g: 2, carb_g: 4, fat_g: 0, calories_kcal: 25 },
    { food_code: "COTTAGE_CHEESE", category: "PROTEIN", portion_g: 150, protein_g: 18, carb_g: 4.8, fat_g: 2.1, calories_kcal: 113 },
    { food_code: "ROASTED_POTATOES", category: "CARBS", portion_g: 116, protein_g: 1.9, carb_g: 23.2, fat_g: 0, calories_kcal: 104 },
    { food_code: "EGG_WHOLE_HARD_BOILED", category: "PROTEIN", portion_g: 63, protein_g: 7, carb_g: 0, fat_g: 6, calories_kcal: 82 },
    { food_code: "SHAKSHOUKA_EGGS", category: "PROTEIN", portion_g: 72, protein_g: 8.1, carb_g: 2.1, fat_g: 5.6, calories_kcal: 91 },
  ] },
  { meal_number: 2, items: [
    { food_code: "SAUTEED_VEGGIES", category: "VEGGIES", portion_g: 150, protein_g: 2, carb_g: 4, fat_g: 0, calories_kcal: 25 },
    { food_code: "BASMATI_RICE", category: "CARBS", portion_g: 80, protein_g: 2.2, carb_g: 22.4, fat_g: 0, calories_kcal: 104 },
    { food_code: "CHICKEN_BREAST", category: "PROTEIN", portion_g: 132, protein_g: 41, carb_g: 0, fat_g: 4, calories_kcal: 218 },
    { food_code: "OLIVE_OIL", category: "FATS", portion_g: 11, protein_g: 0, carb_g: 0, fat_g: 11, calories_kcal: 99 },
  ] },
  { meal_number: 3, items: [
    { food_code: "MEDITERRANEAN_SALAD", category: "VEGGIES", portion_g: 150, protein_g: 2, carb_g: 4, fat_g: 0, calories_kcal: 25 },
    { food_code: "ROASTED_POTATOES", category: "CARBS", portion_g: 113, protein_g: 2.3, carb_g: 22.6, fat_g: 0, calories_kcal: 102 },
    { food_code: "CHICKEN_BREAST", category: "PROTEIN", portion_g: 132, protein_g: 41, carb_g: 0, fat_g: 4, calories_kcal: 218 },
    { food_code: "OLIVE_OIL", category: "FATS", portion_g: 11, protein_g: 0, carb_g: 0, fat_g: 11, calories_kcal: 99 },
  ] },
  { meal_number: 4, items: [
    { food_code: "GREEK_YOGURT", category: "PROTEIN", portion_g: 206, protein_g: 21, carb_g: 7, fat_g: 1, calories_kcal: 122 },
    { food_code: "RAW_ALMONDS", category: "FATS", portion_g: 14, protein_g: 3, carb_g: 3, fat_g: 7, calories_kcal: 87 },
  ] },
];

/* Served day-0 plate, L15 — headline 1950 / P198 / C168 / F54, served
 * 1958 / P191.7 / C136.4 / F65.4. Week-2 targets 1912 / P198 / C159 / F54. */
const L15_SERVED = [
  { meal_number: 1, items: [
    { food_code: "EGGS_OMELETTE", category: "PROTEIN", portion_g: 100, protein_g: 12.1, carb_g: 0.7, fat_g: 8.9, calories_kcal: 130 },
    { food_code: "MEDITERRANEAN_SALAD", category: "VEGGIES", portion_g: 150, protein_g: 2, carb_g: 4, fat_g: 0, calories_kcal: 25 },
    { food_code: "COTTAGE_CHEESE", category: "PROTEIN", portion_g: 150, protein_g: 18, carb_g: 5, fat_g: 2, calories_kcal: 113 },
    { food_code: "BALADI_BREAD", category: "CARBS", portion_g: 58, protein_g: 5.3, carb_g: 30.1, fat_g: 0.8, calories_kcal: 151 },
    { food_code: "SHAKSHOUKA_EGGS", category: "PROTEIN", portion_g: 204, protein_g: 21.8, carb_g: 6.8, fat_g: 18.1, calories_kcal: 262 },
  ] },
  { meal_number: 2, items: [
    { food_code: "SAUTEED_VEGGIES", category: "VEGGIES", portion_g: 150, protein_g: 2, carb_g: 4, fat_g: 0, calories_kcal: 25 },
    { food_code: "BASMATI_RICE", category: "CARBS", portion_g: 169, protein_g: 4.5, carb_g: 47.3, fat_g: 0.8, calories_kcal: 220 },
    { food_code: "CHICKEN_BREAST", category: "PROTEIN", portion_g: 213, protein_g: 66, carb_g: 0, fat_g: 6, calories_kcal: 351 },
    { food_code: "OLIVE_OIL", category: "FATS", portion_g: 11, protein_g: 0, carb_g: 0, fat_g: 11, calories_kcal: 99 },
  ] },
  { meal_number: 3, items: [
    { food_code: "MEDITERRANEAN_SALAD", category: "VEGGIES", portion_g: 150, protein_g: 2, carb_g: 4, fat_g: 0, calories_kcal: 25 },
    { food_code: "BALADI_BREAD", category: "CARBS", portion_g: 66, protein_g: 6, carb_g: 34.5, fat_g: 0.8, calories_kcal: 172 },
    { food_code: "CHICKEN_BREAST", category: "PROTEIN", portion_g: 168, protein_g: 52, carb_g: 0, fat_g: 5, calories_kcal: 277 },
    { food_code: "OLIVE_OIL", category: "FATS", portion_g: 12, protein_g: 0, carb_g: 0, fat_g: 12, calories_kcal: 108 },
  ] },
];

function dayTotals(meals) {
  let kcal = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  for (const meal of meals) {
    for (const item of meal.items || []) {
      kcal += Number(item.calories_kcal) || 0;
      protein += Number(item.protein_g) || 0;
      carbs += Number(item.carb_g) || 0;
      fat += Number(item.fat_g) || 0;
    }
  }
  return { kcal, protein, carbs, fat };
}

function veggiesPortions(meals) {
  const portions = [];
  for (const meal of meals) {
    for (const item of meal.items || []) {
      if (String(item.category || "").toUpperCase() === "VEGGIES") portions.push(item.portion_g);
    }
  }
  return portions;
}

test("R2 LO-1: first merge must not inflate the served food above the new target", async (suite) => {
  await suite.test("1. C02 week-2 merge: food lands on target, moves down with it", () => {
    const served = structuredClone(C02_SERVED);
    const before = dayTotals(served);
    assert.equal(before.kcal, 2391, "fixture must reproduce the real served day-0 total");
    const merged = rebalanceCulinaryMeals(served, {
      finalCalories: 2354, finalProtein: 209, finalCarbs: 249, finalFats: 58,
    });
    const after = dayTotals(merged);
    assert.ok(
      after.kcal <= 2354 + 30,
      `merged day kcal (${after.kcal}) must be within 30 of the new target (2354); was 2451 (+97) before the fix`,
    );
    assert.ok(after.kcal < before.kcal, `food must move DOWN with the target (was ${before.kcal}, now ${after.kcal})`);
    assert.deepEqual(veggiesPortions(merged), veggiesPortions(C02_SERVED), "veggies stay locked at 1.0");
    // actual_macros must agree with the guarded items, not the pre-guard scaling.
    const reported = merged.reduce((s, m) => s + (m.actual_macros?.calories_kcal || 0), 0);
    assert.equal(reported, after.kcal, "reported day kcal must match the guarded items");
  });

  await suite.test("2. C07 week-2 merge: carb ratio 1.19 must not inflate the food", () => {
    const served = structuredClone(C07_SERVED);
    const before = dayTotals(served);
    assert.equal(before.kcal, 1613, "fixture must reproduce the real served day-0 total");
    const merged = rebalanceCulinaryMeals(served, {
      finalCalories: 1598, finalProtein: 163, finalCarbs: 117, finalFats: 53,
    });
    const after = dayTotals(merged);
    assert.ok(
      after.kcal <= 1598 + 30,
      `merged day kcal (${after.kcal}) must be within 30 of the new target (1598); was 1662 (+64) before the fix`,
    );
    assert.ok(after.kcal < before.kcal, `food must move DOWN with the target (was ${before.kcal}, now ${after.kcal})`);
    assert.deepEqual(veggiesPortions(merged), veggiesPortions(C07_SERVED), "veggies stay locked at 1.0");
  });

  await suite.test("3. L15 week-2 merge: worst case (+140) lands on target", () => {
    const served = structuredClone(L15_SERVED);
    const before = dayTotals(served);
    assert.equal(before.kcal, 1958, "fixture must reproduce the real served day-0 total");
    const merged = rebalanceCulinaryMeals(served, {
      finalCalories: 1912, finalProtein: 198, finalCarbs: 159, finalFats: 54,
    });
    const after = dayTotals(merged);
    assert.ok(
      after.kcal <= 1912 + 30,
      `merged day kcal (${after.kcal}) must be within 30 of the new target (1912); was 2052 (+140) before the fix`,
    );
    assert.ok(after.kcal < before.kcal, `food must move DOWN with the target (was ${before.kcal}, now ${after.kcal})`);
    assert.deepEqual(veggiesPortions(merged), veggiesPortions(L15_SERVED), "veggies stay locked at 1.0");
  });

  await suite.test("4. guard never scales food UP: a merge that lands under target stays under it", () => {
    // Same C02 plate, but the calorie target does not fall: the ratio
    // scaling lands the food under the target, and the guard must not
    // push it back up to the target.
    const served = structuredClone(C02_SERVED);
    const merged = rebalanceCulinaryMeals(served, {
      finalCalories: 2390, finalProtein: 150, finalCarbs: 250, finalFats: 58,
    });
    const after = dayTotals(merged);
    assert.ok(after.kcal < 2390, `food must stay under target when scaling lands under it (got ${after.kcal})`);
    assert.ok(after.kcal <= 2390 + 30, "guard invariant holds in both directions");
  });

  await suite.test("5. regression: rebalance test 1 numbers unchanged (guard does not fire at +5)", () => {
    const baseProgram = buildMasterEngineV2({
      intake: completeIntake(),
      evaluationContext,
      nutritionFoodCatalog,
    });
    const adaptationResult = {
      adapted_week_number: 2,
      adaptation_action: "CALORIE_DEFICIT_TITRATION",
      suggested_calorie_delta: -120,
      suggested_carb_delta_g: -30,
    };
    const merged = mergeAdaptedPlanIntoProgram(baseProgram, adaptationResult);
    const adaptedMeals = merged.nutrition_program.culinary_meals;
    const newCal = adaptedMeals.reduce((sum, m) => sum + m.actual_macros.calories_kcal, 0);
    // Baseline measured on the batch-1 branch: 2528 vs target 2517 (+11,
    // still inside the 30 kcal tolerance, so the guard must not fire and
    // nothing may move). The day-0 plate changed by design (Alt 2), so the
    // R1 baseline 2522 no longer applies; the guard invariant is unchanged.
    assert.equal(newCal, 2528, `merged day kcal must stay 2528 (guard must not fire at +11), got ${newCal}`);
    const rice = adaptedMeals[1].items.find((it) => it.food_code === "BASMATI_RICE");
    const chicken = adaptedMeals[1].items.find((it) => it.food_code === "CHICKEN_BREAST");
    assert.equal(rice.portion_g, 221, "rice portion unchanged");
    assert.equal(chicken.portion_g, 103, "chicken portion unchanged (protein locked on a carb-only cut)");
  });
});

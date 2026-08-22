import test from "node:test";
import assert from "node:assert/strict";

import {
  quantizeFoodPortion,
  quantizeNutritionPlan,
  HouseholdUnitType,
  NUTRITION_SERVING_QUANTIZER_V2_VERSION,
} from "../src/nutrition-serving-quantizer-v2/index.js";

test("Nutrition Serving Quantizer V2 Suite", async (t) => {
  await t.test("version is stable", () => {
    assert.equal(NUTRITION_SERVING_QUANTIZER_V2_VERSION, "nutrition-serving-quantizer-v2");
  });

  await t.test("quantizes whole eggs into piece counts and rounded grams", () => {
    const rawEgg = {
      food_code: "WHOLE_EGG",
      portion_g: 104.2,
      protein_g: 13.1,
      carbohydrate_g: 0.8,
      fat_g: 10.0,
    };

    const quantized = quantizeFoodPortion(rawEgg);
    assert.equal(quantized.portion_g_rounded, 104);
    assert.equal(quantized.household_unit_type, HouseholdUnitType.WHOLE_PIECE);
    assert.equal(quantized.unit_count, 2);
    assert.ok(quantized.serving_display_ar.includes("2 بيضة كاملة"));
    assert.ok(quantized.serving_display_en.includes("2 Whole egg"));
  });

  await t.test("quantizes olive oil into tablespoons", () => {
    const rawOil = {
      food_code: "OLIVE_OIL",
      portion_g: 11.2,
    };

    const quantized = quantizeFoodPortion(rawOil);
    assert.equal(quantized.portion_g_rounded, 11);
    assert.equal(quantized.household_unit_type, HouseholdUnitType.TABLESPOON);
    assert.equal(quantized.unit_count, 1);
    assert.ok(quantized.serving_display_ar.includes("1 ملعقة طعام"));
  });

  await t.test("quantizes full meal plan with immutable result", () => {
    const solverMock = {
      meals: [
        {
          meal_sequence: 1,
          foods: [
            { food_code: "WHOLE_EGG", portion_g: 100 },
            { food_code: "CHICKEN_BREAST", portion_g: 175.4 },
          ],
        },
      ],
    };

    const quantizedPlan = quantizeNutritionPlan(solverMock);
    assert.equal(quantizedPlan.quantizer_version, NUTRITION_SERVING_QUANTIZER_V2_VERSION);
    assert.equal(quantizedPlan.meals.length, 1);
    assert.equal(quantizedPlan.meals[0].foods[0].unit_count, 2);
    assert.equal(quantizedPlan.meals[0].foods[1].portion_g_rounded, 175);
    assert.ok(Object.isFrozen(quantizedPlan));
    assert.ok(Object.isFrozen(quantizedPlan.meals));
  });
});

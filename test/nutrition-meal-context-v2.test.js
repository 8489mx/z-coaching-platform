import test from "node:test";
import assert from "node:assert/strict";

import {
  sanitizeMealPlan,
  ErgonomicPortionCaps,
  NUTRITION_MEAL_CONTEXT_V2_VERSION,
} from "../src/nutrition-meal-context-v2/index.js";

test("Nutrition Meal Context V2 Suite", async (t) => {
  await t.test("version is stable", () => {
    assert.equal(NUTRITION_MEAL_CONTEXT_V2_VERSION, "nutrition-meal-context-v2");
  });

  await t.test("replaces culturally inappropriate rice in breakfast with rolled oats and fruit", () => {
    const rawPlan = {
      meals: [
        {
          sequence: 1,
          role: "BREAKFAST",
          items: [
            { food_code: "EGG_WHOLE_HARD_BOILED", grams: 200 },
            { food_code: "RICE_WHITE_LONG_GRAIN_COOKED", grams: 300 },
            { food_code: "CUCUMBER_WITH_PEEL_RAW", grams: 400 },
          ],
        },
      ],
    };

    const sanitized = sanitizeMealPlan(rawPlan);
    const breakfast = sanitized.meals[0];

    // Assert rice was replaced
    assert.ok(!breakfast.items.some((item) => item.food_code.includes("RICE")));
    assert.ok(breakfast.items.some((item) => item.food_code === "OATS_ROLLED_DRY"));

    // Assert cucumber was capped to ergonomic ceiling
    const cucumber = breakfast.items.find((item) => item.food_code === "CUCUMBER_WITH_PEEL_RAW");
    assert.ok(cucumber.grams <= ErgonomicPortionCaps.CUCUMBER_MAX_G);
  });

  await t.test("caps oversized boiled potatoes to 250g max", () => {
    const rawPlan = {
      meals: [
        {
          sequence: 2,
          role: "MAIN_MEAL",
          items: [
            { food_code: "CHICKEN_BREAST_ROASTED_SKINLESS", grams: 150 },
            { food_code: "POTATO_BOILED_WITHOUT_SKIN", grams: 500 },
            { food_code: "CARROT_RAW", grams: 200 },
          ],
        },
      ],
    };

    const sanitized = sanitizeMealPlan(rawPlan);
    const lunch = sanitized.meals[0];

    const potato = lunch.items.find((item) => item.food_code === "POTATO_BOILED_WITHOUT_SKIN");
    assert.equal(potato.grams, ErgonomicPortionCaps.POTATO_BOILED_MAX_G);

    const carrot = lunch.items.find((item) => item.food_code === "CARROT_RAW");
    assert.equal(carrot.grams, ErgonomicPortionCaps.CARROT_MAX_G);
  });
});

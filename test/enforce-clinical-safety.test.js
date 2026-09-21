import test from "node:test";
import assert from "node:assert/strict";

import { enforceClinicalSafety, isFoodClinicallySafe } from "../src/nutrition-meal-context-v2/build-culinary-meals.js";

/**
 * Some templates place foods directly, past the allergy filter. The last step of the generator
 * checks every item again: an unsafe one is replaced by a safe swap, and if none exists it is
 * flagged for the coach rather than served in silence.
 */
const COELIAC = { isGlutenExcluded: true };

test("an unsafe item is replaced by a safe food", () => {
  assert.equal(isFoodClinicallySafe("BALADI_BREAD", COELIAC), false, "precondition: baladi bread is unsafe for a coeliac client");
  const [meal] = enforceClinicalSafety([{ meal_type: "BREAKFAST", items: [{ food_code: "BALADI_BREAD", category: "CARBS", portion_g: 80, swaps: [] }] }], COELIAC);
  const [item] = meal.items;
  if (item.clinically_unsafe) {
    assert.ok(item.clinical_warning_ar, "a flagged item carries a warning for the coach");
  } else {
    assert.notEqual(item.food_code, "BALADI_BREAD");
    assert.equal(isFoodClinicallySafe(item.food_code, COELIAC), true, `${item.food_code} is safe`);
  }
});

test("safe items and foods outside the database are left untouched", () => {
  const meals = [{ meal_type: "LUNCH", items: [
    { food_code: "BALADI_BREAD", category: "CARBS", portion_g: 80, swaps: [] },
    { food_code: "SOMETHING_UNCATALOGUED", category: "CARBS", portion_g: 50, swaps: [] },
  ] }];
  const [meal] = enforceClinicalSafety(meals, {});
  assert.deepEqual(meal.items.map((item) => item.food_code), ["BALADI_BREAD", "SOMETHING_UNCATALOGUED"]);
  assert.ok(meal.items.every((item) => !item.clinically_unsafe));
});

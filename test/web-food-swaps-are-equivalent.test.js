import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { listEquivalentFoodSwaps, FOOD_DATABASE } from "../frontend/src/utils/foodSwapEngine.js";
import { isCloseInValue } from "../frontend/src/utils/swapExchangeRules.js";

/**
 * The web client's swap window offered up to 25 foods of any taste group (only sorted, never
 * filtered), matched on the main nutrient alone. It now offers the same taste group with close
 * energy and fat, like the plan and the mobile app.
 */
const kcal = (food, g) => (food.calories_per_100g * g) / 100;

test("every web swap is the same taste group with energy within 25% and fat within 10 g", () => {
  const bad = [];
  for (const code of Object.keys(FOOD_DATABASE).filter((c) => c === c.toUpperCase())) {
    const food = FOOD_DATABASE[code];
    if (!food?.macro_type || food.macro_type === "FREE") continue;
    const portion = 150;
    for (const swap of listEquivalentFoodSwaps(code, portion, {})) {
      const r = swap.replacement_food;
      const target = FOOD_DATABASE[r.code];
      const close = isCloseInValue({ fromKcal: kcal(food, portion), toKcal: r.macros.calories_kcal, fromFat: (food.fat_per_100g * portion) / 100, toFat: r.macros.fat_g });
      if (target.taste_profile !== food.taste_profile || !close) bad.push(`${code} -> ${r.code}`);
    }
  }
  assert.deepEqual(bad, []);
});

test("chicken is not offered cheese or legumes, and bread is not offered fruit", () => {
  const chicken = listEquivalentFoodSwaps("CHICKEN_BREAST", 150, {}).map((s) => s.replacement_food.code);
  assert.ok(chicken.length > 0);
  for (const code of chicken) assert.equal(FOOD_DATABASE[code].taste_profile, FOOD_DATABASE.CHICKEN_BREAST.taste_profile, code);
  const bread = listEquivalentFoodSwaps("EGYPTIAN_BALADI_BREAD", 90, {}).map((s) => s.replacement_food.code);
  for (const code of bread) assert.notEqual(FOOD_DATABASE[code].taste_profile, "FRUIT_CARB", code);
});

test("the window uses the equivalent list, not every food of the same macro type", () => {
  const src = fs.readFileSync("frontend/src/pages/ClientInteractiveApp/components/FoodSwapModal.jsx", "utf8");
  assert.match(src, /listEquivalentFoodSwaps\(/);
  assert.doesNotMatch(src, /enforce_taste_profile:\s*false/);
});

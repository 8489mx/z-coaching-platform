import test from "node:test";
import assert from "node:assert/strict";

import { splitOversizedPortions, carbPortionLimit, generateSmartSwaps } from "../src/nutrition-meal-context-v2/build-culinary-meals.js";

/**
 * When a large carbohydrate is split, every part used to carry a share of the original food's
 * macros: 284 g of quinoa was shown with the protein and fat of potatoes, and its fat was never taken
 * out of the meal's oil. Each part now carries its own macros (the carbohydrate is matched, so the
 * meal's carbohydrate does not change) and a part with extra fat leaves its share of oil out.
 */
const potatoMeal = () => {
  const swaps = generateSmartSwaps("CARBS", 600, "ROASTED_POTATOES", "BREAKFAST", 20, {});
  return [{ items: [
    { food_code: "ROASTED_POTATOES", category: "CARBS", portion_g: 600, protein_g: 15, carb_g: 127, fat_g: 1, calories_kcal: 574, swaps: swaps.filter((s) => s.food_code === "COOKED_QUINOA") },
    { food_code: "OLIVE_OIL", category: "FATS", portion_g: 20, protein_g: 0, carb_g: 0, fat_g: 20, calories_kcal: 180, swaps: [] },
  ] }];
};

test("a quinoa part carries quinoa's protein and fat, and the meal's oil gives up its share", () => {
  const [meal] = splitOversizedPortions(potatoMeal(), carbPortionLimit({ diabetic: true }));
  const quinoa = meal.items.find((i) => i.food_code === "COOKED_QUINOA");
  assert.ok(quinoa, meal.items.map((i) => i.food_code).join(","));
  assert.ok(Math.abs(quinoa.fat_g - (quinoa.portion_g * 1.9) / 100) <= 1, `quinoa ${quinoa.portion_g} g with ${quinoa.fat_g} g fat`);
  assert.ok(Math.abs(quinoa.protein_g - (quinoa.portion_g * 4.4) / 100) <= 1, `quinoa protein ${quinoa.protein_g}`);
  const oil = meal.items.find((i) => i.food_code === "OLIVE_OIL");
  assert.ok(oil.portion_g < 20, `oil ${oil.portion_g} g`);
  const carbs = meal.items.reduce((s, i) => s + (Number(i.carb_g) || 0), 0);
  assert.ok(Math.abs(carbs - 127) <= 2, `${carbs} g carbohydrate for 127`);
  const fat = meal.items.reduce((s, i) => s + (Number(i.fat_g) || 0), 0);
  assert.ok(Math.abs(fat - 21) <= 2, `meal fat ${fat} g for 21 (quinoa's fat replaces oil)`);
});

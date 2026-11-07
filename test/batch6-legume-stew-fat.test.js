import test from "node:test";
import assert from "node:assert/strict";

import { ensureLegumeForNoAnimalProtein } from "../src/nutrition-meal-context-v2/culinary-portion-passes.js";

// Batch 6 B6-5: C13 legume-stew fat compensation.
//
// The legume pass replaces an egg/dairy protein with the mixed legumes
// stew (protein-matched) and cuts the meal's largest starch to return the
// stew's extra carbs — but the replaced food's fat is never returned. For
// C13's lunch the swap loses 13.5 g of fat (145 g eggs at 16 g fat become
// 167 g stew at 2.5 g fat) and the rice cut loses another 0.5 g, while the
// day reconciliation that runs after the pass only fixes calories — and
// fixes them with starch, so the meal lands on its calories with fat 12 g
// under target and carbs 27 g over. The fix adds the lost fat back as
// olive oil in the same meal, mirroring the swap engine's own rule
// (build-culinary-meals.js: a protein swap leaner by 4 g or more gets the
// missing fat as olive oil, capped at 15 g).

// C13's lunch exactly as the pass receives it (traced from the live
// matrix run at base a041d87c): veggies, rice, pasta, eggs.
function c13Lunch() {
  return {
    meal_number: 2,
    items: [
      { food_code: "SAUTEED_VEGGIES", name_ar: "خضار سوتيه", name_en: "Sauteed Veggies", category: "VEGGIES", portion_g: 150, protein_g: 2, carb_g: 4, fat_g: 0, calories_kcal: 25, swaps: [] },
      { food_code: "BASMATI_RICE", name_ar: "أرز بسمتي", name_en: "Basmati Rice", category: "CARBS", portion_g: 250, protein_g: 7, carb_g: 70, fat_g: 1, calories_kcal: 325, swaps: [] },
      { food_code: "WHOLE_WHEAT_PASTA", name_ar: "مكرونة", name_en: "Whole Wheat Pasta", category: "CARBS", portion_g: 117, protein_g: 7, carb_g: 35, fat_g: 2, calories_kcal: 187, swaps: [] },
      { food_code: "EGGS_OMELETTE", name_ar: "أومليت", name_en: "Omelette", category: "PROTEIN", portion_g: 145, protein_g: 15, carb_g: 1, fat_g: 16, calories_kcal: 208, swaps: [] },
    ],
  };
}

function mealMacros(meal) {
  return (meal.items || []).reduce(
    (sum, item) => ({
      protein: sum.protein + (Number(item.protein_g) || 0),
      carbs: sum.carbs + (Number(item.carb_g) || 0),
      fat: sum.fat + (Number(item.fat_g) || 0),
      kcal: sum.kcal + (Number(item.calories_kcal) || 0),
    }),
    { protein: 0, carbs: 0, fat: 0, kcal: 0 },
  );
}

function oilItem(meal) {
  return (meal.items || []).find((item) => item.food_code === "OLIVE_OIL") || null;
}

test("B6-5: C13 lunch — the legume swap adds olive oil for the lost fat", () => {
  const after = ensureLegumeForNoAnimalProtein([c13Lunch()], {});
  const lunch = after.find((meal) => meal.meal_number === 2);
  const stew = lunch.items.find((item) => item.food_code === "MIXED_LEGUMES_STEW");
  assert.ok(stew, "the stew replaces the eggs");
  assert.equal(stew.portion_g, 167, "stew is protein-matched to the 15 g eggs");
  // Fat lost: (16 - 2.5) at the swap + (1 - 0.5) in the rice cut = 14 g.
  const oil = oilItem(lunch);
  assert.ok(oil, "olive oil is added to the meal to return the lost fat");
  assert.equal(oil.portion_g, 14, "14 g of oil returns the 14 g of lost fat");
  assert.equal(oil.fat_g, 14, "olive oil is pure fat");
  assert.equal(oil.calories_kcal, 126, "14 g of oil is 126 kcal");
  assert.equal(oil.category, "FATS", "the oil item is a fat food");
  const macros = mealMacros(lunch);
  assert.ok(Math.abs(macros.fat - 19) <= 0.5, `meal fat is back near its 18 g target, got ${macros.fat}`);
  assert.ok(Math.abs(macros.carbs - 110) <= 0.5, `meal carbs stay compensated at 110 g, got ${macros.carbs}`);
  assert.ok(Math.abs(macros.kcal - 730) <= 1, `meal calories stay near the 737 kcal target, got ${macros.kcal}`);
});

test("B6-5: a fat loss under 4 g adds no oil", () => {
  const meal = {
    meal_number: 2,
    items: [
      { food_code: "BASMATI_RICE", name_ar: "أرز بسمتي", name_en: "Basmati Rice", category: "CARBS", portion_g: 250, protein_g: 7, carb_g: 70, fat_g: 1, calories_kcal: 325, swaps: [] },
      // Lean cottage cheese: 15 g of protein at only 5 g of fat, so the
      // swap loses (5 - 2.5) + ~0.4 g in the rice cut = ~2.9 g of fat.
      { food_code: "COTTAGE_CHEESE", name_ar: "جبنة قريش", name_en: "Cottage Cheese", category: "PROTEIN", portion_g: 150, protein_g: 15, carb_g: 4.5, fat_g: 5, calories_kcal: 110, swaps: [] },
    ],
  };
  const after = ensureLegumeForNoAnimalProtein([meal], {});
  const lunch = after.find((item) => item.meal_number === 2);
  assert.ok(lunch.items.some((item) => item.food_code === "MIXED_LEGUMES_STEW"), "the stew still replaces the cheese");
  assert.equal(oilItem(lunch), null, "a loss under the 4 g threshold adds no oil");
});

test("B6-5: oil already on the plate caps the addition at 20 g total", () => {
  const meal = c13Lunch();
  meal.items.push({ food_code: "OLIVE_OIL", name_ar: "زيت زيتون", name_en: "Extra Virgin Olive Oil", category: "FATS", portion_g: 14, protein_g: 0, carb_g: 0, fat_g: 14, calories_kcal: 126, swaps: [] });
  const after = ensureLegumeForNoAnimalProtein([meal], {});
  const lunch = after.find((item) => item.meal_number === 2);
  const oil = oilItem(lunch);
  assert.ok(oil, "the existing oil item is kept");
  assert.equal(oil.portion_g, 20, "the addition stops at the 20 g per-meal oil cap (14 + 6)");
  assert.equal(oil.fat_g, 20, "the capped oil item still carries its fat");
});

test("B6-5: oil already at the 20 g cap adds nothing", () => {
  const meal = c13Lunch();
  meal.items.push({ food_code: "OLIVE_OIL", name_ar: "زيت زيتون", name_en: "Extra Virgin Olive Oil", category: "FATS", portion_g: 20, protein_g: 0, carb_g: 0, fat_g: 20, calories_kcal: 180, swaps: [] });
  const after = ensureLegumeForNoAnimalProtein([meal], {});
  const lunch = after.find((item) => item.meal_number === 2);
  const oil = oilItem(lunch);
  assert.equal(oil.portion_g, 20, "the oil item is left exactly as it was");
});

test("B6-5: gout keeps the stew — and the oil — off the plate", () => {
  const before = [c13Lunch()];
  const after = ensureLegumeForNoAnimalProtein(before, { isGout: true });
  assert.deepEqual(after, before, "the meals are returned unchanged for gout");
});

test("B6-5: animal protein on the day means no swap and no oil", () => {
  const meals = [
    c13Lunch(),
    {
      meal_number: 4,
      items: [
        { food_code: "CHICKEN_BREAST", name_ar: "صدر دجاج", name_en: "Chicken Breast", category: "PROTEIN", portion_g: 150, protein_g: 35, carb_g: 0, fat_g: 4, calories_kcal: 180, swaps: [] },
      ],
    },
  ];
  const after = ensureLegumeForNoAnimalProtein(meals, {});
  assert.deepEqual(after, meals, "the meals are returned unchanged when animal protein is present");
});

test("B6-5: a legume already on the day means no swap and no oil", () => {
  const meals = [
    c13Lunch(),
    {
      meal_number: 1,
      items: [
        { food_code: "LENTILS_MATURE_COOKED", name_ar: "عدس", name_en: "Cooked Lentils", category: "PROTEIN", portion_g: 100, protein_g: 9, carb_g: 20, fat_g: 0.4, calories_kcal: 116, swaps: [] },
      ],
    },
  ];
  const after = ensureLegumeForNoAnimalProtein(meals, {});
  assert.deepEqual(after, meals, "the meals are returned unchanged when a legume is already served");
});

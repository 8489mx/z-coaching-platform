import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateSmartSwap,
  listSmartSwapCandidates,
  MealTimeCategory,
  FoodMacroType,
  NUTRITION_SWAP_ENGINE_V2_VERSION,
} from "../src/nutrition-swap-engine-v2/index.js";

test("Nutrition Smart Swap Engine V2 Suite", async (t) => {
  await t.test("version is stable", () => {
    assert.equal(NUTRITION_SWAP_ENGINE_V2_VERSION, "nutrition-swap-engine-v2");
  });

  await t.test("swaps chicken breast for lean beef sirloin with correct portion math", () => {
    const swap = calculateSmartSwap({
      current_food_code: "CHICKEN_BREAST_COOKED",
      current_portion_g: 180, // 180 * 0.31 = 55.8g protein
      target_food_code: "BEEF_TOP_SIRLOIN_LEAN", // 29g protein / 100g -> ~192g beef
      meal_category: MealTimeCategory.MAIN_MEAL,
    });

    assert.equal(swap.macro_type, FoodMacroType.PROTEIN_DOMINANT);
    assert.equal(swap.target_food.portion_g, 192);
    assert.ok(swap.target_food.serving_display_ar.includes("لحم بقري"));
  });

  await t.test("swaps whole eggs for cottage cheese in breakfast context", () => {
    const swap = calculateSmartSwap({
      current_food_code: "WHOLE_EGG",
      current_portion_g: 100, // 2 eggs = 13g protein
      target_food_code: "CHEESE_COTTAGE_LOW_FAT", // 12g protein / 100g -> ~108g cottage cheese
      meal_category: MealTimeCategory.BREAKFAST,
    });

    assert.equal(swap.macro_type, FoodMacroType.PROTEIN_DOMINANT);
    assert.equal(swap.target_food.portion_g, 108);
    assert.ok(swap.target_food.serving_display_ar.includes("جبن قريش"));
  });

  await t.test("rejects cross-macro swap (e.g. chicken for rice)", () => {
    assert.throws(
      () =>
        calculateSmartSwap({
          current_food_code: "CHICKEN_BREAST_COOKED",
          current_portion_g: 150,
          target_food_code: "RICE_WHITE_COOKED",
          meal_category: MealTimeCategory.MAIN_MEAL,
        }),
      /Invalid Swap: Cannot swap PROTEIN_DOMINANT/,
    );
  });

  await t.test("rejects inappropriate meal context (e.g. beef steak for breakfast)", () => {
    assert.throws(
      () =>
        calculateSmartSwap({
          current_food_code: "WHOLE_EGG",
          current_portion_g: 100,
          target_food_code: "BEEF_TOP_SIRLOIN_LEAN",
          meal_category: MealTimeCategory.BREAKFAST,
        }),
      /Invalid Meal Context/,
    );
  });

  await t.test("listSmartSwapCandidates returns appropriate candidates for breakfast carbs", () => {
    const candidates = listSmartSwapCandidates("OATS_ROLLED_RAW", MealTimeCategory.BREAKFAST);
    assert.ok(candidates.length >= 2);
    assert.ok(candidates.some((c) => c.food_code === "BREAD_WHOLE_WHEAT"));
    assert.ok(candidates.every((c) => c.macro_type === FoodMacroType.CARBOHYDRATE_DOMINANT));
  });
});

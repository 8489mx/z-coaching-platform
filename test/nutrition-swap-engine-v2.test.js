import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateSmartSwap,
  listSmartSwapCandidates,
  MealTimeCategory,
  FoodMacroType,
  NUTRITION_SWAP_ENGINE_V2_VERSION,
} from "../src/nutrition-swap-engine-v2/index.js";

import { generateSmartSwaps, FOOD_SWAP_DATABASE } from "../src/nutrition-meal-context-v2/build-culinary-meals.js";

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

  // --- REGIONAL GCC & EGYPT ENHANCED TESTS ---
  await t.test("Breakfast Carbs context gating excludes Rice and Pasta", () => {
    const breakfastSwaps = generateSmartSwaps("CARBS", 85, "BALADI_BREAD", "BREAKFAST", 10, {});
    const foodCodes = breakfastSwaps.map(s => s.food_code);

    assert.ok(foodCodes.includes("TAMEES_BREAD_WHOLEWHEAT"), "Should include Tamees bread in breakfast");
    assert.ok(foodCodes.includes("SAJ_BREAD_WHOLEWHEAT"), "Should include Saj bread in breakfast");
    assert.ok(foodCodes.includes("BROWN_TOAST"), "Should include Brown toast in breakfast");
    // Owner rule (swapExchangeRules): bread is swapped for bread or potatoes, not for a bowl of
    // oats or for dates.
    assert.ok(!foodCodes.includes("ROLLED_OATS"), "Bread is not swapped for oats");
    assert.ok(!foodCodes.includes("DATES_KHALAS"), "Bread is not swapped for dates");

    assert.ok(!foodCodes.includes("BASMATI_RICE"), "Must NOT include Basmati rice in breakfast");
    assert.ok(!foodCodes.includes("KABSA_SPICED_RICE"), "Must NOT include Kabsa rice in breakfast");
    assert.ok(!foodCodes.includes("EGYPTIAN_RICE"), "Must NOT include Egyptian rice in breakfast");
    assert.ok(!foodCodes.includes("WHOLE_WHEAT_PASTA"), "Must NOT include Pasta in breakfast");
  });

  await t.test("Lunch Carbs context gating excludes Toast and Oats", () => {
    const lunchSwaps = generateSmartSwaps("CARBS", 200, "BASMATI_RICE", "LUNCH", 10, {});
    const foodCodes = lunchSwaps.map(s => s.food_code);

    assert.ok(foodCodes.includes("KABSA_SPICED_RICE"), "Should include Kabsa rice in lunch");
    assert.ok(foodCodes.includes("EGYPTIAN_RICE"), "Should include Egyptian rice in lunch");
    assert.ok(foodCodes.includes("ROASTED_POTATOES"), "Should include Potatoes in lunch");
    assert.ok(foodCodes.includes("SWEET_POTATO"), "Should include Sweet potato in lunch");
    assert.ok(foodCodes.includes("WHOLE_WHEAT_PASTA"), "Should include Pasta in lunch");

    assert.ok(!foodCodes.includes("BROWN_TOAST"), "Must NOT include Toast in lunch");
    assert.ok(!foodCodes.includes("ROLLED_OATS"), "Must NOT include Oats in lunch");
  });

  await t.test("Breakfast & Dinner Protein includes GCC/Egypt staples (Labneh, Halloumi, Shakshouka, Foul)", () => {
    const breakfastProteinSwaps = generateSmartSwaps("PROTEIN", 150, "EGGS_OMELETTE", "BREAKFAST", 10, {});
    const foodCodes = breakfastProteinSwaps.map(s => s.food_code);

    assert.ok(foodCodes.includes("LABNEH_LIGHT"), "Should include Labneh Light");
    assert.ok(foodCodes.includes("HALLOUMI_LIGHT"), "Should include Halloumi Light");
    assert.ok(foodCodes.includes("SHAKSHOUKA_EGGS"), "Should include Shakshouka Eggs");
    assert.ok(foodCodes.includes("COTTAGE_CHEESE"), "Should include Cottage cheese");
    // Leaner cheeses make up the fat with olive oil, the way they are eaten.
    assert.ok(breakfastProteinSwaps.find((s) => s.food_code === "LABNEH_LIGHT").oil_addition_g > 0);
    // Foul carries a bread's worth of carbohydrate and laban is a drink: neither is an egg swap.
    assert.ok(!foodCodes.includes("FOUL_MUDAMMAS"), "Foul is not equivalent to eggs");
    assert.ok(!foodCodes.includes("LABAN_RAYEB_LOWFAT"), "Laban is not an egg swap");
  });

  await t.test("Lunch Protein includes GCC & Egypt meats (Hamour, Kanaad, Bouri, Camel Hashi)", () => {
    const lunchProteinSwaps = generateSmartSwaps("PROTEIN", 200, "CHICKEN_BREAST", "LUNCH", 10, {});
    const foodCodes = lunchProteinSwaps.map(s => s.food_code);

    assert.ok(foodCodes.includes("HAMOUR_FISH"), "Should include Hamour fish");
    assert.ok(foodCodes.includes("KANAAD_KINGFISH"), "Should include Kanaad Kingfish");
    assert.ok(foodCodes.includes("BOURI_FISH"), "Should include Bouri fish");
    assert.ok(foodCodes.includes("CAMEL_MEAT_LEAN"), "Should include Lean Camel meat (Hashi)");
    assert.ok(foodCodes.includes("TILAPIA_FISH"), "Should include Tilapia fish");
  });

  await t.test("Dynamic Fat Offset deducts olive oil when swapping from lean chicken to fatty salmon/halloumi", () => {
    // Salmon adds ~23 g of fat to 200 g of chicken: offered only when the meal has that much oil to
    // leave out (with 12 g the plate would still carry 11 g more fat).
    const swaps = generateSmartSwaps("PROTEIN", 200, "CHICKEN_BREAST", "LUNCH", 25, {});
    assert.ok(!generateSmartSwaps("PROTEIN", 200, "CHICKEN_BREAST", "LUNCH", 12, {}).some((s) => s.food_code === "SALMON_FISH"));
    const salmonSwap = swaps.find(s => s.food_code === "SALMON_FISH");

    assert.ok(salmonSwap, "Salmon swap must exist");
    assert.ok(salmonSwap.oil_deduction_g > 0, "Must calculate positive oil deduction");
    assert.ok(salmonSwap.household_desc.includes("يُخصم"), "Household description must include oil deduction note");
  });

  await t.test("V2 Swap Registry correctly calculates Camel meat and Hamour fish portions", () => {
    const swap = calculateSmartSwap({
      current_food_code: "CHICKEN_BREAST_COOKED",
      current_portion_g: 150, // 150 * 0.31 = 46.5g protein
      target_food_code: "CAMEL_MEAT_LEAN", // 28g protein / 100g -> ~166g
      meal_category: MealTimeCategory.MAIN_MEAL,
    });

    assert.equal(swap.target_food.portion_g, 166);
    assert.ok(swap.target_food.name_ar.includes("حاشي"));
  });

  await t.test("V2 Swap Registry correctly calculates Tamees and Saj bread for breakfast", () => {
    const swap = calculateSmartSwap({
      current_food_code: "BALADI_BREAD",
      current_portion_g: 85, // 85 * 0.52 = 44.2g carbs
      target_food_code: "TAMEES_BREAD_WHOLEWHEAT", // 54g carbs / 100g -> ~82g
      meal_category: MealTimeCategory.BREAKFAST,
    });

    assert.equal(swap.target_food.portion_g, 82);
    assert.ok(swap.target_food.name_ar.includes("تميس"));
  });
});

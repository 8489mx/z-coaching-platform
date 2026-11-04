import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { SMART_SWAP_REGISTRY } from "../src/nutrition-swap-engine-v2/swap-pool-registry.js";
import { FOOD_SWAP_DATABASE } from "../src/nutrition-meal-context-v2/build-culinary-meals.js";
import { PLAN_FOOD_TO_REGISTRY } from "../src/api/services/liveFoodSwapSafety.js";
import { isNoSwapFood, sharesSwapFamily } from "../frontend/src/utils/swapExchangeRules.js";

/**
 * P1-B7: the swap registry's own densities used to disagree with the base table
 * (tuna 26 vs 19.44, cottage 12 vs 10.45, salmon 25 vs 22.1, pasta 26 vs 30.1,
 * saj 50 vs 55.9, oats 66 vs 68.66, popcorn 74 vs 77.8), so the standalone swap
 * portion math over- or under-portioned. Every corrected density below must keep
 * matching its cited source; a drift here is a regression, not a rounding choice.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"));
const JSON39 = JSON.parse(fs.readFileSync(path.join(ROOT, "src/data/food-catalog.json"), "utf8"));
const JSON39_ITEMS = Array.isArray(JSON39) ? JSON39 : (JSON39.items || JSON39.foods || []);

const registry = (code) => SMART_SWAP_REGISTRY.find((i) => i.food_code === code) || null;
const baseItem = (code) => BASE.items.find((i) => i.food_code === code) || null;
const json39 = (id) => JSON39_ITEMS.find((i) => (i.id || i.code) === id) || null;

test("registry protein/carb primaries match the base table or culinary table", () => {
  const cases = [
    // [registry code, macro key, expected, source]
    ["TUNA_CANNED_IN_WATER", "protein", baseItem("TUNA_LIGHT_CANNED_WATER_DRAINED").nutrition_per_100g.protein_g, "base table"],
    ["CHEESE_COTTAGE_LOW_FAT", "protein", baseItem("COTTAGE_CHEESE_LOW_FAT_2_PERCENT").nutrition_per_100g.protein_g, "base table"],
    ["SALMON_ATLANTIC_COOKED", "protein", FOOD_SWAP_DATABASE.SALMON_FISH.protein_per_100g, "culinary (also JSON39 22.1)"],
    ["PASTA_WHOLE_WHEAT_COOKED", "carb", json39("WHOLE_WHEAT_PASTA_COOKED").carbs_per_100g, "JSON39 whole-wheat pasta"],
    ["SAJ_BREAD_WHOLEWHEAT", "carb", FOOD_SWAP_DATABASE.SAJ_BREAD_WHOLEWHEAT.carb_per_100g, "culinary"],
    ["OATS_ROLLED_RAW", "carb", baseItem("OATS_ROLLED_DRY").nutrition_per_100g.carbohydrate_g, "base table (rounded)"],
    ["AIR_POPPED_POPCORN", "carb", FOOD_SWAP_DATABASE.AIR_POPPED_POPCORN.carb_per_100g, "culinary"],
  ];
  for (const [code, key, expected, source] of cases) {
    const item = registry(code);
    assert.ok(item, `${code} missing from registry`);
    const macroKey = key === "protein" ? "PROTEIN_DOMINANT" : "CARBOHYDRATE_DOMINANT";
    assert.equal(item.macro_type, macroKey, `${code} macro type`);
    assert.equal(item.primary_nutrient_per_100g, expected, `${code} must match ${source} (${expected})`);
  }
});

test("registry has exactly one banana code, and the culinary code still resolves", () => {
  const bananas = SMART_SWAP_REGISTRY.filter((i) => /BANANA/.test(i.food_code));
  assert.deepEqual(bananas.map((i) => i.food_code), ["BANANA_RAW"]);
  assert.equal(PLAN_FOOD_TO_REGISTRY.BANANA_FRESH, "BANANA_RAW");
  assert.equal(registry("BANANA_RAW").primary_nutrient_per_100g, 23.0);
  assert.equal(registry("BANANA_RAW").grams_per_household_unit, 120);
});

test("the six previously unresolvable foods are covered", () => {
  // Milks + veggie sides: registry entries with culinary primaries + exact map entries,
  // so they never fall through to the Arabic keyword fallback (oat milk -> dry oats).
  for (const [code, macro, primary] of [
    ["OAT_MILK", "PROTEIN_DOMINANT", FOOD_SWAP_DATABASE.OAT_MILK.protein_per_100g],
    ["RICE_MILK", "PROTEIN_DOMINANT", FOOD_SWAP_DATABASE.RICE_MILK.protein_per_100g],
    ["ALMOND_MILK_UNSWEETENED", "PROTEIN_DOMINANT", FOOD_SWAP_DATABASE.ALMOND_MILK_UNSWEETENED.protein_per_100g],
    ["MEDITERRANEAN_SALAD", "CARBOHYDRATE_DOMINANT", FOOD_SWAP_DATABASE.MEDITERRANEAN_SALAD.carb_per_100g],
    ["SAUTEED_VEGGIES", "CARBOHYDRATE_DOMINANT", FOOD_SWAP_DATABASE.SAUTEED_VEGGIES.carb_per_100g],
  ]) {
    const item = registry(code);
    assert.ok(item, `${code} missing from registry`);
    assert.equal(item.macro_type, macro, `${code} macro type`);
    assert.equal(item.primary_nutrient_per_100g, primary, `${code} primary must equal culinary`);
    assert.equal(PLAN_FOOD_TO_REGISTRY[code], code, `${code} exact map entry`);
  }
  // Pea-rice powder: owner no-swap rule (already in place, must stay).
  assert.equal(isNoSwapFood("PEA_RICE_PROTEIN_POWDER"), true);
  assert.equal(registry("PEA_RICE_PROTEIN_POWDER"), null);
  // Veggie sides swap with each other, not with starches or fruit.
  assert.equal(sharesSwapFamily("MEDITERRANEAN_SALAD", "SAUTEED_VEGGIES"), true);
  assert.equal(sharesSwapFamily("MEDITERRANEAN_SALAD", "BASMATI_RICE"), false);
  assert.equal(sharesSwapFamily("SAUTEED_VEGGIES", "BANANA_RAW"), false);
});

test("culinary names no longer claim a preparation the macros do not carry", () => {
  assert.equal(FOOD_SWAP_DATABASE.COTTAGE_CHEESE.name_en, "Natural Cottage Cheese");
  assert.equal(FOOD_SWAP_DATABASE.COTTAGE_CHEESE.name_ar, "جبن قريش طبيعي");
  assert.equal(FOOD_SWAP_DATABASE.EGGS_OMELETTE.name_en, "Whole Egg Omelette with Vegetables");
  assert.equal(FOOD_SWAP_DATABASE.EGGS_OMELETTE.name_ar, "أومليت بيض كامل بالخضار (كامل بدون هدر الصفار)");
});

test("every base-table nutrition value is rounded to at most 2 decimals", () => {
  for (const item of BASE.items) {
    for (const [key, value] of Object.entries(item.nutrition_per_100g)) {
      const decimals = String(value).includes(".") ? String(value).split(".")[1].length : 0;
      assert.ok(decimals <= 2, `${item.food_code}.${key}=${value} has ${decimals} decimals`);
    }
  }
});

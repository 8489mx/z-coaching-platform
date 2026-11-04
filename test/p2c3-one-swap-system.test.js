import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { calculateSmartSwap } from "../src/nutrition-swap-engine-v2/calculate-smart-swap.js";
import { getSmartFoodRegistryItem } from "../src/nutrition-swap-engine-v2/swap-pool-registry.js";
import { liveSwapTargetGrams, isLiveSwapEquivalent } from "../src/api/services/liveFoodSwapValue.js";
import { isSwapFoodSafe } from "../src/api/services/liveFoodSwapSafety.js";
import { canonicalMacros } from "../src/nutrition-food-catalog/canonical-food-table.js";
import { generateSmartSwaps } from "../src/nutrition-meal-context-v2/build-culinary-meals.js";

/**
 * P2-C3: one swap system. The server v2 engine (calculateSmartSwap) is the only
 * swap computation for served plans and live presses: the web modal asks the
 * server routes, the GOLD catalog route is deleted, and the frontend list/compat
 * helpers are deleted. Grams, oil, and equivalence are judged on the food the
 * client actually has (valueCode), not on its approximate registry twin.
 */

test("P2-C3: engine grams equal live-swap grams for registry pairs (no second computation)", () => {
  for (const [from, to, grams, category] of [
    ["CHICKEN_BREAST_COOKED", "TUNA_CANNED_IN_WATER", 150, "MAIN_MEAL"],
    ["WHOLE_EGG", "CHEESE_COTTAGE_LOW_FAT", 100, "BREAKFAST"],
  ]) {
    const engine = calculateSmartSwap({ current_food_code: from, current_portion_g: grams, target_food_code: to, meal_category: category }).target_food.portion_g;
    const live = liveSwapTargetGrams(from, grams, to, getSmartFoodRegistryItem(from).macro_type);
    assert.equal(engine, live, `${from} -> ${to}`);
  }
});

test("P2-C3: approximation foods use their own canonical row, not the twin's", () => {
  // Basmati (28.2 carb) vs its kabsa twin (28.0); freekeh (31) vs pasta (30.1);
  // guava (14.3) vs apple (13.81). The twin's grams were the old, wrong numbers.
  for (const [orig, twin, target, grams, nutrient] of [
    ["BASMATI_RICE", "KABSA_SPICED_RICE", "TAMEES_BREAD_WHOLEWHEAT", 150, "carbohydrate_g"],
    ["FREEKEH_COOKED", "PASTA_WHOLE_WHEAT_COOKED", "TAMEES_BREAD_WHOLEWHEAT", 150, "carbohydrate_g"],
    ["FRESH_GUAVA", "APPLE_FRESH", "BANANA_RAW", 100, "carbohydrate_g"],
  ]) {
    const origRow = canonicalMacros(orig);
    const targetRow = canonicalMacros(target);
    const expected = Math.round((grams * origRow[nutrient]) / targetRow[nutrient]);
    assert.equal(liveSwapTargetGrams(orig, grams, target, "CARBOHYDRATE_DOMINANT"), expected, `${orig} exact`);
    assert.notEqual(liveSwapTargetGrams(twin, grams, target, "CARBOHYDRATE_DOMINANT"), expected, `${twin} twin differs`);
  }
});

test("P2-C3: culinary plan swaps agree with the engine (same canonical data)", () => {
  const swaps = generateSmartSwaps("PROTEIN", 150, "CHICKEN_BREAST", "LUNCH", 10, {});
  const tuna = swaps.find((s) => s.food_code === "CANNED_TUNA");
  assert.ok(tuna, "culinary list offers tuna for chicken");
  const engine = calculateSmartSwap({ current_food_code: "CHICKEN_BREAST_COOKED", current_portion_g: 150, target_food_code: "TUNA_CANNED_IN_WATER", meal_category: "MAIN_MEAL" }).target_food.portion_g;
  assert.equal(tuna.equivalent_grams, engine, "culinary 239 == engine 239");
});

test("P2-C3: one safety function refuses disliked foods, nuts, and over-cap potato", () => {
  assert.equal(isSwapFoodSafe("TUNA_CANNED_IN_WATER", { dislikedFoodCodes: new Set(["TUNA_CANNED_IN_WATER"]) }), false, "disliked refused");
  assert.equal(isSwapFoodSafe("TUNA_CANNED_IN_WATER", { dislikedFoodCodes: new Set(["CHICKEN_BREAST_COOKED"]) }), true, "other foods pass");
  assert.equal(isSwapFoodSafe("PEANUT_BUTTER", { isNutsExcluded: true }), false, "peanut refused for nut exclusion");
  assert.equal(isSwapFoodSafe("POTATO_BAKED", { isDiabetic: true }, 201), false, "diabetic potato over 200 g refused");
  assert.equal(isSwapFoodSafe("POTATO_BAKED", { isDiabetic: true }, 200), true, "diabetic potato at 200 g allowed");
});

test("P2-C3: equivalence is family + close value, on both sides of the swap", () => {
  assert.equal(isLiveSwapEquivalent("CHICKEN_BREAST_COOKED", 150, "TUNA_CANNED_IN_WATER", 239), true, "chicken->tuna equivalent");
  assert.equal(isLiveSwapEquivalent("CHICKEN_BREAST_COOKED", 150, "TUNA_CANNED_IN_WATER", 100), false, "wrong grams not equivalent");
  assert.equal(isLiveSwapEquivalent("CHICKEN_BREAST_COOKED", 150, "TAMEES_BREAD_WHOLEWHEAT", 150), false, "protein->bread never equivalent");
});

test("P2-C3: the web modal asks the server engine and computes nothing locally", () => {
  const modal = fs.readFileSync("frontend/src/pages/ClientInteractiveApp/components/FoodSwapModal.jsx", "utf8");
  assert.match(modal, /swap-candidates/);
  assert.match(modal, /swap-food/);
  assert.doesNotMatch(modal, /listEquivalentFoodSwaps/);
  assert.doesNotMatch(modal, /FOOD_DATABASE/);
  assert.doesNotMatch(modal, /BASMATI_RICE_COOKED|EXTRA_VIRGIN_OLIVE_OIL/);
});

test("P2-C3: deleted swap paths are gone, and the handlers judge numbers on the real food", () => {
  const serverJs = fs.readFileSync("src/api/server.js", "utf8");
  assert.doesNotMatch(serverJs, /food-swap\/calculate/);
  assert.equal(fs.existsSync("src/execution-engines/food-swap-engine.js"), false, "backend re-export deleted");
  const fe = fs.readFileSync("frontend/src/utils/foodSwapEngine.js", "utf8");
  for (const gone of ["GOLD_FOOD_CATALOG", "calculateEquivalentSwap", "getEligibleSwaps", "listEquivalentFoodSwaps", "getCompatibleSwaps"]) {
    assert.doesNotMatch(fe, new RegExp(`export (const|function) ${gone}`), gone);
  }
  const controller = fs.readFileSync("src/api/controllers/program.controller.js", "utf8");
  assert.match(controller, /function valueCodeFor/);
  assert.match(controller, /liveSwapTargetGrams\(valueCode/);
  assert.match(controller, /isLiveSwapEquivalent\(valueCode/);
  assert.match(controller, /liveSwapValueWithOil\(valueCode/);
  // The engine refusing a candidate never falls back to a hand-computed portion.
  assert.doesNotMatch(controller, /primary_nutrient_per_100g \/ cand\.primary_nutrient_per_100g/);
});

test("P2-C3 documented decisions: stored plan alternatives are not served, v1 engine stays a build-time stage", () => {
  const controller = fs.readFileSync("src/api/controllers/program.controller.js", "utf8");
  const view = controller.slice(controller.indexOf("const client_view"), controller.indexOf("const client_view") + 600);
  assert.doesNotMatch(view, /alternatives/, "client_view carries no alternatives: the live swap UI is the alternatives surface");
  assert.equal(fs.existsSync("src/nutrition-swap-engine/build-nutrition-swap-engine.js"), true, "v1 engine retained as a build-time preflight stage, not a user swap path");
  assert.match(controller, /swapLock\?\.locked/, "server swap execute still refuses locked clients (P0-A4)");
});

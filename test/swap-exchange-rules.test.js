import test from "node:test";
import assert from "node:assert/strict";

import { SWAP_FAMILIES, sharesSwapFamily, isCloseInValue, isEquivalentSwap } from "../frontend/src/utils/swapExchangeRules.js";
import { FOOD_SWAP_DATABASE } from "../src/nutrition-meal-context-v2/build-culinary-meals.js";
import { SMART_SWAP_REGISTRY } from "../src/nutrition-swap-engine-v2/swap-pool-registry.js";

/** One swap rule for every swap: eaten the same way, and about the same energy and fat. */

test("every food the plan or the mobile app can swap has a family (vegetables and sweets excluded)", () => {
  const notSwapped = new Set(["MEDITERRANEAN_SALAD", "SAUTEED_VEGGIES", "DARK_CHOCOLATE_85"]);
  const missing = [
    ...Object.keys(FOOD_SWAP_DATABASE).filter((c) => !notSwapped.has(c)),
    ...SMART_SWAP_REGISTRY.map((r) => r.food_code),
  ].filter((c) => !SWAP_FAMILIES[c]);
  assert.deepEqual(missing, []);
});

test("foods eaten the same way match; foods eaten differently do not", () => {
  assert.ok(sharesSwapFamily("CHICKEN_BREAST", "TILAPIA_FISH"));
  assert.ok(sharesSwapFamily("BASMATI_RICE", "BALADI_BREAD"));
  assert.ok(sharesSwapFamily("SWEET_POTATO", "DATES_KHALAS"), "baked sweet potato is also a sweet snack");
  assert.ok(sharesSwapFamily("EGGS_OMELETTE", "FOUL_MUDAMMAS"));
  assert.ok(!sharesSwapFamily("CHICKEN_BREAST", "LABAN_RAYEB_LOWFAT"));
  assert.ok(!sharesSwapFamily("BALADI_BREAD", "WATERMELON_FRESH"));
  assert.ok(!sharesSwapFamily("OLIVE_OIL", "RAW_ALMONDS"));
  assert.ok(!sharesSwapFamily("CHICKEN_BREAST", "UNKNOWN_FOOD"));
});

test("value: energy within 25% and fat within 10 g", () => {
  assert.ok(isCloseInValue({ fromKcal: 160, toKcal: 181, fromFat: 4, toFat: 8 }));
  assert.ok(!isCloseInValue({ fromKcal: 160, toKcal: 246, fromFat: 4, toFat: 15 }), "chicken -> salmon, +54%");
  assert.ok(!isCloseInValue({ fromKcal: 200, toKcal: 210, fromFat: 2, toFat: 14 }), "same energy, 12 g more fat");
  assert.ok(!isCloseInValue({ fromKcal: 0, toKcal: 100 }));
  assert.ok(isEquivalentSwap({ fromCode: "CHICKEN_BREAST", toCode: "LEAN_BEEF", fromKcal: 160, toKcal: 181, fromFat: 4, toFat: 8 }));
  assert.ok(!isEquivalentSwap({ fromCode: "CHICKEN_BREAST", toCode: "FOUL_MUDAMMAS", fromKcal: 160, toKcal: 160, fromFat: 4, toFat: 4 }));
});

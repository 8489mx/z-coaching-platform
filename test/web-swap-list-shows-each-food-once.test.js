import test from "node:test";
import assert from "node:assert/strict";

import { FOOD_DATABASE, listEquivalentFoodSwaps } from "../frontend/src/utils/foodSwapEngine.js";

/**
 * The web client's swap window listed the same food several times (kingfish 3 times, tilapia 4,
 * Egyptian rice 3): the food list keeps alias keys that point to the same food. Each food now
 * appears once, and never the food being swapped under another key.
 */
const FROM = [["CHICKEN_BREAST", 150], ["BASMATI_RICE_COOKED", 200], ["EXTRA_VIRGIN_OLIVE_OIL", 10], ["ROLLED_OATS_RAW", 60], ["WHOLE_EGG", 100], ["APPLE", 150]];

test("each food appears once in the swap list", () => {
  for (const [code, grams] of FROM) {
    const list = listEquivalentFoodSwaps(code, grams, {});
    const codes = list.map((s) => s.replacement_food.code);
    const names = list.map((s) => s.replacement_food.name_ar);
    assert.equal(new Set(codes).size, codes.length, `${code}: ${codes.join(", ")}`);
    assert.equal(new Set(names).size, names.length, `${code}: ${names.join(" | ")}`);
    assert.ok(!names.includes(FOOD_DATABASE[code].name_ar), `${code} offered as its own swap`);
  }
});

test("the list still offers the real alternatives", () => {
  const codes = listEquivalentFoodSwaps("CHICKEN_BREAST", 150, {}).map((s) => s.replacement_food.code);
  assert.ok(codes.includes("TILAPIA_BOLTI_GRILLED") && codes.includes("KANAAD_KINGFISH_GRILLED"), codes.join());
});

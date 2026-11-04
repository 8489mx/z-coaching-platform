import test from "node:test";
import assert from "node:assert/strict";

import { FOOD_DATABASE } from "../frontend/src/utils/foodSwapEngine.js";
import { DISLIKED_FOOD_LABEL_WEB_CODES } from "../frontend/src/utils/dislikedFoods.js";
import { DISLIKED_FOOD_LABEL_CODES } from "../src/intake-decision-engine/adapters/disliked-foods.js";
import { deriveClinicalConstraints } from "../src/api/controllers/program.controller.js";

/**
 * P2-C3: the web swap window no longer computes swaps locally, so the two
 * subtests that pinned its local list are deleted (disliked refusal is now
 * covered at the server safety level in test/p2c3-one-swap-system.test.js).
 * What survives here still holds: every disliked-food label maps to web codes
 * that exist in the food list, and the server still sends the client's disliked
 * foods with the clinical constraints.
 */
test("every disliked-food label has web codes that exist in the web food list", () => {
  assert.deepEqual(Object.keys(DISLIKED_FOOD_LABEL_WEB_CODES).sort(), Object.keys(DISLIKED_FOOD_LABEL_CODES).sort());
  for (const [label, codes] of Object.entries(DISLIKED_FOOD_LABEL_WEB_CODES)) {
    assert.ok(codes.length > 0, label);
    for (const code of codes) assert.ok(FOOD_DATABASE[code], `${label}: ${code} is not in the web food list`);
  }
});

test("the server sends the client's disliked foods with the clinical constraints", () => {
  const constraints = deriveClinicalConstraints({ disliked_foods: ["تونة", "سمك بلطي"], medical_conditions: { selected: ["none"] }, strict_allergies: ["none"] });
  assert.deepEqual(constraints.disliked_foods, ["تونة", "سمك بلطي"]);
});

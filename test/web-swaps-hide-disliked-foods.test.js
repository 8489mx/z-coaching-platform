import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { FOOD_DATABASE, listEquivalentFoodSwaps } from "../frontend/src/utils/foodSwapEngine.js";
import { DISLIKED_FOOD_LABEL_WEB_CODES, webCodesForDislikes } from "../frontend/src/utils/dislikedFoods.js";
import { DISLIKED_FOOD_LABEL_CODES } from "../src/intake-decision-engine/adapters/disliked-foods.js";
import { deriveClinicalConstraints } from "../src/api/controllers/program.controller.js";

/**
 * The plan and the app's live swaps leave out the foods a client said they do not like; the web
 * client's swap window still offered them. The server now sends the labels with the clinical
 * constraints, and the web swap check refuses their codes.
 */
const codesOf = (list) => list.map((s) => s.replacement_food.code);

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

test("the web swap window never offers a disliked food", () => {
  const before = codesOf(listEquivalentFoodSwaps("CHICKEN_BREAST", 150, {}));
  assert.ok(before.includes("TILAPIA_BOLTI_GRILLED") && before.includes("CANNED_TUNA_IN_WATER"));
  const after = codesOf(listEquivalentFoodSwaps("CHICKEN_BREAST", 150, { disliked_food_codes: webCodesForDislikes(["تونة", "سمك بلطي"]) }));
  for (const bad of ["TILAPIA_BOLTI_GRILLED", "TILAPIA_FISH", "CANNED_TUNA_IN_WATER", "CANNED_TUNA"]) assert.ok(!after.includes(bad), bad);
  assert.ok(after.length > 0);
});

test("the client app passes the codes into the swap check", () => {
  const hook = fs.readFileSync("frontend/src/pages/ClientInteractiveApp/hooks/useClientInteractiveData.js", "utf8");
  assert.match(hook, /disliked_food_codes: webCodesForDislikes\(constraints\.disliked_foods\)/);
});

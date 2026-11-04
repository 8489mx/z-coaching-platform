import test from "node:test";
import assert from "node:assert/strict";

import { SMART_SWAP_REGISTRY, listSmartSwapCandidates } from "../src/nutrition-swap-engine-v2/swap-pool-registry.js";

/**
 * P2-C3: the web client's local swap list is deleted; the one engine's registry
 * is the list now. The old bug was alias keys listing the same food several
 * times (kingfish 3 times, tilapia 4, Egyptian rice 3). Registry codes and
 * display names are unique, so each food appears once, and a food is never
 * offered as its own swap.
 */
test("each food appears once in the swap registry", () => {
  const codes = SMART_SWAP_REGISTRY.map((item) => item.food_code);
  assert.equal(new Set(codes).size, codes.length, codes.join(", "));
  const names = SMART_SWAP_REGISTRY.map((item) => item.name_ar);
  assert.equal(new Set(names).size, names.length, names.join(" | "));
});

test("the list still offers the real alternatives", () => {
  const codes = listSmartSwapCandidates("CHICKEN_BREAST_COOKED", "MAIN_MEAL").map((c) => c.food_code);
  assert.ok(codes.includes("TILAPIA_COOKED") && codes.includes("KANAAD_KINGFISH"), codes.join());
  assert.ok(!codes.includes("CHICKEN_BREAST_COOKED"), "a food is never its own swap");
});

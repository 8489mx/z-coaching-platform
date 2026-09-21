import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { isNoSwapFood, NO_SWAP_NOTE_AR } from "../frontend/src/utils/swapExchangeRules.js";
import { generateSmartSwaps, keepEquivalentSwaps } from "../src/nutrition-meal-context-v2/build-culinary-meals.js";
import { getSwapCandidatesHandler, calculateSwapHandler } from "../src/api/controllers/program.controller.js";
import { User, IntakeSubmission } from "../src/api/models/index.js";
import sequelize from "../src/api/config/database.js";

/**
 * Owner rule: protein powder has no swap. A client who has it takes it; when it runs out they tell
 * the coach and the protein comes from ordinary food. The client sees that instead of a list of
 * foods "equal" to a scoop (750 g of yogurt).
 */
const call = async (fn, req) => { const out = {}; await fn(req, { status(c) { out.status = c; return this; }, json(b) { out.body = b; return this; } }); return out; };
const CODE = "TEST_NO_SWAP_POWDER_973";
let client;
test.before(async () => {
  const existing = await User.findOne({ where: { client_code: CODE } });
  if (existing) await existing.destroy();
  client = await User.create({ client_code: CODE, phone_number: "01099000973", full_name: "Powder", role: "CLIENT" });
});
test.after(async () => {
  await client?.destroy().catch(() => {});
  await sequelize.close().catch(() => {});
});

test("every protein powder code in the plan, web and mobile lists is a no-swap food", () => {
  for (const code of ["WHEY_PROTEIN", "WHEY_PROTEIN_POWDER", "WHEY_PROTEIN_ISOLATE", "MICELLAR_CASEIN", "PEA_RICE_PROTEIN_POWDER"]) assert.ok(isNoSwapFood(code), code);
  assert.ok(!isNoSwapFood("GREEK_YOGURT"));
  assert.match(NO_SWAP_NOTE_AR, /الكوتش/);
});

test("the plan gives protein powder no swaps and the note", () => {
  assert.deepEqual(generateSmartSwaps("PROTEIN", 30, "WHEY_PROTEIN", "SNACK", 0, {}), []);
  const [meal] = keepEquivalentSwaps([{ items: [{ food_code: "WHEY_PROTEIN", category: "PROTEIN", portion_g: 30, protein_g: 24, carb_g: 2, fat_g: 1, calories_kcal: 113,
    swaps: [{ food_code: "GREEK_YOGURT", equivalent_grams: 240, protein_g: 24, carb_g: 9, fat_g: 1, calories_kcal: 141 }] }] }]);
  assert.deepEqual(meal.items[0].swaps, []);
  assert.equal(meal.items[0].swap_note_ar, NO_SWAP_NOTE_AR);
});

test("the mobile app gets no candidates for protein powder, with the note, and swap-food refuses it", async () => {
  const original = IntakeSubmission.findOne;
  IntakeSubmission.findOne = async () => null;
  try {
    const list = await call(getSwapCandidatesHandler, { user: { id: client.id }, body: { food_code: "WHEY_PROTEIN", source_grams: 30 } });
    assert.equal(list.status, 200);
    assert.deepEqual(list.body.candidates, []);
    assert.equal(list.body.message_ar, NO_SWAP_NOTE_AR);
    const swap = await call(calculateSwapHandler, { user: { id: client.id }, body: { current_food_code: "WHEY_PROTEIN", current_portion_g: 30, target_food_code: "YOGURT_GREEK_PLAIN_NONFAT" } });
    assert.equal(swap.status, 409);
    assert.equal(swap.body.code, "NO_SWAP_FOR_FOOD");
  } finally {
    IntakeSubmission.findOne = original;
  }
});

test("the web swap window and the client's meal items carry the note", () => {
  const modal = fs.readFileSync("frontend/src/pages/ClientInteractiveApp/components/FoodSwapModal.jsx", "utf8");
  assert.match(modal, /isNoSwapFood\(/);
  assert.match(modal, /NO_SWAP_NOTE_AR/);
  const controller = fs.readFileSync("src/api/controllers/program.controller.js", "utf8");
  assert.match(controller, /withNoSwapNotes\(/);
});

import test from "node:test";
import assert from "node:assert/strict";

import { getSwapCandidatesHandler, calculateSwapHandler } from "../src/api/controllers/program.controller.js";
import { User, IntakeSubmission } from "../src/api/models/index.js";
import sequelize from "../src/api/config/database.js";

/**
 * Salmon had no mobile swap (every other fish or meat is leaner) and whole eggs only egg white and
 * shakshouka. Like the plan's swaps, a leaner swap now comes with the missing fat as olive oil
 * (at most 15 g), shown in its name and counted in the calories the app receives.
 */
const CODE = "TEST_LIVE_SWAP_OIL_975";
const call = async (fn, req) => { const out = {}; await fn(req, { status(c) { out.status = c; return this; }, json(b) { out.body = b; return this; } }); return out; };
let client;
test.before(async () => {
  const existing = await User.findOne({ where: { client_code: CODE } });
  if (existing) await existing.destroy();
  client = await User.create({ client_code: CODE, phone_number: "01099000975", full_name: "Swap oil", role: "CLIENT" });
});
test.after(async () => {
  await client?.destroy().catch(() => {});
  await sequelize.close().catch(() => {});
});
async function run(fn, body) {
  const original = IntakeSubmission.findOne;
  IntakeSubmission.findOne = async () => null;
  try {
    return await call(fn, { user: { id: client.id }, body });
  } finally {
    IntakeSubmission.findOne = original;
  }
}

test("salmon can become leaner fish or meat with olive oil added", async () => {
  const out = await run(getSwapCandidatesHandler, { food_code: "SALMON_FISH", source_grams: 150, meal_context: "LUNCH" });
  const withOil = out.body.candidates.filter((c) => c.oil_addition_g > 0);
  assert.ok(withOil.length >= 2, JSON.stringify(out.body.candidates.map((c) => c.food_code)));
  for (const c of withOil) {
    assert.ok(c.oil_addition_g <= 15);
    assert.match(c.display_ar, /زيت زيتون/);
  }
});

test("swap-food counts the added oil in the calories and names it", async () => {
  const out = await run(calculateSwapHandler, { current_food_code: "SALMON_FISH", current_portion_g: 150, target_food_code: "TILAPIA_COOKED", meal_category: "MAIN_MEAL" });
  assert.equal(out.status, 200, JSON.stringify(out.body));
  const t = out.body.swap.target_food;
  assert.ok(t.oil_addition_g > 0);
  assert.match(out.body.swapped_food.name_ar, /زيت زيتون/);
  const bare = await run(calculateSwapHandler, { current_food_code: "CHICKEN_BREAST", current_portion_g: 150, target_food_code: "TILAPIA_COOKED", meal_category: "MAIN_MEAL" });
  assert.ok(!bare.body.swap.target_food.oil_addition_g, "no oil when the fat is already close");
  // Salmon 150 g = 300 kcal (meal generator macros): tilapia + oil stays within 25%.
  assert.ok(Math.abs(t.calories - 300) / 300 <= 0.25, String(t.calories));
});

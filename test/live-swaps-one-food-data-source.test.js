import test from "node:test";
import assert from "node:assert/strict";

import { getSwapCandidatesHandler, calculateSwapHandler } from "../src/api/controllers/program.controller.js";
import { liveSwapPortionValue } from "../src/api/services/liveFoodSwapValue.js";
import { SMART_SWAP_REGISTRY } from "../src/nutrition-swap-engine-v2/swap-pool-registry.js";
import { User, IntakeSubmission } from "../src/api/models/index.js";
import sequelize from "../src/api/config/database.js";

/**
 * The mobile swap portion came from the swap registry's own densities (tuna 26 g protein/100 g)
 * while the plan and the value check use the meal generator's food data (tuna 19.4 g, USDA drained
 * light tuna in water); egg and egg white were valued as an omelette cooked with fat, and peanut
 * butter had no data. Portion and value now come from one source, so a swap keeps the main nutrient.
 */
const CODE = "TEST_LIVE_SWAP_DATA_976";
const call = async (fn, req) => { const out = {}; await fn(req, { status(c) { out.status = c; return this; }, json(b) { out.body = b; return this; } }); return out; };
let client;
test.before(async () => {
  const existing = await User.findOne({ where: { client_code: CODE } });
  if (existing) await existing.destroy();
  client = await User.create({ client_code: CODE, phone_number: "01099000976", full_name: "Swap data", role: "CLIENT" });
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
const MAIN = { PROTEIN_DOMINANT: "protein", CARBOHYDRATE_DOMINANT: "carbs", FAT_DOMINANT: "fat" };

test("every mobile swap keeps the main nutrient of the portion it replaces (within 1.5 g)", async () => {
  const bad = [];
  for (const food of SMART_SWAP_REGISTRY) {
    const grams = 100;
    const list = await run(getSwapCandidatesHandler, { food_code: food.food_code, source_grams: grams });
    for (const cand of list.body.candidates || []) {
      const out = await run(calculateSwapHandler, { current_food_code: food.food_code, current_portion_g: grams, target_food_code: cand.food_code });
      if (out.status !== 200) { bad.push(`${food.food_code}->${cand.food_code} status ${out.status}`); continue; }
      const key = MAIN[food.macro_type];
      const from = liveSwapPortionValue(food.food_code, grams)[key];
      const to = liveSwapPortionValue(cand.food_code, out.body.swap.target_food.portion_g)[key];
      if (Math.abs(from - to) > 1.5) bad.push(`${food.food_code} ${from.toFixed(1)} -> ${cand.food_code} ${to.toFixed(1)}`);
      if (out.body.swap.target_food.portion_g !== cand.target_grams) bad.push(`${food.food_code}->${cand.food_code} list ${cand.target_grams} g vs swap ${out.body.swap.target_food.portion_g} g`);
    }
  }
  assert.deepEqual(bad, []);
});

test("egg white is valued as egg white, and peanut butter has data", () => {
  const white = liveSwapPortionValue("EGG_WHITE", 100);
  assert.ok(white.fat < 1 && white.protein > 10 && white.kcal < 60, JSON.stringify(white));
  const egg = liveSwapPortionValue("WHOLE_EGG", 100);
  assert.ok(egg.protein > 12 && egg.fat > 9, JSON.stringify(egg));
  const pb = liveSwapPortionValue("PEANUT_BUTTER", 100);
  assert.ok(pb && pb.fat > 45 && pb.kcal > 550, JSON.stringify(pb));
});

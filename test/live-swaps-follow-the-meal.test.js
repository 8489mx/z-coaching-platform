import test from "node:test";
import assert from "node:assert/strict";

import { getSwapCandidatesHandler } from "../src/api/controllers/program.controller.js";
import { User, Program, IntakeSubmission } from "../src/api/models/index.js";
import sequelize from "../src/api/config/database.js";

/**
 * The mobile app names no meal when it asks for swaps, so breakfast bread could be offered rice.
 * The server now finds the food in the client's own active plan and uses that meal.
 */
const CODE = "TEST_SWAP_MEAL_974";
const call = async (fn, req) => { const out = {}; await fn(req, { status(c) { out.status = c; return this; }, json(b) { out.body = b; return this; } }); return out; };

let client;
let program;
test.before(async () => {
  const existing = await User.findOne({ where: { client_code: CODE } });
  if (existing) {
    await Program.destroy({ where: { user_id: existing.id } });
    await existing.destroy();
  }
  client = await User.create({ client_code: CODE, phone_number: "01099000974", full_name: "Swap meal", role: "CLIENT" });
  program = await Program.create({
    user_id: client.id, status: "ACTIVE", version: 1,
    program_data: { nutrition: { meals: [
      { meal_number: 1, meal_name_ar: "وجبة الإفطار", items: [{ food_code: "BALADI_BREAD", portion_g: 85 }, { food_code: "EGGS_OMELETTE", portion_g: 110 }] },
      { meal_number: 2, meal_name_ar: "وجبة الغداء", items: [{ food_code: "BASMATI_RICE", portion_g: 200 }, { food_code: "CHICKEN_BREAST", portion_g: 150 }] },
      { meal_number: 3, meal_name_ar: "وجبة العشاء", items: [{ code: "BALADI_BREAD", amount: 170 }] },
    ] } },
  });
});
test.after(async () => {
  await program?.destroy().catch(() => {});
  await client?.destroy().catch(() => {});
  await sequelize.close().catch(() => {});
});

async function candidates(food_code, source_grams) {
  const original = IntakeSubmission.findOne;
  IntakeSubmission.findOne = async () => null;
  try {
    const out = await call(getSwapCandidatesHandler, { user: { id: client.id }, body: { food_code, source_grams } });
    assert.equal(out.status, 200, JSON.stringify(out.body));
    return out.body.candidates.map((c) => c.food_code);
  } finally {
    IntakeSubmission.findOne = original;
  }
}

test("breakfast bread (found in the client's breakfast) is not offered rice or pasta", async () => {
  const codes = await candidates("BALADI_BREAD", 85);
  assert.ok(codes.includes("TAMEES_BREAD_WHOLEWHEAT"), codes.join(","));
  for (const bad of ["RICE_WHITE_COOKED", "EGYPTIAN_RICE", "KABSA_SPICED_RICE", "PASTA_WHOLE_WHEAT_COOKED"]) assert.ok(!codes.includes(bad), `${bad} offered`);
});

test("the same bread at dinner (closest portion) may become rice or potatoes, and lunch rice may become bread", async () => {
  const dinner = await candidates("BALADI_BREAD", 170);
  assert.ok(dinner.some((c) => ["RICE_WHITE_COOKED", "EGYPTIAN_RICE", "POTATO_BAKED"].includes(c)), dinner.join(","));
  const rice = await candidates("BASMATI_RICE", 200);
  assert.ok(rice.includes("BALADI_BREAD"), rice.join(","));
});

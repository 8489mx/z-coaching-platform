import test from "node:test";
import assert from "node:assert/strict";

import { getSwapCandidatesHandler, calculateSwapHandler } from "../src/api/controllers/program.controller.js";
import { User, IntakeSubmission } from "../src/api/models/index.js";
import sequelize from "../src/api/config/database.js";

/**
 * The mobile app's swaps matched only the main nutrient: chicken at lunch was offered 860 g of
 * laban (+115% energy), foul (+187%), shakshouka (+118%); bread at breakfast was offered 400 g of
 * watermelon. A swap is now the same kind of food with energy within 25% and fat within 10 g.
 */
const CODE = "TEST_LIVE_SWAP_VALUE_972";
const call = async (fn, req) => { const out = {}; await fn(req, { status(c) { out.status = c; return this; }, json(b) { out.body = b; return this; } }); return out; };

let client;
test.before(async () => {
  const existing = await User.findOne({ where: { client_code: CODE } });
  if (existing) await existing.destroy();
  client = await User.create({ client_code: CODE, phone_number: "01099000972", full_name: "Swap value", role: "CLIENT" });
});
test.after(async () => {
  await client?.destroy().catch(() => {});
  await sequelize.close().catch(() => {});
});

async function candidates(food_code, source_grams, meal_context) {
  const original = IntakeSubmission.findOne;
  IntakeSubmission.findOne = async () => null;
  try {
    const out = await call(getSwapCandidatesHandler, { user: { id: client.id }, body: { food_code, source_grams, meal_context } });
    assert.equal(out.status, 200, JSON.stringify(out.body));
    return out.body.candidates.map((c) => c.food_code);
  } finally {
    IntakeSubmission.findOne = original;
  }
}

test("chicken at lunch is swapped for meat or fish of about the same energy, never laban, foul or eggs", async () => {
  const codes = await candidates("CHICKEN_BREAST", 150, "LUNCH");
  // Lean beef is 26% more energy than chicken for the same protein (USDA-based data), just past the
  // rule; fish and camel meat stay.
  assert.ok(codes.includes("TILAPIA_COOKED") && codes.filter((c) => ["HAMOUR_FISH", "KANAAD_KINGFISH", "BOURI_FISH", "CAMEL_MEAT_LEAN"].includes(c)).length >= 3, codes.join(","));
  for (const bad of ["LABAN_RAYEB_LOWFAT", "FOUL_MUDAMMAS", "SHAKSHOUKA_EGGS", "LABNEH_LIGHT", "HALLOUMI_LIGHT", "LUPINI_BEANS", "SALMON_ATLANTIC_COOKED"]) {
    assert.ok(!codes.includes(bad), `${bad} offered`);
  }
});

test("bread at breakfast is swapped for bread, never for fruit", async () => {
  const codes = await candidates("BALADI_BREAD", 85, "BREAKFAST");
  assert.ok(codes.includes("TAMEES_BREAD_WHOLEWHEAT"), codes.join(","));
  for (const bad of ["WATERMELON_FRESH", "STRAWBERRY_FRESH", "APPLE_FRESH", "ORANGE_FRESH", "BANANA_FRESH", "DATES_KHALAS"]) {
    assert.ok(!codes.includes(bad), `${bad} offered`);
  }
});

test("rice at lunch can become potatoes or bread", async () => {
  const codes = await candidates("BASMATI_RICE", 200, "LUNCH");
  assert.ok(codes.includes("POTATO_BAKED") && codes.includes("BALADI_BREAD"), codes.join(","));
});

test("swap-food returns the new portion's calories and macros (the app showed 0 kcal after every swap)", async () => {
  const original = IntakeSubmission.findOne;
  IntakeSubmission.findOne = async () => null;
  try {
    const out = await call(calculateSwapHandler, { user: { id: client.id }, body: { current_food_code: "CHICKEN_BREAST", current_portion_g: 150, target_food_code: "TILAPIA_COOKED" } });
    assert.equal(out.status, 200, JSON.stringify(out.body));
    const t = out.body.swap.target_food;
    assert.ok(t.calories > 100 && t.protein_g > 30 && t.fat_g >= 0 && t.carbs_g >= 0, JSON.stringify(t));
    assert.equal(out.body.swapped_food.calories, t.calories);
  } finally {
    IntakeSubmission.findOne = original;
  }
});

test("a breakfast swap offered by swap-candidates also works in swap-food (the app sends no meal)", async () => {
  const offered = await candidates("WHOLE_EGG", 150);
  assert.ok(offered.includes("EGG_WHITE"), offered.join(","));
  const fruit = await candidates("BANANA_FRESH", 120);
  assert.ok(fruit.includes("APPLE_FRESH") && !fruit.includes("BALADI_BREAD"), fruit.join(","));
  const original = IntakeSubmission.findOne;
  IntakeSubmission.findOne = async () => null;
  try {
    const out = await call(calculateSwapHandler, { user: { id: client.id }, body: { current_food_code: "WHOLE_EGG", current_portion_g: 150, target_food_code: "EGG_WHITE" } });
    assert.equal(out.status, 200, JSON.stringify(out.body));
  } finally {
    IntakeSubmission.findOne = original;
  }
});

test("a swap the rule does not offer is refused when sent directly", async () => {
  const original = IntakeSubmission.findOne;
  IntakeSubmission.findOne = async () => null;
  try {
    const refused = await call(calculateSwapHandler, { user: { id: client.id }, body: { source_food_code: "CHICKEN_BREAST", source_grams: 150, target_food_code: "SHAKSHOUKA_EGGS", meal_category: "MAIN_MEAL" } });
    assert.equal(refused.status, 409);
    assert.equal(refused.body.code, "SWAP_NOT_EQUIVALENT");
    const allowed = await call(calculateSwapHandler, { user: { id: client.id }, body: { source_food_code: "CHICKEN_BREAST", source_grams: 150, target_food_code: "TILAPIA_COOKED", meal_category: "MAIN_MEAL" } });
    assert.equal(allowed.status, 200, JSON.stringify(allowed.body));
  } finally {
    IntakeSubmission.findOne = original;
  }
});

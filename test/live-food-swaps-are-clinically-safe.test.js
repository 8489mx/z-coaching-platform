import test from "node:test";
import assert from "node:assert/strict";

import { getSwapCandidatesHandler, calculateSwapHandler } from "../src/api/controllers/program.controller.js";
import { User, IntakeSubmission } from "../src/api/models/index.js";
import sequelize from "../src/api/config/database.js";

/**
 * The mobile app asks the server for food swaps (swap-candidates, then swap-food). Those endpoints
 * checked nothing about the client: a coeliac client was offered bread, a nut-allergic one peanut
 * butter, a diabetic one dates. They now use the same restrictions the meal plan was built with.
 */
const CODE = "TEST_LIVE_SWAPS_971";
const answers = (selected, allergies, extra = {}) => ({ answers: {
  gender: "female", age: "40", height_cm: "165", weight_kg: "80", primary_goal: "fat_loss", dangerous_symptoms: ["NONE"],
  medical_conditions: { has_conditions: true, selected, diabetes: { type: "type2", uses_insulin: false }, ...extra },
  injuries_map: { has_injuries: false, selected_areas: ["none"] }, strict_allergies: allergies,
  training_logistics: { days_per_week: 3, experience_level: "beginner" },
} });
const call = async (fn, req) => { const out = {}; await fn(req, { status(c) { out.status = c; return this; }, json(b) { out.body = b; return this; } }); return out; };

let client;
test.before(async () => {
  const existing = await User.findOne({ where: { client_code: CODE } });
  if (existing) await existing.destroy();
  client = await User.create({ client_code: CODE, phone_number: "01099000971", full_name: "Swaps", role: "CLIENT" });
});
test.after(async () => {
  await client?.destroy().catch(() => {});
  await sequelize.close().catch(() => {});
});

async function candidatesFor(foodCode, intake, grams = 150) {
  const original = IntakeSubmission.findOne;
  IntakeSubmission.findOne = async () => ({ answers: intake });
  try {
    const out = await call(getSwapCandidatesHandler, { user: { id: client.id }, body: { food_code: foodCode, source_grams: grams } });
    assert.equal(out.status, 200, JSON.stringify(out.body));
    return out.body.candidates.map((c) => c.food_code);
  } finally {
    IntakeSubmission.findOne = original;
  }
}

test("a coeliac diabetic is never offered gluten or high glycemic carbohydrates", async () => {
  const codes = await candidatesFor("BASMATI_RICE", answers(["diabetes"], ["gluten_celiac"]));
  assert.ok(codes.length > 0, "some safe swap is offered");
  for (const bad of ["BALADI_BREAD", "BREAD_WHOLE_WHEAT", "TAMEES_BREAD_WHOLEWHEAT", "SAJ_BREAD_WHOLEWHEAT", "PASTA_WHOLE_WHEAT_COOKED", "OATS_ROLLED_RAW", "DATES_KHALAS", "RICE_CAKES", "KABSA_SPICED_RICE", "EGYPTIAN_RICE"]) {
    assert.ok(!codes.includes(bad), `${bad} offered`);
  }
});

test("allergies: nuts, sesame, eggs, fish and dairy are never offered to a client allergic to them", async () => {
  const fats = await candidatesFor("OLIVE_OIL", answers([], ["peanuts_tree_nuts", "sesame_seeds"]), 10);
  for (const bad of ["PEANUT_BUTTER", "ALMONDS_RAW", "RAW_TAHINI"]) assert.ok(!fats.includes(bad), `${bad} offered`);
  const proteins = await candidatesFor("CHICKEN_BREAST", answers([], ["eggs", "fish_shellfish", "dairy_lactose"]));
  for (const bad of ["WHOLE_EGG", "EGG_WHITE", "SHAKSHOUKA_EGGS", "TILAPIA_COOKED", "SALMON_ATLANTIC_COOKED", "TUNA_CANNED_IN_WATER", "HAMOUR_FISH", "CHEESE_COTTAGE_LOW_FAT", "YOGURT_GREEK_PLAIN_NONFAT", "WHEY_PROTEIN_POWDER", "LABNEH_LIGHT"]) {
    assert.ok(!proteins.includes(bad), `${bad} offered`);
  }
});

test("favism and gout: no legumes, no high-purine meat or fish", async () => {
  const codes = await candidatesFor("CHICKEN_BREAST", answers(["favism_g6pd", "gout"], ["none"]));
  for (const bad of ["FOUL_MUDAMMAS", "LUPINI_BEANS", "BEEF_TOP_SIRLOIN_LEAN", "TUNA_CANNED_IN_WATER", "SALMON_ATLANTIC_COOKED"]) assert.ok(!codes.includes(bad), `${bad} offered`);
});

test("a client with no restrictions still gets the full list", async () => {
  const codes = await candidatesFor("BASMATI_RICE", answers([], ["none"]));
  assert.ok(codes.includes("BALADI_BREAD") || codes.includes("PASTA_WHOLE_WHEAT_COOKED"));
});

test("swap-food refuses an unsafe target sent directly", async () => {
  const original = IntakeSubmission.findOne;
  IntakeSubmission.findOne = async () => ({ answers: answers([], ["gluten_celiac"]) });
  try {
    const out = await call(calculateSwapHandler, { user: { id: client.id }, body: { current_food_code: "BASMATI_RICE", current_portion_g: 150, target_food_code: "BALADI_BREAD" } });
    assert.equal(out.status, 409, JSON.stringify(out.body));
  } finally {
    IntakeSubmission.findOne = original;
  }
});

test("an unknown food gets no swaps instead of egg swaps", async () => {
  const codes = await candidatesFor("SOMETHING_NOBODY_KNOWS", answers([], ["none"]));
  assert.deepEqual(codes, []);
});

// No food of the same kind and close value exists in the swap list for these (swapExchangeRules):
// salmon is fattier than every other fish or meat, tuna leaner; yogurt, whey, laban and milks
// differ in protein vs sugar; lupini and popcorn are the only snack of their kind.
const NO_EQUIVALENT_IN_SWAP_LIST = new Set([
  "SALMON_FISH", "CANNED_TUNA", "GREEK_YOGURT", "WHEY_PROTEIN", "LABAN_RAYEB_LOWFAT", "LUPINI_BEANS",
  "AIR_POPPED_POPCORN", "SKIM_MILK", "LACTOSE_FREE_MILK",
]);

test("every food a plan can hold gets swaps, except vegetables and foods with no equivalent", async () => {
  const { FOOD_SWAP_DATABASE } = await import("../src/nutrition-meal-context-v2/index.js");
  const missing = [];
  for (const [code, food] of Object.entries(FOOD_SWAP_DATABASE)) {
    if (food.category === "VEGGIES" || NO_EQUIVALENT_IN_SWAP_LIST.has(code)) continue;
    const codes = await candidatesFor(code, answers([], ["none"]), 100);
    if (codes.length === 0) missing.push(code);
  }
  assert.deepEqual(missing, []);
});

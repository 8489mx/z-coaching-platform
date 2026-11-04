import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  loadCanonicalTable,
  resolveFood,
  canonicalMacros,
  canonicalSafetyMap,
  canonicalPlanMap,
  buildCanonicalIndex,
  buildViews,
} from "../src/nutrition-food-catalog/canonical-food-table.js";
import { FOOD_SWAP_DATABASE } from "../src/nutrition-meal-context-v2/build-culinary-meals.js";
import { SMART_SWAP_REGISTRY } from "../src/nutrition-swap-engine-v2/swap-pool-registry.js";
import { REGISTRY_TO_PLAN_FOOD, PLAN_FOOD_TO_REGISTRY } from "../src/api/services/liveFoodSwapSafety.js";
import { liveSwapPortionValue } from "../src/api/services/liveFoodSwapValue.js";
import { FOOD_CODE_IDENTITIES } from "../src/intake-decision-engine/adapters/disliked-foods.js";

// P2-C2: one canonical food table. A change in the table must reach every path,
// and no hand-kept food-data map may remain. Runs under plain node.

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readText = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

// [calories, protein, fat, carbs, fiber] per 100 g — the P1-B7 selection values, verbatim.
const SELECTION_TUPLES = {
  CHICKEN_BREAST_ROASTED_SKINLESS: [165, 31.02, 3.57, 0, 0],
  TUNA_LIGHT_CANNED_WATER_DRAINED: [86, 19.44, 0.96, 0, 0],
  BEEF_GROUND_90_LEAN_COOKED: [230, 28.45, 12.04, 0, 0],
  EGG_WHOLE_HARD_BOILED: [155, 12.58, 10.61, 1.12, 0],
  EGG_WHITE_COOKED: [52, 10.7, 0, 2.35, 0],
  YOGURT_PLAIN_LOW_FAT: [63, 5.25, 1.55, 7.04, 0],
  GREEK_YOGURT_PLAIN_NONFAT: [59, 10.19, 0.39, 3.6, 0],
  COTTAGE_CHEESE_LOW_FAT_2_PERCENT: [81, 10.45, 2.27, 4.76, 0],
  LENTILS_MATURE_COOKED: [116, 9.02, 0.38, 20.13, 7.9],
  CHICKPEAS_MATURE_COOKED: [164, 8.86, 2.59, 27.42, 7.6],
  FAVA_BEANS_MATURE_COOKED: [110, 7.6, 0.4, 19.65, 5.4],
  RICE_WHITE_LONG_GRAIN_COOKED: [130, 2.69, 0.28, 28.17, 0.4],
  POTATO_BOILED_WITHOUT_SKIN: [86, 1.71, 0.1, 20.01, 1.8],
  OATS_ROLLED_DRY: [378.87, 13.5, 5.89, 68.66, 10.42],
  BREAD_WHOLE_WHEAT: [252, 12.45, 3.5, 42.71, 6],
  PASTA_SPAGHETTI_COOKED: [157, 5.76, 0.92, 30.7, 1.8],
  BANANA_RAW: [88, 0.74, 0.29, 23, 1.7],
  APPLE_RAW_WITH_SKIN: [52, 0.26, 0.17, 13.81, 2.4],
  ORANGE_RAW: [47, 0.94, 0.12, 11.75, 2.4],
  TOMATO_RED_RAW: [18, 0.88, 0.2, 3.89, 1.2],
  CUCUMBER_WITH_PEEL_RAW: [15, 0.65, 0.11, 3.63, 0.5],
  CARROT_RAW: [44.98, 0.94, 0.35, 10.27, 3.1],
  OLIVE_OIL: [884, 0, 100, 0, 0],
  SUNFLOWER_OIL: [884, 0, 100, 0, 0],
  SALMON_ATLANTIC_COOKED: [206, 22.1, 12.35, 0, 0],
  TILAPIA_COOKED: [128, 26.15, 2.65, 0, 0],
  KING_MACKEREL_COOKED: [134, 26.0, 2.56, 0, 0],
  CHICKEN_THIGH_COOKED: [179, 24.84, 8.24, 0, 0],
  SKIM_MILK: [34, 3.37, 0.08, 4.96, 0],
};

// The old REGISTRY_TO_PLAN_FOOD literal, transcribed once for the regression net.
const OLD_SAFETY_MAP = {
  WHOLE_EGG: "EGGS_OMELETTE",
  EGG_WHITE: "EGGS_OMELETTE",
  CHEESE_COTTAGE_LOW_FAT: "COTTAGE_CHEESE",
  YOGURT_GREEK_PLAIN_NONFAT: "GREEK_YOGURT",
  WHEY_PROTEIN_POWDER: "WHEY_PROTEIN",
  CHICKEN_BREAST_COOKED: "CHICKEN_BREAST",
  BEEF_TOP_SIRLOIN_LEAN: "LEAN_BEEF",
  TILAPIA_COOKED: "TILAPIA_FISH",
  SALMON_ATLANTIC_COOKED: "SALMON_FISH",
  TUNA_CANNED_IN_WATER: "CANNED_TUNA",
  OATS_ROLLED_RAW: "ROLLED_OATS",
  BREAD_WHOLE_WHEAT: "BROWN_TOAST",
  BANANA_RAW: "BANANA_FRESH",
  RICE_WHITE_COOKED: "EGYPTIAN_RICE",
  POTATO_BAKED: "ROASTED_POTATOES",
  SWEET_POTATO_BAKED: "SWEET_POTATO",
  PASTA_WHOLE_WHEAT_COOKED: "WHOLE_WHEAT_PASTA",
  ALMONDS_RAW: "RAW_ALMONDS",
};

// The old PLAN_FOOD_TO_REGISTRY literal, transcribed once (exact entries + approximations).
const OLD_PLAN_MAP = {
  EGGS_OMELETTE: "WHOLE_EGG",
  COTTAGE_CHEESE: "CHEESE_COTTAGE_LOW_FAT",
  GREEK_YOGURT: "YOGURT_GREEK_PLAIN_NONFAT",
  WHEY_PROTEIN: "WHEY_PROTEIN_POWDER",
  CHICKEN_BREAST: "CHICKEN_BREAST_COOKED",
  LEAN_BEEF: "BEEF_TOP_SIRLOIN_LEAN",
  TILAPIA_FISH: "TILAPIA_COOKED",
  SALMON_FISH: "SALMON_ATLANTIC_COOKED",
  CANNED_TUNA: "TUNA_CANNED_IN_WATER",
  ROLLED_OATS: "OATS_ROLLED_RAW",
  BROWN_TOAST: "BREAD_WHOLE_WHEAT",
  BASMATI_RICE: "KABSA_SPICED_RICE",
  ROASTED_POTATOES: "POTATO_BAKED",
  SWEET_POTATO: "SWEET_POTATO_BAKED",
  WHOLE_WHEAT_PASTA: "PASTA_WHOLE_WHEAT_COOKED",
  RAW_ALMONDS: "ALMONDS_RAW",
  BANANA_FRESH: "BANANA_RAW",
  OAT_MILK: "OAT_MILK",
  RICE_MILK: "RICE_MILK",
  ALMOND_MILK_UNSWEETENED: "ALMOND_MILK_UNSWEETENED",
  MEDITERRANEAN_SALAD: "MEDITERRANEAN_SALAD",
  SAUTEED_VEGGIES: "SAUTEED_VEGGIES",
  FRESH_GUAVA: "APPLE_FRESH",
  FREEKEH_COOKED: "PASTA_WHOLE_WHEAT_COOKED",
  DARK_CHOCOLATE_85: "ALMONDS_RAW",
  HEMP_CHIA_SEEDS: "ALMONDS_RAW",
  CHIA_SEEDS: "ALMONDS_RAW",
  SMOKED_TURKEY: "CHICKEN_BREAST_COOKED",
  MIXED_LEGUMES_STEW: "FOUL_MUDAMMAS",
  LOW_FAT_MOZZARELLA: "HALLOUMI_LIGHT",
};

test("canonical table: 29 selection rows keep their exact P1-B7 values", () => {
  const table = loadCanonicalTable();
  assert.equal(table.items.length, 29);
  assert.equal(table.items_count, 29);
  assert.equal(table.active_items_count, 29);
  assert.equal(table.reference_items.length, 47);
  for (const row of table.items) {
    const [kcal, protein, fat, carbs, fiber] = SELECTION_TUPLES[row.food_code];
    assert.deepEqual(
      [row.nutrition_per_100g.calories_kcal, row.nutrition_per_100g.protein_g, row.nutrition_per_100g.fat_g,
        row.nutrition_per_100g.carbohydrate_g, row.nutrition_per_100g.fiber_g],
      [kcal, protein, fat, carbs, fiber],
      row.food_code
    );
  }
});

test("canonical table: reference rows are inactive with explicit unknowns, no code twice", () => {
  const table = loadCanonicalTable();
  const codes = new Set();
  for (const row of [...table.items, ...table.reference_items]) {
    assert.ok(!codes.has(row.food_code), "duplicate food_code " + row.food_code);
    codes.add(row.food_code);
  }
  for (const row of table.reference_items) {
    assert.equal(row.is_active, false, row.food_code);
    assert.equal(row.available_markets, null, row.food_code);
    assert.equal(row.logistics, null, row.food_code);
  }
});

test("every culinary entry's macros equal its canonical row", () => {
  for (const [code, entry] of Object.entries(FOOD_SWAP_DATABASE)) {
    const m = canonicalMacros(code);
    assert.ok(m, code);
    assert.equal(entry.protein_per_100g, m.protein_g, code);
    assert.equal(entry.carb_per_100g, m.carbohydrate_g, code);
    assert.equal(entry.fat_per_100g, m.fat_g, code);
    assert.equal(entry.kcal_per_100g, m.calories_kcal, code);
  }
});

test("every registry density equals its canonical primary nutrient", () => {
  const key = { PROTEIN_DOMINANT: "protein_g", CARBOHYDRATE_DOMINANT: "carbohydrate_g", FAT_DOMINANT: "fat_g" };
  for (const entry of SMART_SWAP_REGISTRY) {
    const m = canonicalMacros(entry.food_code);
    assert.ok(m, entry.food_code);
    assert.equal(entry.primary_nutrient_per_100g, m[key[entry.macro_type]], entry.food_code);
  }
});

test("live-swap values equal canonical values, including registry and culinary codes", () => {
  const cases = [
    ["TUNA_CANNED_IN_WATER", 19.44, 0, 0.96],
    ["CANNED_TUNA", 19.44, 0, 0.96],
    ["TUNA_LIGHT_CANNED_WATER_DRAINED", 19.44, 0, 0.96],
    ["WHOLE_EGG", 12.58, 1.12, 10.61],
    ["EGG_WHITE", 10.7, 2.35, 0],
    ["PEANUT_BUTTER", 25.1, 19.6, 50.4],
    ["POTATO_BAKED", 2.5, 21.2, 0.1],
    ["RICE_WHITE_COOKED", 2.4, 28.7, 0.2],
    ["KANAAD_KINGFISH", 26, 0, 2.56],
  ];
  for (const [code, protein, carbs, fat] of cases) {
    const v = liveSwapPortionValue(code, 100);
    assert.ok(v, code);
    assert.deepEqual([v.protein, v.carbs, v.fat], [protein, carbs, fat], code);
  }
});

test("derived safety and plan maps reproduce the old hand maps exactly", () => {
  const safety = canonicalSafetyMap();
  for (const [code, planFood] of Object.entries(OLD_SAFETY_MAP)) {
    assert.equal(safety[code], planFood, code);
  }
  for (const [code, planFood] of Object.entries(safety)) {
    if (!(code in OLD_SAFETY_MAP)) assert.equal(planFood, code, "non-identity extra " + code);
  }
  assert.deepEqual({ ...PLAN_FOOD_TO_REGISTRY }, OLD_PLAN_MAP);
  assert.equal(REGISTRY_TO_PLAN_FOOD.WHOLE_EGG, "EGGS_OMELETTE");
});

test("identity tags on canonical rows stay consistent with the kept exclusion map", () => {
  for (const [code, tags] of Object.entries(FOOD_CODE_IDENTITIES)) {
    if (code === "EGGS") continue; // clinician plural form, not a food code
    // KANAAD_KINGFISH resolves to the king-mackerel selection row (same FDC record
    // 174236, values to rounding), whose tags are [MACKEREL, FISH]; the KANAAD tag
    // lives only in the kept map. Unifying the tags is a food-accuracy follow-up,
    // not a silent C2 edit, and runtime exclusion behavior is unchanged (the map kept).
    if (code === "KANAAD_KINGFISH") continue;
    const row = resolveFood(code);
    assert.ok(row, code);
    for (const tag of tags) assert.ok(row.tags.identity_tags.includes(tag), `${code} missing tag ${tag}`);
  }
});

test("a change in the canonical table reaches every derived view", () => {
  const table = loadCanonicalTable();
  const before = buildViews(table);
  assert.equal(before.culinary.CANNED_TUNA.protein_per_100g, 19.44);
  assert.equal(before.foodMacros.TUNA_CANNED_IN_WATER.protein_per_100g, 19.44);
  const mutated = JSON.parse(JSON.stringify(table));
  mutated.items.find((r) => r.food_code === "TUNA_LIGHT_CANNED_WATER_DRAINED").nutrition_per_100g.protein_g = 99;
  const after = buildViews(mutated);
  assert.equal(after.culinary.CANNED_TUNA.protein_per_100g, 99);
  assert.equal(after.foodMacros.TUNA_CANNED_IN_WATER.protein_per_100g, 99);
  assert.equal(after.foodMacros.CANNED_TUNA.protein_per_100g, 99);
  // The loaded views are untouched by the mutation.
  assert.equal(buildViews(table).culinary.CANNED_TUNA.protein_per_100g, 19.44);
  // A code resolving to two rows fails loudly instead of picking one silently.
  const colliding = JSON.parse(JSON.stringify(table));
  colliding.reference_items.push(JSON.parse(JSON.stringify(colliding.items[0])));
  colliding.reference_items[colliding.reference_items.length - 1].food_code = "CANNED_TUNA";
  assert.throws(() => buildCanonicalIndex(colliding), /two rows/);
});

test("no hand-kept food-data map remains in the replaced files", () => {
  const safetySrc = readText("src/api/services/liveFoodSwapSafety.js");
  assert.ok(!safetySrc.includes("WHOLE_EGG: \"EGGS_OMELETTE\""), "REGISTRY_TO_PLAN_FOOD literal still present");
  assert.ok(!safetySrc.includes("EGGS_OMELETTE: \"WHOLE_EGG\""), "PLAN_FOOD_TO_REGISTRY literal still present");
  const valueSrc = readText("src/api/services/liveFoodSwapValue.js");
  assert.ok(!valueSrc.includes("const REGISTRY_OWN_MACROS"), "REGISTRY_OWN_MACROS definition still present");
  const culinarySrc = readText("src/nutrition-meal-context-v2/build-culinary-meals.js");
  const entriesSection = culinarySrc.split("FOOD_SWAP_DATABASE_ENTRIES = {")[1].split("P2-C2: the macros below")[0];
  assert.ok(!/protein_per_100g: [0-9]/.test(entriesSection), "culinary protein literals remain");
  assert.ok(!/carb_per_100g: [0-9]/.test(entriesSection), "culinary carb literals remain");
  assert.ok(!/fat_per_100g: [0-9]/.test(entriesSection), "culinary fat literals remain");
  assert.ok(!/kcal_per_100g: [0-9]/.test(entriesSection), "culinary kcal literals remain");
  const registrySrc = readText("src/nutrition-swap-engine-v2/swap-pool-registry.js");
  const registrySection = registrySrc.split("SMART_SWAP_REGISTRY_ENTRIES = [")[1].split("P2-C2: densities")[0];
  assert.ok(!/primary_nutrient_per_100g: [0-9]/.test(registrySection), "registry density literals remain");
});

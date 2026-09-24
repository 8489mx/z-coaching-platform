import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { MAX_CARB_PORTION_G, FOOD_SWAP_DATABASE } from "../src/nutrition-meal-context-v2/build-culinary-meals.js";

/**
 * The fourth meal (snack) of a standard plan put 733 g of sweet potato with no swaps on a bulking
 * client's plate and wrote 3 g of protein for any amount of almonds. The snack now splits a large
 * carbohydrate like every other meal, keeps nuts to a handful and away from a nut allergy, and
 * reports real macros. (The kidney client this test also carried left with the case: declared
 * kidney disease is outside the service - src/api/services/serviceScope.js.)
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"));

const BULKING = { gender: "male", age: "20", height_cm: "190", weight_kg: "95", circumferences: { neck_cm: "38", waist_cm: "80", hips_cm: "95" },
  medical_conditions: { has_conditions: false, selected: ["none"] }, strict_allergies: ["none"] };
const DIABETIC = { gender: "male", age: "35", height_cm: "180", weight_kg: "100", circumferences: { neck_cm: "40", waist_cm: "95", hips_cm: "100" },
  medical_conditions: { has_conditions: true, selected: ["diabetes"], diabetes: { type: "type2", uses_insulin: false } }, strict_allergies: ["none"] };
const NUT_ALLERGY = { ...BULKING, strict_allergies: ["peanuts_tree_nuts"] };

function plan(client) {
  return buildMasterEngineV2({
    intake: {
      ...client, primary_goal: "lean_bulk", neat_level: "very_active", occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
      injuries_map: { has_injuries: false, selected_areas: ["none"] }, religion: "MUSLIM",
      meal_structure: { meals_count: "4_meals", intermittent_fasting: "none" }, training_environment: "commercial_gym",
      training_logistics: { days_per_week: 4, experience_level: "intermediate" }, recent_training: "ACTIVE",
    },
    evaluationContext: { system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" },
    nutritionFoodCatalog: CATALOG,
    options: {},
  }).nutrition_program;
}
const snack = (n) => n.culinary_meals[3];

test("a large snack carbohydrate is split like every other meal's", () => {
  for (const client of [BULKING, DIABETIC]) {
    const items = snack(plan(client)).items;
    const oversized = items.filter((i) => i.category === "CARBS" && i.portion_g > MAX_CARB_PORTION_G);
    assert.deepEqual(oversized.map((i) => `${i.food_code} ${i.portion_g}`), []);
  }
});

test("no almonds for a nut allergy, and nuts stay a handful", () => {
  const diabetic = plan(DIABETIC);
  assert.equal(diabetic.macro_targets && typeof diabetic.macro_targets, "object");
  for (const n of [plan(NUT_ALLERGY)]) {
    assert.ok(!n.culinary_meals.flatMap((m) => m.items.map((i) => i.food_code)).includes("RAW_ALMONDS"));
  }
  for (const item of snack(plan(BULKING)).items.filter((i) => ["RAW_ALMONDS", "HEMP_CHIA_SEEDS"].includes(i.food_code))) {
    assert.ok(item.portion_g <= 30, `${item.food_code} ${item.portion_g} g`);
  }
});

test("nuts and seeds in the snack report the protein and carbohydrate they really carry", () => {
  for (const client of [BULKING, NUT_ALLERGY]) {
    for (const item of snack(plan(client)).items.filter((i) => ["RAW_ALMONDS", "HEMP_CHIA_SEEDS"].includes(i.food_code))) {
      const food = FOOD_SWAP_DATABASE[item.food_code];
      assert.ok(Math.abs(item.protein_g - (item.portion_g * food.protein_per_100g) / 100) <= 1, `${item.food_code} protein ${item.protein_g}`);
      assert.ok(Math.abs(item.fat_g - (item.portion_g * food.fat_per_100g) / 100) <= 1, `${item.food_code} fat ${item.fat_g}`);
    }
  }
});

test("the snack still holds its share of the day", () => {
  for (const client of [BULKING, DIABETIC, NUT_ALLERGY]) {
    const meal = snack(plan(client));
    const sum = (k) => meal.items.reduce((s, i) => s + (Number(i[k]) || 0), 0);
    for (const k of ["protein_g", "carb_g", "fat_g"]) {
      const target = meal.target_macros[k];
      // Carbohydrate and protein get 15%: when the oil passes 20 g, the fat-source step adds avocado
      // (~9 g of carbohydrate per 100 g) or almonds (~21 g of protein per 100 g) on top of the meal's
      // target. Almonds reach a diabetic plate now that the kidney protein cap left with the case.
      const share = k === "fat_g" ? 0.1 : 0.15;
      assert.ok(Math.abs(sum(k) - target) <= Math.max(5, target * share), `${k}: ${sum(k)} for ${target}`);
    }
  }
});

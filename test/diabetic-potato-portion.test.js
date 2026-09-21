import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { DIABETIC_POTATO_PORTION_G, splitOversizedPortions, carbPortionLimit } from "../src/nutrition-meal-context-v2/build-culinary-meals.js";

/**
 * Potatoes stay on a diabetic's plan (owner's decision), in a moderate portion: at most 200 g a meal,
 * with the rest of the carbohydrate from another food, and a tip on how to eat them.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"));

const diabeticPlan = () => buildMasterEngineV2({
  intake: {
    gender: "male", age: "50", height_cm: "175", weight_kg: "95", circumferences: { neck_cm: "42", waist_cm: "108", hips_cm: "106" },
    primary_goal: "fat_loss", neat_level: "moderate", occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
    medical_conditions: { has_conditions: true, selected: ["diabetes"], diabetes: { type: "type2", uses_insulin: false } },
    injuries_map: { has_injuries: false, selected_areas: ["none"] }, religion: "MUSLIM", strict_allergies: ["none"],
    meal_structure: { meals_count: "3_meals", intermittent_fasting: "none" }, training_environment: "commercial_gym",
    training_logistics: { days_per_week: 3, experience_level: "beginner" }, recent_training: "ACTIVE",
  },
  evaluationContext: { system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" },
  nutritionFoodCatalog: CATALOG,
  options: {},
});

test("a diabetic still gets potato options, never more than 200 g of potato on the plate", () => {
  const items = diabeticPlan().nutrition_program.culinary_meals.flatMap((meal) => meal.items || []);
  const potatoItems = items.filter((item) => /POTATO/.test(item.food_code));
  const potatoSwaps = items.flatMap((item) => item.swaps || []).filter((swap) => /POTATO/.test(swap.food_code));
  assert.ok(potatoItems.length + potatoSwaps.length > 0, "potatoes are offered");
  for (const item of potatoItems) assert.ok(item.portion_g <= DIABETIC_POTATO_PORTION_G && item.diabetic_tip_ar, `${item.food_code} ${item.portion_g}`);
  for (const swap of potatoSwaps) {
    assert.ok(swap.equivalent_grams <= DIABETIC_POTATO_PORTION_G, `${swap.food_code} swap ${swap.equivalent_grams} g`);
    assert.ok(swap.diabetic_tip_ar || swap.equivalent_grams <= DIABETIC_POTATO_PORTION_G);
  }
});

test("a potato item is split at 200 g for a diabetic and left at 400 g for anyone else", () => {
  const meal = [{ items: [{ food_code: "ROASTED_POTATOES", category: "CARBS", portion_g: 380, protein_g: 8, carb_g: 76, fat_g: 4, calories_kcal: 370,
    swaps: [{ food_code: "BASMATI_RICE", name_ar: "أرز", equivalent_grams: 270, protein_g: 7, carb_g: 76, fat_g: 1, calories_kcal: 350 }] }] }];
  const diabetic = splitOversizedPortions(meal, carbPortionLimit({ diabetic: true }))[0].items;
  assert.deepEqual(diabetic.map((i) => i.food_code), ["ROASTED_POTATOES", "BASMATI_RICE"]);
  assert.equal(diabetic[0].portion_g, 200);
  assert.ok(Math.abs(diabetic.reduce((s, i) => s + i.carb_g, 0) - 76) <= 1);
  const other = splitOversizedPortions(meal, carbPortionLimit({ diabetic: false }))[0].items;
  assert.deepEqual(other.map((i) => i.portion_g), [380]);
});

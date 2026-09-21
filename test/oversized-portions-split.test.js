import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { splitOversizedPortions, MAX_CARB_PORTION_G } from "../src/nutrition-meal-context-v2/build-culinary-meals.js";

/**
 * A bulking plan on three meals put 864 g of rice on one plate. Large carbohydrate items are now
 * split over the same food and its own safe swaps, without changing the meal's macros.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"));

test("a 95 kg client bulking on three meals never gets a carbohydrate item over the cap, and the meals still hold the target", () => {
  const program = buildMasterEngineV2({
    intake: {
      gender: "male", age: "20", height_cm: "190", weight_kg: "95", circumferences: { neck_cm: "38", waist_cm: "80", hips_cm: "95" },
      primary_goal: "lean_bulk", neat_level: "very_active", occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
      medical_conditions: { has_conditions: false, selected: ["none"] }, injuries_map: { has_injuries: false, selected_areas: ["none"] },
      religion: "MUSLIM", strict_allergies: ["none"], meal_structure: { meals_count: "3_meals", intermittent_fasting: "none" },
      training_environment: "commercial_gym", training_logistics: { days_per_week: 4, experience_level: "intermediate" }, recent_training: "ACTIVE",
    },
    evaluationContext: { system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" },
    nutritionFoodCatalog: CATALOG,
    options: {},
  });
  const items = program.nutrition_program.culinary_meals.flatMap((meal) => meal.items || []);
  const oversized = items.filter((item) => item.category === "CARBS" && item.portion_g > MAX_CARB_PORTION_G);
  assert.deepEqual(oversized.map((item) => `${item.food_code} ${item.portion_g}`), []);
  const carbs = items.reduce((sum, item) => sum + (Number(item.carb_g) || 0), 0);
  const target = program.nutrition_program.macro_targets.carbohydrate_g;
  assert.ok(Math.abs(carbs - target) / target < 0.05, `${carbs} g in the meals for a ${target} g target`);
});

test("the split keeps the item's macros and uses its own swaps; with no swap it is flagged, not changed", () => {
  const rice = { food_code: "BASMATI_RICE", category: "CARBS", portion_g: 900, protein_g: 24, carb_g: 252, fat_g: 3, calories_kcal: 1170,
    swaps: [{ food_code: "WHOLE_WHEAT_PASTA", equivalent_grams: 600, protein_g: 40, carb_g: 250, fat_g: 6, calories_kcal: 1180 }] };
  const [meal] = splitOversizedPortions([{ items: [rice] }]);
  assert.deepEqual(meal.items.map((i) => i.food_code), ["BASMATI_RICE", "WHOLE_WHEAT_PASTA"]);
  assert.ok(meal.items.every((i) => i.portion_g <= MAX_CARB_PORTION_G));
  assert.ok(Math.abs(meal.items.reduce((s, i) => s + i.carb_g, 0) - 252) <= 1);

  const [alone] = splitOversizedPortions([{ items: [{ ...rice, swaps: [] }] }]);
  assert.equal(alone.items.length, 1);
  assert.equal(alone.items[0].portion_g, 900);
  assert.match(alone.items[0].portion_warning_ar, /راجع/);
});

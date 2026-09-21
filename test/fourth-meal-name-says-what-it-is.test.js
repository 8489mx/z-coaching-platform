import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";

/**
 * The fourth meal was called "a light healthy snack" while it carries a quarter of the day (over
 * 1000 kcal on a bulking day), and its title named chia seeds and fruit that were not on the plate.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"));
const fourth = (allergies) => buildMasterEngineV2({
  intake: {
    gender: "male", age: "25", height_cm: "180", weight_kg: "80", circumferences: { neck_cm: "38", waist_cm: "82", hips_cm: "95" },
    primary_goal: "lean_bulk", neat_level: "very_active", occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
    medical_conditions: { has_conditions: false, selected: ["none"] }, injuries_map: { has_injuries: false, selected_areas: ["none"] },
    religion: "MUSLIM", strict_allergies: allergies, meal_structure: { meals_count: "4_meals", intermittent_fasting: "none" },
    training_environment: "commercial_gym", training_logistics: { days_per_week: 4, experience_level: "intermediate" }, recent_training: "ACTIVE",
  },
  evaluationContext: { system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" },
  nutritionFoodCatalog: CATALOG,
  options: {},
}).nutrition_program.culinary_meals[3];

test("the fourth meal is not called light, and its title names what is on the plate", () => {
  for (const [allergies, main] of [[["none"], /زبادي/], [["dairy_lactose"], /دجاج/]]) {
    const meal = fourth(allergies);
    assert.doesNotMatch(`${meal.meal_name_ar} ${meal.recipe_title_ar} ${meal.recipe_description_ar}`, /خفيف/);
    assert.match(meal.recipe_title_ar, /بطاطا حلوة/);
    assert.match(meal.recipe_title_ar, main);
    assert.doesNotMatch(meal.recipe_title_ar, /الشيا|فواكه/);
  }
});

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { adaptProgramToInteractiveMeals } from "../frontend/src/pages/ClientInteractiveApp/utils/programAdapters.js";

/**
 * The client's meal page and the coach editor read a meal's totals as actual_macros.calories /
 * protein / carbs / fats, while the engine writes calories_kcal / protein_g / carb_g / fat_g: every
 * meal showed the fallback 500 kcal, 40 g protein, 50 g carbohydrate, 15 g fat until the coach edited
 * it. A meal's totals now come from its items (what the client actually eats).
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"));
const program = buildMasterEngineV2({
  intake: {
    gender: "male", age: "25", height_cm: "180", weight_kg: "80", circumferences: { neck_cm: "38", waist_cm: "82", hips_cm: "95" },
    primary_goal: "lean_bulk", neat_level: "moderate", occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
    medical_conditions: { has_conditions: false, selected: ["none"] }, injuries_map: { has_injuries: false, selected_areas: ["none"] },
    religion: "MUSLIM", strict_allergies: ["none"], meal_structure: { meals_count: "3_meals", intermittent_fasting: "none" },
    training_environment: "commercial_gym", training_logistics: { days_per_week: 4, training_age: "1_2_years" }, recent_training: "ACTIVE",
  },
  evaluationContext: { system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" },
  nutritionFoodCatalog: CATALOG,
  options: {},
});

test("the client's meal page shows each meal's real totals, the sum of its items", () => {
  const meals = adaptProgramToInteractiveMeals(JSON.parse(JSON.stringify(program)));
  assert.ok(meals.length >= 3);
  for (const meal of meals) {
    const kcal = meal.items.reduce((s, i) => s + (Number(i.cal) || 0), 0);
    const protein = meal.items.reduce((s, i) => s + (Number(i.p) || 0), 0);
    assert.ok(Math.abs(meal.macros.calories - kcal) <= 2, `${meal.title}: ${meal.macros.calories} kcal shown, items ${kcal}`);
    assert.ok(Math.abs(meal.macros.protein - protein) <= 2, `${meal.title}: ${meal.macros.protein} g protein shown, items ${protein}`);
  }
  assert.ok(!meals.every((m) => m.macros.calories === 500), "not the fallback");
});

test("the coach editor builds meal totals the same way", () => {
  const src = fs.readFileSync("frontend/src/pages/CoachEditor/hooks/useCoachEditorData.js", "utf8");
  assert.doesNotMatch(src, /actual_macros\?\.calories \|\| cm\.target_macros\?\.calories \|\| 500/);
  assert.match(src, /mealTotalsFromItems\(/);
});

test("the engine's stored meal totals match the items after the last steps (split plates, fat sources)", () => {
  const extreme = buildMasterEngineV2({
    intake: {
      gender: "male", age: "27", height_cm: "200", weight_kg: "130", circumferences: { neck_cm: "44", waist_cm: "100", hips_cm: "110" },
      primary_goal: "lean_bulk", neat_level: "very_active", occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
      medical_conditions: { has_conditions: true, selected: ["diabetes", "renal", "hepatic"], diabetes: { type: "type2", uses_insulin: false } },
      injuries_map: { has_injuries: false, selected_areas: ["none"] }, religion: "MUSLIM", strict_allergies: ["gluten_celiac", "peanuts_tree_nuts"],
      meal_structure: { meals_count: "3_meals", intermittent_fasting: "none" }, training_environment: "commercial_gym",
      training_logistics: { days_per_week: 4, training_age: "1_2_years" }, recent_training: "ACTIVE",
    },
    evaluationContext: { system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" },
    nutritionFoodCatalog: CATALOG,
    options: {},
  });
  for (const p of [program, extreme]) {
    for (const meal of p.nutrition_program.culinary_meals) {
      const kcal = meal.items.reduce((s, i) => s + (Number(i.calories_kcal) || 0), 0);
      const fat = meal.items.reduce((s, i) => s + (Number(i.fat_g) || 0), 0);
      assert.ok(Math.abs(meal.actual_macros.calories_kcal - kcal) <= 2, `meal ${meal.meal_number}: stored ${meal.actual_macros.calories_kcal} kcal, items ${kcal}`);
      assert.ok(Math.abs(meal.actual_macros.fat_g - fat) <= 1, `meal ${meal.meal_number}: stored ${meal.actual_macros.fat_g} g fat, items ${fat}`);
    }
  }
});

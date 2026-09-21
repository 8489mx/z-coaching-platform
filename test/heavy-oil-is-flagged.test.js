import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { collectCoachAlerts } from "../frontend/src/utils/coachAlerts.js";
import { MAX_COMFORTABLE_OIL_PER_MEAL_G, diversifyFatSources } from "../src/nutrition-meal-context-v2/build-culinary-meals.js";

/**
 * When the clinical limits leave fat as the only energy source (kidney protein cap + diabetic
 * carbohydrate ceiling, nut allergy, avocado kept moderate for potassium), a meal could carry 40-50 g
 * of olive oil with nothing said. Oil above two tablespoons (30 g) in a meal is now flagged for the
 * coach; the clinical limits themselves are not changed.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"));
const plan = (selected, allergies) => buildMasterEngineV2({
  intake: {
    gender: "male", age: "27", height_cm: "200", weight_kg: "130", circumferences: { neck_cm: "44", waist_cm: "100", hips_cm: "110" },
    primary_goal: "lean_bulk", neat_level: "very_active", occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
    medical_conditions: { has_conditions: true, selected, diabetes: { type: "type2", uses_insulin: false } },
    injuries_map: { has_injuries: false, selected_areas: ["none"] }, religion: "MUSLIM", strict_allergies: allergies,
    meal_structure: { meals_count: "3_meals", intermittent_fasting: "none" }, training_environment: "commercial_gym",
    training_logistics: { days_per_week: 4, experience_level: "intermediate" }, recent_training: "ACTIVE",
  },
  evaluationContext: { system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" },
  nutritionFoodCatalog: CATALOG,
  options: {},
});

test("every meal with more than 30 g of olive oil carries a note the coach sees", () => {
  assert.equal(MAX_COMFORTABLE_OIL_PER_MEAL_G, 30);
  // The day's balance (fat <= 35%) keeps whole plans under this now; the note still guards any
  // meal that gets there (a nut allergy and a kidney protein cap leave only a little avocado).
  const [meal] = diversifyFatSources([{ items: [{ food_code: "OLIVE_OIL", category: "FATS", portion_g: 45, protein_g: 0, carb_g: 0, fat_g: 45, calories_kcal: 405, swaps: [] }] }],
    { isNutsExcluded: true }, { kidneyProteinCapped: true, kidneyCondition: true });
  const oil = meal.items.find((i) => i.food_code === "OLIVE_OIL");
  assert.ok(oil.portion_g > 30, `precondition: ${oil.portion_g} g oil`);
  assert.match(oil.portion_warning_ar || "", /زيت/);
  const program = { nutrition_program: { culinary_meals: [meal] } };
  assert.ok(collectCoachAlerts(program).some((a) => /زيت زيتون/.test(a) && /الطبيب|راجع/.test(a)));
});

test("an ordinary meal's oil gets no note", () => {
  const program = plan(["hypertension"], ["none"]);
  for (const oil of program.nutrition_program.culinary_meals.flatMap((m) => m.items).filter((i) => i.food_code === "OLIVE_OIL" && i.portion_g <= 30)) {
    assert.equal(oil.portion_warning_ar, undefined);
  }
});

test("a check-in that scales the oil past 30 g flags it too", async () => {
  const { mergeAdaptedPlanIntoProgram } = await import("../src/api/utils/planMergeEngine.js");
  const program = {
    nutrition_program: {
      macro_targets: { calories_kcal: 700, protein_g: 40, carbohydrate_g: 60, fat_g: 32 },
      culinary_meals: [{ items: [
        { food_code: "CHICKEN_BREAST", category: "PROTEIN", portion_g: 130, protein_g: 40, carb_g: 0, fat_g: 5, calories_kcal: 205, swaps: [] },
        { food_code: "BASMATI_RICE", category: "CARBS", portion_g: 215, protein_g: 0, carb_g: 60, fat_g: 0, calories_kcal: 240, swaps: [] },
        { food_code: "OLIVE_OIL", category: "FATS", portion_g: 27, protein_g: 0, carb_g: 0, fat_g: 27, calories_kcal: 243, swaps: [] },
      ] }],
    },
  };
  const merged = mergeAdaptedPlanIntoProgram(program, { adapted_nutrition: { target_calories_kcal: 900, protein_g: 40, carbohydrate_g: 60, fat_g: 55 } });
  const oil = merged.nutrition_program.culinary_meals[0].items.find((i) => i.food_code === "OLIVE_OIL");
  assert.ok(oil.portion_g > 30, `precondition: oil scaled to ${oil.portion_g} g`);
  assert.match(oil.portion_warning_ar || "", /زيت/);
});

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";

/**
 * PCOS and insulin resistance selected a ketogenic 40 g of carbohydrate a day. The plan now keeps
 * a moderate lower-carb share (about 30% of energy, never under 100 g) from slow carbohydrates.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"));

function targetsFor(weight) {
  const program = buildMasterEngineV2({
    intake: {
      gender: "female", age: "33", height_cm: "160", weight_kg: String(weight), circumferences: { neck_cm: "36", waist_cm: "98", hips_cm: "118" },
      primary_goal: "fat_loss", neat_level: "moderate", occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
      medical_conditions: { has_conditions: true, selected: ["thyroid"], thyroid: "hypothyroid", female_cases: { is_pcos: true, is_lactating: false, is_postpartum: false } },
      injuries_map: { has_injuries: false, selected_areas: ["none"] }, religion: "MUSLIM", strict_allergies: ["none"],
      meal_structure: { meals_count: "3_meals", intermittent_fasting: "none" }, training_environment: "home_gym",
      training_logistics: { days_per_week: 4, experience_level: "intermediate" }, recent_training: "ACTIVE",
    },
    evaluationContext: { system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" },
    nutritionFoodCatalog: CATALOG,
    options: {},
  });
  return { macros: program.nutrition_program.macro_targets, framework: program.nutrition_program.diet_framework ?? null, program };
}

for (const weight of [62, 92, 130]) {
  test(`a ${weight} kg client with PCOS gets a moderate lower-carb plan, not a ketogenic one`, () => {
    const { macros } = targetsFor(weight);
    const kcal = macros.calories_kcal;
    const carbs = macros.carbohydrate_g;
    assert.ok(carbs >= 100, `${carbs} g of carbohydrate a day`);
    assert.ok((carbs * 4) / kcal <= 0.36, `${Math.round((carbs * 400) / kcal)}% of energy from carbohydrate`);
    const atwater = macros.protein_g * 4 + carbs * 4 + macros.fat_g * 9;
    assert.ok(Math.abs(atwater - kcal) / kcal < 0.05, `macros ${atwater} vs ${kcal} kcal`);
  });
}

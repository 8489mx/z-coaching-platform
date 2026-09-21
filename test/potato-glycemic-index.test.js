import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getFoodClinicalProperties } from "../src/execution-engines/food-swap-engine.js";
import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";

/**
 * Hot roasted, baked or boiled potatoes and baked sweet potato are high glycemic (International
 * Tables of Glycemic Index, ~70-110). They were classed medium, so diabetic plans served them.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"));

test("potatoes as the plan cooks them are high glycemic, rice and oats are not", () => {
  for (const code of ["ROASTED_POTATOES", "SWEET_POTATO", "BOILED_POTATOES"]) assert.equal(getFoodClinicalProperties(code)?.glycemic_index, "HIGH", code);
  assert.equal(getFoodClinicalProperties("BASMATI_RICE")?.glycemic_index, "MEDIUM");
  assert.equal(getFoodClinicalProperties("ROLLED_OATS")?.glycemic_index, "LOW");
});

test("a diabetic's plan and swaps carry no potato", () => {
  const program = buildMasterEngineV2({
    intake: {
      gender: "male", age: "50", height_cm: "175", weight_kg: "95", circumferences: { neck_cm: "42", waist_cm: "108", hips_cm: "106" },
      primary_goal: "fat_loss", neat_level: "moderate", occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
      medical_conditions: { has_conditions: true, selected: ["diabetes"], diabetes: { type: "type2", uses_insulin: false } },
      injuries_map: { has_injuries: false, selected_areas: ["none"] }, religion: "MUSLIM", strict_allergies: ["none"],
      meal_structure: { meals_count: "3_meals_snack", intermittent_fasting: "none" }, training_environment: "commercial_gym",
      training_logistics: { days_per_week: 3, experience_level: "beginner" }, recent_training: "ACTIVE",
    },
    evaluationContext: { system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" },
    nutritionFoodCatalog: CATALOG,
    options: {},
  });
  const codes = program.nutrition_program.culinary_meals.flatMap((meal) => (meal.items || []).flatMap((item) => [item.food_code, ...(item.swaps || []).map((s) => s.food_code)]));
  assert.deepEqual(codes.filter((code) => /POTATO/.test(code || "")), []);
});

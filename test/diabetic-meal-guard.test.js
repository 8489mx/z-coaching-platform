import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { getFoodClinicalProperties } from "../src/execution-engines/food-swap-engine.js";

/**
 * The swap engine refused high glycemic foods for a diabetic client, but the meal generator that
 * builds the first plan never looked: a client on insulin was served baladi bread that the system's
 * own table marks as high glycemic. Two causes: the generator had no diabetes flag, and it names the
 * bread BALADI_BREAD while the table knows it as EGYPTIAN_BALADI_BREAD.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"));
const CTX = Object.freeze({ system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" });

const INTAKE = {
  gender: "male", age: "52", height_cm: "174", weight_kg: "95",
  circumferences: { neck_cm: "42", waist_cm: "108", hips_cm: "106" },
  primary_goal: "fat_loss", neat_level: "sedentary", occupation_type: "DESK_OFFICE",
  dangerous_symptoms: ["NONE"],
  injuries_map: { has_injuries: false, selected_areas: ["none"] },
  religion: "MUSLIM", strict_allergies: ["none"],
  meal_structure: { meals_count: "3_meals_snack", intermittent_fasting: "none" },
  training_logistics: { days_per_week: 4, experience_level: "intermediate" },
  recent_training: "ACTIVE", training_environment: "commercial_gym",
};

function mealCodes(medicalConditions) {
  const program = buildMasterEngineV2({
    intake: { ...INTAKE, medical_conditions: medicalConditions },
    evaluationContext: CTX,
    nutritionFoodCatalog: CATALOG,
    options: {},
  });
  const meals = program.nutrition_program?.culinary_meals || [];
  return meals.flatMap((meal) => (meal.items || []).map((item) => item.food_code));
}

const isHigh = (code) => getFoodClinicalProperties(code, {})?.glycemic_index === "HIGH";

test("the clinical table follows the generator's own names for foods", () => {
  assert.equal(getFoodClinicalProperties("EGYPTIAN_BALADI_BREAD", {}).glycemic_index, "HIGH");
  assert.equal(getFoodClinicalProperties("BALADI_BREAD", {}).glycemic_index, "HIGH", "the alias must reach the same classification");
});

test("a diabetic client on insulin receives no high glycemic food in the generated plan", () => {
  const codes = mealCodes({ has_conditions: true, selected: ["diabetes"], diabetes: { type: "type2", uses_insulin: true } });
  assert.ok(codes.length > 0, "the plan has meals");
  assert.deepEqual(codes.filter(isHigh), [], "high glycemic foods reached a diabetic client's plan");
  assert.ok(codes.some((code) => /BREAD|TOAST|RICE|OATS|POTATO|PASTA/.test(code)), "the plan still carries carbohydrates, just not the high glycemic ones");
});

test("a client without diabetes keeps the plan they had", () => {
  const codes = mealCodes({ has_conditions: false, selected: ["none"] });
  assert.ok(codes.includes("BALADI_BREAD"), "nothing changes for a client the rule does not concern");
});

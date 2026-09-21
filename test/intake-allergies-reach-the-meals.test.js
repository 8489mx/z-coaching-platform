import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { FOOD_SWAP_DATABASE } from "../src/nutrition-meal-context-v2/index.js";

/**
 * The intake stores allergies as dairy_lactose, gluten_celiac, fish_shellfish and
 * peanuts_tree_nuts. Upper-cased, none of those matched the words the meal generator and the adapter
 * were looking for (DAIRY, MILK, WHEAT_GLUTEN, TUNA, PEANUT...), so a lactose-intolerant client was
 * served cottage cheese and a coeliac client baladi bread in the very first plan. The swap engine
 * refused them later; the plan itself never should have held them.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"));
const CTX = Object.freeze({ system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" });

const INTAKE = {
  gender: "male", age: "34", height_cm: "178", weight_kg: "90",
  circumferences: { neck_cm: "40", waist_cm: "98", hips_cm: "102" },
  primary_goal: "fat_loss", neat_level: "moderate", occupation_type: "DESK_OFFICE",
  dangerous_symptoms: ["NONE"],
  medical_conditions: { has_conditions: false, selected: ["none"] },
  injuries_map: { has_injuries: false, selected_areas: ["none"] },
  religion: "MUSLIM",
  meal_structure: { meals_count: "3_meals_snack", intermittent_fasting: "none" },
  training_logistics: { days_per_week: 4, experience_level: "intermediate" },
  recent_training: "ACTIVE", training_environment: "commercial_gym",
};

function planFoods(strictAllergies) {
  const program = buildMasterEngineV2({
    intake: { ...INTAKE, strict_allergies: strictAllergies },
    evaluationContext: CTX,
    nutritionFoodCatalog: CATALOG,
    options: {},
  });
  const meals = program.nutrition_program?.culinary_meals || [];
  const codes = meals.flatMap((meal) => (meal.items || []).flatMap((item) => [item.food_code, ...(item.swaps || []).map((s) => s.food_code)]));
  assert.ok(codes.length > 0, "the plan has meals");
  return [...new Set(codes)].filter(Boolean);
}

// Each case uses the exact value the intake form stores, and the generator's own food attributes.
const CASES = [
  ["dairy_lactose", "dairy", (food) => food?.is_dairy === true],
  ["gluten_celiac", "gluten", (food) => food && !food.is_gluten_free],
  ["peanuts_tree_nuts", "nuts", (food) => food?.is_nut_free === false],
  ["fish_shellfish", "fish", (food) => food?.is_fish === true],
];

for (const [stored, label, forbidden] of CASES) {
  test(`a client who declared ${stored} gets no ${label} in the plan or its swaps`, () => {
    const offending = planFoods([stored]).filter((code) => forbidden(FOOD_SWAP_DATABASE[code]));
    assert.deepEqual(offending, [], `${stored} reached the plan`);
  });
}

test("a client with no allergy keeps the ordinary plan", () => {
  const codes = planFoods(["none"]);
  assert.ok(codes.some((code) => FOOD_SWAP_DATABASE[code]?.is_dairy === true), "dairy is still offered to a client who can eat it");
});

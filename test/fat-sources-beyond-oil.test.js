import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { MAX_OIL_PER_MEAL_G } from "../src/nutrition-meal-context-v2/build-culinary-meals.js";

/**
 * A high-fat plan (a diabetic's carbohydrate ceiling moves energy to fat) put 60-90 g of olive oil
 * in a meal. Fat above 20 g of oil goes to avocado, then almonds, within the client's restrictions.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"));
const plan = (selected, allergies) => buildMasterEngineV2({
  intake: {
    gender: "male", age: "35", height_cm: "180", weight_kg: "100", circumferences: { neck_cm: "40", waist_cm: "95", hips_cm: "100" },
    primary_goal: "lean_bulk", neat_level: "very_active", occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
    medical_conditions: { has_conditions: true, selected, diabetes: { type: "type2", uses_insulin: false } },
    injuries_map: { has_injuries: false, selected_areas: ["none"] }, religion: "MUSLIM", strict_allergies: allergies,
    meal_structure: { meals_count: "3_meals", intermittent_fasting: "none" }, training_environment: "commercial_gym",
    training_logistics: { days_per_week: 4, experience_level: "intermediate" }, recent_training: "ACTIVE",
  },
  evaluationContext: { system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" },
  nutritionFoodCatalog: CATALOG,
  options: {},
}).nutrition_program;

test("a high-fat diabetic plan spreads fat beyond oil and still holds the fat target", () => {
  const n = plan(["diabetes"], ["none"]);
  const items = n.culinary_meals.flatMap((m) => m.items || []);
  for (const oil of items.filter((i) => i.food_code === "OLIVE_OIL")) assert.ok(oil.portion_g <= MAX_OIL_PER_MEAL_G, `${oil.portion_g} g oil`);
  assert.ok(items.some((i) => i.food_code === "FRESH_AVOCADO"));
  const fat = items.reduce((s, i) => s + (Number(i.fat_g) || 0), 0);
  assert.ok(Math.abs(fat - n.macro_targets.fat_g) / n.macro_targets.fat_g < 0.05, `${fat} g of fat in the meals for ${n.macro_targets.fat_g}`);
});

test("no almonds for a nut allergy", () => {
  for (const [selected, allergies] of [[["diabetes"], ["peanuts_tree_nuts"]]]) {
    const codes = plan(selected, allergies).culinary_meals.flatMap((m) => (m.items || []).map((i) => i.food_code));
    assert.ok(!codes.includes("RAW_ALMONDS"), `${selected} ${allergies}`);
  }
});

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { CLINICAL_GUIDELINES } from "../src/config/clinical-guidelines.js";

/**
 * Energy above a diabetic's carbohydrate ceiling went to fat with no limit: 46% of energy from fat
 * and 40-50 g of olive oil a meal. Fat now stays within the adult acceptable range (IOM Dietary
 * Reference Intakes 2005, AMDR: fat 20-35% of energy). Above it the engine raises protein where a
 * laboratory protein cap allows (up to 2.2 g/kg of reference weight), then lowers energy, and only
 * then lets carbohydrate pass the 45% ceiling, telling the coach.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"));
const plan = (selected, { weight = "130", height = "200", goal = "lean_bulk", allergies = ["none"] } = {}) => buildMasterEngineV2({
  intake: {
    gender: "male", age: "27", height_cm: height, weight_kg: weight, circumferences: { neck_cm: "44", waist_cm: "100", hips_cm: "110" },
    primary_goal: goal, neat_level: "very_active", occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
    medical_conditions: { has_conditions: selected.length > 0, selected: selected.length ? selected : ["none"], diabetes: { type: "type2", uses_insulin: false } },
    injuries_map: { has_injuries: false, selected_areas: ["none"] }, religion: "MUSLIM", strict_allergies: allergies,
    meal_structure: { meals_count: "3_meals", intermittent_fasting: "none" }, training_environment: "commercial_gym",
    training_logistics: { days_per_week: 4, experience_level: "intermediate" }, recent_training: "ACTIVE",
  },
  evaluationContext: { system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" },
  nutritionFoodCatalog: CATALOG,
  options: {},
}).nutrition_program;

const shares = (t) => {
  const kcal = t.protein_g * 4 + t.carb_g * 4 + t.fat_g * 9;
  return { kcal, protein: (t.protein_g * 4) / kcal, carb: (t.carb_g * 4) / kcal, fat: (t.fat_g * 9) / kcal };
};

// This case was a kidney + diabetes client, whose protein cap left the energy to carbohydrate and
// fat. Declared kidney disease is outside the service (src/api/services/serviceScope.js), so what
// is checked here is the balance itself on a diabetic client with a liver condition and allergies.
test("fat stays within 35% of energy for diabetes with a liver condition and allergies", () => {
  assert.equal(CLINICAL_GUIDELINES.NUTRITION_BALANCE.MAX_FAT_ENERGY_SHARE, 0.35);
  const n = plan(["diabetes", "hepatic"], { allergies: ["gluten_celiac", "peanuts_tree_nuts"] });
  const t = n.targets;
  const s = shares(t);
  assert.ok(s.fat <= 0.355, `fat ${Math.round(s.fat * 100)}%`);
});

test("olive oil stays under two tablespoons a meal after the balance", () => {
  const n = plan(["diabetes", "hepatic"], { allergies: ["gluten_celiac", "peanuts_tree_nuts"] });
  const oils = n.culinary_meals.flatMap((m) => m.items).filter((i) => i.food_code === "OLIVE_OIL").map((i) => i.portion_g);
  assert.ok(oils.every((g) => g <= 30), oils.join(","));
});

test("a diabetic keeps carbohydrate within 45% and fat within 35% by eating more protein", () => {
  const t = plan(["diabetes"]).targets;
  const s = shares(t);
  assert.ok(s.fat <= 0.355, `fat ${Math.round(s.fat * 100)}%`);
  assert.ok(s.carb <= 0.455, `carbs ${Math.round(s.carb * 100)}%`);
  assert.ok(t.protein_g <= Math.round(t.clinical_guardrails.energy_reference_weight_kg * 2.2) + 1);
});

test("an ordinary plan is not touched (fat 22%)", () => {
  const t = plan([], { weight: "80", height: "180" }).targets;
  const s = shares(t);
  assert.ok(s.fat < 0.3, `fat ${Math.round(s.fat * 100)}%`);
  assert.equal(t.clinical_guardrails.energy_balance_note_ar ?? null, null);
});

test("the PCOS lower-carb never turns into more than 35% fat, and energy is never cut while breastfeeding or under the floor", () => {
  const pcos = (selected, extra = {}) => buildMasterEngineV2({
    intake: {
      gender: "female", age: "18", height_cm: "160", weight_kg: "42", circumferences: { neck_cm: "29", waist_cm: "58", hips_cm: "80" },
      primary_goal: "lean_bulk", neat_level: "very_active", occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
      medical_conditions: { has_conditions: true, selected, diabetes: { type: "type2", uses_insulin: false } },
      injuries_map: { has_injuries: false, selected_areas: ["none"] }, religion: "MUSLIM", strict_allergies: ["none"],
      meal_structure: { meals_count: "3_meals", intermittent_fasting: "none" }, training_environment: "commercial_gym",
      training_logistics: { days_per_week: 4, experience_level: "intermediate" }, recent_training: "ACTIVE", ...extra,
    },
    evaluationContext: { system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" },
    nutritionFoodCatalog: CATALOG,
    options: {},
  }).nutrition_program.targets;
  for (const [selected, extra] of [[["pcos"], {}], [["pcos", "diabetes"], { female_pregnancy: "BREASTFEEDING" }], [["diabetes"], {}]]) {
    const t = pcos(selected, extra);
    const s = shares(t);
    assert.ok(s.fat <= 0.355, `${selected.join("+")}: fat ${Math.round(s.fat * 100)}%`);
    assert.ok(s.kcal >= 1195, `${selected.join("+")}: ${Math.round(s.kcal)} kcal under the floor`);
  }
});

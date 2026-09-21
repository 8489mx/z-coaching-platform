import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { buildAdaptedPlan } from "../src/adaptation-engine/index.js";

/**
 * Diabetes had no carbohydrate ceiling. With protein capped for the kidneys every remaining
 * calorie went to carbohydrate: a 130 kg diabetic with kidney disease got 723 g a day (70% of
 * energy) and more than a kilo of rice a meal. Carbohydrate is now at most 45% of energy, in the
 * first plan and after every check-in adjustment.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"));
const share = (m) => (m.carbohydrate_g * 4) / m.calories_kcal;

function plan({ weight, conditions, goal = "fat_loss", gender = "male" }) {
  return buildMasterEngineV2({
    intake: {
      gender, age: "27", height_cm: "185", weight_kg: String(weight), circumferences: { neck_cm: "46", waist_cm: "125", hips_cm: "120" },
      primary_goal: goal, neat_level: "very_active", occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
      medical_conditions: { has_conditions: true, selected: conditions, diabetes: { type: "type2", uses_insulin: false } },
      injuries_map: { has_injuries: false, selected_areas: ["none"] }, religion: "MUSLIM", strict_allergies: ["none"],
      meal_structure: { meals_count: "3_meals", intermittent_fasting: "none" }, training_environment: "commercial_gym",
      training_logistics: { days_per_week: 4, experience_level: "intermediate" }, recent_training: "ACTIVE",
    },
    evaluationContext: { system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" },
    nutritionFoodCatalog: CATALOG,
    options: {},
  });
}

for (const [label, args] of [
  ["130 kg diabetic with kidney and liver disease, bulking", { weight: 130, conditions: ["hepatic", "diabetes", "renal"], goal: "lean_bulk" }],
  ["130 kg diabetic with kidney disease, losing fat", { weight: 130, conditions: ["diabetes", "renal"] }],
  ["55 kg diabetic, gaining", { weight: 55, conditions: ["diabetes"], goal: "lean_bulk" }],
]) {
  test(`${label}: carbohydrate is at most 45% of energy and the macros still add up`, () => {
    const program = plan(args);
    const m = program.nutrition_program.macro_targets;
    assert.ok(share(m) <= 0.451, `${Math.round(share(m) * 100)}% of energy from carbohydrate`);
    const atwater = m.protein_g * 4 + m.carbohydrate_g * 4 + m.fat_g * 9;
    assert.ok(Math.abs(atwater - m.calories_kcal) / m.calories_kcal < 0.03, `${atwater} vs ${m.calories_kcal}`);
    const portions = (program.nutrition_program.culinary_meals || []).flatMap((meal) => meal.items || []).map((item) => Number(item.portion_g) || 0);
    assert.ok(Math.max(...portions) <= 900, `a ${Math.max(...portions)} g portion`);
  });
}

test("check-in adjustments keep a diabetic's carbohydrate under the ceiling", () => {
  const program = JSON.parse(JSON.stringify(plan({ weight: 90, conditions: ["diabetes"] })));
  let current = program;
  for (let i = 0; i < 6; i++) {
    const adapted = buildAdaptedPlan({ currentMasterProgram: current, checkinAnalysis: { analysis_status: "RAPID_LOSS_WARNING" }, options: { currentWeekNumber: 1 } });
    const n = adapted.adapted_nutrition;
    assert.ok((n.carbohydrate_g * 4) / n.target_calories_kcal <= 0.451, `step ${i + 1}: ${Math.round((n.carbohydrate_g * 400) / n.target_calories_kcal)}%`);
    current = JSON.parse(JSON.stringify(current));
    current.nutrition_program.macro_targets = { calories_kcal: n.target_calories_kcal, protein_g: n.protein_g, carbohydrate_g: n.carbohydrate_g, fat_g: n.fat_g };
  }
});

test("a client without diabetes keeps the ordinary split", () => {
  const program = plan({ weight: 90, conditions: ["none"], goal: "lean_bulk" });
  assert.equal(program.nutrition_program.targets.clinical_guardrails.diabetic_carb_cap_applied, false);
});

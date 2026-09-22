import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { collectCoachAlerts } from "../frontend/src/utils/coachAlerts.js";

/**
 * Owner decision (2026-09-21): a day of 3200 kcal or more on three meals makes very large plates,
 * so the plan adds a fourth meal by itself and tells the coach why. Since 2026-09-22 two meals at
 * 3200+ kcal do too; four or more meals are left as the client chose.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"));

function build({ weight = "92", height = "190", goal = "lean_bulk", neat = "very_active", meals = "3_meals" } = {}) {
  return buildMasterEngineV2({
    intake: {
      gender: "male", age: "20", height_cm: height, weight_kg: weight, circumferences: { neck_cm: "38", waist_cm: "80", hips_cm: "95" },
      primary_goal: goal, neat_level: neat, occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
      medical_conditions: { has_conditions: false, selected: ["none"] }, injuries_map: { has_injuries: false, selected_areas: ["none"] },
      religion: "MUSLIM", strict_allergies: ["none"], meal_structure: { meals_count: meals, intermittent_fasting: "none" },
      training_environment: "commercial_gym", training_logistics: { days_per_week: 4, experience_level: "intermediate" }, recent_training: "ACTIVE",
    },
    evaluationContext: { system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" },
    nutritionFoodCatalog: CATALOG,
    options: {},
  });
}

test("3200+ kcal on three meals becomes four meals, and the coach is told why", () => {
  const targets = build().nutrition_program.targets;
  assert.ok(targets.target_calories >= 3200, "precondition: a high-calorie day");
  assert.equal(targets.meals_count, 4);
  assert.equal(targets.meal_distribution.length, 4);
  assert.equal(targets.meals.length, 4);
  assert.match(targets.meal_count_note_ar, /وجبة رابعة/);
  assert.ok(collectCoachAlerts(JSON.parse(JSON.stringify({ nutrition_program: { targets } }))).some((a) => /وجبة رابعة/.test(a)));
});

test("the fourth meal only splits the day: the day's protein, carbohydrate and fat stay the same", () => {
  const targets = build().nutrition_program.targets;
  const sum = (k) => targets.meal_distribution.reduce((s, m) => s + m[k], 0);
  assert.ok(Math.abs(sum("protein_g") - targets.protein_g) <= 2, `protein ${sum("protein_g")} vs ${targets.protein_g}`);
  assert.ok(Math.abs(sum("carb_g") - targets.carb_g) <= 2, `carbs ${sum("carb_g")} vs ${targets.carb_g}`);
  assert.ok(Math.abs(sum("fat_g") - targets.fat_g) <= 2, `fat ${sum("fat_g")} vs ${targets.fat_g}`);
});

test("a normal day on three meals stays three meals with no note", () => {
  const targets = build({ weight: "70", height: "175", goal: "fat_loss", neat: "sedentary" }).nutrition_program.targets;
  assert.ok(targets.target_calories < 3200, "precondition: a normal day");
  assert.equal(targets.meals_count, 3);
  assert.equal(targets.meal_count_note_ar, null);
});

// Changed 2026-09-22: two meals at 3200+ kcal made plates of 2300+ kcal; they now become four too
// (test/two-meals-never-make-giant-plates.test.js).
test("two meals at 3200+ kcal become four meals, with the coach told why", () => {
  const targets = build({ meals: "2_meals" }).nutrition_program.targets;
  assert.ok(targets.target_calories >= 3200, "precondition: a high-calorie day");
  assert.equal(targets.meals_count, 4);
  assert.match(targets.meal_count_note_ar, /وجبتين/);
});

test("four meals chosen by the client are kept with no note", () => {
  const targets = build({ meals: "4_meals" }).nutrition_program.targets;
  assert.ok(targets.target_calories >= 3200, "precondition: a high-calorie day");
  assert.equal(targets.meals_count, 4);
  assert.equal(targets.meal_count_note_ar, null);
});

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";

/**
 * The form has no step count, so "moderate" or "very active" became 8500-12500 assumed steps and
 * "adequate daily steps": a fat-loss client with a BMI of 45 got no cardio and no steps target.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"));

function cardioFor({ weight, neat, goal = "fat_loss" }) {
  const program = buildMasterEngineV2({
    intake: {
      gender: "female", age: "35", height_cm: "160", weight_kg: String(weight), circumferences: { neck_cm: "38", waist_cm: "110", hips_cm: "130" },
      primary_goal: goal, neat_level: neat, occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
      medical_conditions: { has_conditions: false, selected: ["none"] }, injuries_map: { has_injuries: false, selected_areas: ["none"] },
      religion: "MUSLIM", strict_allergies: ["none"], meal_structure: { meals_count: "3_meals", intermittent_fasting: "none" },
      training_environment: "commercial_gym", training_logistics: { days_per_week: 3, experience_level: "beginner" }, recent_training: "ACTIVE",
    },
    evaluationContext: { system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" },
    nutritionFoodCatalog: CATALOG,
    options: {},
  });
  return program.intake_decision.cardio_decision?.strategy ?? program.cardio_program?.strategy ?? program.cardio_program?.cardio_plan_spec?.strategy;
}

for (const neat of ["moderate", "very_active"]) {
  test(`a fat-loss client with a BMI of 45 reporting ${neat} activity gets at least a steps target`, () => {
    const strategy = cardioFor({ weight: 115, neat });
    assert.ok(strategy, "the cardio decision is present");
    assert.notEqual(strategy, "NO_ADDITIONAL_CARDIO");
  });
}

test("a lean client reporting adequate activity is not given cardio she does not need", () => {
  assert.equal(cardioFor({ weight: 58, neat: "very_active" }), "NO_ADDITIONAL_CARDIO");
});

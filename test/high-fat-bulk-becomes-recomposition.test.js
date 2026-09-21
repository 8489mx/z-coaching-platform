import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";

/** Bulking with high body fat is redirected to recomposition; a lean client keeps the surplus. */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"));
const targets = (weight, waist) => buildMasterEngineV2({
  intake: {
    gender: "male", age: "27", height_cm: "185", weight_kg: String(weight), circumferences: { neck_cm: "40", waist_cm: String(waist), hips_cm: "110" },
    primary_goal: "lean_bulk", neat_level: "moderate", occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
    medical_conditions: { has_conditions: false, selected: ["none"] }, injuries_map: { has_injuries: false, selected_areas: ["none"] },
    religion: "MUSLIM", strict_allergies: ["none"], meal_structure: { meals_count: "3_meals", intermittent_fasting: "none" },
    training_environment: "commercial_gym", training_logistics: { days_per_week: 4, experience_level: "intermediate" }, recent_training: "ACTIVE",
  },
  evaluationContext: { system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" },
  nutritionFoodCatalog: CATALOG,
  options: {},
}).nutrition_program.targets;

test("a 130 kg client with a 125 cm waist asking to bulk gets recomposition, below maintenance", () => {
  const t = targets(130, 125);
  assert.equal(t.effective_goal, "BODY_RECOMPOSITION");
  assert.ok(t.goal_redirect?.reason_ar);
  assert.ok(t.target_calories < t.tdee);
});

test("a lean client asking to bulk keeps the surplus", () => {
  const t = targets(80, 82);
  assert.equal(t.effective_goal, null);
  assert.ok(t.target_calories > t.tdee);
});

// "Let the coach decide": the engine suggests a goal from body fat and says why, for the coach to review.
const coachDecides = (weight, waist) => buildMasterEngineV2({
  intake: {
    gender: "male", age: "30", height_cm: "178", weight_kg: String(weight), circumferences: { neck_cm: "39", waist_cm: String(waist), hips_cm: "100" },
    primary_goal: "coach_decides", neat_level: "moderate", occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
    medical_conditions: { has_conditions: false, selected: ["none"] }, injuries_map: { has_injuries: false, selected_areas: ["none"] },
    religion: "MUSLIM", strict_allergies: ["none"], meal_structure: { meals_count: "3_meals", intermittent_fasting: "none" },
    training_environment: "commercial_gym", training_logistics: { days_per_week: 4, experience_level: "intermediate" }, recent_training: "ACTIVE",
  },
  evaluationContext: { system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" },
  nutritionFoodCatalog: CATALOG,
  options: {},
}).nutrition_program.targets;

test("'let the coach decide' suggests fat loss, fat loss with muscle, or muscle gain from body fat", () => {
  for (const [weight, waist, goal] of [[120, 118, "FAT_LOSS"], [85, 92, "BODY_RECOMPOSITION"], [68, 74, "MUSCLE_GAIN"]]) {
    const t = coachDecides(weight, waist);
    assert.equal(t.effective_goal, goal, `${weight} kg`);
    assert.equal(t.goal_redirect.coach_review_required, true);
    assert.match(t.goal_redirect.reason_ar, /راجعه/);
  }
});

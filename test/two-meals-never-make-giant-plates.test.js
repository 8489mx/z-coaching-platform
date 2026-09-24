import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { mealCountNoteForCheckin } from "../src/checkin-engine/meal-count-note.js";

/**
 * Two meals were kept at any energy: a 110 kg bulking client on two meals got 2342 kcal and 330 g of
 * carbohydrate per plate. The intake form offers 3 meals or more, but two meals still reach the
 * engine from older answers or the API. One rule now: 3200 kcal or more needs at least four meals
 * (the owner's rule for three meals), two meals included; below that two meals stay.
 */
const CATALOG = JSON.parse(fs.readFileSync("data/catalogs/core-global-food-batch-v1.json", "utf8"));
const targetsFor = ({ weight, goal, neat, meals }) => buildMasterEngineV2({ intake: {
  gender: "male", age: "25", height_cm: "190", weight_kg: weight, circumferences: { neck_cm: "42", waist_cm: "90", hips_cm: "100" },
  primary_goal: goal, neat_level: neat, occupation_type: "MANUAL_LABOR", dangerous_symptoms: ["NONE"],
  medical_conditions: { has_conditions: false, selected: ["none"] }, injuries_map: { has_injuries: false, selected_areas: ["none"] },
  religion: "MUSLIM", strict_allergies: ["none"], meal_structure: { meals_count: meals, intermittent_fasting: "none" },
  training_environment: "commercial_gym", training_logistics: { days_per_week: 5, training_age: "2_4_years" }, recent_training: "ACTIVE",
}, evaluationContext: { system_time: "2026-09-22T08:00:00.000Z", assessmentDate: "2026-09-22" }, nutritionFoodCatalog: CATALOG, options: {} }).nutrition_program;

// A plate holds about a thousand calories, so the number of plates follows the size of the day:
// four above 3200 kcal, five above 4200, six above 5200.
test("a big day on two meals is spread over more plates, and the coach is told why", () => {
  const n = targetsFor({ weight: "110", goal: "lean_bulk", neat: "very_active", meals: "2_meals" });
  assert.ok(n.targets.target_calories >= 4200, "precondition");
  assert.equal(n.targets.meals_count, 5);
  assert.equal(n.culinary_meals.length, 5);
  assert.match(n.targets.meal_count_note_ar, /وجبتين/);
  for (const meal of n.culinary_meals) {
    const kcal = meal.items.reduce((s, i) => s + i.calories_kcal, 0);
    assert.ok(kcal <= 1400, `meal ${meal.meal_number}: ${kcal} kcal`);
  }
});

test("two meals below 3200 kcal stay two meals", () => {
  const n = targetsFor({ weight: "75", goal: "fat_loss", neat: "sedentary", meals: "2_meals" });
  assert.ok(n.targets.target_calories < 3200, "precondition");
  assert.equal(n.targets.meals_count, 2);
  assert.equal(n.targets.meal_count_note_ar, null);
});

test("a check-in that takes a two-meal plan past 3200 kcal tells the coach too", () => {
  assert.match(mealCountNoteForCheckin({ planTargetKcal: 3100, calorieDelta: 150, mealsCount: 2 }), /إضافة وجبة/);
});

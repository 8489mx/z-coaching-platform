import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { trimMealsToTarget } from "../src/nutrition-meal-context-v2/index.js";
import { collectCoachAlerts } from "../frontend/src/utils/coachAlerts.js";

/**
 * How a day is shared between its sittings. Every plate used to take the same share of everything,
 * so a "snack" was a fourth dinner, and protein - which the muscle answers to one sitting at a time
 * (about 0.3-0.4 g/kg a sitting; Moore 2015, Schoenfeld & Aragon 2018) - was spread by plate size
 * instead of evenly. Protein is even across the day now; carbohydrate and fat follow the size of the
 * sitting. A plate holds about a thousand calories, so a bigger day gets more plates, not bigger ones.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"));
const CTX = { system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" };

const plan = ({ weight = "85", height = "178", goal = "fat_loss", neat = "moderate", meals = "3_meals_snack", medical, allergies = ["none"] } = {}) => buildMasterEngineV2({
  intake: {
    gender: "male", age: "30", height_cm: height, weight_kg: weight, circumferences: { neck_cm: "40", waist_cm: "95", hips_cm: "100" },
    primary_goal: goal, neat_level: neat, occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
    medical_conditions: medical || { has_conditions: false, selected: ["none"] },
    injuries_map: { has_injuries: false, selected_areas: ["none"] }, religion: "MUSLIM", strict_allergies: allergies,
    meal_structure: { meals_count: meals, intermittent_fasting: "none" }, training_environment: "commercial_gym",
    training_logistics: { days_per_week: 4, experience_level: "intermediate" }, recent_training: "ACTIVE",
  },
  evaluationContext: CTX, nutritionFoodCatalog: CATALOG, options: {},
});

const kcalOf = (meal) => (meal.items || []).reduce((total, item) => total + (Number(item.calories_kcal) || 0), 0);

test("protein is spread evenly over every sitting, snacks included", () => {
  const targets = plan().nutrition_program.targets;
  const protein = targets.meal_distribution.map((meal) => meal.protein_g);
  const spread = (Math.max(...protein) - Math.min(...protein)) / Math.max(...protein);
  assert.ok(spread <= 0.05, `protein per sitting: ${protein.join(", ")}`);
});

test("carbohydrate and fat follow the size of the sitting", () => {
  const distribution = plan().nutrition_program.targets.meal_distribution;
  const snack = distribution[3];
  for (const meal of distribution.slice(0, 3)) {
    assert.ok(meal.carb_g > snack.carb_g, `meal ${meal.meal_number} carb ${meal.carb_g} against the snack's ${snack.carb_g}`);
    assert.ok(meal.fat_g > snack.fat_g, `meal ${meal.meal_number} fat ${meal.fat_g} against the snack's ${snack.fat_g}`);
  }
});

test("a bigger day gets more plates, and no plate carries more than about a thousand calories", () => {
  const counts = [
    [plan({ weight: "70", goal: "fat_loss", neat: "sedentary" }), 4],
    [plan({ weight: "110", goal: "lean_bulk", neat: "very_active" }), 4],
    [plan({ weight: "130", height: "200", goal: "lean_bulk", neat: "very_active" }), 5],
  ];
  for (const [program, atLeast] of counts) {
    const meals = program.nutrition_program.culinary_meals;
    assert.ok(meals.length >= atLeast, `${program.nutrition_program.targets.target_calories} kcal on ${meals.length} plates`);
    for (const meal of meals) {
      assert.ok(kcalOf(meal) <= 1400, `${meal.meal_name_ar}: ${kcalOf(meal)} kcal on one plate`);
    }
  }
});

test("five meals a day are three meals and two snacks, named as they are cooked", () => {
  const meals = plan({ weight: "130", height: "200", goal: "lean_bulk", neat: "very_active" }).nutrition_program.culinary_meals;
  assert.equal(meals.length, 5);
  assert.deepEqual(meals.map((meal) => meal.meal_name_ar), ["وجبة الإفطار", "وجبة الغداء", "وجبة العشاء", "سناك أول", "سناك تاني"]);
  assert.ok(kcalOf(meals[3]) < kcalOf(meals[0]), "a snack eats smaller than breakfast");
});

test("the plates written for an operated stomach are not resized to hit a target", () => {
  const operated = { has_conditions: true, selected: ["bariatric_surgery"], bariatric: { is_operated: true, meal_capacity_grams: "150_200", dumping_syndrome: false } };
  const program = plan({ weight: "95", goal: "lean_bulk", neat: "very_active", medical: operated });
  const meals = program.nutrition_program.culinary_meals;
  assert.ok(meals.length >= 5, "an operated stomach eats more often");
  for (const meal of meals) {
    assert.equal(meal.fixed_portions, true, `${meal.meal_name_ar} lost its fixed size`);
    const grams = (meal.items || []).reduce((total, item) => total + (Number(item.portion_g) || 0), 0);
    assert.ok(grams <= 260, `${meal.meal_name_ar}: ${grams} g on one plate`);
  }
  // Fixed plates and a big target cannot both be met, and the coach is told in numbers.
  const told = collectCoachAlerts(program).filter((alert) => /الأكل اللي في الأطباق/.test(alert));
  assert.equal(told.length, 1, "the coach is told once, with both numbers");
});

test("a client who says his stomach takes more than 200 g eats ordinary meals", () => {
  const operated = { has_conditions: true, selected: ["bariatric_surgery"], bariatric: { is_operated: true, meal_capacity_grams: "over_200", dumping_syndrome: false } };
  const program = plan({ weight: "95", goal: "lean_bulk", neat: "very_active", medical: operated });
  const served = program.nutrition_program.culinary_meals.reduce((total, meal) => total + kcalOf(meal), 0);
  const target = program.nutrition_program.macro_targets.calories_kcal;
  assert.ok(Math.abs(served - target) / target < 0.12, `${served} kcal served against ${target}`);
});

test("a fixed plate is left exactly as it was by the trim pass", () => {
  const meal = {
    fixed_portions: true,
    target_macros: { protein_g: 5, carb_g: 5 },
    items: [{ food_code: "GREEK_YOGURT", category: "PROTEIN", portion_g: 150, protein_g: 15, carb_g: 5, fat_g: 1, calories_kcal: 90, swaps: [] }],
  };
  assert.equal(trimMealsToTarget([meal])[0], meal);
});

test("a plan after stomach surgery waits for a person before it is approved", async () => {
  const { adaptIntakePayloadToCanonicalEngine } = await import("../src/intake-decision-engine/adapters/intake-adapter.js");
  const { evaluateIntake } = await import("../src/intake-decision-engine/index.js");
  const answers = (operated) => ({
    gender: "male", age: "30", height_cm: "180", weight_kg: "95", circumferences: { neck_cm: "40", waist_cm: "95", hips_cm: "100" },
    primary_goal: "fat_loss", neat_level: "moderate", occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
    medical_conditions: {
      has_conditions: operated, selected: operated ? ["bariatric_surgery"] : ["none"],
      bariatric: { is_operated: operated, meal_capacity_grams: "150_200", dumping_syndrome: false },
    },
    injuries_map: { has_injuries: false, selected_areas: ["none"] }, religion: "MUSLIM", strict_allergies: ["none"],
    meal_structure: { meals_count: "3_meals", intermittent_fasting: "none" }, training_environment: "commercial_gym",
    training_logistics: { days_per_week: 4, experience_level: "intermediate" }, recent_training: "ACTIVE",
  });
  const decide = (operated) => evaluateIntake(adaptIntakePayloadToCanonicalEngine(structuredClone(answers(operated))), CTX);
  assert.equal(decide(false).plan_status, "READY_FOR_DRAFT");
  assert.equal(decide(true).plan_status, "MEDICAL_REVIEW_REQUIRED");
  const codes = adaptIntakePayloadToCanonicalEngine(structuredClone(answers(true))).medical.conditions.map((c) => c.conditionCode);
  assert.deepEqual(codes, ["BARIATRIC_SURGERY"]);
});

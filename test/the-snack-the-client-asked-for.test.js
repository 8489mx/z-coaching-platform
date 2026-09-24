import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { adaptIntakePayloadToCanonicalEngine } from "../src/intake-decision-engine/adapters/intake-adapter.js";
import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";

/**
 * The intake form asks how many times a day the client eats, and starts on "3 وجبات + سناك". That
 * answer was read as three meals, so the snack the client asked for never reached the plan: the
 * option produced exactly the same day as "3 وجبات". Four sittings now, the fourth one the snack.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"));
const CTX = { system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" };

const answers = (mealsCount) => ({
  gender: "male", age: "30", height_cm: "175", weight_kg: "85", circumferences: { neck_cm: "38", waist_cm: "90", hips_cm: "100" },
  primary_goal: "fat_loss", neat_level: "moderate", occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
  medical_conditions: { has_conditions: false, selected: ["none"] },
  injuries_map: { has_injuries: false, selected_areas: ["none"] }, religion: "MUSLIM", strict_allergies: ["none"],
  meal_structure: { meals_count: mealsCount, intermittent_fasting: "none" }, training_environment: "commercial_gym",
  training_logistics: { days_per_week: 4, experience_level: "intermediate" }, recent_training: "ACTIVE",
});
const plan = (mealsCount) => buildMasterEngineV2({
  intake: answers(mealsCount), evaluationContext: CTX, nutritionFoodCatalog: CATALOG, options: {},
}).nutrition_program;

test("every answer the form offers reaches the engine as the number of sittings it means", () => {
  const count = (mealsCount) => adaptIntakePayloadToCanonicalEngine(structuredClone(answers(mealsCount))).nutrition.preferredMealCount;
  assert.equal(count("3_meals"), 3);
  assert.equal(count("3_meals_snack"), 4);
  assert.equal(count("4_to_5_meals"), 4);
  assert.equal(count("2_meals"), 2);
  assert.equal(count("5_meals"), 5);
});

test("a client who asked for three meals and a snack gets the snack", () => {
  const withSnack = plan("3_meals_snack");
  assert.equal(withSnack.culinary_meals.length, 4);
  assert.match(withSnack.culinary_meals[3].meal_name_ar, /سناك/);
  assert.ok((withSnack.culinary_meals[3].items || []).length > 0, "the snack is a plate, not an empty line");
});

test("and it is not the same day as three meals", () => {
  assert.equal(plan("3_meals").culinary_meals.length, 3);
});

test("the day the client eats is still the day that was planned", () => {
  const withSnack = plan("3_meals_snack");
  const day = withSnack.culinary_meals.flatMap((meal) => meal.items || []);
  const sum = (key) => day.reduce((total, item) => total + (Number(item[key]) || 0), 0);
  for (const [key, target] of [["protein_g", withSnack.macro_targets.protein_g], ["carb_g", withSnack.macro_targets.carbohydrate_g]]) {
    assert.ok(Math.abs(sum(key) - target) / target < 0.12, `${key}: ${sum(key)} for ${target}`);
  }
});

test("the snack is the size of a snack, not a fourth dinner", () => {
  const withSnack = plan("3_meals_snack");
  const kcalOf = (meal) => (meal.items || []).reduce((total, item) => total + (Number(item.calories_kcal) || 0), 0);
  const day = withSnack.macro_targets.calories_kcal;
  const share = kcalOf(withSnack.culinary_meals[3]) / day;
  assert.ok(share > 0.10 && share < 0.20, `the snack is ${Math.round(share * 100)}% of the day`);
  for (const meal of withSnack.culinary_meals.slice(0, 3)) {
    assert.ok(kcalOf(meal) / day > 0.22, `${meal.meal_name_ar} is only ${Math.round((kcalOf(meal) / day) * 100)}% of the day`);
  }
});

test("a day too big for three plates shares the four equally instead", () => {
  // Above about 1020 kcal a meal the three plates cannot hold their food, and a plate that cannot
  // hold its food drops it - so the day goes back to four equal sittings.
  const huge = buildMasterEngineV2({
    intake: { ...answers("3_meals_snack"), weight_kg: "130", height_cm: "200", primary_goal: "lean_bulk", neat_level: "very_active" },
    evaluationContext: CTX, nutritionFoodCatalog: CATALOG, options: {},
  }).nutrition_program;
  const kcalOf = (meal) => (meal.items || []).reduce((total, item) => total + (Number(item.calories_kcal) || 0), 0);
  const share = kcalOf(huge.culinary_meals[3]) / huge.macro_targets.calories_kcal;
  assert.ok(share > 0.20, `the snack of a ${huge.macro_targets.calories_kcal} kcal day is ${Math.round(share * 100)}%`);
});

test("the snack offers the client something to swap, like every other plate", () => {
  for (const allergies of [["none"], ["dairy_lactose"]]) {
    const snack = buildMasterEngineV2({
      intake: { ...answers("3_meals_snack"), strict_allergies: allergies },
      evaluationContext: CTX, nutritionFoodCatalog: CATALOG, options: {},
    }).nutrition_program.culinary_meals[3];
    const withSwaps = (snack.items || []).filter((item) => (item.swaps || []).length > 0);
    assert.ok(withSwaps.length > 0, `the snack of a ${allergies.join(",")} client has no swap at all`);
  }
});

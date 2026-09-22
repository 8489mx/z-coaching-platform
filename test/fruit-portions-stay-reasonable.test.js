import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { carbPortionLimit, MAX_FRUIT_PORTION_G, MAX_DATES_PORTION_G } from "../src/nutrition-meal-context-v2/build-culinary-meals.js";

/**
 * A large snack carbohydrate was split into parts of up to 400 g each, so a snack could hold 400 g
 * of banana. Fresh fruit now stays at most 250 g a plate (about two medium pieces; a WHO fruit
 * portion is 80 g) and dates 80 g (about 10 dates); a split never leaves a crumb (under 40 g and under 10 g of carbohydrate).
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"));
const FRUIT = ["BANANA_FRESH", "APPLE_FRESH", "FRESH_GUAVA", "ORANGE_FRESH", "STRAWBERRY_FRESH", "WATERMELON_FRESH"];

const plan = (conditions, allergies) => buildMasterEngineV2({
  intake: {
    gender: "male", age: "27", height_cm: "200", weight_kg: "130", circumferences: { neck_cm: "44", waist_cm: "100", hips_cm: "110" },
    primary_goal: "lean_bulk", neat_level: "very_active", occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
    medical_conditions: { has_conditions: conditions.length > 0, selected: conditions.length ? conditions : ["none"], diabetes: { type: "type2", uses_insulin: false } },
    injuries_map: { has_injuries: false, selected_areas: ["none"] }, religion: "MUSLIM", strict_allergies: allergies,
    meal_structure: { meals_count: "4_meals", intermittent_fasting: "none" }, training_environment: "commercial_gym",
    training_logistics: { days_per_week: 4, experience_level: "intermediate" }, recent_training: "ACTIVE",
  },
  evaluationContext: { system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" },
  nutritionFoodCatalog: CATALOG,
  options: {},
}).nutrition_program;

test("the split caps fruit at 250 g and dates at 80 g", () => {
  const limit = carbPortionLimit({});
  assert.equal(MAX_FRUIT_PORTION_G, 250);
  assert.equal(MAX_DATES_PORTION_G, 80);
  for (const code of FRUIT) assert.equal(limit(code), MAX_FRUIT_PORTION_G, code);
  assert.equal(limit("DATES_KHALAS"), MAX_DATES_PORTION_G);
  assert.equal(limit("BASMATI_RICE"), 400);
});

test("no plate holds more fruit or dates than that, and the day's carbohydrate is kept", () => {
  for (const [conditions, allergies] of [[["diabetes", "renal", "hepatic"], ["gluten_celiac", "peanuts_tree_nuts"]], [[], ["none"]]]) {
    const n = plan(conditions, allergies);
    const items = n.culinary_meals.flatMap((m) => m.items);
    // A few grams over the limit are allowed when a tiny leftover part was folded in.
    const over = items.filter((i) => (FRUIT.includes(i.food_code) && i.portion_g > MAX_FRUIT_PORTION_G + 10 && !i.portion_warning_ar)
      || (i.food_code === "DATES_KHALAS" && i.portion_g > MAX_DATES_PORTION_G + 10 && !i.portion_warning_ar));
    assert.deepEqual(over.map((i) => `${i.food_code} ${i.portion_g}`), [], conditions.join("+"));
    // A crumb is a split part under 40 g and under 10 g of carbohydrate (10 g of apple).
    const crumbs = items.filter((i) => i.split_note_ar && i.portion_g < 40 && (Number(i.carb_g) || 0) < 10);
    assert.deepEqual(crumbs.map((i) => `${i.food_code} ${i.portion_g}`), [], "no split part of a few grams");
    const carbs = items.reduce((s, i) => s + (Number(i.carb_g) || 0), 0);
    assert.ok(Math.abs(carbs - n.macro_targets.carbohydrate_g) / n.macro_targets.carbohydrate_g < 0.08, `${carbs} for ${n.macro_targets.carbohydrate_g}`);
  }
});

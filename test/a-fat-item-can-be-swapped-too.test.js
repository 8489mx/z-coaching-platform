import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { generateSmartSwaps, FOOD_SWAP_DATABASE } from "../src/nutrition-meal-context-v2/build-culinary-meals.js";

/**
 * A fat item never had an alternative anywhere in the plan: the swap builder knew protein and
 * carbohydrate only, so the oil, the nuts and the avocado were the plates a client could not change.
 * They are matched on the fat they carry, and the same rule as everywhere else decides what the
 * client sees - the same family, within a quarter of the energy and 10 g of fat.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"));

const plan = (allergies = ["none"]) => buildMasterEngineV2({
  intake: {
    gender: "male", age: "30", height_cm: "178", weight_kg: "85", circumferences: { neck_cm: "38", waist_cm: "90", hips_cm: "100" },
    primary_goal: "fat_loss", neat_level: "moderate", occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
    medical_conditions: { has_conditions: false, selected: ["none"] },
    injuries_map: { has_injuries: false, selected_areas: ["none"] }, religion: "MUSLIM", strict_allergies: allergies,
    meal_structure: { meals_count: "3_meals_snack", intermittent_fasting: "none" }, training_environment: "commercial_gym",
    training_logistics: { days_per_week: 4, experience_level: "intermediate" }, recent_training: "ACTIVE",
  },
  evaluationContext: { system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" },
  nutritionFoodCatalog: CATALOG, options: {},
}).nutrition_program;

test("what you cook in is swapped for what you cook in, and what you eat as it is for the same", () => {
  assert.deepEqual(generateSmartSwaps("FATS", 15, "OLIVE_OIL", "LUNCH", 10, {}).map((s) => s.food_code), ["NATURAL_BUTTER_GHEE"]);
  const almondSwaps = generateSmartSwaps("FATS", 30, "RAW_ALMONDS", "SNACK", 0, {}).map((s) => s.food_code);
  assert.ok(almondSwaps.includes("FRESH_AVOCADO"), almondSwaps.join(", "));
  assert.ok(almondSwaps.includes("RAW_TAHINI"), almondSwaps.join(", "));
  // Oil is never offered for a handful of nuts: one is cooked with, the other eaten.
  assert.ok(!almondSwaps.includes("OLIVE_OIL"), almondSwaps.join(", "));
});

test("a fat swap carries the same fat and close energy", () => {
  const kcalOf = (item) => (Number(item.protein_g) || 0) * 4 + (Number(item.carb_g) || 0) * 4 + (Number(item.fat_g) || 0) * 9;
  for (const [grams, code] of [[15, "OLIVE_OIL"], [30, "RAW_ALMONDS"], [100, "FRESH_AVOCADO"]]) {
    const food = FOOD_SWAP_DATABASE[code];
    const base = {
      protein_g: (grams / 100) * (food.protein_per_100g || 0),
      carb_g: (grams / 100) * (food.carb_per_100g || 0),
      fat_g: (grams / 100) * (food.fat_per_100g || 0),
    };
    for (const swap of generateSmartSwaps("FATS", grams, code, "LUNCH", 10, {})) {
      assert.ok(Math.abs(swap.fat_g - base.fat_g) <= 10, `${code} -> ${swap.food_code}: fat ${swap.fat_g} for ${base.fat_g.toFixed(1)}`);
      const gap = Math.abs(kcalOf(swap) - kcalOf(base)) / kcalOf(base);
      assert.ok(gap <= 0.25, `${code} -> ${swap.food_code}: ${Math.round(gap * 100)}% energy apart`);
    }
  }
});

test("a plan's fat items carry their alternatives", () => {
  const meals = plan().culinary_meals;
  const fats = meals.flatMap((meal) => (meal.items || []).filter((item) => item.category === "FATS" && Number(item.portion_g) >= 10));
  assert.ok(fats.length > 0, "the plan has fat items");
  for (const item of fats) {
    assert.ok((item.swaps || []).length > 0, `${item.food_code} ${item.portion_g} g has no alternative`);
  }
});

test("a nut allergy never sees nuts among the alternatives", () => {
  const meals = plan(["peanuts_tree_nuts"]).culinary_meals;
  const swapCodes = meals.flatMap((meal) => (meal.items || []).flatMap((item) => (item.swaps || []).map((swap) => swap.food_code)));
  for (const code of swapCodes) {
    assert.doesNotMatch(String(code), /ALMOND|PEANUT/, `${code} offered to a nut allergy`);
  }
});

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { trimMealsToTarget } from "../src/nutrition-meal-context-v2/index.js";

/**
 * Two steps put food on a plate that carries more than the macro it was chosen for, and the plate
 * drifted from the meal it was planned as:
 * - a split part carries its own food (86 g of oats replacing 250 g of sweet potato match on
 *   carbohydrate but add 10 g of protein), which put a snack 12% over its protein target;
 * - a fat source carries its own (30 g of almonds add 6 g of protein and 6 g of carbohydrate).
 * And when a split had nowhere left to put its last piece, the plan showed a 39 g scrap of sweet
 * potato beside 400 g of quinoa instead of telling the coach the meal does not fit in one sitting.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"));

const plan = ({ selected = [], allergies = ["none"], meals = "3_meals", weight = "130", height = "200" }) => buildMasterEngineV2({
  intake: {
    gender: "male", age: "27", height_cm: height, weight_kg: weight, circumferences: { neck_cm: "44", waist_cm: "100", hips_cm: "110" },
    primary_goal: "lean_bulk", neat_level: "very_active", occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
    medical_conditions: { has_conditions: selected.length > 0, selected: selected.length ? selected : ["none"], diabetes: { type: "type2", uses_insulin: false } },
    injuries_map: { has_injuries: false, selected_areas: ["none"] }, religion: "MUSLIM", strict_allergies: allergies,
    meal_structure: { meals_count: meals, intermittent_fasting: "none" }, training_environment: "commercial_gym",
    training_logistics: { days_per_week: 4, experience_level: "intermediate" }, recent_training: "ACTIVE",
  },
  evaluationContext: { system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" },
  nutritionFoodCatalog: CATALOG,
  options: {},
}).nutrition_program;

const sum = (items, key) => items.reduce((total, item) => total + (Number(item[key]) || 0), 0);

test("a snack lands on the protein and carbohydrate planned for it", () => {
  const snack = plan({ selected: ["diabetes"], meals: "4_meals", weight: "100", height: "180" }).culinary_meals[3];
  for (const macro of ["protein_g", "carb_g"]) {
    const target = Number(snack.target_macros[macro]);
    const actual = sum(snack.items, macro);
    assert.ok(Math.abs(actual - target) <= Math.max(3, target * 0.05), `${macro}: ${actual} for ${target}`);
  }
});

test("no plate keeps a scrap of a few grams, and the coach is told the meal does not fit", () => {
  const program = plan({ selected: ["diabetes"], allergies: ["gluten_celiac", "peanuts_tree_nuts"] });
  const items = program.culinary_meals.flatMap((meal) => meal.items);
  const scraps = items.filter((item) => item.split_note_ar && Number(item.portion_g) < 40 && (Number(item.carb_g) || 0) < 10);
  assert.deepEqual(scraps.map((item) => `${item.food_code} ${item.portion_g}`), []);
  const told = items.filter((item) => item.portion_note_ar);
  assert.ok(told.length > 0, "the meal that could not fit says so");
  assert.match(told[0].portion_note_ar, /وزّع جزء منها على وجبة تانية/);
});

test("the meal a plate was planned as is never trimmed away", () => {
  // A donor gives at most a third of itself, so a plate keeps being the meal it was written as.
  const meal = {
    target_macros: { protein_g: 10, carb_g: 10 },
    items: [
      { food_code: "GREEK_YOGURT", category: "PROTEIN", portion_g: 300, protein_g: 30, carb_g: 10, fat_g: 2, calories_kcal: 200, swaps: [] },
      { food_code: "ROLLED_OATS", category: "CARBS", portion_g: 100, protein_g: 12, carb_g: 60, fat_g: 6, calories_kcal: 350, swaps: [] },
    ],
  };
  const [trimmed] = trimMealsToTarget([meal]);
  for (const item of trimmed.items) {
    const original = meal.items.find((i) => i.food_code === item.food_code);
    assert.ok(item.portion_g >= original.portion_g * 0.66, `${item.food_code} ${item.portion_g} of ${original.portion_g}`);
  }
});

test("a plate already on its target is left exactly as it was", () => {
  const meal = {
    target_macros: { protein_g: 30, carb_g: 60 },
    items: [{ food_code: "GREEK_YOGURT", category: "PROTEIN", portion_g: 300, protein_g: 30, carb_g: 60, fat_g: 2, calories_kcal: 400, swaps: [] }],
  };
  assert.equal(trimMealsToTarget([meal])[0], meal);
});

test("a swap shrinks with the item it belongs to, oil included", () => {
  const meal = {
    target_macros: { protein_g: 20, carb_g: 10 },
    items: [{
      food_code: "EGGS_OMELETTE", category: "PROTEIN", portion_g: 200, protein_g: 30, carb_g: 4, fat_g: 20, calories_kcal: 320,
      swaps: [{ food_code: "CANNED_TUNA", equivalent_grams: 100, protein_g: 30, carb_g: 0, fat_g: 4, calories_kcal: 160, oil_deduction_g: 6 }],
    }],
  };
  const [trimmed] = trimMealsToTarget([meal]);
  const item = trimmed.items[0];
  const swap = item.swaps[0];
  const factor = item.protein_g / 30;
  assert.ok(factor < 1, "the item was trimmed");
  assert.equal(swap.equivalent_grams, Math.round(100 * factor));
  assert.equal(swap.protein_g, Math.round(30 * factor));
  assert.ok(swap.oil_deduction_g < 6, "the oil to leave out shrinks with the portion");
});

test("breakfast fits its protein target instead of being fixed amounts", () => {
  // Two eggs and 150 g of cheese were placed whatever the target was, and the bread brought 17 g of
  // protein of its own, so a small breakfast was over before it was built. The eggs and the cheese
  // take what the bread and the salad leave now.
  for (const weight of ["60", "75", "85", "110"]) {
    const program = buildMasterEngineV2({
      intake: {
        gender: "male", age: "30", height_cm: "178", weight_kg: weight, circumferences: { neck_cm: "38", waist_cm: "90", hips_cm: "100" },
        primary_goal: weight === "110" ? "lean_bulk" : "fat_loss", neat_level: "moderate", occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
        medical_conditions: { has_conditions: false, selected: ["none"] },
        injuries_map: { has_injuries: false, selected_areas: ["none"] }, religion: "MUSLIM", strict_allergies: ["none"],
        meal_structure: { meals_count: "3_meals_snack", intermittent_fasting: "none" }, training_environment: "commercial_gym",
        training_logistics: { days_per_week: 4, experience_level: "intermediate" }, recent_training: "ACTIVE",
      },
      evaluationContext: { system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" },
      nutritionFoodCatalog: CATALOG, options: {},
    }).nutrition_program;
    const breakfast = program.culinary_meals[0];
    const target = Number(breakfast.target_macros.protein_g);
    const actual = sum(breakfast.items, "protein_g");
    assert.ok(Math.abs(actual - target) <= Math.max(3, target * 0.08), `${weight} kg: breakfast protein ${actual} for ${target}`);
    // It is still breakfast: eggs on the plate, and the cheese only when it is worth a portion.
    assert.ok((breakfast.items || []).some((item) => item.food_code === "EGGS_OMELETTE"), "breakfast keeps its eggs");
    const cheese = (breakfast.items || []).find((item) => item.food_code === "COTTAGE_CHEESE");
    if (cheese) assert.ok(cheese.portion_g >= 40, `cottage cheese ${cheese.portion_g} g is not a portion`);
  }
});

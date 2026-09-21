import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { generateSmartSwaps, buildAllergenContext, enforceClinicalSafety } from "../src/nutrition-meal-context-v2/build-culinary-meals.js";
import { adaptIntakePayloadToCanonicalEngine } from "../src/intake-decision-engine/adapters/intake-adapter.js";
import { isEquivalentSwap } from "../frontend/src/utils/swapExchangeRules.js";

/**
 * The swap lists stored in the plan matched only the main nutrient: chicken became foul (+187%
 * energy), an omelette (+165%, 25 g more fat) or laban (+141%); an omelette became tuna (-62%).
 * Every stored swap is now the same kind of food with close energy and fat (after the olive oil the swap
 * tells the client to leave out or add).
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"));

const base = {
  dangerous_symptoms: ["NONE"], injuries_map: { has_injuries: false, selected_areas: ["none"] }, religion: "MUSLIM",
  training_environment: "commercial_gym", training_logistics: { days_per_week: 4, experience_level: "intermediate" }, recent_training: "ACTIVE",
  occupation_type: "DESK_OFFICE", circumferences: { neck_cm: "38", waist_cm: "85", hips_cm: "98" },
};
const CLIENTS = [
  { gender: "male", age: "25", height_cm: "180", weight_kg: "80", primary_goal: "lean_bulk", neat_level: "very_active", medical_conditions: { has_conditions: false, selected: ["none"] }, strict_allergies: ["none"], meal_structure: { meals_count: "4_meals" } },
  { gender: "female", age: "40", height_cm: "162", weight_kg: "85", primary_goal: "fat_loss", neat_level: "sedentary", medical_conditions: { has_conditions: true, selected: ["diabetes"], diabetes: { type: "type2", uses_insulin: false } }, strict_allergies: ["gluten_celiac"], meal_structure: { meals_count: "3_meals" } },
  { gender: "male", age: "35", height_cm: "175", weight_kg: "95", primary_goal: "recomposition", neat_level: "moderate", medical_conditions: { has_conditions: false, selected: ["none"] }, strict_allergies: ["dairy_lactose"], meal_structure: { meals_count: "5_meals" } },
  { gender: "female", age: "30", height_cm: "165", weight_kg: "60", primary_goal: "general_fitness", neat_level: "moderate", medical_conditions: { has_conditions: false, selected: ["none"] }, strict_allergies: ["eggs"], meal_structure: { meals_count: "3_meals" } },
];
const plan = (client) => buildMasterEngineV2({
  intake: { ...base, ...client, meal_structure: { intermittent_fasting: "none", ...client.meal_structure } },
  evaluationContext: { system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" },
  nutritionFoodCatalog: CATALOG,
  options: {},
}).nutrition_program;

const kcalOf = (i) => Number(i.calories_kcal) || (Number(i.protein_g) || 0) * 4 + (Number(i.carb_g) || 0) * 4 + (Number(i.fat_g) || 0) * 9;

test("every swap stored in a plan is the same kind of food with close energy and fat", () => {
  const bad = [];
  for (const client of CLIENTS) {
    for (const meal of plan(client).culinary_meals) {
      for (const item of meal.items) {
        for (const swap of item.swaps || []) {
          const oil = (Number(swap.oil_deduction_g) || 0) - (Number(swap.oil_addition_g) || 0);
          const ok = isEquivalentSwap({
            fromCode: item.food_code, toCode: swap.food_code,
            fromKcal: kcalOf(item), toKcal: kcalOf(swap) - oil * 9, fromFat: Number(item.fat_g) || 0, toFat: (Number(swap.fat_g) || 0) - oil,
          });
          if (!ok) bad.push(`${item.food_code} ${item.portion_g}g -> ${swap.food_code} ${swap.equivalent_grams}g`);
        }
      }
    }
  }
  assert.deepEqual(bad, []);
});

test("safety before taste: an egg allergy never keeps an egg dish when no equivalent swap exists", () => {
  // The bariatric template places eggs directly; with only equivalent swaps allowed, the allergy
  // replacement found none and the omelette stayed (caught by the 306-client stress run).
  for (const selected of [["bariatric_surgery"], ["renal", "bariatric_surgery", "gi_tract"]]) {
    const n = plan({ gender: "female", age: "40", height_cm: "160", weight_kg: "70", primary_goal: "fat_loss", neat_level: "sedentary",
      medical_conditions: { has_conditions: true, selected }, strict_allergies: ["eggs"], meal_structure: { meals_count: "5_meals" } });
    const eggs = n.culinary_meals.flatMap((m) => m.items).filter((i) => ["EGGS_OMELETTE", "SHAKSHOUKA_EGGS", "WHOLE_EGG", "EGG_WHITE"].includes(i.food_code));
    assert.deepEqual(eggs.map((i) => i.food_code), [], selected.join("+"));
  }
});

test("safety before taste: with no equivalent safe swap, the unsafe food is still replaced", () => {
  // Eggs, dairy, fish and poultry excluded: no savory breakfast protein of close value is left.
  const ctx = { isEggsExcluded: true, isDairyExcluded: true, isFishExcluded: true, isPoultryExcluded: true };
  const omelette = { food_code: "EGGS_OMELETTE", category: "PROTEIN", portion_g: 110, protein_g: 13, carb_g: 1, fat_g: 10, calories_kcal: 142, swaps: [] };
  assert.deepEqual(generateSmartSwaps("PROTEIN", 110, "EGGS_OMELETTE", "BREAKFAST", 0, ctx).map((s) => s.food_code), [],
    "precondition: nothing equivalent is safe");
  const [meal] = enforceClinicalSafety([{ meal_context: "BREAKFAST", items: [omelette] }], ctx);
  assert.notEqual(meal.items[0].food_code, "EGGS_OMELETTE");
  assert.ok(!meal.items[0].clinically_unsafe, JSON.stringify(meal.items[0]));
});

test("chicken at dinner can become other meat or fish, not only tuna", () => {
  const codes = generateSmartSwaps("PROTEIN", 150, "CHICKEN_BREAST", "DINNER", 10, {}).map((s) => s.food_code);
  assert.ok(codes.filter((c) => ["TILAPIA_FISH", "LEAN_BEEF", "HAMOUR_FISH", "KANAAD_KINGFISH", "BOURI_FISH", "CAMEL_MEAT_LEAN"].includes(c)).length >= 2, codes.join(","));
  for (const bad of ["FOUL_MUDAMMAS", "EGGS_OMELETTE", "LABAN_RAYEB_LOWFAT", "MIXED_LEGUMES_STEW"]) assert.ok(!codes.includes(bad), `${bad} offered`);
});

test("breakfast potatoes for a coeliac diabetic can become sweet potato (there was no swap at all)", () => {
  const raw = { gender: "male", age: "27", height_cm: "200", weight_kg: "130", primary_goal: "lean_bulk", dangerous_symptoms: ["NONE"],
    medical_conditions: { has_conditions: true, selected: ["diabetes", "renal", "hepatic"], diabetes: { type: "type2", uses_insulin: false } },
    strict_allergies: ["gluten_celiac", "peanuts_tree_nuts"] };
  const ctx = buildAllergenContext(adaptIntakePayloadToCanonicalEngine(structuredClone(raw)), raw);
  const codes = generateSmartSwaps("CARBS", 300, "ROASTED_POTATOES", "BREAKFAST", 5, ctx).map((s) => s.food_code);
  assert.ok(codes.includes("SWEET_POTATO"), codes.join(","));
});

test("a snack's sweet potato can become fruit or dates", () => {
  const codes = generateSmartSwaps("CARBS", 200, "SWEET_POTATO", "SNACK", 5, {}).map((s) => s.food_code);
  assert.ok(codes.some((c) => ["BANANA_FRESH", "APPLE_FRESH", "FRESH_GUAVA", "DATES_KHALAS"].includes(c)), codes.join(","));
});

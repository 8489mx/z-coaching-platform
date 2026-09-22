import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { FOOD_SWAP_DATABASE } from "../src/nutrition-meal-context-v2/index.js";
import { isNoSwapFood } from "../frontend/src/utils/swapExchangeRules.js";

/**
 * A plain client got chicken breast in all three meals (and eggs + cottage cheese + chicken at
 * breakfast); a client who dislikes eggs and cottage cheese got shakshouka twice in one breakfast.
 * Now: one protein food in at most two meals a day, and no food twice in one meal. The change uses
 * the item's own equivalent swaps (same value, already safe for the client, no oil change).
 */
const CATALOG = JSON.parse(fs.readFileSync("data/catalogs/core-global-food-batch-v1.json", "utf8"));
const CONTEXT = { system_time: "2026-09-22T08:00:00.000Z", assessmentDate: "2026-09-22" };
const intake = (extra = {}) => ({
  gender: "female", age: "30", height_cm: "165", weight_kg: "75", circumferences: { neck_cm: "33", waist_cm: "80", hips_cm: "100" },
  primary_goal: "fat_loss", neat_level: "moderate", occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
  medical_conditions: { has_conditions: false, selected: ["none"] }, injuries_map: { has_injuries: false, selected_areas: ["none"] },
  religion: "MUSLIM", strict_allergies: ["none"], meal_structure: { meals_count: "3_meals", intermittent_fasting: "none" },
  training_environment: "commercial_gym", training_logistics: { days_per_week: 3, training_age: "never" }, recent_training: "ACTIVE",
  ...extra,
});
const meals = (extra) => buildMasterEngineV2({ intake: intake(extra), evaluationContext: CONTEXT, nutritionFoodCatalog: CATALOG, options: {} })
  .nutrition_program.culinary_meals;

const CASES = {
  plain: {},
  "low budget": { food_budget: "LOW" },
  "four meals, male bulk": { gender: "male", weight_kg: "80", height_cm: "180", primary_goal: "lean_bulk", meal_structure: { meals_count: "4_meals", intermittent_fasting: "none" } },
  "dislikes eggs, cottage cheese, chicken, rice, oats, tuna": { disliked_foods: ["صدور دجاج", "بيض مسلوق", "جبن قريش", "أرز أبيض", "شوفان", "تونة"] },
  diabetic: { medical_conditions: { has_conditions: true, selected: ["diabetes"], diabetes: { type: "type2", uses_insulin: false } } },
};

test("one protein food appears in at most two meals of the day", () => {
  for (const [name, extra] of Object.entries(CASES)) {
    const count = {};
    for (const meal of meals(extra)) {
      for (const code of new Set(meal.items.filter((i) => i.category === "PROTEIN" && !isNoSwapFood(i.food_code)).map((i) => i.food_code))) {
        count[code] = (count[code] || 0) + 1;
      }
    }
    for (const [code, n] of Object.entries(count)) assert.ok(n <= 2, `${name}: ${code} in ${n} meals`);
  }
});

test("no meal holds the same food twice", () => {
  for (const [name, extra] of Object.entries(CASES)) {
    for (const meal of meals(extra)) {
      const codes = meal.items.map((i) => i.food_code).filter((c) => c !== "OLIVE_OIL");
      assert.equal(new Set(codes).size, codes.length, `${name}, meal ${meal.meal_number}: ${codes.join(", ")}`);
    }
  }
});

test("a food changed for variety keeps the value, fits the budget and can be switched back", () => {
  let changed = 0;
  for (const [name, extra] of Object.entries(CASES)) {
    for (const meal of meals(extra)) {
      for (const item of meal.items.filter((i) => i.replaced_for_variety_from)) {
        changed += 1;
        const back = (item.swaps || []).find((s) => s.food_code === item.replaced_for_variety_from);
        assert.ok(back, `${name}: ${item.replaced_for_variety_from} is offered back`);
        assert.ok(Math.abs(item.calories_kcal - back.calories_kcal) <= 0.25 * back.calories_kcal, `${name}: energy close`);
        assert.ok(Math.abs(item.fat_g - back.fat_g) <= 10, `${name}: fat close`);
        if (extra.food_budget === "LOW") assert.ok(FOOD_SWAP_DATABASE[item.food_code]?.is_economic, `${name}: ${item.food_code} fits a low budget`);
      }
    }
  }
  assert.ok(changed > 0, "the plain plan had chicken in three meals, so something changed");
});

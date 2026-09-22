import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { FOOD_SWAP_DATABASE, generateSmartSwaps, buildAllergenContext, isFoodClinicallySafe } from "../src/nutrition-meal-context-v2/build-culinary-meals.js";
import { adaptIntakePayloadToCanonicalEngine } from "../src/intake-decision-engine/adapters/intake-adapter.js";
import { getSmartFoodRegistryItem } from "../src/nutrition-swap-engine-v2/swap-pool-registry.js";
import { sharesSwapFamily } from "../frontend/src/utils/swapExchangeRules.js";

/**
 * A coeliac diabetic's breakfast potatoes stayed above the diabetic 200 g limit: the food lists had no
 * other gluten-free, lower-glycemic savory starch for breakfast. Cooked quinoa (USDA: 120 kcal, 4.4 g
 * protein, 21.3 g carbohydrate, 1.9 g fat per 100 g; low glycemic index, gluten-free) joins the plan
 * and mobile lists under the web list's code, COOKED_QUINOA, as a savory starch.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"));
const raw = {
  gender: "male", age: "27", height_cm: "200", weight_kg: "130", circumferences: { neck_cm: "44", waist_cm: "100", hips_cm: "110" },
  primary_goal: "lean_bulk", neat_level: "very_active", occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
  medical_conditions: { has_conditions: true, selected: ["diabetes", "renal", "hepatic"], diabetes: { type: "type2", uses_insulin: false } },
  injuries_map: { has_injuries: false, selected_areas: ["none"] }, religion: "MUSLIM", strict_allergies: ["gluten_celiac", "peanuts_tree_nuts"],
  meal_structure: { meals_count: "3_meals", intermittent_fasting: "none" }, training_environment: "commercial_gym",
  training_logistics: { days_per_week: 4, training_age: "1_2_years" }, recent_training: "ACTIVE",
};

test("quinoa is one food in the plan and mobile lists, gluten-free and fit for a diabetic", () => {
  const q = FOOD_SWAP_DATABASE.COOKED_QUINOA;
  assert.ok(q && q.is_gluten_free && q.carb_per_100g === 21.3 && q.kcal_per_100g === 120);
  assert.ok(getSmartFoodRegistryItem("COOKED_QUINOA"), "mobile swap list");
  assert.ok(sharesSwapFamily("COOKED_QUINOA", "BASMATI_RICE") && sharesSwapFamily("COOKED_QUINOA", "ROASTED_POTATOES"));
  const ctx = buildAllergenContext(adaptIntakePayloadToCanonicalEngine(structuredClone(raw)), raw);
  assert.ok(isFoodClinicallySafe("COOKED_QUINOA", ctx));
});

test("a coeliac diabetic's breakfast potatoes can be split with quinoa, and no plate is left above its limit", () => {
  const ctx = buildAllergenContext(adaptIntakePayloadToCanonicalEngine(structuredClone(raw)), raw);
  assert.ok(generateSmartSwaps("CARBS", 300, "ROASTED_POTATOES", "BREAKFAST", 5, ctx).some((s) => s.food_code === "COOKED_QUINOA"));
  const n = buildMasterEngineV2({ intake: raw, evaluationContext: { system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" }, nutritionFoodCatalog: CATALOG, options: {} }).nutrition_program;
  const flagged = n.culinary_meals.flatMap((m) => m.items).filter((i) => i.portion_warning_ar && i.category === "CARBS");
  assert.deepEqual(flagged.map((i) => `${i.food_code} ${i.portion_g}`), []);
});

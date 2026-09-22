import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { adaptIntakePayloadToCanonicalEngine } from "../src/intake-decision-engine/adapters/intake-adapter.js";
import { DISLIKED_FOOD_LABEL_CODES } from "../src/intake-decision-engine/adapters/disliked-foods.js";
import { evaluateIntake } from "z-coaching-intake-decision-engine";
import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { buildAllergenContext } from "../src/nutrition-meal-context-v2/index.js";
import { isSwapFoodSafe } from "../src/api/services/liveFoodSwapSafety.js";

/**
 * The form's "foods I don't like" sends Arabic labels. The canonical intake rejected them, so the
 * coach could not generate a plan for any client who ticked one, and the engine never removed them.
 */
const CATALOG = JSON.parse(fs.readFileSync("data/catalogs/core-global-food-batch-v1.json", "utf8"));
const CONTEXT = { system_time: "2026-09-22T08:00:00.000Z", assessmentDate: "2026-09-22" };
const intake = (disliked, extra = {}) => ({
  gender: "female", age: "30", height_cm: "165", weight_kg: "75", circumferences: { neck_cm: "33", waist_cm: "80", hips_cm: "100" },
  primary_goal: "fat_loss", neat_level: "moderate", occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
  medical_conditions: { has_conditions: false, selected: ["none"] }, injuries_map: { has_injuries: false, selected_areas: ["none"] },
  religion: "MUSLIM", strict_allergies: ["none"], meal_structure: { meals_count: "3_meals", intermittent_fasting: "none" },
  training_environment: "commercial_gym", training_logistics: { days_per_week: 3, training_age: "never" }, recent_training: "ACTIVE",
  disliked_foods: disliked, ...extra,
});
const plan = (disliked, extra) => buildMasterEngineV2({ intake: intake(disliked, extra), evaluationContext: CONTEXT, nutritionFoodCatalog: CATALOG, options: {} });
const codesIn = (program) => program.nutrition_program.culinary_meals.flatMap((m) => m.items.flatMap((i) => [i.food_code, ...(i.swaps || []).map((s) => s.food_code)]));

test("every food the form lists under 'foods I don't like' has a mapping", () => {
  const src = fs.readFileSync("frontend/src/pages/FullIntakeForm.jsx", "utf8");
  const section = src.slice(src.indexOf("Disliked Foods Categorized Capsules"));
  const labels = [...section.matchAll(/\[((?:\s*'[^']+',?\s*)+)\]\.map/g)].flatMap((m) => [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]));
  assert.ok(labels.length >= 30, `found ${labels.length} labels`);
  const missing = labels.filter((l) => !Object.hasOwn(DISLIKED_FOOD_LABEL_CODES, l));
  assert.deepEqual(missing, []);
});

test("a client who ticks disliked foods can still get a plan", () => {
  const all = Object.keys(DISLIKED_FOOD_LABEL_CODES);
  const decision = evaluateIntake(adaptIntakePayloadToCanonicalEngine(intake(all)), CONTEXT);
  assert.equal(decision.plan_status, "READY_FOR_DRAFT");
});

test("disliked foods leave the meals and the swap lists, with no clinical warning", () => {
  const disliked = ["صدور دجاج", "بيض مسلوق", "جبن قريش", "أرز أبيض", "شوفان", "تونة"];
  const program = plan(disliked);
  const codes = codesIn(program);
  for (const bad of ["CHICKEN_BREAST", "EGGS_OMELETTE", "COTTAGE_CHEESE", "BASMATI_RICE", "EGYPTIAN_RICE", "KABSA_SPICED_RICE", "ROLLED_OATS", "CANNED_TUNA"]) {
    assert.ok(!codes.includes(bad), `${bad} still in the plan`);
  }
  const items = program.nutrition_program.culinary_meals.flatMap((m) => m.items);
  assert.ok(!items.some((i) => i.clinically_unsafe), "a dislike is not a clinical problem");
});

test("a client with no dislikes keeps the same foods", () => {
  assert.ok(codesIn(plan([])).includes("CHICKEN_BREAST"));
});

test("the app's live swaps never offer a disliked food", () => {
  const raw = intake(["صدور دجاج", "زبدة فول سوداني"]);
  const context = buildAllergenContext(adaptIntakePayloadToCanonicalEngine(structuredClone(raw)), raw);
  assert.equal(isSwapFoodSafe("CHICKEN_BREAST_COOKED", context), false);
  assert.equal(isSwapFoodSafe("PEANUT_BUTTER", context), false);
  assert.equal(isSwapFoodSafe("TILAPIA_COOKED", context), true);
});

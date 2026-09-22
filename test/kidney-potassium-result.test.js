import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { HIGH_POTASSIUM_FOODS, isFoodClinicallySafe, buildAllergenContext, diversifyFatSources } from "../src/nutrition-meal-context-v2/build-culinary-meals.js";
import { adaptIntakePayloadToCanonicalEngine } from "../src/intake-decision-engine/adapters/intake-adapter.js";

/**
 * KDIGO 2024 (CKD guideline, practice points 3.11.5.1-2): potassium is managed per person - limited
 * with hyperkalaemia, not by default. The intake had no potassium result, so every kidney client got
 * the same moderate avocado and a note. With the latest result: above 5.0 mmol/L the potassium-rich
 * foods leave the plan and every swap list; within range nothing is limited; unknown stays as before.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"));
const intake = (potassium) => ({
  gender: "male", age: "35", height_cm: "180", weight_kg: "100", circumferences: { neck_cm: "40", waist_cm: "95", hips_cm: "100" },
  primary_goal: "lean_bulk", neat_level: "very_active", occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
  medical_conditions: { has_conditions: true, selected: ["diabetes", "renal"], diabetes: { type: "type2", uses_insulin: false }, ...(potassium === undefined ? {} : { renal: { potassium_mmol_l: potassium } }) },
  injuries_map: { has_injuries: false, selected_areas: ["none"] }, religion: "MUSLIM", strict_allergies: ["none"],
  meal_structure: { meals_count: "4_meals", intermittent_fasting: "none" }, training_environment: "commercial_gym",
  training_logistics: { days_per_week: 4, training_age: "1_2_years" }, recent_training: "ACTIVE",
});
const plan = (potassium) => buildMasterEngineV2({ intake: intake(potassium), evaluationContext: { system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" }, nutritionFoodCatalog: CATALOG, options: {} }).nutrition_program;

test("a high potassium result takes the potassium-rich foods out of the plan and out of every swap", () => {
  for (const code of ["FRESH_AVOCADO", "ROASTED_POTATOES", "SWEET_POTATO", "BANANA_FRESH", "DATES_KHALAS", "ORANGE_FRESH"]) assert.ok(HIGH_POTASSIUM_FOODS.has(code), code);
  const n = plan("5.8");
  const items = n.culinary_meals.flatMap((m) => m.items);
  const found = [...items.map((i) => i.food_code), ...items.flatMap((i) => (i.swaps || []).map((s) => s.food_code))].filter((c) => HIGH_POTASSIUM_FOODS.has(c));
  assert.deepEqual(found, []);
  const g = n.targets.clinical_guardrails;
  assert.equal(g.kidney_potassium_status, "HIGH");
  assert.match(g.kidney_potassium_note_ar, /5\.8/);
});

test("the mobile app's swap restrictions follow the same result", () => {
  const raw = intake("5.8");
  const ctx = buildAllergenContext(adaptIntakePayloadToCanonicalEngine(structuredClone(raw)), raw);
  assert.equal(ctx.isHighPotassium, true);
  assert.equal(isFoodClinicallySafe("ROASTED_POTATOES", ctx), false);
  assert.equal(isFoodClinicallySafe("BASMATI_RICE", ctx), true);
});

test("a normal result limits nothing; no result keeps the moderate avocado and asks the coach", () => {
  const normal = plan("4.2");
  assert.equal(normal.targets.clinical_guardrails.kidney_potassium_status, "NORMAL");
  // The fat step gives a normal-potassium kidney client the full avocado portion again (the day's
  // balance rarely needs it, so the step is checked directly).
  const oilMeal = () => [{ items: [{ food_code: "OLIVE_OIL", category: "FATS", portion_g: 45, protein_g: 0, carb_g: 0, fat_g: 45, calories_kcal: 405, swaps: [] }] }];
  const avocado = (status) => diversifyFatSources(oilMeal(), {}, { kidneyProteinCapped: true, kidneyCondition: true, kidneyPotassiumStatus: status })[0].items.find((i) => i.food_code === "FRESH_AVOCADO");
  assert.ok(avocado("NORMAL").portion_g > 50, "a full avocado portion with a normal result");
  assert.ok(avocado("UNKNOWN").portion_g <= 50, "moderate without a result");
  const unknown = plan(undefined);
  assert.equal(unknown.targets.clinical_guardrails.kidney_potassium_status, "UNKNOWN");
  for (const a of unknown.culinary_meals.flatMap((m) => m.items).filter((i) => i.food_code === "FRESH_AVOCADO")) assert.ok(a.portion_g <= 50);
  assert.match(unknown.targets.clinical_guardrails.kidney_potassium_note_ar, /اطلب آخر تحليل بوتاسيوم/);
});

test("the web client's swap window follows the same result", async () => {
  const { deriveClinicalConstraints } = await import("../src/api/controllers/program.controller.js");
  const { isFoodClinicallySafe: webSafe, FOOD_DATABASE } = await import("../frontend/src/utils/foodSwapEngine.js");
  const constraints = deriveClinicalConstraints(intake("5.8"));
  assert.equal(constraints.is_high_potassium, true);
  assert.equal(deriveClinicalConstraints(intake("4.2")).is_high_potassium, false);
  const potato = Object.values(FOOD_DATABASE).find((f) => /POTATO/.test(f.code || ""));
  assert.equal(webSafe(potato, constraints), false, potato.code);
  assert.equal(webSafe(potato, { is_high_potassium: false }), true);
});

/* B2-MERGE (B2-2 + B2-5): protein preservation across the diet-break
 * boundary, and the per-category scaling leak.
 *
 * Fail-first: on the batch-1 base all three tests fail. The merge engine
 * itself never cut these proteins — it faithfully applied what the
 * adaptation produced. Both drops are regen-side, in
 * build-adapted-plan.js, and the merge had no guard against them:
 *
 * C04 w16 (male, 35y, 110 -> 98.9 kg, hypertension, fat-loss): the w16
 * cycle regeneration recomputes protein at the new weight — 218 g, up
 * from 193 g, because the adjusted-body-weight formula jumps when BMI
 * crosses below 30. The diet-break return then restores the stale
 * pre-break protein (193 g) over the fresh 218 g: a 25 g cut at the
 * same weight. Protein is inviolable at a merge.
 *
 * X08 w6/w7 (male, 72y, 112 kg, type 2 diabetes + hypertension, 16:8):
 * the diabetic macro-rebalancing block tops protein up to 2.2 g/kg of
 * reference weight (178-179 g) during the break week, ignoring the H8
 * elderly cap (1.6 g/kg at 65+, kidney function unknown) that the
 * generation path records in clinical_guardrails
 * (elderly_protein_cap_per_kg: 1.6). The return week restores the
 * capped pre-break 130 g: a 49 g cut at the same weight.
 *
 * L23 w3 (female, 27y, fat-loss): the merge's per-category ratio
 * scaling cannot hit the macro targets because items carry all three
 * macros, so on a tight plate the food barely moves — targets +31 kcal,
 * served food +9 kcal (FOOD_STALE). The plate below is L23's real
 * served day-0 plate from the longitudinal journey; the w2/w3 targets
 * are the journey's real targets.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { buildAdaptedPlan } from "../src/adaptation-engine/build-adapted-plan.js";
import {
  mergeAdaptedPlanIntoProgram,
  rebalanceCulinaryMeals,
} from "../src/api/utils/planMergeEngine.js";

const evaluationContext = Object.freeze({
  system_time: new Date("2026-11-06T00:00:00.000Z").toISOString(),
  assessmentDate: "2026-11-06",
});

const nutritionFoodCatalog = JSON.parse(
  fs.readFileSync(new URL("../data/catalogs/core-global-food-batch-v1.json", import.meta.url), "utf8"),
);

/* Minimal intake builder (same field mapping as the longitudinal
 * harness): the engine needs the client's own facts, not a generic
 * fixture, for the H8 cap and the diabetic guard to engage. */
function buildIntake(p, weightOverride = null) {
  return {
    gender: p.sex,
    age: String(p.age),
    height_cm: String(p.height_cm),
    weight_kg: String(weightOverride ?? p.weight_kg),
    ...(p.waist_cm ? { waist_cm: String(p.waist_cm) } : {}),
    primary_goal: p.goal,
    neat_level: p.neat_level || "light",
    occupation_type: "DESK_OFFICE",
    dangerous_symptoms: ["NONE"],
    medical_conditions: { has_conditions: p.medical.length > 0, selected: p.medical },
    injuries_map: {
      has_injuries: p.injuries.length > 0,
      selected_areas: p.injuries.map((i) => i.area),
      ...(p.injuries[0]?.pain_level != null ? { pain_level: p.injuries[0].pain_level } : {}),
    },
    ...(p.injuries[0]?.severity ? { injury_severity: p.injuries[0].severity } : {}),
    religion: "MUSLIM",
    strict_allergies: p.allergies,
    ...(p.disliked_foods?.length ? { disliked_foods: p.disliked_foods } : {}),
    meal_structure: { meals_count: p.meals_count || "3_meals", intermittent_fasting: p.fasting || "none" },
    training_environment: p.training_environment,
    training_logistics: { days_per_week: p.days_per_week, experience_level: p.experience },
    recent_training: "ACTIVE",
    cardio: {
      walkingAbility: p.walking || "EASY",
      averageDailySteps: p.steps || 5000,
      maxSessionsPerWeek: 2,
      maxDurationMinutes: 30,
    },
    sleep_hours: p.sleep_hours || 7,
    sleep_schedule: { pattern: p.sleep_pattern || "regular_night", average_hours: p.sleep_hours || 7 },
    ...(p.meds?.length ? { current_meds_supplements_list: p.meds } : {}),
    ...(p.intolerances?.length
      ? {
          nutrition: {
            preferredMealCount:
              { "2_meals": 2, "3_meals": 3, "3_meals_snack": 4, "4_to_5_meals": 4, "4_meals": 4, "5_meals": 5 }[p.meals_count] || 3,
            allergies: (p.allergies || [])
              .filter((a) => a && String(a).toUpperCase() !== "NONE")
              .map((a) => ({ substance: String(a).toUpperCase(), medicallyConfirmed: false })),
            excludedFoodsList: (p.allergies || []).map((a) => String(a).toUpperCase()),
            dislikedFoods: [],
            intolerances: (p.intolerances || []).map((s) => ({ substance: s, severity: "MODERATE", medicallyDiagnosed: true })),
            digestiveIssues: [],
            budget: "MEDIUM",
            foodStorageAvailable: true,
            foodReheatingAvailable: true,
          },
        }
      : {}),
  };
}

function programTargets(program) {
  const t = program.nutrition_program?.macro_targets;
  return { kcal: t?.calories_kcal, protein: t?.protein_g, carbs: t?.carbohydrate_g, fat: t?.fat_g };
}

const C04 = {
  sex: "male", age: 35, weight_kg: 110, height_cm: 182, goal: "fat_loss",
  medical: ["hypertension"],
  injuries: [{ area: "spine_back", pain_level: 5, severity: "MODERATE" }],
  allergies: [], intolerances: [], meds: [],
  neat_level: "light", fasting: "none", sleep_pattern: "regular_night",
  training_environment: "commercial_gym", days_per_week: 4, experience: "INTERMEDIATE",
  walking: "EASY", steps: 5000, sleep_hours: 7,
};

const X08 = {
  sex: "male", age: 72, weight_kg: 112, height_cm: 170, goal: "fat_loss",
  medical: ["DIABETES", "HYPERTENSION", "ASTHMA_OR_RESPIRATORY_CONDITION", "THYROID_CONDITION"],
  injuries: [
    { area: "knee", pain_level: 3, severity: "moderate" },
    { area: "shoulder", pain_level: 3, severity: "moderate" },
  ],
  allergies: ["PEANUT"], intolerances: ["LACTOSE"], meds: ["METFORMIN", "EUTHYROX"],
  neat_level: "light", fasting: "16_8", sleep_pattern: "night_shift",
  training_environment: "commercial_gym", days_per_week: 3, experience: "beginner",
  walking: "EASY", steps: 5000, sleep_hours: 5.5, waist_cm: 118, meals_count: "3_meals",
  disliked_foods: [],
};

/* L23's real served day-0 plate (longitudinal journey
 * out-b1-int-fix2/L23/day0-plan.json): 1779 kcal / P164.5 / C175.2 /
 * F41.9 against headline targets 1775 / P165 / C178 / F45. */
const L23_DAY0 = [
  { meal_number: 1, items: [
    { food_code: "EGGS_OMELETTE", category: "PROTEIN", portion_g: 110, protein_g: 13, carb_g: 1, fat_g: 10, calories_kcal: 142 },
    { food_code: "MEDITERRANEAN_SALAD", category: "VEGGIES", portion_g: 150, protein_g: 2, carb_g: 4, fat_g: 0, calories_kcal: 25 },
    { food_code: "COTTAGE_CHEESE", category: "PROTEIN", portion_g: 150, protein_g: 18, carb_g: 5, fat_g: 2, calories_kcal: 113 },
    { food_code: "BALADI_BREAD", category: "CARBS", portion_g: 73, protein_g: 6.6, carb_g: 37.9, fat_g: 0.9, calories_kcal: 190 },
    { food_code: "EGG_WHITE_COOKED", category: "PROTEIN", portion_g: 66, protein_g: 7.1, carb_g: 1.6, fat_g: 0, calories_kcal: 34 },
  ] },
  { meal_number: 2, items: [
    { food_code: "SAUTEED_VEGGIES", category: "VEGGIES", portion_g: 150, protein_g: 2, carb_g: 4, fat_g: 0, calories_kcal: 25 },
    { food_code: "BASMATI_RICE", category: "CARBS", portion_g: 163, protein_g: 5, carb_g: 45.7, fat_g: 1, calories_kcal: 212 },
    { food_code: "CHICKEN_BREAST", category: "PROTEIN", portion_g: 129, protein_g: 40, carb_g: 0, fat_g: 4, calories_kcal: 213 },
    { food_code: "OLIVE_OIL", category: "FATS", portion_g: 6, protein_g: 0, carb_g: 0, fat_g: 6, calories_kcal: 54 },
  ] },
  { meal_number: 3, items: [
    { food_code: "MEDITERRANEAN_SALAD", category: "VEGGIES", portion_g: 150, protein_g: 2, carb_g: 4, fat_g: 0, calories_kcal: 25 },
    { food_code: "BALADI_BREAD", category: "CARBS", portion_g: 86, protein_g: 7.8, carb_g: 45, fat_g: 1, calories_kcal: 224 },
    { food_code: "CHICKEN_BREAST", category: "PROTEIN", portion_g: 116, protein_g: 36, carb_g: 0, fat_g: 3, calories_kcal: 191 },
    { food_code: "OLIVE_OIL", category: "FATS", portion_g: 7, protein_g: 0, carb_g: 0, fat_g: 7, calories_kcal: 63 },
  ] },
  { meal_number: 4, items: [
    { food_code: "SWEET_POTATO", category: "CARBS", portion_g: 82, protein_g: 2, carb_g: 17, fat_g: 0, calories_kcal: 74 },
    { food_code: "GREEK_YOGURT", category: "PROTEIN", portion_g: 196, protein_g: 20, carb_g: 7, fat_g: 1, calories_kcal: 116 },
    { food_code: "RAW_ALMONDS", category: "FATS", portion_g: 12, protein_g: 3, carb_g: 3, fat_g: 6, calories_kcal: 78 },
  ] },
];

function dayTotals(meals) {
  let kcal = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  for (const meal of meals) {
    for (const item of meal.items || []) {
      kcal += Number(item.calories_kcal) || 0;
      protein += Number(item.protein_g) || 0;
      carbs += Number(item.carb_g) || 0;
      fat += Number(item.fat_g) || 0;
    }
  }
  return { kcal, protein, carbs, fat };
}

test("B2-2: C04 week 16 — diet-break return must not restore a stale pre-break protein over the fresh regen", () => {
  // The w16 cycle regeneration at 98.9 kg (BMI just under 30) recomputes
  // protein at 218 g; the journey's regen is 2194 / P218 / C198 / F59.
  const regen = buildMasterEngineV2({
    intake: buildIntake(C04, 98.9),
    evaluationContext,
    nutritionFoodCatalog,
  });
  assert.equal(programTargets(regen).protein, 218, "regen at 98.9 kg must carry the fresh 218 g protein");

  // The break started at w15 stored the pre-break macros (2558 / P193).
  const program = JSON.parse(JSON.stringify(regen));
  program.adaptation_state = {
    diet_break: {
      status: "ACTIVE",
      started_week: 15,
      pre_break_calories_kcal: 2558,
      pre_break_macros: { protein_g: 193, carbohydrate_g: 307, fat_g: 62 },
      maintenance_calories_kcal: 3279,
      deficit_weeks_since_break: 0,
    },
  };
  const adapted = buildAdaptedPlan({
    currentMasterProgram: program,
    checkinAnalysis: { analysis_status: "ON_TRACK" },
    options: { currentWeekNumber: 16 },
  });
  // Calories still return to the exact pre-break deficit; protein must
  // stay at the program's current 218 g, never cut to the stale 193 g.
  assert.equal(adapted.adapted_nutrition.target_calories_kcal, 2558, "return keeps the exact pre-break deficit");
  assert.equal(
    adapted.adapted_nutrition.protein_g, 218,
    `diet-break return must not cut protein 218 -> 193 g at the same weight (got ${adapted.adapted_nutrition.protein_g} g)`,
  );
  const merged = mergeAdaptedPlanIntoProgram(program, adapted);
  assert.equal(programTargets(merged).protein, 218, "merged protein must stay 218 g");
  assert.equal(programTargets(merged).kcal, 2558, "merged calories stay at the pre-break deficit");
});

test("B2-2: X08 weeks 6-7 — diabetic top-up must respect the elderly 1.6 cap, and the return must not drop protein", () => {
  // The w6 cycle regeneration at 107.8 kg: 1931 / P130 / C207 / F65,
  // with the H8 elderly cap recorded in the guardrails.
  const regen = buildMasterEngineV2({
    intake: buildIntake(X08, 107.8),
    evaluationContext,
    nutritionFoodCatalog,
  });
  assert.equal(programTargets(regen).protein, 130, "regen at 107.8 kg must carry the capped 130 g protein");
  const guardrails =
    regen.nutrition_program?.targets?.clinical_guardrails || regen.clinical_guardrails || {};
  assert.equal(guardrails.hypoglycemia_guard_active, true, "diabetic guard must be active");
  assert.equal(guardrails.elderly_protein_cap_per_kg, 1.6, "H8 elderly cap must be recorded at 1.6 g/kg");

  // Break week at the observed maintenance (2962 kcal): the diabetic
  // block used to top protein up to 2.2 g/kg (178-179 g). At 72 with
  // unknown kidney function it must stay at the 1.6 cap (130 g). Note
  // the calories: with carbs capped at 45% (333 g) and protein at
  // 130 g, 2962 kcal no longer fits under the 35% fat ceiling — the
  // block's own design cuts the unfittable 73 kcal (2889 kcal) and
  // routes the plan to coach review, instead of breaking the protein
  // cap to reach maintenance. A break 73 kcal under maintenance is the
  // safe direction; an uncapped 179 g protein for a 72-year-old is not.
  const breakAdapted = buildAdaptedPlan({
    currentMasterProgram: JSON.parse(JSON.stringify(regen)),
    checkinAnalysis: { analysis_status: "ON_TRACK", adaptive_tdee: { ready: true, observed_tdee_kcal: 2962 } },
    options: { currentWeekNumber: 6, force_diet_break: true, consecutive_high_compliance_weeks: 6 },
  });
  assert.equal(
    breakAdapted.adapted_nutrition.protein_g, 130,
    `break-week protein must respect the 1.6 elderly cap (130 g), not the uncapped 2.2 rate (got ${breakAdapted.adapted_nutrition.protein_g} g)`,
  );
  assert.equal(breakAdapted.adapted_nutrition.target_calories_kcal, 2889, "break week is fitted to 2889 kcal (2962 does not fit under the diabetic caps)");
  const breakMerged = mergeAdaptedPlanIntoProgram(JSON.parse(JSON.stringify(regen)), breakAdapted);
  assert.equal(programTargets(breakMerged).protein, 130, "merged break-week protein stays 130 g");

  // Return week: the merge stored the ACTIVE break state, so the return
  // restores the pre-break deficit — and protein must not drop from the
  // break week's value at the same weight.
  const returnAdapted = buildAdaptedPlan({
    currentMasterProgram: breakMerged,
    checkinAnalysis: { analysis_status: "ON_TRACK" },
    options: { currentWeekNumber: 7 },
  });
  const returnMerged = mergeAdaptedPlanIntoProgram(breakMerged, returnAdapted);
  assert.equal(
    programTargets(returnMerged).protein, programTargets(breakMerged).protein,
    `return week must not cut protein ${programTargets(breakMerged).protein} -> ${programTargets(returnMerged).protein} g at the same weight`,
  );
});

test("B2-5: L23 week 3 — served food must move with the target, not stay stale", () => {
  // Journey targets: w2 1729 / P165 / C166 / F45, w3 1760 / P165 / C174
  // / F45 (a +31 kcal step, carbs +8 g). Journey food: w2 1757 kcal,
  // w3 1766 kcal — only +9 kcal, FOOD_STALE. After the fix the w3 food
  // is 1776 kcal (carbs land on the 174 g target): +19 kcal, inside
  // the guard. The w2 replay still reproduces the journey exactly.
  const w2 = rebalanceCulinaryMeals(structuredClone(L23_DAY0), {
    finalCalories: 1729, finalProtein: 165, finalCarbs: 166, finalFats: 45,
  });
  const w2Totals = dayTotals(w2);
  assert.equal(w2Totals.kcal, 1757, "replay must reproduce the journey w2 food (1757 kcal)");
  const w3 = rebalanceCulinaryMeals(structuredClone(w2), {
    finalCalories: 1760, finalProtein: 165, finalCarbs: 174, finalFats: 45,
  });
  const w3Totals = dayTotals(w3);
  const dFood = w3Totals.kcal - w2Totals.kcal;
  assert.ok(
    dFood >= 10,
    `food must move >= 10 kcal when the target moves +31 kcal (moved ${dFood} kcal: ${w2Totals.kcal} -> ${w3Totals.kcal})`,
  );
  assert.ok(dFood > 0, "food must move in the same direction as the target (up)");
  assert.ok(w3Totals.kcal <= 1760 + 30, `corrected food (${w3Totals.kcal}) must stay inside the kcal guard (target 1760 + 30)`);
  assert.equal(w3Totals.carbs, 174, "w3 carbs must land on the 174 g target");
});

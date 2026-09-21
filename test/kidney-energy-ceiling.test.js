import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { CLINICAL_GUIDELINES } from "../src/config/clinical-guidelines.js";
import { collectCoachAlerts } from "../frontend/src/utils/coachAlerts.js";

/**
 * KDOQI Clinical Practice Guideline for Nutrition in CKD, 2020 update (guideline 3.1.1): metabolically
 * stable adults with CKD 1-5D, 25-35 kcal/kg body weight a day. A 130 kg kidney patient bulking got
 * 4924 kcal (38 kcal/kg), which also forced 45-56 g of olive oil a meal. The plan now stays at or
 * below 35 kcal per kg of the reference weight, and the coach is told.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"));
const plan = (selected) => buildMasterEngineV2({
  intake: {
    gender: "male", age: "27", height_cm: "200", weight_kg: "130", circumferences: { neck_cm: "44", waist_cm: "100", hips_cm: "110" },
    primary_goal: "lean_bulk", neat_level: "very_active", occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
    medical_conditions: { has_conditions: selected.length > 0, selected: selected.length ? selected : ["none"], diabetes: { type: "type2", uses_insulin: false } },
    injuries_map: { has_injuries: false, selected_areas: ["none"] }, religion: "MUSLIM", strict_allergies: ["none"],
    meal_structure: { meals_count: "4_meals", intermittent_fasting: "none" }, training_environment: "commercial_gym",
    training_logistics: { days_per_week: 4, experience_level: "intermediate" }, recent_training: "ACTIVE",
  },
  evaluationContext: { system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" },
  nutritionFoodCatalog: CATALOG,
  options: {},
});

test("a kidney patient's calories stay within 35 kcal per kg of reference weight, and the coach is told", () => {
  assert.equal(CLINICAL_GUIDELINES.KIDNEY.MAX_KCAL_PER_KG, 35);
  const program = plan(["diabetes", "renal"]);
  const targets = program.nutrition_program.targets;
  const g = targets.clinical_guardrails;
  assert.ok(g.kidney_energy_capped, "precondition: this bulk is above the ceiling");
  assert.ok(targets.target_calories <= Math.round(35 * g.energy_reference_weight_kg) + 1, `${targets.target_calories} kcal`);
  assert.ok(collectCoachAlerts(JSON.parse(JSON.stringify(program))).some((a) => /KDOQI/.test(a)));
});

test("without a kidney condition the same client keeps the bulk", () => {
  const targets = plan(["diabetes"]).nutrition_program.targets;
  assert.ok(!targets.clinical_guardrails.kidney_energy_capped);
  assert.ok(targets.target_calories > 35 * 130);
});

test("a check-in never raises a kidney patient past the same ceiling", async () => {
  const { buildAdaptedPlan } = await import("../src/adaptation-engine/index.js");
  // 100 kg reference weight: the ceiling is 3500 kcal (the general one would be 55 x 100 = 5500).
  const program = {
    engine_version: "test",
    nutrition_program: {
      macro_targets: { calories_kcal: 3450, protein_g: 80, carbohydrate_g: 500, fat_g: 118 },
      targets: { clinical_guardrails: { kidney_condition: true, energy_reference_weight_kg: 100 } },
    },
    training_program: { weeks: [] },
  };
  const adapted = buildAdaptedPlan({ currentMasterProgram: program, checkinAnalysis: { analysis_status: "GAIN_STALL", current_average_weight_kg: 100, suggested_calorie_delta: 125 }, options: { currentWeekNumber: 1 } });
  assert.equal(adapted.adapted_nutrition.target_calories_kcal, 3500);
  assert.equal(adapted.requires_coach_approval, true);
});

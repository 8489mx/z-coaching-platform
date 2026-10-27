import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { calculateMetabolicMacroProfile } from "../src/execution-engines/metabolic-macro-engine.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"));

test("Phase 3 (FIX-02, FIX-06 & UI Enhancements): Methodology policy, diabetic reference ceiling flag, Adherence Score, and Macro Compliance Bar", () => {
  // 1. FIX-02: calculatePrecisionMetabolics exposes explicit methodology_policy metadata
  const calcRes = calculateMetabolicMacroProfile({
    gender: "MALE",
    age: 40,
    weight_kg: 80,
    height_cm: 180,
    body_fat_percent: 20,
    daily_activity: "DESK_SEDENTARY",
    workout_frequency: "DAYS_3_TO_5",
    goal: "FAT_LOSS_STANDARD"
  });
  assert.equal(calcRes.is_valid, true);
  assert.ok(calcRes.methodology_policy, "Expected methodology_policy in calculatePrecisionMetabolics output");
  assert.equal(calcRes.methodology_policy.engine_id, "MANUAL_PRECISION_CALCULATOR_V1");
  assert.equal(calcRes.methodology_policy.bmr_formula, "KATCH_MCARDLE");
  assert.equal(calcRes.methodology_policy.pal_model, "ADDITIVE_NEAT_PLUS_EAT");

  // 2. FIX-06: buildMasterEngineV2 truthfully surfaces diabetic_reference_ceiling_applied when 45% reference bound is triggered
  const diabeticBulkPlan = buildMasterEngineV2({
    intake: {
      gender: "male", age: "27", height_cm: "185", weight_kg: "55",
      circumferences: { neck_cm: "36", waist_cm: "74", hips_cm: "90" },
      primary_goal: "lean_bulk", neat_level: "very_active", occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
      medical_conditions: { has_conditions: true, selected: ["diabetes"], diabetes: { type: "type2", uses_insulin: false } },
      injuries_map: { has_injuries: false, selected_areas: ["none"] }, religion: "MUSLIM", strict_allergies: ["none"],
      meal_structure: { meals_count: "3_meals", intermittent_fasting: "none" }, training_environment: "commercial_gym",
      training_logistics: { days_per_week: 4, experience_level: "intermediate" }, recent_training: "ACTIVE",
    },
    evaluationContext: { system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" },
    nutritionFoodCatalog: CATALOG,
    options: {},
  });
  const guardrails = diabeticBulkPlan.nutrition_program.targets.clinical_guardrails;
  assert.equal(guardrails.diabetic_reference_ceiling_applied, true, "Expected diabetic_reference_ceiling_applied=true when 45% reference bound trims carbs");
  assert.equal(guardrails.diabetic_reference_carb_share, 0.45);
  assert.ok(diabeticBulkPlan.nutrition_program.targets.methodology_policy, "Expected methodology_policy in master engine targets");

  // 3. CoachCommandCenter includes Unified Adherence Score and Quick Check-in Preview
  const commandCenterSrc = fs.readFileSync(path.join(ROOT, "frontend/src/pages/CoachCommandCenter.jsx"), "utf8");
  assert.ok(commandCenterSrc.includes("adherenceScore"), "CoachCommandCenter must compute and render unified adherenceScore");
  assert.ok(commandCenterSrc.includes("checkinPreview"), "CoachCommandCenter must include quick checkinPreview strip");

  // 4. CoachEditorNutritionTab includes Visual Macro Compliance Bar (شريط مطابقة الماكروز البصري)
  const nutritionTabSrc = fs.readFileSync(path.join(ROOT, "frontend/src/features/coach/components/CoachEditorNutritionTab.jsx"), "utf8");
  assert.ok(nutritionTabSrc.includes("شريط مطابقة الماكروز البصري"), "CoachEditorNutritionTab must render Visual Macro Compliance Bar");
});

/* Guard for audit finding S2-1 (Option A1, universal wins): one generated
   program must carry ONE nutrition prescription. The universal targets are
   the plan of record; the pipeline stages' headline numbers are unified
   from them at assembly time, in both the pipeline key shape and the flat
   key shape live consumers read. The pipeline's own estimate stays visible
   only as diagnostics (estimated_maintenance_kcal, calculation_method).
   A WITHHELD stage is never overwritten: withholding is the pipeline's
   deliberate safety posture for medical-review/blocked intakes. The
   sanitized/portion-solver meals stay pipeline-derived under A1 (no live
   consumer reads them) and are deliberately NOT asserted here. */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { buildMasterEngineV2, unifyNutritionStageTargets } from "../src/master-engine-v2/index.js";
import { completeIntake, ASSESSMENT_CONTEXT } from "./fixtures/complete-intake.js";
import { mergeAdaptedPlanIntoProgram } from "../src/api/utils/planMergeEngine.js";

const evaluationContext = Object.freeze({
  system_time: new Date(ASSESSMENT_CONTEXT.assessmentDate).toISOString(),
  assessmentDate: ASSESSMENT_CONTEXT.assessmentDate,
});
const nutritionFoodCatalog = JSON.parse(
  fs.readFileSync(new URL("../data/catalogs/core-global-food-batch-v1.json", import.meta.url), "utf8")
);

function buildFixtureProgram() {
  return buildMasterEngineV2({
    intake: completeIntake(),
    evaluationContext,
    nutritionFoodCatalog,
    options: {},
  });
}

test("stage headline numbers agree with the universal targets on a generated program", () => {
  const { nutrition_program: np } = buildFixtureProgram();
  const calories = np.macro_targets.calories_kcal;
  assert.ok(calories > 0, "program must have positive calories");

  assert.equal(np.stages.energy_target.target_calories, calories);
  assert.equal(np.stages.energy_target.target_calories_kcal, calories);
  assert.equal(np.targets.target_calories, calories);
  assert.equal(np.quantized_plan.daily_totals.calories_kcal, calories);

  assert.equal(np.stages.macro_targets.protein.target_g, np.macro_targets.protein_g);
  assert.equal(np.stages.macro_targets.fat.target_g, np.macro_targets.fat_g);
  assert.equal(np.stages.macro_targets.carbohydrate.target_g, np.macro_targets.carbohydrate_g);

  assert.equal(np.stages.macro_targets.protein_g, np.macro_targets.protein_g);
  assert.equal(np.stages.macro_targets.carbohydrate_g, np.macro_targets.carbohydrate_g);
  assert.equal(np.stages.macro_targets.fat_g, np.macro_targets.fat_g);

  // The unified stage stays arithmetically self-consistent.
  const macroTotal = np.stages.macro_targets.macro_calories_total;
  assert.ok(Math.abs(macroTotal - calories) <= 2, `macro calories ${macroTotal} must close to ${calories}`);
});

test("pipeline estimate diagnostics are preserved, not passed off as the plan", () => {
  const { nutrition_program: np } = buildFixtureProgram();
  assert.equal(np.stages.energy_target.calculation_method, "NASEM_DRI_2023_EER_ADULT");
  assert.ok(Number(np.stages.energy_target.estimated_maintenance_kcal) > 0);
  assert.equal(np.stages.energy_target.target_source, "UNIVERSAL_TARGETS");
  assert.equal(np.stages.macro_targets.target_source, "UNIVERSAL_TARGETS");
});

test("unifyNutritionStageTargets never overwrites a WITHHELD stage", () => {
  const stages = {
    energy_target: { status: "WITHHELD", target_calories: null, estimated_maintenance_kcal: null },
    macro_targets: { status: "WITHHELD", protein: { target_g: null }, fat: { target_g: null }, carbohydrate: { target_g: null } },
    portion_solver: { status: "WITHHELD" },
  };
  const unified = unifyNutritionStageTargets(stages, {
    target_calories: 2000, protein_g: 150, carb_g: 200, fat_g: 60, fiber_g: 30,
  });
  assert.equal(unified.energy_target.target_calories, null);
  assert.equal(unified.macro_targets.protein.target_g, null);
  assert.deepEqual(unified.portion_solver, { status: "WITHHELD" });
  // Input is not mutated.
  assert.equal(stages.energy_target.target_calories, null);
});

test("unifyNutritionStageTargets preserves stage metadata and other stages", () => {
  const stages = {
    energy_target: { status: "READY", calculation_method: "NASEM_DRI_2023_EER_ADULT", estimated_maintenance_kcal: 3080, target_calories: 3080, reasons: ["R1"] },
    macro_targets: { status: "READY", protein: { target_g: 130, factor_g_per_kg: 1.6 }, fat: { target_g: 85 }, carbohydrate: { target_g: 449 } },
    portion_solver: { daily_target: 3081 },
  };
  const unified = unifyNutritionStageTargets(stages, {
    target_calories: 2637, protein_g: 148, carb_g: 367, fat_g: 64, fiber_g: 30,
  });
  assert.equal(unified.energy_target.target_calories, 2637);
  assert.equal(unified.energy_target.status, "READY");
  assert.deepEqual(unified.energy_target.reasons, ["R1"]);
  assert.equal(unified.energy_target.estimated_maintenance_kcal, 3080);
  assert.equal(unified.macro_targets.protein.target_g, 148);
  assert.deepEqual(unified.portion_solver, { daily_target: 3081 });
});

test("an approved adaptation keeps stage numbers in agreement with the merged targets", () => {
  const program = {
    nutrition_program: {
      targets: { target_calories: 2637, protein_g: 148, carb_g: 367, fat_g: 64 },
      macro_targets: { calories_kcal: 2637, protein_g: 148, carbohydrate_g: 367, fat_g: 64 },
      stages: {
        energy_target: { status: "READY", target_calories: 2637, target_calories_kcal: 2637 },
        macro_targets: {
          status: "READY",
          protein: { target_g: 148 }, fat: { target_g: 64 }, carbohydrate: { target_g: 367 },
        },
      },
    },
  };
  const merged = mergeAdaptedPlanIntoProgram(program, {
    adapted_nutrition: { target_calories_kcal: 2400, protein_g: 140, carbohydrate_g: 330, fat_g: 60 },
  });
  assert.equal(merged.nutrition_program.stages.energy_target.target_calories, 2400);
  assert.equal(merged.nutrition_program.stages.energy_target.target_calories_kcal, 2400);
  assert.equal(merged.nutrition_program.stages.macro_targets.protein.target_g, 140);
  assert.equal(merged.nutrition_program.stages.macro_targets.carbohydrate.target_g, 330);
  assert.equal(merged.nutrition_program.stages.macro_targets.fat.target_g, 60);
  assert.equal(merged.nutrition_program.stages.energy_target.status, "READY");
});

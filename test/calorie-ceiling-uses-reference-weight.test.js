import test from "node:test";
import assert from "node:assert/strict";

import { buildAdaptedPlan } from "../src/adaptation-engine/index.js";

/**
 * The 55 kcal/kg ceiling on check-in increases used total body weight: a 140 kg client with high
 * body fat could climb to 7700 kcal before it stopped anything. It now uses the plan's reference
 * weight (the lean-mass or adjusted weight the protein already uses) when the plan has one; a lean
 * client's plan uses total weight, so nothing changes for them.
 */
const program = (kcal, targets = {}) => ({
  engine_version: "test",
  nutrition_program: {
    macro_targets: { calories_kcal: kcal, protein_g: 180, carbohydrate_g: Math.round((kcal - 180 * 4 - 100 * 9) / 4), fat_g: 100 },
    targets,
  },
  training_program: { weeks: [] },
});
const stall = (weight) => ({ analysis_status: "GAIN_STALL", current_average_weight_kg: weight, suggested_calorie_delta: 125 });
const run = (kcal, weight, targets) => buildAdaptedPlan({ currentMasterProgram: program(kcal, targets), checkinAnalysis: stall(weight), options: { currentWeekNumber: 1 } });

test("a 140 kg client with a 90 kg reference weight stops at 55 x 90 kg", () => {
  const adapted = run(4900, 140, { protein_reference_weight_kg: 90, protein_reference_basis: "ADJUSTED_BODY_WEIGHT" });
  assert.equal(adapted.adapted_nutrition.target_calories_kcal, 4950);
  assert.ok(adapted.adaptation_reasons.some((r) => r.code === "CALORIE_CEILING_REACHED"));
});

test("a lean client's plan (total body weight basis) keeps the total-weight ceiling", () => {
  const adapted = run(4900, 140, { protein_reference_weight_kg: 140, protein_reference_basis: "TOTAL_BODY_WEIGHT" });
  assert.equal(adapted.adapted_nutrition.target_calories_kcal, 5025);
});

test("an older plan with no reference weight keeps the total-weight ceiling", () => {
  assert.equal(run(4900, 140, {}).adapted_nutrition.target_calories_kcal, 5025);
});

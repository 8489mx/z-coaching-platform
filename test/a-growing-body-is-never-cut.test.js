import test from "node:test";
import assert from "node:assert/strict";

import { buildAdaptedPlan } from "../src/adaptation-engine/index.js";

/**
 * A 14 year old's first plan starts at maintenance (no deficit on a growing body), but the check-in
 * engine knew nothing about his age: every week his weight did not drop it cut another 150 kcal, and
 * eight months of check-ins took a growing boy from 2898 kcal down to 1623 (found by the long-journey
 * audit, scripts/simulate-long-journeys.mjs JRN_07). A young trainee's plan never goes under the
 * maintenance his plan was built on.
 */
const program = (kcal, targets = {}) => ({
  engine_version: "test",
  nutrition_program: {
    macro_targets: { calories_kcal: kcal, protein_g: 147, carbohydrate_g: Math.round((kcal - 147 * 4 - 71 * 9) / 4), fat_g: 71 },
    targets: { tdee: 2898, ...targets },
  },
  training_program: { weeks: [] },
});
const stall = { analysis_status: "PLATEAU_DETECTED", current_average_weight_kg: 72.5, suggested_calorie_delta: -150 };
const run = (kcal, targets) => buildAdaptedPlan({ currentMasterProgram: program(kcal, targets), checkinAnalysis: stall, options: { currentWeekNumber: 3 } });

test("a young trainee's calories never go under the plan's maintenance", () => {
  const young = { clinical_guardrails: { is_young_trainee: true } };
  const adapted = run(2898, young);
  assert.equal(adapted.adapted_nutrition.target_calories_kcal, 2898);
  assert.ok(adapted.adaptation_reasons.some((r) => r.code === "YOUNG_TRAINEE_NO_DEFICIT"), JSON.stringify(adapted.adaptation_reasons.map((r) => r.code)));
  // Even after months of check-ins, a plan that drifted low is brought back to maintenance.
  assert.equal(run(1623, young).adapted_nutrition.target_calories_kcal, 2898);
});

test("an adult on the same numbers is still adjusted as before", () => {
  const adult = run(2898, { clinical_guardrails: { is_young_trainee: false } });
  assert.equal(adult.adapted_nutrition.target_calories_kcal, 2748);
  assert.ok(!adult.adaptation_reasons.some((r) => r.code === "YOUNG_TRAINEE_NO_DEFICIT"));
});

test("a young trainee building muscle keeps his surplus", () => {
  const gaining = buildAdaptedPlan({
    currentMasterProgram: program(3100, { clinical_guardrails: { is_young_trainee: true } }),
    checkinAnalysis: { analysis_status: "GAIN_STALL", current_average_weight_kg: 72.5, suggested_calorie_delta: 125 },
    options: { currentWeekNumber: 3 },
  });
  assert.equal(gaining.adapted_nutrition.target_calories_kcal, 3225);
});

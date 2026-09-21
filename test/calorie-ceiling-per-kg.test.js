import test from "node:test";
import assert from "node:assert/strict";

import { buildAdaptedPlan } from "../src/adaptation-engine/index.js";

/**
 * Every gain stall added 125 kcal with no end: a 66 kg client reached 4100 kcal and 745 g of
 * carbohydrate after a year. Increases stop at 55 kcal per kg and hand the case to the coach.
 */
const program = (kcal) => ({
  engine_version: "test",
  nutrition_program: { macro_targets: { calories_kcal: kcal, protein_g: 130, carbohydrate_g: Math.round((kcal - 130 * 4 - 80 * 9) / 4), fat_g: 80 } },
  training_program: { weeks: [] },
});
const stall = (weight) => ({ analysis_status: "GAIN_STALL", current_average_weight_kg: weight, suggested_calorie_delta: 125 });

test("a gain stall at the ceiling does not add calories and asks the coach", () => {
  const adapted = buildAdaptedPlan({ currentMasterProgram: program(3600), checkinAnalysis: stall(66), options: { currentWeekNumber: 1 } });
  assert.equal(adapted.adapted_nutrition.target_calories_kcal, 3630, "55 x 66 kg");
  assert.equal(adapted.requires_coach_approval, true);
  assert.ok(adapted.adaptation_reasons.some((r) => r.code === "CALORIE_CEILING_REACHED"));
});

test("below the ceiling the stall rule adds its calories as before", () => {
  const adapted = buildAdaptedPlan({ currentMasterProgram: program(3000), checkinAnalysis: stall(66), options: { currentWeekNumber: 1 } });
  assert.equal(adapted.adapted_nutrition.target_calories_kcal, 3125);
  assert.ok(!adapted.adaptation_reasons.some((r) => r.code === "CALORIE_CEILING_REACHED"));
});

test("a plan already above the ceiling is never cut by it", () => {
  const adapted = buildAdaptedPlan({ currentMasterProgram: program(3900), checkinAnalysis: { analysis_status: "ON_TRACK", current_average_weight_kg: 66 }, options: { currentWeekNumber: 1 } });
  assert.equal(adapted.adapted_nutrition.target_calories_kcal, 3900);
});

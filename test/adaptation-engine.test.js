import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { evaluateCheckin } from "../src/checkin-engine/index.js";
import {
  buildAdaptedPlan,
  ADAPTATION_ENGINE_VERSION,
  AdaptationAction,
  AdaptationReasonCode,
} from "../src/adaptation-engine/index.js";
import { completeIntake, ASSESSMENT_CONTEXT } from "./fixtures/complete-intake.js";

const VALID_MINIMAL_PROFILE = completeIntake();

const evaluationContext = Object.freeze({
  system_time: new Date(ASSESSMENT_CONTEXT.assessmentDate).toISOString(),
  assessmentDate: ASSESSMENT_CONTEXT.assessmentDate,
});

const nutritionFoodCatalog = JSON.parse(
  fs.readFileSync(new URL("../data/catalogs/core-global-food-batch-v1.json", import.meta.url), "utf8"),
);

test("Adaptation Engine Suite", async (t) => {
  const baseProgram = buildMasterEngineV2({
    intake: VALID_MINIMAL_PROFILE,
    evaluationContext,
    nutritionFoodCatalog,
  });

  await t.test("version is stable", () => {
    assert.equal(ADAPTATION_ENGINE_VERSION, "adaptation-engine-v1");
  });

  await t.test("adapts plan for PLATEAU_DETECTED by reducing calories and increasing steps", () => {
    const plateauCheckin = evaluateCheckin({
      daily_weights_kg: [85.0, 85.0, 85.1, 85.0, 85.0, 85.0, 85.0],
      previous_week_average_weight_kg: 85.0,
      nutrition_adherence_percent: 95,
      workouts_completed: 4,
      workouts_scheduled: 4,
      biofeedback: { hunger_level: 2, energy_in_gym: 4, sleep_quality: 4, stress_level: 2 },
    });

    const adapted = buildAdaptedPlan({
      currentMasterProgram: baseProgram,
      checkinAnalysis: plateauCheckin,
      options: { currentWeekNumber: 2 },
    });

    assert.equal(adapted.adaptation_action, AdaptationAction.REDUCE_CALORIES_FOR_PLATEAU);
    assert.equal(adapted.adapted_week_number, 3);
    const baseKcal = baseProgram.nutrition_program?.macro_targets?.calories_kcal || baseProgram.nutrition_program.stages.energy_target.target_calories;
    assert.equal(adapted.adapted_nutrition.target_calories_kcal, Math.round(baseKcal - 125));
    assert.equal(adapted.adapted_cardio.daily_step_target, (baseProgram.cardio_program.prescription?.daily_step_target || 8000) + 500);
    assert.ok(adapted.adaptation_reasons.some((r) => r.code === AdaptationReasonCode.PLATEAU_DEFICIT_APPLIED));
  });

  await t.test("adapts plan for HIGH_FATIGUE_WARNING by prescribing a Refeed Day", () => {
    const fatigueCheckin = evaluateCheckin({
      daily_weights_kg: [84.0, 83.8, 83.7, 83.6, 83.5, 83.5, 83.4],
      previous_week_average_weight_kg: 84.5,
      nutrition_adherence_percent: 90,
      biofeedback: { hunger_level: 5, energy_in_gym: 1, sleep_quality: 2, stress_level: 4 },
    });

    const adapted = buildAdaptedPlan({
      currentMasterProgram: baseProgram,
      checkinAnalysis: fatigueCheckin,
      options: { currentWeekNumber: 3 },
    });

    assert.equal(adapted.adaptation_action, AdaptationAction.SCHEDULE_REFEED_DAY);
    assert.ok(adapted.adapted_nutrition.refeed_config);
    assert.equal(adapted.adapted_nutrition.refeed_config.refeed_day, "SATURDAY");
    assert.ok(adapted.adaptation_reasons.some((r) => r.code === AdaptationReasonCode.REFEED_DAY_PRESCRIBED));
  });

  await t.test("adapts plan for RAPID_LOSS_WARNING by adding 150 kcal", () => {
    const rapidLossCheckin = evaluateCheckin({
      daily_weights_kg: [82.5, 82.3, 82.1, 82.0, 82.0, 81.9, 81.8], // drop > 2.5kg
      previous_week_average_weight_kg: 84.5,
      nutrition_adherence_percent: 90,
      biofeedback: { hunger_level: 3, energy_in_gym: 3, sleep_quality: 3, stress_level: 2 },
    });

    const adapted = buildAdaptedPlan({
      currentMasterProgram: baseProgram,
      checkinAnalysis: rapidLossCheckin,
      options: { currentWeekNumber: 1 },
    });

    assert.equal(adapted.adaptation_action, AdaptationAction.INCREASE_CALORIES_RAPID_LOSS);
    const baseKcal = baseProgram.nutrition_program?.macro_targets?.calories_kcal || baseProgram.nutrition_program.stages.energy_target.target_calories;
    assert.equal(adapted.adapted_nutrition.target_calories_kcal, Math.round(baseKcal + 150));
  });
});

// Once the measured burn was known it replaced the rapid-loss rule, and it aims at the goal's
// deficit: a nursing mother losing 1.1 kg a week had her calories cut, then held, for four months.
test("rapid loss adds calories even when the measured burn is known", () => {
  const baseProgram = buildMasterEngineV2({ intake: VALID_MINIMAL_PROFILE, evaluationContext, nutritionFoodCatalog });
  const rapidLoss = evaluateCheckin({
    daily_weights_kg: [82.5, 82.3, 82.1, 82.0, 82.0, 81.9, 81.8],
    previous_week_average_weight_kg: 84.5,
    nutrition_adherence_percent: 95,
    biofeedback: { hunger_level: 3, energy_in_gym: 3, sleep_quality: 3, stress_level: 2 },
  });
  const baseKcal = baseProgram.nutrition_program?.macro_targets?.calories_kcal || baseProgram.nutrition_program.stages.energy_target.target_calories;
  const adapted = buildAdaptedPlan({
    currentMasterProgram: baseProgram,
    // The measured burn would have taken 60 kcal away.
    checkinAnalysis: { ...rapidLoss, adaptive_tdee: { ready: true, recommended_target_kcal: Math.round(baseKcal - 60), observed_tdee_kcal: 2400, weeks_used: 3, weight_trend_kg_per_week: -1.1, reason_ar: "x" } },
    options: { currentWeekNumber: 1 },
  });
  assert.equal(adapted.adaptation_action, AdaptationAction.INCREASE_CALORIES_RAPID_LOSS);
  assert.equal(adapted.adapted_nutrition.target_calories_kcal, Math.round(baseKcal + 150));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { buildMasterEngineV2 } from '../src/master-engine-v2/index.js';
import { completeIntake, ASSESSMENT_CONTEXT } from './fixtures/complete-intake.js';
import { buildAdaptedPlan } from '../src/adaptation-engine/build-adapted-plan.js';
import { mergeAdaptedPlanIntoProgram } from '../src/api/utils/planMergeEngine.js';
import { evaluateWeeklyProgress } from '../src/execution-engines/weekly-audit-engine.js';
import { AdaptationAction, AdaptationReasonCode } from '../src/adaptation-engine/domain/enums.js';

const evaluationContext = Object.freeze({
  system_time: new Date(ASSESSMENT_CONTEXT.assessmentDate).toISOString(),
  assessmentDate: ASSESSMENT_CONTEXT.assessmentDate,
});

const nutritionFoodCatalog = JSON.parse(
  fs.readFileSync(new URL('../data/catalogs/core-global-food-batch-v1.json', import.meta.url), 'utf8')
);

function buildTestProgram() {
  return buildMasterEngineV2({
    intake: completeIntake(),
    evaluationContext,
    nutritionFoodCatalog,
  });
}

test('Milestone 1: Clinical Plateau Breaker & Auto Diet-Break Engine Suite', async (suite) => {

  await suite.test('1. Diet Break Triggered after 6+ consecutive weeks of deficit compliance', () => {
    const baseProgram = buildTestProgram();
    const baseCalories = baseProgram.nutrition_program.macro_targets.calories_kcal;
    const baseCarbs = baseProgram.nutrition_program.macro_targets.carbohydrate_g;

    const adapted = buildAdaptedPlan({
      currentMasterProgram: baseProgram,
      checkinAnalysis: {
        status: 'ON_TRACK',
        analysis_status: 'ON_TRACK',
        consecutive_deficit_weeks: 6,
      },
      options: {
        currentWeekNumber: 6,
        consecutive_high_compliance_weeks: 6,
      },
    });

    assert.equal(adapted.adaptation_action, AdaptationAction.SCHEDULE_DIET_BREAK);
    assert.equal(adapted.is_diet_break_recommended, true);
    assert.equal(adapted.adapted_nutrition.target_calories_kcal, Math.round(baseCalories + 350));
    assert.equal(adapted.adapted_nutrition.carbohydrate_g, 455);

    const reason = adapted.adaptation_reasons.find(
      r => r.code === AdaptationReasonCode.DIET_BREAK_TRIGGERED_AFTER_COMPLIANCE
    );
    assert.ok(reason, 'Reason code DIET_BREAK_TRIGGERED_AFTER_COMPLIANCE must be logged');
  });

  await suite.test('2. True Plateau with adequate calorie reserve applies moderate -125 kcal deficit and steps', () => {
    const baseProgram = buildTestProgram();
    const baseCalories = baseProgram.nutrition_program.macro_targets.calories_kcal;

    const adapted = buildAdaptedPlan({
      currentMasterProgram: baseProgram,
      checkinAnalysis: {
        status: 'PLATEAU_DETECTED',
        analysis_status: 'PLATEAU_DETECTED',
        suggested_calorie_delta: -125,
      },
      options: {
        currentWeekNumber: 3,
        consecutive_high_compliance_weeks: 2,
      },
    });

    assert.equal(adapted.adaptation_action, AdaptationAction.REDUCE_CALORIES_FOR_PLATEAU);
    assert.equal(adapted.adapted_nutrition.target_calories_kcal, baseCalories - 125);
    assert.equal(adapted.adapted_cardio.daily_step_target, (baseProgram.cardio_program?.daily_step_target || 8000) + 500);

    const reason = adapted.adaptation_reasons.find(
      r => r.code === AdaptationReasonCode.PLATEAU_DEFICIT_APPLIED
    );
    assert.ok(reason, 'PLATEAU_DEFICIT_APPLIED must be logged');
  });

  await suite.test('3. Calorie Floor Protection: Refeed scheduled and steps increased instead of starving beneath floor', () => {
    const baseProgram = buildTestProgram();
    // Simulate low calorie base near male floor (1500)
    baseProgram.nutrition_program.macro_targets.calories_kcal = 1520;
    baseProgram.nutrition_program.macro_targets.carbohydrate_g = 120;
    baseProgram.nutrition_program.targets.calories_kcal = 1520;

    const adapted = buildAdaptedPlan({
      currentMasterProgram: baseProgram,
      checkinAnalysis: {
        status: 'PLATEAU_DETECTED',
        analysis_status: 'PLATEAU_DETECTED',
        is_female: false,
        refeed_approved: true,
        increase_steps_approved: true,
      },
      options: {
        currentWeekNumber: 4,
        isFemale: false,
      },
    });

    // 1520 - 125 = 1395 which is < 1500 floor -> Must prevent deficit cut and schedule Refeed!
    assert.equal(adapted.adaptation_action, AdaptationAction.SCHEDULE_REFEED_DAY);
    assert.ok(adapted.adapted_nutrition.refeed_config, 'Refeed config must be generated');
    assert.equal(adapted.adapted_nutrition.refeed_config.refeed_calories_kcal, 1520 + 350);

    const floorReason = adapted.adaptation_reasons.find(
      r => r.code === AdaptationReasonCode.DIET_BREAK_PLATEAU_BREAKER_APPLIED
    );
    assert.ok(floorReason, 'DIET_BREAK_PLATEAU_BREAKER_APPLIED must be logged');
  });

  await suite.test('4. evaluateWeeklyProgress detects plateau after 6 weeks and outputs SCHEDULE_DIET_BREAK', () => {
    const result = evaluateWeeklyProgress({
      currentWeightKg: 85,
      previousWeightKg: 85,
      currentWaistCm: 90,
      previousWaistCm: 90,
      adherenceRatePct: 95,
      currentCalories: 2000,
      weeksOnCurrentCalories: 2,
      consecutiveDeficitWeeks: 6,
      goalType: 'FAT_LOSS',
    });

    assert.equal(result.decision, 'SCHEDULE_DIET_BREAK');
    assert.equal(result.is_diet_break, true);
    assert.equal(result.calorie_adjustment, 350);
    assert.equal(result.new_calories, 2350);
  });

  await suite.test('5. planMergeEngine stamps is_diet_break and note on merged program data', () => {
    const baseProgram = buildTestProgram();

    const adapted = buildAdaptedPlan({
      currentMasterProgram: baseProgram,
      checkinAnalysis: {
        status: 'ON_TRACK',
        analysis_status: 'ON_TRACK',
        is_diet_break: true,
      },
      options: {
        currentWeekNumber: 6,
        consecutive_high_compliance_weeks: 6,
      },
    });

    const merged = mergeAdaptedPlanIntoProgram(baseProgram, adapted);

    assert.equal(merged.nutrition_program.is_diet_break, true);
    assert.ok(merged.nutrition_program.diet_break_note);
    assert.equal(merged.nutrition.is_diet_break, true);
  });

});

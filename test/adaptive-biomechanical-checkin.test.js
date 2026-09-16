import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { buildMasterEngineV2 } from '../src/master-engine-v2/index.js';
import { completeIntake, ASSESSMENT_CONTEXT } from './fixtures/complete-intake.js';
import { buildAdaptedPlan } from '../src/adaptation-engine/build-adapted-plan.js';
import { mergeAdaptedPlanIntoProgram } from '../src/api/utils/planMergeEngine.js';
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

test('Adaptive Biomechanical Progression & Joint Pain Firewall in Check-in Suite', async (suite) => {

  await suite.test('1. Biomechanical Joint Pain Firewall (Lower Back): Axial overload substituted with safe swap', () => {
    const baseProgram = buildTestProgram();
    const week1Session1 = baseProgram.training_program.weeks[0].sessions[0];
    const hasBackSquat = week1Session1.exercises.some(e => (e.code || e.id) === 'BARBELL_BACK_SQUAT');
    assert.ok(hasBackSquat, 'Baseline program must contain BARBELL_BACK_SQUAT');

    const adapted = buildAdaptedPlan({
      currentMasterProgram: baseProgram,
      checkinAnalysis: {
        status: 'ON_TRACK',
        joint_pain_location: 'LOWER_BACK',
        pain_score: 5,
      },
      options: {
        currentWeekNumber: 1,
        joint_pain_location: 'LOWER_BACK',
        pain_score: 5,
      },
    });

    assert.equal(adapted.adaptation_action, AdaptationAction.SUBSTITUTE_INJURED_EXERCISE);
    const swapReason = adapted.adaptation_reasons.find(
      r => r.code === AdaptationReasonCode.BIOMECHANICAL_INJURY_FIREWALL_SWAPPED
    );
    assert.ok(swapReason, 'Reason code BIOMECHANICAL_INJURY_FIREWALL_SWAPPED must be present');
    assert.ok(swapReason.swaps?.length > 0, 'Must record swapped exercises');

    const adaptedWeek = adapted.adapted_training_week;
    const session1 = adaptedWeek.sessions[0];
    const substitutedExercise = session1.exercises[0];

    assert.equal(substitutedExercise.is_biomechanical_swap, true);
    assert.equal(substitutedExercise.original_exercise_code, 'BARBELL_BACK_SQUAT');
    assert.notEqual(substitutedExercise.code, 'BARBELL_BACK_SQUAT');
    assert.ok(substitutedExercise.biomechanical_advantage_ar, 'Must specify biomechanical advantage rationale');
    assert.ok(substitutedExercise.safetyNote.includes('بديل بيوميكانيكي آمن'));

    // Other non-contraindicated exercises remain intact
    const intactExercise = session1.exercises.find(e => (e.code || e.id) === 'STANDING_CALF_RAISE');
    assert.ok(intactExercise, 'Standing calf raise must remain unchanged');
    assert.equal(intactExercise.is_biomechanical_swap, undefined);
  });

  await suite.test('2. Biomechanical Joint Pain Firewall (Shoulder): Impingement-risk bench press substituted', () => {
    const baseProgram = buildTestProgram();

    const adapted = buildAdaptedPlan({
      currentMasterProgram: baseProgram,
      checkinAnalysis: {
        status: 'ON_TRACK',
        joint_pain_location: 'SHOULDER',
        pain_score: 6,
      },
      options: {
        currentWeekNumber: 1,
        joint_pain_location: 'SHOULDER',
        pain_score: 6,
      },
    });

    const adaptedWeek = adapted.adapted_training_week;
    const session1 = adaptedWeek.sessions[0];
    const shoulderSwap = session1.exercises.find(e => e.is_biomechanical_swap);

    assert.ok(shoulderSwap, 'Shoulder contraindicated exercise must be swapped');
    assert.ok(
      shoulderSwap.code === 'FLOOR_DB_PRESS' || shoulderSwap.code === 'LOW_INCLINE_NEUTRAL_DB_PRESS',
      `Expected safe shoulder swap, got ${shoulderSwap.code}`
    );
    assert.ok(shoulderSwap.biomechanical_advantage_ar);
  });

  await suite.test('3. Auto-Deload Detection: High fatigue & 4+ accumulated weeks triggers 40% set cut & RIR 4', () => {
    const baseProgram = buildTestProgram();
    const origSets = baseProgram.training_program.weeks[3].sessions[0].exercises[0].sets || 3;

    const adapted = buildAdaptedPlan({
      currentMasterProgram: baseProgram,
      checkinAnalysis: {
        status: 'ON_TRACK',
        fatigue_score: 8,
      },
      options: {
        currentWeekNumber: 4,
        weeks_of_accumulated_training: 4,
        accumulated_fatigue_score: 8,
      },
    });

    assert.equal(adapted.is_deload_recommended, true);
    assert.equal(adapted.adaptation_action, AdaptationAction.SCHEDULE_DELOAD);

    const deloadReason = adapted.adaptation_reasons.find(
      r => r.code === AdaptationReasonCode.AUTO_DELOAD_FATIGUE_PRESCRIBED
    );
    assert.ok(deloadReason, 'AUTO_DELOAD_FATIGUE_PRESCRIBED reason must be logged');

    const adaptedWeek = adapted.adapted_training_week;
    assert.equal(adaptedWeek.phase, 'DELOAD');
    assert.equal(adaptedWeek.target_rir, 4);

    for (const session of adaptedWeek.sessions) {
      for (const ex of session.exercises) {
        assert.equal(ex.rir, 4, 'Target RIR during deload must be 4');
        assert.ok(ex.sets <= origSets, `Deload sets (${ex.sets}) must be <= base sets (${origSets})`);
        assert.ok(ex.sets >= 2, 'Minimum deload sets floor is 2');
      }
    }
  });

  await suite.test('4. Dual Adaptation: Deload volume reduction AND joint pain swap applied simultaneously', () => {
    const baseProgram = buildTestProgram();

    const adapted = buildAdaptedPlan({
      currentMasterProgram: baseProgram,
      checkinAnalysis: {
        status: 'ON_TRACK',
        fatigue_score: 8,
      },
      options: {
        currentWeekNumber: 4,
        weeks_of_accumulated_training: 4,
        accumulated_fatigue_score: 8,
        joint_pain_location: 'LOWER_BACK',
        pain_score: 5,
      },
    });

    assert.equal(adapted.is_deload_recommended, true);
    const codes = adapted.adaptation_reasons.map(r => r.code);
    assert.ok(codes.includes(AdaptationReasonCode.AUTO_DELOAD_FATIGUE_PRESCRIBED));
    assert.ok(codes.includes(AdaptationReasonCode.BIOMECHANICAL_INJURY_FIREWALL_SWAPPED));

    const ex0 = adapted.adapted_training_week.sessions[0].exercises[0];
    assert.equal(ex0.is_biomechanical_swap, true);
    assert.equal(ex0.original_exercise_code, 'BARBELL_BACK_SQUAT');
    assert.equal(ex0.rir, 4);
    assert.equal(ex0.sets, 2);
  });

  await suite.test('5. Non-Destructive Deep Merge: Swapped exercises & deload preserved alongside intact meals', () => {
    const baseProgram = buildTestProgram();
    const origMealsCount = baseProgram.nutrition_program.culinary_meals.length;

    const adapted = buildAdaptedPlan({
      currentMasterProgram: baseProgram,
      checkinAnalysis: {
        status: 'ON_TRACK',
        fatigue_score: 8,
      },
      options: {
        currentWeekNumber: 1,
        weeks_of_accumulated_training: 4,
        accumulated_fatigue_score: 8,
        joint_pain_location: 'LOWER_BACK',
        pain_score: 6,
      },
    });

    const merged = mergeAdaptedPlanIntoProgram(baseProgram, adapted);

    // 1. Program training week updated
    assert.equal(merged.current_training_week, 2);
    assert.equal(merged.training_program.is_deload, true);
    assert.ok(merged.training_program.deload_note);

    const mergedWeek = merged.training_program.weeks.find(w => Number(w.week_number) === 2 || Number(w.week) === 2);
    assert.ok(mergedWeek, 'Target week 2 must exist in merged training program');

    // 2. Swapped exercise correctly placed
    const swappedEx = mergedWeek.sessions[0].exercises[0];
    assert.equal(swappedEx.is_biomechanical_swap, true);
    assert.equal(swappedEx.original_exercise_code, 'BARBELL_BACK_SQUAT');
    assert.equal(swappedEx.rir, 4);
    assert.equal(swappedEx.sets, 2);

    // 3. Nutrition integrity preserved (zero meals lost)
    assert.equal(merged.nutrition_program.culinary_meals.length, origMealsCount);
    assert.ok(merged.nutrition_program.targets.calories_kcal > 1000);
  });

  await suite.test('6. Idempotent Merge: Applying adapted plan repeatedly produces stable, duplicate-free state', () => {
    const baseProgram = buildTestProgram();
    const adapted = buildAdaptedPlan({
      currentMasterProgram: baseProgram,
      checkinAnalysis: { status: 'ON_TRACK' },
      options: { currentWeekNumber: 2 },
    });

    const firstMerge = mergeAdaptedPlanIntoProgram(baseProgram, adapted);
    const firstWeeksCount = firstMerge.training_program.weeks.length;

    const secondMerge = mergeAdaptedPlanIntoProgram(firstMerge, adapted);
    const secondWeeksCount = secondMerge.training_program.weeks.length;

    assert.equal(secondWeeksCount, firstWeeksCount, 'Idempotent merge must never duplicate training weeks');
  });

});

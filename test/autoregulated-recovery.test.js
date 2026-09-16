import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  calculateTrainingReadiness,
  autoregulateWorkoutSession,
  rescheduleMissedWorkout,
  evaluateCumulativeFatigue,
  RESCHEDULING_STRATEGIES,
  READINESS_TIERS
} from '../src/execution-engines/autoregulated-recovery-engine.js';
import { buildAdaptedPlan } from '../src/adaptation-engine/build-adapted-plan.js';
import { buildMasterEngineV2 } from '../src/master-engine-v2/index.js';
import { completeIntake, ASSESSMENT_CONTEXT } from './fixtures/complete-intake.js';

const evaluationContext = Object.freeze({
  system_time: new Date(ASSESSMENT_CONTEXT.assessmentDate).toISOString(),
  assessmentDate: ASSESSMENT_CONTEXT.assessmentDate,
});

const nutritionFoodCatalog = JSON.parse(
  fs.readFileSync(new URL('../data/catalogs/core-global-food-batch-v1.json', import.meta.url), 'utf8')
);

test('Milestone 7: Autoregulated Recovery & Dynamic Rescheduling Engine Suite', async (suite) => {

  await suite.test('1. Training Readiness Calculator: Stratifies biofeedback into clinical tiers', () => {
    // Optimal readiness
    const optimal = calculateTrainingReadiness({
      soreness: 2,
      sleep_quality: 'GOOD',
      sleep_hours: 8,
      stress_level: 2,
      energy_level: 9
    });
    assert.ok(optimal.readiness_score >= 75);
    assert.equal(optimal.tier, READINESS_TIERS.OPTIMAL);
    assert.ok(optimal.clinical_action_ar.includes('حالة ممتازة'));

    // Moderate fatigue
    const moderate = calculateTrainingReadiness({
      soreness: 5,
      sleep_quality: 'AVERAGE',
      sleep_hours: 6.5,
      stress_level: 5,
      energy_level: 6
    });
    assert.ok(moderate.readiness_score >= 50 && moderate.readiness_score < 75);
    assert.equal(moderate.tier, READINESS_TIERS.MODERATE_FATIGUE);
    assert.ok(moderate.clinical_action_ar.includes('RIR +1'));

    // High fatigue
    const highFatigue = calculateTrainingReadiness({
      soreness: 8,
      sleep_quality: 'POOR',
      sleep_hours: 5.5,
      stress_level: 8,
      energy_level: 4
    });
    assert.ok(highFatigue.readiness_score >= 30 && highFatigue.readiness_score < 50);
    assert.equal(highFatigue.tier, READINESS_TIERS.HIGH_FATIGUE_TRIM);
    assert.ok(highFatigue.clinical_action_ar.includes('تقليص'));

    // Acute fatigue pivot
    const acute = calculateTrainingReadiness({
      soreness: 10,
      sleep_quality: 'POOR',
      sleep_hours: 4.0,
      stress_level: 10,
      energy_level: 1
    });
    assert.ok(acute.readiness_score < 30);
    assert.equal(acute.tier, READINESS_TIERS.ACUTE_RECOVERY_PIVOT);
    assert.ok(acute.clinical_action_ar.includes('استشفاء نشط'));
  });

  await suite.test('2. Session Autoregulation: Adjusts RIR, sets, and rest dynamically', () => {
    const mockSession = {
      session_id: 'leg_day_1',
      title_ar: 'تدريب الأرجل والسكوات',
      exercises: [
        {
          exercise_code: 'BARBELL_BACK_SQUAT',
          target_sets: 4,
          sets: 4,
          target_rir: 1,
          rir: 1,
          rest_seconds: 120,
          prescription: { sets: 4, target_rir: 1, rest_seconds: 120 }
        },
        {
          exercise_code: 'LEG_EXTENSIONS',
          target_sets: 3,
          sets: 3,
          target_rir: 1,
          rir: 1,
          rest_seconds: 90,
          prescription: { sets: 3, target_rir: 1, rest_seconds: 90 }
        }
      ]
    };

    // Case A: High fatigue trim
    const trimmed = autoregulateWorkoutSession({
      session: mockSession,
      readiness_score: 40
    });
    assert.equal(trimmed.autoregulation_status, READINESS_TIERS.HIGH_FATIGUE_TRIM);
    assert.equal(trimmed.exercises[0].target_sets, 3); // 4 - 1 = 3
    assert.equal(trimmed.exercises[1].target_sets, 2); // 3 - 1 = 2
    assert.equal(trimmed.exercises[0].target_rir, 3); // 1 + 2 = 3
    assert.equal(trimmed.exercises[0].rest_seconds, 150); // 120 + 30 = 150

    // Case B: Acute Recovery Pivot
    const pivoted = autoregulateWorkoutSession({
      session: mockSession,
      readiness_score: 20
    });
    assert.equal(pivoted.autoregulation_status, READINESS_TIERS.ACUTE_RECOVERY_PIVOT);
    assert.equal(pivoted.exercises.length, 2);
    assert.equal(pivoted.exercises[0].exercise_code, 'ACTIVE_MOBILITY_FLOW');
  });

  await suite.test('3. Missed Workout Rescheduling: Roll Forward when rest day available', () => {
    const weeklySessions = [
      { day_number: 1, title_ar: 'الصدر والترايسبس', is_rest_day: false, exercises: [{ code: 'BARBELL_BENCH_PRESS' }] },
      { day_number: 2, title_ar: 'الظهر والبايسبس', is_rest_day: false, exercises: [{ code: 'BARBELL_BENT_OVER_ROW' }] },
      { day_number: 3, title_ar: 'يوم راحة', is_rest_day: true, exercises: [] },
      { day_number: 4, title_ar: 'الأرجل والأكتاف', is_rest_day: false, exercises: [{ code: 'BARBELL_BACK_SQUAT' }] },
    ];

    // Trainee missed Day 2 (index 1)
    const result = rescheduleMissedWorkout({
      sessions: weeklySessions,
      missed_day_index: 1,
      remaining_days_in_week: 3,
      trainee_fatigue: 'NORMAL'
    });

    assert.equal(result.strategy, RESCHEDULING_STRATEGIES.ROLL_FORWARD);
    assert.equal(result.rescheduled_sessions[1].is_rest_day, true);
    assert.equal(result.rescheduled_sessions[2].is_rest_day, false);
    assert.equal(result.rescheduled_sessions[2].status, 'ROLLED_FORWARD');
    assert.ok(result.directive_ar.includes('ترحيل تدريب اليوم إلى يوم الراحة التالي'));
  });

  await suite.test('4. Missed Workout Rescheduling: Volume Triage Merge when no rest day left', () => {
    const weeklySessions = [
      { day_number: 1, title_ar: 'الصدر والترايسبس', is_rest_day: false, exercises: [{ code: 'BARBELL_BENCH_PRESS', target_sets: 3 }, { code: 'TRICEP_PUSHDOWN', target_sets: 3 }] },
      { day_number: 2, title_ar: 'الظهر والأكتاف', is_rest_day: false, exercises: [{ code: 'BARBELL_BENT_OVER_ROW', target_sets: 3 }, { code: 'LATERAL_RAISE', target_sets: 3 }] },
    ];

    // Trainee missed Day 1 (index 0) with no upcoming rest days
    const result = rescheduleMissedWorkout({
      sessions: weeklySessions,
      missed_day_index: 0,
      remaining_days_in_week: 1,
      trainee_fatigue: 'NORMAL'
    });

    assert.equal(result.strategy, RESCHEDULING_STRATEGIES.VOLUME_TRIAGE_MERGE);
    assert.equal(result.rescheduled_sessions[0].is_rest_day, true);
    assert.equal(result.rescheduled_sessions[1].status, 'HYBRID_TRIAGE_MERGED');
    // Bench press (compound) was merged into day 2, while tricep pushdown (isolation) was pruned
    assert.ok(result.rescheduled_sessions[1].exercises.some(e => e.code === 'BARBELL_BENCH_PRESS'));
    assert.ok(result.directive_ar.includes('دمج الحركات المركبة الرئيسية'));
  });

  await suite.test('5. Cumulative Fatigue & Proactive Deload Evaluation', () => {
    // 4 weeks overload
    const evalResult = evaluateCumulativeFatigue({
      consecutive_overload_weeks: 4,
      average_weekly_readiness: 65,
      chronic_soreness_flag: false
    });
    assert.equal(evalResult.deload_recommended, true);
    assert.ok(evalResult.recommendation_ar.includes('أسبوع التفريغ (Deload)'));

    // Depleted readiness
    const depleted = evaluateCumulativeFatigue({
      consecutive_overload_weeks: 2,
      average_weekly_readiness: 45,
      chronic_soreness_flag: false
    });
    assert.equal(depleted.deload_recommended, true);
    assert.ok(depleted.recommendation_ar.includes('متلازمة الإفراط التدريبي'));
  });

  await suite.test('6. Plan Adaptation Integration: Missed workout triggers schedule adaptation', () => {
    const mockProgram = {
      engine_version: 'master-engine-v2',
      nutrition_program: { macro_targets: { calories_kcal: 2200, protein_g: 170, carbohydrate_g: 220, fat_g: 65 } },
      training_program: {
        weeks: [
          {
            week_number: 1,
            sessions: [
              { day_number: 1, is_rest_day: false, exercises: [{ code: 'BARBELL_BENCH_PRESS', sets: 3 }] },
              { day_number: 2, is_rest_day: true, exercises: [] },
              { day_number: 3, is_rest_day: false, exercises: [{ code: 'BARBELL_BACK_SQUAT', sets: 3 }] }
            ]
          }
        ]
      }
    };

    const adapted = buildAdaptedPlan({
      currentMasterProgram: mockProgram,
      checkinAnalysis: {
        status: 'ON_TRACK',
        weight_delta_kg: -0.4,
        client_feedback: 'Missed Day 1 due to work',
        adherence_score: 90
      },
      options: {
        currentWeekNumber: 1,
        missed_day_index: 0,
        remaining_days_in_week: 3
      }
    });

    assert.ok(adapted.adapted_training_week.reschedule_info);
    assert.equal(adapted.adapted_training_week.reschedule_info.strategy, RESCHEDULING_STRATEGIES.ROLL_FORWARD);
    assert.ok(adapted.adaptation_reasons.some(r => r.code === 'AUTOREGULATED_SCHEDULE_ADAPTED'));
  });

  await suite.test('7. Master Program Integration: Generates baseline recovery autoregulation profile', () => {
    const intake = completeIntake();
    const program = buildMasterEngineV2({
      intake,
      evaluationContext,
      nutritionFoodCatalog,
    });

    assert.ok(program.recovery_autoregulation);
    assert.ok(program.recovery_autoregulation.readiness_baseline.readiness_score >= 80);
    assert.equal(program.recovery_autoregulation.readiness_baseline.tier, READINESS_TIERS.OPTIMAL);
  });
});

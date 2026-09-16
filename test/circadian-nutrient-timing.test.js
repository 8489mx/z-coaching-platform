import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  calculateCaffeineCutoffWindow,
  generatePeriWorkoutNutrientTimingSchedule
} from '../src/execution-engines/circadian-nutrient-timing-engine.js';
import {
  buildMasterEngineV2
} from '../src/master-engine-v2/index.js';
import { completeIntake, ASSESSMENT_CONTEXT } from './fixtures/complete-intake.js';

const evaluationContext = Object.freeze({
  system_time: new Date(ASSESSMENT_CONTEXT.assessmentDate).toISOString(),
  assessmentDate: ASSESSMENT_CONTEXT.assessmentDate,
});

const nutritionFoodCatalog = JSON.parse(
  fs.readFileSync(new URL('../data/catalogs/core-global-food-batch-v1.json', import.meta.url), 'utf8')
);

function buildTestProgramWithTiming(timingOptions = {}) {
  const intake = completeIntake();
  const modifiedIntake = {
    ...intake,
    lifestyle: {
      ...intake.lifestyle,
      sleep: {
        ...intake.lifestyle.sleep,
        bedtime: timingOptions.bedtime || '23:00',
        wakeTime: timingOptions.wakeTime || '07:00',
        quality: timingOptions.sleepQuality || 'GOOD'
      }
    },
    training: {
      ...intake.training,
      preferredTime: timingOptions.workoutTime || '17:00'
    }
  };
  return buildMasterEngineV2({
    intake: modifiedIntake,
    evaluationContext,
    nutritionFoodCatalog,
  });
}

test('Milestone 6: Circadian Rhythm & Peri-Workout Nutrient Timing Engine Suite', async (suite) => {

  await suite.test('1. Caffeine Cutoff Calculator: Strictly enforces 8h buffer for delta sleep protection', () => {
    const cutoff = calculateCaffeineCutoffWindow({
      bedtime: '23:00',
      workout_time: '14:00',
      sleep_quality: 'GOOD'
    });

    assert.equal(cutoff.caffeine_cutoff_24h, '15:00');
    assert.equal(cutoff.buffer_hours, 8);
    assert.equal(cutoff.evening_workout_warning, false);
    assert.ok(cutoff.slow_wave_sleep_protection_ar.includes('Delta Wave Sleep'));
  });

  await suite.test('2. Evening Workout Warning: Flags stimulant curfew and prescribes Non-Stim pump formula', () => {
    // Workout at 19:30 with bedtime at 23:30 (cutoff is '15:30')
    const cutoff = calculateCaffeineCutoffWindow({
      bedtime: '23:30',
      workout_time: '19:30',
      sleep_quality: 'GOOD'
    });

    assert.equal(cutoff.caffeine_cutoff_24h, '15:30');
    assert.equal(cutoff.evening_workout_warning, true);
    assert.ok(cutoff.pre_workout_stim_directive_ar.includes('Non-Stim Pump'));
    assert.ok(cutoff.pre_workout_stim_directive_ar.includes('L-Citrulline'));
  });

  await suite.test('3. Peri-Workout Nutrient Matrix: Distributes pre, intra, post, and pre-bed recovery', () => {
    const schedule = generatePeriWorkoutNutrientTimingSchedule({
      workout_time: '17:00',
      workout_duration_minutes: 60,
      bedtime: '23:00',
      wake_time: '07:00',
      daily_calories: 2200,
      daily_protein_g: 170,
      daily_carbs_g: 220,
      daily_fat_g: 65,
      meal_count: 4
    });

    assert.equal(schedule.timeline.length, 5);

    // Pre-workout main meal: ~'15:15'
    const preMeal = schedule.timeline.find(t => t.timing_phase === 'PRE_WORKOUT_MAIN_MEAL');
    assert.ok(preMeal);
    assert.equal(preMeal.time_24h, '15:15');
    assert.ok(preMeal.recommended_foods_ar.includes('شوفان') || preMeal.recommended_foods_ar.includes('دجاج'));

    // Pre-workout glycogen primer: ~'16:25'
    const prePrimer = schedule.timeline.find(t => t.timing_phase === 'PRE_WORKOUT_GLYCOGEN_PRIMER');
    assert.ok(prePrimer);
    assert.equal(prePrimer.time_24h, '16:25');
    assert.ok(prePrimer.recommended_foods_ar.includes('تمر') || prePrimer.recommended_foods_ar.includes('موزة'));

    // Intra-workout hydration
    const intra = schedule.timeline.find(t => t.timing_phase === 'INTRA_WORKOUT_HYDRATION');
    assert.ok(intra);
    assert.ok(intra.hydration_target_ml >= 500);

    // Post-workout anabolic window: ~'18:45'
    const postMeal = schedule.timeline.find(t => t.timing_phase === 'POST_WORKOUT_ANABOLIC_WINDOW');
    assert.ok(postMeal);
    assert.equal(postMeal.time_24h, '18:45');
    assert.ok(postMeal.physiological_objective_ar.includes('mTORC1'));

    // Pre-bed nocturnal recovery: ~'21:45'
    const preBed = schedule.timeline.find(t => t.timing_phase === 'PRE_BED_NOCTURNAL_RECOVERY');
    assert.ok(preBed);
    assert.equal(preBed.time_24h, '21:45');
    assert.ok(preBed.recommended_foods_ar.includes('جبن قريش') || preBed.recommended_foods_ar.includes('زبادي يوناني'));
    assert.ok(preBed.recommended_foods_ar.includes('مغنيسيوم'));
  });

  await suite.test('4. Master Program Integration: Program synthesizes circadian timing & peri-workout schedule', () => {
    const program = buildTestProgramWithTiming({
      workoutTime: '18:00',
      bedtime: '00:00',
      wakeTime: '08:00'
    });

    assert.ok(program.circadian_timing);
    assert.ok(program.nutrition_program.circadian_timing);
    assert.equal(program.circadian_timing.workout_time, '18:00');
    assert.equal(program.circadian_timing.caffeine_cutoff.caffeine_cutoff_24h, '16:00');
    assert.ok(program.circadian_timing.timeline.length >= 4);
    assert.ok(program.circadian_timing.circadian_summary_ar.includes('تمت مزامنة'));
  });
});

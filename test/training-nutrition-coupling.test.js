import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateSessionDemand,
  identifyPeriWorkoutMeals,
  syncNutritionWithSessionDemand,
  calibrateAddedExercise,
  auditWeeklyMuscleVolume,
  resolveMuscleGroupKey,
  MUSCLE_VOLUME_LANDMARKS,
  HEAVY_PRIMARY_COMPOUNDS
} from '../src/api/utils/trainingNutritionCoupling.js';

import { mergeAdaptedPlanIntoProgram } from '../src/api/utils/planMergeEngine.js';

test('Training-Nutrition Dynamic Coupling & Engine Invariance Suite', async (t) => {

  await t.test('1. calculateSessionDemand: accurately scores glycolytic demand and determines peri-workout carb ratios', () => {
    // 1.1 Empty exercises list returns REST_DAY
    const restDay = calculateSessionDemand([]);
    assert.equal(restDay.total_sets, 0);
    assert.equal(restDay.demand_level, 'REST_DAY');
    assert.equal(restDay.peri_workout_carb_ratio, 0.40);

    // 1.2 High-volume heavy compound session (Leg Day: Squat, Deadlift, Leg Press, Lunges)
    const heavyLegDay = [
      { code: 'BARBELL_BACK_SQUAT', sets: 4 },
      { code: 'BARBELL_ROMANIAN_DEADLIFT', sets: 4 },
      { code: 'LEG_PRESS_MACHINE', sets: 4 },
      { code: 'BULGARIAN_SPLIT_SQUAT', sets: 4 },
      { code: 'SEATED_LEG_CURL', sets: 3 },
    ];
    const heavyDemand = calculateSessionDemand(heavyLegDay);
    assert.equal(heavyDemand.total_sets, 19);
    assert.ok(heavyDemand.glycolytic_score > 20, `Score must be > 20, got: ${heavyDemand.glycolytic_score}`);
    assert.equal(heavyDemand.demand_level, 'HIGH_GLYCOLYTIC');
    assert.equal(heavyDemand.peri_workout_carb_ratio, 0.65, 'High demand session must allocate 65% of carbs around workout');
    assert.ok(heavyDemand.is_heavy_session);
    assert.ok(heavyDemand.heavy_compounds_count >= 2);

    // 1.3 Moderate session (Upper Hypertrophy: 12 sets mixed)
    const modUpperDay = [
      { code: 'LAT_PULLDOWN', sets: 3 },
      { code: 'DUMBBELL_BENCH_PRESS', sets: 3 },
      { code: 'BICEPS_CURL', sets: 3 },
      { code: 'TRICEPS_PUSHDOWN', sets: 3 },
    ];
    const modDemand = calculateSessionDemand(modUpperDay);
    assert.equal(modDemand.total_sets, 12);
    assert.equal(modDemand.demand_level, 'MODERATE');
    assert.equal(modDemand.peri_workout_carb_ratio, 0.55);

    // 1.4 Light / active recovery session (Delts & Core: 6 sets isolation)
    const lightDay = [
      { code: 'DUMBBELL_LATERAL_RAISE', sets: 3 },
      { code: 'DEAD_BUG', sets: 3 },
    ];
    const lightDemand = calculateSessionDemand(lightDay);
    assert.equal(lightDemand.total_sets, 6);
    assert.equal(lightDemand.demand_level, 'LOW_GLYCOLYTIC');
    assert.equal(lightDemand.peri_workout_carb_ratio, 0.45);
  });

  await t.test('2. identifyPeriWorkoutMeals: reliably detects pre and post workout meals', () => {
    // Tagged meals
    const taggedMeals = [
      { id: 'm1', name: 'وجبة الإفطار' },
      { id: 'm2', name: 'وجبة قبل التمرين (طاقة)', role: 'PRE_WORKOUT' },
      { id: 'm3', name: 'وجبة بعد التمرين (استشفاء)', role: 'POST_WORKOUT' },
    ];
    const res1 = identifyPeriWorkoutMeals(taggedMeals);
    assert.equal(res1.preIdx, 1);
    assert.equal(res1.postIdx, 2);
    assert.ok(res1.hasTaggedRoles);

    // Fallback heuristic for 3 meals
    const default3Meals = [
      { id: 'm1', name: 'إفطار' },
      { id: 'm2', name: 'غداء' },
      { id: 'm3', name: 'عشاء' },
    ];
    const res2 = identifyPeriWorkoutMeals(default3Meals);
    assert.equal(res2.preIdx, 1); // Lunch
    assert.equal(res2.postIdx, 2); // Dinner
  });

  await t.test('3. syncNutritionWithSessionDemand: dynamically focuses carbs around workout without altering daily totals', () => {
    const dailyCarbsTarget = 240;
    const initialMeals = [
      { id: 'm1', name: 'إفطار صباحي', target_macros: { carb_g: 80, protein_g: 40, fat_g: 15 } },
      { id: 'm2', name: 'وجبة قبل التمرين', role: 'PRE_WORKOUT', target_macros: { carb_g: 80, protein_g: 40, fat_g: 15 } },
      { id: 'm3', name: 'وجبة بعد التمرين', role: 'POST_WORKOUT', target_macros: { carb_g: 80, protein_g: 40, fat_g: 15 } },
    ];

    // High glycolytic demand session (allocates 65% of 240g = 156g around workout)
    const highDemand = { peri_workout_carb_ratio: 0.65 };
    const syncedHigh = syncNutritionWithSessionDemand(initialMeals, highDemand, dailyCarbsTarget);

    const highPreCarbs = syncedHigh[1].target_macros.carb_g;
    const highPostCarbs = syncedHigh[2].target_macros.carb_g;
    const highBreakfastCarbs = syncedHigh[0].target_macros.carb_g;

    assert.ok(highPreCarbs + highPostCarbs >= 150, 'Peri-workout carbs must be concentrated on high demand day');
    assert.ok(highBreakfastCarbs < 85, 'Non-peri meals carbs must be moderated to preserve total');
    const totalSyncedHighCarbs = highPreCarbs + highPostCarbs + highBreakfastCarbs;
    assert.ok(Math.abs(totalSyncedHighCarbs - dailyCarbsTarget) <= 2, `Total carbs must match daily target (${dailyCarbsTarget}), got: ${totalSyncedHighCarbs}`);

    // Low demand session (allocates 45% of 240g = 108g around workout)
    const lowDemand = { peri_workout_carb_ratio: 0.45 };
    const syncedLow = syncNutritionWithSessionDemand(initialMeals, lowDemand, dailyCarbsTarget);

    const lowPreCarbs = syncedLow[1].target_macros.carb_g;
    const lowPostCarbs = syncedLow[2].target_macros.carb_g;
    const lowBreakfastCarbs = syncedLow[0].target_macros.carb_g;

    assert.ok(lowPreCarbs + lowPostCarbs < highPreCarbs + highPostCarbs, 'Low demand day must have lower peri-workout concentration');
    assert.ok(lowBreakfastCarbs > highBreakfastCarbs, 'Non-peri meal gets higher carb share on low demand day');
    const totalSyncedLowCarbs = lowPreCarbs + lowPostCarbs + lowBreakfastCarbs;
    assert.ok(Math.abs(totalSyncedLowCarbs - dailyCarbsTarget) <= 2, `Total carbs must match daily target (${dailyCarbsTarget}), got: ${totalSyncedLowCarbs}`);
  });

  await t.test('4. calibrateAddedExercise: adapts sets, reps, and RIR to mesocycle week phase and enforces clinical safety', () => {
    const rawSquat = { code: 'BARBELL_BACK_SQUAT', name_en: 'Barbell Back Squat' };

    // Week 1 (Intro): RIR 3, 3 sets
    const week1Ex = calibrateAddedExercise(rawSquat, 1, {});
    assert.equal(week1Ex.target_rir, 3);
    assert.equal(week1Ex.sets, 3);
    assert.equal(week1Ex.profile, 'HEAVY_COMPOUND');
    assert.equal(week1Ex.restSec, 120);

    // Week 3 (Intensification): RIR 1, 4 sets
    const week3Ex = calibrateAddedExercise(rawSquat, 3, {});
    assert.equal(week3Ex.target_rir, 1);
    assert.equal(week3Ex.sets, 4);

    // Week 5 (Deload): RIR 4, 2 sets
    const week5Ex = calibrateAddedExercise(rawSquat, 5, {});
    assert.equal(week5Ex.target_rir, 4);
    assert.equal(week5Ex.sets, 2, 'Deload sets must drop to 2 for recovery');

    // Clinical Hypertension Enforcement: RIR cannot drop below 2 even in Peak Week 4
    const hypertensiveClient = { hasHypertension: true };
    const peakWeekHypertensionEx = calibrateAddedExercise(rawSquat, 4, hypertensiveClient);
    assert.ok(peakWeekHypertensionEx.target_rir >= 2, `Hypertension must enforce RIR >= 2, got: ${peakWeekHypertensionEx.target_rir}`);
    assert.ok(peakWeekHypertensionEx.safetyNote.includes('فالسافا') || peakWeekHypertensionEx.safetyNote.includes('حبس النفس'));
  });

  await t.test('5. auditWeeklyMuscleVolume: tracks MEV / MAV / MRV per muscle group and flags risks', () => {
    const sessions = [
      {
        name: 'Push Day',
        exercises: [
          { code: 'BARBELL_BENCH_PRESS', muscle_group: 'CHEST', sets: 4 },
          { code: 'DUMBBELL_INCLINE_BENCH_PRESS', muscle_group: 'CHEST', sets: 4 },
          { code: 'CABLE_FLY', muscle_group: 'CHEST', sets: 4 },
          { code: 'OVERHEAD_CABLE_TRICEPS_EXTENSION', muscle_group: 'TRICEPS', sets: 4 },
        ]
      },
      {
        name: 'Upper Day 2',
        exercises: [
          { code: 'DUMBBELL_BENCH_PRESS', muscle_group: 'CHEST', sets: 4 },
          { code: 'LAT_PULLDOWN', muscle_group: 'BACK', sets: 4 },
          { code: 'CHEST_SUPPORTED_ROW', muscle_group: 'BACK', sets: 4 },
        ]
      }
    ];

    const audit = auditWeeklyMuscleVolume(sessions);

    // Chest has 4+4+4+4 = 16 sets (MAV is 12-18) -> OPTIMAL_MAV
    assert.equal(audit.analysis.CHEST.weekly_sets, 16);
    assert.equal(audit.analysis.CHEST.status, 'OPTIMAL_MAV');

    // Back has 4+4 = 8 sets (MEV is 10) -> BELOW_MEV
    assert.equal(audit.analysis.BACK.weekly_sets, 8);
    assert.equal(audit.analysis.BACK.status, 'BELOW_MEV');
    assert.ok(audit.has_below_mev);

    // Simulate severe MRV excess for Chest (adding 10 more sets -> 26 sets > MRV 22)
    const excessSessions = [
      ...sessions,
      {
        name: 'Chest Overload',
        exercises: [
          { code: 'BARBELL_BENCH_PRESS', muscle_group: 'CHEST', sets: 10 }
        ]
      }
    ];
    const excessAudit = auditWeeklyMuscleVolume(excessSessions);
    assert.equal(excessAudit.analysis.CHEST.weekly_sets, 26);
    assert.equal(excessAudit.analysis.CHEST.status, 'EXCEEDS_MRV');
    assert.ok(excessAudit.has_mrv_exceeded);
  });

  await t.test('6. planMergeEngine: preserves coach-customized exercises during weekly check-in adaptation', () => {
    const baseProgram = {
      engine_version: '2.0.0',
      current_training_week: 1,
      training_program: {
        weeks: [
          {
            week_number: 1,
            target_rir: 3,
            sessions: [
              {
                id: 'sess_1',
                name: 'Leg Day Custom',
                exercises: [
                  { code: 'BARBELL_BACK_SQUAT', sets: 4, rir: 3 },
                  { code: 'BULGARIAN_SPLIT_SQUAT', sets: 3, rir: 3 },
                  // Coach manually added this exercise:
                  { code: 'CUSTOM_LEG_EXT_MACHINE', sets: 3, rir: 3, custom_coach_note: 'تركيز العضلة المتسعة' }
                ]
              }
            ]
          },
          {
            week_number: 2,
            target_rir: 2,
            sessions: [
              {
                id: 'sess_1',
                name: 'Leg Day Custom',
                exercises: [
                  { code: 'BARBELL_BACK_SQUAT', sets: 4, rir: 2 },
                  { code: 'BULGARIAN_SPLIT_SQUAT', sets: 3, rir: 2 },
                  { code: 'CUSTOM_LEG_EXT_MACHINE', sets: 3, rir: 2, custom_coach_note: 'تركيز العضلة المتسعة' }
                ]
              }
            ]
          }
        ]
      },
      nutrition: { targets: { calories: 2200, protein: 160, carbs: 220, fats: 60 }, meals: [] },
      nutrition_program: { targets: {}, macro_targets: { calories_kcal: 2200, protein_g: 160, carb_g: 220, fat_g: 60 } }
    };

    // Generic week from adaptation engine that does NOT know about CUSTOM_LEG_EXT_MACHINE
    const adaptationResult = {
      adapted_week_number: 2,
      adaptation_action: 'ON_TRACK_MAINTAINED',
      adapted_training_week: {
        week_number: 2,
        target_rir: 2,
        sessions: [
          {
            id: 'sess_1',
            name: 'Leg Day',
            exercises: [
              { code: 'BARBELL_BACK_SQUAT', sets: 4, rir: 2 },
              { code: 'BULGARIAN_SPLIT_SQUAT', sets: 3, rir: 2 }
            ]
          }
        ]
      }
    };

    const merged = mergeAdaptedPlanIntoProgram(baseProgram, adaptationResult);

    // Week 2 exercises must retain the coach's customized exercise!
    const week2Exercises = merged.training_program.weeks[1].sessions[0].exercises;
    assert.equal(week2Exercises.length, 3, 'Coach customized exercise must NOT be wiped out by generic week template');
    assert.equal(week2Exercises[2].code, 'CUSTOM_LEG_EXT_MACHINE');
    assert.equal(week2Exercises[2].custom_coach_note, 'تركيز العضلة المتسعة');
    assert.equal(week2Exercises[2].rir, 2, 'RIR must be updated to week 2 target RIR');

    // Coupling audit must be attached
    assert.ok(merged._training_coupling, '_training_coupling audit must be populated');
    assert.ok(merged._training_coupling.session_demand);
    assert.ok(merged._training_coupling.volume_audit);
  });

});

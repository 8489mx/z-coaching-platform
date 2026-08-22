import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getMuscleGroupVolumeLandmarks,
  getStretchMediatedExercises,
  MUSCLE_GROUPS,
  calculateMpsLeucinePartitioning,
  evaluateCardioInterferenceDecoupling,
  CARDIO_INTENSITIES,
  evaluateMatadorRefeedStrategy,
  REFEED_TYPES,
  generateTendonRehabProtocol,
  TENDON_LOCATIONS
} from '../src/execution-engines/index.js';

test('1. Hypertrophy Biomechanics - Volume Landmarks (MEV/MRV) and Stretch Prioritization', () => {
  const sideDelts = getMuscleGroupVolumeLandmarks(MUSCLE_GROUPS.SIDE_DELTS);
  assert.equal(sideDelts.mev_sets_week, 16);
  assert.equal(sideDelts.mrv_sets_week, 22);

  const hamstrings = getMuscleGroupVolumeLandmarks(MUSCLE_GROUPS.HAMSTRINGS);
  assert.equal(hamstrings.mev_sets_week, 10);
  assert.equal(hamstrings.mrv_sets_week, 14);

  const bicepsStretch = getStretchMediatedExercises(MUSCLE_GROUPS.BICEPS);
  assert.ok(bicepsStretch.some(ex => ex.name.includes('Incline Dumbbell Curl')));

  const tricepsStretch = getStretchMediatedExercises(MUSCLE_GROUPS.TRICEPS);
  assert.ok(tricepsStretch.some(ex => ex.name.includes('Overhead Cable')));
});

test('2. MPS Leucine Kinetics - Verifies 3.0g+ Leucine Threshold & Circadian Meal Spacing', () => {
  const result = calculateMpsLeucinePartitioning({
    body_weight_kg: 80,
    daily_protein_g: 160,
    target_meal_count: 4,
    first_meal_time: '09:00'
  });

  assert.equal(result.is_leucine_threshold_met, true);
  assert.equal(result.actual_protein_per_meal_g, 40);
  assert.equal(result.target_meal_count, 4);
  assert.equal(result.meal_distribution_schedule.length, 4);
  assert.equal(result.meal_distribution_schedule[0].target_time, '09:00');
  assert.equal(result.meal_distribution_schedule[1].target_time, '13:00');
});

test('3. Cardio Interference Decoupling - Blocks HIIT Same-Hour Clash & Clears Zone 2', () => {
  // Clash scenario: Resistance + HIIT 1 hour apart
  const clash = evaluateCardioInterferenceDecoupling({
    age: 30,
    cardio_type: CARDIO_INTENSITIES.HIGH_INTENSITY_HIIT,
    resistance_session_time: '17:00',
    cardio_session_time: '18:00',
    is_same_day: true
  });
  assert.equal(clash.has_interference_risk, true);
  assert.equal(clash.is_decoupled, false);

  // Safe scenario: Resistance + Zone 2
  const safe = evaluateCardioInterferenceDecoupling({
    age: 30,
    cardio_type: CARDIO_INTENSITIES.ZONE_2_STEADY_STATE,
    resistance_session_time: '17:00',
    cardio_session_time: '18:00',
    is_same_day: true
  });
  assert.equal(safe.has_interference_risk, false);
  assert.equal(safe.is_decoupled, true);
  assert.ok(safe.heart_rate_prescription.range_display.includes('نبضة/دقيقة'));
});

test('4. MATADOR Engine - 48h Acute Carb Refeed at Week 4 and 1-Week Maintenance at Week 8', () => {
  // Week 4: 48h Refeed
  const week4 = evaluateMatadorRefeedStrategy({
    consecutive_deficit_weeks: 4,
    baseline_calories: 1800,
    baseline_carbs_g: 180,
    baseline_protein_g: 150,
    baseline_fat_g: 45
  });
  assert.equal(week4.protocol_type, REFEED_TYPES.ACUTE_48H_REFEED);
  assert.ok(week4.macros_adjustment.carbs_g > 180);

  // Week 8: MATADOR 1-Week Maintenance Block
  const week8 = evaluateMatadorRefeedStrategy({
    consecutive_deficit_weeks: 8,
    baseline_calories: 1800,
    baseline_carbs_g: 180,
    baseline_protein_g: 150,
    baseline_fat_g: 45
  });
  assert.equal(week8.protocol_type, REFEED_TYPES.MATADOR_1_WEEK_BLOCK);
  assert.equal(week8.macros_adjustment.calorie_increase_kcal, 400);
});

test('5. Tendon Collagen Kinetics - Collagen Pre-Loading Timing & Spanish Squat Isometrics', () => {
  const result = generateTendonRehabProtocol({
    tendon_injury_location: TENDON_LOCATIONS.PATELLAR_KNEE,
    session_start_time: '17:00'
  });

  assert.equal(result.collagen_supplementation_timing.target_time_24h, '16:15'); // 45 min before 17:00
  assert.ok(result.collagen_supplementation_timing.supplement_prescription.includes('Collagen'));
  assert.equal(result.isometric_pre_exhaustion_protocol.sets, 5);
  assert.equal(result.isometric_pre_exhaustion_protocol.hold_duration_seconds, 45);
  assert.ok(result.isometric_pre_exhaustion_protocol.exercise_name.includes('Spanish Squat'));
});

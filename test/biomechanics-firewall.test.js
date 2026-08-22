import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateMicroProgressionBridge,
  evaluateJointPainAndFirewall,
  getGymRushEquivalentSwap,
  getPosturalPrehabInjection,
  validateRirAuthenticity,
  calculateAcclimationWarmupSets,
  MICRO_PROGRESSION_STRATEGIES
} from '../src/execution-engines/biomechanics-firewall-engine.js';

test('Biomechanical Engineering, Gym Adaptation & Injury Firewall Suite', async (t) => {

  await t.test('1. Dumbbell Jump Paradox: Micro-Progression Bridge', () => {
    // 15kg dumbbells, target 8-12 reps. Current 12 reps -> requires 15 reps before jumping to 17.5kg
    const bridge1 = calculateMicroProgressionBridge({
      currentWeightKg: 15,
      targetRepRange: [8, 12],
      currentReps: 12,
      bridgeStrategy: MICRO_PROGRESSION_STRATEGIES.REP_EXTENSION
    });
    assert.equal(bridge1.is_ready_for_next_weight, false);
    assert.equal(bridge1.next_recommended_weight_kg, 15);
    assert.equal(bridge1.extended_target_reps, 15);

    // When hitting 15 reps with RIR >= 2 -> ready to jump to 17.5kg
    const bridge2 = calculateMicroProgressionBridge({
      currentWeightKg: 15,
      targetRepRange: [8, 12],
      currentReps: 15,
      currentRir: 2,
      bridgeStrategy: MICRO_PROGRESSION_STRATEGIES.REP_EXTENSION
    });
    assert.equal(bridge2.is_ready_for_next_weight, true);
    assert.equal(bridge2.next_recommended_weight_kg, 17.5);
    assert.equal(bridge2.next_target_reps, 8);
  });

  await t.test('2. Joint Pain Firewall: Immediate Biomechanical Swaps', () => {
    // Lower back pain >= 3 -> blocks back squat, injects Bulgarian split squat
    const backPain = evaluateJointPainAndFirewall({
      jointLocation: 'LOWER_BACK',
      painScore: 5
    });
    assert.equal(backPain.firewall_active, true);
    assert.ok(backPain.forbidden_movements.includes('BARBELL_BACK_SQUAT'));
    const bulgarian = backPain.immediate_swaps.find((s) => s.id === 'bulgarian_split_squat');
    assert.ok(bulgarian);

    // Shoulder pinch >= 4 -> blocks flat bench, injects low incline neutral DB press
    const shoulderPain = evaluateJointPainAndFirewall({
      jointLocation: 'SHOULDER',
      painScore: 4
    });
    assert.equal(shoulderPain.firewall_active, true);
    assert.ok(shoulderPain.forbidden_movements.includes('FLAT_BARBELL_BENCH_PRESS'));
    const lowIncline = shoulderPain.immediate_swaps.find((s) => s.id === 'low_incline_neutral_db_press');
    assert.ok(lowIncline);

    // Elbow pain -> blocks skullcrushers, injects cross-body cable
    const elbowPain = evaluateJointPainAndFirewall({
      jointLocation: 'ELBOW',
      painScore: 6
    });
    assert.equal(elbowPain.firewall_active, true);
    assert.ok(elbowPain.forbidden_movements.includes('SKULLCRUSHERS'));

    // Knee pain -> blocks leg extension, injects Spanish squats
    const kneePain = evaluateJointPainAndFirewall({
      jointLocation: 'KNEE_PATELLAR',
      painScore: 5
    });
    assert.equal(kneePain.firewall_active, true);
    assert.ok(kneePain.forbidden_movements.includes('LEG_EXTENSION_OPEN_CHAIN'));
  });

  await t.test('3. Gym Rush & Out-of-Order Swaps: Identical Resistance Profiles', () => {
    const latSwap = getGymRushEquivalentSwap('LAT_PULLDOWN');
    assert.equal(latSwap.found, true);
    assert.equal(latSwap.swap_id, 'single_arm_cable_pulldown');

    const legPressSwap = getGymRushEquivalentSwap('LEG_PRESS');
    assert.equal(legPressSwap.found, true);
    assert.equal(legPressSwap.swap_id, 'db_walking_lunges');

    const pecDeckSwap = getGymRushEquivalentSwap('PEC_DECK_FLY');
    assert.equal(pecDeckSwap.found, true);
    assert.equal(pecDeckSwap.swap_id, 'floor_db_fly_press');
  });

  await t.test('4. Postural Prehab Injections: Upper Crossed & Anterior Pelvic Tilt', () => {
    const ucs = getPosturalPrehabInjection('UPPER_CROSSED_SYNDROME');
    assert.equal(ucs.injection_active, true);
    assert.equal(ucs.duration_minutes, 4);
    assert.equal(ucs.routine_exercises.length, 2);

    const apt = getPosturalPrehabInjection('ANTERIOR_PELVIC_TILT');
    assert.equal(apt.injection_active, true);
    assert.equal(apt.duration_minutes, 5);
    assert.equal(apt.routine_exercises.length, 2);
  });

  await t.test('5. RIR Reality Check: Involuntary Bar Slowdown vs. Lazy Set Detection', () => {
    // Constant speed with no slowdown -> detects lazy set
    const lazyCheck = validateRirAuthenticity({
      loggedRir: 1,
      isBarSpeedConstant: true,
      involuntaryBarSlowdown: false
    });
    assert.equal(lazyCheck.is_authentic, false);
    assert.equal(lazyCheck.corrected_rir, 4);
    assert.equal(lazyCheck.action_recommended, 'INCREASE_LOAD');

    // Involuntary slowdown confirmed -> authentic effort
    const genuineCheck = validateRirAuthenticity({
      loggedRir: 2,
      isBarSpeedConstant: false,
      involuntaryBarSlowdown: true
    });
    assert.equal(genuineCheck.is_authentic, true);
    assert.equal(genuineCheck.validated_rir, 2);
    assert.equal(genuineCheck.action_recommended, 'MAINTAIN_PROGRESSION');
  });

  await t.test('6. Pyramid Acclimation Warmup Sets Generator', () => {
    const warmup = calculateAcclimationWarmupSets(100);
    assert.equal(warmup.working_weight_kg, 100);
    assert.equal(warmup.warmup_sets.length, 3);
    assert.equal(warmup.warmup_sets[0].weight_kg, 40);
    assert.equal(warmup.warmup_sets[1].weight_kg, 60);
    assert.equal(warmup.warmup_sets[2].weight_kg, 80);
  });

});

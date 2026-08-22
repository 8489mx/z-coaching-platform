import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateDailyHydrationTarget,
  getPassiveWarmupCueCard,
  generateScientificRampWarmup,
  SPLIT_TYPES
} from '../src/execution-engines/index.js';

test('1. Dynamic Hydration - Calculates Baseline (Weight * 0.035) + Training (+0.6L/hour)', () => {
  const hydration = calculateDailyHydrationTarget({
    weight_kg: 80,
    training_duration_minutes: 60,
    is_heavy_training_day: true
  });

  // 80 * 0.035 = 2.8L + 0.6L = 3.4L
  assert.equal(hydration.baseline_liters, 2.8);
  assert.equal(hydration.training_add_liters, 0.6);
  assert.equal(hydration.total_target_liters, 3.4);
  assert.equal(hydration.electrolyte_intra_workout_cue.is_recommended, true);
  assert.ok(hydration.electrolyte_intra_workout_cue.guideline_ar.includes('ملح البحر الطبيعي'));
});

test('2. Passive Warm-Up Cues - Generates Clean Non-Intrusive 2-Set Ramp Without Form Fields', () => {
  const warmup = getPassiveWarmupCueCard({
    working_weight_kg: 100,
    bar_weight_kg: 20
  });

  assert.equal(warmup.working_weight_kg, 100);
  assert.ok(warmup.passive_cue_card_ar.includes('50kg × 5 عدات'));
  assert.ok(warmup.passive_cue_card_ar.includes('80kg × 1 عدة'));
});

test('3. Scientific RAMP Protocol - 3 Phases (Raise, Mobilize/Activate, Potentiate)', () => {
  const rampUpper = generateScientificRampWarmup({
    working_weight_kg: 100,
    split_type: SPLIT_TYPES.UPPER_BODY,
    bar_weight_kg: 20
  });

  assert.equal(rampUpper.ramp_protocol.raise.duration_minutes, 2);
  assert.ok(rampUpper.ramp_protocol.mobilize.directive_ar.includes('Band Pull-Aparts'));
  assert.equal(rampUpper.ramp_protocol.potentiate.bar_sets.length, 3);
  assert.equal(rampUpper.ramp_protocol.potentiate.bar_sets[0].weight_kg, 20);
  assert.equal(rampUpper.ramp_protocol.potentiate.bar_sets[1].weight_kg, 50);
  assert.equal(rampUpper.ramp_protocol.potentiate.bar_sets[2].weight_kg, 80);

  const rampLower = generateScientificRampWarmup({
    working_weight_kg: 140,
    split_type: SPLIT_TYPES.LOWER_BODY
  });
  assert.ok(rampLower.ramp_protocol.mobilize.directive_ar.includes('Hip 90/90'));
});


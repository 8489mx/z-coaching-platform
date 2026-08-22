import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getTorqueMatchedSwaps,
  RESISTANCE_PROFILES,
  applyFatigueModeReduction
} from '../src/execution-engines/index.js';

test('1. Biomechanical Swap - Matches Incline DB Curl to Bayesian Cable Curl at Lengthened Overload', () => {
  const result = getTorqueMatchedSwaps('INCLINE_DUMBBELL_CURL');
  assert.equal(result.muscle_group, 'BICEPS');
  assert.equal(result.resistance_profile, RESISTANCE_PROFILES.LENGTHENED_OVERLOAD);
  assert.ok(result.matched_swaps.some(s => s.name.includes('Bayesian Cable Curl')));
});

test('2. Biomechanical Swap - Matches Pec Deck to Cable Crossover at Shortened Overload', () => {
  const result = getTorqueMatchedSwaps('PEC_DECK_FLYE');
  assert.equal(result.muscle_group, 'CHEST');
  assert.equal(result.resistance_profile, RESISTANCE_PROFILES.SHORTENED_OVERLOAD);
  assert.ok(result.matched_swaps.some(s => s.name.includes('Cable Crossover')));
});

test('3. Biomechanical Swap - Matches Barbell Bench Press to Flat Dumbbell Press in Mid-Range', () => {
  const result = getTorqueMatchedSwaps('BARBELL_BENCH_PRESS');
  assert.equal(result.muscle_group, 'CHEST');
  assert.equal(result.resistance_profile, RESISTANCE_PROFILES.MID_RANGE_COMPOUND);
  assert.ok(result.matched_swaps.some(s => s.name.includes('Dumbbell Flat Bench Press')));
});

test('4. In-Gym Fatigue Mode Toggle - Reduces 1 Set from Accessory Moves and Preserves Core Compounds', () => {
  const originalSession = {
    exercises: [
      { id: 'e1', name: 'Barbell Squat', isCompound: true, sets: [ { id: 1 }, { id: 2 }, { id: 3 } ] },
      { id: 'e2', name: 'Leg Extension', isCompound: false, sets: [ { id: 1 }, { id: 2 }, { id: 3 } ] },
      { id: 'e3', name: 'Calf Raise', isCompound: false, sets: [ { id: 1 }, { id: 2 }, { id: 3 } ] }
    ]
  };

  const reduced = applyFatigueModeReduction(originalSession);
  assert.equal(reduced.is_fatigue_mode_active, true);

  // Compound keeps all 3 sets
  const compoundEx = reduced.exercises.find(e => e.id === 'e1');
  assert.equal(compoundEx.sets.length, 3);

  // Accessory exercises reduced to 2 sets
  const acc1 = reduced.exercises.find(e => e.id === 'e2');
  const acc2 = reduced.exercises.find(e => e.id === 'e3');
  assert.equal(acc1.sets.length, 2);
  assert.equal(acc2.sets.length, 2);
});

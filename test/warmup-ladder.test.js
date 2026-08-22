import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateWarmupLadder } from '../src/execution-engines/warmup-ladder-engine.js';

test('Warm-up Sets Ladder Engine Suite', async (t) => {

  await t.test('1. Handles light working weight (<= 20kg) with single general warmup set', () => {
    const sets = calculateWarmupLadder(15);
    assert.equal(sets.length, 1);
    assert.equal(sets[0].set_type, 'WARMUP_1');
    assert.equal(sets[0].weight_kg, 15);
    assert.equal(sets[0].reps, 10);
  });

  await t.test('2. Generates 3 calibrated ladder warmup sets for 100kg working weight', () => {
    const sets = calculateWarmupLadder(100);
    assert.equal(sets.length, 3);

    // Set 1: 50% -> 50kg, 8 reps
    assert.equal(sets[0].set_type, 'WARMUP_1');
    assert.equal(sets[0].percentage, 50);
    assert.equal(sets[0].weight_kg, 50);
    assert.equal(sets[0].reps, 8);

    // Set 2: 70% -> 70kg, 4 reps
    assert.equal(sets[1].set_type, 'WARMUP_2');
    assert.equal(sets[1].percentage, 70);
    assert.equal(sets[1].weight_kg, 70);
    assert.equal(sets[1].reps, 4);

    // Set 3: 90% -> 90kg, 1 rep
    assert.equal(sets[2].set_type, 'WARMUP_3');
    assert.equal(sets[2].percentage, 90);
    assert.equal(sets[2].weight_kg, 90);
    assert.equal(sets[2].reps, 1);
  });

  await t.test('3. Enforces clean 2.5kg rounding for uneven weights (e.g. 77.5kg)', () => {
    const sets = calculateWarmupLadder(77.5);
    assert.equal(sets.length, 3);
    assert.equal(sets[0].weight_kg, 40);
    assert.equal(sets[1].weight_kg, 55);
    assert.equal(sets[2].weight_kg, 70);
  });

});

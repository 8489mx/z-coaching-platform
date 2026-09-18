import test from 'node:test';
import assert from 'node:assert/strict';

import * as ExecutionEngines from '../src/execution-engines/index.js';
import {
  convertPortionCookingYield,
  calculateBarbellPlates,
  calculateNeuralWarmupRamp
} from '../src/execution-engines/index.js';

test('1. Kitchen Yield - Converts Cooked to Raw Portions with Exact Deterministic Factors', () => {
  // Chicken: 150g cooked -> 200g raw (0.75 yield factor)
  const chicken = convertPortionCookingYield({
    food_code: 'CHICKEN_BREAST',
    amount_g: 150,
    from_state: 'COOKED',
    to_state: 'RAW'
  });
  assert.equal(chicken.converted_amount_g, 200);
  assert.equal(chicken.yield_factor, 0.75);

  // Basmati Rice: 150g cooked -> 60g raw (2.50 expansion factor)
  const rice = convertPortionCookingYield({
    food_code: 'BASMATI_RICE_COOKED',
    amount_g: 150,
    from_state: 'COOKED',
    to_state: 'RAW'
  });
  assert.equal(rice.converted_amount_g, 60);

  // White fish: 160g cooked -> 200g raw (0.80 yield factor)
  const fish = convertPortionCookingYield({
    food_code: 'WHITE_FISH_FILLET',
    amount_g: 160,
    from_state: 'COOKED',
    to_state: 'RAW'
  });
  assert.equal(fish.converted_amount_g, 200);
});

test('2. Zero Grocery Lists - no shopping list generator is exported by the execution engines', () => {
  const groceryExports = Object.keys(ExecutionEngines).filter((name) => /grocery|shopping/i.test(name));
  assert.deepEqual(groceryExports, []);
});

test('3. Plate Math - Calculates Exact Olympic Plates Per Side', () => {
  // 100kg total target: 40kg per side -> 20kg + 20kg
  const plate100 = calculateBarbellPlates({ target_weight_kg: 100, bar_weight_kg: 20 });
  assert.equal(plate100.weight_per_side_kg, 40);
  assert.deepEqual(plate100.plates_per_side, [20, 20]);

  // 82.5kg total target: 31.25kg per side -> 20kg + 10kg + 1.25kg
  const plate825 = calculateBarbellPlates({ target_weight_kg: 82.5, bar_weight_kg: 20 });
  assert.equal(plate825.weight_per_side_kg, 31.25);
  assert.deepEqual(plate825.plates_per_side, [20, 10, 1.25]);
});

test('4. Neural Warm-Up Ramp - Computes 3 Progressive Potentiation Sets', () => {
  const warmup = calculateNeuralWarmupRamp({ working_weight_kg: 100, bar_weight_kg: 20 });
  assert.equal(warmup.warmup_sets_count, 3);
  assert.equal(warmup.warmup_protocol[0].weight_kg, 50); // 50%
  assert.equal(warmup.warmup_protocol[1].weight_kg, 70); // 70%
  assert.equal(warmup.warmup_protocol[2].weight_kg, 85); // 85%
  assert.ok(warmup.ready_for_work_sets_directive_ar.includes('100kg'));
});

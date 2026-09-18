import test from 'node:test';
import assert from 'node:assert/strict';

import * as ExecutionEngines from '../src/execution-engines/index.js';
import {
  convertPortionCookingYield
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


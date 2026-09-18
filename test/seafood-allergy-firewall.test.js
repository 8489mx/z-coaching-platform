import test from 'node:test';
import assert from 'node:assert/strict';

import * as BackendSwap from '../src/execution-engines/food-swap-engine.js';
import * as FrontendSwap from '../frontend/src/utils/foodSwapEngine.js';

// Intake adapter emits these tokens for a seafood exclusion (intake-adapter.js)
const SEAFOOD_ALLERGY_TOKENS = ['SEAFOOD', 'FISH_SEAFOOD', 'FISH', 'SHELLFISH', 'مأكولات بحرية'];
const SEAFOOD_CODE_PATTERN = /SHRIMP|FISH|SALMON|TUNA|TILAPIA|BOLTI|HAMOUR|KANAAD|BOURI|MACKEREL|SARDINE/;

function seafoodCodes(engine) {
  return Object.keys(engine.FOOD_DATABASE).filter((code) => SEAFOOD_CODE_PATTERN.test(code));
}

for (const [label, engine] of [['backend', BackendSwap], ['frontend', FrontendSwap]]) {
  test(`${label}: seafood allergy tokens block every fish and shellfish item`, () => {
    const codes = seafoodCodes(engine);
    assert.ok(codes.length > 5, 'expected seafood items in catalog');
    for (const allergy of SEAFOOD_ALLERGY_TOKENS) {
      const leaked = codes.filter((code) =>
        engine.isFoodClinicallySafe(engine.FOOD_DATABASE[code], { allergies: [allergy] })
      );
      assert.deepEqual(leaked, [], `allergy=${allergy} leaked: ${leaked.join(',')}`);
    }
  });

  test(`${label}: seafood allergy does not block unrelated proteins`, () => {
    const chicken = Object.keys(engine.FOOD_DATABASE).find((code) => code.includes('CHICKEN'));
    assert.ok(chicken);
    assert.equal(engine.isFoodClinicallySafe(engine.FOOD_DATABASE[chicken], { allergies: ['SEAFOOD'] }), true);
  });
}

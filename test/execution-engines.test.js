import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateDynamicFoodSwap,
  isFoodClinicallySafe,
  FOOD_DATABASE
} from '../src/execution-engines/food-swap-engine.js';

test('1. Food Swap Engine - Dynamic Macro Equivalence Math', () => {
  // Swap 150g Chicken Breast (31g protein/100g = 46.5g protein) -> White Fish (24g protein/100g)
  // Expected weight = 46.5 * (100 / 24) = 193.75 -> 194g
  const swap = calculateDynamicFoodSwap({
    current_food_code: 'CHICKEN_BREAST',
    current_portion_g: 150,
    target_food_code: 'WHITE_FISH_FILLET',
    clinical_profile: {}
  });

  assert.equal(swap.success, true);
  assert.equal(swap.current_food.portion_g, 150);
  assert.equal(swap.replacement_food.portion_g, 194);
  assert.ok(swap.replacement_food.macros.protein_g >= 45 && swap.replacement_food.macros.protein_g <= 48);
});

test('2. Food Swap Engine - Clinical Guardrail Strict Rejection (G6PD)', () => {
  // G6PD patient attempting to swap to Fava Beans (Legume)
  assert.throws(
    () => {
      calculateDynamicFoodSwap({
        current_food_code: 'CHICKEN_BREAST',
        current_portion_g: 150,
        target_food_code: 'FAVA_BEANS',
        clinical_profile: { is_g6pd: true }
      });
    },
    /Clinical Guardrail Violation/
  );
});

test('3. Food Swap Engine - Clinical Guardrail Strict Rejection (Celiac)', () => {
  // Celiac patient attempting to swap to Whole Wheat Pasta
  assert.throws(
    () => {
      calculateDynamicFoodSwap({
        current_food_code: 'BASMATI_RICE_COOKED',
        current_portion_g: 150,
        target_food_code: 'WHOLE_WHEAT_PASTA_COOKED',
        clinical_profile: { is_celiac: true }
      });
    },
    /Clinical Guardrail Violation/
  );
});

test('4. Food Swap Engine - Bariatric Portion Warning (> 150g)', () => {
  const swap = calculateDynamicFoodSwap({
    current_food_code: 'CHICKEN_BREAST',
    current_portion_g: 150,
    target_food_code: 'WHITE_FISH_FILLET',
    clinical_profile: { is_bariatric: true }
  });

  assert.equal(swap.success, true);
  assert.ok(swap.clinical_note && swap.clinical_note.includes('تكميم المعدة'));
});


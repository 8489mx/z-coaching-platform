import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateDynamicFoodSwap,
  isFoodClinicallySafe,
  FOOD_DATABASE
} from '../src/execution-engines/food-swap-engine.js';

import {
  calculateSessionVolumeLoad,
  getDynamicRestDuration,
  evaluateAutoDeloadTrigger
} from '../src/execution-engines/workout-execution-engine.js';

import {
  getPhaseByWeekNumber,
  MESOCYCLE_PHASES
} from '../src/execution-engines/phase-progression-engine.js';

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

test('5. Workout Execution Engine - Session Volume Load Calculation', () => {
  const exercises = [
    {
      name: 'Lat Pulldown',
      sets: [
        { weight: 50, reps: 10, completed: true },
        { weight: 50, reps: 10, completed: true },
        { weight: 55, reps: 8, completed: false } // Not completed
      ]
    },
    {
      name: 'Bicep Curl',
      sets: [
        { weight: 15, reps: 12, completed: true }
      ]
    }
  ];

  const volume = calculateSessionVolumeLoad(exercises);
  // (50*10) + (50*10) + (15*12) = 500 + 500 + 180 = 1180 kg
  assert.equal(volume.total_volume_kg, 1180);
  assert.equal(volume.total_sets_completed, 3);
  assert.equal(volume.total_reps_completed, 32);
});

test('6. Workout Execution Engine - Dynamic Rest Intervals', () => {
  assert.equal(getDynamicRestDuration('COMPOUND'), 90);
  assert.equal(getDynamicRestDuration('ISOLATION'), 60);
  assert.equal(getDynamicRestDuration('BICEP_CURL'), 60);
});

test('7. Workout Execution Engine - Auto-Deload Detection Trigger', () => {
  const normal = evaluateAutoDeloadTrigger({
    consecutive_strength_drop_weeks: 0,
    fatigue_level: 3,
    current_week_number: 2
  });
  assert.equal(normal.is_deload_active, false);

  const deload = evaluateAutoDeloadTrigger({
    consecutive_strength_drop_weeks: 2,
    fatigue_level: 8,
    current_week_number: 3
  });
  assert.equal(deload.is_deload_active, true);
  assert.equal(deload.volume_reduction_percent, 50);
});

test('8. Phase Progression Engine - 16-Week Mesocycle State Machine', () => {
  // Week 1 (Baseline Priming)
  const w1 = getPhaseByWeekNumber(1);
  assert.equal(w1.phase_code, 'BASELINE_PRIMING');
  assert.equal(w1.rir_target, '2-3 RIR');

  // Week 6 (Progressive Hypertrophy)
  const w6 = getPhaseByWeekNumber(6);
  assert.equal(w6.phase_code, 'PROGRESSIVE_HYPERTROPHY');
  assert.ok(w6.carb_strategy.includes('CARB_CYCLING'));

  // Week 11 (Diet Break)
  const w11 = getPhaseByWeekNumber(11);
  assert.equal(w11.phase_code, 'DIET_BREAK_PHASE');

  // Week 14 (Reverse Dieting)
  const w14 = getPhaseByWeekNumber(14);
  assert.equal(w14.phase_code, 'REVERSE_DIETING');
  assert.ok(w14.carb_strategy.includes('REVERSE_INCREMENT'));
});

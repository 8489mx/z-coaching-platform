import test from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluateFemaleCycleBuffer,
  estimateCyclePhase,
  CYCLE_PHASES
} from '../src/execution-engines/female-cycle-buffer-engine.js';

test('1. Female Cycle - Background Date Estimator Maps Luteal, Ovulation, and Menstrual Phases', () => {
  const baseDate = new Date('2026-09-10');

  // Next period in 4 days -> LUTEAL (PMS)
  const luteal = estimateCyclePhase({
    approximate_next_period_date: '2026-09-14',
    current_date: baseDate
  });
  assert.equal(luteal, CYCLE_PHASES.LUTEAL);

  // Next period in 14 days -> OVULATION
  const ovulation = estimateCyclePhase({
    approximate_next_period_date: '2026-09-24',
    current_date: baseDate
  });
  assert.equal(ovulation, CYCLE_PHASES.OVULATION);

  // 1-Tap toggle overrides
  const toggle = estimateCyclePhase({ is_pms_active: true });
  assert.equal(toggle, CYCLE_PHASES.LUTEAL);
});

test('2. Female Cycle - Silent Deficit Lock, Comfort Snack Shift, and Rest Tuning', () => {
  const result = evaluateFemaleCycleBuffer({
    is_female: true,
    is_pms_active: true,
    weight_delta_kg: 1.3,
    adherence_score: 92,
    current_calories: 1600,
    base_rest_seconds: 60
  });

  assert.equal(result.deficit_adjustment_locked, true);
  assert.equal(result.comfort_snack_added_kcal, 0);
  assert.equal(result.comfort_snack_recommended_kcal, 150);
  assert.equal(result.adjusted_calories_with_comfort_snack, 1600);
  assert.equal(result.gym_tuning.tuned_rest_seconds, 90); // 60s + 30s
  assert.equal(result.gym_tuning.recommended_rir, '2-3 RIR (Unstressed)');
  assert.ok(result.reassurance_message_ar.includes('زيادة الميزان في هذه الفترة طبيعية ومؤقتة'));
  assert.ok(result.micro_adjustments.recommended_supplement.includes('Magnesium'));
});

test('3. Female Cycle - PCOS Clinical Guardrail Enforces Low-GI & Myo-Inositol', () => {
  const result = evaluateFemaleCycleBuffer({
    is_female: true,
    has_pcos: true,
    current_calories: 1500
  });

  assert.equal(result.pcos_protocol.is_pcos_active, true);
  assert.ok(result.pcos_protocol.nutrition_strategy.includes('Low-GI'));
  assert.ok(result.pcos_protocol.supplements.some(s => s.supplement.includes('Myo-Inositol')));
  assert.ok(result.pcos_protocol.supplements.some(s => s.supplement.includes('Chromium')));
});

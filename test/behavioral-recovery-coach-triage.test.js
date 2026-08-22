import test from 'node:test';
import assert from 'node:assert/strict';

import {
  RECOVERY_STRATEGIES,
  absorbCaloricSurplus,
  detectDietFatigue,
  TRIAGE_TIERS,
  QUICK_ACTIONS,
  evaluateClientTriageItem,
  generateDailyCoachTriage
} from '../src/execution-engines/index.js';

test('1. Behavioral Recovery - Zero-Guilt Surplus Absorption without Starvation', () => {
  // Minor surplus (150 Kcal)
  const minor = absorbCaloricSurplus({
    excess_calories: 150,
    remaining_days_in_week: 5,
    baseline_calories: 2000,
    baseline_protein_g: 160
  });
  assert.equal(minor.strategy, RECOVERY_STRATEGIES.STANDARD_MAINTENANCE_BUFFER);
  assert.equal(minor.daily_reduction_kcal, 0);
  assert.equal(minor.protein_g, 160);

  // Moderate surplus (500 Kcal over 4 days) -> 125 Kcal/day gentle spread
  const moderate = absorbCaloricSurplus({
    excess_calories: 500,
    remaining_days_in_week: 4,
    baseline_calories: 2000,
    baseline_protein_g: 160
  });
  assert.equal(moderate.strategy, RECOVERY_STRATEGIES.GENTLE_DEFICIT_SPREAD);
  assert.equal(moderate.daily_reduction_kcal, 125);
  assert.equal(moderate.adjusted_daily_calories, 1875);
  assert.equal(moderate.protein_g, 160);

  // Heavy surplus (1500 Kcal) -> Capped controlled refeed reset
  const heavy = absorbCaloricSurplus({
    excess_calories: 1500,
    remaining_days_in_week: 4,
    baseline_calories: 2000,
    baseline_protein_g: 160
  });
  assert.equal(heavy.strategy, RECOVERY_STRATEGIES.CONTROLLED_REFEED_RESET);
  assert.equal(heavy.daily_reduction_kcal, 100);
  assert.equal(heavy.protein_g, 160);
});

test('2. Behavioral Recovery - Diet Fatigue Detection and Intentional Diet Break', () => {
  // Adherence fatigue (2 consecutive weeks of low compliance)
  const adherenceFatigued = detectDietFatigue({
    consecutive_low_adherence_weeks: 2,
    consecutive_deficit_weeks: 4
  });
  assert.equal(adherenceFatigued.diet_break_recommended, true);
  assert.equal(adherenceFatigued.target_mode, 'MAINTENANCE_DIET_BREAK');

  // Metabolic fatigue (8+ weeks of continuous deficit)
  const metabolicFatigued = detectDietFatigue({
    consecutive_low_adherence_weeks: 0,
    consecutive_deficit_weeks: 8
  });
  assert.equal(metabolicFatigued.diet_break_recommended, true);
  assert.equal(metabolicFatigued.target_mode, 'MAINTENANCE_DIET_BREAK');

  // Normal on-track client
  const normal = detectDietFatigue({
    consecutive_low_adherence_weeks: 0,
    consecutive_deficit_weeks: 3,
    biofeedback_hunger: 4,
    biofeedback_stress: 3
  });
  assert.equal(normal.diet_break_recommended, false);
  assert.equal(normal.target_mode, 'DEFICIT_CONTINUATION');
});

test('3. Coach Triage Cockpit - Deterministic Client Matrix Classification', () => {
  const clients = [
    { id: '1', name: 'سارة', has_pending_checkin: true, phone: '01011111110' },
    { id: '2', name: 'أحمد', has_reported_pain: true, pain_joint: 'الركبة', phone: '01011111111' },
    { id: '3', name: 'محمد', subscription_remaining_days: 2, is_frozen: false, phone: '01011111112' },
    { id: '4', name: 'كريم', days_since_last_workout: 4, is_frozen: false, phone: '01011111113' },
    { id: '5', name: 'محمود', is_weight_stalled: true, phone: '01011111114' },
    { id: '6', name: 'عمر', days_since_last_workout: 0, phone: '01011111115' }
  ];

  const triage = generateDailyCoachTriage(clients);

  assert.equal(triage.total_clients, 6);
  assert.equal(triage.counts.red_flags, 3);    // סارة, أحمد, محمد
  assert.equal(triage.counts.yellow_flags, 2); // كريم, محمود
  assert.equal(triage.counts.green_flags, 1);  // عمر

  assert.equal(triage.red_flag_queue[0].primary_action, QUICK_ACTIONS.APPROVE_CHECKIN);
  assert.equal(triage.red_flag_queue[1].primary_action, QUICK_ACTIONS.TRIGGER_DELOAD);
  assert.equal(triage.red_flag_queue[2].primary_action, QUICK_ACTIONS.DISPATCH_WHATSAPP);
});

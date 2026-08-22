import test from 'node:test';
import assert from 'node:assert/strict';

import {
  freezeSubscription,
  resumeSubscription,
  setSubscriptionTrack,
  applyInjuryShiftProtocol,
  evaluateReEntryProtocol,
  MAX_FREEZE_DAYS_PER_CYCLE,
  SUBSCRIPTION_TRACKS,
  RE_ENTRY_TRAINING_STATUS
} from '../src/execution-engines/subscription-flexibility-engine.js';

test('1. Subscription Flexibility - Freeze Shifts End Date and Upcoming Check-ins', () => {
  const checkins = [
    { week_number: 1, due_date: '2026-08-10' }, // Past
    { week_number: 2, due_date: '2026-09-01' }, // Future
    { week_number: 3, due_date: '2026-09-08' }  // Future
  ];

  const result = freezeSubscription({
    client_id: '101',
    client_name: 'سارة المنصوري',
    phone_number: '01011111110',
    freeze_days: 10,
    reason: 'سفر مفاجئ لظروف العمل',
    current_end_date: new Date('2026-11-20'),
    scheduled_checkins: checkins,
    total_frozen_days_used: 0
  });

  assert.equal(result.new_status, 'FROZEN');
  assert.equal(result.freeze_record.freeze_days, 10);
  assert.equal(result.freeze_record.remaining_freeze_days, 11);
  assert.equal(result.updated_end_date, '2026-11-30'); // +10 days
  assert.ok(result.whatsapp_message_ar.includes('10 أيام'));
  assert.ok(result.whatsapp_dispatch_url.includes('https://wa.me/201011111110'));
});

test('2. Subscription Flexibility - Rejects Freeze Exceeding 21-Day Cycle Cap', () => {
  assert.throws(() => {
    freezeSubscription({
      freeze_days: 15,
      total_frozen_days_used: 10 // 10 + 15 = 25 > 21
    });
  }, /تجاوز الحد الأقصى للتجميد/);
});

test('3. Subscription Flexibility - Early Resume Credits Back Unused Days', () => {
  const result = resumeSubscription({
    client_id: '101',
    client_name: 'سارة المنصوري',
    phone_number: '01011111110',
    freeze_start_date: new Date('2026-08-20'),
    actual_resume_date: new Date('2026-08-25'), // 5 days used out of 14
    current_end_date: new Date('2026-12-14'),
    planned_freeze_days: 14
  });

  assert.equal(result.new_status, 'ACTIVE');
  assert.equal(result.actual_days_frozen, 5);
  assert.equal(result.unused_freeze_days_credited_back, 9);
  assert.equal(result.final_subscription_end_date, '2026-12-05'); // Pulled back 9 days
});

test('4. Track Decoupling - NUTRITION_ONLY Sets Sedentary Calorie Adjustment', () => {
  const result = setSubscriptionTrack({
    client_id: '101',
    track_type: SUBSCRIPTION_TRACKS.NUTRITION_ONLY,
    bmr_kcal: 1600,
    current_daily_calories: 2100
  });

  assert.equal(result.subscription_track, 'NUTRITION_ONLY');
  assert.equal(result.adjusted_calories, 2000); // 1.25 * 1600
  assert.equal(result.is_workout_active, false);
  assert.equal(result.is_nutrition_active, true);
});

test('5. Injury Shift Protocol - Enforces Maintenance Calories & High Protein Muscle Guard', () => {
  const result = applyInjuryShiftProtocol({
    client_id: '101',
    client_name: 'سارة',
    injury_type: 'KNEE_SPRAIN',
    affected_joint: 'الركبة اليمنى',
    body_weight_kg: 70,
    base_calories: 1700
  });

  assert.equal(result.nutrition_adjustments.target_calories, 2050); // Maintenance
  assert.equal(result.nutrition_adjustments.target_protein_g, 147); // 70 * 2.1
  assert.equal(result.nutrition_adjustments.protein_ratio_g_per_kg, 2.1);
  assert.ok(result.supplement_protocol.some(s => s.supplement.includes('Collagen')));
  assert.ok(result.supplement_protocol.some(s => s.supplement.includes('Omega-3')));
});

test('6. Re-Entry Protocol - Sedentary Freeze Activates Neural Ramp-Up Week & Fluid Reset', () => {
  const reEntry = evaluateReEntryProtocol({
    client_id: '101',
    client_name: 'سارة المنصوري',
    phone_number: '01011111110',
    pre_freeze_weight_kg: 75.0,
    current_weight_kg: 77.0, // +2.0 kg fluid gain
    training_status_during_freeze: RE_ENTRY_TRAINING_STATUS.COMPLETE_SEDENTARY_REST,
    base_calories: 1800
  });

  assert.equal(reEntry.workout_protocol.path, 'NEURAL_RAMP_UP_WEEK');
  assert.equal(reEntry.workout_protocol.ramp_up_needed, true);
  assert.equal(reEntry.workout_protocol.volume_reduction_percent, 35);
  assert.equal(reEntry.workout_protocol.target_rir, '3-4 RIR');
  assert.equal(reEntry.nutrition_protocol.phase, 'MAINTENANCE_FLUID_RESET');
  assert.equal(reEntry.nutrition_protocol.target_calories, 2100);
  assert.ok(reEntry.welcome_back_script_ar.includes('سارة المنصوري'));
});

test('7. Re-Entry Protocol - Trainee with Independent Training Skips Ramp-Up', () => {
  const reEntry = evaluateReEntryProtocol({
    client_id: '102',
    client_name: 'طارق',
    pre_freeze_weight_kg: 85.0,
    current_weight_kg: 85.2,
    training_status_during_freeze: RE_ENTRY_TRAINING_STATUS.TRAINED_INDEPENDENTLY,
    base_calories: 2200
  });

  assert.equal(reEntry.workout_protocol.path, 'IMMEDIATE_FULL_LOAD');
  assert.equal(reEntry.workout_protocol.ramp_up_needed, false);
  assert.equal(reEntry.workout_protocol.target_rir, '1-2 RIR');
  assert.equal(reEntry.nutrition_protocol.phase, 'RESUME_PRIMARY_DEFICIT');
});

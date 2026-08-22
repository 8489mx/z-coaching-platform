import test from 'node:test';
import assert from 'node:assert/strict';

import * as Engines from '../src/execution-engines/index.js';
import {
  evaluateClientDailyState,
  ORCHESTRATOR_EVENT_TYPES
} from '../src/execution-engines/index.js';

test('1. Master Barrel Export - Validates Complete Unified Registry Availability', () => {
  // Clinical & Pharmacological
  assert.equal(typeof Engines.auditGeneratedPlan, 'function');
  assert.equal(typeof Engines.evaluatePharmacologicalFirewall, 'function');
  assert.equal(typeof Engines.evaluateBiochemicalSynergies, 'function');

  // Nutrition & Metabolism
  assert.equal(typeof Engines.calculateDynamicFoodSwap, 'function');
  assert.equal(typeof Engines.calculateDailyCarbCycling, 'function');
  assert.equal(typeof Engines.calculateMpsLeucinePartitioning, 'function');
  assert.equal(typeof Engines.evaluateMatadorRefeedStrategy, 'function');
  assert.equal(typeof Engines.convertPortionCookingYield, 'function');
  assert.equal(typeof Engines.calculateReverseDietingStep, 'function');

  // Training & Biomechanics
  assert.equal(typeof Engines.evaluateDoubleProgression, 'function');
  assert.equal(typeof Engines.getTorqueMatchedSwaps, 'function');
  assert.equal(typeof Engines.evaluateCardioInterferenceDecoupling, 'function');
  assert.equal(typeof Engines.calculateBarbellPlates, 'function');
  assert.equal(typeof Engines.generateScientificRampWarmup, 'function');
  assert.equal(typeof Engines.generateTendonRehabProtocol, 'function');

  // Physiological & Buffers
  assert.equal(typeof Engines.evaluateFemaleCycleBuffer, 'function');
  assert.equal(typeof Engines.getCaffeineCutoffTime, 'function');
  assert.equal(typeof Engines.calculateDailyHydrationTarget, 'function');
  assert.equal(typeof Engines.calculateNeatTitrationStep, 'function');

  // Subscription & Lifecycle
  assert.equal(typeof Engines.freezeSubscription, 'function');
  assert.equal(typeof Engines.activateClientProgram, 'function');
  assert.equal(typeof Engines.evaluateClientRenewalEligibility, 'function');

  // Core Orchestrator
  assert.equal(typeof Engines.evaluateClientDailyState, 'function');
});

test('2. Core Orchestrator - Routes Weekly Check-In Event Successfully', () => {
  const clientProfile = {
    id: 'c101',
    name: 'سارة المنصوري',
    is_female: true,
    has_pcos: true,
    baseline_biomarkers: { hba1c_percent: 5.9, vitamin_d3_ng_ml: 22 }
  };

  const payload = {
    event_type: ORCHESTRATOR_EVENT_TYPES.WEEKLY_CHECKIN,
    current_week: 10,
    is_pms_active: true,
    weight_delta_kg: 1.2,
    adherence_score: 92,
    current_calories: 1600,
    consecutive_training_weeks: 6,
    consecutive_deficit_weeks: 8,
    current_daily_steps: 12000,
    current_weekly_cardio_sessions: 0
  };

  const state = evaluateClientDailyState(clientProfile, payload);

  assert.equal(state.status, 'PROCESSED_SUCCESSFULLY');
  assert.equal(state.client_id, 'c101');
  assert.equal(state.female_cycle_gate.deficit_adjustment_locked, true);
  assert.equal(state.lab_retest_trigger.trigger_retest_alert, true);
  assert.equal(state.auto_deload_evaluation.is_deload_active, true);
  assert.equal(state.matador_refeed_strategy.protocol_type, 'MATADOR_1_WEEK_BLOCK');
  assert.equal(state.neat_titration.hierarchy_level, 'LEVEL_2_ZONE2_CARDIO');
});

test('3. Core Orchestrator - Routes Workout Session Event Successfully', () => {
  const clientProfile = {
    id: 'c102',
    name: 'أحمد كمال',
    age: 28
  };

  const payload = {
    event_type: ORCHESTRATOR_EVENT_TYPES.WORKOUT_SESSION,
    exercise_name: 'Barbell Bench Press',
    working_weight_kg: 100,
    split_type: 'UPPER_BODY',
    cardio_type: 'ZONE_2_STEADY_STATE',
    resistance_session_time: '17:00',
    cardio_session_time: '18:00',
    is_fatigue_mode_requested: true,
    workout_session: {
      exercises: [
        { id: 'e1', name: 'Barbell Bench Press', isCompound: true, sets: [ { id: 1 }, { id: 2 }, { id: 3 } ] },
        { id: 'e2', name: 'Triceps Pushdown', isCompound: false, sets: [ { id: 1 }, { id: 2 }, { id: 3 } ] }
      ]
    }
  };

  const state = evaluateClientDailyState(clientProfile, payload);

  assert.equal(state.status, 'PROCESSED_SUCCESSFULLY');
  assert.equal(state.scientific_ramp_warmup.ramp_protocol.potentiate.bar_sets.length, 3);
  assert.deepEqual(state.barbell_plate_loading.plates_per_side, [20, 20]);
  assert.equal(state.cardio_interference_decoupling.is_decoupled, true);
  assert.equal(state.processed_workout_session.is_fatigue_mode_active, true);
  assert.equal(state.processed_workout_session.exercises[1].sets.length, 2); // Reduced by 1 set
});

test('4. Core Orchestrator - Routes Food Swap and Drug Firewall Event Successfully', () => {
  const clientProfile = {
    id: 'c103',
    name: 'منى',
    medications: ['Eltroxin 100mcg']
  };

  const payload = {
    event_type: ORCHESTRATOR_EVENT_TYPES.FOOD_SWAP,
    food_code: 'CHICKEN_BREAST',
    amount_g: 150,
    from_state: 'COOKED',
    to_state: 'RAW',
    supplements: ['Vitamin D3 5000 IU', 'Gentle Iron'],
    meal_fat_g: 8
  };

  const state = evaluateClientDailyState(clientProfile, payload);

  assert.equal(state.status, 'PROCESSED_SUCCESSFULLY');
  assert.equal(state.cooking_yield_conversion.converted_amount_g, 200); // 150 / 0.75
  assert.equal(state.pharmacological_firewall.has_active_drug_rules, true);
  assert.equal(state.biochemical_synergy_and_fallbacks.co_factor_synergies.length, 2);
});

test('5. Core Orchestrator - Routes Subscription Flexibility Event Successfully', () => {
  const clientProfile = {
    id: 'c104',
    name: 'عمر',
    subscription_days_total: 112,
    days_elapsed: 30,
    total_frozen_days_used: 0
  };

  const payload = {
    event_type: ORCHESTRATOR_EVENT_TYPES.SUBSCRIPTION_FLEX,
    action: 'FREEZE',
    freeze_days: 14
  };

  const state = evaluateClientDailyState(clientProfile, payload);

  assert.equal(state.status, 'PROCESSED_SUCCESSFULLY');
  assert.equal(state.subscription_flexibility_result.success, true);
  assert.equal(state.subscription_flexibility_result.freeze_record.freeze_days, 14);
});

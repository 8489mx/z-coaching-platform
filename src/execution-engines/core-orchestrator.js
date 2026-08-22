/**
 * Unified Core Orchestrator Gateway (ZCoachingCore Orchestrator)
 *
 * Coordinates and routes client events across all deterministic clinical,
 * metabolic, biomechanical, and subscription engines.
 */

import { evaluatePharmacologicalFirewall } from './drug-interaction-firewall.js';
import { evaluateBiochemicalSynergies } from './biochemical-synergy-engine.js';
import { calculateDailyCarbCycling } from './carb-cycling-engine.js';
import { calculateMpsLeucinePartitioning } from './mps-leucine-engine.js';
import { evaluateMatadorRefeedStrategy } from './matador-refeed-engine.js';
import { filterLowFodmapOptions, evaluateChronicGiDistress } from './gut-health-engine.js';
import { convertPortionCookingYield, generateWeeklyGroceryList } from './kitchen-yield-engine.js';
import { calculateReverseDietingStep } from './reverse-dieting-engine.js';
import { evaluateDoubleProgression, evaluateAutoDeloadRequirement } from './progressive-overload-engine.js';
import { getTorqueMatchedSwaps, applyFatigueModeReduction } from './biomechanical-swap-engine.js';
import { evaluateCardioInterferenceDecoupling } from './cardio-interference-engine.js';
import { calculateNeuralWarmupRamp, calculateBarbellPlates, getPassiveWarmupCueCard, generateScientificRampWarmup } from './warmup-plate-engine.js';
import { generateTendonRehabProtocol } from './tendon-kinetics-engine.js';
import { evaluateFemaleCycleBuffer } from './female-cycle-buffer-engine.js';
import { getCaffeineCutoffTime, evaluateLabReTestTrigger } from './circadian-lab-trigger-engine.js';
import { calculateDailyHydrationTarget } from './hydration-sweat-engine.js';
import { calculateNeatTitrationStep } from './neat-titration-engine.js';
import { freezeSubscription, resumeSubscription, setSubscriptionTrack, evaluateReEntryProtocol } from './subscription-flexibility-engine.js';
import { auditGeneratedPlan } from './clinical-audit-engine.js';

export const ORCHESTRATOR_EVENT_TYPES = {
  WEEKLY_CHECKIN: 'WEEKLY_CHECKIN',
  WORKOUT_SESSION: 'WORKOUT_SESSION',
  FOOD_SWAP: 'FOOD_SWAP',
  SUBSCRIPTION_FLEX: 'SUBSCRIPTION_FLEX'
};

/**
 * Master entry point to evaluate client daily state deterministically.
 */
export function evaluateClientDailyState(clientProfile = {}, contextPayload = {}) {
  const eventType = contextPayload.event_type || ORCHESTRATOR_EVENT_TYPES.WEEKLY_CHECKIN;
  const timestamp = contextPayload.timestamp || new Date().toISOString();

  const baseResult = {
    client_id: clientProfile.id || '1',
    client_name: clientProfile.name || 'مشترك المنظومة',
    event_type: eventType,
    evaluated_at: timestamp,
    status: 'PROCESSED_SUCCESSFULLY'
  };

  // 1. WEEKLY CHECKIN ROUTING
  if (eventType === ORCHESTRATOR_EVENT_TYPES.WEEKLY_CHECKIN) {
    const femaleGate = evaluateFemaleCycleBuffer({
      is_female: Boolean(clientProfile.is_female),
      cycle_phase: contextPayload.cycle_phase,
      approximate_next_period_date: contextPayload.approximate_next_period_date,
      is_pms_active: Boolean(contextPayload.is_pms_active),
      weight_delta_kg: contextPayload.weight_delta_kg || 0,
      adherence_score: contextPayload.adherence_score || 90,
      current_calories: contextPayload.current_calories || 1800,
      has_pcos: Boolean(clientProfile.has_pcos)
    });

    const labTrigger = evaluateLabReTestTrigger({
      client_id: clientProfile.id,
      client_name: clientProfile.name,
      current_week: contextPayload.current_week || 1,
      baseline_biomarkers: clientProfile.baseline_biomarkers || {}
    });

    const deloadCheck = evaluateAutoDeloadRequirement({
      consecutive_training_weeks: contextPayload.consecutive_training_weeks || 1,
      consecutive_performance_drop_weeks: contextPayload.consecutive_performance_drop_weeks || 0,
      joint_ache_flag: Boolean(contextPayload.joint_ache_flag)
    });

    const matadorCheck = evaluateMatadorRefeedStrategy({
      consecutive_deficit_weeks: contextPayload.consecutive_deficit_weeks || 1,
      baseline_calories: contextPayload.current_calories || 1800,
      baseline_carbs_g: contextPayload.current_carbs_g || 180,
      baseline_protein_g: contextPayload.current_protein_g || 150,
      baseline_fat_g: contextPayload.current_fat_g || 45
    });

    const neatCheck = calculateNeatTitrationStep({
      current_daily_steps: contextPayload.current_daily_steps || 7500,
      current_weekly_cardio_sessions: contextPayload.current_weekly_cardio_sessions || 0,
      current_daily_calories: contextPayload.current_calories || 1800
    });

    return {
      ...baseResult,
      female_cycle_gate: femaleGate,
      lab_retest_trigger: labTrigger,
      auto_deload_evaluation: deloadCheck,
      matador_refeed_strategy: matadorCheck,
      neat_titration: neatCheck
    };
  }

  // 2. WORKOUT SESSION ROUTING
  if (eventType === ORCHESTRATOR_EVENT_TYPES.WORKOUT_SESSION) {
    const exerciseName = contextPayload.exercise_name || 'Barbell Squat';
    const workingWeight = contextPayload.working_weight_kg || 100;
    const splitType = contextPayload.split_type || 'UPPER_BODY';

    const rampWarmup = generateScientificRampWarmup({
      working_weight_kg: workingWeight,
      split_type: splitType
    });

    const plates = calculateBarbellPlates({
      target_weight_kg: workingWeight
    });

    const cardioDecouple = evaluateCardioInterferenceDecoupling({
      age: clientProfile.age || 28,
      cardio_type: contextPayload.cardio_type,
      resistance_session_time: contextPayload.resistance_session_time || '17:00',
      cardio_session_time: contextPayload.cardio_session_time || '18:00',
      is_same_day: contextPayload.is_same_day !== false
    });

    let processedWorkout = contextPayload.workout_session || null;
    if (contextPayload.is_fatigue_mode_requested && processedWorkout) {
      processedWorkout = applyFatigueModeReduction(processedWorkout);
    }

    return {
      ...baseResult,
      scientific_ramp_warmup: rampWarmup,
      barbell_plate_loading: plates,
      cardio_interference_decoupling: cardioDecouple,
      processed_workout_session: processedWorkout
    };
  }

  // 3. FOOD SWAP & NUTRITION ROUTING
  if (eventType === ORCHESTRATOR_EVENT_TYPES.FOOD_SWAP) {
    const yieldConversion = convertPortionCookingYield({
      food_code: contextPayload.food_code || 'CHICKEN_BREAST',
      amount_g: contextPayload.amount_g || 150,
      from_state: contextPayload.from_state || 'COOKED',
      to_state: contextPayload.to_state || 'RAW'
    });

    const drugFirewall = evaluatePharmacologicalFirewall(clientProfile.medications || []);
    const synergy = evaluateBiochemicalSynergies({
      prescribed_supplements: contextPayload.supplements || [],
      meal_fat_grams: contextPayload.meal_fat_g || 10
    });

    return {
      ...baseResult,
      cooking_yield_conversion: yieldConversion,
      pharmacological_firewall: drugFirewall,
      biochemical_synergy_and_fallbacks: synergy
    };
  }

  // 4. SUBSCRIPTION FLEXIBILITY ROUTING
  if (eventType === ORCHESTRATOR_EVENT_TYPES.SUBSCRIPTION_FLEX) {
    let flexResult = null;
    if (contextPayload.action === 'FREEZE') {
      flexResult = freezeSubscription({
        client_id: clientProfile.id || '1',
        client_name: clientProfile.name || 'مشترك',
        freeze_days: contextPayload.freeze_days || 14,
        total_frozen_days_used: clientProfile.total_frozen_days_used || 0
      });
    } else if (contextPayload.action === 'REENTRY_RAMPUP') {
      flexResult = evaluateReEntryProtocol({
        freeze_days: contextPayload.freeze_days || 14
      });
    }

    return {
      ...baseResult,
      subscription_flexibility_result: flexResult
    };
  }

  return baseResult;
}

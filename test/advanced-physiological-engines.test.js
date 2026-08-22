import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateDailyCarbCycling,
  DAY_TYPES,
  getCaffeineCutoffTime,
  evaluateLabReTestTrigger,
  evaluateFemaleCycleBuffer,
  CYCLE_PHASES,
  filterLowFodmapOptions,
  evaluateChronicGiDistress
} from '../src/execution-engines/index.js';

test('1. Carb Cycling - Heavy Day +20% Carbs, Rest Day -20% Carbs, Weekly Average Calorie Balance Preserved', () => {
  const result = calculateDailyCarbCycling({
    baseline_daily_calories: 2000,
    baseline_protein_g: 150,
    baseline_carbs_g: 220,
    baseline_fat_g: 58
  });

  assert.equal(result.weekly_summary.is_calorie_balanced, true);

  const heavyDay = result.weekly_breakdown.find(d => d.day_type === DAY_TYPES.HEAVY_TRAINING);
  const restDay = result.weekly_breakdown.find(d => d.day_type === DAY_TYPES.REST_DAY);
  const modDay = result.weekly_breakdown.find(d => d.day_type === DAY_TYPES.MODERATE_TRAINING);

  assert.ok(heavyDay.carbs_g > modDay.carbs_g);
  assert.ok(restDay.carbs_g < modDay.carbs_g);
  assert.equal(heavyDay.protein_g, 150);
  assert.equal(restDay.protein_g, 150);
});

test('2. Circadian Engine - 8-Hour Prior Caffeine Cutoff Exact Calculation', () => {
  const cutoff1 = getCaffeineCutoffTime("23:00");
  assert.equal(cutoff1.caffeine_cutoff_24h, "15:00");
  assert.equal(cutoff1.buffer_hours, 8);

  const cutoff2 = getCaffeineCutoffTime("00:30");
  assert.equal(cutoff2.caffeine_cutoff_24h, "16:30");
});

test('3. Lab Trigger Engine - Schedules Week 10 Re-Test Alert for Baseline Abnormalities', () => {
  const retestAlert = evaluateLabReTestTrigger({
    client_name: 'سارة المنصوري',
    current_week: 10,
    baseline_biomarkers: {
      hba1c_percent: 6.1, // Prediabetes flag
      vitamin_d3_ng_ml: 19 // Deficient
    }
  });

  assert.equal(retestAlert.trigger_retest_alert, true);
  assert.equal(retestAlert.monitored_markers_count, 2);
  assert.ok(retestAlert.coach_alert_ar.includes('الأسبوع 10'));
});

test('4. Female Luteal Buffer Gate - Locks Calorie Reduction During Pre-Menstrual Fluid Retention', () => {
  const lutealResult = evaluateFemaleCycleBuffer({
    is_female: true,
    cycle_phase: CYCLE_PHASES.LUTEAL,
    weight_delta_kg: 1.4, // +1.4 kg normal fluid gain
    adherence_score: 95,
    current_calories: 1650
  });

  assert.equal(lutealResult.deficit_adjustment_locked, true);
  assert.equal(lutealResult.locked_calories_target, 1650);
  assert.ok(lutealResult.prohibited_actions.includes('حظر خفض السعرات الحرارية اليومية'));
  assert.ok(lutealResult.micro_adjustments.recommended_supplement.includes('Magnesium'));
});

test('5. Female Luteal Buffer Gate - Allows Standard Evaluation for Non-Luteal Phase or Males', () => {
  const maleResult = evaluateFemaleCycleBuffer({
    is_female: false,
    cycle_phase: CYCLE_PHASES.LUTEAL
  });
  assert.equal(maleResult.deficit_adjustment_locked, false);

  const follicularResult = evaluateFemaleCycleBuffer({
    is_female: true,
    cycle_phase: CYCLE_PHASES.FOLLICULAR,
    weight_delta_kg: 1.4,
    adherence_score: 95
  });
  assert.equal(follicularResult.deficit_adjustment_locked, false);
});

test('6. Gut Health Filter - Filters Out High-FODMAP Foods and Triggers Chronic GI Red Flags', () => {
  const foods = ['BASMATI_RICE_COOKED', 'FAVA_BEANS', 'BROCCOLI_RAW', 'CHICKEN_BREAST'];
  const filtered = filterLowFodmapOptions(foods, true);

  assert.equal(filtered.includes('FAVA_BEANS'), false);
  assert.equal(filtered.includes('BROCCOLI_RAW'), false);
  assert.equal(filtered.includes('BASMATI_RICE_COOKED'), true);
  assert.equal(filtered.includes('CHICKEN_BREAST'), true);

  const chronicGi = evaluateChronicGiDistress({
    client_name: 'طارق',
    consecutive_gi_distress_weeks: 2,
    gi_distress_score_0_to_10: 8
  });

  assert.equal(chronicGi.is_chronic_distress, true);
  assert.ok(chronicGi.coach_red_flag.title_ar.includes('اضطراب هضمي مزمن'));
  assert.equal(chronicGi.clinical_protocol.dietary_intervention, 'Strict Low-FODMAP Diet for 14 Days');
});

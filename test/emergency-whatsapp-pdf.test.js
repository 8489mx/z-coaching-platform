import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyEmergencyScenarioAdaptation,
  TRAVEL_EQUIPMENT_TYPES
} from '../src/execution-engines/emergency-scenario-engine.js';

import {
  generateMasterPdfExportData
} from '../src/execution-engines/pdf-export-engine.js';

test('1. Emergency Scenario Engine - Travel Mode with Hotel Limited Gym Converts Exercises', () => {
  const exercises = [
    { code: 'BARBELL_BENCH_PRESS', name: 'Barbell Bench Press' },
    { code: 'LAT_PULLDOWN_MACHINE', name: 'Lat Pulldown Machine' }
  ];

  const result = applyEmergencyScenarioAdaptation({
    scenario_type: 'TRAVEL',
    equipment_tier: TRAVEL_EQUIPMENT_TYPES.HOTEL_LIMITED_GYM,
    base_calories: 2000,
    base_protein_g: 160,
    exercises
  });

  assert.equal(result.scenario_applied, 'TRAVEL_MODE');
  assert.equal(result.nutrition_adjustment.target_calories, 2300); // Maintenance shift
  assert.equal(result.training_adjustment.adapted_exercises.length, 2);
  assert.ok(result.training_adjustment.adapted_exercises[0].name.includes('دمبل'));
  assert.ok(result.nutrition_adjustment.fast_food_rules_ar.length > 0);
});

test('2. Emergency Scenario Engine - Travel Mode with No Gym (Room Workout) Enforces Tempo Control', () => {
  const exercises = [
    { code: 'BARBELL_BACK_SQUAT', name: 'Barbell Back Squat' }
  ];

  const result = applyEmergencyScenarioAdaptation({
    scenario_type: 'TRAVEL',
    equipment_tier: TRAVEL_EQUIPMENT_TYPES.NO_GYM_ROOM,
    exercises
  });

  assert.equal(result.scenario_applied, 'TRAVEL_MODE');
  assert.ok(result.training_adjustment.adapted_exercises[0].name.includes('وزن الجسم'));
  assert.equal(result.training_adjustment.tempo_focus, '3-1-1 (تحكم سلبي لتعويض غياب الأوزان)');
});

test('3. Emergency Scenario Engine - Sickness Mode Pauses Resistance & Boosts Hydration', () => {
  const result = applyEmergencyScenarioAdaptation({
    scenario_type: 'SICKNESS',
    base_calories: 1800,
    base_protein_g: 150,
    base_daily_water_liters: 3.0
  });

  assert.equal(result.scenario_applied, 'SICKNESS_RECOVERY_MODE');
  assert.equal(result.training_adjustment.is_resistance_paused, true);
  assert.equal(result.nutrition_adjustment.target_water_liters, 4.0);
  assert.ok(result.nutrition_adjustment.immune_protocol_ar.some(i => i.includes('فيتامين C')));
});

test('4. Emergency Scenario Engine - High-Stress Mode Condenses to 2 Time-Efficient Sessions', () => {
  const result = applyEmergencyScenarioAdaptation({
    scenario_type: 'HIGH_STRESS',
    base_calories: 2000
  });

  assert.equal(result.scenario_applied, 'HIGH_STRESS_EXAM_MODE');
  assert.equal(result.training_adjustment.condensed_sessions_count, 2);
  assert.equal(result.training_adjustment.session_duration_minutes, 35);
});

test('6. Master PDF Exporter Engine - Generates Branded 4K Structure with Video QR Codes', () => {
  const pdfData = generateMasterPdfExportData({
    client_name: 'سارة المنصوري',
    client_code: '1',
    package_tier: 'MAX_VIP',
    current_week: 3
  });

  assert.equal(pdfData.branding.platform, 'Z Coaching Platform');
  assert.equal(pdfData.client.name, 'سارة المنصوري');
  assert.ok(pdfData.training.sessions.length > 0);

  const firstEx = pdfData.training.sessions[0].exercises[0];
  assert.ok(firstEx.qr_code_url && firstEx.qr_code_url.includes('qrserver.com'));
});

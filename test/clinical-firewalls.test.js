import test from 'node:test';
import assert from 'node:assert/strict';

import { 
  evaluateInsulinSafety, 
  evaluatePharmacologicalFirewall,
  evaluateMasterClinicalProfile 
} from '../src/execution-engines/drug-interaction-firewall.js';
import { generateInitialPlan } from '../src/execution-engines/onboarding-plan-generator-engine.js';

test('Clinical Safety Firewalls - Stacked Multi-Condition Suite', async (t) => {

  await t.test('1. Detects insulin therapy and enforces carb floor & safety cues', () => {
    const result = evaluateInsulinSafety(['Lantus', 'Novorapid']);
    assert.equal(result.requires_insulin_protocol, true);
    assert.equal(result.carb_floor_grams, 130);
    assert.equal(result.lock_keto, true);
    assert.equal(result.safety_cues_ar.length, 3);
    assert.ok(result.safety_cues_ar[0].includes('قاعدة 15-15'));
  });

  await t.test('2. Stacked conditions without conflict (Insulin + Hypertension + Renal + Lower Back)', () => {
    const result = evaluateMasterClinicalProfile({
      medicalConditions: ['TYPE_1_DIABETES', 'HYPERTENSION', 'RENAL_INSUFFICIENCY', 'LOWER_BACK_PAIN'],
      weightKg: 80,
      targetCalories: 2200,
      targetProteinGrams: 176,
      targetCarbGrams: 120,
      targetFatGrams: 60
    });

    assert.equal(result.carbGrams, 130);
    assert.equal(result.proteinGrams, 88);
    assert.ok(result.prohibitedSupplements.includes('CREATINE'));
    assert.ok(result.prohibitedSupplements.includes('HIGH_STIM_PREWORKOUT'));
    assert.ok(result.biomechanicalRestrictions.includes('NO_VALSALVA_MANEUVER'));
    assert.ok(result.biomechanicalRestrictions.includes('NO_AXIAL_LOADING_SQUAT_DEADLIFT'));
  });

  await t.test('3. Lactation calorie boost and GLP-1 protein escalation', () => {
    const result = evaluateMasterClinicalProfile({
      medicalConditions: ['LACTATION', 'GLP1_USER'],
      weightKg: 70,
      targetCalories: 1800,
      targetProteinGrams: 140,
      targetCarbGrams: 150,
      targetFatGrams: 50
    });

    assert.equal(result.calories, 2250);
    assert.ok(result.biomechanicalRestrictions.includes('NO_INTRA_ABDOMINAL_CRUNCHES'));
    assert.equal(result.proteinGrams, 161);
  });

});

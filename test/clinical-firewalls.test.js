import test from 'node:test';
import assert from 'node:assert/strict';

import { 
  evaluateInsulinSafety, 
  evaluatePharmacologicalFirewall,
  evaluateMasterClinicalProfile 
} from '../src/execution-engines/drug-interaction-firewall.js';

test('Clinical Safety Firewalls - 22-Condition Stacked Suite', async (t) => {

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

  await t.test('3. Evaluates bariatric surgery, blood thinners, gout, and asthma protocols', () => {
    const result = evaluateMasterClinicalProfile({
      medicalConditions: ['BARIATRIC_SURGERY', 'BLOOD_THINNERS', 'GOUT', 'BRONCHIAL_ASTHMA'],
      weightKg: 90,
      targetCalories: 1800,
      targetProteinGrams: 120,
      targetCarbGrams: 180,
      targetFatGrams: 50
    });

    assert.equal(result.proteinGrams, 162);
    assert.ok(result.prohibitedSupplements.includes('HIGH_DOSE_VITAMIN_E'));
    assert.ok(result.prohibitedSupplements.includes('GINKGO_BILOBA'));
    assert.ok(result.prohibitedSupplements.includes('HIGH_PURINE_EXTRACTS'));
    assert.ok(result.safetyCues.some(c => c.includes('بخاخ الربو')));
    assert.ok(result.safetyCues.some(c => c.includes('فصل السوائل')));
  });

  await t.test('4. Evaluates roaccutane, hernia, gerd, and lactation protocols', () => {
    const result = evaluateMasterClinicalProfile({
      medicalConditions: ['ROACCUTANE_USER', 'HERNIA_VARICOSE', 'GERD_REFLUX', 'LACTATION'],
      weightKg: 65,
      targetCalories: 1700,
      targetProteinGrams: 130,
      targetCarbGrams: 160,
      targetFatGrams: 50
    });

    assert.equal(result.calories, 2150);
    assert.ok(result.prohibitedSupplements.includes('VITAMIN_A'));
    assert.ok(result.biomechanicalRestrictions.includes('NO_HEAVY_LEG_PRESS_HIGH_IAP'));
    assert.ok(result.biomechanicalRestrictions.includes('NO_INVERTED_EXERCISES_DECLINE_BENCH'));
    assert.ok(result.biomechanicalRestrictions.includes('NO_INTRA_ABDOMINAL_CRUNCHES'));
  });

});

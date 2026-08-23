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

  await t.test('2. Hypothyroidism & fatty liver steps escalation & simple fructose restriction', () => {
    const result = evaluateMasterClinicalProfile({
      medicalConditions: ['HYPOTHYROIDISM', 'FATTY_LIVER'],
      weightKg: 80,
      targetCalories: 2000
    });

    assert.equal(result.calories, 1800);
    assert.equal(result.cardioProtocol.dailySteps, 10000);
    assert.ok(result.prescribedNutrients.includes('ZERO_SIMPLE_FRUCTOSE'));
  });

  await t.test('3. Evaluates bariatric surgery, gout, blood thinners, and asthma protocols', () => {
    const result = evaluateMasterClinicalProfile({
      medicalConditions: ['BARIATRIC_SURGERY', 'BLOOD_THINNERS', 'GOUT', 'BRONCHIAL_ASTHMA'],
      weightKg: 90,
      targetCalories: 1800,
      targetProteinGrams: 120,
      targetCarbGrams: 180,
      targetFatGrams: 50,
      waterLiters: 3.0
    });

    assert.equal(result.proteinGrams, 180);
    assert.ok(result.prescribedNutrients.includes('WHEY_ISOLATE_FLUID_SEPARATION'));
    assert.equal(result.waterLiters, 4.0);
    assert.ok(result.prescribedNutrients.includes('LOW_PURINE_PROTEIN_SOURCES'));
    assert.ok(result.prohibitedSupplements.includes('HIGH_DOSE_OMEGA3_OVER_2000MG'));
    assert.ok(result.biomechanicalRestrictions.includes('NO_HEAVY_CONTACT_TRAINING'));
    assert.equal(result.cardioProtocol.type, 'GRADUAL_LISS');
    assert.ok(result.biomechanicalRestrictions.includes('EXTENDED_DYNAMIC_WARMUP_15MIN'));
  });

  await t.test('4. Evaluates roaccutane, hernia, patellar tendinitis, corticosteroids, and lactation protocols', () => {
    const result = evaluateMasterClinicalProfile({
      medicalConditions: ['ROACCUTANE_USER', 'HERNIA_VARICOSE', 'PATELLAR_TENDINITIS', 'CORTICOSTEROIDS', 'LACTATION'],
      weightKg: 65,
      targetCalories: 1700,
      targetProteinGrams: 130,
      targetCarbGrams: 160,
      targetFatGrams: 50
    });

    assert.equal(result.calories, 2150);
    assert.equal(result.proteinGrams, 150);
    assert.ok(result.prescribedNutrients.includes('LOW_SODIUM_HIGH_CALCIUM'));
    assert.ok(result.prohibitedSupplements.includes('VITAMIN_A'));
    assert.ok(result.biomechanicalRestrictions.includes('NO_VALSALVA_HEAVY_LEG_PRESS'));
    assert.ok(result.biomechanicalRestrictions.includes('NO_OPEN_CHAIN_LEG_EXTENSIONS'));
    assert.equal(result.cardioProtocol.equipment, 'RECUMBENT_BIKE');
  });

});

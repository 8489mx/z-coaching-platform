import test from 'node:test';
import assert from 'node:assert/strict';

import { evaluateMasterClinicalProfile } from '../src/execution-engines/drug-interaction-firewall.js';

test('Clinical Firewalls & Pharmacological Matrix Suite', async (t) => {

  await t.test('1. Enforces carb floor and 15-15 rule for insulin users', () => {
    const profile = evaluateMasterClinicalProfile({
      medicalConditions: ['TYPE_1_DIABETES'],
      targetCalories: 2000,
      targetProteinGrams: 150,
      targetCarbGrams: 100,
      targetFatGrams: 60
    });

    assert.ok(profile.carbGrams >= 130);
    assert.ok(profile.safetyCues.some(c => c.includes('15-15')));
  });

  await t.test('2. Adjusts calories and steps for hypothyroidism', () => {
    const profile = evaluateMasterClinicalProfile({
      medicalConditions: ['HYPOTHYROIDISM'],
      targetCalories: 2000,
      targetProteinGrams: 150,
      targetCarbGrams: 200,
      targetFatGrams: 60
    });

    assert.equal(profile.calories, 1800);
    assert.equal(profile.cardioProtocol.dailySteps, 10000);
  });

  await t.test('3. Handles rare conditions: celiac, osteoporosis, and g6pd deficiency', () => {
    const profile = evaluateMasterClinicalProfile({
      medicalConditions: ['CELIAC_DISEASE', 'OSTEOPOROSIS', 'G6PD_DEFICIENCY'],
      targetCalories: 2000
    });

    assert.ok(profile.prescribedNutrients.includes('STRICT_GLUTEN_FREE_CERTIFIED'));
    assert.ok(profile.prescribedNutrients.includes('HIGH_CALCIUM_VITAMIN_D3'));
    assert.ok(profile.prescribedNutrients.includes('ZERO_FAVA_BEANS'));
    assert.ok(profile.prohibitedSupplements.includes('HIGH_DOSE_VITAMIN_C'));
    assert.ok(profile.biomechanicalRestrictions.includes('NO_LOADED_SPINAL_FLEXION_AND_TWISTING'));
  });

  await t.test('4. Handles pregnancy trimesters and lactation calories correctly', () => {
    const pregnancy = evaluateMasterClinicalProfile({
      pregnancyTrimester: 'SECOND',
      targetCalories: 2000
    });
    assert.equal(pregnancy.calories, 2350);

    const lactation = evaluateMasterClinicalProfile({
      pregnancyTrimester: 'POSTPARTUM_LACTATING',
      targetCalories: 2000
    });
    assert.equal(lactation.calories, 2450);
  });

});

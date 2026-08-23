import { describe, it, expect } from 'vitest';
import { evaluateMasterClinicalProfile, evaluateInsulinSafety } from '../src/execution-engines/drug-interaction-firewall.js';

describe('Clinical Firewalls & Pharmacological Matrix Suite', () => {

  it('enforces carb floor and 15-15 rule for insulin users', () => {
    const profile = evaluateMasterClinicalProfile({
      medicalConditions: ['TYPE_1_DIABETES'],
      targetCalories: 2000,
      targetProteinGrams: 150,
      targetCarbGrams: 100,
      targetFatGrams: 60
    });

    expect(profile.carbGrams).toBeGreaterThanOrEqual(130);
    expect(profile.safetyCues.some(c => c.includes('15-15'))).toBe(true);
  });

  it('adjusts calories and steps for hypothyroidism', () => {
    const profile = evaluateMasterClinicalProfile({
      medicalConditions: ['HYPOTHYROIDISM'],
      targetCalories: 2000,
      targetProteinGrams: 150,
      targetCarbGrams: 200,
      targetFatGrams: 60
    });

    expect(profile.calories).toBe(1800);
    expect(profile.cardioProtocol.dailySteps).toBe(10000);
  });

  it('adjusts water target for kidney stones', () => {
    const profile = evaluateMasterClinicalProfile({
      medicalConditions: ['KIDNEY_STONES'],
      targetCalories: 2000,
      targetProteinGrams: 150,
      targetCarbGrams: 200,
      targetFatGrams: 60,
      waterLiters: 3.0
    });

    expect(profile.waterLiters).toBe(4.5);
    expect(profile.prescribedNutrients).toContain('LOW_OXALATE_FOODS');
  });

  it('handles pregnancy trimesters and lactation calories correctly', () => {
    const pregnancy = evaluateMasterClinicalProfile({
      pregnancyTrimester: 'SECOND',
      targetCalories: 2000
    });
    expect(pregnancy.calories).toBe(2350);

    const lactation = evaluateMasterClinicalProfile({
      pregnancyTrimester: 'POSTPARTUM_LACTATING',
      targetCalories: 2000
    });
    expect(lactation.calories).toBe(2450);
  });

});

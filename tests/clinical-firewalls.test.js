import { describe, it, expect } from 'vitest';
import { 
  evaluateInsulinSafety, 
  evaluatePharmacologicalFirewall,
  evaluateMasterClinicalProfile 
} from '../src/execution-engines/drug-interaction-firewall.js';

describe('Clinical Safety Firewalls - 22-Condition Stacked Suite', () => {

  it('detects insulin therapy and enforces carb floor & safety cues', () => {
    const result = evaluateInsulinSafety(['Lantus', 'Novorapid']);
    expect(result.requires_insulin_protocol).toBe(true);
    expect(result.carb_floor_grams).toBe(130);
    expect(result.lock_keto).toBe(true);
    expect(result.safety_cues_ar.length).toBe(3);
    expect(result.safety_cues_ar[0]).toContain('قاعدة 15-15');
  });

  it('evaluates hypothyroidism & fatty liver steps escalation & simple fructose restriction', () => {
    const result = evaluateMasterClinicalProfile({
      medicalConditions: ['HYPOTHYROIDISM', 'FATTY_LIVER'],
      weightKg: 80,
      targetCalories: 2000
    });

    expect(result.calories).toBe(1800); // 2000 * 0.90
    expect(result.cardioProtocol.dailySteps).toBe(10000);
    expect(result.prescribedNutrients).toContain('ZERO_SIMPLE_FRUCTOSE');
  });

  it('evaluates bariatric surgery, gout, blood thinners, and asthma protocols', () => {
    const result = evaluateMasterClinicalProfile({
      medicalConditions: ['BARIATRIC_SURGERY', 'BLOOD_THINNERS', 'GOUT', 'BRONCHIAL_ASTHMA'],
      weightKg: 90,
      targetCalories: 1800,
      targetProteinGrams: 120,
      targetCarbGrams: 180,
      targetFatGrams: 50,
      waterLiters: 3.0
    });

    // Bariatric: protein scaled to at least 2.0 * 90 = 180g
    expect(result.proteinGrams).toBe(180);
    expect(result.prescribedNutrients).toContain('WHEY_ISOLATE_FLUID_SEPARATION');

    // Gout: water scaled to at least 4.0L
    expect(result.waterLiters).toBe(4.0);
    expect(result.prescribedNutrients).toContain('LOW_PURINE_PROTEIN_SOURCES');

    // Blood thinners: high dose omega3 & vitamin E prohibited
    expect(result.prohibitedSupplements).toContain('HIGH_DOSE_OMEGA3_OVER_2000MG');
    expect(result.biomechanicalRestrictions).toContain('NO_HEAVY_CONTACT_TRAINING');

    // Asthma: gradual liss and warmup
    expect(result.cardioProtocol.type).toBe('GRADUAL_LISS');
    expect(result.biomechanicalRestrictions).toContain('EXTENDED_DYNAMIC_WARMUP_15MIN');
  });

  it('evaluates roaccutane, hernia, corticosteroids, and lactation protocols', () => {
    const result = evaluateMasterClinicalProfile({
      medicalConditions: ['ROACCUTANE_USER', 'HERNIA_VARICOSE', 'CORTICOSTEROIDS', 'LACTATION'],
      weightKg: 65,
      targetCalories: 1700,
      targetProteinGrams: 130,
      targetCarbGrams: 160,
      targetFatGrams: 50
    });

    // Lactation: +450 kcal
    expect(result.calories).toBe(2150);

    // Corticosteroids: protein * 1.15
    expect(result.proteinGrams).toBe(150);
    expect(result.prescribedNutrients).toContain('LOW_SODIUM_HIGH_CALCIUM');

    // Roaccutane: Vitamin A prohibited
    expect(result.prohibitedSupplements).toContain('VITAMIN_A');

    // Hernia: restrictions
    expect(result.biomechanicalRestrictions).toContain('NO_VALSALVA_HEAVY_LEG_PRESS');
  });

});

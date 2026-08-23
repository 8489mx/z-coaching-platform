import { describe, it, expect } from 'vitest';
import { 
  evaluateInsulinSafety, 
  evaluatePharmacologicalFirewall,
  evaluateMasterClinicalProfile 
} from '../src/execution-engines/drug-interaction-firewall.js';
import { generateInitialPlan } from '../src/execution-engines/onboarding-plan-generator-engine.js';

describe('Clinical Safety Firewalls - 22-Condition Stacked Suite', () => {

  it('detects insulin therapy and enforces carb floor & safety cues', () => {
    const result = evaluateInsulinSafety(['Lantus', 'Novorapid']);
    expect(result.requires_insulin_protocol).toBe(true);
    expect(result.carb_floor_grams).toBe(130);
    expect(result.lock_keto).toBe(true);
    expect(result.safety_cues_ar.length).toBe(3);
    expect(result.safety_cues_ar[0]).toContain('قاعدة 15-15');
  });

  it('evaluates stacked conditions without conflict (Insulin + Hypertension + Renal + Lower Back)', () => {
    const result = evaluateMasterClinicalProfile({
      medicalConditions: ['TYPE_1_DIABETES', 'HYPERTENSION', 'RENAL_INSUFFICIENCY', 'LOWER_BACK_PAIN'],
      weightKg: 80,
      targetCalories: 2200,
      targetProteinGrams: 176,
      targetCarbGrams: 120,
      targetFatGrams: 60
    });

    // Insulin: Carb floor clamped to >= 130g
    expect(result.carbGrams).toBe(130);
    
    // Renal: Protein clamped to 1.1 g/kg (88g) & Creatine prohibited
    expect(result.proteinGrams).toBe(88);
    expect(result.prohibitedSupplements).toContain('CREATINE');

    // Hypertension: High stim prohibited & Valsalva restricted
    expect(result.prohibitedSupplements).toContain('HIGH_STIM_PREWORKOUT');
    expect(result.biomechanicalRestrictions).toContain('NO_VALSALVA_MANEUVER');

    // Lower back: No axial loading
    expect(result.biomechanicalRestrictions).toContain('NO_AXIAL_LOADING_SQUAT_DEADLIFT');
  });

  it('evaluates bariatric surgery, blood thinners, gout, and asthma protocols', () => {
    const result = evaluateMasterClinicalProfile({
      medicalConditions: ['BARIATRIC_SURGERY', 'BLOOD_THINNERS', 'GOUT', 'BRONCHIAL_ASTHMA'],
      weightKg: 90,
      targetCalories: 1800,
      targetProteinGrams: 120,
      targetCarbGrams: 180,
      targetFatGrams: 50
    });

    // Bariatric: protein scaled to at least 1.8 * 90 = 162g
    expect(result.proteinGrams).toBe(162);

    // Blood thinners: Vitamin E / Ginkgo prohibited
    expect(result.prohibitedSupplements).toContain('HIGH_DOSE_VITAMIN_E');
    expect(result.prohibitedSupplements).toContain('GINKGO_BILOBA');

    // Gout: high purine prohibited
    expect(result.prohibitedSupplements).toContain('HIGH_PURINE_EXTRACTS');

    // Safety cues include asthma and bariatric notes
    expect(result.safetyCues.some(c => c.includes('بخاخ الربو'))).toBe(true);
    expect(result.safetyCues.some(c => c.includes('فصل السوائل'))).toBe(true);
  });

  it('evaluates roaccutane, hernia, gerd, and lactation protocols', () => {
    const result = evaluateMasterClinicalProfile({
      medicalConditions: ['ROACCUTANE_USER', 'HERNIA_VARICOSE', 'GERD_REFLUX', 'LACTATION'],
      weightKg: 65,
      targetCalories: 1700,
      targetProteinGrams: 130,
      targetCarbGrams: 160,
      targetFatGrams: 50
    });

    // Lactation: +450 kcal
    expect(result.calories).toBe(2150);

    // Roaccutane: Vitamin A prohibited
    expect(result.prohibitedSupplements).toContain('VITAMIN_A');

    // Hernia & GERD: restrictions
    expect(result.biomechanicalRestrictions).toContain('NO_HEAVY_LEG_PRESS_HIGH_IAP');
    expect(result.biomechanicalRestrictions).toContain('NO_INVERTED_EXERCISES_DECLINE_BENCH');
    expect(result.biomechanicalRestrictions).toContain('NO_INTRA_ABDOMINAL_CRUNCHES');
  });

});

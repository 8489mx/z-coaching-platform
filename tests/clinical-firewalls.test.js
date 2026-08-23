import { describe, it, expect } from 'vitest';
import { 
  evaluateInsulinSafety, 
  evaluatePharmacologicalFirewall,
  evaluateMasterClinicalProfile 
} from '../src/execution-engines/drug-interaction-firewall.js';
import { generateInitialPlan } from '../src/execution-engines/onboarding-plan-generator-engine.js';

describe('Clinical Safety Firewalls - Stacked Multi-Condition Suite', () => {

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

  it('evaluates lactation calorie boost and GLP-1 protein escalation', () => {
    const result = evaluateMasterClinicalProfile({
      medicalConditions: ['LACTATION', 'GLP1_USER'],
      weightKg: 70,
      targetCalories: 1800,
      targetProteinGrams: 140,
      targetCarbGrams: 150,
      targetFatGrams: 50
    });

    // Lactation: +450 kcal
    expect(result.calories).toBe(2250);
    expect(result.biomechanicalRestrictions).toContain('NO_INTRA_ABDOMINAL_CRUNCHES');

    // GLP-1: 70 * 2.3 = 161g protein
    expect(result.proteinGrams).toBe(161);
  });

});

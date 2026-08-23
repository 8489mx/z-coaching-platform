import { describe, it, expect } from 'vitest';
import { evaluateInsulinSafety, evaluatePharmacologicalFirewall } from '../src/execution-engines/drug-interaction-firewall.js';
import { generateInitialPlan } from '../src/execution-engines/onboarding-plan-generator-engine.js';

describe('Clinical Safety Firewalls - Exogenous Insulin Protocol', () => {

  it('detects insulin therapy and enforces carb floor & safety cues', () => {
    const result = evaluateInsulinSafety(['Lantus', 'Novorapid']);
    expect(result.requires_insulin_protocol).toBe(true);
    expect(result.carb_floor_grams).toBe(130);
    expect(result.lock_keto).toBe(true);
    expect(result.safety_cues_ar.length).toBe(3);
    expect(result.safety_cues_ar[0]).toContain('قاعدة 15-15');
  });

  it('detects Arabic insulin keyword', () => {
    const result = evaluateInsulinSafety(['حقن انسولين ميكستارد']);
    expect(result.requires_insulin_protocol).toBe(true);
    expect(result.carb_floor_grams).toBe(130);
  });

  it('returns false for non-insulin medications', () => {
    const result = evaluateInsulinSafety(['Omega 3', 'Creatine']);
    expect(result.requires_insulin_protocol).toBe(false);
  });

  it('generateInitialPlan clamps carb floor to >= 130g and adds clinical notes for insulin dependent client', () => {
    const plan = generateInitialPlan({
      name: 'طارق عبد الله',
      gender: 'MALE',
      age: 35,
      weightKg: 85,
      heightCm: 175,
      goal: 'AGGRESSIVE_CUT',
      medicalFlags: ['INSULIN_DEPENDENT']
    });

    expect(plan.daily_targets.carbs_grams).toBeGreaterThanOrEqual(130);
    expect(plan.clinical_notes.length).toBeGreaterThan(0);
    expect(plan.clinical_notes.some(n => n.includes('بروتوكول الأنسولين الإكلينيكي'))).toBe(true);
  });

});

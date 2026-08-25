import { describe, it, expect } from 'vitest';
import { generateInitialPlan } from '../src/execution-engines/onboarding-plan-generator-engine.js';

describe('Expanded Splits & Onboarding Engine Tests', () => {

  it('generates ARNOLD_SPLIT successfully for 6-day male with recommended exercises', () => {
    const plan = generateInitialPlan({
      name: 'كريم',
      gender: 'MALE',
      age: 26,
      weightKg: 82,
      heightCm: 180,
      trainingDaysPerWeek: 6
    });

    expect(plan.training_split.id).toBe('arnold_split');
    expect(plan.training_split.schedule_blueprint.length).toBe(6);
    expect(plan.training_split.name_ar).toContain('Arnold');
    expect(Array.isArray(plan.training_split.recommended_exercises)).toBe(true);
    expect(plan.training_split.recommended_exercises.some((e) => e.id === 'arnold_pullover')).toBe(true);
  });

  it('generates FEMALE_GLUTE_SPECIALIZED successfully for females with glute exercises', () => {
    const plan4 = generateInitialPlan({
      name: 'سارة',
      gender: 'FEMALE',
      age: 27,
      weightKg: 58,
      heightCm: 165,
      trainingDaysPerWeek: 4
    });

    expect(plan4.training_split.id).toBe('female_glute_specialized');
    expect(plan4.training_split.schedule_blueprint.length).toBe(4);
    expect(plan4.training_split.recommended_exercises.some((e) => e.id === 'kas_glute_bridge')).toBe(true);

    const plan5 = generateInitialPlan({
      name: 'مريم',
      gender: 'FEMALE',
      age: 29,
      weightKg: 60,
      heightCm: 168,
      trainingDaysPerWeek: 5
    });

    expect(plan5.training_split.id).toBe('female_glute_specialized');
    expect(plan5.training_split.schedule_blueprint.length).toBe(5);
    expect(plan5.rehab_routine).toBeDefined();
    expect(plan5.cardio_protocol).toBeDefined();
    expect(plan5.clinical_profile).toBeDefined();
  });

  it('generates UL_ARMS_HYBRID successfully for 5-day male with arm exercises', () => {
    const plan = generateInitialPlan({
      name: 'أحمد',
      gender: 'MALE',
      age: 28,
      weightKg: 85,
      heightCm: 182,
      trainingDaysPerWeek: 5
    });

    expect(plan.training_split.id).toBe('ul_arms_hybrid');
    expect(plan.training_split.schedule_blueprint.length).toBe(5);
    expect(plan.training_split.name_ar).toContain('UL+A');
    expect(plan.training_split.recommended_exercises.some((e) => e.id === 'bayesian_cable_curl')).toBe(true);
  });

});

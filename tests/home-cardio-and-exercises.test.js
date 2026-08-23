import { describe, it, expect } from 'vitest';
import { generateInitialPlan } from '../src/execution-engines/onboarding-plan-generator-engine.js';

describe('Home Exercise Library & Home Cardio Integration Suite', () => {

  it('generates home treadmill incline protocol for healthy client with treadmill at home', () => {
    const plan = generateInitialPlan({
      name: 'علي المنزلي',
      environment: 'HOME',
      homeEquipment: ['DUMBBELLS', 'TREADMILL'],
      trainingDaysPerWeek: 3
    });

    expect(plan.cardio_protocol.equipment).toBe('HOME_TREADMILL');
    expect(plan.cardio_protocol.incline_percent).toBe('4-6% (مشي مائل)');
    expect(plan.training_split.recommended_exercises.length).toBeGreaterThan(0);
    expect(plan.training_split.recommended_exercises[0].environment_adapted).toBe('HOME');
  });

  it('adjusts treadmill to flat walk when client has patellar tendinitis', () => {
    const plan = generateInitialPlan({
      name: 'سامي المصاب',
      environment: 'HOME',
      homeEquipment: ['TREADMILL'],
      medicalConditions: ['PATELLAR_TENDINITIS'],
      trainingDaysPerWeek: 3
    });

    expect(plan.cardio_protocol.equipment).toBe('HOME_TREADMILL');
    expect(plan.cardio_protocol.incline_percent).toBe('0-1% (مشي مستوٍ خفيف)');
  });

  it('switches to stationary bike when knee patient has both treadmill and bike at home', () => {
    const plan = generateInitialPlan({
      name: 'هاني',
      environment: 'HOME',
      homeEquipment: ['TREADMILL', 'STATIONARY_BIKE'],
      medicalConditions: ['PATELLAR_TENDINITIS'],
      trainingDaysPerWeek: 3
    });

    expect(plan.cardio_protocol.equipment).toBe('HOME_STATIONARY_BIKE');
  });

  it('generates bodyweight exercise variations when bodyweight only is selected', () => {
    const plan = generateInitialPlan({
      name: 'عمر وزن جسم',
      environment: 'HOME',
      homeEquipment: ['BODYWEIGHT_ONLY'],
      trainingDaysPerWeek: 3
    });

    const exNames = plan.training_split.recommended_exercises.map(e => e.name_ar);
    expect(exNames.some(n => n.includes('ضغط برجلين') || n.includes('ضغط أرضي'))).toBe(true);
  });

});

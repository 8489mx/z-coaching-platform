import { describe, it, expect } from 'vitest';
import {
  evaluateMetabolicAndDeloadState,
  generateHydrationAdvice,
  evaluateMicronutrientInteractions,
  evaluateMenstrualCyclePhase,
  resolveEmergencyProtocol,
  evaluateCompleteMetabolicSafetySuite
} from '../src/execution-engines/metabolic-safeguards.js';

describe('Metabolic & Physiological Safeguards Engine Suite', () => {

  it('triggers full diet break at 12+ weeks deficit and 2 weeks stall', () => {
    const state = evaluateMetabolicAndDeloadState({
      weeksInDeficit: 12,
      weightStallWeeks: 2,
      adherenceRate: 0.90,
      currentCalories: 1800,
      maintenanceCalories: 2400,
      currentCarbGrams: 180
    });

    expect(state.triggerDietBreak).toBe(true);
    expect(state.protocolType).toBe('FULL_DIET_BREAK_1_WEEK');
    expect(state.adjustedCalories).toBe(2400);
    expect(state.adjustedCarbGrams).toBe(252);
  });

  it('triggers 2-day refeed at 8-11 weeks deficit and 2 weeks stall', () => {
    const state = evaluateMetabolicAndDeloadState({
      weeksInDeficit: 9,
      weightStallWeeks: 2,
      adherenceRate: 0.88,
      currentCalories: 1800,
      maintenanceCalories: 2400,
      currentCarbGrams: 200
    });

    expect(state.triggerRefeed).toBe(true);
    expect(state.protocolType).toBe('CONSECUTIVE_2DAY_REFEED');
    expect(state.adjustedCarbGrams).toBe(270);
  });

  it('triggers deload week when joint fatigue is reported or 6+ training weeks', () => {
    const deloadState = evaluateMetabolicAndDeloadState({
      consecutiveTrainingWeeks: 7,
      jointFatigueReported: true
    });

    expect(deloadState.triggerDeloadWeek).toBe(true);
    expect(deloadState.coachingAdvice.some(a => a.includes('Deload Week'))).toBe(true);
  });

  it('strictly restricts added electrolytes for hypertension and renal patients', () => {
    const advice = generateHydrationAdvice({
      medicalConditions: ['HYPERTENSION'],
      environmentTemperature: 'HOT_SUMMER',
      dailySweatLevel: 'HIGH'
    });

    expect(advice.type).toBe('STRICT_HYDRATION_ONLY');
    expect(advice.isMandatory).toBe(true);
  });

  it('offers flexible optional hydration choices for summer heat in healthy individuals', () => {
    const advice = generateHydrationAdvice({
      medicalConditions: [],
      environmentTemperature: 'HOT_SUMMER',
      dailySweatLevel: 'HIGH'
    });

    expect(advice.type).toBe('SMART_ELECTROLYTES_OPTIONAL');
    expect(advice.options.length).toBe(3);
  });

  it('isolates iron from calcium and enforces thyroid 4hr fasting', () => {
    const rules = evaluateMicronutrientInteractions({
      prescribedSupplements: ['IRON', 'ZINC_HIGH_DOSE', 'MAGNESIUM'],
      medicalConditions: ['HYPOTHYROIDISM']
    });

    expect(rules.some(r => r.rule === 'IRON_CALCIUM_SEPARATION')).toBe(true);
    expect(rules.some(r => r.rule === 'THYROID_MED_ISOLATION')).toBe(true);
    expect(rules.some(r => r.rule === 'ZINC_COPPER_BALANCE')).toBe(true);
    expect(rules.some(r => r.rule === 'MAGNESIUM_NIGHT_TIMING')).toBe(true);
  });

  it('modulates luteal phase with water retention reassurance for females', () => {
    const luteal = evaluateMenstrualCyclePhase({
      isFemale: true,
      cyclePhase: 'LUTEAL',
      isPregnantOrLactating: false
    });

    expect(luteal.phase).toBe('LUTEAL');
    expect(luteal.waterRetentionAlert).toBe(true);
    expect(luteal.scaleGuidance).toContain('1 إلى 2.5 كجم');
  });

  it('resolves emergency protocols for joint pain and weight stalls', () => {
    const shoulderPain = resolveEmergencyProtocol({
      emergencyType: 'JOINT_PAIN',
      jointLocation: 'SHOULDER'
    });
    expect(shoulderPain.actionType).toBe('BIOMECHANICAL_SWAP');
    expect(shoulderPain.resolution).toContain('Neutral DB Press');

    const stall = resolveEmergencyProtocol({
      emergencyType: 'WEIGHT_STALL'
    });
    expect(stall.actionType).toBe('CALORIE_AND_REFEED_SHIFT');
  });

  it('runs evaluateCompleteMetabolicSafetySuite end-to-end', () => {
    const suite = evaluateCompleteMetabolicSafetySuite({
      clientData: {
        targetCalories: 2000,
        maintenanceCalories: 2500,
        targetCarbGrams: 200,
        selectedConditions: ['HYPOTHYROIDISM'],
        supplements: ['IRON', 'MAGNESIUM'],
        gender: 'FEMALE'
      },
      progressData: {
        weeksInDeficit: 8,
        weightStallWeeks: 2,
        cyclePhase: 'LUTEAL'
      },
      environmentData: {
        temperature: 'HOT_SUMMER'
      }
    });

    expect(suite.metabolicState).toBeDefined();
    expect(suite.hydrationAdvice).toBeDefined();
    expect(suite.micronutrientRules.length).toBeGreaterThan(0);
    expect(suite.menstrualModulation.phase).toBe('LUTEAL');
  });

});

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluateMetabolicAndDeloadState,
  generateHydrationAdvice,
  evaluateMicronutrientInteractions,
  evaluateMenstrualCyclePhase,
  resolveEmergencyProtocol,
  evaluateCompleteMetabolicSafetySuite
} from '../src/execution-engines/metabolic-safeguards.js';

test('Metabolic & Physiological Safeguards Engine Suite', async (t) => {

  await t.test('1. Triggers full diet break at 12+ weeks deficit and 2 weeks stall', () => {
    const state = evaluateMetabolicAndDeloadState({
      weeksInDeficit: 12,
      weightStallWeeks: 2,
      adherenceRate: 0.90,
      currentCalories: 1800,
      maintenanceCalories: 2400,
      currentCarbGrams: 180
    });

    assert.equal(state.triggerDietBreak, true);
    assert.equal(state.protocolType, 'FULL_DIET_BREAK_1_WEEK');
    assert.equal(state.adjustedCalories, 2400);
    assert.equal(state.adjustedCarbGrams, 252);
  });

  await t.test('2. Triggers 2-day refeed at 8-11 weeks deficit and 2 weeks stall', () => {
    const state = evaluateMetabolicAndDeloadState({
      weeksInDeficit: 9,
      weightStallWeeks: 2,
      adherenceRate: 0.88,
      currentCalories: 1800,
      maintenanceCalories: 2400,
      currentCarbGrams: 200
    });

    assert.equal(state.triggerRefeed, true);
    assert.equal(state.protocolType, 'CONSECUTIVE_2DAY_REFEED');
    assert.equal(state.adjustedCarbGrams, 270);
  });

  await t.test('3. Triggers deload week when joint fatigue is reported or 6+ training weeks', () => {
    const deloadState = evaluateMetabolicAndDeloadState({
      consecutiveTrainingWeeks: 7,
      jointFatigueReported: true
    });

    assert.equal(deloadState.triggerDeloadWeek, true);
    assert.ok(deloadState.coachingAdvice.some(a => a.includes('Deload Week')));
  });

  await t.test('4. Strictly restricts added electrolytes for hypertension and renal patients', () => {
    const advice = generateHydrationAdvice({
      medicalConditions: ['HYPERTENSION'],
      environmentTemperature: 'HOT_SUMMER',
      dailySweatLevel: 'HIGH'
    });

    assert.equal(advice.type, 'STRICT_HYDRATION_ONLY');
    assert.equal(advice.isMandatory, true);
  });

  await t.test('5. Offers flexible optional hydration choices for summer heat in healthy individuals', () => {
    const advice = generateHydrationAdvice({
      medicalConditions: [],
      environmentTemperature: 'HOT_SUMMER',
      dailySweatLevel: 'HIGH'
    });

    assert.equal(advice.type, 'SMART_ELECTROLYTES_OPTIONAL');
    assert.equal(advice.options.length, 3);
  });

  await t.test('6. Isolates iron from calcium and enforces thyroid 4hr fasting', () => {
    const rules = evaluateMicronutrientInteractions({
      prescribedSupplements: ['IRON', 'ZINC_HIGH_DOSE', 'MAGNESIUM'],
      medicalConditions: ['HYPOTHYROIDISM']
    });

    assert.ok(rules.some(r => r.rule === 'IRON_CALCIUM_SEPARATION'));
    assert.ok(rules.some(r => r.rule === 'THYROID_MED_ISOLATION'));
    assert.ok(rules.some(r => r.rule === 'ZINC_COPPER_BALANCE'));
    assert.ok(rules.some(r => r.rule === 'MAGNESIUM_NIGHT_TIMING'));
  });

  await t.test('7. Modulates luteal phase with water retention reassurance for females', () => {
    const luteal = evaluateMenstrualCyclePhase({
      isFemale: true,
      cyclePhase: 'LUTEAL',
      isPregnantOrLactating: false
    });

    assert.equal(luteal.phase, 'LUTEAL');
    assert.equal(luteal.waterRetentionAlert, true);
    assert.ok(luteal.scaleGuidance.includes('1 إلى 2.5 كجم'));
  });

  await t.test('8. Resolves emergency protocols for joint pain and weight stalls', () => {
    const shoulderPain = resolveEmergencyProtocol({
      emergencyType: 'JOINT_PAIN',
      jointLocation: 'SHOULDER'
    });
    assert.equal(shoulderPain.actionType, 'BIOMECHANICAL_SWAP');
    assert.ok(shoulderPain.resolution.includes('Neutral DB Press'));

    const stall = resolveEmergencyProtocol({
      emergencyType: 'WEIGHT_STALL'
    });
    assert.equal(stall.actionType, 'CALORIE_AND_REFEED_SHIFT');
  });

  await t.test('9. Runs evaluateCompleteMetabolicSafetySuite end-to-end', () => {
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

    assert.ok(suite.metabolicState);
    assert.ok(suite.hydrationAdvice);
    assert.ok(suite.micronutrientRules.length > 0);
    assert.equal(suite.menstrualModulation.phase, 'LUTEAL');
  });

});

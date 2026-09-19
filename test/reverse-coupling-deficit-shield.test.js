import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateEnergyAdjustedLandmarks,
  auditDeficitVolumeShield,
  syncCarbCyclingWithSessions,
  evaluateProteinSparingRequirement,
  MUSCLE_VOLUME_LANDMARKS,
} from '../src/api/utils/trainingNutritionCoupling.js';

describe('Nutrition-to-Training Reverse Coupling & Deficit Volume Shield Suite', () => {

  // 1. calculateEnergyAdjustedLandmarks
  it('1. calculateEnergyAdjustedLandmarks: correctly contracts MRV/MAV in deficit and expands in surplus', () => {
    // A) Deep deficit: TDEE 2500, Target 1800 -> 28% deficit
    const deepDeficit = calculateEnergyAdjustedLandmarks({ targetCalories: 1800, tdee: 2500 });
    assert.equal(deepDeficit.is_deficit, true);
    assert.equal(deepDeficit.is_aggressive_deficit, true);
    assert.equal(deepDeficit.mrv_multiplier, 0.80);
    assert.equal(deepDeficit.mav_multiplier, 0.85);

    // Quad MRV is 20 -> 20 * 0.80 = 16
    assert.equal(deepDeficit.adjusted_landmarks.QUADS.mrv, 16);
    assert.equal(deepDeficit.adjusted_landmarks.QUADS.base_mrv, 20);

    // B) Moderate deficit: TDEE 2400, Target 2100 -> 12.5% deficit
    const modDeficit = calculateEnergyAdjustedLandmarks({ targetCalories: 2100, tdee: 2400 });
    assert.equal(modDeficit.is_deficit, true);
    assert.equal(modDeficit.is_aggressive_deficit, false);
    assert.equal(modDeficit.mrv_multiplier, 0.90);
    // Quad MRV is 20 -> 20 * 0.90 = 18
    assert.equal(modDeficit.adjusted_landmarks.QUADS.mrv, 18);

    // C) Surplus: TDEE 2200, Target 2600 -> +400 kcal surplus
    const surplus = calculateEnergyAdjustedLandmarks({ targetCalories: 2600, tdee: 2200 });
    assert.equal(surplus.is_surplus, true);
    assert.equal(surplus.mrv_multiplier, 1.15);
    // Quad MRV is 20 -> 20 * 1.15 = 23
    assert.equal(surplus.adjusted_landmarks.QUADS.mrv, 23);
  });

  // 2. auditDeficitVolumeShield
  it('2. auditDeficitVolumeShield: triggers volume consolidation when sets exceed deficit-adjusted MRV', () => {
    const mockSessions = [
      {
        name: 'Leg Day 1',
        exercises: [
          { code: 'BARBELL_BACK_SQUAT', target_sets: 5, muscle_group: 'QUADS' },
          { code: 'LEG_PRESS_MACHINE', target_sets: 4, muscle_group: 'QUADS' },
        ]
      },
      {
        name: 'Leg Day 2',
        exercises: [
          { code: 'HACK_SQUAT_MACHINE', target_sets: 5, muscle_group: 'QUADS' },
          { code: 'LEG_EXTENSION_MACHINE', target_sets: 4, muscle_group: 'QUADS' },
        ]
      }
    ]; // Total = 18 sets of Quads

    const audit = auditDeficitVolumeShield({
      sessions: mockSessions,
      targetCalories: 1500,
      tdee: 2300
    });

    assert.equal(audit.shield_active, true);
    assert.equal(audit.requires_volume_consolidation, true);
    assert.equal(audit.analysis.QUADS.weekly_sets, 18);
    assert.equal(audit.analysis.QUADS.adjusted_mrv, 16);
    assert.equal(audit.analysis.QUADS.status, 'EXCEEDS_DEFICIT_MRV');
    assert.ok(audit.warnings.length > 0);
    assert.ok(audit.warnings[0].includes('درع العجز السعري'));
    assert.ok(audit.warnings[0].includes('الأرجل الأمامية'));
  });

  // 3. syncCarbCyclingWithSessions
  it('3. syncCarbCyclingWithSessions: maps heavy compound days to High-Carb and preserves 100% weekly calorie balance', () => {
    const mockSessions = [
      {
        name: 'Leg Day (Heavy)',
        exercises: [
          { code: 'BARBELL_BACK_SQUAT', target_sets: 4 },
          { code: 'BARBELL_ROMANIAN_DEADLIFT', target_sets: 4 },
        ]
      },
      {
        name: 'Upper Body (Moderate)',
        exercises: [
          { code: 'DUMBBELL_INCLINE_BENCH_PRESS', target_sets: 3 },
          { code: 'LAT_PULLDOWN', target_sets: 3 },
        ]
      },
      {
        name: 'Back & Deadlift (Heavy)',
        exercises: [
          { code: 'BARBELL_DEADLIFT', target_sets: 4 },
          { code: 'BARBELL_BENT_OVER_ROW', target_sets: 4 },
        ]
      },
      {
        name: 'Arms & Shoulders (Moderate/Light)',
        exercises: [
          { code: 'DUMBBELL_LATERAL_RAISE', target_sets: 3 },
          { code: 'BICEPS_CURL', target_sets: 3 },
        ]
      }
    ];

    const result = syncCarbCyclingWithSessions({
      sessions: mockSessions,
      baselineDailyCalories: 2000,
      baselineProteinG: 160,
      baselineCarbsG: 220,
      baselineFatG: 53
    });

    assert.equal(result.baseline.daily_calories, 2000);
    assert.equal(result.weekly_breakdown.length, 7);

    const monday = result.weekly_breakdown[0];
    assert.equal(monday.day_type, 'HEAVY_TRAINING');
    assert.ok(monday.carbs_g > result.baseline.carbs_g);

    const sunday = result.weekly_breakdown[6];
    assert.equal(sunday.day_type, 'REST_DAY');
    assert.ok(sunday.carbs_g < result.baseline.carbs_g);

    assert.ok(result.calorie_variance <= 5, `Expected variance <= 5 kcal, got ${result.calorie_variance}`);
  });

  // 4. evaluateProteinSparingRequirement
  it('4. evaluateProteinSparingRequirement: scales protein in deep deficit and enforces renal protection', () => {
    const deepCut = evaluateProteinSparingRequirement({
      targetCalories: 1400,
      tdee: 2200,
      clientWeightKg: 80,
      currentProteinG: 140,
      hasKidneyCondition: false
    });

    assert.equal(deepCut.has_kidney_condition, false);
    assert.equal(deepCut.recommended_multiplier, 2.3);
    assert.equal(deepCut.recommended_protein_g, 184);
    assert.equal(deepCut.is_deficient, true);
    assert.equal(deepCut.status, 'INSUFFICIENT_FOR_DEFICIT');
    assert.ok(deepCut.message_ar.includes('تنبيه تدريع بروتيني'));

    const ckdPatient = evaluateProteinSparingRequirement({
      targetCalories: 1400,
      tdee: 2200,
      clientWeightKg: 80,
      currentProteinG: 64,
      hasKidneyCondition: true
    });

    assert.equal(ckdPatient.has_kidney_condition, true);
    assert.equal(ckdPatient.locked_at_kidney_ceiling, true);
    assert.equal(ckdPatient.safe_ceiling_protein_g, 64);
    assert.equal(ckdPatient.recommended_protein_g, 64);
    assert.equal(ckdPatient.status, 'SAFE_RENAL_PROTECTION');
  });

});

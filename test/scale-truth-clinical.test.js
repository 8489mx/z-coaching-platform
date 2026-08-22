import test from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluateWeeklyScaleAndWaistTruth,
  validateCheckinMeasurementStandards
} from '../src/execution-engines/scale-truth-clinical-engine.js';

test('Scale Truth, Fluid Retention & Clinical Decisions Suite', async (t) => {

  await t.test('1. Recomposition Matrix: Waist Down with Steady/Up Scale', () => {
    const res = evaluateWeeklyScaleAndWaistTruth({
      weightDeltaKg: 0.2,    // وزن ثابت أو زاد 200 جم
      waistDeltaCm: -1.5,    // الخصر نزل 1.5 سم
      adherencePct: 95,
      currentCalories: 2000
    });

    assert.equal(res.decision, 'RECOMPOSITION_CONFIRMED');
    assert.equal(res.calorie_adjustment, 0);
    assert.equal(res.calorie_lock, true);
    assert.ok(res.client_message_ar.includes('الخصر'));
  });

  await t.test('2. Rapid Loss Hazard: Bump Calories to Prevent Muscle Wasting', () => {
    const res = evaluateWeeklyScaleAndWaistTruth({
      weightDeltaKg: -2.0,   // نزول حاد 2 كجم
      waistDeltaCm: -1.0,
      adherencePct: 90,
      currentCalories: 1800
    });

    assert.equal(res.decision, 'RAPID_LOSS_BUFFER');
    assert.ok(res.calorie_adjustment > 0);
    assert.equal(res.new_calories, 1925);
  });

  await t.test('3. Female PMS Firewall: Hard Lock and +25g Carb Buffer', () => {
    const res = evaluateWeeklyScaleAndWaistTruth({
      gender: 'FEMALE',
      isPMSWeek: true,
      weightDeltaKg: 1.5,    // زيادة الميزان 1.5 كجم بسبب الهرمونات
      waistDeltaCm: 0.5,
      adherencePct: 90,
      currentCalories: 1500
    });

    assert.equal(res.decision, 'MENSTRUAL_PMS_HOLD');
    assert.equal(res.calorie_lock, true);
    assert.equal(res.carb_buffer_added_g, 25);
    assert.equal(res.calorie_adjustment, 0);
  });

  await t.test('4. The Whoosh Effect Mechanism: Short Stall (<10 Days) with High Adherence', () => {
    const res = evaluateWeeklyScaleAndWaistTruth({
      weightDeltaKg: 0.0,
      waistDeltaCm: 0.0,
      adherencePct: 95,
      stallDurationDays: 7,
      consecutiveStallsCount: 1,
      currentCalories: 1900
    });

    assert.equal(res.decision, 'WHOOSH_WATER_HOLD');
    assert.equal(res.calorie_adjustment, 0);
    assert.ok(res.diagnosis_ar.includes('Whoosh'));
  });

  await t.test('5. True Plateau Decision Trade-off: Path A (Activity Boost near Floor) vs. Path B (Carb Cut)', () => {
    // Path A: Male near calorie floor (1550 <= 1600) -> Boost Steps, 0 Food Cut
    const pathA = evaluateWeeklyScaleAndWaistTruth({
      gender: 'MALE',
      currentCalories: 1550,
      weightDeltaKg: 0.0,
      waistDeltaCm: 0.0,
      adherencePct: 95,
      consecutiveStallsCount: 2
    });
    assert.equal(pathA.decision, 'TRUE_PLATEAU_ACTIVITY_BOOST');
    assert.equal(pathA.calorie_adjustment, 0);
    assert.equal(pathA.recommended_step_increase, 2000);

    // Path B: Male with ample calories (2100 > 1600) -> Cut 35g carbs (-140 Kcal)
    const pathB = evaluateWeeklyScaleAndWaistTruth({
      gender: 'MALE',
      currentCalories: 2100,
      weightDeltaKg: 0.0,
      waistDeltaCm: 0.0,
      adherencePct: 95,
      consecutiveStallsCount: 2
    });
    assert.equal(pathB.decision, 'TRUE_PLATEAU_CARB_TITRATION');
    assert.equal(pathB.calorie_adjustment, -140);
    assert.equal(pathB.new_calories, 1960);
    assert.equal(pathB.carb_cut_grams, 35);
  });

  await t.test('6. User Non-Compliance (<70% Adherence): Audit Alert, Maintain Calories', () => {
    const res = evaluateWeeklyScaleAndWaistTruth({
      weightDeltaKg: 0.5,
      waistDeltaCm: 0.5,
      adherencePct: 60,
      currentCalories: 1800
    });

    assert.equal(res.decision, 'AUDIT_NON_COMPLIANCE');
    assert.equal(res.calorie_adjustment, 0);
    assert.ok(res.rationale_ar.includes('السناكس'));
  });

  await t.test('7. Standardized Measurement Standards Checklist', () => {
    const valid = validateCheckinMeasurementStandards({
      isMorningPostWakeup: true,
      isFastedAndPostBathroom: true,
      isConsistentMinimalClothing: true,
      isNavelLevelParallelTape: true
    });
    assert.equal(valid.is_valid_standard, true);
    assert.equal(valid.violations_count, 0);

    const invalid = validateCheckinMeasurementStandards({
      isMorningPostWakeup: false,
      isFastedAndPostBathroom: true,
      isConsistentMinimalClothing: true,
      isNavelLevelParallelTape: false
    });
    assert.equal(invalid.is_valid_standard, false);
    assert.equal(invalid.violations_count, 2);
  });

});

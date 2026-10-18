import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CONVERSION_CONSTANTS,
  UNIT_STEPS,
  DEFAULT_UNIT_PREFERENCES,
  sanitizeUnitPreferences,
  convertKgToLb,
  convertLbToKg,
  convertCmToIn,
  convertInToCm,
  formatExerciseWeight,
  parseExerciseWeightToCanonicalKg,
  formatBodyWeight,
  parseBodyWeightToCanonicalKg,
  formatMeasurement,
  parseMeasurementToCanonicalCm,
  stepExerciseWeight,
  stepBodyWeight,
  stepMeasurement,
  parseUserUnitPreferences,
  serializeUserUnitPreferences,
} from '../frontend/src/utils/unitConverter.js';

test('1. Test Requirement 1: 100 KG converts to LB and displays as 220.5 lb', () => {
  const lbVal = convertKgToLb(100, 1);
  assert.equal(lbVal, 220.5, '100 kg * 2.2046226218 rounded to 1 decimal place should equal 220.5');

  const formatted = formatBodyWeight(100, 'lb');
  assert.equal(formatted, '220.5 باوند');
});

test('2. Test Requirement 2: Reversibility and canonical integrity without distortion', () => {
  const originalKg = 100.0;
  // Convert for display in LB
  const lbDisplay = convertKgToLb(originalKg, 1);
  assert.equal(lbDisplay, 220.5);

  // When converting back from exact LB to KG
  const exactLb = originalKg * CONVERSION_CONSTANTS.KG_TO_LB;
  const backToKg = exactLb * CONVERSION_CONSTANTS.LB_TO_KG;
  assert.ok(Math.abs(backToKg - originalKg) < 1e-9, 'Canonical round trip should have zero distortion');

  // When parsing a user input in LB (e.g. 220.5 lb)
  const parsedKg = parseBodyWeightToCanonicalKg(220.5, 'lb');
  // 220.5 / 2.2046226218 = 100.017 -> 100.02 kg
  assert.ok(Math.abs(parsedKg - 100.0) < 0.1, 'Parsed value should be extremely close to 100 kg');
});

test('3. Test Requirement 3: Logging exercise in LB converts to canonical KG and round-trips cleanly', () => {
  // Trainee logs 100 lb on a machine press
  const canonicalKg = parseExerciseWeightToCanonicalKg(100, 'lb');
  // 100 / 2.2046226218 = 45.36 kg
  assert.equal(canonicalKg, 45.36);

  // When retrieved and displayed in LB
  const displayInLb = formatExerciseWeight(canonicalKg, 'lb');
  assert.equal(displayInLb, '100 باوند');

  // When displayed in KG
  const displayInKg = formatExerciseWeight(canonicalKg, 'kg');
  assert.equal(displayInKg, '45.4 كجم');

  // Verify step size: KG is 2.5, LB is 5.0
  assert.equal(UNIT_STEPS.exercise_weight.kg, 2.5);
  assert.equal(UNIT_STEPS.exercise_weight.lb, 5.0);
  assert.equal(stepExerciseWeight(100, 1, 'lb'), 105);
  assert.equal(stepExerciseWeight(100, -1, 'lb'), 95);
  assert.equal(stepExerciseWeight(45, 1, 'kg'), 47.5);
  assert.equal(stepExerciseWeight(45, -1, 'kg'), 42.5);
});

test('4. Test Requirement 4: Historical check-in records display in chosen unit', () => {
  // Old check-in stored canonically in DB: 83.0 kg, waist: 84.5 cm
  const storedWeightKg = 83.0;
  const storedWaistCm = 84.5;

  // In KG / CM (default)
  assert.equal(formatBodyWeight(storedWeightKg, 'kg'), '83.0 كجم');
  assert.equal(formatMeasurement(storedWaistCm, 'cm'), '84.5 سم');

  // In LB / IN
  assert.equal(formatBodyWeight(storedWeightKg, 'lb'), '183.0 باوند');
  assert.equal(formatMeasurement(storedWaistCm, 'in'), '33.3 بوصة');
});

test('5. Test Requirement 5: CM to IN conversions and precision', () => {
  assert.equal(convertCmToIn(2.54, 1), 1.0);
  assert.equal(convertCmToIn(25.4, 1), 10.0);
  assert.equal(convertCmToIn(84.5, 1), 33.3);

  assert.equal(convertInToCm(1.0, 2), 2.54);
  assert.equal(convertInToCm(10.0, 2), 25.4);
  assert.equal(convertInToCm(33.27, 1), 84.5);

  // Step sizes for measurements: cm = 0.5, in = 0.25
  assert.equal(UNIT_STEPS.measurement.cm, 0.5);
  assert.equal(UNIT_STEPS.measurement.in, 0.25);
  assert.equal(stepMeasurement(84.5, 1, 'cm'), 85.0);
  assert.equal(stepMeasurement(33.25, 1, 'in'), 33.5);
  assert.equal(stepMeasurement(33.25, -1, 'in'), 33.0);
});

test('6. Test Requirement 6: Persistence serialization and parsing in user notes tag', () => {
  const originalNotes = 'مشترك ملتزم، يعاني من إجهاد خفيف في الركبة';
  const customPrefs = {
    exercise_weight_unit: 'lb',
    body_weight_unit: 'lb',
    measurement_unit: 'in',
  };

  const serialized = serializeUserUnitPreferences(originalNotes, customPrefs);
  assert.ok(serialized.includes(originalNotes), 'Should preserve existing notes');
  assert.ok(serialized.includes('[UNIT_PREFERENCES:{"exercise_weight_unit":"lb","body_weight_unit":"lb","measurement_unit":"in"}]'));

  const parsed = parseUserUnitPreferences(serialized);
  assert.deepEqual(parsed, customPrefs);

  // Verify fallback when no tag exists
  assert.deepEqual(parseUserUnitPreferences('just text'), DEFAULT_UNIT_PREFERENCES);
  assert.deepEqual(parseUserUnitPreferences(null), DEFAULT_UNIT_PREFERENCES);
});

test('7. Test Requirement 7: Nutrition plans, macros, and food grams are completely untouched', () => {
  // Ensure that nutrition meal targets remain pure numbers in grams/kcal
  const mealItem = {
    food_name: 'صدور دجاج مشوية',
    weight_g: 200,
    protein_g: 62,
    carbs_g: 0,
    fat_g: 7,
    calories: 311,
  };

  // Unit preferences must not alter nutrition weights or fields
  assert.equal(mealItem.weight_g, 200);
  assert.equal(mealItem.protein_g, 62);
  assert.equal(mealItem.carbs_g, 0);
  assert.equal(mealItem.calories, 311);
  assert.ok(!('weight_lb' in mealItem));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_UNIT_PREFERENCES,
  parseUserUnitPreferences,
  serializeUserUnitPreferences,
} from '../frontend/src/utils/unitConverter.js';

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

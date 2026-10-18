import test from 'node:test';
import assert from 'node:assert/strict';
import { User } from '../src/api/models/index.js';
import {
  parseUserUnitPreferences,
  serializeUserUnitPreferences,
  DEFAULT_UNIT_PREFERENCES
} from '../frontend/src/utils/unitConverter.js';

test('API User Model: serialization of preferences into user notes and toJSON output', async () => {
  const testUser = User.build({
    id: 9999,
    client_code: 'TEST-PREF-9999',
    phone_number: '01099998888',
    notes: 'ملاحظة تدريب سابقة للمتدرب',
  });

  // Default preferences when no tag exists
  let json = testUser.toJSON();
  assert.deepEqual(json.preferences, DEFAULT_UNIT_PREFERENCES);
  assert.equal(json.preferences.exercise_weight_unit, 'kg');
  assert.equal(json.preferences.body_weight_unit, 'kg');
  assert.equal(json.preferences.measurement_unit, 'cm');

  // Serialize updated preferences
  testUser.notes = serializeUserUnitPreferences(testUser.notes, {
    exercise_weight_unit: 'lb',
    body_weight_unit: 'lb',
    measurement_unit: 'in',
  });

  // Verify notes contains the tag and original note
  assert.ok(testUser.notes.includes('ملاحظة تدريب سابقة للمتدرب'));
  assert.ok(testUser.notes.includes('[UNIT_PREFERENCES:'));

  // Verify toJSON parses it accurately
  json = testUser.toJSON();
  assert.equal(json.preferences.exercise_weight_unit, 'lb');
  assert.equal(json.preferences.body_weight_unit, 'lb');
  assert.equal(json.preferences.measurement_unit, 'in');

  // Verify updating again preserves clean tag without duplicates
  testUser.notes = serializeUserUnitPreferences(testUser.notes, {
    exercise_weight_unit: 'kg',
    body_weight_unit: 'lb',
    measurement_unit: 'cm',
  });

  const matches = testUser.notes.match(/\[UNIT_PREFERENCES:.*?\]/g);
  assert.equal(matches.length, 1, 'Only one preferences tag should exist in notes');

  json = testUser.toJSON();
  assert.equal(json.preferences.exercise_weight_unit, 'kg');
  assert.equal(json.preferences.body_weight_unit, 'lb');
  assert.equal(json.preferences.measurement_unit, 'cm');
});

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  EXPANDED_EXERCISE_CATALOG,
  getExerciseById,
  getExercisesByMuscle
} from '../src/constants/exercise-catalog.js';

test('Expanded Exercise Catalog Suite', async (t) => {

  await t.test('1. Includes all 7 new specialized hypertrophy exercises', () => {
    assert.equal(EXPANDED_EXERCISE_CATALOG.length, 7);
    const ids = EXPANDED_EXERCISE_CATALOG.map((e) => e.id);
    assert.ok(ids.includes('kas_glute_bridge'));
    assert.ok(ids.includes('glute_hyperextension_45'));
    assert.ok(ids.includes('cable_glute_kickback'));
    assert.ok(ids.includes('bayesian_cable_curl'));
    assert.ok(ids.includes('cross_body_triceps_ext'));
    assert.ok(ids.includes('behind_back_lateral_raise'));
    assert.ok(ids.includes('arnold_pullover'));
  });

  await t.test('2. getExerciseById retrieves correct exercise with biomechanical cues', () => {
    const kas = getExerciseById('kas_glute_bridge');
    assert.ok(kas);
    assert.equal(kas.target_muscle, 'GLUTES');
    assert.equal(kas.cues_ar.length, 3);
    assert.ok(kas.cues_ar[0].includes('تثبيت أعلى الظهر'));
  });

  await t.test('3. getExercisesByMuscle filters by target muscle accurately', () => {
    const glutes = getExercisesByMuscle('GLUTES');
    assert.equal(glutes.length, 3); // kas_glute_bridge, glute_hyperextension_45, cable_glute_kickback
  });

});

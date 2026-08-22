import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getPrehabRoutine,
  POSTURAL_ISSUES,
  PREHAB_EXERCISE_DATABASE
} from '../src/execution-engines/postural-prehab-engine.js';

test('Postural & Joint Prehab Engine Suite', async (t) => {

  await t.test('1. Injects Banded Pull-Apart & Pec Stretch for Rounded Shoulders before Upper workout', () => {
    const routine = getPrehabRoutine(['ROUNDED_SHOULDERS'], 'UPPER_PULL');
    assert.ok(routine.exercises.length >= 2);
    assert.equal(routine.target_workout_type, 'UPPER_PULL');
    assert.ok(routine.matched_issues.includes(POSTURAL_ISSUES.ROUNDED_SHOULDERS));

    const exIds = routine.exercises.map(e => e.id);
    assert.ok(exIds.includes('BANDED_PULL_APART'));
    assert.ok(exIds.includes('DOORWAY_PEC_STRETCH'));
    assert.ok(routine.estimated_time_minutes <= 4);
  });

  await t.test('2. Injects Hip Flexor Stretch & Glute Bridges for Anterior Pelvic Tilt before Lower workout', () => {
    const routine = getPrehabRoutine(['ANTERIOR_PELVIC_TILT'], 'LEGS_HYPERTROPHY');
    assert.ok(routine.exercises.length >= 2);
    assert.ok(routine.matched_issues.includes(POSTURAL_ISSUES.ANTERIOR_PELVIC_TILT));

    const exIds = routine.exercises.map(e => e.id);
    assert.ok(exIds.includes('HIP_FLEXOR_STRETCH'));
    assert.ok(exIds.includes('GLUTE_BRIDGES_POSTERIOR_TILT'));
  });

  await t.test('3. Injects Wall Tibialis & Banded TKE for Knee Discomfort before Squat/Legs', () => {
    const routine = getPrehabRoutine(['KNEE_DISCOMFORT'], 'SQUAT_FOCUS_LOWER');
    assert.ok(routine.matched_issues.includes(POSTURAL_ISSUES.KNEE_DISCOMFORT));

    const exIds = routine.exercises.map(e => e.id);
    assert.ok(exIds.includes('WALL_TIBIALIS_RAISES'));
    assert.ok(exIds.includes('BANDED_TKE'));
  });

  await t.test('4. Injects External Rotations & Wall Slides for Shoulder Impingement before Push', () => {
    const routine = getPrehabRoutine(['SHOULDER_IMPINGEMENT'], 'CHEST_AND_SHOULDERS_PUSH');
    assert.ok(routine.matched_issues.includes(POSTURAL_ISSUES.SHOULDER_IMPINGEMENT));

    const exIds = routine.exercises.map(e => e.id);
    assert.ok(exIds.includes('BANDED_EXTERNAL_ROTATIONS'));
    assert.ok(exIds.includes('WALL_SLIDES_FOREARMS'));
  });

  await t.test('5. Injects Wrist Rockers for Wrist Strain before Push workout', () => {
    const routine = getPrehabRoutine(['WRIST_STRAIN'], 'UPPER_PUSH');
    assert.ok(routine.matched_issues.includes(POSTURAL_ISSUES.WRIST_STRAIN));

    const exIds = routine.exercises.map(e => e.id);
    assert.ok(exIds.includes('QUADRUPED_WRIST_ROCKERS'));
  });

  await t.test('6. Strictly caps final exercise count at 3 and duration at <= 4 minutes', () => {
    // Client with 5 simultaneous issues
    const multiIssueRoutine = getPrehabRoutine(
      ['ROUNDED_SHOULDERS', 'SHOULDER_IMPINGEMENT', 'WRIST_STRAIN'],
      'UPPER'
    );
    assert.ok(multiIssueRoutine.exercises.length <= 3);
    assert.ok(multiIssueRoutine.estimated_time_minutes <= 4);
  });
});

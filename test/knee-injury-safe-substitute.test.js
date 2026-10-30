import test from 'node:test';
import assert from 'node:assert/strict';

import { adaptIntakePayloadToCanonicalEngine } from '../src/intake-decision-engine/adapters/intake-adapter.js';
import { evaluateIntake } from '../src/intake-decision-engine/index.js';
import { buildTrainingMesoCycle } from '../src/training-engine-v2/index.js';

const ctx = { assessmentDate: '2026-09-19' };

// The file's own knee-loaded set plus the axial/hack squats the knee branch already
// rewrites: none of these may survive in a plan built for a knee-injured client.
const KNEE_LOADED = new Set([
  'BARBELL_BACK_SQUAT',
  'BARBELL_FRONT_SQUAT',
  'SMITH_MACHINE_SQUAT',
  'HACK_SQUAT_MACHINE',
  'LEG_PRESS_MACHINE',
  'GOBLET_SQUAT',
]);
const KNEE_SAFE_SUBSTITUTES = new Set(['GLUTE_BRIDGE', 'BARBELL_HIP_THRUST']);

function mesocycle({ injuries = [], experience = 'BEGINNER', days = 3, location = 'GYM' } = {}) {
  const canonical = adaptIntakePayloadToCanonicalEngine({
    personal: { sex: 'MALE', age: 30 },
    body: { weightKg: 85, heightCm: 178 },
    goals: { primary: 'FAT_LOSS' },
    medical: { hasInjuries: injuries.length > 0, injuries, conditions: [] },
    cardio: { averageDailySteps: 7000, walkingAbility: 'EASY' },
    training: { preferredDaysPerWeek: days, experience, environment: location === 'HOME' ? 'HOME' : 'COMMERCIAL_GYM', location },
    lifestyle: {},
  });
  return buildTrainingMesoCycle(evaluateIntake(canonical, ctx), { rawIntake: canonical, experience });
}

const allExercises = (meso) => meso.weeks.flatMap((w) => w.sessions).flatMap((s) => s.exercises);

test('knee injury (gym): no knee-loaded squat/press survives; knee-dominant slots become hip thrust', () => {
  const meso = mesocycle({ injuries: ['KNEE'] });
  for (const ex of allExercises(meso)) {
    assert.ok(!KNEE_LOADED.has(ex.exercise_code), `knee plan must not contain ${ex.exercise_code}`);
  }
  const kneeSlots = allExercises(meso).filter((ex) => ex.slot_code === 'KNEE_DOMINANT');
  assert.ok(kneeSlots.length > 0, 'knee plan should still train the knee-dominant slots');
  for (const ex of kneeSlots) {
    assert.ok(KNEE_SAFE_SUBSTITUTES.has(ex.exercise_code), `KNEE_DOMINANT became ${ex.exercise_code}, expected a hip-extension substitute`);
  }
  const thrust = allExercises(meso).find((e) => e.exercise_code === 'BARBELL_HIP_THRUST');
  assert.ok(thrust?.prescription.injury_safety_cues_ar?.length > 0, 'knee substitute must carry the knee safety cue');
});

test('knee injury (home): knee-dominant slots become glute bridge, no goblet squat survives', () => {
  const meso = mesocycle({ injuries: ['KNEE'], location: 'HOME' });
  for (const ex of allExercises(meso)) {
    assert.ok(!KNEE_LOADED.has(ex.exercise_code), `home knee plan must not contain ${ex.exercise_code}`);
  }
  const kneeSlots = allExercises(meso).filter((ex) => ex.slot_code === 'KNEE_DOMINANT');
  assert.ok(kneeSlots.length > 0);
  for (const ex of kneeSlots) {
    assert.equal(ex.exercise_code, 'GLUTE_BRIDGE', `home KNEE_DOMINANT became ${ex.exercise_code}`);
  }
});

test('knee + lower-back injuries: the lower-back guard must not reintroduce a knee-loaded substitute', () => {
  for (const location of ['GYM', 'HOME']) {
    const meso = mesocycle({ injuries: ['KNEE', 'LOWER_BACK'], location });
    for (const ex of allExercises(meso)) {
      assert.ok(!KNEE_LOADED.has(ex.exercise_code), `${location} combined plan must not contain ${ex.exercise_code}`);
    }
  }
});

test('no injury: knee-dominant work is unchanged (leg press / goblet squat still prescribed)', () => {
  const meso = mesocycle({ injuries: [] });
  const found = allExercises(meso).some((e) => e.exercise_code === 'LEG_PRESS_MACHINE' || e.exercise_code === 'GOBLET_SQUAT');
  assert.ok(found, 'a healthy gym plan should still contain loaded knee-dominant work');
});

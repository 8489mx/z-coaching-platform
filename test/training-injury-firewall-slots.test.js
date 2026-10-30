import test from 'node:test';
import assert from 'node:assert/strict';

import { adaptIntakePayloadToCanonicalEngine } from '../src/intake-decision-engine/adapters/intake-adapter.js';
import { evaluateIntake } from '../src/intake-decision-engine/index.js';
import { buildTrainingMesoCycle } from '../src/training-engine-v2/index.js';

const ctx = { assessmentDate: '2026-09-19' };

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

const sessions = (meso) => meso.weeks[0].sessions;
const codes = (session) => session.exercises.map((e) => e.exercise_code);
const LOWER_BODY = /SQUAT|LEG_PRESS|LUNGE|HIP_THRUST|GLUTE_BRIDGE|DEADLIFT|RDL|LEG_CURL|CALF/;

test('lower back injury: no axial squat or loaded hinge, and every squat slot stays a lower-body exercise', () => {
  for (const meso of [mesocycle({ injuries: ['LOWER_BACK'] }), mesocycle({ injuries: ['LOWER_BACK'], experience: 'INTERMEDIATE', days: 4 })]) {
    for (const session of sessions(meso)) {
      for (const ex of session.exercises) {
        assert.doesNotMatch(ex.exercise_code, /^BARBELL_(BACK|FRONT)_SQUAT$|DEADLIFT|ROMANIAN|BENT_OVER_ROW|^BARBELL_OVERHEAD_PRESS$|STANDING_DUMBBELL_SHOULDER_PRESS/, `${session.session_code}: ${ex.exercise_code}`);
        if (ex.slot_code === 'KNEE_DOMINANT' || ex.slot_code === 'HIP_HINGE') {
          assert.match(ex.exercise_code, LOWER_BODY, `${session.session_code} ${ex.slot_code} became ${ex.exercise_code}`);
        }
      }
    }
  }
});

test('knee injury: no barbell squat, lunge pattern or knee-loaded substitute, and the knee cue is attached', () => {
  const meso = mesocycle({ injuries: ['KNEE'] });
  for (const session of sessions(meso)) {
    for (const ex of session.exercises) {
      assert.doesNotMatch(ex.exercise_code, /^BARBELL_(BACK|FRONT)_SQUAT$|LUNGE|SPLIT_SQUAT|LEG_PRESS_MACHINE|GOBLET_SQUAT|HACK_SQUAT/, `${session.session_code}: ${ex.exercise_code}`);
    }
  }
  const thrust = sessions(meso).flatMap((s) => s.exercises).find((e) => e.exercise_code === 'BARBELL_HIP_THRUST');
  assert.ok(thrust?.prescription.injury_safety_cues_ar?.length > 0);
});

test('shoulder injury: no barbell bench, incline or overhead press; substitutes are dosed by their own class', () => {
  for (const location of ['GYM', 'HOME']) {
    const meso = mesocycle({ injuries: ['SHOULDER'], location });
    for (const session of sessions(meso)) {
      for (const ex of session.exercises) {
        assert.doesNotMatch(ex.exercise_code, /^BARBELL_BENCH_PRESS$|INCLINE_.*PRESS|OVERHEAD_PRESS|SHOULDER_PRESS/, `${location} ${session.session_code}: ${ex.exercise_code}`);
      }
    }
    const cuff = sessions(meso).flatMap((s) => s.exercises).find((e) => e.exercise_code === 'ROTATOR_CUFF_EXTERNAL_ROTATION');
    assert.ok(cuff, `${location}: overhead press slot should become external-rotation work`);
    assert.ok(cuff.prescription.target_min >= 10, `${location}: cuff work must not inherit heavy 6-8 reps`);
  }
});

test('no session ever repeats the same exercise after substitutions', () => {
  const cases = [
    {}, { location: 'HOME' }, { experience: 'ADVANCED', location: 'HOME' },
    { injuries: ['SHOULDER'] }, { injuries: ['SHOULDER'], location: 'HOME', experience: 'ADVANCED' },
    { injuries: ['LOWER_BACK'] }, { injuries: ['KNEE'] }, { injuries: ['KNEE', 'LOWER_BACK', 'SHOULDER'] },
    { experience: 'INTERMEDIATE', days: 4, injuries: ['LOWER_BACK'] },
  ];
  for (const c of cases) {
    for (const week of mesocycle(c).weeks) {
      for (const session of week.sessions) {
        const list = codes(session);
        assert.equal(new Set(list).size, list.length, `${JSON.stringify(c)} week ${week.week_number} ${session.session_code}: ${list.join(', ')}`);
      }
    }
  }
});

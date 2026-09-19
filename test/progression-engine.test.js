import test from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluateExercise, buildProgressionState, evaluateDeloadTrigger, buildPostDeloadTarget, estimateE1RM,
  resolveIncrementKg, normalizeLoggedExercise, applyDeloadToSession, PROGRESSION_DECISIONS, DELOAD_REASONS,
} from '../src/training-engine-v2/progression/index.js';
import { compileDeloadSession as legacyCompile } from '../src/execution-engines/progressive-overload-deload-engine.js';
import { compileDeloadSession as legacyCompile2 } from '../src/execution-engines/progressive-overload-engine.js';

const bench = (weight_kg, last_set_reps, effort = 'OK') => ({ exercise_code: 'BARBELL_BENCH_PRESS', rep_min: 8, rep_max: 10, weight_kg, last_set_reps, effort });

test('equipment increments and e1RM', () => {
  assert.equal(resolveIncrementKg('BARBELL_BACK_SQUAT'), 2.5);
  assert.equal(resolveIncrementKg('DUMBBELL_LATERAL_RAISE'), 2);
  assert.equal(resolveIncrementKg('LEG_PRESS_MACHINE'), 5);
  assert.equal(resolveIncrementKg('PUSH_UPS_STANDARD'), 0);
  assert.equal(estimateE1RM(100, 5, 0), 116.7);
  assert.equal(estimateE1RM(0, 10), null);
});

test('double progression decisions follow the last set and the effort', () => {
  assert.equal(evaluateExercise(bench(60, 10, 'OK')).decision, PROGRESSION_DECISIONS.INCREASE_WEIGHT);
  assert.equal(evaluateExercise(bench(60, 10, 'OK')).next_weight_kg, 62.5);
  assert.equal(evaluateExercise(bench(60, 10, 'HARD')).decision, PROGRESSION_DECISIONS.HOLD_CONSOLIDATE);
  const add = evaluateExercise(bench(60, 8));
  assert.equal(add.decision, PROGRESSION_DECISIONS.ADD_REPS);
  assert.equal(add.next_rep_target, 9);
  const first = evaluateExercise(bench(60, 6));
  assert.equal(first.decision, PROGRESSION_DECISIONS.HOLD_RETRY);
  const second = evaluateExercise({ ...bench(60, 6), stall_count: first.stall_count });
  assert.equal(second.decision, PROGRESSION_DECISIONS.REDUCE_WEIGHT);
  assert.equal(second.next_weight_kg, 52.5); // 54 rounded down to the 2.5 kg plate step
});

test('dumbbell jumps over 10% require extra reps first (rep-extension bridge)', () => {
  const r = evaluateExercise({ exercise_code: 'DUMBBELL_LATERAL_RAISE', rep_min: 12, rep_max: 15, weight_kg: 8, last_set_reps: 15, effort: 'OK' });
  assert.equal(r.decision, PROGRESSION_DECISIONS.EXTEND_REPS_BEFORE_JUMP);
  assert.equal(r.next_rep_target, 17);
  const jump = evaluateExercise({ exercise_code: 'DUMBBELL_LATERAL_RAISE', rep_min: 12, rep_max: 15, weight_kg: 8, last_set_reps: 17, effort: 'OK' });
  assert.equal(jump.next_weight_kg, 10);
});

test('bodyweight exercises progress by reps and tempo', () => {
  const r = evaluateExercise({ exercise_code: 'PUSH_UPS_STANDARD', rep_min: 10, rep_max: 15, weight_kg: 0, last_set_reps: 15, effort: 'OK' });
  assert.equal(r.decision, PROGRESSION_DECISIONS.BODYWEIGHT_PROGRESS);
  assert.equal(r.next_rep_target, 17);
});

test('log sanitising rejects garbage and defaults the effort', () => {
  assert.equal(normalizeLoggedExercise({ exercise_code: 'X', weight_kg: 'abc', last_set_reps: 5 }), null);
  assert.equal(normalizeLoggedExercise({ exercise_code: 'X', weight_kg: 50, last_set_reps: -1 }), null);
  assert.equal(normalizeLoggedExercise({ exercise_code: 'X', weight_kg: 50, last_set_reps: 8 }).effort, 'OK');
});

const log = (date, week, entries) => ({ created_at: date, week_number: week, logged_exercises: entries });

test('state replays history: target, last success, stalls and performance drops', () => {
  const state = buildProgressionState({
    now: '2026-10-01',
    logs: [
      log('2026-09-20', 1, [bench(60, 10)]),
      log('2026-09-24', 2, [bench(62.5, 8)]),
      log('2026-09-28', 2, [bench(62.5, 9)]),
    ],
  });
  const s = state.exercises.BARBELL_BENCH_PRESS;
  assert.equal(s.last_success_weight_kg, 62.5);
  assert.equal(s.target.weight_kg, 62.5);
  assert.equal(s.target.rep_target, 10);
  assert.equal(s.history.length, 3);
});

test('two sessions of falling e1RM on two exercises + fatigue = deload recommendation for the coach', () => {
  const row = (w, r) => ({ exercise_code: 'BARBELL_BACK_SQUAT', rep_min: 6, rep_max: 8, weight_kg: w, last_set_reps: r, effort: 'OK' });
  const state = buildProgressionState({
    now: '2026-10-01',
    logs: [
      log('2026-09-20', 2, [bench(70, 10), row(100, 8)]),
      log('2026-09-24', 3, [bench(70, 8), row(100, 6)]),
      log('2026-09-28', 3, [bench(70, 6, 'HARD'), row(100, 5, 'HARD')]),
    ],
  });
  assert.deepEqual(state.dropping_exercises.sort(), ['BARBELL_BACK_SQUAT', 'BARBELL_BENCH_PRESS']);
  assert.equal(evaluateDeloadTrigger({ state, biofeedback: { energy_level: 4, sleep_quality: 4 } }).recommended, false, 'performance drop alone is not enough');
  const rec = evaluateDeloadTrigger({ state, biofeedback: { energy_level: 2, sleep_quality: 4 } });
  assert.equal(rec.recommended, true);
  assert.equal(rec.reason, DELOAD_REASONS.PERFORMANCE_FATIGUE);
  assert.equal(evaluateDeloadTrigger({ state: { dropping_exercises: [] }, max_pain_level: 7 }).reason, DELOAD_REASONS.JOINT_PAIN);
});

test('post-deload reset: last success after a scheduled deload, -10% under the stall point for stalled lifts', () => {
  const state = buildProgressionState({
    now: '2026-10-10',
    logs: [
      log('2026-09-20', 3, [bench(70, 9), { ...bench(80, 5), exercise_code: 'BARBELL_OVERHEAD_PRESS' }]),
      log('2026-09-24', 4, [bench(70, 10), { ...bench(80, 5), exercise_code: 'BARBELL_OVERHEAD_PRESS' }]),
      log('2026-10-01', 5, [bench(60, 10), { ...bench(60, 10), exercise_code: 'BARBELL_OVERHEAD_PRESS' }]), // deload week
    ],
  });
  assert.equal(state.exercises.BARBELL_BENCH_PRESS.target.decision, 'POST_DELOAD_RESET');
  assert.equal(state.exercises.BARBELL_BENCH_PRESS.target.weight_kg, 70);
  assert.equal(state.exercises.BARBELL_OVERHEAD_PRESS.target.weight_kg, 70); // stalled at 80: 80 x 0.9 = 72 -> 70 on the 2.5 kg plate step
});

test('post-deload rules in isolation', () => {
  assert.deepEqual(buildPostDeloadTarget({ exercise_code: 'BARBELL_BENCH_PRESS', last_success_weight_kg: 70 }), { weight_kg: 70, rule: 'LAST_SUCCESS' });
  assert.equal(buildPostDeloadTarget({ exercise_code: 'BARBELL_BENCH_PRESS', last_success_weight_kg: 70, stall_weight_kg: 75, affected: true }).weight_kg, 67.5);
  assert.equal(buildPostDeloadTarget({ exercise_code: 'BARBELL_BENCH_PRESS', last_success_weight_kg: 70, affected: true, reason: DELOAD_REASONS.JOINT_PAIN }).weight_kg, 55);
  assert.equal(buildPostDeloadTarget({ exercise_code: 'BARBELL_BENCH_PRESS', last_success_weight_kg: 70, days_since_last_session: 20 }).weight_kg, 62.5);
});

test('approved deload windows mark the state active and deload sessions', () => {
  const state = buildProgressionState({
    now: '2026-10-03',
    logs: [log('2026-09-28', 3, [bench(70, 9)])],
    deload_windows: [{ starts_at: '2026-10-01', ends_at: '2026-10-08', reason: DELOAD_REASONS.PERFORMANCE_FATIGUE }],
  });
  assert.equal(state.deload.status, 'ACTIVE');
  const session = applyDeloadToSession({ exercises: [{ sets: 4, target_rir: 1 }] });
  assert.equal(session.exercises[0].sets, 2);
  assert.equal(session.exercises[0].target_rir, 4);
  assert.equal(legacyCompile, applyDeloadToSession);
  assert.equal(legacyCompile2, applyDeloadToSession);
});

import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveMesocycleWeekConfigs,
  evaluateFinalTrainingWeeks,
} from "../src/training-engine-v2/build-training-mesocycle.js";
import { getExerciseV2ByCode } from "../src/exercise-catalog-v2/index.js";
import {
  buildProgressionState,
  evaluateExercise,
  normalizeLoggedExercise,
  applyDeloadToSession,
} from "../frontend/src/utils/progressionEngine.js";

test("P1-B9: one fatigue threshold (7) for week 4 and week 5", () => {
  const at6 = resolveMesocycleWeekConfigs({ experience: "ADVANCED", fatigueScore: 6 });
  const at7 = resolveMesocycleWeekConfigs({ experience: "ADVANCED", fatigueScore: 7 });
  assert.equal(at6[3].target_rir, 1);
  assert.equal(at7[3].target_rir, 2);
});

test("P1-B9: fatigue deloads even when data is insufficient", () => {
  const configs = resolveMesocycleWeekConfigs({ experience: "ADVANCED", fatigueScore: 9, dataQuality: "INSUFFICIENT" });
  assert.equal(configs[4].phase, "DELOAD");
});

test("P1-B9: week 6 ramps after a deload and continues after consolidation", () => {
  const afterDeload = resolveMesocycleWeekConfigs({ experience: "ADVANCED", weeksCount: 6, plannedDeload: true });
  assert.equal(afterDeload[4].phase, "DELOAD");
  assert.equal(afterDeload[5].target_rir, afterDeload[0].target_rir);
  assert.equal(afterDeload[5].volume_modifier, 1.0);
  assert.equal(afterDeload[5].set_delta, 0);
  assert.match(afterDeload[5].focus_note, /عودة/);
  const afterConsolidation = resolveMesocycleWeekConfigs({ experience: "ADVANCED", weeksCount: 6, plannedDeload: false });
  assert.equal(afterConsolidation[5].target_rir, 2);
});

test("P1-B9: RIR 0 is never configurable (week-4 target and custom configs clamp to 1)", () => {
  const configs = resolveMesocycleWeekConfigs({ experience: "ADVANCED", targetRirWeek4: 0 });
  assert.ok(configs[3].target_rir >= 1);
  const custom = resolveMesocycleWeekConfigs({
    experience: "ADVANCED",
    customWeeksConfig: [{ week_number: 1, target_rir: 0, volume_modifier: 1.0, set_delta: 0 }],
  });
  assert.ok(custom[0].target_rir >= 1);
});

test("P1-B9: V1 passthrough codes resolve to V2 records", () => {
  for (const code of ["HIP_THRUST", "DUMBBELL_BICEPS_CURL", "CLOSE_GRIP_PUSH_UP", "DUMBBELL_CALF_RAISE", "SPLIT_SQUAT", "DUMBBELL_REVERSE_LUNGE", "PUSH_UP"]) {
    const record = getExerciseV2ByCode(code);
    assert.ok(record, `${code} should resolve`);
    assert.ok(record.primary_muscle, `${code} should carry a primary muscle`);
  }
});

test("P1-B9: a plain week-5 log is not a deload; an explicit flag still is", () => {
  const entry = { exercise_code: "BARBELL_BENCH_PRESS", weight_kg: 40, last_set_reps: 8, rep_min: 6, rep_max: 8, effort: "OK" };
  const plain = buildProgressionState({ logs: [{ created_at: "2026-11-03", week_number: 5, logged_exercises: [entry] }], now: "2026-11-04" });
  assert.equal(plain.exercises.BARBELL_BENCH_PRESS.history[0].is_deload, false);
  assert.equal(plain.exercises.BARBELL_BENCH_PRESS.target.decision, "INCREASE_WEIGHT");
  const flagged = buildProgressionState({ logs: [{ created_at: "2026-11-03", week_number: 5, is_deload: true, logged_exercises: [entry] }], now: "2026-11-04" });
  assert.equal(flagged.exercises.BARBELL_BENCH_PRESS.history[0].is_deload, true);
});

test("P1-B9: pain and substitution flags survive logging and block auto-increase", () => {
  const painEntry = normalizeLoggedExercise({ exercise_code: "BARBELL_BENCH_PRESS", weight_kg: 40, last_set_reps: 8, rep_min: 6, rep_max: 8, effort: "OK", joint_pain_reported: true });
  assert.equal(painEntry.joint_pain_reported, true);
  const subEntry = normalizeLoggedExercise({ exercise_code: "BARBELL_BENCH_PRESS", weight_kg: 40, last_set_reps: 8, rep_min: 6, rep_max: 8, effort: "OK", clinically_substituted: true });
  assert.equal(subEntry.clinically_substituted, true);
  const painState = buildProgressionState({ logs: [{ created_at: "2026-11-03", week_number: 1, logged_exercises: [{ exercise_code: "BARBELL_BENCH_PRESS", weight_kg: 40, last_set_reps: 8, rep_min: 6, rep_max: 8, effort: "OK", joint_pain_reported: true }] }], now: "2026-11-04" });
  assert.equal(painState.exercises.BARBELL_BENCH_PRESS.target.decision, "HOLD_CONSOLIDATE");
  assert.equal(painState.exercises.BARBELL_BENCH_PRESS.target.requires_coach_review, true);
  const subDecision = evaluateExercise({ exercise_code: "BARBELL_BENCH_PRESS", weight_kg: 40, last_set_reps: 8, rep_min: 6, rep_max: 8, effort: "OK", clinically_substituted: true });
  assert.equal(subDecision.decision, "HOLD_CONSOLIDATE");
  assert.equal(subDecision.requires_coach_review, true);
});

test("P1-B9: deloading a session requires an active window", () => {
  const session = { title_ar: "تمرين اليوم", exercises: [{ exercise_code: "X", sets: 4, target_rir: 2 }] };
  const bare = applyDeloadToSession(session);
  assert.equal(bare.is_deload, undefined);
  assert.equal(bare.exercises[0].sets, 4);
  const authed = applyDeloadToSession(session, { deload: { status: "ACTIVE" } });
  assert.equal(authed.is_deload, true);
  assert.equal(authed.exercises[0].sets, 2);
});

test("P1-B9: final preflight flags held slots and still catches duplicates", () => {
  const held = evaluateFinalTrainingWeeks([{ week_number: 1, sessions: [{ session_code: "A", exercises: [{ slot_code: "VERTICAL_PULL", held_for_review: true, held_reason: "DEDUP_EXHAUSTED" }] }] }], {});
  assert.equal(held.status, "REVIEW_REQUIRED");
  assert.ok(held.violations.some((v) => v.code === "DEDUP_SLOT_HELD_FOR_REVIEW"));
  const dup = evaluateFinalTrainingWeeks([{ week_number: 1, sessions: [{ session_code: "A", exercises: [{ exercise_code: "PUSH_UP" }, { exercise_code: "PUSH_UP" }] }] }], {});
  assert.equal(dup.status, "REVIEW_REQUIRED");
  assert.ok(dup.violations.some((v) => v.code === "FINAL_DUPLICATE_EXERCISE"));
});

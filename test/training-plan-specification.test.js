import assert from "node:assert/strict";
import test from "node:test";

import { PlanStatus } from "../src/intake-decision-engine/index.js";
import {
  TRAINING_PLAN_SPEC_VERSION,
  TrainingPlanStatus,
  TrainingSessionFocus,
  TrainingSplitCode,
  buildTrainingPlanSpec,
} from "../src/training-plan-specification/index.js";

const trainingConstraint = {
  code: "AVAILABLE_TRAINING_EQUIPMENT",
  scope: "TRAINING",
  value: { equipmentCode: "DUMBBELLS", loadCapacity: "MODERATE" },
  reason: "Future exercises must respect the available equipment.",
};
const trainingReason = {
  code: "PREFERRED_TRAINING_DAYS_APPLIED",
  scope: "TRAINING",
  message: "The preferred day count fits all higher-priority constraints.",
};
const codesAndFocus = (sessions) =>
  sessions.map(({ session_code: sessionCode, focus }) => [sessionCode, focus]);

const intakeDecision = ({
  planStatus = PlanStatus.READY_FOR_DRAFT,
  recommendedDays = 4,
  scheduleMode = "FIXED_DAYS",
  introWeekRequired = true,
  volumeStart = "CONSERVATIVE",
  constraints = [trainingConstraint],
  reasons = [trainingReason],
} = {}) => ({
  plan_status: planStatus,
  training_decision: {
    recommended_days: recommendedDays,
    schedule_mode: scheduleMode,
    intro_week_required: introWeekRequired,
    volume_start: volumeStart,
    constraints,
    reasons,
  },
});

test("two recommended days produce a two-session full-body skeleton", () => {
  const result = buildTrainingPlanSpec(intakeDecision({ recommendedDays: 2 }));

  assert.equal(result.split_code, TrainingSplitCode.FULL_BODY);
  assert.deepEqual(result.sessions, [
    { sequence: 1, session_code: "FULL_BODY_A", focus: TrainingSessionFocus.FULL_BODY },
    { sequence: 2, session_code: "FULL_BODY_B", focus: TrainingSessionFocus.FULL_BODY },
  ]);
});

test("three recommended days produce a three-session full-body skeleton", () => {
  const result = buildTrainingPlanSpec(intakeDecision({ recommendedDays: 3 }));

  assert.equal(result.split_code, TrainingSplitCode.FULL_BODY);
  assert.deepEqual(
    codesAndFocus(result.sessions),
    [
      ["FULL_BODY_A", TrainingSessionFocus.FULL_BODY],
      ["FULL_BODY_B", TrainingSessionFocus.FULL_BODY],
      ["FULL_BODY_C", TrainingSessionFocus.FULL_BODY],
    ],
  );
});

test("four recommended days produce the upper-lower skeleton", () => {
  const result = buildTrainingPlanSpec(intakeDecision({ recommendedDays: 4 }));

  assert.equal(result.split_code, TrainingSplitCode.UPPER_LOWER);
  assert.deepEqual(
    codesAndFocus(result.sessions),
    [
      ["UPPER_A", TrainingSessionFocus.UPPER_BODY],
      ["LOWER_A", TrainingSessionFocus.LOWER_BODY],
      ["UPPER_B", TrainingSessionFocus.UPPER_BODY],
      ["LOWER_B", TrainingSessionFocus.LOWER_BODY],
    ],
  );
});

test("five recommended days produce the upper-lower-PPL skeleton", () => {
  const result = buildTrainingPlanSpec(intakeDecision({ recommendedDays: 5 }));

  assert.equal(result.split_code, TrainingSplitCode.UPPER_LOWER_PPL);
  assert.deepEqual(
    codesAndFocus(result.sessions),
    [
      ["UPPER_A", TrainingSessionFocus.UPPER_BODY],
      ["LOWER_A", TrainingSessionFocus.LOWER_BODY],
      ["PUSH_A", TrainingSessionFocus.PUSH],
      ["PULL_A", TrainingSessionFocus.PULL],
      ["LEGS_A", TrainingSessionFocus.LEGS],
    ],
  );
});

test("six recommended days produce the push-pull-legs skeleton", () => {
  const result = buildTrainingPlanSpec(intakeDecision({ recommendedDays: 6 }));

  assert.equal(result.split_code, TrainingSplitCode.PUSH_PULL_LEGS);
  assert.deepEqual(
    codesAndFocus(result.sessions),
    [
      ["PUSH_A", TrainingSessionFocus.PUSH],
      ["PULL_A", TrainingSessionFocus.PULL],
      ["LEGS_A", TrainingSessionFocus.LEGS],
      ["PUSH_B", TrainingSessionFocus.PUSH],
      ["PULL_B", TrainingSessionFocus.PULL],
      ["LEGS_B", TrainingSessionFocus.LEGS],
    ],
  );
});

test("session sequence is contiguous and starts at one", () => {
  const result = buildTrainingPlanSpec(intakeDecision({ recommendedDays: 6 }));

  assert.deepEqual(
    result.sessions.map((session) => session.sequence),
    [1, 2, 3, 4, 5, 6],
  );
});

test("ready-for-draft produces a ready specification", () => {
  const result = buildTrainingPlanSpec(intakeDecision({ recommendedDays: 3 }));

  assert.equal(result.spec_version, TRAINING_PLAN_SPEC_VERSION);
  assert.equal(result.status, TrainingPlanStatus.READY);
  assert.equal(result.sessions.length, 3);
});

test("coach review produces a provisional specification with sessions", () => {
  const result = buildTrainingPlanSpec(
    intakeDecision({
      planStatus: PlanStatus.COACH_REVIEW_REQUIRED,
      recommendedDays: 3,
    }),
  );

  assert.equal(result.status, TrainingPlanStatus.PROVISIONAL_REVIEW_REQUIRED);
  assert.equal(result.sessions.length, 3);
});

test("coach review with zero recommended days stays provisional without a split", () => {
  const input = intakeDecision({
    planStatus: PlanStatus.COACH_REVIEW_REQUIRED,
    recommendedDays: 0,
  });
  const result = buildTrainingPlanSpec(input);

  assert.equal(result.status, TrainingPlanStatus.PROVISIONAL_REVIEW_REQUIRED);
  assert.equal(result.recommended_days, 0);
  assert.equal(result.split_code, null);
  assert.deepEqual(result.sessions, []);
  assert.deepEqual(result.constraints, input.training_decision.constraints);
  assert.deepEqual(result.reasons, input.training_decision.reasons);
});

test("medical review withholds the training skeleton", () => {
  const result = buildTrainingPlanSpec(
    intakeDecision({
      planStatus: PlanStatus.MEDICAL_REVIEW_REQUIRED,
      recommendedDays: 4,
    }),
  );

  assert.equal(result.status, TrainingPlanStatus.WITHHELD);
  assert.equal(result.split_code, null);
  assert.deepEqual(result.sessions, []);
});

test("blocked intake withholds the training skeleton", () => {
  const result = buildTrainingPlanSpec(
    intakeDecision({ planStatus: PlanStatus.BLOCKED, recommendedDays: 4 }),
  );

  assert.equal(result.status, TrainingPlanStatus.WITHHELD);
  assert.equal(result.split_code, null);
  assert.deepEqual(result.sessions, []);
});

test("training decision fields, constraints, and reasons pass through unchanged", () => {
  const input = intakeDecision({
    recommendedDays: 4,
    scheduleMode: "SESSION_SEQUENCE",
    introWeekRequired: false,
    volumeStart: "NORMAL",
  });
  const snapshot = structuredClone(input);
  const result = buildTrainingPlanSpec(input);

  assert.equal(result.recommended_days, input.training_decision.recommended_days);
  assert.equal(result.schedule_mode, input.training_decision.schedule_mode);
  assert.equal(result.intro_week_required, input.training_decision.intro_week_required);
  assert.equal(result.volume_start, input.training_decision.volume_start);
  assert.deepEqual(result.constraints, input.training_decision.constraints);
  assert.deepEqual(result.reasons, input.training_decision.reasons);
  assert.deepEqual(input, snapshot);
});

import assert from "node:assert/strict";
import test from "node:test";

import { VolumeStart } from "../src/intake-decision-engine/index.js";
import { TrainingPlanStatus } from "../src/training-plan-specification/index.js";
import { MovementSlotCode } from "../src/training-session-blueprint/index.js";
import {
  ExercisePrescriptionUnit,
  getExerciseByCode,
} from "../src/exercise-catalog/index.js";
import {
  EXERCISE_SELECTION_VERSION,
  ExerciseSlotSelectionStatus,
} from "../src/exercise-selection/index.js";
import {
  TRAINING_PRESCRIPTION_VERSION,
  buildTrainingPrescription,
} from "../src/training-prescription/index.js";

const PRIMARY_SLOTS = new Set([
  MovementSlotCode.KNEE_DOMINANT,
  MovementSlotCode.HIP_HINGE,
  MovementSlotCode.UNILATERAL_LOWER,
  MovementSlotCode.HORIZONTAL_PUSH,
  MovementSlotCode.HORIZONTAL_PULL,
  MovementSlotCode.VERTICAL_PUSH,
  MovementSlotCode.VERTICAL_PULL,
]);

const ACCESSORY_SLOTS = new Set([
  MovementSlotCode.KNEE_FLEXION,
  MovementSlotCode.CALF_RAISE,
  MovementSlotCode.SHOULDER_ABDUCTION,
  MovementSlotCode.REAR_DELT,
  MovementSlotCode.ELBOW_FLEXION,
  MovementSlotCode.ELBOW_EXTENSION,
]);

const SESSION_FIXTURES = [
  {
    session_code: "PUSH_A",
    focus: "PUSH",
    exercises: [
      [MovementSlotCode.HORIZONTAL_PUSH, "PUSH_UP"],
      [MovementSlotCode.VERTICAL_PUSH, "STANDING_DUMBBELL_SHOULDER_PRESS"],
      [MovementSlotCode.SHOULDER_ABDUCTION, "CABLE_LATERAL_RAISE"],
      [MovementSlotCode.ELBOW_EXTENSION, "BAND_TRICEPS_EXTENSION"],
    ],
  },
  {
    session_code: "PULL_A",
    focus: "PULL",
    exercises: [
      [MovementSlotCode.VERTICAL_PULL, "LAT_PULLDOWN"],
      [MovementSlotCode.HORIZONTAL_PULL, "ONE_ARM_DUMBBELL_ROW"],
      [MovementSlotCode.REAR_DELT, "BAND_FACE_PULL"],
      [MovementSlotCode.ELBOW_FLEXION, "BAND_BICEPS_CURL"],
    ],
  },
  {
    session_code: "LEGS_A",
    focus: "LEGS",
    exercises: [
      [MovementSlotCode.KNEE_DOMINANT, "BODYWEIGHT_SQUAT"],
      [MovementSlotCode.HIP_HINGE, "DUMBBELL_ROMANIAN_DEADLIFT"],
      [MovementSlotCode.UNILATERAL_LOWER, "SPLIT_SQUAT"],
      [MovementSlotCode.KNEE_FLEXION, "HAMSTRING_WALKOUT"],
      [MovementSlotCode.CALF_RAISE, "STANDING_CALF_RAISE"],
      [MovementSlotCode.CORE_STABILITY, "DEAD_BUG"],
    ],
  },
  {
    session_code: "PUSH_B",
    focus: "PUSH",
    exercises: [
      [MovementSlotCode.VERTICAL_PUSH, "PIKE_PUSH_UP"],
      [MovementSlotCode.HORIZONTAL_PUSH, "DUMBBELL_FLOOR_PRESS"],
      [MovementSlotCode.SHOULDER_ABDUCTION, "DUMBBELL_LATERAL_RAISE"],
      [MovementSlotCode.ELBOW_EXTENSION, "CLOSE_GRIP_PUSH_UP"],
    ],
  },
  {
    session_code: "PULL_B",
    focus: "PULL",
    exercises: [
      [MovementSlotCode.HORIZONTAL_PULL, "RESISTANCE_BAND_ROW"],
      [MovementSlotCode.VERTICAL_PULL, "BAND_LAT_PULLDOWN"],
      [MovementSlotCode.REAR_DELT, "DUMBBELL_REAR_DELT_RAISE"],
      [MovementSlotCode.ELBOW_FLEXION, "DUMBBELL_BICEPS_CURL"],
    ],
  },
  {
    session_code: "LEGS_B",
    focus: "LEGS",
    exercises: [
      [MovementSlotCode.HIP_HINGE, "GLUTE_BRIDGE"],
      [MovementSlotCode.KNEE_DOMINANT, "GOBLET_SQUAT"],
      [MovementSlotCode.KNEE_FLEXION, "LYING_LEG_CURL_MACHINE"],
      [MovementSlotCode.UNILATERAL_LOWER, "DUMBBELL_REVERSE_LUNGE"],
      [MovementSlotCode.CALF_RAISE, "DUMBBELL_CALF_RAISE"],
      [MovementSlotCode.CORE_STABILITY, "FRONT_PLANK"],
    ],
  },
];

const durationConstraint = (minutes) => ({
  code: "TRAINING_MAX_SESSION_DURATION",
  scope: "TRAINING",
  value: { minutes },
  reason: "A future session must fit the client's maximum duration.",
});

const locationConstraint = {
  code: "TRAINING_LOCATION",
  scope: "TRAINING",
  value: { location: "GYM" },
  reason: "Exercise selection must be feasible at the reported location.",
};

const trainingReason = {
  code: "PREFERRED_TRAINING_DAYS_APPLIED",
  scope: "TRAINING",
  message: "The preferred day count fits all higher-priority constraints.",
};

function selectedSlot(order, slotCode, exerciseCode) {
  const exercise = getExerciseByCode(exerciseCode);
  assert.ok(exercise, `Expected ${exerciseCode} in Exercise Catalog.`);
  return {
    order,
    slot_code: slotCode,
    selection_status: ExerciseSlotSelectionStatus.SELECTED,
    exercise_code: exerciseCode,
    name_en: exercise.name_en,
    reason_code: "SELECTED_STANDARD_GYM_EQUIPMENT",
    source_constraint_codes: [],
  };
}

function makeSessions() {
  return SESSION_FIXTURES.map((session, index) => ({
    sequence: index + 1,
    session_code: session.session_code,
    focus: session.focus,
    exercises: session.exercises.map(([slotCode, exerciseCode], exerciseIndex) =>
      selectedSlot(exerciseIndex + 1, slotCode, exerciseCode),
    ),
  }));
}

function makeSelection({
  status = TrainingPlanStatus.READY,
  volumeStart = VolumeStart.NORMAL,
  durationMinutes = 45,
  sessions = makeSessions(),
  constraints = [durationConstraint(durationMinutes), locationConstraint],
  reasons = [trainingReason],
} = {}) {
  return {
    selection_version: EXERCISE_SELECTION_VERSION,
    status,
    recommended_days: 6,
    split_code: "PUSH_PULL_LEGS",
    schedule_mode: "FIXED_DAYS",
    intro_week_required: true,
    volume_start: volumeStart,
    sessions,
    constraints,
    reasons,
  };
}

const allExercises = (prescription) =>
  prescription.sessions.flatMap(({ exercises }) => exercises);

function exerciseByCode(prescription, exerciseCode) {
  const exercise = allExercises(prescription).find(
    ({ exercise_code: code }) => code === exerciseCode,
  );
  assert.ok(exercise, `Expected prescribed exercise ${exerciseCode}.`);
  return exercise;
}

test("normal sessions over 30 minutes apply category sets, units, targets, and rest", () => {
  const result = buildTrainingPrescription(makeSelection());

  for (const exercise of allExercises(result)) {
    if (PRIMARY_SLOTS.has(exercise.slot_code)) {
      assert.equal(exercise.prescription.sets, 3);
      assert.equal(exercise.prescription.rest_seconds, 90);
      assert.equal(exercise.prescription.target_min, 8);
      assert.equal(exercise.prescription.target_max, 12);
    } else if (ACCESSORY_SLOTS.has(exercise.slot_code)) {
      assert.equal(exercise.prescription.sets, 2);
      assert.equal(exercise.prescription.rest_seconds, 60);
      assert.equal(exercise.prescription.target_min, 10);
      assert.equal(exercise.prescription.target_max, 15);
    }
  }

  assert.deepEqual(exerciseByCode(result, "BODYWEIGHT_SQUAT").prescription, {
    sets: 3,
    unit: ExercisePrescriptionUnit.REPS,
    target_min: 8,
    target_max: 12,
    rest_seconds: 90,
  });
  assert.deepEqual(exerciseByCode(result, "SPLIT_SQUAT").prescription, {
    sets: 3,
    unit: ExercisePrescriptionUnit.REPS_PER_SIDE,
    target_min: 8,
    target_max: 12,
    rest_seconds: 90,
  });
  assert.deepEqual(exerciseByCode(result, "CABLE_LATERAL_RAISE").prescription, {
    sets: 2,
    unit: ExercisePrescriptionUnit.REPS_PER_SIDE,
    target_min: 10,
    target_max: 15,
    rest_seconds: 60,
  });
  assert.deepEqual(exerciseByCode(result, "HAMSTRING_WALKOUT").prescription, {
    sets: 2,
    unit: ExercisePrescriptionUnit.REPS,
    target_min: 10,
    target_max: 15,
    rest_seconds: 60,
  });
  assert.deepEqual(exerciseByCode(result, "DEAD_BUG").prescription, {
    sets: 2,
    unit: ExercisePrescriptionUnit.REPS_PER_SIDE,
    target_min: 8,
    target_max: 12,
    rest_seconds: 45,
  });
  assert.deepEqual(exerciseByCode(result, "FRONT_PLANK").prescription, {
    sets: 2,
    unit: ExercisePrescriptionUnit.SECONDS,
    target_min: 20,
    target_max: 30,
    rest_seconds: 45,
  });
});

test("conservative sessions over 30 minutes use two sets for every selected exercise", () => {
  const result = buildTrainingPrescription(
    makeSelection({ volumeStart: VolumeStart.CONSERVATIVE }),
  );

  assert.ok(allExercises(result).every(({ prescription }) => prescription.sets === 2));
});

test("a 30-minute session uses two sets and the reduced category rest periods", () => {
  const result = buildTrainingPrescription(makeSelection({ durationMinutes: 30 }));

  for (const exercise of allExercises(result)) {
    assert.equal(exercise.prescription.sets, 2);
    const expectedRest = PRIMARY_SLOTS.has(exercise.slot_code)
      ? 60
      : ACCESSORY_SLOTS.has(exercise.slot_code)
        ? 45
        : 30;
    assert.equal(exercise.prescription.rest_seconds, expectedRest);
  }
});

test("provisional status is preserved while review slots receive no prescription", () => {
  const sessions = makeSessions();
  const originalSelectedSlot = sessions[0].exercises[0];
  const reviewSlot = {
    ...originalSelectedSlot,
    selection_status: ExerciseSlotSelectionStatus.REVIEW_REQUIRED,
    exercise_code: null,
    name_en: null,
    reason_code: "MOVEMENT_CONSTRAINT_REQUIRES_REVIEW",
    source_constraint_codes: ["INJURY_AFFECTED_MOVEMENT"],
  };
  sessions[0] = {
    ...sessions[0],
    exercises: [reviewSlot, ...sessions[0].exercises.slice(1)],
  };

  const result = buildTrainingPrescription(
    makeSelection({
      status: TrainingPlanStatus.PROVISIONAL_REVIEW_REQUIRED,
      sessions,
    }),
  );

  assert.equal(result.status, TrainingPlanStatus.PROVISIONAL_REVIEW_REQUIRED);
  assert.deepEqual(result.sessions[0].exercises[0], {
    ...reviewSlot,
    prescription: null,
  });
  assert.ok(result.sessions[0].exercises[1].prescription);
});

test("withheld and zero-session provisional selections do not require duration", () => {
  const withheld = buildTrainingPrescription(
    makeSelection({ status: TrainingPlanStatus.WITHHELD, constraints: [] }),
  );
  assert.equal(withheld.status, TrainingPlanStatus.WITHHELD);
  assert.deepEqual(withheld.sessions, []);

  const provisional = buildTrainingPrescription(
    makeSelection({
      status: TrainingPlanStatus.PROVISIONAL_REVIEW_REQUIRED,
      sessions: [],
      constraints: [],
    }),
  );
  assert.equal(provisional.status, TrainingPlanStatus.PROVISIONAL_REVIEW_REQUIRED);
  assert.deepEqual(provisional.sessions, []);
});

test("session duration must be one positive integer constraint when sessions exist", () => {
  const invalidConstraints = [
    [locationConstraint],
    [durationConstraint(45), durationConstraint(30), locationConstraint],
    [durationConstraint(0), locationConstraint],
    [durationConstraint(-1), locationConstraint],
    [durationConstraint(30.5), locationConstraint],
    [durationConstraint("30"), locationConstraint],
  ];

  for (const constraints of invalidConstraints) {
    assert.throws(
      () => buildTrainingPrescription(makeSelection({ constraints })),
      TypeError,
    );
  }
});

test("an unknown selected exercise_code throws TypeError", () => {
  const sessions = makeSessions();
  sessions[0].exercises[0] = {
    ...sessions[0].exercises[0],
    exercise_code: "UNKNOWN_EXERCISE",
    name_en: "Unknown Exercise",
  };

  assert.throws(
    () => buildTrainingPrescription(makeSelection({ sessions })),
    TypeError,
  );
});

test("a SECONDS exercise outside CORE_STABILITY throws TypeError", () => {
  const sessions = makeSessions();
  sessions[0].exercises[0] = selectedSlot(
    1,
    MovementSlotCode.HORIZONTAL_PUSH,
    "FRONT_PLANK",
  );

  assert.throws(
    () => buildTrainingPrescription(makeSelection({ sessions })),
    TypeError,
  );
});

test("public version and all upstream fields pass through with only prescription added", () => {
  const input = makeSelection();
  const result = buildTrainingPrescription(input);

  assert.equal(TRAINING_PRESCRIPTION_VERSION, "training-prescription-v1");
  assert.equal(result.prescription_version, TRAINING_PRESCRIPTION_VERSION);
  assert.deepEqual(Object.keys(result).sort(), [
    "constraints",
    "intro_week_required",
    "prescription_version",
    "reasons",
    "recommended_days",
    "schedule_mode",
    "sessions",
    "split_code",
    "status",
    "volume_start",
  ]);
  for (const field of [
    "status",
    "recommended_days",
    "split_code",
    "schedule_mode",
    "intro_week_required",
    "volume_start",
  ]) {
    assert.equal(result[field], input[field]);
  }
  assert.strictEqual(result.constraints, input.constraints);
  assert.strictEqual(result.reasons, input.reasons);

  assert.equal(result.sessions.length, input.sessions.length);
  for (const [sessionIndex, inputSession] of input.sessions.entries()) {
    const outputSession = result.sessions[sessionIndex];
    for (const field of ["sequence", "session_code", "focus"]) {
      assert.equal(outputSession[field], inputSession[field]);
    }
    assert.equal(outputSession.exercises.length, inputSession.exercises.length);
    for (const [exerciseIndex, inputSlot] of inputSession.exercises.entries()) {
      const outputSlot = outputSession.exercises[exerciseIndex];
      const { prescription, ...passedThroughFields } = outputSlot;
      assert.deepEqual(passedThroughFields, inputSlot);
      assert.strictEqual(outputSlot.source_constraint_codes, inputSlot.source_constraint_codes);
      assert.ok(prescription);
    }
  }

  assert.deepEqual(Object.keys(result.sessions[0].exercises[0].prescription).sort(), [
    "rest_seconds",
    "sets",
    "target_max",
    "target_min",
    "unit",
  ]);
});

test("building a training prescription does not modify Exercise Selection input", () => {
  const input = makeSelection();
  const snapshot = structuredClone(input);

  buildTrainingPrescription(input);

  assert.deepEqual(input, snapshot);
});

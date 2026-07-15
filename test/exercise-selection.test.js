import assert from "node:assert/strict";
import test from "node:test";

import {
  EquipmentCode,
  EquipmentLoadCapacity,
  Movement,
  RestrictionInstruction,
  TrainingLocation,
} from "../src/intake-decision-engine/index.js";
import {
  TrainingPlanStatus,
  buildTrainingPlanSpec,
} from "../src/training-plan-specification/index.js";
import {
  MovementSlotCode,
  buildTrainingSessionBlueprint,
} from "../src/training-session-blueprint/index.js";
import {
  EXERCISE_SELECTION_VERSION,
  ExerciseSlotSelectionStatus,
  buildExerciseSelection,
} from "../src/exercise-selection/index.js";

const BASE_REASON = {
  code: "PREFERRED_TRAINING_DAYS_APPLIED",
  scope: "TRAINING",
  message: "The preferred day count fits all higher-priority constraints.",
};

const BROAD_EQUIPMENT = [
  { equipmentCode: EquipmentCode.DUMBBELLS, loadCapacity: EquipmentLoadCapacity.LIGHT },
  {
    equipmentCode: EquipmentCode.RESISTANCE_BANDS,
    loadCapacity: EquipmentLoadCapacity.LIGHT,
  },
  { equipmentCode: EquipmentCode.CABLE_STATION, loadCapacity: EquipmentLoadCapacity.LIGHT },
  {
    equipmentCode: EquipmentCode.SELECTORIZED_MACHINES,
    loadCapacity: EquipmentLoadCapacity.LIGHT,
  },
];

const locationConstraint = (location) => ({
  code: "TRAINING_LOCATION",
  scope: "TRAINING",
  value: { location },
  reason: "Exercise selection must be feasible at the reported location.",
});

const equipmentConstraint = ({ equipmentCode, loadCapacity }) => ({
  code: "AVAILABLE_TRAINING_EQUIPMENT",
  scope: "TRAINING",
  value: { equipmentCode, loadCapacity },
  reason: "Future exercises must respect both equipment type and load capacity.",
});

const movementConstraint = (
  code,
  movement,
  { instruction = RestrictionInstruction.AVOID } = {},
) => {
  const value = { movement };
  if (code === "INJURY_AFFECTED_MOVEMENT") {
    value.area = "REPORTED_AREA";
  } else {
    value.area = code === "INJURY_MEDICAL_RESTRICTION" ? "REPORTED_AREA" : undefined;
    value.instruction = instruction;
    value.source = "PHYSICIAN";
  }

  return {
    code,
    scope: "GLOBAL",
    value,
    reason: "The structured movement constraint must remain visible.",
  };
};

function makeBlueprint({
  planStatus = "READY_FOR_DRAFT",
  recommendedDays = 4,
  location = TrainingLocation.GYM,
  includeLocation = true,
  equipment = [],
  introWeekRequired = false,
  scheduleMode = "FIXED_DAYS",
  volumeStart = "NORMAL",
  reasons = [BASE_REASON],
} = {}) {
  const constraints = [
    ...(includeLocation ? [locationConstraint(location)] : []),
    ...equipment.map(equipmentConstraint),
  ];
  const planSpec = buildTrainingPlanSpec({
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

  return buildTrainingSessionBlueprint(planSpec);
}

const allSelections = (selection) =>
  selection.sessions.flatMap(({ exercises }) => exercises);

function firstSelectionFor(selection, slotCode) {
  const result = allSelections(selection).find(({ slot_code: code }) => code === slotCode);
  assert.ok(result, `Expected selection output for ${slotCode}.`);
  return result;
}

const reviewSlotCodes = (selection) =>
  [
    ...new Set(
      allSelections(selection)
        .filter(
          ({ selection_status: status }) =>
            status === ExerciseSlotSelectionStatus.REVIEW_REQUIRED,
        )
        .map(({ slot_code: slotCode }) => slotCode),
    ),
  ].sort();

test("explicit dumbbell equipment wins over bodyweight when other priorities tie", () => {
  const blueprint = makeBlueprint({
    equipment: [
      { equipmentCode: EquipmentCode.DUMBBELLS, loadCapacity: EquipmentLoadCapacity.LIGHT },
      {
        equipmentCode: EquipmentCode.RESISTANCE_BANDS,
        loadCapacity: EquipmentLoadCapacity.LIGHT,
      },
    ],
  });
  const result = buildExerciseSelection({ trainingSessionBlueprint: blueprint, hardConstraints: [] });

  assert.deepEqual(firstSelectionFor(result, MovementSlotCode.KNEE_DOMINANT), {
    order: 1,
    slot_code: MovementSlotCode.KNEE_DOMINANT,
    selection_status: ExerciseSlotSelectionStatus.SELECTED,
    exercise_code: "GOBLET_SQUAT",
    name_en: "Goblet Squat",
    reason_code: "SELECTED_EXPLICIT_EQUIPMENT",
    source_constraint_codes: [],
  });
  assert.equal(firstSelectionFor(result, MovementSlotCode.HIP_HINGE).exercise_code, "DUMBBELL_ROMANIAN_DEADLIFT");
  assert.equal(firstSelectionFor(result, MovementSlotCode.HORIZONTAL_PUSH).exercise_code, "DUMBBELL_FLOOR_PRESS");
  assert.equal(firstSelectionFor(result, MovementSlotCode.HORIZONTAL_PULL).exercise_code, "RESISTANCE_BAND_ROW");
  assert.equal(
    firstSelectionFor(result, MovementSlotCode.KNEE_DOMINANT).reason_code,
    "SELECTED_EXPLICIT_EQUIPMENT",
  );
  assert.equal(result.status, TrainingPlanStatus.READY);
});

test("home training with only implicit bodyweight uses bodyweight exercises", () => {
  const blueprint = makeBlueprint({
    recommendedDays: 3,
    location: TrainingLocation.HOME,
    introWeekRequired: true,
  });
  const result = buildExerciseSelection({ trainingSessionBlueprint: blueprint, hardConstraints: [] });

  for (const [slotCode, exerciseCode] of [
    [MovementSlotCode.KNEE_DOMINANT, "BODYWEIGHT_SQUAT"],
    [MovementSlotCode.HIP_HINGE, "GLUTE_BRIDGE"],
    [MovementSlotCode.HORIZONTAL_PUSH, "PUSH_UP"],
    [MovementSlotCode.VERTICAL_PUSH, "PIKE_PUSH_UP"],
    [MovementSlotCode.CORE_STABILITY, "DEAD_BUG"],
  ]) {
    const selection = firstSelectionFor(result, slotCode);
    assert.equal(selection.exercise_code, exerciseCode);
    assert.equal(selection.reason_code, "SELECTED_BODYWEIGHT_FALLBACK");
  }
});

test("cable equipment enables lat pulldown and cable lateral raise", () => {
  const blueprint = makeBlueprint({
    recommendedDays: 6,
    equipment: [
      { equipmentCode: EquipmentCode.CABLE_STATION, loadCapacity: EquipmentLoadCapacity.LIGHT },
    ],
  });
  const result = buildExerciseSelection({ trainingSessionBlueprint: blueprint, hardConstraints: [] });

  assert.equal(firstSelectionFor(result, MovementSlotCode.VERTICAL_PULL).exercise_code, "LAT_PULLDOWN");
  assert.equal(
    firstSelectionFor(result, MovementSlotCode.SHOULDER_ABDUCTION).exercise_code,
    "CABLE_LATERAL_RAISE",
  );
});

test("selectorized machines enable lying leg curl machine", () => {
  const blueprint = makeBlueprint({
    equipment: [
      {
        equipmentCode: EquipmentCode.SELECTORIZED_MACHINES,
        loadCapacity: EquipmentLoadCapacity.LIGHT,
      },
    ],
  });
  const result = buildExerciseSelection({ trainingSessionBlueprint: blueprint, hardConstraints: [] });

  assert.equal(
    firstSelectionFor(result, MovementSlotCode.KNEE_FLEXION).exercise_code,
    "LYING_LEG_CURL_MACHINE",
  );
});

test("moderate and heavy capacities satisfy light requirements", () => {
  for (const loadCapacity of [
    EquipmentLoadCapacity.MODERATE,
    EquipmentLoadCapacity.HEAVY,
  ]) {
    const blueprint = makeBlueprint({
      equipment: [{ equipmentCode: EquipmentCode.DUMBBELLS, loadCapacity }],
    });
    const result = buildExerciseSelection({
      trainingSessionBlueprint: blueprint,
      hardConstraints: [],
    });
    assert.equal(
      firstSelectionFor(result, MovementSlotCode.KNEE_DOMINANT).exercise_code,
      "GOBLET_SQUAT",
    );
  }

  const notApplicableBlueprint = makeBlueprint({
    equipment: [
      {
        equipmentCode: EquipmentCode.DUMBBELLS,
        loadCapacity: EquipmentLoadCapacity.NOT_APPLICABLE,
      },
    ],
  });
  const notApplicableResult = buildExerciseSelection({
    trainingSessionBlueprint: notApplicableBlueprint,
    hardConstraints: [],
  });
  assert.equal(
    firstSelectionFor(notApplicableResult, MovementSlotCode.KNEE_DOMINANT).exercise_code,
    "BODYWEIGHT_SQUAT",
  );
});

test("gym location never implies unreported equipment and requires one location constraint", () => {
  const blueprint = makeBlueprint();
  const result = buildExerciseSelection({ trainingSessionBlueprint: blueprint, hardConstraints: [] });

  assert.equal(
    firstSelectionFor(result, MovementSlotCode.HORIZONTAL_PULL).reason_code,
    "NO_ELIGIBLE_EXERCISE",
  );
  assert.equal(
    firstSelectionFor(result, MovementSlotCode.VERTICAL_PULL).reason_code,
    "NO_ELIGIBLE_EXERCISE",
  );
  assert.equal(
    firstSelectionFor(result, MovementSlotCode.HORIZONTAL_PUSH).exercise_code,
    "PUSH_UP",
  );

  const missingLocation = makeBlueprint({ includeLocation: false, equipment: BROAD_EQUIPMENT });
  assert.throws(
    () =>
      buildExerciseSelection({
        trainingSessionBlueprint: missingLocation,
        hardConstraints: [],
      }),
    TypeError,
  );

  const duplicateLocation = {
    ...makeBlueprint({ equipment: BROAD_EQUIPMENT }),
    constraints: [
      ...makeBlueprint({ equipment: BROAD_EQUIPMENT }).constraints,
      locationConstraint(TrainingLocation.GYM),
    ],
  };
  assert.throws(
    () =>
      buildExerciseSelection({
        trainingSessionBlueprint: duplicateLocation,
        hardConstraints: [],
      }),
    TypeError,
  );
});

test("intro week prefers beginner-friendly exercise before explicit equipment", () => {
  const common = {
    equipment: [
      { equipmentCode: EquipmentCode.DUMBBELLS, loadCapacity: EquipmentLoadCapacity.LIGHT },
      {
        equipmentCode: EquipmentCode.RESISTANCE_BANDS,
        loadCapacity: EquipmentLoadCapacity.LIGHT,
      },
    ],
  };
  const introResult = buildExerciseSelection({
    trainingSessionBlueprint: makeBlueprint({ ...common, introWeekRequired: true }),
    hardConstraints: [],
  });
  const standardResult = buildExerciseSelection({
    trainingSessionBlueprint: makeBlueprint({ ...common, introWeekRequired: false }),
    hardConstraints: [],
  });

  assert.equal(
    firstSelectionFor(introResult, MovementSlotCode.UNILATERAL_LOWER).exercise_code,
    "SPLIT_SQUAT",
  );
  assert.equal(
    firstSelectionFor(standardResult, MovementSlotCode.UNILATERAL_LOWER).exercise_code,
    "DUMBBELL_REVERSE_LUNGE",
  );
});

test("SQUAT constrains only knee-dominant and unilateral-lower slots", () => {
  const blueprint = makeBlueprint({ equipment: BROAD_EQUIPMENT });
  const hardConstraints = [
    movementConstraint("INJURY_AFFECTED_MOVEMENT", Movement.SQUAT),
  ];
  const result = buildExerciseSelection({ trainingSessionBlueprint: blueprint, hardConstraints });

  assert.deepEqual(reviewSlotCodes(result), [
    MovementSlotCode.KNEE_DOMINANT,
    MovementSlotCode.UNILATERAL_LOWER,
  ].sort());
  assert.deepEqual(firstSelectionFor(result, MovementSlotCode.KNEE_DOMINANT), {
    order: 1,
    slot_code: MovementSlotCode.KNEE_DOMINANT,
    selection_status: ExerciseSlotSelectionStatus.REVIEW_REQUIRED,
    exercise_code: null,
    name_en: null,
    reason_code: "MOVEMENT_CONSTRAINT_REQUIRES_REVIEW",
    source_constraint_codes: ["INJURY_AFFECTED_MOVEMENT"],
  });
  assert.equal(
    firstSelectionFor(result, MovementSlotCode.HIP_HINGE).selection_status,
    ExerciseSlotSelectionStatus.SELECTED,
  );
});

test("HINGE constrains only the hip-hinge slot", () => {
  const result = buildExerciseSelection({
    trainingSessionBlueprint: makeBlueprint({ equipment: BROAD_EQUIPMENT }),
    hardConstraints: [movementConstraint("INJURY_AFFECTED_MOVEMENT", Movement.HINGE)],
  });

  assert.deepEqual(reviewSlotCodes(result), [MovementSlotCode.HIP_HINGE]);
});

test("PUSH, PULL, and OVERHEAD use only their explicit slot mappings", () => {
  const cases = [
    [Movement.PUSH, [MovementSlotCode.HORIZONTAL_PUSH, MovementSlotCode.VERTICAL_PUSH]],
    [Movement.PULL, [MovementSlotCode.HORIZONTAL_PULL, MovementSlotCode.VERTICAL_PULL]],
    [Movement.OVERHEAD, [MovementSlotCode.VERTICAL_PUSH]],
  ];

  for (const [movement, expectedSlots] of cases) {
    const result = buildExerciseSelection({
      trainingSessionBlueprint: makeBlueprint({ equipment: BROAD_EQUIPMENT }),
      hardConstraints: [movementConstraint("INJURY_AFFECTED_MOVEMENT", movement)],
    });
    assert.deepEqual(reviewSlotCodes(result), [...expectedSlots].sort());
  }

  const constrainedWithoutEquipment = buildExerciseSelection({
    trainingSessionBlueprint: makeBlueprint(),
    hardConstraints: [movementConstraint("INJURY_AFFECTED_MOVEMENT", Movement.PULL)],
  });
  const horizontalPull = firstSelectionFor(
    constrainedWithoutEquipment,
    MovementSlotCode.HORIZONTAL_PULL,
  );
  assert.equal(horizontalPull.reason_code, "MOVEMENT_CONSTRAINT_REQUIRES_REVIEW");
  assert.deepEqual(horizontalPull.source_constraint_codes, ["INJURY_AFFECTED_MOVEMENT"]);
});

test("medical movement restrictions apply only when instruction is AVOID", () => {
  const blueprint = makeBlueprint({ recommendedDays: 6, equipment: BROAD_EQUIPMENT });
  for (const [code, movement] of [
    ["MEDICAL_MOVEMENT_RESTRICTION", Movement.ALL_TRAINING],
    ["INJURY_MEDICAL_RESTRICTION", Movement.ALL_ACTIVITY],
  ]) {
    const result = buildExerciseSelection({
      trainingSessionBlueprint: blueprint,
      hardConstraints: [movementConstraint(code, movement)],
    });
    assert.deepEqual(reviewSlotCodes(result), [...Object.values(MovementSlotCode)].sort());
    assert.ok(
      allSelections(result).every(
        ({ source_constraint_codes: sourceCodes }) =>
          sourceCodes.length === 1 && sourceCodes[0] === code,
      ),
    );
  }

  const nonAvoidResult = buildExerciseSelection({
    trainingSessionBlueprint: blueprint,
    hardConstraints: [
      movementConstraint("MEDICAL_MOVEMENT_RESTRICTION", Movement.PUSH, {
        instruction: "LIMIT",
      }),
    ],
  });
  assert.equal(nonAvoidResult.status, TrainingPlanStatus.READY);
  assert.deepEqual(reviewSlotCodes(nonAvoidResult), []);
});

test("RUNNING does not constrain a strength movement slot", () => {
  const result = buildExerciseSelection({
    trainingSessionBlueprint: makeBlueprint({ recommendedDays: 6, equipment: BROAD_EQUIPMENT }),
    hardConstraints: [movementConstraint("INJURY_AFFECTED_MOVEMENT", Movement.RUNNING)],
  });

  assert.equal(result.status, TrainingPlanStatus.READY);
  assert.deepEqual(reviewSlotCodes(result), []);
});

test("an unavailable location-equipment combination keeps the slot for review", () => {
  const blueprint = makeBlueprint({
    recommendedDays: 6,
    location: TrainingLocation.HOME,
    equipment: [
      { equipmentCode: EquipmentCode.CABLE_STATION, loadCapacity: EquipmentLoadCapacity.LIGHT },
    ],
  });
  const result = buildExerciseSelection({ trainingSessionBlueprint: blueprint, hardConstraints: [] });
  const selection = firstSelectionFor(result, MovementSlotCode.SHOULDER_ABDUCTION);

  assert.equal(selection.selection_status, ExerciseSlotSelectionStatus.REVIEW_REQUIRED);
  assert.equal(selection.exercise_code, null);
  assert.equal(selection.name_en, null);
  assert.equal(selection.reason_code, "NO_ELIGIBLE_EXERCISE");
  assert.deepEqual(selection.source_constraint_codes, []);
  assert.equal(selection.slot_code, MovementSlotCode.SHOULDER_ABDUCTION);
});

test("a ready blueprint becomes provisional when any slot is unresolved", () => {
  const blueprint = makeBlueprint();
  const result = buildExerciseSelection({ trainingSessionBlueprint: blueprint, hardConstraints: [] });

  assert.equal(blueprint.status, TrainingPlanStatus.READY);
  assert.equal(result.status, TrainingPlanStatus.PROVISIONAL_REVIEW_REQUIRED);
  assert.ok(reviewSlotCodes(result).length > 0);
});

test("a withheld blueprint returns no sessions and requires no location", () => {
  const validWithheldBlueprint = makeBlueprint({
    planStatus: "MEDICAL_REVIEW_REQUIRED",
    includeLocation: false,
  });
  const validResult = buildExerciseSelection({
    trainingSessionBlueprint: validWithheldBlueprint,
    hardConstraints: [],
  });
  const withheldWithUnexpectedSessions = {
    ...makeBlueprint({ equipment: BROAD_EQUIPMENT }),
    status: TrainingPlanStatus.WITHHELD,
    constraints: [],
  };
  const defensiveResult = buildExerciseSelection({
    trainingSessionBlueprint: withheldWithUnexpectedSessions,
    hardConstraints: [],
  });

  assert.equal(validResult.status, TrainingPlanStatus.WITHHELD);
  assert.deepEqual(validResult.sessions, []);
  assert.ok(withheldWithUnexpectedSessions.sessions.length > 0);
  assert.equal(defensiveResult.status, TrainingPlanStatus.WITHHELD);
  assert.deepEqual(defensiveResult.sessions, []);
});

test("a provisional blueprint remains provisional with or without sessions", () => {
  const withSessions = buildExerciseSelection({
    trainingSessionBlueprint: makeBlueprint({
      planStatus: "COACH_REVIEW_REQUIRED",
      equipment: BROAD_EQUIPMENT,
    }),
    hardConstraints: [],
  });
  const withoutSessions = buildExerciseSelection({
    trainingSessionBlueprint: makeBlueprint({
      planStatus: "COACH_REVIEW_REQUIRED",
      recommendedDays: 0,
      includeLocation: false,
    }),
    hardConstraints: [],
  });

  assert.equal(withSessions.status, TrainingPlanStatus.PROVISIONAL_REVIEW_REQUIRED);
  assert.ok(withSessions.sessions.length > 0);
  assert.equal(withoutSessions.status, TrainingPlanStatus.PROVISIONAL_REVIEW_REQUIRED);
  assert.deepEqual(withoutSessions.sessions, []);
});

test("selection contract passes through blueprint fields, constraints, and reasons", () => {
  const reasons = [BASE_REASON];
  const blueprint = makeBlueprint({
    equipment: BROAD_EQUIPMENT,
    introWeekRequired: true,
    scheduleMode: "SESSION_SEQUENCE",
    volumeStart: "CONSERVATIVE",
    reasons,
  });
  const result = buildExerciseSelection({ trainingSessionBlueprint: blueprint, hardConstraints: [] });

  assert.equal(EXERCISE_SELECTION_VERSION, "exercise-selection-v1");
  assert.equal(result.selection_version, EXERCISE_SELECTION_VERSION);
  assert.deepEqual(Object.values(ExerciseSlotSelectionStatus), ["SELECTED", "REVIEW_REQUIRED"]);
  assert.deepEqual(Object.keys(result).sort(), [
    "constraints",
    "intro_week_required",
    "reasons",
    "recommended_days",
    "schedule_mode",
    "selection_version",
    "sessions",
    "split_code",
    "status",
    "volume_start",
  ]);
  for (const field of [
    "recommended_days",
    "split_code",
    "schedule_mode",
    "intro_week_required",
    "volume_start",
  ]) {
    assert.equal(result[field], blueprint[field]);
  }
  assert.strictEqual(result.constraints, blueprint.constraints);
  assert.strictEqual(result.reasons, blueprint.reasons);
  assert.equal(result.sessions.length, blueprint.sessions.length);

  result.sessions.forEach((session, sessionIndex) => {
    const blueprintSession = blueprint.sessions[sessionIndex];
    assert.equal(session.sequence, blueprintSession.sequence);
    assert.equal(session.session_code, blueprintSession.session_code);
    assert.equal(session.focus, blueprintSession.focus);
    assert.equal(session.exercises.length, blueprintSession.movement_slots.length);
    session.exercises.forEach((exercise, exerciseIndex) => {
      const slot = blueprintSession.movement_slots[exerciseIndex];
      assert.equal(exercise.order, slot.order);
      assert.equal(exercise.slot_code, slot.slot_code);
      assert.deepEqual(Object.keys(exercise).sort(), [
        "exercise_code",
        "name_en",
        "order",
        "reason_code",
        "selection_status",
        "slot_code",
        "source_constraint_codes",
      ]);
    });
  });
});

test("exercise selection does not modify either input", () => {
  const trainingSessionBlueprint = makeBlueprint({ equipment: BROAD_EQUIPMENT });
  const hardConstraints = [
    movementConstraint("INJURY_AFFECTED_MOVEMENT", Movement.SQUAT),
  ];
  const blueprintSnapshot = structuredClone(trainingSessionBlueprint);
  const constraintsSnapshot = structuredClone(hardConstraints);

  buildExerciseSelection({ trainingSessionBlueprint, hardConstraints });

  assert.deepEqual(trainingSessionBlueprint, blueprintSnapshot);
  assert.deepEqual(hardConstraints, constraintsSnapshot);
});

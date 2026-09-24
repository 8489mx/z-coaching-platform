import assert from "node:assert/strict";
import test from "node:test";

import {
  TrainingPlanStatus,
  TrainingSessionCode,
  buildTrainingPlanSpec,
} from "../src/training-plan-specification/index.js";
import {
  MovementSlotCode,
  TRAINING_SESSION_BLUEPRINT_VERSION,
  buildTrainingSessionBlueprint,
} from "../src/training-session-blueprint/index.js";

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

const specification = ({
  planStatus = "READY_FOR_DRAFT",
  recommendedDays = 4,
  scheduleMode = "FIXED_DAYS",
  introWeekRequired = true,
  volumeStart = "CONSERVATIVE",
  constraints = [trainingConstraint],
  reasons = [trainingReason],
} = {}) =>
  buildTrainingPlanSpec({
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

const slotCodesBySession = (blueprint) =>
  Object.fromEntries(
    blueprint.sessions.map((session) => [
      session.session_code,
      session.movement_slots.map(({ slot_code: slotCode }) => slotCode),
    ]),
  );

const FULL_BODY_SLOTS = {
  FULL_BODY_A: [
    "KNEE_DOMINANT",
    "HIP_HINGE",
    "HORIZONTAL_PUSH",
    "HORIZONTAL_PULL",
    "CORE_STABILITY",
  ],
  FULL_BODY_B: [
    "HIP_HINGE",
    "HIP_EXTENSION",
    "KNEE_DOMINANT",
    "VERTICAL_PUSH",
    "VERTICAL_PULL",
    "CORE_STABILITY",
  ],
  FULL_BODY_C: [
    "UNILATERAL_LOWER",
    "KNEE_FLEXION",
    "HORIZONTAL_PUSH",
    "HORIZONTAL_PULL",
    "CORE_STABILITY",
  ],
};

const UPPER_LOWER_SLOTS = {
  // A lateral raise on each upper day: the overhead press alone left the shoulders at 6 weekly sets
  // against a minimum of 8, and it is the front delt that the press works.
  UPPER_A: [
    "HORIZONTAL_PUSH",
    "HORIZONTAL_PULL",
    "VERTICAL_PUSH",
    "VERTICAL_PULL",
    "SHOULDER_ABDUCTION",
    "ELBOW_FLEXION",
    "ELBOW_EXTENSION",
  ],
  // A second chest press (chest had 6 weekly sets against 12 for the back).
  UPPER_B: [
    "VERTICAL_PUSH",
    "VERTICAL_PULL",
    "HORIZONTAL_PUSH",
    "HORIZONTAL_PULL",
    "HORIZONTAL_PUSH",
    "SHOULDER_ABDUCTION",
    "ELBOW_EXTENSION",
    "ELBOW_FLEXION",
  ],
  LOWER_A: [
    "KNEE_DOMINANT",
    "HIP_HINGE",
    "HIP_EXTENSION",
    "UNILATERAL_LOWER",
    "KNEE_FLEXION",
    "CALF_RAISE",
    "CORE_STABILITY",
  ],
  LOWER_B: [
    "HIP_HINGE",
    "HIP_EXTENSION",
    "KNEE_DOMINANT",
    "KNEE_FLEXION",
    "UNILATERAL_LOWER",
    "CALF_RAISE",
    "CORE_STABILITY",
  ],
};

const PUSH_PULL_LEGS_SLOTS = {
  // Two chest presses on each push day; the second overhead press made room on PUSH_B.
  PUSH_A: [
    "HORIZONTAL_PUSH",
    "VERTICAL_PUSH",
    "HORIZONTAL_PUSH",
    "SHOULDER_ABDUCTION",
    "ELBOW_EXTENSION",
  ],
  PUSH_B: [
    "HORIZONTAL_PUSH",
    "HORIZONTAL_PUSH",
    "SHOULDER_ABDUCTION",
    "ELBOW_EXTENSION",
  ],
  PULL_A: ["VERTICAL_PULL", "HORIZONTAL_PULL", "REAR_DELT", "ELBOW_FLEXION"],
  PULL_B: ["HORIZONTAL_PULL", "VERTICAL_PULL", "REAR_DELT", "ELBOW_FLEXION"],
  LEGS_A: UPPER_LOWER_SLOTS.LOWER_A,
  LEGS_B: UPPER_LOWER_SLOTS.LOWER_B,
};

test("every training session code has a known movement-slot blueprint", () => {
  assert.deepEqual(Object.values(MovementSlotCode), [
    "KNEE_DOMINANT",
    "HIP_HINGE",
    "UNILATERAL_LOWER",
    // Direct glute work, which no plan had.
    "HIP_EXTENSION",
    "KNEE_FLEXION",
    "CALF_RAISE",
    "HORIZONTAL_PUSH",
    "HORIZONTAL_PULL",
    "VERTICAL_PUSH",
    "VERTICAL_PULL",
    "SHOULDER_ABDUCTION",
    "REAR_DELT",
    "ELBOW_FLEXION",
    "ELBOW_EXTENSION",
    "CORE_STABILITY",
  ]);

  const blueprints = [3, 4, 6].map((recommendedDays) =>
    buildTrainingSessionBlueprint(specification({ recommendedDays })),
  );
  const actualSessionCodes = [
    ...new Set(
      blueprints.flatMap((blueprint) =>
        blueprint.sessions.map(({ session_code: sessionCode }) => sessionCode),
      ),
    ),
  ].sort();

  assert.deepEqual(actualSessionCodes, Object.values(TrainingSessionCode).sort());
  assert.ok(blueprints.every((blueprint) => blueprint.sessions.every((session) => session.movement_slots.length > 0)));
});

test("FULL_BODY_A, FULL_BODY_B, and FULL_BODY_C use the required slot maps", () => {
  const blueprint = buildTrainingSessionBlueprint(specification({ recommendedDays: 3 }));

  assert.deepEqual(slotCodesBySession(blueprint), FULL_BODY_SLOTS);
});

test("UPPER_A, UPPER_B, LOWER_A, and LOWER_B use the required slot maps", () => {
  const blueprint = buildTrainingSessionBlueprint(specification({ recommendedDays: 4 }));

  assert.deepEqual(slotCodesBySession(blueprint), UPPER_LOWER_SLOTS);
});

test("PUSH, PULL, and LEGS A/B sessions use the required slot maps", () => {
  const blueprint = buildTrainingSessionBlueprint(specification({ recommendedDays: 6 }));

  assert.deepEqual(slotCodesBySession(blueprint), PUSH_PULL_LEGS_SLOTS);
});

test("movement slot order starts at one and remains contiguous", () => {
  const blueprints = [3, 4, 6].map((recommendedDays) =>
    buildTrainingSessionBlueprint(specification({ recommendedDays })),
  );

  for (const session of blueprints.flatMap(({ sessions }) => sessions)) {
    assert.deepEqual(
      session.movement_slots.map(({ order }) => order),
      Array.from({ length: session.movement_slots.length }, (_, index) => index + 1),
    );
  }
});

test("the upstream session sequence, code, and focus remain unchanged", () => {
  const input = specification({ recommendedDays: 5 });
  const blueprint = buildTrainingSessionBlueprint(input);

  assert.deepEqual(
    blueprint.sessions.map(({ sequence, session_code: sessionCode, focus }) => ({
      sequence,
      session_code: sessionCode,
      focus,
    })),
    input.sessions,
  );
});

test("a withheld training plan keeps sessions empty", () => {
  const input = {
    ...specification({ recommendedDays: 4 }),
    status: TrainingPlanStatus.WITHHELD,
  };
  const blueprint = buildTrainingSessionBlueprint(input);

  assert.ok(input.sessions.length > 0);
  assert.equal(input.status, TrainingPlanStatus.WITHHELD);
  assert.equal(blueprint.status, TrainingPlanStatus.WITHHELD);
  assert.deepEqual(blueprint.sessions, []);
});

test("a zero-day provisional plan keeps sessions empty", () => {
  const input = {
    ...specification({ recommendedDays: 3 }),
    status: TrainingPlanStatus.PROVISIONAL_REVIEW_REQUIRED,
    recommended_days: 0,
    split_code: null,
  };
  const blueprint = buildTrainingSessionBlueprint(input);

  assert.ok(input.sessions.length > 0);
  assert.equal(blueprint.status, TrainingPlanStatus.PROVISIONAL_REVIEW_REQUIRED);
  assert.equal(blueprint.recommended_days, 0);
  assert.equal(blueprint.split_code, null);
  assert.deepEqual(blueprint.sessions, []);
});

test("a provisional plan with sessions builds blueprints and preserves status", () => {
  const input = specification({
    planStatus: "COACH_REVIEW_REQUIRED",
    recommendedDays: 3,
  });
  const blueprint = buildTrainingSessionBlueprint(input);

  assert.equal(blueprint.status, TrainingPlanStatus.PROVISIONAL_REVIEW_REQUIRED);
  assert.equal(blueprint.sessions.length, 3);
  assert.ok(blueprint.sessions.every((session) => session.movement_slots.length > 0));
});

test("plan fields, constraints, and reasons pass through unchanged", () => {
  const constraints = [trainingConstraint];
  const reasons = [trainingReason];
  const input = specification({
    recommendedDays: 4,
    scheduleMode: "SESSION_SEQUENCE",
    introWeekRequired: false,
    volumeStart: "NORMAL",
    constraints,
    reasons,
  });
  const blueprint = buildTrainingSessionBlueprint(input);

  assert.equal(blueprint.blueprint_version, "training-session-blueprint-v1");
  assert.equal(blueprint.blueprint_version, TRAINING_SESSION_BLUEPRINT_VERSION);
  for (const field of [
    "status",
    "recommended_days",
    "split_code",
    "schedule_mode",
    "intro_week_required",
    "volume_start",
  ]) {
    assert.equal(blueprint[field], input[field]);
  }
  assert.deepEqual(blueprint.constraints, constraints);
  assert.deepEqual(blueprint.reasons, reasons);
});

test("building a session blueprint does not modify the training plan specification", () => {
  const input = specification({ recommendedDays: 6 });
  const snapshot = structuredClone(input);

  buildTrainingSessionBlueprint(input);

  assert.deepEqual(input, snapshot);
});

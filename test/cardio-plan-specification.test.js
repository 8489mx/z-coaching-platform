import assert from "node:assert/strict";
import test from "node:test";

import {
  CardioIntensity,
  CardioStrategy,
  PlanStatus,
  PrimaryGoal,
  ReviewLevel,
  Scope,
  ScreeningAnswer,
  TrainingExperience,
  WalkingAbility,
  evaluateIntake,
} from "z-coaching-intake-decision-engine";
import * as cardioPlanSpecApi from
  "z-coaching-intake-decision-engine/cardio-plan-specification";

import {
  ASSESSMENT_CONTEXT,
  completeIntake,
} from "./fixtures/complete-intake.js";

const {
  CARDIO_PLAN_SPEC_VERSION,
  CardioFormalSessionState,
  CardioPlanStatus,
  buildCardioPlanSpec,
} = cardioPlanSpecApi;

function makeConstraint(overrides = {}) {
  return {
    code: "CARDIO_MAX_SESSIONS",
    scope: Scope.CARDIO,
    value: { sessionsPerWeek: 0 },
    reason: "The recorded capacity remains an upstream limit.",
    ...overrides,
  };
}

function makeCardioReason(overrides = {}) {
  return {
    code: "NO_CARDIO_ADEQUATE_DAILY_ACTIVITY",
    scope: Scope.CARDIO,
    message: "The authoritative Intake decision does not add formal cardio.",
    ...overrides,
  };
}

function makeReviewFlag(overrides = {}) {
  return {
    code: "UPSTREAM_REVIEW_REQUIRED",
    scope: Scope.NUTRITION,
    level: ReviewLevel.COACH,
    message: "The original upstream finding remains available for review.",
    sourcePath: "nutrition.allergies[0].medicallyConfirmed",
    ...overrides,
  };
}

function makeDecisionReason(overrides = {}) {
  return {
    code: "UPSTREAM_DECISION_RETAINED",
    scope: Scope.CARDIO,
    message: "The original decision reason remains unchanged.",
    ...overrides,
  };
}

function makeDataIssue(overrides = {}) {
  return {
    code: "UPSTREAM_DATA_REVIEW",
    path: "cardio.averageDailySteps",
    message: "The original data issue remains unchanged.",
    ...overrides,
  };
}

function makeDecision({
  planStatus = PlanStatus.READY_FOR_DRAFT,
  strategy,
  maxSessions,
  maxDurationMinutes,
  intensityStart = CardioIntensity.LOW,
  constraints = [makeConstraint()],
  reasons = [makeCardioReason()],
  reviewFlags = [],
  decisionReasons = [makeDecisionReason()],
  missingOrUncertainData = [],
} = {}) {
  const effectiveStrategy =
    strategy ??
    ([PlanStatus.MEDICAL_REVIEW_REQUIRED, PlanStatus.BLOCKED].includes(
      planStatus,
    )
      ? CardioStrategy.REVIEW_REQUIRED
      : CardioStrategy.NO_ADDITIONAL_CARDIO);
  const hasFormalSessions =
    effectiveStrategy === CardioStrategy.CARDIO_SESSIONS;

  return {
    plan_status: planStatus,
    hard_constraints: [],
    soft_preferences: [],
    review_flags: reviewFlags,
    nutrition_decision: { intentionally_not_read: true },
    training_decision: { intentionally_not_read: true },
    cardio_decision: {
      strategy: effectiveStrategy,
      max_sessions:
        maxSessions === undefined ? (hasFormalSessions ? 2 : 0) : maxSessions,
      max_duration_minutes:
        maxDurationMinutes === undefined
          ? hasFormalSessions
            ? 30
            : 0
          : maxDurationMinutes,
      intensity_start: intensityStart,
      constraints,
      reasons,
    },
    decision_reasons: decisionReasons,
    missing_or_uncertain_data: missingOrUncertainData,
  };
}

function buildFromIntake(overrides = {}) {
  const intakeDecision = evaluateIntake(
    completeIntake(overrides),
    ASSESSMENT_CONTEXT,
  );
  return {
    intakeDecision,
    specification: buildCardioPlanSpec(intakeDecision),
  };
}

function assertDeepFrozen(value, seen = new WeakSet()) {
  if (value === null || typeof value !== "object" || seen.has(value)) {
    return;
  }
  seen.add(value);
  assert.equal(Object.isFrozen(value), true);
  for (const key of Reflect.ownKeys(value)) {
    assertDeepFrozen(value[key], seen);
  }
}

function assertNoExecutablePrescriptionFields(result) {
  for (const field of [
    "sessions",
    "frequency",
    "frequency_per_week",
    "duration",
    "duration_minutes",
    "modality",
    "modality_code",
    "cardio_type",
    "intensity_method",
    "weekday",
    "scheduled_day",
    "progression",
    "regression",
    "step_target",
    "steps_target",
  ]) {
    assert.equal(field in result, false, `${field} must not be emitted.`);
  }
}

test("public API exposes only the approved Cardio Plan Specification entries", async () => {
  assert.deepEqual(Object.keys(cardioPlanSpecApi).sort(), [
    "CARDIO_PLAN_SPEC_VERSION",
    "CardioFormalSessionState",
    "CardioPlanStatus",
    "buildCardioPlanSpec",
  ]);
  assert.equal(CARDIO_PLAN_SPEC_VERSION, "cardio-plan-spec-v1");
  assert.deepEqual(Object.values(CardioPlanStatus), [
    "READY",
    "PROVISIONAL_REVIEW_REQUIRED",
    "WITHHELD",
  ]);
  assert.deepEqual(Object.values(CardioFormalSessionState), [
    "NOT_INDICATED",
    "DAILY_MOVEMENT_ONLY",
    "PRESCRIPTION_REQUIRED",
    "REVIEW_REQUIRED",
    "WITHHELD",
  ]);
  assert.equal(Object.isFrozen(CardioPlanStatus), true);
  assert.equal(Object.isFrozen(CardioFormalSessionState), true);

  const packageApi = await import(
    "z-coaching-intake-decision-engine/cardio-plan-specification"
  );
  assert.equal(packageApi.buildCardioPlanSpec, buildCardioPlanSpec);
});

test("formal-session capacity is retained only as limits in the exact output contract", () => {
  const input = makeDecision({
    strategy: CardioStrategy.CARDIO_SESSIONS,
    maxSessions: 3,
    maxDurationMinutes: 75,
    intensityStart: CardioIntensity.MODERATE,
  });
  const result = buildCardioPlanSpec(input);

  assert.deepEqual(Object.keys(result), [
    "cardio_plan_spec_version",
    "status",
    "strategy",
    "formal_session_state",
    "limits",
    "constraints",
    "reasons",
    "source_review_context",
  ]);
  assert.deepEqual(Object.keys(result.limits), [
    "max_sessions_per_week",
    "max_duration_minutes_per_session",
    "intensity_start",
  ]);
  assert.deepEqual(Object.keys(result.source_review_context), [
    "review_flags",
    "decision_reasons",
    "missing_or_uncertain_data",
  ]);
  assert.equal(result.cardio_plan_spec_version, CARDIO_PLAN_SPEC_VERSION);
  assert.equal(result.status, CardioPlanStatus.READY);
  assert.equal(result.strategy, CardioStrategy.CARDIO_SESSIONS);
  assert.equal(
    result.formal_session_state,
    CardioFormalSessionState.PRESCRIPTION_REQUIRED,
  );
  assert.deepEqual(result.limits, {
    max_sessions_per_week: 3,
    max_duration_minutes_per_session: 75,
    intensity_start: CardioIntensity.MODERATE,
  });
  assertNoExecutablePrescriptionFields(result);
});

test("all valid status and strategy combinations map deterministically", () => {
  const cases = [
    {
      planStatus: PlanStatus.READY_FOR_DRAFT,
      strategy: CardioStrategy.NO_ADDITIONAL_CARDIO,
      status: CardioPlanStatus.READY,
      formalState: CardioFormalSessionState.NOT_INDICATED,
    },
    {
      planStatus: PlanStatus.READY_FOR_DRAFT,
      strategy: CardioStrategy.STEPS_ONLY,
      status: CardioPlanStatus.READY,
      formalState: CardioFormalSessionState.DAILY_MOVEMENT_ONLY,
    },
    {
      planStatus: PlanStatus.READY_FOR_DRAFT,
      strategy: CardioStrategy.CARDIO_SESSIONS,
      status: CardioPlanStatus.READY,
      formalState: CardioFormalSessionState.PRESCRIPTION_REQUIRED,
    },
    {
      planStatus: PlanStatus.COACH_REVIEW_REQUIRED,
      strategy: CardioStrategy.NO_ADDITIONAL_CARDIO,
      status: CardioPlanStatus.PROVISIONAL_REVIEW_REQUIRED,
      formalState: CardioFormalSessionState.NOT_INDICATED,
    },
    {
      planStatus: PlanStatus.COACH_REVIEW_REQUIRED,
      strategy: CardioStrategy.STEPS_ONLY,
      status: CardioPlanStatus.PROVISIONAL_REVIEW_REQUIRED,
      formalState: CardioFormalSessionState.DAILY_MOVEMENT_ONLY,
    },
    {
      planStatus: PlanStatus.COACH_REVIEW_REQUIRED,
      strategy: CardioStrategy.CARDIO_SESSIONS,
      status: CardioPlanStatus.PROVISIONAL_REVIEW_REQUIRED,
      formalState: CardioFormalSessionState.PRESCRIPTION_REQUIRED,
    },
    {
      planStatus: PlanStatus.COACH_REVIEW_REQUIRED,
      strategy: CardioStrategy.REVIEW_REQUIRED,
      status: CardioPlanStatus.PROVISIONAL_REVIEW_REQUIRED,
      formalState: CardioFormalSessionState.REVIEW_REQUIRED,
    },
    {
      planStatus: PlanStatus.MEDICAL_REVIEW_REQUIRED,
      strategy: CardioStrategy.REVIEW_REQUIRED,
      status: CardioPlanStatus.WITHHELD,
      formalState: CardioFormalSessionState.WITHHELD,
    },
    {
      planStatus: PlanStatus.BLOCKED,
      strategy: CardioStrategy.REVIEW_REQUIRED,
      status: CardioPlanStatus.WITHHELD,
      formalState: CardioFormalSessionState.WITHHELD,
    },
  ];

  for (const testCase of cases) {
    const result = buildCardioPlanSpec(makeDecision(testCase));
    assert.equal(result.status, testCase.status);
    assert.equal(result.formal_session_state, testCase.formalState);
    assert.equal(result.strategy, testCase.strategy);
    assertNoExecutablePrescriptionFields(result);
  }
});

test("LOW and MODERATE are both retained for formal-session capacity", () => {
  for (const intensityStart of Object.values(CardioIntensity)) {
    const result = buildCardioPlanSpec(
      makeDecision({
        strategy: CardioStrategy.CARDIO_SESSIONS,
        intensityStart,
      }),
    );
    assert.equal(result.limits.intensity_start, intensityStart);
    assert.equal(
      result.formal_session_state,
      CardioFormalSessionState.PRESCRIPTION_REQUIRED,
    );
  }
});

test("constraints, reasons, and review context preserve order and repeated records", () => {
  const constraints = [
    makeConstraint({
      code: "EXISTING_ADDITIONAL_SPORT",
      value: { sportCode: "RUNNING", days: ["MONDAY"] },
    }),
    makeConstraint({
      code: "EXISTING_ADDITIONAL_SPORT",
      value: { sportCode: "CYCLING", days: ["SATURDAY"] },
    }),
  ];
  const reasons = [
    makeCardioReason({ code: "REASON_B", message: "Second alphabetically." }),
    makeCardioReason({ code: "REASON_A", message: "First alphabetically." }),
  ];
  const reviewFlags = [
    makeReviewFlag({ sourcePath: "nutrition.allergies[1]" }),
    makeReviewFlag({ sourcePath: "nutrition.allergies[0]" }),
  ];
  const decisionReasons = [
    makeDecisionReason({ code: "DUPLICATE_REASON", scope: Scope.TRAINING }),
    makeDecisionReason({ code: "DUPLICATE_REASON", scope: Scope.NUTRITION }),
  ];
  const missingOrUncertainData = [
    makeDataIssue({ path: "cardio.walkingAbility" }),
    makeDataIssue({ path: "cardio.averageDailySteps" }),
  ];
  const result = buildCardioPlanSpec(
    makeDecision({
      planStatus: PlanStatus.COACH_REVIEW_REQUIRED,
      constraints,
      reasons,
      reviewFlags,
      decisionReasons,
      missingOrUncertainData,
    }),
  );

  assert.deepEqual(result.constraints, constraints);
  assert.deepEqual(result.reasons, reasons);
  assert.deepEqual(result.source_review_context, {
    review_flags: reviewFlags,
    decision_reasons: decisionReasons,
    missing_or_uncertain_data: missingOrUncertainData,
  });
  assert.notEqual(result.constraints, constraints);
  assert.notEqual(result.reasons, reasons);
  assert.notEqual(result.source_review_context.review_flags, reviewFlags);
});

test("unrelated Intake Decision fields are neither required for mapping nor read", () => {
  const first = makeDecision();
  const second = makeDecision();
  first.nutrition_decision = { status: "ONE", deeply: { different: true } };
  first.training_decision = { recommended_days: 6 };
  second.nutrition_decision = { status: "TWO" };
  second.training_decision = { recommended_days: 0, sessions: ["ignored"] };
  second.extra_documented_field = "ignored";

  assert.deepEqual(
    buildCardioPlanSpec(first),
    buildCardioPlanSpec(second),
  );
});

test("input stays unchanged, mutable, and unfrozen", () => {
  const input = makeDecision({
    planStatus: PlanStatus.COACH_REVIEW_REQUIRED,
    reviewFlags: [makeReviewFlag()],
    missingOrUncertainData: [makeDataIssue()],
  });
  const snapshot = structuredClone(input);
  buildCardioPlanSpec(input);

  assert.deepEqual(input, snapshot);
  assert.equal(Object.isFrozen(input), false);
  assert.equal(Object.isFrozen(input.cardio_decision), false);
  assert.equal(Object.isFrozen(input.cardio_decision.constraints), false);
  assert.equal(Object.isFrozen(input.review_flags), false);
});

test("output is independent from later input mutation", () => {
  const input = makeDecision({
    planStatus: PlanStatus.COACH_REVIEW_REQUIRED,
    reviewFlags: [makeReviewFlag()],
    missingOrUncertainData: [makeDataIssue()],
  });
  const result = buildCardioPlanSpec(input);
  const snapshot = structuredClone(result);

  input.cardio_decision.constraints[0].value.sessionsPerWeek = 99;
  input.cardio_decision.reasons[0].message = "Changed later";
  input.review_flags[0].sourcePath = "changed.path";
  input.decision_reasons[0].code = "CHANGED";
  input.missing_or_uncertain_data[0].message = "Changed later";
  assert.deepEqual(result, snapshot);
});

test("complete output is deeply frozen", () => {
  const result = buildCardioPlanSpec(
    makeDecision({
      planStatus: PlanStatus.COACH_REVIEW_REQUIRED,
      reviewFlags: [makeReviewFlag()],
      missingOrUncertainData: [makeDataIssue()],
    }),
  );

  assertDeepFrozen(result);
  assert.throws(() => {
    result.status = "CHANGED";
  }, TypeError);
  assert.throws(() => {
    result.constraints[0].value.sessionsPerWeek = 99;
  }, TypeError);
  assert.throws(() => {
    result.source_review_context.review_flags.push(makeReviewFlag());
  }, TypeError);
});

test("identical inputs produce deeply equal independent outputs", () => {
  const input = makeDecision({
    planStatus: PlanStatus.COACH_REVIEW_REQUIRED,
    reviewFlags: [makeReviewFlag()],
  });
  const first = buildCardioPlanSpec(input);
  const second = buildCardioPlanSpec(input);

  assert.deepEqual(first, second);
  assert.notEqual(first, second);
  assert.notEqual(first.constraints, second.constraints);
});

test("invalid input shells and missing owned fields throw TypeError", () => {
  for (const input of [undefined, null, [], "decision", 1]) {
    assert.throws(() => buildCardioPlanSpec(input), TypeError);
  }

  for (const key of [
    "plan_status",
    "review_flags",
    "decision_reasons",
    "missing_or_uncertain_data",
    "cardio_decision",
  ]) {
    const input = makeDecision();
    delete input[key];
    assert.throws(() => buildCardioPlanSpec(input), TypeError);
  }
});

test("cardio_decision is a closed record with all six required fields", () => {
  const missing = makeDecision();
  delete missing.cardio_decision.reasons;
  const unknown = makeDecision();
  unknown.cardio_decision.unapproved_field = true;

  for (const input of [
    { ...makeDecision(), cardio_decision: null },
    { ...makeDecision(), cardio_decision: [] },
    missing,
    unknown,
  ]) {
    assert.throws(() => buildCardioPlanSpec(input), TypeError);
  }
});

test("unknown plan status, strategy, and intensity are rejected", () => {
  const invalidInputs = [
    makeDecision({ planStatus: "READY" }),
    makeDecision({ strategy: "LISS" }),
    makeDecision({
      strategy: CardioStrategy.CARDIO_SESSIONS,
      intensityStart: "HIGH",
    }),
  ];
  for (const input of invalidInputs) {
    assert.throws(() => buildCardioPlanSpec(input), TypeError);
  }
});

test("caps must be finite non-negative integers", () => {
  for (const invalid of [-1, 1.5, "2", null, Number.NaN, Infinity, -Infinity]) {
    assert.throws(
      () =>
        buildCardioPlanSpec(
          makeDecision({
            strategy: CardioStrategy.CARDIO_SESSIONS,
            maxSessions: invalid,
          }),
        ),
      TypeError,
    );
    assert.throws(
      () =>
        buildCardioPlanSpec(
          makeDecision({
            strategy: CardioStrategy.CARDIO_SESSIONS,
            maxDurationMinutes: invalid,
          }),
        ),
      TypeError,
    );
  }
});

test("formal sessions require two positive limits", () => {
  for (const [maxSessions, maxDurationMinutes] of [
    [0, 30],
    [2, 0],
    [0, 0],
  ]) {
    assert.throws(
      () =>
        buildCardioPlanSpec(
          makeDecision({
            strategy: CardioStrategy.CARDIO_SESSIONS,
            maxSessions,
            maxDurationMinutes,
          }),
        ),
      TypeError,
    );
  }
});

test("every non-session strategy requires zero limits and LOW intensity", () => {
  for (const strategy of [
    CardioStrategy.NO_ADDITIONAL_CARDIO,
    CardioStrategy.STEPS_ONLY,
    CardioStrategy.REVIEW_REQUIRED,
  ]) {
    const planStatus =
      strategy === CardioStrategy.REVIEW_REQUIRED
        ? PlanStatus.COACH_REVIEW_REQUIRED
        : PlanStatus.READY_FOR_DRAFT;
    assert.throws(
      () =>
        buildCardioPlanSpec(
          makeDecision({ planStatus, strategy, maxSessions: 1 }),
        ),
      TypeError,
    );
    assert.throws(
      () =>
        buildCardioPlanSpec(
          makeDecision({ planStatus, strategy, maxDurationMinutes: 15 }),
        ),
      TypeError,
    );
    assert.throws(
      () =>
        buildCardioPlanSpec(
          makeDecision({
            planStatus,
            strategy,
            intensityStart: CardioIntensity.MODERATE,
          }),
        ),
      TypeError,
    );
  }
});

test("impossible status and strategy combinations are rejected", () => {
  assert.throws(
    () =>
      buildCardioPlanSpec(
        makeDecision({
          planStatus: PlanStatus.READY_FOR_DRAFT,
          strategy: CardioStrategy.REVIEW_REQUIRED,
        }),
      ),
    TypeError,
  );

  for (const planStatus of [
    PlanStatus.MEDICAL_REVIEW_REQUIRED,
    PlanStatus.BLOCKED,
  ]) {
    for (const strategy of [
      CardioStrategy.NO_ADDITIONAL_CARDIO,
      CardioStrategy.STEPS_ONLY,
      CardioStrategy.CARDIO_SESSIONS,
    ]) {
      assert.throws(
        () => buildCardioPlanSpec(makeDecision({ planStatus, strategy })),
        TypeError,
      );
    }
  }
});

test("all copied collections must be dense arrays", () => {
  for (const path of [
    "constraints",
    "reasons",
    "review_flags",
    "decision_reasons",
    "missing_or_uncertain_data",
  ]) {
    const input = makeDecision();
    if (path === "constraints" || path === "reasons") {
      input.cardio_decision[path] = {};
    } else {
      input[path] = {};
    }
    assert.throws(() => buildCardioPlanSpec(input), TypeError);
  }

  const sparse = makeDecision();
  sparse.review_flags = new Array(2);
  sparse.review_flags[1] = makeReviewFlag();
  assert.throws(() => buildCardioPlanSpec(sparse), TypeError);

  const nonEnumerableItem = makeDecision();
  nonEnumerableItem.review_flags = [makeReviewFlag()];
  Object.defineProperty(nonEnumerableItem.review_flags, "0", {
    value: makeReviewFlag(),
    enumerable: false,
    configurable: true,
    writable: true,
  });
  assert.throws(() => buildCardioPlanSpec(nonEnumerableItem), TypeError);
});

test("constraint records reject wrong shapes, blank text, and invalid scope", () => {
  const invalidConstraints = [
    null,
    [],
    { ...makeConstraint(), extra: true },
    { code: "CODE", scope: Scope.CARDIO, value: null },
    makeConstraint({ code: "   " }),
    makeConstraint({ reason: "" }),
    makeConstraint({ scope: Scope.TRAINING }),
  ];

  for (const constraint of invalidConstraints) {
    assert.throws(
      () =>
        buildCardioPlanSpec(makeDecision({ constraints: [constraint] })),
      TypeError,
    );
  }
});

test("constraint values accept recursive JSON data and shared non-cyclic references", () => {
  const shared = { retained: true };
  const value = {
    nullValue: null,
    booleanValue: false,
    numberValue: -1.25,
    stringValue: "original",
    arrayValue: [0, true, "text", { nested: [null] }],
    sharedLeft: shared,
    sharedRight: shared,
  };
  const result = buildCardioPlanSpec(
    makeDecision({ constraints: [makeConstraint({ value })] }),
  );

  assert.deepEqual(result.constraints[0].value, value);
  assert.equal(
    result.constraints[0].value.sharedLeft,
    result.constraints[0].value.sharedRight,
  );
});

test("constraint values reject non-JSON primitives and special objects", () => {
  class InvalidClass {}
  for (const value of [
    undefined,
    Math.max,
    Symbol("invalid"),
    1n,
    Number.NaN,
    Infinity,
    -Infinity,
    new Date("2026-07-23"),
    new Map([["key", "value"]]),
    new Set(["value"]),
    new InvalidClass(),
  ]) {
    assert.throws(
      () =>
        buildCardioPlanSpec(
          makeDecision({ constraints: [makeConstraint({ value })] }),
        ),
      TypeError,
    );
  }
});

test("constraint values reject sparse and cyclic structures without recursion failure", () => {
  const sparseArray = new Array(2);
  sparseArray[0] = "present";
  const cyclicObject = {};
  cyclicObject.self = cyclicObject;
  const cyclicArray = [];
  cyclicArray.push(cyclicArray);
  const deeplyInvalid = { valid: [{ stillValid: { invalid: undefined } }] };

  for (const value of [
    sparseArray,
    cyclicObject,
    cyclicArray,
    deeplyInvalid,
  ]) {
    assert.throws(
      () =>
        buildCardioPlanSpec(
          makeDecision({ constraints: [makeConstraint({ value })] }),
        ),
      TypeError,
    );
  }
});

test("constraint JSON objects reject symbols, accessors, and hidden properties", () => {
  const symbolProperty = {};
  symbolProperty[Symbol("hidden")] = true;
  const accessorProperty = {};
  Object.defineProperty(accessorProperty, "value", {
    get: undefined,
    enumerable: true,
  });
  const nonEnumerableProperty = {};
  Object.defineProperty(nonEnumerableProperty, "value", {
    value: true,
    enumerable: false,
  });

  for (const value of [
    symbolProperty,
    accessorProperty,
    nonEnumerableProperty,
  ]) {
    assert.throws(
      () =>
        buildCardioPlanSpec(
          makeDecision({ constraints: [makeConstraint({ value })] }),
        ),
      TypeError,
    );
  }
});

test("cardio reason records are closed, non-empty, and CARDIO-scoped", () => {
  const invalidReasons = [
    null,
    [],
    { ...makeCardioReason(), extra: true },
    { code: "CODE", scope: Scope.CARDIO },
    makeCardioReason({ code: " " }),
    makeCardioReason({ message: "" }),
    makeCardioReason({ scope: Scope.GLOBAL }),
  ];

  for (const reason of invalidReasons) {
    assert.throws(
      () => buildCardioPlanSpec(makeDecision({ reasons: [reason] })),
      TypeError,
    );
  }
});

test("review flags are closed and validate scope, level, text, and source path", () => {
  const invalidFlags = [
    null,
    [],
    { ...makeReviewFlag(), extra: true },
    { code: "CODE", scope: Scope.CARDIO, level: ReviewLevel.COACH },
    makeReviewFlag({ code: " " }),
    makeReviewFlag({ scope: "UNKNOWN" }),
    makeReviewFlag({ level: "UNKNOWN" }),
    makeReviewFlag({ message: "" }),
    makeReviewFlag({ sourcePath: "  " }),
  ];

  for (const reviewFlag of invalidFlags) {
    assert.throws(
      () =>
        buildCardioPlanSpec(
          makeDecision({
            planStatus: PlanStatus.COACH_REVIEW_REQUIRED,
            reviewFlags: [reviewFlag],
          }),
        ),
      TypeError,
    );
  }
});

test("top-level decision reasons are closed and allow every known scope", () => {
  for (const scope of Object.values(Scope)) {
    const reason = makeDecisionReason({ scope });
    const result = buildCardioPlanSpec(
      makeDecision({ decisionReasons: [reason] }),
    );
    assert.deepEqual(result.source_review_context.decision_reasons, [reason]);
  }

  for (const reason of [
    null,
    [],
    { ...makeDecisionReason(), extra: true },
    makeDecisionReason({ code: "" }),
    makeDecisionReason({ scope: "UNKNOWN" }),
    makeDecisionReason({ message: " " }),
  ]) {
    assert.throws(
      () =>
        buildCardioPlanSpec(makeDecision({ decisionReasons: [reason] })),
      TypeError,
    );
  }
});

test("top-level data issues are closed and require three non-empty strings", () => {
  for (const issue of [
    null,
    [],
    { ...makeDataIssue(), extra: true },
    makeDataIssue({ code: "" }),
    makeDataIssue({ path: " " }),
    makeDataIssue({ message: 1 }),
  ]) {
    assert.throws(
      () =>
        buildCardioPlanSpec(
          makeDecision({ missingOrUncertainData: [issue] }),
        ),
      TypeError,
    );
  }
});

test("general-health and fat-loss goals retain Intake no-cardio decisions", () => {
  for (const primary of [
    PrimaryGoal.GENERAL_HEALTH,
    PrimaryGoal.FAT_LOSS,
  ]) {
    const { intakeDecision, specification } = buildFromIntake({
      goals: { primary },
      cardio: { averageDailySteps: 8000 },
    });
    assert.equal(
      intakeDecision.cardio_decision.strategy,
      CardioStrategy.NO_ADDITIONAL_CARDIO,
    );
    assert.equal(specification.status, CardioPlanStatus.READY);
    assert.equal(
      specification.formal_session_state,
      CardioFormalSessionState.NOT_INDICATED,
    );
    assert.deepEqual(
      specification.reasons,
      intakeDecision.cardio_decision.reasons,
    );
  }
});

test("low daily movement remains STEPS_ONLY even for a performance goal", () => {
  const { intakeDecision, specification } = buildFromIntake({
    goals: { primary: PrimaryGoal.PERFORMANCE },
    cardio: { averageDailySteps: 3500 },
  });

  assert.equal(intakeDecision.cardio_decision.strategy, CardioStrategy.STEPS_ONLY);
  assert.equal(specification.status, CardioPlanStatus.READY);
  assert.equal(
    specification.formal_session_state,
    CardioFormalSessionState.DAILY_MOVEMENT_ONLY,
  );
  assert.equal("step_target" in specification, false);
  assert.ok(
    specification.reasons.some(
      (reason) => reason.code === "ENDURANCE_GOAL_DOES_NOT_OVERRIDE_STEPS_FIRST",
    ),
  );
});

test("performance goal formal-session decision preserves moderate capacity without dose", () => {
  const { intakeDecision, specification } = buildFromIntake({
    goals: { primary: PrimaryGoal.PERFORMANCE },
    cardio: {
      averageDailySteps: 6000,
      maxSessionsPerWeek: 3,
      maxDurationMinutes: 45,
    },
  });

  assert.equal(
    intakeDecision.cardio_decision.strategy,
    CardioStrategy.CARDIO_SESSIONS,
  );
  assert.equal(
    intakeDecision.cardio_decision.intensity_start,
    CardioIntensity.MODERATE,
  );
  assert.equal(
    specification.formal_session_state,
    CardioFormalSessionState.PRESCRIPTION_REQUIRED,
  );
  assert.deepEqual(specification.limits, {
    max_sessions_per_week: 3,
    max_duration_minutes_per_session: 45,
    intensity_start: CardioIntensity.MODERATE,
  });
  assertNoExecutablePrescriptionFields(specification);
});

test("beginner performance path preserves the upstream LOW intensity start", () => {
  const { intakeDecision, specification } = buildFromIntake({
    goals: { primary: PrimaryGoal.PERFORMANCE },
    training: { experience: TrainingExperience.BEGINNER },
    cardio: { averageDailySteps: 6000 },
  });

  assert.equal(
    intakeDecision.cardio_decision.strategy,
    CardioStrategy.CARDIO_SESSIONS,
  );
  assert.equal(
    specification.limits.intensity_start,
    CardioIntensity.LOW,
  );
  assert.ok(
    specification.reasons.some(
      (reason) => reason.code === "CARDIO_LOW_INTENSITY_CONSERVATIVE_START",
    ),
  );
});

test("unknown steps with adequate activity retains the upstream data issue without inventing a target", () => {
  const { intakeDecision, specification } = buildFromIntake({
    cardio: { averageDailySteps: null },
  });

  assert.equal(
    intakeDecision.cardio_decision.strategy,
    CardioStrategy.NO_ADDITIONAL_CARDIO,
  );
  assert.equal(specification.status, CardioPlanStatus.READY);
  assert.ok(
    specification.source_review_context.missing_or_uncertain_data.some(
      (issue) => issue.code === "AVERAGE_DAILY_STEPS_UNKNOWN",
    ),
  );
  assertNoExecutablePrescriptionFields(specification);
});

test("an unrelated nutrition review makes Cardio provisional without changing its strategy", () => {
  const { intakeDecision, specification } = buildFromIntake({
    nutrition: {
      allergies: [{ substance: "SESAME", medicallyConfirmed: false }],
    },
  });

  assert.equal(intakeDecision.plan_status, PlanStatus.COACH_REVIEW_REQUIRED);
  assert.equal(
    intakeDecision.cardio_decision.strategy,
    CardioStrategy.NO_ADDITIONAL_CARDIO,
  );
  assert.equal(
    specification.status,
    CardioPlanStatus.PROVISIONAL_REVIEW_REQUIRED,
  );
  assert.equal(
    specification.formal_session_state,
    CardioFormalSessionState.NOT_INDICATED,
  );
  assert.ok(
    specification.source_review_context.review_flags.some(
      (flag) =>
        flag.code === "UNCONFIRMED_FOOD_ALLERGY" &&
        flag.sourcePath === "nutrition.allergies[0].medicallyConfirmed",
    ),
  );
});

test("limited walking remains a provisional cardio review without interpretation", () => {
  const { intakeDecision, specification } = buildFromIntake({
    cardio: { walkingAbility: WalkingAbility.LIMITED },
  });

  assert.equal(intakeDecision.plan_status, PlanStatus.COACH_REVIEW_REQUIRED);
  assert.equal(
    intakeDecision.cardio_decision.strategy,
    CardioStrategy.REVIEW_REQUIRED,
  );
  assert.equal(
    specification.formal_session_state,
    CardioFormalSessionState.REVIEW_REQUIRED,
  );
  assert.ok(
    specification.source_review_context.review_flags.some(
      (flag) => flag.code === "WALKING_TEN_MINUTES_NOT_CONFIRMED",
    ),
  );
  assertNoExecutablePrescriptionFields(specification);
});

test("an explicit all-cardio restriction remains a copied constraint and review state", () => {
  const restriction = {
    movement: "ALL_CARDIO",
    instruction: "AVOID",
    source: "PHYSICIAN",
  };
  const { intakeDecision, specification } = buildFromIntake({
    training: { medicalMovementRestrictions: [restriction] },
  });

  assert.equal(intakeDecision.plan_status, PlanStatus.COACH_REVIEW_REQUIRED);
  assert.equal(
    intakeDecision.cardio_decision.strategy,
    CardioStrategy.REVIEW_REQUIRED,
  );
  assert.equal(
    specification.formal_session_state,
    CardioFormalSessionState.REVIEW_REQUIRED,
  );
  assert.ok(
    specification.constraints.some(
      (constraint) =>
        constraint.code === "MEDICAL_MOVEMENT_RESTRICTION" &&
        constraint.value.movement === "ALL_CARDIO",
    ),
  );
});

test("medical review and blocking states withhold Cardio while retaining exact causes", () => {
  const cases = [
    {
      overrides: {
        medical: {
          dangerousSymptoms: {
            chestPainOrPressure: ScreeningAnswer.YES,
          },
        },
      },
      planStatus: PlanStatus.MEDICAL_REVIEW_REQUIRED,
      reviewCode: "CHEST_PAIN_OR_PRESSURE",
    },
    {
      overrides: {
        personal: {
          dateOfBirth: "2015-01-01",
          guardianConsent: false,
        },
      },
      planStatus: PlanStatus.BLOCKED,
      reviewCode: "MINOR_WITHOUT_GUARDIAN_CONSENT",
    },
  ];

  for (const testCase of cases) {
    const { intakeDecision, specification } = buildFromIntake(
      testCase.overrides,
    );
    assert.equal(intakeDecision.plan_status, testCase.planStatus);
    assert.equal(
      intakeDecision.cardio_decision.strategy,
      CardioStrategy.REVIEW_REQUIRED,
    );
    assert.equal(specification.status, CardioPlanStatus.WITHHELD);
    assert.equal(
      specification.formal_session_state,
      CardioFormalSessionState.WITHHELD,
    );
    assert.ok(
      specification.source_review_context.review_flags.some(
        (flag) => flag.code === testCase.reviewCode,
      ),
    );
    assertNoExecutablePrescriptionFields(specification);
  }
});

test("unclassified sport text is retained for review without classification", () => {
  const sportText = "Custom endurance league";
  const { intakeDecision, specification } = buildFromIntake({
    cardio: {
      additionalSports: [
        {
          sportCode: null,
          otherSportText: sportText,
          days: ["TUESDAY"],
          minutesPerSession: 45,
          intensity: "MODERATE",
          participationLevel: "RECREATIONAL",
        },
      ],
    },
  });

  assert.equal(intakeDecision.plan_status, PlanStatus.COACH_REVIEW_REQUIRED);
  assert.ok(
    specification.constraints.some(
      (constraint) =>
        constraint.code === "EXISTING_ADDITIONAL_SPORT" &&
        constraint.value.otherSportText === sportText,
    ),
  );
  assert.ok(
    specification.source_review_context.review_flags.some(
      (flag) =>
        flag.code === "UNCLASSIFIED_ADDITIONAL_SPORT" &&
        flag.sourcePath ===
          "cardio.additionalSports[0].otherSportText",
    ),
  );
  assert.ok(
    specification.source_review_context.missing_or_uncertain_data.some(
      (issue) => issue.code === "ADDITIONAL_SPORT_MAPPING_PENDING",
    ),
  );
});

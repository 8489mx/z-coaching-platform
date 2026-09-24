import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  DayOfWeek,
  evaluateIntake,
  ScheduleMode,
} from "../src/intake-decision-engine/index.js";
import { TrainingPlanStatus } from "../src/training-plan-specification/index.js";
import { ExerciseSlotSelectionStatus } from "../src/exercise-selection/index.js";
import { ExercisePrescriptionUnit } from "../src/exercise-catalog/index.js";
import { buildTrainingDraft } from "../src/training-draft/index.js";
import {
  buildWeeklyTrainingSchedule,
  ScheduleReasonCode,
  WEEKLY_TRAINING_SCHEDULE_VERSION,
  WeeklySportLoad,
} from "../src/weekly-training-schedule/index.js";
import {
  evaluateTrainingPlanPreflight,
  PreflightIssueCode,
  PreflightIssueSeverity,
  TRAINING_PLAN_PREFLIGHT_VERSION,
  TrainingPlanPreflightResult,
} from "../src/training-plan-preflight/index.js";

const HIGH_SPORT_MESSAGE =
  "A training session overlaps a reported high-intensity sport day and requires coach review.";
const REVIEW_SLOT_MESSAGE =
  "A training exercise slot is unresolved and must be reviewed before approval.";
const UPSTREAM_REVIEW_MESSAGE =
  "The training plan requires coach review because of an unresolved upstream intake or planning decision.";
const WITHHELD_MESSAGE =
  "The training plan is withheld and cannot be approved until the blocking condition is resolved.";

const DAYS = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY,
];

function validPrescription(overrides = {}) {
  return {
    sets: 3,
    unit: ExercisePrescriptionUnit.REPS,
    target_min: 8,
    target_max: 12,
    rest_seconds: 90,
    ...overrides,
  };
}

function selectedExercise(order, overrides = {}) {
  return {
    order,
    slot_code: "HORIZONTAL_PUSH",
    selection_status: ExerciseSlotSelectionStatus.SELECTED,
    exercise_code: "PUSH_UP",
    name_en: "Push Up",
    reason_code: "SELECTED_BODYWEIGHT_FALLBACK",
    source_constraint_codes: [],
    prescription: validPrescription(),
    ...overrides,
  };
}

function reviewExercise(order, overrides = {}) {
  return {
    order,
    slot_code: "VERTICAL_PULL",
    selection_status: ExerciseSlotSelectionStatus.REVIEW_REQUIRED,
    exercise_code: null,
    name_en: null,
    reason_code: "NO_ELIGIBLE_EXERCISE",
    source_constraint_codes: [],
    prescription: null,
    ...overrides,
  };
}

function fixedSession(
  sequence,
  scheduledDay,
  exercises = [selectedExercise(1)],
  overrides = {},
) {
  return {
    sequence,
    session_code: sequence === 1 ? "FULL_BODY_A" : "FULL_BODY_B",
    focus: "FULL_BODY",
    exercises,
    scheduled_day: scheduledDay,
    sport_load: WeeklySportLoad.NONE,
    schedule_reason_code: ScheduleReasonCode.SELECTED_FIXED_TRAINING_DAY,
    ...overrides,
  };
}

function sequenceSession(
  sequence,
  exercises = [selectedExercise(1)],
  overrides = {},
) {
  return {
    sequence,
    session_code: sequence === 1 ? "FULL_BODY_A" : "FULL_BODY_B",
    focus: "FULL_BODY",
    exercises,
    scheduled_day: null,
    sport_load: WeeklySportLoad.NONE,
    schedule_reason_code: ScheduleReasonCode.SESSION_SEQUENCE_REQUIRED,
    ...overrides,
  };
}

function makeSchedule(overrides = {}) {
  return {
    schedule_version: WEEKLY_TRAINING_SCHEDULE_VERSION,
    draft_version: "training-draft-v1",
    pipeline_versions: {
      plan_spec: "training-plan-spec-v1",
      session_blueprint: "training-session-blueprint-v1",
      exercise_selection: "exercise-selection-v1",
      training_prescription: "training-prescription-v1",
    },
    prescription_version: "training-prescription-v1",
    status: TrainingPlanStatus.READY,
    recommended_days: 2,
    split_code: "FULL_BODY",
    schedule_mode: ScheduleMode.FIXED_DAYS,
    intro_week_required: false,
    volume_start: "NORMAL",
    schedule_review_required: false,
    schedule_reasons: [],
    sessions: [
      fixedSession(1, DayOfWeek.MONDAY),
      fixedSession(2, DayOfWeek.THURSDAY),
    ],
    constraints: [],
    reasons: [],
    ...overrides,
  };
}

function highSportSchedule(overrides = {}) {
  return makeSchedule({
    status: TrainingPlanStatus.PROVISIONAL_REVIEW_REQUIRED,
    schedule_review_required: true,
    schedule_reasons: [
      {
        code: ScheduleReasonCode.HIGH_SPORT_DAY_REQUIRES_REVIEW,
        message: HIGH_SPORT_MESSAGE,
      },
    ],
    sessions: [
      fixedSession(1, DayOfWeek.MONDAY, [selectedExercise(1)], {
        sport_load: WeeklySportLoad.HIGH,
        schedule_reason_code:
          ScheduleReasonCode.HIGH_SPORT_DAY_REQUIRES_REVIEW,
      }),
      fixedSession(2, DayOfWeek.THURSDAY),
    ],
    ...overrides,
  });
}

function reviewIssue(sessionSequence, slotOrder) {
  return {
    code: PreflightIssueCode.EXERCISE_SLOT_REQUIRES_REVIEW,
    severity: PreflightIssueSeverity.REVIEW,
    message: REVIEW_SLOT_MESSAGE,
    session_sequence: sessionSequence,
    slot_order: slotOrder,
  };
}

test("READY FIXED_DAYS passes and the public API exposes only the approved report enums", () => {
  assert.equal(
    TRAINING_PLAN_PREFLIGHT_VERSION,
    "training-plan-preflight-v1",
  );
  assert.deepEqual(Object.values(TrainingPlanPreflightResult), [
    "PASSED",
    "REVIEW_REQUIRED",
    "WITHHELD",
  ]);
  assert.deepEqual(Object.values(PreflightIssueSeverity), ["REVIEW", "BLOCKING"]);
  assert.deepEqual(Object.values(PreflightIssueCode), [
    "PLAN_WITHHELD",
    "UPSTREAM_REVIEW_REQUIRED",
    "EXERCISE_SLOT_REQUIRES_REVIEW",
    "HIGH_SPORT_DAY_REQUIRES_REVIEW",
  ]);
  assert.equal(Object.isFrozen(TrainingPlanPreflightResult), true);
  assert.equal(Object.isFrozen(PreflightIssueSeverity), true);
  assert.equal(Object.isFrozen(PreflightIssueCode), true);

  const result = evaluateTrainingPlanPreflight(makeSchedule());

  assert.deepEqual(result, {
    preflight_version: TRAINING_PLAN_PREFLIGHT_VERSION,
    schedule_version: WEEKLY_TRAINING_SCHEDULE_VERSION,
    plan_status: TrainingPlanStatus.READY,
    result: TrainingPlanPreflightResult.PASSED,
    can_approve: true,
    issues: [],
  });
  assert.deepEqual(Object.keys(result).sort(), [
    "can_approve",
    "issues",
    "plan_status",
    "preflight_version",
    "result",
    "schedule_version",
  ]);
});

test("READY SESSION_SEQUENCE passes without fixed days", () => {
  const schedule = makeSchedule({
    schedule_mode: ScheduleMode.SESSION_SEQUENCE,
    sessions: [sequenceSession(1), sequenceSession(2)],
  });

  const result = evaluateTrainingPlanPreflight(schedule);

  assert.equal(result.result, TrainingPlanPreflightResult.PASSED);
  assert.equal(result.can_approve, true);
  assert.deepEqual(result.issues, []);
});

test("a provisional review slot produces a located review issue", () => {
  const schedule = makeSchedule({
    status: TrainingPlanStatus.PROVISIONAL_REVIEW_REQUIRED,
    sessions: [
      fixedSession(1, DayOfWeek.MONDAY, [
        selectedExercise(1),
        reviewExercise(2),
      ]),
      fixedSession(2, DayOfWeek.THURSDAY),
    ],
  });

  const result = evaluateTrainingPlanPreflight(schedule);

  assert.equal(result.result, TrainingPlanPreflightResult.REVIEW_REQUIRED);
  assert.equal(result.can_approve, false);
  assert.deepEqual(result.issues, [reviewIssue(1, 2)]);
});

test("multiple review-slot issues are sorted by session sequence then slot order", () => {
  const sessions = [
    fixedSession(
      2,
      DayOfWeek.THURSDAY,
      [reviewExercise(2), reviewExercise(1)],
    ),
    fixedSession(1, DayOfWeek.MONDAY, [selectedExercise(1), reviewExercise(2)]),
  ];
  const schedule = makeSchedule({
    status: TrainingPlanStatus.PROVISIONAL_REVIEW_REQUIRED,
    sessions,
  });

  const result = evaluateTrainingPlanPreflight(schedule);

  assert.deepEqual(result.issues, [
    reviewIssue(1, 2),
    reviewIssue(2, 1),
    reviewIssue(2, 2),
  ]);
  assert.deepEqual(
    schedule.sessions.map(({ sequence }) => sequence),
    [2, 1],
  );
});

test("HIGH sport review produces one general issue before review-slot issues", () => {
  const schedule = highSportSchedule({
    sessions: [
      fixedSession(1, DayOfWeek.MONDAY, [selectedExercise(1)], {
        sport_load: WeeklySportLoad.HIGH,
        schedule_reason_code:
          ScheduleReasonCode.HIGH_SPORT_DAY_REQUIRES_REVIEW,
      }),
      fixedSession(2, DayOfWeek.THURSDAY, [
        selectedExercise(1),
        reviewExercise(2),
      ], {
        sport_load: WeeklySportLoad.HIGH,
        schedule_reason_code:
          ScheduleReasonCode.HIGH_SPORT_DAY_REQUIRES_REVIEW,
      }),
    ],
  });

  const result = evaluateTrainingPlanPreflight(schedule);

  assert.equal(result.result, TrainingPlanPreflightResult.REVIEW_REQUIRED);
  assert.equal(result.can_approve, false);
  assert.deepEqual(result.issues, [
    {
      code: PreflightIssueCode.HIGH_SPORT_DAY_REQUIRES_REVIEW,
      severity: PreflightIssueSeverity.REVIEW,
      message: HIGH_SPORT_MESSAGE,
      session_sequence: null,
      slot_order: null,
    },
    reviewIssue(2, 2),
  ]);
});

test("a provisional plan without local review findings reports one upstream issue", () => {
  const schedule = makeSchedule({
    status: TrainingPlanStatus.PROVISIONAL_REVIEW_REQUIRED,
  });

  const result = evaluateTrainingPlanPreflight(schedule);

  assert.deepEqual(result, {
    preflight_version: TRAINING_PLAN_PREFLIGHT_VERSION,
    schedule_version: WEEKLY_TRAINING_SCHEDULE_VERSION,
    plan_status: TrainingPlanStatus.PROVISIONAL_REVIEW_REQUIRED,
    result: TrainingPlanPreflightResult.REVIEW_REQUIRED,
    can_approve: false,
    issues: [
      {
        code: PreflightIssueCode.UPSTREAM_REVIEW_REQUIRED,
        severity: PreflightIssueSeverity.REVIEW,
        message: UPSTREAM_REVIEW_MESSAGE,
        session_sequence: null,
        slot_order: null,
      },
    ],
  });
});

test("a valid withheld plan returns one blocking issue", () => {
  const schedule = makeSchedule({
    status: TrainingPlanStatus.WITHHELD,
    recommended_days: 4,
    sessions: [],
  });

  const result = evaluateTrainingPlanPreflight(schedule);

  assert.deepEqual(result, {
    preflight_version: TRAINING_PLAN_PREFLIGHT_VERSION,
    schedule_version: WEEKLY_TRAINING_SCHEDULE_VERSION,
    plan_status: TrainingPlanStatus.WITHHELD,
    result: TrainingPlanPreflightResult.WITHHELD,
    can_approve: false,
    issues: [
      {
        code: PreflightIssueCode.PLAN_WITHHELD,
        severity: PreflightIssueSeverity.BLOCKING,
        message: WITHHELD_MESSAGE,
        session_sequence: null,
        slot_order: null,
      },
    ],
  });
});

test("a provisional zero-day plan reports upstream review without sessions", () => {
  const schedule = makeSchedule({
    status: TrainingPlanStatus.PROVISIONAL_REVIEW_REQUIRED,
    recommended_days: 0,
    sessions: [],
  });

  const result = evaluateTrainingPlanPreflight(schedule);

  assert.equal(result.result, TrainingPlanPreflightResult.REVIEW_REQUIRED);
  assert.equal(result.can_approve, false);
  assert.equal(result.issues.length, 1);
  assert.equal(result.issues[0].code, PreflightIssueCode.UPSTREAM_REVIEW_REQUIRED);
});

test("top-level contract violations and a READY plan without sessions throw TypeError", () => {
  for (const input of [null, undefined, [], "schedule", 123]) {
    assert.throws(() => evaluateTrainingPlanPreflight(input), TypeError);
  }

  const invalidMutations = [
    (schedule) => {
      schedule.schedule_version = "weekly-training-schedule-v0";
    },
    (schedule) => {
      schedule.status = "DRAFT";
    },
    (schedule) => {
      schedule.schedule_mode = "MONTHLY";
    },
    (schedule) => {
      schedule.sessions = null;
    },
    (schedule) => {
      schedule.schedule_review_required = "false";
    },
    (schedule) => {
      schedule.schedule_reasons = null;
    },
    (schedule) => {
      schedule.constraints = null;
    },
    (schedule) => {
      schedule.reasons = null;
    },
    (schedule) => {
      schedule.recommended_days = -1;
    },
    (schedule) => {
      schedule.recommended_days = 2.5;
    },
  ];
  for (const mutate of invalidMutations) {
    const schedule = makeSchedule();
    mutate(schedule);
    assert.throws(() => evaluateTrainingPlanPreflight(schedule), TypeError);
  }

  assert.throws(
    () =>
      evaluateTrainingPlanPreflight(
        makeSchedule({ recommended_days: 0, sessions: [] }),
      ),
    TypeError,
  );
});

test("WITHHELD structural contradictions throw TypeError", () => {
  const invalidSchedules = [
    makeSchedule({ status: TrainingPlanStatus.WITHHELD }),
    makeSchedule({
      status: TrainingPlanStatus.WITHHELD,
      sessions: [],
      schedule_review_required: true,
    }),
    makeSchedule({
      status: TrainingPlanStatus.WITHHELD,
      sessions: [],
      schedule_reasons: [{ code: "REVIEW" }],
    }),
  ];

  for (const schedule of invalidSchedules) {
    assert.throws(() => evaluateTrainingPlanPreflight(schedule), TypeError);
  }
});

test("READY with a review-required exercise slot throws TypeError", () => {
  const schedule = makeSchedule({
    sessions: [
      fixedSession(1, DayOfWeek.MONDAY, [reviewExercise(1)]),
      fixedSession(2, DayOfWeek.THURSDAY),
    ],
  });

  assert.throws(() => evaluateTrainingPlanPreflight(schedule), TypeError);
});

test("a selected exercise without a valid code, name, or prescription throws TypeError", () => {
  const invalidExercises = [
    selectedExercise(1, { prescription: null }),
    selectedExercise(1, { prescription: undefined }),
    selectedExercise(1, { exercise_code: "   " }),
    selectedExercise(1, { name_en: "" }),
  ];

  for (const exercise of invalidExercises) {
    const schedule = makeSchedule({
      sessions: [
        fixedSession(1, DayOfWeek.MONDAY, [exercise]),
        fixedSession(2, DayOfWeek.THURSDAY),
      ],
    });
    assert.throws(() => evaluateTrainingPlanPreflight(schedule), TypeError);
  }
});

test("invalid prescription values throw TypeError", () => {
  const invalidPrescriptions = [
    validPrescription({ sets: 0 }),
    validPrescription({ sets: 2.5 }),
    validPrescription({ unit: "MINUTES" }),
    validPrescription({ target_min: 0 }),
    validPrescription({ target_max: 0 }),
    validPrescription({ target_min: 15, target_max: 10 }),
    validPrescription({ rest_seconds: 0 }),
    validPrescription({ rest_seconds: 60.5 }),
  ];

  for (const prescription of invalidPrescriptions) {
    const schedule = makeSchedule({
      sessions: [
        fixedSession(1, DayOfWeek.MONDAY, [
          selectedExercise(1, { prescription }),
        ]),
        fixedSession(2, DayOfWeek.THURSDAY),
      ],
    });
    assert.throws(() => evaluateTrainingPlanPreflight(schedule), TypeError);
  }
});

test("review-required slots reject any non-null selected-exercise fields", () => {
  const invalidReviewSlots = [
    reviewExercise(1, { exercise_code: "PUSH_UP" }),
    reviewExercise(1, { name_en: "Push Up" }),
    reviewExercise(1, { prescription: validPrescription() }),
    reviewExercise(1, { exercise_code: undefined }),
  ];

  for (const exercise of invalidReviewSlots) {
    const schedule = makeSchedule({
      status: TrainingPlanStatus.PROVISIONAL_REVIEW_REQUIRED,
      sessions: [
        fixedSession(1, DayOfWeek.MONDAY, [exercise]),
        fixedSession(2, DayOfWeek.THURSDAY),
      ],
    });
    assert.throws(() => evaluateTrainingPlanPreflight(schedule), TypeError);
  }
});

test("FIXED_DAYS rejects duplicate or unknown scheduled days", () => {
  const duplicateDay = makeSchedule({
    sessions: [
      fixedSession(1, DayOfWeek.MONDAY),
      fixedSession(2, DayOfWeek.MONDAY),
    ],
  });
  const unknownDay = makeSchedule({
    sessions: [
      fixedSession(1, "FUNDAY"),
      fixedSession(2, DayOfWeek.THURSDAY),
    ],
  });

  assert.throws(() => evaluateTrainingPlanPreflight(duplicateDay), TypeError);
  assert.throws(() => evaluateTrainingPlanPreflight(unknownDay), TypeError);
});

test("FIXED_DAYS sport load and schedule reason must match", () => {
  const invalidPairs = [
    [WeeklySportLoad.NONE, ScheduleReasonCode.SELECTED_AROUND_ADDITIONAL_SPORT],
    [WeeklySportLoad.LOW, ScheduleReasonCode.SELECTED_FIXED_TRAINING_DAY],
    [WeeklySportLoad.MODERATE, ScheduleReasonCode.HIGH_SPORT_DAY_REQUIRES_REVIEW],
    [WeeklySportLoad.HIGH, ScheduleReasonCode.SELECTED_AROUND_ADDITIONAL_SPORT],
    ["EXTREME", ScheduleReasonCode.SELECTED_FIXED_TRAINING_DAY],
    [WeeklySportLoad.NONE, "UNKNOWN_REASON"],
  ];

  for (const [sportLoad, scheduleReasonCode] of invalidPairs) {
    const schedule = makeSchedule({
      status:
        sportLoad === WeeklySportLoad.HIGH
          ? TrainingPlanStatus.PROVISIONAL_REVIEW_REQUIRED
          : TrainingPlanStatus.READY,
      schedule_review_required: sportLoad === WeeklySportLoad.HIGH,
      schedule_reasons:
        sportLoad === WeeklySportLoad.HIGH
          ? [{ code: ScheduleReasonCode.HIGH_SPORT_DAY_REQUIRES_REVIEW }]
          : [],
      sessions: [
        fixedSession(1, DayOfWeek.MONDAY, [selectedExercise(1)], {
          sport_load: sportLoad,
          schedule_reason_code: scheduleReasonCode,
        }),
        fixedSession(2, DayOfWeek.THURSDAY),
      ],
    });
    assert.throws(() => evaluateTrainingPlanPreflight(schedule), TypeError);
  }
});

test("SESSION_SEQUENCE rejects any fixed day, non-NONE load, or different reason", () => {
  const invalidFirstSessions = [
    sequenceSession(1, [selectedExercise(1)], {
      scheduled_day: DayOfWeek.MONDAY,
    }),
    sequenceSession(1, [selectedExercise(1)], {
      sport_load: WeeklySportLoad.LOW,
    }),
    sequenceSession(1, [selectedExercise(1)], {
      schedule_reason_code: ScheduleReasonCode.SELECTED_FIXED_TRAINING_DAY,
    }),
  ];

  for (const firstSession of invalidFirstSessions) {
    const schedule = makeSchedule({
      schedule_mode: ScheduleMode.SESSION_SEQUENCE,
      sessions: [firstSession, sequenceSession(2)],
    });
    assert.throws(() => evaluateTrainingPlanPreflight(schedule), TypeError);
  }
});

test("HIGH sport review metadata must be exactly consistent", () => {
  const invalidHighSchedules = [];

  const noFlag = highSportSchedule();
  noFlag.schedule_review_required = false;
  invalidHighSchedules.push(noFlag);

  const readyStatus = highSportSchedule();
  readyStatus.status = TrainingPlanStatus.READY;
  invalidHighSchedules.push(readyStatus);

  const missingReason = highSportSchedule();
  missingReason.schedule_reasons = [];
  invalidHighSchedules.push(missingReason);

  const duplicateReason = highSportSchedule();
  duplicateReason.schedule_reasons = [
    ...duplicateReason.schedule_reasons,
    ...duplicateReason.schedule_reasons,
  ];
  invalidHighSchedules.push(duplicateReason);

  const wrongReason = highSportSchedule();
  wrongReason.schedule_reasons = [{ code: "OTHER_REVIEW" }];
  invalidHighSchedules.push(wrongReason);

  const noHighWithFlag = makeSchedule({ schedule_review_required: true });
  invalidHighSchedules.push(noHighWithFlag);

  const noHighWithReason = makeSchedule({
    schedule_reasons: [
      { code: ScheduleReasonCode.HIGH_SPORT_DAY_REQUIRES_REVIEW },
    ],
  });
  invalidHighSchedules.push(noHighWithReason);

  for (const schedule of invalidHighSchedules) {
    assert.throws(() => evaluateTrainingPlanPreflight(schedule), TypeError);
  }
});

test("session sequences and exercise orders must be positive, unique, and contiguous", () => {
  const invalidSchedules = [];

  invalidSchedules.push(
    makeSchedule({ sessions: [null, fixedSession(2, DayOfWeek.THURSDAY)] }),
  );
  invalidSchedules.push(
    makeSchedule({
      sessions: [
        fixedSession(1, DayOfWeek.MONDAY),
        fixedSession(1, DayOfWeek.THURSDAY),
      ],
    }),
  );
  invalidSchedules.push(
    makeSchedule({
      sessions: [
        fixedSession(1, DayOfWeek.MONDAY),
        fixedSession(3, DayOfWeek.THURSDAY),
      ],
    }),
  );
  invalidSchedules.push(
    makeSchedule({
      sessions: [
        fixedSession(1, DayOfWeek.MONDAY),
        fixedSession(1.5, DayOfWeek.THURSDAY),
      ],
    }),
  );
  invalidSchedules.push(
    makeSchedule({
      recommended_days: 1,
      sessions: [fixedSession(1, DayOfWeek.MONDAY)],
    }),
  );
  invalidSchedules.push(
    makeSchedule({
      recommended_days: 7,
      sessions: DAYS.map((day, index) => fixedSession(index + 1, day)),
    }),
  );
  invalidSchedules.push(makeSchedule({ recommended_days: 3 }));

  const invalidExerciseLists = [
    null,
    [selectedExercise(0)],
    [selectedExercise(1), selectedExercise(1)],
    [selectedExercise(1), selectedExercise(3)],
    [selectedExercise(1.5)],
    [null],
    [selectedExercise(1, { selection_status: "UNKNOWN" })],
  ];
  for (const exercises of invalidExerciseLists) {
    invalidSchedules.push(
      makeSchedule({
        sessions: [
          fixedSession(1, DayOfWeek.MONDAY, exercises),
          fixedSession(2, DayOfWeek.THURSDAY),
        ],
      }),
    );
  }

  for (const schedule of invalidSchedules) {
    assert.throws(() => evaluateTrainingPlanPreflight(schedule), TypeError);
  }
});

test("preflight evaluation does not modify or embed the weekly schedule", () => {
  const schedule = highSportSchedule({
    sessions: [
      fixedSession(1, DayOfWeek.MONDAY, [selectedExercise(1)], {
        sport_load: WeeklySportLoad.HIGH,
        schedule_reason_code:
          ScheduleReasonCode.HIGH_SPORT_DAY_REQUIRES_REVIEW,
      }),
      fixedSession(2, DayOfWeek.THURSDAY, [
        selectedExercise(1),
        reviewExercise(2),
      ]),
    ],
  });
  const snapshot = structuredClone(schedule);

  const result = evaluateTrainingPlanPreflight(schedule);

  assert.deepEqual(schedule, snapshot);
  assert.equal("sessions" in result, false);
  assert.equal("constraints" in result, false);
  assert.equal("reasons" in result, false);
});

test("the full example passes through the complete pipeline into the actual review result", () => {
  const intake = JSON.parse(
    readFileSync(new URL("../examples/full-intake.json", import.meta.url), "utf8"),
  );
  const context = JSON.parse(
    readFileSync(
      new URL("../examples/evaluation-context.json", import.meta.url),
      "utf8",
    ),
  );

  const intakeDecision = evaluateIntake(intake, context);
  const trainingDraft = buildTrainingDraft(intakeDecision);
  const weeklySchedule = buildWeeklyTrainingSchedule(trainingDraft);
  const result = evaluateTrainingPlanPreflight(weeklySchedule);

  assert.equal(
    weeklySchedule.status,
    TrainingPlanStatus.PROVISIONAL_REVIEW_REQUIRED,
  );
  assert.deepEqual(result, {
    preflight_version: TRAINING_PLAN_PREFLIGHT_VERSION,
    schedule_version: WEEKLY_TRAINING_SCHEDULE_VERSION,
    plan_status: TrainingPlanStatus.PROVISIONAL_REVIEW_REQUIRED,
    result: TrainingPlanPreflightResult.REVIEW_REQUIRED,
    can_approve: false,
    // The glute movement joins the hinge day, so the vertical pull this client has no bar for is
    // the fifth slot of the session instead of the fourth.
    issues: [reviewIssue(2, 5)],
  });
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  DayOfWeek,
  evaluateIntake,
  ScheduleMode,
  SportCode,
  SportIntensity,
  SportParticipationLevel,
  TrainingScheduleAvailabilityType,
} from "../src/intake-decision-engine/index.js";
import { TrainingPlanStatus } from "../src/training-plan-specification/index.js";
import { buildTrainingDraft } from "../src/training-draft/index.js";
import {
  buildWeeklyTrainingSchedule,
  ScheduleReasonCode,
  WEEKLY_TRAINING_SCHEDULE_VERSION,
  WeeklySportLoad,
} from "../src/weekly-training-schedule/index.js";
import {
  ASSESSMENT_CONTEXT,
  completeIntake,
} from "./fixtures/complete-intake.js";

const SESSION_LAYOUTS = Object.freeze({
  2: [
    ["FULL_BODY_A", "FULL_BODY"],
    ["FULL_BODY_B", "FULL_BODY"],
  ],
  3: [
    ["FULL_BODY_A", "FULL_BODY"],
    ["FULL_BODY_B", "FULL_BODY"],
    ["FULL_BODY_C", "FULL_BODY"],
  ],
  4: [
    ["UPPER_A", "UPPER_BODY"],
    ["LOWER_A", "LOWER_BODY"],
    ["UPPER_B", "UPPER_BODY"],
    ["LOWER_B", "LOWER_BODY"],
  ],
  5: [
    ["UPPER_A", "UPPER_BODY"],
    ["LOWER_A", "LOWER_BODY"],
    ["PUSH_A", "PUSH"],
    ["PULL_A", "PULL"],
    ["LEGS_A", "LEGS"],
  ],
  6: [
    ["PUSH_A", "PUSH"],
    ["PULL_A", "PULL"],
    ["LEGS_A", "LEGS"],
    ["PUSH_B", "PUSH"],
    ["PULL_B", "PULL"],
    ["LEGS_B", "LEGS"],
  ],
});

const PIPELINE_VERSIONS = Object.freeze({
  plan_spec: "training-plan-spec-v1",
  session_blueprint: "training-session-blueprint-v1",
  exercise_selection: "exercise-selection-v1",
  training_prescription: "training-prescription-v1",
});

const DRAFT_REASON = Object.freeze({
  code: "PREFERRED_TRAINING_DAYS_APPLIED",
  scope: "TRAINING",
  message: "The preferred day count fits all higher-priority constraints.",
});

function makeExercise(sequence) {
  return {
    order: 1,
    slot_code: "HORIZONTAL_PUSH",
    selection_status: "SELECTED",
    exercise_code: "PUSH_UP",
    name_en: `Push Up ${sequence}`,
    reason_code: "SELECTED_BODYWEIGHT_FALLBACK",
    source_constraint_codes: [],
    prescription: {
      sets: 3,
      unit: "REPS",
      target_min: 8,
      target_max: 12,
      rest_seconds: 90,
    },
  };
}

function makeSessions(sessionCount) {
  const layout = SESSION_LAYOUTS[sessionCount];
  if (layout === undefined) {
    return Array.from({ length: sessionCount }, (_, index) => ({
      sequence: index + 1,
      session_code: `SESSION_${index + 1}`,
      focus: "FULL_BODY",
      exercises: [makeExercise(index + 1)],
    }));
  }
  return layout.map(([sessionCode, focus], index) => ({
    sequence: index + 1,
    session_code: sessionCode,
    focus,
    exercises: [makeExercise(index + 1)],
  }));
}

function makeDraft({
  sessionCount = 2,
  sessions = makeSessions(sessionCount),
  recommendedDays = sessionCount,
  status = TrainingPlanStatus.READY,
  scheduleMode = ScheduleMode.FIXED_DAYS,
  constraints = [],
  reasons = [DRAFT_REASON],
} = {}) {
  return {
    draft_version: "training-draft-v1",
    pipeline_versions: PIPELINE_VERSIONS,
    prescription_version: "training-prescription-v1",
    status,
    recommended_days: recommendedDays,
    split_code: sessionCount <= 3 ? "FULL_BODY" : "UPPER_LOWER",
    schedule_mode: scheduleMode,
    intro_week_required: false,
    volume_start: "NORMAL",
    sessions,
    constraints,
    reasons,
  };
}

function dayConstraint(code, day) {
  return {
    code,
    scope: "TRAINING",
    value: { day },
    reason: "Weekly availability fixture.",
  };
}

function sportConstraint(days, intensity) {
  return {
    code: "EXISTING_ADDITIONAL_SPORT",
    scope: "TRAINING",
    value: {
      days,
      intensity,
    },
    reason: "Existing sport fixture.",
  };
}

const scheduledDays = (schedule) =>
  schedule.sessions.map(({ scheduled_day: scheduledDay }) => scheduledDay);

test("public API and a flexible two-day plan select Monday and Thursday", () => {
  assert.equal(
    WEEKLY_TRAINING_SCHEDULE_VERSION,
    "weekly-training-schedule-v1",
  );
  assert.deepEqual(Object.values(WeeklySportLoad), [
    "NONE",
    "LOW",
    "MODERATE",
    "HIGH",
  ]);
  assert.deepEqual(Object.values(ScheduleReasonCode), [
    "SESSION_SEQUENCE_REQUIRED",
    "SELECTED_FIXED_TRAINING_DAY",
    "SELECTED_AROUND_ADDITIONAL_SPORT",
    "HIGH_SPORT_DAY_REQUIRES_REVIEW",
  ]);

  const result = buildWeeklyTrainingSchedule(makeDraft());

  assert.equal(result.schedule_version, WEEKLY_TRAINING_SCHEDULE_VERSION);
  assert.deepEqual(scheduledDays(result), [DayOfWeek.MONDAY, DayOfWeek.THURSDAY]);
  assert.ok(
    result.sessions.every(({ sport_load: sportLoad }) => sportLoad === WeeklySportLoad.NONE),
  );
  assert.ok(
    result.sessions.every(
      ({ schedule_reason_code: reasonCode }) =>
        reasonCode === ScheduleReasonCode.SELECTED_FIXED_TRAINING_DAY,
    ),
  );
});

test("a flexible three-day plan selects Monday, Wednesday, and Friday", () => {
  const result = buildWeeklyTrainingSchedule(makeDraft({ sessionCount: 3 }));

  assert.deepEqual(scheduledDays(result), [
    DayOfWeek.MONDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.FRIDAY,
  ]);
});

test("a flexible four-day plan uses the approved weekly distribution", () => {
  const result = buildWeeklyTrainingSchedule(makeDraft({ sessionCount: 4 }));

  assert.deepEqual(scheduledDays(result), [
    DayOfWeek.MONDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.SATURDAY,
  ]);
});

test("flexible five-day and six-day plans use their approved distributions", () => {
  const fiveDayResult = buildWeeklyTrainingSchedule(makeDraft({ sessionCount: 5 }));
  assert.deepEqual(scheduledDays(fiveDayResult), [
    DayOfWeek.MONDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.FRIDAY,
    DayOfWeek.SATURDAY,
  ]);

  const sixDayResult = buildWeeklyTrainingSchedule(makeDraft({ sessionCount: 6 }));
  assert.deepEqual(scheduledDays(sixDayResult), [
    DayOfWeek.MONDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.FRIDAY,
    DayOfWeek.SATURDAY,
  ]);
});

test("fixed available-day constraints use only the reported days", () => {
  const constraints = [
    dayConstraint("TRAINING_AVAILABLE_DAY", DayOfWeek.SATURDAY),
    dayConstraint("TRAINING_AVAILABLE_DAY", DayOfWeek.TUESDAY),
    dayConstraint("TRAINING_AVAILABLE_DAY", DayOfWeek.THURSDAY),
  ];

  const result = buildWeeklyTrainingSchedule(
    makeDraft({ sessionCount: 3, constraints }),
  );

  assert.deepEqual(scheduledDays(result), [
    DayOfWeek.TUESDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.SATURDAY,
  ]);

  const reversedSessions = makeSessions(3).reverse();
  const reversedResult = buildWeeklyTrainingSchedule(
    makeDraft({ sessionCount: 3, sessions: reversedSessions, constraints }),
  );
  assert.deepEqual(
    reversedResult.sessions.map(({ sequence }) => sequence),
    [3, 2, 1],
  );
  assert.deepEqual(scheduledDays(reversedResult), [
    DayOfWeek.SATURDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.TUESDAY,
  ]);
});

test("fixed unavailable-day constraints are excluded from selection", () => {
  const constraints = [
    dayConstraint("TRAINING_UNAVAILABLE_DAY", DayOfWeek.MONDAY),
    dayConstraint("TRAINING_UNAVAILABLE_DAY", DayOfWeek.THURSDAY),
  ];

  const result = buildWeeklyTrainingSchedule(makeDraft({ constraints }));

  assert.deepEqual(scheduledDays(result), [DayOfWeek.TUESDAY, DayOfWeek.FRIDAY]);
});

test("duplicate or unknown constrained days throw TypeError", () => {
  const invalidConstraintSets = [
    [
      dayConstraint("TRAINING_AVAILABLE_DAY", DayOfWeek.MONDAY),
      dayConstraint("TRAINING_AVAILABLE_DAY", DayOfWeek.MONDAY),
    ],
    [
      dayConstraint("TRAINING_UNAVAILABLE_DAY", DayOfWeek.TUESDAY),
      dayConstraint("TRAINING_UNAVAILABLE_DAY", DayOfWeek.TUESDAY),
    ],
    [dayConstraint("TRAINING_AVAILABLE_DAY", "FUNDAY")],
    [dayConstraint("TRAINING_UNAVAILABLE_DAY", "FUNDAY")],
    [sportConstraint(["FUNDAY"], SportIntensity.LOW)],
  ];

  for (const constraints of invalidConstraintSets) {
    assert.throws(
      () => buildWeeklyTrainingSchedule(makeDraft({ constraints })),
      TypeError,
    );
  }
});

test("available and unavailable day constraints cannot be combined", () => {
  const constraints = [
    dayConstraint("TRAINING_AVAILABLE_DAY", DayOfWeek.MONDAY),
    dayConstraint("TRAINING_AVAILABLE_DAY", DayOfWeek.THURSDAY),
    dayConstraint("TRAINING_UNAVAILABLE_DAY", DayOfWeek.SUNDAY),
  ];

  assert.throws(
    () => buildWeeklyTrainingSchedule(makeDraft({ constraints })),
    TypeError,
  );
});

test("session-sequence mode leaves every scheduled day null", () => {
  const result = buildWeeklyTrainingSchedule(
    makeDraft({
      status: TrainingPlanStatus.PROVISIONAL_REVIEW_REQUIRED,
      scheduleMode: ScheduleMode.SESSION_SEQUENCE,
    }),
  );

  assert.equal(result.status, TrainingPlanStatus.PROVISIONAL_REVIEW_REQUIRED);
  for (const session of result.sessions) {
    assert.equal(session.scheduled_day, null);
    assert.equal(session.sport_load, WeeklySportLoad.NONE);
    assert.equal(
      session.schedule_reason_code,
      ScheduleReasonCode.SESSION_SEQUENCE_REQUIRED,
    );
  }
});

test("session-sequence mode preserves the original session array order", () => {
  const sessions = makeSessions(2).reverse();
  const input = makeDraft({
    sessions,
    scheduleMode: ScheduleMode.SESSION_SEQUENCE,
  });

  const result = buildWeeklyTrainingSchedule(input);

  assert.deepEqual(
    result.sessions.map(({ sequence }) => sequence),
    [2, 1],
  );
  assert.deepEqual(
    result.sessions.map(({ session_code: sessionCode }) => sessionCode),
    sessions.map(({ session_code: sessionCode }) => sessionCode),
  );
});

test("candidate days are prioritized by NONE, LOW, MODERATE, then HIGH sport load", () => {
  const constraints = [
    ...[
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
    ].map((day) => dayConstraint("TRAINING_AVAILABLE_DAY", day)),
    sportConstraint([DayOfWeek.MONDAY], SportIntensity.HIGH),
    sportConstraint([DayOfWeek.TUESDAY], SportIntensity.LOW),
    sportConstraint([DayOfWeek.THURSDAY], SportIntensity.MODERATE),
  ];

  const result = buildWeeklyTrainingSchedule(
    makeDraft({ sessionCount: 3, constraints }),
  );

  assert.deepEqual(scheduledDays(result), [
    DayOfWeek.TUESDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.THURSDAY,
  ]);
  assert.deepEqual(
    result.sessions.map(({ sport_load: sportLoad }) => sportLoad),
    [WeeklySportLoad.LOW, WeeklySportLoad.NONE, WeeklySportLoad.MODERATE],
  );
});

test("the highest additional-sport intensity wins when sports share a day", () => {
  const constraints = [
    dayConstraint("TRAINING_AVAILABLE_DAY", DayOfWeek.MONDAY),
    dayConstraint("TRAINING_AVAILABLE_DAY", DayOfWeek.THURSDAY),
    sportConstraint([DayOfWeek.MONDAY], SportIntensity.LOW),
    sportConstraint([DayOfWeek.MONDAY], SportIntensity.HIGH),
  ];

  const result = buildWeeklyTrainingSchedule(makeDraft({ constraints }));

  assert.equal(result.sessions[0].sport_load, WeeklySportLoad.HIGH);
  assert.equal(
    result.sessions[0].schedule_reason_code,
    ScheduleReasonCode.HIGH_SPORT_DAY_REQUIRES_REVIEW,
  );
});

test("a high-intensity sport day is avoided when lower-load alternatives exist", () => {
  const constraints = [sportConstraint([DayOfWeek.MONDAY], SportIntensity.HIGH)];

  const result = buildWeeklyTrainingSchedule(makeDraft({ constraints }));

  assert.deepEqual(scheduledDays(result), [DayOfWeek.TUESDAY, DayOfWeek.THURSDAY]);
  assert.equal(result.schedule_review_required, false);
  assert.equal(result.status, TrainingPlanStatus.READY);
  assert.deepEqual(result.schedule_reasons, []);
});

test("unavoidable high-intensity sport days require one review reason", () => {
  const constraints = [
    dayConstraint("TRAINING_AVAILABLE_DAY", DayOfWeek.MONDAY),
    dayConstraint("TRAINING_AVAILABLE_DAY", DayOfWeek.THURSDAY),
    sportConstraint(
      [DayOfWeek.MONDAY, DayOfWeek.THURSDAY],
      SportIntensity.HIGH,
    ),
  ];

  const readyResult = buildWeeklyTrainingSchedule(makeDraft({ constraints }));
  assert.equal(readyResult.schedule_review_required, true);
  assert.equal(
    readyResult.status,
    TrainingPlanStatus.PROVISIONAL_REVIEW_REQUIRED,
  );
  assert.deepEqual(readyResult.schedule_reasons, [
    {
      code: ScheduleReasonCode.HIGH_SPORT_DAY_REQUIRES_REVIEW,
      message:
        "A training session overlaps a reported high-intensity sport day and requires coach review.",
    },
  ]);
  assert.ok(
    readyResult.sessions.every(
      ({ schedule_reason_code: reasonCode }) =>
        reasonCode === ScheduleReasonCode.HIGH_SPORT_DAY_REQUIRES_REVIEW,
    ),
  );

  const provisionalResult = buildWeeklyTrainingSchedule(
    makeDraft({
      status: TrainingPlanStatus.PROVISIONAL_REVIEW_REQUIRED,
      constraints,
    }),
  );
  assert.equal(
    provisionalResult.status,
    TrainingPlanStatus.PROVISIONAL_REVIEW_REQUIRED,
  );
  assert.equal(provisionalResult.schedule_reasons.length, 1);
});

test("low and moderate sport loads do not change plan status", () => {
  const constraints = [
    dayConstraint("TRAINING_AVAILABLE_DAY", DayOfWeek.MONDAY),
    dayConstraint("TRAINING_AVAILABLE_DAY", DayOfWeek.THURSDAY),
    sportConstraint([DayOfWeek.MONDAY], SportIntensity.LOW),
    sportConstraint([DayOfWeek.THURSDAY], SportIntensity.MODERATE),
  ];

  const result = buildWeeklyTrainingSchedule(makeDraft({ constraints }));

  assert.equal(result.status, TrainingPlanStatus.READY);
  assert.equal(result.schedule_review_required, false);
  assert.deepEqual(
    result.sessions.map(({ schedule_reason_code: reasonCode }) => reasonCode),
    [
      ScheduleReasonCode.SELECTED_AROUND_ADDITIONAL_SPORT,
      ScheduleReasonCode.SELECTED_AROUND_ADDITIONAL_SPORT,
    ],
  );
});

test("withheld and empty-session drafts require no day constraints", () => {
  const invalidDayConstraint = dayConstraint("TRAINING_AVAILABLE_DAY", "FUNDAY");
  const withheld = buildWeeklyTrainingSchedule(
    makeDraft({
      status: TrainingPlanStatus.WITHHELD,
      constraints: [invalidDayConstraint],
    }),
  );
  assert.equal(withheld.status, TrainingPlanStatus.WITHHELD);
  assert.deepEqual(withheld.sessions, []);
  assert.equal(withheld.schedule_review_required, false);
  assert.deepEqual(withheld.schedule_reasons, []);

  const empty = buildWeeklyTrainingSchedule(
    makeDraft({
      sessionCount: 0,
      sessions: [],
      recommendedDays: 0,
      status: TrainingPlanStatus.PROVISIONAL_REVIEW_REQUIRED,
      constraints: [invalidDayConstraint],
    }),
  );
  assert.deepEqual(empty.sessions, []);
  assert.equal(empty.schedule_review_required, false);
  assert.deepEqual(empty.schedule_reasons, []);
});

test("draft fields, exercises, and prescriptions pass through unchanged", () => {
  const input = makeDraft();
  const result = buildWeeklyTrainingSchedule(input);

  for (const field of [
    "draft_version",
    "prescription_version",
    "recommended_days",
    "split_code",
    "schedule_mode",
    "intro_week_required",
    "volume_start",
  ]) {
    assert.equal(result[field], input[field]);
  }
  assert.strictEqual(result.pipeline_versions, input.pipeline_versions);
  assert.strictEqual(result.constraints, input.constraints);
  assert.strictEqual(result.reasons, input.reasons);
  for (const [index, inputSession] of input.sessions.entries()) {
    const resultSession = result.sessions[index];
    assert.equal(resultSession.sequence, inputSession.sequence);
    assert.equal(resultSession.session_code, inputSession.session_code);
    assert.equal(resultSession.focus, inputSession.focus);
    assert.strictEqual(resultSession.exercises, inputSession.exercises);
    assert.strictEqual(
      resultSession.exercises[0].prescription,
      inputSession.exercises[0].prescription,
    );
  }
});

test("building a weekly schedule does not modify the Training Draft input", () => {
  const input = makeDraft({
    constraints: [sportConstraint([DayOfWeek.MONDAY], SportIntensity.LOW)],
  });
  const snapshot = structuredClone(input);

  buildWeeklyTrainingSchedule(input);

  assert.deepEqual(input, snapshot);
});

test("basic contract violations throw TypeError", () => {
  const invalidInputs = [null, undefined, [], "draft", 123];
  for (const input of invalidInputs) {
    assert.throws(() => buildWeeklyTrainingSchedule(input), TypeError);
  }
  assert.throws(
    () => buildWeeklyTrainingSchedule({ sessions: {} }),
    TypeError,
  );
  assert.throws(
    () => buildWeeklyTrainingSchedule(makeDraft({ scheduleMode: "MONTHLY" })),
    TypeError,
  );

  const duplicateSequence = makeSessions(2);
  duplicateSequence[1].sequence = 1;
  const skippedSequence = makeSessions(2);
  skippedSequence[1].sequence = 3;
  const fractionalSequence = makeSessions(2);
  fractionalSequence[1].sequence = 1.5;
  for (const sessions of [duplicateSequence, skippedSequence, fractionalSequence]) {
    assert.throws(
      () => buildWeeklyTrainingSchedule(makeDraft({ sessions })),
      TypeError,
    );
  }

  assert.throws(
    () => buildWeeklyTrainingSchedule(makeDraft({ sessionCount: 1 })),
    TypeError,
  );
  assert.throws(
    () => buildWeeklyTrainingSchedule(makeDraft({ sessionCount: 7 })),
    TypeError,
  );
  assert.throws(
    () => buildWeeklyTrainingSchedule(makeDraft({ recommendedDays: 3 })),
    TypeError,
  );
  assert.throws(
    () =>
      buildWeeklyTrainingSchedule(
        makeDraft({
          constraints: [
            dayConstraint("TRAINING_AVAILABLE_DAY", DayOfWeek.MONDAY),
          ],
        }),
      ),
    TypeError,
  );
  assert.throws(
    () =>
      buildWeeklyTrainingSchedule(
        makeDraft({
          constraints: [sportConstraint([DayOfWeek.MONDAY], "EXTREME")],
        }),
      ),
    TypeError,
  );
  assert.throws(
    () =>
      buildWeeklyTrainingSchedule(
        makeDraft({
          constraints: [sportConstraint(null, SportIntensity.LOW)],
        }),
      ),
    TypeError,
  );
  assert.throws(
    () => buildWeeklyTrainingSchedule(makeDraft({ constraints: null })),
    TypeError,
  );
});

test("evaluateIntake to Training Draft to Weekly Schedule works end to end", () => {
  const intake = completeIntake({
    training: {
      trainingScheduleAvailabilityType:
        TrainingScheduleAvailabilityType.FIXED_AVAILABLE_DAYS,
      availableTrainingDays: [
        DayOfWeek.MONDAY,
        DayOfWeek.WEDNESDAY,
        DayOfWeek.FRIDAY,
      ],
      unavailableTrainingDays: [],
      maxDaysPerWeek: 4,
      preferredDaysPerWeek: 3,
    },
    cardio: {
      additionalSports: [
        {
          sportCode: SportCode.RUNNING,
          otherSportText: null,
          days: [DayOfWeek.WEDNESDAY],
          minutesPerSession: 30,
          intensity: SportIntensity.MODERATE,
          participationLevel: SportParticipationLevel.RECREATIONAL,
        },
      ],
    },
  });

  const intakeDecision = evaluateIntake(intake, ASSESSMENT_CONTEXT);
  const trainingDraft = buildTrainingDraft(intakeDecision);
  const schedule = buildWeeklyTrainingSchedule(trainingDraft);

  assert.equal(schedule.status, TrainingPlanStatus.READY);
  assert.deepEqual(scheduledDays(schedule), [
    DayOfWeek.MONDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.FRIDAY,
  ]);
  assert.equal(schedule.sessions[1].sport_load, WeeklySportLoad.MODERATE);
  assert.equal(
    schedule.sessions[1].schedule_reason_code,
    ScheduleReasonCode.SELECTED_AROUND_ADDITIONAL_SPORT,
  );
  assert.ok(schedule.sessions.every(({ exercises }) => exercises.length > 0));
});

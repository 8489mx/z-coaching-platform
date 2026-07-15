import assert from "node:assert/strict";
import test from "node:test";

import {
  CardioIntensity,
  CardioStrategy,
  Confidence,
  DayOfWeek,
  MeasurementQuality,
  PlanStatus,
  PrimaryGoal,
  RecentTraining,
  ScheduleMode,
  ScreeningAnswer,
  SportCode,
  SportIntensity,
  SportParticipationLevel,
  TrainingScheduleAvailabilityType,
  TrainingExperience,
  WalkingAbility,
  WeightTrend,
  WorkScheduleType,
  calculateAgeYears,
  decideCardioStrategy,
  decideIntroWeek,
  decideRecommendedTrainingDays,
  decideScheduleMode,
  determineCalorieConfidence,
  evaluateAgeSafety,
  evaluateDangerousSymptoms,
  evaluateFoodConstraints,
  isHighAdditionalSportLoad,
  isHighCardioSportLoad,
  summarizeAdditionalSportDays,
} from "../src/intake-decision-engine/index.js";
import { ASSESSMENT_CONTEXT, completeIntake } from "./fixtures/complete-intake.js";

const SAFE_CARDIO_CONTEXT = Object.freeze({
  medicalGate: false,
  blockingGate: false,
  adultPathBlocked: false,
  pregnancyGate: false,
});

const decideCardio = (overrides, conservativeRecoveryStart = false) =>
  decideCardioStrategy(
    completeIntake(overrides),
    SAFE_CARDIO_CONTEXT,
    conservativeRecoveryStart,
  );

const additionalSport = (overrides = {}) => ({
  sportCode: SportCode.FOOTBALL,
  otherSportText: null,
  days: [DayOfWeek.MONDAY],
  minutesPerSession: 45,
  intensity: SportIntensity.MODERATE,
  participationLevel: SportParticipationLevel.RECREATIONAL,
  ...overrides,
});

test("age calculation handles exact birthday and leap-day birth deterministically", () => {
  assert.equal(calculateAgeYears("2008-07-14", "2026-07-14"), 18);
  assert.equal(calculateAgeYears("2008-07-15", "2026-07-14"), 17);
  assert.equal(calculateAgeYears("2008-02-29", "2026-02-28"), 17);
  assert.equal(calculateAgeYears("2008-02-29", "2026-03-01"), 18);
});

test("age safety rule can be tested without running the engine", () => {
  const result = evaluateAgeSafety(
    completeIntake({ personal: { dateOfBirth: "2010-07-15", guardianConsent: true } }),
    ASSESSMENT_CONTEXT,
  );
  assert.equal(result.statusCandidates[0].status, PlanStatus.COACH_REVIEW_REQUIRED);
  assert.equal(result.reviewFlags[0].sourcePath, "personal.dateOfBirth");
});

test("adult exactly 18 on assessmentDate does not enter minor path", () => {
  const result = evaluateAgeSafety(
    completeIntake({ personal: { dateOfBirth: "2008-07-14", guardianConsent: null } }),
    { assessmentDate: "2026-07-14" },
  );
  assert.equal(result.statusCandidates.length, 0);
});

test("client aged 17 years and 364 days enters minor path", () => {
  const result = evaluateAgeSafety(
    completeIntake({ personal: { dateOfBirth: "2008-07-15", guardianConsent: false } }),
    { assessmentDate: "2026-07-14" },
  );
  assert.equal(result.statusCandidates[0].status, PlanStatus.BLOCKED);
});

test("birthday on same day as assessmentDate after 18 years is 18", () => {
  const result = evaluateAgeSafety(
    completeIntake({ personal: { dateOfBirth: "2000-01-01", guardianConsent: null } }),
    { assessmentDate: "2018-01-01" },
  );
  assert.equal(result.statusCandidates.length, 0);
});

test("birthday hasn't passed in the assessment year so age is not increased early", () => {
  const result = evaluateAgeSafety(
    completeIntake({ personal: { dateOfBirth: "2008-08-01", guardianConsent: false } }),
    { assessmentDate: "2026-07-14" },
  );
  assert.equal(result.statusCandidates[0].status, PlanStatus.BLOCKED);
});

test("dangerous symptom rule never scans free text", () => {
  const input = completeIntake({ medical: { unclassifiedText: ["chest pain"] } });
  assert.deepEqual(evaluateDangerousSymptoms(input).statusCandidates, []);
  input.medical.dangerousSymptoms.chestPainOrPressure = ScreeningAnswer.YES;
  assert.equal(
    evaluateDangerousSymptoms(input).statusCandidates[0].status,
    PlanStatus.MEDICAL_REVIEW_REQUIRED,
  );
});

test("food constraint rule keeps allergy, dislike, and intolerance types separate", () => {
  const result = evaluateFoodConstraints(
    completeIntake({
      nutrition: {
        allergies: [{ substance: "MILK", medicallyConfirmed: true }],
        dislikedFoods: ["MILK"],
        intolerances: [
          { substance: "MILK", severity: "MILD", medicallyDiagnosed: false, notes: null },
        ],
      },
    }),
  );
  assert.equal(result.hardConstraints[0].code, "FOOD_ALLERGY_EXCLUSION");
  assert.ok(result.softPreferences.some((item) => item.code === "DISLIKED_FOOD_EXCLUSION"));
  assert.ok(result.softPreferences.some((item) => item.code === "REPORTED_INTOLERANCE"));
});

test("calorie confidence follows the explicit confidence lattice", () => {
  assert.equal(determineCalorieConfidence(completeIntake()), Confidence.HIGH);
  assert.equal(
    determineCalorieConfidence(
      completeIntake({ body: { weightTrend: WeightTrend.UNKNOWN, measurementQuality: MeasurementQuality.HIGH } }),
    ),
    Confidence.MEDIUM,
  );
  assert.equal(
    determineCalorieConfidence(
      completeIntake({ body: { weightTrend: WeightTrend.UNKNOWN, measurementQuality: MeasurementQuality.LOW } }),
    ),
    Confidence.LOW,
  );
});

test("training schedule mode is independent from work schedule", () => {
  const flexibleWithVariableWork = completeIntake({
    lifestyle: { workSchedule: { type: WorkScheduleType.VARIABLE } },
    training: {
      trainingScheduleAvailabilityType: TrainingScheduleAvailabilityType.FLEXIBLE,
    },
  });
  assert.equal(
    decideScheduleMode(flexibleWithVariableWork).scheduleMode,
    ScheduleMode.FIXED_DAYS,
  );

  const variableWithFixedWork = completeIntake({
    lifestyle: { workSchedule: { type: WorkScheduleType.FIXED } },
    training: {
      trainingScheduleAvailabilityType: TrainingScheduleAvailabilityType.VARIABLE,
    },
  });
  assert.equal(
    decideScheduleMode(variableWithFixedWork).scheduleMode,
    ScheduleMode.SESSION_SEQUENCE,
  );
});

test("intro rule remains independently testable", () => {
  const input = completeIntake({
    training: { experience: TrainingExperience.UNKNOWN, recentTraining: RecentTraining.UNKNOWN },
  });
  assert.equal(decideIntroWeek(input).introWeekRequired, true);
});

test("flexible training uses the valid preference and fixed-day mode", () => {
  const input = completeIntake({
    training: {
      trainingScheduleAvailabilityType: TrainingScheduleAvailabilityType.FLEXIBLE,
      maxDaysPerWeek: 4,
      preferredDaysPerWeek: 3,
      availableTrainingDays: [],
      unavailableTrainingDays: [],
    },
  });
  assert.equal(decideScheduleMode(input).scheduleMode, ScheduleMode.FIXED_DAYS);
  assert.equal(
    decideRecommendedTrainingDays(input, ScheduleMode.FIXED_DAYS, false).recommendedDays,
    3,
  );
  assert.ok(
    decideScheduleMode(input).reasons.some(
      (item) => item.code === "FLEXIBLE_TRAINING_SCHEDULE",
    ),
  );
});

test("variable training requires a session sequence and a structured reason", () => {
  const input = completeIntake({
    training: {
      trainingScheduleAvailabilityType: TrainingScheduleAvailabilityType.VARIABLE,
      availableTrainingDays: [],
      unavailableTrainingDays: [],
    },
  });
  const result = decideScheduleMode(input);
  assert.equal(result.scheduleMode, ScheduleMode.SESSION_SEQUENCE);
  assert.ok(result.reasons.some((item) => item.code === "VARIABLE_TRAINING_SCHEDULE"));
});

test("fixed available training days cap the recommendation and explain the reduction", () => {
  const input = completeIntake({
    training: {
      trainingScheduleAvailabilityType: TrainingScheduleAvailabilityType.FIXED_AVAILABLE_DAYS,
      maxDaysPerWeek: 5,
      preferredDaysPerWeek: 4,
      availableTrainingDays: [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.FRIDAY],
      unavailableTrainingDays: [],
    },
  });
  const result = decideRecommendedTrainingDays(input, ScheduleMode.FIXED_DAYS, false);
  assert.equal(result.recommendedDays, 3);
  assert.ok(
    result.reasons.some((item) => item.code === "RECOMMENDED_TRAINING_DAYS_REDUCED"),
  );
});

test("fixed unavailable training days treat the other five weekdays as available", () => {
  const input = completeIntake({
    training: {
      trainingScheduleAvailabilityType: TrainingScheduleAvailabilityType.FIXED_UNAVAILABLE_DAYS,
      maxDaysPerWeek: 7,
      preferredDaysPerWeek: 6,
      availableTrainingDays: [],
      unavailableTrainingDays: [DayOfWeek.FRIDAY, DayOfWeek.SATURDAY],
    },
  });
  const result = decideRecommendedTrainingDays(input, ScheduleMode.FIXED_DAYS, false);
  assert.equal(result.recommendedDays, 5);
  assert.ok(
    result.reasons.some((item) => item.code === "RECOMMENDED_TRAINING_DAYS_REDUCED"),
  );
});

test("high sport load threshold is deterministic", () => {
  assert.equal(
    isHighAdditionalSportLoad([
      additionalSport({
        days: [DayOfWeek.MONDAY, DayOfWeek.THURSDAY],
        minutesPerSession: 45,
        intensity: SportIntensity.HIGH,
      }),
    ]),
    true,
  );
  assert.equal(
    isHighAdditionalSportLoad([
      additionalSport({
        sportCode: SportCode.RACKET_SPORTS,
        days: [DayOfWeek.SATURDAY],
        minutesPerSession: 60,
      }),
    ]),
    false,
  );
  assert.equal(
    isHighAdditionalSportLoad([
      additionalSport({
        sportCode: SportCode.CYCLING,
        days: [
          DayOfWeek.MONDAY,
          DayOfWeek.TUESDAY,
          DayOfWeek.WEDNESDAY,
          DayOfWeek.THURSDAY,
          DayOfWeek.FRIDAY,
        ],
        minutesPerSession: 90,
      }),
    ]),
    true,
  );
});

test("cardio sport-load classifier treats two high or three moderate days as high", () => {
  assert.equal(
    isHighCardioSportLoad([
      additionalSport({
        days: [DayOfWeek.MONDAY, DayOfWeek.THURSDAY],
        minutesPerSession: 30,
        intensity: SportIntensity.HIGH,
      }),
    ]),
    true,
  );
  assert.equal(
    isHighCardioSportLoad([
      additionalSport({
        sportCode: SportCode.RACKET_SPORTS,
        days: [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.SATURDAY],
        minutesPerSession: 30,
      }),
    ]),
    true,
  );
  assert.equal(
    isHighCardioSportLoad([
      additionalSport({
        sportCode: SportCode.RACKET_SPORTS,
        days: [DayOfWeek.MONDAY, DayOfWeek.SATURDAY],
        minutesPerSession: 30,
      }),
    ]),
    false,
  );
});

test("two high sports on the same day count as one high day while retaining two sessions", () => {
  const sports = [
    additionalSport({
      sportCode: SportCode.FOOTBALL,
      days: [DayOfWeek.MONDAY],
      minutesPerSession: 20,
      intensity: SportIntensity.HIGH,
    }),
    additionalSport({
      sportCode: SportCode.BOXING,
      days: [DayOfWeek.MONDAY],
      minutesPerSession: 20,
      intensity: SportIntensity.HIGH,
    }),
  ];

  assert.deepEqual(summarizeAdditionalSportDays(sports), {
    highDays: 1,
    moderateDays: 0,
  });
  assert.equal(isHighAdditionalSportLoad(sports), true);
  assert.equal(isHighCardioSportLoad(sports), true);
});

test("two high sports on different days count as two actual high days", () => {
  const sports = [
    additionalSport({
      sportCode: SportCode.FOOTBALL,
      days: [DayOfWeek.MONDAY],
      minutesPerSession: 20,
      intensity: SportIntensity.HIGH,
    }),
    additionalSport({
      sportCode: SportCode.BOXING,
      days: [DayOfWeek.THURSDAY],
      minutesPerSession: 20,
      intensity: SportIntensity.HIGH,
    }),
  ];

  assert.deepEqual(summarizeAdditionalSportDays(sports), {
    highDays: 2,
    moderateDays: 0,
  });
  assert.equal(isHighAdditionalSportLoad(sports), true);
  assert.equal(isHighCardioSportLoad(sports), true);
});

test("high intensity dominates moderate intensity on an overlapping sport day", () => {
  const sports = [
    additionalSport({
      sportCode: SportCode.FOOTBALL,
      days: [DayOfWeek.MONDAY],
      minutesPerSession: 10,
      intensity: SportIntensity.HIGH,
    }),
    additionalSport({
      sportCode: SportCode.CYCLING,
      days: [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY],
      minutesPerSession: 10,
      intensity: SportIntensity.MODERATE,
    }),
  ];

  assert.deepEqual(summarizeAdditionalSportDays(sports), {
    highDays: 1,
    moderateDays: 2,
  });
  assert.equal(isHighCardioSportLoad(sports), false);
});

test("no additional sports preserve the existing low-load classification", () => {
  assert.equal(isHighAdditionalSportLoad([]), false);
  assert.equal(isHighCardioSportLoad([]), false);
});

test("12000 steps and a fat-loss goal do not create additional cardio", () => {
  const result = decideCardio({
    goals: { primary: PrimaryGoal.FAT_LOSS },
    cardio: { averageDailySteps: 12000, additionalSports: [] },
  });
  assert.equal(result.decision.strategy, CardioStrategy.NO_ADDITIONAL_CARDIO);
  assert.equal(result.decision.max_sessions, 0);
  assert.equal(result.decision.max_duration_minutes, 0);
});

test("9000 steps and a muscle-gain goal do not create additional cardio", () => {
  const result = decideCardio({
    goals: { primary: PrimaryGoal.MUSCLE_GAIN },
    cardio: { averageDailySteps: 9000, additionalSports: [] },
  });
  assert.equal(result.decision.strategy, CardioStrategy.NO_ADDITIONAL_CARDIO);
  assert.equal(result.decision.max_sessions, 0);
  assert.equal(result.decision.max_duration_minutes, 0);
});

test("3500 steps with easy walking select a steps-first strategy", () => {
  const result = decideCardio({
    cardio: {
      averageDailySteps: 3500,
      walkingAbility: WalkingAbility.EASY,
      additionalSports: [],
    },
  });
  assert.equal(result.decision.strategy, CardioStrategy.STEPS_ONLY);
  assert.equal(result.decision.max_sessions, 0);
  assert.equal(result.decision.max_duration_minutes, 0);
  assert.ok(
    result.decision.reasons.some((item) => item.code === "STEPS_ONLY_LOW_DAILY_MOVEMENT"),
  );
});

test("unknown steps never create formal sessions and remain missing data", () => {
  const result = decideCardio({
    cardio: {
      averageDailySteps: null,
      walkingAbility: WalkingAbility.EASY,
      additionalSports: [],
    },
  });
  assert.notEqual(result.decision.strategy, CardioStrategy.CARDIO_SESSIONS);
  assert.ok(
    result.result.missingOrUncertainData.some(
      (item) => item.code === "AVERAGE_DAILY_STEPS_UNKNOWN",
    ),
  );
  assert.ok(result.decision.reasons.length > 0);
});

test("two high-intensity sport days cover the additional cardio load", () => {
  const result = decideCardio({
    cardio: {
      averageDailySteps: 8000,
      additionalSports: [
        additionalSport({
          days: [DayOfWeek.MONDAY, DayOfWeek.THURSDAY],
          minutesPerSession: 45,
          intensity: SportIntensity.HIGH,
        }),
      ],
    },
  });
  assert.equal(result.decision.strategy, CardioStrategy.NO_ADDITIONAL_CARDIO);
  assert.equal(result.decision.max_sessions, 0);
  assert.equal(result.decision.max_duration_minutes, 0);
  assert.ok(
    result.decision.reasons.some(
      (item) => item.code === "NO_CARDIO_HIGH_ADDITIONAL_SPORT_LOAD",
    ),
  );
});

test("three moderate sport days allow only no-cardio or low-step steps-only routing", () => {
  const sport = additionalSport({
    sportCode: SportCode.RACKET_SPORTS,
    days: [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.SATURDAY],
    minutesPerSession: 45,
    intensity: SportIntensity.MODERATE,
  });
  const adequateSteps = decideCardio({
    cardio: { averageDailySteps: 8000, additionalSports: [sport] },
  });
  const lowSteps = decideCardio({
    cardio: { averageDailySteps: 3500, additionalSports: [sport] },
  });
  assert.equal(adequateSteps.decision.strategy, CardioStrategy.NO_ADDITIONAL_CARDIO);
  assert.equal(lowSteps.decision.strategy, CardioStrategy.STEPS_ONLY);
  assert.notEqual(lowSteps.decision.strategy, CardioStrategy.CARDIO_SESSIONS);
  assert.ok(
    lowSteps.decision.reasons.some(
      (item) => item.code === "STEPS_ONLY_LOW_STEPS_WITH_HIGH_SPORT_LOAD",
    ),
  );
});

test("a performance goal at 6000 steps can justify sessions within capacity", () => {
  const result = decideCardio({
    goals: { primary: PrimaryGoal.PERFORMANCE, secondaryTraining: "ENDURANCE" },
    cardio: {
      averageDailySteps: 6000,
      walkingAbility: WalkingAbility.EASY,
      additionalSports: [],
      maxSessionsPerWeek: 2,
      maxDurationMinutes: 30,
    },
  });
  assert.equal(result.decision.strategy, CardioStrategy.CARDIO_SESSIONS);
  assert.equal(result.decision.max_sessions, 2);
  assert.equal(result.decision.max_duration_minutes, 30);
  assert.equal(result.decision.intensity_start, CardioIntensity.MODERATE);
  assert.ok(
    result.decision.reasons.some(
      (item) => item.code === "CARDIO_SESSIONS_ENDURANCE_GOAL",
    ),
  );
});

test("formal cardio starts low for a beginner, recovery risk, or existing moderate sport", () => {
  const baseOverrides = {
    goals: { primary: PrimaryGoal.PERFORMANCE, secondaryTraining: "ENDURANCE" },
    cardio: {
      averageDailySteps: 6000,
      walkingAbility: WalkingAbility.EASY,
      additionalSports: [],
      maxSessionsPerWeek: 2,
      maxDurationMinutes: 30,
    },
  };
  const beginner = decideCardio({
    ...baseOverrides,
    training: { experience: TrainingExperience.BEGINNER },
  });
  const recoveryRisk = decideCardio(baseOverrides, true);
  const moderateSport = decideCardio({
    ...baseOverrides,
    cardio: {
      ...baseOverrides.cardio,
      additionalSports: [
        additionalSport({
          sportCode: SportCode.RACKET_SPORTS,
          days: [DayOfWeek.SATURDAY],
          minutesPerSession: 45,
          intensity: SportIntensity.MODERATE,
        }),
      ],
    },
  });
  for (const result of [beginner, recoveryRisk, moderateSport]) {
    assert.equal(result.decision.strategy, CardioStrategy.CARDIO_SESSIONS);
    assert.equal(result.decision.intensity_start, CardioIntensity.LOW);
  }
});

test("a fat-loss goal at 6000 steps does not by itself justify sessions", () => {
  const result = decideCardio({
    goals: { primary: PrimaryGoal.FAT_LOSS },
    cardio: {
      averageDailySteps: 6000,
      walkingAbility: WalkingAbility.EASY,
      additionalSports: [],
    },
  });
  assert.notEqual(result.decision.strategy, CardioStrategy.CARDIO_SESSIONS);
  assert.equal(result.decision.max_sessions, 0);
  assert.equal(result.decision.max_duration_minutes, 0);
});

test("zero session or duration capacity prevents formal cardio", () => {
  for (const cardio of [
    { maxSessionsPerWeek: 0, maxDurationMinutes: 30 },
    { maxSessionsPerWeek: 2, maxDurationMinutes: 0 },
  ]) {
    const result = decideCardio({
      goals: { primary: PrimaryGoal.PERFORMANCE, secondaryTraining: "ENDURANCE" },
      cardio: {
        averageDailySteps: 6000,
        walkingAbility: WalkingAbility.EASY,
        additionalSports: [],
        ...cardio,
      },
    });
    assert.notEqual(result.decision.strategy, CardioStrategy.CARDIO_SESSIONS);
    assert.equal(result.decision.max_sessions, 0);
    assert.equal(result.decision.max_duration_minutes, 0);
  }
});

test("limited walking routes cardio to review with zero capacity and a reason", () => {
  const result = decideCardio({ cardio: { walkingAbility: WalkingAbility.LIMITED } });
  assert.equal(result.decision.strategy, CardioStrategy.REVIEW_REQUIRED);
  assert.equal(result.decision.max_sessions, 0);
  assert.equal(result.decision.max_duration_minutes, 0);
  assert.ok(result.decision.reasons.length > 0);
  assert.ok(
    result.decision.reasons.some(
      (item) => item.code === "CARDIO_REVIEW_WALKING_LIMITATION",
    ),
  );
  assert.ok(
    result.result.reviewFlags.some(
      (item) => item.code === "WALKING_TEN_MINUTES_NOT_CONFIRMED",
    ),
  );
});

test("formal cardio decisions always return positive bounded capacity", () => {
  const capacity = { maxSessionsPerWeek: 3, maxDurationMinutes: 40 };
  const result = decideCardio({
    goals: { primary: PrimaryGoal.PERFORMANCE, secondaryTraining: "ENDURANCE" },
    cardio: {
      averageDailySteps: 6000,
      walkingAbility: WalkingAbility.EASY,
      additionalSports: [],
      ...capacity,
    },
  });
  assert.equal(result.decision.strategy, CardioStrategy.CARDIO_SESSIONS);
  assert.ok(result.decision.max_sessions > 0);
  assert.ok(result.decision.max_duration_minutes > 0);
  assert.ok(result.decision.max_sessions <= capacity.maxSessionsPerWeek);
  assert.ok(result.decision.max_duration_minutes <= capacity.maxDurationMinutes);
});

test("no-additional-cardio and steps-only decisions always zero both caps", () => {
  const decisions = [
    decideCardio({ cardio: { averageDailySteps: 12000, additionalSports: [] } }).decision,
    decideCardio({ cardio: { averageDailySteps: 3500, additionalSports: [] } }).decision,
  ];
  assert.deepEqual(
    decisions.map(({ strategy, max_sessions, max_duration_minutes }) => ({
      strategy,
      max_sessions,
      max_duration_minutes,
    })),
    [
      {
        strategy: CardioStrategy.NO_ADDITIONAL_CARDIO,
        max_sessions: 0,
        max_duration_minutes: 0,
      },
      {
        strategy: CardioStrategy.STEPS_ONLY,
        max_sessions: 0,
        max_duration_minutes: 0,
      },
    ],
  );
});

test("every cardio decision branch includes at least one structured reason", () => {
  const scenarios = [
    { cardio: { averageDailySteps: 12000, additionalSports: [] } },
    { cardio: { averageDailySteps: 3500, additionalSports: [] } },
    {
      goals: { primary: PrimaryGoal.PERFORMANCE, secondaryTraining: "ENDURANCE" },
      cardio: { averageDailySteps: 6000, additionalSports: [] },
    },
    { cardio: { walkingAbility: WalkingAbility.LIMITED } },
  ];
  for (const overrides of scenarios) {
    const result = decideCardio(overrides);
    assert.ok(result.decision.reasons.length >= 1);
    assert.ok(result.decision.reasons.every((item) => typeof item.code === "string"));
  }
});

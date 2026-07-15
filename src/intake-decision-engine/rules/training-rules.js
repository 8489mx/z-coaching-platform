import {
  ActivityLevel,
  DayOfWeek,
  Movement,
  PlanStatus,
  RecentTraining,
  RestrictionInstruction,
  ReviewLevel,
  ScheduleMode,
  Scope,
  SleepQuality,
  SportIntensity,
  StressLevel,
  TrainingScheduleAvailabilityType,
  TrainingExperience,
  VolumeStart,
} from "../domain/enums.js";
import {
  constraint,
  emptyRuleResult,
  reason,
  reviewFlag,
  statusCandidate,
} from "../domain/rule-result.js";

const WEEKDAY_COUNT = Object.values(DayOfWeek).length;

export const TrainingPolicy = Object.freeze({
  LOW_SLEEP_HOURS_THRESHOLD: 6,
  PHYSICALLY_DEMANDING_DAYS_THRESHOLD: 1,
  HIGH_SPORT_MIN_SESSIONS: 2,
  HIGH_SPORT_MIN_WEEKLY_MINUTES: 90,
  HIGH_SPORT_WEIGHTED_WEEKLY_MINUTES: 180,
});

export function isHighAdditionalSportLoad(additionalSports) {
  const highIntensitySessions = additionalSports
    .filter((sport) => sport.intensity === SportIntensity.HIGH)
    .reduce((total, sport) => total + sport.daysPerWeek, 0);
  const highIntensityMinutes = additionalSports
    .filter((sport) => sport.intensity === SportIntensity.HIGH)
    .reduce((total, sport) => total + sport.daysPerWeek * sport.minutesPerSession, 0);
  const weightedWeeklyMinutes = additionalSports.reduce((total, sport) => {
    const intensityWeight =
      sport.intensity === SportIntensity.HIGH
        ? 1
        : sport.intensity === SportIntensity.MODERATE
          ? 0.5
          : 0.25;
    return total + sport.daysPerWeek * sport.minutesPerSession * intensityWeight;
  }, 0);
  return (
    highIntensitySessions >= TrainingPolicy.HIGH_SPORT_MIN_SESSIONS ||
    highIntensityMinutes >= TrainingPolicy.HIGH_SPORT_MIN_WEEKLY_MINUTES ||
    weightedWeeklyMinutes >= TrainingPolicy.HIGH_SPORT_WEIGHTED_WEEKLY_MINUTES
  );
}

export function decideScheduleMode(input) {
  const availabilityType = input.training.trainingScheduleAvailabilityType;
  const variable = availabilityType === TrainingScheduleAvailabilityType.VARIABLE;

  if (variable) {
    return {
      scheduleMode: ScheduleMode.SESSION_SEQUENCE,
      reasons: [
        reason(
          "VARIABLE_TRAINING_SCHEDULE",
          Scope.TRAINING,
          "Client has a variable training schedule; session sequence is required.",
        ),
      ],
    };
  }

  if (availabilityType === TrainingScheduleAvailabilityType.FLEXIBLE) {
    return {
      scheduleMode: ScheduleMode.FIXED_DAYS,
      reasons: [
        reason(
          "FLEXIBLE_TRAINING_SCHEDULE",
          Scope.TRAINING,
          "Client is flexible; the system may select the best weekly distribution.",
        ),
      ],
    };
  }

  const fixedAvailable =
    availabilityType === TrainingScheduleAvailabilityType.FIXED_AVAILABLE_DAYS;
  return {
    scheduleMode: ScheduleMode.FIXED_DAYS,
    reasons: [
      reason(
        fixedAvailable
          ? "FIXED_AVAILABLE_TRAINING_DAYS"
          : "FIXED_UNAVAILABLE_TRAINING_DAYS",
        Scope.TRAINING,
        fixedAvailable
          ? "Training is placed only on the client's fixed available weekdays."
          : "Training is placed only on weekdays not marked unavailable by the client.",
      ),
    ],
  };
}

export function decideIntroWeek(input) {
  const newClient = input.training.experience === TrainingExperience.NEVER_TRAINED;
  const returning = [
    RecentTraining.NONE_LAST_4_WEEKS,
    RecentTraining.RETURNING_AFTER_LONG_BREAK,
  ].includes(input.training.recentTraining);
  const uncertain =
    input.training.experience === TrainingExperience.UNKNOWN ||
    input.training.recentTraining === RecentTraining.UNKNOWN;
  const required = newClient || returning || uncertain;
  const reasons = [];
  if (newClient) {
    reasons.push(
      reason("INTRO_WEEK_NEW_CLIENT", Scope.TRAINING, "A never-trained client starts with calibration."),
    );
  }
  if (returning) {
    reasons.push(
      reason(
        "INTRO_WEEK_RETURNING_AFTER_BREAK",
        Scope.TRAINING,
        "Recent training history indicates a return after insufficient or prolonged absence.",
      ),
    );
  }
  if (uncertain) {
    reasons.push(
      reason(
        "INTRO_WEEK_UNCERTAIN_TRAINING_DATA",
        Scope.TRAINING,
        "Uncertain experience or recent-training data requires calibration.",
      ),
    );
  }
  if (!required) {
    reasons.push(
      reason(
        "INTRO_WEEK_NOT_REQUIRED",
        Scope.TRAINING,
        "Experience and recent training are sufficiently clear for a normal start.",
      ),
    );
  }
  return { introWeekRequired: required, reasons };
}

export function evaluateRecoveryConservatism(input, introWeekRequired) {
  const triggers = [];
  if (
    input.lifestyle.sleep.averageHours < TrainingPolicy.LOW_SLEEP_HOURS_THRESHOLD ||
    input.lifestyle.sleep.quality === SleepQuality.POOR
  ) {
    triggers.push(
      reason(
        "CONSERVATIVE_LOW_SLEEP",
        Scope.TRAINING,
        "Sleep below the V1 threshold or reported as poor requires a conservative start.",
      ),
    );
  }
  if (input.lifestyle.sleep.quality === SleepQuality.UNKNOWN) {
    triggers.push(
      reason(
        "CONSERVATIVE_UNKNOWN_SLEEP",
        Scope.TRAINING,
        "Unknown sleep quality is treated conservatively rather than as normal recovery.",
      ),
    );
  }
  if (input.lifestyle.stressLevel === StressLevel.HIGH) {
    triggers.push(
      reason("CONSERVATIVE_HIGH_STRESS", Scope.TRAINING, "High reported stress reduces the starting volume."),
    );
  }
  if (input.lifestyle.stressLevel === StressLevel.UNKNOWN) {
    triggers.push(
      reason(
        "CONSERVATIVE_UNKNOWN_STRESS",
        Scope.TRAINING,
        "Unknown stress is treated conservatively rather than as low stress.",
      ),
    );
  }
  if (isHighAdditionalSportLoad(input.cardio.additionalSports)) {
    triggers.push(
      reason(
        "CONSERVATIVE_HIGH_SPORT_LOAD",
        Scope.TRAINING,
        "Existing high-intensity sport load has priority over adding training volume.",
      ),
    );
  }
  if (
    input.lifestyle.workSchedule.physicallyDemandingDays.length >=
      TrainingPolicy.PHYSICALLY_DEMANDING_DAYS_THRESHOLD ||
    [ActivityLevel.HIGH, ActivityLevel.VERY_HIGH].includes(input.lifestyle.dailyActivity)
  ) {
    triggers.push(
      reason(
        "CONSERVATIVE_PHYSICAL_WORK",
        Scope.TRAINING,
        "Physically demanding work or high daily activity requires a conservative start.",
      ),
    );
  }
  if (input.lifestyle.dailyActivity === ActivityLevel.UNKNOWN) {
    triggers.push(
      reason(
        "CONSERVATIVE_UNKNOWN_DAILY_ACTIVITY",
        Scope.TRAINING,
        "Unknown daily activity is treated conservatively rather than as low workload.",
      ),
    );
  }
  if (introWeekRequired) {
    triggers.push(
      reason(
        "CONSERVATIVE_INTRO_WEEK",
        Scope.TRAINING,
        "An intro/calibration week always starts conservatively.",
      ),
    );
  }
  return {
    volumeStart: triggers.length > 0 ? VolumeStart.CONSERVATIVE : VolumeStart.NORMAL,
    reasons: triggers,
  };
}

function actualAvailableTrainingDayCount(training) {
  switch (training.trainingScheduleAvailabilityType) {
    case TrainingScheduleAvailabilityType.FIXED_AVAILABLE_DAYS:
      return training.availableTrainingDays.length;
    case TrainingScheduleAvailabilityType.FIXED_UNAVAILABLE_DAYS:
      return WEEKDAY_COUNT - training.unavailableTrainingDays.length;
    case TrainingScheduleAvailabilityType.VARIABLE:
    case TrainingScheduleAvailabilityType.FLEXIBLE:
      return WEEKDAY_COUNT;
    default:
      return 0;
  }
}

export function decideRecommendedTrainingDays(input, _scheduleMode, safetyGate) {
  if (safetyGate) {
    return {
      recommendedDays: 0,
      reasons: [
        reason(
          "TRAINING_WITHHELD_PENDING_SAFETY_REVIEW",
          Scope.TRAINING,
          "Training days are withheld until the higher-priority safety gate is cleared.",
        ),
      ],
    };
  }

  const actualAvailableDays = actualAvailableTrainingDayCount(input.training);
  const capacity = Math.min(input.training.maxDaysPerWeek, actualAvailableDays);
  const recommendedDays = Math.min(input.training.preferredDaysPerWeek, capacity);
  const reduced = recommendedDays < input.training.preferredDaysPerWeek;
  return {
    recommendedDays,
    reasons: [
      reason(
        reduced ? "RECOMMENDED_TRAINING_DAYS_REDUCED" : "PREFERRED_TRAINING_DAYS_APPLIED",
        Scope.TRAINING,
        reduced
          ? "Recommended days were reduced to match actual available days."
          : "The preferred day count fits all higher-priority constraints.",
      ),
    ],
  };
}

export function evaluateTrainingConstraints(input) {
  const result = emptyRuleResult();
  const constraints = [
    constraint(
      "TRAINING_MAX_DAYS",
      Scope.TRAINING,
      { daysPerWeek: input.training.maxDaysPerWeek },
      "A future program must never exceed the client's stated weekly capacity.",
    ),
    constraint(
      "TRAINING_MAX_SESSION_DURATION",
      Scope.TRAINING,
      { minutes: input.training.maxSessionMinutes },
      "A future session must fit the client's maximum duration.",
    ),
    constraint(
      "TRAINING_LOCATION",
      Scope.TRAINING,
      { location: input.training.location },
      "Exercise selection must be feasible at the reported location.",
    ),
  ];
  const availableTrainingDays =
    input.training.trainingScheduleAvailabilityType ===
    TrainingScheduleAvailabilityType.FIXED_AVAILABLE_DAYS
      ? input.training.availableTrainingDays
      : [];
  const unavailableTrainingDays =
    input.training.trainingScheduleAvailabilityType ===
    TrainingScheduleAvailabilityType.FIXED_UNAVAILABLE_DAYS
      ? input.training.unavailableTrainingDays
      : [];
  availableTrainingDays.forEach((day) => {
    constraints.push(
      constraint(
        "TRAINING_AVAILABLE_DAY",
        Scope.TRAINING,
        { day },
        "Fixed-day scheduling may use this reported available day.",
      ),
    );
  });
  unavailableTrainingDays.forEach((day) => {
    constraints.push(
      constraint(
        "TRAINING_UNAVAILABLE_DAY",
        Scope.TRAINING,
        { day },
        "No fixed session may be placed on this unavailable day.",
      ),
    );
  });
  input.training.equipment.forEach((equipment) => {
    constraints.push(
      constraint(
        "AVAILABLE_EQUIPMENT",
        Scope.TRAINING,
        { name: equipment.name, loadCapacity: equipment.loadCapacity },
        "Future exercises must respect both equipment type and load capacity.",
      ),
    );
  });
  result.hardConstraints.push(...constraints);
  result.softPreferences.push(
    constraint(
      "PREFERRED_TRAINING_DAYS",
      Scope.TRAINING,
      { daysPerWeek: input.training.preferredDaysPerWeek },
      "The preferred day count is used only after hard capacity and safety constraints.",
    ),
  );
  return { ...result, decisionConstraints: constraints };
}

export function decideTraining(input, safetyContext) {
  const result = evaluateTrainingConstraints(input);
  const schedule = decideScheduleMode(input);
  const intro = decideIntroWeek(input);
  const recovery = evaluateRecoveryConservatism(input, intro.introWeekRequired);
  const safetyGate =
    safetyContext.medicalGate ||
    safetyContext.blockingGate ||
    safetyContext.adultPathBlocked ||
    safetyContext.pregnancyGate;
  const globallyProhibitedMovements = [Movement.ALL_ACTIVITY, Movement.ALL_TRAINING];
  const trainingProhibited =
    input.training.medicalMovementRestrictions.some(
      (restriction) =>
        restriction.instruction === RestrictionInstruction.AVOID &&
        globallyProhibitedMovements.includes(restriction.movement),
    ) ||
    input.training.injuries.some(
      (injury) =>
        injury.affectedMovements.some((movement) => globallyProhibitedMovements.includes(movement)) ||
        injury.medicalRestrictions.some(
          (restriction) =>
            restriction.instruction === RestrictionInstruction.AVOID &&
            globallyProhibitedMovements.includes(restriction.movement),
        ),
    );
  const decisionGate = safetyGate || trainingProhibited;
  const days = decideRecommendedTrainingDays(input, schedule.scheduleMode, decisionGate);
  if (trainingProhibited && !safetyGate) {
    days.reasons = [
      reason(
        "TRAINING_WITHHELD_BY_MOVEMENT_RESTRICTION",
        Scope.TRAINING,
        "The classified restriction has priority over goals, equipment, and day preferences.",
      ),
    ];
  }

  if (safetyGate) {
    result.statusCandidates.push(statusCandidate(PlanStatus.COACH_REVIEW_REQUIRED, "TRAINING_SAFETY_GATE"));
  }
  if (trainingProhibited) {
    result.statusCandidates.push(
      statusCandidate(PlanStatus.COACH_REVIEW_REQUIRED, "TRAINING_MOVEMENT_RESTRICTION_REVIEW"),
    );
    result.reviewFlags.push(
      reviewFlag(
        "TRAINING_PROHIBITED_BY_MOVEMENT_RESTRICTION",
        Scope.TRAINING,
        ReviewLevel.COACH,
        "An all-training/all-activity restriction prevents automatic training days.",
        "training.medicalMovementRestrictions",
      ),
    );
  }
  if (input.training.experience === TrainingExperience.UNKNOWN) {
    result.missingOrUncertainData.push({
      code: "TRAINING_EXPERIENCE_UNKNOWN",
      path: "training.experience",
      message: "Unknown experience triggers an intro/calibration week.",
    });
  }
  if (input.training.recentTraining === RecentTraining.UNKNOWN) {
    result.missingOrUncertainData.push({
      code: "RECENT_TRAINING_UNKNOWN",
      path: "training.recentTraining",
      message: "Unknown recent-training history triggers an intro/calibration week.",
    });
  }
  if (input.lifestyle.sleep.quality === SleepQuality.UNKNOWN) {
    result.missingOrUncertainData.push({
      code: "SLEEP_QUALITY_UNKNOWN",
      path: "lifestyle.sleep.quality",
      message: "Unknown sleep quality forces a conservative start.",
    });
  }
  if (input.lifestyle.stressLevel === StressLevel.UNKNOWN) {
    result.missingOrUncertainData.push({
      code: "STRESS_LEVEL_UNKNOWN",
      path: "lifestyle.stressLevel",
      message: "Unknown stress forces a conservative start.",
    });
  }
  if (input.lifestyle.dailyActivity === ActivityLevel.UNKNOWN) {
    result.missingOrUncertainData.push({
      code: "DAILY_ACTIVITY_UNKNOWN",
      path: "lifestyle.dailyActivity",
      message: "Unknown daily activity forces a conservative start.",
    });
  }

  const decisionReasons = [...schedule.reasons, ...intro.reasons, ...recovery.reasons, ...days.reasons];
  result.reasons.push(...decisionReasons);
  return {
    result,
    decision: {
      recommended_days: days.recommendedDays,
      schedule_mode: schedule.scheduleMode,
      intro_week_required: intro.introWeekRequired,
      volume_start: decisionGate ? VolumeStart.CONSERVATIVE : recovery.volumeStart,
      constraints: result.decisionConstraints,
      reasons: decisionReasons,
    },
  };
}

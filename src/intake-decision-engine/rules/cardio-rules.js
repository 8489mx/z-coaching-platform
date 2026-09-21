import {
  ActivityLevel,
  CardioIntensity,
  CardioStrategy,
  Movement,
  PlanStatus,
  PrimaryGoal,
  RestrictionInstruction,
  ReviewLevel,
  Scope,
  SportIntensity,
  TrainingExperience,
  WalkingAbility,
} from "../domain/enums.js";
import {
  constraint,
  emptyRuleResult,
  reason,
  reviewFlag,
  statusCandidate,
} from "../domain/rule-result.js";
import { isHighAdditionalSportLoad } from "./training-rules.js";

export const CardioPolicy = Object.freeze({
  LOW_DAILY_STEPS_THRESHOLD: 5000,
  HIGH_DAILY_STEPS_THRESHOLD: 8000,
  HIGH_SPORT_DAYS_THRESHOLD: 2,
  MODERATE_SPORT_DAYS_THRESHOLD: 3,
});

const ENDURANCE_SECONDARY_GOALS = new Set(["ENDURANCE", "CARDIOVASCULAR_FITNESS"]);
const ADEQUATE_DAILY_ACTIVITY_LEVELS = new Set([
  ActivityLevel.MODERATE,
  ActivityLevel.HIGH,
  ActivityLevel.VERY_HIGH,
]);
const SPORT_INTENSITY_PRIORITY = Object.freeze({
  [SportIntensity.LOW]: 0,
  [SportIntensity.MODERATE]: 1,
  [SportIntensity.HIGH]: 2,
});

export function summarizeAdditionalSportDays(additionalSports) {
  const strongestIntensityByDay = new Map();
  additionalSports.forEach((sport) => {
    sport.days.forEach((day) => {
      const currentIntensity = strongestIntensityByDay.get(day);
      if (
        currentIntensity === undefined ||
        SPORT_INTENSITY_PRIORITY[sport.intensity] >
          SPORT_INTENSITY_PRIORITY[currentIntensity]
      ) {
        strongestIntensityByDay.set(day, sport.intensity);
      }
    });
  });

  const uniqueIntensities = [...strongestIntensityByDay.values()];
  return {
    highDays: uniqueIntensities.filter((intensity) => intensity === SportIntensity.HIGH)
      .length,
    moderateDays: uniqueIntensities.filter(
      (intensity) => intensity === SportIntensity.MODERATE,
    ).length,
  };
}

/**
 * Cardio-specific view of existing sport load. The shared training classifier
 * remains authoritative for its existing load thresholds; cardio additionally
 * treats two HIGH days or three MODERATE days as sufficient load.
 */
export function isHighCardioSportLoad(additionalSports) {
  const { highDays, moderateDays } = summarizeAdditionalSportDays(additionalSports);

  return (
    isHighAdditionalSportLoad(additionalSports) ||
    highDays >= CardioPolicy.HIGH_SPORT_DAYS_THRESHOLD ||
    moderateDays >= CardioPolicy.MODERATE_SPORT_DAYS_THRESHOLD
  );
}

function hasExplicitEnduranceGoal(input) {
  return (
    input.goals.primary === PrimaryGoal.PERFORMANCE ||
    ENDURANCE_SECONDARY_GOALS.has(input.goals.secondaryTraining)
  );
}

function hasModerateOrHighActiveSport(additionalSports) {
  return additionalSports.some(
    (sport) =>
      sport.days.length > 0 &&
      [SportIntensity.MODERATE, SportIntensity.HIGH].includes(sport.intensity),
  );
}

export function evaluateCardioConstraints(input) {
  const result = emptyRuleResult();
  const constraints = [
    constraint(
      "CARDIO_MAX_SESSIONS",
      Scope.CARDIO,
      { sessionsPerWeek: input.cardio.maxSessionsPerWeek },
      "Formal cardio must never exceed the client's stated session capacity.",
    ),
    constraint(
      "CARDIO_MAX_DURATION",
      Scope.CARDIO,
      { minutesPerSession: input.cardio.maxDurationMinutes },
      "Formal cardio must never exceed the client's stated duration capacity.",
    ),
  ];
  input.cardio.additionalSports.forEach((sport, index) => {
    constraints.push(
      constraint(
        "EXISTING_ADDITIONAL_SPORT",
        Scope.CARDIO,
        sport,
        "Existing sport load takes priority when deciding whether more cardio is appropriate.",
      ),
    );
    if (sport.sportCode === null) {
      const sourcePath = `cardio.additionalSports[${index}].otherSportText`;
      result.statusCandidates.push(
        statusCandidate(
          PlanStatus.COACH_REVIEW_REQUIRED,
          "UNCLASSIFIED_ADDITIONAL_SPORT",
        ),
      );
      result.reviewFlags.push(
        reviewFlag(
          "UNCLASSIFIED_ADDITIONAL_SPORT",
          Scope.TRAINING,
          ReviewLevel.COACH,
          "The reported sport is preserved without interpretation and requires coach mapping.",
          sourcePath,
        ),
      );
      result.reasons.push(
        reason(
          "UNCLASSIFIED_SPORT_REQUIRES_MAPPING",
          Scope.TRAINING,
          "The unclassified sport schedule remains part of total load while its type awaits mapping.",
        ),
      );
      result.missingOrUncertainData.push({
        code: "ADDITIONAL_SPORT_MAPPING_PENDING",
        path: sourcePath,
        message: "The reported sport requires coach mapping for sport-specific planning.",
      });
    }
  });
  result.hardConstraints.push(...constraints);
  return { ...result, decisionConstraints: constraints };
}

export function decideCardioStrategy(input, safetyContext, conservativeRecoveryStart) {
  const result = evaluateCardioConstraints(input);
  const safetyGate =
    safetyContext.medicalGate ||
    safetyContext.blockingGate ||
    safetyContext.adultPathBlocked ||
    safetyContext.pregnancyGate;
  const highSportLoad = isHighCardioSportLoad(input.cardio.additionalSports);
  const explicitEnduranceGoal = hasExplicitEnduranceGoal(input);
  const hasFormalCardioCapacity =
    input.cardio.maxSessionsPerWeek > 0 && input.cardio.maxDurationMinutes > 0;
  const steps = input.cardio.averageDailySteps;
  const lowSteps = steps !== null && steps < CardioPolicy.LOW_DAILY_STEPS_THRESHOLD;
  const highSteps = steps !== null && steps >= CardioPolicy.HIGH_DAILY_STEPS_THRESHOLD;
  const adequateDailyActivity = ADEQUATE_DAILY_ACTIVITY_LEVELS.has(
    input.lifestyle.dailyActivity,
  );
  const cardioBlockingMedicalRestriction = input.training.medicalMovementRestrictions.some(
    (restriction) =>
      restriction.instruction === RestrictionInstruction.AVOID &&
      [Movement.ALL_ACTIVITY, Movement.ALL_CARDIO, Movement.WALKING].includes(restriction.movement),
  );
  const cardioBlockingInjury = input.training.injuries.some(
    (injury) =>
      injury.affectedMovements.some((movement) =>
        [Movement.ALL_ACTIVITY, Movement.ALL_CARDIO, Movement.WALKING].includes(movement),
      ) ||
      injury.medicalRestrictions.some(
        (restriction) =>
          restriction.instruction === RestrictionInstruction.AVOID &&
          [Movement.ALL_ACTIVITY, Movement.ALL_CARDIO, Movement.WALKING].includes(restriction.movement),
      ),
  );
  const cardioBlockedByMovementConstraint = cardioBlockingMedicalRestriction || cardioBlockingInjury;
  const hasAnyMovementRestriction =
    input.training.medicalMovementRestrictions.length > 0 || input.training.injuries.length > 0;
  const hasModerateOrHighSport = hasModerateOrHighActiveSport(
    input.cardio.additionalSports,
  );
  let strategy;
  let maxSessions = 0;
  let maxDurationMinutes = 0;
  let intensityStart = CardioIntensity.LOW;
  const decisionReasons = [];

  const walkingNeedsReview =
    input.cardio.walkingAbility === WalkingAbility.LIMITED ||
    input.cardio.walkingAbility === WalkingAbility.UNKNOWN;
  if (walkingNeedsReview) {
    result.statusCandidates.push(statusCandidate(PlanStatus.COACH_REVIEW_REQUIRED, "WALKING_ABILITY_REVIEW"));
    result.reviewFlags.push(
      reviewFlag(
        "WALKING_TEN_MINUTES_NOT_CONFIRMED",
        Scope.CARDIO,
        ReviewLevel.COACH,
        "Walking ten minutes easily is limited or unknown, so cardio needs review before prescription.",
        "cardio.walkingAbility",
      ),
    );
  }
  if (input.cardio.walkingAbility === WalkingAbility.UNKNOWN) {
    result.missingOrUncertainData.push({
      code: "WALKING_ABILITY_UNKNOWN",
      path: "cardio.walkingAbility",
      message: "Walking ability must be confirmed before formal cardio can be drafted.",
    });
  }
  if (input.cardio.averageDailySteps === null) {
    result.missingOrUncertainData.push({
      code: "AVERAGE_DAILY_STEPS_UNKNOWN",
      path: "cardio.averageDailySteps",
      message: "Unknown steps route to a conservative non-session branch until a baseline is recorded.",
    });
  }

  if (safetyGate) {
    strategy = CardioStrategy.REVIEW_REQUIRED;
    decisionReasons.push(
      reason(
        "CARDIO_WITHHELD_PENDING_SAFETY_REVIEW",
        Scope.CARDIO,
        "No additional cardio is recommended until the higher-priority safety gate is cleared.",
      ),
    );
  } else if (cardioBlockedByMovementConstraint) {
    strategy = CardioStrategy.REVIEW_REQUIRED;
    result.statusCandidates.push(
      statusCandidate(PlanStatus.COACH_REVIEW_REQUIRED, "CARDIO_MOVEMENT_RESTRICTION_REVIEW"),
    );
    result.reviewFlags.push(
      reviewFlag(
        "CARDIO_CONFLICTS_WITH_MOVEMENT_RESTRICTION",
        Scope.CARDIO,
        ReviewLevel.COACH,
        "A classified all-cardio, all-activity, or walking restriction prevents an automatic cardio/steps strategy.",
        "training.medicalMovementRestrictions",
      ),
    );
    decisionReasons.push(
      reason(
        "CARDIO_WITHHELD_BY_MOVEMENT_RESTRICTION",
        Scope.CARDIO,
        "The restriction has higher priority than sport load, goals, or cardio capacity.",
      ),
    );
  } else if (walkingNeedsReview) {
    strategy = CardioStrategy.REVIEW_REQUIRED;
    decisionReasons.push(
      reason(
        "CARDIO_REVIEW_WALKING_LIMITATION",
        Scope.CARDIO,
        "The conservative V1 branch uses review rather than inferring the cause of limited walking.",
      ),
    );
  } else if (highSportLoad && lowSteps) {
    strategy = CardioStrategy.STEPS_ONLY;
    decisionReasons.push(
      reason(
        "STEPS_ONLY_LOW_STEPS_WITH_HIGH_SPORT_LOAD",
        Scope.CARDIO,
        "Existing sport already supplies sufficient cardiovascular load; safe walking is used only to build low daily movement.",
      ),
    );
  } else if (highSportLoad) {
    strategy = CardioStrategy.NO_ADDITIONAL_CARDIO;
    decisionReasons.push(
      reason(
        "NO_CARDIO_HIGH_ADDITIONAL_SPORT_LOAD",
        Scope.CARDIO,
        "Additional sport already provides sufficient cardiovascular load, so no separate cardio is added.",
      ),
    );
  } else if (steps === null && adequateDailyActivity) {
    strategy = CardioStrategy.NO_ADDITIONAL_CARDIO;
    decisionReasons.push(
      reason(
        "NO_CARDIO_UNKNOWN_STEPS_ADEQUATE_ACTIVITY",
        Scope.CARDIO,
        "Formal cardio is not inferred from unknown steps when reported daily activity is already adequate.",
      ),
    );
  } else if (steps === null) {
    strategy = CardioStrategy.STEPS_ONLY;
    decisionReasons.push(
      reason(
        "STEPS_ONLY_UNKNOWN_DAILY_STEPS",
        Scope.CARDIO,
        "A conservative steps-first decision is temporary until average daily steps are recorded.",
      ),
    );
  } else if (lowSteps) {
    strategy = CardioStrategy.STEPS_ONLY;
    decisionReasons.push(
      reason(
        "STEPS_ONLY_LOW_DAILY_MOVEMENT",
        Scope.CARDIO,
        "Daily movement is below 5000 steps, so V1 builds safe walking before prescribing separate cardio sessions.",
      ),
    );
    if (explicitEnduranceGoal) {
      decisionReasons.push(
        reason(
          "ENDURANCE_GOAL_DOES_NOT_OVERRIDE_STEPS_FIRST",
          Scope.CARDIO,
          "The endurance goal does not override the steps-first branch without structured evidence that daily movement cannot be increased.",
        ),
      );
    }
  } else if (explicitEnduranceGoal && hasFormalCardioCapacity) {
    strategy = CardioStrategy.CARDIO_SESSIONS;
    maxSessions = input.cardio.maxSessionsPerWeek;
    maxDurationMinutes = input.cardio.maxDurationMinutes;
    decisionReasons.push(
      reason(
        "CARDIO_SESSIONS_ENDURANCE_GOAL",
        Scope.CARDIO,
        "Formal cardio is selected to support the explicit endurance or performance goal.",
      ),
      reason(
        "CARDIO_CAPACITY_APPLIED_AS_LIMIT",
        Scope.CARDIO,
        "Session and duration capacity limit the prescription; capacity alone did not create it.",
      ),
    );
    const moderateStartAllowed =
      input.cardio.walkingAbility === WalkingAbility.EASY &&
      !conservativeRecoveryStart &&
      input.training.experience !== TrainingExperience.NEVER_TRAINED &&
      input.training.experience !== TrainingExperience.BEGINNER &&
      input.training.experience !== TrainingExperience.UNKNOWN &&
      !hasAnyMovementRestriction &&
      !hasModerateOrHighSport;
    intensityStart = moderateStartAllowed ? CardioIntensity.MODERATE : CardioIntensity.LOW;
    decisionReasons.push(
      moderateStartAllowed
        ? reason(
            "CARDIO_MODERATE_INTENSITY_SAFE_START",
            Scope.CARDIO,
            "Easy walking, acceptable recovery, no restrictions, and no competing sport load allow a moderate start.",
          )
        : reason(
            "CARDIO_LOW_INTENSITY_CONSERVATIVE_START",
            Scope.CARDIO,
            "A beginner, recovery concern, restriction, or competing sport load requires a low-intensity start.",
          ),
    );
  } else if (highSteps || adequateDailyActivity) {
    strategy = CardioStrategy.NO_ADDITIONAL_CARDIO;
    decisionReasons.push(
      reason(
        highSteps ? "NO_CARDIO_ADEQUATE_DAILY_STEPS" : "NO_CARDIO_ADEQUATE_DAILY_ACTIVITY",
        Scope.CARDIO,
        highSteps
          ? "Daily steps are adequate; no separate cardio sessions are required."
          : "Reported daily activity is adequate; no separate cardio sessions are required.",
      ),
    );
  } else {
    strategy = CardioStrategy.STEPS_ONLY;
    decisionReasons.push(
      reason(
        "STEPS_ONLY_DAILY_MOVEMENT",
        Scope.CARDIO,
        "Daily movement takes priority because no explicit endurance need justifies formal cardio sessions.",
      ),
    );
  }

  // Obesity with a fat-loss goal gets a daily steps target at least. "Adequate activity" is the
  // client's own impression (the form rarely has a step count), and a BMI of 30+ losing fat with no
  // movement target at all leaves the whole deficit to the diet.
  const heightM = Number(input.body?.heightCm) / 100;
  const bmi = heightM > 0 ? Number(input.body?.weightKg) / (heightM * heightM) : null;
  if (strategy === CardioStrategy.NO_ADDITIONAL_CARDIO && input.goals.primary === PrimaryGoal.FAT_LOSS && bmi !== null && bmi >= 30) {
    strategy = CardioStrategy.STEPS_ONLY;
    decisionReasons.push(
      reason(
        "STEPS_TARGET_FAT_LOSS_WITH_OBESITY",
        Scope.CARDIO,
        "A BMI of 30 or more with a fat-loss goal always carries a daily steps target, whatever activity was reported.",
      ),
    );
  }

  if (
    !hasFormalCardioCapacity &&
    explicitEnduranceGoal &&
    ![CardioStrategy.REVIEW_REQUIRED, CardioStrategy.CARDIO_SESSIONS].includes(strategy)
  ) {
    decisionReasons.push(
      reason(
        "CARDIO_SESSIONS_WITHHELD_ZERO_CAPACITY",
        Scope.CARDIO,
        "Formal cardio requires positive session and duration capacity; a zero cap cannot be exceeded.",
      ),
    );
  }

  if (
    input.goals.primary === PrimaryGoal.FAT_LOSS &&
    ![CardioStrategy.REVIEW_REQUIRED, CardioStrategy.CARDIO_SESSIONS].includes(strategy)
  ) {
    decisionReasons.push(
      reason(
        "FAT_LOSS_DOES_NOT_REQUIRE_CARDIO_SESSIONS",
        Scope.CARDIO,
        "A fat-loss goal alone does not require additional cardio sessions.",
      ),
    );
  }

  if (strategy === CardioStrategy.CARDIO_SESSIONS) {
    if (maxSessions <= 0 || maxDurationMinutes <= 0) {
      throw new Error("Cardio decision invariant violated: formal sessions require positive capacity.");
    }
  } else {
    maxSessions = 0;
    maxDurationMinutes = 0;
    intensityStart = CardioIntensity.LOW;
  }

  if (decisionReasons.length === 0) {
    throw new Error("Cardio decision invariant violated: every strategy requires a reason.");
  }

  result.reasons.push(...decisionReasons);
  return {
    result,
    decision: {
      strategy,
      max_sessions: maxSessions,
      max_duration_minutes: maxDurationMinutes,
      intensity_start: intensityStart,
      constraints: result.decisionConstraints,
      reasons: decisionReasons,
    },
  };
}

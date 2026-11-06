import {
  CalorieDirection,
  Confidence,
  EatingDisorderHistory,
  MealCountStrategy,
  MeasurementQuality,
  MenstrualStatus,
  PlanStatus,
  PrimaryGoal,
  ReviewLevel,
  Scope,
  Severity,
  WeightTrend,
} from "../domain/enums.js";
import {
  constraint,
  emptyRuleResult,
  mergeRuleResults,
  reason,
  reviewFlag,
  statusCandidate,
} from "../domain/rule-result.js";

export function evaluateFoodConstraints(input) {
  const result = emptyRuleResult();
  const decisionConstraints = [];

  // S1: one reported allergy expands into several substances in the
  // canonical list (FISH becomes FISH + SEAFOOD + FISH_SEAFOOD, so the
  // food filter can match every tag). Each substance still gets its own
  // exclusion constraint, but the coach-facing flag is one per reported
  // allergy family, not one per expanded substance — C17 showed the same
  // UNCONFIRMED_FOOD_ALLERGY flag three times for a single fish allergy.
  // The families mirror the adapter's expansion groups; two genuinely
  // different allergies (PEANUT + SHELLFISH) keep two independent flags.
  const ALLERGY_ALIAS_FAMILIES = [
    ["EGG", "EGGS"],
    ["MILK", "DAIRY"],
    ["FISH", "SEAFOOD", "FISH_SEAFOOD", "FISH_SHELLFISH"],
    ["PEANUT", "PEANUTS", "TREE_NUT"],
    ["WHEAT", "GLUTEN"],
  ];
  const allergyFamilyOf = (substance) => {
    for (const family of ALLERGY_ALIAS_FAMILIES) {
      if (family.includes(substance)) return family[0];
    }
    return substance;
  };
  const unconfirmedAllergyFlagsEmitted = new Set();

  input.nutrition.allergies.forEach((allergy, index) => {
    const item = constraint(
      "FOOD_ALLERGY_EXCLUSION",
      Scope.NUTRITION,
      { substance: allergy.substance, medicallyConfirmed: allergy.medicallyConfirmed },
      "Reported allergens must be excluded from standard meals and alternatives.",
    );
    result.hardConstraints.push(item);
    decisionConstraints.push(item);

    const family = allergyFamilyOf(String(allergy.substance || "").toUpperCase());
    if (allergy.medicallyConfirmed === false && !unconfirmedAllergyFlagsEmitted.has(family)) {
      unconfirmedAllergyFlagsEmitted.add(family);
      const sourcePath = `nutrition.allergies[${index}].medicallyConfirmed`;
      result.statusCandidates.push(
        statusCandidate(PlanStatus.COACH_REVIEW_REQUIRED, "UNCONFIRMED_FOOD_ALLERGY"),
      );
      result.reviewFlags.push(
        reviewFlag(
          "UNCONFIRMED_FOOD_ALLERGY",
          Scope.NUTRITION,
          ReviewLevel.COACH,
          "The reported allergy remains excluded as a precaution, but its classification requires coach review.",
          sourcePath,
        ),
      );
      result.reasons.push(
        reason(
          "UNCONFIRMED_ALLERGY_TEMPORARILY_EXCLUDED",
          Scope.NUTRITION,
          "The substance is temporarily excluded from meals and alternatives while the reported allergy awaits confirmation.",
        ),
      );
      result.missingOrUncertainData.push({
        code: "FOOD_ALLERGY_CONFIRMATION_PENDING",
        path: sourcePath,
        message: "The reported allergy is temporarily excluded but still requires confirmation.",
      });
    }
  });

  input.nutrition.medicalExclusions.forEach((exclusion) => {
    const item = constraint(
      "MEDICAL_FOOD_EXCLUSION",
      Scope.NUTRITION,
      exclusion,
      "A medically prohibited food is a mandatory exclusion.",
    );
    result.hardConstraints.push(item);
    decisionConstraints.push(item);
  });

  input.nutrition.dislikedFoods.forEach((food) => {
    const item = constraint(
      "DISLIKED_FOOD_EXCLUSION",
      Scope.NUTRITION,
      { food },
      "Exclude this preference from normal generation and alternatives without treating it as an allergy.",
    );
    result.softPreferences.push(item);
    decisionConstraints.push(item);
  });

  input.nutrition.intolerances.forEach((intolerance, index) => {
    const medicallyRestrictive =
      intolerance.medicallyDiagnosed && intolerance.severity === Severity.SEVERE;
    const item = constraint(
      medicallyRestrictive ? "MEDICALLY_DIAGNOSED_INTOLERANCE" : "REPORTED_INTOLERANCE",
      Scope.NUTRITION,
      {
        substance: intolerance.substance,
        severity: intolerance.severity,
        medicallyDiagnosed: intolerance.medicallyDiagnosed,
      },
      "Intolerance is kept distinct from allergy and handled according to its structured severity.",
    );
    decisionConstraints.push(item);
    if (medicallyRestrictive) result.hardConstraints.push(item);
    else result.softPreferences.push(item);

    if (intolerance.severity === Severity.SEVERE || intolerance.severity === Severity.UNKNOWN) {
      result.statusCandidates.push(statusCandidate(PlanStatus.COACH_REVIEW_REQUIRED, "INTOLERANCE_REVIEW"));
      result.reviewFlags.push(
        reviewFlag(
          "INTOLERANCE_REQUIRES_CLASSIFICATION",
          Scope.NUTRITION,
          ReviewLevel.COACH,
          "A severe or uncertainty-classified intolerance requires human review and is never upgraded to allergy automatically.",
          `nutrition.intolerances[${index}]`,
        ),
      );
    }
    if (intolerance.severity === Severity.UNKNOWN) {
      result.missingOrUncertainData.push({
        code: "INTOLERANCE_SEVERITY_UNKNOWN",
        path: `nutrition.intolerances[${index}].severity`,
        message: "The intolerance severity needs classification.",
      });
    }
    if (intolerance.notes?.trim()) {
      result.statusCandidates.push(statusCandidate(PlanStatus.COACH_REVIEW_REQUIRED, "UNCLASSIFIED_FREE_TEXT"));
      result.reviewFlags.push(
        reviewFlag(
          "UNCLASSIFIED_INTOLERANCE_TEXT",
          Scope.NUTRITION,
          ReviewLevel.COACH,
          "Intolerance notes were preserved but not interpreted.",
          `nutrition.intolerances[${index}].notes`,
        ),
      );
    }
  });

  input.nutrition.digestiveIssues.forEach((digestiveIssue, index) => {
    const item = constraint(
      "REPORTED_DIGESTIVE_ISSUE",
      Scope.NUTRITION,
      { name: digestiveIssue.name, severity: digestiveIssue.severity },
      "Digestive issues are recorded separately for nutrition review and generation constraints.",
    );
    decisionConstraints.push(item);
    result.softPreferences.push(item);
    if (digestiveIssue.severity === Severity.SEVERE || digestiveIssue.severity === Severity.UNKNOWN) {
      result.statusCandidates.push(statusCandidate(PlanStatus.COACH_REVIEW_REQUIRED, "DIGESTIVE_ISSUE_REVIEW"));
      result.reviewFlags.push(
        reviewFlag(
          "DIGESTIVE_ISSUE_REQUIRES_REVIEW",
          Scope.NUTRITION,
          ReviewLevel.COACH,
          "A severe or uncertainty-classified digestive issue requires coach review.",
          `nutrition.digestiveIssues[${index}]`,
        ),
      );
    }
  });

  return { ...result, decisionConstraints };
}

export function evaluateNutritionLogistics(input) {
  const result = emptyRuleResult();
  const decisionConstraints = [];

  const budget = constraint(
    "FOOD_BUDGET",
    Scope.NUTRITION,
    { level: input.nutrition.budget },
    "Future meal generation must remain within the reported budget tier.",
  );
  result.softPreferences.push(budget);
  decisionConstraints.push(budget);

  if (!input.nutrition.foodStorageAvailable) {
    const item = constraint(
      "NO_FOOD_STORAGE",
      Scope.NUTRITION,
      { available: false },
      "Do not generate meals that depend on client-side food storage.",
    );
    result.hardConstraints.push(item);
    decisionConstraints.push(item);
  }
  if (!input.nutrition.foodReheatingAvailable) {
    const item = constraint(
      "NO_FOOD_REHEATING",
      Scope.NUTRITION,
      { available: false },
      "Do not generate meals that require reheating at the point of eating.",
    );
    result.hardConstraints.push(item);
    decisionConstraints.push(item);
  }
  input.nutrition.unavailableEatingWindows.forEach((window) => {
    const item = constraint(
      "UNAVAILABLE_EATING_WINDOW",
      Scope.NUTRITION,
      window,
      "Meal timing must avoid a time window in which the client cannot eat.",
    );
    result.hardConstraints.push(item);
    decisionConstraints.push(item);
  });
  result.softPreferences.push(
    constraint(
      "PREFERRED_MEAL_COUNT",
      Scope.NUTRITION,
      { count: input.nutrition.preferredMealCount },
      "Meal count is a client preference, subject to safety and practical constraints.",
    ),
  );

  return { ...result, decisionConstraints };
}

export function evaluateEatingDisorderSafety(input) {
  const result = emptyRuleResult();
  const history = input.medical.eatingDisorderHistory;
  if (history === EatingDisorderHistory.NONE) {
    return { ...result, reviewRequired: false };
  }

  // P0-A2: an eating-disorder history rides the medical-review path, not the
  // coach-review path: generation then saves a DRAFT, never an ACTIVE plan,
  // and publishing requires a human medical-review confirmation. The energy
  // direction stays withheld either way.
  result.statusCandidates.push(statusCandidate(PlanStatus.MEDICAL_REVIEW_REQUIRED, "EATING_DISORDER_HISTORY"));
  result.reviewFlags.push(
    reviewFlag(
      "EATING_DISORDER_HISTORY_REVIEW",
      Scope.NUTRITION,
      ReviewLevel.MEDICAL,
      "No automatic deficit or surplus may be applied before medical review of the reported history.",
      "medical.eatingDisorderHistory",
    ),
  );
  result.reasons.push(
    reason(
      "EATING_DISORDER_HISTORY_BLOCKS_ENERGY_DIRECTION",
      Scope.NUTRITION,
      "The initial calorie direction is withheld pending review.",
    ),
  );
  if (history === EatingDisorderHistory.UNKNOWN) {
    result.missingOrUncertainData.push({
      code: "EATING_DISORDER_HISTORY_UNKNOWN",
      path: "medical.eatingDisorderHistory",
      message: "Eating-disorder history needs a confirmed structured answer.",
    });
  }
  return { ...result, reviewRequired: true };
}

export function determineCalorieConfidence(input, reviewRequired = false) {
  if (reviewRequired) return Confidence.LOW;
  const trendKnown = input.body.weightTrend !== WeightTrend.UNKNOWN;
  const highQuality = input.body.measurementQuality === MeasurementQuality.HIGH;
  // P6: an explicitly unreliable measurement is real uncertainty — it holds
  // the plan even when the trend is known. But a first intake structurally
  // has no weight history, and no intake path records how the weight was
  // measured, so UNKNOWN trend/quality is absence of follow-up data, not
  // evidence against the estimate: it caps confidence at MEDIUM (the
  // conservative adjustment still applies) instead of forcing LOW and
  // withholding every first plan.
  const lowQuality = input.body.measurementQuality === MeasurementQuality.LOW;
  if (lowQuality) return Confidence.LOW;
  if (trendKnown && highQuality) return Confidence.HIGH;
  return Confidence.MEDIUM;
}

export function decideNutrition(input, safetyContext) {
  const food = evaluateFoodConstraints(input);
  const logistics = evaluateNutritionLogistics(input);
  const eatingDisorder = evaluateEatingDisorderSafety(input);
  const safetyGate =
    safetyContext.medicalGate ||
    safetyContext.blockingGate ||
    safetyContext.adultPathBlocked ||
    safetyContext.pregnancyGate;
  const reviewRequired = safetyGate || eatingDisorder.reviewRequired;
  const result = mergeRuleResults([food, logistics, eatingDisorder]);

  if (input.body.weightTrend === WeightTrend.UNKNOWN) {
    result.missingOrUncertainData.push({
      code: "WEIGHT_TREND_UNKNOWN",
      path: "body.weightTrend",
      message: "Unknown recent weight trend reduces calorie-direction confidence.",
    });
  }
  if (input.body.measurementQuality === MeasurementQuality.UNKNOWN) {
    result.missingOrUncertainData.push({
      code: "MEASUREMENT_QUALITY_UNKNOWN",
      path: "body.measurementQuality",
      message: "Unknown measurement quality reduces calorie-direction confidence.",
    });
  }
  if (input.medical.menstrualStatus === MenstrualStatus.UNKNOWN) {
    result.missingOrUncertainData.push({
      code: "MENSTRUAL_STATUS_UNKNOWN",
      path: "medical.menstrualStatus",
      message: "Menstrual status was explicitly reported as unknown; V1 does not infer it.",
    });
  }

  // The client's goal sets the calorie direction from day 1. A fat-loss
  // goal starts in a deficit and a muscle-gain goal starts in a surplus;
  // anything else starts at maintenance. Safety and eating-history gates
  // still withhold the direction entirely (REVIEW_REQUIRED) when they fire.
  // P1-B2: recomposition is a small deficit, so it is a DEFICIT direction
  // (the plan's 10% deficit and the decision now agree); an unresolved
  // COACH_DECIDES goal withholds the direction instead of silently borrowing
  // the fat-loss deficit — the caller resolves it first (see
  // build-master-engine-v2) and the decision is recomputed on the resolved goal.
  const unresolvedGoal = input.goals.primary === PrimaryGoal.COACH_DECIDES;
  const goalDirection =
    input.goals.primary === PrimaryGoal.FAT_LOSS ||
    input.goals.primary === PrimaryGoal.BODY_RECOMPOSITION
      ? CalorieDirection.DEFICIT
      : input.goals.primary === PrimaryGoal.MUSCLE_GAIN
        ? CalorieDirection.SURPLUS
        : CalorieDirection.MAINTENANCE;
  const calorieDirection = (reviewRequired || unresolvedGoal)
    ? CalorieDirection.REVIEW_REQUIRED
    : goalDirection;
  const goalApplied =
    !reviewRequired && !unresolvedGoal && goalDirection !== CalorieDirection.MAINTENANCE;
  const confidence = determineCalorieConfidence(input, reviewRequired);
  const mealCountStrategy = reviewRequired
    ? MealCountStrategy.COACH_TO_CONFIRM
    : input.nutrition.unavailableEatingWindows.length > 0
      ? MealCountStrategy.ADAPT_TO_EATING_WINDOWS
      : MealCountStrategy.USE_CLIENT_PREFERENCE;

  const decisionReasons = [
    reason(
      (reviewRequired || unresolvedGoal)
        ? "NUTRITION_WITHHELD_PENDING_REVIEW"
        : goalApplied
          ? "GOAL_APPLIED_TO_CALORIE_DIRECTION"
          : "MAINTENANCE_CALIBRATION_BASELINE",
      Scope.NUTRITION,
      reviewRequired
        ? "A safety or eating-history gate prevents an automatic calorie direction."
        : unresolvedGoal
          ? "The goal is undecided (COACH_DECIDES); no calorie direction is set until the goal is resolved."
          : goalApplied
            ? "The client's goal sets the calorie direction from day 1 instead of starting at maintenance."
            : "The client's goal maintains weight, so the maintenance calorie direction was applied.",
    ),
    reason(
      goalApplied
        ? "GOAL_SETS_ENERGY_DIRECTION"
        : "GOAL_RECORDED_NOT_AUTO_APPLIED",
      Scope.NUTRITION,
      goalApplied
        ? "The client's goal is an energy prescription from day 1, not context for later calibration."
        : "The client's goal is retained for coach context but is not an automatic energy prescription.",
    ),
    reason(
      `CALORIE_CONFIDENCE_${confidence}`,
      Scope.NUTRITION,
      "Confidence is derived only from recent weight trend, measurement quality, and safety gates.",
    ),
  ];
  result.reasons.push(...decisionReasons);

  return {
    result,
    decision: {
      calorie_direction: calorieDirection,
      confidence,
      meal_count_strategy: mealCountStrategy,
      constraints: [...food.decisionConstraints, ...logistics.decisionConstraints],
      reasons: decisionReasons,
    },
  };
}

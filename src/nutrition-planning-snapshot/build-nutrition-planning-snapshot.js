import {
  calculateAgeYears,
  IntakeValidationError,
  validateIntake,
} from "../intake-decision-engine/index.js";
import { NUTRITION_PLANNING_SNAPSHOT_VERSION } from "./domain/contracts.js";

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requireObject(value, path) {
  if (!isObject(value)) {
    throw new TypeError(`${path} must be an object.`);
  }
}

function requireString(value, path) {
  if (typeof value !== "string") {
    throw new TypeError(`${path} must be a string.`);
  }
}

function requireArray(value, path) {
  if (!Array.isArray(value)) {
    throw new TypeError(`${path} must be an array.`);
  }
}

function validateIntakeDecision(intakeDecision) {
  requireObject(intakeDecision, "intakeDecision");
  requireString(intakeDecision.plan_status, "intakeDecision.plan_status");
  requireArray(
    intakeDecision.hard_constraints,
    "intakeDecision.hard_constraints",
  );
  requireArray(
    intakeDecision.soft_preferences,
    "intakeDecision.soft_preferences",
  );

  requireObject(
    intakeDecision.nutrition_decision,
    "intakeDecision.nutrition_decision",
  );
  requireString(
    intakeDecision.nutrition_decision.calorie_direction,
    "intakeDecision.nutrition_decision.calorie_direction",
  );
  requireString(
    intakeDecision.nutrition_decision.confidence,
    "intakeDecision.nutrition_decision.confidence",
  );
  requireString(
    intakeDecision.nutrition_decision.meal_count_strategy,
    "intakeDecision.nutrition_decision.meal_count_strategy",
  );
  requireArray(
    intakeDecision.nutrition_decision.constraints,
    "intakeDecision.nutrition_decision.constraints",
  );
  requireArray(
    intakeDecision.nutrition_decision.reasons,
    "intakeDecision.nutrition_decision.reasons",
  );

  requireObject(
    intakeDecision.training_decision,
    "intakeDecision.training_decision",
  );
  if (
    !Number.isInteger(intakeDecision.training_decision.recommended_days) ||
    intakeDecision.training_decision.recommended_days < 0
  ) {
    throw new TypeError(
      "intakeDecision.training_decision.recommended_days must be a non-negative integer.",
    );
  }
  requireString(
    intakeDecision.training_decision.schedule_mode,
    "intakeDecision.training_decision.schedule_mode",
  );

  requireObject(
    intakeDecision.cardio_decision,
    "intakeDecision.cardio_decision",
  );
}

function deepFreeze(value, seen = new WeakSet()) {
  if (value === null || typeof value !== "object" || seen.has(value)) {
    return value;
  }

  seen.add(value);
  for (const key of Reflect.ownKeys(value)) {
    deepFreeze(value[key], seen);
  }
  return Object.freeze(value);
}

/**
 * Builds an immutable nutrition-planning snapshot from validated intake data,
 * trusted evaluation context, and an existing Intake Decision.
 *
 * @param {Object} input
 * @param {Object} input.intake
 * @param {Object} input.evaluationContext
 * @param {Object} input.intakeDecision
 * @returns {import("./domain/contracts.js").NutritionPlanningSnapshot}
 */
export function buildNutritionPlanningSnapshot({
  intake,
  evaluationContext,
  intakeDecision,
} = {}) {
  const validationResult = validateIntake(intake, evaluationContext);
  if (!validationResult.valid) {
    throw new IntakeValidationError(validationResult.issues);
  }

  validateIntakeDecision(intakeDecision);

  const ageYears = calculateAgeYears(
    intake.personal.dateOfBirth,
    evaluationContext.assessmentDate,
  );

  const snapshot = {
    snapshot_version: NUTRITION_PLANNING_SNAPSHOT_VERSION,
    assessment_date: evaluationContext.assessmentDate,

    client: {
      age_years: ageYears,
      sex: intake.personal.sex,
      residence_country: intake.personal.residenceCountry,
    },

    goal: {
      primary: intake.goals.primary,
      calorie_direction:
        intakeDecision.nutrition_decision.calorie_direction,
      decision_confidence: intakeDecision.nutrition_decision.confidence,
    },

    body: {
      height_cm: intake.body.heightCm,
      weight_kg: intake.body.weightKg,
      waist_cm: intake.body.waistCm ?? null,
      weight_trend: intake.body.weightTrend,
      measurement_quality: intake.body.measurementQuality,
    },

    activity: {
      daily_activity: intake.lifestyle.dailyActivity,
      work_schedule_type: intake.lifestyle.workSchedule.type,
      physically_demanding_days:
        intake.lifestyle.workSchedule.physicallyDemandingDays,
      average_daily_steps: intake.cardio.averageDailySteps,
      additional_sports: intake.cardio.additionalSports,
      recommended_resistance_days:
        intakeDecision.training_decision.recommended_days,
      training_schedule_mode:
        intakeDecision.training_decision.schedule_mode,
      intro_week_required:
        intakeDecision.training_decision.intro_week_required,
      training_volume_start: intakeDecision.training_decision.volume_start,
    },

    recovery: {
      sleep_average_hours: intake.lifestyle.sleep.averageHours,
      sleep_quality: intake.lifestyle.sleep.quality,
      stress_level: intake.lifestyle.stressLevel,
    },

    meal_preferences: {
      preferred_meal_count: intake.nutrition.preferredMealCount,
      meal_count_strategy:
        intakeDecision.nutrition_decision.meal_count_strategy,
      unavailable_eating_windows:
        intake.nutrition.unavailableEatingWindows,
      budget: intake.nutrition.budget,
      food_storage_available: intake.nutrition.foodStorageAvailable,
      food_reheating_available: intake.nutrition.foodReheatingAvailable,
    },

    food_restrictions: {
      allergies: intake.nutrition.allergies,
      medical_exclusions: intake.nutrition.medicalExclusions,
      intolerances: intake.nutrition.intolerances,
      digestive_issues: intake.nutrition.digestiveIssues,
      disliked_foods: intake.nutrition.dislikedFoods,
    },

    decision_context: {
      plan_status: intakeDecision.plan_status,
      hard_constraints: intakeDecision.hard_constraints,
      soft_preferences: intakeDecision.soft_preferences,
      nutrition_constraints: intakeDecision.nutrition_decision.constraints,
      nutrition_reasons: intakeDecision.nutrition_decision.reasons,
      cardio_decision: intakeDecision.cardio_decision,
    },
  };

  return deepFreeze(structuredClone(snapshot));
}

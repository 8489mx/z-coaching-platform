import {
  ActivityLevel,
  CalorieDirection,
  Confidence,
  DayOfWeek,
  PlanStatus,
  Sex,
  SleepQuality,
  SportIntensity,
  StressLevel,
  VolumeStart,
} from "../intake-decision-engine/index.js";
import { NUTRITION_PLANNING_SNAPSHOT_VERSION } from "../nutrition-planning-snapshot/index.js";
import { NUTRITION_ENERGY_TARGET_VERSION } from "./domain/contracts.js";
import {
  NutritionEnergyCalculationMethod,
  NutritionEnergyTargetStatus,
  NutritionPalCategory,
} from "./domain/enums.js";

const PAL_RANK = Object.freeze({
  [NutritionPalCategory.INACTIVE]: 0,
  [NutritionPalCategory.LOW_ACTIVE]: 1,
  [NutritionPalCategory.ACTIVE]: 2,
  [NutritionPalCategory.VERY_ACTIVE]: 3,
});

const LIFESTYLE_CATEGORY = Object.freeze({
  [ActivityLevel.SEDENTARY]: NutritionPalCategory.INACTIVE,
  [ActivityLevel.LIGHT]: NutritionPalCategory.LOW_ACTIVE,
  [ActivityLevel.MODERATE]: NutritionPalCategory.ACTIVE,
  [ActivityLevel.HIGH]: NutritionPalCategory.VERY_ACTIVE,
  [ActivityLevel.VERY_HIGH]: NutritionPalCategory.VERY_ACTIVE,
  [ActivityLevel.UNKNOWN]: null,
});

const SPORT_INTENSITY_WEIGHT = Object.freeze({
  [SportIntensity.LOW]: 0.5,
  [SportIntensity.MODERATE]: 1,
  [SportIntensity.HIGH]: 1.5,
});

const EER_COEFFICIENTS = Object.freeze({
  [Sex.MALE]: Object.freeze({
    [NutritionPalCategory.INACTIVE]: Object.freeze([
      753.07, -10.83, 6.5, 14.1,
    ]),
    [NutritionPalCategory.LOW_ACTIVE]: Object.freeze([
      581.47, -10.83, 8.3, 14.94,
    ]),
    [NutritionPalCategory.ACTIVE]: Object.freeze([
      1004.82, -10.83, 6.52, 15.91,
    ]),
    [NutritionPalCategory.VERY_ACTIVE]: Object.freeze([
      -517.88, -10.83, 15.61, 19.11,
    ]),
  }),
  [Sex.FEMALE]: Object.freeze({
    [NutritionPalCategory.INACTIVE]: Object.freeze([
      584.9, -7.01, 5.72, 11.71,
    ]),
    [NutritionPalCategory.LOW_ACTIVE]: Object.freeze([
      575.77, -7.01, 6.6, 12.14,
    ]),
    [NutritionPalCategory.ACTIVE]: Object.freeze([
      710.25, -7.01, 6.54, 12.34,
    ]),
    [NutritionPalCategory.VERY_ACTIVE]: Object.freeze([
      511.83, -7.01, 9.07, 12.56,
    ]),
  }),
});

const REASON_MESSAGES = Object.freeze({
  ENERGY_TARGET_WITHHELD_BY_INTAKE_STATUS:
    "The nutrition energy target was withheld because the intake status requires medical review or is blocked.",
  ADULT_EER_REQUIRES_AGE_19_PLUS:
    "The adult NASEM EER equation requires the client to be at least 19 years old.",
  SEX_SPECIFIC_EER_REQUIRES_REVIEW:
    "The sex-specific NASEM EER equation requires review when sex is not MALE or FEMALE.",
  ACTIVITY_DATA_INSUFFICIENT:
    "Activity data is insufficient to assign a PAL category and estimate maintenance energy.",
  NASEM_DRI_2023_EER_APPLIED:
    "Adult maintenance energy was estimated using the 2023 NASEM EER equation.",
  UPSTREAM_COACH_REVIEW_REQUIRED:
    "The nutrition energy target requires coach review because the upstream intake decision requires coach review.",
  LOW_NUTRITION_DECISION_CONFIDENCE:
    "The nutrition decision confidence is not HIGH, so the energy target requires coach review.",
  UNKNOWN_LIFESTYLE_ACTIVITY_REQUIRES_REVIEW:
    "Lifestyle activity is UNKNOWN, so the calculated energy target requires coach review.",
  CALORIE_DIRECTION_REQUIRES_REVIEW:
    "A target calorie adjustment cannot be applied until the calorie direction is reviewed.",
  MAINTENANCE_DIRECTION_APPLIED:
    "The maintenance calorie direction was applied without a deficit or surplus.",
  CALIBRATION_REQUIRED:
    "The initial energy estimate must be calibrated against actual weight and adherence data.",
});

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requireObject(value, path) {
  if (!isObject(value)) {
    throw new TypeError(`${path} must be an object.`);
  }
}

function requireEnum(value, runtimeEnum, enumName, path) {
  if (!Object.values(runtimeEnum).includes(value)) {
    throw new TypeError(`${path} must be a ${enumName}.`);
  }
}

function validateSnapshot(snapshot) {
  requireObject(snapshot, "nutritionPlanningSnapshot");

  if (snapshot.snapshot_version !== NUTRITION_PLANNING_SNAPSHOT_VERSION) {
    throw new TypeError(
      `nutritionPlanningSnapshot.snapshot_version must equal ${NUTRITION_PLANNING_SNAPSHOT_VERSION}.`,
    );
  }

  requireObject(snapshot.client, "nutritionPlanningSnapshot.client");
  if (!Number.isInteger(snapshot.client.age_years) || snapshot.client.age_years < 0) {
    throw new TypeError(
      "nutritionPlanningSnapshot.client.age_years must be a non-negative integer.",
    );
  }
  requireEnum(
    snapshot.client.sex,
    Sex,
    "Sex",
    "nutritionPlanningSnapshot.client.sex",
  );

  requireObject(snapshot.goal, "nutritionPlanningSnapshot.goal");
  requireEnum(
    snapshot.goal.calorie_direction,
    CalorieDirection,
    "CalorieDirection",
    "nutritionPlanningSnapshot.goal.calorie_direction",
  );
  requireEnum(
    snapshot.goal.decision_confidence,
    Confidence,
    "Confidence",
    "nutritionPlanningSnapshot.goal.decision_confidence",
  );

  requireObject(snapshot.body, "nutritionPlanningSnapshot.body");
  for (const field of ["height_cm", "weight_kg"]) {
    const value = snapshot.body[field];
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
      throw new TypeError(
        `nutritionPlanningSnapshot.body.${field} must be a positive finite number.`,
      );
    }
  }

  requireObject(snapshot.activity, "nutritionPlanningSnapshot.activity");
  requireEnum(
    snapshot.activity.daily_activity,
    ActivityLevel,
    "ActivityLevel",
    "nutritionPlanningSnapshot.activity.daily_activity",
  );
  if (
    snapshot.activity.average_daily_steps !== null &&
    (!Number.isInteger(snapshot.activity.average_daily_steps) ||
      snapshot.activity.average_daily_steps < 0)
  ) {
    throw new TypeError(
      "nutritionPlanningSnapshot.activity.average_daily_steps must be null or a non-negative integer.",
    );
  }
  if (!Array.isArray(snapshot.activity.additional_sports)) {
    throw new TypeError(
      "nutritionPlanningSnapshot.activity.additional_sports must be an array.",
    );
  }
  if (
    !Number.isInteger(snapshot.activity.recommended_resistance_days) ||
    snapshot.activity.recommended_resistance_days < 0 ||
    snapshot.activity.recommended_resistance_days > 6
  ) {
    throw new TypeError(
      "nutritionPlanningSnapshot.activity.recommended_resistance_days must be an integer from 0 to 6.",
    );
  }
  if (typeof snapshot.activity.intro_week_required !== "boolean") {
    throw new TypeError(
      "nutritionPlanningSnapshot.activity.intro_week_required must be a boolean.",
    );
  }
  requireEnum(
    snapshot.activity.training_volume_start,
    VolumeStart,
    "VolumeStart",
    "nutritionPlanningSnapshot.activity.training_volume_start",
  );

  snapshot.activity.additional_sports.forEach((sport, sportIndex) => {
    const sportPath =
      `nutritionPlanningSnapshot.activity.additional_sports[${sportIndex}]`;
    requireObject(sport, sportPath);
    if (!Array.isArray(sport.days)) {
      throw new TypeError(`${sportPath}.days must be an array.`);
    }
    sport.days.forEach((day, dayIndex) => {
      requireEnum(
        day,
        DayOfWeek,
        "DayOfWeek",
        `${sportPath}.days[${dayIndex}]`,
      );
    });
    if (!Number.isInteger(sport.minutesPerSession) || sport.minutesPerSession <= 0) {
      throw new TypeError(
        `${sportPath}.minutesPerSession must be a positive integer.`,
      );
    }
    requireEnum(
      sport.intensity,
      SportIntensity,
      "SportIntensity",
      `${sportPath}.intensity`,
    );
  });

  requireObject(snapshot.recovery, "nutritionPlanningSnapshot.recovery");
  if (
    typeof snapshot.recovery.sleep_average_hours !== "number" ||
    !Number.isFinite(snapshot.recovery.sleep_average_hours) ||
    snapshot.recovery.sleep_average_hours < 0 ||
    snapshot.recovery.sleep_average_hours > 24
  ) {
    throw new TypeError(
      "nutritionPlanningSnapshot.recovery.sleep_average_hours must be a finite number from 0 to 24.",
    );
  }
  requireEnum(
    snapshot.recovery.sleep_quality,
    SleepQuality,
    "SleepQuality",
    "nutritionPlanningSnapshot.recovery.sleep_quality",
  );
  requireEnum(
    snapshot.recovery.stress_level,
    StressLevel,
    "StressLevel",
    "nutritionPlanningSnapshot.recovery.stress_level",
  );

  requireObject(
    snapshot.decision_context,
    "nutritionPlanningSnapshot.decision_context",
  );
  requireEnum(
    snapshot.decision_context.plan_status,
    PlanStatus,
    "PlanStatus",
    "nutritionPlanningSnapshot.decision_context.plan_status",
  );
  if (!Array.isArray(snapshot.decision_context.nutrition_constraints)) {
    throw new TypeError(
      "nutritionPlanningSnapshot.decision_context.nutrition_constraints must be an array.",
    );
  }
}

function stepsCategory(steps) {
  if (steps === null) {
    return null;
  }
  if (steps <= 4999) {
    return NutritionPalCategory.INACTIVE;
  }
  if (steps <= 7499) {
    return NutritionPalCategory.LOW_ACTIVE;
  }
  if (steps <= 11999) {
    return NutritionPalCategory.ACTIVE;
  }
  return NutritionPalCategory.VERY_ACTIVE;
}

function resistanceCategory(activity) {
  const days = activity.recommended_resistance_days;
  let category;

  if (days === 0) {
    return null;
  }
  if (days === 1) {
    category = NutritionPalCategory.INACTIVE;
  } else if (days <= 3) {
    category = NutritionPalCategory.LOW_ACTIVE;
  } else if (days <= 5) {
    category = NutritionPalCategory.ACTIVE;
  } else {
    category = NutritionPalCategory.VERY_ACTIVE;
  }

  const conservativeCap =
    activity.intro_week_required ||
    activity.training_volume_start === VolumeStart.CONSERVATIVE;
  if (
    conservativeCap &&
    PAL_RANK[category] > PAL_RANK[NutritionPalCategory.LOW_ACTIVE]
  ) {
    return NutritionPalCategory.LOW_ACTIVE;
  }
  return category;
}

function sportAssessment(additionalSports) {
  const weightedSportMinutes = additionalSports.reduce(
    (total, sport) =>
      total +
      sport.days.length *
        sport.minutesPerSession *
        SPORT_INTENSITY_WEIGHT[sport.intensity],
    0,
  );

  if (weightedSportMinutes === 0) {
    return { category: null, weightedSportMinutes };
  }
  if (weightedSportMinutes < 90) {
    return {
      category: NutritionPalCategory.LOW_ACTIVE,
      weightedSportMinutes,
    };
  }
  if (weightedSportMinutes < 180) {
    return {
      category: NutritionPalCategory.ACTIVE,
      weightedSportMinutes,
    };
  }
  return {
    category: NutritionPalCategory.VERY_ACTIVE,
    weightedSportMinutes,
  };
}

function buildActivityAssessment(activity) {
  const lifestyle = LIFESTYLE_CATEGORY[activity.daily_activity];
  const steps = stepsCategory(activity.average_daily_steps);
  const resistance = resistanceCategory(activity);
  const sport = sportAssessment(activity.additional_sports);
  const categories = [lifestyle, steps, resistance, sport.category].filter(
    (category) => category !== null,
  );
  const pal =
    categories.length === 0
      ? null
      : categories.reduce((highest, category) =>
          PAL_RANK[category] > PAL_RANK[highest] ? category : highest,
        );

  return {
    pal_category: pal,
    lifestyle_category: lifestyle,
    steps_category: steps,
    resistance_category: resistance,
    sport_category: sport.category,
    weighted_sport_minutes: sport.weightedSportMinutes,
  };
}

function emptyActivityAssessment() {
  return {
    pal_category: null,
    lifestyle_category: null,
    steps_category: null,
    resistance_category: null,
    sport_category: null,
    weighted_sport_minutes: 0,
  };
}

function roundToNearest10(value) {
  return Math.round(value / 10) * 10;
}

function calculateMaintenance(snapshot, palCategory) {
  const [constant, ageCoefficient, heightCoefficient, weightCoefficient] =
    EER_COEFFICIENTS[snapshot.client.sex][palCategory];
  return roundToNearest10(
    constant +
      ageCoefficient * snapshot.client.age_years +
      heightCoefficient * snapshot.body.height_cm +
      weightCoefficient * snapshot.body.weight_kg,
  );
}

function shouldUseConservativeAdjustment(snapshot) {
  return (
    snapshot.decision_context.plan_status ===
      PlanStatus.COACH_REVIEW_REQUIRED ||
    snapshot.goal.decision_confidence !== Confidence.HIGH ||
    snapshot.activity.intro_week_required ||
    snapshot.activity.training_volume_start === VolumeStart.CONSERVATIVE ||
    snapshot.recovery.sleep_average_hours < 6 ||
    [SleepQuality.POOR, SleepQuality.UNKNOWN].includes(
      snapshot.recovery.sleep_quality,
    ) ||
    [StressLevel.HIGH, StressLevel.UNKNOWN].includes(
      snapshot.recovery.stress_level,
    ) ||
    snapshot.activity.daily_activity === ActivityLevel.UNKNOWN
  );
}

function addReason(reasons, reasonCodes, code) {
  if (reasonCodes.has(code)) {
    return;
  }
  reasonCodes.add(code);
  reasons.push({ code, message: REASON_MESSAGES[code] });
}

function buildOutput(snapshot, activityAssessment) {
  return {
    energy_target_version: NUTRITION_ENERGY_TARGET_VERSION,
    source_snapshot_version: snapshot.snapshot_version,
    status: NutritionEnergyTargetStatus.READY,
    calculation_method:
      NutritionEnergyCalculationMethod.NASEM_DRI_2023_EER_ADULT,
    activity_assessment: activityAssessment,
    estimated_maintenance_kcal: null,
    calorie_direction: snapshot.goal.calorie_direction,
    adjustment_percent: null,
    adjustment_kcal: null,
    target_calories: null,
    calibration_required: false,
    constraints: snapshot.decision_context.nutrition_constraints,
    reasons: [],
  };
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

function finalize(output) {
  return deepFreeze(structuredClone(output));
}

/**
 * Builds an immutable adult nutrition energy target from a validated nutrition
 * planning snapshot.
 *
 * @param {Object} nutritionPlanningSnapshot
 * @returns {import("./domain/contracts.js").NutritionEnergyTarget}
 */
export function buildNutritionEnergyTarget(nutritionPlanningSnapshot) {
  validateSnapshot(nutritionPlanningSnapshot);

  const snapshot = nutritionPlanningSnapshot;
  const planStatus = snapshot.decision_context.plan_status;
  const withheld = [
    PlanStatus.MEDICAL_REVIEW_REQUIRED,
    PlanStatus.BLOCKED,
  ].includes(planStatus);

  if (withheld) {
    const output = buildOutput(snapshot, emptyActivityAssessment());
    output.status = NutritionEnergyTargetStatus.WITHHELD;
    output.reasons.push({
      code: "ENERGY_TARGET_WITHHELD_BY_INTAKE_STATUS",
      message: REASON_MESSAGES.ENERGY_TARGET_WITHHELD_BY_INTAKE_STATUS,
    });
    return finalize(output);
  }

  const activityAssessment = buildActivityAssessment(snapshot.activity);
  const output = buildOutput(snapshot, activityAssessment);
  const reasonCodes = new Set();

  if (snapshot.client.age_years < 19) {
    output.status = NutritionEnergyTargetStatus.PROVISIONAL_REVIEW_REQUIRED;
    addReason(output.reasons, reasonCodes, "ADULT_EER_REQUIRES_AGE_19_PLUS");
  }
  if (![Sex.MALE, Sex.FEMALE].includes(snapshot.client.sex)) {
    output.status = NutritionEnergyTargetStatus.PROVISIONAL_REVIEW_REQUIRED;
    addReason(
      output.reasons,
      reasonCodes,
      "SEX_SPECIFIC_EER_REQUIRES_REVIEW",
    );
  }
  if (output.reasons.length > 0) {
    return finalize(output);
  }

  if (activityAssessment.pal_category === null) {
    output.status = NutritionEnergyTargetStatus.PROVISIONAL_REVIEW_REQUIRED;
    addReason(output.reasons, reasonCodes, "ACTIVITY_DATA_INSUFFICIENT");
    return finalize(output);
  }

  output.estimated_maintenance_kcal = calculateMaintenance(
    snapshot,
    activityAssessment.pal_category,
  );
  addReason(output.reasons, reasonCodes, "NASEM_DRI_2023_EER_APPLIED");

  if (planStatus === PlanStatus.COACH_REVIEW_REQUIRED) {
    output.status = NutritionEnergyTargetStatus.PROVISIONAL_REVIEW_REQUIRED;
    addReason(output.reasons, reasonCodes, "UPSTREAM_COACH_REVIEW_REQUIRED");
  }
  if (snapshot.goal.decision_confidence !== Confidence.HIGH) {
    output.status = NutritionEnergyTargetStatus.PROVISIONAL_REVIEW_REQUIRED;
    addReason(
      output.reasons,
      reasonCodes,
      "LOW_NUTRITION_DECISION_CONFIDENCE",
    );
  }
  if (snapshot.activity.daily_activity === ActivityLevel.UNKNOWN) {
    output.status = NutritionEnergyTargetStatus.PROVISIONAL_REVIEW_REQUIRED;
    addReason(
      output.reasons,
      reasonCodes,
      "UNKNOWN_LIFESTYLE_ACTIVITY_REQUIRES_REVIEW",
    );
  }

  const direction = snapshot.goal.calorie_direction;
  if (direction === CalorieDirection.REVIEW_REQUIRED) {
    output.status = NutritionEnergyTargetStatus.PROVISIONAL_REVIEW_REQUIRED;
    addReason(
      output.reasons,
      reasonCodes,
      "CALORIE_DIRECTION_REQUIRES_REVIEW",
    );
    return finalize(output);
  }

  if (direction === CalorieDirection.MAINTENANCE) {
    output.adjustment_percent = 0;
    output.adjustment_kcal = 0;
    output.target_calories = output.estimated_maintenance_kcal;
    addReason(output.reasons, reasonCodes, "MAINTENANCE_DIRECTION_APPLIED");
  } else {
    const conservative = shouldUseConservativeAdjustment(snapshot);
    const isDeficit = direction === CalorieDirection.DEFICIT;
    const percent = isDeficit
      ? conservative
        ? 10
        : 15
      : conservative
        ? 5
        : 8;
    const maximumAdjustment = isDeficit ? 500 : 300;
    const magnitude = roundToNearest10(
      Math.min(
        output.estimated_maintenance_kcal * (percent / 100),
        maximumAdjustment,
      ),
    );
    output.adjustment_percent = percent;
    output.adjustment_kcal = isDeficit ? -magnitude : magnitude;
    output.target_calories =
      output.estimated_maintenance_kcal + output.adjustment_kcal;
  }

  output.calibration_required = true;
  addReason(output.reasons, reasonCodes, "CALIBRATION_REQUIRED");
  return finalize(output);
}

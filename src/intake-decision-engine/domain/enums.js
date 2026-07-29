/**
 * Runtime enums are frozen objects rather than free-form strings. They work in
 * plain JavaScript, remain serializable, and do not require a build tool.
 */

export const PlanStatus = Object.freeze({
  READY_FOR_DRAFT: "READY_FOR_DRAFT",
  COACH_REVIEW_REQUIRED: "COACH_REVIEW_REQUIRED",
  MEDICAL_REVIEW_REQUIRED: "MEDICAL_REVIEW_REQUIRED",
  BLOCKED: "BLOCKED",
});

export const ReviewLevel = Object.freeze({
  COACH: "COACH",
  MEDICAL: "MEDICAL",
  BLOCKING: "BLOCKING",
});

export const ScreeningAnswer = Object.freeze({
  YES: "YES",
  NO: "NO",
  UNKNOWN: "UNKNOWN",
});

export const Scope = Object.freeze({
  GLOBAL: "GLOBAL",
  NUTRITION: "NUTRITION",
  TRAINING: "TRAINING",
  CARDIO: "CARDIO",
  MOBILITY: "MOBILITY",
});

export const Sex = Object.freeze({
  FEMALE: "FEMALE",
  MALE: "MALE",
  OTHER: "OTHER",
  PREFER_NOT_TO_SAY: "PREFER_NOT_TO_SAY",
});

export const PrimaryGoal = Object.freeze({
  FAT_LOSS: "FAT_LOSS",
  MUSCLE_GAIN: "MUSCLE_GAIN",
  WEIGHT_MAINTENANCE: "WEIGHT_MAINTENANCE",
  GENERAL_HEALTH: "GENERAL_HEALTH",
  PERFORMANCE: "PERFORMANCE",
  OTHER: "OTHER",
});

export const WeightTrend = Object.freeze({
  LOSING: "LOSING",
  STABLE: "STABLE",
  GAINING: "GAINING",
  FLUCTUATING: "FLUCTUATING",
  UNKNOWN: "UNKNOWN",
});

export const MeasurementQuality = Object.freeze({
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
  UNKNOWN: "UNKNOWN",
});

export const ActivityLevel = Object.freeze({
  SEDENTARY: "SEDENTARY",
  LIGHT: "LIGHT",
  MODERATE: "MODERATE",
  HIGH: "HIGH",
  VERY_HIGH: "VERY_HIGH",
  UNKNOWN: "UNKNOWN",
});

export const WorkScheduleType = Object.freeze({
  FIXED: "FIXED",
  VARIABLE: "VARIABLE",
  SHIFT_BASED: "SHIFT_BASED",
});

export const TrainingScheduleAvailabilityType = Object.freeze({
  FIXED_AVAILABLE_DAYS: "FIXED_AVAILABLE_DAYS",
  FIXED_UNAVAILABLE_DAYS: "FIXED_UNAVAILABLE_DAYS",
  VARIABLE: "VARIABLE",
  FLEXIBLE: "FLEXIBLE",
});

export const Stability = Object.freeze({
  STABLE: "STABLE",
  UNSTABLE: "UNSTABLE",
  UNKNOWN: "UNKNOWN",
});

export const MedicalConditionCode = Object.freeze({
  DIABETES: "DIABETES",
  INSULIN_RESISTANCE: "INSULIN_RESISTANCE",
  HYPERTENSION: "HYPERTENSION",
  HEART_CONDITION: "HEART_CONDITION",
  KIDNEY_CONDITION: "KIDNEY_CONDITION",
  LIVER_CONDITION: "LIVER_CONDITION",
  THYROID_CONDITION: "THYROID_CONDITION",
  ANEMIA: "ANEMIA",
  ASTHMA_OR_RESPIRATORY_CONDITION: "ASTHMA_OR_RESPIRATORY_CONDITION",
  DIAGNOSED_DIGESTIVE_CONDITION: "DIAGNOSED_DIGESTIVE_CONDITION",
  PCOS: "PCOS",
});

export const PregnancyStatus = Object.freeze({
  NOT_APPLICABLE: "NOT_APPLICABLE",
  NOT_PREGNANT: "NOT_PREGNANT",
  PREGNANT: "PREGNANT",
  POSSIBLY_PREGNANT: "POSSIBLY_PREGNANT",
  BREASTFEEDING: "BREASTFEEDING",
  UNKNOWN: "UNKNOWN",
});

export const EatingDisorderHistory = Object.freeze({
  NONE: "NONE",
  PAST: "PAST",
  ACTIVE: "ACTIVE",
  SUSPECTED: "SUSPECTED",
  UNKNOWN: "UNKNOWN",
});

export const MenstrualStatus = Object.freeze({
  NOT_APPLICABLE: "NOT_APPLICABLE",
  REGULAR: "REGULAR",
  IRREGULAR: "IRREGULAR",
  ABSENT: "ABSENT",
  UNKNOWN: "UNKNOWN",
});

export const Severity = Object.freeze({
  MILD: "MILD",
  MODERATE: "MODERATE",
  SEVERE: "SEVERE",
  UNKNOWN: "UNKNOWN",
});

export const BudgetLevel = Object.freeze({
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
});

export const TrainingLocation = Object.freeze({
  HOME: "HOME",
  GYM: "GYM",
  OUTDOORS: "OUTDOORS",
  MIXED: "MIXED",
});

export const EquipmentCode = Object.freeze({
  BODYWEIGHT: "BODYWEIGHT",
  DUMBBELLS: "DUMBBELLS",
  BARBELL_AND_PLATES: "BARBELL_AND_PLATES",
  ADJUSTABLE_BENCH: "ADJUSTABLE_BENCH",
  FLAT_BENCH: "FLAT_BENCH",
  RESISTANCE_BANDS: "RESISTANCE_BANDS",
  PULL_UP_BAR: "PULL_UP_BAR",
  SQUAT_RACK: "SQUAT_RACK",
  SMITH_MACHINE: "SMITH_MACHINE",
  CABLE_STATION: "CABLE_STATION",
  SELECTORIZED_MACHINES: "SELECTORIZED_MACHINES",
  KETTLEBELLS: "KETTLEBELLS",
});

export const EquipmentLoadCapacity = Object.freeze({
  BODYWEIGHT_ONLY: "BODYWEIGHT_ONLY",
  LIGHT: "LIGHT",
  MODERATE: "MODERATE",
  HEAVY: "HEAVY",
  NOT_APPLICABLE: "NOT_APPLICABLE",
});

export const Movement = Object.freeze({
  ALL_ACTIVITY: "ALL_ACTIVITY",
  ALL_TRAINING: "ALL_TRAINING",
  ALL_CARDIO: "ALL_CARDIO",
  WALKING: "WALKING",
  RUNNING: "RUNNING",
  CYCLING: "CYCLING",
  SWIMMING: "SWIMMING",
  ROWING: "ROWING",
  STAIRS: "STAIRS",
  JUMPING: "JUMPING",
  SQUAT: "SQUAT",
  HINGE: "HINGE",
  PUSH: "PUSH",
  PULL: "PULL",
  OVERHEAD: "OVERHEAD",
});

export const MovementImpact = Object.freeze({
  NONE: "NONE",
  LIMITS: "LIMITS",
  PREVENTS: "PREVENTS",
});

export const RestrictionInstruction = Object.freeze({
  AVOID: "AVOID",
});

export const RestrictionSource = Object.freeze({
  PHYSICIAN: "PHYSICIAN",
  PHYSIOTHERAPIST: "PHYSIOTHERAPIST",
  OTHER_LICENSED_CLINICIAN: "OTHER_LICENSED_CLINICIAN",
});

export const MedicalFoodInstruction = Object.freeze({
  EXCLUDE: "EXCLUDE",
});

export const TrainingExperience = Object.freeze({
  NEVER_TRAINED: "NEVER_TRAINED",
  BEGINNER: "BEGINNER",
  INTERMEDIATE: "INTERMEDIATE",
  ADVANCED: "ADVANCED",
  UNKNOWN: "UNKNOWN",
});

export const RecentTraining = Object.freeze({
  ACTIVE: "ACTIVE",
  INCONSISTENT: "INCONSISTENT",
  NONE_LAST_4_WEEKS: "NONE_LAST_4_WEEKS",
  RETURNING_AFTER_LONG_BREAK: "RETURNING_AFTER_LONG_BREAK",
  UNKNOWN: "UNKNOWN",
});

export const SportCode = Object.freeze({
  FOOTBALL: "FOOTBALL",
  RUNNING: "RUNNING",
  CYCLING: "CYCLING",
  SWIMMING: "SWIMMING",
  BOXING: "BOXING",
  MARTIAL_ARTS: "MARTIAL_ARTS",
  BASKETBALL: "BASKETBALL",
  HANDBALL: "HANDBALL",
  VOLLEYBALL: "VOLLEYBALL",
  RACKET_SPORTS: "RACKET_SPORTS",
  CROSSFIT_OR_FUNCTIONAL: "CROSSFIT_OR_FUNCTIONAL",
});

export const SportIntensity = Object.freeze({
  LOW: "LOW",
  MODERATE: "MODERATE",
  HIGH: "HIGH",
});

export const SportParticipationLevel = Object.freeze({
  RECREATIONAL: "RECREATIONAL",
  COMPETITIVE: "COMPETITIVE",
});

export const WalkingAbility = Object.freeze({
  EASY: "EASY",
  LIMITED: "LIMITED",
  UNKNOWN: "UNKNOWN",
});

export const SleepQuality = Object.freeze({
  GOOD: "GOOD",
  FAIR: "FAIR",
  POOR: "POOR",
  UNKNOWN: "UNKNOWN",
});

export const StressLevel = Object.freeze({
  LOW: "LOW",
  MODERATE: "MODERATE",
  HIGH: "HIGH",
  UNKNOWN: "UNKNOWN",
});

export const DayOfWeek = Object.freeze({
  MONDAY: "MONDAY",
  TUESDAY: "TUESDAY",
  WEDNESDAY: "WEDNESDAY",
  THURSDAY: "THURSDAY",
  FRIDAY: "FRIDAY",
  SATURDAY: "SATURDAY",
  SUNDAY: "SUNDAY",
});

export const CalorieDirection = Object.freeze({
  DEFICIT: "DEFICIT",
  MAINTENANCE: "MAINTENANCE",
  SURPLUS: "SURPLUS",
  REVIEW_REQUIRED: "REVIEW_REQUIRED",
});

export const Confidence = Object.freeze({
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW",
});

export const MealCountStrategy = Object.freeze({
  USE_CLIENT_PREFERENCE: "USE_CLIENT_PREFERENCE",
  ADAPT_TO_EATING_WINDOWS: "ADAPT_TO_EATING_WINDOWS",
  COACH_TO_CONFIRM: "COACH_TO_CONFIRM",
});

export const ScheduleMode = Object.freeze({
  FIXED_DAYS: "FIXED_DAYS",
  SESSION_SEQUENCE: "SESSION_SEQUENCE",
});

export const VolumeStart = Object.freeze({
  CONSERVATIVE: "CONSERVATIVE",
  NORMAL: "NORMAL",
});

export const CardioStrategy = Object.freeze({
  NO_ADDITIONAL_CARDIO: "NO_ADDITIONAL_CARDIO",
  STEPS_ONLY: "STEPS_ONLY",
  CARDIO_SESSIONS: "CARDIO_SESSIONS",
  REVIEW_REQUIRED: "REVIEW_REQUIRED",
});

export const CardioIntensity = Object.freeze({
  LOW: "LOW",
  MODERATE: "MODERATE",
});

export const MobilityStrategy = Object.freeze({
  INTEGRATED_AND_SEPARATE: "INTEGRATED_AND_SEPARATE",
  REVIEW_REQUIRED: "REVIEW_REQUIRED",
  NONE: "NONE",
});

export const enumValues = (runtimeEnum) => Object.values(runtimeEnum);

import {
  ActivityLevel,
  BudgetLevel,
  DayOfWeek,
  EatingDisorderHistory,
  EquipmentCode,
  EquipmentLoadCapacity,
  MeasurementQuality,
  MenstrualStatus,
  OccupationType,
  PregnancyStatus,
  PrimaryGoal,
  RecentTraining,
  ScreeningAnswer,
  Sex,
  SleepQuality,
  StressLevel,
  TrainingExperience,
  TrainingLocation,
  TrainingScheduleAvailabilityType,
  WalkingAbility,
  WeightTrend,
  WorkScheduleType,
} from "../../src/intake-decision-engine/index.js";

export const COMPLETE_INTAKE = Object.freeze({
  personal: {
    dateOfBirth: "1990-01-15",
    sex: Sex.MALE,
    residenceCountry: "EG",
    guardianConsent: null,
  },
  goals: {
    primary: PrimaryGoal.GENERAL_HEALTH,
    secondaryTraining: "STRENGTH",
  },
  body: {
    heightCm: 178,
    weightKg: 82,
    waistCm: 88,
    weightTrend: WeightTrend.STABLE,
    measurementQuality: MeasurementQuality.HIGH,
    progressPhotosAvailable: true,
  },
  lifestyle: {
    dailyActivity: ActivityLevel.MODERATE,
    occupationType: OccupationType.DESK_OFFICE,
    workSchedule: {
      type: WorkScheduleType.FIXED,
      physicallyDemandingDays: [],
    },
    sleep: {
      averageHours: 8,
      quality: SleepQuality.GOOD,
    },
    stressLevel: StressLevel.LOW,
    occupationType: OccupationType.DESK_OFFICE,
  },
  medical: {
    conditions: [],
    dangerousSymptoms: {
      chestPainOrPressure: ScreeningAnswer.NO,
      fainting: ScreeningAnswer.NO,
      unusualShortnessOfBreath: ScreeningAnswer.NO,
      abnormalPalpitations: ScreeningAnswer.NO,
      otherDangerousSymptomsPresent: ScreeningAnswer.NO,
      otherDangerousSymptoms: [],
    },
    medications: [],
    eatingDisorderHistory: EatingDisorderHistory.NONE,
    pregnancyStatus: PregnancyStatus.NOT_APPLICABLE,
    menstrualStatus: MenstrualStatus.NOT_APPLICABLE,
    unclassifiedText: [],
  },
  nutrition: {
    preferredMealCount: 3,
    unavailableEatingWindows: [],
    budget: BudgetLevel.MEDIUM,
    foodStorageAvailable: true,
    foodReheatingAvailable: true,
    allergies: [],
    medicalExclusions: [],
    dislikedFoods: [],
    intolerances: [],
    digestiveIssues: [],
  },
  training: {
    location: TrainingLocation.GYM,
    equipment: [
      {
        equipmentCode: EquipmentCode.SELECTORIZED_MACHINES,
        otherEquipmentText: null,
        loadCapacity: EquipmentLoadCapacity.HEAVY,
      },
    ],
    maxDaysPerWeek: 4,
    preferredDaysPerWeek: 3,
    trainingScheduleAvailabilityType:
      TrainingScheduleAvailabilityType.FIXED_AVAILABLE_DAYS,
    availableTrainingDays: [
      DayOfWeek.MONDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY,
    ],
    unavailableTrainingDays: [],
    maxSessionMinutes: 60,
    experience: TrainingExperience.INTERMEDIATE,
    recentTraining: RecentTraining.ACTIVE,
    injuries: [],
    medicalMovementRestrictions: [],
  },
  cardio: {
    additionalSports: [],
    averageDailySteps: 8000,
    walkingAbility: WalkingAbility.EASY,
    maxSessionsPerWeek: 2,
    maxDurationMinutes: 30,
  },
  unclassifiedNotes: [],
});

export const ASSESSMENT_CONTEXT = Object.freeze({ assessmentDate: "2026-07-14" });

function merge(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      target[key] !== null &&
      typeof target[key] === "object" &&
      !Array.isArray(target[key])
    ) {
      merge(target[key], value);
    } else {
      target[key] = structuredClone(value);
    }
  }
  return target;
}

export function completeIntake(overrides = {}) {
  return merge(structuredClone(COMPLETE_INTAKE), overrides);
}

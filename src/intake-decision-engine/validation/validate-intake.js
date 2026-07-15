import {
  ActivityLevel,
  BudgetLevel,
  DayOfWeek,
  EatingDisorderHistory,
  EquipmentCode,
  EquipmentLoadCapacity,
  MeasurementQuality,
  MedicalConditionCode,
  MedicalFoodInstruction,
  MenstrualStatus,
  Movement,
  MovementImpact,
  PregnancyStatus,
  PrimaryGoal,
  RecentTraining,
  RestrictionInstruction,
  RestrictionSource,
  ScreeningAnswer,
  Severity,
  Sex,
  SleepQuality,
  SportIntensity,
  Stability,
  StressLevel,
  TrainingExperience,
  TrainingLocation,
  TrainingScheduleAvailabilityType,
  WalkingAbility,
  WeightTrend,
  WorkScheduleType,
  enumValues,
} from "../domain/enums.js";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const STANDARD_EQUIPMENT_LOAD_CAPACITIES = Object.freeze([
  EquipmentLoadCapacity.LIGHT,
  EquipmentLoadCapacity.MODERATE,
  EquipmentLoadCapacity.HEAVY,
]);
const OTHER_EQUIPMENT_LOAD_CAPACITIES = Object.freeze([
  ...STANDARD_EQUIPMENT_LOAD_CAPACITIES,
  EquipmentLoadCapacity.NOT_APPLICABLE,
]);

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function issue(path, code, message) {
  return { path, code, message };
}

function rejectUnknownKeys(value, allowedKeys, path, issues) {
  if (!isPlainObject(value)) return;
  for (const key of Object.keys(value)) {
    if (!allowedKeys.includes(key)) {
      issues.push(
        issue(
          path === "$" ? key : `${path}.${key}`,
          "UNKNOWN_FIELD",
          "Unknown fields are rejected so safety-relevant data cannot be silently ignored.",
        ),
      );
    }
  }
}

function validIsoDate(value) {
  if (typeof value !== "string" || !ISO_DATE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function calculateAgeYears(dateOfBirth, assessmentDate) {
  if (!validIsoDate(dateOfBirth) || !validIsoDate(assessmentDate)) return null;
  const [birthYear, birthMonth, birthDay] = dateOfBirth.split("-").map(Number);
  const [year, month, day] = assessmentDate.split("-").map(Number);
  let age = year - birthYear;
  if (month < birthMonth || (month === birthMonth && day < birthDay)) age -= 1;
  return age;
}

function requiredObject(value, path, issues) {
  if (!isPlainObject(value)) {
    issues.push(issue(path, "REQUIRED_OBJECT", "Expected an object."));
    return {};
  }
  return value;
}

function requiredString(value, path, issues, { nonEmpty = true } = {}) {
  if (typeof value !== "string" || (nonEmpty && value.trim() === "")) {
    issues.push(issue(path, "REQUIRED_STRING", "Expected a non-empty string."));
  }
}

function canonicalId(value, path, issues) {
  if (typeof value !== "string" || !/^[A-Z][A-Z0-9_:-]{0,63}$/.test(value)) {
    issues.push(
      issue(
        path,
        "INVALID_CANONICAL_ID",
        "Expected a canonical uppercase ID (A-Z, 0-9, underscore, colon, or hyphen), not free text.",
      ),
    );
  }
}

function requiredBoolean(value, path, issues) {
  if (typeof value !== "boolean") {
    issues.push(issue(path, "REQUIRED_BOOLEAN", "Expected a boolean."));
  }
}

function numberInRange(value, path, issues, min, max, { integer = false, nullable = false } = {}) {
  if (nullable && value === null) return;
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    (integer && !Number.isInteger(value)) ||
    value < min ||
    value > max
  ) {
    issues.push(
      issue(
        path,
        "NUMBER_OUT_OF_RANGE",
        `Expected ${integer ? "an integer" : "a finite number"} from ${min} to ${max}.`,
      ),
    );
  }
}

function enumValue(value, runtimeEnum, path, issues) {
  if (!enumValues(runtimeEnum).includes(value)) {
    issues.push(
      issue(path, "INVALID_ENUM_VALUE", `Expected one of: ${enumValues(runtimeEnum).join(", ")}.`),
    );
  }
}

function allowedEnumValue(value, allowedValues, path, issues) {
  if (!allowedValues.includes(value)) {
    issues.push(
      issue(path, "INVALID_ENUM_VALUE", `Expected one of: ${allowedValues.join(", ")}.`),
    );
  }
}

function array(value, path, issues) {
  if (!Array.isArray(value)) {
    issues.push(issue(path, "REQUIRED_ARRAY", "Expected an array; use [] to report none."));
    return [];
  }
  return value;
}

function stringArray(value, path, issues) {
  const values = array(value, path, issues);
  values.forEach((item, index) => requiredString(item, `${path}[${index}]`, issues));
  return values;
}

function dayArray(value, path, issues) {
  const values = array(value, path, issues);
  values.forEach((item, index) => enumValue(item, DayOfWeek, `${path}[${index}]`, issues));
  if (new Set(values).size !== values.length) {
    issues.push(issue(path, "DUPLICATE_DAY", "Days must not contain duplicates."));
  }
  return values;
}

function validatePersonal(input, assessmentDate, issues) {
  const personal = requiredObject(input.personal, "personal", issues);
  rejectUnknownKeys(
    personal,
    ["dateOfBirth", "sex", "residenceCountry", "guardianConsent"],
    "personal",
    issues,
  );
  if (!validIsoDate(personal.dateOfBirth)) {
    issues.push(issue("personal.dateOfBirth", "INVALID_DATE", "Expected a valid ISO date (YYYY-MM-DD)."));
  }
  enumValue(personal.sex, Sex, "personal.sex", issues);
  if (typeof personal.residenceCountry !== "string" || !/^[A-Z]{2}$/.test(personal.residenceCountry)) {
    issues.push(
      issue("personal.residenceCountry", "INVALID_COUNTRY", "Expected an ISO 3166-1 alpha-2 country code."),
    );
  }
  if (
    personal.guardianConsent !== undefined &&
    personal.guardianConsent !== null &&
    typeof personal.guardianConsent !== "boolean"
  ) {
    issues.push(issue("personal.guardianConsent", "INVALID_BOOLEAN", "Expected boolean or null."));
  }

  if (validIsoDate(personal.dateOfBirth) && validIsoDate(assessmentDate)) {
    const derivedAge = calculateAgeYears(personal.dateOfBirth, assessmentDate);
    if (derivedAge < 0) {
      issues.push(issue("personal.dateOfBirth", "FUTURE_BIRTH_DATE", "Date of birth is after assessmentDate."));
    } else if (derivedAge > 120) {
      issues.push(
        issue(
          "personal.dateOfBirth",
          "NUMBER_OUT_OF_RANGE",
          "Date of birth must produce an age from 0 to 120 years at assessmentDate.",
        ),
      );
    }
  }
}

function validateGoals(input, issues) {
  const goals = requiredObject(input.goals, "goals", issues);
  rejectUnknownKeys(goals, ["primary", "secondaryTraining"], "goals", issues);
  enumValue(goals.primary, PrimaryGoal, "goals.primary", issues);
  if (goals.secondaryTraining !== undefined && goals.secondaryTraining !== null) {
    requiredString(goals.secondaryTraining, "goals.secondaryTraining", issues);
  }
}

function validateBody(input, issues) {
  const body = requiredObject(input.body, "body", issues);
  rejectUnknownKeys(
    body,
    ["heightCm", "weightKg", "waistCm", "weightTrend", "measurementQuality", "progressPhotosAvailable"],
    "body",
    issues,
  );
  numberInRange(body.heightCm, "body.heightCm", issues, 50, 260);
  numberInRange(body.weightKg, "body.weightKg", issues, 20, 400);
  if (body.waistCm !== undefined && body.waistCm !== null) {
    numberInRange(body.waistCm, "body.waistCm", issues, 30, 300);
  }
  enumValue(body.weightTrend, WeightTrend, "body.weightTrend", issues);
  enumValue(body.measurementQuality, MeasurementQuality, "body.measurementQuality", issues);
  requiredBoolean(body.progressPhotosAvailable, "body.progressPhotosAvailable", issues);
}

function validateLifestyle(input, issues) {
  const lifestyle = requiredObject(input.lifestyle, "lifestyle", issues);
  rejectUnknownKeys(lifestyle, ["dailyActivity", "workSchedule", "sleep", "stressLevel"], "lifestyle", issues);
  enumValue(lifestyle.dailyActivity, ActivityLevel, "lifestyle.dailyActivity", issues);
  const work = requiredObject(lifestyle.workSchedule, "lifestyle.workSchedule", issues);
  rejectUnknownKeys(work, ["type", "physicallyDemandingDays"], "lifestyle.workSchedule", issues);
  enumValue(work.type, WorkScheduleType, "lifestyle.workSchedule.type", issues);
  dayArray(work.physicallyDemandingDays, "lifestyle.workSchedule.physicallyDemandingDays", issues);
  const sleep = requiredObject(lifestyle.sleep, "lifestyle.sleep", issues);
  rejectUnknownKeys(sleep, ["averageHours", "quality"], "lifestyle.sleep", issues);
  numberInRange(sleep.averageHours, "lifestyle.sleep.averageHours", issues, 0, 24);
  enumValue(sleep.quality, SleepQuality, "lifestyle.sleep.quality", issues);
  enumValue(lifestyle.stressLevel, StressLevel, "lifestyle.stressLevel", issues);
}

function validateMedical(input, issues) {
  const medical = requiredObject(input.medical, "medical", issues);
  rejectUnknownKeys(
    medical,
    [
      "conditions",
      "dangerousSymptoms",
      "medications",
      "eatingDisorderHistory",
      "pregnancyStatus",
      "menstrualStatus",
      "unclassifiedText",
    ],
    "medical",
    issues,
  );
  const conditions = array(medical.conditions, "medical.conditions", issues);
  conditions.forEach((raw, index) => {
    const path = `medical.conditions[${index}]`;
    const condition = requiredObject(raw, path, issues);
    rejectUnknownKeys(
      condition,
      [
        "conditionCode",
        "otherConditionText",
        "stability",
        "physicianInstructions",
        "unclassifiedInstructionsText",
      ],
      path,
      issues,
    );

    const hasConditionCode = Object.hasOwn(condition, "conditionCode");
    const hasOtherConditionText = Object.hasOwn(condition, "otherConditionText");
    const otherConditionText = condition.otherConditionText;
    if (!hasConditionCode) {
      issues.push(
        issue(
          `${path}.conditionCode`,
          "REQUIRED_MEDICAL_CONDITION_DISCRIMINATOR",
          "Expected a known MedicalConditionCode or explicit null for an unclassified condition.",
        ),
      );
    } else if (!hasOtherConditionText) {
      issues.push(
        issue(
          `${path}.otherConditionText`,
          "REQUIRED_MEDICAL_CONDITION_FIELD",
          "Expected explicit null or an empty string for a classified condition, or non-empty original text for an unclassified condition.",
        ),
      );
    } else if (condition.conditionCode === null) {
      requiredString(otherConditionText, `${path}.otherConditionText`, issues);
    } else {
      enumValue(condition.conditionCode, MedicalConditionCode, `${path}.conditionCode`, issues);
      const hasConflictingOtherText =
        otherConditionText !== undefined &&
        otherConditionText !== null &&
        (typeof otherConditionText !== "string" || otherConditionText !== "");
      if (hasConflictingOtherText) {
        issues.push(
          issue(
            path,
            "MEDICAL_CONDITION_CLASSIFICATION_CONFLICT",
            "Provide either conditionCode or non-empty otherConditionText, never both.",
          ),
        );
      }
    }
    enumValue(condition.stability, Stability, `${path}.stability`, issues);
    stringArray(condition.physicianInstructions, `${path}.physicianInstructions`, issues);
    if (
      condition.unclassifiedInstructionsText !== undefined &&
      condition.unclassifiedInstructionsText !== null
    ) {
      requiredString(condition.unclassifiedInstructionsText, `${path}.unclassifiedInstructionsText`, issues);
    }
  });

  const symptoms = requiredObject(medical.dangerousSymptoms, "medical.dangerousSymptoms", issues);
  rejectUnknownKeys(
    symptoms,
    [
      "chestPainOrPressure",
      "fainting",
      "unusualShortnessOfBreath",
      "abnormalPalpitations",
      "otherDangerousSymptomsPresent",
      "otherDangerousSymptoms",
    ],
    "medical.dangerousSymptoms",
    issues,
  );
  for (const key of [
    "chestPainOrPressure",
    "fainting",
    "unusualShortnessOfBreath",
    "abnormalPalpitations",
    "otherDangerousSymptomsPresent",
  ]) {
    enumValue(symptoms[key], ScreeningAnswer, `medical.dangerousSymptoms.${key}`, issues);
  }
  const otherDangerousSymptoms = stringArray(
    symptoms.otherDangerousSymptoms,
    "medical.dangerousSymptoms.otherDangerousSymptoms",
    issues,
  );
  if (
    symptoms.otherDangerousSymptomsPresent === ScreeningAnswer.NO &&
    otherDangerousSymptoms.length > 0
  ) {
    issues.push(
      issue(
        "medical.dangerousSymptoms.otherDangerousSymptoms",
        "SYMPTOM_DETAIL_CONFLICT",
        "Details cannot be present when otherDangerousSymptomsPresent is NO.",
      ),
    );
  }
  stringArray(medical.medications, "medical.medications", issues);
  enumValue(medical.eatingDisorderHistory, EatingDisorderHistory, "medical.eatingDisorderHistory", issues);
  enumValue(medical.pregnancyStatus, PregnancyStatus, "medical.pregnancyStatus", issues);
  enumValue(medical.menstrualStatus, MenstrualStatus, "medical.menstrualStatus", issues);
  stringArray(medical.unclassifiedText, "medical.unclassifiedText", issues);
}

function validateNutrition(input, issues) {
  const nutrition = requiredObject(input.nutrition, "nutrition", issues);
  rejectUnknownKeys(
    nutrition,
    [
      "preferredMealCount",
      "unavailableEatingWindows",
      "budget",
      "foodStorageAvailable",
      "foodReheatingAvailable",
      "allergies",
      "medicalExclusions",
      "dislikedFoods",
      "intolerances",
      "digestiveIssues",
    ],
    "nutrition",
    issues,
  );
  numberInRange(nutrition.preferredMealCount, "nutrition.preferredMealCount", issues, 1, 8, {
    integer: true,
  });
  const windows = array(nutrition.unavailableEatingWindows, "nutrition.unavailableEatingWindows", issues);
  const normalizedWindows = [];
  windows.forEach((raw, index) => {
    const path = `nutrition.unavailableEatingWindows[${index}]`;
    const window = requiredObject(raw, path, issues);
    rejectUnknownKeys(window, ["start", "end"], path, issues);
    const validStart = typeof window.start === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(window.start);
    const validEnd = typeof window.end === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(window.end);
    if (!validStart) {
      issues.push(issue(`${path}.start`, "INVALID_TIME", "Expected 24-hour time HH:MM."));
    }
    if (!validEnd) {
      issues.push(issue(`${path}.end`, "INVALID_TIME", "Expected 24-hour time HH:MM."));
    }
    if (validStart && validEnd) {
      const [startHour, startMinute] = window.start.split(":").map(Number);
      const [endHour, endMinute] = window.end.split(":").map(Number);
      const start = startHour * 60 + startMinute;
      const end = endHour * 60 + endMinute;
      if (end <= start) {
        issues.push(
          issue(
            path,
            "INVALID_EATING_WINDOW_ORDER",
            "V1 supports same-day windows only; end must be later than start.",
          ),
        );
      } else {
        normalizedWindows.push({ start, end, path });
      }
    }
  });
  normalizedWindows.sort((a, b) => a.start - b.start);
  for (let index = 1; index < normalizedWindows.length; index += 1) {
    if (normalizedWindows[index].start < normalizedWindows[index - 1].end) {
      issues.push(
        issue(
          normalizedWindows[index].path,
          "OVERLAPPING_EATING_WINDOWS",
          "Unavailable eating windows must not overlap.",
        ),
      );
    }
  }
  enumValue(nutrition.budget, BudgetLevel, "nutrition.budget", issues);
  requiredBoolean(nutrition.foodStorageAvailable, "nutrition.foodStorageAvailable", issues);
  requiredBoolean(nutrition.foodReheatingAvailable, "nutrition.foodReheatingAvailable", issues);

  array(nutrition.allergies, "nutrition.allergies", issues).forEach((raw, index) => {
    const path = `nutrition.allergies[${index}]`;
    const allergy = requiredObject(raw, path, issues);
    rejectUnknownKeys(allergy, ["substance", "medicallyConfirmed"], path, issues);
    canonicalId(allergy.substance, `${path}.substance`, issues);
    requiredBoolean(allergy.medicallyConfirmed, `${path}.medicallyConfirmed`, issues);
  });
  array(nutrition.medicalExclusions, "nutrition.medicalExclusions", issues).forEach((raw, index) => {
    const path = `nutrition.medicalExclusions[${index}]`;
    const exclusion = requiredObject(raw, path, issues);
    rejectUnknownKeys(exclusion, ["food", "instruction", "source"], path, issues);
    canonicalId(exclusion.food, `${path}.food`, issues);
    enumValue(exclusion.instruction, MedicalFoodInstruction, `${path}.instruction`, issues);
    enumValue(exclusion.source, RestrictionSource, `${path}.source`, issues);
  });
  const dislikedFoods = stringArray(nutrition.dislikedFoods, "nutrition.dislikedFoods", issues);
  dislikedFoods.forEach((food, index) =>
    canonicalId(food, `nutrition.dislikedFoods[${index}]`, issues),
  );
  array(nutrition.intolerances, "nutrition.intolerances", issues).forEach((raw, index) => {
    const path = `nutrition.intolerances[${index}]`;
    const intolerance = requiredObject(raw, path, issues);
    rejectUnknownKeys(intolerance, ["substance", "severity", "medicallyDiagnosed", "notes"], path, issues);
    canonicalId(intolerance.substance, `${path}.substance`, issues);
    enumValue(intolerance.severity, Severity, `${path}.severity`, issues);
    requiredBoolean(intolerance.medicallyDiagnosed, `${path}.medicallyDiagnosed`, issues);
    if (intolerance.notes !== undefined && intolerance.notes !== null) {
      requiredString(intolerance.notes, `${path}.notes`, issues);
    }
  });
  array(nutrition.digestiveIssues, "nutrition.digestiveIssues", issues).forEach((raw, index) => {
    const path = `nutrition.digestiveIssues[${index}]`;
    const digestiveIssue = requiredObject(raw, path, issues);
    rejectUnknownKeys(digestiveIssue, ["name", "severity"], path, issues);
    canonicalId(digestiveIssue.name, `${path}.name`, issues);
    enumValue(digestiveIssue.severity, Severity, `${path}.severity`, issues);
  });
}

function validateTraining(input, issues) {
  const training = requiredObject(input.training, "training", issues);
  rejectUnknownKeys(
    training,
    [
      "location",
      "equipment",
      "maxDaysPerWeek",
      "preferredDaysPerWeek",
      "trainingScheduleAvailabilityType",
      "availableTrainingDays",
      "unavailableTrainingDays",
      "maxSessionMinutes",
      "experience",
      "recentTraining",
      "injuries",
      "medicalMovementRestrictions",
    ],
    "training",
    issues,
  );
  enumValue(training.location, TrainingLocation, "training.location", issues);
  const equipmentItems = array(training.equipment, "training.equipment", issues);
  const seenEquipmentCodes = new Set();
  equipmentItems.forEach((raw, index) => {
    const path = `training.equipment[${index}]`;
    const equipment = requiredObject(raw, path, issues);
    rejectUnknownKeys(
      equipment,
      ["equipmentCode", "otherEquipmentText", "loadCapacity"],
      path,
      issues,
    );

    const hasEquipmentCode = Object.hasOwn(equipment, "equipmentCode");
    const hasOtherEquipmentText = Object.hasOwn(equipment, "otherEquipmentText");
    const hasLoadCapacity = Object.hasOwn(equipment, "loadCapacity");

    if (!hasEquipmentCode) {
      issues.push(
        issue(
          `${path}.equipmentCode`,
          "REQUIRED_TRAINING_EQUIPMENT_DISCRIMINATOR",
          "Expected a known EquipmentCode or explicit null for unclassified equipment.",
        ),
      );
    }
    if (!hasOtherEquipmentText) {
      issues.push(
        issue(
          `${path}.otherEquipmentText`,
          "REQUIRED_TRAINING_EQUIPMENT_FIELD",
          "Expected explicit null or an empty string for classified equipment, or non-empty original text for unclassified equipment.",
        ),
      );
    }
    if (!hasLoadCapacity) {
      issues.push(
        issue(
          `${path}.loadCapacity`,
          "REQUIRED_TRAINING_EQUIPMENT_LOAD_CAPACITY",
          "Expected an explicit load capacity compatible with the equipment classification route.",
        ),
      );
    }

    if (!hasEquipmentCode) return;

    if (equipment.equipmentCode === null) {
      if (hasOtherEquipmentText) {
        requiredString(equipment.otherEquipmentText, `${path}.otherEquipmentText`, issues);
      }
      if (hasLoadCapacity) {
        allowedEnumValue(
          equipment.loadCapacity,
          OTHER_EQUIPMENT_LOAD_CAPACITIES,
          `${path}.loadCapacity`,
          issues,
        );
      }
      return;
    }

    enumValue(equipment.equipmentCode, EquipmentCode, `${path}.equipmentCode`, issues);
    const knownEquipmentCode = enumValues(EquipmentCode).includes(equipment.equipmentCode);
    if (knownEquipmentCode) {
      if (seenEquipmentCodes.has(equipment.equipmentCode)) {
        issues.push(
          issue(
            `${path}.equipmentCode`,
            "DUPLICATE_TRAINING_EQUIPMENT_CODE",
            "Each EquipmentCode may appear only once in training.equipment.",
          ),
        );
      } else {
        seenEquipmentCodes.add(equipment.equipmentCode);
      }
    }

    if (
      hasOtherEquipmentText &&
      equipment.otherEquipmentText !== null &&
      equipment.otherEquipmentText !== ""
    ) {
      issues.push(
        issue(
          path,
          "TRAINING_EQUIPMENT_CLASSIFICATION_CONFLICT",
          "Provide either equipmentCode or non-empty otherEquipmentText, never both.",
        ),
      );
    }

    if (!hasLoadCapacity) return;
    if (equipment.equipmentCode === EquipmentCode.BODYWEIGHT) {
      allowedEnumValue(
        equipment.loadCapacity,
        [EquipmentLoadCapacity.BODYWEIGHT_ONLY],
        `${path}.loadCapacity`,
        issues,
      );
    } else if (knownEquipmentCode) {
      allowedEnumValue(
        equipment.loadCapacity,
        STANDARD_EQUIPMENT_LOAD_CAPACITIES,
        `${path}.loadCapacity`,
        issues,
      );
    } else {
      enumValue(
        equipment.loadCapacity,
        EquipmentLoadCapacity,
        `${path}.loadCapacity`,
        issues,
      );
    }
  });
  if (
    [TrainingLocation.HOME, TrainingLocation.MIXED].includes(training.location) &&
    equipmentItems.length === 0
  ) {
    issues.push(
      issue(
        "training.equipment",
        training.location === TrainingLocation.HOME
          ? "HOME_TRAINING_EQUIPMENT_REQUIRED"
          : "MIXED_HOME_TRAINING_EQUIPMENT_REQUIRED",
        `${training.location} training requires at least one explicitly reported home-training capability.`,
      ),
    );
  }
  numberInRange(training.maxDaysPerWeek, "training.maxDaysPerWeek", issues, 2, 6, { integer: true });
  numberInRange(training.preferredDaysPerWeek, "training.preferredDaysPerWeek", issues, 2, 6, {
    integer: true,
  });
  if (
    Number.isInteger(training.maxDaysPerWeek) &&
    training.maxDaysPerWeek >= 1 &&
    training.maxDaysPerWeek <= 7 &&
    Number.isInteger(training.preferredDaysPerWeek) &&
    training.preferredDaysPerWeek >= 1 &&
    training.preferredDaysPerWeek <= 7 &&
    training.preferredDaysPerWeek > training.maxDaysPerWeek
  ) {
    issues.push(
      issue(
        "training.preferredDaysPerWeek",
        "PREFERRED_TRAINING_DAYS_EXCEED_MAX",
        "Preferred training days must not exceed the client's maximum training days.",
      ),
    );
  }

  enumValue(
    training.trainingScheduleAvailabilityType,
    TrainingScheduleAvailabilityType,
    "training.trainingScheduleAvailabilityType",
    issues,
  );
  const available = dayArray(
    training.availableTrainingDays,
    "training.availableTrainingDays",
    issues,
  );
  const unavailable = dayArray(
    training.unavailableTrainingDays,
    "training.unavailableTrainingDays",
    issues,
  );
  const overlap = available.filter((day) => unavailable.includes(day));
  if (overlap.length > 0) {
    issues.push(
      issue(
        "training.availableTrainingDays",
        "DAY_AVAILABILITY_CONFLICT",
        `Days cannot be both available and unavailable: ${overlap.join(", ")}.`,
      ),
    );
  }

  const knownWeekdays = enumValues(DayOfWeek);
  const validAvailableDays = new Set(available.filter((day) => knownWeekdays.includes(day)));
  const validUnavailableDays = new Set(unavailable.filter((day) => knownWeekdays.includes(day)));
  const viableFixedAvailableDays = [...validAvailableDays].filter(
    (day) => !validUnavailableDays.has(day),
  );
  switch (training.trainingScheduleAvailabilityType) {
    case TrainingScheduleAvailabilityType.FIXED_AVAILABLE_DAYS:
      if (unavailable.length > 0) {
        issues.push(
          issue(
            "training.unavailableTrainingDays",
            "TRAINING_SCHEDULE_FIELD_CONFLICT",
            "FIXED_AVAILABLE_DAYS must have empty unavailableTrainingDays.",
          ),
        );
      }
      if (available.length < 2) {
        issues.push(
          issue(
            "training.availableTrainingDays",
            "REQUIRED_AVAILABLE_TRAINING_DAYS",
            "FIXED_AVAILABLE_DAYS requires at least two available training days.",
          ),
        );
      }
      if (viableFixedAvailableDays.length < 2) {
        issues.push(
          issue(
            "training.availableTrainingDays",
            "NO_VIABLE_TRAINING_DAYS",
            "The fixed available-day schedule does not contain at least two viable training days.",
          ),
        );
      }
      break;
    case TrainingScheduleAvailabilityType.FIXED_UNAVAILABLE_DAYS:
      if (available.length > 0) {
        issues.push(
          issue(
            "training.availableTrainingDays",
            "TRAINING_SCHEDULE_FIELD_CONFLICT",
            "FIXED_UNAVAILABLE_DAYS must have empty availableTrainingDays.",
          ),
        );
      }
      if (unavailable.length === 0) {
        issues.push(
          issue(
            "training.unavailableTrainingDays",
            "REQUIRED_UNAVAILABLE_TRAINING_DAYS",
            "FIXED_UNAVAILABLE_DAYS requires at least one unavailable training day.",
          ),
        );
      }
      if (knownWeekdays.length - validUnavailableDays.size < 2) {
        issues.push(
          issue(
            "training.unavailableTrainingDays",
            "ALL_TRAINING_DAYS_UNAVAILABLE",
            "At least two weekdays must remain available for training.",
          ),
        );
        issues.push(
          issue(
            "training.unavailableTrainingDays",
            "NO_VIABLE_TRAINING_DAYS",
            "The fixed unavailable-day schedule leaves fewer than two viable training days.",
          ),
        );
      }
      break;
    case TrainingScheduleAvailabilityType.VARIABLE:
    case TrainingScheduleAvailabilityType.FLEXIBLE:
      if (available.length > 0) {
        issues.push(
          issue(
            "training.availableTrainingDays",
            "TRAINING_SCHEDULE_FIELD_CONFLICT",
            `${training.trainingScheduleAvailabilityType} must have empty availableTrainingDays.`,
          ),
        );
      }
      if (unavailable.length > 0) {
        issues.push(
          issue(
            "training.unavailableTrainingDays",
            "TRAINING_SCHEDULE_FIELD_CONFLICT",
            `${training.trainingScheduleAvailabilityType} must have empty unavailableTrainingDays.`,
          ),
        );
      }
      break;
    default:
      break;
  }
  numberInRange(training.maxSessionMinutes, "training.maxSessionMinutes", issues, 1, 300, {
    integer: true,
  });
  enumValue(training.experience, TrainingExperience, "training.experience", issues);
  enumValue(training.recentTraining, RecentTraining, "training.recentTraining", issues);

  array(training.injuries, "training.injuries", issues).forEach((raw, index) => {
    const path = `training.injuries[${index}]`;
    const injury = requiredObject(raw, path, issues);
    rejectUnknownKeys(
      injury,
      [
        "area",
        "painLevel",
        "movementImpact",
        "worsening",
        "numbnessOrWeakness",
        "affectedMovements",
        "medicalRestrictions",
      ],
      path,
      issues,
    );
    requiredString(injury.area, `${path}.area`, issues);
    numberInRange(injury.painLevel, `${path}.painLevel`, issues, 0, 10);
    enumValue(injury.movementImpact, MovementImpact, `${path}.movementImpact`, issues);
    requiredBoolean(injury.worsening, `${path}.worsening`, issues);
    requiredBoolean(injury.numbnessOrWeakness, `${path}.numbnessOrWeakness`, issues);
    const affectedMovements = array(injury.affectedMovements, `${path}.affectedMovements`, issues);
    affectedMovements.forEach((movement, movementIndex) =>
      enumValue(movement, Movement, `${path}.affectedMovements[${movementIndex}]`, issues),
    );
    array(injury.medicalRestrictions, `${path}.medicalRestrictions`, issues).forEach(
      (rawRestriction, restrictionIndex) => {
        const restrictionPath = `${path}.medicalRestrictions[${restrictionIndex}]`;
        const restriction = requiredObject(rawRestriction, restrictionPath, issues);
        rejectUnknownKeys(restriction, ["movement", "instruction", "source"], restrictionPath, issues);
        enumValue(restriction.movement, Movement, `${restrictionPath}.movement`, issues);
        enumValue(
          restriction.instruction,
          RestrictionInstruction,
          `${restrictionPath}.instruction`,
          issues,
        );
        enumValue(restriction.source, RestrictionSource, `${restrictionPath}.source`, issues);
      },
    );
  });

  array(training.medicalMovementRestrictions, "training.medicalMovementRestrictions", issues).forEach(
    (raw, index) => {
      const path = `training.medicalMovementRestrictions[${index}]`;
      const restriction = requiredObject(raw, path, issues);
      rejectUnknownKeys(restriction, ["movement", "instruction", "source"], path, issues);
      enumValue(restriction.movement, Movement, `${path}.movement`, issues);
      enumValue(restriction.instruction, RestrictionInstruction, `${path}.instruction`, issues);
      enumValue(restriction.source, RestrictionSource, `${path}.source`, issues);
    },
  );
}

function validateCardio(input, issues) {
  const cardio = requiredObject(input.cardio, "cardio", issues);
  rejectUnknownKeys(
    cardio,
    ["additionalSports", "averageDailySteps", "walkingAbility", "maxSessionsPerWeek", "maxDurationMinutes"],
    "cardio",
    issues,
  );
  array(cardio.additionalSports, "cardio.additionalSports", issues).forEach((raw, index) => {
    const path = `cardio.additionalSports[${index}]`;
    const sport = requiredObject(raw, path, issues);
    rejectUnknownKeys(sport, ["name", "daysPerWeek", "minutesPerSession", "intensity"], path, issues);
    requiredString(sport.name, `${path}.name`, issues);
    numberInRange(sport.daysPerWeek, `${path}.daysPerWeek`, issues, 0, 7, { integer: true });
    numberInRange(sport.minutesPerSession, `${path}.minutesPerSession`, issues, 0, 300, {
      integer: true,
    });
    enumValue(sport.intensity, SportIntensity, `${path}.intensity`, issues);
    if (sport.daysPerWeek > 0 && sport.minutesPerSession === 0) {
      issues.push(
        issue(
          `${path}.minutesPerSession`,
          "ZERO_DURATION_ACTIVE_SPORT",
          "A sport with one or more weekly days must have a positive session duration.",
        ),
      );
    }
  });
  numberInRange(cardio.averageDailySteps, "cardio.averageDailySteps", issues, 0, 100000, {
    integer: true,
    nullable: true,
  });
  enumValue(cardio.walkingAbility, WalkingAbility, "cardio.walkingAbility", issues);
  numberInRange(cardio.maxSessionsPerWeek, "cardio.maxSessionsPerWeek", issues, 0, 7, {
    integer: true,
  });
  numberInRange(cardio.maxDurationMinutes, "cardio.maxDurationMinutes", issues, 0, 300, {
    integer: true,
  });
}

export function validateIntake(input, context) {
  const issues = [];
  if (!isPlainObject(input)) {
    return { valid: false, issues: [issue("$", "REQUIRED_OBJECT", "Expected intake to be an object.")] };
  }

  rejectUnknownKeys(
    input,
    ["personal", "goals", "body", "lifestyle", "medical", "nutrition", "training", "cardio", "unclassifiedNotes"],
    "$",
    issues,
  );

  if (!validIsoDate(context?.assessmentDate)) {
    issues.push(
      issue(
        "context.assessmentDate",
        "INVALID_DATE",
        "Expected a trusted evaluation-context ISO date (YYYY-MM-DD).",
      ),
    );
  }
  validatePersonal(input, context?.assessmentDate, issues);
  validateGoals(input, issues);
  validateBody(input, issues);
  validateLifestyle(input, issues);
  validateMedical(input, issues);
  validateNutrition(input, issues);
  validateTraining(input, issues);
  validateCardio(input, issues);
  if (input.unclassifiedNotes !== undefined) {
    stringArray(input.unclassifiedNotes, "unclassifiedNotes", issues);
  }

  return { valid: issues.length === 0, issues };
}

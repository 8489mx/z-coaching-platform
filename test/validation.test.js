import assert from "node:assert/strict";
import test from "node:test";

import {
  DayOfWeek,
  EquipmentCode,
  EquipmentLoadCapacity,
  IntakeValidationError,
  MedicalConditionCode,
  TrainingLocation,
  TrainingScheduleAvailabilityType,
  evaluateIntake,
  validateIntake,
} from "../src/intake-decision-engine/index.js";
import { ASSESSMENT_CONTEXT, completeIntake } from "./fixtures/complete-intake.js";

test("valid fixture passes schema validation", () => {
  assert.deepEqual(validateIntake(completeIntake(), ASSESSMENT_CONTEXT), { valid: true, issues: [] });
});

test("ageYears is rejected as UNKNOWN_FIELD", () => {
  const input = completeIntake();
  input.personal.ageYears = 36;
  const validation = validateIntake(input, ASSESSMENT_CONTEXT);
  assert.equal(validation.valid, false);
  assert.ok(validation.issues.some((item) => item.code === "UNKNOWN_FIELD" && item.path === "personal.ageYears"));
  assert.throws(() => evaluateIntake(input, ASSESSMENT_CONTEXT), IntakeValidationError);
});

test("missing dateOfBirth is rejected", () => {
  const input = completeIntake();
  delete input.personal.dateOfBirth;
  const validation = validateIntake(input, ASSESSMENT_CONTEXT);
  assert.equal(validation.valid, false);
  assert.throws(() => evaluateIntake(input, ASSESSMENT_CONTEXT), IntakeValidationError);
});

test("dateOfBirth after assessmentDate is rejected", () => {
  const input = completeIntake({ personal: { dateOfBirth: "2050-01-01" } });
  const validation = validateIntake(input, ASSESSMENT_CONTEXT);
  assert.equal(validation.valid, false);
  assert.ok(validation.issues.some((item) => item.code === "FUTURE_BIRTH_DATE"));
  assert.throws(() => evaluateIntake(input, ASSESSMENT_CONTEXT), IntakeValidationError);
});

test("validation rejects coercion and out-of-range capacity", () => {
  const input = completeIntake({
    training: { maxDaysPerWeek: "3" },
    cardio: { maxSessionsPerWeek: 8 },
  });
  const validation = validateIntake(input, ASSESSMENT_CONTEXT);
  assert.equal(validation.valid, false);
  assert.ok(validation.issues.some((item) => item.path === "training.maxDaysPerWeek"));
  assert.ok(validation.issues.some((item) => item.path === "cardio.maxSessionsPerWeek"));
});

test("contradictory fixed days are rejected instead of silently resolved (when both present)", () => {
  const input = completeIntake({
    training: {
      trainingScheduleAvailabilityType: TrainingScheduleAvailabilityType.FIXED_AVAILABLE_DAYS,
      availableTrainingDays: [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY],
      unavailableTrainingDays: [DayOfWeek.MONDAY],
    },
  });
  const validation = validateIntake(input, ASSESSMENT_CONTEXT);
  assert.equal(validation.valid, false);
  assert.ok(validation.issues.some((item) => item.code === "DAY_AVAILABILITY_CONFLICT"));
  assert.ok(validation.issues.some((item) => item.code === "TRAINING_SCHEDULE_FIELD_CONFLICT"));
  assert.ok(validation.issues.every((item) => item.code !== "UNKNOWN_FIELD"));
});

test("training weekdays must be known and unique", () => {
  const input = completeIntake({
    training: {
      availableTrainingDays: [DayOfWeek.MONDAY, DayOfWeek.MONDAY, "FUNDAY"],
    },
  });
  const validation = validateIntake(input, ASSESSMENT_CONTEXT);
  assert.equal(validation.valid, false);
  assert.ok(
    validation.issues.some(
      (item) => item.path === "training.availableTrainingDays" && item.code === "DUPLICATE_DAY",
    ),
  );
  assert.ok(
    validation.issues.some(
      (item) =>
        item.path === "training.availableTrainingDays[2]" && item.code === "INVALID_ENUM_VALUE",
    ),
  );
});

test("each fixed training-schedule type requires its authoritative list", () => {
  const cases = [
    {
      trainingScheduleAvailabilityType:
        TrainingScheduleAvailabilityType.FIXED_AVAILABLE_DAYS,
      availableTrainingDays: [],
      unavailableTrainingDays: [],
      expectedCode: "REQUIRED_AVAILABLE_TRAINING_DAYS",
    },
    {
      trainingScheduleAvailabilityType:
        TrainingScheduleAvailabilityType.FIXED_UNAVAILABLE_DAYS,
      availableTrainingDays: [],
      unavailableTrainingDays: [],
      expectedCode: "REQUIRED_UNAVAILABLE_TRAINING_DAYS",
    },
  ];

  for (const training of cases) {
    const input = completeIntake({ training });
    const validation = validateIntake(input, ASSESSMENT_CONTEXT);
    assert.equal(validation.valid, false);
    assert.ok(validation.issues.some((item) => item.code === training.expectedCode));
    assert.throws(() => evaluateIntake(input, ASSESSMENT_CONTEXT), IntakeValidationError);
  }
});

test("leaving fewer than two viable training days is rejected", () => {
  const input = completeIntake({
    training: {
      trainingScheduleAvailabilityType:
        TrainingScheduleAvailabilityType.FIXED_UNAVAILABLE_DAYS,
      availableTrainingDays: [],
      unavailableTrainingDays: Object.values(DayOfWeek).slice(0, 6),
    },
  });
  const validation = validateIntake(input, ASSESSMENT_CONTEXT);
  assert.equal(validation.valid, false);
  assert.ok(validation.issues.some((item) => item.code === "ALL_TRAINING_DAYS_UNAVAILABLE"));
  assert.ok(validation.issues.some((item) => item.code === "NO_VIABLE_TRAINING_DAYS"));
  assert.throws(() => evaluateIntake(input, ASSESSMENT_CONTEXT), IntakeValidationError);
});

test("preferred training days cannot exceed maximum capacity", () => {
  const input = completeIntake({ training: { maxDaysPerWeek: 3, preferredDaysPerWeek: 4 } });
  const validation = validateIntake(input, ASSESSMENT_CONTEXT);
  assert.equal(validation.valid, false);
  assert.ok(
    validation.issues.some((item) => item.code === "PREFERRED_TRAINING_DAYS_EXCEED_MAX"),
  );
});

test("weekly training capacity must stay in the supported 2-6 range", () => {
  for (const maxDaysPerWeek of [1, 7]) {
    const input = completeIntake({ training: { maxDaysPerWeek, preferredDaysPerWeek: maxDaysPerWeek } });
    const validation = validateIntake(input, ASSESSMENT_CONTEXT);
    assert.equal(validation.valid, false);
    assert.ok(
      validation.issues.some(
        (item) =>
          item.path === "training.maxDaysPerWeek" && item.code === "NUMBER_OUT_OF_RANGE",
      ),
    );
    assert.throws(() => evaluateIntake(input, ASSESSMENT_CONTEXT), IntakeValidationError);
  }
});

test("preferred training-day count must be at least 2", () => {
  const input = completeIntake({ training: { preferredDaysPerWeek: 1 } });
  const validation = validateIntake(input, ASSESSMENT_CONTEXT);
  assert.equal(validation.valid, false);
  assert.ok(
    validation.issues.some(
      (item) =>
        item.path === "training.preferredDaysPerWeek" &&
        item.code === "NUMBER_OUT_OF_RANGE",
    ),
  );
  assert.throws(() => evaluateIntake(input, ASSESSMENT_CONTEXT), IntakeValidationError);
});

test("variable and flexible schedules reject contradictory fixed-weekday data", () => {
  for (const trainingScheduleAvailabilityType of [
    TrainingScheduleAvailabilityType.VARIABLE,
    TrainingScheduleAvailabilityType.FLEXIBLE,
  ]) {
    const input = completeIntake({
      training: {
        trainingScheduleAvailabilityType,
        availableTrainingDays: [DayOfWeek.MONDAY],
        unavailableTrainingDays: [],
      },
    });
    const validation = validateIntake(input, ASSESSMENT_CONTEXT);
    assert.equal(validation.valid, false);
    assert.ok(
      validation.issues.some((item) => item.code === "TRAINING_SCHEDULE_FIELD_CONFLICT"),
    );
  }
});

test("fixed availability types reject opposite arrays", () => {
  const inputAvailable = completeIntake({
    training: {
      trainingScheduleAvailabilityType: TrainingScheduleAvailabilityType.FIXED_AVAILABLE_DAYS,
      availableTrainingDays: [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY],
      unavailableTrainingDays: [DayOfWeek.FRIDAY],
    },
  });
  const valAvailable = validateIntake(inputAvailable, ASSESSMENT_CONTEXT);
  assert.equal(valAvailable.valid, false);
  assert.ok(valAvailable.issues.some((item) => item.code === "TRAINING_SCHEDULE_FIELD_CONFLICT"));

  const inputUnavailable = completeIntake({
    training: {
      trainingScheduleAvailabilityType: TrainingScheduleAvailabilityType.FIXED_UNAVAILABLE_DAYS,
      availableTrainingDays: [DayOfWeek.FRIDAY],
      unavailableTrainingDays: [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY],
    },
  });
  const valUnavailable = validateIntake(inputUnavailable, ASSESSMENT_CONTEXT);
  assert.equal(valUnavailable.valid, false);
  assert.ok(valUnavailable.issues.some((item) => item.code === "TRAINING_SCHEDULE_FIELD_CONFLICT"));
});

test("fixed available days must have at least 2 days", () => {
  const input = completeIntake({
    training: {
      trainingScheduleAvailabilityType: TrainingScheduleAvailabilityType.FIXED_AVAILABLE_DAYS,
      availableTrainingDays: [DayOfWeek.MONDAY],
      unavailableTrainingDays: [],
    },
  });
  const validation = validateIntake(input, ASSESSMENT_CONTEXT);
  assert.equal(validation.valid, false);
  assert.ok(validation.issues.some((item) => item.code === "REQUIRED_AVAILABLE_TRAINING_DAYS"));
});

test("legacy and hidden training schedule fields are rejected rather than interpreted", () => {
  const input = completeIntake();
  input.training.availableDays = [DayOfWeek.SUNDAY];
  input.training.scheduleMode = "SESSION_SEQUENCE";
  const validation = validateIntake(input, ASSESSMENT_CONTEXT);
  assert.equal(validation.valid, false);
  assert.ok(
    validation.issues.some(
      (item) => item.path === "training.availableDays" && item.code === "UNKNOWN_FIELD",
    ),
  );
  assert.ok(
    validation.issues.some(
      (item) => item.path === "training.scheduleMode" && item.code === "UNKNOWN_FIELD",
    ),
  );
  assert.throws(() => evaluateIntake(input, ASSESSMENT_CONTEXT), IntakeValidationError);
});

test("home training rejects an empty equipment list without inferring bodyweight", () => {
  const input = completeIntake({
    training: { location: TrainingLocation.HOME, equipment: [] },
  });
  const validation = validateIntake(input, ASSESSMENT_CONTEXT);

  assert.equal(validation.valid, false);
  assert.ok(
    validation.issues.some(
      (item) =>
        item.path === "training.equipment" &&
        item.code === "HOME_TRAINING_EQUIPMENT_REQUIRED",
    ),
  );
  assert.throws(() => evaluateIntake(input, ASSESSMENT_CONTEXT), IntakeValidationError);
});

test("mixed training rejects an empty list because home capability must be explicit", () => {
  const input = completeIntake({
    training: { location: TrainingLocation.MIXED, equipment: [] },
  });
  const validation = validateIntake(input, ASSESSMENT_CONTEXT);

  assert.equal(validation.valid, false);
  assert.ok(
    validation.issues.some(
      (item) =>
        item.path === "training.equipment" &&
        item.code === "MIXED_HOME_TRAINING_EQUIPMENT_REQUIRED",
    ),
  );
  assert.throws(() => evaluateIntake(input, ASSESSMENT_CONTEXT), IntakeValidationError);
});

test("an unknown training equipment code is rejected", () => {
  const input = completeIntake({
    training: {
      equipment: [
        {
          equipmentCode: "UNKNOWN_EQUIPMENT",
          otherEquipmentText: null,
          loadCapacity: EquipmentLoadCapacity.MODERATE,
        },
      ],
    },
  });
  const validation = validateIntake(input, ASSESSMENT_CONTEXT);

  assert.equal(validation.valid, false);
  assert.ok(
    validation.issues.some(
      (item) =>
        item.path === "training.equipment[0].equipmentCode" &&
        item.code === "INVALID_ENUM_VALUE",
    ),
  );
  assert.throws(() => evaluateIntake(input, ASSESSMENT_CONTEXT), IntakeValidationError);
});

test("the legacy training equipment name field is rejected as unknown", () => {
  const input = completeIntake({
    training: {
      equipment: [
        {
          equipmentCode: EquipmentCode.DUMBBELLS,
          otherEquipmentText: null,
          loadCapacity: EquipmentLoadCapacity.LIGHT,
          name: "DUMBBELLS",
        },
      ],
    },
  });
  const validation = validateIntake(input, ASSESSMENT_CONTEXT);

  assert.equal(validation.valid, false);
  assert.ok(
    validation.issues.some(
      (item) =>
        item.path === "training.equipment[0].name" && item.code === "UNKNOWN_FIELD",
    ),
  );
  assert.throws(() => evaluateIntake(input, ASSESSMENT_CONTEXT), IntakeValidationError);
});

test("training equipment cannot provide equipmentCode and free text together", () => {
  const input = completeIntake({
    training: {
      equipment: [
        {
          equipmentCode: EquipmentCode.DUMBBELLS,
          otherEquipmentText: "Client-entered dumbbells",
          loadCapacity: EquipmentLoadCapacity.MODERATE,
        },
      ],
    },
  });
  const validation = validateIntake(input, ASSESSMENT_CONTEXT);

  assert.equal(validation.valid, false);
  assert.ok(
    validation.issues.some(
      (item) => item.code === "TRAINING_EQUIPMENT_CLASSIFICATION_CONFLICT",
    ),
  );
  assert.throws(() => evaluateIntake(input, ASSESSMENT_CONTEXT), IntakeValidationError);
});

test("training equipment must provide one non-empty classification route", () => {
  const input = completeIntake({
    training: {
      equipment: [
        {
          loadCapacity: EquipmentLoadCapacity.NOT_APPLICABLE,
        },
      ],
    },
  });
  const validation = validateIntake(input, ASSESSMENT_CONTEXT);

  assert.equal(validation.valid, false);
  assert.ok(
    validation.issues.some(
      (item) =>
        item.path === "training.equipment[0].equipmentCode" &&
        item.code === "REQUIRED_TRAINING_EQUIPMENT_DISCRIMINATOR",
    ),
  );
  assert.ok(
    validation.issues.some(
      (item) =>
        item.path === "training.equipment[0].otherEquipmentText" &&
        item.code === "REQUIRED_TRAINING_EQUIPMENT_FIELD",
    ),
  );
  assert.throws(() => evaluateIntake(input, ASSESSMENT_CONTEXT), IntakeValidationError);
});

test("blank free-text training equipment is rejected", () => {
  const input = completeIntake({
    training: {
      equipment: [
        {
          equipmentCode: null,
          otherEquipmentText: "   ",
          loadCapacity: EquipmentLoadCapacity.NOT_APPLICABLE,
        },
      ],
    },
  });
  const validation = validateIntake(input, ASSESSMENT_CONTEXT);

  assert.equal(validation.valid, false);
  assert.ok(
    validation.issues.some(
      (item) =>
        item.path === "training.equipment[0].otherEquipmentText" &&
        item.code === "REQUIRED_STRING",
    ),
  );
  assert.throws(() => evaluateIntake(input, ASSESSMENT_CONTEXT), IntakeValidationError);
});

test("bodyweight equipment accepts only BODYWEIGHT_ONLY load capacity", () => {
  const input = completeIntake({
    training: {
      equipment: [
        {
          equipmentCode: EquipmentCode.BODYWEIGHT,
          otherEquipmentText: null,
          loadCapacity: EquipmentLoadCapacity.LIGHT,
        },
      ],
    },
  });
  const validation = validateIntake(input, ASSESSMENT_CONTEXT);

  assert.equal(validation.valid, false);
  assert.ok(
    validation.issues.some(
      (item) =>
        item.path === "training.equipment[0].loadCapacity" &&
        item.code === "INVALID_ENUM_VALUE",
    ),
  );
  assert.throws(() => evaluateIntake(input, ASSESSMENT_CONTEXT), IntakeValidationError);
});

test("non-bodyweight and free-text equipment reject incompatible load capacities", () => {
  const cases = [
    {
      equipmentCode: EquipmentCode.DUMBBELLS,
      otherEquipmentText: null,
      loadCapacity: EquipmentLoadCapacity.BODYWEIGHT_ONLY,
    },
    {
      equipmentCode: EquipmentCode.DUMBBELLS,
      otherEquipmentText: "",
      loadCapacity: EquipmentLoadCapacity.NOT_APPLICABLE,
    },
    {
      equipmentCode: null,
      otherEquipmentText: "Client equipment",
      loadCapacity: EquipmentLoadCapacity.BODYWEIGHT_ONLY,
    },
  ];

  for (const equipment of cases) {
    const input = completeIntake({ training: { equipment: [equipment] } });
    const validation = validateIntake(input, ASSESSMENT_CONTEXT);
    assert.equal(validation.valid, false);
    assert.ok(
      validation.issues.some(
        (item) =>
          item.path === "training.equipment[0].loadCapacity" &&
          item.code === "INVALID_ENUM_VALUE",
      ),
    );
    assert.throws(() => evaluateIntake(input, ASSESSMENT_CONTEXT), IntakeValidationError);
  }
});

test("duplicate structured training equipment codes are rejected", () => {
  const input = completeIntake({
    training: {
      equipment: [
        {
          equipmentCode: EquipmentCode.DUMBBELLS,
          otherEquipmentText: null,
          loadCapacity: EquipmentLoadCapacity.LIGHT,
        },
        {
          equipmentCode: EquipmentCode.DUMBBELLS,
          otherEquipmentText: "",
          loadCapacity: EquipmentLoadCapacity.HEAVY,
        },
      ],
    },
  });
  const validation = validateIntake(input, ASSESSMENT_CONTEXT);

  assert.equal(validation.valid, false);
  assert.ok(
    validation.issues.some(
      (item) =>
        item.path === "training.equipment[1].equipmentCode" &&
        item.code === "DUPLICATE_TRAINING_EQUIPMENT_CODE",
    ),
  );
  assert.throws(() => evaluateIntake(input, ASSESSMENT_CONTEXT), IntakeValidationError);
});

test("each training equipment item requires all three explicit contract fields", () => {
  const cases = [
    {
      item: {
        equipmentCode: EquipmentCode.DUMBBELLS,
        loadCapacity: EquipmentLoadCapacity.LIGHT,
      },
      path: "training.equipment[0].otherEquipmentText",
      code: "REQUIRED_TRAINING_EQUIPMENT_FIELD",
    },
    {
      item: {
        otherEquipmentText: "Client equipment",
        loadCapacity: EquipmentLoadCapacity.NOT_APPLICABLE,
      },
      path: "training.equipment[0].equipmentCode",
      code: "REQUIRED_TRAINING_EQUIPMENT_DISCRIMINATOR",
    },
    {
      item: {
        equipmentCode: null,
        otherEquipmentText: "Client equipment",
      },
      path: "training.equipment[0].loadCapacity",
      code: "REQUIRED_TRAINING_EQUIPMENT_LOAD_CAPACITY",
    },
  ];

  for (const testCase of cases) {
    const input = completeIntake({ training: { equipment: [testCase.item] } });
    const validation = validateIntake(input, ASSESSMENT_CONTEXT);
    assert.equal(validation.valid, false);
    assert.ok(
      validation.issues.some(
        (item) => item.path === testCase.path && item.code === testCase.code,
      ),
    );
    assert.throws(() => evaluateIntake(input, ASSESSMENT_CONTEXT), IntakeValidationError);
  }
});

test("BODYWEIGHT cannot appear more than once", () => {
  const bodyweight = {
    equipmentCode: EquipmentCode.BODYWEIGHT,
    otherEquipmentText: null,
    loadCapacity: EquipmentLoadCapacity.BODYWEIGHT_ONLY,
  };
  const input = completeIntake({
    training: { equipment: [bodyweight, { ...bodyweight, otherEquipmentText: "" }] },
  });
  const validation = validateIntake(input, ASSESSMENT_CONTEXT);

  assert.equal(validation.valid, false);
  assert.ok(
    validation.issues.some(
      (item) =>
        item.path === "training.equipment[1].equipmentCode" &&
        item.code === "DUPLICATE_TRAINING_EQUIPMENT_CODE",
    ),
  );
  assert.throws(() => evaluateIntake(input, ASSESSMENT_CONTEXT), IntakeValidationError);
});

test("trusted evaluation context is required and cannot be supplied inside client data", () => {
  const input = completeIntake();
  assert.throws(() => evaluateIntake(input), IntakeValidationError);
  input.assessmentDate = "2030-07-14";
  const validation = validateIntake(input, ASSESSMENT_CONTEXT);
  assert.equal(validation.valid, false);
  assert.ok(validation.issues.some((item) => item.code === "UNKNOWN_FIELD" && item.path === "assessmentDate"));
});

test("unknown medical fields are rejected so safety text cannot disappear", () => {
  const input = completeIntake({ medical: { otherConditionText: "chest pain" } });
  const validation = validateIntake(input, ASSESSMENT_CONTEXT);
  assert.equal(validation.valid, false);
  assert.ok(validation.issues.some((item) => item.path === "medical.otherConditionText"));
});

test("other-dangerous-symptom details cannot contradict a NO answer", () => {
  const input = completeIntake({
    medical: {
      dangerousSymptoms: {
        otherDangerousSymptomsPresent: "NO",
        otherDangerousSymptoms: ["SEVERE_DIZZINESS"],
      },
    },
  });
  const validation = validateIntake(input, ASSESSMENT_CONTEXT);
  assert.equal(validation.valid, false);
  assert.ok(validation.issues.some((item) => item.code === "SYMPTOM_DETAIL_CONFLICT"));
});

test("a reported condition must explicitly provide [] when there are no physician instructions", () => {
  const input = completeIntake({
    medical: {
      conditions: [
        {
          conditionCode: MedicalConditionCode.ASTHMA_OR_RESPIRATORY_CONDITION,
          otherConditionText: null,
          stability: "STABLE",
        },
      ],
    },
  });
  const validation = validateIntake(input, ASSESSMENT_CONTEXT);
  assert.equal(validation.valid, false);
  assert.ok(
    validation.issues.some(
      (item) => item.path === "medical.conditions[0].physicianInstructions" && item.code === "REQUIRED_ARRAY",
    ),
  );
});

test("an unknown medical condition code is rejected", () => {
  const input = completeIntake({
    medical: {
      conditions: [
        {
          conditionCode: "UNKNOWN_CONDITION",
          otherConditionText: null,
          stability: "STABLE",
          physicianInstructions: [],
          unclassifiedInstructionsText: null,
        },
      ],
    },
  });
  const validation = validateIntake(input, ASSESSMENT_CONTEXT);

  assert.equal(validation.valid, false);
  assert.ok(
    validation.issues.some(
      (item) =>
        item.path === "medical.conditions[0].conditionCode" &&
        item.code === "INVALID_ENUM_VALUE",
    ),
  );
  assert.throws(() => evaluateIntake(input, ASSESSMENT_CONTEXT), IntakeValidationError);
});

test("a medical condition cannot provide conditionCode and otherConditionText together", () => {
  const input = completeIntake({
    medical: {
      conditions: [
        {
          conditionCode: MedicalConditionCode.THYROID_CONDITION,
          otherConditionText: "Original client text",
          stability: "STABLE",
          physicianInstructions: [],
          unclassifiedInstructionsText: null,
        },
      ],
    },
  });
  const validation = validateIntake(input, ASSESSMENT_CONTEXT);

  assert.equal(validation.valid, false);
  assert.ok(
    validation.issues.some(
      (item) => item.code === "MEDICAL_CONDITION_CLASSIFICATION_CONFLICT",
    ),
  );
  assert.throws(() => evaluateIntake(input, ASSESSMENT_CONTEXT), IntakeValidationError);
});

test("a medical condition must provide one classification route", () => {
  const input = completeIntake({
    medical: {
      conditions: [
        {
          stability: "STABLE",
          physicianInstructions: [],
          unclassifiedInstructionsText: null,
        },
      ],
    },
  });
  const validation = validateIntake(input, ASSESSMENT_CONTEXT);

  assert.equal(validation.valid, false);
  assert.ok(
    validation.issues.some(
      (item) => item.code === "REQUIRED_MEDICAL_CONDITION_DISCRIMINATOR",
    ),
  );
  assert.throws(() => evaluateIntake(input, ASSESSMENT_CONTEXT), IntakeValidationError);

  const missingOtherConditionText = completeIntake({
    medical: {
      conditions: [
        {
          conditionCode: MedicalConditionCode.THYROID_CONDITION,
          stability: "STABLE",
          physicianInstructions: [],
          unclassifiedInstructionsText: null,
        },
      ],
    },
  });
  const missingFieldValidation = validateIntake(
    missingOtherConditionText,
    ASSESSMENT_CONTEXT,
  );
  assert.equal(missingFieldValidation.valid, false);
  assert.ok(
    missingFieldValidation.issues.some(
      (item) =>
        item.path === "medical.conditions[0].otherConditionText" &&
        item.code === "REQUIRED_MEDICAL_CONDITION_FIELD",
    ),
  );
  assert.throws(
    () => evaluateIntake(missingOtherConditionText, ASSESSMENT_CONTEXT),
    IntakeValidationError,
  );
});

test("blank unclassified medical condition text is rejected", () => {
  const input = completeIntake({
    medical: {
      conditions: [
        {
          conditionCode: null,
          otherConditionText: "   ",
          stability: "STABLE",
          physicianInstructions: [],
          unclassifiedInstructionsText: null,
        },
      ],
    },
  });
  const validation = validateIntake(input, ASSESSMENT_CONTEXT);

  assert.equal(validation.valid, false);
  assert.ok(
    validation.issues.some(
      (item) =>
        item.path === "medical.conditions[0].otherConditionText" &&
        item.code === "REQUIRED_STRING",
    ),
  );
  assert.throws(() => evaluateIntake(input, ASSESSMENT_CONTEXT), IntakeValidationError);
});

test("the legacy medical condition name field is rejected as unknown", () => {
  const input = completeIntake({
    medical: {
      conditions: [
        {
          conditionCode: MedicalConditionCode.THYROID_CONDITION,
          otherConditionText: null,
          name: "THYROID_CONDITION",
          stability: "STABLE",
          physicianInstructions: [],
          unclassifiedInstructionsText: null,
        },
      ],
    },
  });
  const validation = validateIntake(input, ASSESSMENT_CONTEXT);

  assert.equal(validation.valid, false);
  assert.ok(
    validation.issues.some(
      (item) =>
        item.path === "medical.conditions[0].name" && item.code === "UNKNOWN_FIELD",
    ),
  );
  assert.throws(() => evaluateIntake(input, ASSESSMENT_CONTEXT), IntakeValidationError);
});

test("medical exclusions and movement restrictions require classified sources and instructions", () => {
  const input = completeIntake({
    nutrition: { medicalExclusions: ["maybe sesame"] },
    training: {
      medicalMovementRestrictions: [{ movement: "ALL_CARDIO", instruction: "DO_MORE", source: "SELF" }],
    },
  });
  const validation = validateIntake(input, ASSESSMENT_CONTEXT);
  assert.equal(validation.valid, false);
  assert.ok(validation.issues.some((item) => item.path === "nutrition.medicalExclusions[0]"));
  assert.ok(validation.issues.some((item) => item.path.endsWith(".instruction")));
  assert.ok(validation.issues.some((item) => item.path.endsWith(".source")));
});

test("an active additional sport cannot report zero session duration", () => {
  const input = completeIntake({
    cardio: {
      additionalSports: [{ name: "FOOTBALL", daysPerWeek: 2, minutesPerSession: 0, intensity: "HIGH" }],
    },
  });
  const validation = validateIntake(input, ASSESSMENT_CONTEXT);
  assert.equal(validation.valid, false);
  assert.ok(validation.issues.some((item) => item.code === "ZERO_DURATION_ACTIVE_SPORT"));
});

test("eating windows must be same-day, positive, and non-overlapping", () => {
  const input = completeIntake({
    nutrition: {
      unavailableEatingWindows: [
        { start: "12:00", end: "11:00" },
        { start: "08:00", end: "10:00" },
        { start: "09:30", end: "11:00" },
      ],
    },
  });
  const validation = validateIntake(input, ASSESSMENT_CONTEXT);
  assert.equal(validation.valid, false);
  assert.ok(validation.issues.some((item) => item.code === "INVALID_EATING_WINDOW_ORDER"));
  assert.ok(validation.issues.some((item) => item.code === "OVERLAPPING_EATING_WINDOWS"));
});

test("unactionable movement restrictions and free-text hard food targets are rejected", () => {
  const input = completeIntake({
    nutrition: {
      allergies: [{ substance: "maybe sesame?", medicallyConfirmed: true }],
      medicalExclusions: [
        { food: "maybe grapefruit", instruction: "EXCLUDE", source: "PHYSICIAN" },
      ],
    },
    training: {
      medicalMovementRestrictions: [
        { movement: "OTHER", instruction: "LIMIT", source: "PHYSICIAN" },
      ],
    },
  });
  const validation = validateIntake(input, ASSESSMENT_CONTEXT);
  assert.equal(validation.valid, false);
  assert.ok(validation.issues.some((item) => item.code === "INVALID_CANONICAL_ID"));
  assert.ok(
    validation.issues.some(
      (item) => item.path.endsWith(".movement") && item.code === "INVALID_ENUM_VALUE",
    ),
  );
  assert.ok(
    validation.issues.some(
      (item) => item.path.endsWith(".instruction") && item.code === "INVALID_ENUM_VALUE",
    ),
  );
});

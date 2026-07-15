import assert from "node:assert/strict";
import test from "node:test";

import {
  CardioStrategy,
  DayOfWeek,
  EatingDisorderHistory,
  EquipmentCode,
  EquipmentLoadCapacity,
  HIGH_PAIN_MEDICAL_REVIEW_THRESHOLD,
  Movement,
  MovementImpact,
  PlanStatus,
  PregnancyStatus,
  PrimaryGoal,
  RecentTraining,
  RestrictionInstruction,
  RestrictionSource,
  ScheduleMode,
  ScreeningAnswer,
  Sex,
  SleepQuality,
  SportIntensity,
  StressLevel,
  TrainingScheduleAvailabilityType,
  TrainingExperience,
  TrainingLocation,
  VolumeStart,
  WorkScheduleType,
  evaluateIntake,
} from "../src/intake-decision-engine/index.js";
import { ASSESSMENT_CONTEXT, completeIntake } from "./fixtures/complete-intake.js";

const hasCode = (items, code) => items.some((item) => item.code === code);
const evaluate = (input) => evaluateIntake(input, ASSESSMENT_CONTEXT);

test("complete healthy adult intake is ready for draft", () => {
  const result = evaluate(completeIntake());
  assert.equal(result.plan_status, PlanStatus.READY_FOR_DRAFT);
  assert.deepEqual(result.review_flags, []);
  assert.equal(result.nutrition_decision.calorie_direction, "MAINTENANCE");
  assert.equal(result.nutrition_decision.confidence, "HIGH");
  assert.equal(result.training_decision.recommended_days, 3);
  assert.equal(result.cardio_decision.strategy, CardioStrategy.NO_ADDITIONAL_CARDIO);
});

test("chest pain during effort requires medical review and withholds activity decisions", () => {
  const input = completeIntake({
    medical: { dangerousSymptoms: { chestPainOrPressure: ScreeningAnswer.YES } },
  });
  const result = evaluate(input);
  assert.equal(result.plan_status, PlanStatus.MEDICAL_REVIEW_REQUIRED);
  assert.ok(hasCode(result.review_flags, "CHEST_PAIN_OR_PRESSURE"));
  assert.equal(result.training_decision.recommended_days, 0);
  assert.equal(result.cardio_decision.strategy, CardioStrategy.REVIEW_REQUIRED);
});

test("minor without guardian consent is blocked from the adult path", () => {
  const input = completeIntake({
    personal: {
      dateOfBirth: "2010-07-15",
      ageYears: 15,
      guardianConsent: false,
    },
  });
  const result = evaluate(input);
  assert.equal(result.plan_status, PlanStatus.BLOCKED);
  assert.ok(hasCode(result.review_flags, "MINOR_WITHOUT_GUARDIAN_CONSENT"));
  assert.equal(result.training_decision.recommended_days, 0);
});

test("pregnancy enters the conservative mandatory medical-review path", () => {
  const input = completeIntake({
    personal: { sex: Sex.FEMALE },
    medical: { pregnancyStatus: PregnancyStatus.PREGNANT },
  });
  const result = evaluate(input);
  assert.equal(result.plan_status, PlanStatus.MEDICAL_REVIEW_REQUIRED);
  assert.ok(hasCode(result.review_flags, "PREGNANCY_OR_BREASTFEEDING_REVIEW"));
  assert.equal(result.nutrition_decision.calorie_direction, "REVIEW_REQUIRED");
});

test("sesame allergy is hard while tuna dislike stays a separate preference", () => {
  const input = completeIntake({
    nutrition: {
      allergies: [{ substance: "SESAME", medicallyConfirmed: true }],
      dislikedFoods: ["TUNA"],
    },
  });
  const result = evaluate(input);
  const allergyConstraint = result.hard_constraints.find(
    (item) => item.code === "FOOD_ALLERGY_EXCLUSION",
  );
  assert.equal(result.plan_status, PlanStatus.READY_FOR_DRAFT);
  assert.deepEqual(allergyConstraint.value, {
    substance: "SESAME",
    medicallyConfirmed: true,
  });
  assert.ok(hasCode(result.nutrition_decision.constraints, "FOOD_ALLERGY_EXCLUSION"));
  assert.equal(hasCode(result.review_flags, "UNCONFIRMED_FOOD_ALLERGY"), false);
  assert.ok(hasCode(result.soft_preferences, "DISLIKED_FOOD_EXCLUSION"));
  assert.ok(hasCode(result.nutrition_decision.constraints, "DISLIKED_FOOD_EXCLUSION"));
  assert.equal(
    result.hard_constraints.some(
      (item) => item.code === "FOOD_ALLERGY_EXCLUSION" && item.value.substance === "TUNA",
    ),
    false,
  );
});

test("multiple disliked foods each appear in nutrition decision constraints", () => {
  const input = completeIntake({
    nutrition: {
      dislikedFoods: ["TUNA", "TOMATO"],
    },
  });
  const result = evaluate(input);
  const dislikes = result.nutrition_decision.constraints.filter(
    (item) => item.code === "DISLIKED_FOOD_EXCLUSION",
  );
  assert.equal(dislikes.length, 2);
  assert.deepEqual(dislikes.map((item) => item.value.food).sort(), ["TOMATO", "TUNA"]);
});

test("same ID registered as allergy and disliked food retains both classifications without merging", () => {
  const input = completeIntake({
    nutrition: {
      allergies: [{ substance: "PEANUT", medicallyConfirmed: true }],
      dislikedFoods: ["PEANUT"],
    },
  });
  const result = evaluate(input);
  assert.ok(
    result.hard_constraints.some(
      (item) => item.code === "FOOD_ALLERGY_EXCLUSION" && item.value.substance === "PEANUT",
    ),
  );
  assert.ok(
    result.soft_preferences.some(
      (item) => item.code === "DISLIKED_FOOD_EXCLUSION" && item.value.food === "PEANUT",
    ),
  );
  const decisionConstraints = result.nutrition_decision.constraints;
  assert.ok(
    decisionConstraints.some(
      (item) => item.code === "FOOD_ALLERGY_EXCLUSION" && item.value.substance === "PEANUT",
    ),
  );
  assert.ok(
    decisionConstraints.some(
      (item) => item.code === "DISLIKED_FOOD_EXCLUSION" && item.value.food === "PEANUT",
    ),
  );
});

test("budget is classified as a soft preference and does not prevent ready-for-draft", () => {
  const input = completeIntake({ nutrition: { budget: "LOW" } });
  const result = evaluate(input);
  assert.equal(result.plan_status, PlanStatus.READY_FOR_DRAFT);
  assert.deepEqual(result.review_flags, []);
  assert.equal(hasCode(result.hard_constraints, "FOOD_BUDGET"), false);
  assert.ok(hasCode(result.soft_preferences, "FOOD_BUDGET"));
  assert.ok(hasCode(result.nutrition_decision.constraints, "FOOD_BUDGET"));
});

test("an unconfirmed food allergy stays excluded and requires coach review", () => {
  const result = evaluate(
    completeIntake({
      nutrition: {
        allergies: [{ substance: "PEANUT", medicallyConfirmed: false }],
      },
    }),
  );
  const allergyConstraint = result.hard_constraints.find(
    (item) => item.code === "FOOD_ALLERGY_EXCLUSION",
  );
  const flag = result.review_flags.find(
    (item) => item.code === "UNCONFIRMED_FOOD_ALLERGY",
  );
  const pending = result.missing_or_uncertain_data.find(
    (item) => item.code === "FOOD_ALLERGY_CONFIRMATION_PENDING",
  );

  assert.equal(result.plan_status, PlanStatus.COACH_REVIEW_REQUIRED);
  assert.equal(result.nutrition_decision.calorie_direction, "MAINTENANCE");
  assert.equal(result.nutrition_decision.meal_count_strategy, "USE_CLIENT_PREFERENCE");
  assert.deepEqual(allergyConstraint.value, {
    substance: "PEANUT",
    medicallyConfirmed: false,
  });
  assert.ok(hasCode(result.nutrition_decision.constraints, "FOOD_ALLERGY_EXCLUSION"));
  assert.deepEqual(flag, {
    code: "UNCONFIRMED_FOOD_ALLERGY",
    scope: "NUTRITION",
    level: "COACH",
    message:
      "The reported allergy remains excluded as a precaution, but its classification requires coach review.",
    sourcePath: "nutrition.allergies[0].medicallyConfirmed",
  });
  assert.deepEqual(pending, {
    code: "FOOD_ALLERGY_CONFIRMATION_PENDING",
    path: "nutrition.allergies[0].medicallyConfirmed",
    message: "The reported allergy is temporarily excluded but still requires confirmation.",
  });
  assert.ok(
    hasCode(result.decision_reasons, "UNCONFIRMED_ALLERGY_TEMPORARILY_EXCLUDED"),
  );
});

test("an unconfirmed food allergy alone is neither medical review nor blocked", () => {
  const result = evaluate(
    completeIntake({
      nutrition: {
        allergies: [{ substance: "SHELLFISH", medicallyConfirmed: false }],
      },
    }),
  );

  assert.equal(result.plan_status, PlanStatus.COACH_REVIEW_REQUIRED);
  assert.notEqual(result.plan_status, PlanStatus.MEDICAL_REVIEW_REQUIRED);
  assert.notEqual(result.plan_status, PlanStatus.BLOCKED);
});

test("confirmed and unconfirmed food allergies are both excluded with one indexed review flag", () => {
  const result = evaluate(
    completeIntake({
      nutrition: {
        allergies: [
          { substance: "SESAME", medicallyConfirmed: true },
          { substance: "MILK", medicallyConfirmed: false },
        ],
      },
    }),
  );
  const exclusions = result.hard_constraints.filter(
    (item) => item.code === "FOOD_ALLERGY_EXCLUSION",
  );
  const flags = result.review_flags.filter(
    (item) => item.code === "UNCONFIRMED_FOOD_ALLERGY",
  );
  const nestedExclusions = result.nutrition_decision.constraints.filter(
    (item) => item.code === "FOOD_ALLERGY_EXCLUSION",
  );

  assert.deepEqual(
    exclusions.map((item) => item.value),
    [
      { substance: "MILK", medicallyConfirmed: false },
      { substance: "SESAME", medicallyConfirmed: true },
    ],
  );
  assert.equal(nestedExclusions.length, 2);
  assert.equal(flags.length, 1);
  assert.equal(flags[0].sourcePath, "nutrition.allergies[1].medicallyConfirmed");
});

test("multiple unconfirmed food allergies keep independent indexed review findings", () => {
  const result = evaluate(
    completeIntake({
      nutrition: {
        allergies: [
          { substance: "PEANUT", medicallyConfirmed: false },
          { substance: "SHELLFISH", medicallyConfirmed: false },
        ],
      },
    }),
  );
  const flags = result.review_flags.filter(
    (item) => item.code === "UNCONFIRMED_FOOD_ALLERGY",
  );
  const pending = result.missing_or_uncertain_data.filter(
    (item) => item.code === "FOOD_ALLERGY_CONFIRMATION_PENDING",
  );
  const exclusions = result.hard_constraints.filter(
    (item) => item.code === "FOOD_ALLERGY_EXCLUSION",
  );

  assert.equal(exclusions.length, 2);
  assert.deepEqual(
    flags.map((item) => item.sourcePath),
    [
      "nutrition.allergies[0].medicallyConfirmed",
      "nutrition.allergies[1].medicallyConfirmed",
    ],
  );
  assert.deepEqual(
    pending.map((item) => item.path),
    [
      "nutrition.allergies[0].medicallyConfirmed",
      "nutrition.allergies[1].medicallyConfirmed",
    ],
  );
  assert.equal(new Set(flags.map((item) => JSON.stringify(item))).size, flags.length);
});

test("an unconfirmed food allergy is not converted to intolerance or medical exclusion", () => {
  const result = evaluate(
    completeIntake({
      nutrition: {
        allergies: [{ substance: "EGG", medicallyConfirmed: false }],
      },
    }),
  );
  const allConstraints = [
    ...result.hard_constraints,
    ...result.soft_preferences,
    ...result.nutrition_decision.constraints,
  ];

  assert.ok(hasCode(result.hard_constraints, "FOOD_ALLERGY_EXCLUSION"));
  assert.equal(hasCode(allConstraints, "MEDICAL_FOOD_EXCLUSION"), false);
  assert.equal(hasCode(allConstraints, "MEDICALLY_DIAGNOSED_INTOLERANCE"), false);
  assert.equal(hasCode(allConstraints, "REPORTED_INTOLERANCE"), false);
});

test("unclassified free text creates a review flag and is never interpreted", () => {
  const input = completeIntake({
    medical: { unclassifiedText: ["I may have a sesame allergy and a disease"] },
  });
  const result = evaluate(input);
  assert.equal(result.plan_status, PlanStatus.COACH_REVIEW_REQUIRED);
  assert.ok(hasCode(result.review_flags, "UNCLASSIFIED_FREE_TEXT"));
  assert.equal(hasCode(result.hard_constraints, "FOOD_ALLERGY_EXCLUSION"), false);
  assert.equal(hasCode(result.review_flags, "CONDITION_NOT_STABLE"), false);
});

test("high football load, five hours sleep, and high stress produce conservative training and no added cardio", () => {
  const input = completeIntake({
    lifestyle: {
      sleep: { averageHours: 5, quality: SleepQuality.POOR },
      stressLevel: StressLevel.HIGH,
    },
    cardio: {
      additionalSports: [
        { name: "FOOTBALL", daysPerWeek: 2, minutesPerSession: 60, intensity: SportIntensity.HIGH },
      ],
    },
  });
  const result = evaluate(input);
  assert.equal(result.training_decision.volume_start, VolumeStart.CONSERVATIVE);
  assert.equal(result.cardio_decision.strategy, CardioStrategy.NO_ADDITIONAL_CARDIO);
  assert.equal(result.cardio_decision.max_sessions, 0);
});

test("home bodyweight training is valid and records BODYWEIGHT_ONLY as an available capability", () => {
  const input = completeIntake({
    training: {
      location: TrainingLocation.HOME,
      equipment: [
        {
          equipmentCode: EquipmentCode.BODYWEIGHT,
          otherEquipmentText: null,
          loadCapacity: EquipmentLoadCapacity.BODYWEIGHT_ONLY,
        },
      ],
    },
  });
  const result = evaluate(input);
  const equipment = result.training_decision.constraints.find(
    (item) => item.code === "AVAILABLE_TRAINING_EQUIPMENT",
  );

  assert.equal(result.plan_status, PlanStatus.READY_FOR_DRAFT);
  assert.deepEqual(equipment.value, {
    equipmentCode: EquipmentCode.BODYWEIGHT,
    loadCapacity: EquipmentLoadCapacity.BODYWEIGHT_ONLY,
  });
  assert.equal(hasCode(result.hard_constraints, "AVAILABLE_TRAINING_EQUIPMENT"), false);
});

test("home training with moderate dumbbells records a decision-only equipment constraint", () => {
  const input = completeIntake({
    training: {
      location: TrainingLocation.HOME,
      equipment: [
        {
          equipmentCode: EquipmentCode.DUMBBELLS,
          otherEquipmentText: null,
          loadCapacity: EquipmentLoadCapacity.MODERATE,
        },
      ],
    },
  });
  const result = evaluate(input);
  const equipment = result.training_decision.constraints.find(
    (item) => item.code === "AVAILABLE_TRAINING_EQUIPMENT",
  );

  assert.deepEqual(equipment.value, {
    equipmentCode: EquipmentCode.DUMBBELLS,
    loadCapacity: EquipmentLoadCapacity.MODERATE,
  });
  assert.ok(hasCode(result.training_decision.constraints, "TRAINING_LOCATION"));
  assert.equal(hasCode(result.hard_constraints, "AVAILABLE_TRAINING_EQUIPMENT"), false);
});

test("gym training accepts an empty equipment list", () => {
  const result = evaluate(
    completeIntake({
      training: { location: TrainingLocation.GYM, equipment: [] },
    }),
  );

  assert.equal(result.plan_status, PlanStatus.READY_FOR_DRAFT);
  assert.equal(
    hasCode(result.training_decision.constraints, "AVAILABLE_TRAINING_EQUIPMENT"),
    false,
  );
});

test("free-text training equipment requires coach mapping and is never inferred", () => {
  const originalText = "  DUMBBELLS  ";
  const input = completeIntake({
    training: {
      location: TrainingLocation.HOME,
      equipment: [
        {
          equipmentCode: null,
          otherEquipmentText: originalText,
          loadCapacity: EquipmentLoadCapacity.NOT_APPLICABLE,
        },
      ],
    },
  });
  const result = evaluate(input);
  const sourcePath = "training.equipment[0].otherEquipmentText";

  assert.equal(result.plan_status, PlanStatus.COACH_REVIEW_REQUIRED);
  assert.deepEqual(
    result.review_flags.find((item) => item.code === "UNCLASSIFIED_TRAINING_EQUIPMENT"),
    {
      code: "UNCLASSIFIED_TRAINING_EQUIPMENT",
      scope: "TRAINING",
      level: "COACH",
      message:
        "The reported equipment is preserved without interpretation and requires coach mapping.",
      sourcePath,
    },
  );
  assert.deepEqual(
    result.missing_or_uncertain_data.find(
      (item) => item.code === "TRAINING_EQUIPMENT_MAPPING_PENDING",
    ),
    {
      code: "TRAINING_EQUIPMENT_MAPPING_PENDING",
      path: sourcePath,
      message: "The reported equipment must be mapped before automatic exercise selection.",
    },
  );
  assert.ok(hasCode(result.decision_reasons, "UNCLASSIFIED_EQUIPMENT_REQUIRES_MAPPING"));
  assert.equal(
    hasCode(result.training_decision.constraints, "AVAILABLE_TRAINING_EQUIPMENT"),
    false,
  );
  assert.equal(hasCode(result.hard_constraints, "AVAILABLE_TRAINING_EQUIPMENT"), false);
  assert.equal(input.training.equipment[0].otherEquipmentText, originalText);
});

test("structured equipment is usable while free-text equipment remains pending review", () => {
  const input = completeIntake({
    training: {
      location: TrainingLocation.HOME,
      equipment: [
        {
          equipmentCode: EquipmentCode.RESISTANCE_BANDS,
          otherEquipmentText: "",
          loadCapacity: EquipmentLoadCapacity.LIGHT,
        },
        {
          equipmentCode: null,
          otherEquipmentText: "Portable pulley from the client",
          loadCapacity: EquipmentLoadCapacity.MODERATE,
        },
      ],
    },
  });
  const result = evaluate(input);
  const availableEquipment = result.training_decision.constraints.filter(
    (item) => item.code === "AVAILABLE_TRAINING_EQUIPMENT",
  );

  assert.equal(result.plan_status, PlanStatus.COACH_REVIEW_REQUIRED);
  assert.deepEqual(availableEquipment.map((item) => item.value), [
    {
      equipmentCode: EquipmentCode.RESISTANCE_BANDS,
      loadCapacity: EquipmentLoadCapacity.LIGHT,
    },
  ]);
  assert.ok(
    result.review_flags.some(
      (item) =>
        item.code === "UNCLASSIFIED_TRAINING_EQUIPMENT" &&
        item.sourcePath === "training.equipment[1].otherEquipmentText",
    ),
  );
  assert.equal(hasCode(result.hard_constraints, "AVAILABLE_TRAINING_EQUIPMENT"), false);
});

test("work schedule does not choose the training schedule mode", () => {
  const flexibleWithVariableWork = evaluate(
    completeIntake({
      lifestyle: { workSchedule: { type: WorkScheduleType.VARIABLE } },
      training: {
        trainingScheduleAvailabilityType: TrainingScheduleAvailabilityType.FLEXIBLE,
        availableTrainingDays: [],
        unavailableTrainingDays: [],
      },
    }),
  );
  assert.equal(flexibleWithVariableWork.training_decision.schedule_mode, ScheduleMode.FIXED_DAYS);

  const variableWithFixedWork = evaluate(
    completeIntake({
      lifestyle: { workSchedule: { type: WorkScheduleType.FIXED } },
      training: {
        trainingScheduleAvailabilityType: TrainingScheduleAvailabilityType.VARIABLE,
        availableTrainingDays: [],
        unavailableTrainingDays: [],
      },
    }),
  );
  assert.equal(variableWithFixedWork.training_decision.schedule_mode, ScheduleMode.SESSION_SEQUENCE);
});

test("every successful training schedule returns at least two recommended days", () => {
  const schedules = [
    {
      trainingScheduleAvailabilityType: TrainingScheduleAvailabilityType.FLEXIBLE,
      availableTrainingDays: [],
      unavailableTrainingDays: [],
    },
    {
      trainingScheduleAvailabilityType: TrainingScheduleAvailabilityType.VARIABLE,
      availableTrainingDays: [],
      unavailableTrainingDays: [],
    },
    {
      trainingScheduleAvailabilityType:
        TrainingScheduleAvailabilityType.FIXED_AVAILABLE_DAYS,
      availableTrainingDays: [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY],
      unavailableTrainingDays: [],
    },
    {
      trainingScheduleAvailabilityType:
        TrainingScheduleAvailabilityType.FIXED_UNAVAILABLE_DAYS,
      availableTrainingDays: [],
      unavailableTrainingDays: [DayOfWeek.SUNDAY],
    },
  ];

  for (const training of schedules) {
    const result = evaluate(completeIntake({ training }));
    assert.equal(result.plan_status, PlanStatus.READY_FOR_DRAFT);
    assert.ok(result.training_decision.recommended_days >= 2);
  }
});

test("a never-trained client requires an intro week", () => {
  const input = completeIntake({
    training: {
      experience: TrainingExperience.NEVER_TRAINED,
      recentTraining: RecentTraining.NONE_LAST_4_WEEKS,
    },
  });
  const result = evaluate(input);
  assert.equal(result.training_decision.intro_week_required, true);
  assert.equal(result.training_decision.volume_start, VolumeStart.CONSERVATIVE);
});

test("medical safety wins a conflict with a blocked minor while both findings remain", () => {
  const input = completeIntake({
    personal: { dateOfBirth: "2010-07-15", ageYears: 15, guardianConsent: false },
    medical: { dangerousSymptoms: { chestPainOrPressure: ScreeningAnswer.YES } },
    nutrition: { allergies: [{ substance: "SESAME", medicallyConfirmed: true }] },
  });
  const result = evaluate(input);
  assert.equal(result.plan_status, PlanStatus.MEDICAL_REVIEW_REQUIRED);
  assert.ok(hasCode(result.review_flags, "CHEST_PAIN_OR_PRESSURE"));
  assert.ok(hasCode(result.review_flags, "MINOR_WITHOUT_GUARDIAN_CONSENT"));
  assert.ok(hasCode(result.hard_constraints, "FOOD_ALLERGY_EXCLUSION"));
});

test("fat-loss goal alone does not automatically create a deficit", () => {
  const input = completeIntake({ goals: { primary: PrimaryGoal.FAT_LOSS } });
  const result = evaluate(input);
  assert.equal(result.nutrition_decision.calorie_direction, "MAINTENANCE");
  assert.ok(hasCode(result.nutrition_decision.reasons, "GOAL_RECORDED_NOT_AUTO_APPLIED"));
});

test("eating-disorder history prevents automatic deficit or surplus", () => {
  const input = completeIntake({
    goals: { primary: PrimaryGoal.FAT_LOSS },
    medical: { eatingDisorderHistory: EatingDisorderHistory.PAST },
  });
  const result = evaluate(input);
  assert.equal(result.plan_status, PlanStatus.COACH_REVIEW_REQUIRED);
  assert.equal(result.nutrition_decision.calorie_direction, "REVIEW_REQUIRED");
  assert.equal(result.nutrition_decision.confidence, "LOW");
});

test("a classified medical movement restriction remains a hard constraint", () => {
  const input = completeIntake({
    training: {
      medicalMovementRestrictions: [
        {
          movement: Movement.RUNNING,
          instruction: RestrictionInstruction.AVOID,
          source: RestrictionSource.PHYSICIAN,
        },
      ],
    },
  });
  const result = evaluate(input);
  assert.equal(result.plan_status, PlanStatus.READY_FOR_DRAFT);
  assert.ok(hasCode(result.hard_constraints, "MEDICAL_MOVEMENT_RESTRICTION"));
  assert.ok(hasCode(result.cardio_decision.constraints, "MEDICAL_MOVEMENT_RESTRICTION"));
});

test("worsening injury with weakness requires medical review", () => {
  const input = completeIntake({
    training: {
      injuries: [
        {
          area: "LOWER_BACK",
          painLevel: 6,
          movementImpact: MovementImpact.LIMITS,
          worsening: true,
          numbnessOrWeakness: true,
          affectedMovements: ["HINGE"],
          medicalRestrictions: [],
        },
      ],
    },
  });
  const result = evaluate(input);
  assert.equal(result.plan_status, PlanStatus.MEDICAL_REVIEW_REQUIRED);
  assert.ok(hasCode(result.review_flags, "INJURY_RED_FLAG"));
});

test("pain level 6 without injury red flags remains on the coach review path", () => {
  const result = evaluate(
    completeIntake({
      training: {
        injuries: [
          {
            area: "KNEE",
            painLevel: 6,
            movementImpact: MovementImpact.LIMITS,
            worsening: false,
            numbnessOrWeakness: false,
            affectedMovements: [Movement.RUNNING],
            medicalRestrictions: [],
          },
        ],
      },
    }),
  );

  assert.equal(result.plan_status, PlanStatus.COACH_REVIEW_REQUIRED);
  assert.equal(hasCode(result.review_flags, "HIGH_PAIN_REQUIRES_MEDICAL_REVIEW"), false);
});

test("pain level 7 without other red flags requires medical review", () => {
  const result = evaluate(
    completeIntake({
      training: {
        injuries: [
          {
            area: "KNEE",
            painLevel: 7,
            movementImpact: MovementImpact.LIMITS,
            worsening: false,
            numbnessOrWeakness: false,
            affectedMovements: [Movement.RUNNING],
            medicalRestrictions: [],
          },
        ],
      },
    }),
  );

  assert.equal(HIGH_PAIN_MEDICAL_REVIEW_THRESHOLD, 7);
  assert.equal(result.plan_status, PlanStatus.MEDICAL_REVIEW_REQUIRED);
  assert.ok(hasCode(result.review_flags, "HIGH_PAIN_REQUIRES_MEDICAL_REVIEW"));
  assert.ok(hasCode(result.decision_reasons, "HIGH_PAIN_PREVENTS_AUTOMATIC_APPROVAL"));
});

test("pain level 10 requires medical review", () => {
  const result = evaluate(
    completeIntake({
      training: {
        injuries: [
          {
            area: "SHOULDER",
            painLevel: 10,
            movementImpact: MovementImpact.NONE,
            worsening: false,
            numbnessOrWeakness: false,
            affectedMovements: [Movement.OVERHEAD],
            medicalRestrictions: [],
          },
        ],
      },
    }),
  );

  assert.equal(result.plan_status, PlanStatus.MEDICAL_REVIEW_REQUIRED);
  assert.ok(hasCode(result.review_flags, "HIGH_PAIN_REQUIRES_MEDICAL_REVIEW"));
});

test("high pain with worsening and numbness keeps distinct flags and all restrictions", () => {
  const result = evaluate(
    completeIntake({
      training: {
        injuries: [
          {
            area: "LOWER_BACK",
            painLevel: 8,
            movementImpact: MovementImpact.LIMITS,
            worsening: true,
            numbnessOrWeakness: true,
            affectedMovements: [Movement.HINGE],
            medicalRestrictions: [
              {
                movement: Movement.SQUAT,
                instruction: RestrictionInstruction.AVOID,
                source: RestrictionSource.PHYSICIAN,
              },
            ],
          },
        ],
      },
    }),
  );
  const highPainFlags = result.review_flags.filter(
    (item) => item.code === "HIGH_PAIN_REQUIRES_MEDICAL_REVIEW",
  );
  const exactFlags = result.review_flags.map((item) => JSON.stringify(item));

  assert.equal(result.plan_status, PlanStatus.MEDICAL_REVIEW_REQUIRED);
  assert.equal(highPainFlags.length, 1);
  assert.ok(hasCode(result.review_flags, "INJURY_RED_FLAG"));
  assert.equal(new Set(exactFlags).size, exactFlags.length);
  assert.ok(hasCode(result.hard_constraints, "INJURY_AFFECTED_MOVEMENT"));
  assert.ok(hasCode(result.hard_constraints, "INJURY_MEDICAL_RESTRICTION"));
});

test("unknown dangerous-symptom answer blocks normal approval", () => {
  const input = completeIntake({
    medical: { dangerousSymptoms: { fainting: ScreeningAnswer.UNKNOWN } },
  });
  const result = evaluate(input);
  assert.equal(result.plan_status, PlanStatus.BLOCKED);
  assert.ok(hasCode(result.missing_or_uncertain_data, "SAFETY_SCREENING_ANSWER_UNKNOWN"));
  assert.equal(result.nutrition_decision.calorie_direction, "REVIEW_REQUIRED");
  assert.equal(result.training_decision.recommended_days, 0);
  assert.equal(result.cardio_decision.strategy, CardioStrategy.REVIEW_REQUIRED);
});

test("an all-cardio medical restriction prevents formal cardio", () => {
  const input = completeIntake({
    training: {
      medicalMovementRestrictions: [
        {
          movement: Movement.ALL_CARDIO,
          instruction: RestrictionInstruction.AVOID,
          source: RestrictionSource.PHYSICIAN,
        },
      ],
    },
  });
  const result = evaluate(input);
  assert.equal(result.plan_status, PlanStatus.COACH_REVIEW_REQUIRED);
  assert.equal(result.cardio_decision.strategy, CardioStrategy.REVIEW_REQUIRED);
  assert.equal(result.cardio_decision.max_sessions, 0);
  assert.ok(hasCode(result.review_flags, "CARDIO_CONFLICTS_WITH_MOVEMENT_RESTRICTION"));
});

test("a walking prohibition prevents a conflicting steps-only strategy", () => {
  const input = completeIntake({
    training: {
      medicalMovementRestrictions: [
        {
          movement: Movement.WALKING,
          instruction: RestrictionInstruction.AVOID,
          source: RestrictionSource.PHYSICIAN,
        },
      ],
    },
    cardio: { averageDailySteps: 3000 },
  });
  const result = evaluate(input);
  assert.equal(result.plan_status, PlanStatus.COACH_REVIEW_REQUIRED);
  assert.equal(result.cardio_decision.strategy, CardioStrategy.REVIEW_REQUIRED);
  assert.equal(result.cardio_decision.max_sessions, 0);
});

test("a walking-affected stable injury also prevents steps-only routing", () => {
  const input = completeIntake({
    training: {
      injuries: [
        {
          area: "ANKLE",
          painLevel: 2,
          movementImpact: MovementImpact.LIMITS,
          worsening: false,
          numbnessOrWeakness: false,
          affectedMovements: [Movement.WALKING],
          medicalRestrictions: [],
        },
      ],
    },
    cardio: { averageDailySteps: 3000 },
  });
  const result = evaluate(input);
  assert.equal(result.cardio_decision.strategy, CardioStrategy.REVIEW_REQUIRED);
});

test("an all-training medical restriction prevents recommended training days", () => {
  const input = completeIntake({
    training: {
      medicalMovementRestrictions: [
        {
          movement: Movement.ALL_TRAINING,
          instruction: RestrictionInstruction.AVOID,
          source: RestrictionSource.PHYSIOTHERAPIST,
        },
      ],
    },
  });
  const result = evaluate(input);
  assert.equal(result.plan_status, PlanStatus.COACH_REVIEW_REQUIRED);
  assert.equal(result.training_decision.recommended_days, 0);
  assert.ok(hasCode(result.review_flags, "TRAINING_PROHIBITED_BY_MOVEMENT_RESTRICTION"));
});

test("a stable running limitation reaches cardio constraints without becoming a medical red flag", () => {
  const input = completeIntake({
    training: {
      injuries: [
        {
          area: "KNEE",
          painLevel: 3,
          movementImpact: MovementImpact.LIMITS,
          worsening: false,
          numbnessOrWeakness: false,
          affectedMovements: [Movement.RUNNING],
          medicalRestrictions: [],
        },
      ],
    },
  });
  const result = evaluate(input);
  assert.equal(result.plan_status, PlanStatus.COACH_REVIEW_REQUIRED);
  assert.equal(hasCode(result.review_flags, "INJURY_RED_FLAG"), false);
  assert.ok(hasCode(result.cardio_decision.constraints, "INJURY_AFFECTED_MOVEMENT"));
});

test("unknown walking requires review before high sport while missing findings are retained", () => {
  const input = completeIntake({
    cardio: {
      additionalSports: [
        { name: "FOOTBALL", daysPerWeek: 2, minutesPerSession: 60, intensity: SportIntensity.HIGH },
      ],
      walkingAbility: "UNKNOWN",
      averageDailySteps: null,
    },
  });
  const result = evaluate(input);
  assert.equal(result.plan_status, PlanStatus.COACH_REVIEW_REQUIRED);
  assert.equal(result.cardio_decision.strategy, CardioStrategy.REVIEW_REQUIRED);
  assert.ok(hasCode(result.missing_or_uncertain_data, "WALKING_ABILITY_UNKNOWN"));
  assert.ok(hasCode(result.missing_or_uncertain_data, "AVERAGE_DAILY_STEPS_UNKNOWN"));
});

test("output values are isolated from the input and from repeated output locations", () => {
  const input = completeIntake({
    nutrition: { unavailableEatingWindows: [{ start: "09:00", end: "11:00" }] },
  });
  const result = evaluate(input);
  const globalWindow = result.hard_constraints.find((item) => item.code === "UNAVAILABLE_EATING_WINDOW");
  const nestedWindow = result.nutrition_decision.constraints.find(
    (item) => item.code === "UNAVAILABLE_EATING_WINDOW",
  );
  globalWindow.value.start = "10:00";
  assert.equal(input.nutrition.unavailableEatingWindows[0].start, "09:00");
  assert.equal(nestedWindow.value.start, "09:00");
});

test("engine is deterministic and does not mutate its input", () => {
  const input = completeIntake();
  const before = structuredClone(input);
  const first = evaluate(input);
  const second = evaluate(input);
  assert.deepEqual(first, second);
  assert.deepEqual(input, before);
});

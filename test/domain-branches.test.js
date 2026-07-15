import assert from "node:assert/strict";
import test from "node:test";

import {
  ActivityLevel,
  IntakeDecisionEngine,
  MedicalConditionCode,
  MedicalFoodInstruction,
  MeasurementQuality,
  MenstrualStatus,
  Movement,
  MovementImpact,
  PlanStatus,
  PregnancyStatus,
  RestrictionInstruction,
  RestrictionSource,
  ScreeningAnswer,
  Severity,
  SleepQuality,
  Stability,
  StressLevel,
  VolumeStart,
  WeightTrend,
  evaluateIntake,
} from "../src/intake-decision-engine/index.js";
import { ASSESSMENT_CONTEXT, completeIntake } from "./fixtures/complete-intake.js";

const evaluate = (input) => evaluateIntake(input, ASSESSMENT_CONTEXT);
const hasCode = (items, code) => items.some((item) => item.code === code);

test("minor with guardian consent still uses the separate coach-reviewed minor path", () => {
  const result = evaluate(
    completeIntake({
      personal: { dateOfBirth: "2010-07-15", ageYears: 15, guardianConsent: true },
    }),
  );
  assert.equal(result.plan_status, PlanStatus.COACH_REVIEW_REQUIRED);
  assert.equal(result.training_decision.recommended_days, 0);
  assert.ok(hasCode(result.review_flags, "MINOR_REQUIRES_SEPARATE_PATH"));
});

test("stable condition can remain ready, while unstable or unknown stability requires medical review", () => {
  const stable = evaluate(
    completeIntake({
      medical: {
        conditions: [
          {
            conditionCode: MedicalConditionCode.THYROID_CONDITION,
            otherConditionText: null,
            stability: Stability.STABLE,
            physicianInstructions: [],
            unclassifiedInstructionsText: null,
          },
        ],
      },
    }),
  );
  assert.equal(stable.plan_status, PlanStatus.READY_FOR_DRAFT);

  for (const stability of [Stability.UNSTABLE, Stability.UNKNOWN]) {
    const result = evaluate(
      completeIntake({
        medical: {
          conditions: [
            {
              conditionCode: MedicalConditionCode.HEART_CONDITION,
              otherConditionText: null,
              stability,
              physicianInstructions: [],
              unclassifiedInstructionsText: null,
            },
          ],
        },
      }),
    );
    assert.equal(result.plan_status, PlanStatus.MEDICAL_REVIEW_REQUIRED);
    assert.ok(hasCode(result.review_flags, "CONDITION_NOT_STABLE"));
  }
});

test("unclassified physician instructions require medical classification and are not applied", () => {
  const result = evaluate(
    completeIntake({
      medical: {
        conditions: [
          {
            conditionCode: MedicalConditionCode.THYROID_CONDITION,
            otherConditionText: null,
            stability: Stability.STABLE,
            physicianInstructions: ["some free-form instruction"],
            unclassifiedInstructionsText: null,
          },
        ],
      },
    }),
  );
  assert.equal(result.plan_status, PlanStatus.MEDICAL_REVIEW_REQUIRED);
  assert.ok(hasCode(result.review_flags, "UNCLASSIFIED_PHYSICIAN_INSTRUCTIONS"));
  assert.equal(hasCode(result.hard_constraints, "MEDICAL_MOVEMENT_RESTRICTION"), false);
});

test("a stable structured thyroid condition does not prevent ready for draft", () => {
  const result = evaluate(
    completeIntake({
      medical: {
        conditions: [
          {
            conditionCode: MedicalConditionCode.THYROID_CONDITION,
            otherConditionText: null,
            stability: Stability.STABLE,
            physicianInstructions: [],
            unclassifiedInstructionsText: null,
          },
        ],
      },
    }),
  );

  assert.equal(result.plan_status, PlanStatus.READY_FOR_DRAFT);
  assert.equal(hasCode(result.review_flags, "UNCLASSIFIED_MEDICAL_CONDITION"), false);
});

test("an unstable structured heart condition requires medical review", () => {
  const result = evaluate(
    completeIntake({
      medical: {
        conditions: [
          {
            conditionCode: MedicalConditionCode.HEART_CONDITION,
            otherConditionText: null,
            stability: Stability.UNSTABLE,
            physicianInstructions: [],
            unclassifiedInstructionsText: null,
          },
        ],
      },
    }),
  );

  assert.equal(result.plan_status, PlanStatus.MEDICAL_REVIEW_REQUIRED);
  assert.ok(hasCode(result.review_flags, "CONDITION_NOT_STABLE"));
});

test("a stable unclassified condition requires coach review without interpreting its text", () => {
  const originalText = "THYROID_CONDITION and HEART_CONDITION as written by the client";
  const input = completeIntake({
    medical: {
      conditions: [
        {
          conditionCode: null,
          otherConditionText: originalText,
          stability: Stability.STABLE,
          physicianInstructions: [],
          unclassifiedInstructionsText: null,
        },
      ],
    },
  });
  const baseline = evaluate(completeIntake());
  const result = evaluate(input);
  const flag = result.review_flags.find(
    (item) => item.code === "UNCLASSIFIED_MEDICAL_CONDITION",
  );

  assert.equal(result.plan_status, PlanStatus.COACH_REVIEW_REQUIRED);
  assert.equal(flag.sourcePath, "medical.conditions[0].otherConditionText");
  assert.equal(input.medical.conditions[0].otherConditionText, originalText);
  assert.equal(hasCode(result.review_flags, "CONDITION_NOT_STABLE"), false);
  assert.deepEqual(result.hard_constraints, baseline.hard_constraints);
});

test("an unclassified condition with unknown stability keeps medical review priority", () => {
  const result = evaluate(
    completeIntake({
      medical: {
        conditions: [
          {
            conditionCode: null,
            otherConditionText: "Original client-entered condition",
            stability: Stability.UNKNOWN,
            physicianInstructions: [],
            unclassifiedInstructionsText: null,
          },
        ],
      },
    }),
  );

  assert.equal(result.plan_status, PlanStatus.MEDICAL_REVIEW_REQUIRED);
  assert.ok(hasCode(result.review_flags, "UNCLASSIFIED_MEDICAL_CONDITION"));
  assert.ok(hasCode(result.review_flags, "CONDITION_NOT_STABLE"));
});

test("possible pregnancy and breastfeeding use medical review; unknown status blocks", () => {
  for (const pregnancyStatus of [
    PregnancyStatus.POSSIBLY_PREGNANT,
    PregnancyStatus.BREASTFEEDING,
  ]) {
    assert.equal(
      evaluate(completeIntake({ medical: { pregnancyStatus } })).plan_status,
      PlanStatus.MEDICAL_REVIEW_REQUIRED,
    );
  }
  const unknown = evaluate(
    completeIntake({ medical: { pregnancyStatus: PregnancyStatus.UNKNOWN } }),
  );
  assert.equal(unknown.plan_status, PlanStatus.BLOCKED);
  assert.equal(unknown.training_decision.recommended_days, 0);
});

test("other dangerous symptom text is flagged without interpretation while the structured YES drives medical review", () => {
  const result = evaluate(
    completeIntake({
      medical: {
        dangerousSymptoms: {
          otherDangerousSymptomsPresent: ScreeningAnswer.YES,
          otherDangerousSymptoms: ["unclassified symptom detail"],
        },
      },
    }),
  );
  assert.equal(result.plan_status, PlanStatus.MEDICAL_REVIEW_REQUIRED);
  assert.ok(hasCode(result.review_flags, "OTHER_DANGEROUS_SYMPTOM"));
  assert.ok(hasCode(result.review_flags, "UNCLASSIFIED_FREE_TEXT"));
});

test("medication is recorded for coach review without inferring an interaction", () => {
  const result = evaluate(completeIntake({ medical: { medications: ["MEDICATION_ID"] } }));
  assert.equal(result.plan_status, PlanStatus.COACH_REVIEW_REQUIRED);
  assert.ok(hasCode(result.review_flags, "MEDICATION_REPORTED_NO_AUTOMATIC_INTERPRETATION"));
});

test("verified food exclusion and practical logistics become hard constraints", () => {
  const result = evaluate(
    completeIntake({
      nutrition: {
        medicalExclusions: [
          {
            food: "GRAPEFRUIT",
            instruction: MedicalFoodInstruction.EXCLUDE,
            source: RestrictionSource.PHYSICIAN,
          },
        ],
        foodStorageAvailable: false,
        foodReheatingAvailable: false,
        unavailableEatingWindows: [{ start: "08:00", end: "12:00" }],
      },
    }),
  );
  assert.equal(result.plan_status, PlanStatus.READY_FOR_DRAFT);
  for (const code of [
    "MEDICAL_FOOD_EXCLUSION",
    "NO_FOOD_STORAGE",
    "NO_FOOD_REHEATING",
    "UNAVAILABLE_EATING_WINDOW",
  ]) {
    assert.ok(hasCode(result.hard_constraints, code));
  }
  assert.equal(result.nutrition_decision.meal_count_strategy, "ADAPT_TO_EATING_WINDOWS");
});

test("intolerance and digestive issue remain separate from allergy and trigger review when severe or unknown", () => {
  const result = evaluate(
    completeIntake({
      nutrition: {
        intolerances: [
          {
            substance: "LACTOSE",
            severity: Severity.SEVERE,
            medicallyDiagnosed: true,
            notes: null,
          },
          {
            substance: "FODMAP_TRIGGER",
            severity: Severity.UNKNOWN,
            medicallyDiagnosed: false,
            notes: "unclassified reaction detail",
          },
        ],
        digestiveIssues: [{ name: "DIGESTIVE_ISSUE", severity: Severity.SEVERE }],
      },
    }),
  );
  assert.equal(result.plan_status, PlanStatus.COACH_REVIEW_REQUIRED);
  assert.ok(hasCode(result.hard_constraints, "MEDICALLY_DIAGNOSED_INTOLERANCE"));
  assert.ok(hasCode(result.soft_preferences, "REPORTED_INTOLERANCE"));
  assert.ok(hasCode(result.review_flags, "DIGESTIVE_ISSUE_REQUIRES_REVIEW"));
  assert.ok(hasCode(result.missing_or_uncertain_data, "INTOLERANCE_SEVERITY_UNKNOWN"));
  assert.equal(hasCode(result.hard_constraints, "FOOD_ALLERGY_EXCLUSION"), false);
});

test("uncertain measurements lower confidence and are exposed without inventing a calorie direction", () => {
  const result = evaluate(
    completeIntake({
      body: {
        weightTrend: WeightTrend.UNKNOWN,
        measurementQuality: MeasurementQuality.UNKNOWN,
      },
      medical: { menstrualStatus: MenstrualStatus.UNKNOWN },
    }),
  );
  assert.equal(result.nutrition_decision.calorie_direction, "MAINTENANCE");
  assert.equal(result.nutrition_decision.confidence, "LOW");
  assert.ok(hasCode(result.missing_or_uncertain_data, "WEIGHT_TREND_UNKNOWN"));
  assert.ok(hasCode(result.missing_or_uncertain_data, "MEASUREMENT_QUALITY_UNKNOWN"));
  assert.ok(hasCode(result.missing_or_uncertain_data, "MENSTRUAL_STATUS_UNKNOWN"));
});

test("unknown recovery inputs force a conservative start and remain visible", () => {
  const result = evaluate(
    completeIntake({
      lifestyle: {
        dailyActivity: ActivityLevel.UNKNOWN,
        sleep: { quality: SleepQuality.UNKNOWN },
        stressLevel: StressLevel.UNKNOWN,
      },
    }),
  );
  assert.equal(result.training_decision.volume_start, VolumeStart.CONSERVATIVE);
  assert.equal(result.cardio_decision.intensity_start, "LOW");
  assert.ok(hasCode(result.missing_or_uncertain_data, "SLEEP_QUALITY_UNKNOWN"));
  assert.ok(hasCode(result.missing_or_uncertain_data, "STRESS_LEVEL_UNKNOWN"));
  assert.ok(hasCode(result.missing_or_uncertain_data, "DAILY_ACTIVITY_UNKNOWN"));
});

test("a classified injury medical restriction remains global and prevents conflicting activity", () => {
  const result = evaluate(
    completeIntake({
      training: {
        injuries: [
          {
            area: "KNEE",
            painLevel: 2,
            movementImpact: MovementImpact.LIMITS,
            worsening: false,
            numbnessOrWeakness: false,
            affectedMovements: [Movement.RUNNING],
            medicalRestrictions: [
              {
                movement: Movement.ALL_CARDIO,
                instruction: RestrictionInstruction.AVOID,
                source: RestrictionSource.PHYSICIAN,
              },
            ],
          },
        ],
      },
    }),
  );
  assert.ok(hasCode(result.hard_constraints, "INJURY_MEDICAL_RESTRICTION"));
  assert.equal(result.cardio_decision.strategy, "REVIEW_REQUIRED");
});

test("class API uses its injected trusted context", () => {
  const engine = new IntakeDecisionEngine(ASSESSMENT_CONTEXT);
  assert.equal(engine.evaluate(completeIntake()).plan_status, PlanStatus.READY_FOR_DRAFT);
});

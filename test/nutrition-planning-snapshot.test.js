import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  evaluateIntake,
  IntakeValidationError,
  validateIntake,
} from "../src/intake-decision-engine/index.js";
import * as nutritionPlanningSnapshotApi from "z-coaching-intake-decision-engine/nutrition-planning-snapshot";

const {
  buildNutritionPlanningSnapshot,
  NUTRITION_PLANNING_SNAPSHOT_VERSION,
} = nutritionPlanningSnapshotApi;

const FULL_INTAKE_URL = new URL(
  "../examples/full-intake.json",
  import.meta.url,
);
const EVALUATION_CONTEXT_URL = new URL(
  "../examples/evaluation-context.json",
  import.meta.url,
);

function readJson(url) {
  return JSON.parse(readFileSync(url, "utf8"));
}

function buildExampleInputs() {
  const intake = readJson(FULL_INTAKE_URL);
  const evaluationContext = readJson(EVALUATION_CONTEXT_URL);
  const intakeDecision = evaluateIntake(intake, evaluationContext);
  return { intake, evaluationContext, intakeDecision };
}

function buildExampleSnapshot() {
  const inputs = buildExampleInputs();
  return {
    ...inputs,
    snapshot: buildNutritionPlanningSnapshot(inputs),
  };
}

function assertDeepFrozen(value, seen = new WeakSet()) {
  if (value === null || typeof value !== "object" || seen.has(value)) {
    return;
  }
  seen.add(value);
  assert.equal(Object.isFrozen(value), true);
  for (const key of Reflect.ownKeys(value)) {
    assertDeepFrozen(value[key], seen);
  }
}

function collectObjectKeys(value, keys = new Set(), seen = new WeakSet()) {
  if (value === null || typeof value !== "object" || seen.has(value)) {
    return keys;
  }
  seen.add(value);
  for (const key of Object.keys(value)) {
    keys.add(key);
    collectObjectKeys(value[key], keys, seen);
  }
  return keys;
}

test("Public API exposes only the snapshot version and builder", () => {
  assert.equal(
    NUTRITION_PLANNING_SNAPSHOT_VERSION,
    "nutrition-planning-snapshot-v1",
  );
  assert.equal(typeof buildNutritionPlanningSnapshot, "function");
  assert.deepEqual(Object.keys(nutritionPlanningSnapshotApi).sort(), [
    "NUTRITION_PLANNING_SNAPSHOT_VERSION",
    "buildNutritionPlanningSnapshot",
  ]);
});

test("actual example intake and decision produce the complete snapshot contract", () => {
  const { intake, evaluationContext, intakeDecision, snapshot } =
    buildExampleSnapshot();

  assert.deepEqual(snapshot, {
    snapshot_version: "nutrition-planning-snapshot-v1",
    assessment_date: "2026-07-14",
    client: {
      age_years: 32,
      sex: "FEMALE",
      residence_country: "EG",
    },
    goal: {
      primary: "FAT_LOSS",
      calorie_direction: "MAINTENANCE",
      decision_confidence: "HIGH",
    },
    body: {
      height_cm: 165,
      weight_kg: 72,
      waist_cm: 82,
      weight_trend: "STABLE",
      measurement_quality: "HIGH",
    },
    activity: {
      daily_activity: "LIGHT",
      work_schedule_type: "VARIABLE",
      physically_demanding_days: [],
      average_daily_steps: 4500,
      additional_sports: [],
      recommended_resistance_days: 3,
      training_schedule_mode: "FIXED_DAYS",
      intro_week_required: true,
      training_volume_start: "CONSERVATIVE",
    },
    recovery: {
      sleep_average_hours: 7.5,
      sleep_quality: "GOOD",
      stress_level: "MODERATE",
    },
    meal_preferences: {
      preferred_meal_count: 3,
      meal_count_strategy: "ADAPT_TO_EATING_WINDOWS",
      unavailable_eating_windows:
        intake.nutrition.unavailableEatingWindows,
      budget: "MEDIUM",
      food_storage_available: true,
      food_reheating_available: true,
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
  });
  assert.equal(snapshot.assessment_date, evaluationContext.assessmentDate);
});

test("age is derived from dateOfBirth and the trusted assessment date", () => {
  const intake = readJson(FULL_INTAKE_URL);
  const evaluationContext = readJson(EVALUATION_CONTEXT_URL);
  intake.personal.dateOfBirth = "2000-07-15";
  const intakeDecision = evaluateIntake(intake, evaluationContext);

  const snapshot = buildNutritionPlanningSnapshot({
    intake,
    evaluationContext,
    intakeDecision,
  });

  assert.equal(snapshot.client.age_years, 25);
  assert.equal(snapshot.assessment_date, "2026-07-14");
});

test("camelCase source fields map to the exact snake_case snapshot keys", () => {
  const { snapshot } = buildExampleSnapshot();

  assert.deepEqual(Object.keys(snapshot.client), [
    "age_years",
    "sex",
    "residence_country",
  ]);
  assert.deepEqual(Object.keys(snapshot.body), [
    "height_cm",
    "weight_kg",
    "waist_cm",
    "weight_trend",
    "measurement_quality",
  ]);
  assert.deepEqual(Object.keys(snapshot.recovery), [
    "sleep_average_hours",
    "sleep_quality",
    "stress_level",
  ]);
  assert.deepEqual(Object.keys(snapshot.meal_preferences), [
    "preferred_meal_count",
    "meal_count_strategy",
    "unavailable_eating_windows",
    "budget",
    "food_storage_available",
    "food_reheating_available",
  ]);
  for (const camelCaseKey of [
    "ageYears",
    "residenceCountry",
    "heightCm",
    "weightKg",
    "waistCm",
    "averageDailySteps",
    "preferredMealCount",
  ]) {
    assert.equal(collectObjectKeys(snapshot).has(camelCaseKey), false);
  }
});

test("additional sports pass through completely without losing fields", () => {
  const intake = readJson(FULL_INTAKE_URL);
  const evaluationContext = readJson(EVALUATION_CONTEXT_URL);
  const sport = {
    sportCode: "FOOTBALL",
    otherSportText: null,
    days: ["MONDAY", "THURSDAY"],
    minutesPerSession: 75,
    intensity: "MODERATE",
    participationLevel: "RECREATIONAL",
  };
  intake.cardio.additionalSports = [sport];
  const intakeDecision = evaluateIntake(intake, evaluationContext);

  const snapshot = buildNutritionPlanningSnapshot({
    intake,
    evaluationContext,
    intakeDecision,
  });

  assert.deepEqual(snapshot.activity.additional_sports, [sport]);
  assert.deepEqual(Object.keys(snapshot.activity.additional_sports[0]), [
    "sportCode",
    "otherSportText",
    "days",
    "minutesPerSession",
    "intensity",
    "participationLevel",
  ]);
});

test("all five food-restriction groups pass through by value", () => {
  const intake = readJson(FULL_INTAKE_URL);
  const evaluationContext = readJson(EVALUATION_CONTEXT_URL);
  intake.nutrition.allergies = [
    { substance: "PEANUT", medicallyConfirmed: true },
  ];
  intake.nutrition.medicalExclusions = [
    { food: "GRAPEFRUIT", instruction: "EXCLUDE", source: "PHYSICIAN" },
  ];
  intake.nutrition.intolerances = [
    {
      substance: "LACTOSE",
      severity: "MILD",
      medicallyDiagnosed: false,
      notes: "Original client note",
    },
  ];
  intake.nutrition.digestiveIssues = [
    { name: "IBS", severity: "MILD" },
  ];
  intake.nutrition.dislikedFoods = ["TUNA", "OLIVES"];
  const intakeDecision = evaluateIntake(intake, evaluationContext);

  const snapshot = buildNutritionPlanningSnapshot({
    intake,
    evaluationContext,
    intakeDecision,
  });

  assert.deepEqual(snapshot.food_restrictions, {
    allergies: intake.nutrition.allergies,
    medical_exclusions: intake.nutrition.medicalExclusions,
    intolerances: intake.nutrition.intolerances,
    digestive_issues: intake.nutrition.digestiveIssues,
    disliked_foods: intake.nutrition.dislikedFoods,
  });
});

test("nutrition decision values, constraints, and reasons pass through", () => {
  const { intakeDecision, snapshot } = buildExampleSnapshot();

  assert.equal(
    snapshot.goal.calorie_direction,
    intakeDecision.nutrition_decision.calorie_direction,
  );
  assert.equal(
    snapshot.goal.decision_confidence,
    intakeDecision.nutrition_decision.confidence,
  );
  assert.equal(
    snapshot.meal_preferences.meal_count_strategy,
    intakeDecision.nutrition_decision.meal_count_strategy,
  );
  assert.deepEqual(
    snapshot.decision_context.nutrition_constraints,
    intakeDecision.nutrition_decision.constraints,
  );
  assert.deepEqual(
    snapshot.decision_context.nutrition_reasons,
    intakeDecision.nutrition_decision.reasons,
  );
});

test("training context values pass through without recalculation", () => {
  const { intake, evaluationContext, intakeDecision, snapshot } =
    buildExampleSnapshot();

  assert.deepEqual(
    {
      recommended_resistance_days:
        snapshot.activity.recommended_resistance_days,
      training_schedule_mode: snapshot.activity.training_schedule_mode,
      intro_week_required: snapshot.activity.intro_week_required,
      training_volume_start: snapshot.activity.training_volume_start,
    },
    {
      recommended_resistance_days:
        intakeDecision.training_decision.recommended_days,
      training_schedule_mode: intakeDecision.training_decision.schedule_mode,
      intro_week_required:
        intakeDecision.training_decision.intro_week_required,
      training_volume_start: intakeDecision.training_decision.volume_start,
    },
  );

  const zeroDayDecision = structuredClone(intakeDecision);
  zeroDayDecision.training_decision.recommended_days = 0;
  const zeroDaySnapshot = buildNutritionPlanningSnapshot({
    intake,
    evaluationContext,
    intakeDecision: zeroDayDecision,
  });
  assert.equal(zeroDaySnapshot.activity.recommended_resistance_days, 0);
});

test("a null average daily step count remains null", () => {
  const intake = readJson(FULL_INTAKE_URL);
  const evaluationContext = readJson(EVALUATION_CONTEXT_URL);
  intake.cardio.averageDailySteps = null;
  const intakeDecision = evaluateIntake(intake, evaluationContext);

  const snapshot = buildNutritionPlanningSnapshot({
    intake,
    evaluationContext,
    intakeDecision,
  });

  assert.equal(snapshot.activity.average_daily_steps, null);
});

test("a null or omitted waist measurement becomes null without a default", () => {
  for (const omitWaist of [false, true]) {
    const intake = readJson(FULL_INTAKE_URL);
    const evaluationContext = readJson(EVALUATION_CONTEXT_URL);
    if (omitWaist) {
      delete intake.body.waistCm;
    } else {
      intake.body.waistCm = null;
    }
    const intakeDecision = evaluateIntake(intake, evaluationContext);

    const snapshot = buildNutritionPlanningSnapshot({
      intake,
      evaluationContext,
      intakeDecision,
    });

    assert.equal(snapshot.body.waist_cm, null);
  }
});

test("invalid raw intake throws IntakeValidationError with validation issues", () => {
  const validInputs = buildExampleInputs();
  const intake = readJson(FULL_INTAKE_URL);
  delete intake.personal.dateOfBirth;
  const validationResult = validateIntake(
    intake,
    validInputs.evaluationContext,
  );
  assert.equal(validationResult.valid, false);

  assert.throws(
    () =>
      buildNutritionPlanningSnapshot({
        intake,
        evaluationContext: validInputs.evaluationContext,
        intakeDecision: validInputs.intakeDecision,
      }),
    (error) => {
      assert.equal(error instanceof IntakeValidationError, true);
      assert.deepEqual(error.issues, validationResult.issues);
      return true;
    },
  );
});

test("the minimum Intake Decision contract rejects every invalid field", () => {
  const { intake, evaluationContext, intakeDecision } = buildExampleInputs();
  const invalidDecisionFactories = [
    () => null,
    () => [],
    (decision) => ({ ...decision, plan_status: 1 }),
    (decision) => ({ ...decision, hard_constraints: {} }),
    (decision) => ({ ...decision, soft_preferences: {} }),
    (decision) => ({ ...decision, nutrition_decision: null }),
    (decision) => ({
      ...decision,
      nutrition_decision: {
        ...decision.nutrition_decision,
        calorie_direction: 1,
      },
    }),
    (decision) => ({
      ...decision,
      nutrition_decision: {
        ...decision.nutrition_decision,
        confidence: null,
      },
    }),
    (decision) => ({
      ...decision,
      nutrition_decision: {
        ...decision.nutrition_decision,
        meal_count_strategy: [],
      },
    }),
    (decision) => ({
      ...decision,
      nutrition_decision: {
        ...decision.nutrition_decision,
        constraints: {},
      },
    }),
    (decision) => ({
      ...decision,
      nutrition_decision: {
        ...decision.nutrition_decision,
        reasons: {},
      },
    }),
    (decision) => ({ ...decision, training_decision: null }),
    (decision) => ({
      ...decision,
      training_decision: {
        ...decision.training_decision,
        recommended_days: -1,
      },
    }),
    (decision) => ({
      ...decision,
      training_decision: {
        ...decision.training_decision,
        recommended_days: 2.5,
      },
    }),
    (decision) => ({
      ...decision,
      training_decision: {
        ...decision.training_decision,
        schedule_mode: 1,
      },
    }),
    (decision) => ({ ...decision, cardio_decision: [] }),
  ];

  for (const createInvalidDecision of invalidDecisionFactories) {
    const invalidDecision = createInvalidDecision(
      structuredClone(intakeDecision),
    );
    assert.throws(
      () =>
        buildNutritionPlanningSnapshot({
          intake,
          evaluationContext,
          intakeDecision: invalidDecision,
        }),
      TypeError,
    );
  }
});

test("building the snapshot does not modify any of the three inputs", () => {
  const inputs = buildExampleInputs();
  const before = {
    intake: structuredClone(inputs.intake),
    evaluationContext: structuredClone(inputs.evaluationContext),
    intakeDecision: structuredClone(inputs.intakeDecision),
  };

  buildNutritionPlanningSnapshot(inputs);

  assert.deepEqual(inputs, before);
});

test("later nested input changes cannot change the independent snapshot", () => {
  const { intake, evaluationContext, intakeDecision, snapshot } =
    buildExampleSnapshot();

  intake.nutrition.allergies[0].substance = "PEANUT";
  intake.nutrition.unavailableEatingWindows[0].start = "08:00";
  intake.cardio.additionalSports.push({ sportCode: "MUTATED" });
  evaluationContext.assessmentDate = "2030-01-01";
  intakeDecision.hard_constraints[0].code = "MUTATED";
  intakeDecision.nutrition_decision.constraints[0].code = "MUTATED";
  intakeDecision.cardio_decision.strategy = "MUTATED";

  assert.equal(snapshot.food_restrictions.allergies[0].substance, "SESAME");
  assert.equal(
    snapshot.meal_preferences.unavailable_eating_windows[0].start,
    "09:00",
  );
  assert.deepEqual(snapshot.activity.additional_sports, []);
  assert.equal(snapshot.assessment_date, "2026-07-14");
  assert.notEqual(snapshot.decision_context.hard_constraints[0].code, "MUTATED");
  assert.notEqual(
    snapshot.decision_context.nutrition_constraints[0].code,
    "MUTATED",
  );
  assert.equal(snapshot.decision_context.cardio_decision.strategy, "STEPS_ONLY");
});

test("the complete snapshot graph is deeply frozen", () => {
  const { snapshot } = buildExampleSnapshot();

  assertDeepFrozen(snapshot);
  assert.throws(() => {
    snapshot.assessment_date = "2030-01-01";
  }, TypeError);
  assert.throws(() => {
    snapshot.client.age_years = 99;
  }, TypeError);
  assert.throws(() => {
    snapshot.food_restrictions.allergies[0].substance = "PEANUT";
  }, TypeError);
  assert.throws(() => {
    snapshot.activity.physically_demanding_days.push("MONDAY");
  }, TypeError);
  assert.equal(snapshot.client.age_years, 32);
  assert.equal(snapshot.food_restrictions.allergies[0].substance, "SESAME");
});

test("snapshot contains no calorie, macro, meal, or food planning fields", () => {
  const { snapshot } = buildExampleSnapshot();
  const keys = collectObjectKeys(snapshot);

  for (const forbiddenKey of [
    "calories",
    "bmr",
    "tdee",
    "macros",
    "meals",
    "foods",
  ]) {
    assert.equal(keys.has(forbiddenKey), false);
  }
  assert.deepEqual(Object.keys(snapshot), [
    "snapshot_version",
    "assessment_date",
    "client",
    "goal",
    "body",
    "activity",
    "recovery",
    "meal_preferences",
    "food_restrictions",
    "decision_context",
  ]);
});

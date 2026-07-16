import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  CalorieDirection,
  evaluateIntake,
  Sex,
} from "../src/intake-decision-engine/index.js";
import {
  buildNutritionPlanningSnapshot,
  NUTRITION_PLANNING_SNAPSHOT_VERSION,
} from "z-coaching-intake-decision-engine/nutrition-planning-snapshot";
import {
  buildNutritionEnergyTarget,
  NUTRITION_ENERGY_TARGET_VERSION,
  NutritionEnergyCalculationMethod,
  NutritionEnergyTargetStatus,
  NutritionPalCategory,
} from "z-coaching-intake-decision-engine/nutrition-energy-target";
import * as nutritionMacroTargetsApi from "z-coaching-intake-decision-engine/nutrition-macro-targets";

const {
  buildNutritionMacroTargets,
  NUTRITION_MACRO_TARGETS_VERSION,
  NutritionMacroCalculationPolicy,
  NutritionMacroTargetsStatus,
} = nutritionMacroTargetsApi;

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

function makeSnapshot({
  client = {},
  body = {},
  goal = {},
  activity = {},
} = {}) {
  return {
    snapshot_version: NUTRITION_PLANNING_SNAPSHOT_VERSION,
    client: {
      age_years: 32,
      sex: Sex.FEMALE,
      ...client,
    },
    body: {
      height_cm: 165,
      weight_kg: 72,
      ...body,
    },
    goal: {
      calorie_direction: CalorieDirection.MAINTENANCE,
      ...goal,
    },
    activity: {
      recommended_resistance_days: 0,
      additional_sports: [],
      ...activity,
    },
  };
}

function makeEnergyTarget(
  snapshot,
  {
    status = NutritionEnergyTargetStatus.READY,
    targetCalories = 2310,
    calorieDirection = snapshot.goal.calorie_direction,
    calibrationRequired = targetCalories !== null,
    activityAssessment = {},
    constraints = [],
    reasons = [],
    ...overrides
  } = {},
) {
  return {
    energy_target_version: NUTRITION_ENERGY_TARGET_VERSION,
    source_snapshot_version: snapshot.snapshot_version,
    status,
    calculation_method:
      NutritionEnergyCalculationMethod.NASEM_DRI_2023_EER_ADULT,
    activity_assessment: {
      pal_category: NutritionPalCategory.INACTIVE,
      weighted_sport_minutes: 0,
      ...activityAssessment,
    },
    calorie_direction: calorieDirection,
    target_calories: targetCalories,
    calibration_required: calibrationRequired,
    constraints,
    reasons,
    ...overrides,
  };
}

function buildFrom(snapshot, energyTarget) {
  return buildNutritionMacroTargets({
    nutritionPlanningSnapshot: snapshot,
    nutritionEnergyTarget: energyTarget,
  });
}

function reasonCodes(targets) {
  return targets.reasons.map((reason) => reason.code);
}

function assertAllTargetsNull(targets) {
  assert.equal(targets.target_calories, null);
  assert.equal(targets.protein, null);
  assert.equal(targets.fat, null);
  assert.equal(targets.carbohydrate, null);
  assert.equal(targets.fiber_target_g, null);
  assert.equal(targets.macro_calories_total, null);
  assert.equal(targets.calorie_difference, null);
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

test("Public API exposes only the version, two frozen enums, and builder", () => {
  assert.equal(
    NUTRITION_MACRO_TARGETS_VERSION,
    "nutrition-macro-targets-v1",
  );
  assert.deepEqual(NutritionMacroTargetsStatus, {
    READY: "READY",
    PROVISIONAL_REVIEW_REQUIRED: "PROVISIONAL_REVIEW_REQUIRED",
    WITHHELD: "WITHHELD",
  });
  assert.deepEqual(NutritionMacroCalculationPolicy, {
    Z_COACHING_MACRO_POLICY_V1: "Z_COACHING_MACRO_POLICY_V1",
  });
  assert.equal(Object.isFrozen(NutritionMacroTargetsStatus), true);
  assert.equal(Object.isFrozen(NutritionMacroCalculationPolicy), true);
  assert.equal(typeof buildNutritionMacroTargets, "function");
  assert.deepEqual(Object.keys(nutritionMacroTargetsApi).sort(), [
    "NUTRITION_MACRO_TARGETS_VERSION",
    "NutritionMacroCalculationPolicy",
    "NutritionMacroTargetsStatus",
    "buildNutritionMacroTargets",
  ]);
});

test("actual intake flows end to end into the complete macro targets contract", () => {
  const intake = readJson(FULL_INTAKE_URL);
  const evaluationContext = readJson(EVALUATION_CONTEXT_URL);
  const intakeDecision = evaluateIntake(intake, evaluationContext);
  const nutritionPlanningSnapshot = buildNutritionPlanningSnapshot({
    intake,
    evaluationContext,
    intakeDecision,
  });
  const nutritionEnergyTarget = buildNutritionEnergyTarget(
    nutritionPlanningSnapshot,
  );
  const targets = buildFrom(
    nutritionPlanningSnapshot,
    nutritionEnergyTarget,
  );

  assert.deepEqual(Object.keys(targets), [
    "macro_targets_version",
    "source_snapshot_version",
    "source_energy_target_version",
    "source_energy_status",
    "status",
    "calculation_policy",
    "target_calories",
    "protein",
    "fat",
    "carbohydrate",
    "fiber_target_g",
    "macro_calories_total",
    "calorie_difference",
    "constraints",
    "reasons",
  ]);
  assert.equal(targets.macro_targets_version, NUTRITION_MACRO_TARGETS_VERSION);
  assert.equal(
    targets.source_snapshot_version,
    NUTRITION_PLANNING_SNAPSHOT_VERSION,
  );
  assert.equal(
    targets.source_energy_target_version,
    NUTRITION_ENERGY_TARGET_VERSION,
  );
  assert.equal(targets.source_energy_status, NutritionEnergyTargetStatus.READY);
  assert.equal(targets.status, NutritionMacroTargetsStatus.READY);
  assert.equal(
    targets.calculation_policy,
    NutritionMacroCalculationPolicy.Z_COACHING_MACRO_POLICY_V1,
  );
  assert.equal(targets.target_calories, 2310);
  assert.deepEqual(targets.protein, {
    target_g: 115,
    factor_g_per_kg: 1.6,
    reference_weight_kg: 72,
    reference_weight_basis: "ACTUAL_WEIGHT",
    energy_cap_g: 170,
    capped_by_energy_budget: false,
    calories: 460,
    percent_of_calories: 19.9,
  });
  assert.deepEqual(targets.fat, {
    target_g: 65,
    calories: 585,
    percent_of_calories: 25.3,
  });
  assert.deepEqual(targets.carbohydrate, {
    target_g: 316,
    calories: 1264,
    percent_of_calories: 54.7,
  });
  assert.equal(targets.fiber_target_g, 25);
  assert.equal(targets.macro_calories_total, 2309);
  assert.equal(targets.calorie_difference, -1);
  assert.deepEqual(
    targets.constraints,
    nutritionEnergyTarget.constraints,
  );
  assert.deepEqual(reasonCodes(targets), [
    "NASEM_DRI_2023_EER_APPLIED",
    "MAINTENANCE_DIRECTION_APPLIED",
    "CALIBRATION_REQUIRED",
    "MACRO_POLICY_APPLIED",
  ]);
  assert.equal(
    targets.reasons.at(-1).message,
    "Daily protein, fat, carbohydrate, and fiber targets were calculated using Z Coaching Macro Policy V1.",
  );
});

test("withheld energy status withholds every macro and fiber target", () => {
  const snapshot = makeSnapshot();
  const energyTarget = makeEnergyTarget(snapshot, {
    status: NutritionEnergyTargetStatus.WITHHELD,
    targetCalories: null,
    calibrationRequired: false,
    activityAssessment: { pal_category: null },
    constraints: [{ code: "UPSTREAM_CONSTRAINT", value: { kept: true } }],
    reasons: [{ code: "UPSTREAM_REASON", message: "Kept." }],
  });
  const targets = buildFrom(snapshot, energyTarget);

  assert.equal(targets.status, NutritionMacroTargetsStatus.WITHHELD);
  assert.equal(targets.source_energy_status, NutritionEnergyTargetStatus.WITHHELD);
  assertAllTargetsNull(targets);
  assert.deepEqual(targets.constraints, energyTarget.constraints);
  assert.deepEqual(reasonCodes(targets), [
    "UPSTREAM_REASON",
    "MACRO_TARGETS_WITHHELD_BY_ENERGY_STATUS",
  ]);
});

test("provisional energy without calories returns provisional null targets", () => {
  const snapshot = makeSnapshot();
  const energyTarget = makeEnergyTarget(snapshot, {
    status: NutritionEnergyTargetStatus.PROVISIONAL_REVIEW_REQUIRED,
    targetCalories: null,
    calibrationRequired: true,
    constraints: [{ code: "UPSTREAM_CONSTRAINT", value: { kept: true } }],
    reasons: [{ code: "UPSTREAM_REASON", message: "Kept." }],
  });
  const targets = buildFrom(snapshot, energyTarget);

  assert.equal(
    targets.status,
    NutritionMacroTargetsStatus.PROVISIONAL_REVIEW_REQUIRED,
  );
  assertAllTargetsNull(targets);
  assert.deepEqual(targets.constraints, energyTarget.constraints);
  assert.deepEqual(reasonCodes(targets), [
    "UPSTREAM_REASON",
    "MACRO_TARGETS_UNAVAILABLE_WITHOUT_CALORIE_TARGET",
  ]);
});

test("provisional energy with calories calculates macros and stays provisional", () => {
  const snapshot = makeSnapshot();
  const energyTarget = makeEnergyTarget(snapshot, {
    status: NutritionEnergyTargetStatus.PROVISIONAL_REVIEW_REQUIRED,
  });
  const targets = buildFrom(snapshot, energyTarget);

  assert.equal(
    targets.status,
    NutritionMacroTargetsStatus.PROVISIONAL_REVIEW_REQUIRED,
  );
  assert.notEqual(targets.protein, null);
  assert.notEqual(targets.fat, null);
  assert.notEqual(targets.carbohydrate, null);
  assert.equal(targets.fiber_target_g, 25);
  assert.ok(reasonCodes(targets).includes("MACRO_POLICY_APPLIED"));
});

test("protein factor is 1.2 without resistance or sport load", () => {
  const snapshot = makeSnapshot();
  const targets = buildFrom(snapshot, makeEnergyTarget(snapshot));

  assert.equal(targets.protein.factor_g_per_kg, 1.2);
  assert.equal(targets.protein.target_g, 85);
});

test("protein factor is 1.4 for a deficit without training load", () => {
  const snapshot = makeSnapshot({
    goal: { calorie_direction: CalorieDirection.DEFICIT },
  });
  const targets = buildFrom(snapshot, makeEnergyTarget(snapshot));

  assert.equal(targets.protein.factor_g_per_kg, 1.4);
  assert.equal(targets.protein.target_g, 100);
});

test("ordinary resistance or sport load produces protein factor 1.6", () => {
  const cases = [
    [{ recommended_resistance_days: 1 }, 0],
    [{ recommended_resistance_days: 3 }, 0],
    [{ recommended_resistance_days: 0 }, 1],
    [{ recommended_resistance_days: 0 }, 179.9],
  ];

  for (const [activity, weightedSportMinutes] of cases) {
    const snapshot = makeSnapshot({ activity });
    const targets = buildFrom(
      snapshot,
      makeEnergyTarget(snapshot, {
        activityAssessment: {
          weighted_sport_minutes: weightedSportMinutes,
        },
      }),
    );
    assert.equal(targets.protein.factor_g_per_kg, 1.6);
  }
});

test("high load or ordinary deficit training produces protein factor 1.8", () => {
  const cases = [
    {
      snapshot: makeSnapshot({
        activity: { recommended_resistance_days: 4 },
      }),
      weightedSportMinutes: 0,
    },
    {
      snapshot: makeSnapshot({
        activity: { recommended_resistance_days: 6 },
      }),
      weightedSportMinutes: 0,
    },
    {
      snapshot: makeSnapshot(),
      weightedSportMinutes: 180,
    },
    {
      snapshot: makeSnapshot({
        goal: { calorie_direction: CalorieDirection.DEFICIT },
        activity: { recommended_resistance_days: 2 },
      }),
      weightedSportMinutes: 0,
    },
  ];

  for (const { snapshot, weightedSportMinutes } of cases) {
    const targets = buildFrom(
      snapshot,
      makeEnergyTarget(snapshot, {
        activityAssessment: {
          weighted_sport_minutes: weightedSportMinutes,
        },
      }),
    );
    assert.equal(targets.protein.factor_g_per_kg, 1.8);
  }
});

test("high training load with deficit caps protein factor at 2.0", () => {
  const snapshot = makeSnapshot({
    goal: { calorie_direction: CalorieDirection.DEFICIT },
    activity: { recommended_resistance_days: 4 },
  });
  const targets = buildFrom(snapshot, makeEnergyTarget(snapshot));

  assert.equal(targets.protein.factor_g_per_kg, 2);
  assert.equal(targets.protein.target_g, 145);
});

test("high steps and PAL alone do not raise the protein factor", () => {
  const snapshot = makeSnapshot({
    activity: {
      recommended_resistance_days: 0,
      average_daily_steps: 20000,
    },
  });
  const targets = buildFrom(
    snapshot,
    makeEnergyTarget(snapshot, {
      activityAssessment: {
        pal_category: NutritionPalCategory.VERY_ACTIVE,
        weighted_sport_minutes: 0,
      },
    }),
  );

  assert.equal(targets.protein.factor_g_per_kg, 1.2);
});

test("BMI 30 caps protein reference weight without changing status", () => {
  const snapshot = makeSnapshot({
    body: { height_cm: 165, weight_kg: 100 },
  });
  const targets = buildFrom(snapshot, makeEnergyTarget(snapshot));

  assert.equal(targets.protein.reference_weight_kg, 81.7);
  assert.equal(
    targets.protein.reference_weight_basis,
    "BMI_30_CAPPED_WEIGHT",
  );
  assert.equal(targets.protein.target_g, 100);
  assert.equal(targets.status, NutritionMacroTargetsStatus.READY);
  assert.ok(reasonCodes(targets).includes("PROTEIN_REFERENCE_WEIGHT_CAPPED"));

  const boundarySnapshot = makeSnapshot({
    body: { height_cm: 165, weight_kg: 30 * 1.65 ** 2 },
  });
  const boundaryTargets = buildFrom(
    boundarySnapshot,
    makeEnergyTarget(boundarySnapshot),
  );
  assert.equal(
    boundaryTargets.protein.reference_weight_basis,
    "ACTUAL_WEIGHT",
  );
  assert.equal(boundaryTargets.protein.reference_weight_kg, 81.7);
});

test("protein energy cap applies at 30 percent without unnecessary review", () => {
  const snapshot = makeSnapshot({
    body: { height_cm: 180, weight_kg: 80 },
    activity: { recommended_resistance_days: 4 },
  });
  const targets = buildFrom(
    snapshot,
    makeEnergyTarget(snapshot, { targetCalories: 1600 }),
  );

  assert.equal(targets.protein.factor_g_per_kg, 1.8);
  assert.equal(targets.protein.energy_cap_g, 120);
  assert.equal(targets.protein.target_g, 120);
  assert.equal(targets.protein.capped_by_energy_budget, true);
  assert.equal(targets.status, NutritionMacroTargetsStatus.READY);
  assert.ok(reasonCodes(targets).includes("PROTEIN_ENERGY_CAP_APPLIED"));
  assert.equal(
    reasonCodes(targets).includes(
      "PROTEIN_TARGET_BELOW_POLICY_MINIMUM_REQUIRES_REVIEW",
    ),
    false,
  );

  const exactMinimumSnapshot = makeSnapshot({
    body: { height_cm: 165, weight_kg: 75 },
    activity: { recommended_resistance_days: 4 },
  });
  const exactMinimum = buildFrom(
    exactMinimumSnapshot,
    makeEnergyTarget(exactMinimumSnapshot, { targetCalories: 1200 }),
  );
  assert.equal(exactMinimum.protein.target_g, 90);
  assert.equal(
    exactMinimum.protein.target_g /
      exactMinimum.protein.reference_weight_kg,
    1.2,
  );
  assert.equal(exactMinimum.status, NutritionMacroTargetsStatus.READY);
});

test("protein energy cap is not applied when desired protein fits", () => {
  const snapshot = makeSnapshot();
  const targets = buildFrom(snapshot, makeEnergyTarget(snapshot));

  assert.equal(targets.protein.target_g, 85);
  assert.equal(targets.protein.energy_cap_g, 170);
  assert.equal(targets.protein.capped_by_energy_budget, false);
  assert.equal(
    reasonCodes(targets).includes("PROTEIN_ENERGY_CAP_APPLIED"),
    false,
  );

  const equalityTarget = buildFrom(
    snapshot,
    makeEnergyTarget(snapshot, { targetCalories: 1140 }),
  );
  assert.equal(equalityTarget.protein.target_g, 85);
  assert.equal(equalityTarget.protein.energy_cap_g, 85);
  assert.equal(equalityTarget.protein.capped_by_energy_budget, false);
  assert.equal(
    reasonCodes(equalityTarget).includes("PROTEIN_ENERGY_CAP_APPLIED"),
    false,
  );
});

test("protein below 1.2 g/kg after energy cap requires review but keeps macros", () => {
  const snapshot = makeSnapshot({
    goal: { calorie_direction: CalorieDirection.DEFICIT },
    activity: { recommended_resistance_days: 4 },
  });
  const targets = buildFrom(
    snapshot,
    makeEnergyTarget(snapshot, { targetCalories: 1000 }),
  );

  assert.equal(
    targets.status,
    NutritionMacroTargetsStatus.PROVISIONAL_REVIEW_REQUIRED,
  );
  assert.equal(targets.protein.factor_g_per_kg, 2);
  assert.equal(targets.protein.energy_cap_g, 75);
  assert.equal(targets.protein.target_g, 75);
  assert.equal(targets.protein.capped_by_energy_budget, true);
  assert.equal(targets.protein.calories, 300);
  assert.equal(targets.fat.target_g, 30);
  assert.equal(targets.carbohydrate.target_g, 108);
  assert.equal(targets.macro_calories_total, 1002);
  assert.equal(targets.calorie_difference, 2);
  assert.ok(
    reasonCodes(targets).includes(
      "PROTEIN_TARGET_BELOW_POLICY_MINIMUM_REQUIRES_REVIEW",
    ),
  );
});

test("fat policy starts from exactly 25 percent of target calories", () => {
  const snapshot = makeSnapshot();
  const targets = buildFrom(
    snapshot,
    makeEnergyTarget(snapshot, { targetCalories: 1800 }),
  );

  assert.equal(1800 * 0.25 / 9, 50);
  assert.equal(targets.fat.target_g, 50);
  assert.equal(targets.fat.calories, 450);
  assert.equal(targets.fat.percent_of_calories, 25);
});

test("fat grams round to the nearest five grams", () => {
  const snapshot = makeSnapshot();
  const targets = buildFrom(
    snapshot,
    makeEnergyTarget(snapshot, { targetCalories: 1900 }),
  );

  assert.ok(1900 * 0.25 / 9 > 52);
  assert.ok(1900 * 0.25 / 9 < 53);
  assert.equal(targets.fat.target_g, 55);
  assert.equal(targets.fat.calories, 495);

  const roundsDown = buildFrom(
    snapshot,
    makeEnergyTarget(snapshot, { targetCalories: 1850 }),
  );
  assert.ok(1850 * 0.25 / 9 > 51);
  assert.ok(1850 * 0.25 / 9 < 52);
  assert.equal(roundsDown.fat.target_g, 50);
});

test("carbohydrate uses only calories remaining after protein and fat", () => {
  const snapshot = makeSnapshot({
    activity: { recommended_resistance_days: 3 },
  });
  const targets = buildFrom(snapshot, makeEnergyTarget(snapshot));
  const remainingCalories =
    targets.target_calories -
    targets.protein.calories -
    targets.fat.calories;

  assert.equal(remainingCalories, 1265);
  assert.equal(targets.carbohydrate.target_g, Math.round(1265 / 4));
  assert.equal(targets.carbohydrate.calories, 1264);
});

test("macro calorie closure stays within two kcal after rounding", () => {
  for (const targetCalories of [1000, 1600, 1900, 2001, 2310, 4000]) {
    const snapshot = makeSnapshot();
    const targets = buildFrom(
      snapshot,
      makeEnergyTarget(snapshot, { targetCalories }),
    );
    const total =
      targets.protein.calories +
      targets.fat.calories +
      targets.carbohydrate.calories;

    assert.equal(targets.macro_calories_total, total);
    assert.equal(targets.calorie_difference, total - targetCalories);
    assert.ok(targets.calorie_difference >= -2);
    assert.ok(targets.calorie_difference <= 2);
  }
});

test("fiber follows adult sex and age bands without reducing carbohydrate", () => {
  const cases = [
    [Sex.MALE, 19, 38],
    [Sex.MALE, 50, 38],
    [Sex.MALE, 51, 30],
    [Sex.MALE, 80, 30],
    [Sex.FEMALE, 19, 25],
    [Sex.FEMALE, 50, 25],
    [Sex.FEMALE, 51, 21],
    [Sex.FEMALE, 80, 21],
  ];
  let carbohydrateTarget = null;

  for (const [sex, ageYears, expectedFiber] of cases) {
    const snapshot = makeSnapshot({
      client: { sex, age_years: ageYears },
    });
    const targets = buildFrom(snapshot, makeEnergyTarget(snapshot));
    assert.equal(targets.fiber_target_g, expectedFiber);
    carbohydrateTarget ??= targets.carbohydrate.target_g;
    assert.equal(targets.carbohydrate.target_g, carbohydrateTarget);
  }
});

test("calorie direction mismatch between inputs throws TypeError", () => {
  const snapshot = makeSnapshot();
  const energyTarget = makeEnergyTarget(snapshot, {
    calorieDirection: CalorieDirection.SURPLUS,
  });

  assert.throws(() => buildFrom(snapshot, energyTarget), TypeError);
});

test("version mismatches and basic contract violations throw TypeError", () => {
  const invalidPairs = [];
  const addMutation = (mutation) => {
    const snapshot = makeSnapshot();
    const energyTarget = makeEnergyTarget(snapshot);
    mutation(snapshot, energyTarget);
    invalidPairs.push([snapshot, energyTarget]);
  };

  invalidPairs.push([null, makeEnergyTarget(makeSnapshot())]);
  invalidPairs.push([[], makeEnergyTarget(makeSnapshot())]);
  invalidPairs.push([makeSnapshot(), null]);
  invalidPairs.push([makeSnapshot(), []]);
  addMutation((snapshot) => {
    snapshot.snapshot_version = "wrong-snapshot-version";
  });
  addMutation((snapshot) => {
    snapshot.client = null;
  });
  addMutation((snapshot) => {
    snapshot.client.age_years = -1;
  });
  addMutation((snapshot) => {
    snapshot.client.age_years = 32.5;
  });
  addMutation((snapshot) => {
    snapshot.client.sex = "UNKNOWN_SEX";
  });
  addMutation((snapshot) => {
    snapshot.body = null;
  });
  addMutation((snapshot) => {
    snapshot.body.height_cm = 0;
  });
  addMutation((snapshot) => {
    snapshot.body.weight_kg = Number.POSITIVE_INFINITY;
  });
  addMutation((snapshot) => {
    snapshot.goal = null;
  });
  addMutation((snapshot) => {
    snapshot.goal.calorie_direction = "CUT";
  });
  addMutation((snapshot) => {
    snapshot.activity = null;
  });
  addMutation((snapshot) => {
    snapshot.activity.recommended_resistance_days = 7;
  });
  addMutation((snapshot) => {
    snapshot.activity.additional_sports = null;
  });
  addMutation((_snapshot, energyTarget) => {
    energyTarget.energy_target_version = "wrong-energy-version";
  });
  addMutation((_snapshot, energyTarget) => {
    energyTarget.source_snapshot_version = "wrong-snapshot-version";
  });
  addMutation((_snapshot, energyTarget) => {
    energyTarget.status = "APPROVED";
  });
  addMutation((_snapshot, energyTarget) => {
    energyTarget.calculation_method = "UNKNOWN_METHOD";
  });
  addMutation((_snapshot, energyTarget) => {
    energyTarget.activity_assessment = null;
  });
  addMutation((_snapshot, energyTarget) => {
    energyTarget.activity_assessment.pal_category = "EXTREME";
  });
  addMutation((_snapshot, energyTarget) => {
    energyTarget.activity_assessment.weighted_sport_minutes = -1;
  });
  addMutation((_snapshot, energyTarget) => {
    energyTarget.activity_assessment.weighted_sport_minutes = Infinity;
  });
  addMutation((_snapshot, energyTarget) => {
    energyTarget.calorie_direction = "CUT";
  });
  addMutation((_snapshot, energyTarget) => {
    energyTarget.constraints = null;
  });
  addMutation((_snapshot, energyTarget) => {
    energyTarget.reasons = null;
  });
  addMutation((_snapshot, energyTarget) => {
    energyTarget.calibration_required = "true";
  });
  addMutation((_snapshot, energyTarget) => {
    energyTarget.target_calories = 0;
  });
  addMutation((_snapshot, energyTarget) => {
    energyTarget.target_calories = 2000.5;
  });
  addMutation((snapshot, energyTarget) => {
    snapshot.client.age_years = 18;
    energyTarget.status = NutritionEnergyTargetStatus.PROVISIONAL_REVIEW_REQUIRED;
  });
  addMutation((snapshot, energyTarget) => {
    snapshot.client.sex = Sex.OTHER;
    energyTarget.status = NutritionEnergyTargetStatus.PROVISIONAL_REVIEW_REQUIRED;
  });

  for (const [snapshot, energyTarget] of invalidPairs) {
    assert.throws(() => buildFrom(snapshot, energyTarget), TypeError);
  }
});

test("ready energy target without target calories throws TypeError", () => {
  const snapshot = makeSnapshot();
  const energyTarget = makeEnergyTarget(snapshot, {
    targetCalories: null,
    calibrationRequired: false,
  });

  assert.throws(() => buildFrom(snapshot, energyTarget), TypeError);
});

test("withheld energy target with target calories throws TypeError", () => {
  const snapshot = makeSnapshot();
  const energyTarget = makeEnergyTarget(snapshot, {
    status: NutritionEnergyTargetStatus.WITHHELD,
  });

  assert.throws(() => buildFrom(snapshot, energyTarget), TypeError);
});

test("calorie-bearing energy target without calibration throws TypeError", () => {
  const snapshot = makeSnapshot();
  const energyTarget = makeEnergyTarget(snapshot, {
    status: NutritionEnergyTargetStatus.PROVISIONAL_REVIEW_REQUIRED,
    calibrationRequired: false,
  });

  assert.throws(() => buildFrom(snapshot, energyTarget), TypeError);
});

test("building macro targets never mutates either input", () => {
  const snapshot = makeSnapshot({
    activity: { additional_sports: [{ sportCode: "RUNNING" }] },
  });
  const energyTarget = makeEnergyTarget(snapshot, {
    constraints: [{ code: "EXAMPLE", value: { nested: ["kept"] } }],
    reasons: [{ code: "UPSTREAM", message: "Kept." }],
  });
  const snapshotBefore = structuredClone(snapshot);
  const energyBefore = structuredClone(energyTarget);

  buildFrom(snapshot, energyTarget);

  assert.deepEqual(snapshot, snapshotBefore);
  assert.deepEqual(energyTarget, energyBefore);
  assert.equal(Object.isFrozen(snapshot), false);
  assert.equal(Object.isFrozen(energyTarget), false);
  assert.equal(Object.isFrozen(snapshot.activity.additional_sports), false);
  assert.equal(Object.isFrozen(energyTarget.constraints[0].value), false);
  snapshot.activity.additional_sports.push({ sportCode: "CYCLING" });
  energyTarget.constraints[0].value.nested.push("source-only");
  energyTarget.reasons.push({ code: "LATER", message: "Still mutable." });
});

test("macro targets output is independent and deeply frozen", () => {
  const snapshot = makeSnapshot();
  const energyTarget = makeEnergyTarget(snapshot, {
    constraints: [{ code: "EXAMPLE", value: { nested: ["kept"] } }],
  });
  const targets = buildFrom(snapshot, energyTarget);

  assert.notStrictEqual(targets, snapshot);
  assert.notStrictEqual(targets, energyTarget);
  assertDeepFrozen(targets);
  assert.throws(() => {
    targets.protein.target_g = 999;
  }, TypeError);
  assert.throws(() => {
    targets.constraints[0].value.nested.push("changed");
  }, TypeError);
});

test("constraints pass by value without shared nested references", () => {
  const snapshot = makeSnapshot();
  const energyTarget = makeEnergyTarget(snapshot, {
    constraints: [{ code: "EXAMPLE", value: { nested: ["kept"] } }],
  });
  const targets = buildFrom(snapshot, energyTarget);

  assert.deepEqual(targets.constraints, energyTarget.constraints);
  assert.notStrictEqual(targets.constraints, energyTarget.constraints);
  assert.notStrictEqual(targets.constraints[0], energyTarget.constraints[0]);
  assert.notStrictEqual(
    targets.constraints[0].value.nested,
    energyTarget.constraints[0].value.nested,
  );
  energyTarget.constraints[0].value.nested.push("source-only");
  assert.deepEqual(targets.constraints[0].value.nested, ["kept"]);
});

test("upstream reasons pass by value and duplicate reason codes are removed", () => {
  const snapshot = makeSnapshot();
  const energyTarget = makeEnergyTarget(snapshot, {
    reasons: [
      { code: "UPSTREAM", message: "First.", meta: { nested: ["kept"] } },
      { code: "UPSTREAM", message: "Duplicate." },
      {
        code: "MACRO_POLICY_APPLIED",
        message: "Existing macro policy reason.",
      },
    ],
  });
  const targets = buildFrom(snapshot, energyTarget);
  const codes = reasonCodes(targets);

  assert.deepEqual(codes, ["UPSTREAM", "MACRO_POLICY_APPLIED"]);
  assert.equal(new Set(codes).size, codes.length);
  assert.notStrictEqual(targets.reasons, energyTarget.reasons);
  assert.notStrictEqual(targets.reasons[0], energyTarget.reasons[0]);
  assert.notStrictEqual(
    targets.reasons[0].meta.nested,
    energyTarget.reasons[0].meta.nested,
  );
});

test("output contains no meal, food, supplement, or cycling fields", () => {
  const snapshot = makeSnapshot();
  const keys = collectObjectKeys(
    buildFrom(snapshot, makeEnergyTarget(snapshot)),
  );

  for (const forbidden of [
    "meals",
    "foods",
    "meal_distribution",
    "meal_templates",
    "supplements",
    "saturated_fat",
    "carb_cycling",
  ]) {
    assert.equal(keys.has(forbidden), false);
  }
});

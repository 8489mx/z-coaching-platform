import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  evaluateIntake,
  MealCountStrategy,
} from "../src/intake-decision-engine/index.js";
import {
  buildNutritionPlanningSnapshot,
  NUTRITION_PLANNING_SNAPSHOT_VERSION,
} from "z-coaching-intake-decision-engine/nutrition-planning-snapshot";
import {
  buildNutritionEnergyTarget,
} from "z-coaching-intake-decision-engine/nutrition-energy-target";
import {
  buildNutritionMacroTargets,
  NUTRITION_MACRO_TARGETS_VERSION,
  NutritionMacroCalculationPolicy,
  NutritionMacroTargetsStatus,
} from "z-coaching-intake-decision-engine/nutrition-macro-targets";
import * as nutritionMealDistributionApi from "z-coaching-intake-decision-engine/nutrition-meal-distribution";

const {
  buildNutritionMealDistribution,
  NUTRITION_MEAL_DISTRIBUTION_VERSION,
  NutritionMealDistributionPolicy,
  NutritionMealDistributionStatus,
  NutritionMealRole,
  NutritionMealTimingMode,
} = nutritionMealDistributionApi;

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
  preferredMealCount = 3,
  mealCountStrategy = MealCountStrategy.USE_CLIENT_PREFERENCE,
  unavailableEatingWindows = [],
  ...overrides
} = {}) {
  return {
    snapshot_version: NUTRITION_PLANNING_SNAPSHOT_VERSION,
    meal_preferences: {
      preferred_meal_count: preferredMealCount,
      meal_count_strategy: mealCountStrategy,
      unavailable_eating_windows: structuredClone(unavailableEatingWindows),
    },
    ...overrides,
  };
}

function makeMacroTargets(snapshot, options = {}) {
  const status = options.status ?? NutritionMacroTargetsStatus.READY;
  const withTargets = options.withTargets ??
    status !== NutritionMacroTargetsStatus.WITHHELD;
  const base = {
    macro_targets_version: NUTRITION_MACRO_TARGETS_VERSION,
    source_snapshot_version: snapshot.snapshot_version,
    status,
    calculation_policy:
      NutritionMacroCalculationPolicy.Z_COACHING_MACRO_POLICY_V1,
    target_calories: withTargets ? (options.targetCalories ?? 2310) : null,
    protein: withTargets
      ? structuredClone(options.protein ?? { target_g: 115, calories: 460 })
      : null,
    fat: withTargets
      ? structuredClone(options.fat ?? { target_g: 65, calories: 585 })
      : null,
    carbohydrate: withTargets
      ? structuredClone(
        options.carbohydrate ?? { target_g: 316, calories: 1264 },
      )
      : null,
    fiber_target_g: withTargets ? (options.fiberTargetG ?? 25) : null,
    macro_calories_total: withTargets
      ? (options.macroCaloriesTotal ?? 2309)
      : null,
    calorie_difference: withTargets
      ? (options.calorieDifference ?? -1)
      : null,
    constraints: structuredClone(options.constraints ?? []),
    reasons: structuredClone(options.reasons ?? []),
  };
  return { ...base, ...(options.overrides ?? {}) };
}

function buildFrom(snapshot, macroTargets) {
  return buildNutritionMealDistribution({
    nutritionPlanningSnapshot: snapshot,
    nutritionMacroTargets: macroTargets,
  });
}

function reasonCodes(distribution) {
  return distribution.reasons.map((reason) => reason.code);
}

function assertEmptyDistribution(distribution) {
  assert.equal(distribution.meal_count, null);
  assert.equal(distribution.daily_targets, null);
  assert.deepEqual(distribution.meals, []);
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

function distributionForMealCount(preferredMealCount) {
  const snapshot = makeSnapshot({ preferredMealCount });
  return buildFrom(snapshot, makeMacroTargets(snapshot));
}

test("Public API exposes only the version, four frozen enums, and builder", () => {
  assert.equal(
    NUTRITION_MEAL_DISTRIBUTION_VERSION,
    "nutrition-meal-distribution-v1",
  );
  assert.deepEqual(NutritionMealDistributionStatus, {
    READY: "READY",
    PROVISIONAL_REVIEW_REQUIRED: "PROVISIONAL_REVIEW_REQUIRED",
    WITHHELD: "WITHHELD",
  });
  assert.deepEqual(NutritionMealDistributionPolicy, {
    Z_COACHING_MEAL_DISTRIBUTION_V1:
      "Z_COACHING_MEAL_DISTRIBUTION_V1",
  });
  assert.deepEqual(NutritionMealRole, {
    BREAKFAST: "BREAKFAST",
    MAIN_MEAL: "MAIN_MEAL",
    SNACK: "SNACK",
    EVENING_MEAL: "EVENING_MEAL",
  });
  assert.deepEqual(NutritionMealTimingMode, {
    FLEXIBLE_SEQUENCE: "FLEXIBLE_SEQUENCE",
    AVOID_UNAVAILABLE_WINDOWS: "AVOID_UNAVAILABLE_WINDOWS",
    COACH_TO_CONFIRM: "COACH_TO_CONFIRM",
  });
  for (const runtimeEnum of [
    NutritionMealDistributionStatus,
    NutritionMealDistributionPolicy,
    NutritionMealRole,
    NutritionMealTimingMode,
  ]) {
    assert.equal(Object.isFrozen(runtimeEnum), true);
  }
  assert.equal(typeof buildNutritionMealDistribution, "function");
  assert.deepEqual(Object.keys(nutritionMealDistributionApi).sort(), [
    "NUTRITION_MEAL_DISTRIBUTION_VERSION",
    "NutritionMealDistributionPolicy",
    "NutritionMealDistributionStatus",
    "NutritionMealRole",
    "NutritionMealTimingMode",
    "buildNutritionMealDistribution",
  ]);
});

test("actual example flows end to end into the exact meal distribution", () => {
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
  const nutritionMacroTargets = buildNutritionMacroTargets({
    nutritionPlanningSnapshot,
    nutritionEnergyTarget,
  });
  const distribution = buildFrom(
    nutritionPlanningSnapshot,
    nutritionMacroTargets,
  );

  assert.deepEqual(Object.keys(distribution), [
    "meal_distribution_version",
    "source_snapshot_version",
    "source_macro_targets_version",
    "source_macro_status",
    "status",
    "distribution_policy",
    "preferred_meal_count",
    "meal_count",
    "timing_mode",
    "unavailable_eating_windows",
    "daily_targets",
    "meals",
    "constraints",
    "reasons",
  ]);
  assert.equal(distribution.meal_distribution_version,
    NUTRITION_MEAL_DISTRIBUTION_VERSION);
  assert.equal(distribution.source_snapshot_version,
    NUTRITION_PLANNING_SNAPSHOT_VERSION);
  assert.equal(distribution.source_macro_targets_version,
    NUTRITION_MACRO_TARGETS_VERSION);
  assert.equal(distribution.source_macro_status,
    NutritionMacroTargetsStatus.READY);
  assert.equal(distribution.status, NutritionMealDistributionStatus.READY);
  assert.equal(distribution.distribution_policy,
    NutritionMealDistributionPolicy.Z_COACHING_MEAL_DISTRIBUTION_V1);
  assert.equal(distribution.preferred_meal_count, 3);
  assert.equal(distribution.meal_count, 3);
  assert.equal(distribution.timing_mode,
    NutritionMealTimingMode.AVOID_UNAVAILABLE_WINDOWS);
  assert.deepEqual(distribution.unavailable_eating_windows, [
    { start: "09:00", end: "12:00" },
  ]);
  assert.deepEqual(distribution.daily_targets, {
    target_calories: 2310,
    macro_calories_total: 2309,
    protein_g: 115,
    fat_g: 65,
    carbohydrate_g: 316,
    fiber_g: 25,
  });
  assert.deepEqual(distribution.meals, [
    {
      sequence: 1,
      role: NutritionMealRole.BREAKFAST,
      policy_calorie_weight_percent: 30,
      protein_g: 39,
      fat_g: 19,
      carbohydrate_g: 95,
      fiber_g: 7,
      planned_calories: 707,
      actual_calorie_percent: 30.6,
    },
    {
      sequence: 2,
      role: NutritionMealRole.MAIN_MEAL,
      policy_calorie_weight_percent: 35,
      protein_g: 38,
      fat_g: 23,
      carbohydrate_g: 111,
      fiber_g: 9,
      planned_calories: 803,
      actual_calorie_percent: 34.8,
    },
    {
      sequence: 3,
      role: NutritionMealRole.EVENING_MEAL,
      policy_calorie_weight_percent: 35,
      protein_g: 38,
      fat_g: 23,
      carbohydrate_g: 110,
      fiber_g: 9,
      planned_calories: 799,
      actual_calorie_percent: 34.6,
    },
  ]);
  assert.deepEqual(distribution.constraints, nutritionMacroTargets.constraints);
  assert.deepEqual(reasonCodes(distribution), [
    "NASEM_DRI_2023_EER_APPLIED",
    "MAINTENANCE_DIRECTION_APPLIED",
    "CALIBRATION_REQUIRED",
    "MACRO_POLICY_APPLIED",
    "MEAL_DISTRIBUTION_POLICY_APPLIED",
    "REPORTED_UNAVAILABLE_WINDOWS_RETAINED",
  ]);
  assert.deepEqual(
    distribution.meals.map((meal) => meal.planned_calories),
    [707, 803, 799],
  );
});

test("WITHHELD macro status withholds meal distribution", () => {
  const snapshot = makeSnapshot();
  const distribution = buildFrom(snapshot, makeMacroTargets(snapshot, {
    status: NutritionMacroTargetsStatus.WITHHELD,
  }));

  assert.equal(distribution.source_macro_status,
    NutritionMacroTargetsStatus.WITHHELD);
  assert.equal(distribution.status, NutritionMealDistributionStatus.WITHHELD);
  assertEmptyDistribution(distribution);
  assert.ok(reasonCodes(distribution).includes(
    "MEAL_DISTRIBUTION_WITHHELD_BY_MACRO_STATUS"));
});

test("provisional macros without targets produce an empty provisional result", () => {
  const snapshot = makeSnapshot();
  const distribution = buildFrom(snapshot, makeMacroTargets(snapshot, {
    status: NutritionMacroTargetsStatus.PROVISIONAL_REVIEW_REQUIRED,
    withTargets: false,
  }));

  assert.equal(distribution.status,
    NutritionMealDistributionStatus.PROVISIONAL_REVIEW_REQUIRED);
  assertEmptyDistribution(distribution);
  assert.ok(reasonCodes(distribution).includes(
    "MEAL_DISTRIBUTION_UNAVAILABLE_WITHOUT_MACRO_TARGETS"));
});

test("provisional macros with targets are distributed without status promotion", () => {
  const snapshot = makeSnapshot();
  const distribution = buildFrom(snapshot, makeMacroTargets(snapshot, {
    status: NutritionMacroTargetsStatus.PROVISIONAL_REVIEW_REQUIRED,
  }));

  assert.equal(distribution.status,
    NutritionMealDistributionStatus.PROVISIONAL_REVIEW_REQUIRED);
  assert.equal(distribution.meal_count, 3);
  assert.equal(distribution.meals.length, 3);
  assert.ok(distribution.daily_targets);
});

test("COACH_TO_CONFIRM requires review even when complete macros exist", () => {
  const snapshot = makeSnapshot({
    mealCountStrategy: MealCountStrategy.COACH_TO_CONFIRM,
  });
  const distribution = buildFrom(snapshot, makeMacroTargets(snapshot));

  assert.equal(distribution.status,
    NutritionMealDistributionStatus.PROVISIONAL_REVIEW_REQUIRED);
  assert.equal(distribution.timing_mode,
    NutritionMealTimingMode.COACH_TO_CONFIRM);
  assertEmptyDistribution(distribution);
  assert.ok(reasonCodes(distribution).includes(
    "MEAL_COUNT_REQUIRES_COACH_CONFIRMATION"));
});

test("a preferred meal count of one remains unmodified and requires review", () => {
  const snapshot = makeSnapshot({ preferredMealCount: 1 });
  const distribution = buildFrom(snapshot, makeMacroTargets(snapshot));

  assert.equal(distribution.preferred_meal_count, 1);
  assert.equal(distribution.status,
    NutritionMealDistributionStatus.PROVISIONAL_REVIEW_REQUIRED);
  assertEmptyDistribution(distribution);
  assert.ok(reasonCodes(distribution).includes(
    "MEAL_COUNT_OUTSIDE_AUTOMATIC_V1_RANGE"));
});

test("preferred meal counts six through eight require review without substitution", () => {
  for (const preferredMealCount of [6, 7, 8]) {
    const snapshot = makeSnapshot({ preferredMealCount });
    const distribution = buildFrom(snapshot, makeMacroTargets(snapshot));
    assert.equal(distribution.preferred_meal_count, preferredMealCount);
    assert.equal(distribution.status,
      NutritionMealDistributionStatus.PROVISIONAL_REVIEW_REQUIRED);
    assertEmptyDistribution(distribution);
    assert.ok(reasonCodes(distribution).includes(
      "MEAL_COUNT_OUTSIDE_AUTOMATIC_V1_RANGE"));
  }
});

test("two-meal policy uses BREAKFAST and EVENING_MEAL at 50/50", () => {
  const distribution = distributionForMealCount(2);

  assert.deepEqual(distribution.meals.map((meal) => meal.role), [
    NutritionMealRole.BREAKFAST,
    NutritionMealRole.EVENING_MEAL,
  ]);
  assert.deepEqual(
    distribution.meals.map((meal) => meal.policy_calorie_weight_percent),
    [50, 50],
  );
  assert.deepEqual(distribution.meals.map((meal) => meal.planned_calories),
    [1161, 1148]);
});

test("three-meal policy uses the exact roles and 30/35/35 weights", () => {
  const distribution = distributionForMealCount(3);

  assert.deepEqual(distribution.meals.map((meal) => meal.role), [
    NutritionMealRole.BREAKFAST,
    NutritionMealRole.MAIN_MEAL,
    NutritionMealRole.EVENING_MEAL,
  ]);
  assert.deepEqual(
    distribution.meals.map((meal) => meal.policy_calorie_weight_percent),
    [30, 35, 35],
  );
});

test("four-meal policy uses the exact roles and 25/30/15/30 weights", () => {
  const distribution = distributionForMealCount(4);

  assert.deepEqual(distribution.meals.map((meal) => meal.role), [
    NutritionMealRole.BREAKFAST,
    NutritionMealRole.MAIN_MEAL,
    NutritionMealRole.SNACK,
    NutritionMealRole.EVENING_MEAL,
  ]);
  assert.deepEqual(
    distribution.meals.map((meal) => meal.policy_calorie_weight_percent),
    [25, 30, 15, 30],
  );
  assert.deepEqual(distribution.meals.map((meal) => meal.planned_calories),
    [576, 676, 394, 663]);
});

test("five-meal policy uses the exact roles and 20/10/30/10/30 weights", () => {
  const distribution = distributionForMealCount(5);

  assert.deepEqual(distribution.meals.map((meal) => meal.role), [
    NutritionMealRole.BREAKFAST,
    NutritionMealRole.SNACK,
    NutritionMealRole.MAIN_MEAL,
    NutritionMealRole.SNACK,
    NutritionMealRole.EVENING_MEAL,
  ]);
  assert.deepEqual(
    distribution.meals.map((meal) => meal.policy_calorie_weight_percent),
    [20, 10, 30, 10, 30],
  );
  assert.deepEqual(distribution.meals.map((meal) => meal.planned_calories),
    [461, 283, 652, 270, 643]);
});

test("protein is distributed evenly and closes exactly to its daily target", () => {
  for (const [mealCount, expected] of [
    [2, [58, 57]],
    [3, [39, 38, 38]],
    [4, [29, 29, 29, 28]],
    [5, [23, 23, 23, 23, 23]],
  ]) {
    const values = distributionForMealCount(mealCount).meals
      .map((meal) => meal.protein_g);
    assert.deepEqual(values, expected);
    assert.equal(values.reduce((total, value) => total + value, 0), 115);
  }
});

test("fat uses deterministic largest-remainder allocation", () => {
  assert.deepEqual(
    distributionForMealCount(4).meals.map((meal) => meal.fat_g),
    [16, 20, 10, 19],
  );
  assert.deepEqual(
    distributionForMealCount(5).meals.map((meal) => meal.fat_g),
    [13, 7, 20, 6, 19],
  );
});

test("carbohydrate uses deterministic largest-remainder allocation", () => {
  assert.deepEqual(
    distributionForMealCount(4).meals.map((meal) => meal.carbohydrate_g),
    [79, 95, 47, 95],
  );
  assert.deepEqual(
    distributionForMealCount(5).meals.map((meal) => meal.carbohydrate_g),
    [63, 32, 95, 31, 95],
  );
});

test("fiber uses deterministic largest-remainder allocation", () => {
  assert.deepEqual(
    distributionForMealCount(4).meals.map((meal) => meal.fiber_g),
    [6, 8, 4, 7],
  );
  assert.deepEqual(
    distributionForMealCount(5).meals.map((meal) => meal.fiber_g),
    [5, 3, 8, 2, 7],
  );
});

test("equal fractional remainders are resolved by lower sequence first", () => {
  const snapshot = makeSnapshot({ preferredMealCount: 2 });
  const macroTargets = makeMacroTargets(snapshot, {
    targetCalories: 17,
    protein: { target_g: 1, calories: 4 },
    fat: { target_g: 1, calories: 9 },
    carbohydrate: { target_g: 1, calories: 4 },
    fiberTargetG: 1,
    macroCaloriesTotal: 17,
    calorieDifference: 0,
  });
  const distribution = buildFrom(snapshot, macroTargets);

  assert.deepEqual(distribution.meals.map((meal) => meal.fat_g), [1, 0]);
  assert.deepEqual(
    distribution.meals.map((meal) => meal.carbohydrate_g),
    [1, 0],
  );
  assert.deepEqual(distribution.meals.map((meal) => meal.fiber_g), [1, 0]);
});

test("all distributed macros close exactly to the copied daily targets", () => {
  for (const mealCount of [2, 3, 4, 5]) {
    const distribution = distributionForMealCount(mealCount);
    for (const [mealField, targetField] of [
      ["protein_g", "protein_g"],
      ["fat_g", "fat_g"],
      ["carbohydrate_g", "carbohydrate_g"],
      ["fiber_g", "fiber_g"],
    ]) {
      assert.equal(
        distribution.meals.reduce(
          (total, meal) => total + meal[mealField],
          0,
        ),
        distribution.daily_targets[targetField],
      );
    }
  }
});

test("planned meal calories close exactly to macro_calories_total", () => {
  for (const mealCount of [2, 3, 4, 5]) {
    const distribution = distributionForMealCount(mealCount);
    assert.equal(
      distribution.meals.reduce(
        (total, meal) => total + meal.planned_calories,
        0,
      ),
      distribution.daily_targets.macro_calories_total,
    );
  }
});

test("actual calorie percentages use target calories and one decimal place", () => {
  const distribution = distributionForMealCount(3);
  assert.deepEqual(
    distribution.meals.map((meal) => meal.actual_calorie_percent),
    [30.6, 34.8, 34.6],
  );
  for (const meal of distribution.meals) {
    assert.equal(
      meal.actual_calorie_percent,
      Math.round(meal.planned_calories / 2310 * 1000) / 10,
    );
  }
});

test("unavailable eating windows pass by value without a shared reference", () => {
  const windows = [{ start: "09:00", end: "12:00" }];
  const snapshot = makeSnapshot({
    mealCountStrategy: MealCountStrategy.ADAPT_TO_EATING_WINDOWS,
    unavailableEatingWindows: windows,
  });
  const distribution = buildFrom(snapshot, makeMacroTargets(snapshot));

  assert.deepEqual(distribution.unavailable_eating_windows,
    snapshot.meal_preferences.unavailable_eating_windows);
  assert.notStrictEqual(distribution.unavailable_eating_windows,
    snapshot.meal_preferences.unavailable_eating_windows);
  assert.notStrictEqual(distribution.unavailable_eating_windows[0],
    snapshot.meal_preferences.unavailable_eating_windows[0]);
});

test("USE_CLIENT_PREFERENCE produces FLEXIBLE_SEQUENCE", () => {
  const snapshot = makeSnapshot({
    mealCountStrategy: MealCountStrategy.USE_CLIENT_PREFERENCE,
  });
  const distribution = buildFrom(snapshot, makeMacroTargets(snapshot));

  assert.equal(distribution.timing_mode,
    NutritionMealTimingMode.FLEXIBLE_SEQUENCE);
  assert.equal(reasonCodes(distribution).includes(
    "REPORTED_UNAVAILABLE_WINDOWS_RETAINED"), false);
});

test("ADAPT_TO_EATING_WINDOWS avoids reported windows without inventing times", () => {
  const snapshot = makeSnapshot({
    mealCountStrategy: MealCountStrategy.ADAPT_TO_EATING_WINDOWS,
    unavailableEatingWindows: [{ start: "09:00", end: "12:00" }],
  });
  const distribution = buildFrom(snapshot, makeMacroTargets(snapshot));

  assert.equal(distribution.timing_mode,
    NutritionMealTimingMode.AVOID_UNAVAILABLE_WINDOWS);
  assert.deepEqual(distribution.unavailable_eating_windows, [
    { start: "09:00", end: "12:00" },
  ]);
  assert.ok(reasonCodes(distribution).includes(
    "REPORTED_UNAVAILABLE_WINDOWS_RETAINED"));
  assert.equal(Object.keys(distribution.meals[0]).includes("meal_time"), false);
});

test("version mismatches and malformed macro contract fields throw TypeError", () => {
  const invalidInputFactories = [
    () => {
      const snapshot = makeSnapshot();
      snapshot.snapshot_version = "nutrition-planning-snapshot-v2";
      return [snapshot, makeMacroTargets(makeSnapshot())];
    },
    () => {
      const snapshot = makeSnapshot();
      return [snapshot, makeMacroTargets(snapshot, {
        overrides: { macro_targets_version: "nutrition-macro-targets-v2" },
      })];
    },
    () => {
      const snapshot = makeSnapshot();
      return [snapshot, makeMacroTargets(snapshot, {
        overrides: { source_snapshot_version: "wrong-version" },
      })];
    },
    () => {
      const snapshot = makeSnapshot();
      return [snapshot, makeMacroTargets(snapshot, {
        overrides: { status: "UNKNOWN" },
      })];
    },
    () => {
      const snapshot = makeSnapshot();
      return [snapshot, makeMacroTargets(snapshot, {
        overrides: { calculation_policy: "UNKNOWN" },
      })];
    },
    () => {
      const snapshot = makeSnapshot();
      return [snapshot, makeMacroTargets(snapshot, {
        overrides: { target_calories: 0 },
      })];
    },
    () => {
      const snapshot = makeSnapshot();
      return [snapshot, makeMacroTargets(snapshot, {
        overrides: { protein: [] },
      })];
    },
    () => {
      const snapshot = makeSnapshot();
      return [snapshot, makeMacroTargets(snapshot, {
        overrides: { fiber_target_g: 0 },
      })];
    },
    () => {
      const snapshot = makeSnapshot();
      return [snapshot, makeMacroTargets(snapshot, {
        overrides: { macro_calories_total: 0 },
      })];
    },
    () => {
      const snapshot = makeSnapshot();
      return [snapshot, makeMacroTargets(snapshot, {
        overrides: { calorie_difference: 3 },
      })];
    },
    () => {
      const snapshot = makeSnapshot();
      return [snapshot, makeMacroTargets(snapshot, {
        overrides: { constraints: {} },
      })];
    },
    () => {
      const snapshot = makeSnapshot();
      return [snapshot, makeMacroTargets(snapshot, {
        overrides: { reasons: {} },
      })];
    },
    () => {
      const snapshot = makeSnapshot();
      return [snapshot, makeMacroTargets(snapshot, {
        status: NutritionMacroTargetsStatus.WITHHELD,
        overrides: { target_calories: 1000 },
      })];
    },
  ];

  for (const createInvalidInput of invalidInputFactories) {
    const [snapshot, macroTargets] = createInvalidInput();
    assert.throws(() => buildFrom(snapshot, macroTargets), TypeError);
  }
});

test("invalid snapshot meal preferences and eating windows throw TypeError", () => {
  const invalidSnapshotFactories = [
    () => null,
    () => [],
    () => ({ snapshot_version: NUTRITION_PLANNING_SNAPSHOT_VERSION }),
    () => ({
      ...makeSnapshot(),
      meal_preferences: null,
    }),
    ...[0, 9, 1.5].map((preferredMealCount) => () =>
      makeSnapshot({ preferredMealCount })),
    () => makeSnapshot({ mealCountStrategy: "UNKNOWN" }),
    () => ({
      ...makeSnapshot(),
      meal_preferences: {
        ...makeSnapshot().meal_preferences,
        unavailable_eating_windows: {},
      },
    }),
    () => makeSnapshot({ unavailableEatingWindows: [null] }),
    () => makeSnapshot({
      unavailableEatingWindows: [{ start: "9:00", end: "12:00" }],
    }),
    () => makeSnapshot({
      unavailableEatingWindows: [{ start: "09:00", end: "24:00" }],
    }),
    () => makeSnapshot({
      unavailableEatingWindows: [{ start: "12:00", end: "12:00" }],
    }),
    () => makeSnapshot({
      unavailableEatingWindows: [{ start: "13:00", end: "12:00" }],
    }),
  ];

  for (const createInvalidSnapshot of invalidSnapshotFactories) {
    const snapshot = createInvalidSnapshot();
    const macroSnapshot = makeSnapshot();
    const macroTargets = makeMacroTargets(macroSnapshot, {
      overrides: {
        source_snapshot_version: NUTRITION_PLANNING_SNAPSHOT_VERSION,
      },
    });
    assert.throws(() => buildFrom(snapshot, macroTargets), TypeError);
  }
});

test("READY macro status without complete targets throws TypeError", () => {
  const snapshot = makeSnapshot();
  const macroTargets = makeMacroTargets(snapshot, {
    status: NutritionMacroTargetsStatus.READY,
    withTargets: false,
  });

  assert.throws(() => buildFrom(snapshot, macroTargets), TypeError);
});

test("macro calories that do not match grams throw TypeError", () => {
  for (const field of ["protein", "fat", "carbohydrate"]) {
    const snapshot = makeSnapshot();
    const macroTargets = makeMacroTargets(snapshot);
    macroTargets[field].calories += 1;
    assert.throws(() => buildFrom(snapshot, macroTargets), TypeError);
  }
});

test("inconsistent macro calorie totals or calorie_difference throw TypeError", () => {
  const snapshot = makeSnapshot();
  const wrongTotal = makeMacroTargets(snapshot, {
    overrides: { macro_calories_total: 2308 },
  });
  const wrongDifference = makeMacroTargets(snapshot, {
    overrides: { calorie_difference: 0 },
  });

  assert.throws(() => buildFrom(snapshot, wrongTotal), TypeError);
  assert.throws(() => buildFrom(snapshot, wrongDifference), TypeError);
});

test("building does not mutate or freeze either input", () => {
  const snapshot = makeSnapshot({
    mealCountStrategy: MealCountStrategy.ADAPT_TO_EATING_WINDOWS,
    unavailableEatingWindows: [{ start: "09:00", end: "12:00" }],
  });
  const macroTargets = makeMacroTargets(snapshot, {
    constraints: [{ code: "KEEP_CONSTRAINT", details: { value: 1 } }],
    reasons: [{ code: "KEEP_REASON", message: "Keep this reason." }],
  });
  const snapshotBefore = structuredClone(snapshot);
  const macroTargetsBefore = structuredClone(macroTargets);

  buildFrom(snapshot, macroTargets);

  assert.deepEqual(snapshot, snapshotBefore);
  assert.deepEqual(macroTargets, macroTargetsBefore);
  assert.equal(Object.isFrozen(snapshot), false);
  assert.equal(Object.isFrozen(snapshot.meal_preferences), false);
  assert.equal(Object.isFrozen(macroTargets), false);
  assert.equal(Object.isFrozen(macroTargets.constraints[0]), false);
});

test("output is independent from inputs and deeply frozen", () => {
  const snapshot = makeSnapshot({
    unavailableEatingWindows: [{ start: "09:00", end: "12:00" }],
  });
  const macroTargets = makeMacroTargets(snapshot, {
    constraints: [{ code: "KEEP_CONSTRAINT", details: { value: 1 } }],
    reasons: [{ code: "KEEP_REASON", message: "Keep this reason." }],
  });
  const distribution = buildFrom(snapshot, macroTargets);
  const distributionBefore = structuredClone(distribution);

  assertDeepFrozen(distribution);
  assert.notStrictEqual(distribution.constraints, macroTargets.constraints);
  assert.notStrictEqual(distribution.constraints[0], macroTargets.constraints[0]);
  assert.notStrictEqual(distribution.reasons, macroTargets.reasons);
  assert.notStrictEqual(distribution.reasons[0], macroTargets.reasons[0]);
  snapshot.meal_preferences.unavailable_eating_windows[0].start = "08:00";
  macroTargets.constraints[0].details.value = 2;
  macroTargets.reasons[0].message = "Changed.";
  assert.deepEqual(distribution, distributionBefore);
  assert.throws(() => {
    distribution.meals[0].protein_g = 0;
  }, TypeError);
});

test("constraints and reasons pass by value and duplicate reason codes are removed", () => {
  const snapshot = makeSnapshot();
  const macroTargets = makeMacroTargets(snapshot, {
    constraints: [{ code: "KEEP_CONSTRAINT", details: { value: 1 } }],
    reasons: [
      { code: "UPSTREAM_REASON", message: "First." },
      { code: "UPSTREAM_REASON", message: "Duplicate." },
    ],
  });
  const distribution = buildFrom(snapshot, macroTargets);

  assert.deepEqual(distribution.constraints, macroTargets.constraints);
  assert.notStrictEqual(distribution.constraints, macroTargets.constraints);
  assert.deepEqual(reasonCodes(distribution), [
    "UPSTREAM_REASON",
    "MEAL_DISTRIBUTION_POLICY_APPLIED",
  ]);
  assert.equal(
    distribution.reasons.at(-1).message,
    "Daily macro and fiber targets were distributed across meal slots using Z Coaching Meal Distribution V1.",
  );
});

test("output excludes food assembly, meal times, supplements, and day cycling", () => {
  const snapshot = makeSnapshot();
  const distribution = buildFrom(snapshot, makeMacroTargets(snapshot));
  const keys = collectObjectKeys(distribution);

  for (const forbiddenKey of [
    "foods",
    "food_items",
    "meals_as_foods",
    "meal_templates",
    "serving_sizes",
    "meal_times",
    "clock_times",
    "supplements",
    "training_day_targets",
    "rest_day_targets",
  ]) {
    assert.equal(keys.has(forbiddenKey), false);
  }
});

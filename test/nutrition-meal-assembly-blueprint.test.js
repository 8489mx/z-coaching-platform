import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { evaluateIntake } from "../src/intake-decision-engine/index.js";
import {
  buildNutritionPlanningSnapshot,
  NUTRITION_PLANNING_SNAPSHOT_VERSION,
} from "z-coaching-intake-decision-engine/nutrition-planning-snapshot";
import {
  buildNutritionEnergyTarget,
} from "z-coaching-intake-decision-engine/nutrition-energy-target";
import {
  buildNutritionMacroTargets,
} from "z-coaching-intake-decision-engine/nutrition-macro-targets";
import {
  buildNutritionMealDistribution,
  NUTRITION_MEAL_DISTRIBUTION_VERSION,
  NutritionMealDistributionPolicy,
  NutritionMealDistributionStatus,
  NutritionMealRole,
} from "z-coaching-intake-decision-engine/nutrition-meal-distribution";
import * as nutritionMealAssemblyApi from "z-coaching-intake-decision-engine/nutrition-meal-assembly-blueprint";

const {
  buildNutritionMealAssemblyBlueprint,
  NUTRITION_MEAL_ASSEMBLY_BLUEPRINT_VERSION,
  NutritionAddedFatPolicy,
  NutritionComponentRequirement,
  NutritionFoodClass,
  NutritionMealAssemblyPolicy,
  NutritionMealAssemblyStatus,
  NutritionMealComponentSlot,
  NutritionMealPatternCode,
} = nutritionMealAssemblyApi;

const FULL_INTAKE_URL = new URL(
  "../examples/full-intake.json",
  import.meta.url,
);
const EVALUATION_CONTEXT_URL = new URL(
  "../examples/evaluation-context.json",
  import.meta.url,
);

const DEFAULT_MEALS = Object.freeze([
  Object.freeze({
    sequence: 1,
    role: NutritionMealRole.BREAKFAST,
    planned_calories: 707,
    protein_g: 39,
    fat_g: 19,
    carbohydrate_g: 95,
    fiber_g: 7,
  }),
  Object.freeze({
    sequence: 2,
    role: NutritionMealRole.MAIN_MEAL,
    planned_calories: 803,
    protein_g: 38,
    fat_g: 23,
    carbohydrate_g: 111,
    fiber_g: 9,
  }),
  Object.freeze({
    sequence: 3,
    role: NutritionMealRole.EVENING_MEAL,
    planned_calories: 799,
    protein_g: 38,
    fat_g: 23,
    carbohydrate_g: 110,
    fiber_g: 9,
  }),
]);

const FOUR_ROLE_MEALS = Object.freeze([
  Object.freeze({
    sequence: 1,
    role: NutritionMealRole.BREAKFAST,
    planned_calories: 576,
    protein_g: 29,
    fat_g: 16,
    carbohydrate_g: 79,
    fiber_g: 6,
  }),
  Object.freeze({
    sequence: 2,
    role: NutritionMealRole.MAIN_MEAL,
    planned_calories: 676,
    protein_g: 29,
    fat_g: 20,
    carbohydrate_g: 95,
    fiber_g: 8,
  }),
  Object.freeze({
    sequence: 3,
    role: NutritionMealRole.SNACK,
    planned_calories: 394,
    protein_g: 29,
    fat_g: 10,
    carbohydrate_g: 47,
    fiber_g: 4,
  }),
  Object.freeze({
    sequence: 4,
    role: NutritionMealRole.EVENING_MEAL,
    planned_calories: 663,
    protein_g: 28,
    fat_g: 19,
    carbohydrate_g: 95,
    fiber_g: 7,
  }),
]);

const FIVE_ROLE_MEALS = Object.freeze([
  Object.freeze({
    sequence: 1,
    role: NutritionMealRole.BREAKFAST,
    planned_calories: 461,
    protein_g: 23,
    fat_g: 13,
    carbohydrate_g: 63,
    fiber_g: 5,
  }),
  Object.freeze({
    sequence: 2,
    role: NutritionMealRole.SNACK,
    planned_calories: 283,
    protein_g: 23,
    fat_g: 7,
    carbohydrate_g: 32,
    fiber_g: 3,
  }),
  Object.freeze({
    sequence: 3,
    role: NutritionMealRole.MAIN_MEAL,
    planned_calories: 652,
    protein_g: 23,
    fat_g: 20,
    carbohydrate_g: 95,
    fiber_g: 8,
  }),
  Object.freeze({
    sequence: 4,
    role: NutritionMealRole.SNACK,
    planned_calories: 270,
    protein_g: 23,
    fat_g: 6,
    carbohydrate_g: 31,
    fiber_g: 2,
  }),
  Object.freeze({
    sequence: 5,
    role: NutritionMealRole.EVENING_MEAL,
    planned_calories: 643,
    protein_g: 23,
    fat_g: 19,
    carbohydrate_g: 95,
    fiber_g: 7,
  }),
]);

function requiredSlot(sequence, slot, maxItems, allowedFoodClasses) {
  return {
    sequence,
    slot,
    requirement: NutritionComponentRequirement.REQUIRED,
    min_items: 1,
    max_items: maxItems,
    allowed_food_classes: allowedFoodClasses,
  };
}

function optionalSlot(sequence, slot, allowedFoodClasses) {
  return {
    sequence,
    slot,
    requirement: NutritionComponentRequirement.OPTIONAL,
    min_items: 0,
    max_items: 1,
    allowed_food_classes: allowedFoodClasses,
  };
}

function fatSlot(sequence) {
  return optionalSlot(
    sequence,
    NutritionMealComponentSlot.ADDED_FAT,
    [NutritionFoodClass.ADDED_FAT],
  );
}

function expectedPattern(code, mealRole, slots) {
  return {
    code,
    meal_role: mealRole,
    added_fat_policy:
      NutritionAddedFatPolicy.OPTIONAL_ONLY_IF_NEEDED_AFTER_BASE_COMPONENTS,
    slots,
  };
}

function classicSlots() {
  return [
    requiredSlot(
      1,
      NutritionMealComponentSlot.PROTEIN_ANCHOR,
      1,
      [NutritionFoodClass.ANIMAL_PROTEIN, NutritionFoodClass.EGG],
    ),
    requiredSlot(
      2,
      NutritionMealComponentSlot.CARBOHYDRATE_BASE,
      1,
      [NutritionFoodClass.STARCH],
    ),
    requiredSlot(
      3,
      NutritionMealComponentSlot.VEGETABLE,
      2,
      [NutritionFoodClass.NON_STARCH_VEGETABLE],
    ),
    fatSlot(4),
  ];
}

function legumeSlots() {
  return [
    requiredSlot(
      1,
      NutritionMealComponentSlot.PROTEIN_ANCHOR,
      1,
      [NutritionFoodClass.LEGUME],
    ),
    requiredSlot(
      2,
      NutritionMealComponentSlot.CARBOHYDRATE_BASE,
      1,
      [NutritionFoodClass.STARCH],
    ),
    requiredSlot(
      3,
      NutritionMealComponentSlot.VEGETABLE,
      2,
      [NutritionFoodClass.NON_STARCH_VEGETABLE],
    ),
    optionalSlot(
      4,
      NutritionMealComponentSlot.DAIRY_SUPPORT,
      [NutritionFoodClass.DAIRY_PROTEIN],
    ),
    fatSlot(5),
  ];
}

const EXPECTED_PATTERNS = Object.freeze({
  [NutritionMealPatternCode.BREAKFAST_SAVORY]: expectedPattern(
    NutritionMealPatternCode.BREAKFAST_SAVORY,
    NutritionMealRole.BREAKFAST,
    [
      requiredSlot(
        1,
        NutritionMealComponentSlot.PROTEIN_ANCHOR,
        2,
        [NutritionFoodClass.EGG, NutritionFoodClass.DAIRY_PROTEIN],
      ),
      requiredSlot(
        2,
        NutritionMealComponentSlot.CARBOHYDRATE_BASE,
        1,
        [NutritionFoodClass.STARCH],
      ),
      requiredSlot(
        3,
        NutritionMealComponentSlot.VEGETABLE,
        2,
        [NutritionFoodClass.NON_STARCH_VEGETABLE],
      ),
      fatSlot(4),
    ],
  ),
  [NutritionMealPatternCode.BREAKFAST_DAIRY_FRUIT]: expectedPattern(
    NutritionMealPatternCode.BREAKFAST_DAIRY_FRUIT,
    NutritionMealRole.BREAKFAST,
    [
      requiredSlot(
        1,
        NutritionMealComponentSlot.PROTEIN_ANCHOR,
        1,
        [NutritionFoodClass.DAIRY_PROTEIN],
      ),
      requiredSlot(
        2,
        NutritionMealComponentSlot.CARBOHYDRATE_BASE,
        1,
        [NutritionFoodClass.STARCH],
      ),
      requiredSlot(
        3,
        NutritionMealComponentSlot.FRUIT,
        1,
        [NutritionFoodClass.FRUIT],
      ),
      fatSlot(4),
    ],
  ),
  [NutritionMealPatternCode.BREAKFAST_LEGUME]: expectedPattern(
    NutritionMealPatternCode.BREAKFAST_LEGUME,
    NutritionMealRole.BREAKFAST,
    legumeSlots(),
  ),
  [NutritionMealPatternCode.MAIN_CLASSIC]: expectedPattern(
    NutritionMealPatternCode.MAIN_CLASSIC,
    NutritionMealRole.MAIN_MEAL,
    classicSlots(),
  ),
  [NutritionMealPatternCode.MAIN_LEGUME]: expectedPattern(
    NutritionMealPatternCode.MAIN_LEGUME,
    NutritionMealRole.MAIN_MEAL,
    legumeSlots(),
  ),
  [NutritionMealPatternCode.EVENING_CLASSIC]: expectedPattern(
    NutritionMealPatternCode.EVENING_CLASSIC,
    NutritionMealRole.EVENING_MEAL,
    classicSlots(),
  ),
  [NutritionMealPatternCode.EVENING_LIGHT_SAVORY]: expectedPattern(
    NutritionMealPatternCode.EVENING_LIGHT_SAVORY,
    NutritionMealRole.EVENING_MEAL,
    [
      requiredSlot(
        1,
        NutritionMealComponentSlot.PROTEIN_ANCHOR,
        2,
        [
          NutritionFoodClass.EGG,
          NutritionFoodClass.DAIRY_PROTEIN,
          NutritionFoodClass.ANIMAL_PROTEIN,
        ],
      ),
      requiredSlot(
        2,
        NutritionMealComponentSlot.CARBOHYDRATE_BASE,
        1,
        [NutritionFoodClass.STARCH],
      ),
      requiredSlot(
        3,
        NutritionMealComponentSlot.VEGETABLE,
        2,
        [NutritionFoodClass.NON_STARCH_VEGETABLE],
      ),
      fatSlot(4),
    ],
  ),
  [NutritionMealPatternCode.SNACK_DAIRY_FRUIT]: expectedPattern(
    NutritionMealPatternCode.SNACK_DAIRY_FRUIT,
    NutritionMealRole.SNACK,
    [
      requiredSlot(
        1,
        NutritionMealComponentSlot.PROTEIN_ANCHOR,
        1,
        [NutritionFoodClass.DAIRY_PROTEIN],
      ),
      requiredSlot(
        2,
        NutritionMealComponentSlot.FRUIT,
        1,
        [NutritionFoodClass.FRUIT],
      ),
      optionalSlot(
        3,
        NutritionMealComponentSlot.CARBOHYDRATE_BASE,
        [NutritionFoodClass.STARCH],
      ),
      fatSlot(4),
    ],
  ),
  [NutritionMealPatternCode.SNACK_PROTEIN_CARB]: expectedPattern(
    NutritionMealPatternCode.SNACK_PROTEIN_CARB,
    NutritionMealRole.SNACK,
    [
      requiredSlot(
        1,
        NutritionMealComponentSlot.PROTEIN_ANCHOR,
        1,
        [
          NutritionFoodClass.DAIRY_PROTEIN,
          NutritionFoodClass.EGG,
          NutritionFoodClass.ANIMAL_PROTEIN,
        ],
      ),
      requiredSlot(
        2,
        NutritionMealComponentSlot.CARBOHYDRATE_BASE,
        1,
        [NutritionFoodClass.STARCH],
      ),
      optionalSlot(
        3,
        NutritionMealComponentSlot.FRUIT,
        [NutritionFoodClass.FRUIT],
      ),
      fatSlot(4),
    ],
  ),
});

function readJson(url) {
  return JSON.parse(readFileSync(url, "utf8"));
}

function makeSnapshot({
  budget = "MEDIUM",
  foodStorageAvailable = true,
  foodReheatingAvailable = true,
  foodRestrictions = {},
  ...overrides
} = {}) {
  return {
    snapshot_version: NUTRITION_PLANNING_SNAPSHOT_VERSION,
    meal_preferences: {
      budget,
      food_storage_available: foodStorageAvailable,
      food_reheating_available: foodReheatingAvailable,
    },
    food_restrictions: {
      allergies: [],
      medical_exclusions: [],
      intolerances: [],
      digestive_issues: [],
      disliked_foods: [],
      ...structuredClone(foodRestrictions),
    },
    ...overrides,
  };
}

function dailyTargetsForMeals(meals) {
  const sum = (field) =>
    meals.reduce((total, meal) => total + meal[field], 0);
  return {
    target_calories: 2310,
    macro_calories_total: sum("planned_calories"),
    protein_g: sum("protein_g"),
    fat_g: sum("fat_g"),
    carbohydrate_g: sum("carbohydrate_g"),
    fiber_g: sum("fiber_g"),
  };
}

function makeDistribution(snapshot, options = {}) {
  const status = options.status ?? NutritionMealDistributionStatus.READY;
  const withMeals = options.withMeals ??
    status !== NutritionMealDistributionStatus.WITHHELD;
  const meals = withMeals
    ? structuredClone(options.meals ?? DEFAULT_MEALS)
    : [];
  const dailyTargets = withMeals
    ? structuredClone(options.dailyTargets ?? dailyTargetsForMeals(meals))
    : null;
  return {
    meal_distribution_version: NUTRITION_MEAL_DISTRIBUTION_VERSION,
    source_snapshot_version: snapshot.snapshot_version,
    status,
    distribution_policy:
      NutritionMealDistributionPolicy.Z_COACHING_MEAL_DISTRIBUTION_V1,
    meal_count: withMeals ? meals.length : null,
    daily_targets: dailyTargets,
    meals,
    constraints: structuredClone(options.constraints ?? []),
    reasons: structuredClone(options.reasons ?? []),
    ...(options.overrides ?? {}),
  };
}

function buildFrom(snapshot, distribution) {
  return buildNutritionMealAssemblyBlueprint({
    nutritionPlanningSnapshot: snapshot,
    nutritionMealDistribution: distribution,
  });
}

function buildAllRolesBlueprint() {
  const snapshot = makeSnapshot();
  return buildFrom(snapshot, makeDistribution(snapshot, {
    meals: FOUR_ROLE_MEALS,
  }));
}

function uniquePatterns(blueprint) {
  const byCode = new Map();
  for (const meal of blueprint.meals) {
    for (const pattern of meal.allowed_patterns) {
      byCode.set(pattern.code, pattern);
    }
  }
  return [...byCode.values()];
}

function patternsForRole(blueprint, role) {
  return blueprint.meals.find((meal) => meal.role === role).allowed_patterns;
}

function patternCodes(patterns) {
  return patterns.map((pattern) => pattern.code);
}

function isRequired(pattern, componentSlot) {
  return pattern.slots.some(
    (slot) =>
      slot.slot === componentSlot &&
      slot.requirement === NutritionComponentRequirement.REQUIRED,
  );
}

function reasonCodes(blueprint) {
  return blueprint.reasons.map((reason) => reason.code);
}

function assertEmptyBlueprint(blueprint) {
  assert.equal(blueprint.meal_count, null);
  assert.deepEqual(blueprint.meals, []);
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

test("Public API exposes only the version, seven frozen enums, and builder", () => {
  assert.equal(
    NUTRITION_MEAL_ASSEMBLY_BLUEPRINT_VERSION,
    "nutrition-meal-assembly-blueprint-v1",
  );
  assert.deepEqual(NutritionMealAssemblyStatus, {
    READY: "READY",
    PROVISIONAL_REVIEW_REQUIRED: "PROVISIONAL_REVIEW_REQUIRED",
    WITHHELD: "WITHHELD",
  });
  assert.deepEqual(NutritionMealAssemblyPolicy, {
    Z_COACHING_MEAL_ASSEMBLY_V1: "Z_COACHING_MEAL_ASSEMBLY_V1",
  });
  assert.deepEqual(NutritionMealPatternCode, {
    BREAKFAST_SAVORY: "BREAKFAST_SAVORY",
    BREAKFAST_DAIRY_FRUIT: "BREAKFAST_DAIRY_FRUIT",
    BREAKFAST_LEGUME: "BREAKFAST_LEGUME",
    MAIN_CLASSIC: "MAIN_CLASSIC",
    MAIN_LEGUME: "MAIN_LEGUME",
    EVENING_CLASSIC: "EVENING_CLASSIC",
    EVENING_LIGHT_SAVORY: "EVENING_LIGHT_SAVORY",
    SNACK_DAIRY_FRUIT: "SNACK_DAIRY_FRUIT",
    SNACK_PROTEIN_CARB: "SNACK_PROTEIN_CARB",
  });
  assert.deepEqual(NutritionMealComponentSlot, {
    PROTEIN_ANCHOR: "PROTEIN_ANCHOR",
    CARBOHYDRATE_BASE: "CARBOHYDRATE_BASE",
    VEGETABLE: "VEGETABLE",
    FRUIT: "FRUIT",
    DAIRY_SUPPORT: "DAIRY_SUPPORT",
    ADDED_FAT: "ADDED_FAT",
  });
  assert.deepEqual(NutritionFoodClass, {
    ANIMAL_PROTEIN: "ANIMAL_PROTEIN",
    EGG: "EGG",
    DAIRY_PROTEIN: "DAIRY_PROTEIN",
    LEGUME: "LEGUME",
    STARCH: "STARCH",
    FRUIT: "FRUIT",
    NON_STARCH_VEGETABLE: "NON_STARCH_VEGETABLE",
    ADDED_FAT: "ADDED_FAT",
  });
  assert.deepEqual(NutritionComponentRequirement, {
    REQUIRED: "REQUIRED",
    OPTIONAL: "OPTIONAL",
  });
  assert.deepEqual(NutritionAddedFatPolicy, {
    NOT_APPLICABLE: "NOT_APPLICABLE",
    OPTIONAL_ONLY_IF_NEEDED_AFTER_BASE_COMPONENTS:
      "OPTIONAL_ONLY_IF_NEEDED_AFTER_BASE_COMPONENTS",
  });
  for (const runtimeEnum of [
    NutritionMealAssemblyStatus,
    NutritionMealAssemblyPolicy,
    NutritionMealPatternCode,
    NutritionMealComponentSlot,
    NutritionFoodClass,
    NutritionComponentRequirement,
    NutritionAddedFatPolicy,
  ]) {
    assert.equal(Object.isFrozen(runtimeEnum), true);
  }
  assert.equal(typeof buildNutritionMealAssemblyBlueprint, "function");
  assert.deepEqual(Object.keys(nutritionMealAssemblyApi).sort(), [
    "NUTRITION_MEAL_ASSEMBLY_BLUEPRINT_VERSION",
    "NutritionAddedFatPolicy",
    "NutritionComponentRequirement",
    "NutritionFoodClass",
    "NutritionMealAssemblyPolicy",
    "NutritionMealAssemblyStatus",
    "NutritionMealComponentSlot",
    "NutritionMealPatternCode",
    "buildNutritionMealAssemblyBlueprint",
  ]);
});

test("actual example flows end to end into the exact assembly blueprint", () => {
  const intake = readJson(FULL_INTAKE_URL);
  const evaluationContext = readJson(EVALUATION_CONTEXT_URL);
  const intakeDecision = evaluateIntake(intake, evaluationContext);
  const snapshot = buildNutritionPlanningSnapshot({
    intake,
    evaluationContext,
    intakeDecision,
  });
  const energyTarget = buildNutritionEnergyTarget(snapshot);
  const macroTargets = buildNutritionMacroTargets({
    nutritionPlanningSnapshot: snapshot,
    nutritionEnergyTarget: energyTarget,
  });
  const distribution = buildNutritionMealDistribution({
    nutritionPlanningSnapshot: snapshot,
    nutritionMacroTargets: macroTargets,
  });
  const blueprint = buildFrom(snapshot, distribution);

  assert.deepEqual(Object.keys(blueprint), [
    "assembly_blueprint_version",
    "source_snapshot_version",
    "source_meal_distribution_version",
    "source_distribution_status",
    "status",
    "assembly_policy",
    "meal_count",
    "logistics",
    "food_restrictions",
    "meals",
    "constraints",
    "reasons",
  ]);
  assert.equal(blueprint.status, NutritionMealAssemblyStatus.READY);
  assert.equal(blueprint.meal_count, 3);
  assert.equal(blueprint.meals.length, 3);
  assert.deepEqual(blueprint.logistics, {
    budget: "MEDIUM",
    food_storage_available: true,
    food_reheating_available: true,
  });
  assert.ok(blueprint.food_restrictions.allergies.some(
    (allergy) => allergy.substance === "SESAME"));
  assert.ok(blueprint.food_restrictions.disliked_foods.includes("TUNA"));
  assert.deepEqual(blueprint.meals[0].target, {
    planned_calories: 707,
    protein_g: 39,
    fat_g: 19,
    carbohydrate_g: 95,
    fiber_g: 7,
  });
  assert.deepEqual(patternCodes(blueprint.meals[0].allowed_patterns), [
    NutritionMealPatternCode.BREAKFAST_SAVORY,
    NutritionMealPatternCode.BREAKFAST_DAIRY_FRUIT,
    NutritionMealPatternCode.BREAKFAST_LEGUME,
  ]);
  assert.deepEqual(patternCodes(blueprint.meals[1].allowed_patterns), [
    NutritionMealPatternCode.MAIN_CLASSIC,
    NutritionMealPatternCode.MAIN_LEGUME,
  ]);
  assert.deepEqual(patternCodes(blueprint.meals[2].allowed_patterns), [
    NutritionMealPatternCode.EVENING_CLASSIC,
    NutritionMealPatternCode.EVENING_LIGHT_SAVORY,
  ]);
  assert.deepEqual(blueprint.constraints, distribution.constraints);
  assert.deepEqual(reasonCodes(blueprint), [
    "NASEM_DRI_2023_EER_APPLIED",
    "MAINTENANCE_DIRECTION_APPLIED",
    "CALIBRATION_REQUIRED",
    "MACRO_POLICY_APPLIED",
    "MEAL_DISTRIBUTION_POLICY_APPLIED",
    "REPORTED_UNAVAILABLE_WINDOWS_RETAINED",
    "MEAL_ASSEMBLY_BLUEPRINT_POLICY_APPLIED",
    "FOOD_RESTRICTIONS_RETAINED_FOR_FOOD_SELECTION",
  ]);
});

test("WITHHELD distribution withholds the assembly blueprint", () => {
  const snapshot = makeSnapshot();
  const blueprint = buildFrom(snapshot, makeDistribution(snapshot, {
    status: NutritionMealDistributionStatus.WITHHELD,
  }));

  assert.equal(blueprint.source_distribution_status,
    NutritionMealDistributionStatus.WITHHELD);
  assert.equal(blueprint.status, NutritionMealAssemblyStatus.WITHHELD);
  assertEmptyBlueprint(blueprint);
  assert.ok(reasonCodes(blueprint).includes(
    "MEAL_ASSEMBLY_WITHHELD_BY_DISTRIBUTION_STATUS"));
});

test("provisional distribution without meals produces an empty blueprint", () => {
  const snapshot = makeSnapshot();
  const blueprint = buildFrom(snapshot, makeDistribution(snapshot, {
    status: NutritionMealDistributionStatus.PROVISIONAL_REVIEW_REQUIRED,
    withMeals: false,
  }));

  assert.equal(blueprint.status,
    NutritionMealAssemblyStatus.PROVISIONAL_REVIEW_REQUIRED);
  assertEmptyBlueprint(blueprint);
  assert.ok(reasonCodes(blueprint).includes(
    "MEAL_ASSEMBLY_UNAVAILABLE_WITHOUT_DISTRIBUTED_MEALS"));
});

test("provisional distribution with meals builds patterns without promotion", () => {
  const snapshot = makeSnapshot();
  const blueprint = buildFrom(snapshot, makeDistribution(snapshot, {
    status: NutritionMealDistributionStatus.PROVISIONAL_REVIEW_REQUIRED,
  }));

  assert.equal(blueprint.status,
    NutritionMealAssemblyStatus.PROVISIONAL_REVIEW_REQUIRED);
  assert.equal(blueprint.meal_count, 3);
  assert.equal(blueprint.meals.length, 3);
  assert.ok(blueprint.meals.every((meal) => meal.allowed_patterns.length > 0));
});

test("BREAKFAST maps to the three exact patterns in approved order", () => {
  const patterns = patternsForRole(
    buildAllRolesBlueprint(),
    NutritionMealRole.BREAKFAST,
  );
  assert.deepEqual(patternCodes(patterns), [
    NutritionMealPatternCode.BREAKFAST_SAVORY,
    NutritionMealPatternCode.BREAKFAST_DAIRY_FRUIT,
    NutritionMealPatternCode.BREAKFAST_LEGUME,
  ]);
  for (const pattern of patterns) {
    assert.deepEqual(pattern, EXPECTED_PATTERNS[pattern.code]);
  }
});

test("MAIN_MEAL maps to the two exact patterns in approved order", () => {
  const patterns = patternsForRole(
    buildAllRolesBlueprint(),
    NutritionMealRole.MAIN_MEAL,
  );
  assert.deepEqual(patternCodes(patterns), [
    NutritionMealPatternCode.MAIN_CLASSIC,
    NutritionMealPatternCode.MAIN_LEGUME,
  ]);
  for (const pattern of patterns) {
    assert.deepEqual(pattern, EXPECTED_PATTERNS[pattern.code]);
  }
});

test("EVENING_MEAL maps to the two exact patterns in approved order", () => {
  const patterns = patternsForRole(
    buildAllRolesBlueprint(),
    NutritionMealRole.EVENING_MEAL,
  );
  assert.deepEqual(patternCodes(patterns), [
    NutritionMealPatternCode.EVENING_CLASSIC,
    NutritionMealPatternCode.EVENING_LIGHT_SAVORY,
  ]);
  for (const pattern of patterns) {
    assert.deepEqual(pattern, EXPECTED_PATTERNS[pattern.code]);
  }
});

test("SNACK maps to the two exact patterns in approved order", () => {
  const patterns = patternsForRole(
    buildAllRolesBlueprint(),
    NutritionMealRole.SNACK,
  );
  assert.deepEqual(patternCodes(patterns), [
    NutritionMealPatternCode.SNACK_DAIRY_FRUIT,
    NutritionMealPatternCode.SNACK_PROTEIN_CARB,
  ]);
  for (const pattern of patterns) {
    assert.deepEqual(pattern, EXPECTED_PATTERNS[pattern.code]);
  }
});

test("every pattern contains one required protein anchor", () => {
  for (const pattern of uniquePatterns(buildAllRolesBlueprint())) {
    const anchors = pattern.slots.filter((slot) =>
      slot.slot === NutritionMealComponentSlot.PROTEIN_ANCHOR);
    assert.equal(anchors.length, 1);
    assert.equal(
      anchors[0].requirement,
      NutritionComponentRequirement.REQUIRED,
    );
    assert.ok(anchors[0].min_items >= 1);
  }
});

test("breakfast patterns require carbohydrate and fruit or vegetable", () => {
  const breakfastPatterns = patternsForRole(
    buildAllRolesBlueprint(),
    NutritionMealRole.BREAKFAST,
  );
  for (const pattern of breakfastPatterns) {
    assert.equal(isRequired(
      pattern,
      NutritionMealComponentSlot.CARBOHYDRATE_BASE,
    ), true);
    assert.equal(
      isRequired(pattern, NutritionMealComponentSlot.FRUIT) ||
      isRequired(pattern, NutritionMealComponentSlot.VEGETABLE),
      true,
    );
  }
});

test("main and evening patterns require protein, carbohydrate, and vegetable", () => {
  const blueprint = buildAllRolesBlueprint();
  for (const role of [
    NutritionMealRole.MAIN_MEAL,
    NutritionMealRole.EVENING_MEAL,
  ]) {
    for (const pattern of patternsForRole(blueprint, role)) {
      assert.equal(isRequired(
        pattern,
        NutritionMealComponentSlot.PROTEIN_ANCHOR,
      ), true);
      assert.equal(isRequired(
        pattern,
        NutritionMealComponentSlot.CARBOHYDRATE_BASE,
      ), true);
      assert.equal(isRequired(
        pattern,
        NutritionMealComponentSlot.VEGETABLE,
      ), true);
    }
  }
});

test("snack patterns require protein with fruit or carbohydrate", () => {
  for (const pattern of patternsForRole(
    buildAllRolesBlueprint(),
    NutritionMealRole.SNACK,
  )) {
    assert.equal(isRequired(
      pattern,
      NutritionMealComponentSlot.PROTEIN_ANCHOR,
    ), true);
    assert.equal(
      isRequired(pattern, NutritionMealComponentSlot.FRUIT) ||
      isRequired(pattern, NutritionMealComponentSlot.CARBOHYDRATE_BASE),
      true,
    );
  }
});

test("added fat is optional 0..1 under the approved policy in every pattern", () => {
  for (const pattern of uniquePatterns(buildAllRolesBlueprint())) {
    assert.equal(
      pattern.added_fat_policy,
      NutritionAddedFatPolicy.OPTIONAL_ONLY_IF_NEEDED_AFTER_BASE_COMPONENTS,
    );
    const fatSlots = pattern.slots.filter((slot) =>
      slot.slot === NutritionMealComponentSlot.ADDED_FAT);
    assert.equal(fatSlots.length, 1);
    assert.equal(
      fatSlots[0].requirement,
      NutritionComponentRequirement.OPTIONAL,
    );
    assert.equal(fatSlots[0].min_items, 0);
    assert.equal(fatSlots[0].max_items, 1);
  }
});

test("no pattern contains required fat or free added-fat food classes", () => {
  for (const pattern of uniquePatterns(buildAllRolesBlueprint())) {
    for (const slot of pattern.slots) {
      if (slot.slot === NutritionMealComponentSlot.ADDED_FAT) {
        assert.equal(
          slot.requirement,
          NutritionComponentRequirement.OPTIONAL,
        );
        assert.deepEqual(slot.allowed_food_classes, [
          NutritionFoodClass.ADDED_FAT,
        ]);
      } else {
        assert.equal(
          slot.allowed_food_classes.includes(NutritionFoodClass.ADDED_FAT),
          false,
        );
      }
    }
  }
});

test("component slots do not repeat within a pattern", () => {
  for (const pattern of uniquePatterns(buildAllRolesBlueprint())) {
    const slots = pattern.slots.map((slot) => slot.slot);
    assert.equal(new Set(slots).size, slots.length);
  }
});

test("slot sequences start at one, remain contiguous, and are deeply frozen", () => {
  for (const pattern of uniquePatterns(buildAllRolesBlueprint())) {
    assert.deepEqual(
      pattern.slots.map((slot) => slot.sequence),
      Array.from({ length: pattern.slots.length }, (_, index) => index + 1),
    );
    assertDeepFrozen(pattern);
  }
});

test("allowed food classes are known and unique in every exact pattern", () => {
  const knownClasses = Object.values(NutritionFoodClass);
  const patterns = uniquePatterns(buildAllRolesBlueprint());
  assert.equal(patterns.length, Object.keys(EXPECTED_PATTERNS).length);
  for (const pattern of patterns) {
    assert.deepEqual(pattern, EXPECTED_PATTERNS[pattern.code]);
    for (const slot of pattern.slots) {
      assert.ok(slot.allowed_food_classes.length > 0);
      assert.ok(slot.allowed_food_classes.every((foodClass) =>
        knownClasses.includes(foodClass)));
      assert.equal(
        new Set(slot.allowed_food_classes).size,
        slot.allowed_food_classes.length,
      );
    }
  }
});

test("each meal target passes by value without recalculation or extra fields", () => {
  const snapshot = makeSnapshot();
  const distribution = makeDistribution(snapshot);
  distribution.meals[0].policy_calorie_weight_percent = 30;
  distribution.meals[0].actual_calorie_percent = 30.6;
  const blueprint = buildFrom(snapshot, distribution);

  assert.deepEqual(blueprint.meals[0].target, {
    planned_calories: distribution.meals[0].planned_calories,
    protein_g: distribution.meals[0].protein_g,
    fat_g: distribution.meals[0].fat_g,
    carbohydrate_g: distribution.meals[0].carbohydrate_g,
    fiber_g: distribution.meals[0].fiber_g,
  });
  assert.deepEqual(Object.keys(blueprint.meals[0].target), [
    "planned_calories",
    "protein_g",
    "fat_g",
    "carbohydrate_g",
    "fiber_g",
  ]);
});

test("blueprint meal targets close exactly to distribution daily targets", () => {
  const snapshot = makeSnapshot();
  const distribution = makeDistribution(snapshot, {
    meals: FOUR_ROLE_MEALS,
  });
  const blueprint = buildFrom(snapshot, distribution);
  const sum = (field) => blueprint.meals.reduce(
    (total, meal) => total + meal.target[field],
    0,
  );

  assert.equal(sum("protein_g"), distribution.daily_targets.protein_g);
  assert.equal(sum("fat_g"), distribution.daily_targets.fat_g);
  assert.equal(
    sum("carbohydrate_g"),
    distribution.daily_targets.carbohydrate_g,
  );
  assert.equal(sum("fiber_g"), distribution.daily_targets.fiber_g);
  assert.equal(
    sum("planned_calories"),
    distribution.daily_targets.macro_calories_total,
  );
});

test("logistics pass from snapshot by value", () => {
  const snapshot = makeSnapshot({
    budget: "HIGH",
    foodStorageAvailable: true,
    foodReheatingAvailable: true,
  });
  const blueprint = buildFrom(snapshot, makeDistribution(snapshot));

  assert.deepEqual(blueprint.logistics, {
    budget: "HIGH",
    food_storage_available: true,
    food_reheating_available: true,
  });
  assert.notStrictEqual(blueprint.logistics, snapshot.meal_preferences);
});

test("lack of food storage is retained once without changing status", () => {
  const snapshot = makeSnapshot({ foodStorageAvailable: false });
  const blueprint = buildFrom(snapshot, makeDistribution(snapshot));
  const matchingReasons = reasonCodes(blueprint).filter((code) =>
    code === "NO_FOOD_STORAGE_SELECTION_RESTRICTION_RETAINED");

  assert.equal(blueprint.status, NutritionMealAssemblyStatus.READY);
  assert.equal(blueprint.logistics.food_storage_available, false);
  assert.equal(matchingReasons.length, 1);
});

test("lack of food reheating is retained once without changing status", () => {
  const snapshot = makeSnapshot({ foodReheatingAvailable: false });
  const blueprint = buildFrom(snapshot, makeDistribution(snapshot));
  const matchingReasons = reasonCodes(blueprint).filter((code) =>
    code === "NO_FOOD_REHEATING_SELECTION_RESTRICTION_RETAINED");

  assert.equal(blueprint.status, NutritionMealAssemblyStatus.READY);
  assert.equal(blueprint.logistics.food_reheating_available, false);
  assert.equal(matchingReasons.length, 1);
});

test("all five food restriction groups pass by value", () => {
  const restrictions = {
    allergies: [{ substance: "SESAME", medicallyConfirmed: true }],
    medical_exclusions: [{ substance: "GRAPEFRUIT" }],
    intolerances: [{ substance: "LACTOSE", severity: "MILD" }],
    digestive_issues: [{ issue: "CLIENT_REPORTED_TEXT" }],
    disliked_foods: ["TUNA"],
  };
  const snapshot = makeSnapshot({ foodRestrictions: restrictions });
  const blueprint = buildFrom(snapshot, makeDistribution(snapshot));

  assert.deepEqual(blueprint.food_restrictions, restrictions);
  assert.notStrictEqual(
    blueprint.food_restrictions,
    snapshot.food_restrictions,
  );
  for (const field of Object.keys(restrictions)) {
    assert.notStrictEqual(
      blueprint.food_restrictions[field],
      snapshot.food_restrictions[field],
    );
  }
  assert.equal(reasonCodes(blueprint).filter((code) =>
    code === "FOOD_RESTRICTIONS_RETAINED_FOR_FOOD_SELECTION").length, 1);
});

test("food restrictions remain uninterpreted and never become food classes", () => {
  const restrictions = {
    allergies: [{ originalText: "MYSTERY_ALLERGEN_TEXT" }],
    medical_exclusions: [{ originalText: "MYSTERY_MEDICAL_TEXT" }],
    intolerances: [{ originalText: "MYSTERY_INTOLERANCE_TEXT" }],
    digestive_issues: [{ originalText: "MYSTERY_DIGESTIVE_TEXT" }],
    disliked_foods: ["MYSTERY_DISLIKED_TEXT"],
  };
  const snapshot = makeSnapshot({ foodRestrictions: restrictions });
  const blueprint = buildFrom(snapshot, makeDistribution(snapshot));
  const restrictionKeys = collectObjectKeys(blueprint.food_restrictions);
  const allowedClasses = uniquePatterns(blueprint).flatMap((pattern) =>
    pattern.slots.flatMap((slot) => slot.allowed_food_classes));

  assert.deepEqual(blueprint.food_restrictions, restrictions);
  assert.equal(restrictionKeys.has("food_class"), false);
  assert.equal(restrictionKeys.has("allowed_food_class"), false);
  for (const originalText of [
    "MYSTERY_ALLERGEN_TEXT",
    "MYSTERY_MEDICAL_TEXT",
    "MYSTERY_INTOLERANCE_TEXT",
    "MYSTERY_DIGESTIVE_TEXT",
    "MYSTERY_DISLIKED_TEXT",
  ]) {
    assert.equal(allowedClasses.includes(originalText), false);
  }
});

test("version mismatches and malformed minimum contracts throw TypeError", () => {
  const invalidInputFactories = [
    () => {
      const snapshot = makeSnapshot();
      return [null, makeDistribution(snapshot)];
    },
    () => {
      const snapshot = makeSnapshot();
      return [[], makeDistribution(snapshot)];
    },
    () => {
      const snapshot = makeSnapshot();
      snapshot.snapshot_version = "nutrition-planning-snapshot-v2";
      return [snapshot, makeDistribution(snapshot)];
    },
    () => {
      const snapshot = makeSnapshot();
      snapshot.meal_preferences = null;
      return [snapshot, makeDistribution(makeSnapshot())];
    },
    () => {
      const snapshot = makeSnapshot({ budget: 1 });
      return [snapshot, makeDistribution(snapshot)];
    },
    () => {
      const snapshot = makeSnapshot({ foodStorageAvailable: "YES" });
      return [snapshot, makeDistribution(snapshot)];
    },
    () => {
      const snapshot = makeSnapshot({ foodReheatingAvailable: "YES" });
      return [snapshot, makeDistribution(snapshot)];
    },
    () => {
      const snapshot = makeSnapshot();
      snapshot.food_restrictions = null;
      return [snapshot, makeDistribution(makeSnapshot())];
    },
    () => {
      const snapshot = makeSnapshot();
      snapshot.food_restrictions.allergies = {};
      return [snapshot, makeDistribution(snapshot)];
    },
    () => {
      const snapshot = makeSnapshot();
      return [snapshot, null];
    },
    () => {
      const snapshot = makeSnapshot();
      return [snapshot, []];
    },
    () => {
      const snapshot = makeSnapshot();
      return [snapshot, makeDistribution(snapshot, {
        overrides: {
          meal_distribution_version: "nutrition-meal-distribution-v2",
        },
      })];
    },
    () => {
      const snapshot = makeSnapshot();
      return [snapshot, makeDistribution(snapshot, {
        overrides: { source_snapshot_version: "wrong-version" },
      })];
    },
    () => {
      const snapshot = makeSnapshot();
      return [snapshot, makeDistribution(snapshot, {
        overrides: { status: "UNKNOWN" },
      })];
    },
    () => {
      const snapshot = makeSnapshot();
      return [snapshot, makeDistribution(snapshot, {
        overrides: { distribution_policy: "UNKNOWN" },
      })];
    },
    ...[1, 6, 2.5].map((mealCount) => () => {
      const snapshot = makeSnapshot();
      return [snapshot, makeDistribution(snapshot, {
        overrides: { meal_count: mealCount },
      })];
    }),
    () => {
      const snapshot = makeSnapshot();
      return [snapshot, makeDistribution(snapshot, {
        overrides: { daily_targets: [] },
      })];
    },
    () => {
      const snapshot = makeSnapshot();
      return [snapshot, makeDistribution(snapshot, {
        overrides: { meals: {} },
      })];
    },
    () => {
      const snapshot = makeSnapshot();
      return [snapshot, makeDistribution(snapshot, {
        overrides: { constraints: {} },
      })];
    },
    () => {
      const snapshot = makeSnapshot();
      return [snapshot, makeDistribution(snapshot, {
        overrides: { reasons: {} },
      })];
    },
    () => {
      const snapshot = makeSnapshot();
      return [snapshot, makeDistribution(snapshot, {
        status: NutritionMealDistributionStatus.READY,
        withMeals: false,
      })];
    },
    () => {
      const snapshot = makeSnapshot();
      return [snapshot, makeDistribution(snapshot, {
        status: NutritionMealDistributionStatus.WITHHELD,
        withMeals: true,
      })];
    },
    () => {
      const snapshot = makeSnapshot();
      return [snapshot, makeDistribution(snapshot, {
        status: NutritionMealDistributionStatus.PROVISIONAL_REVIEW_REQUIRED,
        withMeals: false,
        overrides: { meal_count: 3 },
      })];
    },
  ];

  for (const createInvalidInput of invalidInputFactories) {
    const [snapshot, distribution] = createInvalidInput();
    assert.throws(() => buildFrom(snapshot, distribution), TypeError);
  }
});

test("an unknown distributed meal role throws TypeError", () => {
  const snapshot = makeSnapshot();
  const distribution = makeDistribution(snapshot);
  distribution.meals[0].role = "UNKNOWN_ROLE";

  assert.throws(() => buildFrom(snapshot, distribution), TypeError);
});

test("meal calories inconsistent with macro grams throw TypeError", () => {
  const snapshot = makeSnapshot();
  const distribution = makeDistribution(snapshot);
  distribution.meals[0].planned_calories += 1;
  distribution.daily_targets.macro_calories_total += 1;

  assert.throws(() => buildFrom(snapshot, distribution), TypeError);
});

test("meal sums inconsistent with any daily target throw TypeError", () => {
  for (const targetField of [
    "protein_g",
    "fat_g",
    "carbohydrate_g",
    "fiber_g",
    "macro_calories_total",
  ]) {
    const snapshot = makeSnapshot();
    const distribution = makeDistribution(snapshot);
    distribution.daily_targets[targetField] += 1;
    assert.throws(() => buildFrom(snapshot, distribution), TypeError);
  }
});

test("building does not mutate or freeze either input", () => {
  const snapshot = makeSnapshot({
    foodRestrictions: {
      allergies: [{ substance: "SESAME", details: { source: "CLIENT" } }],
    },
  });
  const distribution = makeDistribution(snapshot, {
    constraints: [{ code: "KEEP_CONSTRAINT", details: { value: 1 } }],
    reasons: [{ code: "KEEP_REASON", message: "Keep this reason." }],
  });
  const snapshotBefore = structuredClone(snapshot);
  const distributionBefore = structuredClone(distribution);

  buildFrom(snapshot, distribution);

  assert.deepEqual(snapshot, snapshotBefore);
  assert.deepEqual(distribution, distributionBefore);
  assert.equal(Object.isFrozen(snapshot), false);
  assert.equal(Object.isFrozen(snapshot.food_restrictions.allergies[0]), false);
  assert.equal(Object.isFrozen(distribution), false);
  assert.equal(Object.isFrozen(distribution.constraints[0]), false);
});

test("output and repeated pattern copies are independent and deeply frozen", () => {
  const snapshot = makeSnapshot({
    foodRestrictions: {
      allergies: [{ substance: "SESAME", details: { value: 1 } }],
    },
  });
  const distribution = makeDistribution(snapshot, {
    meals: FIVE_ROLE_MEALS,
    constraints: [{ code: "KEEP_CONSTRAINT", details: { value: 1 } }],
    reasons: [{ code: "KEEP_REASON", message: "Keep this reason." }],
  });
  const blueprint = buildFrom(snapshot, distribution);
  const secondBlueprint = buildFrom(snapshot, distribution);
  const blueprintBefore = structuredClone(blueprint);
  const snackMeals = blueprint.meals.filter((meal) =>
    meal.role === NutritionMealRole.SNACK);

  assertDeepFrozen(blueprint);
  assert.notStrictEqual(
    blueprint.food_restrictions,
    snapshot.food_restrictions,
  );
  assert.notStrictEqual(blueprint.constraints, distribution.constraints);
  assert.notStrictEqual(blueprint.reasons, distribution.reasons);
  assert.notStrictEqual(
    snackMeals[0].allowed_patterns,
    snackMeals[1].allowed_patterns,
  );
  assert.notStrictEqual(
    snackMeals[0].allowed_patterns[0],
    snackMeals[1].allowed_patterns[0],
  );
  assert.notStrictEqual(
    blueprint.meals[0].allowed_patterns[0],
    secondBlueprint.meals[0].allowed_patterns[0],
  );

  snapshot.food_restrictions.allergies[0].details.value = 2;
  distribution.constraints[0].details.value = 2;
  distribution.reasons[0].message = "Changed.";
  assert.deepEqual(blueprint, blueprintBefore);
  assert.throws(() => {
    blueprint.meals[0].allowed_patterns[0].slots[0].min_items = 0;
  }, TypeError);
});

test("constraints and reasons pass by value with duplicate codes removed", () => {
  const snapshot = makeSnapshot();
  const distribution = makeDistribution(snapshot, {
    constraints: [{ code: "KEEP_CONSTRAINT", details: { value: 1 } }],
    reasons: [
      { code: "UPSTREAM_REASON", message: "First." },
      { code: "UPSTREAM_REASON", message: "Duplicate." },
    ],
  });
  const blueprint = buildFrom(snapshot, distribution);

  assert.deepEqual(blueprint.constraints, distribution.constraints);
  assert.notStrictEqual(blueprint.constraints, distribution.constraints);
  assert.notStrictEqual(blueprint.constraints[0], distribution.constraints[0]);
  assert.deepEqual(reasonCodes(blueprint), [
    "UPSTREAM_REASON",
    "MEAL_ASSEMBLY_BLUEPRINT_POLICY_APPLIED",
  ]);
  assert.equal(
    blueprint.reasons.at(-1).message,
    "Practical component patterns were assigned to each meal role using Z Coaching Meal Assembly V1.",
  );
});

test("output excludes food selection, quantities, recipes, and alternatives", () => {
  const snapshot = makeSnapshot();
  const blueprint = buildFrom(snapshot, makeDistribution(snapshot, {
    meals: FOUR_ROLE_MEALS,
  }));
  const keys = collectObjectKeys(blueprint);

  for (const forbiddenKey of [
    "selected_food",
    "food_code",
    "food_name",
    "serving_size",
    "quantity_g",
    "portions",
    "meal_template",
    "recipe",
    "ingredients",
    "swaps",
    "alternatives",
    "supplements",
  ]) {
    assert.equal(keys.has(forbiddenKey), false);
  }
});

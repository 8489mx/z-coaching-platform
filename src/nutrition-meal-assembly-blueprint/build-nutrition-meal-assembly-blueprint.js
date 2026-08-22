import {
  NUTRITION_MEAL_DISTRIBUTION_VERSION,
  NutritionMealDistributionPolicy,
  NutritionMealDistributionStatus,
  NutritionMealRole,
} from "../nutrition-meal-distribution/index.js";
import { NUTRITION_PLANNING_SNAPSHOT_VERSION } from "../nutrition-planning-snapshot/index.js";
import { NUTRITION_MEAL_ASSEMBLY_BLUEPRINT_VERSION } from "./domain/contracts.js";
import {
  NutritionMealAssemblyPolicy,
  NutritionMealAssemblyStatus,
} from "./domain/enums.js";
import { getPatternsForMealRole } from "./pattern-catalog.js";

const FOOD_RESTRICTION_FIELDS = Object.freeze([
  "allergies",
  "medical_exclusions",
  "intolerances",
  "digestive_issues",
  "disliked_foods",
]);

const REASON_MESSAGES = Object.freeze({
  MEAL_ASSEMBLY_WITHHELD_BY_DISTRIBUTION_STATUS:
    "Meal assembly was withheld because the upstream meal distribution is withheld.",
  MEAL_ASSEMBLY_UNAVAILABLE_WITHOUT_DISTRIBUTED_MEALS:
    "Meal assembly cannot be created until distributed meals are available.",
  MEAL_ASSEMBLY_BLUEPRINT_POLICY_APPLIED:
    "Practical component patterns were assigned to each meal role using Z Coaching Meal Assembly V1.",
  NO_FOOD_STORAGE_SELECTION_RESTRICTION_RETAINED:
    "Food selection must respect the reported lack of food storage.",
  NO_FOOD_REHEATING_SELECTION_RESTRICTION_RETAINED:
    "Food selection must respect the reported lack of food reheating.",
  FOOD_RESTRICTIONS_RETAINED_FOR_FOOD_SELECTION:
    "Reported food restrictions were retained for enforcement during food selection.",
});

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requireObject(value, path) {
  if (!isObject(value)) {
    throw new TypeError(`${path} must be an object.`);
  }
}

function requireEnum(value, runtimeEnum, enumName, path) {
  if (!Object.values(runtimeEnum).includes(value)) {
    throw new TypeError(`${path} must be a ${enumName}.`);
  }
}

function requirePositiveInteger(value, path) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new TypeError(`${path} must be a positive integer.`);
  }
}

function requireNonNegativeInteger(value, path) {
  if (!Number.isInteger(value) || value < 0) {
    throw new TypeError(`${path} must be a non-negative integer.`);
  }
}

function validateSnapshot(snapshot) {
  requireObject(snapshot, "nutritionPlanningSnapshot");
  if (snapshot.snapshot_version !== NUTRITION_PLANNING_SNAPSHOT_VERSION) {
    throw new TypeError(
      `nutritionPlanningSnapshot.snapshot_version must equal ${NUTRITION_PLANNING_SNAPSHOT_VERSION}.`,
    );
  }

  requireObject(
    snapshot.meal_preferences,
    "nutritionPlanningSnapshot.meal_preferences",
  );
  if (typeof snapshot.meal_preferences.budget !== "string") {
    throw new TypeError(
      "nutritionPlanningSnapshot.meal_preferences.budget must be a string.",
    );
  }
  if (typeof snapshot.meal_preferences.food_storage_available !== "boolean") {
    throw new TypeError(
      "nutritionPlanningSnapshot.meal_preferences.food_storage_available must be a boolean.",
    );
  }
  if (typeof snapshot.meal_preferences.food_reheating_available !== "boolean") {
    throw new TypeError(
      "nutritionPlanningSnapshot.meal_preferences.food_reheating_available must be a boolean.",
    );
  }

  requireObject(
    snapshot.food_restrictions,
    "nutritionPlanningSnapshot.food_restrictions",
  );
  for (const field of FOOD_RESTRICTION_FIELDS) {
    if (!Array.isArray(snapshot.food_restrictions[field])) {
      throw new TypeError(
        `nutritionPlanningSnapshot.food_restrictions.${field} must be an array.`,
      );
    }
  }
}

function validateDailyTargets(dailyTargets) {
  requirePositiveInteger(
    dailyTargets.macro_calories_total,
    "nutritionMealDistribution.daily_targets.macro_calories_total",
  );
  requirePositiveInteger(
    dailyTargets.protein_g,
    "nutritionMealDistribution.daily_targets.protein_g",
  );
  requireNonNegativeInteger(
    dailyTargets.fat_g,
    "nutritionMealDistribution.daily_targets.fat_g",
  );
  requireNonNegativeInteger(
    dailyTargets.carbohydrate_g,
    "nutritionMealDistribution.daily_targets.carbohydrate_g",
  );
  requireNonNegativeInteger(
    dailyTargets.fiber_g,
    "nutritionMealDistribution.daily_targets.fiber_g",
  );
}

function validateDistributedMeal(meal, index) {
  const path = `nutritionMealDistribution.meals[${index}]`;
  requireObject(meal, path);
  if (!Number.isInteger(meal.sequence) || meal.sequence !== index + 1) {
    throw new TypeError(
      "nutritionMealDistribution.meals sequence must start at 1 and be contiguous.",
    );
  }
  requireEnum(
    meal.role,
    NutritionMealRole,
    "NutritionMealRole",
    `${path}.role`,
  );
  requirePositiveInteger(meal.planned_calories, `${path}.planned_calories`);
  requirePositiveInteger(meal.protein_g, `${path}.protein_g`);
  requireNonNegativeInteger(meal.fat_g, `${path}.fat_g`);
  requireNonNegativeInteger(meal.carbohydrate_g, `${path}.carbohydrate_g`);
  requireNonNegativeInteger(meal.fiber_g, `${path}.fiber_g`);

  const calculatedCalories =
    meal.protein_g * 4 + meal.fat_g * 9 + meal.carbohydrate_g * 4;
  if (meal.planned_calories !== calculatedCalories) {
    throw new TypeError(
      `${path}.planned_calories must equal protein, fat, and carbohydrate calories.`,
    );
  }
}

function sumMealField(meals, field) {
  return meals.reduce((total, meal) => total + meal[field], 0);
}

function validateMealTotals(distribution) {
  const totals = [
    ["protein_g", "protein_g"],
    ["fat_g", "fat_g"],
    ["carbohydrate_g", "carbohydrate_g"],
    ["fiber_g", "fiber_g"],
    ["planned_calories", "macro_calories_total"],
  ];
  for (const [mealField, targetField] of totals) {
    if (
      sumMealField(distribution.meals, mealField) !==
      distribution.daily_targets[targetField]
    ) {
      throw new TypeError(
        `nutritionMealDistribution meals must close to daily_targets.${targetField}.`,
      );
    }
  }
}

function validateDistribution(snapshot, distribution) {
  requireObject(distribution, "nutritionMealDistribution");
  if (
    distribution.meal_distribution_version !==
    NUTRITION_MEAL_DISTRIBUTION_VERSION
  ) {
    throw new TypeError(
      `nutritionMealDistribution.meal_distribution_version must equal ${NUTRITION_MEAL_DISTRIBUTION_VERSION}.`,
    );
  }
  if (distribution.source_snapshot_version !== snapshot.snapshot_version) {
    throw new TypeError(
      "nutritionMealDistribution.source_snapshot_version must match nutritionPlanningSnapshot.snapshot_version.",
    );
  }
  requireEnum(
    distribution.status,
    NutritionMealDistributionStatus,
    "NutritionMealDistributionStatus",
    "nutritionMealDistribution.status",
  );
  requireEnum(
    distribution.distribution_policy,
    NutritionMealDistributionPolicy,
    "NutritionMealDistributionPolicy",
    "nutritionMealDistribution.distribution_policy",
  );
  if (
    distribution.meal_count !== null &&
    (!Number.isInteger(distribution.meal_count) ||
      distribution.meal_count < 2 ||
      distribution.meal_count > 5)
  ) {
    throw new TypeError(
      "nutritionMealDistribution.meal_count must be null or an integer from 2 to 5.",
    );
  }
  if (
    distribution.daily_targets !== null &&
    !isObject(distribution.daily_targets)
  ) {
    throw new TypeError(
      "nutritionMealDistribution.daily_targets must be null or an object.",
    );
  }
  if (!Array.isArray(distribution.meals)) {
    throw new TypeError("nutritionMealDistribution.meals must be an array.");
  }
  if (!Array.isArray(distribution.constraints)) {
    throw new TypeError(
      "nutritionMealDistribution.constraints must be an array.",
    );
  }
  if (!Array.isArray(distribution.reasons)) {
    throw new TypeError("nutritionMealDistribution.reasons must be an array.");
  }

  const isEmpty =
    distribution.meal_count === null &&
    distribution.daily_targets === null &&
    distribution.meals.length === 0;

  if (distribution.status === NutritionMealDistributionStatus.WITHHELD) {
    if (!isEmpty) {
      throw new TypeError(
        "A WITHHELD meal distribution must have null targets and no meals.",
      );
    }
    return;
  }

  if (isEmpty) {
    if (
      distribution.status !==
      NutritionMealDistributionStatus.PROVISIONAL_REVIEW_REQUIRED
    ) {
      throw new TypeError(
        "Only a provisional meal distribution may be empty.",
      );
    }
    return;
  }

  if (
    distribution.meal_count === null ||
    !isObject(distribution.daily_targets) ||
    distribution.meals.length !== distribution.meal_count
  ) {
    throw new TypeError(
      "A distributed meal result must contain a matching meal count, daily targets, and meals.",
    );
  }

  validateDailyTargets(distribution.daily_targets);
  const sequences = new Set();
  distribution.meals.forEach((meal, index) => {
    validateDistributedMeal(meal, index);
    if (sequences.has(meal.sequence)) {
      throw new TypeError(
        "nutritionMealDistribution.meals sequence must be unique.",
      );
    }
    sequences.add(meal.sequence);
  });
  validateMealTotals(distribution);
}

function cloneReasonsWithoutDuplicateCodes(reasons) {
  const clonedReasons = structuredClone(reasons);
  const uniqueReasons = [];
  const reasonCodes = new Set();

  for (const reason of clonedReasons) {
    const code = isObject(reason) && typeof reason.code === "string"
      ? reason.code
      : null;
    if (code !== null && reasonCodes.has(code)) {
      continue;
    }
    if (code !== null) {
      reasonCodes.add(code);
    }
    uniqueReasons.push(reason);
  }
  return { reasons: uniqueReasons, reasonCodes };
}

function addReason(reasons, reasonCodes, code) {
  if (reasonCodes.has(code)) {
    return;
  }
  reasonCodes.add(code);
  reasons.push({ code, message: REASON_MESSAGES[code] });
}

function hasFoodRestrictions(foodRestrictions) {
  return FOOD_RESTRICTION_FIELDS.some(
    (field) => foodRestrictions[field].length > 0,
  );
}

function addRetainedContextReasons(output, snapshot, reasonCodes) {
  if (!snapshot.meal_preferences.food_storage_available) {
    addReason(
      output.reasons,
      reasonCodes,
      "NO_FOOD_STORAGE_SELECTION_RESTRICTION_RETAINED",
    );
  }
  if (!snapshot.meal_preferences.food_reheating_available) {
    addReason(
      output.reasons,
      reasonCodes,
      "NO_FOOD_REHEATING_SELECTION_RESTRICTION_RETAINED",
    );
  }
  if (hasFoodRestrictions(snapshot.food_restrictions)) {
    addReason(
      output.reasons,
      reasonCodes,
      "FOOD_RESTRICTIONS_RETAINED_FOR_FOOD_SELECTION",
    );
  }
}

function deepFreeze(value, seen = new WeakSet()) {
  if (value === null || typeof value !== "object" || seen.has(value)) {
    return value;
  }
  seen.add(value);
  for (const key of Reflect.ownKeys(value)) {
    deepFreeze(value[key], seen);
  }
  return Object.freeze(value);
}

function finalize(output) {
  return deepFreeze(structuredClone(output));
}

function buildBaseOutput(snapshot, distribution, reasons) {
  return {
    assembly_blueprint_version:
      NUTRITION_MEAL_ASSEMBLY_BLUEPRINT_VERSION,
    source_snapshot_version: snapshot.snapshot_version,
    source_meal_distribution_version:
      distribution.meal_distribution_version,
    source_distribution_status: distribution.status,
    status: NutritionMealAssemblyStatus.PROVISIONAL_REVIEW_REQUIRED,
    assembly_policy:
      NutritionMealAssemblyPolicy.Z_COACHING_MEAL_ASSEMBLY_V1,
    meal_count: null,
    logistics: {
      budget: snapshot.meal_preferences.budget,
      food_storage_available:
        snapshot.meal_preferences.food_storage_available,
      food_reheating_available:
        snapshot.meal_preferences.food_reheating_available,
    },
    food_restrictions: snapshot.food_restrictions,
    meals: [],
    constraints: distribution.constraints,
    reasons,
  };
}

function buildMealBlueprint(meal) {
  return {
    sequence: meal.sequence,
    role: meal.role,
    target: {
      planned_calories: meal.planned_calories,
      protein_g: meal.protein_g,
      fat_g: meal.fat_g,
      carbohydrate_g: meal.carbohydrate_g,
      fiber_g: meal.fiber_g,
    },
    allowed_patterns: getPatternsForMealRole(meal.role),
  };
}

/**
 * Assigns deterministic component patterns to already distributed meal slots.
 *
 * @param {Object} input
 * @param {Object} input.nutritionPlanningSnapshot
 * @param {Object} input.nutritionMealDistribution
 * @returns {import("./domain/contracts.js").NutritionMealAssemblyBlueprint}
 */
export function buildNutritionMealAssemblyBlueprint({
  nutritionPlanningSnapshot,
  nutritionMealDistribution,
} = {}) {
  validateSnapshot(nutritionPlanningSnapshot);
  validateDistribution(
    nutritionPlanningSnapshot,
    nutritionMealDistribution,
  );

  const { reasons, reasonCodes } = cloneReasonsWithoutDuplicateCodes(
    nutritionMealDistribution.reasons,
  );
  const output = buildBaseOutput(
    nutritionPlanningSnapshot,
    nutritionMealDistribution,
    reasons,
  );

  if (
    nutritionMealDistribution.status ===
    NutritionMealDistributionStatus.WITHHELD
  ) {
    output.status = NutritionMealAssemblyStatus.WITHHELD;
    addReason(
      output.reasons,
      reasonCodes,
      "MEAL_ASSEMBLY_WITHHELD_BY_DISTRIBUTION_STATUS",
    );
    addRetainedContextReasons(output, nutritionPlanningSnapshot, reasonCodes);
    return finalize(output);
  }

  if (nutritionMealDistribution.meals.length === 0) {
    addReason(
      output.reasons,
      reasonCodes,
      "MEAL_ASSEMBLY_UNAVAILABLE_WITHOUT_DISTRIBUTED_MEALS",
    );
    addRetainedContextReasons(output, nutritionPlanningSnapshot, reasonCodes);
    return finalize(output);
  }

  output.status =
    nutritionMealDistribution.status === NutritionMealDistributionStatus.READY
      ? NutritionMealAssemblyStatus.READY
      : NutritionMealAssemblyStatus.PROVISIONAL_REVIEW_REQUIRED;
  output.meal_count = nutritionMealDistribution.meal_count;
  output.meals = nutritionMealDistribution.meals.map(buildMealBlueprint);
  addReason(
    output.reasons,
    reasonCodes,
    "MEAL_ASSEMBLY_BLUEPRINT_POLICY_APPLIED",
  );
  addRetainedContextReasons(output, nutritionPlanningSnapshot, reasonCodes);

  return finalize(output);
}

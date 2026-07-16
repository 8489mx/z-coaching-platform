import { MealCountStrategy } from "../intake-decision-engine/index.js";
import {
  NUTRITION_MACRO_TARGETS_VERSION,
  NutritionMacroCalculationPolicy,
  NutritionMacroTargetsStatus,
} from "../nutrition-macro-targets/index.js";
import { NUTRITION_PLANNING_SNAPSHOT_VERSION } from "../nutrition-planning-snapshot/index.js";
import { NUTRITION_MEAL_DISTRIBUTION_VERSION } from "./domain/contracts.js";
import {
  NutritionMealDistributionPolicy,
  NutritionMealDistributionStatus,
  NutritionMealRole,
  NutritionMealTimingMode,
} from "./domain/enums.js";

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

const MEAL_DISTRIBUTION_MAPS = Object.freeze({
  2: Object.freeze({
    roles: Object.freeze([
      NutritionMealRole.BREAKFAST,
      NutritionMealRole.EVENING_MEAL,
    ]),
    weights: Object.freeze([50, 50]),
  }),
  3: Object.freeze({
    roles: Object.freeze([
      NutritionMealRole.BREAKFAST,
      NutritionMealRole.MAIN_MEAL,
      NutritionMealRole.EVENING_MEAL,
    ]),
    weights: Object.freeze([30, 35, 35]),
  }),
  4: Object.freeze({
    roles: Object.freeze([
      NutritionMealRole.BREAKFAST,
      NutritionMealRole.MAIN_MEAL,
      NutritionMealRole.SNACK,
      NutritionMealRole.EVENING_MEAL,
    ]),
    weights: Object.freeze([25, 30, 15, 30]),
  }),
  5: Object.freeze({
    roles: Object.freeze([
      NutritionMealRole.BREAKFAST,
      NutritionMealRole.SNACK,
      NutritionMealRole.MAIN_MEAL,
      NutritionMealRole.SNACK,
      NutritionMealRole.EVENING_MEAL,
    ]),
    weights: Object.freeze([20, 10, 30, 10, 30]),
  }),
});

const REASON_MESSAGES = Object.freeze({
  MEAL_DISTRIBUTION_WITHHELD_BY_MACRO_STATUS:
    "Meal distribution was withheld because the upstream nutrition macro targets are withheld.",
  MEAL_DISTRIBUTION_UNAVAILABLE_WITHOUT_MACRO_TARGETS:
    "Meal distribution cannot be created until complete daily macro targets are available.",
  MEAL_COUNT_REQUIRES_COACH_CONFIRMATION:
    "Meal count must be confirmed by a coach before daily macro targets can be distributed.",
  MEAL_COUNT_OUTSIDE_AUTOMATIC_V1_RANGE:
    "Automatic meal distribution in V1 supports preferred meal counts from 2 to 5.",
  MEAL_DISTRIBUTION_POLICY_APPLIED:
    "Daily macro and fiber targets were distributed across meal slots using Z Coaching Meal Distribution V1.",
  REPORTED_UNAVAILABLE_WINDOWS_RETAINED:
    "Reported unavailable eating windows were retained without assigning specific meal times.",
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

function requireNullableObject(value, path) {
  if (value !== null && !isObject(value)) {
    throw new TypeError(`${path} must be null or an object.`);
  }
}

function requireNullablePositiveInteger(value, path) {
  if (value !== null && (!Number.isInteger(value) || value <= 0)) {
    throw new TypeError(`${path} must be null or a positive integer.`);
  }
}

function timeToMinutes(value) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
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
  if (
    !Number.isInteger(snapshot.meal_preferences.preferred_meal_count) ||
    snapshot.meal_preferences.preferred_meal_count < 1 ||
    snapshot.meal_preferences.preferred_meal_count > 8
  ) {
    throw new TypeError(
      "nutritionPlanningSnapshot.meal_preferences.preferred_meal_count must be an integer from 1 to 8.",
    );
  }
  requireEnum(
    snapshot.meal_preferences.meal_count_strategy,
    MealCountStrategy,
    "MealCountStrategy",
    "nutritionPlanningSnapshot.meal_preferences.meal_count_strategy",
  );
  if (!Array.isArray(snapshot.meal_preferences.unavailable_eating_windows)) {
    throw new TypeError(
      "nutritionPlanningSnapshot.meal_preferences.unavailable_eating_windows must be an array.",
    );
  }

  snapshot.meal_preferences.unavailable_eating_windows.forEach(
    (window, index) => {
      const path =
        `nutritionPlanningSnapshot.meal_preferences.unavailable_eating_windows[${index}]`;
      requireObject(window, path);
      if (typeof window.start !== "string" || !TIME_PATTERN.test(window.start)) {
        throw new TypeError(`${path}.start must use HH:MM.`);
      }
      if (typeof window.end !== "string" || !TIME_PATTERN.test(window.end)) {
        throw new TypeError(`${path}.end must use HH:MM.`);
      }
      if (timeToMinutes(window.end) <= timeToMinutes(window.start)) {
        throw new TypeError(
          `${path}.end must be later than start on the same day.`,
        );
      }
    },
  );
}

function validateMacroNutrient(macro, path, caloriesPerGram) {
  if (!Number.isInteger(macro.target_g) || macro.target_g <= 0) {
    throw new TypeError(`${path}.target_g must be a positive integer.`);
  }
  if (macro.calories !== macro.target_g * caloriesPerGram) {
    throw new TypeError(
      `${path}.calories must equal ${path}.target_g * ${caloriesPerGram}.`,
    );
  }
}

function validateMacroTargets(snapshot, macroTargets) {
  requireObject(macroTargets, "nutritionMacroTargets");
  if (
    macroTargets.macro_targets_version !== NUTRITION_MACRO_TARGETS_VERSION
  ) {
    throw new TypeError(
      `nutritionMacroTargets.macro_targets_version must equal ${NUTRITION_MACRO_TARGETS_VERSION}.`,
    );
  }
  if (macroTargets.source_snapshot_version !== snapshot.snapshot_version) {
    throw new TypeError(
      "nutritionMacroTargets.source_snapshot_version must match nutritionPlanningSnapshot.snapshot_version.",
    );
  }
  requireEnum(
    macroTargets.status,
    NutritionMacroTargetsStatus,
    "NutritionMacroTargetsStatus",
    "nutritionMacroTargets.status",
  );
  requireEnum(
    macroTargets.calculation_policy,
    NutritionMacroCalculationPolicy,
    "NutritionMacroCalculationPolicy",
    "nutritionMacroTargets.calculation_policy",
  );
  requireNullablePositiveInteger(
    macroTargets.target_calories,
    "nutritionMacroTargets.target_calories",
  );
  requireNullableObject(macroTargets.protein, "nutritionMacroTargets.protein");
  requireNullableObject(macroTargets.fat, "nutritionMacroTargets.fat");
  requireNullableObject(
    macroTargets.carbohydrate,
    "nutritionMacroTargets.carbohydrate",
  );
  requireNullablePositiveInteger(
    macroTargets.fiber_target_g,
    "nutritionMacroTargets.fiber_target_g",
  );
  requireNullablePositiveInteger(
    macroTargets.macro_calories_total,
    "nutritionMacroTargets.macro_calories_total",
  );
  if (
    macroTargets.calorie_difference !== null &&
    (!Number.isInteger(macroTargets.calorie_difference) ||
      macroTargets.calorie_difference < -2 ||
      macroTargets.calorie_difference > 2)
  ) {
    throw new TypeError(
      "nutritionMacroTargets.calorie_difference must be null or an integer from -2 to 2.",
    );
  }
  if (!Array.isArray(macroTargets.constraints)) {
    throw new TypeError("nutritionMacroTargets.constraints must be an array.");
  }
  if (!Array.isArray(macroTargets.reasons)) {
    throw new TypeError("nutritionMacroTargets.reasons must be an array.");
  }

  const dailyTargetFields = [
    macroTargets.target_calories,
    macroTargets.protein,
    macroTargets.fat,
    macroTargets.carbohydrate,
    macroTargets.fiber_target_g,
    macroTargets.macro_calories_total,
    macroTargets.calorie_difference,
  ];
  const allDailyTargetsNull = dailyTargetFields.every((value) => value === null);

  if (macroTargets.status === NutritionMacroTargetsStatus.WITHHELD) {
    if (!allDailyTargetsNull) {
      throw new TypeError(
        "A WITHHELD macro target must contain only null daily targets.",
      );
    }
    return;
  }

  if (macroTargets.target_calories === null) {
    if (macroTargets.status === NutritionMacroTargetsStatus.READY) {
      throw new TypeError(
        "A READY macro target must contain complete daily targets.",
      );
    }
    if (!allDailyTargetsNull) {
      throw new TypeError(
        "A macro target without target_calories cannot contain partial daily targets.",
      );
    }
    return;
  }

  if (
    !isObject(macroTargets.protein) ||
    !isObject(macroTargets.fat) ||
    !isObject(macroTargets.carbohydrate)
  ) {
    throw new TypeError(
      "A calorie-bearing macro target must contain protein, fat, and carbohydrate targets.",
    );
  }
  validateMacroNutrient(macroTargets.protein, "nutritionMacroTargets.protein", 4);
  validateMacroNutrient(macroTargets.fat, "nutritionMacroTargets.fat", 9);
  validateMacroNutrient(
    macroTargets.carbohydrate,
    "nutritionMacroTargets.carbohydrate",
    4,
  );
  if (
    !Number.isInteger(macroTargets.fiber_target_g) ||
    macroTargets.fiber_target_g <= 0
  ) {
    throw new TypeError(
      "nutritionMacroTargets.fiber_target_g must be a positive integer when targets are available.",
    );
  }

  const calculatedMacroCalories =
    macroTargets.protein.calories +
    macroTargets.fat.calories +
    macroTargets.carbohydrate.calories;
  if (macroTargets.macro_calories_total !== calculatedMacroCalories) {
    throw new TypeError(
      "nutritionMacroTargets.macro_calories_total must equal the sum of protein, fat, and carbohydrate calories.",
    );
  }
  if (
    macroTargets.calorie_difference !==
    macroTargets.macro_calories_total - macroTargets.target_calories
  ) {
    throw new TypeError(
      "nutritionMacroTargets.calorie_difference must equal macro_calories_total - target_calories.",
    );
  }
}

function timingModeForStrategy(strategy) {
  if (strategy === MealCountStrategy.USE_CLIENT_PREFERENCE) {
    return NutritionMealTimingMode.FLEXIBLE_SEQUENCE;
  }
  if (strategy === MealCountStrategy.ADAPT_TO_EATING_WINDOWS) {
    return NutritionMealTimingMode.AVOID_UNAVAILABLE_WINDOWS;
  }
  return NutritionMealTimingMode.COACH_TO_CONFIRM;
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

function allocateEvenly(total, count) {
  const base = Math.floor(total / count);
  const remainder = total - base * count;
  return Array.from(
    { length: count },
    (_unused, index) => base + (index < remainder ? 1 : 0),
  );
}

function allocateByLargestRemainder(total, weights) {
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const allocations = weights.map((weight) =>
    Math.floor(total * weight / totalWeight),
  );
  const remainders = weights.map((weight, index) => ({
    index,
    remainder: total * weight % totalWeight,
  }));
  let remaining = total - allocations.reduce((sum, value) => sum + value, 0);

  remainders.sort(
    (left, right) =>
      right.remainder - left.remainder || left.index - right.index,
  );
  for (let index = 0; index < remaining; index += 1) {
    allocations[remainders[index].index] += 1;
  }
  return allocations;
}

function roundToOneDecimal(value) {
  return Math.round(value * 10) / 10;
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function buildBaseOutput(snapshot, macroTargets, reasons) {
  return {
    meal_distribution_version: NUTRITION_MEAL_DISTRIBUTION_VERSION,
    source_snapshot_version: snapshot.snapshot_version,
    source_macro_targets_version: macroTargets.macro_targets_version,
    source_macro_status: macroTargets.status,
    status: NutritionMealDistributionStatus.PROVISIONAL_REVIEW_REQUIRED,
    distribution_policy:
      NutritionMealDistributionPolicy.Z_COACHING_MEAL_DISTRIBUTION_V1,
    preferred_meal_count: snapshot.meal_preferences.preferred_meal_count,
    meal_count: null,
    timing_mode: timingModeForStrategy(
      snapshot.meal_preferences.meal_count_strategy,
    ),
    unavailable_eating_windows:
      snapshot.meal_preferences.unavailable_eating_windows,
    daily_targets: null,
    meals: [],
    constraints: macroTargets.constraints,
    reasons,
  };
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

/**
 * Distributes existing daily macro targets across deterministic meal slots.
 *
 * @param {Object} input
 * @param {Object} input.nutritionPlanningSnapshot
 * @param {Object} input.nutritionMacroTargets
 * @returns {import("./domain/contracts.js").NutritionMealDistribution}
 */
export function buildNutritionMealDistribution({
  nutritionPlanningSnapshot,
  nutritionMacroTargets,
} = {}) {
  validateSnapshot(nutritionPlanningSnapshot);
  validateMacroTargets(nutritionPlanningSnapshot, nutritionMacroTargets);

  const { reasons, reasonCodes } = cloneReasonsWithoutDuplicateCodes(
    nutritionMacroTargets.reasons,
  );
  const output = buildBaseOutput(
    nutritionPlanningSnapshot,
    nutritionMacroTargets,
    reasons,
  );

  if (nutritionMacroTargets.status === NutritionMacroTargetsStatus.WITHHELD) {
    output.status = NutritionMealDistributionStatus.WITHHELD;
    addReason(
      output.reasons,
      reasonCodes,
      "MEAL_DISTRIBUTION_WITHHELD_BY_MACRO_STATUS",
    );
    return finalize(output);
  }

  if (nutritionMacroTargets.target_calories === null) {
    addReason(
      output.reasons,
      reasonCodes,
      "MEAL_DISTRIBUTION_UNAVAILABLE_WITHOUT_MACRO_TARGETS",
    );
    return finalize(output);
  }

  if (
    nutritionPlanningSnapshot.meal_preferences.meal_count_strategy ===
    MealCountStrategy.COACH_TO_CONFIRM
  ) {
    addReason(
      output.reasons,
      reasonCodes,
      "MEAL_COUNT_REQUIRES_COACH_CONFIRMATION",
    );
    return finalize(output);
  }

  const preferredMealCount =
    nutritionPlanningSnapshot.meal_preferences.preferred_meal_count;
  const distributionMap = MEAL_DISTRIBUTION_MAPS[preferredMealCount];
  if (distributionMap === undefined) {
    addReason(
      output.reasons,
      reasonCodes,
      "MEAL_COUNT_OUTSIDE_AUTOMATIC_V1_RANGE",
    );
    return finalize(output);
  }

  if (sum(distributionMap.weights) !== 100) {
    throw new TypeError(
      "Meal distribution policy failure: calorie weights must total 100.",
    );
  }

  output.status =
    nutritionMacroTargets.status === NutritionMacroTargetsStatus.READY
      ? NutritionMealDistributionStatus.READY
      : NutritionMealDistributionStatus.PROVISIONAL_REVIEW_REQUIRED;
  output.meal_count = preferredMealCount;
  output.daily_targets = {
    target_calories: nutritionMacroTargets.target_calories,
    macro_calories_total: nutritionMacroTargets.macro_calories_total,
    protein_g: nutritionMacroTargets.protein.target_g,
    fat_g: nutritionMacroTargets.fat.target_g,
    carbohydrate_g: nutritionMacroTargets.carbohydrate.target_g,
    fiber_g: nutritionMacroTargets.fiber_target_g,
  };

  const proteinAllocations = allocateEvenly(
    nutritionMacroTargets.protein.target_g,
    preferredMealCount,
  );
  const fatAllocations = allocateByLargestRemainder(
    nutritionMacroTargets.fat.target_g,
    distributionMap.weights,
  );
  const carbohydrateAllocations = allocateByLargestRemainder(
    nutritionMacroTargets.carbohydrate.target_g,
    distributionMap.weights,
  );
  const fiberAllocations = allocateByLargestRemainder(
    nutritionMacroTargets.fiber_target_g,
    distributionMap.weights,
  );

  output.meals = distributionMap.roles.map((role, index) => {
    const plannedCalories =
      proteinAllocations[index] * 4 +
      fatAllocations[index] * 9 +
      carbohydrateAllocations[index] * 4;
    return {
      sequence: index + 1,
      role,
      policy_calorie_weight_percent: distributionMap.weights[index],
      protein_g: proteinAllocations[index],
      fat_g: fatAllocations[index],
      carbohydrate_g: carbohydrateAllocations[index],
      fiber_g: fiberAllocations[index],
      planned_calories: plannedCalories,
      actual_calorie_percent: roundToOneDecimal(
        plannedCalories / nutritionMacroTargets.target_calories * 100,
      ),
    };
  });

  const allocatedMacroTotals = {
    protein: sum(proteinAllocations),
    fat: sum(fatAllocations),
    carbohydrate: sum(carbohydrateAllocations),
    fiber: sum(fiberAllocations),
    calories: sum(output.meals.map((meal) => meal.planned_calories)),
  };
  if (
    allocatedMacroTotals.protein !== nutritionMacroTargets.protein.target_g ||
    allocatedMacroTotals.fat !== nutritionMacroTargets.fat.target_g ||
    allocatedMacroTotals.carbohydrate !==
      nutritionMacroTargets.carbohydrate.target_g ||
    allocatedMacroTotals.fiber !== nutritionMacroTargets.fiber_target_g ||
    allocatedMacroTotals.calories !==
      nutritionMacroTargets.macro_calories_total
  ) {
    throw new TypeError(
      "Meal distribution policy failure: allocated grams or calories do not close to daily targets.",
    );
  }

  addReason(
    output.reasons,
    reasonCodes,
    "MEAL_DISTRIBUTION_POLICY_APPLIED",
  );
  if (
    nutritionPlanningSnapshot.meal_preferences.meal_count_strategy ===
    MealCountStrategy.ADAPT_TO_EATING_WINDOWS
  ) {
    addReason(
      output.reasons,
      reasonCodes,
      "REPORTED_UNAVAILABLE_WINDOWS_RETAINED",
    );
  }

  return finalize(output);
}

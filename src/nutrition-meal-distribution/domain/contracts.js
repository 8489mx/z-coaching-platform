export const NUTRITION_MEAL_DISTRIBUTION_VERSION =
  "nutrition-meal-distribution-v1";

/** @typedef {"READY"|"PROVISIONAL_REVIEW_REQUIRED"|"WITHHELD"} NutritionMealDistributionStatusValue */
/** @typedef {"Z_COACHING_MEAL_DISTRIBUTION_V1"} NutritionMealDistributionPolicyValue */
/** @typedef {"BREAKFAST"|"MAIN_MEAL"|"SNACK"|"EVENING_MEAL"} NutritionMealRoleValue */
/** @typedef {"FLEXIBLE_SEQUENCE"|"AVOID_UNAVAILABLE_WINDOWS"|"COACH_TO_CONFIRM"} NutritionMealTimingModeValue */

/**
 * @typedef {Object} MealDistributionDailyTargets
 * @property {number} target_calories
 * @property {number} macro_calories_total
 * @property {number} protein_g
 * @property {number} fat_g
 * @property {number} carbohydrate_g
 * @property {number} fiber_g
 */

/**
 * @typedef {Object} DistributedMeal
 * @property {number} sequence
 * @property {NutritionMealRoleValue} role
 * @property {number} policy_calorie_weight_percent
 * @property {number} protein_g
 * @property {number} fat_g
 * @property {number} carbohydrate_g
 * @property {number} fiber_g
 * @property {number} planned_calories
 * @property {number} actual_calorie_percent
 */

/**
 * @typedef {Object} MealDistributionReason
 * @property {string} code
 * @property {string} message
 */

/**
 * @typedef {Object} NutritionMealDistribution
 * @property {"nutrition-meal-distribution-v1"} meal_distribution_version
 * @property {"nutrition-planning-snapshot-v1"} source_snapshot_version
 * @property {"nutrition-macro-targets-v1"} source_macro_targets_version
 * @property {"READY"|"PROVISIONAL_REVIEW_REQUIRED"|"WITHHELD"} source_macro_status
 * @property {NutritionMealDistributionStatusValue} status
 * @property {NutritionMealDistributionPolicyValue} distribution_policy
 * @property {number} preferred_meal_count
 * @property {number|null} meal_count
 * @property {NutritionMealTimingModeValue} timing_mode
 * @property {Array<{start:string,end:string}>} unavailable_eating_windows
 * @property {MealDistributionDailyTargets|null} daily_targets
 * @property {DistributedMeal[]} meals
 * @property {Object[]} constraints
 * @property {MealDistributionReason[]} reasons
 */

export {};

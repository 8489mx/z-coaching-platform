export const NUTRITION_ENERGY_TARGET_VERSION =
  "nutrition-energy-target-v1";

/** @typedef {"READY"|"PROVISIONAL_REVIEW_REQUIRED"|"WITHHELD"} NutritionEnergyTargetStatusValue */
/** @typedef {"INACTIVE"|"LOW_ACTIVE"|"ACTIVE"|"VERY_ACTIVE"} NutritionPalCategoryValue */
/** @typedef {"NASEM_DRI_2023_EER_ADULT"} NutritionEnergyCalculationMethodValue */

/**
 * @typedef {Object} NutritionActivityAssessment
 * @property {NutritionPalCategoryValue|null} pal_category
 * @property {NutritionPalCategoryValue|null} lifestyle_category
 * @property {NutritionPalCategoryValue|null} steps_category
 * @property {NutritionPalCategoryValue|null} resistance_category
 * @property {NutritionPalCategoryValue|null} sport_category
 * @property {number} weighted_sport_minutes
 */

/**
 * @typedef {Object} NutritionEnergyTargetReason
 * @property {string} code
 * @property {string} message
 */

/**
 * @typedef {Object} NutritionEnergyTarget
 * @property {"nutrition-energy-target-v1"} energy_target_version
 * @property {"nutrition-planning-snapshot-v1"} source_snapshot_version
 * @property {NutritionEnergyTargetStatusValue} status
 * @property {NutritionEnergyCalculationMethodValue} calculation_method
 * @property {NutritionActivityAssessment} activity_assessment
 * @property {number|null} estimated_maintenance_kcal
 * @property {"DEFICIT"|"MAINTENANCE"|"SURPLUS"|"REVIEW_REQUIRED"} calorie_direction
 * @property {number|null} adjustment_percent
 * @property {number|null} adjustment_kcal
 * @property {number|null} target_calories
 * @property {boolean} calibration_required
 * @property {Object[]} constraints
 * @property {NutritionEnergyTargetReason[]} reasons
 */

export {};

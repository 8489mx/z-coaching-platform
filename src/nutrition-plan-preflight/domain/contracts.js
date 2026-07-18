export const NUTRITION_PLAN_PREFLIGHT_VERSION =
  "nutrition-plan-preflight-v1";

/** @typedef {"Z_COACHING_NUTRITION_PREFLIGHT_V1"} NutritionPlanPreflightPolicyValue */
/** @typedef {"READY"|"REVIEW_REQUIRED"|"WITHHELD"} NutritionPlanPreflightStatusValue */
/** @typedef {"PASSED"|"REVIEW_REQUIRED"|"WITHHELD"} NutritionPlanPreflightCheckStatusValue */
/** @typedef {"FOOD_SELECTION"|"PORTION_SOLVER"|"SWAP_ENGINE"|"PLAN_PREFLIGHT"} NutritionPlanPreflightSourceStageValue */

/**
 * @typedef {Object} NutritionPlanPreflightCheck
 * @property {string} code
 * @property {NutritionPlanPreflightCheckStatusValue} status
 * @property {string[]} issue_codes
 */

/**
 * @typedef {Object} NutritionPlanPreflightIssue
 * @property {string} code
 * @property {NutritionPlanPreflightSourceStageValue} source_stage
 * @property {number|null} meal_sequence
 * @property {string|null} food_code
 * @property {string[]} fields
 * @property {string} message
 */

/**
 * @typedef {Object} NutritionPlanPreflight
 * @property {"nutrition-plan-preflight-v1"} nutrition_plan_preflight_version
 * @property {"nutrition-food-selection-v1"} source_food_selection_version
 * @property {"nutrition-portion-solver-v1"} source_portion_solver_version
 * @property {"nutrition-swap-engine-v1"} source_swap_engine_version
 * @property {"nutrition-food-catalog-v1"} source_food_catalog_version
 * @property {NutritionPlanPreflightStatusValue} status
 * @property {NutritionPlanPreflightPolicyValue} preflight_policy
 * @property {boolean} ready_for_coach_review
 * @property {number|null} meal_count
 * @property {NutritionPlanPreflightCheck[]} checks
 * @property {NutritionPlanPreflightIssue[]} issues
 * @property {Object[]} constraints
 * @property {Array<{code:string,message:string}>} reasons
 */

export {};

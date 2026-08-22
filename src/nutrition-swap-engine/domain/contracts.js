export const NUTRITION_SWAP_ENGINE_VERSION =
  "nutrition-swap-engine-v1";

/** @typedef {"Z_COACHING_SWAP_ENGINE_V1"} NutritionSwapEnginePolicyValue */
/** @typedef {"READY"|"PROVISIONAL_REVIEW_REQUIRED"|"WITHHELD"} NutritionSwapEngineStatusValue */

/**
 * @typedef {Object} NutritionSwapNutrients
 * @property {number} calories_kcal
 * @property {number} protein_g
 * @property {number} fat_g
 * @property {number} carbohydrate_g
 * @property {number} fiber_g
 */

/**
 * @typedef {Object} NutritionSwapAlternative
 * @property {string} food_code
 * @property {number} grams
 * @property {NutritionSwapNutrients} nutrition
 * @property {NutritionSwapNutrients} projected_meal_totals
 * @property {NutritionSwapNutrients} projected_meal_residual
 * @property {{calories_kcal:boolean,protein_g:boolean,fat_g:boolean,carbohydrate_g:boolean,fiber_g:boolean}} projected_within_tolerance
 * @property {number} objective_score
 */

/**
 * @typedef {Object} NutritionSwapItem
 * @property {string} food_code
 * @property {number} grams
 * @property {boolean} is_swappable
 * @property {string|null} group_code
 * @property {NutritionSwapAlternative[]} alternatives
 * @property {Array<{code:string,message:string}>} issues
 */

/**
 * @typedef {Object} NutritionSwapMeal
 * @property {number} sequence
 * @property {string} role
 * @property {string|null} selected_pattern_code
 * @property {NutritionSwapItem[]} items
 * @property {Array<{code:string,message:string}>} issues
 */

/**
 * @typedef {Object} NutritionSwapEngine
 * @property {"nutrition-swap-engine-v1"} swap_engine_version
 * @property {"nutrition-food-selection-v1"} source_food_selection_version
 * @property {"nutrition-portion-solver-v1"} source_portion_solver_version
 * @property {"nutrition-food-catalog-v1"} source_food_catalog_version
 * @property {NutritionSwapEngineStatusValue} status
 * @property {NutritionSwapEnginePolicyValue} swap_policy
 * @property {number|null} meal_count
 * @property {NutritionSwapMeal[]} meals
 * @property {Object[]} constraints
 * @property {Array<{code:string,message:string}>} reasons
 */

export {};

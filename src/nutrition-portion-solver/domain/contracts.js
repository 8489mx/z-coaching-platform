export const NUTRITION_PORTION_SOLVER_VERSION =
  "nutrition-portion-solver-v1";

/** @typedef {"Z_COACHING_PORTION_SOLVER_V1"} NutritionPortionSolverPolicyValue */
/** @typedef {"READY"|"PROVISIONAL_REVIEW_REQUIRED"|"WITHHELD"} NutritionPortionSolverStatusValue */
/** @typedef {"FOOD_SELECTION"|"PORTION_SOLVER_ADDITION"} NutritionPortionSelectionSourceValue */

/**
 * @typedef {Object} NutritionPortionNutrients
 * @property {number} calories_kcal
 * @property {number} protein_g
 * @property {number} fat_g
 * @property {number} carbohydrate_g
 * @property {number} fiber_g
 */

/**
 * @typedef {Object} NutritionPortionSolvedItem
 * @property {string} food_code
 * @property {number} slot_sequence
 * @property {string} slot
 * @property {NutritionPortionSelectionSourceValue} selection_source
 * @property {number} grams
 * @property {NutritionPortionNutrients} nutrition
 */

/**
 * @typedef {Object} NutritionPortionSolvedMeal
 * @property {number} sequence
 * @property {string} role
 * @property {string|null} selected_pattern_code
 * @property {{planned_calories:number,protein_g:number,fat_g:number,carbohydrate_g:number,fiber_g:number}} target
 * @property {NutritionPortionSolvedItem[]} items
 * @property {NutritionPortionNutrients} totals
 * @property {NutritionPortionNutrients} residual
 * @property {NutritionPortionNutrients} tolerance
 * @property {{calories_kcal:boolean,protein_g:boolean,fat_g:boolean,carbohydrate_g:boolean,fiber_g:boolean}} within_tolerance
 * @property {boolean} all_targets_within_tolerance
 * @property {number|null} objective_score
 * @property {Object[]} issues
 */

/**
 * @typedef {Object} NutritionPortionSolver
 * @property {"nutrition-portion-solver-v1"} portion_solver_version
 * @property {"nutrition-food-selection-v1"} source_food_selection_version
 * @property {"nutrition-food-catalog-v1"} source_food_catalog_version
 * @property {NutritionPortionSolverStatusValue} status
 * @property {NutritionPortionSolverPolicyValue} solver_policy
 * @property {number|null} meal_count
 * @property {NutritionPortionSolvedMeal[]} meals
 * @property {NutritionPortionNutrients|null} daily_target
 * @property {NutritionPortionNutrients|null} daily_totals
 * @property {NutritionPortionNutrients|null} daily_residual
 * @property {Object[]} constraints
 * @property {Array<{code:string,message:string}>} reasons
 */

export {};

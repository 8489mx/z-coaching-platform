export const NUTRITION_FOOD_SELECTION_VERSION =
  "nutrition-food-selection-v1";

/** @typedef {"Z_COACHING_FOOD_SELECTION_V1"} NutritionFoodSelectionPolicyValue */
/** @typedef {"READY"|"PROVISIONAL_REVIEW_REQUIRED"|"WITHHELD"} NutritionFoodSelectionStatusValue */
/** @typedef {"INACTIVE_FOOD"|"MARKET_UNAVAILABLE"|"BUDGET_LEVEL_EXCEEDED"|"STORAGE_UNAVAILABLE"|"REHEATING_UNAVAILABLE"|"ALLERGY_EXCLUDED"|"MEDICAL_EXCLUDED"|"INTOLERANCE_EXCLUDED"|"DISLIKED_FOOD"} NutritionFoodCandidateRejectionCodeValue */

/**
 * @typedef {Object} NutritionFoodRejectedCandidate
 * @property {string} food_code
 * @property {NutritionFoodCandidateRejectionCodeValue[]} reason_codes
 */

/**
 * @typedef {Object} NutritionFoodSelectedSlot
 * @property {number} sequence
 * @property {string} slot
 * @property {"REQUIRED"|"OPTIONAL"} requirement
 * @property {number} min_items
 * @property {number} max_items
 * @property {string[]} allowed_food_classes
 * @property {string[]} selected_food_codes
 * @property {string[]} candidate_food_codes
 * @property {NutritionFoodRejectedCandidate[]} rejected_foods
 * @property {boolean} deferred_to_portion_solver
 */

/**
 * @typedef {Object} NutritionFoodPatternAttempt
 * @property {string} pattern_code
 * @property {boolean} feasible
 * @property {Array<{slot_sequence:number,slot:string,required_items:number,eligible_items:number}>} blocking_slots
 */

/**
 * @typedef {Object} NutritionFoodSelectionMeal
 * @property {number} sequence
 * @property {string} role
 * @property {Object} target
 * @property {string|null} selected_pattern_code
 * @property {NutritionFoodPatternAttempt[]} pattern_attempts
 * @property {NutritionFoodSelectedSlot[]} slots
 * @property {Array<{code:string,message:string}>} issues
 */

/**
 * @typedef {Object} NutritionFoodSelection
 * @property {"nutrition-food-selection-v1"} food_selection_version
 * @property {"nutrition-planning-snapshot-v1"} source_snapshot_version
 * @property {"nutrition-meal-assembly-blueprint-v1"} source_assembly_blueprint_version
 * @property {"nutrition-food-catalog-v1"} source_food_catalog_version
 * @property {NutritionFoodSelectionStatusValue} status
 * @property {NutritionFoodSelectionPolicyValue} selection_policy
 * @property {string} market_code
 * @property {number|null} meal_count
 * @property {NutritionFoodSelectionMeal[]} meals
 * @property {Object[]} constraints
 * @property {Array<{code:string,message:string}>} reasons
 */

export {};

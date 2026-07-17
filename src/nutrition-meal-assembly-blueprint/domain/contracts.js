export const NUTRITION_MEAL_ASSEMBLY_BLUEPRINT_VERSION =
  "nutrition-meal-assembly-blueprint-v1";

/** @typedef {"READY"|"PROVISIONAL_REVIEW_REQUIRED"|"WITHHELD"} NutritionMealAssemblyStatusValue */
/** @typedef {"Z_COACHING_MEAL_ASSEMBLY_V1"} NutritionMealAssemblyPolicyValue */
/** @typedef {"BREAKFAST_SAVORY"|"BREAKFAST_DAIRY_FRUIT"|"BREAKFAST_LEGUME"|"MAIN_CLASSIC"|"MAIN_LEGUME"|"EVENING_CLASSIC"|"EVENING_LIGHT_SAVORY"|"SNACK_DAIRY_FRUIT"|"SNACK_PROTEIN_CARB"} NutritionMealPatternCodeValue */
/** @typedef {"PROTEIN_ANCHOR"|"CARBOHYDRATE_BASE"|"VEGETABLE"|"FRUIT"|"DAIRY_SUPPORT"|"ADDED_FAT"} NutritionMealComponentSlotValue */
/** @typedef {"ANIMAL_PROTEIN"|"EGG"|"DAIRY_PROTEIN"|"LEGUME"|"STARCH"|"FRUIT"|"NON_STARCH_VEGETABLE"|"ADDED_FAT"} NutritionFoodClassValue */
/** @typedef {"REQUIRED"|"OPTIONAL"} NutritionComponentRequirementValue */
/** @typedef {"NOT_APPLICABLE"|"OPTIONAL_ONLY_IF_NEEDED_AFTER_BASE_COMPONENTS"} NutritionAddedFatPolicyValue */

/**
 * @typedef {Object} NutritionMealPatternSlot
 * @property {number} sequence
 * @property {NutritionMealComponentSlotValue} slot
 * @property {NutritionComponentRequirementValue} requirement
 * @property {number} min_items
 * @property {number} max_items
 * @property {NutritionFoodClassValue[]} allowed_food_classes
 */

/**
 * @typedef {Object} NutritionMealPattern
 * @property {NutritionMealPatternCodeValue} code
 * @property {"BREAKFAST"|"MAIN_MEAL"|"SNACK"|"EVENING_MEAL"} meal_role
 * @property {NutritionAddedFatPolicyValue} added_fat_policy
 * @property {NutritionMealPatternSlot[]} slots
 */

/**
 * @typedef {Object} NutritionMealAssemblyTarget
 * @property {number} planned_calories
 * @property {number} protein_g
 * @property {number} fat_g
 * @property {number} carbohydrate_g
 * @property {number} fiber_g
 */

/**
 * @typedef {Object} NutritionMealAssemblyMeal
 * @property {number} sequence
 * @property {"BREAKFAST"|"MAIN_MEAL"|"SNACK"|"EVENING_MEAL"} role
 * @property {NutritionMealAssemblyTarget} target
 * @property {NutritionMealPattern[]} allowed_patterns
 */

/**
 * @typedef {Object} NutritionMealAssemblyBlueprint
 * @property {"nutrition-meal-assembly-blueprint-v1"} assembly_blueprint_version
 * @property {"nutrition-planning-snapshot-v1"} source_snapshot_version
 * @property {"nutrition-meal-distribution-v1"} source_meal_distribution_version
 * @property {"READY"|"PROVISIONAL_REVIEW_REQUIRED"|"WITHHELD"} source_distribution_status
 * @property {NutritionMealAssemblyStatusValue} status
 * @property {NutritionMealAssemblyPolicyValue} assembly_policy
 * @property {number|null} meal_count
 * @property {{budget:string,food_storage_available:boolean,food_reheating_available:boolean}} logistics
 * @property {{allergies:Object[],medical_exclusions:Object[],intolerances:Object[],digestive_issues:Object[],disliked_foods:string[]}} food_restrictions
 * @property {NutritionMealAssemblyMeal[]} meals
 * @property {Object[]} constraints
 * @property {Array<{code:string,message:string}>} reasons
 */

export {};

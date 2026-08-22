export const NUTRITION_FOOD_CATALOG_VERSION = "nutrition-food-catalog-v1";

/** @typedef {"Z_COACHING_FOOD_CATALOG_V1"} NutritionFoodCatalogPolicyValue */
/** @typedef {"RAW"|"COOKED"|"READY_TO_EAT"} NutritionFoodStateValue */
/** @typedef {"FOOD_COMPOSITION_DATABASE"|"MANUFACTURER_LABEL"|"COACH_VERIFIED"} NutritionFoodSourceTypeValue */
/** @typedef {"EG"|"SA"|"KW"|"BH"|"QA"|"AE"} NutritionMarketCodeValue */
/** @typedef {"ANIMAL_PROTEIN"|"EGG"|"DAIRY_PROTEIN"|"LEGUME"|"STARCH"|"FRUIT"|"NON_STARCH_VEGETABLE"|"ADDED_FAT"} NutritionFoodClassValue */
/** @typedef {"BREAKFAST_SAVORY"|"BREAKFAST_DAIRY_FRUIT"|"BREAKFAST_LEGUME"|"MAIN_CLASSIC"|"MAIN_LEGUME"|"EVENING_CLASSIC"|"EVENING_LIGHT_SAVORY"|"SNACK_DAIRY_FRUIT"|"SNACK_PROTEIN_CARB"} NutritionMealPatternCodeValue */
/** @typedef {"LOW"|"MEDIUM"|"HIGH"} BudgetLevelValue */

/**
 * @typedef {Object} NutritionFoodLogistics
 * @property {boolean} requires_storage
 * @property {boolean} requires_reheating
 */

/**
 * @typedef {Object} NutritionPer100g
 * @property {number} calories_kcal
 * @property {number} protein_g
 * @property {number} fat_g
 * @property {number} carbohydrate_g
 * @property {number} fiber_g
 */

/**
 * @typedef {Object} NutritionFoodPortionRule
 * @property {number} minimum_g
 * @property {number} maximum_g
 * @property {number} step_g
 * @property {number} default_g
 */

/**
 * @typedef {Object} NutritionFoodTags
 * @property {string[]} identity_tags
 * @property {string[]} allergen_tags
 * @property {string[]} intolerance_tags
 */

/**
 * @typedef {Object} NutritionFoodSwap
 * @property {boolean} is_swappable
 * @property {string|null} group_code
 */

/**
 * @typedef {Object} NutritionFoodSource
 * @property {NutritionFoodSourceTypeValue} type
 * @property {string} name
 * @property {string} reference
 * @property {string} checked_date
 */

/**
 * @typedef {Object} NutritionFoodItem
 * @property {string} food_code
 * @property {string} name_ar
 * @property {string} name_en
 * @property {NutritionFoodClassValue} food_class
 * @property {NutritionFoodStateValue} food_state
 * @property {boolean} is_active
 * @property {number} selection_priority
 * @property {NutritionMealPatternCodeValue[]} compatible_pattern_codes
 * @property {NutritionMarketCodeValue[]} available_markets
 * @property {BudgetLevelValue} budget_level
 * @property {NutritionFoodLogistics} logistics
 * @property {NutritionPer100g} nutrition_per_100g
 * @property {NutritionFoodPortionRule} portion_rule_g
 * @property {NutritionFoodTags} tags
 * @property {NutritionFoodSwap} swap
 * @property {NutritionFoodSource} source
 */

/**
 * @typedef {Object} NutritionFoodSwapGroup
 * @property {string} group_code
 * @property {NutritionFoodClassValue} food_class
 * @property {string[]} active_item_codes
 */

/**
 * @typedef {Object} NutritionFoodCatalog
 * @property {"nutrition-food-catalog-v1"} food_catalog_version
 * @property {NutritionFoodCatalogPolicyValue} catalog_policy
 * @property {number} items_count
 * @property {number} active_items_count
 * @property {NutritionFoodItem[]} items
 * @property {NutritionFoodSwapGroup[]} swap_groups
 */

/**
 * @typedef {Object} NutritionFoodCatalogValidationIssue
 * @property {string} path
 * @property {string} code
 * @property {string} message
 */

export {};

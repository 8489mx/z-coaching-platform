import {
  NUTRITION_SWAP_ENGINE_V2_VERSION,
  MealTimeCategory,
} from "./domain/enums.js";
import {
  getSmartFoodRegistryItem,
  listSmartSwapCandidates,
} from "./swap-pool-registry.js";

function requireNonEmptyString(value, name) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`${name} must be a non-empty string.`);
  }
}

/**
 * Calculates a macro-matched, context-appropriate smart food swap.
 *
 * @param {Object} params
 * @param {string} params.current_food_code
 * @param {number} params.current_portion_g
 * @param {string} params.target_food_code
 * @param {string} [params.meal_category=MealTimeCategory.MAIN_MEAL]
 * @returns {Object}
 */
export function calculateSmartSwap(params) {
  if (!params || typeof params !== "object") {
    throw new TypeError("params must be an object.");
  }

  const {
    current_food_code,
    current_portion_g,
    target_food_code,
    meal_category = MealTimeCategory.MAIN_MEAL,
  } = params;

  requireNonEmptyString(current_food_code, "current_food_code");
  requireNonEmptyString(target_food_code, "target_food_code");

  if (typeof current_portion_g !== "number" || current_portion_g <= 0) {
    throw new TypeError("current_portion_g must be a positive number.");
  }

  const currentItem = getSmartFoodRegistryItem(current_food_code);
  if (!currentItem) {
    throw new Error(`Current food '${current_food_code}' is not recognized in the smart swap registry.`);
  }

  const targetItem = getSmartFoodRegistryItem(target_food_code);
  if (!targetItem) {
    throw new Error(`Target food '${target_food_code}' is not recognized in the smart swap registry.`);
  }

  // 1. Strict Macro Matching Check
  if (currentItem.macro_type !== targetItem.macro_type) {
    throw new Error(
      `Invalid Swap: Cannot swap ${currentItem.macro_type} (${currentItem.name_ar}) with ${targetItem.macro_type} (${targetItem.name_ar}).`,
    );
  }

  // 2. Meal Category Appropriateness Check
  if (!targetItem.meal_categories.includes(meal_category)) {
    throw new Error(
      `Invalid Meal Context: '${targetItem.name_ar}' is not appropriate for ${meal_category}.`,
    );
  }

  // 3. Dynamic Portion Calculation Formula
  const calculatedGrams = Math.round(
    current_portion_g * (currentItem.primary_nutrient_per_100g / targetItem.primary_nutrient_per_100g),
  );

  // 4. Household Serving Quantization
  const unitCount =
    Math.round((calculatedGrams / targetItem.grams_per_household_unit) * 2) / 2;

  let displayAr = `${calculatedGrams}g ${targetItem.name_ar}`;
  let displayEn = `${calculatedGrams}g ${targetItem.name_en}`;

  if (targetItem.unit_label_ar && targetItem.grams_per_household_unit < 100 && unitCount >= 1) {
    displayAr = `${unitCount} ${targetItem.unit_label_ar} (~${calculatedGrams}g)`;
    displayEn = `${unitCount} ${targetItem.unit_label_en} (~${calculatedGrams}g)`;
  } else if (unitCount >= 1 && targetItem.grams_per_household_unit >= 100) {
    displayAr = `${calculatedGrams}g ${targetItem.name_ar}`;
    displayEn = `${calculatedGrams}g ${targetItem.name_en}`;
  }

  return Object.freeze({
    engine_version: NUTRITION_SWAP_ENGINE_V2_VERSION,
    current_food: Object.freeze({
      food_code: currentItem.food_code,
      name_ar: currentItem.name_ar,
      name_en: currentItem.name_en,
      portion_g: current_portion_g,
    }),
    target_food: Object.freeze({
      food_code: targetItem.food_code,
      name_ar: targetItem.name_ar,
      name_en: targetItem.name_en,
      portion_g: calculatedGrams,
      unit_count: unitCount,
      serving_display_ar: displayAr,
      serving_display_en: displayEn,
    }),
    macro_type: targetItem.macro_type,
    meal_category,
  });
}

export {
  NUTRITION_MEAL_CONTEXT_V2_VERSION,
  ErgonomicPortionCaps,
} from "./domain/enums.js";

export { sanitizeMealPlan } from "./sanitize-meal-plan.js";
export {
  buildCulinaryRecipeMeals,
  enforceDiabeticCarbChoice,
  enforceClinicalSafety,
  splitOversizedPortions,
  trimMealsToTarget,
  diversifyFatSources,
  buildAllergenContext,
  carbPortionLimit,
  isDiabeticIntake,
  generateSmartSwaps,
  refreshActualMacros,
  isFoodClinicallySafe,
  applyCulinaryProteinFallback,
  FOOD_SWAP_DATABASE,
} from "./build-culinary-meals.js";


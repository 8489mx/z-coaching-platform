export {
  NUTRITION_MEAL_CONTEXT_V2_VERSION,
  ErgonomicPortionCaps,
} from "./domain/enums.js";

export { sanitizeMealPlan } from "./sanitize-meal-plan.js";
export {
  buildCulinaryRecipeMeals,
  enforceDiabeticCarbChoice,
  splitOversizedPortions,
  diversifyFatSources,
  buildAllergenContext,
  carbPortionLimit,
  isDiabeticIntake,
  generateSmartSwaps,
  refreshActualMacros,
  FOOD_SWAP_DATABASE,
} from "./build-culinary-meals.js";


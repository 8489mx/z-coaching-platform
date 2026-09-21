/**
 * Whether a mobile-app food swap is eaten the same way and carries about the same energy as the
 * food it replaces (frontend/src/utils/swapExchangeRules.js). The swap registry only knows each
 * food's main nutrient, so the full macros come from the meal generator's food data; a food with
 * no macros there cannot be judged and is refused.
 */
import { FOOD_SWAP_DATABASE } from "../../nutrition-meal-context-v2/build-culinary-meals.js";
import { isEquivalentSwap } from "../../../frontend/src/utils/swapExchangeRules.js";
import { REGISTRY_TO_PLAN_FOOD } from "./liveFoodSwapSafety.js";

/** Energy and macros of a swap-registry food portion, or null when its macros are unknown. */
export function liveSwapPortionValue(registryCode, grams) {
  const code = String(registryCode || "").toUpperCase();
  const food = FOOD_SWAP_DATABASE[REGISTRY_TO_PLAN_FOOD[code] || code];
  const g = Number(grams);
  if (!food || !(g > 0)) return null;
  const amount = (key) => ((Number(food[key]) || 0) * g) / 100;
  const protein = amount("protein_per_100g");
  const carbs = amount("carb_per_100g");
  const fat = amount("fat_per_100g");
  return { kcal: protein * 4 + carbs * 4 + fat * 9, protein, carbs, fat };
}

/** True when the target portion is the same kind of food with close energy and fat. */
export function isLiveSwapEquivalent(fromCode, fromGrams, toCode, toGrams) {
  const from = liveSwapPortionValue(fromCode, fromGrams);
  const to = liveSwapPortionValue(toCode, toGrams);
  if (!from || !to) return false;
  return isEquivalentSwap({
    fromCode: String(fromCode).toUpperCase(), toCode: String(toCode).toUpperCase(),
    fromKcal: from.kcal, toKcal: to.kcal, fromFat: from.fat, toFat: to.fat,
  });
}

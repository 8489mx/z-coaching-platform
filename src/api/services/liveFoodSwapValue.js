/**
 * Whether a mobile-app food swap is eaten the same way and carries about the same energy as the
 * food it replaces (frontend/src/utils/swapExchangeRules.js). The swap registry only knows each
 * food's main nutrient, so the full macros come from the one canonical food table; a food with
 * no canonical row cannot be judged and is refused.
 */
import { isEquivalentSwap } from "../../../frontend/src/utils/swapExchangeRules.js";
import { canonicalMacros } from "../../nutrition-food-catalog/canonical-food-table.js";

/**
 * Per-100 g macros of a swap-registry food, from the canonical table (P2-C2).
 * The old hand maps are gone: REGISTRY_OWN_MACROS (egg, egg white, peanut butter) and
 * REGISTRY_TO_PLAN_FOOD now live as links on canonical rows. Egg white resolves to
 * the plan's cooked egg white (the codebase's reference agrees); whole egg resolves
 * to the hard-boiled selection row. Peanut butter keeps its USDA 16098 protein, carb,
 * and fat; its kcal is computed from those macros below, as before.
 */
function foodMacros(registryCode) {
  const macros = canonicalMacros(registryCode);
  if (!macros) return null;
  return {
    protein_per_100g: macros.protein_g,
    carb_per_100g: macros.carbohydrate_g,
    fat_per_100g: macros.fat_g,
    kcal_per_100g: macros.calories_kcal,
  };
}

const MAIN_NUTRIENT = Object.freeze({
  PROTEIN_DOMINANT: "protein_per_100g", CARBOHYDRATE_DOMINANT: "carb_per_100g", FAT_DOMINANT: "fat_per_100g",
});

/**
 * Grams of the target that carry the same main nutrient as the original portion, from the same
 * food data the value check uses (P2-C2: both come from the canonical table, so the density
 * and the portion math can no longer disagree).
 * Null when either food's data is missing.
 */
export function liveSwapTargetGrams(fromCode, fromGrams, toCode, macroType) {
  const key = MAIN_NUTRIENT[macroType];
  const from = foodMacros(fromCode);
  const to = foodMacros(toCode);
  const g = Number(fromGrams);
  if (!key || !from || !to || !(g > 0) || !(Number(to[key]) > 0)) return null;
  return Math.round((g * Number(from[key])) / Number(to[key]));
}

/** Household text for a registry food portion (same form as calculateSmartSwap's). */
export function liveSwapServingText(registryItem, grams) {
  const unitCount = Math.round((grams / registryItem.grams_per_household_unit) * 2) / 2;
  if (registryItem.unit_label_ar && registryItem.grams_per_household_unit < 100 && unitCount >= 1) {
    return `${unitCount} ${registryItem.unit_label_ar} (~${grams}g)`;
  }
  return `${grams}g ${registryItem.name_ar}`;
}

/** Energy and macros of a swap-registry food portion, or null when its macros are unknown. */
export function liveSwapPortionValue(registryCode, grams) {
  const food = foodMacros(registryCode);
  const g = Number(grams);
  if (!food || !(g > 0)) return null;
  const amount = (key) => ((Number(food[key]) || 0) * g) / 100;
  const protein = amount("protein_per_100g");
  const carbs = amount("carb_per_100g");
  const fat = amount("fat_per_100g");
  return { kcal: protein * 4 + carbs * 4 + fat * 9, protein, carbs, fat };
}

// A leaner swap gets the missing fat as olive oil, like the plan's swaps (lean protein + a fat
// exchange): tuna, fish or cottage cheese with olive oil is how they are eaten anyway.
export const MAX_LIVE_OIL_ADDITION_G = 15;
const MIN_FAT_GAP_FOR_OIL_G = 4;

/** Olive oil (g) to add to the target portion so its fat matches the original; 0 when not needed. */
export function liveSwapOilAddition(fromCode, fromGrams, toCode, toGrams) {
  const from = liveSwapPortionValue(fromCode, fromGrams);
  const to = liveSwapPortionValue(toCode, toGrams);
  if (!from || !to) return 0;
  const missingFat = from.fat - to.fat;
  return missingFat >= MIN_FAT_GAP_FOR_OIL_G ? Math.min(MAX_LIVE_OIL_ADDITION_G, Math.round(missingFat)) : 0;
}

/** The target portion's value with its added olive oil (1 g oil = 1 g fat, 9 kcal). */
export function liveSwapValueWithOil(fromCode, fromGrams, toCode, toGrams) {
  const to = liveSwapPortionValue(toCode, toGrams);
  if (!to) return null;
  const oil = liveSwapOilAddition(fromCode, fromGrams, toCode, toGrams);
  return { ...to, kcal: to.kcal + oil * 9, fat: to.fat + oil, oil };
}

/** True when the target portion (with its added oil) is the same kind of food with close energy and fat. */
export function isLiveSwapEquivalent(fromCode, fromGrams, toCode, toGrams) {
  const from = liveSwapPortionValue(fromCode, fromGrams);
  const to = liveSwapValueWithOil(fromCode, fromGrams, toCode, toGrams);
  if (!from || !to) return false;
  return isEquivalentSwap({
    fromCode: String(fromCode).toUpperCase(), toCode: String(toCode).toUpperCase(),
    fromKcal: from.kcal, toKcal: to.kcal, fromFat: from.fat, toFat: to.fat,
  });
}

/** " + X جم زيت زيتون" for a swap that adds oil, else "". */
export function liveSwapOilText(oilGrams) {
  return oilGrams > 0 ? ` + ${oilGrams} جم زيت زيتون` : "";
}

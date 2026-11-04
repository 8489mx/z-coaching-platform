/**
 * Clinical safety for the food swaps the mobile app asks the server for (swap-candidates and
 * swap-food). The swap list uses its own food codes (nutrition-swap-engine-v2 registry); each is
 * mapped to the meal generator's food and judged by the generator's own filter, with the client's
 * restrictions built exactly as for the meal plan. A swap can therefore never offer what the plan
 * itself would refuse.
 */
import {
  buildAllergenContext,
  isFoodClinicallySafe,
  DIABETIC_POTATO_PORTION_G,
} from "../../nutrition-meal-context-v2/build-culinary-meals.js";
import { adaptIntakePayloadToCanonicalEngine } from "../../intake-decision-engine/adapters/intake-adapter.js";
import { canonicalSafetyMap, canonicalPlanMap } from "../../nutrition-food-catalog/canonical-food-table.js";

/** Swap-registry code -> the meal generator's food (same code when absent). P2-C2:
 * derived from the canonical table's value_for/plan_food links, including direct-code
 * identities (identical to the old `|| code` fallback at the use site). */
export const REGISTRY_TO_PLAN_FOOD = canonicalSafetyMap();

/** The meal generator's codes the app sends -> the swap registry's codes. P2-C2:
 * the exact entries are derived from the canonical table's plan_registry_twin links
 * (including the P1-B7 pins for the milks, veggie sides, and banana, which used to
 * mis-resolve through the Arabic keyword fallback or resolve to nothing). */
const PLAN_FOOD_TO_REGISTRY_FALLBACK = Object.freeze({
  // No twin in the swap list: listed from a food of the same macro type.
  // These are approximations, NOT identities, and stay explicit by P2-C3 decision:
  // the 9 foods have canonical rows but no registry entry (no sourced household
  // unit or meal-category metadata), so inventing registry entries would break the
  // no-invention rule. The twin is used only for candidate listing and engine
  // validation; since P2-C3 the grams, oil, and equivalence are judged on the
  // food the client actually has (valueCode in program.controller.js).
  // Basmati rice has no registry twin either; the old entry pointed at kabsa
  // spiced rice (a dish, not plain rice), so it is reclassified here as an
  // approximation instead of an exact entry.
  FRESH_GUAVA: "APPLE_FRESH",
  FREEKEH_COOKED: "PASTA_WHOLE_WHEAT_COOKED",
  DARK_CHOCOLATE_85: "ALMONDS_RAW",
  HEMP_CHIA_SEEDS: "ALMONDS_RAW",
  CHIA_SEEDS: "ALMONDS_RAW",
  SMOKED_TURKEY: "CHICKEN_BREAST_COOKED",
  MIXED_LEGUMES_STEW: "FOUL_MUDAMMAS",
  LOW_FAT_MOZZARELLA: "HALLOUMI_LIGHT",
  BASMATI_RICE: "KABSA_SPICED_RICE",
});

export const PLAN_FOOD_TO_REGISTRY = Object.freeze({
  ...canonicalPlanMap(),
  ...PLAN_FOOD_TO_REGISTRY_FALLBACK,
});

const isPotato = (code) => /POTATO/.test(String(code || ""));

/**
 * Whether a swap-registry food is safe for these restrictions. A food the generator does not know
 * is refused (fail closed), except peanut butter, judged here: a nut, and a legume for favism.
 */
export function isSwapFoodSafe(registryCode, context = {}, targetGrams = null) {
  const code = String(registryCode || "").toUpperCase();
  if (context.dislikedFoodCodes?.has(code)) return false;
  const isChristianFast = Boolean(
    context.isChristianFast ||
    (context.fasting_context?.active && String(context.fasting_context?.mode || "").toUpperCase() === "CHRISTIAN_FAST")
  );
  if (isChristianFast) {
    const fastingDiet = String(context.fastingDiet || context.fasting_context?.diet || "PESCATARIAN").toUpperCase();
    if (/CHICKEN|BEEF|SIRLOIN|VEAL|TURKEY|LAMB|CAMEL|LIVER|EGG|CHEESE|COTTAGE|YOGURT|MILK|LABNEH|HALLOUMI|LABAN|WHEY|CASEIN|BUTTER|GHEE/.test(code) && !/PEANUT|ALMOND|COCONUT|SOY|TAHINI/.test(code)) {
      return false;
    }
    if (fastingDiet === "STRICT_VEGAN" && /FISH|TUNA|SALMON|SHRIMP|TILAPIA|BOURI|HAMOUR|KANAAD|SEAFOOD/.test(code)) {
      return false;
    }
  }
  if (code === "PEANUT_BUTTER") {
    return !(context.isNutsExcluded || context.isFavism || context.isLegumesExcluded);
  }
  const planFood = REGISTRY_TO_PLAN_FOOD[code] || code;
  if (!isFoodClinicallySafe(planFood, context)) return false;
  // Potatoes stay for a diabetic, in a moderate portion only.
  if (context.isDiabetic && isPotato(planFood) && Number(targetGrams) > DIABETIC_POTATO_PORTION_G) return false;
  return true;
}

/**
 * The restrictions of the client a swap request is for: the signed-in client, or the client a
 * coach names (client_code in the body). No intake on file means no known restriction.
 */
export async function resolveSwapContext({ requester, clientForCoach, loadAnswers }) {
  const client = requester?.role === "CLIENT" ? requester : clientForCoach;
  if (!client) return {};
  const answers = await loadAnswers(client.id).catch(() => null);
  if (!answers) return {};
  let canonical = {};
  try {
    canonical = adaptIntakePayloadToCanonicalEngine(structuredClone(answers));
  } catch {
    canonical = {};
  }
  return buildAllergenContext(canonical, answers);
}

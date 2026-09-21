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

/** Swap-registry code -> the meal generator's food (same code when absent). */
export const REGISTRY_TO_PLAN_FOOD = Object.freeze({
  WHOLE_EGG: "EGGS_OMELETTE",
  EGG_WHITE: "EGGS_OMELETTE",
  CHEESE_COTTAGE_LOW_FAT: "COTTAGE_CHEESE",
  YOGURT_GREEK_PLAIN_NONFAT: "GREEK_YOGURT",
  WHEY_PROTEIN_POWDER: "WHEY_PROTEIN",
  CHICKEN_BREAST_COOKED: "CHICKEN_BREAST",
  BEEF_TOP_SIRLOIN_LEAN: "LEAN_BEEF",
  TILAPIA_COOKED: "TILAPIA_FISH",
  SALMON_ATLANTIC_COOKED: "SALMON_FISH",
  TUNA_CANNED_IN_WATER: "CANNED_TUNA",
  OATS_ROLLED_RAW: "ROLLED_OATS",
  BREAD_WHOLE_WHEAT: "BROWN_TOAST",
  BANANA_RAW: "BANANA_FRESH",
  // White rice cooked Egyptian-style: the same high glycemic classification.
  RICE_WHITE_COOKED: "EGYPTIAN_RICE",
  POTATO_BAKED: "ROASTED_POTATOES",
  SWEET_POTATO_BAKED: "SWEET_POTATO",
  PASTA_WHOLE_WHEAT_COOKED: "WHOLE_WHEAT_PASTA",
  ALMONDS_RAW: "RAW_ALMONDS",
});

/** The meal generator's codes the app sends -> the swap registry's codes. */
export const PLAN_FOOD_TO_REGISTRY = Object.freeze({
  EGGS_OMELETTE: "WHOLE_EGG",
  COTTAGE_CHEESE: "CHEESE_COTTAGE_LOW_FAT",
  GREEK_YOGURT: "YOGURT_GREEK_PLAIN_NONFAT",
  WHEY_PROTEIN: "WHEY_PROTEIN_POWDER",
  CHICKEN_BREAST: "CHICKEN_BREAST_COOKED",
  LEAN_BEEF: "BEEF_TOP_SIRLOIN_LEAN",
  TILAPIA_FISH: "TILAPIA_COOKED",
  SALMON_FISH: "SALMON_ATLANTIC_COOKED",
  CANNED_TUNA: "TUNA_CANNED_IN_WATER",
  ROLLED_OATS: "OATS_ROLLED_RAW",
  BROWN_TOAST: "BREAD_WHOLE_WHEAT",
  BASMATI_RICE: "KABSA_SPICED_RICE",
  ROASTED_POTATOES: "POTATO_BAKED",
  SWEET_POTATO: "SWEET_POTATO_BAKED",
  WHOLE_WHEAT_PASTA: "PASTA_WHOLE_WHEAT_COOKED",
  RAW_ALMONDS: "ALMONDS_RAW",
  // No twin in the swap list: listed from a food of the same macro type.
  FRESH_GUAVA: "APPLE_FRESH",
  FREEKEH_COOKED: "PASTA_WHOLE_WHEAT_COOKED",
  DARK_CHOCOLATE_85: "ALMONDS_RAW",
  HEMP_CHIA_SEEDS: "ALMONDS_RAW",
  CHIA_SEEDS: "ALMONDS_RAW",
  SMOKED_TURKEY: "CHICKEN_BREAST_COOKED",
  MIXED_LEGUMES_STEW: "FOUL_MUDAMMAS",
  SKIM_MILK: "LABAN_RAYEB_LOWFAT",
  LACTOSE_FREE_MILK: "LABAN_RAYEB_LOWFAT",
  LOW_FAT_MOZZARELLA: "HALLOUMI_LIGHT",
});

const isPotato = (code) => /POTATO/.test(String(code || ""));

/**
 * Whether a swap-registry food is safe for these restrictions. A food the generator does not know
 * is refused (fail closed), except peanut butter, judged here: a nut, and a legume for favism.
 */
export function isSwapFoodSafe(registryCode, context = {}, targetGrams = null) {
  const code = String(registryCode || "").toUpperCase();
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

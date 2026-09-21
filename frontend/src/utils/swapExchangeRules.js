/**
 * One rule for every food swap (the plan's own swap lists, the web client window, the mobile app):
 * a swap must be eaten the same way and carry about the same energy.
 *
 * 1. Same family. Families follow the food exchange lists used in clinical nutrition (ADA /
 *    Academy of Nutrition and Dietetics "Choose Your Foods"): starches, fruit, lean protein and fats
 *    are separate lists. They are split further by how the food is eaten here: rice can become bread
 *    beside chicken, but bread never becomes watermelon beside foul, and chicken never becomes laban.
 *    A food may belong to more than one family (baked sweet potato is a starch side and a sweet
 *    snack).
 * 2. Close value. The swap is matched on the main nutrient (protein, carbohydrate or fat); its
 *    energy must stay within MAX_ENERGY_GAP of the original and its fat within MAX_FAT_GAP_G.
 *    These two limits are a product rule, not a published number.
 *
 * Plain data and pure functions: imported by the server (src/) and the web app (frontend/).
 */

export const MAX_ENERGY_GAP = 0.25;
export const MAX_FAT_GAP_G = 10;

const MEAT_FISH = "MEAT_FISH";
const SAVORY_PROTEIN = "SAVORY_PROTEIN";
const SWEET_DAIRY = "SWEET_DAIRY";
const SAVORY_STARCH = "SAVORY_STARCH";
const CEREAL = "CEREAL";
const SWEET_CARB = "SWEET_CARB";
const CRUNCH_SNACK = "CRUNCH_SNACK";
const LEGUME_SNACK = "LEGUME_SNACK";
const COOKING_FAT = "COOKING_FAT";
const NUT_SPREAD = "NUT_SPREAD";

// Plan codes (FOOD_SWAP_DATABASE) and mobile registry codes (SMART_SWAP_REGISTRY) side by side.
export const SWAP_FAMILIES = Object.freeze({
  // Meat and fish: the protein of a lunch or dinner plate.
  CHICKEN_BREAST: [MEAT_FISH], CHICKEN_BREAST_COOKED: [MEAT_FISH],
  LEAN_BEEF: [MEAT_FISH], BEEF_TOP_SIRLOIN_LEAN: [MEAT_FISH],
  CAMEL_MEAT_LEAN: [MEAT_FISH],
  TILAPIA_FISH: [MEAT_FISH], TILAPIA_COOKED: [MEAT_FISH],
  HAMOUR_FISH: [MEAT_FISH], KANAAD_KINGFISH: [MEAT_FISH], BOURI_FISH: [MEAT_FISH],
  SALMON_FISH: [MEAT_FISH], SALMON_ATLANTIC_COOKED: [MEAT_FISH],
  CANNED_TUNA: [MEAT_FISH, SAVORY_PROTEIN], TUNA_CANNED_IN_WATER: [MEAT_FISH, SAVORY_PROTEIN],

  // Savory breakfast / light dinner protein: eggs, white cheeses, foul, cold cuts.
  EGGS_OMELETTE: [SAVORY_PROTEIN], WHOLE_EGG: [SAVORY_PROTEIN], EGG_WHITE: [SAVORY_PROTEIN],
  SHAKSHOUKA_EGGS: [SAVORY_PROTEIN],
  COTTAGE_CHEESE: [SAVORY_PROTEIN], CHEESE_COTTAGE_LOW_FAT: [SAVORY_PROTEIN],
  LABNEH_LIGHT: [SAVORY_PROTEIN], HALLOUMI_LIGHT: [SAVORY_PROTEIN], LOW_FAT_MOZZARELLA: [SAVORY_PROTEIN],
  SMOKED_TURKEY: [SAVORY_PROTEIN],
  FOUL_MUDAMMAS: [SAVORY_PROTEIN], MIXED_LEGUMES_STEW: [SAVORY_PROTEIN],

  // Sweet dairy and shakes: yogurt, laban, protein powder, milks.
  GREEK_YOGURT: [SWEET_DAIRY], YOGURT_GREEK_PLAIN_NONFAT: [SWEET_DAIRY],
  LABAN_RAYEB_LOWFAT: [SWEET_DAIRY],
  WHEY_PROTEIN: [SWEET_DAIRY], WHEY_PROTEIN_POWDER: [SWEET_DAIRY], PEA_RICE_PROTEIN_POWDER: [SWEET_DAIRY],
  SKIM_MILK: [SWEET_DAIRY], LACTOSE_FREE_MILK: [SWEET_DAIRY], OAT_MILK: [SWEET_DAIRY],
  ALMOND_MILK_UNSWEETENED: [SWEET_DAIRY], RICE_MILK: [SWEET_DAIRY],

  LUPINI_BEANS: [LEGUME_SNACK],

  // Savory starches: bread, rice, potatoes, pasta, freekeh.
  BALADI_BREAD: [SAVORY_STARCH], TAMEES_BREAD_WHOLEWHEAT: [SAVORY_STARCH], SAJ_BREAD_WHOLEWHEAT: [SAVORY_STARCH],
  BROWN_TOAST: [SAVORY_STARCH], BREAD_WHOLE_WHEAT: [SAVORY_STARCH], RICE_CAKES: [SAVORY_STARCH, CRUNCH_SNACK],
  BASMATI_RICE: [SAVORY_STARCH], RICE_WHITE_COOKED: [SAVORY_STARCH], EGYPTIAN_RICE: [SAVORY_STARCH],
  KABSA_SPICED_RICE: [SAVORY_STARCH], FREEKEH_COOKED: [SAVORY_STARCH],
  WHOLE_WHEAT_PASTA: [SAVORY_STARCH], PASTA_WHOLE_WHEAT_COOKED: [SAVORY_STARCH],
  ROASTED_POTATOES: [SAVORY_STARCH], POTATO_BAKED: [SAVORY_STARCH],
  SWEET_POTATO: [SAVORY_STARCH, SWEET_CARB], SWEET_POTATO_BAKED: [SAVORY_STARCH, SWEET_CARB],

  // Oats: a bowl with milk or yogurt, or with fruit.
  ROLLED_OATS: [CEREAL, SWEET_CARB], OATS_ROLLED_RAW: [CEREAL, SWEET_CARB],

  // Fruit and dates.
  BANANA_FRESH: [SWEET_CARB], BANANA_RAW: [SWEET_CARB], APPLE_FRESH: [SWEET_CARB],
  STRAWBERRY_FRESH: [SWEET_CARB], WATERMELON_FRESH: [SWEET_CARB], ORANGE_FRESH: [SWEET_CARB],
  FRESH_GUAVA: [SWEET_CARB], DATES_KHALAS: [SWEET_CARB],

  AIR_POPPED_POPCORN: [CRUNCH_SNACK],

  // Fats: what the food is cooked in, and what is eaten as it is.
  OLIVE_OIL: [COOKING_FAT], NATURAL_BUTTER_GHEE: [COOKING_FAT],
  FRESH_AVOCADO: [NUT_SPREAD], RAW_TAHINI: [NUT_SPREAD], PEANUT_BUTTER: [NUT_SPREAD],
  RAW_ALMONDS: [NUT_SPREAD], ALMONDS_RAW: [NUT_SPREAD], HEMP_CHIA_SEEDS: [NUT_SPREAD], CHIA_SEEDS: [NUT_SPREAD],
});

/** True when both foods are eaten the same way (they share a family). Unknown foods never match. */
export function sharesSwapFamily(fromCode, toCode) {
  const from = SWAP_FAMILIES[fromCode];
  const to = SWAP_FAMILIES[toCode];
  if (!from || !to) return false;
  return from.some((family) => to.includes(family));
}

/** True when the swap portion carries about the same energy and fat as the original portion. */
export function isCloseInValue({ fromKcal, toKcal, fromFat = 0, toFat = 0 }) {
  if (!(Number(fromKcal) > 0) || !(Number(toKcal) >= 0)) return false;
  if (Math.abs(toKcal - fromKcal) / fromKcal > MAX_ENERGY_GAP) return false;
  return Math.abs((Number(toFat) || 0) - (Number(fromFat) || 0)) <= MAX_FAT_GAP_G;
}

/** Both rules together. */
export function isEquivalentSwap({ fromCode, toCode, fromKcal, toKcal, fromFat, toFat }) {
  return sharesSwapFamily(fromCode, toCode) && isCloseInValue({ fromKcal, toKcal, fromFat, toFat });
}

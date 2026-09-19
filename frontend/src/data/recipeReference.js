/**
 * Recipe-based per-100g values for Gulf and Egyptian composite dishes.
 *
 * USDA FoodData Central has no record for kabsa, machboos, harees, madrooba, koshari, mahshi, molokhia with
 * taqliya or mesaka'a, so each dish is computed from a weighed home-style batch whose ingredients are USDA
 * SR Legacy records (fdc_id below). Grains, legumes, pasta and meats use their COOKED records, so the
 * finished batch weight is the sum of the cooked component weights (the cooking water is already inside
 * the cooked records). Values are for the dish as served.
 *
 * These are standard recipes, not lab analyses: a family recipe with more oil or ghee will be higher.
 * Coaches should treat them as the reference portion and adjust for the client's cooking.
 */

// USDA SR Legacy ingredient records (per 100 g).
export const RECIPE_INGREDIENTS = Object.freeze({
  RICE_LONG_GRAIN_COOKED: { fdc_id: 168878, kcal: 130, protein: 2.69, carbs: 28.17, fat: 0.28, fiber: 0.4, desc: 'Rice, white, long-grain, regular, enriched, cooked' },
  RICE_MEDIUM_GRAIN_COOKED: { fdc_id: 168880, kcal: 130, protein: 2.38, carbs: 28.59, fat: 0.21, fiber: 0.3, desc: 'Rice, white, medium-grain, enriched, cooked' },
  BULGUR_COOKED: { fdc_id: 170287, kcal: 83, protein: 3.08, carbs: 18.58, fat: 0.24, fiber: 4.5, desc: 'Bulgur, cooked (cracked wheat, as jareesh/harees wheat)' },
  PASTA_COOKED: { fdc_id: 169737, kcal: 158, protein: 5.8, carbs: 30.86, fat: 0.93, fiber: 1.8, desc: 'Pasta, cooked, enriched, without added salt' },
  LENTILS_COOKED: { fdc_id: 172421, kcal: 116, protein: 9.02, carbs: 20.13, fat: 0.38, fiber: 7.9, desc: 'Lentils, mature seeds, cooked, boiled, without salt' },
  CHICKPEAS_COOKED: { fdc_id: 173757, kcal: 164, protein: 8.86, carbs: 27.42, fat: 2.59, fiber: 7.6, desc: 'Chickpeas, mature seeds, cooked, boiled, without salt' },
  CHICKEN_THIGH_WITH_SKIN_ROASTED: { fdc_id: 173625, kcal: 232, protein: 23.26, carbs: 0, fat: 14.71, fiber: 0, desc: 'Chicken, broilers or fryers, thigh, meat and skin, cooked, roasted' },
  CHICKEN_BREAST_ROASTED: { fdc_id: 171477, kcal: 165, protein: 31.02, carbs: 0, fat: 3.57, fiber: 0, desc: 'Chicken, broilers or fryers, breast, meat only, cooked, roasted' },
  LAMB_SHOULDER_LEAN_BRAISED: { fdc_id: 174327, kcal: 283, protein: 32.81, carbs: 0, fat: 15.89, fiber: 0, desc: 'Lamb, shoulder, whole, separable lean only, trimmed to 1/4" fat, choice, cooked, braised' },
  KING_MACKEREL_COOKED: { fdc_id: 174236, kcal: 134, protein: 26, carbs: 0, fat: 2.56, fiber: 0, desc: 'Fish, mackerel, king, cooked, dry heat (kanaad)' },
  ONION_RAW: { fdc_id: 170000, kcal: 40, protein: 1.1, carbs: 9.34, fat: 0.1, fiber: 1.7, desc: 'Onions, raw' },
  TOMATO_RAW: { fdc_id: 170457, kcal: 18, protein: 0.88, carbs: 3.89, fat: 0.2, fiber: 1.2, desc: 'Tomatoes, red, ripe, raw, year round average' },
  TOMATO_PASTE: { fdc_id: 170459, kcal: 82, protein: 4.32, carbs: 18.91, fat: 0.47, fiber: 4.1, desc: 'Tomato products, canned, paste, without salt added' },
  TOMATO_SAUCE: { fdc_id: 170054, kcal: 24, protein: 1.2, carbs: 5.31, fat: 0.3, fiber: 1.5, desc: 'Tomato products, canned, sauce' },
  GARLIC_RAW: { fdc_id: 169230, kcal: 149, protein: 6.36, carbs: 33.06, fat: 0.5, fiber: 2.1, desc: 'Garlic, raw' },
  RAISINS: { fdc_id: 168165, kcal: 299, protein: 3.3, carbs: 79.32, fat: 0.25, fiber: 4.5, desc: 'Raisins, dark, seedless' },
  GRAPE_LEAVES_CANNED: { fdc_id: 169393, kcal: 69, protein: 4.27, carbs: 11.71, fat: 1.97, fiber: 9.9, desc: 'Grape leaves, canned' },
  CABBAGE_COOKED: { fdc_id: 168514, kcal: 23, protein: 1.27, carbs: 5.51, fat: 0.06, fiber: 1.9, desc: 'Cabbage, common, cooked, boiled, drained, with salt' },
  EGGPLANT_COOKED: { fdc_id: 169229, kcal: 35, protein: 0.83, carbs: 8.73, fat: 0.23, fiber: 2.5, desc: 'Eggplant, cooked, boiled, drained, without salt' },
  JUTE_COOKED: { fdc_id: 168420, kcal: 37, protein: 3.68, carbs: 7.29, fat: 0.2, fiber: 2, desc: 'Jute, potherb, cooked, boiled, drained (molokhia)' },
  SUNFLOWER_OIL: { fdc_id: 171017, kcal: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, desc: 'Oil, sunflower, linoleic (less than 60%)' },
  GHEE: { fdc_id: 171314, kcal: 900, protein: 0, carbs: 0, fat: 100, fiber: 0, desc: 'Butter, clarified butter (ghee)' },
});

// Weighed batches (grams of each component as it goes into the served dish).
export const RECIPES = Object.freeze({
  KABSA_CHICKEN: {
    name_ar: 'كبسة دجاج', name_en: 'Chicken Kabsa', region: 'GULF',
    ingredients: { RICE_LONG_GRAIN_COOKED: 520, CHICKEN_THIGH_WITH_SKIN_ROASTED: 280, ONION_RAW: 60, TOMATO_RAW: 60, TOMATO_PASTE: 15, SUNFLOWER_OIL: 20, RAISINS: 15 },
  },
  KABSA_LAMB: {
    name_ar: 'كبسة لحم', name_en: 'Lamb Kabsa', region: 'GULF',
    ingredients: { RICE_LONG_GRAIN_COOKED: 520, LAMB_SHOULDER_LEAN_BRAISED: 250, ONION_RAW: 60, TOMATO_RAW: 60, TOMATO_PASTE: 15, SUNFLOWER_OIL: 20 },
  },
  MACHBOOS_CHICKEN: {
    name_ar: 'مجبوس دجاج', name_en: 'Chicken Machboos', region: 'GULF',
    ingredients: { RICE_LONG_GRAIN_COOKED: 540, CHICKEN_THIGH_WITH_SKIN_ROASTED: 260, TOMATO_RAW: 90, ONION_RAW: 60, SUNFLOWER_OIL: 20 },
  },
  MACHBOOS_KINGFISH: {
    name_ar: 'مجبوس سمك كنعد', name_en: 'Kingfish Machboos', region: 'GULF',
    ingredients: { RICE_LONG_GRAIN_COOKED: 540, KING_MACKEREL_COOKED: 260, TOMATO_RAW: 90, ONION_RAW: 60, SUNFLOWER_OIL: 20 },
  },
  HAREES_CHICKEN: {
    name_ar: 'هريس دجاج', name_en: 'Chicken Harees', region: 'GULF',
    ingredients: { BULGUR_COOKED: 600, CHICKEN_BREAST_ROASTED: 250, GHEE: 20 },
  },
  MADROOBA_CHICKEN: {
    name_ar: 'مضروبة دجاج', name_en: 'Chicken Madrooba', region: 'GULF',
    ingredients: { RICE_MEDIUM_GRAIN_COOKED: 550, CHICKEN_BREAST_ROASTED: 250, ONION_RAW: 40, GHEE: 20 },
  },
  KOSHARI: {
    name_ar: 'كشري مصري', name_en: 'Egyptian Koshari', region: 'EGYPT',
    ingredients: { RICE_MEDIUM_GRAIN_COOKED: 300, LENTILS_COOKED: 180, PASTA_COOKED: 200, CHICKPEAS_COOKED: 60, TOMATO_SAUCE: 150, ONION_RAW: 60, SUNFLOWER_OIL: 30 },
  },
  MAHSHI_WARAQ_ENAB: {
    name_ar: 'محشي ورق عنب', name_en: 'Stuffed Vine Leaves (Mahshi)', region: 'EGYPT',
    ingredients: { GRAPE_LEAVES_CANNED: 250, RICE_MEDIUM_GRAIN_COOKED: 550, TOMATO_SAUCE: 100, ONION_RAW: 40, SUNFLOWER_OIL: 40 },
  },
  MAHSHI_KROMB: {
    name_ar: 'محشي كرنب', name_en: 'Stuffed Cabbage (Mahshi)', region: 'EGYPT',
    ingredients: { CABBAGE_COOKED: 300, RICE_MEDIUM_GRAIN_COOKED: 500, TOMATO_SAUCE: 100, ONION_RAW: 40, SUNFLOWER_OIL: 30 },
  },
  MOLOKHIA_TAQLIYA: {
    name_ar: 'ملوخية بالتقلية (سمنة وثوم)', name_en: 'Molokhia with Garlic-Ghee Taqliya', region: 'EGYPT',
    ingredients: { JUTE_COOKED: 900, GHEE: 20, GARLIC_RAW: 15 },
  },
  MESAKAA: {
    name_ar: 'مسقعة باذنجان', name_en: "Egyptian Mesaka'a (Eggplant)", region: 'EGYPT',
    ingredients: { EGGPLANT_COOKED: 500, TOMATO_SAUCE: 250, ONION_RAW: 60, GARLIC_RAW: 10, SUNFLOWER_OIL: 50 },
  },
});

const round1 = (n) => Math.round(n * 10) / 10;

export function computeRecipePer100g(recipe) {
  let weight = 0;
  const sum = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  for (const [code, grams] of Object.entries(recipe.ingredients)) {
    const ing = RECIPE_INGREDIENTS[code];
    if (!ing) throw new Error(`Unknown recipe ingredient ${code}`);
    weight += grams;
    for (const key of Object.keys(sum)) sum[key] += (ing[key] * grams) / 100;
  }
  return {
    kcal: Math.round((sum.kcal / weight) * 100),
    protein: round1((sum.protein / weight) * 100),
    carbs: round1((sum.carbs / weight) * 100),
    fat: round1((sum.fat / weight) * 100),
    fiber: round1((sum.fiber / weight) * 100),
    batch_weight_g: weight,
    source: 'RECIPE_USDA_INGREDIENTS',
  };
}

export const RECIPE_REFERENCE = Object.freeze(
  Object.fromEntries(Object.entries(RECIPES).map(([code, recipe]) => [code, Object.freeze(computeRecipePer100g(recipe))])),
);

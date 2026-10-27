/**
 * Kitchen Yield Engine
 *
 * Raw vs. Cooked Yield Matrix:
 *    - Poultry (Chicken/Turkey): 0.75 yield (water loss during grilling/baking).
 *    - Red Meat (Beef/Veal/Camel/Liver): 0.72 yield (water & fat loss during grilling).
 *    - Fish/Seafood: 0.80 yield.
 *    - Rice/Pasta/Grains: 2.50 expansion yield (water absorption).
 *    - Legumes (Lentils/Chickpeas/Fava): 2.20 expansion yield.
 *    - Potatoes/Sweet Potatoes: 0.95 yield.
 *    - Oats: 2.80 expansion yield (stored as RAW dry in catalog).
 *
 * Grocery/shopping list generation was removed (Zero Grocery Lists invariant).
 */

export const YIELD_FACTORS = {
  MEAT_POULTRY: { raw_to_cooked: 0.75, base_state: 'COOKED', label_ar: 'لحوم ودواجن (انكماش 25% بالطهي)' },
  RED_MEAT_BEEF: { raw_to_cooked: 0.72, base_state: 'COOKED', label_ar: 'لحوم حمراء وبقري (انكماش 28% بالطهي)' },
  FISH_SEAFOOD: { raw_to_cooked: 0.80, base_state: 'COOKED', label_ar: 'أسماك ومأكولات بحرية (انكماش 20% بالطهي)' },
  RICE_PASTA: { raw_to_cooked: 2.50, base_state: 'COOKED', label_ar: 'أرز ومكرونة وحبوب (تمدد 2.5 ضعف بالامتصاص)' },
  LEGUMES: { raw_to_cooked: 2.20, base_state: 'COOKED', label_ar: 'بقوليات مسلوقة (تمدد 2.2 ضعف بالامتصاص)' },
  OATS: { raw_to_cooked: 2.80, base_state: 'RAW', label_ar: 'شوفان مطبوخ بالماء' },
  POTATOES: { raw_to_cooked: 0.95, base_state: 'COOKED', label_ar: 'بطاطس وبطاطا مشوية/مسلوقة' },
  STANDARD: { raw_to_cooked: 1.00, base_state: 'COOKED', label_ar: 'ثابت بدون تغيير وزني' }
};

export const FOOD_YIELD_MAPPING = {
  CHICKEN_BREAST: YIELD_FACTORS.MEAT_POULTRY,
  SKINLESS_CHICKEN_THIGHS: YIELD_FACTORS.MEAT_POULTRY,
  FRESH_TURKEY_BREAST: YIELD_FACTORS.MEAT_POULTRY,
  LEAN_VEAL_BEEF: YIELD_FACTORS.RED_MEAT_BEEF,
  LEAN_GROUND_BEEF_95_5: YIELD_FACTORS.RED_MEAT_BEEF,
  GROUND_BEEF_90_10: YIELD_FACTORS.RED_MEAT_BEEF,
  CAMEL_MEAT_HASHI: YIELD_FACTORS.RED_MEAT_BEEF,
  CHICKEN_LIVER_GRILLED: YIELD_FACTORS.RED_MEAT_BEEF,
  WHITE_FISH_FILLET: YIELD_FACTORS.FISH_SEAFOOD,
  TILAPIA_BOLTI_GRILLED: YIELD_FACTORS.FISH_SEAFOOD,
  TILAPIA_FISH: YIELD_FACTORS.FISH_SEAFOOD,
  BOURI_FISH_GRILLED: YIELD_FACTORS.FISH_SEAFOOD,
  HAMOUR_FISH_GRILLED: YIELD_FACTORS.FISH_SEAFOOD,
  KANAAD_KINGFISH_GRILLED: YIELD_FACTORS.FISH_SEAFOOD,
  SALMON_ATLANTIC_COOKED: YIELD_FACTORS.FISH_SEAFOOD,
  SALMON_FISH: YIELD_FACTORS.FISH_SEAFOOD,
  SHRIMP_GRILLED: YIELD_FACTORS.FISH_SEAFOOD,
  BASMATI_RICE_COOKED: YIELD_FACTORS.RICE_PASTA,
  EGYPTIAN_RICE_COOKED: YIELD_FACTORS.RICE_PASTA,
  BROWN_BASMATI_RICE: YIELD_FACTORS.RICE_PASTA,
  KABSA_SPICED_RICE: YIELD_FACTORS.RICE_PASTA,
  PASTA_COOKED: YIELD_FACTORS.RICE_PASTA,
  WHOLE_WHEAT_PASTA: YIELD_FACTORS.RICE_PASTA,
  COOKED_WHITE_PASTA: YIELD_FACTORS.RICE_PASTA,
  COOKED_QUINOA: YIELD_FACTORS.RICE_PASTA,
  COOKED_BULGUR: YIELD_FACTORS.RICE_PASTA,
  FREEKEH_COOKED: YIELD_FACTORS.RICE_PASTA,
  OATS_RAW: YIELD_FACTORS.OATS,
  ROLLED_OATS_RAW: YIELD_FACTORS.OATS,
  ROLLED_OATS: YIELD_FACTORS.OATS,
  BOILED_POTATOES: YIELD_FACTORS.POTATOES,
  SWEET_POTATO_BAKED: YIELD_FACTORS.POTATOES,
  SWEET_POTATO_BOILED: YIELD_FACTORS.POTATOES,
  AIRFRYER_POTATO_WEDGES: YIELD_FACTORS.POTATOES,
  LENTILS_COOKED: YIELD_FACTORS.LEGUMES,
  CHICKPEAS_BOILED: YIELD_FACTORS.LEGUMES,
  FAVA_BEANS_PLAIN: YIELD_FACTORS.LEGUMES,
  FOUL_MUDAMMAS: YIELD_FACTORS.LEGUMES,
  TERMIS_LUPINI: YIELD_FACTORS.LEGUMES
};

export function resolveFoodYieldRule(foodCode = '') {
  const upper = String(foodCode || '').toUpperCase().trim();
  if (FOOD_YIELD_MAPPING[upper]) {
    return FOOD_YIELD_MAPPING[upper];
  }
  if (/OATS|شوفان/.test(upper)) return YIELD_FACTORS.OATS;
  if (/BEEF|VEAL|CAMEL|LIVER|KOFTA|لحم|كفتة|كبدة|بتلو|حاشي/.test(upper) && !/JERKY/.test(upper)) {
    return YIELD_FACTORS.RED_MEAT_BEEF;
  }
  if (/CHICKEN|TURKEY|دجاج|فراخ|شاورما/.test(upper) && !/SMOKED|مدخن/.test(upper)) {
    return YIELD_FACTORS.MEAT_POULTRY;
  }
  if (/FISH|SALMON|SHRIMP|TILAPIA|BOURI|HAMOUR|KANAAD|سمك|جمبري|سلمون|بلطي|بوري|هامور|كنعد|فيليه/.test(upper) && !/CANNED|TUNA|تونة/.test(upper)) {
    return YIELD_FACTORS.FISH_SEAFOOD;
  }
  if (/RICE|PASTA|SPAGHETTI|NOODLES|QUINOA|BULGUR|FREEKEH|أرز|ارز|مكرونة|كينوا|برغل|فريك/.test(upper) && !/RICE_CAKE|رايس كيك/.test(upper)) {
    return YIELD_FACTORS.RICE_PASTA;
  }
  if (/POTATO|بطاطس|بطاطا/.test(upper)) return YIELD_FACTORS.POTATOES;
  if (/LENTIL|CHICKPEA|FAVA|FOUL|LUPIN|TERMIS|عدس|حمص|فول|ترمس/.test(upper) && !/ROASTED|مقرمش/.test(upper)) {
    return YIELD_FACTORS.LEGUMES;
  }
  return YIELD_FACTORS.STANDARD;
}

/**
 * Converts portion between raw and cooked states.
 */
export function convertPortionCookingYield({
  food_code = 'CHICKEN_BREAST',
  amount_g = 150,
  from_state = 'COOKED', // 'COOKED' | 'RAW'
  to_state = 'RAW'
}) {
  const mapping = resolveFoodYieldRule(food_code);
  const factor = mapping.raw_to_cooked;
  const safeAmount = Math.max(0, Number(amount_g) || 0);

  let convertedAmountG = safeAmount;

  if (from_state === 'COOKED' && to_state === 'RAW') {
    convertedAmountG = Math.round(safeAmount / factor);
  } else if (from_state === 'RAW' && to_state === 'COOKED') {
    convertedAmountG = Math.round(safeAmount * factor);
  }

  return {
    food_code,
    original_amount_g: safeAmount,
    from_state,
    to_state,
    base_state: mapping.base_state || 'COOKED',
    converted_amount_g: convertedAmountG,
    yield_factor: factor,
    label_ar: mapping.label_ar,
    display_summary_ar: `وزن ${safeAmount}g (${from_state === 'COOKED' ? 'مطبوخ' : 'نيئ'}) يعادل ${convertedAmountG}g (${to_state === 'RAW' ? 'نيئ قبل الطهي' : 'مطبوخ جاهز للأكل'}).`
  };
}

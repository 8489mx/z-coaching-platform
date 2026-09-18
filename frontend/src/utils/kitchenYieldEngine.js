/**
 * Kitchen Yield Engine
 *
 * Raw vs. Cooked Yield Matrix:
 *    - Meats/Poultry: 0.75 yield (water loss during grilling/baking).
 *    - Fish/Seafood: 0.80 yield.
 *    - Rice/Pasta: 2.50 expansion yield (water absorption).
 *    - Potatoes: 0.95 yield.
 *    - Oats: 2.80 expansion yield.
 *
 * Grocery/shopping list generation was removed (Zero Grocery Lists invariant).
 */

export const YIELD_FACTORS = {
  MEAT_POULTRY: { raw_to_cooked: 0.75, label_ar: 'لحوم ودواجن (انكماش 25% بالطهي)' },
  FISH_SEAFOOD: { raw_to_cooked: 0.80, label_ar: 'أسماك ومأكولات بحرية (انكماش 20% بالطهي)' },
  RICE_PASTA: { raw_to_cooked: 2.50, label_ar: 'أرز ومكرونة (تمدد 2.5 ضعف بالامتصاص)' },
  OATS: { raw_to_cooked: 2.80, label_ar: 'شوفان مطبوخ بالماء' },
  POTATOES: { raw_to_cooked: 0.95, label_ar: 'بطاطس وبطاطا مشوية/مسلوقة' },
  STANDARD: { raw_to_cooked: 1.00, label_ar: 'ثابت بدون تغيير وزني' }
};

export const FOOD_YIELD_MAPPING = {
  CHICKEN_BREAST: YIELD_FACTORS.MEAT_POULTRY,
  LEAN_VEAL_BEEF: YIELD_FACTORS.MEAT_POULTRY,
  WHITE_FISH_FILLET: YIELD_FACTORS.FISH_SEAFOOD,
  SHRIMP_GRILLED: YIELD_FACTORS.FISH_SEAFOOD,
  BASMATI_RICE_COOKED: YIELD_FACTORS.RICE_PASTA,
  PASTA_COOKED: YIELD_FACTORS.RICE_PASTA,
  OATS_RAW: YIELD_FACTORS.OATS,
  BOILED_POTATOES: YIELD_FACTORS.POTATOES,
  SWEET_POTATO_BAKED: YIELD_FACTORS.POTATOES
};

/**
 * Converts portion between raw and cooked states.
 */
export function convertPortionCookingYield({
  food_code = 'CHICKEN_BREAST',
  amount_g = 150,
  from_state = 'COOKED', // 'COOKED' | 'RAW'
  to_state = 'RAW'
}) {
  const mapping = FOOD_YIELD_MAPPING[food_code] || YIELD_FACTORS.STANDARD;
  const factor = mapping.raw_to_cooked;

  let convertedAmountG = amount_g;

  if (from_state === 'COOKED' && to_state === 'RAW') {
    // Cooked to Raw
    convertedAmountG = Math.round(amount_g / factor);
  } else if (from_state === 'RAW' && to_state === 'COOKED') {
    // Raw to Cooked
    convertedAmountG = Math.round(amount_g * factor);
  }

  return {
    food_code,
    original_amount_g: amount_g,
    from_state,
    to_state,
    converted_amount_g: convertedAmountG,
    yield_factor: factor,
    label_ar: mapping.label_ar,
    display_summary_ar: `وزن ${amount_g}g (${from_state === 'COOKED' ? 'مطبوخ' : 'نيئ'}) يعادل ${convertedAmountG}g (${to_state === 'RAW' ? 'نيئ قبل الطهي' : 'مطبوخ جاهز للأكل'}).`
  };
}

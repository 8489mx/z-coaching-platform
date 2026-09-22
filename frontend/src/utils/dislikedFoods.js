/**
 * The intake form's "foods I don't like" labels (FullIntakeForm.jsx) -> the web food list's codes
 * (FOOD_DATABASE in foodSwapEngine.js, every key that names that food). The client's swap window
 * never offers these. The meal generator has its own codes: src/intake-decision-engine/adapters/disliked-foods.js.
 */
export const DISLIKED_FOOD_LABEL_WEB_CODES = Object.freeze({
  // Proteins
  "جبن قريش": ["COTTAGE_CHEESE_NATURAL", "COTTAGE_CHEESE"],
  "تونة": ["CANNED_TUNA_IN_WATER", "CANNED_TUNA"],
  "كبدة بقري": ["GRILLED_BEEF_LIVER"],
  "بيض مسلوق": ["WHOLE_EGG", "EGGS_OMELETTE"],
  "سمك سلمون": ["SALMON_ATLANTIC_COOKED", "SALMON_BAKED", "SALMON"],
  "صدور دجاج": ["CHICKEN_BREAST"],
  "لحم بقري مفروم": ["LEAN_GROUND_BEEF_95_5", "GROUND_BEEF_90_10", "LEAN_BEEF"],
  "أوراك دجاج": ["SKINLESS_CHICKEN_THIGHS"],
  "سمك بلطي": ["TILAPIA_BOLTI_GRILLED", "TILAPIA_FISH"],
  "جمبري": ["SHRIMP_GRILLED"],
  // Starches and legumes
  "شوفان": ["ROLLED_OATS_RAW", "ROLLED_OATS"],
  "أرز أبيض": ["BASMATI_RICE_COOKED", "BASMATI_RICE", "EGYPTIAN_RICE_COOKED", "EGYPTIAN_RICE", "KABSA_SPICED_RICE"],
  "بطاطا حلوة": ["SWEET_POTATO_BAKED", "SWEET_POTATO"],
  "بطاطس مسلوقة": ["BOILED_POTATOES", "ROASTED_POTATOES", "AIRFRYER_POTATO_WEDGES"],
  "مكرونة": ["WHOLE_WHEAT_PASTA_COOKED", "COOKED_WHITE_PASTA"],
  "عدس": ["COOKED_LENTILS"],
  "حمص": ["COOKED_CHICKPEAS", "HALABESSA_CHICKPEAS", "CRUNCHY_ROASTED_CHICKPEAS", "HALABESSA", "ROASTED_CHICKPEAS"],
  "فول مدمس": ["FAVA_BEANS"],
  "فاصوليا بيضاء": ["COOKED_WHITE_BEANS", "MIXED_LEGUMES_STEW"],
  "ترمس": ["TERMIS_LUPINI", "TERMIS", "LUPINI"],
  // Vegetables
  "بروكلي": ["STEAMED_BROCCOLI"],
  "سبانخ": ["FRESH_SPINACH"],
  "باذنجان": ["GRILLED_EGGPLANT"],
  "كوسة": ["SAUTEED_ZUCCHINI"],
  "فاصوليا خضراء": ["GREEN_BEANS"],
  "قرنبيط": ["STEAMED_CAULIFLOWER"],
  "مشروم": ["FRESH_MUSHROOMS", "MUSHROOMS"],
  "شمندر / بنجر": ["BOILED_BEETROOT", "BEETROOT"],
  // Fats
  "زبدة فول سوداني": ["NATURAL_PEANUT_BUTTER"],
  "أفوكادو": ["FRESH_AVOCADO"],
  "زيت زيتون": ["EXTRA_VIRGIN_OLIVE_OIL", "OLIVE_OIL"],
  "مكسرات ولوز": ["RAW_ALMONDS", "RAW_WALNUTS", "RAW_CASHEWS"],
  "طحينة سمسم": ["RAW_TAHINI_SESAME"],
});

/** Web food codes for the client's disliked-food labels (unknown labels are ignored). */
export function webCodesForDislikes(labels = []) {
  const codes = new Set();
  for (const label of Array.isArray(labels) ? labels : []) {
    (DISLIKED_FOOD_LABEL_WEB_CODES[String(label).trim()] || []).forEach((code) => codes.add(code));
  }
  return [...codes];
}

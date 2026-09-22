/**
 * The intake form's "foods I don't like" list sends Arabic labels (frontend/src/pages/FullIntakeForm.jsx).
 * The canonical intake only accepts uppercase IDs, so a single label failed plan generation. Each label
 * maps here to the meal generator's food codes (FOOD_SWAP_DATABASE in build-culinary-meals.js) and, for
 * foods only the swap list has, the swap registry's code.
 *
 * An empty list means the plan never holds that food, so there is nothing to remove. Vegetables and
 * olive oil stay: the plan's vegetables are mixed plates (salad, sauteed vegetables) and the oil is
 * the cooking oil every meal's fat budget counts on.
 */
export const DISLIKED_FOOD_LABEL_CODES = Object.freeze({
  // Proteins
  "جبن قريش": ["COTTAGE_CHEESE"],
  "تونة": ["CANNED_TUNA"],
  "كبدة بقري": [],
  "بيض مسلوق": ["EGGS_OMELETTE"],
  "سمك سلمون": ["SALMON_FISH"],
  "صدور دجاج": ["CHICKEN_BREAST"],
  "لحم بقري مفروم": ["LEAN_BEEF"],
  "أوراك دجاج": [],
  "سمك بلطي": ["TILAPIA_FISH"],
  "جمبري": [],
  // Starches and legumes
  "شوفان": ["ROLLED_OATS"],
  "أرز أبيض": ["BASMATI_RICE", "EGYPTIAN_RICE", "KABSA_SPICED_RICE"],
  "بطاطا حلوة": ["SWEET_POTATO"],
  "بطاطس مسلوقة": ["ROASTED_POTATOES"],
  "مكرونة": ["WHOLE_WHEAT_PASTA"],
  "عدس": ["MIXED_LEGUMES_STEW"],
  "حمص": ["MIXED_LEGUMES_STEW"],
  "فول مدمس": ["FOUL_MUDAMMAS"],
  "فاصوليا بيضاء": ["MIXED_LEGUMES_STEW"],
  "ترمس": ["LUPINI_BEANS"],
  // Vegetables: mixed plates, kept (see above)
  "بروكلي": [],
  "سبانخ": [],
  "باذنجان": [],
  "كوسة": [],
  "فاصوليا خضراء": [],
  "قرنبيط": [],
  "مشروم": [],
  "شمندر / بنجر": [],
  // Fats
  "زبدة فول سوداني": ["PEANUT_BUTTER"],
  "أفوكادو": ["FRESH_AVOCADO"],
  "زيت زيتون": [],
  "مكسرات ولوز": ["RAW_ALMONDS"],
  "طحينة سمسم": ["RAW_TAHINI"],
});

const CANONICAL_ID = /^[A-Za-z0-9_:-]+$/;

/**
 * Food codes for a disliked-foods list: Arabic form labels become their codes, codes already in
 * canonical form pass through, anything else (free text with no food behind it) is dropped.
 */
export function dislikedFoodCodes(list = []) {
  const codes = new Set();
  for (const entry of Array.isArray(list) ? list : []) {
    const raw = typeof entry === "string" ? entry : (entry?.foodCode || entry?.name || "");
    const label = String(raw).trim();
    if (!label) continue;
    if (Object.hasOwn(DISLIKED_FOOD_LABEL_CODES, label)) {
      DISLIKED_FOOD_LABEL_CODES[label].forEach((code) => codes.add(code));
    } else if (CANONICAL_ID.test(label)) {
      codes.add(label.toUpperCase());
    }
  }
  return [...codes];
}

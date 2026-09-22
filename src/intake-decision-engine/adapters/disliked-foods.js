/**
 * The intake form's "foods I don't like" list sends Arabic labels (frontend/src/pages/FullIntakeForm.jsx).
 * The canonical intake only accepts uppercase IDs, so a single label failed plan generation. Each label
 * maps here to the meal generator's food codes (FOOD_SWAP_DATABASE in build-culinary-meals.js) and, for
 * foods only the swap list has, the swap registry's code.
 *
 * An empty list means nothing is removed: the plan never holds that food (liver, thighs, shrimp),
 * or it stays on the plate and only leaves the name (vegetables, olive oil - applyDislikedNames below).
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

/**
 * Vegetables and olive oil stay in the plan (mixed plates, the cooking oil), but their names follow
 * the client: a disliked vegetable leaves the plate's list of vegetables ("(without ...)" when it is
 * part of the dish name), and disliked olive oil becomes a plain vegetable oil (same 9 kcal per gram).
 */
export const DISLIKED_VEGETABLE_WORDS = Object.freeze({
  "بروكلي": ["بروكلي"],
  "سبانخ": ["سبانخ"],
  "باذنجان": ["باذنجان"],
  "كوسة": ["كوسة"],
  "فاصوليا خضراء": ["فاصوليا خضراء"],
  "قرنبيط": ["قرنبيط"],
  "مشروم": ["مشروم"],
  "شمندر / بنجر": ["شمندر", "بنجر"],
});
export const OLIVE_OIL_LABEL = "زيت زيتون";
const VEGETABLE_OIL_AR = "زيت نباتي (كانولا أو دوار الشمس)";

function withoutVegetables(name, words) {
  let out = String(name || "");
  const left = [];
  out = out.replace(/\(([^)]*)\)/g, (whole, inside) => {
    const parts = inside.split("،").map((p) => p.trim()).filter(Boolean);
    const kept = parts.filter((p) => !words.some((w) => p.includes(w)));
    if (kept.length === parts.length) return whole;
    return kept.length ? `(${kept.join("، ")})` : "(أي خضار بتحبه)";
  });
  for (const word of words) if (out.includes(word)) left.push(word);
  return left.length ? `${out} (من غير ${left.join(" و")})` : out;
}

/** Plan item names adjusted to the client's disliked vegetables and olive oil (macros unchanged). */
export function applyDislikedNames(meals = [], labels = []) {
  const list = Array.isArray(labels) ? labels.map((l) => String(l).trim()) : [];
  const words = list.flatMap((l) => DISLIKED_VEGETABLE_WORDS[l] || []);
  const noOliveOil = list.includes(OLIVE_OIL_LABEL);
  if (!Array.isArray(meals) || (!words.length && !noOliveOil)) return meals;
  return meals.map((meal) => ({
    ...meal,
    items: (meal.items || []).map((item) => {
      let name = item.name_ar;
      if (words.length && String(item.category).toUpperCase() === "VEGGIES") name = withoutVegetables(name, words);
      if (noOliveOil && typeof name === "string") {
        name = item.food_code === "OLIVE_OIL"
          ? name.replace(/زيت (ال)?زيتون( بكر ممتاز)?/g, VEGETABLE_OIL_AR)
          : name.replace(/زيت (ال)?زيتون( بكر ممتاز)?/g, "زيت نباتي");
      }
      return name === item.name_ar ? item : { ...item, name_ar: name };
    }),
  }));
}

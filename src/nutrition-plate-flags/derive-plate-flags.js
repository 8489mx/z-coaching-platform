/**
 * Allergy flags for the served plate (P0-A8).
 *
 * Pure module: given a culinary food code, it derives the allergen content
 * flags from the live food database's own boolean fields plus the code
 * patterns the clinical filter itself uses (isFoodClinicallySafe). Nothing
 * is invented: an unknown code yields no flags, and a field that is absent
 * (rather than explicitly false) yields no flag.
 *
 * The flags describe what the food CONTAINS, not what the client must avoid:
 * a lactose-free milk is still DAIRY (a milk-allergic client must avoid it),
 * and its low_lactose property is carried separately so a lactose-intolerant
 * client can tell it apart. The conservative server mapping (a dairy_lactose
 * declaration excludes all dairy) is unchanged here; separating milk allergy
 * from lactose intolerance needs the intake form to offer two choices, which
 * is an owner decision, not something this module guesses.
 */
import { FOOD_SWAP_DATABASE } from "../nutrition-meal-context-v2/build-culinary-meals.js";

/** Allergen codes carried on a served plate item. */
export const PLATE_ALLERGEN_CODES = Object.freeze([
  "GLUTEN",
  "DAIRY",
  "EGG",
  "FISH",
  "SOY",
  "NUTS",
  "SESAME",
  "LEGUME",
  "FAVA",
  "BERRY",
  "TROPICAL",
]);

/** Arabic display label per allergen code (simple Arabic, as existing code does). */
export const ALLERGY_FLAG_LABELS_AR = Object.freeze({
  GLUTEN: "جلوتين",
  DAIRY: "ألبان",
  EGG: "بيض",
  FISH: "سمك",
  SOY: "صويا",
  NUTS: "مكسرات",
  SESAME: "سمسم",
  LEGUME: "بقوليات",
  FAVA: "فول",
  BERRY: "توت",
  TROPICAL: "فواكه استوائية",
});

const EGG_CODES = new Set(["EGGS_OMELETTE", "SHAKSHOUKA_EGGS"]);

/**
 * Allergen content flags for one culinary food code, derived only from the
 * live database entry (boolean fields) and the code patterns the clinical
 * filter uses. Unknown codes and absent fields yield no flags.
 * @param {string} foodCode
 * @param {Object} [foodDb]
 * @returns {string[]}
 */
export function foodAllergyFlags(foodCode, foodDb = FOOD_SWAP_DATABASE) {
  const code = String(foodCode || "").toUpperCase();
  if (!code) return [];
  const food = foodDb?.[code];
  const flags = [];
  if (food) {
    if (food.is_gluten_free === false) flags.push("GLUTEN");
    if (food.is_dairy === true) flags.push("DAIRY");
    if (EGG_CODES.has(code)) flags.push("EGG");
    if (food.is_fish === true) flags.push("FISH");
    if (food.is_soy_free === false) flags.push("SOY");
    if (food.is_nut_free === false) flags.push("NUTS");
    if (food.is_sesame_free === false) flags.push("SESAME");
    if (food.is_legume === true) flags.push("LEGUME");
    if (food.is_fava === true) flags.push("FAVA");
  }
  // Same code patterns the clinical filter uses for berries and tropical fruit.
  if (/STRAWBERR|BLUEBERR|BERR/.test(code)) flags.push("BERRY");
  if (/MANGO|KIWI|PINEAPPLE|TROPICAL/.test(code)) flags.push("TROPICAL");
  return [...new Set(flags)];
}

/** Whether the database marks this food low-lactose (false when unmarked). */
export function foodIsLowLactose(foodCode, foodDb = FOOD_SWAP_DATABASE) {
  const food = foodDb?.[String(foodCode || "").toUpperCase()];
  return food?.is_low_lactose === true;
}

/**
 * Client exclusion flags (from buildAllergenContext) mapped to the allergen
 * codes they forbid. Deliberately allergy-only: vegan, gout and diabetes
 * flags are not allergies and never block a plate here.
 * @param {Object} allergenContext
 * @returns {Set<string>}
 */
export function excludedAllergenCodes(allergenContext = {}) {
  const out = new Set();
  if (allergenContext.isGlutenExcluded) out.add("GLUTEN");
  if (allergenContext.isDairyExcluded) out.add("DAIRY");
  if (allergenContext.isEggsExcluded) out.add("EGG");
  if (allergenContext.isFishExcluded) out.add("FISH");
  if (allergenContext.isSoyExcluded) out.add("SOY");
  if (allergenContext.isNutsExcluded) out.add("NUTS");
  if (allergenContext.isSesameExcluded) out.add("SESAME");
  if (allergenContext.isLegumesExcluded) out.add("LEGUME");
  if (allergenContext.isFavism) {
    out.add("FAVA");
    out.add("LEGUME");
  }
  if (allergenContext.isBerriesExcluded) out.add("BERRY");
  if (allergenContext.isTropicalExcluded) out.add("TROPICAL");
  return out;
}

/**
 * Every item on the served meals annotated with its allergen content flags
 * (and low_lactose), plus a meal-level union of the item flags. Pure: input
 * meals are never mutated. Items without a known code keep empty flags.
 * @param {Array} meals
 * @returns {Array}
 */
export function annotateServedMeals(meals = []) {
  if (!Array.isArray(meals)) return meals;
  return meals.map((meal) => {
    if (!meal || typeof meal !== "object") return meal;
    // A bare item (no items array) is annotated as itself.
    if (!Array.isArray(meal.items)) {
      const code = meal.food_code || meal.code;
      return { ...meal, allergy_flags: foodAllergyFlags(code), low_lactose: foodIsLowLactose(code) };
    }
    const items = meal.items.map((item) => {
      if (!item || typeof item !== "object") return item;
      const code = item.food_code || item.code;
      return {
        ...item,
        allergy_flags: foodAllergyFlags(code),
        low_lactose: foodIsLowLactose(code),
      };
    });
    const union = [];
    for (const item of items) {
      for (const flag of item?.allergy_flags || []) {
        if (!union.includes(flag)) union.push(flag);
      }
    }
    return { ...meal, items, allergy_flags: union };
  });
}

/**
 * Allergy-boundary violations on served meals: an item whose content flags
 * intersect the client's exclusions. Empty when the plate is clean or when
 * no restrictions are known (no intake on file) — the same fail-open the
 * swap paths use when no restrictions are known.
 * @param {Array} meals
 * @param {Object} allergenContext
 * @returns {Array<{meal_index:number, meal_name:string|null, item_code:string, item_name:string|null, matched_flags:string[], item_flags:string[]}>}
 */
export function plateAllergyViolations(meals = [], allergenContext = {}) {
  const excluded = excludedAllergenCodes(allergenContext);
  if (excluded.size === 0 || !Array.isArray(meals)) return [];
  const violations = [];
  meals.forEach((meal, mealIndex) => {
    // A meal carries items; a bare item (no items array) is its own entry,
    // so flat item lists are checked the same way as structured meals.
    const items = Array.isArray(meal?.items) ? meal.items : [meal];
    for (const item of items) {
      if (!item || typeof item !== "object") continue;
      const code = item.food_code || item.code;
      const flags = foodAllergyFlags(code);
      const matched = flags.filter((flag) => excluded.has(flag));
      if (matched.length > 0) {
        violations.push({
          meal_index: mealIndex,
          meal_name: meal?.recipe_title_ar || meal?.meal_name_ar || meal?.title || meal?.name || null,
          item_code: code || null,
          item_name: item.name_ar || item.name || item.name_en || null,
          matched_flags: matched,
          item_flags: flags,
        });
      }
    }
  });
  return violations;
}

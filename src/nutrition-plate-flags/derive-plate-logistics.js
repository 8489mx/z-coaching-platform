/**
 * Logistics info for the served plate (culinary logistics-data package).
 *
 * Pure module, zero imports, runnable under plain node. It mirrors the
 * P0-A8 allergy-flags pattern: the serve path annotates each served item
 * with its logistics, and display layers show the line only when at least
 * one value is actually known.
 *
 * The data model: CULINARY_LOGISTICS maps a culinary food code to its
 * logistics. It starts EMPTY on purpose — every value must come from a
 * real source (the owner-filled values table), never from guesswork,
 * pipeline-code mapping, or dish-name inference. An unknown code yields
 * all-null logistics, and display layers render nothing for it. Filling
 * the table means adding entries here, one code at a time.
 *
 * Field meanings (filled values only, never defaults):
 * - requires_storage: true = needs refrigeration, false = keeps at room
 *   temperature, null = not yet decided.
 * - requires_reheating: true = reheat before eating, false = eaten as-is,
 *   null = not yet decided.
 * - food_state: free Arabic text describing the state as served
 *   (for example "مطبوخ ساخن"), null = not yet decided.
 * - prep_notes: free Arabic prep instructions, null = none given.
 */

/**
 * Logistics entries by culinary food code. EMPTY until real values are
 * supplied through the owner values table. Do not fill from guesswork.
 */
export const CULINARY_LOGISTICS = Object.freeze({});

/** Arabic display label per logistics field (simple Arabic, as existing code does). */
export const LOGISTICS_LABELS_AR = Object.freeze({
  requires_storage: "تخزين",
  requires_reheating: "تسخين",
  food_state: "حالة الصنف",
  prep_notes: "ملاحظات تحضير",
});

/**
 * Logistics for one culinary food code. Unknown codes and absent fields
 * yield nulls, never guessed values.
 * @param {string} foodCode
 * @param {Object} [logisticsDb]
 * @returns {{requires_storage: boolean|null, requires_reheating: boolean|null, food_state: string|null, prep_notes: string|null}}
 */
export function foodLogistics(foodCode, logisticsDb = CULINARY_LOGISTICS) {
  const code = String(foodCode || "").toUpperCase();
  const entry = code ? logisticsDb?.[code] : null;
  return {
    requires_storage: entry?.requires_storage ?? null,
    requires_reheating: entry?.requires_reheating ?? null,
    food_state: entry?.food_state ?? null,
    prep_notes: entry?.prep_notes ?? null,
  };
}

/** True when at least one logistics value is actually known. */
export function hasLogisticsInfo(logistics) {
  if (!logistics || typeof logistics !== "object") return false;
  if (logistics.requires_storage === true || logistics.requires_storage === false) return true;
  if (logistics.requires_reheating === true || logistics.requires_reheating === false) return true;
  if (typeof logistics.food_state === "string" && logistics.food_state.trim() !== "") return true;
  if (typeof logistics.prep_notes === "string" && logistics.prep_notes.trim() !== "") return true;
  return false;
}

/**
 * Display parts for a logistics object, in Arabic, only for known values.
 * Empty when nothing is known (display layers render nothing then).
 * @param {Object} logistics
 * @returns {string[]}
 */
export function formatLogisticsAr(logistics) {
  if (!hasLogisticsInfo(logistics)) return [];
  const parts = [];
  if (logistics.requires_storage === true) parts.push("يحفظ في الثلاجة");
  if (logistics.requires_storage === false) parts.push("لا يحتاج تبريد");
  if (logistics.requires_reheating === true) parts.push("يسخن قبل الأكل");
  if (logistics.requires_reheating === false) parts.push("يؤكل كما هو");
  if (typeof logistics.food_state === "string" && logistics.food_state.trim() !== "") {
    parts.push(logistics.food_state.trim());
  }
  if (typeof logistics.prep_notes === "string" && logistics.prep_notes.trim() !== "") {
    parts.push(logistics.prep_notes.trim());
  }
  return parts;
}

/**
 * Every item on the served meals annotated with its logistics. Pure: input
 * meals are never mutated. Items without known logistics keep an all-null
 * logistics object, so display layers can tell "unknown" from "known".
 * @param {Array} meals
 * @returns {Array}
 */
export function annotateServedMealsLogistics(meals = []) {
  if (!Array.isArray(meals)) return meals;
  return meals.map((meal) => {
    if (!meal || typeof meal !== "object") return meal;
    // A bare item (no items array) is annotated as itself.
    if (!Array.isArray(meal.items)) {
      const code = meal.food_code || meal.code;
      return { ...meal, logistics: foodLogistics(code) };
    }
    const items = meal.items.map((item) => {
      if (!item || typeof item !== "object") return item;
      const code = item.food_code || item.code;
      return { ...item, logistics: foodLogistics(code) };
    });
    return { ...meal, items };
  });
}

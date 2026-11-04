/**
 * Culinary preflight: the check the meals the client actually sees must pass.
 *
 * The pipeline preflight (evaluateNutritionPlanPreflight) audits only the food
 * selection + portion solver + swap v1 + catalog inputs; it cannot take a
 * culinary meal at all (wrong input shape). The served plate therefore reached
 * the client unchecked: a meal at +35% kcal with 0 g protein, a negative
 * portion, or a clinically unsafe item left no trace in any status.
 *
 * This module is pure (no imports) so it runs under plain node and on both
 * the build path and the serve path. The clinical-safety function is injected
 * by the caller: the build path passes isFoodClinicallySafe bound to the
 * client's allergen context (full check, including the forbidden-food scan
 * and the swap-list scan); callers without a client context (serve-path
 * re-check of stored meals, post-swap meal check) omit it and get the
 * intrinsic checks only (targets, portions, unsafe flags, protein presence).
 *
 * Tolerances (per meal, against the meal's own target_macros):
 * - kcal fails outside +/-20% of target. The wrapper's day-total note uses
 *   >10%; the per-meal band is wider because a single sitting legitimately
 *   varies more than the day.
 * - protein fails below target - 20% (shortfall only: a protein overshoot is
 *   not a safety failure).
 * - fixed_portions meals (bariatric plates: the plate size IS the
 *   prescription) skip the kcal/protein closure checks but keep every safety
 *   check: a fixed plate with no protein food, a negative portion, or an
 *   unsafe item still fails.
 * - fat is NOT a blocking check: fat rebalancing is scheduled as separate
 *   work, and diversification legitimately moves meal fat. A gross fat
 *   overshoot (outside +/-30%) is still recorded as a note-level issue so it
 *   is visible to the coach and never silent — it just does not block the
 *   plate on its own.
 * A meal with no PROTEIN-category item always fails (missing_protein): the
 * flag exists so a protein-less plate can never pass silently.
 */

export const CULINARY_PREFLIGHT_VERSION = "culinary-preflight-v1";
export const CULINARY_KCAL_TOLERANCE = 0.2;
export const CULINARY_PROTEIN_SHORTFALL_TOLERANCE = 0.2;
export const CULINARY_FAT_NOTE_TOLERANCE = 0.3;

export const CulinaryPreflightIssueCode = Object.freeze({
  MEAL_KCAL_OUTSIDE_TOLERANCE: "CULINARY_MEAL_KCAL_OUTSIDE_TOLERANCE",
  MEAL_PROTEIN_SHORTFALL: "CULINARY_MEAL_PROTEIN_SHORTFALL",
  MEAL_MISSING_PROTEIN: "CULINARY_MEAL_MISSING_PROTEIN",
  MEAL_NEGATIVE_PORTION: "CULINARY_MEAL_NEGATIVE_PORTION",
  MEAL_CLINICALLY_UNSAFE_ITEM: "CULINARY_MEAL_CLINICALLY_UNSAFE_ITEM",
  MEAL_FORBIDDEN_FOOD: "CULINARY_MEAL_FORBIDDEN_FOOD",
  MEAL_UNSAFE_SWAP: "CULINARY_MEAL_UNSAFE_SWAP",
  MEAL_FAT_OUTSIDE_TOLERANCE: "CULINARY_MEAL_FAT_OUTSIDE_TOLERANCE",
});

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// Engine shape (food_code/portion_g/protein_g/calories_kcal) and adapter shape
// (code/g/p/kcal) both occur in stored programs; accept either.
function normItem(item = {}) {
  return {
    code: String(item.food_code || item.code || ""),
    category: String(item.category || "").toUpperCase(),
    portion_g: num(item.portion_g ?? item.amount ?? item.g),
    protein_g: num(item.protein_g ?? item.p),
    carb_g: num(item.carb_g ?? item.c),
    fat_g: num(item.fat_g ?? item.f),
    calories_kcal: num(item.calories_kcal ?? item.kcal ?? item.cal),
    clinically_unsafe: item.clinically_unsafe === true,
    swaps: Array.isArray(item.swaps) ? item.swaps : [],
  };
}

function swapCode(swap) {
  if (typeof swap === "string") return swap;
  return String(swap?.food_code || swap?.code || "");
}

/**
 * Check one served meal. Returns { meal_number, issues, missing_protein }.
 * issues carry code + an Arabic message with the numbers, so a coach reading
 * the flag knows exactly which check failed.
 */
export function evaluateCulinaryMeal(meal = {}, { isSafe = null } = {}) {
  const mealNumber = meal.meal_number ?? meal.mealNumber ?? null;
  const target = meal.target_macros || meal.target || {};
  const targetP = num(target.protein_g);
  const targetKcal = num(target.calories_kcal);
  const items = (Array.isArray(meal.items) ? meal.items : []).map(normItem);
  const issues = [];
  const issue = (code, message_ar, details = {}, severity = "block") => {
    issues.push({ code, message_ar, meal_number: mealNumber, severity, ...details });
  };
  const note = (code, message_ar, details = {}) => issue(code, message_ar, details, "note");

  const totalP = items.reduce((s, i) => s + i.protein_g, 0);
  const totalKcal = items.reduce((s, i) => s + i.calories_kcal, 0);
  const totalF = items.reduce((s, i) => s + i.fat_g, 0);
  const hasProteinItem = items.some((i) => i.category === "PROTEIN");

  if (!hasProteinItem) {
    issue(
      CulinaryPreflightIssueCode.MEAL_MISSING_PROTEIN,
      `الوجبة ${mealNumber ?? ""}: مفيش صنف بروتين في الطبق خالص.`,
      { actual_protein_g: Math.round(totalP * 10) / 10, target_protein_g: targetP },
    );
  }

  const negatives = items.filter(
    (i) => i.portion_g < 0 || i.protein_g < 0 || i.carb_g < 0 || i.fat_g < 0 || i.calories_kcal < 0,
  );
  if (negatives.length > 0) {
    issue(
      CulinaryPreflightIssueCode.MEAL_NEGATIVE_PORTION,
      `الوجبة ${mealNumber ?? ""}: فيه كمية بالسالب (${negatives.map((i) => `${i.code} ${i.portion_g} جم`).join("، ")})، وده مستحيل يتقدم.`,
      { codes: negatives.map((i) => i.code) },
    );
  }

  const unsafeItems = items.filter((i) => i.clinically_unsafe);
  if (unsafeItems.length > 0) {
    issue(
      CulinaryPreflightIssueCode.MEAL_CLINICALLY_UNSAFE_ITEM,
      `الوجبة ${mealNumber ?? ""}: فيه صنف متعارض مع الملف الطبي (${unsafeItems.map((i) => i.code).join("، ")}) وملوش بديل آمن.`,
      { codes: unsafeItems.map((i) => i.code) },
    );
  }

  // Closure checks are skipped for fixed plates: their size is the
  // prescription, and the day-total gap is already surfaced as a coach note.
  if (meal.fixed_portions !== true) {
    if (targetKcal > 0 && Math.abs(totalKcal - targetKcal) / targetKcal > CULINARY_KCAL_TOLERANCE) {
      issue(
        CulinaryPreflightIssueCode.MEAL_KCAL_OUTSIDE_TOLERANCE,
        `الوجبة ${mealNumber ?? ""}: السعرات ${Math.round(totalKcal)} مقابل هدف ${Math.round(targetKcal)} (فرق أكتر من 20%).`,
        { actual_kcal: Math.round(totalKcal), target_kcal: Math.round(targetKcal),
          relative_difference: Math.round(((totalKcal - targetKcal) / targetKcal) * 1000) / 1000 },
      );
    }
    if (targetP > 0 && totalP < targetP * (1 - CULINARY_PROTEIN_SHORTFALL_TOLERANCE)) {
      issue(
        CulinaryPreflightIssueCode.MEAL_PROTEIN_SHORTFALL,
        `الوجبة ${mealNumber ?? ""}: البروتين ${Math.round(totalP * 10) / 10} جم مقابل هدف ${targetP} جم (ناقص أكتر من 20%).`,
        { actual_protein_g: Math.round(totalP * 10) / 10, target_protein_g: targetP,
          relative_difference: Math.round(((totalP - targetP) / targetP) * 1000) / 1000 },
      );
    }
  }

  // Gross fat overshoot is a coach-visible note, never a silent pass and
  // never a block on its own. P1-B6 gave trim a fat direction, so most fat
  // drift is now corrected before this check; what reaches here survived
  // every correction pass and stays visible rather than blocked.
  if (meal.fixed_portions !== true) {
    const targetF = num(target.fat_g);
    if (targetF > 0 && Math.abs(totalF - targetF) / targetF > CULINARY_FAT_NOTE_TOLERANCE) {
      note(
        CulinaryPreflightIssueCode.MEAL_FAT_OUTSIDE_TOLERANCE,
        `الوجبة ${mealNumber ?? ""}: الدهون ${Math.round(totalF * 10) / 10} جم مقابل هدف ${targetF} جم (فرق أكتر من 30% — ملحوظة للمدرب، مش منع).`,
        { actual_fat_g: Math.round(totalF * 10) / 10, target_fat_g: targetF,
          relative_difference: Math.round(((totalF - targetF) / targetF) * 1000) / 1000 },
      );
    }
  }

  if (typeof isSafe === "function") {
    const forbidden = items.filter((i) => i.code && !isSafe(i.code));
    if (forbidden.length > 0) {
      issue(
        CulinaryPreflightIssueCode.MEAL_FORBIDDEN_FOOD,
        `الوجبة ${mealNumber ?? ""}: فيه صنف ممنوع على العميل (${forbidden.map((i) => i.code).join("، ")}).`,
        { codes: forbidden.map((i) => i.code) },
      );
    }
    const unsafeSwaps = [];
    for (const item of items) {
      for (const swap of item.swaps) {
        const code = swapCode(swap);
        // The original food stays first in its own swap list (diversification);
        // it is judged as an item above, not as a swap.
        if (code && code !== item.code && !isSafe(code)) unsafeSwaps.push(code);
      }
    }
    if (unsafeSwaps.length > 0) {
      issue(
        CulinaryPreflightIssueCode.MEAL_UNSAFE_SWAP,
        `الوجبة ${mealNumber ?? ""}: فيه بديل مقترح ممنوع على العميل (${[...new Set(unsafeSwaps)].join("، ")}).`,
        { codes: [...new Set(unsafeSwaps)] },
      );
    }
  }

  return { meal_number: mealNumber, issues, missing_protein: !hasProteinItem };
}

/**
 * Check a full day of served meals. Returns { version, status, issues, meals }.
 * status is READY when every meal passes, REVIEW_REQUIRED otherwise. A meal
 * list that is empty or not an array is REVIEW_REQUIRED: nothing to serve is
 * not a passing plate.
 */
export function evaluateCulinaryPreflight(meals = [], { isSafe = null } = {}) {
  if (!Array.isArray(meals) || meals.length === 0) {
    return {
      version: CULINARY_PREFLIGHT_VERSION,
      status: "REVIEW_REQUIRED",
      issues: [{ code: "CULINARY_NO_MEALS", message_ar: "مفيش وجبات مقدمة تتفحص.", meal_number: null }],
      meals: [],
    };
  }
  const perMeal = meals.map((meal) => evaluateCulinaryMeal(meal, { isSafe }));
  const issues = perMeal.flatMap((m) => m.issues);
  // Notes (fat overshoot) are coach-visible but never block the plate alone.
  const blocking = issues.filter((i) => i.severity !== "note");
  return {
    version: CULINARY_PREFLIGHT_VERSION,
    status: blocking.length === 0 ? "READY" : "REVIEW_REQUIRED",
    issues,
    meals: perMeal,
  };
}

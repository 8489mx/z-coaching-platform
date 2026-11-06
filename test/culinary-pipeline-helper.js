// H4 test helper (not a test file): the nutrition computation below the
// master engine's return object.
//
// A withheld master program (MEDICAL_REVIEW_REQUIRED / BLOCKED) ships no
// servable plan — no targets, no culinary meals, no training weeks — so
// tests that verify the nutrition computation itself (carb ceilings,
// fat-share balance, plate templates, swap safety, meal totals) read it
// at the layer where it is computed instead of off the master object:
//   - targetsFor: calculateUniversalNutritionTargets (the same call the
//     master engine makes for its headline targets).
//   - servedMealsFor: the same targets, then the culinary pipeline the
//     master engine runs (src/master-engine-v2/build-master-engine-v2.js,
//     the "Universal Nutrition Targets & Culinary Meal Generator" section):
//     buildCulinaryRecipeMeals -> diabetic carb choice -> split oversized
//     portions -> diversify fat sources -> trim -> clinical safety -> trim
//     -> refreshActualMacros -> protein fallback -> culinary preflight,
//     plus the served-vs-target plate-capacity note.
// The values are the same numbers the master engine used to ship: the
// layer-shift probe (~/workspace/h4-layer-shift-probe.mjs) compared all
// of them against the pre-H4 master output and found them identical.
import { adaptIntakePayloadToCanonicalEngine } from "../src/intake-decision-engine/adapters/intake-adapter.js";
import { calculateUniversalNutritionTargets } from "../src/master-engine-v2/index.js";
import {
  buildCulinaryRecipeMeals,
  enforceDiabeticCarbChoice,
  splitOversizedPortions,
  carbPortionLimit,
  isDiabeticIntake,
  diversifyFatSources,
  buildAllergenContext,
  trimMealsToTarget,
  refreshActualMacros,
  applyCulinaryProteinFallback,
  enforceClinicalSafety,
  isFoodClinicallySafe,
} from "../src/nutrition-meal-context-v2/index.js";
import { evaluateCulinaryPreflight } from "../src/nutrition-plan-preflight/evaluate-culinary-preflight.js";

export function targetsFor(rawIntake, evaluationContext) {
  const canonical = adaptIntakePayloadToCanonicalEngine(structuredClone(rawIntake));
  const targets = calculateUniversalNutritionTargets(canonical, evaluationContext, structuredClone(rawIntake), {});
  return { canonical, targets };
}

export function servedMealsFor(rawIntake, evaluationContext) {
  const { canonical, targets } = targetsFor(rawIntake, evaluationContext);
  const raw = structuredClone(rawIntake);
  const isDiabetic = isDiabeticIntake(canonical, raw);
  const allergenContext = buildAllergenContext(canonical, raw);
  const built = refreshActualMacros(trimMealsToTarget(enforceClinicalSafety(trimMealsToTarget(diversifyFatSources(
    splitOversizedPortions(enforceDiabeticCarbChoice(
      buildCulinaryRecipeMeals(targets, canonical, raw),
      isDiabetic,
    ), carbPortionLimit({ diabetic: isDiabetic })),
    allergenContext,
    {
      kidneyProteinCapped: targets.clinical_guardrails?.kidney_protein_capped === true,
    },
  )), allergenContext)));
  const fallback = refreshActualMacros(applyCulinaryProteinFallback(built, allergenContext));
  const preflight = evaluateCulinaryPreflight(fallback, {
    isSafe: (code) => isFoodClinicallySafe(code, allergenContext),
  });
  const meals = fallback.map((meal) => {
    const result = preflight.meals.find((m) => m.meal_number === meal.meal_number) || {};
    return {
      ...meal,
      ...(result.missing_protein === true ? { missing_protein: true } : {}),
      ...(result.issues?.length ? { culinary_issues: result.issues } : {}),
    };
  });
  const servedCalories = meals.reduce(
    (total, meal) => total + (meal.items || []).reduce((sum, item) => sum + (Number(item.calories_kcal) || 0), 0),
    0,
  );
  const servedGap = targets.target_calories > 0
    ? (servedCalories - targets.target_calories) / targets.target_calories
    : 0;
  if (Math.abs(servedGap) > 0.1) {
    targets.plate_capacity_note_ar = servedGap < 0
      ? `الأكل اللي في الأطباق ${Math.round(servedCalories)} سعرة مقابل هدف ${targets.target_calories} سعرة: الأصناف المتاحة للعميل (حدود سريرية، حساسية، أو سعة معدة بعد عملية) مش قادرة تشيل اليوم كله. راجع عدد الوجبات أو الهدف مع العميل.`
      : `الأكل اللي في الأطباق ${Math.round(servedCalories)} سعرة مقابل هدف ${targets.target_calories} سعرة: الأطباق زيادة عن الهدف، راجع الكميات.`;
  }
  return { canonical, targets, meals, servedCalories };
}

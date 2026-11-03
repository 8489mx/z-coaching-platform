/**
 * P0-A12 stage 7: apply a recorded triage safety correction to an
 * adaptation result on coach approval.
 *
 * The gap (stage-6 S10): a low-adherence rapid-loss client is triaged
 * YELLOW with a recorded +150 kcal safety correction, but coach approval
 * recomputes the adaptation from the POOR_ADHERENCE branch, which returns
 * MAINTAIN (delta 0) — so the correction evaporates and the coach never
 * sees it. This pure helper closes that gap at the approval step only:
 * it never changes what the adaptation engine itself computes, and it
 * never applies anything automatically (auto-apply blocks YELLOW).
 *
 * Rules:
 * - No recorded correction, or a non-positive one: return the adaptation
 *   untouched.
 * - The adaptation already applied a rapid-loss surplus (the engine's own
 *   RAPID_LOSS branch, or a previous application of this helper): return
 *   untouched, never double-apply.
 * - Otherwise: add the correction calories to the adapted nutrition
 *   targets, split the way the engine's own rapid-loss branch splits
 *   +150 kcal (+30 g carbs, +3 g fat = 147 kcal, the engine's own
 *   rounding), and append a reason so the coach sees exactly what was
 *   applied and why. The input is frozen by buildAdaptedPlan, so a fresh
 *   unfrozen copy is returned and the input is never mutated.
 *
 * @param {Object} adapted - buildAdaptedPlan result (possibly frozen)
 * @param {Object} triage - classifyFollowUp result (may carry safety_correction)
 * @returns {Object} the adaptation with the correction applied, or untouched
 */
export function applySafetyCorrectionToAdaptation(adapted, triage) {
  if (!adapted || typeof adapted !== "object") return adapted;
  const delta = Number(triage?.safety_correction?.calorie_delta);
  if (!Number.isFinite(delta) || delta <= 0) return adapted;

  const reasons = Array.isArray(adapted.adaptation_reasons) ? adapted.adaptation_reasons : [];
  if (
    adapted.adaptation_action === "INCREASE_CALORIES_RAPID_LOSS" ||
    reasons.some((r) => r?.code === "RAPID_LOSS_SURPLUS_APPLIED" || r?.code === "RAPID_LOSS_SAFETY_CORRECTION_APPLIED")
  ) {
    return adapted;
  }

  const nutrition = adapted.adapted_nutrition;
  if (!nutrition || typeof nutrition !== "object") return adapted;
  const baseCalories = Number(nutrition.target_calories_kcal);
  if (!Number.isFinite(baseCalories)) return adapted;

  return {
    ...adapted,
    adaptation_reasons: [
      ...reasons,
      {
        code: "RAPID_LOSS_SAFETY_CORRECTION_APPLIED",
        message_ar: `تصحيح سلامة مسجّل من المتابعة (+${delta} سعرة): معدل النزول سريع مع التزام ضعيف، فتم تطبيق التصحيح على موافقة الكوتش لحماية الكتلة العضلية بدل ضياعه في تثبيت السعرات.`,
        message_en: `Recorded safety correction applied on coach approval (+${delta} kcal): rapid loss with low adherence, applied to protect lean mass instead of being lost in the maintain branch.`,
      },
    ],
    adapted_nutrition: {
      ...nutrition,
      target_calories_kcal: baseCalories + delta,
      carbohydrate_g: (Number(nutrition.carbohydrate_g) || 0) + 30,
      fat_g: (Number(nutrition.fat_g) || 0) + 3,
    },
  };
}

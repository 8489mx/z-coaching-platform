/**
 * PCOS protocol card for the coach editor's nutrition tab (PACKAGE S1, item 1).
 *
 * The engine applies the PCOS handling invisibly: clinical_guardrails
 * carries pcos_carb_cap_applied + pcos_carb_cap_note_ar, and the low-carb
 * framework sits in targeted_low_carb — but the nutrition tab only ever
 * read the kidney protein cap out of the guardrails, so the coach saw zero
 * PCOS handling on the plan. This turns the engine's PCOS data into the
 * card the tab renders, or null when no PCOS handling applies to the plan.
 * It is informational only: the cap is already applied, it never holds the
 * plan by itself.
 */
export function pcosProtocolCard(program) {
  const guardrails =
    program?.clinical_guardrails ||
    program?.nutrition?.clinical_guardrails ||
    program?.nutrition?.targets?.clinical_guardrails;
  const lowCarb = program?.targeted_low_carb || program?.nutrition?.targeted_low_carb;
  const applied = guardrails?.pcos_carb_cap_applied === true;
  const frameworkApplies = lowCarb?.framework === "TARGETED_LOW_CARB";
  if (!applied && !frameworkApplies) return null;
  return {
    frameworkNameAr: lowCarb?.framework_name_ar || "نظام الكارب المنخفض المعتدل (Moderate Low-Carb)",
    noteAr: guardrails?.pcos_carb_cap_note_ar || null,
    carbCapSharePercent:
      guardrails?.pcos_carb_cap_share != null
        ? Math.round(Number(guardrails.pcos_carb_cap_share) * 100)
        : null,
    carbCapRelaxed: guardrails?.pcos_carb_cap_relaxed === true,
    fatIncreaseG: guardrails?.pcos_fat_increase_g ?? null,
    netCarbsTargetG: lowCarb?.net_carbs_target_g ?? null,
    carbTimingAr: lowCarb?.carb_timing_ar || null,
  };
}

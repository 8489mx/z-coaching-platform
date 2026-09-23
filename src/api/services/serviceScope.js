/**
 * Who this service plans for. Pregnancy and kidney disease are followed by the client's own doctor,
 * who sets the food and the limits; the coach's answer there is a referral, not a plan. The engine
 * builds no plan for them at all, so the clinical branches that exist for those cases never run by
 * themselves and nobody publishes one by accident.
 *
 * Breastfeeding, a recent birth, PCOS, type 2 diabetes, blood pressure, thyroid, gout, coeliac
 * disease, allergies, IBS, favism and bariatric surgery all stay inside the service.
 */

/** The raw intake answers, whichever wrapper they arrive in. */
function answersOf(intake) {
  const raw = intake && typeof intake === "object" ? intake : {};
  return raw.answers && typeof raw.answers === "object" ? { ...raw.answers, ...raw } : raw;
}

const listOf = (value) => (Array.isArray(value) ? value : []).map((item) => String(item).trim().toLowerCase());

export const OUTSIDE_SERVICE_SCOPE = "OUTSIDE_SERVICE_SCOPE";

/**
 * @param {object} intake raw intake answers (or a wrapper holding them)
 * @returns {{supported: boolean, reasons_ar: string[], cases: string[]}}
 */
export function assessServiceScope(intake) {
  const answers = answersOf(intake);
  const medical = answers.medical_conditions && typeof answers.medical_conditions === "object" ? answers.medical_conditions : {};
  const conditions = listOf(medical.selected);
  const reasons = [];
  const cases = [];

  const pregnant = String(answers.female_pregnancy || "").toUpperCase() === "PREGNANT"
    || medical.female_cases?.is_pregnant === true
    || answers.is_pregnant === true;
  if (pregnant) {
    cases.push("PREGNANCY");
    reasons.push("الحمل: متابعة الحامل بتكون مع دكتورها وهو اللي بيحدد أكلها ومكملاتها، فالخدمة مش بتشمل الحوامل.");
  }

  const kidney = conditions.some((condition) => condition.includes("renal") || condition.includes("kidney") || condition.includes("dialysis"))
    || medical.dialysis === true;
  if (kidney) {
    cases.push("KIDNEY_DISEASE");
    reasons.push("أمراض الكلى والغسيل الكلوي: البروتين والأملاح بتتحدد بتحاليل ومتابعة دكتور الكلى، فالخدمة مش بتشملها.");
  }

  return { supported: reasons.length === 0, reasons_ar: reasons, cases };
}

/** What the coach sees when the case is outside the service. */
export function outsideScopeResponse(scope) {
  return {
    code: OUTSIDE_SERVICE_SCOPE,
    error: "الحالة دي خارج نطاق الخدمة، والنظام مش هيطلعلها خطة.",
    reasons_ar: scope.reasons_ar,
    cases: scope.cases,
    hint_ar: "اعتذر للعميل بذوق ووجّهه لمتابعة مع دكتوره المعالج.",
  };
}

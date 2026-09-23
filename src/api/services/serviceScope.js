/**
 * Who this service plans for. Pregnancy and kidney disease are followed by the client's own doctor,
 * who sets the food and the limits; the coach's answer there is a referral, not a plan. The engine
 * builds no plan for them at all, so the clinical branches that exist for those cases never run by
 * themselves and nobody publishes one by accident.
 *
 * A diagnosed heart condition is the same: there the training itself is the risk, and it needs a
 * stress test and a cardiologist's clearance first.
 *
 * One more case is read from the numbers the client already gave: a body far too light for a
 * weight-loss goal. Free-text notes are never scanned - a client can spell anything.
 *
 * Breastfeeding, a recent birth, PCOS, type 2 diabetes (insulin included), blood pressure, thyroid,
 * gout, coeliac disease, allergies, IBS, favism and bariatric surgery all stay inside the service.
 */

/** The raw intake answers, whichever wrapper they arrive in. */
function answersOf(intake) {
  const raw = intake && typeof intake === "object" ? intake : {};
  return raw.answers && typeof raw.answers === "object" ? { ...raw.answers, ...raw } : raw;
}

const listOf = (value) => (Array.isArray(value) ? value : []).map((item) => String(item).trim().toLowerCase());

export const OUTSIDE_SERVICE_SCOPE = "OUTSIDE_SERVICE_SCOPE";

// Underweight: WHO thinness is a BMI under 18.5, and a BMI under 16 is severe thinness.
export const UNDERWEIGHT_BMI = 18.5;
export const SEVERE_UNDERWEIGHT_BMI = 16;
const WEIGHT_LOSS_GOALS = new Set(["fat_loss", "recomposition", "weight_loss"]);

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

  const heart = conditions.some((condition) => condition.includes("heart") || condition.includes("cardiac"));
  if (heart) {
    cases.push("HEART_CONDITION");
    reasons.push("مرض القلب المشخص: التمرين نفسه محتاج تصريح من دكتور القلب ورسم قلب بمجهود، فالخدمة مش بتشملها.");
  }

  const weight = Number(answers.weight_kg);
  const heightM = Number(answers.height_cm) / 100;
  const bmi = heightM > 0 && weight > 0 ? weight / (heightM * heightM) : null;
  const goal = String(answers.primary_goal || "").toLowerCase();
  if (bmi !== null && (bmi < SEVERE_UNDERWEIGHT_BMI || (bmi < UNDERWEIGHT_BMI && WEIGHT_LOSS_GOALS.has(goal)))) {
    cases.push("UNDERWEIGHT");
    reasons.push(`الوزن تحت الطبيعي (مؤشر كتلة الجسم ${bmi.toFixed(1)})${WEIGHT_LOSS_GOALS.has(goal) ? " مع هدف نزول وزن" : ""}: الحالة دي محتاجة تقييم طبي وتغذية علاجية الأول، مش خطة تنشيف.`);
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

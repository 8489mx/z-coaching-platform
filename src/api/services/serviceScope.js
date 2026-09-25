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

  // Owner's decision (2026-09-25): a diagnosed heart condition is served when the client brings his
  // cardiologist's written clearance to exercise (we ask for no labs). It stays outside the service
  // without that clearance, or with an event that needs the cardiologist first.
  const heart = conditions.some((condition) => condition.includes("heart") || condition.includes("cardiac"));
  if (heart) {
    const answers_heart = medical.heart && typeof medical.heart === "object" ? medical.heart : {};
    const cleared = String(answers_heart.doctor_clearance || "").toUpperCase() === "YES";
    const events = listOf(answers_heart.recent_events).filter((event) => event && event !== "none");
    if (!cleared || events.length > 0) {
      cases.push("HEART_CONDITION");
      reasons.push(!cleared
        ? "مرض القلب المشخص: لازم تصريح مكتوب من دكتور القلب بممارسة الرياضة قبل أي خطة، والعميل مامعهوش."
        : "مرض القلب المشخص مع حالة محتاجة دكتور القلب الأول (جلطة أو قسطرة أو عملية أو هبوط عضلة أو عدم انتظام ضربات أو ألم صدر مع المجهود).");
    }
  }

  const weight = Number(answers.weight_kg);
  const heightM = Number(answers.height_cm) / 100;
  const bmi = heightM > 0 && weight > 0 ? weight / (heightM * heightM) : null;
  const goal = String(answers.primary_goal || "").toLowerCase();
  // Owner's decision (2026-09-25): only severe thinness is outside the service. A thin client who
  // asks to lose weight is served - the engine moves the goal to building muscle and the coach is
  // told why (goal_redirect in build-master-engine-v2), so he can talk to the client.
  if (bmi !== null && bmi < SEVERE_UNDERWEIGHT_BMI) {
    cases.push("UNDERWEIGHT");
    reasons.push(`الوزن تحت الطبيعي بشكل شديد (مؤشر كتلة الجسم ${bmi.toFixed(1)}): الحالة دي محتاجة تقييم طبي وتغذية علاجية الأول، مش خطة تدريب.`);
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

// P1-B2: one shared goal resolution. The decision engine and the plan engine
// used to read the goal from different places — the adapter folded RECOMP and
// COACH_DECIDES into FAT_LOSS for the decision, while the plan engine recovered
// them from the raw answers — so a lean "let the coach decide" client got a
// DEFICIT decision and a SURPLUS plan. Every caller now resolves through here,
// and a missing goal throws instead of silently becoming fat loss.

export const GOAL = Object.freeze({
  FAT_LOSS: "FAT_LOSS",
  BODY_RECOMPOSITION: "BODY_RECOMPOSITION",
  MUSCLE_GAIN: "MUSCLE_GAIN",
  WEIGHT_MAINTENANCE: "WEIGHT_MAINTENANCE",
  GENERAL_HEALTH: "GENERAL_HEALTH",
  PERFORMANCE: "PERFORMANCE",
  OTHER: "OTHER",
  COACH_DECIDES: "COACH_DECIDES",
});

// Normalize any goal spelling the form, the adapter, or a stored record can
// carry into one canonical value. Unknown or empty input normalizes to null;
// it is the caller's job to refuse a null goal, never to guess one.
export function normalizeGoal(value) {
  if (value === undefined || value === null) return null;
  const g = String(value).trim().toUpperCase();
  if (!g) return null;
  switch (g) {
    case "FAT_LOSS":
    case "CUT":
    case "FATLOSS":
    case "تنشيف":
    case "خسارة دهون":
    case "حرق دهون":
    case "إنقاص وزن":
    case "انقاص وزن":
      return GOAL.FAT_LOSS;
    case "MUSCLE_GAIN":
    case "LEAN_BULK":
    case "BULK":
    case "HYPERTROPHY":
    case "تضخيم":
    case "بناء عضل":
    case "زيادة عضل":
      return GOAL.MUSCLE_GAIN;
    case "BODY_RECOMPOSITION":
    case "RECOMPOSITION":
    case "RECOMP":
    case "إعادة تكوين":
    case "اعادة تكوين":
      return GOAL.BODY_RECOMPOSITION;
    case "WEIGHT_MAINTENANCE":
    case "MAINTENANCE":
    case "تثبيت وزن":
    case "صيانة":
      return GOAL.WEIGHT_MAINTENANCE;
    case "GENERAL_HEALTH":
    case "GENERAL_FITNESS":
    case "صحة عامة":
      return GOAL.GENERAL_HEALTH;
    case "PERFORMANCE":
    case "ATHLETIC_PERFORMANCE":
    case "لياقة عامة":
      return GOAL.PERFORMANCE;
    case "COACH_DECIDES":
      return GOAL.COACH_DECIDES;
    case "OTHER":
    case "أخرى":
    case "اخرى":
      return GOAL.OTHER;
    default:
      return null;
  }
}

// Body fat exactly as the plan engine used to compute it inline: direct
// measurement first (canonical body, then submitted answers), then the US Navy
// tape formula when neck and waist are present. Extracted unchanged so the
// early decision-time resolution and the plan-time resolution read the same
// number and can never pick different goals.
export function resolveBodyFat({ body = {}, rawBody = {}, rawCircumferences = {}, effectiveRaw = {}, isMale, height }) {
  let bodyFat = Number(
    body.bodyFat ?? body.body_fat ?? body.bodyFatPct ?? body.body_fat_pct ??
    rawBody.bodyFat ?? rawBody.body_fat ?? rawBody.bodyFatPct ?? rawBody.body_fat_pct ?? rawBody.body_fat_percent ?? rawBody.bodyFatPercentage ??
    effectiveRaw?.body_fat ?? effectiveRaw?.body_fat_percent ?? effectiveRaw?.bodyFatPct ?? effectiveRaw?.bodyFat ?? effectiveRaw?.body_fat_percentage,
  ) || null;
  if (bodyFat !== null && bodyFat > 0 && bodyFat <= 0.60) {
    bodyFat = Math.round(bodyFat * 100 * 10) / 10;
  }
  if (bodyFat !== null && (bodyFat < 3 || bodyFat > 65)) {
    bodyFat = null;
  }
  const neck = Number(body.neckCm || body.neck_cm || rawBody.neckCm || rawBody.neck_cm || rawCircumferences.neck_cm) || null;
  const waist = Number(rawBody.waistCm || rawBody.waist_cm || rawCircumferences.waist_cm || effectiveRaw?.waist_cm) || null;
  const hip = Number(body.hipCm || body.hip_cm || rawBody.hipCm || rawBody.hip_cm || rawCircumferences.hips_cm) || null;

  // Calculate US Navy Body Fat if neck and waist are present and direct bodyFat was not supplied
  if (!bodyFat && neck && waist && waist > neck) {
    if (isMale) {
      const logWaistNeck = Math.log10(waist - neck);
      const logHeight = Math.log10(height);
      const calculatedFat = 495 / (1.0324 - 0.19077 * logWaistNeck + 0.15456 * logHeight) - 450;
      if (calculatedFat >= 5 && calculatedFat <= 50) {
        bodyFat = Math.round(calculatedFat * 10) / 10;
      }
    } else if (hip && (waist + hip) > neck) {
      const logWaistHipNeck = Math.log10(waist + hip - neck);
      const logHeight = Math.log10(height);
      const calculatedFat = 495 / (1.29579 - 0.35004 * logWaistHipNeck + 0.22100 * logHeight) - 450;
      if (calculatedFat >= 8 && calculatedFat <= 55) {
        bodyFat = Math.round(calculatedFat * 10) / 10;
      }
    }
  }
  return bodyFat;
}

// Resolve the goal the plan is actually built on. A missing goal throws:
// a 20% deficit nobody asked for is never the default. "Let the coach decide"
// picks from body fat (or BMI when body fat is unknown); an underweight adult
// asking to lose weight is redirected to muscle gain, never a deficit; bulking
// with too much fat becomes recomposition. Redirect reasons are unchanged from
// the plan engine's original wording so the coach reads the same explanation.
export function resolvePrimaryGoal({ goal, bodyFat, bmi, isMale, isYoungTrainee }) {
  const requested = normalizeGoal(goal);
  if (!requested) {
    throw new RangeError("الهدف الرئيسي مطلوب لبناء الخطة ولم يتم توفيره؛ لا يمكن افتراض خسارة دهون من غير ما العميل يطلبها.");
  }
  let primaryGoal = requested;
  let goalRedirect = null;
  const bmiNow = bmi;
  const tooMuchFatToBulk = bodyFat ? bodyFat > (isMale ? 25 : 35) : bmiNow >= 30;
  // "Let the coach decide": high body fat -> fat loss; moderate -> fat loss with muscle building
  // (recomposition); lean -> muscle gain. The coach sees the suggestion and why before approving.
  if (requested === GOAL.COACH_DECIDES) {
    const moderateFat = bodyFat ? bodyFat > (isMale ? 18 : 28) : bmiNow >= 25;
    const chosen = tooMuchFatToBulk ? "FAT_LOSS" : moderateFat ? "BODY_RECOMPOSITION" : "MUSCLE_GAIN";
    const chosenAr = { FAT_LOSS: "نزول دهون ووزن", BODY_RECOMPOSITION: "نزول دهون مع شد وبناء عضل", MUSCLE_GAIN: "زيادة عضل ووزن" }[chosen];
    const basis = bodyFat ? `نسبة الدهون ${bodyFat}%` : `مؤشر كتلة الجسم ${bmiNow.toFixed(1)}`;
    goalRedirect = {
      from: "COACH_DECIDES",
      to: chosen,
      coach_review_required: true,
      reason_ar: `المتدرب ساب اختيار الهدف للكوتش؛ النظام اقترح "${chosenAr}" بناءً على ${basis}. راجعه قبل اعتماد الخطة.`,
    };
    primaryGoal = chosen;
  }
  // A body under BMI 18.5 asking to lose weight: never a deficit on a body that light. The goal
  // becomes building muscle and the coach reads why, so he can talk to the client and change it
  // (WHO thinness; severe thinness under 16 is refused earlier, api/services/serviceScope.js).
  const UNDERWEIGHT_BMI = 18.5;
  // Adults only: a BMI of 17-18 is normal for a growing child (see the young trainee rules below).
  if (!isYoungTrainee && bmiNow < UNDERWEIGHT_BMI && (primaryGoal === "FAT_LOSS" || primaryGoal === "BODY_RECOMPOSITION")) {
    goalRedirect = {
      from: primaryGoal,
      to: "MUSCLE_GAIN",
      coach_review_required: true,
      reason_ar: `وزن المتدرب تحت الطبيعي (مؤشر كتلة الجسم ${bmiNow.toFixed(1)}) وطلب نزول وزن؛ النظام حوّل الهدف لبناء عضل من غير أي عجز حراري. كلّمه: لو الهدف اتكتب غلط عدّله من المحرر، ولو مصمم على النزول وجّهه لدكتور الأول.`,
    };
    primaryGoal = "MUSCLE_GAIN";
  }
  if ((primaryGoal === "MUSCLE_GAIN" || primaryGoal === "LEAN_BULK") && tooMuchFatToBulk) {
    goalRedirect = {
      from: primaryGoal,
      to: "BODY_RECOMPOSITION",
      reason_ar: bodyFat
        ? `نسبة الدهون ${bodyFat}% أعلى من المناسب لزيادة الوزن؛ الهدف بقى "نزول دهون مع شد وبناء عضل" لحد ما النسبة تنزل، وبعدها نبدأ زيادة العضل والوزن.`
        : `مؤشر كتلة الجسم ${bmiNow.toFixed(1)} أعلى من المناسب لزيادة الوزن؛ الهدف بقى "نزول دهون مع شد وبناء عضل" لحد ما الوزن ينزل، وبعدها نبدأ زيادة العضل والوزن.`,
    };
    primaryGoal = "BODY_RECOMPOSITION";
  }
  return { resolved: primaryGoal, redirect: goalRedirect };
}

// The calorie direction a goal implies. Recomposition is a small deficit, so it
// is a DEFICIT direction — the plan's 10% deficit and the decision now agree.
export function goalCalorieDirection(goal) {
  const g = normalizeGoal(goal);
  if (g === GOAL.FAT_LOSS || g === GOAL.BODY_RECOMPOSITION) return "DEFICIT";
  if (g === GOAL.MUSCLE_GAIN) return "SURPLUS";
  return "MAINTENANCE";
}

// A maintenance-type goal is one whose target is TDEE itself (no planned
// deficit or surplus). The >10% balance-cut rejection applies to these only:
// a fat-loss plan is already a deficit by design, so its own target is the
// reference there, not TDEE.
export function isMaintenanceGoal(goal) {
  const g = normalizeGoal(goal);
  return g !== GOAL.FAT_LOSS && g !== GOAL.BODY_RECOMPOSITION && g !== GOAL.MUSCLE_GAIN;
}

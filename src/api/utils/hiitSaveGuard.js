/**
 * P0-A16: HIIT save guard + beta-blocker medication matcher (pure, no imports).
 *
 * The engine never produces HIIT (ModalityType = STEPS, LISS only), but the
 * coach editor saves legacy program.cardio, and its only asthma defense was
 * a warning. This module is the backend gate on that save path: HIIT stays
 * available for HEALTHY clients (owner decision 2026-11-03: HIIT honestly
 * brings good results), and is refused for at-risk groups.
 */

const RESPIRATORY_PATTERN = /ASTHMA|RESPIRATORY|ربو|تنفسي/i;
const CARDIOVASCULAR_PATTERN = /HEART|CARDIAC|CARDIOVASCULAR|HYPERTENSION|HIGH_BLOOD_PRESSURE|ARRHYTHM|قلب|ضغط الدم|ضغط دم/i;
const PREGNANCY_PATTERN = /PREGNAN|حامل/i;

export const BETA_BLOCKER_KEYS = Object.freeze([
  "BETA_BLOCKER", "BETA-BLOCKER", "BISOPROLOL", "CONCOR", "ATENOLOL",
  "METOPROLOL", "PROPRANOLOL", "CARVEDILOL", "NEBIVOLOL",
  "حاصرات بيتا", "بيسوبرولول", "كونكور",
]);

/** True when a medication list / free-text mentions a beta-blocker. */
export function isBetaBlockerMedication(medications) {
  const text = (Array.isArray(medications) ? medications : [medications])
    .map((m) => String(m ?? ""))
    .join(" ")
    .toUpperCase();
  return BETA_BLOCKER_KEYS.some((k) => text.includes(k));
}

/** True when a legacy cardio payload requests HIIT (modality or zone). */
export function isHiitCardio(cardio) {
  if (!cardio || typeof cardio !== "object") return false;
  const modality = String(cardio.modality || "");
  const zone = String(cardio.target_heart_rate_zone || "");
  return /hiit|sprint|كثافة عالية/i.test(modality) || /hiit|zone 4/i.test(zone);
}

function resolveBmi(weightKg, heightCm) {
  const w = Number(weightKg);
  const h = Number(heightCm) / 100;
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;
  return Math.round((w / (h * h)) * 10) / 10;
}

/**
 * At-risk assessment for a HIIT save. Conditions are free-form strings
 * (codes, names, Arabic labels); age in years; bmi computed when possible.
 * Unknown age/BMI never clears a client — only a known-healthy profile
 * passes; every other at-risk signal blocks.
 */
export function resolveHiitAtRisk({ conditions = [], age = null, bmi = null, weightKg = null, heightCm = null, isPregnant = false } = {}) {
  const conds = (Array.isArray(conditions) ? conditions : [conditions])
    .map((c) => (typeof c === "string" ? c : String(c?.conditionCode || c?.code || c?.name || c?.area || "")));
  const computedBmi = bmi !== null && bmi !== undefined ? Number(bmi) : resolveBmi(weightKg, heightCm);
  const numericAge = Number(age);
  const reasons = [];
  if (conds.some((c) => RESPIRATORY_PATTERN.test(c))) reasons.push("ASTHMA");
  if (conds.some((c) => CARDIOVASCULAR_PATTERN.test(c))) reasons.push("CARDIOVASCULAR");
  if (isPregnant === true || conds.some((c) => PREGNANCY_PATTERN.test(c))) reasons.push("PREGNANCY");
  if (computedBmi !== null && Number.isFinite(computedBmi) && computedBmi >= 35) reasons.push("BMI_35_PLUS");
  if (Number.isFinite(numericAge) && numericAge >= 65) reasons.push("AGE_65_PLUS");
  return { atRisk: reasons.length > 0, reasons, bmi: computedBmi };
}

/**
 * Evaluates a legacy cardio save. Returns { blocked, reason_code, reason_ar }.
 * Blocked only when the payload requests HIIT AND the client is at-risk;
 * healthy clients keep the HIIT choice.
 */
export function evaluateHiitSave({ cardio, conditions = [], age = null, bmi = null, weightKg = null, heightCm = null, isPregnant = false } = {}) {
  if (!isHiitCardio(cardio)) return { blocked: false, reason_code: null, reason_ar: null };
  const { atRisk, reasons } = resolveHiitAtRisk({ conditions, age, bmi, weightKg, heightCm, isPregnant });
  if (!atRisk) return { blocked: false, reason_code: null, reason_ar: null };
  const labels = { ASTHMA: "الربو", CARDIOVASCULAR: "الضغط/القلب", PREGNANCY: "الحمل", BMI_35_PLUS: "مؤشر كتلة 35 أو أكثر", AGE_65_PLUS: "سن 65 أو أكثر" };
  const why = reasons.map((r) => labels[r] || r).join("، ");
  return {
    blocked: true,
    reason_code: "HIIT_NOT_ALLOWED_FOR_AT_RISK",
    reason_ar: `حفظ HIIT مرفوض لهذا المتدرب (${why}): الفترات عالية الشدة تحتاج تصريحاً طبياً ولا تُحفظ للفئات المعرضة. الكارديو المسموح: معتدل ومستقر (Zone 2) باختبار الكلام.`,
  };
}

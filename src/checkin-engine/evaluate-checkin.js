import {
  CHECKIN_ENGINE_VERSION,
  CheckinAnalysisStatus,
  AdherenceTier,
  BiofeedbackAlert,
} from "./domain/enums.js";

function requireObject(value, name) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${name} must be an object.`);
  }
}

/**
 * Evaluates a weekly client check-in submission and computes analytical metrics.
 *
 * @param {import("./domain/contracts.js").CheckinSubmissionInput} submission
 * @returns {import("./domain/contracts.js").CheckinAnalysisOutput}
 */
export function evaluateCheckin(submission) {
  requireObject(submission, "submission");

  const {
    daily_weights_kg = [],
    previous_week_average_weight_kg = null,
    waist_circumference_cm = null,
    previous_waist_circumference_cm = null,
    nutrition_adherence_percent = 100,
    workouts_completed = 0,
    workouts_scheduled = 0,
    biofeedback = {},
    pain_reports = [],
  } = submission;

  if (!Array.isArray(daily_weights_kg) || daily_weights_kg.length === 0) {
    throw new TypeError("daily_weights_kg must be a non-empty array of numbers.");
  }

  // 1. Calculate Rolling Average Weight
  const validWeights = daily_weights_kg.filter((w) => typeof w === "number" && Number.isFinite(w) && w > 20);
  if (validWeights.length === 0) {
    throw new TypeError("At least one valid weight entry > 20kg is required.");
  }

  const currentAverageWeight = Math.round((validWeights.reduce((sum, w) => sum + w, 0) / validWeights.length) * 100) / 100;

  // 2. Calculate Deltas
  let weightChangeKg = null;
  let weightChangePercent = null;
  if (typeof previous_week_average_weight_kg === "number" && previous_week_average_weight_kg > 0) {
    weightChangeKg = Math.round((currentAverageWeight - previous_week_average_weight_kg) * 100) / 100;
    weightChangePercent = Math.round((weightChangeKg / previous_week_average_weight_kg) * 10000) / 100;
  }

  let waistChangeCm = null;
  if (typeof waist_circumference_cm === "number" && typeof previous_waist_circumference_cm === "number") {
    waistChangeCm = Math.round((waist_circumference_cm - previous_waist_circumference_cm) * 10) / 10;
  }

  // 3. Adherence Tier
  let adherenceTier = AdherenceTier.OPTIMAL;
  if (nutrition_adherence_percent < 70) {
    adherenceTier = AdherenceTier.LOW;
  } else if (nutrition_adherence_percent < 85) {
    adherenceTier = AdherenceTier.ACCEPTABLE;
  }

  // 4. Biofeedback Alerts
  const alerts = [];
  if (biofeedback.hunger_level >= 4) alerts.push(BiofeedbackAlert.HIGH_HUNGER);
  if (biofeedback.energy_in_gym <= 2) alerts.push(BiofeedbackAlert.LOW_RECOVERY_ENERGY);
  if (biofeedback.sleep_quality <= 2) alerts.push(BiofeedbackAlert.POOR_SLEEP);
  if (biofeedback.stress_level >= 4) alerts.push(BiofeedbackAlert.HIGH_STRESS);

  // 5. Pain & Injuries
  const flaggedPains = (Array.isArray(pain_reports) ? pain_reports : []).filter(
    (p) => typeof p.pain_level === "number" && p.pain_level >= 4,
  );

  // 6. Determine Status & Recommendations
  let analysisStatus = CheckinAnalysisStatus.ON_TRACK;
  const recommendationsAr = [];
  const recommendationsEn = [];
  let requiresCoachReview = false;

  if (flaggedPains.length > 0) {
    analysisStatus = CheckinAnalysisStatus.INJURY_FLAGGED;
    requiresCoachReview = true;
    recommendationsAr.push(`تم رصد ألم بمستوى ${flaggedPains[0].pain_level}/10 في منطقة (${flaggedPains[0].body_part}). يجب تعديل التمارين التي تضغط على هذا المفصل.`);
    recommendationsEn.push(`Pain level ${flaggedPains[0].pain_level}/10 reported on ${flaggedPains[0].body_part}. Aggravating exercises must be modified.`);
  } else if (adherenceTier === AdherenceTier.LOW) {
    analysisStatus = CheckinAnalysisStatus.POOR_ADHERENCE;
    recommendationsAr.push("نسبة الالتزام أقل من 70%. يجب مراجعة مسببات عدم الالتزام مع المدرب وتسهيل نمط الوجبات بدلاً من خفض السعرات.");
    recommendationsEn.push("Adherence is below 70%. Identify lifestyle friction with coach rather than lowering calorie target.");
  } else if (biofeedback.hunger_level >= 4 && biofeedback.energy_in_gym <= 2) {
    analysisStatus = CheckinAnalysisStatus.HIGH_FATIGUE_WARNING;
    recommendationsAr.push("مؤشرات الجوع مرتفعة مع انخفاض الطاقة. يُوصى بجدولة يوم إعادة شحن (Refeed Day) بكاربوهيدرات عالية.");
    recommendationsEn.push("High hunger and low recovery detected. A structured high-carb Refeed Day is recommended.");
  } else if (weightChangePercent !== null && weightChangePercent < -1.5) {
    analysisStatus = CheckinAnalysisStatus.RAPID_LOSS_WARNING;
    recommendationsAr.push("معدل نزول الوزن سريع جداً (>1.5% أسبوعياً). يُوصى بزيادة طفيفة في السعرات (+150 kcal) لحماية الكتلة العضلية.");
    recommendationsEn.push("Weight loss rate is too rapid (>1.5%/wk). Increase daily energy by +150 kcal to protect lean mass.");
  } else if (weightChangeKg !== null && Math.abs(weightChangeKg) < 0.2 && adherenceTier === AdherenceTier.OPTIMAL) {
    analysisStatus = CheckinAnalysisStatus.PLATEAU_DETECTED;
    recommendationsAr.push("ثبات في الوزن مع التزام ممتاز بالدايت. يُوصى بتعديل طفيف في السعرات (-100 إلى -150 kcal) أو إضافة 1000 خطوة يومياً.");
    recommendationsEn.push("Weight plateau detected despite optimal adherence. Apply modest calorie reduction (-125 kcal) or add +1,000 daily steps.");
  } else {
    analysisStatus = CheckinAnalysisStatus.ON_TRACK;
    recommendationsAr.push("التقدم ممتاز والنزول في النطاق المستهدف. استمر على نفس السعرات والماكروز مع تدوير الوجبات للتنويع.");
    recommendationsEn.push("Progress is optimal and on track. Maintain current targets and rotate meals for variety.");
  }

  return Object.freeze({
    engine_version: CHECKIN_ENGINE_VERSION,
    analysis_status: analysisStatus,
    current_average_weight_kg: currentAverageWeight,
    weight_change_kg: weightChangeKg,
    weight_change_percent: weightChangePercent,
    waist_change_cm: waistChangeCm,
    adherence_tier: adherenceTier,
    biofeedback_alerts: Object.freeze(alerts),
    flagged_pains: Object.freeze(flaggedPains),
    recommendations_ar: Object.freeze(recommendationsAr),
    recommendations_en: Object.freeze(recommendationsEn),
    requires_coach_review: requiresCoachReview,
  });
}

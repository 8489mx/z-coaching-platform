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
 * Evaluates a weekly client check-in submission and computes analytical auto-regulation recommendations.
 *
 * @param {import("./domain/contracts.js").CheckinSubmissionInput} submission
 * @returns {import("./domain/contracts.js").CheckinAnalysisOutput}
 */
export function evaluateCheckin(submission) {
  requireObject(submission, "submission");

  const {
    daily_weights_kg,
    weight_kg,
    current_weight_kg,
    previous_week_average_weight_kg = null,
    previous_weight_kg = null,
    waist_circumference_cm = null,
    previous_waist_circumference_cm = null,
    hip_circumference_cm = null,
    previous_hip_circumference_cm = null,
    nutrition_adherence_percent = 100,
    workouts_completed = 0,
    workouts_scheduled = 4,
    biofeedback = {},
    pain_reports = [],
    is_consecutive_plateau = false,
  } = submission;

  // 1. Calculate Current Weight (Single morning weigh-in or rolling average)
  let currentWeight = null;
  if (typeof weight_kg === "number" && weight_kg > 20) {
    currentWeight = Math.round(weight_kg * 100) / 100;
  } else if (typeof current_weight_kg === "number" && current_weight_kg > 20) {
    currentWeight = Math.round(current_weight_kg * 100) / 100;
  } else if (Array.isArray(daily_weights_kg) && daily_weights_kg.length > 0) {
    const validWeights = daily_weights_kg.filter((w) => typeof w === "number" && Number.isFinite(w) && w > 20);
    if (validWeights.length > 0) {
      currentWeight = Math.round((validWeights.reduce((sum, w) => sum + w, 0) / validWeights.length) * 100) / 100;
    }
  }

  if (currentWeight === null) {
    throw new TypeError("A valid current weight entry > 20kg is required.");
  }

  // 2. Calculate Deltas
  const prevWeight = typeof previous_weight_kg === "number" && previous_weight_kg > 20
    ? previous_weight_kg
    : (typeof previous_week_average_weight_kg === "number" && previous_week_average_weight_kg > 20 ? previous_week_average_weight_kg : null);

  let weightChangeKg = null;
  let weightChangePercent = null;
  if (prevWeight !== null) {
    weightChangeKg = Math.round((currentWeight - prevWeight) * 100) / 100;
    weightChangePercent = Math.round((weightChangeKg / prevWeight) * 10000) / 100;
  }

  let waistChangeCm = null;
  if (typeof waist_circumference_cm === "number" && typeof previous_waist_circumference_cm === "number") {
    waistChangeCm = Math.round((waist_circumference_cm - previous_waist_circumference_cm) * 10) / 10;
  }

  let hipChangeCm = null;
  if (typeof hip_circumference_cm === "number" && typeof previous_hip_circumference_cm === "number") {
    hipChangeCm = Math.round((hip_circumference_cm - previous_hip_circumference_cm) * 10) / 10;
  }

  // 3. Adherence Gate Rule (80% threshold)
  const adherenceTier = nutrition_adherence_percent >= 80 ? AdherenceTier.OPTIMAL : AdherenceTier.LOW;

  // 4. Biofeedback Alerts
  const alerts = [];
  if (biofeedback.hunger_level >= 4) alerts.push(BiofeedbackAlert.HIGH_HUNGER);
  if (biofeedback.energy_in_gym <= 2 || biofeedback.energy_level <= 2) alerts.push(BiofeedbackAlert.LOW_RECOVERY_ENERGY);
  if (biofeedback.sleep_quality <= 2 || (biofeedback.sleep_hours !== undefined && biofeedback.sleep_hours < 6)) alerts.push(BiofeedbackAlert.POOR_SLEEP);
  if (biofeedback.stress_level >= 4) alerts.push(BiofeedbackAlert.HIGH_STRESS);

  // 5. Pain & Injuries
  const flaggedPains = (Array.isArray(pain_reports) ? pain_reports : []).filter(
    (p) => typeof p.pain_level === "number" && p.pain_level >= 4,
  );
  if (flaggedPains.length > 0) {
    alerts.push(BiofeedbackAlert.JOINT_DISCOMFORT);
  }

  // 6. Auto-Regulation Decision Tree
  let analysisStatus = CheckinAnalysisStatus.ON_TRACK;
  const recommendationsAr = [];
  const recommendationsEn = [];
  let suggestedCalorieDelta = 0;
  let suggestedCarbDeltaGrams = 0;
  let suggestedStepsDelta = 0;
  let isDeloadRecommended = false;
  let isRefeedRecommended = false;
  let requiresCoachReview = false;

  // RULE A: Joint Pain / Injury Red Flag
  if (flaggedPains.length > 0) {
    analysisStatus = CheckinAnalysisStatus.INJURY_FLAGGED;
    requiresCoachReview = true;
    isDeloadRecommended = flaggedPains.some((p) => p.pain_level >= 7);
    const painDesc = flaggedPains.map((p) => `${p.body_part || p.area} (مستوى ${p.pain_level}/10)`).join("، ");
    recommendationsAr.push(`تم رصد ألم حركي ملحوظ في: ${painDesc}. يُوصى باستبدال التمارين الضاغطة على هذا المفصل ببدائل ميكانيكية آمنة وتخفيف الأحمال.`);
    recommendationsEn.push(`Joint pain detected in ${painDesc}. Replace irritating movement patterns with joint-friendly swaps.`);
  }

  // RULE B: Strict Adherence Gate (Lock calories if adherence < 80%)
  else if (adherenceTier === AdherenceTier.LOW) {
    analysisStatus = CheckinAnalysisStatus.POOR_ADHERENCE;
    recommendationsAr.push("نسبة الالتزام بالخطة أقل من 80%. تقرر تثبيت السعرات الحالية تماماً؛ خفض السعرات لغير الملتزم يؤدي للانتكاس وزيادة التوتر النفسي. ركز على تثبيت عاداتك والتنظيم الأسبوعي.");
    recommendationsEn.push("Adherence is below 80%. Calorie targets remain locked. Focus on consistency rather than cutting calories.");
  }

  // RULE C: Waist-First Body Recomposition (Weight stable/up, but waist dropped >= 0.5 cm)
  else if (
    waistChangeCm !== null &&
    waistChangeCm <= -0.5 &&
    (weightChangeKg === null || (weightChangeKg >= -0.2 && weightChangeKg <= 0.8))
  ) {
    analysisStatus = CheckinAnalysisStatus.BODY_RECOMP_SUCCESS;
    recommendationsAr.push(`إعادة تكوين عضلي ناجحة 100%! انخفض محيط الخصر بمقدار ${Math.abs(waistChangeCm)} سم مع ثبات الميزان، وهو دليل قاطع على حرق دهون الأحشاء وبناء كتلة عضلية صافية في نفس الوقت. استمر على نفس السعرات والماكروز تماماً.`);
    recommendationsEn.push(`Successful body recomposition! Waist dropped by ${Math.abs(waistChangeCm)} cm while weight remained stable. Maintain current macros.`);
  }

  // RULE D: Rapid Loss Warning (> 1.5% bodyweight loss per week)
  else if (weightChangePercent !== null && weightChangePercent < -1.5) {
    analysisStatus = CheckinAnalysisStatus.RAPID_LOSS_WARNING;
    suggestedCalorieDelta = 150;
    suggestedCarbDeltaGrams = 35;
    recommendationsAr.push(`معدل نزول الوزن سريع جداً (${Math.abs(weightChangePercent)}% في أسبوع واحد). يُوصى بزيادة خفيفة في السعرات (+150 سعرة من الكاربوهيدرات المعقدة) لحماية الكتلة العضلية من الهدم.`);
    recommendationsEn.push(`Weight loss rate is too rapid (${Math.abs(weightChangePercent)}%/wk). Increase energy by +150 kcal to protect lean mass.`);
  }

  // RULE E: High Hunger & Low Recovery Energy (Refeed Day / Fatigue Warning)
  else if (biofeedback.hunger_level >= 4 && (biofeedback.energy_in_gym <= 2 || biofeedback.energy_level <= 2) && adherenceTier === AdherenceTier.OPTIMAL) {
    analysisStatus = CheckinAnalysisStatus.HIGH_FATIGUE_WARNING;
    isRefeedRecommended = true;
    recommendationsAr.push("مؤشرات الجوع مرتفعة مع انخفاض طاقة الاستشفاء رغم التزامك الممتاز. يُوصى بجدولة يوم إعادة شحن كربوهيدرات (Refeed Day) لملء مخازن الجليكوجين وتحفيز هرمون اللبتين.");
    recommendationsEn.push("Elevated hunger and low energy detected under high adherence. Schedule a structured high-carb Refeed Day.");
  }


  // RULE F: True Plateau (Weight & Waist stagnant under high adherence)
  else if (
    weightChangeKg !== null &&
    Math.abs(weightChangeKg) < 0.2 &&
    (waistChangeCm === null || waistChangeCm > -0.3) &&
    adherenceTier === AdherenceTier.OPTIMAL
  ) {
    analysisStatus = is_consecutive_plateau ? CheckinAnalysisStatus.TRUE_PLATEAU : CheckinAnalysisStatus.PLATEAU_DETECTED;
    suggestedCalorieDelta = -125;
    suggestedCarbDeltaGrams = -30;
    suggestedStepsDelta = 1000;
    recommendationsAr.push("ثبات في الميزان ومحيط الخصر مع التزام ممتاز بالدايت. يُوصى بتعديل ذكي: إما خفض 125 سعرة حرارية (~30 جم كارب) أو إضافة 1,000 خطوة يومياً لكسر الثبات وتحفيز حرق الدهون.");
    recommendationsEn.push("Plateau detected across weight and waist measurements under optimal adherence. Apply -125 kcal adjustment or add +1,000 daily steps.");
  }

  // RULE G: On Track
  else {
    analysisStatus = CheckinAnalysisStatus.ON_TRACK;
    recommendationsAr.push("التقدم ممتاز واستجابة الجسم مثالية وضمن النطاق الفسيولوجي المستهدف. استمر على نفس الخطة التدريبية والغذائية مع تدوير الوجبات للتجديد.");
    recommendationsEn.push("Progress is optimal and perfectly on track. Maintain current training and nutritional targets.");
  }

  return Object.freeze({
    engine_version: CHECKIN_ENGINE_VERSION,
    analysis_status: analysisStatus,
    current_average_weight_kg: currentWeight,
    weight_change_kg: weightChangeKg,
    weight_change_percent: weightChangePercent,
    waist_change_cm: waistChangeCm,
    hip_change_cm: hipChangeCm,
    adherence_tier: adherenceTier,
    suggested_calorie_delta: suggestedCalorieDelta,
    suggested_carb_delta_g: suggestedCarbDeltaGrams,
    suggested_steps_delta: suggestedStepsDelta,
    is_deload_recommended: isDeloadRecommended,
    is_refeed_recommended: isRefeedRecommended,
    biofeedback_alerts: Object.freeze(alerts),
    flagged_pains: Object.freeze(flaggedPains),
    recommendations_ar: Object.freeze(recommendationsAr),
    recommendations_en: Object.freeze(recommendationsEn),
    requires_coach_review: requiresCoachReview,
  });
}


import {
  CHECKIN_ENGINE_VERSION,
  CheckinAnalysisStatus,
  AdherenceTier,
  BiofeedbackAlert,
} from "./domain/enums.js";
import { evaluateFemaleCycleBuffer } from "../execution-engines/female-cycle-buffer-engine.js";

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
    // Deep check-in v3: new fields
    lifestyle_variance = "NORMAL_WORK",
    bowel_regularity = "REGULAR",
    sleep_stress_composite = 3,
    menstrual_phase = "NOT_APPLICABLE",
    occupation_type = null,
    next_week_travel = false,
    next_week_gym_available = true,
    next_week_realistic_days = null,
    primary_goal = null,
  } = submission;

  // Canonical goal of the client (FAT_LOSS, MUSCLE_GAIN, WEIGHT_MAINTENANCE, ...). Unknown goals keep the
  // historical fat-loss behaviour.
  const goal = String(primary_goal || "").toUpperCase();
  const isMuscleGainGoal = goal === "MUSCLE_GAIN";
  const isWeightStableGoal = goal === "WEIGHT_MAINTENANCE" || goal === "GENERAL_HEALTH" || goal === "PERFORMANCE";

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

  // S3-7 Option C: rapid loss is computed independently of where the
  // analysis else-if chain stops, using the same < -1.5% rule as RULE D.
  const isRapidLoss = Number.isFinite(weightChangePercent) && weightChangePercent < -1.5;

  // 3. Adherence Gate Rule (80% threshold)
  const adherenceTier = nutrition_adherence_percent >= 80 ? AdherenceTier.OPTIMAL : AdherenceTier.LOW;

  // 4. Biofeedback Alerts
  const alerts = [];
  if (biofeedback.hunger_level >= 4) alerts.push(BiofeedbackAlert.HIGH_HUNGER);
  if (biofeedback.energy_in_gym <= 2 || biofeedback.energy_level <= 2) alerts.push(BiofeedbackAlert.LOW_RECOVERY_ENERGY);
  if (biofeedback.sleep_quality <= 2 || (biofeedback.sleep_hours !== undefined && biofeedback.sleep_hours < 6)) alerts.push(BiofeedbackAlert.POOR_SLEEP);
  if (biofeedback.stress_level >= 4) alerts.push(BiofeedbackAlert.HIGH_STRESS);
  if (isRapidLoss) alerts.push(BiofeedbackAlert.RAPID_LOSS_DETECTED);

  // 5. Pain & Injuries
  const flaggedPains = (Array.isArray(pain_reports) ? pain_reports : []).filter(
    (p) => typeof p.pain_level === "number" && p.pain_level >= 4,
  );
  if (flaggedPains.length > 0) {
    alerts.push(BiofeedbackAlert.JOINT_DISCOMFORT);
  }

  // 5a. Critical Cardiac & Exertional Safety Screening (P0 Clinical Safety)
  // S3-5: the benign-DOMS check is shared by the free-text screener and
  // the structured pain-report check, so both apply the same patterns
  // with the same emergency-keyword guard. A DOMS description is benign
  // only when no true emergency wording is present alongside it.
  function isBenignMuscularDomsText(t) {
    const text = String(t || "");
    if (!text.trim()) return false;
    const benignMuscularDoms = [
      /شد\s*عضلي\s*(في\s*)?(عضلات\s*)?الصدر/i,
      /عضلات\s*الصدر\s*(بتوجعني|فيها\s*ألم|مألمة|شدت)/i,
      /ألم\s*عضلي\s*(في\s*)?(عضلات\s*)?الصدر/i,
      /(chest\s*muscle|pecs|pectoral)\s*(soreness|doms|tightness)/i,
      /sore\s*(chest\s*muscles|pecs)/i,
    ];
    if (!benignMuscularDoms.some((p) => p.test(text))) return false;
    const trueEmergencyKeywords = /(إغماء|فقدان\s*الوعي|خفقان\s*حاد|ألم\s*ضاغط|حرقان\s*شديد|ضيق\s*تنفس\s*شديد|syncope|passed\s*out|radiat)/i;
    return !trueEmergencyKeywords.test(text);
  }

  function evaluateCardiacScreeningText(text) {
    const t = String(text || "").toLowerCase().trim();
    if (!t) return false;

    // Negation check: trainee explicitly stating absence of pain or symptoms
    // e.g. "لا يوجد ألم بالصدر أو دوخة", "ما فيش أي ألم بالصدر", "no chest pain, no dizziness"
    const clauseDelimiter = /(?:[.،,؛;!\?\n]+|(?:^|\s+)(?:لكن|ولكن|بس|إلا\s+أن|غير\s+أن|إنما|بينما|مع\s+وجود|وعندي|وأعاني|واعاني|وأشعر|واشعر|وبحس|وحسيت|وشعرت|وجالي|وفقدت|وأغمى|واغمى|و\s+(?:عندي|أعاني|اعاني|أشعر|اشعر|بحس|حسيت|شعرت|جالي|فقدت|أغمى|اغمى)|but|however|yet|though|although|except)(?=\s+|$))/i;
    const negationClauseRegex = /^(?:\s*(?:و|أو|او|ولا|ثم|الحمد\s*لله|كله\s*تمام|الامور\s*تمام|الأمور\s*تمام|and|or|nor)*\s*)*(?:لا\s*يوجد|لا\s*توجد|لا\s*أشعر|لا\s*اشعر|لا\s*أعاني|لا\s*اعاني|لم\s*أشعر|لم\s*اشعر|ما\s*(?:فيش|عنديش|عندي|حسيت|شعرت)|معنديش|محسيتش|مش\s*(?:حاسس|بحس|عندي)|بدون|بلا|no|without|never\s*had|not\s+(?:having|feeling|experiencing))(?:\s+|$)/i;
    const negationRegex = /(?:لا\s*يوجد|لا\s*توجد|لا\s*أشعر|لا\s*اشعر|ما\s*(?:فيش|عنديش|عندي|حسيت|شعرت)|معنديش|محسيتش|بدون|بلا|no|without|never\s*had)\s+(?:أي\s+|اي\s+|any\s+)?(?:ألم|وجع|ضغط|حرقان|خفقان|دوخة|إغماء|اغماء|صدر|chest|pain|syncope|dizziness)(?:\s+(?:في\s+الصدر|بالصدر|أو|او|ولا|or|nor|at\s+all)\s*(?:ألم|وجع|ضغط|حرقان|خفقان|دوخة|إغماء|اغماء|صدر|بالصدر|في\s+الصدر|chest|pain|syncope|dizziness|at\s+all)*)*/gi;
    const workingText = t.split(clauseDelimiter).map((c) => c.trim()).filter((c) => c && !negationClauseRegex.test(c)).map((c) => c.replace(negationRegex, " ").trim()).filter(Boolean).join(" ").trim();
    if (!workingText) return false;

    // Benign muscular soreness / DOMS in pectorals (shared helper, S3-5)
    if (isBenignMuscularDomsText(workingText)) {
      return false;
    }

    const cardiacEmergencyPatterns = /(ألم.*صدر|وجع.*صدر|ضغط.*صدر|حرقان.*صدر|خفقان.*حاد|إغماء|فقدت.*الوعي|دوخة.*مفاجئة|chest.*pain|syncope|passed.*out|fainted|loss.*of.*consciousness)/i;
    return cardiacEmergencyPatterns.test(workingText);
  }

  const notesText = [
    String(submission.client_notes || ""),
    String(submission.notes || ""),
    String(submission.next_week_notes || "")
  ].join(" ");

  // S3-5: a chest-area pain report is a cardiac flag only when it is
  // significant (pain_level at or above the engine's injury threshold
  // of 4, the same threshold flaggedPains uses) or its severity is
  // unknown (fail closed). Mild chest pain with no other cardiac
  // signal no longer locks training, and benign DOMS wording in the
  // report exempts it exactly as in the free-text screener — while the
  // injury path still applies at level >= 4. Emergency wording in the
  // report itself still flags at any level.
  const hasChestPainInReports = (Array.isArray(pain_reports) ? pain_reports : []).some((p) => {
    const loc = String(p.area || p.location || p.body_part || "").toUpperCase();
    if (!(loc.includes("CHEST") || loc.includes("صدر"))) return false;
    const reportText = [p.area, p.location, p.body_part, p.description, p.notes, p.details, p.summary]
      .filter((v) => typeof v === "string")
      .join(" ");
    if (isBenignMuscularDomsText(reportText)) return false;
    if (typeof p.pain_level === "number" && p.pain_level < 4) {
      return evaluateCardiacScreeningText(reportText);
    }
    return true;
  });

  const hasStructuredCardiac = Boolean(
    submission.exertional_chest_pain === true ||
    submission.syncope === true ||
    submission.fainting === true ||
    submission.concerning_dizziness === true ||
    submission.cardiac_symptoms?.exertional_chest_pain === true ||
    submission.cardiac_symptoms?.syncope === true ||
    submission.cardiac_symptoms?.concerning_dizziness === true ||
    submission.cardiac_symptoms?.emergency_symptoms === true
  );

  const isCardiacRedFlag = hasStructuredCardiac || hasChestPainInReports || evaluateCardiacScreeningText(notesText);
  const hasPriorClinicalLock = Boolean(submission.has_prior_clinical_lock);
  if (isCardiacRedFlag || hasPriorClinicalLock) {
    alerts.push(BiofeedbackAlert.CARDIAC_RED_FLAG);
  }

  // 5b. False Plateau Triad Detection (2 of 3 must be true)
  let falsePlateauScore = 0;
  if (bowel_regularity !== "REGULAR") falsePlateauScore++;
  if (sleep_stress_composite <= 2) falsePlateauScore++;
  if (menstrual_phase === "LUTEAL" || menstrual_phase === "MENSTRUATION") falsePlateauScore++;
  const isFalsePlateau = falsePlateauScore >= 2;

  // 5c. NEAT Lock Detection (Occupational baseline or temporary lifestyle drop like vacation)
  const isOccupationalNeatLock = (
    (
      (lifestyle_variance === "NORMAL_WORK" && (occupation_type === "DESK_OFFICE" || occupation_type === "STUDENT")) ||
      (lifestyle_variance === "HOME_VACATION" || lifestyle_variance === "TRAVEL_AWAY" || lifestyle_variance === "SICK_RECOVERY")
    ) &&
    weightChangeKg !== null &&
    Math.abs(weightChangeKg) < 0.3
  );

  // 5d. Female Menstrual Cycle Buffer Gate
  const isFemaleClient = submission.is_female === true || submission.gender === "female" || submission.gender === "FEMALE" || (menstrual_phase && menstrual_phase !== "NOT_APPLICABLE");
  const femaleCycleBuffer = evaluateFemaleCycleBuffer({
    is_female: isFemaleClient,
    cycle_phase: menstrual_phase !== "NOT_APPLICABLE" ? menstrual_phase : null,
    approximate_next_period_date: submission.approximate_next_period_date || submission.next_period_date || null,
    is_pms_active: Boolean(submission.is_pms_active || biofeedback.is_pms_active || submission.is_pms),
    weight_delta_kg: weightChangeKg !== null ? weightChangeKg : 0,
    adherence_score: nutrition_adherence_percent,
    has_pcos: Boolean(submission.has_pcos || submission.pcos)
  });

  // 6. Auto-Regulation Decision Tree
  let analysisStatus = CheckinAnalysisStatus.ON_TRACK;
  const recommendationsAr = [];
  const recommendationsEn = [];
  let suggestedCalorieDelta = 0;
  let suggestedCarbDeltaGrams = 0;
  let suggestedStepsDelta = 0;
  let trainingLocked = false;
  let emergencyDirectiveAr = null;
  let emergencyDirectiveEn = null;

  let isDeloadRecommended = false;
  let isRefeedRecommended = false;
  let requiresCoachReview = false;

  if (isCardiacRedFlag || hasPriorClinicalLock) {
    analysisStatus = CheckinAnalysisStatus.CRITICAL_CARDIAC_FLAG;
    trainingLocked = true;
    requiresCoachReview = true;
    emergencyDirectiveAr = hasPriorClinicalLock
      ? `تنبيه سريري: لا يزال قفل التدريب سارياً بسبب أعراض قلبية/إغماء سابقة (أسبوع ${submission.prior_clinical_lock_week || 1}). يُحظر استئناف التمارين إلا بعد تقديم التصريح الطبي للكوتش.`
      : "توقف فوري عن كافة التمارين والمجهود البدني. أبلغت عن أعراض قلبية أو إغماء مرتبطة بالمجهود تستدعي تقييماً طبياً عاجلاً. في حال وجود ألم يمتد للذراع أو الفك أو ضيق تنفس شديد أو تعرق بارد، اتصل بالإسعاف فوراً (123 / 997 / 911).";
    emergencyDirectiveEn = "IMMEDIATE CESSATION OF ALL PHYSICAL TRAINING. Exertional chest pain or syncope reported requiring urgent medical evaluation. Call emergency services immediately if symptoms radiate or worsen.";
    recommendationsAr.push(emergencyDirectiveAr);
    recommendationsEn.push(emergencyDirectiveEn);
    suggestedCalorieDelta = 0;
    suggestedStepsDelta = 0;
  } else if (flaggedPains.length > 0) {
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
    recommendationsAr.push(`نزول دهون مع زيادة عضل بنجاح! انخفض محيط الخصر بمقدار ${Math.abs(waistChangeCm)} سم مع ثبات الميزان، وهو دليل قاطع على حرق دهون الأحشاء وبناء كتلة عضلية صافية في نفس الوقت. استمر على نفس السعرات والماكروز تماماً.`);
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

  // RULE E2: Female Cycle Luteal / PMS Water Retention Guardrail (Strict Lock on Calorie Cuts)
  else if (femaleCycleBuffer.deficit_adjustment_locked) {
    analysisStatus = CheckinAnalysisStatus.FEMALE_PMS_WATER_RETENTION;
    suggestedCalorieDelta = 0;
    suggestedCarbDeltaGrams = 0;
    suggestedStepsDelta = 0;
    recommendationsAr.push(
      femaleCycleBuffer.reassurance_message_ar ||
      "زيادة أو ثبات الميزان في هذه الفترة ناتجة عن احتباس مائي هرموني طبيعي ومؤقت (طور الـ Luteal / PMS). تم قفل خفض السعرات تماماً؛ جسمك ماشي بشكل ممتاز ومكملين بنفس الخطة!"
    );
    if (femaleCycleBuffer.micro_adjustments?.comfort_snack_options_ar) {
      recommendationsAr.push(`توجيه التغذية الذكي: ${femaleCycleBuffer.micro_adjustments.comfort_snack_options_ar}.`);
    }
    if (femaleCycleBuffer.micro_adjustments?.recommended_supplement) {
      recommendationsAr.push(`المكمل الموصى به: ${femaleCycleBuffer.micro_adjustments.recommended_supplement} (${femaleCycleBuffer.micro_adjustments.benefit_ar}).`);
    }
    recommendationsEn.push("Female PMS water retention active under optimal adherence. Deficit adjustments locked to prevent hormonal fatigue.");
  }

  // RULE F1 (NEW): False Plateau Triad — Block calorie cuts if plateau is caused by water retention
  else if (
    !isWeightStableGoal &&
    weightChangeKg !== null &&
    Math.abs(weightChangeKg) < 0.2 &&
    (waistChangeCm === null || waistChangeCm > -0.3) &&
    adherenceTier === AdherenceTier.OPTIMAL &&
    isFalsePlateau
  ) {
    analysisStatus = CheckinAnalysisStatus.FALSE_PLATEAU_DETECTED;
    // No calorie adjustment — the stall is temporary fluid retention
    const triadReasons = [];
    if (bowel_regularity !== "REGULAR") triadReasons.push("إمساك أو عدم انتظام حركة الأمعاء");
    if (sleep_stress_composite <= 2) triadReasons.push("نوم سيئ أو توتر مرتفع");
    if (menstrual_phase === "LUTEAL" || menstrual_phase === "MENSTRUATION") triadReasons.push("المرحلة الهرمونية للدورة الشهرية");
    recommendationsAr.push(`الثبات على الميزان ناتج عن احتباس سوائل مؤقت بسبب: ${triadReasons.join(" + ")}. هذا ليس ثبات أيضي حقيقي. تُثبت السعرات تماماً ويُراقب الأسبوع القادم.`);
    recommendationsEn.push(`False plateau detected — weight stall is due to temporary fluid retention (${triadReasons.length} triad factors). Calories remain locked. Monitor next week.`);
    requiresCoachReview = true;
  }

  // RULE F2 (NEW): Occupational NEAT Lock — Don't cut calories if low NEAT is occupational baseline
  else if (
    !isMuscleGainGoal &&
    !isWeightStableGoal &&
    weightChangeKg !== null &&
    Math.abs(weightChangeKg) < 0.2 &&
    (waistChangeCm === null || waistChangeCm > -0.3) &&
    adherenceTier === AdherenceTier.OPTIMAL &&
    isOccupationalNeatLock
  ) {
    analysisStatus = CheckinAnalysisStatus.OCCUPATIONAL_NEAT_LOCK;
    // No calorie adjustment — low NEAT is the client's occupational baseline, not a behavioral regression
    recommendationsAr.push("ثبات في الوزن مع نمط حركة مكتبي طبيعي. النشاط المنخفض هو جزء من طبيعة عملك وليس تراجعاً سلوكياً. يُثبت البرنامج ويُراقب لأسبوع إضافي قبل أي تعديل.");
    recommendationsEn.push("Weight plateau with normal desk-based NEAT baseline. Low activity is occupational, not behavioral. Program is held steady for an additional monitoring week.");
  }

  // RULE F0: Muscle-gain stall — stable weight under high adherence means the surplus is gone,
  // so energy goes up (lean-gain target ~0.25-0.5% bodyweight per week).
  else if (
    isMuscleGainGoal &&
    weightChangeKg !== null &&
    Math.abs(weightChangeKg) < 0.2 &&
    adherenceTier === AdherenceTier.OPTIMAL
  ) {
    analysisStatus = CheckinAnalysisStatus.GAIN_STALL;
    suggestedCalorieDelta = 125;
    suggestedCarbDeltaGrams = 30;
    recommendationsAr.push("هدفك بناء عضلي والوزن ثابت رغم التزامك الممتاز؛ يعني الفائض الحراري انتهى. يُوصى بزيادة 125 سعرة يومياً (حوالي 30 جم كارب) لاستئناف زيادة هادئة 0.25-0.5% من وزن الجسم أسبوعياً.");
    recommendationsEn.push("Muscle-gain goal with stable weight under optimal adherence. Add +125 kcal (~30 g carbs) to resume a 0.25-0.5%/week gain.");
  }

  // RULE F: True Plateau (Weight & Waist stagnant under high adherence)
  else if (
    !isMuscleGainGoal &&
    !isWeightStableGoal &&
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

  // S3-7 Option C: when the chain stopped before RULE D (for example at
  // POOR_ADHERENCE), the rapid loss must still be visible in the
  // recommendations. RULE D already writes its own message, so this only
  // fires when the primary status is not RAPID_LOSS_WARNING. The calorie
  // delta is deliberately NOT changed here: the lock stays.
  if (isRapidLoss && analysisStatus !== CheckinAnalysisStatus.RAPID_LOSS_WARNING) {
    recommendationsAr.push("تنبيه: معدل النزول سريع (أكثر من 1.5% في أسبوع واحد) رغم ضعف الالتزام؛ الحالة تستوجب مراجعة الكوتش الفورية لتقصي سبب الهبوط السريع، والسعرات تظل مجمدة حتى المراجعة.");
    recommendationsEn.push("Alert: weight loss is rapid (>1.5% in one week) despite low adherence; this requires immediate coach review to find the cause, and calories stay locked until then.");
  }

  return Object.freeze({
    engine_version: CHECKIN_ENGINE_VERSION,
    analysis_status: analysisStatus,
    is_rapid_loss: isRapidLoss,
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
    training_locked: trainingLocked,
    emergency_directive_ar: emergencyDirectiveAr,
    emergency_directive_en: emergencyDirectiveEn,
    // Deep check-in v3: enriched output
    false_plateau_triad: Object.freeze({
      is_false_plateau: isFalsePlateau,
      score: falsePlateauScore,
      bowel_regularity,
      sleep_stress_composite,
      menstrual_phase,
    }),
    lifestyle_variance,
    occupational_neat_lock: isOccupationalNeatLock,
    forward_looking: Object.freeze({
      next_week_travel,
      next_week_gym_available,
      next_week_realistic_days,
    }),
    female_cycle_buffer: Object.freeze(femaleCycleBuffer),
  });
}


/**
 * Coach Daily Triage Cockpit & Capacity Engine
 *
 * Deterministic Client Triage Matrix:
 * 1. RED_FLAG (التدخل العاجل):
 *    - Pending weekly check-ins awaiting approval.
 *    - Reported joint pain / injury flags in workout logs.
 *    - Subscriptions expiring in <= 3 days.
 * 2. YELLOW_FLAG (المتابعة الاستباقية):
 *    - Inactive / no workout logs for >= 3 days.
 *    - Unexplained weight stall (> 2 weeks with high adherence).
 *    - Subscriptions expiring in 4-5 days.
 * 3. GREEN_FLAG (الملتزمون):
 *    - Active, compliant, on-track clients.
 *
 * Provides 1-Tap quick actions for each tier.
 */

export const TRIAGE_TIERS = {
  RED_FLAG: 'RED_FLAG',
  YELLOW_FLAG: 'YELLOW_FLAG',
  GREEN_FLAG: 'GREEN_FLAG'
};

export const QUICK_ACTIONS = {
  APPROVE_CHECKIN: 'APPROVE_CHECKIN',
  DISPATCH_WHATSAPP: 'DISPATCH_WHATSAPP',
  TRIGGER_DELOAD: 'TRIGGER_DELOAD',
  FREEZE_SUBSCRIPTION: 'FREEZE_SUBSCRIPTION',
  VIEW_PROFILE: 'VIEW_PROFILE',
  NO_ACTION: 'NO_ACTION'
};

/**
 * Evaluates a single client and assigns triage category with recommended quick action.
 */
export function evaluateClientTriageItem(client = {}) {
  const {
    id = '1',
    name = 'المشترك',
    has_pending_checkin = false,
    has_reported_pain = false,
    pain_joint = null,
    subscription_remaining_days = 30,
    days_remaining,
    days_since_last_workout = 0,
    is_weight_stalled = false,
    consecutive_stalls = 0,
    is_frozen = false,
    phone = '01011111110'
  } = client;

  const remainingDays = days_remaining !== undefined ? days_remaining : subscription_remaining_days;

  // 1. Red Flag Checks
  if (has_pending_checkin) {
    return {
      client_id: id,
      name,
      client_name: name,
      phone,
      tier: TRIAGE_TIERS.RED_FLAG,
      urgency: 'HIGH',
      badge_color: '#EF4444',
      badge_label_ar: 'متابعة بانتظار الاعتماد',
      badge_ar: 'متابعة معلقة',
      reason_ar: 'تم إرسال استمارة المتابعة الأسبوعية؛ بانتظار مراجعة الكوتش واعتماد الخطة.',
      primary_action: QUICK_ACTIONS.APPROVE_CHECKIN,
      primary_action_label_ar: 'مراجعة واعتماد',
      action_type: 'APPROVE_CHECKIN'
    };
  }

  if (has_reported_pain) {
    return {
      client_id: id,
      name,
      client_name: name,
      phone,
      tier: TRIAGE_TIERS.RED_FLAG,
      urgency: 'HIGH',
      badge_color: '#EF4444',
      badge_label_ar: 'ألم مفصلي مسجل',
      badge_ar: `ألم مفاصل (${pain_joint || 'عام'})`,
      reason_ar: `تم الإبلاغ عن ألم في مفصل (${pain_joint || 'عام'})؛ يُوصى ببدء بروتوكول تأهيل أو ديلود.`,
      primary_action: QUICK_ACTIONS.TRIGGER_DELOAD,
      primary_action_label_ar: 'تفعيل ديلود / تأهيل',
      action_type: 'TRIGGER_DELOAD'
    };
  }

  if (remainingDays <= 3 && !is_frozen) {
    return {
      client_id: id,
      name,
      client_name: name,
      phone,
      tier: TRIAGE_TIERS.RED_FLAG,
      urgency: 'HIGH',
      badge_color: '#EF4444',
      badge_label_ar: `اشتراك ينتهي (${remainingDays} يوم)`,
      badge_ar: `تجديد (${remainingDays} يوم)`,
      reason_ar: `الاشتراك شارف على الانتهاء (متبقي ${remainingDays} أيام)؛ يُوصى بالتواصل لتجديد الباقة.`,
      primary_action: QUICK_ACTIONS.DISPATCH_WHATSAPP,
      primary_action_label_ar: 'تذكير واتساب بالتجديد',
      action_type: 'RENEWAL_ALERT'
    };
  }

  // 2. Yellow Flag Checks
  if (days_since_last_workout >= 3 && !is_frozen) {
    return {
      client_id: id,
      name,
      client_name: name,
      phone,
      tier: TRIAGE_TIERS.YELLOW_FLAG,
      urgency: 'MEDIUM',
      badge_color: '#F59E0B',
      badge_label_ar: `غياب (${days_since_last_workout} أيام)`,
      badge_ar: 'غياب عن التمرين',
      reason_ar: `لم يتم تسجيل أي نشاط تدريبي منذ ${days_since_last_workout} أيام؛ يُوصى بالاطمئنان والتحفيز.`,
      primary_action: QUICK_ACTIONS.DISPATCH_WHATSAPP,
      primary_action_label_ar: 'رسالة تحفيزية',
      action_type: 'INACTIVITY_REENGAGEMENT'
    };
  }

  if (is_weight_stalled || consecutive_stalls >= 2) {
    return {
      client_id: id,
      name,
      client_name: name,
      phone,
      tier: TRIAGE_TIERS.YELLOW_FLAG,
      urgency: 'MEDIUM',
      badge_color: '#F59E0B',
      badge_label_ar: 'ثبات وزن > أسبوعين',
      badge_ar: 'ثبات وزن',
      reason_ar: 'ثبات الوزن لأكثر من أسبوعين متتاليين؛ يُوصى بتطبيق استراتيجية كسر الثبات.',
      primary_action: QUICK_ACTIONS.DISPATCH_WHATSAPP,
      primary_action_label_ar: 'مراجعة الخطة والكارب',
      action_type: 'PLATEAU_REVIEW'
    };
  }

  if (remainingDays <= 5 && !is_frozen) {
    return {
      client_id: id,
      name,
      client_name: name,
      phone,
      tier: TRIAGE_TIERS.YELLOW_FLAG,
      urgency: 'MEDIUM',
      badge_color: '#F59E0B',
      badge_label_ar: `رادار تجديد (${remainingDays} يوم)`,
      badge_ar: `تجديد قادم (${remainingDays} يوم)`,
      reason_ar: 'تنبيه مبكر لتجهيز مقعد التجديد للمشترك.',
      primary_action: QUICK_ACTIONS.DISPATCH_WHATSAPP,
      primary_action_label_ar: 'تجهيز مقعد التجديد',
      action_type: 'RADAR_RENEWAL_UPCOMING'
    };
  }

  // 3. Green Flag (On Track)
  return {
    client_id: id,
    name,
    client_name: name,
    phone,
    tier: TRIAGE_TIERS.GREEN_FLAG,
    urgency: 'LOW',
    badge_color: '#10B981',
    badge_label_ar: 'ملتزم في المسار',
    badge_ar: 'ملتزم',
    status_ar: is_frozen ? 'مجمد' : 'منتظم ومستقر',
    reason_ar: 'الالتزام والتقدم التدريبي والأيضي يسير بالشكل المثالي.',
    primary_action: QUICK_ACTIONS.VIEW_PROFILE,
    primary_action_label_ar: 'عرض الملف',
    action_type: 'NONE'
  };
}

/**
 * Follow-up triage thresholds (three-tier design, Phase 1 shadow mode).
 * Named constants in one place: changing a threshold is one documented
 * decision, never a hunt through the codebase.
 */
export const FOLLOW_UP_TRIAGE = Object.freeze({
  CLASSIFIER_VERSION: "follow-up-triage-v1",
  ADHERENCE_THRESHOLD_PERCENT: 80,
  RAPID_LOSS_THRESHOLD_PERCENT: -1.5,
  GREEN_MAX_CALORIE_DELTA_KCAL: 200,
  GREEN_MAX_STEPS_DELTA: 1000,
  FLAGGED_PAIN_LEVEL: 4,
  SAFETY_CALORIE_CORRECTION_KCAL: 150,
});

function triageFiniteNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function triageMaxPainLevel(candidates) {
  let max = null;
  for (const candidate of candidates) {
    const n = triageFiniteNumber(candidate);
    if (n !== null && (max === null || n > max)) max = n;
  }
  return max;
}

/**
 * classifyFollowUp — pure three-tier follow-up classifier (shadow mode).
 *
 * Decides NOTHING by itself in production yet: Phase 1 only stores the
 * result. It classifies one submitted check-in from composite signals, so
 * a single evaluateCheckin analysis_status can never hide a second signal
 * (poor adherence never masks rapid loss, cardiac, or injury).
 *
 * Safety-first ordering: clinical lockout / cardiac flag, then flagged
 * injury pain, then rapid loss, then repeated rapid loss / clinical alert /
 * medical review, then the yellow rules, then GREEN. Missing or unknown
 * safety signals (lockout / medical-review state not provided) can never
 * be GREEN: they fail closed to YELLOW.
 *
 * Signals input shape (all fields optional; absence means "not asserted",
 * except the safety fields, whose absence means "not checked"):
 * {
 *   analysis_status: string | null,
 *   analysis: {                       // evaluateCheckin output (analysis_output)
 *     weight_change_percent, adherence_tier, suggested_calorie_delta,
 *     suggested_steps_delta, biofeedback_alerts, flagged_pains,
 *     requires_coach_review, training_locked, clinical_alert,
 *     adaptive_tdee: { ready }, female_cycle_buffer: { deficit_adjustment_locked },
 *     occupational_neat_lock, is_deload_recommended,
 *     deload_recommendation: { recommended },
 *   },
 *   adherence_percent: number | null,
 *   weight_change_percent: number | null,  // direct measurement, wins over the analysis echo
 *   max_pain_level: number | null,
 *   flagged_pains: [{ pain_level | score | severity }],
 *   clinical_lockout: { locked: boolean, error?: boolean } | boolean | null,
 *   medical_review_required: boolean | null,  // null/undefined = unknown
 *   clinical_alert: object | null,
 *   previous_analysis_status: string | null,
 *   previous_rapid_loss: boolean,
 *   deficit_locked: boolean,           // PMS / false-plateau deficit lock
 *   safety_signals_unknown: boolean,
 *   withheld_stage: boolean,           // a WITHHELD stage in the stored active program
 *   proposed: {                        // asserted by the caller; Phase 2 must
 *     requires_coach_approval: boolean, // supply the buildAdaptedPlan result here
 *     calorie_delta: number | null,     // so a floor/ceiling clamp can never
 *     steps_delta: number | null,       // be silently absent from the decision
 *     floor_or_ceiling_clamp: boolean,
 *     alignment_conflict: boolean,
 *     exercise_substitution: boolean,  // training change beyond load progression
 *     diet_break_eligible: boolean,
 *   },
 * }
 *
 * Output (frozen): { classifier_version, tier: "GREEN" | "YELLOW" | "RED",
 *   reasons: [{ code, message_ar }], habit_nudge: boolean,
 *   safety_correction: null | { calorie_delta: 150 }, signals: {...} }.
 * safety_correction is recorded ONLY for the rapid-loss-only case
 * (R-SAFETY-1): rapid loss with no lockout, no cardiac flag, no injury, no
 * deficit lock, and no other red reason. It is a recorded intent, not an
 * application: Phase 1 never applies it. Rapid loss plus any other red
 * reason, or under a deficit lock, is RED with no correction.
 * Poor adherence alone with a maintain (zero-delta) proposal is GREEN with
 * habit_nudge=true, because nothing in the plan changes; poor adherence
 * plus any other signal, or plus a proposed change, is YELLOW (or RED when
 * a safety signal is present).
 */
export function classifyFollowUp(signals) {
  if (signals === undefined || signals === null) signals = {};
  if (typeof signals !== "object" || Array.isArray(signals)) {
    throw new TypeError("classifyFollowUp signals must be an object.");
  }
  const analysis =
    signals.analysis &&
    typeof signals.analysis === "object" &&
    !Array.isArray(signals.analysis)
      ? signals.analysis
      : {};
  const proposed =
    signals.proposed &&
    typeof signals.proposed === "object" &&
    !Array.isArray(signals.proposed)
      ? signals.proposed
      : {};

  const analysisStatus =
    typeof signals.analysis_status === "string"
      ? signals.analysis_status
      : typeof analysis.analysis_status === "string"
        ? analysis.analysis_status
        : null;

  // --- Derived signals -------------------------------------------------
  const weightChangePercent = triageFiniteNumber(
    signals.weight_change_percent ?? analysis.weight_change_percent,
  );
  const rapidLoss =
    weightChangePercent !== null
      ? weightChangePercent < FOLLOW_UP_TRIAGE.RAPID_LOSS_THRESHOLD_PERCENT
      : analysisStatus === "RAPID_LOSS_WARNING";

  const adherencePercent = triageFiniteNumber(
    signals.adherence_percent ?? analysis.adherence_percent,
  );
  const adherenceTier = signals.adherence_tier ?? analysis.adherence_tier;
  const poorAdherence =
    (adherencePercent !== null &&
      adherencePercent < FOLLOW_UP_TRIAGE.ADHERENCE_THRESHOLD_PERCENT) ||
    adherenceTier === "LOW" ||
    analysisStatus === "POOR_ADHERENCE";

  const flaggedPains = Array.isArray(signals.flagged_pains)
    ? signals.flagged_pains
    : Array.isArray(analysis.flagged_pains)
      ? analysis.flagged_pains
      : [];
  const maxPainLevel = triageMaxPainLevel([
    signals.max_pain_level,
    ...flaggedPains.map((p) => p?.pain_level ?? p?.score ?? p?.severity),
  ]);
  const injury =
    analysisStatus === "INJURY_FLAGGED" ||
    (maxPainLevel !== null && maxPainLevel >= FOLLOW_UP_TRIAGE.FLAGGED_PAIN_LEVEL);

  const alerts = Array.isArray(analysis.biofeedback_alerts)
    ? analysis.biofeedback_alerts
    : [];
  const cardiac =
    analysisStatus === "CRITICAL_CARDIAC_FLAG" ||
    analysis.training_locked === true ||
    alerts.includes("CARDIAC_RED_FLAG");

  const lockoutInput = signals.clinical_lockout;
  let lockoutLocked = false;
  let lockoutUnknown = false;
  if (lockoutInput === undefined || lockoutInput === null) {
    lockoutUnknown = true;
  } else if (typeof lockoutInput === "boolean") {
    lockoutLocked = lockoutInput;
  } else if (typeof lockoutInput === "object") {
    lockoutLocked = lockoutInput.locked === true;
  } else {
    lockoutUnknown = true;
  }

  const medicalInput = signals.medical_review_required;
  let medicalReview = false;
  let medicalUnknown = false;
  if (medicalInput === undefined || medicalInput === null) {
    medicalUnknown = true;
  } else {
    medicalReview = medicalInput === true;
  }
  const safetySignalsUnknown =
    signals.safety_signals_unknown === true || lockoutUnknown || medicalUnknown;

  const clinicalAlert = signals.clinical_alert ?? analysis.clinical_alert ?? null;
  const hasClinicalAlert =
    clinicalAlert !== null && clinicalAlert !== undefined && clinicalAlert !== false;

  const deficitLocked =
    signals.deficit_locked === true ||
    analysis.female_cycle_buffer?.deficit_adjustment_locked === true ||
    analysisStatus === "FEMALE_PMS_WATER_RETENTION";

  const previousStatus =
    typeof signals.previous_analysis_status === "string"
      ? signals.previous_analysis_status
      : null;
  const previousRapidLoss =
    signals.previous_rapid_loss === true || previousStatus === "RAPID_LOSS_WARNING";
  const repeatedRapidLoss = rapidLoss && previousRapidLoss;

  const calorieDelta =
    triageFiniteNumber(
      proposed.calorie_delta ?? analysis.suggested_calorie_delta ?? 0,
    ) ?? 0;
  const stepsDelta =
    triageFiniteNumber(
      proposed.steps_delta ?? analysis.suggested_steps_delta ?? 0,
    ) ?? 0;
  const requiresCoachApproval =
    proposed.requires_coach_approval === true ||
    analysis.requires_coach_review === true;
  const floorOrCeilingClamp = proposed.floor_or_ceiling_clamp === true;
  const alignmentConflict = proposed.alignment_conflict === true;
  const exerciseSubstitution = proposed.exercise_substitution === true;
  const dietBreakEligible = proposed.diet_break_eligible === true;
  const withheldStage = signals.withheld_stage === true;
  const deloadRecommended =
    signals.deload_recommended === true ||
    analysis.is_deload_recommended === true ||
    analysis.deload_recommendation?.recommended === true;
  const adaptiveTdeeReady = analysis.adaptive_tdee?.ready === true;
  const exceedsCap =
    Math.abs(calorieDelta) > FOLLOW_UP_TRIAGE.GREEN_MAX_CALORIE_DELTA_KCAL ||
    Math.abs(stepsDelta) > FOLLOW_UP_TRIAGE.GREEN_MAX_STEPS_DELTA;

  const reason = (code, message_ar) => Object.freeze({ code, message_ar });

  // --- RED: every red reason is collected, none is masked --------------
  const redReasons = [];
  if (lockoutLocked) {
    redReasons.push(
      reason(
        "CLINICAL_LOCKOUT_ACTIVE",
        "قفل سريري نشط؛ التدريب متوقف ويجب مراجعة الكوتش قبل أي نشاط.",
      ),
    );
  }
  if (cardiac) {
    redReasons.push(
      reason(
        "CARDIAC_RED_FLAG",
        "أعراض قلبية أو إغماء مرتبطة بالمجهود؛ التوقف الفوري ومراجعة طبية عاجلة.",
      ),
    );
  }
  if (injury) {
    redReasons.push(
      reason(
        "INJURY_FLAGGED",
        "ألم مفصلي مُعلَّم (مستوى 4 أو أكثر)؛ التمارين الضاغطة تحتاج قرار الكوتش.",
      ),
    );
  }
  if (hasClinicalAlert) {
    redReasons.push(
      reason(
        "CLINICAL_ALERT_PRESENT",
        "تنبيه سريري قائم على المتابعة؛ الحالة تحتاج مراجعة الكوتش الآن.",
      ),
    );
  }
  if (rapidLoss && medicalReview) {
    if (repeatedRapidLoss) {
      redReasons.push(
        reason(
          "REPEATED_RAPID_LOSS_MEDICAL_CLIENT",
          "نزول سريع للمتابعة الثانية على التوالي لمتدرب ملفه يستوجب مراجعة طبية.",
        ),
      );
    } else {
      redReasons.push(
        reason(
          "RAPID_LOSS_MEDICAL_REVIEW",
          "نزول سريع لمتدرب ملفه يستوجب مراجعة طبية؛ الحالة تحتاج مراجعة الكوتش الآن.",
        ),
      );
    }
  }

  // R-SAFETY-1: rapid loss alone (no other red reason, no deficit lock)
  // records the +150 kcal safety correction for later review. Any other
  // red reason, or a deficit lock, makes it RED with no correction.
  const rapidLossOnly = rapidLoss && redReasons.length === 0 && !deficitLocked;
  if (rapidLoss && !rapidLossOnly) {
    const alreadyCoveredByMedicalCode = redReasons.some((r) =>
      ["RAPID_LOSS_MEDICAL_REVIEW", "REPEATED_RAPID_LOSS_MEDICAL_CLIENT"].includes(r.code),
    );
    if (!alreadyCoveredByMedicalCode) {
      redReasons.push(
        reason(
          "RAPID_LOSS_WARNING",
          "معدل النزول سريع (أكثر من 1.5% أسبوعيًا) مع إشارة أخرى أو قفل عجز؛ لا تصحيح تلقائي.",
        ),
      );
    }
  }

  const signalsEcho = Object.freeze({
    analysis_status: analysisStatus,
    adherence_percent: adherencePercent,
    adherence_tier: adherenceTier ?? null,
    weight_change_percent: weightChangePercent,
    max_pain_level: maxPainLevel,
    clinical_lockout_locked: lockoutLocked,
    clinical_lockout_unknown: lockoutUnknown,
    medical_review_required: medicalReview,
    medical_review_unknown: medicalUnknown,
    safety_signals_unknown: safetySignalsUnknown,
    rapid_loss: rapidLoss,
    repeated_rapid_loss: repeatedRapidLoss,
    deficit_locked: deficitLocked,
    withheld_stage: withheldStage,
    requires_coach_approval: requiresCoachApproval,
    calorie_delta: calorieDelta,
    steps_delta: stepsDelta,
    floor_or_ceiling_clamp: floorOrCeilingClamp,
    alignment_conflict: alignmentConflict,
    exercise_substitution: exerciseSubstitution,
    diet_break_eligible: dietBreakEligible,
    deload_recommended: deloadRecommended,
    adaptive_tdee_ready: adaptiveTdeeReady,
    previous_analysis_status: previousStatus,
  });

  if (redReasons.length > 0) {
    return Object.freeze({
      classifier_version: FOLLOW_UP_TRIAGE.CLASSIFIER_VERSION,
      tier: "RED",
      reasons: Object.freeze(redReasons),
      habit_nudge: false,
      safety_correction: null,
      signals: signalsEcho,
    });
  }

  // --- YELLOW -----------------------------------------------------------
  const reasons = [];
  let safetyCorrection = null;
  if (rapidLossOnly) {
    reasons.push(
      reason(
        "RAPID_LOSS_SAFETY_CORRECTION",
        "معدل النزول سريع (أكثر من 1.5% أسبوعيًا) وحده؛ يُسجَّل تصحيح سلامة +150 سعرة للمراجعة.",
      ),
    );
    safetyCorrection = Object.freeze({
      calorie_delta: FOLLOW_UP_TRIAGE.SAFETY_CALORIE_CORRECTION_KCAL,
    });
  }
  if (safetySignalsUnknown) {
    reasons.push(
      reason(
        "SAFETY_SIGNALS_UNKNOWN",
        "حالة القفل السريري أو المراجعة الطبية غير معروفة؛ لا تصنيف أخضر قبل التحقق.",
      ),
    );
  }
  if (medicalReview) {
    reasons.push(
      reason(
        "MEDICAL_REVIEW_REQUIRED",
        "ملف المتدرب يستوجب مراجعة طبية؛ الحالة تحتاج عين الكوتش قبل أي تطبيق.",
      ),
    );
  }
  if (withheldStage) {
    reasons.push(
      reason(
        "WITHHELD_STAGE",
        "مرحلة محجوبة في الخطة النشطة المخزنة؛ لا تطبيق تلقائي على خطة محجوبة.",
      ),
    );
  }
  if (
    analysisStatus === "PLATEAU_DETECTED" ||
    analysisStatus === "TRUE_PLATEAU" ||
    analysisStatus === "CONFIRMED_PLATEAU"
  ) {
    reasons.push(
      reason(
        "PLATEAU_DETECTED",
        "ثبات في الوزن والخصر مع التزام؛ التعديل يحتاج مراجعة الكوتش.",
      ),
    );
  }
  if (analysisStatus === "FALSE_PLATEAU_DETECTED") {
    reasons.push(
      reason(
        "FALSE_PLATEAU_DETECTED",
        "الثبات ناتج عن احتباس سوائل مؤقت؛ السعرات مثبتة والمراقبة مستمرة.",
      ),
    );
  }
  if (
    analysisStatus === "OCCUPATIONAL_NEAT_LOCK" ||
    analysis.occupational_neat_lock === true
  ) {
    reasons.push(
      reason(
        "OCCUPATIONAL_NEAT_LOCK",
        "النشاط المنخفض طبيعة عمل مكتبي وليس تراجعًا؛ التثبيت والمراقبة لأسبوع إضافي.",
      ),
    );
  }
  if (deficitLocked) {
    reasons.push(
      reason(
        "PMS_DEFICIT_LOCK",
        "قفل خفض العجز (احتباس هرموني)؛ لا قرارات سعرات متسرعة من تغير وزن مؤقت.",
      ),
    );
  }
  if (
    analysisStatus === "HIGH_FATIGUE_WARNING" ||
    analysis.is_refeed_recommended === true
  ) {
    reasons.push(
      reason(
        "FATIGUE_REFEED_RECOMMENDED",
        "إجهاد مرتفع مع جوع؛ يوم إعادة شحن مقترح يحتاج مراجعة الكوتش.",
      ),
    );
  }
  if (analysisStatus === "GAIN_STALL") {
    reasons.push(
      reason(
        "GAIN_STALL",
        "هدف بناء عضلي والوزن ثابت رغم الالتزام؛ زيادة الطاقة المقترحة تحتاج مراجعة.",
      ),
    );
  }
  if (analysisStatus === "DELOAD_RECOMMENDED" || deloadRecommended) {
    reasons.push(
      reason(
        "DELOAD_RECOMMENDED",
        "توصية بأسبوع استشفاء (تخفيف حمل)؛ قرار الكوتش قبل التطبيق.",
      ),
    );
  }
  if (dietBreakEligible) {
    reasons.push(
      reason(
        "DIET_BREAK_ELIGIBLE",
        "أهلية استراحة دايت بعد التزام متصل؛ رفع السعرات للصيانة قرار الكوتش.",
      ),
    );
  }
  if (requiresCoachApproval) {
    reasons.push(
      reason(
        "REQUIRES_COACH_APPROVAL",
        "محرك التقييم أو التكييف طلب مراجعة الكوتش لهذه المتابعة.",
      ),
    );
  }
  if (floorOrCeilingClamp) {
    reasons.push(
      reason(
        "FLOOR_OR_CEILING_CLAMP",
        "التعديل المقترح اصطدم بالحد الأدنى أو السقف؛ لا تطبيق تلقائي عند الحدود.",
      ),
    );
  }
  if (alignmentConflict) {
    reasons.push(
      reason(
        "MACRO_ALIGNMENT_CONFLICT",
        "تعارض في ميزانية الماكروز؛ إعادة الموازنة تحتاج مراجعة الكوتش.",
      ),
    );
  }
  if (exerciseSubstitution) {
    reasons.push(
      reason(
        "EXERCISE_SUBSTITUTION",
        "تغيير في قائمة التمارين يتجاوز تقدم الأحمال؛ استبدال التمارين قرار الكوتش.",
      ),
    );
  }
  if (exceedsCap) {
    reasons.push(
      reason(
        "PROPOSED_CHANGE_EXCEEDS_GREEN_CAP",
        "حجم التغير المقترح فوق حد التطبيق التلقائي؛ يحتاج مراجعة الكوتش.",
      ),
    );
  }
  if (poorAdherence) {
    const proposedChange = calorieDelta !== 0 || stepsDelta !== 0;
    if (reasons.length > 0 || proposedChange) {
      reasons.push(
        reason(
          "POOR_ADHERENCE",
          "الالتزام أقل من الحد؛ التثبيت أو التعديل مع التزام ضعيف يحتاج مراجعة.",
        ),
      );
    }
  }

  // --- GREEN ------------------------------------------------------------
  if (reasons.length === 0) {
    if (poorAdherence) {
      // Poor adherence alone with a maintain proposal: nothing in the plan
      // changes, so it is GREEN with a habit nudge for the client.
      return Object.freeze({
        classifier_version: FOLLOW_UP_TRIAGE.CLASSIFIER_VERSION,
        tier: "GREEN",
        reasons: Object.freeze([
          reason(
            "POOR_ADHERENCE_MAINTAIN",
            "التزام ضعيف وحده مع تثبيت الخطة بلا تغير؛ تنبيه عادات للعميل دون تعديل.",
          ),
        ]),
        habit_nudge: true,
        safety_correction: null,
        signals: signalsEcho,
      });
    }
    return Object.freeze({
      classifier_version: FOLLOW_UP_TRIAGE.CLASSIFIER_VERSION,
      tier: "GREEN",
      reasons: Object.freeze([
        reason("ON_TRACK", "التقدم ضمن النطاق المتوقع وبلا إشارات تستدعي المراجعة."),
      ]),
      habit_nudge: false,
      safety_correction: null,
      signals: signalsEcho,
    });
  }

  return Object.freeze({
    classifier_version: FOLLOW_UP_TRIAGE.CLASSIFIER_VERSION,
    tier: "YELLOW",
    reasons: Object.freeze(reasons),
    habit_nudge: false,
    safety_correction: safetyCorrection,
    signals: signalsEcho,
  });
}

/**
 * Generates sorted daily coach triage lists.
 */
export function generateDailyCoachTriage(clientsList = []) {
  const list = Array.isArray(clientsList) ? clientsList : [];

  const redFlags = [];
  const yellowFlags = [];
  const greenFlags = [];

  for (const client of list) {
    const item = evaluateClientTriageItem(client);
    if (item.tier === TRIAGE_TIERS.RED_FLAG) {
      redFlags.push(item);
    } else if (item.tier === TRIAGE_TIERS.YELLOW_FLAG) {
      yellowFlags.push(item);
    } else {
      greenFlags.push(item);
    }
  }

  return {
    total_clients: list.length,
    counts: {
      red_flags: redFlags.length,
      yellow_flags: yellowFlags.length,
      green_flags: greenFlags.length
    },
    red_flag_queue: redFlags,
    yellow_flag_queue: yellowFlags,
    green_flag_queue: greenFlags,
    high_priority_queue: redFlags,
    medium_priority_queue: yellowFlags,
    routine_queue: greenFlags,
    total_actions_needed: redFlags.length + yellowFlags.length,
    summary_ar: `لوحة فرز الكوتش: ${redFlags.length} عاجل | ${yellowFlags.length} استباقي | ${greenFlags.length} ملتزم`
  };
}

/**
 * تقييم سعة الاستيعاب للكوتش لتفادي هبوط جودة المتابعة (Coach Capacity & Bandwidth)
 */
export function evaluateCoachCapacity({
  activeClientsCount = 0,
  maxCapacityCap = 50,
  pendingCheckinsCount = 0
}) {
  if (maxCapacityCap <= 0) {
    throw new Error('maxCapacityCap must be greater than zero.');
  }

  const utilizationRatePct = Math.round((activeClientsCount / maxCapacityCap) * 100);
  const remainingSlots = Math.max(0, maxCapacityCap - activeClientsCount);

  let status = 'OPTIMAL_CAPACITY';
  let canAcceptNewClients = true;
  let alertSeverity = 'NORMAL';
  let message_ar = `السعة ممتازة: لديك ${remainingSlots} مقعد شاغر لاستقبال مشتركين جدد.`;

  if (activeClientsCount >= maxCapacityCap) {
    status = 'CAPACITY_REACHED';
    canAcceptNewClients = false;
    alertSeverity = 'CRITICAL';
    message_ar = 'تم بلوغ السعة القصوى! يُنصح بإيقاف الاشتراكات الجديدة أو فتح قائمة انتظار (Waitlist) للحفاظ على جودة المتابعة.';
  } else if (utilizationRatePct >= 85) {
    status = 'NEAR_CAPACITY';
    alertSeverity = 'WARNING';
    message_ar = `أوشكت السعة على الامتلاء (${utilizationRatePct}%). متبقي ${remainingSlots} مقاعد فقط.`;
  }

  const estimatedTriageMinutes = pendingCheckinsCount * 4;

  return {
    active_clients_count: activeClientsCount,
    max_capacity_cap: maxCapacityCap,
    remaining_slots: remainingSlots,
    utilization_rate_pct: utilizationRatePct,
    can_accept_new_clients: canAcceptNewClients,
    status,
    alert_severity: alertSeverity,
    pending_checkins_count: pendingCheckinsCount,
    estimated_daily_triage_minutes: estimatedTriageMinutes,
    message_ar
  };
}

/**
 * حساب مؤشرات استبقاء المشتركين ومعدل التجديد والانسحاب (Retention & Churn Analytics)
 */
export function calculateRetentionAndChurn({
  startPeriodClientsCount = 0,
  renewedClientsCount = 0,
  churnedClientsCount = 0,
  newClientsCount = 0,
  averageSubscriptionPrice = 0
}) {
  const eligibleForRenewal = renewedClientsCount + churnedClientsCount;
  
  const renewalRatePct = eligibleForRenewal > 0
    ? Math.round((renewedClientsCount / eligibleForRenewal) * 100)
    : 100;

  const churnRatePct = 100 - renewalRatePct;

  const estimatedLifetimeMonths = churnRatePct > 0
    ? +((100 / churnRatePct)).toFixed(1)
    : 12.0;

  const customerLifetimeValue = Math.round(estimatedLifetimeMonths * averageSubscriptionPrice);

  const totalActiveEnd = (startPeriodClientsCount - churnedClientsCount) + newClientsCount;
  const estimatedMRR = totalActiveEnd * averageSubscriptionPrice;

  return {
    active_clients_total: totalActiveEnd,
    renewal_rate_pct: renewalRatePct,
    churn_rate_pct: churnRatePct,
    estimated_lifetime_months: estimatedLifetimeMonths,
    customer_lifetime_value: customerLifetimeValue,
    estimated_mrr: estimatedMRR,
    health_rating: renewalRatePct >= 80 ? 'EXCELLENT' : renewalRatePct >= 60 ? 'HEALTHY' : 'NEEDS_RETENTION_BOOST'
  };
}

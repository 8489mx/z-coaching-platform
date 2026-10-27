/**
 * AMPK-mTOR Cardio Interference Decoupling Engine
 *
 * 1. Cardio-Lift Timing Guard:
 *    - Separates heavy resistance training from high-intensity cardio by >= 6 hours (or separate days)
 *      to avoid AMPK-mediated dephosphorylation of mTORC1.
 * 2. Zone 2 Polarized Prescription:
 *    - Directs aerobic work to Zone 2 (60% - 70% Max HR via Tanaka 208 - 0.7 * age) for mitochondrial biogenesis without muscle catabolism.
 * 3. Leg-Day Interference Shield:
 *    - Guards against combining heavy compound leg training with high-intensity HIIT.
 * 4. NEAT Step Targets:
 *    - Recommends activity-specific daily step goals to support fat loss without systemic fatigue.
 */

export const CARDIO_INTENSITIES = {
  ZONE_2_STEADY_STATE: 'ZONE_2_STEADY_STATE',
  HIGH_INTENSITY_HIIT: 'HIGH_INTENSITY_HIIT',
  MODERATE_AEROBIC: 'MODERATE_AEROBIC'
};

/**
 * Calculates heart rate zones based on Tanaka formula (208 - 0.7 * age) with Zone 2 boundaries (60% - 70%).
 * Does NOT fabricate a silent age default when age is missing.
 */
export function calculateHeartRateZones(age) {
  const numericAge = Number(age);
  if (age === undefined || age === null || age === '' || !Number.isFinite(numericAge) || numericAge <= 0) {
    return {
      age: null,
      max_heart_rate_bpm: null,
      zone_2_target: {
        min_bpm: null,
        max_bpm: null,
        range_display: null,
        missing_age: true,
        description_ar: 'يرجى تحديد عمر المتدرب في ملفه الشخصي لحساب نطاق نبض القلب بدقة وفق معادلة Tanaka'
      }
    };
  }

  const safeAge = Math.max(16, Math.min(80, Math.round(numericAge)));
  const maxHr = Math.round(208 - 0.7 * safeAge);

  const zone2Min = Math.round(maxHr * 0.6);
  const zone2Max = Math.round(maxHr * 0.7);

  return {
    age: safeAge,
    max_heart_rate_bpm: maxHr,
    zone_2_target: {
      min_bpm: zone2Min,
      max_bpm: zone2Max,
      range_display: `${zone2Min} - ${zone2Max} نبضة/دقيقة`,
      missing_age: false,
      description_ar: 'نطاق تنقية اللاكتات وزيادة كفاءة الميتوكوندريا دون إفراز كورتيزول مفرط'
    }
  };
}

/**
 * Evaluates cardio timing to decouple AMPK-mTOR molecular interference.
 */
export function evaluateCardioInterferenceDecoupling({
  age,
  cardio_type = CARDIO_INTENSITIES.ZONE_2_STEADY_STATE,
  resistance_session_time = "17:00",
  cardio_session_time = "18:00",
  is_same_day = true
} = {}) {
  const hrZones = calculateHeartRateZones(age);

  if (!is_same_day) {
    return {
      is_decoupled: true,
      has_interference_risk: false,
      recommended_gap_hours: 0,
      heart_rate_prescription: hrZones.zone_2_target,
      timing_verdict_ar: 'جدولة مثالية في يوم منفصل تماماً عن تمارين المقاومة؛ أقصى تفعيل للـ mTOR وبناء العضلات.'
    };
  }

  // Parse time difference
  const rParts = String(resistance_session_time || "17:00").split(":");
  const cParts = String(cardio_session_time || "18:00").split(":");
  const rHour = parseInt(rParts[0], 10);
  const cHour = parseInt(cParts[0], 10);
  const hourDiff = Math.abs(cHour - rHour);

  const isHiit = cardio_type === CARDIO_INTENSITIES.HIGH_INTENSITY_HIIT;
  const isInterferenceRisk = isHiit && hourDiff < 6;

  let verdictAr = '';
  if (isInterferenceRisk) {
    verdictAr = 'تنبيه: ممارسة الكارديو عالي الشدة (HIIT) في نفس وقت تمارين المقاومة يثبط إشارة البناء العضلي (AMPK Overactivation)؛ يُلزم الفصل بـ 6 ساعات على الأقل أو استبداله بـ Zone 2.';
  } else if (hourDiff < 2 && cardio_type === CARDIO_INTENSITIES.ZONE_2_STEADY_STATE) {
    verdictAr = 'مسموح: كارديو منخفض الشدة (Zone 2) بعد التمرين مباشرة أو قبله بفاصل خفيف دون أي تأثير سلبي على البناء العضلي.';
  } else {
    verdictAr = `فارق زمني كافٍ (${hourDiff} ساعات) بين تمرين الحديد والكارديو لضمان الفصل الجزيئي التام.`;
  }

  return {
    is_decoupled: !isInterferenceRisk,
    has_interference_risk: isInterferenceRisk,
    hour_gap_detected: hourDiff,
    min_required_gap_for_hiit_hours: 6,
    heart_rate_prescription: hrZones.zone_2_target,
    timing_verdict_ar: verdictAr
  };
}

const LEG_WORKOUT_REGEX = /SQUAT|LEG_PRESS|DEADLIFT|LUNGE|HACK|ROMANIAN|HAMSTRING|QUAD|CALF|GLUTE|أرجل|سكوات|رجل|فخذ|سمانة/i;

/**
 * Evaluates cardio conflict with lower body (Leg Day) workouts.
 * Heavy compound leg work combined with high-intensity HIIT causes severe residual neuromuscular fatigue.
 */
export function evaluateLegDayCardioConflict({
  cardio_type = CARDIO_INTENSITIES.ZONE_2_STEADY_STATE,
  session_exercises = [],
  is_same_day = false
} = {}) {
  if (!is_same_day || !Array.isArray(session_exercises) || session_exercises.length === 0) {
    return {
      has_leg_day_conflict: false,
      conflict_reason: null,
      guidance_ar: 'لا يوجد تداخل حركي مباشر مع تمارين الأرجل.'
    };
  }

  const hasHeavyLegWork = session_exercises.some((ex) => {
    const code = String(ex?.code || ex?.exercise_code || ex?.id || '');
    const name = String(ex?.name || ex?.name_ar || ex?.name_en || '');
    const muscle = String(ex?.target_muscle || ex?.muscle || ex?.primary_muscle || '');
    return LEG_WORKOUT_REGEX.test(code) || LEG_WORKOUT_REGEX.test(name) || LEG_WORKOUT_REGEX.test(muscle);
  });

  const isHiit = cardio_type === CARDIO_INTENSITIES.HIGH_INTENSITY_HIIT || String(cardio_type).toUpperCase().includes('HIIT');

  if (hasHeavyLegWork && isHiit) {
    return {
      has_leg_day_conflict: true,
      conflict_reason: 'HIIT_ON_LEG_DAY',
      guidance_ar: 'تحذير تداخل تدريبي: ممارسة كارديو الفترات عالي الشدة (HIIT) في نفس يوم تمرين الأرجل يضاعف الإجهاد العصبي المركزي ويعيق الاستشفاء العضلي الموضعي؛ يُلزم حصر الكارديو في المشي الاستشفائي الخفيف (Zone 2) أو فصل الـ HIIT بـ 24 ساعة على الأقل.'
    };
  }

  return {
    has_leg_day_conflict: false,
    conflict_reason: null,
    guidance_ar: hasHeavyLegWork
      ? 'مسموح: كارديو المشي المعتدل (Zone 2) بعد تمرين الأرجل ينشط الدورة الدموية ويعزز الاستشفاء دون إجهاد المفصل.'
      : 'لا يوجد تداخل بين جلسة الكارديو وتمارين الجزء السفلي.'
  };
}

/**
 * Resolves evidence-based daily NEAT step targets based on occupation and baseline activity.
 */
export function resolveNeatStepTarget({
  neat_level = 'moderate',
  goal = 'fat_loss',
  occupation = 'DESK_OFFICE'
} = {}) {
  const normNeat = String(neat_level || '').toLowerCase();
  const normOcc = String(occupation || '').toUpperCase();
  const isDesk = normOcc.includes('DESK') || normOcc.includes('SEDENTARY') || normNeat.includes('sedentary');

  if (isDesk) {
    return {
      min_steps: 8000,
      max_steps: 10000,
      range_display: '8,000 - 10,000 خطوة/اليوم',
      recommendation_ar: 'الحد الأدنى لكسر خمول العمل المكتبي وتنشيط الأيض اليومي (NEAT) دون إجهاد عصبي.'
    };
  }

  if (normNeat.includes('high') || normOcc.includes('ACTIVE') || normOcc.includes('STANDING')) {
    return {
      min_steps: 10000,
      max_steps: 12000,
      range_display: '10,000 - 12,000 خطوة/اليوم',
      recommendation_ar: 'مستوى نشاط بدني ممتاز؛ يُراعى عدم المبالغة فوق 14,000 خطوة لتجنب تثبيط الاستشفاء العضلي.'
    };
  }

  return {
    min_steps: 8500,
    max_steps: 10500,
    range_display: '8,500 - 10,500 خطوة/اليوم',
    recommendation_ar: 'معدل حركي متوازن ومثالي لدعم العجز الحراري وحرق الدهون.'
  };
}

/**
 * AMPK-mTOR Cardio Interference Decoupling Engine
 *
 * 1. Cardio-Lift Timing Guard:
 *    - Separates heavy resistance training from high-intensity cardio by >= 6 hours (or separate days)
 *      to avoid AMPK-mediated dephosphorylation of mTORC1.
 * 2. Zone 2 Polarized Prescription:
 *    - Directs aerobic work to Zone 2 (65% - 75% Max HR) for mitochondrial biogenesis without muscle catabolism.
 */

export const CARDIO_INTENSITIES = {
  ZONE_2_STEADY_STATE: 'ZONE_2_STEADY_STATE',
  HIGH_INTENSITY_HIIT: 'HIGH_INTENSITY_HIIT',
  MODERATE_AEROBIC: 'MODERATE_AEROBIC'
};

/**
 * Calculates heart rate zones based on Fox formula (220 - age) with Zone 2 boundaries.
 */
export function calculateHeartRateZones(age = 28) {
  const safeAge = Math.max(16, Math.min(80, Number(age) || 28));
  const maxHr = 220 - safeAge;

  const zone2Min = Math.round(maxHr * 0.65);
  const zone2Max = Math.round(maxHr * 0.75);

  return {
    age: safeAge,
    max_heart_rate_bpm: maxHr,
    zone_2_target: {
      min_bpm: zone2Min,
      max_bpm: zone2Max,
      range_display: `${zone2Min} - ${zone2Max} نبضة/دقيقة`,
      description_ar: 'نطاق تنقية اللاكتات وزيادة كفاءة الميتوكوندريا دون إفراز كورتيزول مفرط'
    }
  };
}

/**
 * Evaluates cardio timing to decouple AMPK-mTOR molecular interference.
 */
export function evaluateCardioInterferenceDecoupling({
  age = 28,
  cardio_type = CARDIO_INTENSITIES.ZONE_2_STEADY_STATE,
  resistance_session_time = "17:00",
  cardio_session_time = "18:00",
  is_same_day = true
}) {
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

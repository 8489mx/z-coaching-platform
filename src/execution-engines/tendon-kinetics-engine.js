/**
 * Targeted Tendon & Collagen Kinetics Engine
 *
 * 1. Pre-Loading Collagen Timing:
 *    - For clients with tendinopathy/joint discomfort: schedules 15g Hydrolyzed Collagen + 500mg Vitamin C
 *      45 - 60 minutes prior to session to coincide peak plasma amino acid concentration with tendon loading.
 * 2. Isometric Pre-Exhaustion & Analgesia:
 *    - Prescribes isometric holds (5 sets x 45s holds at 70% MVC) at start of session for tendon stiffness & cortical inhibition / pain relief.
 */

export const TENDON_LOCATIONS = {
  PATELLAR_KNEE: 'PATELLAR_KNEE',
  ACHILLES_ANKLE: 'ACHILLES_ANKLE',
  ROTATOR_CUFF_SHOULDER: 'ROTATOR_CUFF_SHOULDER',
  ELBOW_EPICONDYLITIS: 'ELBOW_EPICONDYLITIS'
};

export const ISOMETRIC_PROTOCOLS = {
  [TENDON_LOCATIONS.PATELLAR_KNEE]: {
    exercise_name: 'Spanish Squat / Leg Extension Isometric Hold',
    sets: 5,
    hold_duration_seconds: 45,
    rest_between_sets_seconds: 60,
    joint_angle_degrees: '60 degrees knee flexion',
    biomechanical_purpose_ar: 'تثبيط الألم القشري وتسكين وتر الرضفة قبل التمرين'
  },
  [TENDON_LOCATIONS.ACHILLES_ANKLE]: {
    exercise_name: 'Single-Leg Isometric Calf Raise Hold',
    sets: 5,
    hold_duration_seconds: 45,
    rest_between_sets_seconds: 60,
    joint_angle_degrees: 'Mid-range ankle dorsiflexion',
    biomechanical_purpose_ar: 'زيادة صلابة وتر أخيل وتحسين امتصاص الصدمات'
  },
  [TENDON_LOCATIONS.ROTATOR_CUFF_SHOULDER]: {
    exercise_name: 'External Rotation Isometric Cable Hold',
    sets: 4,
    hold_duration_seconds: 40,
    rest_between_sets_seconds: 45,
    joint_angle_degrees: 'Neutral shoulder with towel roll',
    biomechanical_purpose_ar: 'تنشيط عضلات الكفة المدورة وتسكين مفصل الكتف'
  },
  [TENDON_LOCATIONS.ELBOW_EPICONDYLITIS]: {
    exercise_name: 'Wrist Extension / Flexion Isometric Hold',
    sets: 4,
    hold_duration_seconds: 45,
    rest_between_sets_seconds: 45,
    joint_angle_degrees: 'Pronated / Supinated neutral wrist',
    biomechanical_purpose_ar: 'تقوية أوتار الكوع وعلاج التهاب وتر الجولف/التنس'
  }
};

/**
 * Generates targeted tendon & collagen kinetics protocol.
 */
export function generateTendonRehabProtocol({
  tendon_injury_location = TENDON_LOCATIONS.PATELLAR_KNEE,
  session_start_time = "17:00"
}) {
  const location = String(tendon_injury_location || TENDON_LOCATIONS.PATELLAR_KNEE).toUpperCase();
  const isometricPlan = ISOMETRIC_PROTOCOLS[location] || ISOMETRIC_PROTOCOLS[TENDON_LOCATIONS.PATELLAR_KNEE];

  // Calculate collagen ingestion time (45-60 min before session)
  const parts = String(session_start_time || "17:00").split(":");
  let hour = parseInt(parts[0], 10);
  let min = parseInt(parts[1], 10);

  let collagenMinute = min - 45;
  let collagenHour = hour;
  if (collagenMinute < 0) {
    collagenMinute = 60 + collagenMinute;
    collagenHour = (hour - 1 + 24) % 24;
  }

  const timingFormatted = `${String(collagenHour).padStart(2, '0')}:${String(collagenMinute).padStart(2, '0')}`;

  return {
    tendon_location: location,
    collagen_supplementation_timing: {
      target_time_24h: timingFormatted,
      recommended_timing_display_ar: `الساعة ${timingFormatted} (قبل التمرين بـ 45-60 دقيقة)`,
      supplement_prescription: '15g Hydrolyzed Collagen Peptides + 500mg Vitamin C',
      pharmacokinetic_rationale_ar: 'تزامن ذروة تركيز الأحماض الأمينية (برولين وجلايسين) في مجرى الدم مع تدفق السائل الزليلي للأوتار أثناء التحميل الحركي.'
    },
    isometric_pre_exhaustion_protocol: {
      ...isometricPlan,
      execution_timing_ar: 'في بداية الحصة التدريبية مباشرة قبل أي تمارين مركبة'
    },
    scientific_summary_ar: 'بروتوكول تسكين الأوتار وإعادة بناء الكولاجين المستهدف (Targeted Tendon Kinetics) لتسريع الشفاء بنسبة 100% دون التوقف عن التدريب.'
  };
}

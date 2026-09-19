/**
 * Practical Talk-Test Cardio Engine (محرك الكارديو السلوكي العملي)
 *
 * Eliminates complex/unrealistic heart-rate monitoring in favor of robust,
 * evidence-based behavioral biofeedback (The Talk Test Protocol):
 *
 *   - LISS_TALK_TEST (Zone 2 / Steady State): Moderate aerobic effort where you can speak full sentences.
 *   - HIIT_INTERVALS (High Intensity): 30s max effort sprint followed by 90s active recovery (1:3 ratio).
 *   - RECOVERY_WALK (Daily NEAT): 8,000 - 10,000 steps for fat loss and metabolic recovery without CNS strain.
 *
 * Single source of truth: src/execution-engines/cardio-zones-engine.js re-exports this module.
 */

export const CARDIO_TYPES = {
  LISS_TALK_TEST: 'LISS_TALK_TEST',
  HIIT_INTERVALS: 'HIIT_INTERVALS',
  RECOVERY_WALK: 'RECOVERY_WALK'
};

export const CARDIO_EQUIPMENT = {
  INCLINE_TREADMILL: 'مشاية بميل (Incline Treadmill)',
  OUTDOOR_BRISK_WALK: 'مشي سريع في الهواء الطلق (Outdoor Brisk Walk)',
  STATIONARY_BIKE: 'دراجة ثابتة (Stationary Bike)',
  ELLIPTICAL: 'جهاز الغزال الطائر (Elliptical Trainer)',
  ROWER: 'جهاز التجديف (Rowing Machine)'
};

// Mirrors CLINICAL_GUIDELINES.RESPIRATORY.SAFETY_GUIDANCE_AR in src/config/clinical-guidelines.js
// (kept inline because the Vite dev server cannot serve files outside frontend/; equality is
// enforced by test/engine-copy-drift-guard.test.js).
export const ASTHMA_CARDIO_SAFETY_GUIDANCE_AR = "توجيه سريري لمرضى الربو والجهاز التنفسي: حصر الكارديو في النطاق المعتدل المستقر (Zone 2) مع إحماء تدريجي، وحظر الكارديو عالي الشدة (HIIT) لتجنب نوبات ضيق التنفس التحسسية (EIB).";

const RESPIRATORY_PATTERN = /ASTHMA|RESPIRATORY|ربو|تنفسي/i;
const CARDIOVASCULAR_PATTERN = /HEART|CARDIAC|CARDIOVASCULAR|HYPERTENSION|HIGH_BLOOD_PRESSURE|ARRHYTHM|قلب|ضغط الدم|ضغط دم/i;
const PREGNANCY_PATTERN = /PREGNAN|حامل/i;
const LOWER_LIMB_OR_SPINE_PATTERN = /KNEE|ANKLE|ACHILLES|HIP|LOWER_BACK|LUMBAR|DISC|SPINE|MENISC|ACL|PATELL|ركبة|كاحل|حوض|ظهر|غضروف/i;

export const HIIT_CLINICAL_GUIDANCE_AR = Object.freeze({
  CARDIOVASCULAR: "توجيه سريري لمرضى الضغط والقلب: تم استبدال الـ HIIT بكارديو معتدل مستقر (Zone 2)؛ الفترات عالية الشدة تحتاج تصريحاً من الطبيب المعالج واختبار جهد قبل إدراجها.",
  PREGNANCY: "توجيه سريري للحمل: تم استبدال الـ HIIT بنشاط هوائي معتدل يسمح بالكلام (ACOG)، مع تجنب القفز والسبرنت والإجهاد الحراري.",
  SEVERE_OBESITY: "توجيه أمان للمفاصل: مع مؤشر كتلة جسم 35 أو أكثر يبدأ البرنامج بكارديو معتدل منخفض الصدمات لحماية الركبتين والكاحلين، ويُعاد تقييم الفترات عالية الشدة مع نزول الوزن.",
  LOW_IMPACT_HIIT: "توجيه أمان للمفاصل: الفترات عالية الشدة تُنفذ على دراجة ثابتة أو جهاز تجديف فقط (بدون جري أو سبرنت على المشاية) لإلغاء صدمة الارتطام على الركبة والكاحل والظهر.",
});

function resolveBmi(weightKg, heightCm) {
  const w = Number(weightKg);
  const h = Number(heightCm) / 100;
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;
  return Math.round((w / (h * h)) * 10) / 10;
}

export function getPracticalCardioPrescription({
  type = CARDIO_TYPES.LISS_TALK_TEST,
  duration_minutes = 25,
  sessions_per_week = 3,
  equipment = CARDIO_EQUIPMENT.INCLINE_TREADMILL,
  medicalConditions = [],
  weight_kg = null,
  height_cm = null
}) {
  const conds = (Array.isArray(medicalConditions) ? medicalConditions : [medicalConditions])
    .map(c => typeof c === 'string' ? c : String(c?.conditionCode || c?.code || c?.name || c?.area || ''));

  const hasAsthma = conds.some(c => RESPIRATORY_PATTERN.test(c));
  const hasCardiovascular = conds.some(c => CARDIOVASCULAR_PATTERN.test(c));
  const isPregnant = conds.some(c => PREGNANCY_PATTERN.test(c));
  const hasLowerLimbOrSpineIssue = conds.some(c => LOWER_LIMB_OR_SPINE_PATTERN.test(c));
  const bmi = resolveBmi(weight_kg, height_cm);

  let resolvedType = String(type).toUpperCase();
  let asthmaClinicalNote = null;
  let hiitBanReason = null;
  const requestedHiit = resolvedType === CARDIO_TYPES.HIIT_INTERVALS || resolvedType.includes('HIIT');

  // GINA Clinical Guideline: Restrict HIIT for asthma / respiratory conditions
  if (hasAsthma && requestedHiit) {
    resolvedType = CARDIO_TYPES.LISS_TALK_TEST;
    asthmaClinicalNote = ASTHMA_CARDIO_SAFETY_GUIDANCE_AR;
    hiitBanReason = 'RESPIRATORY';
  } else if (requestedHiit && (hasCardiovascular || isPregnant || (bmi !== null && bmi >= 35))) {
    // ACSM pre-participation screening: vigorous work needs medical clearance with cardiovascular
    // disease; ACOG: moderate aerobic work in pregnancy; BMI >= 35: start low-impact and moderate.
    resolvedType = CARDIO_TYPES.LISS_TALK_TEST;
    hiitBanReason = hasCardiovascular ? 'CARDIOVASCULAR' : isPregnant ? 'PREGNANCY' : 'SEVERE_OBESITY';
  }

  // Sprinting loads the knee, ankle and spine with several times bodyweight per stride; above BMI 30 or
  // with a lower-limb or spine issue, intervals move to a non-impact machine.
  const impactRestricted = hasLowerLimbOrSpineIssue || (bmi !== null && bmi >= 30);

  const clinicalGuardrails = {
    asthma_hiit_banned: Boolean(hasAsthma),
    hiit_banned: hiitBanReason !== null,
    hiit_ban_reason: hiitBanReason,
    impact_restricted: impactRestricted,
    bmi,
    preferred_modality: (hasAsthma || hiitBanReason !== null) ? 'LISS_TALK_TEST' : null,
  };

  const upperType = resolvedType;

  if (upperType === CARDIO_TYPES.HIIT_INTERVALS || upperType.includes('HIIT')) {
    return {
      type: CARDIO_TYPES.HIIT_INTERVALS,
      protocol_title_ar: impactRestricted
        ? 'تدريب فترات عالي الكثافة على جهاز بدون صدمات (Low-Impact HIIT)'
        : 'تدريب فترات عالي الكثافة (HIIT Interval Protocol)',
      protocol_title_en: impactRestricted ? 'Low-Impact High-Intensity Interval Training' : 'High-Intensity Interval Training (HIIT)',
      duration_minutes: 15,
      sessions_per_week: Math.min(2, sessions_per_week),
      talk_test_cue_ar: impactRestricted
        ? 'جهد هوائي حرج؛ لا يمكنك التحدث أثناء فترات التبديل السريع (30 ثانية أقصى مجهود تليها 90 ثانية تبديل هادئ بمقاومة خفيفة).'
        : 'جهد هوائي حرج؛ لا يمكنك التحدث أثناء فترات السبرنت (30 ثانية أقصى مجهود 100% تليها 90 ثانية مشي هادئ 40%).',
      execution_breakdown_ar: impactRestricted
        ? [
          'إحماء هادئ لمدة 3 دقائق على الدراجة.',
          '6 إلى 8 جولات: (30 ثانية تبديل بأقصى مجهود بمقاومة متوسطة + 90 ثانية تبديل هادئ لاستعادة النفس).',
          'تبريد واستشفاء لمدة دقيقتين.'
        ]
        : [
          'إحماء هادئ لمدة 3 دقائق.',
          '6 إلى 8 جولات: (30 ثانية سبرنت أقصى سرعة + 90 ثانية مشي لاستعادة النفس).',
          'تبريد واستشفاء لمدة دقيقتين.'
        ],
      fat_oxidation_rationale_ar: 'رفع معدل الاستهلاك الأكسجيني اللاحق للتمرين (EPOC) وتحفيز حرق الدهون في وقت قصير.',
      equipment_recommendation: impactRestricted ? CARDIO_EQUIPMENT.STATIONARY_BIKE : equipment,
      clinical_guidance_ar: impactRestricted ? HIIT_CLINICAL_GUIDANCE_AR.LOW_IMPACT_HIIT : null,
      clinical_guardrails: clinicalGuardrails
    };
  }

  if (upperType === CARDIO_TYPES.RECOVERY_WALK || upperType.includes('WALK')) {
    return {
      type: CARDIO_TYPES.RECOVERY_WALK,
      protocol_title_ar: 'المشي الاستشفائي اليومي وحرق النشاط الحر (Daily NEAT)',
      protocol_title_en: 'Daily NEAT Recovery Walk',
      daily_steps_target: '8,000 إلى 10,000 خطوة يومياً',
      talk_test_cue_ar: 'تنفس طبيعي تماماً مع قدرة على التحدث دون أي نهجان (مجهود هوائي خفيف جداً).',
      execution_breakdown_ar: [
        'توزيع الخطوات على مدار اليوم (مشي 15 دقيقة بعد الوجبات الرئيسية).',
        'استخدام السلالم بدلاً من المصعد وتفضيل المشي للمشاوير القريبة.'
      ],
      fat_oxidation_rationale_ar: 'حرق دهون صافي وتحسين حساسية الإنسولين دون إفراز هرمونات توتر أو إرهاق الجهاز العصبي.',
      equipment_recommendation: 'مشي حر في أي مكان'
    };
  }

  // Default LISS Talk-Test (Zone 2)
  return {
    type: CARDIO_TYPES.LISS_TALK_TEST,
    protocol_title_ar: 'كارديو منخفض الشدة باختبار التحدث (LISS - Talk Test Protocol)',
    protocol_title_en: 'Low-Intensity Steady-State (LISS / Zone 2)',
    duration_minutes: duration_minutes,
    sessions_per_week: sessions_per_week,
    talk_test_cue_ar: 'مجهود هوائي معتدل (Zone 2) يسمح لك بالتحدث بجمل كاملة دون نهجان حاد أو انقطاع النفس.',
    suggested_settings_ar: 'مشاية بميل Incline 8% إلى 12% على سرعة 4.0 إلى 5.0 كم/س، أو دراجة بمقاومة خفيفة.',
    execution_breakdown_ar: [
      `الحفاظ على سرعة ثابتة ومريحة لمدة ${duration_minutes} دقيقة متواصلة.`,
      'التأكد المستمر من القدرة على التحدث بجملة كاملة دون توقف لالتقاط النفس.'
    ],
    fat_oxidation_rationale_ar: 'أقصى كفاءة لأكسدة الدهون كوقود أساسي وتنشيط الميتوكوندريا دون أي تداخل مع استشفاء العضلات.',
    equipment_recommendation: equipment,
    clinical_guidance_ar: asthmaClinicalNote || (hiitBanReason ? HIIT_CLINICAL_GUIDANCE_AR[hiitBanReason] : null),
    clinical_guardrails: clinicalGuardrails
  };
}

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

export function getPracticalCardioPrescription({
  type = CARDIO_TYPES.LISS_TALK_TEST,
  duration_minutes = 25,
  sessions_per_week = 3,
  equipment = CARDIO_EQUIPMENT.INCLINE_TREADMILL,
  medicalConditions = []
}) {
  const conds = (Array.isArray(medicalConditions) ? medicalConditions : [medicalConditions])
    .map(c => typeof c === 'string' ? c : String(c?.conditionCode || c?.code || c?.name || c?.area || ''));

  const hasAsthma = conds.some(c => RESPIRATORY_PATTERN.test(c));

  let resolvedType = String(type).toUpperCase();
  let asthmaClinicalNote = null;

  // GINA Clinical Guideline: Restrict HIIT for asthma / respiratory conditions
  if (hasAsthma && (resolvedType === CARDIO_TYPES.HIIT_INTERVALS || resolvedType.includes('HIIT'))) {
    resolvedType = CARDIO_TYPES.LISS_TALK_TEST;
    asthmaClinicalNote = ASTHMA_CARDIO_SAFETY_GUIDANCE_AR;
  }

  const upperType = resolvedType;

  if (upperType === CARDIO_TYPES.HIIT_INTERVALS || upperType.includes('HIIT')) {
    return {
      type: CARDIO_TYPES.HIIT_INTERVALS,
      protocol_title_ar: 'تدريب فترات عالي الكثافة (HIIT Interval Protocol)',
      protocol_title_en: 'High-Intensity Interval Training (HIIT)',
      duration_minutes: 15,
      sessions_per_week: Math.min(2, sessions_per_week),
      talk_test_cue_ar: 'جهد هوائي حرج؛ لا يمكنك التحدث أثناء فترات السبرنت (30 ثانية أقصى مجهود 100% تليها 90 ثانية مشي هادئ 40%).',
      execution_breakdown_ar: [
        'إحماء هادئ لمدة 3 دقائق.',
        '6 إلى 8 جولات: (30 ثانية سبرنت أقصى سرعة + 90 ثانية مشي لاستعادة النفس).',
        'تبريد واستشفاء لمدة دقيقتين.'
      ],
      fat_oxidation_rationale_ar: 'رفع معدل الاستهلاك الأكسجيني اللاحق للتمرين (EPOC) وتحفيز حرق الدهون في وقت قصير.',
      equipment_recommendation: equipment
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
    clinical_guidance_ar: asthmaClinicalNote,
    clinical_guardrails: {
      asthma_hiit_banned: Boolean(hasAsthma),
      preferred_modality: hasAsthma ? 'LISS_TALK_TEST' : null,
    }
  };
}

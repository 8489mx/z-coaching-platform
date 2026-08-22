/**
 * Intensity & Technique Engine (Reps In Reserve - RIR Engine)
 *
 * Replaces ambiguous RPE with standardized, actionable RIR metrics:
 *   - RIR 2: Stop set with 2 clear reps left in reserve with pristine technique.
 *   - RIR 1: Stop set with exactly 1 rep left in reserve.
 *   - RIR 0: Full technical failure (zero additional reps possible with proper form).
 *
 * Final-Set Special Intensity Badges:
 *   - DROP_SET: Immediate 40-50% load drop to technical failure (RIR 0).
 *   - REST_PAUSE: 15s intra-set rest followed by 3-4 extra reps.
 *   - TEMPO_2_1_2_1: 2s eccentric, 1s pause, 2s concentric, 1s peak squeeze.
 *   - HOLD_2S: 2-second isometric pause at peak contraction or deep stretch.
 */

export const RIR_LEVELS = {
  RIR_0: 'RIR_0',
  RIR_1: 'RIR_1',
  RIR_2: 'RIR_2',
  RIR_3: 'RIR_3'
};

export const INTENSITY_BADGES = {
  DROP_SET: 'DROP_SET',
  REST_PAUSE: 'REST_PAUSE',
  TEMPO_2_1_2_1: 'TEMPO_2_1_2_1',
  HOLD_2S: 'HOLD_2S'
};

export function getRirGuidance(rirLevel = RIR_LEVELS.RIR_2) {
  const level = String(rirLevel).toUpperCase();

  switch (level) {
    case RIR_LEVELS.RIR_0:
    case '0':
    case 'RIR 0':
    case 'RIR_0':
      return {
        rir_code: RIR_LEVELS.RIR_0,
        rir_number: 0,
        label_ar: 'RIR 0 (فشل فني تام)',
        label_en: 'RIR 0 (Technical Failure)',
        description_ar: 'الوصول لقمة الجهد العضلي؛ لا يمكنك أداء أي عدة إضافية بتكنيك سليم.',
        rpe_equivalent: 10,
        cns_strain: 'HIGH'
      };

    case RIR_LEVELS.RIR_1:
    case '1':
    case 'RIR 1':
    case 'RIR_1':
      return {
        rir_code: RIR_LEVELS.RIR_1,
        rir_number: 1,
        label_ar: 'RIR 1 (متبقي عدة واحدة)',
        label_en: 'RIR 1 (1 Rep in Reserve)',
        description_ar: 'إيقاف الجولة مع متبقي عدة واحدة فقط في الاحتياط بأداء سليم.',
        rpe_equivalent: 9,
        cns_strain: 'MODERATE_HIGH'
      };

    case RIR_LEVELS.RIR_2:
    case '2':
    case 'RIR 2':
    case 'RIR_2':
    default:
      return {
        rir_code: RIR_LEVELS.RIR_2,
        rir_number: 2,
        label_ar: 'RIR 2 (متبقي عدتان في الاحتياط)',
        label_en: 'RIR 2 (2 Reps in Reserve)',
        description_ar: 'إيقاف الجولة مع القدرة الأكيدة على أداء عدتين إضافيتين بأداء فني سليم ومحكم.',
        rpe_equivalent: 8,
        cns_strain: 'OPTIMAL_HYPERTROPHY'
      };

    case RIR_LEVELS.RIR_3:
    case '3':
    case 'RIR 3':
    case 'RIR_3':
      return {
        rir_code: RIR_LEVELS.RIR_3,
        rir_number: 3,
        label_ar: 'RIR 3 (متبقي 3 عدات - إحماء أو تمهيد)',
        label_en: 'RIR 3 (3 Reps in Reserve)',
        description_ar: 'جولة تحضيرية أو سرعة حركية مع متبقي 3 عدات في الاحتياط.',
        rpe_equivalent: 7,
        cns_strain: 'LOW'
      };
  }
}

/**
 * Applies special intensity technique badge exclusively on the final set.
 */
export function applySpecialIntensityBadge({
  exercise_name = 'Lat Pulldown',
  current_set_index = 3,
  total_sets = 4,
  base_weight_kg = 50,
  base_reps = 10,
  badge_type = INTENSITY_BADGES.DROP_SET
}) {
  const isLastSet = current_set_index >= total_sets - 1;
  const upperBadge = String(badge_type).toUpperCase();

  if (!isLastSet) {
    return {
      applied: false,
      reason_ar: 'شارات الشدة والتكنيك تُطبق حصراً في الجولة الأخيرة من التمرين لمنع الإجهاد المبكر.',
      badge_type: upperBadge
    };
  }

  switch (upperBadge) {
    case INTENSITY_BADGES.DROP_SET: {
      const dropWeightKg = Math.round(base_weight_kg * 0.55 * 10) / 10;
      return {
        applied: true,
        badge_type: INTENSITY_BADGES.DROP_SET,
        badge_label_ar: 'دروب سيت (Drop Set)',
        badge_label_en: 'Drop Set',
        execution_ar: `بعد إنهاء الجولة الأساسية (${base_weight_kg}kg × ${base_reps})، خفّض الوزن فوراً بنسبة 45% إلى (${dropWeightKg}kg) وأدِّ أقصى عدد عدات حتى الفشل الفني (RIR 0) بدون أي راحة.`,
        drop_weight_kg: dropWeightKg,
        target_rir: 0
      };
    }

    case INTENSITY_BADGES.REST_PAUSE: {
      return {
        applied: true,
        badge_type: INTENSITY_BADGES.REST_PAUSE,
        badge_label_ar: 'ريست بوز (Rest-Pause)',
        badge_label_en: 'Rest-Pause',
        execution_ar: `بعد إنهاء الجولة بوزن (${base_weight_kg}kg)، استرح لمدة 15 ثانية فقط مع أخذ نفس عميق، ثم العب 3 إلى 4 عدات إضافية بنفس الوزن.`,
        rest_seconds: 15,
        extra_reps: '3-4'
      };
    }

    case INTENSITY_BADGES.TEMPO_2_1_2_1: {
      return {
        applied: true,
        badge_type: INTENSITY_BADGES.TEMPO_2_1_2_1,
        badge_label_ar: 'إيقاع تحكم 2:1:2:1 (Tempo Control)',
        badge_label_en: 'Tempo 2:1:2:1',
        execution_ar: 'النزول بالوزن في ثانيتين متحكمتين (Eccentric 2s)، ثبات ثانية في أقصى استطالة (Pause 1s)، رفع الوزن في ثانيتين (Concentric 2s)، وعصر العضلة ثانية في القمة (Squeeze 1s).',
        tempo_breakdown: { eccentric_s: 2, pause_s: 1, concentric_s: 2, squeeze_s: 1 }
      };
    }

    case INTENSITY_BADGES.HOLD_2S: {
      return {
        applied: true,
        badge_type: INTENSITY_BADGES.HOLD_2S,
        badge_label_ar: 'ثبات ثانيتين في القمة (2s Squeeze Hold)',
        badge_label_en: '2s Isometric Hold',
        execution_ar: 'ثبات تام لمدة ثانيتين مع العصر العضلي الأقصى عند قمة كل عدة لزيادة التوتر الميكانيكي على الألياف المستهدفة.',
        hold_seconds: 2
      };
    }

    default:
      return {
        applied: false,
        reason_ar: 'نوع الشارة غير معروف',
        badge_type: upperBadge
      };
  }
}

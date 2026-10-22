/**
 * Frictionless Female Hormonal Adaptation & Comfort-First UX Engine
 *
 * 1. Minimal Inputs & Background Cycle Tracking:
 *    - Uses approximate next period date or a 1-tap PMS toggle.
 *    - Calculates estimated cycle phase silently (Menstrual, Follicular, Ovulation, Luteal/PMS).
 *
 * 2. Silent Physiological Tuning:
 *    - Silent Weight Buffer: Locks calorie cuts on PMS fluid retention with encouraging reassurance.
 *    - Comfort Snack Shift: Automatically adds +150 to +200 kcal comfort buffer (dark chocolate / fruits).
 *    - Evening Magnesium Glycinate to ease cramping and enhance slow-wave sleep.
 *    - Gym Tuning: Adds +30s rest interval and shifts to 2-3 RIR without disruptive alerts.
 *
 * 3. PCOS & Insulin Resistance Clinical Guardrail:
 *    - Low-GI carb allocation.
 *    - Integrates Myo-Inositol (2,000 - 4,000 mg) and Chromium into supplement schedule.
 */

export const CYCLE_PHASES = {
  FOLLICULAR: 'FOLLICULAR',
  OVULATION: 'OVULATION',
  LUTEAL: 'LUTEAL',
  MENSTRUAL: 'MENSTRUAL'
};

/**
 * Calculates current menstrual cycle phase from date or toggle.
 */
export function estimateCyclePhase({
  approximate_next_period_date = null,
  is_pms_active = false,
  current_date = new Date()
}) {
  if (is_pms_active) {
    return CYCLE_PHASES.LUTEAL;
  }

  if (!approximate_next_period_date) {
    return CYCLE_PHASES.FOLLICULAR;
  }

  const nextDateObj = new Date(approximate_next_period_date);
  const nowObj = new Date(current_date);
  const diffDays = Math.ceil((nextDateObj.getTime() - nowObj.getTime()) / (1000 * 3600 * 24));

  if (diffDays <= 0 && diffDays >= -4) {
    return CYCLE_PHASES.MENSTRUAL;
  } else if (diffDays >= 1 && diffDays <= 7) {
    return CYCLE_PHASES.LUTEAL; // Pre-menstrual PMS window
  } else if (diffDays >= 12 && diffDays <= 16) {
    return CYCLE_PHASES.OVULATION;
  } else {
    return CYCLE_PHASES.FOLLICULAR;
  }
}

/**
 * Evaluates female menstrual cycle buffer gate with comfort-first UX and PCOS logic.
 */
export function evaluateFemaleCycleBuffer({
  is_female = true,
  cycle_phase = null,
  approximate_next_period_date = null,
  is_pms_active = false,
  weight_delta_kg = 1.2,
  adherence_score = 90,
  current_calories = 1600,
  has_pcos = false,
  base_rest_seconds = 60
}) {
  if (!is_female) {
    return {
      is_female: false,
      deficit_adjustment_locked: false,
      has_pcos: false,
      rationale_ar: 'المشترك ذكر؛ لا ينطبق صمام أمان الدورة الهرمونية.'
    };
  }

  const calculatedPhase = cycle_phase || estimateCyclePhase({ approximate_next_period_date, is_pms_active });
  const isLuteal = calculatedPhase === CYCLE_PHASES.LUTEAL;
  const isHydrationGain = weight_delta_kg >= 0.4 && weight_delta_kg <= 2.5;
  const isHighAdherence = adherence_score >= 80;

  const shouldLockDeficit = isLuteal && isHydrationGain && isHighAdherence;

  // Comfort snack shift: +150 to +200 kcal
  const comfortSnackKcal = isLuteal ? 150 : 0;
  const adjustedDailyCalories = current_calories + comfortSnackKcal;

  // Gym tuning: +30s rest interval on heavy/compound lifts
  const tunedRestSeconds = isLuteal ? base_rest_seconds + 30 : base_rest_seconds;

  // PCOS Clinical Support
  const pcosProtocol = has_pcos ? {
    is_pcos_active: true,
    nutrition_strategy: 'Strict Low-GI Carbohydrate Distribution (بطاطا حلوة، شوفان، كينوا، أرز بسمتي)',
    supplements: [
      { supplement: 'Myo-Inositol', dosage: '2,000 - 4,000 mg daily', timing: 'صباحاً ومساءً مع الوجبات', reason_ar: 'لتحسين حساسية الأنسولين ودعم التبويض الطبيعي' },
      { supplement: 'Chromium Picolinate', dosage: '200 mcg daily', timing: 'مع الغداء', reason_ar: 'لتثبيت مستويات السكر ومنع الرغبة المفاجئة في السكريات' }
    ]
  } : null;

  return {
    is_female: true,
    cycle_phase: calculatedPhase,
    weight_delta_kg,
    adherence_score,
    deficit_adjustment_locked: shouldLockDeficit,
    locked_calories_target: current_calories,
    adjusted_calories_with_comfort_snack: adjustedDailyCalories,
    comfort_snack_added_kcal: comfortSnackKcal,
    gym_tuning: {
      tuned_rest_seconds: tunedRestSeconds,
      recommended_rir: isLuteal ? '2-3 RIR (Unstressed)' : '1-2 RIR'
    },
    prohibited_actions: shouldLockDeficit ? [
      'حظر خفض السعرات الحرارية اليومية',
      'حظر زيادة مدة الكارديو الإجباري',
      'حظر تصنيف الحالة كثبات أيضي أو تراجع في النتائج'
    ] : [],
    reassurance_message_ar: shouldLockDeficit ? 
      'زيادة الميزان في هذه الفترة طبيعية ومؤقتة ناتجة عن احتباس مائي هرموني، جسمك ماشي بشكل ممتاز ومكملين بنفس الخطة!' : 
      null,
    micro_adjustments: isLuteal ? {
      comfort_snack_options_ar: 'حصة شوكولاتة داكنة (20g بنسبة 70%+) أو فواكه طازجة مهدئة لتهدئة الرغبة في السكريات بمرونة تامة',
      recommended_supplement: 'Magnesium Glycinate (جرعة توفر 100 - 200 mg مغنسيوم عنصري مساءً)',
      benefit_ar: 'لتهدئة التقلصات العضلية وتحسين جودة النوم العميق'
    } : null,
    pcos_protocol: pcosProtocol
  };
}

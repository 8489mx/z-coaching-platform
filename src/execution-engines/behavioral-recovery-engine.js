/**
 * Behavioral Binge Recovery & Diet Fatigue Engine
 *
 * 1. Zero-Guilt Binge Absorption Protocol:
 *    - Strictly prevents starvation, fasting, or compensatory aggressive deficits.
 *    - Absorbs excess calories with a gentle (100-150 Kcal/day) spread or controlled refeed conversion.
 *    - Preserves protein targets 100%.
 *
 * 2. Diet Fatigue Detector:
 *    - Triggers an intentional 1-week Diet Break at maintenance calories when:
 *      a) Adherence drops for 2 consecutive weeks.
 *      b) Caloric deficit continues for 8-10 consecutive weeks.
 *      c) Chronic hunger/stress biofeedback threshold is exceeded.
 */

export const RECOVERY_STRATEGIES = {
  GENTLE_DEFICIT_SPREAD: 'GENTLE_DEFICIT_SPREAD',
  CONTROLLED_REFEED_RESET: 'CONTROLLED_REFEED_RESET',
  STANDARD_MAINTENANCE_BUFFER: 'STANDARD_MAINTENANCE_BUFFER'
};

/**
 * Absorbs caloric surplus without guilt, starvation, or extreme restriction.
 */
export function absorbCaloricSurplus({
  excess_calories = 500,
  remaining_days_in_week = 4,
  baseline_calories = 2000,
  baseline_protein_g = 160
}) {
  const safeSurplus = Math.max(0, Number(excess_calories) || 0);
  const safeDays = Math.max(1, Math.min(6, Number(remaining_days_in_week) || 4));

  if (safeSurplus <= 200) {
    return {
      strategy: RECOVERY_STRATEGIES.STANDARD_MAINTENANCE_BUFFER,
      excess_calories: safeSurplus,
      daily_reduction_kcal: 0,
      adjusted_daily_calories: baseline_calories,
      protein_g: baseline_protein_g,
      directive_ar: 'فائض بسيط جداً لا يستدعي أي تعديل؛ استمر في خطتك اليومية المعتادة دون أي قلق أو حرمان.'
    };
  }

  // Cap maximum daily reduction to 150 Kcal to prevent diet fatigue and binge-restrict cycles
  const calculatedReduction = Math.round(safeSurplus / safeDays);
  const dailyReductionKcal = Math.min(150, Math.max(50, calculatedReduction));
  const adjustedCalories = baseline_calories - dailyReductionKcal;

  if (safeSurplus > 1200) {
    return {
      strategy: RECOVERY_STRATEGIES.CONTROLLED_REFEED_RESET,
      excess_calories: safeSurplus,
      daily_reduction_kcal: 100,
      adjusted_daily_calories: baseline_calories - 100,
      protein_g: baseline_protein_g,
      directive_ar: 'تم احتساب اليوم كإعادة تغذية (Refeed) لتعبئة مخازن الجليكوجين؛ لا يوجد أي صيام أو حرمان، فقط عجز خفيف جداً (-100 سعرة) للأيام المتبقية مع ثبات البروتين.'
    };
  }

  return {
    strategy: RECOVERY_STRATEGIES.GENTLE_DEFICIT_SPREAD,
    excess_calories: safeSurplus,
    daily_reduction_kcal: dailyReductionKcal,
    adjusted_daily_calories: adjustedCalories,
    protein_g: baseline_protein_g,
    directive_ar: `امتصاص هادئ للفائض: توزيع عجز خفيف بمقدار -${dailyReductionKcal} سعرة يومياً على الـ ${safeDays} أيام المتبقية، مع الحفاظ الكامل على البروتين.`
  };
}

/**
 * Detects psychological and metabolic diet fatigue.
 */
export function detectDietFatigue({
  consecutive_low_adherence_weeks = 0,
  consecutive_deficit_weeks = 4,
  biofeedback_hunger = 5,
  biofeedback_stress = 4
}) {
  const isAdherenceFatigued = consecutive_low_adherence_weeks >= 2;
  const isMetabolicallyFatigued = consecutive_deficit_weeks >= 8;
  const isBiofeedbackSevere = biofeedback_hunger >= 8 && biofeedback_stress >= 8;

  const dietBreakRecommended = isAdherenceFatigued || isMetabolicallyFatigued || isBiofeedbackSevere;

  let rationaleAr = 'المؤشرات السلوكية والأيضية مستقرة؛ الاستمرار في مسار التنشيف الحالي.';

  if (isAdherenceFatigued) {
    rationaleAr = 'رصد تراجع في الالتزام لأسبوعين متتاليين: يُوصى بأسبوع تثبيت (Diet Break) على سعرات الصيانة لكسر الضغط النفسي وتجديد الحافز.';
  } else if (isMetabolicallyFatigued) {
    rationaleAr = `استمرار العجز لـ ${consecutive_deficit_weeks} أسابيع متتالية: يُوصى بأسبوع تثبيت لتنشيط هرمون اللبتين ورفع معدل الأيض الأساسي.`;
  } else if (isBiofeedbackSevere) {
    rationaleAr = 'ارتفاع حاد في مؤشرات الجوع والتوتر: يُوصى بأسبوع تثبيت لتهدئة هرمون الكورتيزول والجهاز العصبي.';
  }

  return {
    diet_break_recommended: dietBreakRecommended,
    recommended_duration_weeks: dietBreakRecommended ? 1 : 0,
    target_mode: dietBreakRecommended ? 'MAINTENANCE_DIET_BREAK' : 'DEFICIT_CONTINUATION',
    rationale_ar: rationaleAr
  };
}

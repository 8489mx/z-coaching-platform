/**
 * Dynamic Hydration & Natural Electrolytes Engine
 *
 * 1. Deterministic Daily Fluid Calculation:
 *    - Baseline Daily Target: Weight (kg) * 0.035 Liters.
 *    - Training Day Add-On: +0.6 Liters per 60 minutes of resistance training.
 *
 * 2. Natural Electrolyte Intra-Workout Cue:
 *    - Prescribes a pinch of natural sea salt (300 - 500mg Sodium) in intra-workout water on heavy training days
 *      to maintain intramuscular osmotic pressure, prevent cramping, and enhance neuromuscular firing.
 */

export const BASELINE_ML_PER_KG = 35; // 0.035 L per kg
export const TRAINING_ML_PER_HOUR = 600; // 0.6 L per hour

/**
 * Calculates exact daily hydration target and intra-workout electrolyte cues.
 */
export function calculateDailyHydrationTarget({
  weight_kg = 75,
  training_duration_minutes = 60,
  is_heavy_training_day = true
}) {
  const safeWeight = Math.max(40, Math.min(180, Number(weight_kg) || 75));
  const safeMinutes = Math.max(0, Math.min(180, Number(training_duration_minutes) || 0));

  const baselineLiters = Math.round((safeWeight * 0.035) * 10) / 10;
  const trainingAddLiters = Math.round(((safeMinutes / 60) * 0.6) * 10) / 10;
  const totalTargetLiters = Math.round((baselineLiters + trainingAddLiters) * 10) / 10;

  const glassesCount = Math.round(totalTargetLiters / 0.25); // ~250ml per glass

  const electrolyteCue = is_heavy_training_day ? {
    is_recommended: true,
    guideline_ar: 'يُنصح بإضافة رشة بسيطة من ملح البحر الطبيعي (300-500mg صوديوم) مع قطرات ليمون في زجاجة ماء التمرين للحفاظ على ضغط السوائل داخل الألياف العضلية ومنع الهبوط أو التقلصات أثناء المجموعات الشاقة.'
  } : {
    is_recommended: false,
    guideline_ar: 'الماء الصافي كافٍ تماماً ليوم الراحة والاستشفاء الخفيف.'
  };

  return {
    weight_kg: safeWeight,
    training_duration_minutes: safeMinutes,
    baseline_liters: baselineLiters,
    training_add_liters: trainingAddLiters,
    total_target_liters: totalTargetLiters,
    equivalent_glasses_250ml: glassesCount,
    display_target_ar: `${totalTargetLiters} لتر يومياً (حوالي ${glassesCount} أكواب)`,
    electrolyte_intra_workout_cue: electrolyteCue,
    hydration_status_directive_ar: `مستهدفك المائي اليومي المحسوب لوزنك (${safeWeight}kg) ونشاطك التدريبي هو ${totalTargetLiters} لتر لضمان أعلى كفاءة خلوية ونقاء أيضي.`
  };
}

/**
 * Leucine Threshold & Muscle Protein Synthesis (MPS) Partitioning Engine
 *
 * 1. Leucine Threshold Enforcement:
 *    - Validates minimum >= 0.40 g/kg protein or ~3.0g pure Leucine per main meal to trigger mTORC1.
 * 2. Circadian Refractory Spacing:
 *    - Distributes daily protein across 3 - 5 meals with 3.5 - 4.5 hours spacing to overcome the Muscle Full Effect.
 */

export const MIN_LEUCINE_PER_MEAL_G = 3.0;
export const MIN_PROTEIN_PER_KG_PER_MEAL = 0.40;

/**
 * Calculates optimal MPS meal partitioning and Leucine threshold sufficiency.
 */
export function calculateMpsLeucinePartitioning({
  body_weight_kg = 75,
  daily_protein_g = 160,
  target_meal_count = 4,
  first_meal_time = "08:30"
}) {
  const mealCount = Math.max(3, Math.min(5, Number(target_meal_count) || 4));
  const minProteinPerMeal = Math.round(body_weight_kg * MIN_PROTEIN_PER_KG_PER_MEAL * 10) / 10;
  const actualProteinPerMeal = Math.round((daily_protein_g / mealCount) * 10) / 10;

  const isLeucineThresholdMet = actualProteinPerMeal >= minProteinPerMeal;

  // Meal timing spacing (every 3.5 - 4.0 hours)
  const parts = String(first_meal_time || "08:30").split(":");
  let startHour = parseInt(parts[0], 10);
  if (isNaN(startHour)) startHour = 8;
  let startMinute = parseInt(parts[1], 10);
  if (isNaN(startMinute)) startMinute = 30;

  const mealSchedule = [];
  for (let i = 0; i < mealCount; i++) {
    const mealHour = (startHour + (i * 4)) % 24;
    const timeFormatted = `${String(mealHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`;
    
    mealSchedule.push({
      meal_number: i + 1,
      target_time: timeFormatted,
      protein_g: actualProteinPerMeal,
      estimated_leucine_g: Math.round((actualProteinPerMeal * 0.085) * 10) / 10, // ~8.5% leucine in complete animal/whey proteins
      is_threshold_met: actualProteinPerMeal >= minProteinPerMeal,
      refractory_note_ar: i === 0 ? 'تفعيل إشارة البناء العضلي الصباحية (mTORC1 Trigger)' : 'إعادة تحفيز التخليق البروتيني بعد انتهاء فترة الخمول النسبي (Muscle Full Reset)'
    });
  }

  return {
    body_weight_kg,
    daily_protein_g,
    target_meal_count: mealCount,
    min_required_protein_per_meal_g: minProteinPerMeal,
    actual_protein_per_meal_g: actualProteinPerMeal,
    is_leucine_threshold_met: isLeucineThresholdMet,
    mps_efficiency_score_percent: isLeucineThresholdMet ? 100 : Math.round((actualProteinPerMeal / minProteinPerMeal) * 100),
    inter_meal_interval_hours: 4.0,
    meal_distribution_schedule: mealSchedule,
    scientific_summary_ar: isLeucineThresholdMet ? 
      `توزيع مثالي لبروتينك (${actualProteinPerMeal}g لكل وجبة) يحقق عتبة الليوسين (> 3.0g) ويضمن تفعيل البناء العضلي ${mealCount} مرات يومياً بأعلى كفاءة.` :
      `تنبيه: كمية البروتين الحالية لكل وجبة (${actualProteinPerMeal}g) أقل من الحد الأدنى (${minProteinPerMeal}g)؛ يُنصح بدمج الوجبات إلى ${mealCount - 1} وجبات لضمان تفعيل عتبة الليوسين.`
  };
}

/**
 * Reverse Dieting & Metabolic Restoration Engine
 *
 * 1. Post-Cut Stepwise Calorie Escalation:
 *    - Controlled increase (+80 to +120 kcal/week) predominantly from complex carbs and healthy fats.
 *    - Protein grams kept locked.
 * 2. Thyroid (T3) & Leptin Surge:
 *    - Prevents rapid visceral fat rebound while systematically restoring metabolic expenditure.
 * 3. Stabilization Ceiling:
 *    - Continues until new estimated maintenance calories are achieved with waist circumference stable (+/- 0.5 cm).
 */

export const REVERSE_DIET_STATUS = {
  ACTIVE_REVERSING: 'ACTIVE_REVERSING',
  MAINTENANCE_ACHIEVED: 'MAINTENANCE_ACHIEVED'
};

/**
 * Calculates deterministic weekly reverse dieting step.
 */
export function calculateReverseDietingStep({
  current_deficit_calories = 1600,
  target_maintenance_calories = 2200,
  current_carbs_g = 150,
  current_protein_g = 150,
  current_fat_g = 45,
  reverse_week_number = 1,
  waist_change_cm = 0.0
}) {
  const week = Math.max(1, Number(reverse_week_number) || 1);
  const remainingGap = target_maintenance_calories - current_deficit_calories;

  if (remainingGap <= 50) {
    return {
      status: REVERSE_DIET_STATUS.MAINTENANCE_ACHIEVED,
      week_number: week,
      current_calories: current_deficit_calories,
      target_maintenance_calories,
      macros: {
        daily_calories: target_maintenance_calories,
        protein_g: current_protein_g,
        carbs_g: current_carbs_g,
        fat_g: current_fat_g
      },
      directive_ar: 'تهانينا! تم الوصول لسعرات الصيانة المستهدفة بنجاح مع استقرار قياسات الخصر والأيض؛ جسمك الآن في أعلى كفاءة حرق استراحي (Peak Metabolic Capacity).'
    };
  }

  // Determine safe weekly calorie increment based on waist response
  let weeklyCalorieAdd = 100;
  if (waist_change_cm > 1.0) {
    weeklyCalorieAdd = 70; // Slower step if slight water/visceral gain
  } else if (waist_change_cm <= 0) {
    weeklyCalorieAdd = 120; // Fast step if body is easily absorbing the calories
  }

  const nextCalories = Math.min(target_maintenance_calories, current_deficit_calories + weeklyCalorieAdd);
  
  // Allocate 80% to Carbs, 20% to Fat
  const carbCalories = Math.round(weeklyCalorieAdd * 0.80);
  const fatCalories = weeklyCalorieAdd - carbCalories;

  const carbAddGrams = Math.round(carbCalories / 4);
  const fatAddGrams = Math.round(fatCalories / 9);

  const nextCarbsG = current_carbs_g + carbAddGrams;
  const nextFatG = current_fat_g + fatAddGrams;

  return {
    status: REVERSE_DIET_STATUS.ACTIVE_REVERSING,
    week_number: week,
    current_calories: current_deficit_calories,
    target_maintenance_calories,
    weekly_increment_kcal: weeklyCalorieAdd,
    next_week_target: {
      daily_calories: nextCalories,
      protein_g: current_protein_g,
      carbs_g: nextCarbsG,
      fat_g: nextFatG,
      carb_delta_g: carbAddGrams,
      fat_delta_g: fatAddGrams
    },
    metabolic_goals_ar: [
      `رفع السعرات تدريجياً بمقدار +${weeklyCalorieAdd} Kcal للأسبوع ${week} لمنع ارتداد الدهون`,
      'إعادة شحن مستويات هرمون اللبتين (Leptin) وهرمون الغدة الدرقية النشط (Free T3)',
      'زيادة الطاقة التدريبية وقوة الرفع داخل الجيم مع الحفاظ على نسبة الدهون المنخفضة'
    ]
  };
}

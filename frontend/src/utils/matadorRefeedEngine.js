/**
 * MATADOR Diet Break & 48-Hour Leptin Refeed Engine
 *
 * 1. 48-Hour Acute Carb Refeed:
 *    - At week 4 or 6 of continuous deficit -> triggers 48h high-carb refeed (+100% carbs, lowered fats)
 *      to surge circulating leptin and T3 levels while replenishing intramyocellular glycogen.
 * 2. MATADOR 1-Week Maintenance Block:
 *    - At 8+ weeks of prolonged deficit -> activates 1 full maintenance week to mitigate adaptive thermogenesis.
 */

export const REFEED_TYPES = {
  ACUTE_48H_REFEED: 'ACUTE_48H_REFEED',
  MATADOR_1_WEEK_BLOCK: 'MATADOR_1_WEEK_BLOCK',
  STANDARD_CONTINUOUS_DEFICIT: 'STANDARD_CONTINUOUS_DEFICIT'
};

/**
 * Evaluates MATADOR & Leptin Refeed Protocol eligibility and computes macro adjustments.
 */
export function evaluateMatadorRefeedStrategy({
  consecutive_deficit_weeks = 4,
  baseline_calories = 1800,
  baseline_carbs_g = 180,
  baseline_protein_g = 150,
  baseline_fat_g = 45,
  metabolic_slowdown_detected = false
}) {
  const weeks = Math.max(1, Number(consecutive_deficit_weeks) || 1);

  if (weeks >= 8 || metabolic_slowdown_detected) {
    // MATADOR 1-Week Maintenance Block
    const maintenanceCalories = baseline_calories + 400;
    const maintenanceCarbs = baseline_carbs_g + 80;
    const maintenanceFat = baseline_fat_g + 10;

    return {
      protocol_type: REFEED_TYPES.MATADOR_1_WEEK_BLOCK,
      trigger_reason_ar: `استمرار العجز لـ ${weeks} أسابيع متتالية؛ تفعيل أسبوع صيانة كامل (MATADOR Protocol) لتهدئة التكيف الأيضي وإعادة حساسية الغدة الدرقية.`,
      duration_display: '7 أيام متتالية (أسبوع كامل)',
      macros_adjustment: {
        daily_calories: maintenanceCalories,
        protein_g: baseline_protein_g,
        carbs_g: maintenanceCarbs,
        fat_g: maintenanceFat,
        calorie_increase_kcal: 400
      },
      physiological_benefits_ar: [
        'إعادة رفع معدل الأيض الاستراحي (RMR) بنسبة تصل إلى 85-90% من وضعه الأصلي',
        'استعادة مستويات هرمون اللبتين (Leptin) وهرمونات الغدة الدرقية (Free T3)',
        'خفض هرمون الكورتيزول وتصريف احتباس السوائل الأيضي المقاوم'
      ]
    };
  }

  if (weeks === 4 || weeks === 6) {
    // 48-Hour Acute Carb Refeed
    const refeedCarbs = baseline_carbs_g + Math.round(baseline_carbs_g * 0.85); // High Carb Refeed
    const refeedFat = Math.max(25, Math.round(baseline_fat_g * 0.65)); // Lower Fat to control calories
    const refeedCalories = (baseline_protein_g * 4) + (refeedCarbs * 4) + (refeedFat * 9);

    return {
      protocol_type: REFEED_TYPES.ACUTE_48H_REFEED,
      trigger_reason_ar: `بلوغ الأسبوع ${weeks} من العجز المستمر؛ تفعيل ريفيد عالي الكارب لمدة 48 ساعة متتالية لشحن مخازن الجليكوجين وتنشيط الحرق.`,
      duration_display: '48 ساعة (يومان متتاليان: خميس وجمعة أو جمعة وسبت)',
      macros_adjustment: {
        daily_calories: refeedCalories,
        protein_g: baseline_protein_g,
        carbs_g: refeedCarbs,
        fat_g: refeedFat,
        carb_increase_g: refeedCarbs - baseline_carbs_g
      },
      physiological_benefits_ar: [
        'شحن أقصى لمخازن الجليكوجين العضلي وتحسين طاقة التمارين الشاقة',
        'موجة صعود حادة في إفراز اللبتين لمنع نوبات الشراهة',
        'تحفيز الإنزيمات المحولة لـ T4 إلى T3 الفعال'
      ]
    };
  }

  return {
    protocol_type: REFEED_TYPES.STANDARD_CONTINUOUS_DEFICIT,
    trigger_reason_ar: `الأسبوع ${weeks}: الاستمرار على وتيرة العجز الحالية دون الحاجة لريفيد مكثف.`,
    duration_display: 'الخطة النشطة المعتادة',
    macros_adjustment: {
      daily_calories: baseline_calories,
      protein_g: baseline_protein_g,
      carbs_g: baseline_carbs_g,
      fat_g: baseline_fat_g
    },
    physiological_benefits_ar: ['الاستمرار في استهداف حرق الدهون المباشر بمعدل ثابت']
  };
}

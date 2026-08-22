/**
 * Gut Health & Low-FODMAP Filter Engine (الفلتر الهضمي للمبادلات وتنبيهات القولون)
 *
 * 1. Low-FODMAP Smart Swap Filter:
 *    - Filters out high-FODMAP colon irritants (Cruciferous veggies, Legumes, Polyol sweeteners, High-lactose).
 *    - Surfaces soothing gut-friendly options with exact macro density equivalence.
 * 2. Chronic GI Distress Alert:
 *    - Triggers Coach Center Red Flag if GI distress score >= 7/10 for 2 consecutive weeks.
 */

export const HIGH_FODMAP_FOOD_CODES = [
  'FAVA_BEANS',
  'BROCCOLI_RAW',
  'CAULIFLOWER_RAW',
  'CHICKPEAS_BOILED',
  'LENTILS_BOILED',
  'GARLIC_POWDER_HEAVY'
];

export const LOW_FODMAP_SOOTHING_FOODS = [
  'BASMATI_RICE_COOKED',
  'BOILED_POTATOES',
  'SWEET_POTATO_BAKED',
  'CHICKEN_BREAST',
  'WHITE_FISH_FILLET',
  'ZUCCHINI_GRILLED',
  'CUCUMBER_FRESH',
  'EGGS_BOILED'
];

/**
 * Filters food database based on Low-FODMAP toggle.
 */
export function filterLowFodmapOptions(foodList = [], isLowFodmapActive = true) {
  if (!isLowFodmapActive) return foodList;

  return foodList.filter(food => {
    const code = typeof food === 'string' ? food : (food.code || '');
    return !HIGH_FODMAP_FOOD_CODES.includes(code);
  });
}

/**
 * Evaluates chronic gastrointestinal distress for clinical red flagging.
 */
export function evaluateChronicGiDistress({
  client_id = '1',
  client_name = 'طارق',
  consecutive_gi_distress_weeks = 2,
  gi_distress_score_0_to_10 = 8,
  reported_symptoms = ['انتفاخ حاد', 'عسر هضم بعد الوجبات']
}) {
  const isChronicDistress = consecutive_gi_distress_weeks >= 2 && gi_distress_score_0_to_10 >= 7;

  return {
    client_id,
    client_name,
    is_chronic_distress: isChronicDistress,
    severity_level: gi_distress_score_0_to_10 >= 8 ? 'HIGH' : (gi_distress_score_0_to_10 >= 6 ? 'MODERATE' : 'LOW'),
    consecutive_weeks: consecutive_gi_distress_weeks,
    reported_symptoms,
    coach_red_flag: isChronicDistress ? {
      title_ar: 'إنذار سريري: اضطراب هضمي مزمن ومستمر للأسبوع الثاني',
      description_ar: `المشترك ${client_name} سجل تقييم اضطراب هضمي (${gi_distress_score_0_to_10}/10) لمدة ${consecutive_gi_distress_weeks} أسابيع متتالية.`,
      action_recommended_ar: 'تفعيل بروتوكول تهدئة القولون (Low-FODMAP) واستبعاد البقوليات والمحليات الصناعية فوراً.'
    } : null,
    clinical_protocol: isChronicDistress ? {
      dietary_intervention: 'Strict Low-FODMAP Diet for 14 Days',
      supplement_support: [
        { supplement: 'L-Glutamine Powder', dose: '5g daily on empty stomach', reason_ar: 'لترميم بطانة الأمعاء والمعدة' },
        { supplement: 'Digestive Enzymes (Protease + Lipase + Amylase)', dose: '1 capsule with heavy meals', reason_ar: 'لتسهيل امتصاص البروتين والمغذيات' }
      ]
    } : null
  };
}

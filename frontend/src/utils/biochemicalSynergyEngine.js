/**
 * Biochemical Co-Factor Synergy & Food-First Fallback Engine
 *
 * 1. Biochemical Co-Factor Closed Loops:
 *    - Vitamin D3 + K2 (MK-7) + Magnesium
 *    - Iron (Fe2+) + Vitamin C + 2h Calcium/Polyphenol separation
 *    - Zinc + Copper Balance (10:1 to 15:1 ratio)
 *    - Fat-Soluble Vitamins (A, D, E, K) with 5-10g dietary fat vehicle
 *
 * 2. Food-First Fallback Matrix:
 *    - Direct whole-food alternatives for all micronutrient prescriptions.
 *
 * 3. Non-Mandatory & Legal Medical Disclaimer:
 *    - Explicitly marks all items as non-mandatory dietary preferences.
 */

export const LEGAL_MEDICAL_DISCLAIMER_AR = "تنويه طبي وإخلاء مسؤولية: كافة البرامج الغذائية والتدريبية ومقترحات المكملات تندرج تحت بند التوجيه والتثقيف الرياضي والغذائي المخصص لتحسين نمط الحياة، وليست وصفات طبية علاجية أو بديلاً عن استشارة الطبيب المعالج أو التشخيص السريري المباشر.";

export const NON_MANDATORY_LABEL_AR = "توصيات غذائية إضافية محبذة واختيارية وليست إجبارية";

export const FOOD_FIRST_FALLBACK_MATRIX = {
  OMEGA_3: {
    supplement_name: 'Pure Omega-3 (EPA/DHA)',
    food_first_alternatives_ar: [
      { food: 'سردين طازج أو معلب بالماء (100g)', content_yield: '~1,500mg EPA/DHA طبيعي' },
      { food: 'سلمون مشوي (120g)', content_yield: '~2,000mg EPA/DHA طبيعي' },
      { food: 'بذور الشيا أو بذور الكتان المطحونة (15g)', content_yield: '~2,500mg ALA أوميجا نباتي' }
    ]
  },
  MAGNESIUM: {
    supplement_name: 'Magnesium Glycinate',
    food_first_alternatives_ar: [
      { food: 'بذور اليقطين / القرع النيئة (30g)', content_yield: '~160mg مغنيسيوم عضوي' },
      { food: 'كاكاو خام نقي غير محلى أو شوكولاتة داكنة 85% (25g)', content_yield: '~70mg مغنيسيوم' },
      { food: 'سبانخ مطبوخة (150g)', content_yield: '~120mg مغنيسيوم' },
      { food: 'لوز نيء (30g)', content_yield: '~80mg مغنيسيوم' }
    ]
  },
  VITAMIN_D3_K2: {
    supplement_name: 'Vitamin D3 + K2 (MK-7)',
    food_first_alternatives_ar: [
      { food: 'التعرض المباشر لأشعة الشمس (15-20 دقيقة صباحاً)', content_yield: '~5,000 - 10,000 IU طبيعي' },
      { food: 'صفار 3 بيضات بلدية كاملة', content_yield: '~120 IU فيتامين D + دهون طبيعية' },
      { food: 'فطر/عيش غراب معرّض للشمس (100g)', content_yield: '~400 IU' }
    ]
  },
  IRON: {
    supplement_name: 'Gentle Iron (Ferrous Bisglycinate)',
    food_first_alternatives_ar: [
      { food: 'كبدة بقري أو دجاج مشوية (100g) مع عصير ليمون طازج', content_yield: '~6.5mg حديد Heme عالي الامتصاص' },
      { food: 'لحم بقري بتلو خالي الدهن (150g)', content_yield: '~4.0mg حديد Heme' },
      { food: 'عدس مطبوخ مع فلفل رومي أحمر (فيتامين C)', content_yield: '~3.5mg حديد نباتي' }
    ]
  },
  COLLAGEN: {
    supplement_name: 'Hydrolyzed Collagen Peptides',
    food_first_alternatives_ar: [
      { food: 'مرق عظام طبيعي مطبوخ ببطء (Bone Broth - 250ml)', content_yield: '~10 - 12g كولاجين وجلايسين وبرولين مركز' },
      { food: 'أجنحة أو شوربة دجاج بالجلد والعظام مع ليمون', content_yield: '~8g كولاجين طبيعي' }
    ]
  },
  ZINC: {
    supplement_name: 'Zinc Picolinate / Gluconate',
    food_first_alternatives_ar: [
      { food: 'لحم بقري خالي الدهن (150g)', content_yield: '~7.0mg زنك طبيعي' },
      { food: 'بذور القرع / اليقطين (30g)', content_yield: '~2.5mg زنك طبيعي' }
    ]
  }
};

/**
 * Validates biochemical co-factor integration and outputs food-first alternatives.
 */
export function evaluateBiochemicalSynergies({
  prescribed_supplements = [],
  meal_fat_grams = 8
}) {
  const supplements = Array.isArray(prescribed_supplements) ? prescribed_supplements : [];
  const normalizedSups = supplements.map(s => String(typeof s === 'string' ? s : s.name || s.supplement || '').toUpperCase());

  const coFactorAdjustments = [];
  const foodFirstOptions = [];

  // 1. Vitamin D3 Closed-Loop Check
  if (normalizedSups.some(s => s.includes('VITAMIN D') || s.includes('D3'))) {
    coFactorAdjustments.push({
      target_supplement: 'Vitamin D3',
      mandatory_co_factors: [
        { nutrient: 'Vitamin K2 (MK-7)', reason_ar: 'لتوجيه الكالسيوم إلى مصفوفة العظام ومنع تكلس الشرايين والأنسجة الرخوة' },
        { nutrient: 'Magnesium', reason_ar: 'عامل مساعد أساسي لتنشيط إنزيمات الكبد والكلى المحولة لفيتامين D النشط' }
      ]
    });
    foodFirstOptions.push(FOOD_FIRST_FALLBACK_MATRIX.VITAMIN_D3_K2);
  }

  // 2. Iron & Vitamin C Synergy Check
  if (normalizedSups.some(s => s.includes('IRON') || s.includes('FERROUS') || s.includes('حديد'))) {
    coFactorAdjustments.push({
      target_supplement: 'Iron',
      mandatory_co_factors: [
        { nutrient: 'Vitamin C (Ascorbic Acid 500mg)', reason_ar: 'لاختزال الحديد إلى صورة Fe2+ ثنائية التكافؤ وزيادة امتصاصه المعوي بـ 4 أضعاف' }
      ],
      spacing_rules_ar: 'يُلزم فصل الحديد عن الشاي، القهوة، ومصادر الكالسيوم بساعتين على الأقل.'
    });
    foodFirstOptions.push(FOOD_FIRST_FALLBACK_MATRIX.IRON);
  }

  // 3. Zinc-Copper Dynamic Balance Check
  if (normalizedSups.some(s => s.includes('ZINC') || s.includes('زنك'))) {
    coFactorAdjustments.push({
      target_supplement: 'Zinc',
      mandatory_co_factors: [
        { nutrient: 'Copper (1 - 2 mg)', reason_ar: 'للحفاظ على نسبة التوازن البيوكيميائي (10:1 إلى 15:1) وتفادي حدوث أنيميا نقص النحاس الثانوي' }
      ]
    });
    foodFirstOptions.push(FOOD_FIRST_FALLBACK_MATRIX.ZINC);
  }

  // 4. Fat-Soluble Vitamin Vehicle Check
  const hasFatSoluble = normalizedSups.some(s => s.includes('VITAMIN D') || s.includes('VITAMIN A') || s.includes('VITAMIN E') || s.includes('VITAMIN K'));
  const isFatVehicleSufficient = meal_fat_grams >= 5;

  return {
    non_mandatory_label_ar: NON_MANDATORY_LABEL_AR,
    legal_medical_disclaimer_ar: LEGAL_MEDICAL_DISCLAIMER_AR,
    fat_soluble_absorption_check: {
      has_fat_soluble_vitamins: hasFatSoluble,
      meal_fat_grams,
      is_fat_vehicle_sufficient: isFatVehicleSufficient,
      directive_ar: isFatVehicleSufficient ? 
        'الوجبة تحتوي على دهون صحية كافية (>= 5g) لضمان تكوين المايسيل (Micelles) وامتصاص الفيتامينات الذائبة في الدهون.' :
        'تنبيه: يجب تناول الفيتامينات الذائبة في الدهون (A, D, E, K) مع وجبة تحتوي على الأقل 5-10g دهون صحية لإتمام الامتصاص المعوي.'
    },
    co_factor_synergies: coFactorAdjustments,
    food_first_fallback_matrix: foodFirstOptions
  };
}

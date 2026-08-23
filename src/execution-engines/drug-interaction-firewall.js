/**
 * Zero-Conflict Pharmacological Isolation & 22-Condition Clinical Firewall
 */

export const INSULIN_DRUG_KEYS = [
  'INSULIN', 'LANTUS', 'NOVORAPID', 'APIDRA', 'TRESIBA', 'MIXTARD', 'HUMALOG', 'LEVEMIR', 'انسولين'
];

export const PHARMACOLOGICAL_RULES = {
  INSULIN: {
    identifiers: INSULIN_DRUG_KEYS,
    carb_floor_grams: 130,
    lock_keto: true,
    safety_cues_ar: [
      'قاعدة 15-15: احتفظ بـ 15 جم سكر سريع في حقيبة الجيم (عصير صغير / تمر) للطوارئ.',
      'توجيه موضع الحقن: تجنب حقن الأنسولين السريع في العضلة المستهدفة بالتمرين في نفس اليوم.',
      'نطاق الأمان: السكر قبل التمرين يجب أن يكون بين 100 إلى 250 mg/dL.'
    ],
    rule_directive_ar: 'بروتوكول الأنسولين الإكلينيكي: قفل حد أدنى للكربوهيدرات عند 130 جم لمنع هبوط السكر، مع تفعيل قاعدة 15-15 للطوارئ وتوجيه موضع الحقن بعيداً عن العضلات المستهدفة بالتمرين.'
  },
  LEVOTHYROXINE: {
    identifiers: ['ELTROXIN', 'EUTHYROX', 'LEVOTHYROXINE', 'THYROXINE', 'غدة'],
    isolation_hours: 4,
    prohibited_during_window: ['ألبان', 'أجبان', 'مكملات كالسيوم', 'مكملات حديد', 'صويا', 'ألياف عالية'],
    rule_directive_ar: 'قفل زمني صارم 4 ساعات: تناول حبة الغدة على معدة فارغة تماماً مع الماء والانتظار 4 ساعات كاملة قبل تناول الألبان، الأجبان، مكملات الكالسيوم، الحديد، أو الصويا.'
  },
  METFORMIN: {
    identifiers: ['METFORMIN', 'GLUCOPHAGE', 'CIDOPHAGE', 'ميتفورمين', 'سيدوفاج'],
    timing_rule_ar: 'يُلزم تناول الجرعة في منتصف أو نهاية أكبر وجبة طعام لتقليل الاضطراب المعوي.',
    mandatory_cofactor: 'Vitamin B12 (500 - 1000 mcg)',
    cofactor_rationale_ar: 'لتعويض استنزاف بكتيريا الأمعاء ومستقبلات امتصاص فيتامين B12 الناتج عن الاستخدام المزمن للميتفورمين.'
  },
  STATINS: {
    identifiers: ['LIPITOR', 'CRESTOR', 'ATORVASTATIN', 'ROSUVASTATIN', 'STATIN', 'كوليسترول'],
    prohibited_foods: ['GRAPEFRUIT', 'GRAPEFRUIT_JUICE', 'جريب فروت'],
    rule_directive_ar: 'حظر مطلق لثمار وعصير الجريب فروت من الوجبات والمبادلات لتفادي تثبيط إنزيم CYP3A4 الكبدي ومنع سمية العضلات.'
  },
  ACE_INHIBITORS_ARBS: {
    identifiers: ['CAPTOPRIL', 'ENALAPRIL', 'LOSARTAN', 'VALSARTAN', 'ZESTORETIC', 'ضغط'],
    prohibited_items: ['POTASSIUM_CHLORIDE_SALT_SUBSTITUTE', 'بدائل الملح الغنية بالبوتاسيوم KCl'],
    rule_directive_ar: 'حظر بدائل الملح المحتوية على كلوريد البوتاسيوم (KCl) لتجنب خطر فرط بوتاسيوم الدم (Hyperkalemia).'
  },
  ANTIBIOTICS: {
    identifiers: ['CIPROFLOXACIN', 'DOXYCYCLINE', 'LEVOFLOXACIN', 'TETRACYCLINE', 'مضاد حيوي'],
    isolation_hours: 2,
    prohibited_during_window: ['منتجات الألبان', 'مكملات المعادن الثنائية (كالسيوم، حديد، مغنيسيوم)'],
    rule_directive_ar: 'فاصل أمان ساعتين قبل وبعد الجرعة بعيداً عن منتجات الألبان ومكملات المعادن لتفادي التصالب المخلبي (Chelation) وفقدان فاعلية الدواء.'
  }
};

export function evaluateInsulinSafety(medicationsList = []) {
  const normalizedMeds = (Array.isArray(medicationsList) ? medicationsList : [medicationsList])
    .map(m => String(m || '').toUpperCase());

  const isTakingInsulin = normalizedMeds.some(med => 
    INSULIN_DRUG_KEYS.some(k => med.includes(k))
  );

  if (!isTakingInsulin) {
    return { requires_insulin_protocol: false };
  }

  return {
    requires_insulin_protocol: true,
    carb_floor_grams: 130,
    lock_keto: true,
    safety_cues_ar: [
      'قاعدة 15-15: احتفظ بـ 15 جم سكر سريع في حقيبة الجيم (عصير صغير / تمر) للطوارئ.',
      'توجيه موضع الحقن: تجنب حقن الأنسولين السريع في العضلة المستهدفة بالتمرين في نفس اليوم.',
      'نطاق الأمان: السكر قبل التمرين يجب أن يكون بين 100 إلى 250 mg/dL.'
    ]
  };
}

export function evaluatePharmacologicalFirewall(medicationsList = []) {
  const activeRules = [];
  const normalizedMeds = (Array.isArray(medicationsList) ? medicationsList : [medicationsList])
    .map(m => String(m || '').toUpperCase());

  for (const [key, rule] of Object.entries(PHARMACOLOGICAL_RULES)) {
    const isMatch = rule.identifiers.some(id => 
      normalizedMeds.some(med => med.includes(id))
    );

    if (isMatch) {
      activeRules.push({
        drug_category: key,
        ...rule
      });
    }
  }

  return {
    has_active_drug_rules: activeRules.length > 0,
    active_rules_count: activeRules.length,
    active_firewall_rules: activeRules,
    isolation_directives_ar: activeRules.map(r => r.rule_directive_ar || r.timing_rule_ar)
  };
}

/**
 * Master Stacked Clinical & Orthopedic Firewall Engine (22-Condition Comprehensive Matrix)
 */
export function evaluateMasterClinicalProfile({
  medicalConditions = [],
  weightKg = 75,
  targetCalories = 2000,
  targetProteinGrams = 150,
  targetCarbGrams = 200,
  targetFatGrams = 60
}) {
  let adjusted = {
    calories: targetCalories,
    proteinGrams: targetProteinGrams,
    carbGrams: targetCarbGrams,
    fatGrams: targetFatGrams,
    fiberGrams: 28,
    prohibitedSupplements: [],
    prescribedNutrients: [],
    biomechanicalRestrictions: [],
    safetyCues: []
  };

  const conds = (Array.isArray(medicalConditions) ? medicalConditions : [medicalConditions])
    .map(c => String(c || '').toUpperCase());

  // 1. سكري النوع الأول أو النوع الثاني المعتمد على الأنسولين
  if (conds.includes('TYPE_1_DIABETES') || conds.includes('TYPE_2_DIABETES_INSULIN') || conds.includes('INSULIN_DEPENDENT')) {
    adjusted.carbGrams = Math.max(adjusted.carbGrams, 130);
    adjusted.safetyCues.push('قاعدة 15-15: احتفظ بمصدر سكر سريع بحقيبة الجيم. تجنب الحقن السريع في العضلة المستهدفة بالتمرين.');
  }

  // 2. سكري النوع الثاني الفموي / مقاومة الإنسولين / تكيس المبايض
  if (conds.includes('TYPE_2_DIABETES_ORAL') || conds.includes('PCOS_IR') || conds.includes('INSULIN_RESISTANCE')) {
    adjusted.fiberGrams = Math.max(adjusted.fiberGrams, 35);
    adjusted.prescribedNutrients.push('LOW_GI_CARBOHYDRATES');
    adjusted.safetyCues.push('اعتماد النشويات منخفضة المؤشر الجلايسيمي لحماية حساسية الإنسولين وتثبيت سكر الدم.');
  }

  // 3. خمول الغدة الدرقية
  if (conds.includes('HYPOTHYROIDISM')) {
    adjusted.safetyCues.push('عزل حبة الغدة (Eltroxin) 4 ساعات كاملة عن الكالسيوم والألبان والحديد والألياف الكثيفة.');
  }

  // 4. الكبد الدهني
  if (conds.includes('FATTY_LIVER')) {
    adjusted.prescribedNutrients.push('OMEGA_3_FATTY_ACIDS', 'LEAFY_GREENS');
    adjusted.safetyCues.push('تقييد الدهون المشبعة بأقل من 7%، وحظر السكريات المكررة وعصائر الفركتوز لحماية الكبد.');
  }

  // 5. ضغط الدم المرتفع
  if (conds.includes('HYPERTENSION')) {
    adjusted.prohibitedSupplements.push('HIGH_STIM_PREWORKOUT', 'YOHIMBINE', 'FAT_BURNERS');
    adjusted.biomechanicalRestrictions.push('NO_VALSALVA_MANEUVER', 'NO_1RM_TESTING');
    adjusted.safetyCues.push('تنفس بانتظام مع الدفع وتجنب كتم النفس داخل الجيم، وابتعد عن مكملات الطاقة عالية الكافيين.');
  }

  // 6. أدوية السيولة
  if (conds.includes('BLOOD_THINNERS')) {
    adjusted.prohibitedSupplements.push('HIGH_DOSE_VITAMIN_E', 'GINKGO_BILOBA', 'HIGH_DOSE_GINSENG');
    adjusted.safetyCues.push('تثبيت الحصة اليومية من الخضروات الغنية بفيتامين K دون تذبذب حاد لضبط سيولة الدم.');
  }

  // 7. الأنيميا الحادة
  if (conds.includes('SEVERE_ANEMIA')) {
    adjusted.safetyCues.push('فصل الشاي والقهوة ومنتجات الكالسيوم ساعتين عن الوجبات الغنية بالحديد، ودمج فيتامين C لتعزيز الامتصاص.');
  }

  // 8. جراحات السمنة (تكميم / تحويل مسار)
  if (conds.includes('BARIATRIC_SURGERY')) {
    adjusted.proteinGrams = Math.max(adjusted.proteinGrams, Math.round((weightKg || 75) * 1.8));
    adjusted.safetyCues.push('تقسيم الوجبات إلى 5-6 وجبات صغيرة، وفصل السوائل 30 دقيقة قبل وبعد الوجبة مع الالتزام بالملتي فيتامين.');
  }

  // 9. القولون العصبي
  if (conds.includes('IBS')) {
    adjusted.prescribedNutrients.push('LOW_FODMAP_DIET');
    adjusted.safetyCues.push('استبعاد البقوليات غير المنقوعة، المحليات الكحولية، واللاكتوز العالي لتفادي الانتفاخ.');
  }

  // 10. ارتجاع المريء
  if (conds.includes('GERD_REFLUX')) {
    adjusted.biomechanicalRestrictions.push('NO_INVERTED_EXERCISES_DECLINE_BENCH');
    adjusted.safetyCues.push('تجنب الاستلقاء أو التمارين المقلوبة بعد الوجبات مباشرة، والابتعاد عن الوجبات الدسمة والحارة قبل التمرين.');
  }

  // 11. استئصال المرارة
  if (conds.includes('CHOLECYSTECTOMY')) {
    adjusted.safetyCues.push('توزيع حصة الدهون بالتساوي على كافة الوجبات وتجنب الوجبات عالية الدسم دفعة واحدة.');
  }

  // 12. القصور الكلوي
  if (conds.includes('RENAL_INSUFFICIENCY')) {
    adjusted.proteinGrams = Math.round((weightKg || 75) * 1.1);
    adjusted.prohibitedSupplements.push('CREATINE');
    adjusted.safetyCues.push('تقنين البروتين إلى 1.1 جم/كجم لحماية الكلى مع حظر تام لمكمل الكرياتين.');
  }

  // 13. داء النقرس
  if (conds.includes('GOUT')) {
    adjusted.prohibitedSupplements.push('HIGH_PURINE_EXTRACTS');
    adjusted.safetyCues.push('استبعاد الأحشاء الداخلية (كبدة/كلاوي) والماكريل واللحوم عالية البيورين، ورفع شرب الماء لمنع نوبات النقرس.');
  }

  // 14. حساسية الصدر والربو
  if (conds.includes('BRONCHIAL_ASTHMA')) {
    adjusted.safetyCues.push('إحماء تدريجي ممتد لـ 10-15 دقيقة، واصطحاب بخاخ الربو الإسعافي داخل حقيبة الجيم دائماً.');
  }

  // 15. أدوية التخسيس (GLP-1)
  if (conds.includes('GLP1_USER')) {
    adjusted.proteinGrams = Math.max(adjusted.proteinGrams, Math.round((weightKg || 75) * 2.3));
    adjusted.safetyCues.push('رفع نسبة البروتين لحماية العضلات والاعتماد على السوائل المغذية عند هبوط الشهية.');
  }

  // 16. الروكتان (Isotretinoin)
  if (conds.includes('ROACCUTANE_USER')) {
    adjusted.prohibitedSupplements.push('VITAMIN_A');
    adjusted.safetyCues.push('حظر مكملات فيتامين A والابتعاد عن الوصول للفشل العضلي الشديد لحماية المفاصل وإنزيمات الكبد.');
  }

  // 17. الكورتيزون المزمن
  if (conds.includes('CORTICOSTEROIDS')) {
    adjusted.prescribedNutrients.push('CALCIUM_VITAMIN_D3');
    adjusted.safetyCues.push('حماية كثافة العظام بالحرص على الكالسيوم وفيتامين د، وضبط الصوديوم لتقليل احتباس السوائل.');
  }

  // 18. آلام أسفل الظهر
  if (conds.includes('LOWER_BACK_PAIN')) {
    adjusted.biomechanicalRestrictions.push('NO_AXIAL_LOADING_SQUAT_DEADLIFT');
  }

  // 19. نغزة مفصل الكتف
  if (conds.includes('SHOULDER_IMPINGEMENT')) {
    adjusted.biomechanicalRestrictions.push('SCAPULAR_PLANE_PRESSING_ONLY');
  }

  // 20. آلام صابونة الركبة
  if (conds.includes('PATELLAR_TENDINITIS')) {
    adjusted.biomechanicalRestrictions.push('NO_OPEN_CHAIN_LEG_EXTENSIONS');
  }

  // 21. الفتق والدوالي الشديدة
  if (conds.includes('HERNIA_VARICOSE')) {
    adjusted.biomechanicalRestrictions.push('NO_HEAVY_LEG_PRESS_HIGH_IAP', 'NO_VALSALVA_MANEUVER');
    adjusted.safetyCues.push('تجنب الضغط البطني العنيف وأجهزة الليج بريس الثقيلة، والابتعاد عن الوقوف الثابت لفترات طويلة.');
  }

  // 22. الرضاعة الطبيعية
  if (conds.includes('LACTATION')) {
    adjusted.calories += 450;
    adjusted.biomechanicalRestrictions.push('NO_INTRA_ABDOMINAL_CRUNCHES');
  }

  return adjusted;
}

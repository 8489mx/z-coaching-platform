/**
 * Zero-Conflict Pharmacological Isolation & 22-Condition Clinical Safety Matrix
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
 * Master Omni-Clinical, Pharmacological & Orthopedic Safety Firewall
 * Handles 22 Distinct Medical & Physical Conditions Deterministically
 */
export function evaluateMasterClinicalProfile({
  medicalConditions = [],
  weightKg = 75,
  targetCalories = 2000,
  targetProteinGrams = 150,
  targetCarbGrams = 200,
  targetFatGrams = 60,
  waterLiters = 3.5
}) {
  let adjusted = {
    calories: targetCalories,
    proteinGrams: targetProteinGrams,
    carbGrams: targetCarbGrams,
    fatGrams: targetFatGrams,
    fiberGrams: 28,
    waterLiters: waterLiters || 3.5,
    prohibitedSupplements: [],
    prescribedNutrients: [],
    biomechanicalRestrictions: [],
    cardioProtocol: { type: 'LISS', dailySteps: 8000, maxHeartRateZone: 3 },
    safetyCues: []
  };

  const conds = (Array.isArray(medicalConditions) ? medicalConditions : [medicalConditions])
    .map(c => String(c || '').toUpperCase());

  // 1. سكري الأنسولين
  if (conds.includes('TYPE_1_DIABETES') || conds.includes('TYPE_2_DIABETES_INSULIN') || conds.includes('INSULIN_DEPENDENT')) {
    adjusted.carbGrams = Math.max(adjusted.carbGrams, 130);
    adjusted.safetyCues.push('قاعدة 15-15: احتفظ بـ 15 جم سكر سريع في حقيبة الجيم، وتجنب الحقن السريع في العضلة المستهدفة بالتمرين.');
  }

  // 2. سكري النوع الثاني ومقاومة الإنسولين
  if (conds.includes('TYPE_2_DIABETES_ORAL') || conds.includes('PCOS_IR') || conds.includes('INSULIN_RESISTANCE')) {
    adjusted.fiberGrams = Math.max(adjusted.fiberGrams, 35);
    adjusted.prescribedNutrients.push('LOW_GI_CARBOHYDRATES');
    adjusted.fatGrams = Math.round(adjusted.fatGrams * 1.15); // دعم الهرمونات بالدهون الصحية
    adjusted.safetyCues.push('اعتماد نشويات منخفضة المؤشر الجلايسيمي لحماية حساسية الإنسولين واستقرار الطاقة.');
  }

  // 3. خمول الغدة الدرقية
  if (conds.includes('HYPOTHYROIDISM')) {
    adjusted.calories = Math.round(adjusted.calories * 0.90);
    adjusted.cardioProtocol.dailySteps = 10000;
    adjusted.safetyCues.push('تناول دواء الغدة صباحاً على معدة فارغة وافصله 4 ساعات عن مكملات الكالسيوم والحديد.');
  }

  // 4. الكبد الدهني
  if (conds.includes('FATTY_LIVER')) {
    adjusted.prescribedNutrients.push('ZERO_SIMPLE_FRUCTOSE');
    adjusted.cardioProtocol.dailySteps = 10000;
  }

  // 5. ضغط الدم المرتفع
  if (conds.includes('HYPERTENSION')) {
    adjusted.prohibitedSupplements.push('HIGH_STIM_PREWORKOUT', 'YOHIMBINE', 'FAT_BURNERS');
    adjusted.biomechanicalRestrictions.push('NO_VALSALVA_MANEUVER', 'NO_1RM_TESTING');
    adjusted.safetyCues.push('تنفس بانتظام وتجنب كتم النفس أثناء الرفع، وابتعد تماماً عن مكملات الطاقة العالية.');
  }

  // 6. أدوية السيولة ومضادات التجلط
  if (conds.includes('BLOOD_THINNERS')) {
    adjusted.prohibitedSupplements.push('HIGH_DOSE_OMEGA3_OVER_2000MG', 'VITAMIN_E_HIGH_DOSE', 'GINSENG');
    adjusted.biomechanicalRestrictions.push('NO_HEAVY_CONTACT_TRAINING');
    adjusted.safetyCues.push('تثبيت حصص الخضروات الورقية الخضراء (Vitamin K) وتجنب التغيير المفاجئ في استهلاكها.');
  }

  // 7. الأنيميا ونقص مخزون الحديد
  if (conds.includes('SEVERE_ANEMIA')) {
    adjusted.prescribedNutrients.push('IRON_WITH_VITAMIN_C');
    adjusted.cardioProtocol.type = 'LIGHT_LISS_ONLY';
    adjusted.safetyCues.push('افصل الشاي والقهوة ومنتجات الألبان ساعتين عن وجبات الحديد، وزد فترات الراحة بين الجولات لـ 2.5 دقيقة.');
  }

  // 8. جراحات السمنة وتكميم المعدة
  if (conds.includes('BARIATRIC_SURGERY')) {
    adjusted.proteinGrams = Math.max(adjusted.proteinGrams, Math.round((weightKg || 75) * 2.0));
    adjusted.prescribedNutrients.push('WHEY_ISOLATE_FLUID_SEPARATION');
    adjusted.safetyCues.push('افصل شرب الماء والسوائل عن الوجبة بـ 30 دقيقة قبل وبعد لتجنب الغثيان ومتلازمة الإغراق.');
  }

  // 9. القولون العصبي والحساسيات
  if (conds.includes('IBS')) {
    adjusted.prescribedNutrients.push('LOW_FODMAP_DIET');
    adjusted.safetyCues.push('استبعاد البقوليات غير المنقوعة، المحليات الصناعية الكحولية، واللاكتوز العالي لتفادي تهيج القولون.');
  }

  // 10. ارتجاع المريء
  if (conds.includes('GERD_REFLUX')) {
    adjusted.biomechanicalRestrictions.push('NO_INVERTED_EXERCISES_POST_MEAL');
    adjusted.safetyCues.push('منع تناول وجبات دسمة قبل التمرين بساعتين، وتجنب التمارين المقلوبة أو ارتداء أحزمة البطن الضيقة.');
  }

  // 11. استئصال المرارة
  if (conds.includes('CHOLECYSTECTOMY')) {
    adjusted.safetyCues.push('توزيع الدهون على 4-5 وجبات بحد أقصى 15-20 جم دهون للوجبة الواحدة لضمان راحة الهضم.');
  }

  // 12. القصور الكلوي
  if (conds.includes('RENAL_INSUFFICIENCY')) {
    adjusted.proteinGrams = Math.round((weightKg || 75) * 1.1);
    adjusted.prohibitedSupplements.push('CREATINE');
    adjusted.safetyCues.push('تقنين البروتين عند 1.1 جم/كجم لحماية الكلى مع حظر تام لمكمل الكرياتين.');
  }

  // 13. النقرس واليوريك أسيد
  if (conds.includes('GOUT')) {
    adjusted.waterLiters = Math.max(adjusted.waterLiters, 4.0);
    adjusted.prescribedNutrients.push('LOW_PURINE_PROTEIN_SOURCES');
    adjusted.safetyCues.push('الاعتماد على البيض والجبن القريش والواي بروتين، وشرب 4 لتر ماء يومياً لطرد اليوريك أسيد.');
  }

  // 14. الربو القصبي وحساسية الصدر
  if (conds.includes('BRONCHIAL_ASTHMA')) {
    adjusted.biomechanicalRestrictions.push('EXTENDED_DYNAMIC_WARMUP_15MIN');
    adjusted.cardioProtocol.type = 'GRADUAL_LISS';
    adjusted.safetyCues.push('إحماء تدريجي بطيء لمدة 15 دقيقة، واحتفظ بالبخاخ الوقائي معك دائماً في الجيم.');
  }

  // 15. أدوية التخسيس (GLP-1)
  if (conds.includes('GLP1_USER')) {
    adjusted.proteinGrams = Math.max(adjusted.proteinGrams, Math.round((weightKg || 75) * 2.3));
    adjusted.safetyCues.push('رفع البروتين لحماية العضلات من الهدم والاعتماد على السموذي الغني عند هبوط الشهية.');
  }

  // 16. الروكتان
  if (conds.includes('ROACCUTANE_USER')) {
    adjusted.prohibitedSupplements.push('VITAMIN_A');
    adjusted.prescribedNutrients.push('OMEGA_3_JOINT_SUPPORT');
    adjusted.safetyCues.push('ترطيب مكثف بالماء وأوميجا-3، وتجنب رفع أوزان الإجهاد الأقصى بسبب جفاف الأربطة والمفاصل.');
  }

  // 17. الكورتيزون المزمن
  if (conds.includes('CORTICOSTEROIDS')) {
    adjusted.prescribedNutrients.push('LOW_SODIUM_HIGH_CALCIUM');
    adjusted.proteinGrams = Math.round(adjusted.proteinGrams * 1.15);
  }

  // 18. أسفل الظهر والغضروف
  if (conds.includes('LOWER_BACK_PAIN')) {
    adjusted.biomechanicalRestrictions.push('NO_AXIAL_LOADING_SQUAT_DEADLIFT');
  }

  // 19. نغزة مفصل الكتف
  if (conds.includes('SHOULDER_IMPINGEMENT')) {
    adjusted.biomechanicalRestrictions.push('SCAPULAR_PLANE_PRESSING_ONLY');
  }

  // 20. صابونة الركبة
  if (conds.includes('PATELLAR_TENDINITIS')) {
    adjusted.biomechanicalRestrictions.push('NO_OPEN_CHAIN_LEG_EXTENSIONS');
  }

  // 21. الفتق ودوالي الساقين
  if (conds.includes('HERNIA_VARICOSE')) {
    adjusted.biomechanicalRestrictions.push('NO_VALSALVA_HEAVY_LEG_PRESS', 'PREFER_SEATED_AND_LYING');
    adjusted.safetyCues.push('حظر كتم النفس أثناء الرفع، وتفضيل تمارين الدفع أثناء الجلوس أو الاستلقاء لحماية الأوردة وجدار البطن.');
  }

  // 22. الرضاعة الطبيعية
  if (conds.includes('LACTATION')) {
    adjusted.calories += 450;
    adjusted.biomechanicalRestrictions.push('NO_INTRA_ABDOMINAL_CRUNCHES');
    adjusted.safetyCues.push('إضافة 450 سعرة لدعم إدرار الحليب، وحظر تمارين البطن الطاحنة لحماية عضلات قاع الحوض.');
  }

  return adjusted;
}

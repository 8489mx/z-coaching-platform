/**
 * محرك التحاليل المخبرية والمؤشرات الفسيولوجية الشامل وبروتوكول الغذاء أولاً
 * Clinical Biomarker & Lab Analyzer Engine (Food-First Adaptive Protocol)
 * 
 * المبادئ الحاكمة:
 * 1. لا يعتمد على أي ذكاء اصطناعي توليدي غير منضبط، بل على معادلات سريرية ونطاقات مرجعية قطعية.
 * 2. يمنع تماماً وصف أي أدوية علاجية (Prescription Drugs)؛ بل يصدر إحالة طبية للطبيب المختص عند المؤشرات الحرجة.
 * 3. يدعم بروتوكول "الغذاء أولاً (Food-First)": في حال عدم التزام المشترك بالمكملات، يُعيد المحرك
 *    هندسة جدول الأكل لتعويض النواقص من مصادر طبيعية كاملة مع قواعد الاقتران الحيوي وموانع الامتصاص.
 */

export const BIOMARKER_PANELS = Object.freeze({
  CBC: {
    id: 'CBC',
    title_ar: 'صورة الدم الكاملة (CBC)',
    description_ar: 'كفاءة نقل الأكسجين، الهيموجلوبين، والمناعة والصفائح'
  },
  RENAL: {
    id: 'RENAL',
    title_ar: 'كفاءة الكلى والأملاح (Renal & Electrolytes)',
    description_ar: 'الكرياتينين، معدل الفلترة، اليوريا، وحمض اليوريك'
  },
  LIVER: {
    id: 'LIVER',
    title_ar: 'وظائف وصحة الكبد (Hepatic Panel)',
    description_ar: 'إنزيمات ALT و AST، الألبومين، والبيليروبين'
  },
  GLYCEMIC: {
    id: 'GLYCEMIC',
    title_ar: 'الأيض والسكر ومقاومة الأنسولين (Glycemic & HOMA-IR)',
    description_ar: 'السكر التراكمي، السكر الصائم، والإنسولين الصائم'
  },
  LIPIDS: {
    id: 'LIPIDS',
    title_ar: 'دهون الدم وصحة القلب (Lipid Profile)',
    description_ar: 'الدهون الثلاثية، الكوليسترول الكلي، والنافع والضار'
  },
  MICRONUTRIENTS: {
    id: 'MICRONUTRIENTS',
    title_ar: 'الفيتامينات والمعادن وإجهاد العضلات',
    description_ar: 'فيتامين د، مخزون الحديد، الماغنسيوم، B12، إنزيم CK، والغدة TSH'
  }
});

/**
 * كتالوج المؤشرات الحيوية مع النطاقات الطبيعية والوحدات
 */
export const BIOMARKER_CATALOG = Object.freeze([
  // 1. CBC
  { key: 'hemoglobin', panel: 'CBC', name_ar: 'الهيموجلوبين (Hemoglobin)', unit: 'g/dL', normal_min_m: 13.5, normal_max_m: 17.5, normal_min_f: 12.0, normal_max_f: 15.5 },
  { key: 'wbc', panel: 'CBC', name_ar: 'كرات الدم البيضاء (WBC)', unit: '10^3/uL', normal_min_m: 4.0, normal_max_m: 11.0, normal_min_f: 4.0, normal_max_f: 11.0 },
  { key: 'platelets', panel: 'CBC', name_ar: 'الصفائح الدموية (Platelets)', unit: '10^3/uL', normal_min_m: 150, normal_max_m: 450, normal_min_f: 150, normal_max_f: 450 },
  { key: 'hematocrit', panel: 'CBC', name_ar: 'الهيماتوكريت (Hematocrit)', unit: '%', normal_min_m: 41, normal_max_m: 50, normal_min_f: 36, normal_max_f: 48 },

  // 2. Renal
  { key: 'creatinine', panel: 'RENAL', name_ar: 'الكرياتينين (Creatinine)', unit: 'mg/dL', normal_min_m: 0.7, normal_max_m: 1.3, normal_min_f: 0.5, normal_max_f: 1.1 },
  { key: 'egfr', panel: 'RENAL', name_ar: 'معدل الترشيح الكلوي (eGFR)', unit: 'mL/min/1.73m²', normal_min_m: 90, normal_max_m: 140, normal_min_f: 90, normal_max_f: 140 },
  { key: 'bun', panel: 'RENAL', name_ar: 'يوريا الدم (BUN / Urea)', unit: 'mg/dL', normal_min_m: 7, normal_max_m: 20, normal_min_f: 7, normal_max_f: 20 },
  { key: 'uric_acid', panel: 'RENAL', name_ar: 'حمض اليوريك (Uric Acid)', unit: 'mg/dL', normal_min_m: 3.5, normal_max_m: 7.2, normal_min_f: 2.6, normal_max_f: 6.0 },
  { key: 'potassium', panel: 'RENAL', name_ar: 'البوتاسيوم (Potassium)', unit: 'mEq/L', normal_min_m: 3.5, normal_max_m: 5.0, normal_min_f: 3.5, normal_max_f: 5.0 },

  // 3. Liver
  { key: 'alt', panel: 'LIVER', name_ar: 'إنزيم الكبد (ALT / SGPT)', unit: 'U/L', normal_min_m: 10, normal_max_m: 45, normal_min_f: 7, normal_max_f: 35 },
  { key: 'ast', panel: 'LIVER', name_ar: 'إنزيم الكبد (AST / SGOT)', unit: 'U/L', normal_min_m: 10, normal_max_m: 40, normal_min_f: 9, normal_max_f: 32 },
  { key: 'albumin', panel: 'LIVER', name_ar: 'ألبومين الدم (Albumin)', unit: 'g/dL', normal_min_m: 3.5, normal_max_m: 5.5, normal_min_f: 3.5, normal_max_f: 5.5 },
  { key: 'total_bilirubin', panel: 'LIVER', name_ar: 'الصفراء الكلية (Total Bilirubin)', unit: 'mg/dL', normal_min_m: 0.2, normal_max_m: 1.2, normal_min_f: 0.2, normal_max_f: 1.2 },

  // 4. Glycemic
  { key: 'fasting_glucose', panel: 'GLYCEMIC', name_ar: 'السكر الصائم (Fasting Glucose)', unit: 'mg/dL', normal_min_m: 70, normal_max_m: 99, normal_min_f: 70, normal_max_f: 99 },
  { key: 'hba1c', panel: 'GLYCEMIC', name_ar: 'السكر التراكمي (HbA1c)', unit: '%', normal_min_m: 4.0, normal_max_m: 5.6, normal_min_f: 4.0, normal_max_f: 5.6 },
  { key: 'fasting_insulin', panel: 'GLYCEMIC', name_ar: 'الإنسولين الصائم (Fasting Insulin)', unit: 'uIU/mL', normal_min_m: 2.6, normal_max_m: 10.0, normal_min_f: 2.6, normal_max_f: 10.0 },

  // 5. Lipids
  { key: 'triglycerides', panel: 'LIPIDS', name_ar: 'الدهون الثلاثية (Triglycerides)', unit: 'mg/dL', normal_min_m: 50, normal_max_m: 150, normal_min_f: 50, normal_max_f: 150 },
  { key: 'total_cholesterol', panel: 'LIPIDS', name_ar: 'الكوليسترول الكلي (Total Cholesterol)', unit: 'mg/dL', normal_min_m: 125, normal_max_m: 200, normal_min_f: 125, normal_max_f: 200 },
  { key: 'hdl', panel: 'LIPIDS', name_ar: 'الكوليسترول النافع (HDL-C)', unit: 'mg/dL', normal_min_m: 40, normal_max_m: 80, normal_min_f: 50, normal_max_f: 90 },
  { key: 'ldl', panel: 'LIPIDS', name_ar: 'الكوليسترول الضار (LDL-C)', unit: 'mg/dL', normal_min_m: 50, normal_max_m: 100, normal_min_f: 50, normal_max_f: 100 },

  // 6. Micronutrients & Hormones
  { key: 'vitamin_d', panel: 'MICRONUTRIENTS', name_ar: 'فيتامين د (Vitamin D3 25-OH)', unit: 'ng/mL', normal_min_m: 30, normal_max_m: 100, normal_min_f: 30, normal_max_f: 100 },
  { key: 'ferritin', panel: 'MICRONUTRIENTS', name_ar: 'مخزون الحديد (Serum Ferritin)', unit: 'ng/mL', normal_min_m: 30, normal_max_m: 300, normal_min_f: 20, normal_max_f: 200 },
  { key: 'vitamin_b12', panel: 'MICRONUTRIENTS', name_ar: 'فيتامين ب12 (Vitamin B12)', unit: 'pg/mL', normal_min_m: 200, normal_max_m: 900, normal_min_f: 200, normal_max_f: 900 },
  { key: 'magnesium', panel: 'MICRONUTRIENTS', name_ar: 'الماغنسيوم (Serum Magnesium)', unit: 'mg/dL', normal_min_m: 1.8, normal_max_m: 2.4, normal_min_f: 1.8, normal_max_f: 2.4 },
  { key: 'creatine_kinase', panel: 'MICRONUTRIENTS', name_ar: 'إنزيم إجهاد العضلات (CK / CPK)', unit: 'U/L', normal_min_m: 30, normal_max_m: 200, normal_min_f: 30, normal_max_f: 170 },
  { key: 'tsh', panel: 'MICRONUTRIENTS', name_ar: 'محفز الغدة الدرقية (TSH)', unit: 'uIU/mL', normal_min_m: 0.4, normal_max_m: 4.0, normal_min_f: 0.4, normal_max_f: 4.0 }
]);

/**
 * حساب معامل مقاومة الأنسولين HOMA-IR بدقة رياضية
 * المعادلة: (السكر الصائم * الإنسولين الصائم) / 405
 */
export function calculateHomaIR(fastingGlucose, fastingInsulin) {
  const g = Number(fastingGlucose);
  const i = Number(fastingInsulin);
  if (!g || !i || g <= 0 || i <= 0) return null;
  const val = (g * i) / 405;
  return Number(val.toFixed(2));
}

/**
 * المحرك السريري الرئيسي لتحليل الفحوصات الطبية وتطبيق بروتوكول الغذاء أولاً
 */
export function evaluateClinicalBiomarkers({
  values = {},
  client = {},
  supplementAdherence = 'FULL' // 'FULL' (يأخذ مكملات) أو 'NONE' (غذاء طبيعي فقط 100%)
}) {
  const gender = (client.gender || 'MALE').toUpperCase();
  const isMale = gender === 'MALE';
  const weightKg = Number(client.weight_kg || client.weight || 75);

  const flags = [];
  const dietaryModifications = {
    protein_cap_g_per_kg: null,
    min_fiber_g: 28,
    saturated_fat_cap_percent: 10,
    withhold_creatine: false,
    complex_carbs_only: false,
    daily_water_target_liters: 3.5,
    sodium_limit_mg: null
  };

  const trainingModifications = {
    reduce_intensity: false,
    enforce_deload: false,
    cardio_mode: 'STANDARD', // 'STANDARD' | 'LOW_IMPACT_LISS_ONLY'
    notes_ar: []
  };

  const supplementRecommendations = [];
  const wholeFoodInterventions = [];
  const medicalReferrals = [];

  // دالة مساعدة لاستخراج الرقم بأمان
  const num = (k) => {
    const v = values[k];
    return (v !== undefined && v !== null && v !== '') ? Number(v) : null;
  };

  const hb = num('hemoglobin');
  const wbc = num('wbc');
  const creat = num('creatinine');
  const egfr = num('egfr');
  const bun = num('bun');
  const uric = num('uric_acid');
  const alt = num('alt');
  const ast = num('ast');
  const fbg = num('fasting_glucose');
  const hba1c = num('hba1c');
  const fInsulin = num('fasting_insulin');
  const tg = num('triglycerides');
  const chol = num('total_cholesterol');
  const ldl = num('ldl');
  const vitD = num('vitamin_d');
  const ferr = num('ferritin');
  const b12 = num('vitamin_b12');
  const mg = num('magnesium');
  const ck = num('creatine_kinase');
  const tsh = num('tsh');

  // حساب HOMA-IR تلقائياً
  const homaIR = calculateHomaIR(fbg, fInsulin);

  // -------------------------------------------------------------
  // 1. فحص كفاءة الكلى (Renal Safety Guardrails)
  // -------------------------------------------------------------
  const isCreatinineHigh = creat !== null && (isMale ? creat > 1.3 : creat > 1.1);
  const isEgfrLow = egfr !== null && egfr < 60;

  if (isCreatinineHigh || isEgfrLow) {
    const isCritical = (creat && creat > 1.8) || (egfr && egfr < 45);
    flags.push({
      panel: 'RENAL',
      severity: isCritical ? 'CRITICAL' : 'HIGH',
      title_ar: 'إجهاد كلوي وتراجع في كفاءة الترشيح',
      details_ar: `مؤشر الكرياتينين (${creat || '-'} mg/dL) أو معدل الترشيح (${egfr || '-'}) يتطلب حماية كلوية صارمة.`
    });

    dietaryModifications.protein_cap_g_per_kg = isCritical ? 0.9 : 1.1;
    dietaryModifications.withhold_creatine = true;
    dietaryModifications.daily_water_target_liters = 4.0;

    if (isCritical) {
      medicalReferrals.push('مستوى الكرياتينين مرتفع بشكل ملحوظ؛ يلزم توجيه المشترك فوراً لاستشارة طبيب كلى مختص.');
    }
  }

  // حمض اليوريك (Uric Acid)
  if (uric !== null && (isMale ? uric > 7.2 : uric > 6.0)) {
    flags.push({
      panel: 'RENAL',
      severity: 'MODERATE',
      title_ar: 'ارتفاع حمض اليوريك (مؤشر النقرس)',
      details_ar: `حمض اليوريك (${uric} mg/dL) يستدعي تقنين اللحوم الحمراء ومصادر البيورين العالية.`
    });
    dietaryModifications.daily_water_target_liters = Math.max(dietaryModifications.daily_water_target_liters, 4.0);
    wholeFoodInterventions.push({
      food_title_ar: 'استبدال اللحوم الحمراء بالدجاج والأسماك البيضاء وبياض البيض',
      rationale_ar: 'لخفض محتوى البيورين الغذائي ومنع ترسب بلورات اليوريك في المفاصل.',
      priority: 'HIGH'
    });
  }

  // -------------------------------------------------------------
  // 2. فحص الأيض، السكر، ومقاومة الأنسولين (Glycemic Panel)
  // -------------------------------------------------------------
  const isPreDiabetes = (hba1c !== null && hba1c >= 5.7) || (fbg !== null && fbg >= 100) || (homaIR !== null && homaIR >= 2.5);
  const isDiabetesRange = (hba1c !== null && hba1c >= 6.5) || (fbg !== null && fbg >= 126);

  if (isPreDiabetes) {
    flags.push({
      panel: 'GLYCEMIC',
      severity: isDiabetesRange ? 'CRITICAL' : 'MODERATE',
      title_ar: isDiabetesRange ? 'مؤشرات سكر دم مرتفعة (نطاق السكري)' : 'مؤشرات مقاومة أنسولين أو مرحلة ما قبل السكري',
      details_ar: `HbA1c: ${hba1c || '-'}% | سكر صائم: ${fbg || '-'} mg/dL | HOMA-IR: ${homaIR || '-'}`
    });

    dietaryModifications.min_fiber_g = 35;
    dietaryModifications.complex_carbs_only = true;

    if (isDiabetesRange) {
      medicalReferrals.push('قراءات السكر تتطلب مراجعة طبية لدى طبيب غدد وباطنة لضبط الحالة علاجياً.');
    }

    // توصية مكملات (في حال الالتزام)
    supplementRecommendations.push({
      name_ar: 'بيكولينات الكروميوم (Chromium Picolinate)',
      dosage_ar: '200 ميكروجرام يومياً مع وجبة غداء رئيسية',
      purpose_ar: 'لتحسين حساسية مستقبلات الأنسولين ودعم دخول الجلوكوز للخلايا العضلية'
    });

    // بروتوكول الغذاء الطبيعي البديل
    wholeFoodInterventions.push({
      food_title_ar: 'بروتوكول النشا المقاوم والألياف الصلبة (Resistant Starch Protocol)',
      rationale_ar: 'إدراج الشوفان الكامل، البطاطا المسلوقة والمبردة، وبذور الشيا مع الوجبات؛ وتتبيل طبق السلطة بملعقة خل تفاح طبيعي لخفض استجابة الأنسولين بعد الأكل.',
      priority: 'CRITICAL'
    });
  }

  // -------------------------------------------------------------
  // 3. صحة الكبد والدهون الثلاثية (Hepatic & Lipids)
  // -------------------------------------------------------------
  const isLiverElevated = (alt !== null && alt > 45) || (ast !== null && ast > 40);
  const isTriglyceridesHigh = tg !== null && tg > 150;
  const isLdlHigh = ldl !== null && ldl > 130;

  if (isLiverElevated || isTriglyceridesHigh || isLdlHigh) {
    flags.push({
      panel: 'LIVER',
      severity: (alt && alt > 90) ? 'HIGH' : 'MODERATE',
      title_ar: 'إجهاد كبدي أو اضطراب في دهون الدم',
      details_ar: `ALT: ${alt || '-'} U/L | الدهون الثلاثية: ${tg || '-'} mg/dL | LDL: ${ldl || '-'} mg/dL`
    });

    dietaryModifications.saturated_fat_cap_percent = 7;

    supplementRecommendations.push({
      name_ar: 'أوميجا 3 نقي عالي التركيز (High EPA/DHA Fish Oil)',
      dosage_ar: '2,000 إلى 3,000 مجم يومياً مقسمة مع الوجبات',
      purpose_ar: 'لخفض الدهون الثلاثية ومحاربة الالتهاب الكبدي'
    });

    wholeFoodInterventions.push({
      food_title_ar: 'بروتوكول الأوميجا الطبيعي والدهون الأحادية غير المشبعة',
      rationale_ar: 'إدراج 2-3 حصص أسبوعياً من أسماك السلمون أو السردين أو التونة الطازجة، واستخدام زيت الزيتون البكر الممتاز، وتناول 20 جم بذور كتان أو عين جمل يومياً.',
      priority: 'HIGH'
    });
  }

  // -------------------------------------------------------------
  // 4. نقص فيتامين د (Vitamin D3)
  // -------------------------------------------------------------
  if (vitD !== null && vitD < 30) {
    const isSevere = vitD < 20;
    flags.push({
      panel: 'MICRONUTRIENTS',
      severity: isSevere ? 'HIGH' : 'MODERATE',
      title_ar: isSevere ? 'نقص حاد في فيتامين د' : 'انخفاض مخزون فيتامين د',
      details_ar: `المستوى الحالي: ${vitD} ng/mL (المستهدف الرياضي: 40 - 70 ng/mL). يؤثر سلباً على القوة العضلية وتخليق البروتين والمناعة.`
    });

    supplementRecommendations.push({
      name_ar: 'فيتامين د3 مع ك2 (Vitamin D3 5000 IU + K2 MK-7)',
      dosage_ar: '5,000 وحدة دولية يومياً مع وجبة تحوي دهوناً صحية لضمان الامتصاص',
      purpose_ar: 'لتعويض النقص الحاد وتحسين امتصاص الكالسيوم وبناء الكتلة العضلية'
    });

    wholeFoodInterventions.push({
      food_title_ar: 'بروتوكول تعويض فيتامين د الطبيعي والشمس الصباحية',
      rationale_ar: 'تناول صفار 2 بيض مسلوق يومياً، والأسماك الدهنية (ماكريل، سردين، سلمون)، والتعرض لأشعة الشمس المباشرة من 15 إلى 20 دقيقة صباحاً.',
      priority: 'HIGH'
    });
  }

  // -------------------------------------------------------------
  // 5. نقص مخزون الحديد (Ferritin) والأنيميا (Hemoglobin)
  // -------------------------------------------------------------
  const isFerritinLow = ferr !== null && (isMale ? ferr < 30 : ferr < 20);
  const isAnemia = hb !== null && (isMale ? hb < 13.0 : hb < 11.5);

  if (isFerritinLow || isAnemia) {
    flags.push({
      panel: 'MICRONUTRIENTS',
      severity: 'HIGH',
      title_ar: isAnemia ? 'أنيميا نقص الحديد ونقص كفاءة الأكسجين' : 'انخفاض مخزون الحديد (Ferritin)',
      details_ar: `الهيموجلوبين: ${hb || '-'} g/dL | مخزون الحديد: ${ferr || '-'} ng/mL. يسبب خمولاً سريعاً وسرعة ضربات القلب أثناء التدريب.`
    });

    trainingModifications.cardio_mode = 'LOW_IMPACT_LISS_ONLY';
    trainingModifications.notes_ar.push('تحويل الكارديو من عالي الشدة (HIIT) إلى مشي استشفائي منتظم (LISS) لمنع ضيق التنفس.');

    supplementRecommendations.push({
      name_ar: 'مكمل حديد عضوي لطيف (Iron Bisglycinate + Vitamin C)',
      dosage_ar: '25 - 30 مجم حديد مخلبي لطيف على المعدة صباحاً مع فيتامين سي على معدة فارغة',
      purpose_ar: 'لإعادة ملء مخازن الفيريتين دون التسبب في إمساك أو اضطرابات هضمية'
    });

    wholeFoodInterventions.push({
      food_title_ar: 'بروتوكول الحديد الهيمي ومحفزات الامتصاص الطبيعية',
      rationale_ar: 'إدراج كبدة بقري طازجة (150 جم) مرتين أسبوعياً أو لحم بقري أحمر، وعصر ليمون طازج وإضافة فلفل رومي أحمر كمصدر طبيعي فائق لفيتامين C لزيادة امتصاص الحديد 3 أضعاف. منع الشاي والقهوة والألبان بساعتين قبل وبعد الوجبة.',
      priority: 'CRITICAL'
    });
  }

  // -------------------------------------------------------------
  // 6. نقص فيتامين ب12 (Vitamin B12)
  // -------------------------------------------------------------
  if (b12 !== null && b12 < 250) {
    flags.push({
      panel: 'MICRONUTRIENTS',
      severity: 'MODERATE',
      title_ar: 'انخفاض فيتامين ب12 (صحة الأعصاب والطاقة)',
      details_ar: `المستوى الحالي: ${b12} pg/mL. مهم لانتقال الإشارات العصبية العضلية وتصنيع كرات الدم الحمراء.`
    });

    supplementRecommendations.push({
      name_ar: 'ميثيل كوبالامين (Methylcobalamin B12)',
      dosage_ar: '1,000 ميكروجرام حبة استحلاب تحت اللسان يومياً',
      purpose_ar: 'لدعم الجهاز العصبي المركزي ومحاربة الخمول'
    });

    wholeFoodInterventions.push({
      food_title_ar: 'مصادر B12 الطبيعية المركزة',
      rationale_ar: 'تناول لحوم الدواجن، البيض البلدي، السلمون، والجبن القريش الطبيعي.',
      priority: 'MODERATE'
    });
  }

  // -------------------------------------------------------------
  // 7. إنزيم تكسير العضلات (Creatine Kinase - CK)
  // -------------------------------------------------------------
  if (ck !== null && ck > (isMale ? 350 : 250)) {
    const isRhabdoRisk = ck > 1000;
    flags.push({
      panel: 'MICRONUTRIENTS',
      severity: isRhabdoRisk ? 'CRITICAL' : 'HIGH',
      title_ar: isRhabdoRisk ? 'خطر انحلال عضلي حاد (Rhabdomyolysis Risk)' : 'إجهاد عضلي مفرط وتراكم هدمي (Overtraining)',
      details_ar: `إنزيم CK سجل (${ck} U/L). الألياف العضلية تعاني من تلف شديد يتطلب إيقاف التمرين الشاق فوراً.`
    });

    trainingModifications.enforce_deload = true;
    trainingModifications.reduce_intensity = true;
    trainingModifications.notes_ar.push('تفعيل أسبوع ديلود (Deload) إلزامي؛ خفض أحجام التمرين بنسبة 50% وتفادي الفشل العضلي.');
    dietaryModifications.daily_water_target_liters = Math.max(dietaryModifications.daily_water_target_liters, 4.5);

    if (isRhabdoRisk) {
      medicalReferrals.push('ارتفاع إنزيم CK أعلى من 1,000 U/L يستلزم راحة تامة ومراجعة طبية عاجلة لفحص وظائف الكلى واختبار الميوجلوبين.');
    }
  }

  // -------------------------------------------------------------
  // 8. الغدة الدرقية (TSH)
  // -------------------------------------------------------------
  if (tsh !== null && tsh > 4.5) {
    flags.push({
      panel: 'MICRONUTRIENTS',
      severity: tsh > 7.0 ? 'HIGH' : 'MODERATE',
      title_ar: 'مؤشرات كسل الغدة الدرقية (Hypothyroidism)',
      details_ar: `هرمون TSH سجل (${tsh} uIU/mL). يفسر بطء معدل الحرق وصعوبة نزول الوزن واحتباس السوائل.`
    });

    wholeFoodInterventions.push({
      food_title_ar: 'بروتوكول اليود والسيلينيوم الطبيعي',
      rationale_ar: 'استخدام الملح المعالج باليود، وتناول 2 حبة جوز برازيلي (Brazil Nuts) أسبوعياً كمصدر طبيعي فائق للسيلينيوم لدعم تحول هرمون T4 إلى T3 النشط.',
      priority: 'HIGH'
    });

    if (tsh > 6.0) {
      medicalReferrals.push('يُنصح المشترك بمراجعة طبيب غدد صماء لتحديد الحاجة إلى هرمون الثيروكسين التعويضي.');
    }
  }

  // فرز الأولوية في التدخل الغذائي
  const isFoodOnly = supplementAdherence === 'NONE';

  return {
    has_flags: flags.length > 0,
    flags_count: flags.length,
    flags,
    homa_ir: homaIR,
    supplement_adherence: supplementAdherence,
    is_food_only_mode: isFoodOnly,
    dietary_modifications: dietaryModifications,
    training_modifications: trainingModifications,
    supplement_recommendations: isFoodOnly ? [] : supplementRecommendations,
    whole_food_interventions: wholeFoodInterventions,
    medical_referrals: medicalReferrals,
    summary_directive_ar: isFoodOnly 
      ? 'تم تفعيل بروتوكول "الغذاء أولاً (Food-First)"؛ حيث تمت هندسة وجبات المشترك اليومية لتعويض كافة المؤشرات الناقصة من مصادر طبيعية 100% دون أي مكملات.' 
      : 'تم إعداد خطة المكملات التعويضية وجدران الحماية الغذائية لمطابقة التحاليل المخبرية بأعلى درجات الأمان.'
  };
}

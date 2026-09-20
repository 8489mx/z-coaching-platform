/**
 * Clinical Supplement Safety & Interaction Engine
 * Z Coaching Platform - Clinical Hardening Matrix
 *
 * Deterministic engine for screening prescribed or candidate dietary supplements
 * against trainee medical conditions, active pharmacotherapy, and clinical biomarkers.
 * Strictly adheres to Arabic RTL directives and zero emojis.
 */

export const SUPPLEMENT_REGISTRY = {
  CREATINE: {
    code: 'CREATINE',
    name_ar: 'الكرياتين مونوهيدرات',
    name_en: 'Creatine Monohydrate',
    standard_dosage: '3 - 5 جم يومياً',
    category: 'PERFORMANCE',
    contraindicated_conditions: ['RENAL_INSUFFICIENCY', 'CHRONIC_KIDNEY_DISEASE', 'KIDNEY_FAILURE', 'قصور كلوي', 'كلى'],
    contraindicated_biomarkers: [
      { key: 'egfr', max: 60, reason_ar: 'انخفاض معدل الترشيح الكبيبي عن 60 mL/min/1.73m²' },
      { key: 'creatinine', min: 1.3, reason_ar: 'ارتفاع الكرياتينين المصلي في الدم' }
    ],
    contraindicated_medications: [],
    caution_conditions: ['DEHYDRATION_PRONE', 'SEVERE_CRAMPING'],
    caution_medications: ['NEPHROTOXIC_DRUGS', 'NSAIDs_CHRONIC'],
    clinical_rationale_ar: 'الكرياتين يزيد من الحمل الترشيحي على الكلى وقد يرفع قراءة الكرياتينين المصلي بشكل خادع، مما يضر بالمتابعة الدقيقة للقصور الكلوي.',
    safe_rationale_ar: 'مكمل فعال وآمن بنسبة 100% لتحسين القوة العضلية وإعادة تخليق الـ ATP في غياب موانع وظائف الكلى.',
    action_on_contraindication_ar: 'استبعاد الكرياتين فوراً والاعتماد على مصادر البروتين الطبيعية مع وفرة السوائل.'
  },
  HIGH_STIM_PREWORKOUT: {
    code: 'HIGH_STIM_PREWORKOUT',
    name_ar: 'محفزات الطاقة العالية (Pre-Workout)',
    name_en: 'High-Stim Pre-Workout',
    standard_dosage: 'سكوب واحد قبل التمرين بـ 30 دقيقة',
    category: 'STIMULANT',
    contraindicated_conditions: [
      'HYPERTENSION', 'HEART_DISEASE', 'ARRHYTHMIA', 'CORONARY_ARTERY_DISEASE', 
      'ANXIETY_DISORDER', 'PREGNANCY', 'ضغط دم مرتفع', 'قلب', 'حمل'
    ],
    contraindicated_biomarkers: [
      { key: 'systolic_bp', min: 140, reason_ar: 'ضغط الدم الانقباضي أعلى من 140 mmHg' },
      { key: 'diastolic_bp', min: 90, reason_ar: 'ضغط الدم الانبساطي أعلى من 90 mmHg' }
    ],
    contraindicated_medications: ['BETA_BLOCKERS', 'ACE_INHIBITORS', 'ARBs', 'أدوية ضغط'],
    caution_conditions: ['INSOMNIA', 'GERD', 'قرحة معدة', 'أرق'],
    caution_medications: ['SSRIs'],
    clinical_rationale_ar: 'الجرعات العالية من الكافيين والمحفزات تؤدي لتضيق الأوعية الدموية وارتفاع حاد في ضغط الدم وزيادة ضربات القلب مما يشكل خطراً قلبياً داهماً.',
    safe_rationale_ar: 'يحسن التركيز والقدرة التدريبية في حال الاستقرار القلبي وضغط الدم الطبيعي.',
    action_on_contraindication_ar: 'حظر مكملات الطاقة العالية واستبدالها بكوب قهوة معتدل أو محفزات خالية من الكافيين (Non-Stim Pump).'
  },
  YOHIMBINE: {
    code: 'YOHIMBINE',
    name_ar: 'اليوهمبين وحوارق الدهون القاسية',
    name_en: 'Yohimbine / Hardcore Fat Burners',
    standard_dosage: '0.2 مجم/كجم',
    category: 'STIMULANT',
    contraindicated_conditions: [
      'HYPERTENSION', 'HEART_DISEASE', 'ANXIETY_DISORDER', 'PANIC_ATTACKS', 'PREGNANCY', 'ضغط', 'توتر'
    ],
    contraindicated_biomarkers: [],
    contraindicated_medications: ['ANTIDEPRESSANTS', 'MAOIs', 'HYPERTENSIVE_MEDS'],
    caution_conditions: ['FASTING_TRAINING'],
    caution_medications: [],
    clinical_rationale_ar: 'اليوهمبين مضاد لمستقبلات ألفا-2 الأدرينالية ويزيد بشكل مفرط من النورأدرينالين مسبباً نوبات هلع وخفقان قلبي حاد وارتفاع مباغت في الضغط.',
    safe_rationale_ar: 'يساعد في أكسدة الدهون المستعصية أثناء الصيام فقط للرياضيين الأصحاء تماماً.',
    action_on_contraindication_ar: 'حظر تام ونهائي لليوهيمبين واستبداله بنمط العجز السعري المنتظم وخطوات النشاط NEAT.'
  },
  HIGH_DOSE_OMEGA3: {
    code: 'HIGH_DOSE_OMEGA3',
    name_ar: 'زيت السمك أوميجا 3 عالي التركيز (>2000 مجم)',
    name_en: 'High-Dose Omega-3 Fish Oil',
    standard_dosage: '1000 - 3000 مجم EPA/DHA',
    category: 'HEALTH_RECOVERY',
    contraindicated_conditions: ['BLEEDING_DISORDERS', 'HEMOPHILIA', 'سيولة دم'],
    contraindicated_biomarkers: [
      { key: 'inr', min: 3.0, reason_ar: 'معدل سيولة الدم INR أعلى من 3.0' }
    ],
    contraindicated_medications: ['WARFARIN', 'COUMADIN', 'PLAVIX', 'HEPARIN', 'مسيلات دم قوية'],
    caution_conditions: ['UPCOMING_SURGERY'],
    caution_medications: ['ASPIRIN'],
    clinical_rationale_ar: 'الأوميجا 3 بجرعات تفوق 2000 مجم يمتلك خصائص مضادة لتجمع الصفائح الدموية، مما يضاعف خطر النزيف عند تزامنه مع مضادات التخثر.',
    safe_rationale_ar: 'مضاد التهاب فعال لدعم صحة الشرايين وتخفيف آلام المفاصل وخفض الدهون الثلاثية.',
    action_on_contraindication_ar: 'تخفيض الجرعة إلى 1000 مجم كحد أقصى أو الاكتفاء بالأسماك الدهنية الطبيعية مرة إلى مرتين أسبوعياً بعد استشارة الطبيب.'
  },
  ASHWAGANDHA: {
    code: 'ASHWAGANDHA',
    name_ar: 'عشبة الأشواغاندا (KSM-66)',
    name_en: 'Ashwagandha',
    standard_dosage: '300 - 600 مجم يومياً',
    category: 'ADAPTOGEN',
    contraindicated_conditions: [
      'HYPERTHYROIDISM', 'THYROTOXICOSIS', 'AUTOIMMUNE_DISEASE', 'LUPUS', 'RHEUMATOID_ARTHRITIS', 'PREGNANCY', 'نشاط الغدة'
    ],
    contraindicated_biomarkers: [
      { key: 'tsh', max: 0.4, reason_ar: 'هرمون TSH منخفض جداً دلالة على فرط نشاط الغدة' }
    ],
    contraindicated_medications: ['THYROID_MEDS_HYPER'],
    caution_conditions: ['HYPOTHYROIDISM'],
    caution_medications: ['ELTROXIN', 'EUTHYROX', 'LEVOTHYROXINE', 'غدة'],
    clinical_rationale_ar: 'الأشواغاندا تحفز إفراز هرمونات الغدة الدرقية (T3 و T4) وقد تؤدي لتسمم درقي لمرضى فرط النشاط، كما قد تزيد نشاط الجهاز المناعي في الأمراض المناعية الذاتية.',
    safe_rationale_ar: 'يساعد في خفض الكورتيزول وتحسين جودة النوم ومقاومة الضغوط اليومية.',
    action_on_contraindication_ar: 'استبعاد الأشواغاندا فوراً واستبدالها بالمغنيسيوم جلايسينات وتنظيم أوقات النوم.'
  },
  CITRULLINE_MALATE: {
    code: 'CITRULLINE_MALATE',
    name_ar: 'سيترولين ماليت (L-Citrulline Malate)',
    name_en: 'Citrulline Malate',
    standard_dosage: '6 - 8 جم قبل التمرين',
    category: 'PERFORMANCE',
    contraindicated_conditions: ['HYPOTENSION', 'هبوط ضغط حاد'],
    contraindicated_biomarkers: [
      { key: 'systolic_bp', max: 90, reason_ar: 'ضغط الدم الانقباضي منخفض جداً أقل من 90 mmHg' }
    ],
    contraindicated_medications: ['NITRATES', 'NITROGLYCERIN', 'PDE5_INHIBITORS', 'VIAGRA', 'CIALIS'],
    caution_conditions: ['MILD_HYPOTENSION'],
    caution_medications: ['ANTIHYPERTENSIVES'],
    clinical_rationale_ar: 'السيترولين يرفع أكسيد النيتريك (NO) ويوسع الشرايين بشدة، وتزامنه مع النترات أو مثبطات PDE5 قد يسبب هبوطاً مفاجئاً وقاتلاً في ضغط الدم.',
    safe_rationale_ar: 'يعزز الضخ الدموي العضلي وتوصيل الأكسجين وتأخير الإجهاد أثناء التمرين.',
    action_on_contraindication_ar: 'حظر السيترولين للمرضى الذين يتناولون أدوية موسعة للشرايين أو يعانون من هبوط الضغط.'
  },
  IRON: {
    code: 'IRON',
    name_ar: 'مكمل الحديد (Ferrous Bisglycinate)',
    name_en: 'Iron Supplement',
    standard_dosage: '25 - 50 مجم مع فيتامين C',
    category: 'HEALTH_RECOVERY',
    contraindicated_conditions: ['HEMOCHROMATOSIS', 'IRON_OVERLOAD', 'فرط ترسيب الحديد'],
    contraindicated_biomarkers: [
      { key: 'ferritin', min: 300, reason_ar: 'مخزون الفيريتين مرتفع أعلى من 300 ng/mL' }
    ],
    contraindicated_medications: [],
    caution_conditions: ['CONSTIPATION_PRONE'],
    caution_medications: ['LEVOTHYROXINE', 'ANTIBIOTICS', 'CALCIUM_SUPPLEMENTS'],
    clinical_rationale_ar: 'تناول مكملات الحديد مع وجود مستويات فيريتين طبيعية أو مرتفعة يسبب تراكم الحديد في الكبد والقلب وأنسجة البنكرياس مسبباً تسمماً نسيجياً.',
    safe_rationale_ar: 'علاج فعال وسريع لأنيميا نقص الحديد ورفع كفاءة نقل الأكسجين للعضلات.',
    action_on_contraindication_ar: 'منع مكمل الحديد والاعتماد على التحاليل الدورية، والفصل الإلزامي 4 ساعات عن حبة الغدة ومنتجات الألبان عند الاستخدام.'
  },
  BERBERINE: {
    code: 'BERBERINE',
    name_ar: 'البربرين (Berberine HCl)',
    name_en: 'Berberine',
    standard_dosage: '500 مجم مرتين إلى ثلاث مرات مع الوجبات',
    category: 'GLUCOSE_DISPOSAL',
    contraindicated_conditions: ['SEVERE_HYPOGLYCEMIA', 'PREGNANCY', 'BREASTFEEDING'],
    contraindicated_biomarkers: [
      { key: 'fasting_glucose', max: 70, reason_ar: 'سكر الدم الصائم منخفض أقل من 70 mg/dL' }
    ],
    contraindicated_medications: ['INSULIN', 'SULFONYLUREAS', 'انسولين'],
    caution_conditions: ['TYPE_2_DIABETES_ORAL'],
    caution_medications: ['METFORMIN', 'سيدوفاج'],
    clinical_rationale_ar: 'البربرين ينشط بروتين AMPK ويخفض سكر الدم بكفاءة توازي الميتفورمين؛ تزامنه مع الأنسولين أو السلفونيل يوريا يهدد بحدوث هبوط سكر حاد (Hypoglycemia).',
    safe_rationale_ar: 'يحسن حساسية الأنسولين ويقلل مقاومة الأنسولين وتكيس المبايض ويدعم ضبط الدهون.',
    action_on_contraindication_ar: 'استشارة الطبيب لتعديل جرعات أدوية السكر، أو استخدام القرفة والكروميوم كبدائل أكثر اعتدالاً.'
  },
  WHEY_PROTEIN: {
    code: 'WHEY_PROTEIN',
    name_ar: 'واي بروتين (Whey Protein)',
    name_en: 'Whey Protein',
    standard_dosage: '1 - 2 سكوب (25 - 50 جم بروتين)',
    category: 'PROTEIN',
    contraindicated_conditions: ['SEVERE_MILK_ANAPHYLAXIS', 'حساسية ألبان مفرطة'],
    contraindicated_biomarkers: [
      { key: 'egfr', max: 30, reason_ar: 'قصور كلوي حاد المرحلة الرابعة والخامسة' }
    ],
    contraindicated_medications: [],
    caution_conditions: ['LACTOSE_INTOLERANCE', 'CELIAC_DISEASE', 'RENAL_INSUFFICIENCY'],
    caution_medications: [],
    clinical_rationale_ar: 'يجب اختيار واي أيزوليت خالٍ من اللاكتوز والجلوتين لمن يعانون من حساسية اللاكتوز أو السيلياك، وحساب بروتينه بدقة ضمن السقف اليومي لمرضى الكلى.',
    safe_rationale_ar: 'مصدر بروتيني عالي القيمة الحيوية وسريع الامتصاص لتغطية الاحتياج اليومي للرياضيين.',
    action_on_contraindication_ar: 'استبداله ببروتين نباتي معزول (pea/rice isolate) أو الاكتفاء بالدجاج والبيض واللحوم الصافية.'
  },
  MAGNESIUM_GLYCINATE: {
    code: 'MAGNESIUM_GLYCINATE',
    name_ar: 'مغنيسيوم بيسجلايسينات (Magnesium Glycinate)',
    name_en: 'Magnesium Bisglycinate',
    standard_dosage: '200 - 400 مجم مساءً قبل النوم',
    category: 'HEALTH_RECOVERY',
    contraindicated_conditions: ['SEVERE_RENAL_FAILURE', 'فشل كلوي حاد'],
    contraindicated_biomarkers: [
      { key: 'magnesium', min: 2.6, reason_ar: 'ارتفاع مغنيسيوم الدم أعلى من 2.6 mg/dL' }
    ],
    contraindicated_medications: [],
    caution_conditions: ['MILD_RENAL_INSUFFICIENCY'],
    caution_medications: ['ANTIBIOTICS', 'BISPHOSPHONATES'],
    clinical_rationale_ar: 'الكلى هي العضو الحصري لطرح فائض المغنيسيوم؛ وفي الفشل الكلوي الحاد قد يسبب تراكمه تثبيطاً خطيراً للقلب والجهاز العصبي.',
    safe_rationale_ar: 'مكمل استثنائي لتحسين جودة النوم العميق، استرخاء العضلات، ومنع التقلصات ودعم حساسية الأنسولين.',
    action_on_contraindication_ar: 'فحص وظائف الكلى الدورية وضبط الجرعة أو استبداله بالحمية الغذائية الغنية بالورقيات الخضراء.'
  },
  VITAMIN_D3_K2: {
    code: 'VITAMIN_D3_K2',
    name_ar: 'فيتامين D3 + K2 (MK-7)',
    name_en: 'Vitamin D3 + K2',
    standard_dosage: '5000 وحدة دولية + 100 ميكروجرام K2',
    category: 'HEALTH_RECOVERY',
    contraindicated_conditions: ['HYPERCALCEMIA', 'HYPERVITAMINOSIS_D', 'فرط كالسيوم الدم'],
    contraindicated_biomarkers: [
      { key: 'calcium', min: 10.5, reason_ar: 'ارتفاع الكالسيوم الكلي أعلى من 10.5 mg/dL' },
      { key: 'vitamin_d', min: 100, reason_ar: 'مستوى فيتامين D أعلى من 100 ng/mL' }
    ],
    contraindicated_medications: ['WARFARIN'],
    caution_conditions: ['SARCOIDOSIS', 'KIDNEY_STONES'],
    caution_medications: ['THIAZIDE_DIURETICS'],
    clinical_rationale_ar: 'فيتامين K2 يتعارض مباشرة مع آلية عمل الوارفارين المخثرة، كما أن فيتامين D بجرعات عالية مع فرط الكالسيوم يهدد بتكلس الكلى والأوعية.',
    safe_rationale_ar: 'ضروري لتعزيز كثافة العظام، دعم المناعة، ورفع مستويات هرمون التستوستيرون الطبيعي.',
    action_on_contraindication_ar: 'إيقاف المكمل فوراً عند ارتفاع الكالسيوم، واستبعاد K2 لمرضى الوارفارين مع الاكتفاء بـ D3 الصافي تحت إشراف طبي.'
  }
};

function normalizeStr(val) {
  return String(val || '')
    .trim()
    .toUpperCase()
    .replace(/[_-]/g, ' ');
}

export function evaluateSingleSupplement(supplementCodeOrName, {
  medicalConditions = [],
  activeMedications = [],
  biomarkers = {},
  weightKg: _weightKg = 75
} = {}) {
  const normInput = normalizeStr(supplementCodeOrName);
  
  const matchEntry = Object.values(SUPPLEMENT_REGISTRY).find(item => {
    return normalizeStr(item.code) === normInput ||
      normalizeStr(item.name_en).includes(normInput) ||
      normInput.includes(normalizeStr(item.code)) ||
      normalizeStr(item.name_ar).includes(normInput) ||
      normInput.includes(normalizeStr(item.name_ar));
  });

  if (!matchEntry) {
    return {
      supplement_code: supplementCodeOrName,
      supplement_name_ar: supplementCodeOrName,
      safety_status: 'UNKNOWN',
      severity: 'LOW',
      alert_title_ar: 'مكمل غير مدرج بالقائمة السريرية المعتمدة',
      clinical_rationale_ar: 'لم يتم العثور على موانع مباشرة مسجلة، يرجى مراجعة المكونات بعناية.',
      action_required_ar: 'التحقق من خلو المكمل من المنبهات أو المواد المحظورة.'
    };
  }

  const normConditions = (Array.isArray(medicalConditions) ? medicalConditions : [medicalConditions])
    .map(c => normalizeStr(typeof c === 'string' ? c : (c?.code || c?.name || c?.conditionCode || '')));

  const normMeds = (Array.isArray(activeMedications) ? activeMedications : [activeMedications])
    .map(m => normalizeStr(typeof m === 'string' ? m : (m?.name || m?.code || '')));

  const contraindicationsTriggered = [];
  const cautionsTriggered = [];

  matchEntry.contraindicated_conditions.forEach(cond => {
    const normCond = normalizeStr(cond);
    if (normConditions.some(c => c.includes(normCond) || normCond.includes(c))) {
      contraindicationsTriggered.push(`حالة سريرية: ${cond}`);
    }
  });

  matchEntry.contraindicated_medications.forEach(med => {
    const normMed = normalizeStr(med);
    if (normMeds.some(m => m.includes(normMed) || normMed.includes(m))) {
      contraindicationsTriggered.push(`تداخل دوائي محظور: ${med}`);
    }
  });

  matchEntry.contraindicated_biomarkers.forEach(bioRule => {
    const val = Number(biomarkers[bioRule.key]);
    if (!isNaN(val) && val > 0) {
      if (bioRule.max !== undefined && val < bioRule.max) {
        contraindicationsTriggered.push(bioRule.reason_ar);
      }
      if (bioRule.min !== undefined && val > bioRule.min) {
        contraindicationsTriggered.push(bioRule.reason_ar);
      }
    }
  });

  matchEntry.caution_conditions.forEach(cond => {
    const normCond = normalizeStr(cond);
    if (normConditions.some(c => c.includes(normCond) || normCond.includes(c))) {
      cautionsTriggered.push(`ملاحظة صحية: ${cond}`);
    }
  });

  matchEntry.caution_medications.forEach(med => {
    const normMed = normalizeStr(med);
    if (normMeds.some(m => m.includes(normMed) || normMed.includes(m))) {
      cautionsTriggered.push(`دواء يستوجب المباعدة: ${med}`);
    }
  });

  if (contraindicationsTriggered.length > 0) {
    return {
      supplement_code: matchEntry.code,
      supplement_name_ar: matchEntry.name_ar,
      supplement_name_en: matchEntry.name_en,
      standard_dosage: matchEntry.standard_dosage,
      safety_status: 'CONTRAINDICATED',
      severity: 'CRITICAL',
      alert_title_ar: `تعارض سريري محظور (${matchEntry.name_ar})`,
      trigger_factors: contraindicationsTriggered,
      clinical_rationale_ar: matchEntry.clinical_rationale_ar,
      action_required_ar: matchEntry.action_on_contraindication_ar
    };
  }

  if (cautionsTriggered.length > 0) {
    return {
      supplement_code: matchEntry.code,
      supplement_name_ar: matchEntry.name_ar,
      supplement_name_en: matchEntry.name_en,
      standard_dosage: matchEntry.standard_dosage,
      safety_status: 'CAUTION',
      severity: 'MODERATE',
      alert_title_ar: `تنبيه وتعديل جرعة/توقيت (${matchEntry.name_ar})`,
      trigger_factors: cautionsTriggered,
      clinical_rationale_ar: matchEntry.clinical_rationale_ar,
      action_required_ar: 'يُسمح بالاستخدام مع مراعاة الفصل الزمني وضبط الجرعة المقررة بدقة.'
    };
  }

  return {
    supplement_code: matchEntry.code,
    supplement_name_ar: matchEntry.name_ar,
    supplement_name_en: matchEntry.name_en,
    standard_dosage: matchEntry.standard_dosage,
    safety_status: 'SAFE',
    severity: 'NONE',
    alert_title_ar: `متوافق وآمن سريرياً (${matchEntry.name_ar})`,
    trigger_factors: [],
    clinical_rationale_ar: matchEntry.safe_rationale_ar,
    action_required_ar: `جرعة استرشادية معتمدة: ${matchEntry.standard_dosage}.`
  };
}

export function evaluateClinicalSupplementSafety({
  supplements = [],
  medicalConditions = [],
  activeMedications = [],
  biomarkers = {},
  weightKg = 75
} = {}) {
  const supplementList = Array.isArray(supplements) ? supplements : [supplements];
  const results = supplementList.map(supp => {
    const code = typeof supp === 'string' ? supp : (supp?.code || supp?.name || supp?.supplement || '');
    return evaluateSingleSupplement(code, {
      medicalConditions,
      activeMedications,
      biomarkers,
      weightKg
    });
  });

  const hasContraindications = results.some(r => r.safety_status === 'CONTRAINDICATED');
  const hasCautions = results.some(r => r.safety_status === 'CAUTION');

  let overallStatus = 'SAFE';
  if (hasContraindications) overallStatus = 'CONTRAINDICATED';
  else if (hasCautions) overallStatus = 'CAUTION';

  const contraindicatedItems = results.filter(r => r.safety_status === 'CONTRAINDICATED');
  const cautionItems = results.filter(r => r.safety_status === 'CAUTION');
  const safeItems = results.filter(r => r.safety_status === 'SAFE');

  return {
    overall_status: overallStatus,
    is_fully_safe: overallStatus === 'SAFE',
    total_evaluated: results.length,
    contraindicated_count: contraindicatedItems.length,
    caution_count: cautionItems.length,
    safe_count: safeItems.length,
    evaluations: results,
    clinical_summary_ar: hasContraindications
      ? `تحذير سريري حاسم: تم رصد ${contraindicatedItems.length} مكمل يتعارض تماماً مع الحالة الصحية للمتدرب ويجب استبعاده فوراً.`
      : hasCautions
        ? `تنبيه سريري: كافة المكملات مقبولة مع مراعاة قواعد الفصل وتعديل الجرعات لـ ${cautionItems.length} مكمل.`
        : 'درع الأمان السريري: كافة المكملات الغذائية المختارة متوافقة بنسبة 100% مع الملف الصحي للمتدرب.'
  };
}

export function getStandardSupplementCatalog() {
  return Object.values(SUPPLEMENT_REGISTRY).map(s => ({
    code: s.code,
    name_ar: s.name_ar,
    name_en: s.name_en,
    standard_dosage: s.standard_dosage,
    category: s.category
  }));
}

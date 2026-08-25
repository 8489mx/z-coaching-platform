/**
 * ==============================================================================
 * Z COACHING PLATFORM - METABOLIC & PHYSIOLOGICAL SAFEGUARDS ENGINE
 * File: src/execution-engines/metabolic-safeguards.js
 * Version: V2026.FINAL.OMNI
 * 
 * Standards & Protocols:
 * 1. MATADOR Study (Diet Breaks & Intermittent Energy Restriction)
 * 2. Adaptive Thermogenesis & Leptin/Thyroid (T3) Resensitization
 * 3. Auto-Regulated Deload & Neurological Fatigue Management
 * 4. Micronutrient Competition Matrix (Iron/Calcium, Zinc/Copper)
 * 5. Menstrual Cycle Phase Modulation (Follicular vs Luteal)
 * 6. Non-Mandatory Smart Electrolytes & Summer Hydration Engine
 * 7. Field Emergency Protocols (Weight Stall, Tendonitis, Maintenance)
 * ==============================================================================
 */

/**
 * 1. محرك كسر الدايت والوجبات التعويضية وتفريغ الأحمال
 * تقييم التكيف الأيضي، إرهاق الجهاز العصبي، وحاجة الجسم لأسابيع الاستشفاء
 */
export function evaluateMetabolicAndDeloadState({
  weeksInDeficit = 0,
  weightStallWeeks = 0,
  adherenceRate = 1.0,
  jointFatigueReported = false,
  consecutiveTrainingWeeks = 0,
  currentCalories = 2000,
  maintenanceCalories = 2500,
  currentCarbGrams = 200
}) {
  const result = {
    triggerDietBreak: false,
    triggerRefeed: false,
    triggerDeloadWeek: false,
    adjustedCalories: currentCalories,
    adjustedCarbGrams: currentCarbGrams,
    protocolType: 'STANDARD_PROGRESSION',
    coachingAdvice: []
  };

  // أ. كسر الدايت (Diet Break) أو يومي إعادة التغذية (2-Day Refeed)
  // يطبق عند العجز المستمر لأكثر من 8 أسابيع مع ثبات الوزن لأسبوعين والتزام كامل (دراسة MATADOR)
  if (weeksInDeficit >= 8 && weightStallWeeks >= 2 && adherenceRate >= 0.85) {
    if (weeksInDeficit >= 12) {
      result.triggerDietBreak = true;
      result.protocolType = 'FULL_DIET_BREAK_1_WEEK';
      result.adjustedCalories = maintenanceCalories;
      result.adjustedCarbGrams = Math.round(currentCarbGrams * 1.4);
      result.coachingAdvice.push(
        'بروتوكول كسر الدايت (Diet Break): رفع السعرات لمدة 7 أيام لسعرات المحافظة لزيادة إفراز هرمون اللبتين وكسر التكيف الأيضي دون زيادة دهون.'
      );
    } else {
      result.triggerRefeed = true;
      result.protocolType = 'CONSECUTIVE_2DAY_REFEED';
      result.adjustedCalories = maintenanceCalories;
      result.adjustedCarbGrams = Math.round(currentCarbGrams * 1.35);
      result.coachingAdvice.push(
        'بروتوكول إعادة التغذية (Refeed Days): رفع الكربوهيدرات النظيفة لمدة يومين متتاليين (نهاية الأسبوع) لإعادة ملء جليكوجين العضلات والكبد.'
      );
    }
  }

  // ب. تفريغ الأحمال التدريبية (Auto-Regulated Deload Week)
  // يطبق كل 6-8 أسابيع تدريب متواصل أو عند تسجيل إجهاد في المفاصل والأوتار
  if (consecutiveTrainingWeeks >= 6 || jointFatigueReported) {
    result.triggerDeloadWeek = true;
    result.coachingAdvice.push(
      'أسبوع تفريغ الأحمال (Deload Week): خفض إجمالي مجموعات التمرين (Volume) بنسبة 50% مع الحفاظ على الأوزان لحماية الأوتار واستشفاء الجهاز العصبي المركزي.'
    );
  }

  return result;
}

/**
 * 2. كارت الترطيب الذكي الاختياري للحرارة العالية والخليج
 * نصيحة إرشادية غير ملزمة مع حظر الصوديوم التام لمرضى الضغط والكلى
 */
export function generateHydrationAdvice({
  medicalConditions = [],
  environmentTemperature = 'NORMAL',
  dailySweatLevel = 'MODERATE' // 'LOW' | 'MODERATE' | 'HIGH'
}) {
  const conds = (Array.isArray(medicalConditions) ? medicalConditions : [medicalConditions])
    .map(c => String(c || '').toUpperCase());

  // أ. حظر تام للصوديوم والأملاح المضافة لأصحاب الأمراض المانعة
  if (conds.includes('HYPERTENSION') || conds.includes('RENAL_INSUFFICIENCY')) {
    return {
      type: 'STRICT_HYDRATION_ONLY',
      isMandatory: true,
      cardTitle: 'إرشادات الترطيب الطبي',
      options: [
        {
          label: 'شرب المياه النقية فقط',
          detail: 'احرص على شرب 3.5 إلى 4.5 لتر ماء نقي موزعة على اليوم، وتجنب أي مكملات إلكترولايتس أو أملاح صوديوم مضافة لحماية ضغط الدم ووظائف الكلى.'
        }
      ]
    };
  }

  // ب. كارت ترطيب اختياري مرن لأجواء الصيف والخليج العربي
  if (environmentTemperature === 'HOT_SUMMER' || dailySweatLevel === 'HIGH') {
    return {
      type: 'SMART_ELECTROLYTES_OPTIONAL',
      isMandatory: false,
      cardTitle: 'خيارات تعويض الأملاح والترطيب (اختياري حسب الرغبة)',
      note: 'في الأجواء الحارة والتعرق العالي، يمكنك اختيار أحد البدائل التالية لتجنب الخمول وهبوط الطاقة دون إجبار أو احتباس سوائل:',
      options: [
        {
          id: 'ELECTROLYTE_PACKET',
          title: 'الخيار الأول (الأكثر توازناً):',
          desc: 'كيس بودرة إلكترولايتس فوار جاهز (Electrolytes Sachet) في زجاجة المياه أثناء/بعد التمرين لتعويض البوتاسيوم والمغنيسيوم والصوديوم بتوازن دقيق.'
        },
        {
          id: 'NATURAL_WHOLEFOOD',
          title: 'الخيار الثاني (طبيعي وغذائي):',
          desc: 'كوب لبن عيران / رايب خفيف أو ماء معصور عليه نصف ليمونة وموزة بعد التمرين لتعويض البوتاسيوم وسوائل الجسم طبيعياً.'
        },
        {
          id: 'MODERATE_SALT',
          title: 'الخيار الثالث (منزلي بسيط):',
          desc: 'رشة ملح خفيفة إضافية على وجبة ما بعد التمرين في حال الشعور بدوخة أو هبوط ضغط نتيجة التعرق الشديد.'
        }
      ]
    };
  }

  return null;
}

/**
 * 3. مصفوفة تنافس امتصاص المعادن الدقيقة والمكملات
 * عزل التداخلات الكيميائية بين الحديد، الكالسيوم، الزنك، وأدوية الغدة
 */
export function evaluateMicronutrientInteractions({
  prescribedSupplements = [],
  medicalConditions = [],
  meals = []
}) {
  const timingRules = [];
  const supps = (Array.isArray(prescribedSupplements) ? prescribedSupplements : [prescribedSupplements])
    .map(s => String(s || '').toUpperCase());
  const conds = (Array.isArray(medicalConditions) ? medicalConditions : [medicalConditions])
    .map(c => String(c || '').toUpperCase());

  // أ. الحديد مقابل الكالسيوم والألبان
  if (supps.includes('IRON') || conds.includes('ANEMIA') || conds.includes('SEVERE_ANEMIA')) {
    timingRules.push({
      rule: 'IRON_CALCIUM_SEPARATION',
      instruction: 'يجب فصل مكمل الحديد أو الوجبات الغنية بالحديد عن منتجات الألبان ومكملات الكالسيوم بساعتين على الأقل؛ لأن الكالسيوم يثبط امتصاص الحديد بنسبة 60%.'
    });
  }

  // ب. الزنك مقابل النحاس
  if (supps.includes('ZINC_HIGH_DOSE') || supps.includes('ZINC_50MG')) {
    timingRules.push({
      rule: 'ZINC_COPPER_BALANCE',
      instruction: 'عند تناول الزنك بجرعة تتجاوز 30 ملجم يومياً، يجب التأكد من وجود 1-2 ملجم نحاس (Copper) لمنع استنزاف مخازن النحاس وحدوث أنيميا ثانوية.'
    });
  }

  // ج. أدوية الغدة الدرقية (Eltroxin / Euthyrox)
  if (conds.includes('HYPOTHYROIDISM') || supps.includes('ELTROXIN') || supps.includes('EUTHYROX')) {
    timingRules.push({
      rule: 'THYROID_MED_ISOLATION',
      instruction: 'يؤخذ دواء خمول الغدة على معدة فارغة تماماً صباحاً مع ماء فقط، ويُفصل 4 ساعات كاملة عن مكملات الكالسيوم والحديد وفيتامين C والألياف العالية.'
    });
  }

  // د. المغنيسيوم الليلي
  if (supps.includes('MAGNESIUM') || supps.includes('MAGNESIUM_GLYCINATE')) {
    timingRules.push({
      rule: 'MAGNESIUM_NIGHT_TIMING',
      instruction: 'يفضل تناول سترات أو جليسينات المغنيسيوم قبل النوم بـ 45 دقيقة لتهدئة الجهاز العصبي، تحسين جودة النوم العميق، ومنع التقلصات العضلية.'
    });
  }

  return timingRules;
}

/**
 * 4. محرك تعديل الدورة الشهرية والتقلبات الهرمونية للسيدات
 * مواءمة التغذية والكارديو واحتباس السوائل حسب الطور الهرموني
 */
export function evaluateMenstrualCyclePhase({
  isFemale = false,
  cyclePhase = 'FOLLICULAR', // 'FOLLICULAR' (النصف الأول) | 'LUTEAL' (النصف الثاني)
  isPregnantOrLactating = false
}) {
  if (!isFemale || isPregnantOrLactating) return null;

  const normPhase = String(cyclePhase || 'FOLLICULAR').toUpperCase();

  if (normPhase === 'FOLLICULAR') {
    return {
      phase: 'FOLLICULAR',
      phaseName: 'الطور الجريبي (Follicular Phase - بداية الدورة حتى التبويض)',
      trainingFocus: 'حساسية إنسولين ممتازة ومعدل استشفاء عالي. الوقت المثالي لزيادة شدة أوزان الجيم وتمارين الـ High-Intensity.',
      nutritionFocus: 'كفاءة عالية في استخدام الكربوهيدرات كمصدر طاقة نقي، مستويات طاقة مستقرة.',
      waterRetentionAlert: false
    };
  }

  // الطور الأصفري (Luteal Phase - ما قبل الدورة بأسبوع إلى 10 أيام)
  return {
    phase: 'LUTEAL',
    phaseName: 'الطور الأصفري (Luteal Phase - ما قبل الدورة)',
    trainingFocus: 'ارتفاع حرارة الجسم الأساسية ومعدل نبض الراحة. ينصح بالتركيز على الالتزام دون الضغط لتحقيق أرقام قياسية، وتفضيل أجهزة الكارديو الثابتة.',
    nutritionFocus: 'زيادة مستهدف الألياف والدهون الصحية للمساعدة على ضبط الشبع والحد من الرغبة في السكريات (Cravings).',
    waterRetentionAlert: true,
    scaleGuidance: 'تنبيه فسيولوجي: من الطبيعي زيادة الميزان من 1 إلى 2.5 كجم في هذه الفترة نتيجة احتباس السوائل المؤقت (بروجسترون)؛ هذا ليس دهوناً نهائياً ويختفي تلقائياً مع بداية الدورة.'
  };
}

/**
 * 5. مصفوفة التعامل مع الطوارئ الميدانية
 * إدارة الحالات السريعة (ثبات الوزن، ألم الأوتار، السفر والانشغال، تقلبات الميزان)
 */
export function resolveEmergencyProtocol({
  emergencyType, // 'WEIGHT_STALL' | 'JOINT_PAIN' | 'TRAVEL_BUSY' | 'PRE_PERIOD_BLOAT'
  currentWorkoutPlan = {},
  jointLocation = 'SHOULDER' // 'SHOULDER' | 'ELBOW' | 'KNEE' | 'LOWER_BACK'
}) {
  const normType = String(emergencyType || '').toUpperCase();
  const normJoint = String(jointLocation || 'SHOULDER').toUpperCase();

  switch (normType) {
    case 'WEIGHT_STALL':
      return {
        actionType: 'CALORIE_AND_REFEED_SHIFT',
        resolution: 'تفعيل يومين ريفيد كربوهيدرات متتالية مع رفع معدل خطوات المشي اليومي بمقدار 1,500 خطوة دون تقليل سعرات البروتين.',
        clientNotification: 'تم تعديل توزيع السعرات وتكثيف النشاط الحركي اليومي لكسر ثبات الميزان.'
      };

    case 'JOINT_PAIN':
      return {
        actionType: 'BIOMECHANICAL_SWAP',
        jointTargeted: normJoint,
        resolution: normJoint === 'SHOULDER'
          ? 'استبدال حركات البار الحر بقبضات الدمبل المحايدة (Neutral DB Press) وإيقاف الضغط فوق الرأس مؤقتاً مع تفعيل روتين الكفة المدورة.'
          : normJoint === 'KNEE'
          ? 'إيقاف جهاز الـ Leg Extension وعزل السكوات العميق، والاعتماد على السكوات الإسباني الإيزومتري والـ Glute Bridges.'
          : 'تطبيق بروتوكول تخفيف الضغط الحركي وعزل التحميل المحوري.',
        clientNotification: 'تم تعديل زوايا التمارين تلقائياً لعزل المفصل المجهد وتفعيل الحركات الآمنة لاستمرار البناء دون ألم.'
      };

    case 'TRAVEL_BUSY':
      return {
        actionType: 'MAINTENANCE_MODE',
        resolution: 'تفعيل جدول الصيانة السريع: جلستان أسبوعياً بوزن الجسم والأدوات المتاحة (20 دقيقة) + نظام الحصص البصرية للأكل دون ميزان جرامات.',
        clientNotification: 'تم تفعيل نمط السفر والانشغال للحفاظ على الكتلة العضلية ومستوى اللياقة بأقل مجهود ممكن.'
      };

    case 'PRE_PERIOD_BLOAT':
      return {
        actionType: 'REASSURANCE_AND_POTASSIUM',
        resolution: 'تثبيت السعرات الحالية دون عجز إضافي، التركيز على الأطعمة الغنية بالبوتاسيوم (موز/بطاطس/خضار ورقي) لتصريف السوائل.',
        clientNotification: 'زيادة الميزان الحالية احتباس ماء هرموني طبيعي؛ الخطة مستمرة بنجاح ولا داعي لتعديل الأكل.'
      };

    default:
      return { actionType: 'NONE', resolution: 'متابعة البرنامج الحالي كالمعتاد.' };
  }
}

/**
 * 6. الدالة الرئيسية الشاملة لتقييم السلامة الأيضية والفسيولوجية
 */
export function evaluateCompleteMetabolicSafetySuite({
  clientData = {},
  progressData = {},
  environmentData = {}
}) {
  const metabolicState = evaluateMetabolicAndDeloadState({
    weeksInDeficit: progressData.weeksInDeficit || 0,
    weightStallWeeks: progressData.weightStallWeeks || 0,
    adherenceRate: progressData.adherenceRate !== undefined ? progressData.adherenceRate : 1.0,
    jointFatigueReported: progressData.jointFatigueReported || false,
    consecutiveTrainingWeeks: progressData.consecutiveTrainingWeeks || 0,
    currentCalories: clientData.targetCalories || 2000,
    maintenanceCalories: clientData.maintenanceCalories || 2500,
    currentCarbGrams: clientData.targetCarbGrams || 200
  });

  const hydrationAdvice = generateHydrationAdvice({
    medicalConditions: clientData.selectedConditions || [],
    environmentTemperature: environmentData.temperature || 'NORMAL',
    dailySweatLevel: progressData.sweatLevel || 'MODERATE'
  });

  const micronutrientRules = evaluateMicronutrientInteractions({
    prescribedSupplements: clientData.supplements || [],
    medicalConditions: clientData.selectedConditions || [],
    meals: clientData.meals || []
  });

  const menstrualModulation = evaluateMenstrualCyclePhase({
    isFemale: String(clientData.gender || '').toUpperCase() === 'FEMALE',
    cyclePhase: progressData.cyclePhase || 'FOLLICULAR',
    isPregnantOrLactating: ['FIRST', 'SECOND', 'THIRD', 'POSTPARTUM_LACTATING'].includes(clientData.pregnancyTrimester)
  });

  return {
    metabolicState,
    hydrationAdvice,
    micronutrientRules,
    menstrualModulation,
    generatedAt: new Date().toISOString()
  };
}

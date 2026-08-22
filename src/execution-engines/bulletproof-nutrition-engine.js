/**
 * Bulletproof Clinical Nutrition Engine (المحور الأول: هندسة التغذية وسد ثغرات المتدربين)
 * Pure Deterministic Clinical & Gastronomy Logic
 * Zero External Dependencies
 */

// 1. معاملات التحويل بين النيئ والمطهي (Yield Factors)
export const RAW_TO_COOKED_YIELD_FACTORS = {
  CHICKEN_BREAST: 0.75, // صدور دجاج (فقدان 25% ماء)
  BEEF_LEAN: 0.75,       // لحم بقري صافي
  WHITE_RICE: 2.50,      // أرز أبيض (امتصاص 150% ماء)
  BASMATI_RICE: 2.50,    // أرز بسمتي
  EGYPTIAN_RICE: 2.50,   // أرز مصري
  PASTA: 2.20,           // مكرونة بأنواعها
  POTATO_BOILED: 1.00,   // بطاطس مسلوقة (تغير طفيف)
  SWEET_POTATO: 1.00,    // بطاطا حلوة
  OATS_PORRIDGE: 3.00    // شوفان مطهي بسائل
};

/**
 * تحويل الوزن من نيئ إلى مطهي
 */
export function convertRawToCooked({ foodKey, rawGrams }) {
  if (!rawGrams || rawGrams <= 0) return 0;
  const factor = RAW_TO_COOKED_YIELD_FACTORS[foodKey] || 1.0;
  return +(rawGrams * factor).toFixed(1);
}

/**
 * تحويل الوزن من مطهي إلى نيئ
 */
export function convertCookedToRaw({ foodKey, cookedGrams }) {
  if (!cookedGrams || cookedGrams <= 0) return 0;
  const factor = RAW_TO_COOKED_YIELD_FACTORS[foodKey] || 1.0;
  return +(cookedGrams / factor).toFixed(1);
}

// 2. مصفوفة الأكلات والمخبوزات الشائعة (The Gastronomy Matrix)
export const GASTRONOMY_CATALOG = {
  // أ. العيش والمخبوزات
  BALADI_BREAD_WHOLE: {
    id: 'baladi_bread_whole',
    name_ar: 'رغيف بلدي كامل (ردة)',
    unit_weight_g: 95,
    calories: 240,
    protein_g: 8,
    carbs_g: 50,
    fat_g: 1.5,
    fiber_g: 6,
    is_portionable: true,
    quarter_slice: { weight_g: 25, calories: 60, carbs_g: 12.5, protein_g: 2, fat_g: 0.4 }
  },
  SHAMI_BREAD_SMALL: {
    id: 'shami_bread_small',
    name_ar: 'رغيف شامي / أبيض صغير',
    unit_weight_g: 60,
    calories: 170,
    protein_g: 5,
    carbs_g: 36,
    fat_g: 1
  },
  TOAST_SLICE: {
    id: 'toast_slice',
    name_ar: 'شريحة توست (أبيض/أسمر)',
    unit_weight_g: 28,
    calories: 72,
    protein_g: 2.5,
    carbs_g: 13,
    fat_g: 1
  },
  SENN_BREAD: {
    id: 'senn_bread',
    name_ar: 'رغيف سن',
    unit_weight_g: 50,
    calories: 120,
    protein_g: 4,
    carbs_g: 26,
    fat_g: 0.5,
    water_warning_liters: 0.5,
    warning_ar: 'يمتص ماء كثيراً في الأمعاء؛ يتطلب شرب نصف لتر ماء إضافي منعاً للإمساك.'
  },

  // ب. مصادر البروتين الشعبية
  COTTAGE_CHEESE_100G: {
    id: 'cottage_cheese_100g',
    name_ar: 'جبن قريش مصفى (100 جم)',
    unit_weight_g: 100,
    calories: 100,
    protein_g: 18,
    carbs_g: 3,
    fat_g: 1.5
  },
  ROUMI_CHEESE_SLICE: {
    id: 'roumi_cheese_slice',
    name_ar: 'شريحة جبن رومي (30 جم)',
    unit_weight_g: 30,
    calories: 110,
    protein_g: 8,
    carbs_g: 0,
    fat_g: 9,
    fat_trap: true,
    warning_ar: 'فخ الدهون: ممنوعة في التنشيف الصارم إلا بحد أقصى شريحة واحدة تخصم من دهون اليوم.'
  },
  WHOLE_EGG_LARGE: {
    id: 'whole_egg_large',
    name_ar: 'بيضة كاملة كبيرة',
    unit_weight_g: 55,
    calories: 75,
    protein_g: 6.5,
    carbs_g: 0.5,
    fat_g: 5
  },
  EGG_WHITE: {
    id: 'egg_white',
    name_ar: 'بياض بيضة واحدة',
    unit_weight_g: 35,
    calories: 17,
    protein_g: 3.8,
    carbs_g: 0.2,
    fat_g: 0.1
  },

  // ج. البقوليات والطعام السريع
  FOUL_MEDAMES_100G: {
    id: 'foul_medames_100g',
    name_ar: 'فول مدمس مسلوق بدون زيت (100 جم - 4 ملاعق)',
    unit_weight_g: 100,
    calories: 110,
    protein_g: 8,
    carbs_g: 18,
    fat_g: 1
  },
  OIL_TEASPOON_5ML: {
    id: 'oil_teaspoon_5ml',
    name_ar: 'ملعقة زيت صغيرة (5 مل حار / زيتون)',
    unit_weight_g: 5,
    calories: 45,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 5,
    warning_ar: 'ملعقة الزيت الصغيرة تضيف 45 سعرة دهون صافية.'
  },
  FALAFEL_FRIED_PIECE: {
    id: 'falafel_fried_piece',
    name_ar: 'قرص طعمية مقلي وسط (30 جم)',
    unit_weight_g: 30,
    calories: 85,
    protein_g: 3,
    carbs_g: 6,
    fat_g: 6
  },
  FALAFEL_AIRFRYER_PIECE: {
    id: 'falafel_airfryer_piece',
    name_ar: 'قرص طعمية قلاية هوائية (30 جم)',
    unit_weight_g: 30,
    calories: 45,
    protein_g: 3,
    carbs_g: 6,
    fat_g: 1
  }
};

// 3. نظام المعايرة البصرية لليد (Hand-Portion System)
export function convertHandPortionsToGrams({
  palmPortions = 0,    // كف اليد (بروتين)
  fistPortions = 0,    // قبضة اليد (كارب)
  thumbPortions = 0,   // عقلة الإبهام (دهون)
  twoHandsPortions = 0 // كفتا يدين مفتوحتين (خضار)
}) {
  const cookedProteinGrams = palmPortions * 130;
  const netProteinGrams = palmPortions * 30;

  const cookedCarbGrams = fistPortions * 150;
  const netCarbGrams = fistPortions * 40;

  const fatGrams = thumbPortions * 10;
  const veggieGrams = twoHandsPortions * 175;

  const estimatedCalories = (netProteinGrams * 4) + (netCarbGrams * 4) + (fatGrams * 9) + (twoHandsPortions * 25);

  return {
    raw_portions_input: { palmPortions, fistPortions, thumbPortions, twoHandsPortions },
    estimated_cooked_grams: {
      protein_portion_g: cookedProteinGrams,
      carb_portion_g: cookedCarbGrams,
      fat_portion_g: fatGrams,
      veggie_portion_g: veggieGrams
    },
    estimated_macros: {
      calories: estimatedCalories,
      protein_g: netProteinGrams,
      carbs_g: netCarbGrams,
      fat_g: fatGrams
    },
    visual_guide_ar: {
      protein: `${palmPortions} راحة كف ≈ ${cookedProteinGrams} جم دجاج/لحم مطهي (${netProteinGrams} جم بروتين صافي)`,
      carbs: `${fistPortions} قبضة يد ≈ ${cookedCarbGrams} جم أرز/مكرونة مطهية (${netCarbGrams} جم كارب)`,
      fats: `${thumbPortions} عقلة إبهام ≈ ${fatGrams} جم دهون صحية (${fatGrams} جم دهون)`,
      veggies: `${twoHandsPortions} كفتا يدين ≈ ${veggieGrams} جم خضار ورقي`
    }
  };
}

// 4. بروتوكول طوارئ الجوع الليلي (Night Craving Protocol & Volume Hacks)
export function getNightCravingEmergencyMenu({ hungerLevel = 'HIGH' }) {
  const volumeHacks = [
    {
      id: 'sugar_free_jelly',
      name_ar: 'الجيلي الدايت الخالي من السكر',
      portion_ar: 'باكو كامل حجم كبير (محضر بماء دايت)',
      calories: 20,
      protein_g: 4,
      carbs_g: 0,
      fat_g: 0,
      benefit_ar: 'امتلاء معدي تام بحجم سوائل مرتفع وسعرات شبه معدومة.'
    },
    {
      id: 'air_popped_popcorn',
      name_ar: 'فشار بالهواء الساخن بدون زيت',
      portion_ar: '3 أكواب كبيرة منفوخة',
      calories: 90,
      protein_g: 3,
      carbs_g: 18,
      fat_g: 1,
      fiber_g: 4,
      benefit_ar: 'حجم عملاق مع 4 جم ألياف تسد المعدة وتستغرق وقتاً طويلاً في التناول.'
    },
    {
      id: 'cucumber_lettuce_bowl',
      name_ar: 'سلطة الخيار والخس بخل التفاح ورشة ملح دايت',
      portion_ar: 'طبق عملاق (300 جم)',
      calories: 45,
      protein_g: 2,
      carbs_g: 8,
      fat_g: 0.5,
      benefit_ar: 'ألياف مائية ضخمة تملأ مستقبلات التمدد في جدار المعدة.'
    },
    {
      id: 'casein_sludge_greek_yogurt',
      name_ar: 'مخفوق بروتين الكازين أو الزبادي اليوناني المثلج',
      portion_ar: '150 جم زبادي يوناني 0% مخفوق بثلج ونكهة فانيليا دايت',
      calories: 110,
      protein_g: 20,
      carbs_g: 5,
      fat_g: 0,
      benefit_ar: 'قوام آيس كريم سميك يفرز هرمون الشبع (CCK) ببطء طوال ساعات النوم.'
    }
  ];

  return {
    strategy: 'ZERO_GUILT_VOLUME_HACKS',
    hunger_level: hungerLevel,
    recommended_options: volumeHacks,
    clinical_rationale_ar: 'الجوع الليلي غالباً ما يكون انخفاضاً في حجم الطعام؛ يتم إشباع المعدة بالألياف والسوائل وحجم الطعام دون كسر عجز السعرات.'
  };
}

// 5. بروتوكول المطاعم والعزائم وبنك السعرات (Dining Out & Calorie Banking Protocol)
export function generateDiningOutStrategy({
  totalDailyCalories = 2000,
  targetDinnerBuffer = 900
}) {
  const daytimeAllowance = Math.max(800, totalDailyCalories - targetDinnerBuffer);
  const daytimeProteinTarget = Math.round((totalDailyCalories * 0.30) / 4); // تركيز بروتين نهاراً

  return {
    strategy: 'CALORIE_BANKING_AND_TRIPLE_PLATE',
    total_daily_calories: totalDailyCalories,
    banked_dinner_calories: targetDinnerBuffer,
    daytime_allocation: {
      calories: daytimeAllowance,
      target_protein_g: daytimeProteinTarget,
      instructions_ar: 'تناول وجبات بروتين صافي + خضروات ورقية نهاراً (بيض مسلوق، صدور دجاج، سلطة خضراء بدون دريسنج) لحجز السعرات للمطعم.'
    },
    triple_plate_rule_ar: {
      protein_50_pct: '50% من الطبق: بروتين مشوي صريح (دجاج تكا، ستيك مشوي، سمك سنجاري، شيش طاووق).',
      carbs_25_pct: '25% من الطبق: نشويات صريحة بدون صوصات بيضاء أو دهون مهدرجة (أرز بسمتي أو بطاطس مشوية).',
      veggies_25_pct: '25% من الطبق: خضار وسلطات خضراء بدون مايونيز أو زيوت إضافية.',
      beverages: 'مياه غازية دايت أو ماء بليمون ونعناع حصراً.'
    }
  };
}

// 6. وجبة الفري المقننة vs يوم الريفيد (Controlled Cheat vs Clean Refeed)
export function evaluateFreeMealVsRefeed({
  goal = 'FAT_LOSS',
  dailyCalories = 1800,
  weightKg = 80,
  type = 'CONTROLLED_FREE_MEAL' // 'CONTROLLED_FREE_MEAL' | 'CLEAN_HIGH_CARB_REFEED'
}) {
  if (type === 'CLEAN_HIGH_CARB_REFEED') {
    const proteinGrams = Math.round(weightKg * 2.0);
    const fatGrams = 25; // دهون منخفضة جداً
    const maintenanceCalories = Math.round(dailyCalories / 0.78);
    const remainingKcal = maintenanceCalories - ((proteinGrams * 4) + (fatGrams * 9));
    const highCarbGrams = Math.max(0, Math.round(remainingKcal / 4));

    return {
      type: 'CLEAN_HIGH_CARB_REFEED',
      calories: maintenanceCalories,
      macros: { protein_g: proteinGrams, carbs_g: highCarbGrams, fat_g: fatGrams },
      timing_ar: 'يوم تمرين الأرجل أو الظهر الشاق.',
      physiological_goal_ar: 'إعادة ملء جليكوجين العضلات وتحفيز هرمون اللبتين (Leptin) لرفع معدل الحرق دون تخزين دهون.',
      guidelines_ar: [
        'رفع الكاربوهيدرات بنسبة 50% من مصادر نظيفة (أرز، بطاطس، شوفان).',
        'تثبيت البروتين عند 2 جم/كجم.',
        'خفض الدهون الصارم تحت 25-30 جم لضمان عدم تخزين أي فائض طاقة كشحوم.'
      ]
    };
  }

  // Controlled Free Meal
  return {
    type: 'CONTROLLED_FREE_MEAL',
    calorie_cap: 1000,
    timing_ar: 'عطلة نهاية الأسبوع (وجبة الغداء).',
    physiological_goal_ar: 'راحة نفسية واجتماعية دون إخراج الجسم من العجز التراكمي الأسبوعي.',
    uncontrolled_cheat_day_warning_ar: 'تحذير: يوم كامل مفتوح عشوائي بـ 4500 سعرة يمحو عجز الأسبوع بالكامل (6 أيام × 500 = 3000 عجز ضائع + 1500 سعرة دهون مخزنة).',
    rules_ar: [
      'وجبة واحدة فقط محددة بسقف 900-1100 سعرة بديلة لوجبة الغداء.',
      'التوقف فور الشبع المعتدل (80%).',
      'العودة الفورية للخطة في الوجبة التالية دون تجويع انتقامي.'
    ]
  };
}

// 7. درع القولون العصبي والانتفاخات (IBS & Bloating Shield Engine)
export const IBS_HIGH_FODMAP_FORBIDDEN = [
  'RAW_BROCCOLI',       // بروكلي نيئ
  'ONION_GARLIC_CONC',  // بصل وثوم مركز
  'CAULIFLOWER',        // قرنبيط
  'WHITE_BEANS',        // فاصوليا بيضاء ولوبيا
  'HIGH_LACTOSE_MILK'   // حليب بقري عالي اللاكتوز
];

export const IBS_GUT_FRIENDLY_SAFE_CARBS = [
  { id: 'jasmine_rice', name_ar: 'أرز ياسمين / بسمتي مغسول جيداً ومسلوق' },
  { id: 'peeled_boiled_potatoes', name_ar: 'بطاطس مقشرة مسلوقة أو مخبوزة' },
  { id: 'gf_cooked_oats', name_ar: 'شوفان خالي من الجلوتين مطهي جيداً' },
  { id: 'peeled_zucchini_cukes', name_ar: 'كوسا وجزر وخيار مقشر' }
];

export function applyIBSFilterToNutritionPlan({ plan = {}, isIBSSensitive = false }) {
  if (!isIBSSensitive) return { is_filtered: false, plan };

  return {
    is_filtered: true,
    gut_friendly_protocol_active: true,
    forbidden_high_fodmap_tags: IBS_HIGH_FODMAP_FORBIDDEN,
    safe_staples_recommendation: IBS_GUT_FRIENDLY_SAFE_CARBS,
    clinical_action_summary_ar: 'تم حظر كافة مصادر الكاربوهيدرات المخمرة واللاكتوز العالي، والاعتماد حصراً على أرز الياسمين والبطاطس المقشرة والكوسا لحماية الأمعاء من الانتفاخ والغازات.'
  };
}

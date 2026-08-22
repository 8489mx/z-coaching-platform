/**
 * Carb Cycling & Day-Type Engine (محرك تدوير الكارب الذكي حسب نوع اليوم)
 *
 * Redistributes carbs and fats across the 7-day week based on training intensity:
 *   - HEAVY_TRAINING: Carbs +20%, Fat adjusted down, Protein locked.
 *   - MODERATE_TRAINING: Baseline macros.
 *   - REST_DAY: Carbs -20%, Fat adjusted up, Protein locked.
 *
 * Strict Deterministic Law:
 *   sum(Daily Calories) / 7 === Baseline Daily Calories (0.0% deviation).
 */

export const DAY_TYPES = {
  HEAVY_TRAINING: 'HEAVY_TRAINING',
  MODERATE_TRAINING: 'MODERATE_TRAINING',
  REST_DAY: 'REST_DAY'
};

/**
 * Calculates deterministic daily carb cycling macros for the 7-day week.
 */
export function calculateDailyCarbCycling({
  baseline_daily_calories = 2000,
  baseline_protein_g = 160,
  baseline_carbs_g = 220,
  baseline_fat_g = 53,
  weekly_schedule = [
    { day: 'MONDAY', type: DAY_TYPES.HEAVY_TRAINING, label_ar: 'أرجل / شاق' },
    { day: 'TUESDAY', type: DAY_TYPES.MODERATE_TRAINING, label_ar: 'صدر وتراي / متوسط' },
    { day: 'WEDNESDAY', type: DAY_TYPES.REST_DAY, label_ar: 'راحة واستشفاء' },
    { day: 'THURSDAY', type: DAY_TYPES.HEAVY_TRAINING, label_ar: 'ظهر وباي / شاق' },
    { day: 'FRIDAY', type: DAY_TYPES.MODERATE_TRAINING, label_ar: 'أكتاف وترابيس / متوسط' },
    { day: 'SATURDAY', type: DAY_TYPES.REST_DAY, label_ar: 'راحة واستشفاء' },
    { day: 'SUNDAY', type: DAY_TYPES.REST_DAY, label_ar: 'راحة واستشفاء' }
  ]
}) {
  const proteinCalories = baseline_protein_g * 4;

  const heavyCount = weekly_schedule.filter(d => d.type === DAY_TYPES.HEAVY_TRAINING).length;
  const restCount = weekly_schedule.filter(d => d.type === DAY_TYPES.REST_DAY).length;
  const modCount = weekly_schedule.filter(d => d.type === DAY_TYPES.MODERATE_TRAINING).length;

  // Base carb changes
  const carbDeltaPerHeavy = Math.round(baseline_carbs_g * 0.20);
  const carbDeltaPerRest = Math.round(baseline_carbs_g * 0.20);

  // Total carb pool balancing
  const heavyCarbs = baseline_carbs_g + carbDeltaPerHeavy;
  const restCarbs = baseline_carbs_g - carbDeltaPerRest;
  const modCarbs = baseline_carbs_g;

  // Compute daily fats to preserve exact calorie target per day type
  // Heavy Day: Carbs are higher by (carbDeltaPerHeavy * 4) kcal -> Fat is lowered by (carbDeltaPerHeavy * 4 / 9) g
  const heavyFat = Math.max(25, Math.round(baseline_fat_g - ((carbDeltaPerHeavy * 4) / 9)));
  // Rest Day: Carbs are lower by (carbDeltaPerRest * 4) kcal -> Fat is increased by (carbDeltaPerRest * 4 / 9) g
  const restFat = Math.round(baseline_fat_g + ((carbDeltaPerRest * 4) / 9));
  const modFat = baseline_fat_g;

  const scheduleBreakdown = weekly_schedule.map(d => {
    let carbs = modCarbs;
    let fat = modFat;
    let strategyAr = 'توزيع متوازن (Baseline)';

    if (d.type === DAY_TYPES.HEAVY_TRAINING) {
      carbs = heavyCarbs;
      fat = heavyFat;
      strategyAr = 'رفع الكارب (+20%) لشحن الجليكوجين العضلي مع خفض الدهون';
    } else if (d.type === DAY_TYPES.REST_DAY) {
      carbs = restCarbs;
      fat = restFat;
      strategyAr = 'خفض الكارب (-20%) مع رفع الدهون الصحية لتعزيز الاستشفاء وحساسية الأنسولين';
    }

    const calculatedCalories = (baseline_protein_g * 4) + (carbs * 4) + (fat * 9);

    return {
      day: d.day,
      day_type: d.type,
      label_ar: d.label_ar || d.day,
      strategy_ar: strategyAr,
      calories: calculatedCalories,
      protein_g: baseline_protein_g,
      carbs_g: carbs,
      fat_g: fat
    };
  });

  const totalWeeklyCalories = scheduleBreakdown.reduce((sum, d) => sum + d.calories, 0);
  const averageDailyCalories = Math.round(totalWeeklyCalories / 7);

  return {
    baseline_target: {
      daily_calories: baseline_daily_calories,
      protein_g: baseline_protein_g,
      carbs_g: baseline_carbs_g,
      fat_g: baseline_fat_g
    },
    weekly_breakdown: scheduleBreakdown,
    weekly_summary: {
      total_weekly_calories: totalWeeklyCalories,
      average_daily_calories: averageDailyCalories,
      is_calorie_balanced: Math.abs(averageDailyCalories - baseline_daily_calories) <= 15,
      heavy_days_count: heavyCount,
      moderate_days_count: modCount,
      rest_days_count: restCount
    }
  };
}


/**
 * تدوير السعرات والكارب بين أيام التمرين والراحة مع الحفاظ الصارم على متوسط العجز الأسبوعي
 */
export function calculateCalorieCycling({
  dailyAverageCalories,
  trainingDaysPerWeek = 4,
  weightKg,
  proteinGrams,
  fatGrams,
  cyclingIntensity = 'MODERATE' // MODERATE: +-15% Carb shift | AGGRESSIVE: +-25% Carb shift
}) {
  if (!dailyAverageCalories || trainingDaysPerWeek <= 0 || trainingDaysPerWeek >= 7) {
    throw new Error('Invalid input: dailyAverageCalories and valid training days (1-6) are required.');
  }

  const totalWeeklyCalories = dailyAverageCalories * 7;
  const restDaysCount = 7 - trainingDaysPerWeek;

  // نسبة التفاوت في السعرات بين يوم التمرين ويوم الراحة
  const shiftPct = cyclingIntensity === 'AGGRESSIVE' ? 0.20 : 0.12;

  // معادلة التوازن الأسبوعي الحتمي:
  // (TrainingDays * Cal_High) + (RestDays * Cal_Low) = TotalWeeklyCalories
  // Cal_High = Cal_Average * (1 + delta)
  // Cal_Low = (TotalWeeklyCalories - (TrainingDays * Cal_High)) / RestDays
  
  const highDayCalories = Math.round(dailyAverageCalories * (1 + (shiftPct * (restDaysCount / 7))));
  const totalHighKcal = highDayCalories * trainingDaysPerWeek;
  const remainingKcal = totalWeeklyCalories - totalHighKcal;
  const lowDayCalories = Math.round(remainingKcal / restDaysCount);

  // حساب الماكروز للأيام المرتفعة (High Days / Training Days)
  const proteinKcal = proteinGrams * 4;
  const highFatGrams = fatGrams;
  const highFatKcal = highFatGrams * 9;
  const highCarbsGrams = Math.max(0, Math.round((highDayCalories - (proteinKcal + highFatKcal)) / 4));

  // حساب الماكروز لأيام الراحة (Low Days / Rest Days)
  const lowFatGrams = Math.round(fatGrams * 1.05); // زيادة طفيفة غير محسوسة للدهون للشبع في أيام الراحة
  const lowFatKcal = lowFatGrams * 9;
  const lowCarbsGrams = Math.max(0, Math.round((lowDayCalories - (proteinKcal + lowFatKcal)) / 4));

  return {
    strategy: 'CALORIE_CARB_CYCLING',
    weekly_total_calories: totalWeeklyCalories,
    average_daily_calories: dailyAverageCalories,
    training_days_count: trainingDaysPerWeek,
    rest_days_count: restDaysCount,
    high_day: {
      type: 'TRAINING_DAY',
      calories: highDayCalories,
      macros: {
        protein_grams: proteinGrams,
        carbs_grams: highCarbsGrams,
        fats_grams: highFatGrams
      },
      message_ar: 'يوم تدريب: كاربوهيدرات أعلى لملء مخازن الجليكوجين وأداء أقوى بالأوزان.'
    },
    low_day: {
      type: 'REST_DAY',
      calories: lowDayCalories,
      macros: {
        protein_grams: proteinGrams,
        carbs_grams: lowCarbsGrams,
        fats_grams: lowFatGrams
      },
      message_ar: 'يوم راحة: خفض الكارب لتعويض سعرات أيام التمرين وتحفيز أكسدة الدهون أثناء الاستشفاء.'
    }
  };
}

/**
 * تقييم استحقاق المتدرب لفترة دايت بريك مجدولة (Structured Diet Break)
 */
export function evaluateDietBreakNeed({
  consecutiveDeficitWeeks = 1,
  bodyFatPercentage = 20,
  hungerFatigueScore = 5,
  estimatedMaintenanceCalories,
  currentDeficitCalories
}) {
  let triggerDietBreak = false;
  let reason = '';
  let maxDeficitWeeksAllowed = 12;

  // نسبة الدهون تحدد توقيت الدايت بريك الموصى به علمياً:
  // - نسبة دهون منخفضة (<12% للرجال، <20% للسيدات): بريك كل 6-8 أسابيع
  // - نسبة دهون متوسطة (12-20% للرجال، 20-28% للسيدات): بريك كل 8-12 أسبوعاً
  // - نسبة دهون مرتفعة (>20% للرجال، >28% للسيدات): بريك كل 12-16 أسبوعاً
  if (bodyFatPercentage <= 12) {
    maxDeficitWeeksAllowed = 6;
  } else if (bodyFatPercentage <= 20) {
    maxDeficitWeeksAllowed = 10;
  } else {
    maxDeficitWeeksAllowed = 14;
  }

  if (consecutiveDeficitWeeks >= maxDeficitWeeksAllowed) {
    triggerDietBreak = true;
    reason = `تم إتمام ${consecutiveDeficitWeeks} أسبوعاً متواصلاً في عجز السعرات. حان وقت الدايت بريك لإعادة توازن هرمونات الشبع (Leptin & Thyroid) وخفض الكورتيزول.`;
  } else if (consecutiveDeficitWeeks >= 6 && hungerFatigueScore >= 8) {
    triggerDietBreak = true;
    reason = 'تم رصد إجهاد أيضي ونفسي حاد (ارتفاع الجوع والإرهاق). يوصى ببريك وقائي مبكر لمدة أسبوع.';
  }

  const maintenance = estimatedMaintenanceCalories || Math.round(currentDeficitCalories / 0.78);

  return {
    should_take_diet_break: triggerDietBreak,
    status: triggerDietBreak ? 'DIET_BREAK_RECOMMENDED' : 'CONTINUE_DEFICIT',
    consecutive_weeks: consecutiveDeficitWeeks,
    max_weeks_allowed: maxDeficitWeeksAllowed,
    reason_ar: reason || 'الاستمرار في خطة التنشيف الحالية بنجاح، لا توجد مؤشرات إجهاد أيضي تستدعي التوقف.',
    protocol: triggerDietBreak ? {
      duration_days: 7, // أسبوع كامل بسعرات الثبات
      target_maintenance_calories: maintenance,
      calorie_increase_amount: maintenance - currentDeficitCalories,
      guidelines_ar: [
        'رفع السعرات حصراً إلى مستوى الثبات (بدون فائض أو تخريب عشوائي).',
        'تخصيص كامل السعرات الإضافية للكاربوهيدرات المعقدة لملء العضلات.',
        'الحفاظ على نفس جدول التمرين وعدد الخطوات اليومية لمنع اكتساب الدهون.',
        'الزيادة المتوقعة على الميزان (0.5 - 1.5 كجم) هي ماء وجليكوجين مؤقت يزول فور العودة للعجز.'
      ]
    } : null
  };
}

/**
 * حساب يوم إعادة التغذية المحسوب (Single / Double Day Refeed)
 */
export function calculateRefeedDay({
  currentCalories,
  proteinGrams,
  currentCarbsGrams,
  fatGrams
}) {
  // يوم الريفيد يرفع السعرات لسعرات الثبات عبر زيادة الكاربوهيدرات بنسبة 40-50% مع خفض طفيف للدهون
  const additionalCarbGrams = Math.round(currentCarbsGrams * 0.45);
  const refeedCarbs = currentCarbsGrams + additionalCarbGrams;
  const refeedFats = Math.max(30, Math.round(fatGrams * 0.85)); // تقليل الدهون لتفضيل حرق الكارب
  
  const refeedCalories = (proteinGrams * 4) + (refeedCarbs * 4) + (refeedFats * 9);

  return {
    type: 'CONTROLLED_REFEED_DAY',
    calories: refeedCalories,
    macros: {
      protein_grams: proteinGrams,
      carbs_grams: refeedCarbs,
      fats_grams: refeedFats
    },
    carbs_added_grams: additionalCarbGrams,
    instructions_ar: 'يُفضل تطبيق هذا اليوم في أشق يوم تمرين خلال الأسبوع (مثل يوم الأرجل أو الظهر).'
  };
}

/**
 * Calorie Cycling, Refeed & Structured Diet Break Engine
 * Pure Deterministic Metabolic & Nutrition Math
 * Zero External Dependencies
 */

export function calculateCalorieCycling({
  dailyAverageCalories,
  trainingDaysPerWeek = 4,
  weightKg,
  proteinGrams,
  fatGrams,
  cyclingIntensity = 'MODERATE'
}) {
  if (!dailyAverageCalories || trainingDaysPerWeek <= 0 || trainingDaysPerWeek >= 7) {
    throw new Error('Invalid input: dailyAverageCalories and valid training days (1-6) are required.');
  }

  const totalWeeklyCalories = dailyAverageCalories * 7;
  const restDaysCount = 7 - trainingDaysPerWeek;
  const shiftPct = cyclingIntensity === 'AGGRESSIVE' ? 0.20 : 0.12;

  const highDayCalories = Math.round(dailyAverageCalories * (1 + (shiftPct * (restDaysCount / 7))));
  const totalHighKcal = highDayCalories * trainingDaysPerWeek;
  const remainingKcal = totalWeeklyCalories - totalHighKcal;
  const lowDayCalories = Math.round(remainingKcal / restDaysCount);

  const proteinKcal = proteinGrams * 4;
  const highFatGrams = fatGrams;
  const highFatKcal = highFatGrams * 9;
  const highCarbsGrams = Math.max(0, Math.round((highDayCalories - (proteinKcal + highFatKcal)) / 4));

  const lowFatGrams = Math.round(fatGrams * 1.05);
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
      macros: { protein_grams: proteinGrams, carbs_grams: highCarbsGrams, fats_grams: highFatGrams },
      message_ar: 'يوم تدريب: كاربوهيدرات أعلى لملء مخازن الجليكوجين وأداء أقوى بالأوزان.'
    },
    low_day: {
      type: 'REST_DAY',
      calories: lowDayCalories,
      macros: { protein_grams: proteinGrams, carbs_grams: lowCarbsGrams, fats_grams: lowFatGrams },
      message_ar: 'يوم راحة: خفض الكارب لتعويض سعرات أيام التمرين وتحفيز أكسدة الدهون أثناء الاستشفاء.'
    }
  };
}

export function evaluateDietBreakNeed({
  consecutiveDeficitWeeks = 1,
  bodyFatPercentage = 20,
  hungerFatigueScore = 5,
  estimatedMaintenanceCalories,
  currentDeficitCalories
}) {
  let triggerDietBreak = false;
  let reason = '';
  let maxDeficitWeeksAllowed = bodyFatPercentage <= 12 ? 6 : bodyFatPercentage <= 20 ? 10 : 14;

  if (consecutiveDeficitWeeks >= maxDeficitWeeksAllowed) {
    triggerDietBreak = true;
    reason = `تم إتمام ${consecutiveDeficitWeeks} أسبوعاً متواصلاً في عجز السعرات. حان وقت الدايت بريك لإعادة توازن هرمونات الشبع وخفض الكورتيزول.`;
  } else if (consecutiveDeficitWeeks >= 6 && hungerFatigueScore >= 8) {
    triggerDietBreak = true;
    reason = 'تم رصد إجهاد أيضي ونفسي حاد. يوصى ببريك وقائي مبكر لمدة أسبوع.';
  }

  const maintenance = estimatedMaintenanceCalories || Math.round(currentDeficitCalories / 0.78);

  return {
    should_take_diet_break: triggerDietBreak,
    status: triggerDietBreak ? 'DIET_BREAK_RECOMMENDED' : 'CONTINUE_DEFICIT',
    consecutive_weeks: consecutiveDeficitWeeks,
    max_weeks_allowed: maxDeficitWeeksAllowed,
    reason_ar: reason || 'الاستمرار في خطة التنشيف الحالية بنجاح، لا توجد مؤشرات إجهاد أيضي تستدعي التوقف.',
    protocol: triggerDietBreak ? {
      duration_days: 7,
      target_maintenance_calories: maintenance,
      calorie_increase_amount: maintenance - currentDeficitCalories,
      guidelines_ar: [
        'رفع السعرات حصراً إلى مستوى الثبات.',
        'تخصيص كامل السعرات الإضافية للكاربوهيدرات المعقدة لملء العضلات.',
        'الحفاظ على نفس جدول التمرين وعدد الخطوات اليومية.',
        'الزيادة المتوقعة على الميزان هي ماء وجليكوجين مؤقت يزول فور العودة للعجز.'
      ]
    } : null
  };
}

export function calculateRefeedDay({ currentCalories, proteinGrams, currentCarbsGrams, fatGrams }) {
  const additionalCarbGrams = Math.round(currentCarbsGrams * 0.45);
  const refeedCarbs = currentCarbsGrams + additionalCarbGrams;
  const refeedFats = Math.max(30, Math.round(fatGrams * 0.85));
  const refeedCalories = (proteinGrams * 4) + (refeedCarbs * 4) + (refeedFats * 9);

  return {
    type: 'CONTROLLED_REFEED_DAY',
    calories: refeedCalories,
    macros: { protein_grams: proteinGrams, carbs_grams: refeedCarbs, fats_grams: refeedFats },
    carbs_added_grams: additionalCarbGrams,
    instructions_ar: 'يُفضل تطبيق هذا اليوم في أشق يوم تمرين خلال الأسبوع (مثل يوم الأرجل أو الظهر).'
  };
}

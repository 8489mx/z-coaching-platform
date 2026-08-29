/**
 * Daily Habit, Sleep Quality, NEAT & Behavioral Adherence Engine
 * Pure Deterministic Clinical & Behavioral Math
 * Zero External Dependencies
 */

/**
 * تقييم الالتزام اليومي بالعادات وحساب مجموع النقاط (Daily Adherence Score)
 */
export function evaluateDailyHabits({
  stepCount = 0,
  targetSteps = 8000,
  sleepHours = 7,
  sleepQualityScore = 7,
  waterLiters = 0,
  targetWaterLiters = 3.0,
  workoutCompleted = false,
  mealsLoggedCount = 0,
  targetMealsCount = 4
}) {
  // 1. أوزان الالتزام المعتمدة سريرياً (مجموع الأوزان = 100%)
  // - التغذية والوجبات: 35%
  // - خطوات النشاط اليومي (NEAT): 25%
  // - التمرين المجدول: 20%
  // - ساعات وجودة النوم: 10%
  // - شرب الماء: 10%

  // أ. نسبة الوجبات (حد أقصى 35 نقطة)
  const mealRatio = targetMealsCount > 0 ? Math.min(1.0, mealsLoggedCount / targetMealsCount) : 1.0;
  const nutritionScore = +(mealRatio * 35).toFixed(1);

  // ب. نسبة الخطوات (حد أقصى 25 نقطة)
  const stepRatio = targetSteps > 0 ? Math.min(1.2, stepCount / targetSteps) : 1.0;
  const neatScore = +(Math.min(1.0, stepRatio) * 25).toFixed(1);

  // ج. التمرين (20 نقطة)
  const workoutScore = workoutCompleted ? 20 : 0;

  // د. النوم (10 نقاط: 6 ساعات فأكثر وجودة جيدة)
  let sleepScore = 0;
  if (sleepHours >= 7 && sleepQualityScore >= 6) {
    sleepScore = 10;
  } else if (sleepHours >= 6) {
    sleepScore = 7;
  } else {
    sleepScore = 3;
  }

  // هـ. الماء (حد أقصى 10 نقاط)
  const waterRatio = targetWaterLiters > 0 ? Math.min(1.0, waterLiters / targetWaterLiters) : 1.0;
  const hydrationScore = +(waterRatio * 10).toFixed(1);

  // إجمالي نقاط اليوم (من 100)
  const totalDailyScore = Math.round(nutritionScore + neatScore + workoutScore + sleepScore + hydrationScore);

  // 2. التحليلات الفسيولوجية والتنبيهات المباشرة
  const physiologicalFlags = [];
  let neatCalorieDelta = 0;

  // أثر الخطوات على معدل الحرق اليومي (الخطوة تعادل تقريباً 0.04 سعرة لمتوسط الأوزان)
  const stepDeficitOrSurplus = stepCount - targetSteps;
  neatCalorieDelta = Math.round(stepDeficitOrSurplus * 0.04);

  // تنبيه الحرمان من النوم واحتباس السوائل
  if (sleepHours < 6) {
    physiologicalFlags.push({
      type: 'SLEEP_DEPRIVATION_ALERT',
      severity: 'WARNING',
      message_ar: 'نوم أقل من 6 ساعات: يرفع هرمون الكورتيزول ويسبب احتباس سوائل مؤقت قد يرفع الميزان وهمياً ويضلل القراءات.'
    });
  }

  // تنبيه جفاف أو نقص الماء
  if (waterRatio < 0.6) {
    physiologicalFlags.push({
      type: 'HYDRATION_WARNING',
      severity: 'INFO',
      message_ar: 'استهلاك الماء منخفض اليوم: شرب الماء الكافي ضروري لكفاءة أكسدة الدهون ومنع الشد العضلي.'
    });
  }

  // تصنيف مستوى الإنجاز اليومي
  let tier = 'NEEDS_IMPROVEMENT';
  let badge_ar = 'بحاجة لمزيد من التركيز';
  if (totalDailyScore >= 85) {
    tier = 'EXCELLENT';
    badge_ar = 'التزام مثالي';
  } else if (totalDailyScore >= 70) {
    tier = 'GOOD';
    badge_ar = 'يوم قوي وإيجابي';
  }

  return {
    daily_score: totalDailyScore,
    performance_tier: tier,
    badge_ar,
    breakdown: {
      nutrition: { points: nutritionScore, max: 35, percentage: Math.round((nutritionScore / 35) * 100) },
      neat_steps: { points: neatScore, max: 25, percentage: Math.round((neatScore / 25) * 100), neat_calorie_delta: neatCalorieDelta },
      workout: { points: workoutScore, max: 20, completed: workoutCompleted },
      sleep: { points: sleepScore, max: 10, hours: sleepHours, quality_score: sleepQualityScore },
      hydration: { points: hydrationScore, max: 10, liters: waterLiters, target_liters: targetWaterLiters }
    },
    physiological_flags: physiologicalFlags,
    meets_daily_standard: totalDailyScore >= 70
  };
}

/**
 * حساب سلسلة الالتزام المتواصلة (Consistency & Streak Tracker)
 */
export function calculateStreakStatus(habitLogs = [], thresholdScore = 70) {
  if (!habitLogs || habitLogs.length === 0) {
    return {
      current_streak_days: 0,
      longest_streak_days: 0,
      consistency_rate_pct: 0,
      rank_title_ar: 'بداية جديدة'
    };
  }

  let currentStreak = 0;
  let maxStreak = 0;
  let tempStreak = 0;
  let successfulDays = 0;

  // فحص السلسلة الحالية من أول سجل متصل
  let isCurrentStreakActive = true;
  for (let i = 0; i < habitLogs.length; i++) {
    const score = habitLogs[i].daily_score || 0;
    const isSuccess = score >= thresholdScore;

    if (isSuccess) {
      successfulDays++;
      tempStreak++;
      if (isCurrentStreakActive) {
        currentStreak++;
      }
    } else {
      isCurrentStreakActive = false;
      tempStreak = 0;
    }

    if (tempStreak > maxStreak) {
      maxStreak = tempStreak;
    }
  }

  const consistencyRate = Math.round((successfulDays / habitLogs.length) * 100);

  // تصنيف رتبة المشترك السلوكية
  let rankTitle = 'مبتدئ واعد';
  if (currentStreak >= 30) {
    rankTitle = 'التزام استثنائي (30+ يوم متواصل)';
  } else if (currentStreak >= 14) {
    rankTitle = 'التزام متقدم (أسبوعان)';
  } else if (currentStreak >= 7) {
    rankTitle = 'متدرب منضبط (أسبوع متواصل)';
  }

  return {
    current_streak_days: currentStreak,
    longest_streak_days: Math.max(maxStreak, currentStreak),
    total_days_logged: habitLogs.length,
    successful_days_count: successfulDays,
    consistency_rate_pct: consistencyRate,
    rank_title_ar: rankTitle
  };
}

/**
 * تحليل وتفسير تقلبات الميزان الأسبوعية بربطها بعادات النوم والـ NEAT
 */
export function correlateHabitsWithWeightChange({
  weeklyAverageSteps = 8000,
  targetSteps = 8000,
  weeklyAverageSleep = 7,
  weightDeltaKg = 0
}) {
  const findings = [];
  const stepDeficit = targetSteps - weeklyAverageSteps;

  if (weightDeltaKg >= 0 && weeklyAverageSleep < 6.2) {
    findings.push('زيادة/ثبات الوزن على الأغلب بسبب احتباس سوائل هرموني ناتج عن قلة متوسط النوم الأسبوعي وليس ثبات دهون.');
  }

  if (weightDeltaKg >= 0 && stepDeficit >= 2500) {
    const burnedLossKcal = Math.round(stepDeficit * 7 * 0.04);
    findings.push(`هبوط الخطوات بمتوسط (${stepDeficit} خطوة يومياً) قلل استهلاك الطاقة الأسبوعي بقرابة ~${burnedLossKcal} سعرة.`);
  }

  return {
    has_correlation_insights: findings.length > 0,
    insights_ar: findings
  };
}

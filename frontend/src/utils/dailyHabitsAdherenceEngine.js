/**
 * Daily Habit, Sleep Quality, NEAT & Behavioral Adherence Engine
 * Pure Deterministic Clinical & Behavioral Math
 * Zero External Dependencies
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
  const mealRatio = targetMealsCount > 0 ? Math.min(1.0, mealsLoggedCount / targetMealsCount) : 1.0;
  const nutritionScore = +(mealRatio * 35).toFixed(1);

  const stepRatio = targetSteps > 0 ? Math.min(1.2, stepCount / targetSteps) : 1.0;
  const neatScore = +(Math.min(1.0, stepRatio) * 25).toFixed(1);

  const workoutScore = workoutCompleted ? 20 : 0;

  let sleepScore = sleepHours >= 7 && sleepQualityScore >= 6 ? 10 : sleepHours >= 6 ? 7 : 3;

  const waterRatio = targetWaterLiters > 0 ? Math.min(1.0, waterLiters / targetWaterLiters) : 1.0;
  const hydrationScore = +(waterRatio * 10).toFixed(1);

  const totalDailyScore = Math.round(nutritionScore + neatScore + workoutScore + sleepScore + hydrationScore);

  const physiologicalFlags = [];
  const stepDeficitOrSurplus = stepCount - targetSteps;
  const neatCalorieDelta = Math.round(stepDeficitOrSurplus * 0.04);

  if (sleepHours < 6) {
    physiologicalFlags.push({
      type: 'SLEEP_DEPRIVATION_ALERT',
      severity: 'WARNING',
      message_ar: 'نوم أقل من 6 ساعات: يرفع هرمون الكورتيزول ويسبب احتباس سوائل مؤقت قد يرفع الميزان وهمياً.'
    });
  }

  let tier = totalDailyScore >= 85 ? 'EXCELLENT' : totalDailyScore >= 70 ? 'GOOD' : 'NEEDS_IMPROVEMENT';
  let badge_ar = totalDailyScore >= 85 ? 'التزام مثالي' : totalDailyScore >= 70 ? 'يوم قوي وإيجابي' : 'بحاجة لمزيد من التركيز';

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

export function calculateStreakStatus(habitLogs = [], thresholdScore = 70) {
  if (!habitLogs || habitLogs.length === 0) {
    return { current_streak_days: 0, longest_streak_days: 0, consistency_rate_pct: 0, rank_title_ar: 'بداية جديدة' };
  }

  let currentStreak = 0;
  let maxStreak = 0;
  let tempStreak = 0;
  let successfulDays = 0;
  let isCurrentStreakActive = true;

  for (let i = 0; i < habitLogs.length; i++) {
    const score = habitLogs[i].daily_score || 0;
    const isSuccess = score >= thresholdScore;
    if (isSuccess) {
      successfulDays++;
      tempStreak++;
      if (isCurrentStreakActive) currentStreak++;
    } else {
      isCurrentStreakActive = false;
      tempStreak = 0;
    }
    if (tempStreak > maxStreak) maxStreak = tempStreak;
  }

  const consistencyRate = Math.round((successfulDays / habitLogs.length) * 100);
  let rankTitle = currentStreak >= 30 ? 'التزام استثنائي (30+ يوم)' : currentStreak >= 14 ? 'التزام متقدم (أسبوعين)' : currentStreak >= 7 ? 'متدرب منضبط (أسبوع)' : 'مبتدئ واعد';

  return {
    current_streak_days: currentStreak,
    longest_streak_days: Math.max(maxStreak, currentStreak),
    total_days_logged: habitLogs.length,
    successful_days_count: successfulDays,
    consistency_rate_pct: consistencyRate,
    rank_title_ar: rankTitle
  };
}

export function correlateHabitsWithWeightChange({ weeklyAverageSteps = 8000, targetSteps = 8000, weeklyAverageSleep = 7, weightDeltaKg = 0 }) {
  const findings = [];
  const stepDeficit = targetSteps - weeklyAverageSteps;

  if (weightDeltaKg >= 0 && weeklyAverageSleep < 6.2) {
    findings.push('زيادة/ثبات الوزن على الأغلب بسبب احتباس سوائل هرموني ناتج عن قلة متوسط النوم الأسبوعي.');
  }
  if (weightDeltaKg >= 0 && stepDeficit >= 2500) {
    const burnedLossKcal = Math.round(stepDeficit * 7 * 0.04);
    findings.push(`هبوط الخطوات بمتوسط (${stepDeficit} خطوة يومياً) قلل استهلاك الطاقة الأسبوعي بقرابة ~${burnedLossKcal} سعرة.`);
  }

  return { has_correlation_insights: findings.length > 0, insights_ar: findings };
}

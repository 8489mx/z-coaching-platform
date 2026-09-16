/**
 * Coach Scenario Sandbox / What-If Physiological Simulator
 * Z Coaching Platform - Coach Decision Support System
 *
 * Simulates the physiological consequences of hypothetical coach decisions:
 * - Calorie/Macro modifications (Weekly weight velocity, Deficit Volume Shield, Protein Sparing)
 * - Session mergers or rescheduling (Glycogen demand, peri-workout carb allocation, volume density)
 * Zero emojis, 100% deterministic code.
 */

export function simulateCoachScenario({
  baseTargets = {},
  clientBiometrics = {},
  deltaCalories = 0,
  sessionMerge = null,
  currentSessions = []
} = {}) {
  const currentCalories = Number(baseTargets.calories) || 2000;
  const currentProtein = Number(baseTargets.protein) || 150;
  const currentCarbs = Number(baseTargets.carbs) || 200;
  const currentFats = Number(baseTargets.fats) || 60;

  const weightKg = Number(clientBiometrics.weightKg) || 75;
  const tdee = Number(clientBiometrics.tdee) || Math.round(weightKg * 30) || 2250;

  // 1. Projected Calories
  const projectedCalories = Math.max(1100, Math.min(5000, currentCalories + Number(deltaCalories)));
  const dailyDeficitOrSurplus = tdee - projectedCalories; // positive = deficit, negative = surplus
  const deficitRatio = dailyDeficitOrSurplus / tdee;

  // 2. Projected Weekly Weight Delta (kg) (7700 kcal ~ 1 kg tissue)
  // Positive delta = weight loss, Negative = weight gain
  const projectedWeeklyLossKg = Number(((dailyDeficitOrSurplus * 7) / 7700).toFixed(2));

  // 3. Deficit Volume Shield Analysis
  let mrvMultiplier = 1.0;
  let shieldStatus = 'NEUTRAL';
  let shieldTitleAr = 'سقف الاستشفاء الطبيعي (100%)';
  let shieldRecommendationAr = 'مستوى سعرات متوازن يحافظ على كامل سقف الاستشفاء الأسبوعي MRV بدون تقليص.';

  if (deficitRatio >= 0.20 || projectedCalories < 1500) {
    mrvMultiplier = 0.80; // 20% shrinkage
    shieldStatus = 'SHRUNK_SEVERE';
    shieldTitleAr = 'انكماش سقف الاستشفاء بنسبة 20% (درع العجز الحاد)';
    shieldRecommendationAr = 'عجز حراري حاد: انكماش سرعة تعويض الجليكوجين بنسبة 20%، يُلزم ترشيد جولات العمل الأسبوعية وتجنب الفشل التام.';
  } else if (deficitRatio >= 0.10) {
    mrvMultiplier = 0.90; // 10% shrinkage
    shieldStatus = 'SHRUNK_MODERATE';
    shieldTitleAr = 'انكماش سقف الاستشفاء بنسبة 10% (درع العجز المعتدل)';
    shieldRecommendationAr = 'عجز حراري معتدل: خفض طفيف لسقف الجولات بنسبة 10% لحماية النسيج العضلي من الهدم التراكمي.';
  } else if (dailyDeficitOrSurplus <= -200) {
    mrvMultiplier = 1.15; // 15% expansion
    shieldStatus = 'EXPANDED_SURPLUS';
    shieldTitleAr = 'توسيع سقف الاستشفاء بنسبة +15% (فائض بنائي)';
    shieldRecommendationAr = 'فائض سعري إيجابي: وفرة جليكوجينية تسمح بزيادة الحجم التدريبي وجولات العمل لتحقيق أقصى بناء عضلي.';
  }

  // 4. Protein-Sparing Defense Multiplier
  let recommendedProteinMultiplier = 1.8;
  if (deficitRatio >= 0.20) {
    recommendedProteinMultiplier = 2.3;
  } else if (deficitRatio >= 0.10) {
    recommendedProteinMultiplier = 2.0;
  } else if (dailyDeficitOrSurplus < 0) {
    recommendedProteinMultiplier = 1.8;
  }

  const recommendedProteinGrams = Math.round(weightKg * recommendedProteinMultiplier);
  const fatCalories = Math.round(projectedCalories * 0.25);
  const recommendedFatGrams = Math.max(35, Math.round(fatCalories / 9));
  const remainingCaloriesForCarbs = Math.max(200, projectedCalories - (recommendedProteinGrams * 4) - (recommendedFatGrams * 9));
  const recommendedCarbGrams = Math.round(remainingCaloriesForCarbs / 4);

  // 5. Session Merger Simulation
  let sessionMergeReport = null;
  if (sessionMerge && Array.isArray(sessionMerge.sessionIndices) && sessionMerge.sessionIndices.length >= 2) {
    const idx1 = sessionMerge.sessionIndices[0];
    const idx2 = sessionMerge.sessionIndices[1];
    const s1 = currentSessions[idx1] || {};
    const s2 = currentSessions[idx2] || {};

    const exList1 = Array.isArray(s1.exercises) ? s1.exercises : [];
    const exList2 = Array.isArray(s2.exercises) ? s2.exercises : [];
    const combinedExercises = [...exList1, ...exList2];

    const totalSets = combinedExercises.reduce((sum, ex) => sum + (Number(ex.sets || ex.working_sets) || 3), 0);
    const compoundCount = combinedExercises.filter(ex => 
      /squat|deadlift|bench|press|row|سكوات|ديدليفت|بنش|سحب/i.test(ex.exercise_name || ex.name || '')
    ).length;

    let mergedGlycogenDemand = 'MODERATE';
    let periWorkoutRatio = 0.50;

    if (totalSets >= 20 || compoundCount >= 4) {
      mergedGlycogenDemand = 'VERY_HIGH';
      periWorkoutRatio = 0.65;
    } else if (totalSets >= 14 || compoundCount >= 2) {
      mergedGlycogenDemand = 'HIGH';
      periWorkoutRatio = 0.55;
    }

    const periWorkoutCarbsGrams = Math.round(recommendedCarbGrams * periWorkoutRatio);

    sessionMergeReport = {
      is_merged: true,
      merged_session_name: `${s1.session_name || 'جلسة 1'} + ${s2.session_name || 'جلسة 2'}`,
      total_exercises: combinedExercises.length,
      total_working_sets: totalSets,
      compound_exercises_count: compoundCount,
      projected_glycogen_demand: mergedGlycogenDemand,
      peri_workout_carb_ratio_target: `${Math.round(periWorkoutRatio * 100)}%`,
      peri_workout_carbs_grams: periWorkoutCarbsGrams,
      clinical_guidance_ar: totalSets > 22
        ? 'تحذير كثافة تدريبية: دمج هاتين الجلستين ينتج أكثر من 22 جولة عمل! يُنصح باستبعاد تمارين العزل الثانوية لتفادي التراجع العصبي.'
        : 'دمج تدريبي متوازن: يُنصح بتركيز الكربوهيدرات في وجبتي ما قبل وبعد التمرين لتغذية الجلسة المدمجة.'
    };
  }

  return {
    scenario_inputs: {
      current_calories: currentCalories,
      delta_calories: deltaCalories,
      projected_calories: projectedCalories,
      client_weight_kg: weightKg,
      tdee: tdee
    },
    weight_velocity: {
      projected_weekly_loss_kg: projectedWeeklyLossKg,
      weekly_direction: projectedWeeklyLossKg > 0 ? 'LOSS' : (projectedWeeklyLossKg < 0 ? 'GAIN' : 'STABLE'),
      formatted_text_ar: projectedWeeklyLossKg > 0
        ? `معدل النزول المتوقع: ${projectedWeeklyLossKg} كجم / أسبوع`
        : projectedWeeklyLossKg < 0
          ? `معدل الزيادة المتوقع: ${Math.abs(projectedWeeklyLossKg)} كجم / أسبوع`
          : 'ثبات فسيولوجي للوزن (مستوى صيانة)'
    },
    deficit_volume_shield: {
      status: shieldStatus,
      mrv_multiplier: mrvMultiplier,
      title_ar: shieldTitleAr,
      recommendation_ar: shieldRecommendationAr
    },
    suggested_macro_targets: {
      calories: projectedCalories,
      protein: recommendedProteinGrams,
      carbs: recommendedCarbGrams,
      fats: recommendedFatGrams,
      protein_multiplier: recommendedProteinMultiplier
    },
    session_merger_simulation: sessionMergeReport
  };
}

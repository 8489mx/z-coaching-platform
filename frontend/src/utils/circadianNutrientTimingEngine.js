/**
 * Circadian Rhythm & Peri-Workout Nutrient Timing Engine
 * محرك التوقيت الغذائي وإيقاع الساعة البيولوجية ومصفوفة الوجبات حول التمرين
 */

function parseTimeToMinutes(timeStr = '00:00') {
  const parts = String(timeStr || '00:00').split(':');
  let h = parseInt(parts[0], 10);
  let m = parseInt(parts[1] || '0', 10);
  if (isNaN(h)) h = 0;
  if (isNaN(m)) m = 0;
  return h * 60 + m;
}

function formatMinutesToTime24(totalMinutes) {
  let normalized = Math.round(totalMinutes) % 1440;
  if (normalized < 0) normalized += 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

function formatMinutesToDisplayAr(totalMinutes) {
  let normalized = Math.round(totalMinutes) % 1440;
  if (normalized < 0) normalized += 1440;
  const h24 = Math.floor(normalized / 60);
  const m = normalized % 60;
  const periodAr = h24 >= 12 ? 'مساءً' : 'صباحاً';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return 'الساعة ' + h12 + ':' + String(m).padStart(2, '0') + ' ' + periodAr;
}

export function calculateCaffeineCutoffWindow({
  bedtime = '23:00',
  workout_time = null,
  sleep_quality = 'GOOD',
  sleep_latency_minutes = 15,
} = {}) {
  const bedtimeMinutes = parseTimeToMinutes(bedtime);
  const bufferHours = (sleep_quality === 'POOR' || sleep_latency_minutes > 30) ? 9 : 8;
  const cutoffMinutes = bedtimeMinutes - (bufferHours * 60);
  const cutoffTime24 = formatMinutesToTime24(cutoffMinutes);
  const cutoffDisplayAr = formatMinutesToDisplayAr(cutoffMinutes);

  let eveningWorkoutWarning = false;
  let preWorkoutStimDirectiveAr = 'تناول قهوتك أو مكمل الطاقة المعتاد قبل تمرينك بشرط أن يكون قبل نافذة إيقاف الكافيين.';

  if (workout_time) {
    const workoutMinutes = parseTimeToMinutes(workout_time);
    let diffToCutoff = workoutMinutes - cutoffMinutes;
    if (diffToCutoff < -720) diffToCutoff += 1440;
    if (diffToCutoff > 720) diffToCutoff -= 1440;

    if (diffToCutoff >= 0) {
      eveningWorkoutWarning = true;
      preWorkoutStimDirectiveAr = 'تنبيه الأمان العصبي: تمرينك مسائي يقع ضمن نافذة حظر المنبهات؛ يُحظر استخدام الكافيين أو البري ورك آوت المحفز، والاعتماد حصراً على محفزات ضخ الدم الخالية من الكافيين (Non-Stim Pump: مثل L-Citrulline 6g) لحماية النوم العميق وإفراز هرمون النمو.';
    }
  }

  return {
    bedtime_24h: bedtime,
    caffeine_cutoff_24h: cutoffTime24,
    caffeine_cutoff_display_ar: cutoffDisplayAr,
    buffer_hours: bufferHours,
    evening_workout_warning: eveningWorkoutWarning,
    pre_workout_stim_directive_ar: preWorkoutStimDirectiveAr,
    slow_wave_sleep_protection_ar: 'إيقاف الكافيين قبل النوم بـ ' + bufferHours + ' ساعات يضمن تفريغ مستقبلات الأدينوزين بالدماغ، مما يسمح بالدخول في طور النوم العميق (Delta Wave Sleep) الضروري لإفراز 70% من هرمون النمو البشري الطبيعي (GH).'
  };
}

export function generatePeriWorkoutNutrientTimingSchedule({
  workout_time = '17:00',
  workout_duration_minutes = 60,
  bedtime = '23:00',
  wake_time = '07:00',
  daily_calories = 2000,
  daily_protein_g = 160,
  daily_carbs_g = 200,
  daily_fat_g = 60,
  meal_count = 4,
} = {}) {
  const workoutMin = parseTimeToMinutes(workout_time);
  const workoutDuration = Number(workout_duration_minutes) || 60;
  const workoutEndMin = workoutMin + workoutDuration;
  const bedtimeMin = parseTimeToMinutes(bedtime);

  const periWorkoutTotalCarbs = Math.round(daily_carbs_g * 0.55);
  const preCarbsG = Math.round(periWorkoutTotalCarbs * 0.45);
  const postCarbsG = Math.round(periWorkoutTotalCarbs * 0.55);

  const preProteinG = Math.round(daily_protein_g * 0.25);
  const postProteinG = Math.round(daily_protein_g * 0.30);
  const preBedProteinG = Math.round(daily_protein_g * 0.25);

  const preMealMin = workoutMin - 105;
  const preMealTime24 = formatMinutesToTime24(preMealMin);
  const preMealDisplayAr = formatMinutesToDisplayAr(preMealMin);

  const prePrimerMin = workoutMin - 35;
  const prePrimerTime24 = formatMinutesToTime24(prePrimerMin);
  const prePrimerDisplayAr = formatMinutesToDisplayAr(prePrimerMin);

  const intraDisplayAr = formatMinutesToDisplayAr(workoutMin) + ' إلى ' + formatMinutesToDisplayAr(workoutEndMin);

  const postMealMin = workoutEndMin + 45;
  const postMealTime24 = formatMinutesToTime24(postMealMin);
  const postMealDisplayAr = formatMinutesToDisplayAr(postMealMin);

  const preBedMin = bedtimeMin - 75;
  const preBedTime24 = formatMinutesToTime24(preBedMin);
  const preBedDisplayAr = formatMinutesToDisplayAr(preBedMin);

  const caffeineWindow = calculateCaffeineCutoffWindow({
    bedtime,
    workout_time,
  });

  const timeline = [
    {
      timing_phase: 'PRE_WORKOUT_MAIN_MEAL',
      window_ar: 'قبل التمرين بـ 90 - 120 دقيقة (' + preMealDisplayAr + ')',
      time_24h: preMealTime24,
      target_protein_g: preProteinG,
      target_carb_g: preCarbsG,
      target_fat_g: Math.min(10, Math.round(daily_fat_g * 0.15)),
      physiological_objective_ar: 'تأمين تدفق مستدام للجلوكوز والأحماض الأمينية في الدم مع الحفاظ على معدة خفيفة لمنع كسل الجهاز الهضمي.',
      recommended_foods_ar: 'شوفان مع سكوب واي بروتين، أو صدر دجاج مشوي مع أرز بسمتي/ياسمين وخضار خفيف قليل الألياف.'
    },
    {
      timing_phase: 'PRE_WORKOUT_GLYCOGEN_PRIMER',
      window_ar: 'قبل التمرين بـ 30 - 45 دقيقة (' + prePrimerDisplayAr + ') [اختياري للطاقة القصوى]',
      time_24h: prePrimerTime24,
      target_protein_g: 0,
      target_carb_g: 20,
      target_fat_g: 0,
      physiological_objective_ar: 'رفع سكر الدم الفوري وملء الجليكوجين الكبدي قبل بدء المجهود العضلي الشاق.',
      recommended_foods_ar: 'حبتان إلى 3 حبات تمر سكري أو نصف موزة ناضجة مع رشفات ماء ورشة ملح بحري لتعزيز البمب.'
    },
    {
      timing_phase: 'INTRA_WORKOUT_HYDRATION',
      window_ar: 'أثناء التمرين (' + intraDisplayAr + ')',
      time_24h: workout_time,
      hydration_target_ml: 650,
      physiological_objective_ar: 'الحفاظ على الحجم البلازمي وكفاءة انقباض الألياف العضلية وتجنب الهبوط المفاجئ للأداء الناتج عن الجفاف.',
      recommended_hydration_ar: 'شرب 150 - 200 مل ماء كل 15 دقيقة، مع إضافة أملاح إلكترولايت (صوديوم + بوتاسيوم) في الأيام الحارة أو التدريب المكثف.'
    },
    {
      timing_phase: 'POST_WORKOUT_ANABOLIC_WINDOW',
      window_ar: 'بعد التمرين بـ 45 - 60 دقيقة (' + postMealDisplayAr + ')',
      time_24h: postMealTime24,
      target_protein_g: postProteinG,
      target_carb_g: postCarbsG,
      target_fat_g: Math.round(daily_fat_g * 0.20),
      physiological_objective_ar: 'تفعيل مسار mTORC1 وتخليق البروتين العضلي (MPS) عبر عتبة الليوسين، وإعادة ملء مخازن الجليكوجين وتخفيض هرمون الكورتيزول.',
      recommended_foods_ar: 'سكوب واي بروتين سريع الامتصاص أو صدور دجاج/سمك أبيض مع كمية وفيرة من البطاطس المسلوقة أو الأرز الأبيض.'
    },
    {
      timing_phase: 'PRE_BED_NOCTURNAL_RECOVERY',
      window_ar: 'قبل النوم بـ 60 - 90 دقيقة (' + preBedDisplayAr + ')',
      time_24h: preBedTime24,
      target_protein_g: preBedProteinG,
      target_carb_g: Math.round(daily_carbs_g * 0.15),
      target_fat_g: Math.round(daily_fat_g * 0.35),
      physiological_objective_ar: 'إمداد العضلات بأحماض أمينية بطيئة التحرر لمدة 6-8 ساعات لمنع الهدم الليلي، ودعم إفراز الميلاتونين واسترخاء الجهاز العصبي.',
      recommended_foods_ar: 'جبن قريش (Cottage Cheese) مع زيت زيتون، أو زبادي يوناني كامل الدسم مع قبضة لوز أو جوز، مع مكمل مغنيسيوم جلايسينات (300-400 مجم).'
    }
  ];

  return {
    workout_time,
    bedtime,
    wake_time,
    caffeine_cutoff: caffeineWindow,
    peri_workout_total_carbs_g: periWorkoutTotalCarbs,
    timeline,
    circadian_summary_ar: 'تمت مزامنة جدول وجباتك بدقة حول موعد تمرينك (' + formatMinutesToDisplayAr(workoutMin) + ') مع إيقاف الكافيين في موعد صارم (' + caffeineWindow.caffeine_cutoff_display_ar + ') لضمان أقصى طاقة في التمرين ونوم عميق للاستشفاء.'
  };
}
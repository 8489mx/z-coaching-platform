/**
 * Double Progression & Auto-Deload Engine
 *
 * 1. Double Progression Logic:
 *    - When trainee completes target sets at the top of the rep-range (e.g. 3 x 12 reps at 1-2 RIR):
 *      -> Auto-increments next week's load by +2.5kg (compounds/barbells) or +1.0kg (isolation/dumbbells).
 *      -> Resets target reps to bottom of range (e.g. 8 reps).
 *    - If top of rep range is not yet achieved: maintains load and aims to add reps.
 *
 * 2. Auto-Deload Protocol:
 *    - Triggered after 4-6 weeks of continuous progression OR when performance drops across 2 consecutive sessions.
 *    - Reduces weekly set volume by 50% while maintaining absolute intensity/weight on the bar.
 */

export const EXERCISE_CATEGORIES = {
  COMPOUND_BARBELL: 'COMPOUND_BARBELL',
  ISOLATION_DUMBBELL: 'ISOLATION_DUMBBELL',
  MACHINE_CABLE: 'MACHINE_CABLE'
};

/**
 * Evaluates Double Progression step for an individual exercise.
 */
export function evaluateDoubleProgression({
  exercise_name = 'Barbell Bench Press',
  category = EXERCISE_CATEGORIES.COMPOUND_BARBELL,
  target_rep_range = [8, 12],
  current_weight_kg = 80,
  completed_sets = [
    { reps: 12, rir: 2, completed: true },
    { reps: 12, rir: 2, completed: true },
    { reps: 12, rir: 1, completed: true }
  ]
}) {
  const [minReps, maxReps] = target_rep_range;
  const isAllSetsAtTop = completed_sets.length > 0 && completed_sets.every(s => s.completed && s.reps >= maxReps);

  if (isAllSetsAtTop) {
    const incrementKg = category === EXERCISE_CATEGORIES.COMPOUND_BARBELL ? 2.5 : 1.0;
    const nextWeightKg = current_weight_kg + incrementKg;

    return {
      exercise_name,
      progression_action: 'INCREASE_WEIGHT_RESET_REPS',
      current_weight_kg,
      next_target_weight_kg: nextWeightKg,
      next_target_reps: minReps,
      increment_applied_kg: incrementKg,
      directive_ar: `إنجاز ممتاز! تم تقفيل النطاق (${maxReps} عدات بكافة الجولات)؛ مستهدفك للأسبوع القادم هو زيادة الوزن بمقدار +${incrementKg}kg لتصبح ${nextWeightKg}kg والبدء من ${minReps} عدات.`
    };
  }

  // Not yet at top of range
  const totalRepsCompleted = completed_sets.reduce((sum, s) => sum + (s.completed ? s.reps : 0), 0);

  return {
    exercise_name,
    progression_action: 'MAINTAIN_WEIGHT_BUILD_REPS',
    current_weight_kg,
    next_target_weight_kg: current_weight_kg,
    next_target_reps: maxReps,
    increment_applied_kg: 0,
    directive_ar: `استمر على نفس الوزن (${current_weight_kg}kg) في الأسبوع القادم، والتركيز على زيادة التكرارات في كل جولة حتى بلوغ سقف الـ ${maxReps} عدات.`
  };
}

/**
 * Evaluates Auto-Deload Protocol eligibility.
 */
export function evaluateAutoDeloadRequirement({
  consecutive_training_weeks = 5,
  consecutive_performance_drop_weeks = 0,
  systemic_fatigue_score_0_to_10 = 7,
  joint_ache_flag = false
}) {
  const isDeloadNeeded = 
    consecutive_training_weeks >= 6 ||
    consecutive_performance_drop_weeks >= 2 ||
    (systemic_fatigue_score_0_to_10 >= 8 && consecutive_training_weeks >= 4) ||
    joint_ache_flag;

  return {
    is_deload_active: isDeloadNeeded,
    protocol_name: isDeloadNeeded ? 'أسبوع تفريغ الأحمال التلقائي (Auto-Deload Week)' : 'مرحلة زيادة الأحمال التصاعدية النشطة (Progressive Overload)',
    volume_reduction_percent: isDeloadNeeded ? 50 : 0,
    intensity_guideline_ar: isDeloadNeeded ? 
      'تثبيت أوزان التمرين على البار لضمان الحفاظ على الإشارات العصبية، مع خفض عدد المجموعات الإجمالية بنسبة 50% لإنعاش المفاصل والجهاز العصبي المركزي.' :
      'الاستمرار على وتيرة التدرج المزدوج وزيادة الأحمال الطبيعية.',
    prescribed_actions_ar: isDeloadNeeded ? [
      'خفض مجموعات كل تمرين من 3-4 جولات إلى 2 جولة فقط',
      'تثبيت نفس الوزن المعتاد دون محاولة تحطيم أرقام قياسية هذا الأسبوع',
      'زيادة ساعات النوم بمقدار +30 إلى +60 دقيقة يومياً لتسريع استشفاء الأنسجة'
    ] : []
  };
}


/**
 * Non-Load Progressive Overload & Multi-Tool Home Engine
 */
export function resolveExerciseProgressionModel({
  environment = 'GYM',
  availableEquipment = ['BODYWEIGHT_ONLY'],
  weekNumber = 1,
  currentWeightKg = 0,
  currentReps = 10,
  targetRIR = 2
}) {
  // إذا كان في الجيم: التدرج المباشر بزيادة الحمل الميكانيكي (Load Progression)
  if (environment === 'GYM') {
    return {
      strategy: 'LOAD_OVERLOAD',
      suggestedWeightKg: weekNumber > 1 ? currentWeightKg + 2.5 : currentWeightKg,
      targetReps: currentReps,
      tempo: '2-0-1-0',
      restSeconds: 90,
      progressionNote: 'زيادة الوزن تدريجياً مع الحفاظ على الأداء المحكم ومعدل RIR 2.'
    };
  }

  // إذا كان في المنزل: تفعيل المسارات الثلاثة لفرط التضخم العضلي بدون أوزان ثقيلة
  const hasDumbbells = availableEquipment.includes('DUMBBELLS') || availableEquipment.includes('BARBELL') || availableEquipment.includes('MULTI_GYM');
  const hasBands = availableEquipment.includes('BANDS');

  if (hasDumbbells && hasBands) {
    return {
      strategy: 'ACCOMMODATING_RESISTANCE',
      suggestedWeightKg: currentWeightKg,
      targetReps: Math.min(currentReps + 2, 20),
      tempo: '3-1-1-0', // نزول في 3 ثوانٍ وثبات ثانية بالقمة
      restSeconds: 60,
      progressionNote: 'دمج حبل المقاومة مع الدمبل لزيادة ذروة الانقباض، والنزول البطيء في 3 ثوانٍ.'
    };
  }

  if (hasDumbbells) {
    return {
      strategy: 'VOLUME_AND_TEMPO',
      suggestedWeightKg: currentWeightKg,
      targetReps: Math.min(currentReps + 2, 20),
      tempo: '4-1-1-0', // زيادة وقت الشد العضلي TUT
      restSeconds: 45,
      progressionNote: 'التركيز على النزول في 4 ثوانٍ وتقليل فترة الراحة إلى 45 ثانية لمضاعفة الإجهاد الأيضي.'
    };
  }

  // وزن الجسم فقط (Leverage Progression)
  return {
    strategy: 'BIOMECHANICAL_LEVERAGE',
    suggestedWeightKg: 0,
    targetReps: Math.min(currentReps + 3, 25),
    tempo: '3-1-1-0',
    restSeconds: 45,
    progressionNote: 'تعديل زاوية الارتكاز (مثل رفع القدمين على كرسي في الضغط) لزيادة عزم المقاومة بوزن الجسم.'
  };
}

// Duplicates removed: one implementation each (behavior verified identical before the merge).
export { evaluateExerciseProgression, evaluateDeloadNeed } from './progressive-overload-deload-engine.js';
export { applyDeloadToSession as compileDeloadSession } from '../../frontend/src/utils/progressionEngine.js';

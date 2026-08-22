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
 * تقييم أداء التمرين وتحديد الزيادة في الوزن أو التكرارات (Double Progression Method)
 */
export function evaluateExerciseProgression({
  exerciseId,
  exerciseType = 'ISOLATION',
  targetRepRange = [8, 12],
  targetRIR = 2,
  loggedSets = [],
  consecutiveStalls = 0
}) {
  if (!loggedSets || loggedSets.length === 0) {
    return {
      status: 'NO_DATA',
      decision: 'MAINTAIN',
      next_weight_kg: 0,
      next_target_reps: targetRepRange[0],
      message_ar: 'لا توجد بيانات مسجلة للجلسة السابقة.',
      action_type: 'NONE'
    };
  }

  const [minReps, maxReps] = targetRepRange;
  const currentWeight = loggedSets[0].weight_kg || 0;
  const totalSets = loggedSets.length;

  // فحص هل حقق المتدرب الحد الأقصى للتكرارات في كل المجموعات
  const allSetsHitTopRange = loggedSets.every((s) => s.reps >= maxReps && (s.rir === undefined || s.rir >= targetRIR - 1));
  const failedToHitBottomRange = loggedSets.some((s) => s.reps < minReps);
  const averageReps = +(loggedSets.reduce((acc, s) => acc + s.reps, 0) / totalSets).toFixed(1);

  // تحديد قيمة الزيادة التلقائية في الوزن بناءً على نوع التمرين
  let weightIncrement = 2.5; // الافتراضي للتمارين العلوية والعزل
  if (exerciseType === 'COMPOUND_LOWER') {
    weightIncrement = 5.0; // للسكوات والديدليفت والضغط السفلي
  } else if (exerciseType === 'ISOLATION') {
    weightIncrement = 1.0; // للأوزان الخفيفة وعزل الأكتاف والذراعين
  }

  // الحالة 1: اجتياز النطاق بالكامل في كل المجموعات -> زيادة الوزن وتصفير التكرار للحد الأدنى
  if (allSetsHitTopRange) {
    const nextWeight = +(currentWeight + weightIncrement).toFixed(1);
    return {
      exercise_id: exerciseId,
      status: 'PROGRESSION_UNLOCKED',
      decision: 'INCREASE_WEIGHT',
      current_weight_kg: currentWeight,
      next_weight_kg: nextWeight,
      next_target_reps: minReps,
      increment_applied: weightIncrement,
      message_ar: `كفو يا بطل! حققت السقف الأعلى للتكرارات (${maxReps}). الجلسة القادمة: ارفع الوزن إلى ${nextWeight} كجم وابدأ من ${minReps} تكرارات.`,
      action_type: 'INCREASE_LOAD'
    };
  }

  // الحالة 2: السقوط تحت الحد الأدنى من التكرارات (إجهاد مفرط أو وزن أثقل من اللازم)
  if (failedToHitBottomRange) {
    if (consecutiveStalls >= 2) {
      // إذا تكرر الفشل لأسبوعين متتاليين يتم عمل Micro-Deload للوزن (-10%)
      const reducedWeight = +(Math.max(currentWeight * 0.9, 0)).toFixed(1);
      return {
        exercise_id: exerciseId,
        status: 'MICRO_DELOAD_REQUIRED',
        decision: 'REDUCE_WEIGHT',
        current_weight_kg: currentWeight,
        next_weight_kg: reducedWeight,
        next_target_reps: minReps,
        message_ar: `تم رصد إجهاد في هذا التمرين لأسبوعين. خفضنا الوزن إلى ${reducedWeight} كجم لضبط التكنيك وتفادي الإصابة.`,
        action_type: 'DELOAD_EXERCISE'
      };
    }

    return {
      exercise_id: exerciseId,
      status: 'RETRY_WEIGHT',
      decision: 'MAINTAIN_WEIGHT',
      current_weight_kg: currentWeight,
      next_weight_kg: currentWeight,
      next_target_reps: minReps,
      message_ar: `لم نصل للحد الأدنى (${minReps} عدات). نثبت الوزن ${currentWeight} كجم في الجلسة القادمة مع التركيز على التحكم بالنزول.`,
      action_type: 'RETRY'
    };
  }

  // الحالة 3: الأداء داخل النطاق المستهدف -> تثبيت الوزن ومحاولة زيادة العدات
  return {
    exercise_id: exerciseId,
    status: 'IN_RANGE_PROGRESSING',
    decision: 'INCREASE_REPS',
    current_weight_kg: currentWeight,
    next_weight_kg: currentWeight,
    next_target_reps: Math.min(maxReps, Math.ceil(averageReps + 1)),
    message_ar: `استمر بنفس الوزن (${currentWeight} كجم). الهدف في الجلسة القادمة: إضافة عدة إضافية لكل مجموعة للوصول لـ ${maxReps} تكرار.`,
    action_type: 'ADD_REPS'
  };
}

/**
 * تقييم الحاجة لأسبوع استشفاء وتفريغ أحمال (Deload Week) للمنظومة بالكامل
 */
export function evaluateDeloadNeed({
  weeksOfAccumulatedTraining = 1,
  weeklyVolumeLoadHistory = [],
  averageFatigueScore = 5,
  consecutivePerformanceDrops = 0
}) {
  let triggerDeload = false;
  let reason = '';

  // المعيار 1: إتمام 6 إلى 8 أسابيع تدريب شاق متواصل (Scheduled Deload)
  if (weeksOfAccumulatedTraining >= 8) {
    triggerDeload = true;
    reason = 'تم إتمام 8 أسابيع متواصلة من التحميل التدريبي. حان وقت تفريغ الأحمال المجدول لإعادة حساسية الألياف العضلية.';
  }
  // المعيار 2: هبوط متواصل في القوة والحجم التدريبي لأسبوعين مع إجهاد مرتفع (Overreaching)
  else if (consecutivePerformanceDrops >= 2 && averageFatigueScore >= 7) {
    triggerDeload = true;
    reason = 'تم رصد إجهاد تراكمي عصبي وعضلي (هبوط أداء متزامن مع ارتفاع الإجهاد). يوصى بأسبوع ديلود فوري.';
  }

  return {
    should_deload: triggerDeload,
    status: triggerDeload ? 'DELOAD_RECOMMENDED' : 'CONTINUE_OVERLOAD',
    weeks_accumulated: weeksOfAccumulatedTraining,
    reason_ar: reason || 'الجهاز العصبي والعضلي في حالة ممتازة لمواصلة التدرج بالأحمال.',
    protocol: triggerDeload ? {
      volume_reduction_pct: 40, // خفض عدد المجموعات بنسبة 40%
      intensity_policy: 'الحفاظ على نفس أوزان التمرين مع خفض الجولات والابتعاد عن الفشل بـ RIR 3-4',
      duration_days: 7
    } : null
  };
}

/**
 * تحويل جلسة تمرين عادية إلى جلسة ديلود مخففة تلقائياً
 */
export function compileDeloadSession(workoutSession) {
  if (!workoutSession || !workoutSession.exercises) return workoutSession;

  const adjustedExercises = workoutSession.exercises.map((ex) => {
    // خفض المجموعات (مثلا من 4 إلى 2، ومن 3 إلى 2)
    const deloadSets = Math.max(1, Math.round(ex.sets * 0.6));
    
    return {
      ...ex,
      sets: deloadSets,
      target_rir: Math.max((ex.target_rir || 2) + 2, 4), // رفع الأمان والابتعاد عن الفشل
      cue: `[أسبوع استشفاء] أداء سلس بتركيز حركي كامل دون الوصول للإنهاك.`
    };
  });

  return {
    ...workoutSession,
    is_deload: true,
    title_ar: `${workoutSession.title_ar || 'تمرين اليوم'} (أسبوع الاستشفاء - Deload)`,
    exercises: adjustedExercises
  };
}

/**
 * Progressive Overload & Deload Engine
 * Pure Deterministic Biomechanical & Volume Math
 * Zero External Dependencies
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
    return { status: 'NO_DATA', decision: 'MAINTAIN', next_weight_kg: 0, next_target_reps: targetRepRange[0], message_ar: 'لا توجد بيانات مسجلة للجلسة السابقة.', action_type: 'NONE' };
  }

  const [minReps, maxReps] = targetRepRange;
  const currentWeight = loggedSets[0].weight_kg || 0;
  const totalSets = loggedSets.length;

  const allSetsHitTopRange = loggedSets.every((s) => s.reps >= maxReps && (s.rir === undefined || s.rir >= targetRIR - 1));
  const failedToHitBottomRange = loggedSets.some((s) => s.reps < minReps);
  const averageReps = +(loggedSets.reduce((acc, s) => acc + s.reps, 0) / totalSets).toFixed(1);

  let weightIncrement = 2.5;
  if (exerciseType === 'COMPOUND_LOWER') weightIncrement = 5.0;
  else if (exerciseType === 'ISOLATION') weightIncrement = 1.0;

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

  if (failedToHitBottomRange) {
    if (consecutiveStalls >= 2) {
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

export function evaluateDeloadNeed({
  weeksOfAccumulatedTraining = 1,
  weeklyVolumeLoadHistory = [],
  averageFatigueScore = 5,
  consecutivePerformanceDrops = 0
}) {
  let triggerDeload = false;
  let reason = '';

  if (weeksOfAccumulatedTraining >= 8) {
    triggerDeload = true;
    reason = 'تم إتمام 8 أسابيع متواصلة من التحميل التدريبي. حان وقت تفريغ الأحمال المجدول لإعادة حساسية الألياف العضلية.';
  } else if (consecutivePerformanceDrops >= 2 && averageFatigueScore >= 7) {
    triggerDeload = true;
    reason = 'تم رصد إجهاد تراكمي عصبي وعضلي (هبوط أداء متزامن مع ارتفاع الإجهاد). يوصى بأسبوع ديلود فوري.';
  }

  return {
    should_deload: triggerDeload,
    status: triggerDeload ? 'DELOAD_RECOMMENDED' : 'CONTINUE_OVERLOAD',
    weeks_accumulated: weeksOfAccumulatedTraining,
    reason_ar: reason || 'الجهاز العصبي والعضلي في حالة ممتازة لمواصلة التدرج بالأحمال.',
    protocol: triggerDeload ? {
      volume_reduction_pct: 40,
      intensity_policy: 'الحفاظ على نفس أوزان التمرين مع خفض الجولات والابتعاد عن الفشل بـ RIR 3-4',
      duration_days: 7
    } : null
  };
}

export function compileDeloadSession(workoutSession) {
  if (!workoutSession || !workoutSession.exercises) return workoutSession;
  const adjustedExercises = workoutSession.exercises.map((ex) => ({
    ...ex,
    sets: Math.max(1, Math.round(ex.sets * 0.6)),
    target_rir: Math.max((ex.target_rir || 2) + 2, 4),
    cue: `[أسبوع استشفاء] أداء سلس بتركيز حركي كامل دون الوصول للإنهاك.`
  }));
  return {
    ...workoutSession,
    is_deload: true,
    title_ar: `${workoutSession.title_ar || 'تمرين اليوم'} (أسبوع الاستشفاء - Deload)`,
    exercises: adjustedExercises
  };
}

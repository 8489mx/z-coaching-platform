/**
 * Workout Execution & Auto-Deload Engine (محرك جلسة التمرين وإدارة الإجهاد)
 *
 * Tracks session volume load:
 *   Total Volume = sum(Weight * Reps)
 *
 * Provides dynamic rest intervals:
 *   - Compound: 90 - 120s
 *   - Isolation: 45 - 60s
 *
 * Implements auto-deload detection:
 *   - Decreased load on main lifts for 2 weeks + high fatigue -> Trigger Deload.
 */

export const MOVEMENT_PATTERNS = {
  COMPOUND: {
    recommended_rest_sec: 90,
    max_rest_sec: 120,
    examples: ['SQUAT', 'LEG_PRESS', 'DEADLIFT', 'BENCH_PRESS', 'LAT_PULLDOWN', 'SEATED_ROW', 'OVERHEAD_PRESS']
  },
  ISOLATION: {
    recommended_rest_sec: 60,
    max_rest_sec: 75,
    examples: ['BICEP_CURL', 'TRICEP_EXTENSION', 'LATERAL_RAISE', 'LEG_EXTENSION', 'LEG_CURL', 'CALF_RAISE', 'FACE_PULL', 'PLANK']
  }
};

/**
 * Calculates the Total Volume Load for a workout session:
 *   Total Volume = sum(Weight * Reps)
 */
export function calculateSessionVolumeLoad(exercises = []) {
  if (!Array.isArray(exercises)) {
    throw new TypeError("exercises must be an array.");
  }

  let totalVolumeKg = 0;
  let totalSetsCompleted = 0;
  let totalRepsCompleted = 0;

  for (const ex of exercises) {
    const sets = Array.isArray(ex.sets) ? ex.sets : [];
    for (const set of sets) {
      if (set.completed) {
        const weight = Number(set.weight) || 0;
        const reps = Number(set.reps) || 0;
        totalVolumeKg += (weight * reps);
        totalSetsCompleted += 1;
        totalRepsCompleted += reps;
      }
    }
  }

  return {
    total_volume_kg: Math.round(totalVolumeKg),
    total_sets_completed: totalSetsCompleted,
    total_reps_completed: totalRepsCompleted
  };
}

/**
 * Resolves the dynamic rest interval for an exercise based on compound vs isolation.
 */
export function getDynamicRestDuration(exerciseType = 'COMPOUND') {
  const type = String(exerciseType).toUpperCase();
  if (type.includes('ISOLATION') || type.includes('CURL') || type.includes('RAISE') || type.includes('EXTENSION') || type.includes('PLANK')) {
    return MOVEMENT_PATTERNS.ISOLATION.recommended_rest_sec; // 60s
  }
  return MOVEMENT_PATTERNS.COMPOUND.recommended_rest_sec; // 90s
}

/**
 * Auto-Deload Detection Algorithm:
 * Evaluates whether a client requires a Deload Week based on strength trajectory and fatigue biofeedback.
 */
export function evaluateAutoDeloadTrigger({
  consecutive_strength_drop_weeks = 0,
  fatigue_level = 3, // 1-10
  joint_pain_flag = false,
  current_week_number = 1
}) {
  const isDeloadTriggered = 
    (consecutive_strength_drop_weeks >= 2 && fatigue_level >= 7) ||
    (joint_pain_flag && fatigue_level >= 6) ||
    (current_week_number % 6 === 0); // Periodic mesocycle deload every 6th week

  if (isDeloadTriggered) {
    return {
      is_deload_active: true,
      volume_reduction_percent: 50, // Cut sets by 50%
      intensity_rir_target: '2-3 RIR (Unloaded)',
      rationale_ar: 'تفعيل أسبوع استشفاء مبرمج (Deload Week): تم خفض الحجم التدريبي بنسبة 50% مع تثبيت التكنيك عند 2-3 RIR لإعادة ترميم الأوتار وتجديد الجهاز العصبي المركزي.',
      rationale_en: 'Auto-Deload Activated: Session volume reduced by 50% at 2-3 RIR to allow CNS and connective tissue recovery.'
    };
  }

  return {
    is_deload_active: false,
    volume_reduction_percent: 0,
    intensity_rir_target: '1-2 RIR (Progressive Overload)',
    rationale_ar: 'الاستمرار على وتيرة زيادة الأحمال التدريبية التصاعدية.',
    rationale_en: 'Maintain progressive overload trajectory.'
  };
}

/**
 * Autoregulated Recovery & Dynamic Rescheduling Engine (Pillar 7)
 * 
 * Clinical & Biomechanical Engine for:
 * 1. Missed Workout Dynamic Rescheduling (Roll Forward vs. Volume Triage Merge vs. Strategic Absorption)
 * 2. Pre-Session Readiness & Daily Biofeedback Scoring (Optimal, Moderate Fatigue, High Fatigue Trim, Acute Recovery Pivot)
 * 3. Session Autoregulation (Intraday RIR and Volume Adjustment)
 * 4. Cumulative Fatigue & Proactive Deload Triggering
 * 
 * Rules:
 * - Pure deterministic functions.
 * - Zero emojis.
 * - Arabic RTL clinical directives.
 * - No live set logging tables or timers.
 */

export const RESCHEDULING_STRATEGIES = Object.freeze({
  ROLL_FORWARD: 'ROLL_FORWARD',
  VOLUME_TRIAGE_MERGE: 'VOLUME_TRIAGE_MERGE',
  STRATEGIC_VOLUME_ABSORPTION: 'STRATEGIC_VOLUME_ABSORPTION'
});

export const READINESS_TIERS = Object.freeze({
  OPTIMAL: 'OPTIMAL',
  MODERATE_FATIGUE: 'MODERATE_FATIGUE',
  HIGH_FATIGUE_TRIM: 'HIGH_FATIGUE_TRIM',
  ACUTE_RECOVERY_PIVOT: 'ACUTE_RECOVERY_PIVOT'
});

const HEAVY_COMPOUND_KEYWORDS = [
  'SQUAT', 'BENCH', 'DEADLIFT', 'ROW', 'PRESS', 'PULLDOWN', 'DIP', 'LUNGE'
];

function isCompoundExercise(exercise) {
  if (!exercise) return false;
  const code = String(exercise.exercise_code || exercise.code || exercise.name || '').toUpperCase();
  return HEAVY_COMPOUND_KEYWORDS.some(kw => code.includes(kw));
}

/**
 * Calculates a composite training readiness score (0 - 100) from subjective biofeedback.
 * 
 * @param {Object} biofeedback
 * @param {number} biofeedback.soreness - 1 (fresh) to 10 (extreme DOMS)
 * @param {string|number} biofeedback.sleep_quality - 'POOR'|'AVERAGE'|'GOOD' or score 1-10
 * @param {number} biofeedback.sleep_hours - Sleep duration in hours (e.g. 7.5)
 * @param {number} biofeedback.stress_level - 1 (calm) to 10 (extreme stress)
 * @param {number} biofeedback.energy_level - 1 (exhausted) to 10 (fully energized)
 * @returns {Object} Readiness result with score, tier, and Arabic clinical directives
 */
export function calculateTrainingReadiness({
  soreness = 3,
  sleep_quality = 'GOOD',
  sleep_hours = 7.5,
  stress_level = 3,
  energy_level = 7
} = {}) {
  // Normalize sleep score (0-100)
  let sleepScore = 75;
  if (typeof sleep_quality === 'number') {
    sleepScore = Math.min(100, Math.max(0, sleep_quality * 10));
  } else {
    const sq = String(sleep_quality || 'GOOD').toUpperCase();
    if (sq === 'POOR') sleepScore = 35;
    else if (sq === 'AVERAGE') sleepScore = 65;
    else sleepScore = 90;
  }
  // Hours modifier
  if (sleep_hours < 5.5) sleepScore = Math.max(20, sleepScore - 30);
  else if (sleep_hours < 6.5) sleepScore = Math.max(30, sleepScore - 15);
  else if (sleep_hours >= 8.0) sleepScore = Math.min(100, sleepScore + 10);

  // Normalize energy (1-10 -> 0-100)
  const energyScore = Math.min(100, Math.max(0, Number(energy_level || 7) * 10));

  // Normalize soreness (1 fresh = 100, 10 extreme soreness = 10)
  const rawSoreness = Math.min(10, Math.max(1, Number(soreness || 3)));
  const sorenessScore = Math.round((11 - rawSoreness) * 10);

  // Normalize stress (1 calm = 100, 10 high stress = 10)
  const rawStress = Math.min(10, Math.max(1, Number(stress_level || 3)));
  const stressScore = Math.round((11 - rawStress) * 10);

  // Weighted composite: Sleep 35%, Energy 25%, Soreness 20%, Stress 20%
  const readinessScore = Math.round(
    (sleepScore * 0.35) +
    (energyScore * 0.25) +
    (sorenessScore * 0.20) +
    (stressScore * 0.20)
  );

  let tier = READINESS_TIERS.OPTIMAL;
  let tierAr = 'جاهزية استشفائية ممتازة (أداء كامل)';
  let clinicalActionAr = 'الجهاز العصبي والأنسجة العضلية في حالة ممتازة؛ نفذ الجلسة التدريبية بكامل الحجم والشدة ومعدلات RIR المقررة.';

  if (readinessScore < 30) {
    tier = READINESS_TIERS.ACUTE_RECOVERY_PIVOT;
    tierAr = 'إجهاد عصبي وبدني حاد (استشفاء نشط)';
    clinicalActionAr = 'مؤشرات الإجهاد العصبي والبدني مرتفعة جداً؛ تم تحويل الحصة إلى جلسة استشفاء نشط خفيفة (إطالات، حركة مفاصل، تنفس) لحماية الأوتار والجهاز المناعي.';
  } else if (readinessScore < 50) {
    tier = READINESS_TIERS.HIGH_FATIGUE_TRIM;
    tierAr = 'إرهاق تراكمي ملحوظ (تقليص الحجم)';
    clinicalActionAr = 'تم تقليص حجم التدريب بمقدار مجموعة لكل تمرين ورفع هامش الأمان (RIR +1) وتوسيع فترات الراحة +30 ثانية لتجنب الإصابة وتسهيل التعافي.';
  } else if (readinessScore < 75) {
    tier = READINESS_TIERS.MODERATE_FATIGUE;
    tierAr = 'إرهاق خفيف إلى متوسط (تعديل الشدة)';
    clinicalActionAr = 'الحجم التدريبي مكتمل بالكامل، مع رفع تكرارات الاحتياط بمقدار تكرار إضافي (RIR +1) لضمان جودة الأداء دون الوصول للفشل الميكانيكي المرهق.';
  }

  return Object.freeze({
    readiness_score: readinessScore,
    tier,
    tier_ar: tierAr,
    clinical_action_ar: clinicalActionAr,
    metrics: Object.freeze({
      sleep_score: sleepScore,
      energy_score: energyScore,
      soreness_score: sorenessScore,
      stress_score: stressScore
    })
  });
}

/**
 * Autoregulates an individual workout session based on pre-workout readiness.
 * Modifies RIR, sets, or rest dynamically without altering prescribed exercises.
 */
export function autoregulateWorkoutSession({
  session,
  readiness_score = 80,
  force_tier = null
} = {}) {
  if (!session || !Array.isArray(session.exercises)) {
    return session;
  }

  let tier = force_tier;
  if (!tier) {
    if (readiness_score >= 75) tier = READINESS_TIERS.OPTIMAL;
    else if (readiness_score >= 50) tier = READINESS_TIERS.MODERATE_FATIGUE;
    else if (readiness_score >= 30) tier = READINESS_TIERS.HIGH_FATIGUE_TRIM;
    else tier = READINESS_TIERS.ACUTE_RECOVERY_PIVOT;
  }

  if (tier === READINESS_TIERS.OPTIMAL) {
    return Object.freeze({
      ...session,
      autoregulation_status: READINESS_TIERS.OPTIMAL,
      autoregulation_badge_ar: 'جاهزية كاملة 100%',
      autoregulation_directive_ar: 'نفّذ تمرينك كما هو مقرر بالضبط دون أي تعديل.'
    });
  }

  if (tier === READINESS_TIERS.ACUTE_RECOVERY_PIVOT) {
    // Transform into light mobility & restoration session
    const mobilityExercises = [
      {
        exercise_code: 'ACTIVE_MOBILITY_FLOW',
        name: 'حركة المفاصل والعمود الفقري الانسيابية (Mobility Flow)',
        name_ar: 'حركة المفاصل والعمود الفقري الانسيابية (Mobility Flow)',
        name_en: 'Spine & Joint Mobility Flow',
        target_sets: 2,
        sets: 2,
        target_reps: '10-12',
        reps: '10-12',
        target_rir: 4,
        rir: 4,
        rest_seconds: 60,
        rest: 60,
        tempo: '3-1-1-0',
        prescription: {
          sets: 2,
          target_min: 10,
          target_max: 12,
          rest_seconds: 60,
          unit: 'REPS',
          target_rir: 4,
          tempo: '3-1-1-0'
        }
      },
      {
        exercise_code: 'PARASYMPATHETIC_DIAPHRAGM_BREATHING',
        name: 'التنفس الحجابي الهادئ وتهدئة الجهاز العصبي',
        name_ar: 'التنفس الحجابي الهادئ وتهدئة الجهاز العصبي',
        name_en: 'Diaphragmatic Breathing Reset',
        target_sets: 3,
        sets: 3,
        target_reps: '8-10',
        reps: '8-10',
        target_rir: 5,
        rir: 5,
        rest_seconds: 45,
        rest: 45,
        tempo: '4-2-4-2',
        prescription: {
          sets: 3,
          target_min: 8,
          target_max: 10,
          rest_seconds: 45,
          unit: 'REPS',
          target_rir: 5,
          tempo: '4-2-4-2'
        }
      }
    ];

    return Object.freeze({
      ...session,
      title_ar: 'جلسة استشفاء عصبي وموبيليتي نشط (Active Recovery Reset)',
      autoregulation_status: READINESS_TIERS.ACUTE_RECOVERY_PIVOT,
      autoregulation_badge_ar: 'استشفاء نشط',
      autoregulation_directive_ar: 'تم تحويل التمرين لحركات استشفائية نشطة وتنفس لتهدئة الجهاز العصبي وتحفيز التعافي الفسيولوجي.',
      exercises: Object.freeze(mobilityExercises)
    });
  }

  // Handle MODERATE_FATIGUE and HIGH_FATIGUE_TRIM
  const isHighFatigue = tier === READINESS_TIERS.HIGH_FATIGUE_TRIM;
  const extraRir = isHighFatigue ? 2 : 1;
  const restPadding = isHighFatigue ? 30 : 0;

  const adjustedExercises = session.exercises.map(ex => {
    const originalSets = Number(ex.target_sets || ex.sets || 3);
    const adjustedSets = isHighFatigue ? Math.max(2, originalSets - 1) : originalSets;
    const baseRir = Number(ex.target_rir !== undefined ? ex.target_rir : (ex.rir !== undefined ? ex.rir : 2));
    const adjustedRir = Math.min(4, baseRir + extraRir);
    const originalRest = Number(ex.rest_seconds || ex.rest || 90);
    const adjustedRest = originalRest + restPadding;

    return Object.freeze({
      ...ex,
      target_sets: adjustedSets,
      sets: adjustedSets,
      target_rir: adjustedRir,
      rir: adjustedRir,
      rest_seconds: adjustedRest,
      rest: adjustedRest,
      prescription: Object.freeze({
        ...(ex.prescription || {}),
        sets: adjustedSets,
        target_rir: adjustedRir,
        rest_seconds: adjustedRest
      }),
      autoregulation_note_ar: isHighFatigue
        ? `تقليص الحجم: تم خفض مجموعة وتوسيع الراحة لـ ${adjustedRest}ث ورفع RIR لـ ${adjustedRir} لضمان الأمان.`
        : `تعديل الشدة: تم رفع تكرارات الاحتياط إلى RIR ${adjustedRir} لمنع استنزاف الجهاز العصبي.`
    });
  });

  return Object.freeze({
    ...session,
    autoregulation_status: tier,
    autoregulation_badge_ar: isHighFatigue ? 'تقليص الحجم التدريبي' : 'تعديل الشدة الآمنة',
    autoregulation_directive_ar: isHighFatigue
      ? 'تم تقليص عدد المجموعات وتوسيع فترات الراحة لحماية المفاصل والجهاز العصبي في ظل الإجهاد الحالي.'
      : 'تم الحفاظ على كافة التمارين مع زيادة تكرارات الاحتياط (RIR) لضمان جودة الأداء دون إنهاك عضلي زائد.',
    exercises: Object.freeze(adjustedExercises)
  });
}

/**
 * Reschedules a missed workout dynamically across the current microcycle.
 * 
 * @param {Object} params
 * @param {Array} params.sessions - The weekly sessions array
 * @param {number} params.missed_day_index - 0-based index of the missed session
 * @param {number} params.remaining_days_in_week - Remaining days until microcycle ends
 * @param {string} params.trainee_fatigue - 'LOW'|'NORMAL'|'HIGH'
 * @returns {Object} Rescheduled sessions array, strategy used, and Arabic clinical directives
 */
export function rescheduleMissedWorkout({
  sessions = [],
  missed_day_index = 0,
  remaining_days_in_week = 4,
  trainee_fatigue = 'NORMAL'
} = {}) {
  if (!Array.isArray(sessions) || sessions.length === 0) {
    return {
      strategy: RESCHEDULING_STRATEGIES.STRATEGIC_VOLUME_ABSORPTION,
      rescheduled_sessions: [],
      directive_ar: 'لا توجد حصص مجدولة لإعادة الترتيب.'
    };
  }

  const safeMissedIdx = Math.max(0, Math.min(sessions.length - 1, missed_day_index));
  const missedSession = sessions[safeMissedIdx];

  // If already a rest day, no rescheduling needed
  if (missedSession && missedSession.is_rest_day) {
    return {
      strategy: RESCHEDULING_STRATEGIES.STRATEGIC_VOLUME_ABSORPTION,
      rescheduled_sessions: sessions,
      directive_ar: 'اليوم الفائت كان يوم راحة مجدولاً بالفعل؛ استمر في جدولك التدريبي دون أي تغيير.'
    };
  }

  // If trainee is in high fatigue, cleanly absorb the day as a recovery reset
  if (trainee_fatigue === 'HIGH') {
    const updatedSessions = sessions.map((s, idx) => {
      if (idx === safeMissedIdx) {
        return Object.freeze({
          ...s,
          is_rest_day: true,
          status: 'ABSORBED_REST',
          title_ar: 'يوم راحة واستشفاء معتمد (امتصاص الإجهاد)',
          directive_ar: 'تم احتساب اليوم كيوم راحة لتفريغ الإجهاد العصبي والبدني دون أي مساس بمكاسبك.'
        });
      }
      return s;
    });

    return {
      strategy: RESCHEDULING_STRATEGIES.STRATEGIC_VOLUME_ABSORPTION,
      rescheduled_sessions: Object.freeze(updatedSessions),
      directive_ar: 'تم تحويل اليوم الفائت ليوم راحة معتمد لتفريغ التعب العصبي؛ استمر في باقي أيام الأسبوع بثقة تامة.'
    };
  }

  // Check if there is an available rest day in the remaining schedule
  const restDayIndex = sessions.findIndex((s, idx) => idx > safeMissedIdx && (s.is_rest_day || s.is_off_day));

  if (restDayIndex !== -1 && remaining_days_in_week >= (sessions.length - safeMissedIdx)) {
    // Strategy A: ROLL_FORWARD -> Move missed session to the rest day
    const updatedSessions = sessions.map((s, idx) => {
      if (idx === safeMissedIdx) {
        return Object.freeze({
          ...s,
          is_rest_day: true,
          status: 'OFF_DAY_SWAPPED',
          title_ar: 'يوم راحة بديل (ترحيل التدريب)',
          directive_ar: 'تم تحويل هذا اليوم إلى يوم راحة، وترحيل الحصة التدريبية ليوم الراحة التالي.'
        });
      }
      if (idx === restDayIndex) {
        return Object.freeze({
          ...missedSession,
          day_number: s.day_number || (idx + 1),
          day_ar: s.day_ar || `اليوم ${idx + 1}`,
          is_rest_day: false,
          status: 'ROLLED_FORWARD',
          rescheduled_from_day: safeMissedIdx + 1,
          directive_ar: `حصة معوضة مُرحّلة من اليوم ${safeMissedIdx + 1} بنجاح دون أي فقدان للحجم التدريبي.`
        });
      }
      return s;
    });

    return {
      strategy: RESCHEDULING_STRATEGIES.ROLL_FORWARD,
      rescheduled_sessions: Object.freeze(updatedSessions),
      moved_to_day_index: restDayIndex,
      directive_ar: `تم ترحيل تدريب اليوم إلى يوم الراحة التالي (اليوم ${restDayIndex + 1}) بمرونة تامة دون الإخلال بالحجم الأسبوعي.`
    };
  }

  // Strategy B: VOLUME_TRIAGE_MERGE -> No free rest day. Merge key Tier-1 compounds into the next workout
  const nextWorkoutIndex = sessions.findIndex((s, idx) => idx > safeMissedIdx && !s.is_rest_day && !s.is_off_day);

  if (nextWorkoutIndex !== -1) {
    const nextSession = sessions[nextWorkoutIndex];
    const missedExercises = missedSession.exercises || [];

    // Extract up to 2 primary compound movements from the missed workout
    const primaryCompounds = missedExercises
      .filter(ex => isCompoundExercise(ex))
      .slice(0, 2)
      .map(ex => ({
        ...ex,
        target_sets: 2, // Consolidate to 2 high-quality sets
        sets: 2,
        prescription: {
          ...(ex.prescription || {}),
          sets: 2
        },
        triage_note_ar: 'تمرين أساسي مدمج من الحصة الفائتة (حجم نوعي مُركّز).'
      }));

    const combinedExercises = [
      ...nextSession.exercises,
      ...primaryCompounds
    ];

    const updatedSessions = sessions.map((s, idx) => {
      if (idx === safeMissedIdx) {
        return Object.freeze({
          ...s,
          is_rest_day: true,
          status: 'TRIAGED_MERGED',
          title_ar: 'يوم ملغي ومدمج الحجم (Volume Triage)',
          directive_ar: 'تم دمج التمارين المركبة الأساسية لهذا اليوم في الحصة القادمة واختصار عزل العضلات لمنع الإجهاد.'
        });
      }
      if (idx === nextWorkoutIndex) {
        return Object.freeze({
          ...nextSession,
          status: 'HYBRID_TRIAGE_MERGED',
          exercises: Object.freeze(combinedExercises),
          triage_merged_from_day: safeMissedIdx + 1,
          directive_ar: `حصة هجينة مدمجة: أضفنا أهم تمرينين مركبين من اليوم الفائت (${primaryCompounds.length} تمارين، بمجموعتين لكل تمرين) لضمان 85% من المحفز البنائي في وقت قياسي.`
        });
      }
      return s;
    });

    return {
      strategy: RESCHEDULING_STRATEGIES.VOLUME_TRIAGE_MERGE,
      rescheduled_sessions: Object.freeze(updatedSessions),
      merged_into_day_index: nextWorkoutIndex,
      merged_exercises_count: primaryCompounds.length,
      directive_ar: 'تم دمج الحركات المركبة الرئيسية للحصة الفائتة في تمرينك القادم بذكاء واختصار تمارين العزل للحفاظ على البناء العضلي دون إطالة وقت التمرين.'
    };
  }

  // Fallback: STRATEGIC_VOLUME_ABSORPTION
  return {
    strategy: RESCHEDULING_STRATEGIES.STRATEGIC_VOLUME_ABSORPTION,
    rescheduled_sessions: sessions,
    directive_ar: 'استمر في خطتك الحالية؛ تفويت حصة واحدة عارضة لا يؤثر على مسار التطور العضلي التراكمي.'
  };
}

/**
 * Tracks and evaluates cumulative nervous/musculoskeletal fatigue across weeks.
 */
export function evaluateCumulativeFatigue({
  consecutive_overload_weeks = 0,
  average_weekly_readiness = 75,
  chronic_soreness_flag = false
} = {}) {
  const isHighOverloadWeeks = consecutive_overload_weeks >= 4;
  const isChronicallyDepleted = average_weekly_readiness < 50;
  const isDeloadNeeded = isHighOverloadWeeks || isChronicallyDepleted || (consecutive_overload_weeks >= 3 && chronic_soreness_flag);

  let recommendationAr = 'مستوى التعافي التراكمي متوازن؛ الاستمرار في مسار التدرج في الأحمال المخطط له.';

  if (isDeloadNeeded) {
    if (isHighOverloadWeeks) {
      recommendationAr = `تم إكمال ${consecutive_overload_weeks} أسابيع من التحميل العضلي التراكمي المتصاعد؛ يُوصى ببدء أسبوع التفريغ (Deload) لتجديد النواقل العصبية والأوتار.`;
    } else if (isChronicallyDepleted) {
      recommendationAr = 'معدل الجاهزية والاستشفاء الأسبوعي أقل من 50%؛ تفعيل أسبوع تفريغ أحمال تلقائي (Deload) لتفادي متلازمة الإفراط التدريبي (Overtraining).';
    } else {
      recommendationAr = 'رصد استمرار آلام العضلات والمفاصل لـ 3 أسابيع متتالية؛ خفض الحجم التدريبي بنسبة 40% وتطبيق أسبوع استشفاء مفاصل.';
    }
  }

  return Object.freeze({
    deload_recommended: isDeloadNeeded,
    consecutive_overload_weeks,
    average_weekly_readiness,
    recommendation_ar: recommendationAr
  });
}

/**
 * Frontend Training-Nutrition Coupling & Biomechanical Utilities
 * 
 * Provides instantaneous UI feedback and calculations for:
 * 1. Session Glycolytic Demand & Intensity Score.
 * 2. Muscle Group Volume Landmarks Tracking (MEV / MAV / MRV).
 * 3. Mesocycle Adaptive Calibration for added/edited exercises.
 * 4. Peri-Workout Meal Role Identification.
 */

import { getExerciseDisplayNames } from './exerciseTranslator';

export const HEAVY_PRIMARY_COMPOUNDS = new Set([
  'BARBELL_BACK_SQUAT',
  'BARBELL_FRONT_SQUAT',
  'BARBELL_BENCH_PRESS',
  'BARBELL_BENT_OVER_ROW',
  'BARBELL_OVERHEAD_PRESS',
  'BARBELL_DEADLIFT',
  'BARBELL_ROMANIAN_DEADLIFT',
  'DUMBBELL_ROMANIAN_DEADLIFT',
  'GOBLET_SQUAT',
  'LEG_PRESS_MACHINE',
  'DUMBBELL_INCLINE_BENCH_PRESS',
  'BARBELL_HIP_THRUST',
  'HEX_BAR_DEADLIFT'
]);

export const SECONDARY_COMPOUNDS = new Set([
  'LAT_PULLDOWN',
  'SEATED_CABLE_ROW',
  'CHEST_SUPPORTED_ROW',
  'ONE_ARM_DUMBBELL_ROW',
  'STANDING_DUMBBELL_SHOULDER_PRESS',
  'DUMBBELL_BENCH_PRESS',
  'BULGARIAN_SPLIT_SQUAT',
  'DUMBBELL_REVERSE_LUNGE',
  'HACK_SQUAT_MACHINE',
  'DUMBBELL_LUNGE',
  'PULL_UP',
  'CHIN_UP',
  'DIP'
]);

export const ISOLATION_MOVEMENTS = new Set([
  'INCLINE_DUMBBELL_CURL',
  'OVERHEAD_CABLE_TRICEPS_EXTENSION',
  'LYING_LEG_CURL_MACHINE',
  'SEATED_LEG_CURL',
  'LEG_EXTENSION_MACHINE',
  'CABLE_FLY',
  'PECK_DECK_FLIES',
  'DUMBBELL_LATERAL_RAISE',
  'LATERAL_RAISE',
  'CABLE_LATERAL_RAISE',
  'FACE_PULL',
  'REAR_DELT_FLY',
  'BICEPS_CURL',
  'TRICEPS_PUSHDOWN',
  'STANDING_CALF_RAISE',
  'SEATED_CALF_RAISE',
  'DEAD_BUG',
  'HANGING_LEG_RAISE',
  'PLANK'
]);

export const MUSCLE_VOLUME_LANDMARKS = Object.freeze({
  CHEST: { name_ar: 'الصدر', mev: 8, mav_min: 12, mav_max: 18, mrv: 22 },
  BACK: { name_ar: 'الظهر والمجنص', mev: 10, mav_min: 14, mav_max: 22, mrv: 25 },
  QUADS: { name_ar: 'الأرجل الأمامية', mev: 8, mav_min: 12, mav_max: 18, mrv: 20 },
  HAMSTRINGS: { name_ar: 'الأرجل الخلفية', mev: 6, mav_min: 10, mav_max: 16, mrv: 18 },
  SHOULDERS: { name_ar: 'الأكتاف', mev: 8, mav_min: 14, mav_max: 20, mrv: 24 },
  BICEPS: { name_ar: 'البايسبس', mev: 6, mav_min: 10, mav_max: 16, mrv: 20 },
  TRICEPS: { name_ar: 'الترايسبس', mev: 6, mav_min: 10, mav_max: 16, mrv: 18 },
  GLUTES: { name_ar: 'المؤخرة والوركين', mev: 4, mav_min: 8, mav_max: 14, mrv: 18 },
  CALVES: { name_ar: 'السمانة', mev: 6, mav_min: 10, mav_max: 16, mrv: 20 },
  CORE: { name_ar: 'البطن والجذع', mev: 4, mav_min: 8, mav_max: 14, mrv: 18 },
});

export function resolveMuscleGroupKey(exercise) {
  if (!exercise) return 'OTHER';
  const rawGroup = String(exercise.muscle_group || exercise.primary_muscle || exercise.muscle || '').toUpperCase();
  const rawCode = String(exercise.code || exercise.exercise_code || exercise.id || '').toUpperCase();
  const rawName = String(exercise.name || exercise.name_en || exercise.name_ar || '').toUpperCase();

  if (rawGroup.includes('CHEST') || rawCode.includes('BENCH') || rawCode.includes('FLY') || rawName.includes('CHEST') || rawName.includes('صدر')) return 'CHEST';
  if (rawGroup.includes('BACK') || rawGroup.includes('LATS') || rawCode.includes('ROW') || rawCode.includes('PULLDOWN') || rawName.includes('ظهر')) return 'BACK';
  if (rawGroup.includes('QUAD') || rawCode.includes('SQUAT') || rawCode.includes('LEG_EXT') || rawName.includes('فخذ أمامي')) return 'QUADS';
  if (rawGroup.includes('HAMSTRING') || rawCode.includes('LEG_CURL') || rawCode.includes('ROMANIAN') || rawCode.includes('RDL') || rawName.includes('خلفي')) return 'HAMSTRINGS';
  if (rawGroup.includes('SHOULDER') || rawGroup.includes('DELT') || rawCode.includes('LATERAL_RAISE') || rawCode.includes('OVERHEAD_PRESS') || rawName.includes('كتف')) return 'SHOULDERS';
  if (rawGroup.includes('BICEPS') || rawCode.includes('CURL') || rawName.includes('باي')) return 'BICEPS';
  if (rawGroup.includes('TRICEPS') || rawCode.includes('PUSHDOWN') || rawCode.includes('TRICEPS') || rawName.includes('تراي')) return 'TRICEPS';
  if (rawGroup.includes('GLUTE') || rawCode.includes('HIP_THRUST') || rawName.includes('مؤخرة')) return 'GLUTES';
  if (rawGroup.includes('CALF') || rawGroup.includes('CALVES') || rawCode.includes('CALF') || rawName.includes('سمانة')) return 'CALVES';
  if (rawGroup.includes('CORE') || rawGroup.includes('ABS') || rawCode.includes('PLANK') || rawCode.includes('CRUNCH') || rawCode.includes('DEAD_BUG') || rawName.includes('بطن')) return 'CORE';

  return 'OTHER';
}

/**
 * Evaluates session volume load, heavy compound count, and metabolic demand.
 */
export function calculateSessionDemand(exercises = []) {
  if (!Array.isArray(exercises) || exercises.length === 0) {
    return {
      total_exercises: 0,
      total_sets: 0,
      glycolytic_score: 0,
      demand_level: 'REST_DAY',
      demand_label_ar: 'يوم راحة أو استشفاء نشط',
      peri_workout_carb_ratio: 0.40,
      is_heavy_session: false,
      heavy_compounds_count: 0,
      estimated_duration_min: 0,
    };
  }

  let totalSets = 0;
  let glycolyticScore = 0;
  let heavyCompoundsCount = 0;

  for (const ex of exercises) {
    const sets = Number(ex.sets || 3);
    totalSets += sets;

    const code = String(ex.code || ex.id || '').toUpperCase();
    let intensityFactor = 1.0;

    if (HEAVY_PRIMARY_COMPOUNDS.has(code)) {
      intensityFactor = 1.45;
      heavyCompoundsCount += 1;
    } else if (SECONDARY_COMPOUNDS.has(code)) {
      intensityFactor = 1.20;
    } else if (ISOLATION_MOVEMENTS.has(code)) {
      intensityFactor = 0.90;
    } else {
      intensityFactor = 1.05;
    }

    glycolyticScore += sets * intensityFactor;
  }

  glycolyticScore = Math.round(glycolyticScore * 10) / 10;
  const isHeavySession = heavyCompoundsCount >= 2 || glycolyticScore >= 18;

  let demandLevel = 'MODERATE';
  let demandLabelAr = 'جلسة تدريبية متوسطة الكثافة';
  let periWorkoutCarbRatio = 0.55;

  if (glycolyticScore >= 20 || (heavyCompoundsCount >= 2 && totalSets >= 16)) {
    demandLevel = 'HIGH_GLYCOLYTIC';
    demandLabelAr = 'جلسة تدريبية عالية الكثافة واستنزاف الجليكوجين';
    periWorkoutCarbRatio = 0.65;
  } else if (glycolyticScore < 12 || totalSets <= 10) {
    demandLevel = 'LOW_GLYCOLYTIC';
    demandLabelAr = 'جلسة تدريبية خفيفة تركز على العزل والاستشفاء';
    periWorkoutCarbRatio = 0.45;
  }

  const estimatedDurationMin = Math.round(exercises.reduce((acc, ex) => {
    const sets = Number(ex.sets || 3);
    const code = String(ex.code || '').toUpperCase();
    const isHeavy = HEAVY_PRIMARY_COMPOUNDS.has(code);
    return acc + (sets * (isHeavy ? 2.5 : 1.8));
  }, 8));

  return {
    total_exercises: exercises.length,
    total_sets: totalSets,
    glycolytic_score: glycolyticScore,
    heavy_compounds_count: heavyCompoundsCount,
    is_heavy_session: isHeavySession,
    demand_level: demandLevel,
    demand_label_ar: demandLabelAr,
    peri_workout_carb_ratio: periWorkoutCarbRatio,
    estimated_duration_min: estimatedDurationMin,
  };
}

export function identifyPeriWorkoutMeals(meals = []) {
  if (!Array.isArray(meals) || meals.length === 0) {
    return { preIdx: -1, postIdx: -1, hasTaggedRoles: false };
  }

  let preIdx = -1;
  let postIdx = -1;

  meals.forEach((m, idx) => {
    const name = String(m.name || m.name_ar || '').toLowerCase();
    const role = String(m.role || '').toUpperCase();

    if (role === 'PRE_WORKOUT' || name.includes('قبل التمرين')) {
      preIdx = idx;
    } else if (role === 'POST_WORKOUT' || name.includes('بعد التمرين')) {
      postIdx = idx;
    }
  });

  if (preIdx !== -1 && postIdx !== -1) {
    return { preIdx, postIdx, hasTaggedRoles: true };
  }

  const count = meals.length;
  if (count === 2) {
    preIdx = 0;
    postIdx = 1;
  } else if (count === 3) {
    preIdx = 1;
    postIdx = 2;
  } else if (count === 4) {
    preIdx = 1;
    postIdx = 2;
  } else if (count >= 5) {
    preIdx = 2;
    postIdx = 3;
  }

  return { preIdx, postIdx, hasTaggedRoles: false };
}

export function auditWeeklyMuscleVolume(sessions = []) {
  const volumeMap = {};

  Object.keys(MUSCLE_VOLUME_LANDMARKS).forEach(k => {
    volumeMap[k] = 0;
  });

  for (const session of sessions) {
    for (const ex of (session.exercises || [])) {
      const key = resolveMuscleGroupKey(ex);
      const sets = Number(ex.sets || 3);
      if (volumeMap[key] !== undefined) {
        volumeMap[key] += sets;
      }
    }
  }

  const analysis = {};
  const warnings = [];

  for (const [key, sets] of Object.entries(volumeMap)) {
    const landmark = MUSCLE_VOLUME_LANDMARKS[key];
    if (!landmark) continue;

    let status = 'OPTIMAL_MAV';
    let statusLabelAr = 'حجم تدريبي مثالي (MAV)';

    if (sets < landmark.mev && sets > 0) {
      status = 'BELOW_MEV';
      statusLabelAr = `أقل من الحد الأدنى (${sets}/${landmark.mev} جولة)`;
      warnings.push(`عضلة ${landmark.name_ar}: الحجم الحالي (${sets} جولات) دون الحد الأدنى الفعال (MEV: ${landmark.mev} جولة).`);
    } else if (sets > landmark.mrv) {
      status = 'EXCEEDS_MRV';
      statusLabelAr = `تجاوز الحد الأقصى للاستشفاء (${sets}/${landmark.mrv} جولة)`;
      warnings.push(`عضلة ${landmark.name_ar}: الحجم الحالي (${sets} جولات) يتجاوز الحد الأقصى للاستشفاء (MRV: ${landmark.mrv} جولة).`);
    } else if (sets >= landmark.mav_min && sets <= landmark.mav_max) {
      status = 'OPTIMAL_MAV';
      statusLabelAr = `النطاق البنائي الفعال الأقصى (${sets} جولة)`;
    } else if (sets > 0) {
      status = 'ACCEPTABLE_PROGRESSION';
      statusLabelAr = `نطاق فعال مقبول (${sets} جولة)`;
    }

    analysis[key] = {
      muscle_name_ar: landmark.name_ar,
      weekly_sets: sets,
      mev: landmark.mev,
      mav_range: `${landmark.mav_min}-${landmark.mav_max}`,
      mrv: landmark.mrv,
      status,
      status_label_ar: statusLabelAr,
    };
  }

  return {
    analysis,
    warnings,
    has_mrv_exceeded: warnings.some(w => w.includes('يتجاوز الحد الأقصى')),
    has_below_mev: warnings.some(w => w.includes('دون الحد الأدنى')),
  };
}

export function calibrateAddedExercise(rawExercise, weekNumber = 1, clientData = {}) {
  const code = String(rawExercise.code || rawExercise.id || `EX_${Date.now()}`).toUpperCase();
  const names = getExerciseDisplayNames(rawExercise);

  const clientConditions = [
    ...(Array.isArray(clientData.injuries) ? clientData.injuries : []),
    ...(Array.isArray(clientData.allergies) ? clientData.allergies : []),
    ...(Array.isArray(clientData.medical_conditions) ? clientData.medical_conditions : []),
  ];

  const hasHypertension = Boolean(
    clientData.hasHypertension ||
    clientConditions.some(c => {
      const s = typeof c === 'string' ? c : (c?.conditionCode || c?.name || c?.area || '');
      return /hypertension|ضغط|ارتفاع.*الضغط/i.test(s);
    })
  );

  const isHeavy = HEAVY_PRIMARY_COMPOUNDS.has(code);
  const isSecondary = SECONDARY_COMPOUNDS.has(code);

  const weekCalibration = {
    1: { target_rir: 3, rest_compound: 120, rest_iso: 60 },
    2: { target_rir: 2, rest_compound: 120, rest_iso: 60 },
    3: { target_rir: 1, rest_compound: 120, rest_iso: 75 },
    4: { target_rir: 0, rest_compound: 150, rest_iso: 75 },
    5: { target_rir: 4, rest_compound: 90, rest_iso: 60 },
  };

  const calib = weekCalibration[weekNumber] || weekCalibration[1];

  let targetSets = isHeavy
    ? (weekNumber >= 3 && weekNumber <= 4 ? 4 : weekNumber === 5 ? 2 : 3)
    : (weekNumber === 5 ? 2 : 3);

  let targetReps = isHeavy ? '6 - 8' : isSecondary ? '8 - 10' : '12 - 15';

  let targetRir = calib.target_rir;
  if (hasHypertension && targetRir < 2) {
    targetRir = 2; // ACSM/AHA RIR >= 2
  }

  let restSec = isHeavy ? calib.rest_compound : calib.rest_iso;

  let safetyNote = rawExercise.safety_tip_ar || rawExercise.safety_notes_ar || rawExercise.safetyNote || 'تطبيق التكنيك السليم مع ثبات المفاصل';
  if (hasHypertension) {
    safetyNote = `${safetyNote} — تنبيه: ممنوع حبس النفس (Valsalva) نهائياً مع الزفير عند الدفع والشهيق عند النزول.`;
  }

  return {
    id: `e_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    code: code,
    name: names.nameEn,
    name_ar: names.nameAr,
    name_en: names.nameEn,
    muscle_group: rawExercise.muscle_group || resolveMuscleGroupKey(rawExercise),
    muscle_ar: rawExercise.muscle_ar || rawExercise.target_muscle || '',
    equipment: rawExercise.equipment || 'MACHINE',
    alternatives: Array.isArray(rawExercise.alternatives) ? rawExercise.alternatives : [],
    sets: targetSets,
    reps: targetReps,
    rir: targetRir,
    restSec: restSec,
    profile: isHeavy ? 'HEAVY_COMPOUND' : isSecondary ? 'SECONDARY_COMPOUND' : 'MID_RANGE_ISOLATION',
    safetyNote: safetyNote,
    video_url: rawExercise.video_url || (rawExercise.video_id ? `https://www.youtube.com/watch?v=${rawExercise.video_id}` : ''),
    image_stretch: rawExercise.image_stretch || `/exercises/${code}/0.jpg`,
    image_contraction: rawExercise.image_contraction || `/exercises/${code}/1.jpg`,
  };
}

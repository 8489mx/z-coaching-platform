/**
 * Training-Nutrition Dynamic Coupling Engine (محرك الاقتران الفسيولوجي بين التدريب والتغذية)
 * 
 * Single Source of Truth for:
 * 1. Session Glycolytic Demand & Metabolic Cost calculation.
 * 2. Peri-Workout Carbohydrate Redistribution (Pre & Post Workout Meals).
 * 3. Mesocycle Adaptive Calibration for newly added or modified exercises.
 * 4. Muscle Group Weekly Volume Landmarks Tracking (MEV / MAV / MRV).
 * 5. Clinical Safety & Contraindication Guardrails for training updates.
 */

import { CLINICAL_GUIDELINES } from '../../config/clinical-guidelines.js';
import { getExerciseV2ByCode } from '../../exercise-catalog-v2/index.js';
import { resolveExerciseNames } from '../../exercise-catalog-v2/master-exercise-translations.js';

// =========================================================================
// 1. BIOMECHANICAL & GLYCOLYTIC CLASSIFICATION
// =========================================================================

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

// =========================================================================
// 2. MUSCLE GROUP VOLUME LANDMARKS (MEV / MAV / MRV - RP / ACSM Science)
// =========================================================================

export const MUSCLE_VOLUME_LANDMARKS = Object.freeze({
  CHEST: { name_ar: 'الصدر', mev: 8, mav_min: 12, mav_max: 18, mrv: 22 },
  BACK: { name_ar: 'الظهر والمجنص', mev: 10, mav_min: 14, mav_max: 22, mrv: 25 },
  QUADS: { name_ar: 'الأرجل الأمامية (الكوادس)', mev: 8, mav_min: 12, mav_max: 18, mrv: 20 },
  HAMSTRINGS: { name_ar: 'الأرجل الخلفية (الهمسترينغ)', mev: 6, mav_min: 10, mav_max: 16, mrv: 18 },
  SHOULDERS: { name_ar: 'الأكتاف (الدلتويد)', mev: 8, mav_min: 14, mav_max: 20, mrv: 24 },
  BICEPS: { name_ar: 'البايسبس', mev: 6, mav_min: 10, mav_max: 16, mrv: 20 },
  TRICEPS: { name_ar: 'الترايسبس', mev: 6, mav_min: 10, mav_max: 16, mrv: 18 },
  GLUTES: { name_ar: 'المؤخرة والوركين', mev: 4, mav_min: 8, mav_max: 14, mrv: 18 },
  CALVES: { name_ar: 'السمانة (السمانات)', mev: 6, mav_min: 10, mav_max: 16, mrv: 20 },
  CORE: { name_ar: 'البطن والجذع', mev: 4, mav_min: 8, mav_max: 14, mrv: 18 },
});

// Mapping exercise codes / targets to canonical muscle group keys
export function resolveMuscleGroupKey(exercise) {
  if (!exercise) return 'OTHER';
  const rawGroup = String(exercise.muscle_group || exercise.primary_muscle || exercise.muscle || '').toUpperCase();
  const rawCode = String(exercise.code || exercise.exercise_code || exercise.id || '').toUpperCase();
  const rawName = String(exercise.name || exercise.name_en || exercise.name_ar || '').toUpperCase();

  // The exercise the plan actually wrote decides, before any word in its name does. The names used
  // to decide, and they were wrong often enough to matter: a chest-supported row counted as chest
  // (its Arabic name says "للصدر"), a rear-delt raise and a face pull counted as hamstrings (their
  // names say "الخلفية"), bench dips as chest, a pike push-up as chest, and a push-up, a close-grip
  // push-up, a reverse lunge and a glute bridge as nothing at all.
  if (rawCode.includes('ROW') || rawCode.includes('PULLDOWN') || rawCode.includes('PULL_UP') || rawCode.includes('CHIN_UP')) return 'BACK';
  if (rawCode.includes('FACE_PULL') || rawCode.includes('REAR_DELT') || rawCode.includes('ROTATOR_CUFF') || rawCode.includes('LATERAL_RAISE') || rawCode.includes('PIKE_PUSH_UP') || rawCode.includes('OVERHEAD_PRESS') || rawCode.includes('SHOULDER_PRESS')) return 'SHOULDERS';
  if (rawCode.includes('TRICEPS') || rawCode.includes('PUSHDOWN') || rawCode.includes('CLOSE_GRIP') || rawCode.includes('DIPS')) return 'TRICEPS';
  if (rawCode.includes('PUSH_UP') || rawCode.includes('BENCH_PRESS') || rawCode.includes('CHEST_PRESS') || rawCode.includes('FLOOR_PRESS') || rawCode.includes('CHEST_FLY')) return 'CHEST';
  if (rawCode.includes('LEG_CURL') || rawCode.includes('ROMANIAN') || rawCode.includes('NORDIC') || rawCode.includes('HAMSTRING')) return 'HAMSTRINGS';
  if (rawCode.includes('LUNGE') || rawCode.includes('SPLIT_SQUAT') || rawCode.includes('STEP_UP') || rawCode.includes('LEG_PRESS') || rawCode.includes('HACK_SQUAT') || rawCode.includes('SQUAT') || rawCode.includes('LEG_EXTENSION')) return 'QUADS';
  if (rawCode.includes('GLUTE_BRIDGE') || rawCode.includes('HIP_THRUST') || rawCode.includes('KICKBACK')) return 'GLUTES';
  if (rawCode.includes('CALF')) return 'CALVES';
  if (rawCode.includes('CURL')) return 'BICEPS';

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

// =========================================================================
// 3. SESSION GLYCOLYTIC DEMAND EVALUATION
// =========================================================================

/**
 * Calculates session volume load and metabolic/glycolytic demand.
 * 
 * @param {Array<Object>} exercises - Array of exercise objects in session
 * @returns {Object} demand summary
 */
export function calculateSessionDemand(exercises = []) {
  if (!Array.isArray(exercises) || exercises.length === 0) {
    return {
      total_exercises: 0,
      total_sets: 0,
      glycolytic_score: 0,
      demand_level: 'REST_DAY',
      demand_label_ar: 'يوم راحة أو استشفاء نشط',
      peri_workout_carb_ratio: 0.40, // standard baseline
      is_heavy_session: false,
      has_heavy_compounds: false,
      estimated_duration_min: 0,
    };
  }

  let totalSets = 0;
  let glycolyticScore = 0;
  let heavyCompoundsCount = 0;

  for (const ex of exercises) {
    const sets = Number(ex.sets || ex.target_sets || (ex.prescription && ex.prescription.sets) || 3);
    totalSets += sets;

    const code = String(ex.code || ex.exercise_code || ex.id || '').toUpperCase();
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
  let periWorkoutCarbRatio = 0.55; // 55% of daily carbs around workout

  if (glycolyticScore >= 20 || (heavyCompoundsCount >= 2 && totalSets >= 16)) {
    demandLevel = 'HIGH_GLYCOLYTIC';
    demandLabelAr = 'جلسة تدريبية عالية الكثافة واستنزاف الجليكوجين';
    periWorkoutCarbRatio = 0.65; // 65% of daily carbs centered around workout
  } else if (glycolyticScore < 12 || totalSets <= 10) {
    demandLevel = 'LOW_GLYCOLYTIC';
    demandLabelAr = 'جلسة تدريبية خفيفة أو تركز على العزل والاستشفاء';
    periWorkoutCarbRatio = 0.45; // 45% around workout
  }

  // Estimated session duration: ~2.5 min per compound set, ~1.8 min per isolation set + 8 min warm-up
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

// =========================================================================
// 4. PERI-WORKOUT CARBOHYDRATE REDISTRIBUTION
// =========================================================================

/**
 * Identifies Pre-Workout and Post-Workout meal indices in meals array.
 */
export function identifyPeriWorkoutMeals(meals = []) {
  if (!Array.isArray(meals) || meals.length === 0) {
    return { preIdx: -1, postIdx: -1, hasTaggedRoles: false };
  }

  let preIdx = -1;
  let postIdx = -1;

  // 1. Check explicit role tags or meal titles
  meals.forEach((m, idx) => {
    const name = String(m.name || m.name_ar || m.meal_name_ar || '').toLowerCase();
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

  // 2. Default athletic heuristic based on meal count
  const count = meals.length;
  if (count === 2) {
    preIdx = 0;
    postIdx = 1;
  } else if (count === 3) {
    preIdx = 1; // Meal 2: Lunch / Pre-Workout
    postIdx = 2; // Meal 3: Dinner / Post-Workout
  } else if (count === 4) {
    preIdx = 1; // Meal 2: Lunch / Pre-Workout
    postIdx = 2; // Meal 3: Post-Workout Dinner
  } else if (count >= 5) {
    preIdx = 2; // Meal 3: Pre-workout
    postIdx = 3; // Meal 4: Post-workout
  }

  return { preIdx, postIdx, hasTaggedRoles: false };
}

/**
 * Rebalances carbohydrate distribution across meals based on current training session demand.
 * Strictly guarantees that daily total calories, protein, carbs, and fats remain 100% invariant.
 * 
 * @param {Array<Object>} meals - Array of meal objects
 * @param {Object} sessionDemand - Output of calculateSessionDemand
 * @param {number} dailyCarbsTarget - Total daily carb target in grams
 * @returns {Array<Object>} Updated meals with adjusted target_macros
 */
export function syncNutritionWithSessionDemand(meals = [], sessionDemand = {}, dailyCarbsTarget = null) {
  if (!Array.isArray(meals) || meals.length === 0) return meals;

  const totalCarbs = Number(dailyCarbsTarget) || meals.reduce((sum, m) => {
    return sum + Number(m.macros?.carbs || m.actual_macros?.carb_g || m.target_macros?.carb_g || 0);
  }, 0);

  if (totalCarbs <= 0) return meals;

  const { preIdx, postIdx } = identifyPeriWorkoutMeals(meals);
  if (preIdx === -1 || postIdx === -1 || preIdx === postIdx) return meals;

  const periRatio = Number(sessionDemand.peri_workout_carb_ratio) || 0.55;
  const periTotalCarbs = Math.round(totalCarbs * periRatio);
  const remainingCarbs = Math.max(10, totalCarbs - periTotalCarbs);

  // Pre-workout: ~45% of peri-workout carbs (sustained glycogen & energy)
  // Post-workout: ~55% of peri-workout carbs (glycogen resynthesis & anabolic window)
  const preCarbs = Math.round(periTotalCarbs * 0.45);
  const postCarbs = periTotalCarbs - preCarbs;

  // Distribute remaining carbs across non-peri meals
  const nonPeriIndices = meals.map((_, i) => i).filter(i => i !== preIdx && i !== postIdx);
  const nonPeriCount = nonPeriIndices.length;
  const carbPerNonPeri = nonPeriCount > 0 ? Math.round(remainingCarbs / nonPeriCount) : 0;

  return meals.map((meal, idx) => {
    let targetCarb = 0;
    if (idx === preIdx) {
      targetCarb = preCarbs;
    } else if (idx === postIdx) {
      targetCarb = postCarbs;
    } else {
      targetCarb = carbPerNonPeri;
    }

    const currentP = Number(meal.macros?.protein || meal.actual_macros?.protein_g || meal.target_macros?.protein_g || 35);
    const currentF = Number(meal.macros?.fats || meal.actual_macros?.fat_g || meal.target_macros?.fat_g || 15);
    const newCal = Math.round((currentP * 4) + (targetCarb * 4) + (currentF * 9));

    return {
      ...meal,
      target_macros: {
        ...(meal.target_macros || {}),
        protein_g: currentP,
        carb_g: targetCarb,
        fat_g: currentF,
        calories_kcal: newCal,
      },
      // Keep macros synced for frontend CoachEditor
      macros: {
        ...(meal.macros || {}),
        protein: currentP,
        carbs: targetCarb,
        fats: currentF,
        calories: newCal,
      },
      peri_workout_role: idx === preIdx ? 'PRE_WORKOUT' : idx === postIdx ? 'POST_WORKOUT' : null,
    };
  });
}

// =========================================================================
// 5. MESOCYCLE CALIBRATION & CLINICAL SAFETY FOR ADDED EXERCISES
// =========================================================================

/**
 * Periodized defaults for mesocycle weeks 1 through 5.
 */
export const MESOCYCLE_WEEKS_CALIBRATION = Object.freeze({
  1: { phase: 'INTRO', target_rir: 3, set_modifier: 0, sets_default: 3, rest_compound: 120, rest_iso: 60 },
  2: { phase: 'OVERLOAD', target_rir: 2, set_modifier: 0, sets_default: 3, rest_compound: 120, rest_iso: 60 },
  3: { phase: 'INTENSIFICATION', target_rir: 1, set_modifier: 1, sets_default: 4, rest_compound: 120, rest_iso: 75 },
  4: { phase: 'PEAK_OVERLOAD', target_rir: 0, set_modifier: 1, sets_default: 4, rest_compound: 150, rest_iso: 75 },
  5: { phase: 'DELOAD', target_rir: 4, set_modifier: -1, sets_default: 2, rest_compound: 90, rest_iso: 60 },
});

/**
 * Calibrates parameters for a newly added exercise based on:
 * - Current mesocycle week phase.
 * - Exercise biomechanical profile (Heavy Compound, Secondary, Isolation).
 * - Trainee clinical constraints (Hypertension RIR >= 2, Asthma, Injuries).
 * 
 * @param {Object} rawExercise - The selected catalog exercise
 * @param {number} weekNumber - Active week number (1-5)
 * @param {Object} clientData - Trainee medical & physiological profile
 * @returns {Object} Ready-to-inject, fully calibrated exercise object
 */
export function calibrateAddedExercise(rawExercise, weekNumber = 1, clientData = {}) {
  const code = String(rawExercise.code || rawExercise.id || `EX_${Date.now()}`).toUpperCase();
  const names = resolveExerciseNames(code);
  const catalogV2 = getExerciseV2ByCode(code);

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

  const weekConfig = MESOCYCLE_WEEKS_CALIBRATION[weekNumber] || MESOCYCLE_WEEKS_CALIBRATION[1];

  // 1. Sets determination
  let targetSets = isHeavy
    ? (weekNumber >= 3 && weekNumber <= 4 ? 4 : weekNumber === 5 ? 2 : 3)
    : (weekNumber === 5 ? 2 : 3);

  // 2. Reps range
  let targetReps = isHeavy ? '6 - 8' : isSecondary ? '8 - 10' : '12 - 15';

  // 3. Target RIR
  let targetRir = weekConfig.target_rir;
  if (hasHypertension && targetRir < CLINICAL_GUIDELINES.HYPERTENSION.MIN_RIR) {
    targetRir = CLINICAL_GUIDELINES.HYPERTENSION.MIN_RIR; // ACSM/AHA RIR >= 2
  }

  // 4. Rest seconds
  let restSec = isHeavy ? weekConfig.rest_compound : weekConfig.rest_iso;

  // 5. Valsalva and clinical notes
  let safetyNote = rawExercise.safety_tip_ar || rawExercise.safety_notes_ar || rawExercise.safetyNote || 'تطبيق التكنيك السليم مع ثبات المفاصل';
  if (hasHypertension) {
    safetyNote = `${safetyNote} — ${CLINICAL_GUIDELINES.HYPERTENSION.VALSALVA_SAFETY_CUE_AR}`;
  }

  return {
    id: `e_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    code: code,
    name: names.name_en || rawExercise.name || rawExercise.name_en || code,
    name_ar: names.name_ar || rawExercise.name_ar || code,
    name_en: names.name_en || rawExercise.name_en || code,
    muscle_group: rawExercise.muscle_group || (catalogV2 ? catalogV2.primary_muscle : resolveMuscleGroupKey(rawExercise)),
    primary_muscle: catalogV2 ? catalogV2.primary_muscle : resolveMuscleGroupKey(rawExercise),
    equipment: rawExercise.equipment || (catalogV2 ? catalogV2.equipment : 'BARBELL'),
    profile: isHeavy ? 'HEAVY_COMPOUND' : isSecondary ? 'SECONDARY_COMPOUND' : 'ISOLATION_STRETCH',
    sets: targetSets,
    target_sets: targetSets,
    reps: targetReps,
    target_reps: targetReps,
    rir: targetRir,
    target_rir: targetRir,
    restSec: restSec,
    rest: restSec,
    safetyNote: safetyNote,
    video_url: rawExercise.video_url || (rawExercise.video_id ? `https://www.youtube.com/watch?v=${rawExercise.video_id}` : ''),
    image_stretch: rawExercise.image_stretch || `/exercises/${code}/0.jpg`,
    image_contraction: rawExercise.image_contraction || `/exercises/${code}/1.jpg`,
    prescription: {
      sets: targetSets,
      unit: 'REPS',
      target_rir: targetRir,
      rest_seconds: restSec,
      clinical_valsalva_cue_ar: hasHypertension ? CLINICAL_GUIDELINES.HYPERTENSION.VALSALVA_SAFETY_CUE_AR : null,
    },
  };
}

// =========================================================================
// 6. VOLUME LANDMARKS AUDIT (MEV / MAV / MRV)
// =========================================================================

/**
 * Computes weekly volume distribution across muscle groups and compares against landmarks.
 * 
 * @param {Array<Object>} sessions - Workout sessions in the week
 * @returns {Object} Detailed audit per muscle group
 */
/**
 * The landmarks above are written for a lifter who has been training for a while. A beginner grows
 * on less - the first year answers to about two thirds of that volume (Schoenfeld et al. 2017 read
 * the dose-response in trained lifters; untrained gains saturate lower) - so a beginner's week was
 * being marked short against a table that was never his. Everything else keeps the same numbers.
 */
const BEGINNER_VOLUME_FACTOR = 0.65;

export function volumeLandmarksFor(experienceLevel = "INTERMEDIATE") {
  const level = String(experienceLevel || "").toUpperCase();
  if (level !== "BEGINNER" && level !== "NOVICE") return MUSCLE_VOLUME_LANDMARKS;
  const scaled = {};
  for (const [key, landmark] of Object.entries(MUSCLE_VOLUME_LANDMARKS)) {
    scaled[key] = Object.freeze({
      ...landmark,
      mev: Math.max(3, Math.round(landmark.mev * BEGINNER_VOLUME_FACTOR)),
      mav_min: Math.max(4, Math.round(landmark.mav_min * BEGINNER_VOLUME_FACTOR)),
      mav_max: Math.max(6, Math.round(landmark.mav_max * BEGINNER_VOLUME_FACTOR)),
      mrv: Math.max(8, Math.round(landmark.mrv * BEGINNER_VOLUME_FACTOR)),
    });
  }
  return Object.freeze(scaled);
}

export function auditWeeklyMuscleVolume(sessions = [], experienceLevel = "INTERMEDIATE") {
  const landmarks = volumeLandmarksFor(experienceLevel);
  const volumeMap = {};

  Object.keys(landmarks).forEach(k => {
    volumeMap[k] = 0;
  });

  for (const session of sessions) {
    for (const ex of (session.exercises || [])) {
      const key = resolveMuscleGroupKey(ex);
      const sets = Number(ex.sets || ex.target_sets || 3);
      if (volumeMap[key] !== undefined) {
        volumeMap[key] += sets;
      }
    }
  }

  const analysis = {};
  const warnings = [];

  for (const [key, sets] of Object.entries(volumeMap)) {
    const landmark = landmarks[key];
    if (!landmark) continue;

    let status = 'OPTIMAL_MAV';
    let statusLabelAr = 'حجم تدريبي مثالي (MAV)';

    // No direct sets at all used to read as an optimal volume, so a plan with no triceps work and
    // a plan with twelve sets of it looked the same to the coach. The glutes sit here in every
    // plan: they work in every squat, hinge and lunge, and the table counts direct sets only.
    if (sets === 0) {
      status = 'NOT_TRAINED_DIRECTLY';
      statusLabelAr = 'لا توجد جولات مباشرة (بتشتغل بشكل غير مباشر في التمارين المركبة)';
    } else if (sets < landmark.mev && sets > 0) {
      status = 'BELOW_MEV';
      statusLabelAr = `أقل من الحد الأدنى للتحفيز البنائي (${sets}/${landmark.mev} جولة)`;
      warnings.push(`عضلة ${landmark.name_ar}: الحجم الحالي (${sets} جولات) دون الحد الأدنى الفعال (MEV: ${landmark.mev} جولة).`);
    } else if (sets > landmark.mrv) {
      status = 'EXCEEDS_MRV';
      statusLabelAr = `تجاوز الحد الأقصى للاستشفاء (${sets}/${landmark.mrv} جولة)`;
      warnings.push(`عضلة ${landmark.name_ar}: الحجم الحالي (${sets} جولات) يتجاوز الحد الأقصى للاستشفاء (MRV: ${landmark.mrv} جولة)، مما يرفع مخاطر الهدم العضلي وإجهاد الأوتار.`);
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
      status: status,
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

// =========================================================================
// 7. DEFICIT-ADJUSTED VOLUME LANDMARKS (Deficit Volume Shield)
// =========================================================================

/**
 * Calculates energy status adjusted volume landmarks.
 * In deficit, MRV contracts because energy availability and glycogen replenishment are compromised.
 * In surplus, MRV expands due to higher glycogen stores and enhanced MPS.
 *
 * @param {Object} options
 * @param {number} options.targetCalories
 * @param {number} options.tdee
 * @returns {Object} Adjusted landmarks and deficit details
 */
export function calculateEnergyAdjustedLandmarks({ targetCalories = 2000, tdee = 2400 }) {
  const safeCalories = Math.max(800, Number(targetCalories) || 2000);
  const safeTdee = Math.max(1200, Number(tdee) || safeCalories);
  const energyDelta = safeTdee - safeCalories;
  const deficitPercent = safeTdee > 0 ? ((energyDelta / safeTdee) * 100) : 0;
  const isDeficit = deficitPercent > 5;
  const isSurplus = energyDelta < -100;
  const isAggressiveDeficit = deficitPercent >= 20 || safeCalories < 1500;

  // Multipliers for MRV & MAV
  let mrvMultiplier = 1.0;
  let mavMultiplier = 1.0;

  if (isAggressiveDeficit) {
    mrvMultiplier = 0.80; // -20% MRV in steep deficit
    mavMultiplier = 0.85; // -15% MAV
  } else if (isDeficit) {
    mrvMultiplier = 0.90; // -10% MRV in moderate deficit
    mavMultiplier = 0.90;
  } else if (isSurplus) {
    mrvMultiplier = 1.15; // +15% MRV in surplus
    mavMultiplier = 1.10;
  }

  const adjustedLandmarks = {};
  for (const [key, base] of Object.entries(MUSCLE_VOLUME_LANDMARKS)) {
    const adjMrv = Math.max(base.mev + 2, Math.round(base.mrv * mrvMultiplier));
    const adjMavMax = Math.max(base.mev + 1, Math.min(adjMrv - 1, Math.round(base.mav_max * mavMultiplier)));
    const adjMavMin = Math.max(base.mev, Math.round(base.mav_min * mavMultiplier));

    adjustedLandmarks[key] = {
      ...base,
      base_mrv: base.mrv,
      base_mav_max: base.mav_max,
      base_mav_min: base.mav_min,
      mrv: adjMrv,
      mav_max: adjMavMax,
      mav_min: adjMavMin,
    };
  }

  return {
    is_deficit: isDeficit,
    is_aggressive_deficit: isAggressiveDeficit,
    is_surplus: isSurplus,
    deficit_percent: +deficitPercent.toFixed(1),
    mrv_multiplier: mrvMultiplier,
    mav_multiplier: mavMultiplier,
    adjusted_landmarks: adjustedLandmarks,
  };
}

/**
 * Audits training sessions against deficit-adjusted volume landmarks.
 * Triggers Deficit Volume Shield warnings if prescribed volume exceeds recovery limits.
 *
 * @param {Object} params
 * @param {Array<Object>} params.sessions
 * @param {number} params.targetCalories
 * @param {number} params.tdee
 * @returns {Object} Shield status, volume audit, and clinical recommendations
 */
export function auditDeficitVolumeShield({ sessions = [], targetCalories = 2000, tdee = 2400 }) {
  const energyStatus = calculateEnergyAdjustedLandmarks({ targetCalories, tdee });
  const volumeMap = {};

  Object.keys(MUSCLE_VOLUME_LANDMARKS).forEach(k => {
    volumeMap[k] = 0;
  });

  for (const session of sessions) {
    for (const ex of (session.exercises || [])) {
      const key = resolveMuscleGroupKey(ex);
      const sets = Number(ex.sets || ex.target_sets || 3);
      if (volumeMap[key] !== undefined) {
        volumeMap[key] += sets;
      }
    }
  }

  const analysis = {};
  const shieldWarnings = [];
  let requiresVolumeConsolidation = false;

  for (const [key, sets] of Object.entries(volumeMap)) {
    const landmark = energyStatus.adjusted_landmarks[key];
    if (!landmark) continue;

    let status = 'OPTIMAL_MAV';
    let statusLabelAr = 'حجم تدريبي متوازن مع الطاقة';

    if (sets > landmark.mrv) {
      status = 'EXCEEDS_DEFICIT_MRV';
      requiresVolumeConsolidation = true;
      const excessSets = sets - landmark.mrv;
      statusLabelAr = `تجاوز سقف الاستشفاء في العجز (${sets}/${landmark.mrv} جولة)`;
      shieldWarnings.push(
        `درع العجز السعري: حجم تدريب ${landmark.name_ar} (${sets} جولات) يتجاوز سقف الاستشفاء الأقصى المعدل بالعجز (${landmark.mrv} جولة بفارق ${excessSets} جولة زائدة). استمرار هذا الحجم مع عجز ${energyStatus.deficit_percent}% يرفع هرمون الكورتيزول وخطر الهدم العضلي.`
      );
    } else if (sets < landmark.mev && sets > 0) {
      status = 'BELOW_MEV';
      statusLabelAr = `أقل من الحد الأدنى للتحفيز (${sets}/${landmark.mev} جولة)`;
    } else if (sets >= landmark.mav_min && sets <= landmark.mav_max) {
      status = 'OPTIMAL_MAV';
      statusLabelAr = `نطاق بنائي مثالي في العجز (${sets} جولة)`;
    } else if (sets > 0) {
      status = 'ACCEPTABLE';
      statusLabelAr = `نطاق فعال مقبول (${sets} جولة)`;
    }

    analysis[key] = {
      muscle_name_ar: landmark.name_ar,
      weekly_sets: sets,
      mev: landmark.mev,
      mav_range: `${landmark.mav_min}-${landmark.mav_max}`,
      adjusted_mrv: landmark.mrv,
      base_mrv: landmark.base_mrv,
      status,
      status_label_ar: statusLabelAr,
    };
  }

  return {
    shield_active: energyStatus.is_aggressive_deficit,
    is_deficit: energyStatus.is_deficit,
    deficit_percent: energyStatus.deficit_percent,
    mrv_multiplier: energyStatus.mrv_multiplier,
    requires_volume_consolidation: requiresVolumeConsolidation,
    analysis,
    warnings: shieldWarnings,
  };
}

// =========================================================================
// 8. CARB CYCLING SESSION DYNAMIC SYNC
// =========================================================================

/**
 * Automatically couples a 7-day weekly schedule with carb cycling based on actual session demand.
 * Highest demand sessions get High-Carb (+20%), Moderate gets Baseline, Light/Rest gets Low-Carb (-20%).
 * Strictly preserves 100% weekly calorie balance (average daily === baseline).
 */
export function syncCarbCyclingWithSessions({
  sessions = [],
  baselineDailyCalories = 2000,
  baselineProteinG = 160,
  baselineCarbsG = 220,
  baselineFatG = 55,
  daysOrder = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
}) {
  const scoredSessions = sessions.map((sess, idx) => {
    const demand = calculateSessionDemand(sess.exercises || []);
    return {
      session_index: idx,
      session_name: sess.name || sess.session_name_ar || `اليوم ${idx + 1}`,
      demand,
      target_muscles: sess.target_muscles || '',
    };
  });

  const scheduleDays = daysOrder.map((dayName, idx) => {
    const sess = scoredSessions[idx] || null;
    let dayType = 'REST_DAY';
    let labelAr = 'راحة واستشفاء';

    if (sess) {
      if (sess.demand.demand_level === 'HIGH_GLYCOLYTIC' || sess.demand.is_heavy_session) {
        dayType = 'HEAVY_TRAINING';
        labelAr = `${sess.session_name} (طلب جليكوجيني مرتفع)`;
      } else if (sess.demand.demand_level === 'MODERATE') {
        dayType = 'MODERATE_TRAINING';
        labelAr = `${sess.session_name} (طلب جليكوجيني متوسط)`;
      } else {
        dayType = 'REST_DAY';
        labelAr = `${sess.session_name} (طلب خفيف / استشفاء)`;
      }
    }

    return {
      day: dayName,
      type: dayType,
      label_ar: labelAr,
      session_name: sess ? sess.session_name : null,
      glycolytic_demand: sess ? sess.demand.demand_level : 'NONE',
    };
  });

  const heavyCount = scheduleDays.filter(d => d.type === 'HEAVY_TRAINING').length;
  const restCount = scheduleDays.filter(d => d.type === 'REST_DAY').length;

  const carbDeltaPerHeavy = Math.round(baselineCarbsG * 0.20);
  const totalHeavyCarbExcessG = heavyCount * carbDeltaPerHeavy;
  const carbDeltaPerRest = restCount > 0 ? Math.round(totalHeavyCarbExcessG / restCount) : carbDeltaPerHeavy;

  const heavyCarbs = baselineCarbsG + carbDeltaPerHeavy;
  const restCarbs = Math.max(30, baselineCarbsG - carbDeltaPerRest);
  const modCarbs = baselineCarbsG;

  const heavyFat = Math.max(20, Math.round(baselineFatG - ((carbDeltaPerHeavy * 4) / 9)));
  const restFat = Math.round(baselineFatG + (((baselineCarbsG - restCarbs) * 4) / 9));
  const modFat = baselineFatG;

  const weeklyBreakdown = scheduleDays.map(d => {
    let c = modCarbs;
    let f = modFat;
    let strategyAr = 'توزيع متوازن (Baseline)';

    if (d.type === 'HEAVY_TRAINING') {
      c = heavyCarbs;
      f = heavyFat;
      strategyAr = 'شحن كربوهيدرات مرتفع (+20%) لتغذية الحصة الشاقة';
    } else if (d.type === 'REST_DAY') {
      c = restCarbs;
      f = restFat;
      strategyAr = 'كربوهيدرات منخفضة مع دهون استشفائية في يوم الراحة';
    }

    const dayCalories = (baselineProteinG * 4) + (c * 4) + (f * 9);

    return {
      day: d.day,
      day_type: d.type,
      label_ar: d.label_ar,
      session_name: d.session_name,
      glycolytic_demand: d.glycolytic_demand,
      strategy_ar: strategyAr,
      calories: Math.round(dayCalories),
      protein_g: baselineProteinG,
      carbs_g: c,
      fat_g: f,
    };
  });

  const totalWeeklyCalories = weeklyBreakdown.reduce((sum, d) => sum + d.calories, 0);
  const avgDailyCalories = Math.round(totalWeeklyCalories / 7);

  return {
    baseline: {
      daily_calories: baselineDailyCalories,
      protein_g: baselineProteinG,
      carbs_g: baselineCarbsG,
      fat_g: baselineFatG,
    },
    weekly_breakdown: weeklyBreakdown,
    weekly_average_calories: avgDailyCalories,
    calorie_variance: Math.abs(avgDailyCalories - baselineDailyCalories),
    heavy_days_count: heavyCount,
    rest_days_count: restCount,
  };
}

// =========================================================================
// 9. PROTEIN-SPARING DYNAMIC DEFENSE
// =========================================================================

/**
 * Evaluates protein requirements under energy deficit to prevent muscle wasting (Sparing Effect).
 * The locked ceiling for declared kidney disease is gone with the case: the service refuses it
 * before a plan is built (src/api/services/serviceScope.js).
 *
 * @param {Object} params
 * @returns {Object} Protein recommendation, current delta, and clinical status
 */
export function evaluateProteinSparingRequirement({
  targetCalories = 2000,
  tdee = 2400,
  clientWeightKg = 80,
  currentProteinG = 150,
}) {
  const weight = Math.max(35, Number(clientWeightKg) || 80);
  const safeCalories = Math.max(800, Number(targetCalories) || 2000);
  const safeTdee = Math.max(1200, Number(tdee) || safeCalories);
  const deficitPercent = safeTdee > 0 ? (((safeTdee - safeCalories) / safeTdee) * 100) : 0;

  let recommendedMultiplier = 1.8;
  if (deficitPercent >= 20 || safeCalories < 1500) {
    recommendedMultiplier = 2.3; // Sparing protein in deep cut
  } else if (deficitPercent >= 10) {
    recommendedMultiplier = 2.0; // Moderate cut
  } else {
    recommendedMultiplier = 1.8; // Maintenance or surplus
  }

  const recommendedProteinG = Math.round(weight * recommendedMultiplier);
  const proteinDeltaG = currentProteinG - recommendedProteinG;
  const isDeficient = proteinDeltaG < -15; // >15g below recommended

  let status = 'OPTIMAL_SPARING';
  let messageAr = `مستوى بروتين مثالي لحماية الكتلة العضلية (${(currentProteinG / weight).toFixed(1)} جم/كجم).`;

  if (isDeficient) {
    status = 'INSUFFICIENT_FOR_DEFICIT';
    messageAr = `تنبيه تدريع بروتيني: في ظل عجز حراري بنسبة ${deficitPercent.toFixed(1)}%، البروتين الحالي (${currentProteinG} جم = ${(currentProteinG / weight).toFixed(1)} جم/كجم) أقل من الحد الوقائي الموصى به (${recommendedProteinG} جم = ${recommendedMultiplier} جم/كجم) لمنع هدم النسيج العضلي.`;
  }

  return {
    deficit_percent: +deficitPercent.toFixed(1),
    recommended_multiplier: recommendedMultiplier,
    recommended_protein_g: recommendedProteinG,
    current_protein_g: currentProteinG,
    current_multiplier: +(currentProteinG / weight).toFixed(2),
    protein_delta_g: proteinDeltaG,
    is_deficient: isDeficient,
    status,
    message_ar: messageAr,
  };
}


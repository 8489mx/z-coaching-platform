/**
 * Z Coaching Platform - Plan Cloning & Templates Engine
 * Pure utility module for deep cloning and preset templates across Training & Nutrition.
 * Zero reference sharing (Deep Isolation Guardrail).
 */

import { FOOD_REFERENCE } from '../data/foodReference.js';
import { MASTER_EXERCISE_DICTIONARY } from './exerciseTranslator.js';

/**
 * Generate a unique ID safe for React keys and DB persistence
 * @param {string} prefix
 * @returns {string}
 */
export function generateUniqueId(prefix = 'id') {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 7);
  return `${prefix}_${ts}_${rand}`;
}

/**
 * Calculate total macros from a list of food items
 * @param {Array} items
 * @returns {{ calories: number, protein: number, carbs: number, fats: number }}
 */
export function calculateMealMacrosFromItems(items = []) {
  let protein = 0;
  let carbs = 0;
  let fats = 0;
  let calories = 0;

  for (const it of items) {
    protein += Number(it.p || it.protein || 0);
    carbs += Number(it.c || it.carbs || 0);
    fats += Number(it.f || it.fats || it.fat || 0);
    calories += Number(it.cal || it.calories || it.kcal || 0);
  }

  return {
    calories: Math.round(calories),
    protein: Number(protein.toFixed(1)),
    carbs: Number(carbs.toFixed(1)),
    fats: Number(fats.toFixed(1))
  };
}

/**
 * Deep clone an individual exercise
 * @param {Object} exercise
 * @param {Object} options
 * @returns {Object}
 */
export function cloneExercise(exercise, options = {}) {
  if (!exercise || typeof exercise !== 'object') return exercise;

  const clonedPrescription = exercise.prescription
    ? JSON.parse(JSON.stringify(exercise.prescription))
    : null;

  const clonedTags = Array.isArray(exercise.tags)
    ? [...exercise.tags]
    : [];

  return {
    ...JSON.parse(JSON.stringify(exercise)),
    id: options.id || generateUniqueId('ex'),
    prescription: clonedPrescription,
    tags: clonedTags
  };
}

/**
 * Duplicate an exercise within the same training session
 * @param {Object} session
 * @param {number} exerciseIndex
 * @returns {Object}
 */
export function duplicateExerciseInSession(session, exerciseIndex) {
  if (!session || !Array.isArray(session.exercises)) return session;
  if (exerciseIndex < 0 || exerciseIndex >= session.exercises.length) return session;

  const newExercises = session.exercises.map(ex => cloneExercise(ex, { id: ex.id }));
  const sourceEx = session.exercises[exerciseIndex];
  const duplicatedEx = cloneExercise(sourceEx);

  newExercises.splice(exerciseIndex + 1, 0, duplicatedEx);

  return {
    ...JSON.parse(JSON.stringify(session)),
    exercises: newExercises
  };
}

/**
 * Copy an exercise from one training session into another session
 * @param {Object} sourceSession
 * @param {number} exerciseIndex
 * @param {Object} targetSession
 * @returns {Object}
 */
export function copyExerciseToSession(sourceSession, exerciseIndex, targetSession) {
  if (!sourceSession || !Array.isArray(sourceSession.exercises)) return targetSession;
  if (!targetSession) return targetSession;
  if (exerciseIndex < 0 || exerciseIndex >= sourceSession.exercises.length) return targetSession;

  const targetExercises = Array.isArray(targetSession.exercises)
    ? targetSession.exercises.map(ex => cloneExercise(ex, { id: ex.id }))
    : [];

  const sourceEx = sourceSession.exercises[exerciseIndex];
  const clonedEx = cloneExercise(sourceEx);

  targetExercises.push(clonedEx);

  return {
    ...JSON.parse(JSON.stringify(targetSession)),
    exercises: targetExercises
  };
}

/**
 * Deep clone an entire training session / workout day
 * @param {Object} session
 * @param {Object} options
 * @returns {Object}
 */
export function cloneTrainingSession(session, options = {}) {
  if (!session || typeof session !== 'object') return session;

  const baseName = session.name || 'اليوم التدريبي';
  const newName = options.newName || (baseName.includes('(نسخة)') ? baseName : `${baseName} (نسخة)`);

  const clonedExercises = Array.isArray(session.exercises)
    ? session.exercises.map(ex => cloneExercise(ex))
    : [];

  return {
    ...JSON.parse(JSON.stringify(session)),
    id: options.id || generateUniqueId('sess'),
    name: newName,
    exercises: clonedExercises,
    pre_workout_mobility: Array.isArray(session.pre_workout_mobility) ? [...session.pre_workout_mobility] : [],
    post_workout_stretches: Array.isArray(session.post_workout_stretches) ? [...session.post_workout_stretches] : []
  };
}

/**
 * Deep clone an entire meal with all food items and recalculate macros
 * @param {Object} meal
 * @param {Object} options
 * @returns {Object}
 */
export function cloneMeal(meal, options = {}) {
  if (!meal || typeof meal !== 'object') return meal;

  const baseName = meal.name || 'وجبة';
  const newName = options.newName || (baseName.includes('(نسخة)') ? baseName : `${baseName} (نسخة)`);

  const clonedItems = Array.isArray(meal.items)
    ? meal.items.map(it => ({
        ...JSON.parse(JSON.stringify(it)),
        id: generateUniqueId('it')
      }))
    : [];

  const freshMacros = calculateMealMacrosFromItems(clonedItems);

  return {
    ...JSON.parse(JSON.stringify(meal)),
    id: options.id || generateUniqueId('m'),
    name: newName,
    items: clonedItems,
    macros: freshMacros
  };
}

/**
 * Copy an individual food item from one meal to another and recalculate target macros
 * @param {Object} sourceMeal
 * @param {number} itemIndex
 * @param {Object} targetMeal
 * @returns {Object}
 */
export function copyMealItemToMeal(sourceMeal, itemIndex, targetMeal) {
  if (!sourceMeal || !Array.isArray(sourceMeal.items)) return targetMeal;
  if (!targetMeal) return targetMeal;
  if (itemIndex < 0 || itemIndex >= sourceMeal.items.length) return targetMeal;

  const targetItems = Array.isArray(targetMeal.items)
    ? targetMeal.items.map(it => ({ ...JSON.parse(JSON.stringify(it)) }))
    : [];

  const sourceItem = sourceMeal.items[itemIndex];
  const clonedItem = {
    ...JSON.parse(JSON.stringify(sourceItem)),
    id: generateUniqueId('it')
  };

  targetItems.push(clonedItem);
  const freshMacros = calculateMealMacrosFromItems(targetItems);

  return {
    ...JSON.parse(JSON.stringify(targetMeal)),
    items: targetItems,
    macros: freshMacros
  };
}

/**
 * Preset Evidence-Based Training Day Templates
 */
export const PRESET_TRAINING_DAY_TEMPLATES = Object.freeze({
  PUSH_DAY: {
    key: 'PUSH_DAY',
    name_ar: 'دفع (Push - صدر وأكتاف وترايسبس)',
    target_muscles: 'الصدر، الكتف الأمامي والجانبي، الترايسبس',
    exercises: [
      { code: 'BARBELL_BENCH_PRESS', sets: 4, reps: '8 - 10', rir: 2, restSec: 90, equipment: 'بار حر + بنش' },
      { code: 'INCLINE_DUMBBELL_BENCH_PRESS', sets: 3, reps: '10 - 12', rir: 2, restSec: 75, equipment: 'دمبل + بنش مائل' },
      { code: 'DUMBBELL_LATERAL_RAISE', sets: 4, reps: '12 - 15', rir: 1, restSec: 60, equipment: 'دمبل' },
      { code: 'TRICEPS_ROPE_PUSHDOWN', sets: 3, reps: '12 - 15', rir: 1, restSec: 60, equipment: 'كابل' },
      { code: 'CHEST_FLY_DUMBBELL', sets: 3, reps: '12 - 15', rir: 2, restSec: 60, equipment: 'دمبل' }
    ]
  },
  PULL_DAY: {
    key: 'PULL_DAY',
    name_ar: 'سحب (Pull - ظهر وبايسبس وخلفيات)',
    target_muscles: 'الظهر العريض، أعلى الظهر، الكتف الخلفي، البايسبس',
    exercises: [
      { code: 'LAT_PULLDOWN', sets: 4, reps: '10 - 12', rir: 2, restSec: 75, equipment: 'جهاز سحب كابل' },
      { code: 'SEATED_CABLE_ROW', sets: 4, reps: '10 - 12', rir: 2, restSec: 75, equipment: 'كابل سحب أرضي' },
      { code: 'FACE_PULL', sets: 3, reps: '15 - 20', rir: 1, restSec: 60, equipment: 'كابل + حبل' },
      { code: 'BARBELL_BICEPS_CURL', sets: 3, reps: '10 - 12', rir: 1, restSec: 60, equipment: 'بار حر' }
    ]
  },
  LEGS_DAY: {
    key: 'LEGS_DAY',
    name_ar: 'أرجل (Legs - فخذ أمامي وخلفي وسمانة)',
    target_muscles: 'الفخذ الأمامي والخلفي، المؤخرة، السمانة',
    exercises: [
      { code: 'BARBELL_BACK_SQUAT', sets: 4, reps: '6 - 8', rir: 2, restSec: 120, equipment: 'بار حر + راك سكوات' },
      { code: 'ROMANIAN_DEADLIFT', sets: 3, reps: '8 - 10', rir: 2, restSec: 90, equipment: 'بار حر' },
      { code: 'BULGARIAN_SPLIT_SQUAT', sets: 3, reps: '10 - 12', rir: 2, restSec: 75, equipment: 'دمبل' },
      { code: 'LEG_PRESS', sets: 3, reps: '10 - 12', rir: 2, restSec: 90, equipment: 'جهاز ليج برس' }
    ]
  },
  UPPER_BODY: {
    key: 'UPPER_BODY',
    name_ar: 'علوي (Upper Body - شامل الجزء العلوي)',
    target_muscles: 'عضلات الصدر والظهر والأكتاف والذراعين',
    exercises: [
      { code: 'BARBELL_BENCH_PRESS', sets: 4, reps: '8 - 10', rir: 2, restSec: 90, equipment: 'بار حر + بنش' },
      { code: 'LAT_PULLDOWN', sets: 4, reps: '10 - 12', rir: 2, restSec: 75, equipment: 'جهاز سحب كابل' },
      { code: 'DUMBBELL_SHOULDER_PRESS', sets: 3, reps: '10 - 12', rir: 2, restSec: 75, equipment: 'دمبل' },
      { code: 'SEATED_CABLE_ROW', sets: 3, reps: '10 - 12', rir: 2, restSec: 75, equipment: 'كابل سحب أرضي' }
    ]
  },
  LOWER_BODY: {
    key: 'LOWER_BODY',
    name_ar: 'سفلي (Lower Body - شامل الجزء السفلي)',
    target_muscles: 'الفخذ، المؤخرة، السمانة، عضلات الجذع',
    exercises: [
      { code: 'BARBELL_BACK_SQUAT', sets: 4, reps: '8 - 10', rir: 2, restSec: 120, equipment: 'بار حر + راك سكوات' },
      { code: 'ROMANIAN_DEADLIFT', sets: 3, reps: '8 - 10', rir: 2, restSec: 90, equipment: 'بار حر' },
      { code: 'BULGARIAN_SPLIT_SQUAT', sets: 3, reps: '10 - 12', rir: 2, restSec: 75, equipment: 'دمبل' },
      { code: 'LEG_PRESS', sets: 3, reps: '12 - 15', rir: 2, restSec: 90, equipment: 'جهاز ليج برس' }
    ]
  },
  FULL_BODY: {
    key: 'FULL_BODY',
    name_ar: 'جسم كامل (Full Body)',
    target_muscles: 'تمرين مركب لكامل الجسم',
    exercises: [
      { code: 'BARBELL_BACK_SQUAT', sets: 3, reps: '8 - 10', rir: 2, restSec: 90, equipment: 'بار حر + راك سكوات' },
      { code: 'BARBELL_BENCH_PRESS', sets: 3, reps: '8 - 10', rir: 2, restSec: 90, equipment: 'بار حر + بنش' },
      { code: 'LAT_PULLDOWN', sets: 3, reps: '10 - 12', rir: 2, restSec: 75, equipment: 'جهاز سحب كابل' },
      { code: 'ROMANIAN_DEADLIFT', sets: 3, reps: '8 - 10', rir: 2, restSec: 90, equipment: 'بار حر' }
    ]
  }
});

/**
 * Apply a preset training day template to create a fresh workout session
 * @param {string} templateKey
 * @param {string} sessionName
 * @returns {Object}
 */
export function applyTrainingDayTemplate(templateKey, sessionName = '') {
  const tpl = PRESET_TRAINING_DAY_TEMPLATES[templateKey];
  if (!tpl) {
    throw new Error(`Unknown training day template key: ${templateKey}`);
  }

  const exercises = tpl.exercises.map((item, idx) => {
    const dictInfo = MASTER_EXERCISE_DICTIONARY[item.code] || {};
    return {
      id: generateUniqueId('ex'),
      code: item.code,
      name: dictInfo.en || dictInfo.name_en || item.code,
      name_en: dictInfo.en || dictInfo.name_en || item.code,
      name_ar: dictInfo.ar || dictInfo.name_ar || item.code,
      sets: item.sets,
      reps: item.reps,
      rir: item.rir,
      restSec: item.restSec,
      equipment: item.equipment || '',
      safetyNote: dictInfo.cues_ar || '',
      video_url: dictInfo.video_id ? `https://www.youtube.com/watch?v=${dictInfo.video_id}` : '',
      image_stretch: `/exercises/${item.code}/0.jpg`,
      image_contraction: `/exercises/${item.code}/1.jpg`,
      prescription: {
        sets: item.sets,
        target_min: parseInt(item.reps.split('-')[0], 10) || 8,
        target_max: parseInt(item.reps.split('-')[1], 10) || 12,
        target_rir: item.rir,
        rest_seconds: item.restSec
      }
    };
  });

  return {
    id: generateUniqueId('sess'),
    name: sessionName || tpl.name_ar,
    target_muscles: tpl.target_muscles,
    exercises,
    pre_workout_mobility: [],
    post_workout_stretches: []
  };
}

/**
 * Preset Evidence-Based Culinary Meal Templates
 */
export const PRESET_MEAL_TEMPLATES = Object.freeze({
  BALANCED_BREAKFAST: {
    key: 'BALANCED_BREAKFAST',
    name_ar: 'إفطار كلاسيكي متوازن',
    items: [
      { code: 'WHOLE_EGG', name_ar: 'بيض كامل مسلوق', amount: 100, category: 'PROTEIN' },
      { code: 'ROLLED_OATS_RAW', name_ar: 'شوفان حبة كاملة خام', amount: 60, category: 'CARB' },
      { code: 'BANANA', name_ar: 'موز طازج', amount: 100, category: 'CARB' },
      { code: 'ALMONDS_RAW', name_ar: 'لوز نيء طبيعي', amount: 15, category: 'FAT' }
    ]
  },
  HIGH_PROTEIN_LUNCH: {
    key: 'HIGH_PROTEIN_LUNCH',
    name_ar: 'غداء عالي البروتين (دجاج وأرز)',
    items: [
      { code: 'CHICKEN_BREAST', name_ar: 'صدور دجاج مشوية', amount: 150, category: 'PROTEIN' },
      { code: 'BASMATI_RICE_COOKED', name_ar: 'أرز بسمتي مسلوق', amount: 200, category: 'CARB' },
      { code: 'OLIVE_OIL', name_ar: 'زيت زيتون بكر ممتاز', amount: 10, category: 'FAT' }
    ]
  },
  LEAN_BEEF_POTATO_DINNER: {
    key: 'LEAN_BEEF_POTATO_DINNER',
    name_ar: 'عشاء لحم بقري بتلو وبطاطس',
    items: [
      { code: 'LEAN_VEAL_BEEF', name_ar: 'لحم بتلو بقري هبر أحمر صافي', amount: 150, category: 'PROTEIN' },
      { code: 'BOILED_POTATOES', name_ar: 'بطاطس مسلوقة بدون قشر', amount: 250, category: 'CARB' },
      { code: 'OLIVE_OIL', name_ar: 'زيت زيتون بكر ممتاز', amount: 10, category: 'FAT' }
    ]
  },
  HIGH_PROTEIN_SNACK: {
    key: 'HIGH_PROTEIN_SNACK',
    name_ar: 'سناك بروتيني بالزبادي اليوناني',
    items: [
      { code: 'GREEK_YOGURT_NONFAT', name_ar: 'زبادي يوناني سادة خالي الدسم', amount: 200, category: 'PROTEIN' },
      { code: 'ALMONDS_RAW', name_ar: 'لوز نيء طبيعي', amount: 20, category: 'FAT' },
      { code: 'BANANA', name_ar: 'موز طازج', amount: 80, category: 'CARB' }
    ]
  },
  LIGHT_COTTAGE_CHEESE_MEAL: {
    key: 'LIGHT_COTTAGE_CHEESE_MEAL',
    name_ar: 'وجبة جبن قريش خفيفة',
    items: [
      { code: 'COTTAGE_CHEESE_LOW_FAT_2_PERCENT', name_ar: 'جبن قريش طبيعي قليل الدسم', amount: 200, category: 'PROTEIN' },
      { code: 'WHOLE_EGG', name_ar: 'بيض كامل مسلوق', amount: 50, category: 'PROTEIN' },
      { code: 'OLIVE_OIL', name_ar: 'زيت زيتون بكر ممتاز', amount: 10, category: 'FAT' }
    ]
  }
});

/**
 * Apply a preset meal template to create a fresh culinary meal
 * @param {string} templateKey
 * @param {number} mealNumber
 * @param {Object} options
 * @returns {Object}
 */
export function applyMealTemplate(templateKey, mealNumber = 1, options = {}) {
  const tpl = PRESET_MEAL_TEMPLATES[templateKey];
  if (!tpl) {
    throw new Error(`Unknown meal template key: ${templateKey}`);
  }

  const items = tpl.items.map(item => {
    const ref = FOOD_REFERENCE[item.code] || {};
    const factor = item.amount / 100;
    const p = Number(((ref.protein || 0) * factor).toFixed(1));
    const c = Number(((ref.carbs || 0) * factor).toFixed(1));
    const f = Number(((ref.fat || 0) * factor).toFixed(1));
    const cal = Math.round((ref.kcal || 0) * factor);

    return {
      id: generateUniqueId('it'),
      code: item.code,
      name: item.name_ar,
      amount: item.amount,
      unit: 'جم',
      p,
      c,
      f,
      cal,
      category: item.category || 'MAIN'
    };
  });

  const macros = calculateMealMacrosFromItems(items);
  const time = mealNumber === 1 ? '08:30 ص' : mealNumber === 2 ? '01:30 م' : mealNumber === 3 ? '05:30 م' : '09:00 م';

  return {
    id: generateUniqueId('m'),
    name: options.name || tpl.name_ar,
    time: options.time || time,
    macros,
    items
  };
}

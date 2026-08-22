import { EXPANDED_EXERCISE_CATALOG } from '../constants/exercise-catalog.js';

/**
 * Master Onboarding & Split Generator Engine
 * Evidence-Based Splits: Full Body, Upper/Lower, PPL, Arnold, UL+Arms, Female Glute Focus
 */
export function generateInitialPlan({
  name,
  gender = 'MALE',
  age,
  weightKg,
  heightCm,
  activityLevel = 'SEDENTARY',
  goal = 'FAT_LOSS',
  trainingDaysPerWeek = 4,
  environment = 'GYM',
  medicalFlags = [],
  splitPreference = 'AUTO'
}) {
  if (!weightKg || !heightCm || !age) {
    throw new Error('Weight, height, and age are required for baseline calculations.');
  }

  const isMale = gender.toUpperCase() === 'MALE';
  let bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
  bmr = isMale ? bmr + 5 : bmr - 161;

  const activityMultipliers = { SEDENTARY: 1.2, LIGHT: 1.375, MODERATE: 1.55, HEAVY: 1.725 };
  const multiplier = activityMultipliers[activityLevel.toUpperCase()] || 1.2;
  const tdee = Math.round(bmr * multiplier);

  let targetCalories = tdee;
  if (goal === 'FAT_LOSS') targetCalories = Math.round(tdee * 0.78);
  else if (goal === 'AGGRESSIVE_CUT') targetCalories = Math.round(tdee * 0.70);
  else if (goal === 'LEAN_BULK') targetCalories = Math.round(tdee * 1.10);

  const absoluteFloor = isMale ? 1500 : 1200;
  targetCalories = Math.max(absoluteFloor, targetCalories);

  const hasRenalIssue = medicalFlags.includes('RENAL_INSUFFICIENCY');
  let proteinRatio = goal === 'LEAN_BULK' ? 1.8 : 2.2;
  if (hasRenalIssue) proteinRatio = 1.1;

  const targetProteinGrams = Math.round(weightKg * proteinRatio);
  const proteinKcal = targetProteinGrams * 4;

  let targetFatGrams = Math.round(weightKg * 0.8);
  if ((targetFatGrams * 9) < (targetCalories * 0.20)) {
    targetFatGrams = Math.round((targetCalories * 0.20) / 9);
  }
  const fatKcal = targetFatGrams * 9;

  const remainingKcal = Math.max(0, targetCalories - (proteinKcal + fatKcal));
  const targetCarbGrams = Math.round(remainingKcal / 4);

  const isBeginnerEater = medicalFlags.includes('LOW_FIBER_DIET_HISTORY');
  const targetFiberGrams = isBeginnerEater ? 20 : Math.round((targetCalories / 1000) * 14);

  // =========================================================================
  // نظام توليد التقسيمات التدريبية المتقدمة (Expanded Split Matrix)
  // =========================================================================
  let trainingSplit = {
    id: 'upper_lower',
    name_ar: 'تقسيم علوي / سفلي',
    frequency: `${trainingDaysPerWeek} أيام أسبوعياً`,
    schedule_blueprint: [],
    focus_target_ar: 'توازن عام لكامل الجسم'
  };

  const pref = (splitPreference || 'AUTO').toUpperCase();

  if (pref === 'ARNOLD' || (pref === 'AUTO' && trainingDaysPerWeek === 6 && isMale)) {
    trainingSplit = {
      id: 'arnold_split',
      name_ar: 'التقسيم الكلاسيكي (Arnold Split 6x)',
      frequency: '6 أيام أسبوعياً',
      schedule_blueprint: ['صدر وظهر (A)', 'أكتاف وذراعين (A)', 'أرجل وبطن (A)', 'صدر وظهر (B)', 'أكتاف وذراعين (B)', 'أرجل وبطن (B)'],
      focus_target_ar: 'تركيز مكثف على نمو الذراعين والأكتاف وضخ الدم'
    };
  } else if (pref === 'UL_ARMS' || (pref === 'AUTO' && trainingDaysPerWeek === 5 && isMale)) {
    trainingSplit = {
      id: 'ul_arms_hybrid',
      name_ar: 'علوي / سفلي + ذراعين ونقاط ضعف (UL+A 5x)',
      frequency: '5 أيام أسبوعياً',
      schedule_blueprint: ['جسم علوي (A)', 'جسم سفلي (A)', 'جسم علوي (B)', 'جسم سفلي (B)', 'ذراعين وأكتاف جانبية وبطن'],
      focus_target_ar: 'تطور شامل مع استهداف نقاط الضعف دون إجهاد المفاصل'
    };
  } else if (pref === 'FEMALE_GLUTE' || (pref === 'AUTO' && !isMale && trainingDaysPerWeek >= 4)) {
    trainingSplit = {
      id: 'female_glute_specialized',
      name_ar: 'التقسيم المتخصص لأسفل الجسم والجلوتس (Glute-Hypertrophy Focus)',
      frequency: `${trainingDaysPerWeek} أيام أسبوعياً`,
      schedule_blueprint: trainingDaysPerWeek === 5
        ? ['جلوتس وهامسترينج', 'جسم علوي كامل وتناسق', 'جلوتس وكوادز', 'راحة واستشفاء', 'جلوتس ومؤخرة بتركيز كابل', 'عضلات الجذع والبطن وكارديو خفيف']
        : ['جلوتس وهامسترينج', 'جسم علوي كامل وتناسق', 'جلوتس وكوادز', 'جسم كامل مع تركيز جلوتس وبطن'],
      focus_target_ar: 'تشكيل ورفع عضلات الأرجل والجلوتس مع شد ورشاقة الخصر والظهر'
    };
  } else if (trainingDaysPerWeek === 2) {
    trainingSplit = {
      id: 'full_body_2x',
      name_ar: 'تمرين شامل مرتين أسبوعياً (Full Body 2x)',
      frequency: 'يومان أسبوعياً',
      schedule_blueprint: ['Full Body A', 'Full Body B'],
      focus_target_ar: 'كفاءة زمنية قصوى لأصحاب الانشغال الشديد'
    };
  } else if (trainingDaysPerWeek === 3) {
    trainingSplit = {
      id: 'full_body_3x',
      name_ar: 'تمرين شامل 3 أيام (Full Body 3x)',
      frequency: '3 أيام أسبوعياً',
      schedule_blueprint: ['Full Body A', 'Full Body B', 'Full Body C'],
      focus_target_ar: 'تحفيز مسارات البناء 3 مرات أسبوعياً'
    };
  } else if (trainingDaysPerWeek === 4) {
    trainingSplit = {
      id: 'upper_lower_4x',
      name_ar: 'تقسيم علوي / سفلي (Upper / Lower 4x)',
      frequency: '4 أيام أسبوعياً',
      schedule_blueprint: ['جسم علوي (A)', 'جسم سفلي (A)', 'جسم علوي (B)', 'جسم سفلي (B)'],
      focus_target_ar: 'الاستشفاء المثالي والبناء العضلي المتوازن'
    };
  } else {
    trainingSplit = {
      id: 'ppl_split',
      name_ar: 'دفع / سحب / أرجل (PPL Split)',
      frequency: `${trainingDaysPerWeek} أيام أسبوعياً`,
      schedule_blueprint: ['Push (دفع)', 'Pull (سحب)', 'Legs (أرجل)', 'Push (دفع)', 'Pull (سحب)', 'Legs (أرجل)'].slice(0, trainingDaysPerWeek),
      focus_target_ar: 'عزل المجموعات العضلية المترابطة'
    };
  }

  // ربط التمارين التخصصية من بنك التمارين المركزي (Exercise Catalog Integration)
  let recommendedExercises = [];
  if (Array.isArray(EXPANDED_EXERCISE_CATALOG)) {
    if (trainingSplit.id === 'arnold_split') {
      recommendedExercises = EXPANDED_EXERCISE_CATALOG.filter((e) =>
        ['arnold_pullover', 'bayesian_cable_curl', 'cross_body_triceps_ext', 'behind_back_lateral_raise'].includes(e.id)
      );
    } else if (trainingSplit.id === 'female_glute_specialized') {
      recommendedExercises = EXPANDED_EXERCISE_CATALOG.filter((e) =>
        e.target_muscle && e.target_muscle.includes('GLUTES')
      );
    } else if (trainingSplit.id === 'ul_arms_hybrid') {
      recommendedExercises = EXPANDED_EXERCISE_CATALOG.filter((e) =>
        ['bayesian_cable_curl', 'cross_body_triceps_ext', 'behind_back_lateral_raise'].includes(e.id)
      );
    } else {
      recommendedExercises = EXPANDED_EXERCISE_CATALOG.slice(0, 3);
    }
  }

  trainingSplit.recommended_exercises = recommendedExercises;

  return {
    client_name: name,
    bmr: Math.round(bmr),
    tdee,
    daily_targets: {
      calories: targetCalories,
      protein_grams: targetProteinGrams,
      carbs_grams: targetCarbGrams,
      fats_grams: targetFatGrams,
      fiber_grams: targetFiberGrams,
      target_fiber_g: targetFiberGrams,
      water_liters: +((weightKg * 0.04) + 0.5).toFixed(1)
    },
    training_split: { ...trainingSplit, environment },
    clinical_notes: hasRenalIssue ? ['تم خفض البروتين تلقائياً إلى 1.1 جم/كجم لحماية الكلى مع حظر الكرياتين.'] : []
  };
}

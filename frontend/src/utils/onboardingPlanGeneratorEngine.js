import { EXPANDED_EXERCISE_CATALOG } from '../constants/exerciseCatalog.js';
import { evaluateMasterClinicalProfile } from './drugInteractionFirewall.js';
import { generateRehabAndMobilityRoutine } from './rehabMobilityEngine.js';

/**
 * Master Onboarding & Split Generator Engine (22-Firewall, Rehab, Home vs Gym & Calibration)
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
  experienceLevel = 'BEGINNER',
  environment = 'GYM',
  homeEquipment = ['DUMBBELLS', 'BODYWEIGHT'],
  benchPressWeightKg = null,
  squatWeightKg = null,
  dislikedFoods = [],
  preferredWorkoutTime = 'EVENING',
  medicalFlags = [],
  medicalConditions = [],
  posturalIssues = [],
  pregnancyTrimester = 'NONE',
  splitPreference = 'AUTO'
}) {
  if (!weightKg || !heightCm || !age) {
    throw new Error('Weight, height, and age are required for baseline calculations.');
  }

  const isMale = String(gender || 'MALE').toUpperCase() === 'MALE';
  let bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
  bmr = isMale ? bmr + 5 : bmr - 161;

  const activityMultipliers = { SEDENTARY: 1.2, LIGHT: 1.375, MODERATE: 1.55, HEAVY: 1.725 };
  const multiplier = activityMultipliers[String(activityLevel || 'SEDENTARY').toUpperCase()] || 1.2;
  const tdee = Math.round(bmr * multiplier);

  let targetCalories = tdee;
  if (goal === 'FAT_LOSS') targetCalories = Math.round(tdee * 0.78);
  else if (goal === 'AGGRESSIVE_CUT') targetCalories = Math.round(tdee * 0.70);
  else if (goal === 'LEAN_BULK') targetCalories = Math.round(tdee * 1.10);

  const absoluteFloor = isMale ? 1500 : 1200;
  targetCalories = Math.max(absoluteFloor, targetCalories);

  const hasRenalIssue = (medicalFlags || []).includes('RENAL_INSUFFICIENCY') || (medicalConditions || []).includes('RENAL_INSUFFICIENCY');
  let proteinRatio = goal === 'LEAN_BULK' ? 1.8 : 2.2;
  if (hasRenalIssue) proteinRatio = 1.1;

  let targetProteinGrams = Math.round(weightKg * proteinRatio);
  const proteinKcal = targetProteinGrams * 4;

  let targetFatGrams = Math.round(weightKg * 0.8);
  if ((targetFatGrams * 9) < (targetCalories * 0.20)) {
    targetFatGrams = Math.round((targetCalories * 0.20) / 9);
  }
  const fatKcal = targetFatGrams * 9;

  const remainingKcal = Math.max(0, targetCalories - (proteinKcal + fatKcal));
  let targetCarbGrams = Math.round(remainingKcal / 4);

  // Exogenous Insulin Safety Floor
  const isInsulinDependent = (medicalFlags || []).includes('INSULIN_DEPENDENT') || (medicalFlags || []).includes('INSULIN') || (medicalConditions || []).includes('TYPE_1_DIABETES') || (medicalConditions || []).includes('TYPE_2_DIABETES_INSULIN');
  if (isInsulinDependent) {
    targetCarbGrams = Math.max(130, targetCarbGrams);
  }

  const isBeginnerEater = (medicalFlags || []).includes('LOW_FIBER_DIET_HISTORY') || (medicalConditions || []).includes('LOW_FIBER_DIET_HISTORY');
  let targetFiberGrams = isBeginnerEater ? 20 : Math.round((targetCalories / 1000) * 14);

  // Merge medical conditions
  const combinedConditions = Array.from(new Set([...(medicalFlags || []), ...(medicalConditions || [])]));

  // Evaluate Master Clinical Profile (22 Conditions)
  const clinicalProfile = evaluateMasterClinicalProfile({
    medicalConditions: combinedConditions,
    pregnancyTrimester,
    weightKg,
    targetCalories,
    targetProteinGrams,
    targetCarbGrams,
    targetFatGrams,
    waterLiters: +((weightKg * 0.04) + 0.5).toFixed(1)
  });

  // Apply clinical adjustments to targets
  targetCalories = clinicalProfile.calories;
  targetProteinGrams = clinicalProfile.proteinGrams;
  targetCarbGrams = clinicalProfile.carbGrams;
  targetFatGrams = clinicalProfile.fatGrams;
  targetFiberGrams = clinicalProfile.fiberGrams;
  const targetWaterLiters = clinicalProfile.waterLiters;

  // =========================================================================
  // نظام توليد التقسيمات التدريبية المتقدمة (Expanded Split Matrix)
  // =========================================================================
  let trainingSplit = {
    id: 'upper_lower',
    name_ar: 'تقسيم علوي / سفلي',
    frequency: '4 أيام أسبوعياً',
    schedule_blueprint: ['جسم علوي (A)', 'جسم سفلي (A)', 'جسم علوي (B)', 'جسم سفلي (B)']
  };

  const pref = String(splitPreference || 'AUTO').toUpperCase();

  if (pref === 'ARNOLD' || pref === 'ARNOLD_SPLIT' || (trainingDaysPerWeek === 6 && pref === 'AUTO' && isMale)) {
    trainingSplit = {
      id: 'arnold_split',
      name_ar: 'تقسيم أرنولد الكلاسيكي (Arnold Split)',
      frequency: '6 أيام أسبوعياً',
      schedule_blueprint: ['صدر وظهر', 'أكتاف وذراعين', 'أرجل وبطن', 'صدر وظهر', 'أكتاف وذراعين', 'أرجل وبطن'],
      focus_target_ar: 'التشريح الكلاسيكي وكثافة تدريب الذراعين والأكتاف'
    };
  } else if (pref === 'UL_ARMS' || pref === 'UL_ARMS_HYBRID' || (trainingDaysPerWeek === 5 && isMale)) {
    trainingSplit = {
      id: 'ul_arms_hybrid',
      name_ar: 'تقسيم علوي / سفلي مدمج بنقاط الضعف (UL+Arms Hybrid)',
      frequency: '5 أيام أسبوعياً',
      schedule_blueprint: ['جسم علوي (قوة)', 'جسم سفلي (قوة)', 'جسم علوي (ضخامة)', 'جسم سفلي (ضخامة)', 'ذراعين وأكتاف وبطن (تخصصي)'],
      focus_target_ar: 'الجمع بين القوة العضلية وتضخيم عضلات الذراعين والأكتاف'
    };
  } else if (pref === 'FEMALE_GLUTE' || pref === 'FEMALE_GLUTE_SPECIALIZED' || (!isMale && trainingDaysPerWeek >= 4)) {
    const gluteDays = Math.min(6, Math.max(4, trainingDaysPerWeek));
    const gluteBlueprint = gluteDays === 4
      ? ['جلوتس وهامسترينج (تركيز استطالة)', 'جسم علوي وبطن (تناسق وتحديد)', 'كوادز وسمانة (تركيز ضخامة)', 'جلوتس وألياف علوية (عزل بالكيبل والباند)']
      : gluteDays === 5
      ? ['جلوتس وهامسترينج', 'جسم علوي وبطن', 'كوادز وسمانة', 'جلوتس عزل', 'جسم علوي وظهر']
      : ['جلوتس وهامسترينج', 'جسم علوي وبطن', 'كوادز وسمانة', 'جلوتس عزل', 'جسم علوي وظهر', 'هامسترينج وبطن'];

    trainingSplit = {
      id: 'female_glute_specialized',
      name_ar: 'تقسيم التناسق الأنثوي والتركيز على الجزء السفلي (Female Glute Focus)',
      frequency: String(gluteDays) + ' أيام أسبوعياً',
      schedule_blueprint: gluteBlueprint,
      focus_target_ar: 'التشريح الفسيولوجي الأنثوي والتركيز البيوميكانيكي على عضلات الحوض والأرداف'
    };
  } else if (trainingDaysPerWeek <= 2 || pref === 'FULL_BODY_2X') {
    trainingSplit = {
      id: 'full_body_2x',
      name_ar: 'تقسيم الجسم الشامل (Full Body 2x)',
      frequency: 'يومان أسبوعياً',
      schedule_blueprint: ['الجسم الشامل (A)', 'الجسم الشامل (B)'],
      focus_target_ar: 'أقصى كفاءة زمنية للمشتركين ذوي الوقت المحدود'
    };
  } else if (trainingDaysPerWeek === 3 || pref === 'FULL_BODY_3X') {
    trainingSplit = {
      id: 'full_body_3x',
      name_ar: 'تقسيم الجسم الشامل (Full Body 3x)',
      frequency: '3 أيام أسبوعياً',
      schedule_blueprint: ['الجسم الشامل (A)', 'الجسم الشامل (B)', 'الجسم الشامل (C)'],
      focus_target_ar: 'تكرار التحفيز العضلي 3 مرات أسبوعياً'
    };
  } else if (trainingDaysPerWeek === 4 || pref === 'UPPER_LOWER_4X') {
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
      frequency: String(trainingDaysPerWeek) + ' أيام أسبوعياً',
      schedule_blueprint: ['Push (دفع)', 'Pull (سحب)', 'Legs (أرجل)', 'Push (دفع)', 'Pull (سحب)', 'Legs (أرجل)'].slice(0, trainingDaysPerWeek),
      focus_target_ar: 'عزل المجموعات العضلية المترابطة'
    };
  }

  // =========================================================================
  // معايرة المستوى التدريبي (Experience Level & Baseline Calibration)
  // =========================================================================
  const expLevel = String(experienceLevel || 'BEGINNER').toUpperCase();
  let trainingPhase = {};
  if (expLevel === 'BEGINNER') {
    trainingPhase = {
      level: 'BEGINNER',
      mode: 'NEURAL_ADAPTATION',
      target_rir: 3,
      description_ar: 'نظام التكيف العصبي للأسبوع الأول بأوزان استكشافية تدريجية ومعدل جهد RIR 3 لمنع الإجهاد العضلي الحاد.'
    };
  } else {
    const benchWorkingKg = benchPressWeightKg ? Math.round(Number(benchPressWeightKg) * 0.75) : null;
    const squatWorkingKg = squatWeightKg ? Math.round(Number(squatWeightKg) * 0.75) : null;
    trainingPhase = {
      level: expLevel,
      mode: 'PROGRESSIVE_OVERLOAD',
      target_rir: 2,
      calibrated_bench_working_kg: benchWorkingKg,
      calibrated_squat_working_kg: squatWorkingKg,
      description_ar: 'معايرة أوزان الجلسة الأولى بنسبة 75% من أقصى وزن معتاد ومعدل جهد RIR 2 للبدء الفوري في الزيادة التدريجية.'
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

  // Home vs Gym Adaptation
  const envType = String(environment || 'GYM').toUpperCase();
  if (envType === 'HOME') {
    recommendedExercises = recommendedExercises.map(ex => {
      let homeAlt = ex.name_ar;
      if (homeEquipment.includes('DUMBBELLS')) {
        homeAlt = ex.name_ar.replace('كيبل', 'دمبلز').replace('جهاز', 'دمبلز');
      } else if (homeEquipment.includes('BANDS')) {
        homeAlt = ex.name_ar.replace('كيبل', 'باند مقاومة').replace('جهاز', 'باند مقاومة');
      } else {
        homeAlt = ex.name_ar.replace('بار', 'وزن الجسم').replace('دمبلز', 'وزن الجسم');
      }
      return {
        ...ex,
        name_ar: homeAlt,
        environment_adapted: 'HOME',
        available_tools: homeEquipment
      };
    });
  }

  // Inject Warmup Ladder Metadata to recommended exercises
  recommendedExercises = recommendedExercises.map(ex => ({
    ...ex,
    exercise_id: ex.id,
    target_rir: trainingPhase.target_rir,
    warmup_ladder: [
      { set_number: 'إحماء 1', load_percent: 40, reps: 10, rest_seconds: 60 },
      { set_number: 'إحماء 2', load_percent: 60, reps: 6, rest_seconds: 90 },
      { set_number: 'تهيئة عصبية', load_percent: 80, reps: 2, rest_seconds: 120 }
    ],
    allow_instant_swap: true
  }));

  trainingSplit.recommended_exercises = recommendedExercises;

  // Generate Rehab and Mobility Routine
  const rehabRoutine = generateRehabAndMobilityRoutine({
    medicalConditions: combinedConditions,
    posturalIssues,
    pregnancyTrimester,
    workoutTarget: trainingSplit.id.includes('lower') || trainingSplit.id.includes('glute') ? 'LOWER' : 'UPPER'
  });

  // Nutrient Timing & Meal Scheduling
  const workoutTime = String(preferredWorkoutTime || 'EVENING').toUpperCase();
  const mealTimingProtocol = {
    preferred_workout_time: workoutTime,
    pre_workout_timing_ar: 'تناول أكبر وجبة نشويات وبروتين قبل موعد التمرين بـ 90 دقيقة لتوفير مخازن الجليكوجين وأعلى ضخ دموي.',
    disliked_foods_excluded: dislikedFoods || []
  };

  const clinicalNotes = [...clinicalProfile.safetyCues];
  if (hasRenalIssue && !clinicalNotes.some(n => n.includes('البروتين'))) {
    clinicalNotes.push('تم خفض البروتين تلقائياً إلى 1.1 جم/كجم لحماية الكلى مع حظر الكرياتين.');
  }
  if (isInsulinDependent && !clinicalNotes.some(n => n.includes('الأنسولين'))) {
    clinicalNotes.push('بروتوكول الأنسولين الإكلينيكي: قفل حد أدنى للكربوهيدرات عند 130 جم لمنع هبوط السكر، مع تفعيل قاعدة 15-15 للطوارئ وتوجيه موضع الحقن بعيداً عن العضلات المستهدفة بالتمرين.');
  }

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
      water_liters: targetWaterLiters
    },
    training_split: { ...trainingSplit, environment: envType },
    training_phase: trainingPhase,
    rehab_routine: rehabRoutine,
    meal_timing_protocol: mealTimingProtocol,
    clinical_profile: clinicalProfile,
    cardio_protocol: clinicalProfile.cardioProtocol,
    clinical_notes: clinicalNotes
  };
}

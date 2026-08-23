import { EXPANDED_EXERCISE_CATALOG } from '../constants/exercise-catalog.js';
import { generateRehabAndMobilityRoutine } from './rehab-mobility-engine.js';
import { evaluateMasterClinicalProfile } from './drug-interaction-firewall.js';


export const HOME_EXERCISE_LIBRARY = {
  CHEST: {
    BODYWEIGHT: [
      { id: 'decline_pushups', name_ar: 'ضغط برجلين مرفوعتين (Decline Pushups)', target_muscle: 'CHEST', target_rep_range: [10, 15] },
      { id: 'standard_pushups', name_ar: 'ضغط أرضي مستوٍ (Standard Pushups)', target_muscle: 'CHEST', target_rep_range: [12, 20] }
    ],
    BANDS: [
      { id: 'band_chest_fly', name_ar: 'تجميع وتفتيح بالباند (Band Chest Fly)', target_muscle: 'CHEST', target_rep_range: [12, 15] },
      { id: 'band_resisted_pushup', name_ar: 'ضغط أرضي مع مقاومة الباند (Band Resisted Pushups)', target_muscle: 'CHEST', target_rep_range: [8, 12] }
    ],
    DUMBBELLS: [
      { id: 'db_floor_press', name_ar: 'تجميع دمبلز على الأرض/دكة (Dumbbell Floor Press)', target_muscle: 'CHEST', target_rep_range: [8, 12] },
      { id: 'db_floor_fly', name_ar: 'تفتيح دمبلز أرضي (Dumbbell Floor Fly)', target_muscle: 'CHEST', target_rep_range: [10, 15] }
    ]
  },
  BACK: {
    BODYWEIGHT: [
      { id: 'inverted_rows', name_ar: 'سحب أفقي على حافة الطاولة/الباب (Inverted Rows)', target_muscle: 'BACK', target_rep_range: [8, 12] },
      { id: 'doorframe_rows', name_ar: 'سحب فردي بوزن الجسم على حلق الباب', target_muscle: 'BACK', target_rep_range: [10, 15] }
    ],
    BANDS: [
      { id: 'band_lat_pulldown', name_ar: 'سحب علوي بالباند (Band Lat Pulldown)', target_muscle: 'BACK', target_rep_range: [12, 15] },
      { id: 'band_seated_row', name_ar: 'سحب أرضي بالباند (Band Seated Row)', target_muscle: 'BACK', target_rep_range: [12, 15] }
    ],
    DUMBBELLS: [
      { id: 'one_arm_db_row', name_ar: 'منشار دمبل فردي (One-Arm DB Row)', target_muscle: 'BACK', target_rep_range: [8, 12] },
      { id: 'db_chest_supported_row', name_ar: 'سحب دمبلز منحني مستند الجذع (DB Row)', target_muscle: 'BACK', target_rep_range: [10, 12] }
    ]
  },
  SHOULDERS: {
    BODYWEIGHT: [
      { id: 'pike_pushups', name_ar: 'ضغط بايك للأكتاف (Pike Pushups)', target_muscle: 'SHOULDERS', target_rep_range: [8, 12] }
    ],
    BANDS: [
      { id: 'band_lateral_raise', name_ar: 'رفرفة جانبية بالباند (Band Lateral Raise)', target_muscle: 'SHOULDERS', target_rep_range: [15, 20] },
      { id: 'band_rear_delt_pull', name_ar: 'رفرفة خلفية وسحب بالباند (Band Rear Delt Pull)', target_muscle: 'SHOULDERS', target_rep_range: [15, 20] }
    ],
    DUMBBELLS: [
      { id: 'seated_db_shoulder_press', name_ar: 'ضغط أكتاف بالدمبلز جالساً (Seated DB Shoulder Press)', target_muscle: 'SHOULDERS', target_rep_range: [8, 12] },
      { id: 'db_lateral_raise', name_ar: 'رفرفة جانبية بالدمبلز (DB Lateral Raise)', target_muscle: 'SHOULDERS', target_rep_range: [12, 15] }
    ]
  },
  LEGS: {
    BODYWEIGHT: [
      { id: 'bulgarian_split_squat_bw', name_ar: 'سكوات بلغاري برجل واحدة (Bulgarian Split Squat)', target_muscle: 'LEGS_QUAD_GLUTE', target_rep_range: [10, 12] },
      { id: 'walking_lunges_bw', name_ar: 'طعنات المشي بوزن الجسم (Bodyweight Walking Lunges)', target_muscle: 'LEGS', target_rep_range: [12, 15] }
    ],
    BANDS: [
      { id: 'band_resistance_lunges', name_ar: 'طعنات بالباند (Band Resistance Lunges)', target_muscle: 'LEGS', target_rep_range: [10, 12] },
      { id: 'band_squat', name_ar: 'سكوات بمقاومة الباند (Band Squat)', target_muscle: 'LEGS', target_rep_range: [12, 15] }
    ],
    DUMBBELLS: [
      { id: 'db_goblet_squat', name_ar: 'سكوات كأس بالدمبل (Goblet Squat)', target_muscle: 'LEGS', target_rep_range: [10, 12] },
      { id: 'db_bulgarian_split_squat', name_ar: 'سكوات بلغاري بالدمبلز (DB Bulgarian Split Squat)', target_muscle: 'LEGS', target_rep_range: [8, 10] }
    ]
  },
  HAMSTRINGS_GLUTES: {
    BODYWEIGHT: [
      { id: 'single_leg_hip_thrust_bw', name_ar: 'هيب ثرست برجل واحدة (Single-Leg Hip Thrust)', target_muscle: 'GLUTES', target_rep_range: [12, 15] },
      { id: 'glute_bridge_bw', name_ar: 'جلوت بريدج بوزن الجسم (Glute Bridge)', target_muscle: 'GLUTES', target_rep_range: [15, 20] }
    ],
    BANDS: [
      { id: 'band_lying_hamstring_curl', name_ar: 'ثني خلفيات بالباند منبطحاً (Lying Band Hamstring Curl)', target_muscle: 'HAMSTRINGS', target_rep_range: [12, 15] },
      { id: 'band_glute_kickback', name_ar: 'كيك باك بالباند للجلوتس (Band Glute Kickback)', target_muscle: 'GLUTES', target_rep_range: [15, 20] }
    ],
    DUMBBELLS: [
      { id: 'db_romanian_deadlift', name_ar: 'ديدليفت روماني بالدمبلز (DB Romanian Deadlift)', target_muscle: 'HAMSTRINGS_GLUTES', target_rep_range: [10, 12] },
      { id: 'db_hip_thrust', name_ar: 'هيب ثرست بالدمبل (Dumbbell Hip Thrust)', target_muscle: 'GLUTES', target_rep_range: [10, 12] }
    ]
  },
  ARMS: {
    BODYWEIGHT: [
      { id: 'diamond_pushups', name_ar: 'ضغط ماسي للترايسبس (Diamond Pushups)', target_muscle: 'TRICEPS', target_rep_range: [8, 12] },
      { id: 'inverted_underhand_rows', name_ar: 'عقلة مقلوبة بقبضة معكوسة للبايسبس', target_muscle: 'BICEPS', target_rep_range: [8, 12] }
    ],
    BANDS: [
      { id: 'band_biceps_curl', name_ar: 'مرجحة بايسبس بالباند (Band Biceps Curl)', target_muscle: 'BICEPS', target_rep_range: [12, 15] },
      { id: 'band_overhead_triceps', name_ar: 'تمديد ترايسبس بالباند فوق الرأس (Band Overhead Triceps)', target_muscle: 'TRICEPS', target_rep_range: [12, 15] }
    ],
    DUMBBELLS: [
      { id: 'db_alternating_biceps_curl', name_ar: 'مرجحة دمبلز تبادل للبايسبس (DB Alternating Curl)', target_muscle: 'BICEPS', target_rep_range: [10, 12] },
      { id: 'db_overhead_triceps_ext', name_ar: 'مد ترايسبس بالدمبل خلف الرأس (Overhead DB Triceps Extension)', target_muscle: 'TRICEPS', target_rep_range: [10, 12] }
    ]
  }
};


export function generateInitialPlan({
  name = 'المتدرب',
  gender = 'MALE',
  age = 25,
  weightKg = 75,
  heightCm = 175,
  activityLevel = 'LIGHT',
  goal = 'FAT_LOSS',
  trainingDaysPerWeek = 4,
  experienceLevel = 'BEGINNER',
  environment = 'GYM',
  homeEquipment = [],
  benchPressWeightKg = null,
  squatWeightKg = null,
  dislikedFoods = [],
  medicalFlags = [],
  medicalConditions = [],
  posturalIssues = [],
  pregnancyTrimester = 'NONE',
  preferredWorkoutTime = 'EVENING',
  splitPreference = 'AUTO'
}) {
  const isMale = String(gender).toUpperCase() === 'MALE';
  const ageNum = Number(age) || 25;
  const weightNum = Number(weightKg) || 75;
  const heightNum = Number(heightCm) || 175;

  // 1. حساب معدل الأيض الأساسي (Mifflin-St Jeor)
  let bmr = (10 * weightNum) + (6.25 * heightNum) - (5 * ageNum);
  bmr = isMale ? bmr + 5 : bmr - 161;

  // 2. معامل النشاط البدني
  const activityMultipliers = {
    SEDENTARY: 1.2,
    LIGHT: 1.375,
    MODERATE: 1.55,
    HEAVY: 1.725
  };
  const actKey = String(activityLevel).toUpperCase();
  const tdee = Math.round(bmr * (activityMultipliers[actKey] || 1.375));

  // 3. ضبط السعرات حسب الهدف
  let targetCalories = tdee;
  const goalNorm = String(goal).toUpperCase();
  if (goalNorm === 'FAT_LOSS') {
    targetCalories = Math.round(tdee * 0.78);
  } else if (goalNorm === 'AGGRESSIVE_CUT') {
    targetCalories = Math.round(tdee * 0.70);
  } else if (goalNorm === 'LEAN_BULK') {
    targetCalories = Math.round(tdee * 1.10);
  } else if (goalNorm === 'MAINTENANCE') {
    targetCalories = tdee;
  }

  // 4. توزيع الماكروز القاعدي
  let targetProteinGrams = Math.round(weightNum * (isMale ? 2.2 : 2.0));
  let targetFatGrams = Math.round(weightNum * 0.85);
  let remainingCals = targetCalories - (targetProteinGrams * 4 + targetFatGrams * 9);
  let targetCarbGrams = Math.max(50, Math.round(remainingCals / 4));

  // 5. دمج الحالات الطبية وتقييم جدار الحماية الإكلينيكي
  const combinedConditions = Array.from(new Set([...medicalConditions, ...medicalFlags]));
  
  const masterClinicalProfile = evaluateMasterClinicalProfile({
    medicalConditions: combinedConditions,
    pregnancyTrimester,
    weightKg: weightNum,
    targetCalories,
    targetProteinGrams,
    targetCarbGrams,
    targetFatGrams,
    waterLiters: Math.max(3.5, Math.round((weightNum * 0.045) * 10) / 10)
  });

  // Re-adjust carbs if calories or protein changed
  const finalCalories = masterClinicalProfile.calories;
  const finalProtein = masterClinicalProfile.proteinGrams;
  const finalFat = masterClinicalProfile.fatGrams;
  const finalCarb = Math.max(
    masterClinicalProfile.carbGrams,
    Math.round((finalCalories - (finalProtein * 4 + finalFat * 9)) / 4)
  );

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
  const envType = String(environment || 'GYM').toUpperCase();
  const normalizedHomeTools = Array.isArray(homeEquipment) ? homeEquipment : [homeEquipment];

  if (envType === 'HOME') {
    // التوليد الحتمي لبنك التمارين المنزلي متعدد الأدوات
    const hasDumbbells = normalizedHomeTools.includes('DUMBBELLS') || normalizedHomeTools.includes('BARBELL') || normalizedHomeTools.includes('MULTI_GYM');
    const hasBands = normalizedHomeTools.includes('BANDS');
    const toolTier = hasDumbbells ? 'DUMBBELLS' : hasBands ? 'BANDS' : 'BODYWEIGHT';

    recommendedExercises = [
      HOME_EXERCISE_LIBRARY.CHEST[toolTier][0],
      HOME_EXERCISE_LIBRARY.BACK[toolTier][0],
      HOME_EXERCISE_LIBRARY.LEGS[toolTier][0],
      HOME_EXERCISE_LIBRARY.HAMSTRINGS_GLUTES[toolTier][0],
      HOME_EXERCISE_LIBRARY.SHOULDERS[toolTier][0],
      HOME_EXERCISE_LIBRARY.ARMS[toolTier][0]
    ].filter(Boolean);

    recommendedExercises = recommendedExercises.map(ex => ({
      ...ex,
      environment_adapted: 'HOME',
      available_tools: normalizedHomeTools
    }));
  } else {
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
  trainingSplit.environment = envType;

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

  // =========================================================================
  // Home Cardio Protocol Integration (مصفوفة الكارديو المنزلي التلقائي)
  // =========================================================================
  let finalCardioProtocol = masterClinicalProfile.cardioProtocol || { type: 'LISS', equipment: 'INCLINE_TREADMILL', dailySteps: 8000 };

  if (envType === 'HOME') {
    const hasHomeTreadmill = normalizedHomeTools.includes('TREADMILL');
    const hasHomeBike = normalizedHomeTools.includes('STATIONARY_BIKE');
    const hasKneeOrVaricose = combinedConditions.some(c => ['PATELLAR_TENDINITIS', 'HERNIA_VARICOSE'].includes(c));

    if (hasHomeTreadmill) {
      if (hasKneeOrVaricose && hasHomeBike) {
        finalCardioProtocol = {
          type: 'LISS',
          equipment: 'HOME_STATIONARY_BIKE',
          duration_minutes: 30,
          resistance_level: 'خفيفة إلى متوسطة (Zone 2)',
          notes_ar: 'التدريب على الدراجة الثابتة بالمنزل لتجنب الضغط على صابونة الركبة والأوردة.'
        };
      } else if (hasKneeOrVaricose) {
        finalCardioProtocol = {
          type: 'LISS',
          equipment: 'HOME_TREADMILL',
          duration_minutes: 25,
          speed_kmh: '4.0 - 4.5 كم/س',
          incline_percent: '0-1% (مشي مستوٍ خفيف)',
          notes_ar: 'المشي المستوي على المشاية بدون انحدار حاد لحماية مفصل الركبة وتخفيف الحمل على الأوردة.'
        };
      } else {
        finalCardioProtocol = {
          type: 'LISS',
          equipment: 'HOME_TREADMILL',
          duration_minutes: 25,
          speed_kmh: '4.5 - 5.5 كم/س',
          incline_percent: '4-6% (مشي مائل)',
          notes_ar: 'بروتوكول المشي المائل على المشاية الكهربائية المنزلية (سرعة 4.5-5.5 كم/س، ميل 4-6%) لتعظيم حرق الدهون دون فقد الكتلة العضلية.'
        };
      }
    } else if (hasHomeBike) {
      finalCardioProtocol = {
        type: 'LISS',
        equipment: 'HOME_STATIONARY_BIKE',
        duration_minutes: 30,
        resistance_level: 'متوسطة (Zone 2)',
        notes_ar: 'بروتوكول الدراجة الثابتة المنزلية بنطاق نبض Zone 2 لمدة 30 دقيقة لحرق الدهون وتحسين كفاءة القلب.'
      };
    } else {
      finalCardioProtocol = {
        type: 'LISS',
        equipment: 'OUTDOOR_OR_INDOOR_STEPS',
        dailySteps: masterClinicalProfile.cardioProtocol.dailySteps || 8000,
        notes_ar: 'المشي اليومي الحر لتحقيق مستهدف ' + (masterClinicalProfile.cardioProtocol.dailySteps || 8000) + ' خطوة.'
      };
    }
  }

  return {
    client_name: name,
    bmr,
    tdee,
    daily_targets: {
      calories: finalCalories,
      protein_grams: finalProtein,
      carbs_grams: finalCarb,
      fats_grams: finalFat,
      fiber_grams: masterClinicalProfile.fiberGrams,
      target_fiber_g: masterClinicalProfile.fiberGrams,
      water_liters: masterClinicalProfile.waterLiters
    },
    training_split: trainingSplit,
    training_phase: trainingPhase,
    rehab_routine: rehabRoutine,
    meal_timing_protocol: mealTimingProtocol,
    clinical_profile: masterClinicalProfile,
    cardio_protocol: finalCardioProtocol,
    clinical_notes: masterClinicalProfile.safetyCues
  };
}

/**
 * Master Frontend Exercise Translation & Display Engine
 * Rule: ANY exercise name MUST have English as PRIMARY and Arabic as SECONDARY.
 */

export const MASTER_EXERCISE_DICTIONARY = Object.freeze({
  HIGH_TO_LOW_CABLE_FLY: {
    name_en: "High-to-Low Cable Fly",
    name_ar: "تفتيح كابل من أعلى لأسفل (عزل الصدر السفلي)",
  },
  STRAIGHT_ARM_LAT_PULLDOWN: {
    name_en: "Straight-Arm Cable Lat Pulldown",
    name_ar: "سحب مستقيم الذراعين بالكابل (عزل اللاتس الكامل)",
  },
  ROTATOR_CUFF_EXTERNAL_ROTATION: {
    name_en: "Cable / DB Rotator Cuff External Rotation",
    name_ar: "تدوير الكتف الخارجي (وقاية وتثبيت الكفة المدورة)",
  },
  SEATED_HIP_ADDUCTION_MACHINE: {
    name_en: "Seated Machine Hip Adductor",
    name_ar: "جهاز ضم الفخذ جالس (عضلات الفخذ الضامة)",
  },
  COPENHAGEN_PLANK: {
    name_en: "Copenhagen Adductor Plank",
    name_ar: "بلانك كوبنهاجن لتقوية الضامة وثبات الركبة",
  },
  KAS_GLUTE_BRIDGE: {
    name_en: "Kas Glute Bridge",
    name_ar: "كاس جلوت بريدج بالبار (عزل قصر وانقباض الجلوتس)",
  },
  CABLE_45_GLUTE_KICKBACK: {
    name_en: "Standing 45-Degree Diagonal Cable Glute Kickback",
    name_ar: "ركل خلفي قطري بالكابل بزاوية 45°",
  },
  GLUTE_BIASED_45_HYPEREXTENSION: {
    name_en: "Glute-Biased 45-Degree Hyperextension",
    name_ar: "تمديد ظهر 45 درجة بتركيز الجلوتس الكامل",
  },
  B_STANCE_RDL: {
    name_en: "B-Stance Dumbbell Romanian Deadlift",
    name_ar: "ديدليفت روماني أحادي بوضعية B-Stance بالدمبلز",
  },
  SEATED_HIP_ABDUCTION_LEAN_FORWARD: {
    name_en: "Seated Hip Abduction (Torso Leaned Forward)",
    name_ar: "جهاز تفتيح الأرجل جالس مع ميل الجذع للأمام",
  },
  DEFICIT_REVERSE_LUNGE: {
    name_en: "Deficit Reverse Lunge with Torso Forward Lean",
    name_ar: "طعنات خلفية من منصة مرتفعة بتركيز الجلوتس",
  },
  STOMACH_VACUUM: {
    name_en: "Stomach Vacuum TVA Isometric Activation",
    name_ar: "تمرين شفط البطن لنحت الخصر (Stomach Vacuum)",
  },

  CABLE_GLUTE_KICKBACK: {
    name_en: "Cable Glute Kickback",
    name_ar: "ركل خلفي بالكابل لعزل الجلوتس",
  },
  SEATED_HIP_ABDUCTION_MACHINE: {
    name_en: "Seated Hip Abduction Machine",
    name_ar: "جهاز تفتيح الأرجل جالس لعزل الجلوتس",
  },
  CHEST_SUPPORTED_INCLINE_DB_ROW: {
    name_en: "Chest-Supported Incline Dumbbell Row",
    name_ar: "تجديف دمبل مسنود الصدر على بنش مائل",
  },

  SINGLE_ARM_CABLE_LAT_PULLDOWN: {
    name_en: "Single-Arm Iliac Cable Lat Pulldown",
    name_ar: "سحب لاتس فردي كابل بزاوية 45 درجة",
  },
  BEHIND_BACK_CABLE_LATERAL_RAISE: {
    name_en: "Behind-the-Back Cable Lateral Raise",
    name_ar: "رفرفة جانبية بالكابل خلف الظهر",
  },
  PALLOF_PRESS: {
    name_en: "Anti-Rotation Cable / Band Pallof Press",
    name_ar: "بالوف بريس كابل / حبل لمقاومة الدوران",
  },

  // --- CHEST (HORIZONTAL & INCLINE PUSH) ---
  BARBELL_BENCH_PRESS: {
    name_en: "Barbell Bench Press",
    name_ar: "بنش برس بالبار مستوي",
  },
  INCLINE_BARBELL_BENCH_PRESS: {
    name_en: "Incline Barbell Bench Press",
    name_ar: "بنش برس مائل بالبار",
  },
  BARBELL_INCLINE_BENCH_PRESS: {
    name_en: "Incline Barbell Bench Press",
    name_ar: "بنش برس مائل بالبار",
  },
  DUMBBELL_BENCH_PRESS: {
    name_en: "Flat Dumbbell Bench Press",
    name_ar: "بنش برس بالدمبل مستوي",
  },
  DUMBBELL_FLAT_BENCH_PRESS: {
    name_en: "Flat Dumbbell Bench Press",
    name_ar: "بنش برس بالدمبل مستوي",
  },
  INCLINE_DUMBBELL_BENCH_PRESS: {
    name_en: "Incline Dumbbell Bench Press",
    name_ar: "بنش برس مائل بالدمبل",
  },
  DUMBBELL_INCLINE_BENCH_PRESS: {
    name_en: "Incline Dumbbell Bench Press",
    name_ar: "بنش برس مائل بالدمبل",
  },
  DUMBBELL_FLOOR_PRESS: {
    name_en: "Dumbbell Floor Press",
    name_ar: "فلور بريس بالدمبل على الأرض",
  },
  PUSH_UPS_STANDARD: {
    name_en: "Push-Up",
    name_ar: "تمرين الضغط القياسي بوزن الجسم",
  },
  PUSH_UP: {
    name_en: "Push-Up",
    name_ar: "تمرين الضغط القياسي بوزن الجسم",
  },
  FEET_ELEVATED_PUSH_UP: {
    name_en: "Decline Push-Up",
    name_ar: "ضغط مائل مع رفع القدمين للصدر العلوي",
  },
  CLOSE_GRIP_PUSH_UP: {
    name_en: "Close-Grip Push-Up",
    name_ar: "ضغط قبضة ضيقة للترايسبس والصدر الداخلي",
  },
  DIPS: {
    name_en: "Parallel Bar Dips",
    name_ar: "تمرين المتوازي للصدر وأسفل الصدر",
  },
  CHEST_FLY_DUMBBELL: {
    name_en: "Dumbbell Chest Fly",
    name_ar: "تفتيح صدر بالدمبل مستوي",
  },
  CABLE_CROSSOVER: {
    name_en: "Cable Crossover Fly",
    name_ar: "تقاطع كيبل للصدر الأوسط",
  },

  // --- BACK (HORIZONTAL & VERTICAL PULL) ---
  BARBELL_BENT_OVER_ROW: {
    name_en: "Barbell Bent-Over Row",
    name_ar: "تجديف بالبار منحني الظهر",
  },
  ONE_ARM_DUMBBELL_ROW: {
    name_en: "One-Arm Dumbbell Row",
    name_ar: "منشار تجديف فردي بالدمبل",
  },
  SEATED_CABLE_ROW: {
    name_en: "Seated Cable Row",
    name_ar: "سحب أرضي على الكيبل للظهر",
  },
  CHEST_SUPPORTED_T_BAR_ROW: {
    name_en: "Chest-Supported T-Bar Row",
    name_ar: "تجديف تي بار مع تثبيت الصدر",
  },
  T_BAR_ROW: {
    name_en: "T-Bar Row",
    name_ar: "تجديف تي بار للظهر",
  },
  LAT_PULLDOWN: {
    name_en: "Lat Pulldown",
    name_ar: "سحب عالي للظهر قبضة واسعة",
  },
  CLOSE_GRIP_LAT_PULLDOWN: {
    name_en: "Close-Grip Lat Pulldown",
    name_ar: "سحب عالي قبضة ضيقة للظهر",
  },
  PULL_UPS: {
    name_en: "Pull-Up",
    name_ar: "عقلة قبضة واسعة لتعريض الظهر",
  },
  PULL_UP: {
    name_en: "Pull-Up",
    name_ar: "عقلة قبضة واسعة لتعريض الظهر",
  },
  CHIN_UPS: {
    name_en: "Chin-Up",
    name_ar: "عقلة قبضة مقلوبة للبايسبس والظهر",
  },
  CHIN_UP: {
    name_en: "Chin-Up",
    name_ar: "عقلة قبضة مقلوبة للبايسبس والظهر",
  },
  INVERTED_ROW: {
    name_en: "Inverted Bodyweight Row",
    name_ar: "سحب عكسي بوزن الجسم",
  },
  STRAIGHT_ARM_CABLE_PULLDOWN: {
    name_en: "Straight-Arm Cable Pulldown",
    name_ar: "سحب ذراع مستقيم على الكيبل للاتس",
  },

  // --- LEGS: QUADS & SQUATS (KNEE DOMINANT & UNILATERAL) ---
  BARBELL_BACK_SQUAT: {
    name_en: "Barbell Back Squat",
    name_ar: "سكوات بالبار الخلفي للرجلين",
  },
  BARBELL_FRONT_SQUAT: {
    name_en: "Barbell Front Squat",
    name_ar: "سكوات أمامي بالبار للفخذ الأمامي",
  },
  GOBLET_SQUAT: {
    name_en: "Dumbbell Goblet Squat",
    name_ar: "جوبلت سكوات بالدمبل",
  },
  LEG_PRESS_MACHINE: {
    name_en: "Leg Press Machine",
    name_ar: "دفع الأرجل على جهاز المكبس",
  },
  LEG_PRESS: {
    name_en: "Leg Press Machine",
    name_ar: "دفع الأرجل على جهاز المكبس",
  },
  SMITH_MACHINE_SQUAT: {
    name_en: "Smith Machine Squat",
    name_ar: "سكوات على جهاز السميث",
  },
  BODYWEIGHT_AIR_SQUAT: {
    name_en: "Bodyweight Air Squat",
    name_ar: "سكوات حر بوزن الجسم",
  },
  BODYWEIGHT_SQUAT: {
    name_en: "Bodyweight Squat",
    name_ar: "سكوات حر بوزن الجسم",
  },
  SPLIT_SQUAT: {
    name_en: "Split Squat",
    name_ar: "سكوات فردي / سبليت سكوات بوزن الجسم",
  },
  BODYWEIGHT_SPLIT_SQUAT: {
    name_en: "Bodyweight Split Squat",
    name_ar: "سكوات فردي / سبليت سكوات بوزن الجسم",
  },
  BULGARIAN_SPLIT_SQUAT: {
    name_en: "Bulgarian Split Squat",
    name_ar: "بلغاريان سبليت سكوات فردي بالدمبل",
  },
  DUMBBELL_LUNGES: {
    name_en: "Dumbbell Walking Lunges",
    name_ar: "طعنات المشي بالدمبل",
  },
  WALKING_LUNGES_DUMBBELL: {
    name_en: "Dumbbell Walking Lunges",
    name_ar: "طعنات المشي بالدمبل",
  },
  DUMBBELL_REVERSE_LUNGE: {
    name_en: "Dumbbell Reverse Lunge",
    name_ar: "طعنات عكسية بالدمبل للأرجل",
  },
  REVERSE_LUNGE: {
    name_en: "Reverse Lunge",
    name_ar: "طعنات خلفية عكسية للأرجل",
  },
  LEG_EXTENSION_MACHINE: {
    name_en: "Leg Extension Machine",
    name_ar: "رفرفة أمامية للأرجل على الجهاز",
  },
  HACK_SQUAT: {
    name_en: "Hack Squat Machine",
    name_ar: "هاك سكوات على الجهاز للرجلين",
  },

  // --- LEGS: HAMSTRINGS, GLUTES & CALVES (HIP HINGE & KNEE FLEXION) ---
  BARBELL_CONVENTIONAL_DEADLIFT: {
    name_en: "Conventional Deadlift",
    name_ar: "ديدليفت تقليدي بالبار للأرجل والظهر",
  },
  DEADLIFT: {
    name_en: "Conventional Deadlift",
    name_ar: "ديدليفت تقليدي بالبار للأرجل والظهر",
  },
  SINGLE_LEG_RDL_BODYWEIGHT: {
    name_en: "Single-Leg Romanian Deadlift (Bodyweight)",
    name_ar: "ديدليفت روماني برجل واحدة بوزن الجسم",
  },
  DUMBBELL_GLUTE_BRIDGE: {
    name_en: "Dumbbell Glute Bridge",
    name_ar: "جلوت بريدج بالدمبل على الحوض للأرداف",
  },
  BARBELL_ROMANIAN_DEADLIFT: {
    name_en: "Barbell Romanian Deadlift (RDL)",
    name_ar: "ديدليفت روماني بالبار للأرجل الخلفية",
  },
  ROMANIAN_DEADLIFT: {
    name_en: "Barbell Romanian Deadlift (RDL)",
    name_ar: "ديدليفت روماني بالبار للأرجل الخلفية",
  },
  DUMBBELL_ROMANIAN_DEADLIFT: {
    name_en: "Dumbbell Romanian Deadlift",
    name_ar: "ديدليفت روماني بالدمبل للخلفيات",
  },
  BARBELL_HIP_THRUST: {
    name_en: "Barbell Hip Thrust",
    name_ar: "هيب ثرست بالبار للمؤخرة والأرداف",
  },
  HIP_THRUST: {
    name_en: "Hip Thrust",
    name_ar: "هيب ثرست للأرداف",
  },
  BODYWEIGHT_GLUTE_BRIDGE: {
    name_en: "Glute Bridge",
    name_ar: "جلوت بريدج بوزن الجسم للأرداف",
  },
  GLUTE_BRIDGE: {
    name_en: "Glute Bridge",
    name_ar: "جلوت بريدج بوزن الجسم للأرداف",
  },
  HAMSTRING_WALKOUT: {
    name_en: "Hamstring Walkout",
    name_ar: "مشية أوتار الركبة بوزن الجسم للخلفيات",
  },
  LYING_LEG_CURL_MACHINE: {
    name_en: "Lying Leg Curl Machine",
    name_ar: "مرجحة أرجل خلفية نائماً على الجهاز",
  },
  LEG_CURL_MACHINE: {
    name_en: "Lying Leg Curl Machine",
    name_ar: "مرجحة أرجل خلفية نائماً على الجهاز",
  },
  LEG_CURL: {
    name_en: "Leg Curl Machine",
    name_ar: "مرجحة أرجل خلفية على الجهاز",
  },
  HAMSTRING_CURL: {
    name_en: "Leg Curl Machine",
    name_ar: "ثني الأرجل الخلفية على الجهاز",
  },
  CALF_RAISE_STANDING: {
    name_en: "Standing Calf Raise",
    name_ar: "رفع عضلة السمانة واقفاً",
  },
  DUMBBELL_CALF_RAISE: {
    name_en: "Dumbbell Calf Raise",
    name_ar: "رفع السمانة بالدمبل واقفاً",
  },
  CALF_RAISE_SEATED: {
    name_en: "Seated Calf Raise",
    name_ar: "رفع عضلة السمانة جالساً على الجهاز",
  },
  CALF_RAISE: {
    name_en: "Calf Raise",
    name_ar: "تمرين عضلة السمانة",
  },

  // --- SHOULDERS (VERTICAL PUSH & ISOLATION) ---
  BARBELL_OVERHEAD_PRESS: {
    name_en: "Barbell Overhead Press (OHP)",
    name_ar: "ضغط كتف بالبار واقفاً",
  },
  OVERHEAD_PRESS: {
    name_en: "Barbell Overhead Press (OHP)",
    name_ar: "ضغط كتف بالبار واقفاً",
  },
  STANDING_DUMBBELL_SHOULDER_PRESS: {
    name_en: "Standing Dumbbell Shoulder Press",
    name_ar: "ضغط كتف بالدمبل واقفاً",
  },
  DUMBBELL_SHOULDER_PRESS: {
    name_en: "Standing Dumbbell Shoulder Press",
    name_ar: "ضغط كتف بالدمبل",
  },
  SEATED_DUMBBELL_SHOULDER_PRESS: {
    name_en: "Seated Dumbbell Shoulder Press",
    name_ar: "ضغط كتف بالدمبل جالساً",
  },
  PIKE_PUSH_UP: {
    name_en: "Pike Push-Up",
    name_ar: "ضغط بايك للأكتاف بوزن الجسم",
  },
  DUMBBELL_LATERAL_RAISE: {
    name_en: "Dumbbell Lateral Raise",
    name_ar: "رفرفة جانبية للأكتاف بالدمبل",
  },
  LATERAL_RAISE: {
    name_en: "Dumbbell Lateral Raise",
    name_ar: "رفرفة جانبية للأكتاف بالدمبل",
  },
  CABLE_LATERAL_RAISE: {
    name_en: "Cable Lateral Raise",
    name_ar: "رفرفة جانبية للأكتاف على الكيبل",
  },
  FACE_PULLS: {
    name_en: "Cable Face Pulls",
    name_ar: "سحب فيس بول على الكيبل للكتف الخلفي",
  },
  FACE_PULL: {
    name_en: "Cable Face Pulls",
    name_ar: "سحب فيس بول على الكيبل للكتف الخلفي",
  },
  BAND_FACE_PULL: {
    name_en: "Band Face Pull",
    name_ar: "سحب فيس بول بحبل المقاومة للكتف الخلفي",
  },
  REAR_DELT_FLY_DUMBBELL: {
    name_en: "Rear Delt Dumbbell Fly",
    name_ar: "رفرفة كتف خلفي بالدمبل منحني",
  },
  DUMBBELL_REAR_DELT_RAISE: {
    name_en: "Dumbbell Rear Delt Raise",
    name_ar: "رفرفة كتف خلفي بالدمبل منحني",
  },
  REAR_DELT_RAISE: {
    name_en: "Rear Delt Raise",
    name_ar: "رفرفة كتف خلفي",
  },
  FRONT_RAISE: {
    name_en: "Front Dumbbell Raise",
    name_ar: "رفرفة أمامية للأكتاف بالدمبل",
  },
  DUMBBELL_SHRUG: {
    name_en: "Dumbbell Shrugs",
    name_ar: "هز أكتاف وترابيس بالدمبل",
  },
  BARBELL_SHRUG: {
    name_en: "Barbell Shrugs",
    name_ar: "هز أكتاف وترابيس بالبار",
  },

  // --- ARMS: BICEPS & TRICEPS ---
  BARBELL_BICEPS_CURL: {
    name_en: "Barbell Biceps Curl",
    name_ar: "مرجحة بايسبس بالبار مستوي",
  },
  DUMBBELL_BICEPS_CURL: {
    name_en: "Dumbbell Biceps Curl",
    name_ar: "مرجحة بايسبس بالدمبل متبادل",
  },
  DUMBBELL_CURL: {
    name_en: "Dumbbell Biceps Curl",
    name_ar: "مرجحة بايسبس بالدمبل متبادل",
  },
  BAND_BICEPS_CURL: {
    name_en: "Band Biceps Curl",
    name_ar: "مرجحة بايسبس بحبل المقاومة",
  },
  HAMMER_CURL_DUMBBELL: {
    name_en: "Dumbbell Hammer Curl",
    name_ar: "مرجحة شاكوش بالدمبل للبايسبس والساعد",
  },
  DUMBBELL_HAMMER_CURL: {
    name_en: "Dumbbell Hammer Curl",
    name_ar: "مرجحة شاكوش بالدمبل للبايسبس والساعد",
  },
  HAMMER_CURL: {
    name_en: "Dumbbell Hammer Curl",
    name_ar: "مرجحة شاكوش بالدمبل للبايسبس والساعد",
  },
  INCLINE_DUMBBELL_CURL: {
    name_en: "Incline Dumbbell Biceps Curl",
    name_ar: "مرجحة بايسبس على بنش مائل بالدمبل",
  },
  PREACHER_CURL: {
    name_en: "Preacher Biceps Curl",
    name_ar: "مرجحة بايسبس على مسند الواعظ",
  },
  CONCENTRATION_CURL: {
    name_en: "Dumbbell Concentration Curl",
    name_ar: "مرجحة تركيز فردي بالدمبل",
  },
  CABLE_BICEPS_CURL: {
    name_en: "Cable Biceps Curl",
    name_ar: "مرجحة بايسبس على الكيبل",
  },
  TRICEPS_ROPE_PUSHDOWN: {
    name_en: "Cable Triceps Rope Pushdown",
    name_ar: "سحب ترايسبس بالحبل على الكيبل",
  },
  CABLE_TRICEPS_PUSHDOWN: {
    name_en: "Cable Triceps Rope Pushdown",
    name_ar: "سحب ترايسبس بالحبل على الكيبل",
  },
  TRICEPS_PUSHDOWN: {
    name_en: "Cable Triceps Pushdown",
    name_ar: "دفع ترايسبس على الكيبل للأسفل",
  },
  BAND_TRICEPS_EXTENSION: {
    name_en: "Band Triceps Extension",
    name_ar: "مد ترايسبس بحبل المقاومة",
  },
  SKULL_CRUSHER_BARBELL: {
    name_en: "Barbell Skull Crusher",
    name_ar: "كسارة جمجمة بالبار للترايسبس مستلقي",
  },
  SKULL_CRUSHER: {
    name_en: "Barbell Skull Crusher",
    name_ar: "كسارة جمجمة بالبار للترايسبس مستلقي",
  },
  OVERHEAD_DUMBBELL_TRICEPS_EXTENSION: {
    name_en: "Overhead Dumbbell Triceps Extension",
    name_ar: "مد ترايسبس خلف الرأس بالدمبل",
  },
  OVERHEAD_CABLE_TRICEPS_EXTENSION: {
    name_en: "Overhead Cable Triceps Extension",
    name_ar: "مد ترايسبس خلف الرأس بالكابل",
  },
  OVERHEAD_TRICEPS_EXTENSION: {
    name_en: "Overhead Triceps Extension",
    name_ar: "مد ترايسبس خلف الرأس",
  },
  TRICEPS_KICKBACK_DUMBBELL: {
    name_en: "Dumbbell Triceps Kickback",
    name_ar: "ركلة خلفية للترايسبس بالدمبل",
  },

  // --- CORE & ABS (STABILITY & ANTI-EXTENSION) ---
  PLANK: {
    name_en: "Plank Hold",
    name_ar: "تمرين البلانك الثابت لعضلات الكور",
  },
  FRONT_PLANK: {
    name_en: "Front Plank",
    name_ar: "بلانك أمامي لعضلات البطن والجذع",
  },
  DEAD_BUG: {
    name_en: "Dead Bug",
    name_ar: "تمرين الحشرة الميتة لاستقرار الكور والبطن",
  },
  DEADBUG: {
    name_en: "Dead Bug",
    name_ar: "تمرين الحشرة الميتة لاستقرار الكور والبطن",
  },
  HANGING_LEG_RAISE: {
    name_en: "Hanging Leg Raise",
    name_ar: "رفع أرجل على العقلة للبطن السفلية",
  },
  HANGING_KNEE_RAISE: {
    name_en: "Hanging Knee Raise",
    name_ar: "رفع ركب على العقلة للبطن السفلية",
  },
  CABLE_WOODCHOP: {
    name_en: "Cable Woodchopper",
    name_ar: "حطاب الشجر على الكيبل للخصر والجانبيات",
  },
  AB_WHEEL_ROLLOUT: {
    name_en: "Ab Wheel Rollout",
    name_ar: "عجلة البطن لعضلات الجذع والكور",
  },
  CRUNCHES: {
    name_en: "Abdominal Crunches",
    name_ar: "طحن البطن التقليدي",
  },
  BICYCLE_CRUNCH: {
    name_en: "Bicycle Crunches",
    name_ar: "دراجة البطن للجانبيات وعضلات البطن",
  },
  RUSSIAN_TWIST: {
    name_en: "Russian Twist",
    name_ar: "تويست روسي لعضلات الخصر والجانبيات",
  },
  BIRD_DOG: {
    name_en: "Bird Dog",
    name_ar: "تمرين بيرد دوج لاستقرار أسفل الظهر والكور",
  },
  SIDE_PLANK: {
    name_en: "Side Plank",
    name_ar: "بلانك جانبي لعضلات الخصر",
  },
  // Additional platform & stress-test exercises
  INCLINE_DUMBBELL_PRESS: {
    name_en: "Incline Dumbbell Bench Press 30°",
    name_ar: "ضغط دمبلز بنش مائل 30°",
  },
  SEATED_DUMBBELL_LATERAL_RAISE: {
    name_en: "Seated Dumbbell Lateral Raise",
    name_ar: "رفرفة كتف جانبي دمبلز جالس",
  },
  CABLE_ROPE_TRICEPS_PUSHDOWN: {
    name_en: "Cable Rope Triceps Pushdown",
    name_ar: "سحب ترايسبس حبل كابل",
  },
  DB_FLOOR_PRESS: {
    name_en: "Dumbbell Floor Press",
    name_ar: "ضغط صدر دمبلز من الأرض",
  },
  CHEST_SUPPORTED_DB_ROW: {
    name_en: "Chest-Supported Dumbbell Row",
    name_ar: "سحب دمبلز مسنود على كرسي",
  },
  CHAIR_GOBLET_SQUAT: {
    name_en: "Chair Goblet Squat",
    name_ar: "سكوات جوبلت دمبلز للكرسي",
  },
  DB_ROMANIAN_DEADLIFT: {
    name_en: "Dumbbell Romanian Deadlift",
    name_ar: "ديدليفت روماني بدمبلز خفيفة",
  },
  SEATED_LEG_PRESS_MODERATE: {
    name_en: "Seated Leg Press Machine",
    name_ar: "دفع أرجل على الجهاز بوزن معتدل",
  },
  SEATED_CHEST_PRESS: {
    name_en: "Seated Chest Press Machine",
    name_ar: "جهاز دفع صدر جالس مسنود",
  },
  MACHINE_CHEST_PRESS: {
    name_en: "Machine Chest Press",
    name_ar: "جهاز دفع صدر مسنود",
  },
  DB_SPLIT_SQUAT: {
    name_en: "Dumbbell Split Squat",
    name_ar: "دمبلز سبليت سكوات قائم",
  },
  STANDING_CALF_RAISE: {
    name_en: "Standing Machine Calf Raise",
    name_ar: "رفع سمانة واقف على الجهاز",
  },
  SEATED_LEG_CURL: {
    name_en: "Seated Leg Curl Machine",
    name_ar: "ثني أرجل خلفي جالس على الجهاز",
  },
  LEG_EXTENSION: {
    name_en: "Leg Extension Machine",
    name_ar: "فرد أرجل أمامي على الجهاز",
  },
  CHEST_SUPPORTED_ROW: {
    name_en: "Chest-Supported Machine Row",
    name_ar: "سحب ظهر على جهاز مسنود الصدر",
  },

});

/**
 * Format SNAKE_CASE code to English Title Case
 * e.g., INCLINE_DUMBBELL_PRESS -> Incline Dumbbell Press
 */
export function formatCodeToEnglishTitle(code) {
  if (!code || typeof code !== 'string') return '';
  // Remove technical prefixes/suffixes
  let clean = code.replace(/^EX_\d+_/i, '').replace(/_V\d+$/i, '');
  const words = clean.split(/[_-]+/).filter(Boolean);
  const acronyms = new Set(['DB', 'BB', 'RDL', 'HIIT', 'LISS', 'OHP', 'TVA', 'T', 'EZ']);
  
  return words.map(w => {
    const up = w.toUpperCase();
    if (acronyms.has(up)) return up;
    if (up === 'PRESS') return 'Press';
    if (up === 'BENCH') return 'Bench';
    if (up === 'ROW') return 'Row';
    if (up === 'CURL') return 'Curl';
    if (up === 'SQUAT') return 'Squat';
    if (up === 'FLY') return 'Fly';
    if (up === 'FLYE') return 'Fly';
    if (up === 'PUSHDOWN') return 'Pushdown';
    if (up === 'PULLDOWN') return 'Pulldown';
    if (up === 'RAISE') return 'Raise';
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  }).join(' ');
}

/**
 * Resolves verified { name_en, name_ar } for any exercise code or name.
 */
export function resolveExerciseNames(code) {
  if (!code) return { name_en: "Exercise", name_ar: "تمرين" };
  const rawStr = String(code).trim();
  const normalizedKey = rawStr.toUpperCase().replace(/[-\s]+/g, "_");
  
  if (MASTER_EXERCISE_DICTIONARY[normalizedKey]) {
    return MASTER_EXERCISE_DICTIONARY[normalizedKey];
  }

  // Check without trailing MACHINE / S / PRESS
  const strippedKey = normalizedKey.replace(/_MACHINE$/, "").replace(/S$/, "");
  if (MASTER_EXERCISE_DICTIONARY[strippedKey]) {
    return MASTER_EXERCISE_DICTIONARY[strippedKey];
  }

  const cleanEn = formatCodeToEnglishTitle(rawStr);
  return {
    name_en: cleanEn,
    name_ar: cleanEn,
  };
}

/**
 * Guaranteed Bilingual Extractor for ANY exercise representation
 * Always returns:
 * - nameEn: English primary name (Large / Prominent)
 * - nameAr: Arabic secondary name (Smaller / Subtitle)
 */
export function getExerciseDisplayNames(ex) {
  if (!ex) return { nameEn: 'Exercise', nameAr: 'تمرين' };

  if (typeof ex === 'string') {
    const resolved = resolveExerciseNames(ex);
    return { nameEn: resolved.name_en, nameAr: resolved.name_ar };
  }

  let rawEn = ex.name_en || ex.exercise_name_en || ex.nameEn || '';
  let rawAr = ex.name_ar || ex.exercise_name_ar || ex.nameAr || '';
  const code = ex.code || ex.exercise_code || ex.id || '';
  const name = ex.name || ex.exercise_name || '';

  // 1. Extract bracketed English from name e.g. "فرد أرجل أمامي (Leg Extension)"
  if (name && /\(([^)]*[a-zA-Z][^)]*)\)/.test(name)) {
    const match = name.match(/\(([^)]*[a-zA-Z][^)]*)\)/);
    if (match && match[1]) {
      if (!rawEn) rawEn = match[1].trim();
      if (!rawAr) rawAr = name.replace(match[0], '').trim();
    }
  }

  // 2. Classify raw name if not yet set
  if (name) {
    const hasEnglishLetters = /[a-zA-Z]/.test(name);
    const hasArabicLetters = /[\u0600-\u06FF]/.test(name);

    if (hasEnglishLetters && !hasArabicLetters) {
      if (!rawEn) rawEn = name;
    } else if (hasArabicLetters && !hasEnglishLetters) {
      if (!rawAr) rawAr = name;
    }
  }

  // 3. Dictionary lookup by code/id
  const normKey = String(code).toUpperCase().trim().replace(/[-\s]+/g, '_');
  if (normKey && MASTER_EXERCISE_DICTIONARY[normKey]) {
    const dictEntry = MASTER_EXERCISE_DICTIONARY[normKey];
    if (!rawEn) rawEn = dictEntry.name_en;
    if (!rawAr) rawAr = dictEntry.name_ar;
  }

  // 4. Fallback from code formatted
  if (!rawEn && code && typeof code === 'string' && !code.startsWith('ex_') && !code.startsWith('e')) {
    rawEn = formatCodeToEnglishTitle(code);
  }

  // 5. Ultimate Fallbacks
  if (!rawEn) rawEn = rawAr || 'Exercise';
  if (!rawAr) rawAr = rawEn;

  return {
    nameEn: rawEn,
    nameAr: rawAr
  };
}

export function getArabicExerciseName(ex) {
  return getExerciseDisplayNames(ex).nameAr;
}

export function getEnglishExerciseName(ex) {
  return getExerciseDisplayNames(ex).nameEn;
}

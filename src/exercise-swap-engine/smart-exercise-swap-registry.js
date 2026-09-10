import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const SMART_EXERCISE_SWAP_REGISTRY = Object.freeze({
  // ==========================================
  // --- HORIZONTAL PUSH (CHEST) ---
  // ==========================================
  KAS_GLUTE_BRIDGE: {
    movement_pattern: "HIP_HINGE",
    target_muscle_ar: "عضلة الجلوتس ماكسيموس في وضع القصر والانقباض الكامل",
    target_head_ar: "Gluteus Maximus (Shortened Peak)",
    biomechanical_focus_ar: "مدى حركي قصير مركز 100% على قمة انقباض الجلوتس دون إجهاد أوتار الركبة أو أسفل الظهر",
    swaps: [
      {
        exercise_code: "BARBELL_HIP_THRUST",
        name_ar: "هيب ثروست بالبار",
        name_en: "Barbell Hip Thrust",
        equipment: "BARBELL",
        equipment_ar: "باربل ودكة مستوية",
        environment: "GYM_OR_HOME",
        biomechanical_match_ar: "المدى الحركي الكامل للدفع الحوضي مع تحميل أوزان عالية",
        joint_safety_benefit_ar: "استناد أعلى الظهر يلغي الضغط على الركبتين",
      },
      {
        exercise_code: "GLUTE_BIASED_45_HYPEREXTENSION",
        name_ar: "تمديد ظهر 45 درجة بتركيز الجلوتس",
        name_en: "Glute-Biased 45° Hyperextension",
        equipment: "BODYWEIGHT",
        equipment_ar: "كرسي الرومان 45 درجة",
        environment: "GYM",
        biomechanical_match_ar: "تقويس الظهر للأعلى وتدوير الأقدام للخارج يعزل الجلوتس تماماً",
        joint_safety_benefit_ar: "انعدام الضغط على العمود الفقري وأمان قطني تام",
      },
      {
        exercise_code: "CABLE_45_GLUTE_KICKBACK",
        name_ar: "ركل خلفي قطري بالكابل 45°",
        name_en: "Standing 45° Diagonal Cable Glute Kickback",
        equipment: "CABLE",
        equipment_ar: "جهاز الكابل وحزام كاحل",
        environment: "GYM",
        biomechanical_match_ar: "عزل نقي مباشر بزاوية محاذاة ألياف الجلوتس",
        joint_safety_benefit_ar: "حرية حركة مفصل الفخذ دون أي تحميل محوري",
      },
    ],
  },

  B_STANCE_RDL: {
    movement_pattern: "HIP_HINGE",
    target_muscle_ar: "استطالة الجلوتس الأحادية العميقة وأوتار الفخذ الخلفية",
    target_head_ar: "Gluteus Maximus (Lengthened Position)",
    biomechanical_focus_ar: "دفع الحوض للخلف بأقصى استطالة محملة للجلوتس مع اتزان القدم الخلفية",
    swaps: [
      {
        exercise_code: "DUMBBELL_ROMANIAN_DEADLIFT",
        name_ar: "ديدليفت روماني بالدمبلز بالقدمين",
        name_en: "Dumbbell Romanian Deadlift",
        equipment: "DUMBBELL",
        equipment_ar: "دمبلز",
        environment: "GYM_OR_HOME",
        biomechanical_match_ar: "نفس زاوية رجوع الحوض للخلف واستطالة السلسلة الخلفية",
        joint_safety_benefit_ar: "مسار الدمبلز القريب من الساق يحمي أسفل الظهر",
      },
      {
        exercise_code: "DEFICIT_REVERSE_LUNGE",
        name_ar: "طعنات خلفية من منصة مرتفعة",
        name_en: "Deficit Reverse Lunge",
        equipment: "DUMBBELL",
        equipment_ar: "دمبلز ومنصة ارتفاع 10 سم",
        environment: "GYM_OR_HOME",
        biomechanical_match_ar: "نزول عميق لزيادة مدى استطالة الجلوتس مع ميل الجذع للأمام",
        joint_safety_benefit_ar: "النزول للخلف يقلل عزم القص على وتر صابونة الركبة",
      },
    ],
  },
  CABLE_GLUTE_KICKBACK: {
    movement_pattern: "HIP_HINGE",
    target_muscle_ar: "عضلة الجلوتس العلوية والخلفية (Glute Medius & Maximus)",
    target_head_ar: "الألياف العلوية للجلوتس",
    biomechanical_focus_ar: "عزل نقي للجلوتس في وضع الانقباض الكامل دون إرهاق عضلات الفخذ الأمامية",
    swaps: [
      {
        exercise_code: "SEATED_HIP_ABDUCTION_MACHINE",
        name_ar: "جهاز تفتيح الأرجل جالس (Hip Abduction)",
        name_en: "Seated Hip Abduction Machine",
        equipment: "MACHINE",
        equipment_ar: "جهاز تفتيح الأرجل",
        environment: "GYM",
        biomechanical_match_ar: "عزل مباشر لعضلة الجلوتس ميديوس مع ثبات كامل للحوض",
        joint_safety_benefit_ar: "أمان تام لأسفل الظهر ومفاصل الركبة",
      },
      {
        exercise_code: "BARBELL_HIP_THRUST",
        name_ar: "هيب ثروست بالبار",
        name_en: "Barbell Hip Thrust",
        equipment: "BARBELL",
        equipment_ar: "باربل ودكة مستوية",
        environment: "GYM_OR_HOME",
        biomechanical_match_ar: "تمرين مركب أساسي لتحميل أوزان ثقيلة على الجلوتس",
        joint_safety_benefit_ar: "توزيع ممتاز للحمل مع استناد أعلى الظهر",
      },
      {
        exercise_code: "BAND_LATERAL_WALK",
        name_ar: "مشي جانبي بحبل المقاومة (Monster Walk)",
        name_en: "Resistance Band Monster Walk",
        equipment: "RESISTANCE_BANDS",
        equipment_ar: "حبل مقاومة مطاطي",
        environment: "HOME",
        biomechanical_match_ar: "تفعيل مستمر للجلوتس ميديوس والاتزان الحركي للحوض",
        joint_safety_benefit_ar: "ضغط مفصلي معدوم ومناسب للمنزل والإحماء",
      },
    ],
  },

  SEATED_HIP_ABDUCTION_MACHINE: {
    movement_pattern: "HIP_HINGE",
    target_muscle_ar: "الجلوتس ميديوس وجوانب الحوض",
    target_head_ar: "Gluteus Medius & Minimus",
    biomechanical_focus_ar: "إبعاد الفخذين ضد المقاومة لعزل وتكبير جوانب الحوض",
    swaps: [
      {
        exercise_code: "CABLE_GLUTE_KICKBACK",
        name_ar: "ركل خلفي بالكابل",
        name_en: "Cable Glute Kickback",
        equipment: "CABLE",
        equipment_ar: "جهاز الكابل وحزام كاحل",
        environment: "GYM",
        biomechanical_match_ar: "مدى حركي حر وعزل فائق للجلوتس",
        joint_safety_benefit_ar: "إمكانية ضبط زاوية الركل لحماية أسفل الظهر",
      },
      {
        exercise_code: "BAND_LATERAL_WALK",
        name_ar: "مشي جانبي بحبل المقاومة",
        name_en: "Resistance Band Monster Walk",
        equipment: "RESISTANCE_BANDS",
        equipment_ar: "حبل مقاومة",
        environment: "HOME",
        biomechanical_match_ar: "نفس نمط الإبعاد الجانبي للفخذين",
        joint_safety_benefit_ar: "أمان تام ومنعدم الصدمات",
      },
    ],
  },

  CHEST_SUPPORTED_INCLINE_DB_ROW: {
    movement_pattern: "HORIZONTAL_PULL",
    target_muscle_ar: "عضلات الظهر العلوي والرومبويدز والترابيس الوسطى",
    target_head_ar: "Upper Back & Rhomboids",
    biomechanical_focus_ar: "تجديف بكوع مفتوح 45-60 درجة لعزل الظهر العلوي دون أي تحميل على أسفل الظهر",
    swaps: [
      {
        exercise_code: "SEATED_CABLE_ROW",
        name_ar: "سحب أرضي بالكابل قبضة واسعة",
        name_en: "Wide-Grip Seated Cable Row",
        equipment: "CABLE",
        equipment_ar: "جهاز سحب الكابل",
        environment: "GYM",
        biomechanical_match_ar: "سحب أفقي مستمر لعضلات الظهر العلوي والرومبويدز",
        joint_safety_benefit_ar: "ثبات القدمين يقلل إجهاد الفقرات القطنية",
      },
      {
        exercise_code: "ONE_ARM_DUMBBELL_ROW",
        name_ar: "تجديف فردي بالدمبل مع استناد الركبة",
        name_en: "One-Arm Dumbbell Row",
        equipment: "DUMBBELL",
        equipment_ar: "دمبل ودكة مستوية",
        environment: "GYM_OR_HOME",
        biomechanical_match_ar: "مدى حركي عميق وإمكانية زيادة الحمل بأمان",
        joint_safety_benefit_ar: "استناد الركبة واليد الأخرى يوفر دعامة صلبة للعمود الفقري",
      },
      {
        exercise_code: "INVERTED_ROW",
        name_ar: "تجديف مقلوب بوزن الجسم",
        name_en: "Inverted Bodyweight Row",
        equipment: "BODYWEIGHT",
        equipment_ar: "بار سميث أو حبال TRX",
        environment: "HOME",
        biomechanical_match_ar: "سحب أفقي وظيفي بوزن الجسم لعزل عضلات أعلى الظهر",
        joint_safety_benefit_ar: "تحكم كامل في زاوية الجسم لتقليل الشدة والأمان المفصلي",
      },
    ],
  },
  BARBELL_BENCH_PRESS: {
    movement_pattern: "HORIZONTAL_PUSH",
    target_muscle_ar: "عضلات الصدر الأوسط والعام",
    target_head_ar: "الألياف القصية للصدر (Sternal Head)",
    biomechanical_focus_ar: "دفع أفقي بأوزان حرة مع مدى حركي كامل",
    swaps: [
      {
        exercise_code: "DUMBBELL_BENCH_PRESS",
        name_ar: "بنش برس بالدمبل مستوي",
        name_en: "Flat Dumbbell Bench Press",
        equipment: "DUMBBELL",
        equipment_ar: "دمبلز ودكة مستوية",
        environment: "GYM_OR_HOME",
        biomechanical_match_ar: "نفس زاوية الدفع الأفقي مع زيادة المدى الحركي وعصر أكبر للصدر للداخل",
        joint_safety_benefit_ar: "حرية حركة معصم اليد والكتف لتقليل إجهاد الروتاتور كاف",
      },
      {
        exercise_code: "SEATED_CHEST_PRESS_MACHINE",
        name_ar: "مكبس صدر جالس على الجهاز",
        name_en: "Seated Machine Chest Press",
        equipment: "MACHINE",
        equipment_ar: "جهاز دفع الصدر",
        environment: "GYM",
        biomechanical_match_ar: "مسار حركة ثابت يتيح الوصول لأعلى درجات العزل والاستهداف العضلي",
        joint_safety_benefit_ar: "أمان تام للمفاصل دون الحاجة لتوازن الأوزان الحرة",
      },
      {
        exercise_code: "WEIGHTED_PUSHUPS",
        name_ar: "تمرين ضغط متدرج بالوزن / وزن الجسم",
        name_en: "Weighted / Standard Pushups",
        equipment: "BODYWEIGHT",
        equipment_ar: "وزن الجسم وسجادة",
        environment: "HOME",
        biomechanical_match_ar: "حركة دفع أفقية وظيفية تشغل الصدر والكور معاً",
        joint_safety_benefit_ar: "حركة طبيعية تتيح حركة حرة للوح الكتف (Scapular Protraction)",
      },
      {
        exercise_code: "SMITH_MACHINE_BENCH_PRESS",
        name_ar: "بنش برس مستوي على جهاز سميث",
        name_en: "Smith Machine Bench Press",
        equipment: "MACHINE",
        equipment_ar: "جهاز سميث",
        environment: "GYM",
        biomechanical_match_ar: "تحكم كامل في المسار وعصر مستمر لعضلة الصدر",
        joint_safety_benefit_ar: "أقفال أمان في أي نقطة من الحركة عند التدريب حتى الفشل العضلي",
      },
    ],
  },

  INCLINE_DUMBBELL_BENCH_PRESS: {
    movement_pattern: "INCLINE_PUSH",
    target_muscle_ar: "الصدر العلوي",
    target_head_ar: "الألياف الترقوية للصدر (Clavicular Head)",
    biomechanical_focus_ar: "دفع مائل بزاوية 30-45 درجة لعزل الصدر العلوي",
    swaps: [
      {
        exercise_code: "SMITH_INCLINE_BENCH_PRESS",
        name_ar: "بنش مائل بالبار على جهاز سميث",
        name_en: "Incline Smith Machine Press",
        equipment: "MACHINE",
        equipment_ar: "جهاز سميث ودكة مائلة",
        environment: "GYM",
        biomechanical_match_ar: "تركيز فائق وعزل كامل للألياف الترقوية للصدر العلوي",
        joint_safety_benefit_ar: "ثبات مسار الحركة يقلل إجهاد الكتف الأمامي",
      },
      {
        exercise_code: "LOW_TO_HIGH_CABLE_FLY",
        name_ar: "تجميع كابل من الأسفل للأعلى للصدر العلوي",
        name_en: "Low-to-High Cable Fly",
        equipment: "CABLE",
        equipment_ar: "جهاز الكابل المزدوج",
        environment: "GYM",
        biomechanical_match_ar: "تتبع خط سحب الألياف العضلية للصدر العلوي باتجاه الترقوة مع شد مستمر",
        joint_safety_benefit_ar: "ضغط منخفض على مفاصل الكوع والأكتاف",
      },
      {
        exercise_code: "INCLINE_CHEST_PRESS_MACHINE",
        name_ar: "مكبس صدر مائل على الجهاز",
        name_en: "Incline Machine Chest Press",
        equipment: "MACHINE",
        equipment_ar: "جهاز الصدر المائل",
        environment: "GYM",
        biomechanical_match_ar: "استهداف مباشر للجزء العلوي من الصدر مع دعم كامل للظهر",
        joint_safety_benefit_ar: "حماية تامة من الإصابات وأمان تام عند زيادة الأوزان",
      },
      {
        exercise_code: "DECLINE_PUSHUPS",
        name_ar: "تمرين ضغط برفع القدمين للأعلى (منزلي)",
        name_en: "Decline Feet-Elevated Pushups",
        equipment: "BODYWEIGHT",
        equipment_ar: "كرسي أو دكة مرتفعة",
        environment: "HOME",
        biomechanical_match_ar: "نفس زاوية الدفع المائل بوزن الجسم للمنزل",
        joint_safety_benefit_ar: "حمل وظيفي خفيف ومناسب للجميع",
      },
    ],
  },

  // ==========================================
  // --- KNEE FLEXION (HAMSTRINGS LENGTHENED) ---
  // ==========================================
  SEATED_LEG_CURL: {
    movement_pattern: "KNEE_FLEXION",
    target_muscle_ar: "الفخذ الخلفي",
    target_head_ar: "عضلات الهامسترنج في وضعية الاستطالة القصوى (Lengthened Position)",
    biomechanical_focus_ar: "ثني الركبة مع ثني الحوض لوضع الهامسترنج في أقصى استطالة لتحفيز التضخيم",
    swaps: [
      {
        exercise_code: "LYING_LEG_CURL_MACHINE",
        name_ar: "مرجحة أرجل خلفية نائماً على الجهاز",
        name_en: "Lying Leg Curl Machine",
        equipment: "MACHINE",
        equipment_ar: "جهاز المرجحة الخلفية النائم",
        environment: "GYM",
        biomechanical_match_ar: "ثني ركبة مباشر مع عصر كامل لقمة الانقباض العضلي للفخذ الخلفي",
        joint_safety_benefit_ar: "تثبيت كامل لمنطقة الحوض وأمان تام لأسفل الظهر",
      },
      {
        exercise_code: "NORDIC_HAMSTRING_CURL",
        name_ar: "تمرين النورديك للهامسترنج (وزن الجسم)",
        name_en: "Nordic Hamstring Curl",
        equipment: "BODYWEIGHT",
        equipment_ar: "أرضية مع تثبيت الكعبين",
        environment: "GYM_OR_HOME",
        biomechanical_match_ar: "أقوى تمرين لا مركزي (Eccentric Overload) لتقوية واستطالة الهامسترنج",
        joint_safety_benefit_ar: "حماية قصوى من تمزقات أوتار الركبة وإصابات الملاعب",
      },
      {
        exercise_code: "SWISS_BALL_HAMSTRING_CURL",
        name_ar: "مرجحة خلفيات بكرة التوازن (سويس بول)",
        name_en: "Swiss Ball Hamstring Leg Curl",
        equipment: "FITNESS_BALL",
        equipment_ar: "كرة لياقة سويس بول",
        environment: "HOME",
        biomechanical_match_ar: "ثني ركبة مع رفع الحوض لتشغيل الهامسترنج والمؤخرة في آن واحد",
        joint_safety_benefit_ar: "خالي تماماً من الضغط على المفاصل ومثالي للمنزل والتأهيل",
      },
      {
        exercise_code: "RESISTANCE_BAND_LEG_CURL",
        name_ar: "مرجحة خلفيات بحبل المقاومة نائماً",
        name_en: "Lying Resistance Band Leg Curl",
        equipment: "RESISTANCE_BAND",
        equipment_ar: "حبل مقاومة مطاطي",
        environment: "HOME",
        biomechanical_match_ar: "مقاومة تصاعدية لثني الركبة في المنزل",
        joint_safety_benefit_ar: "أمان كامل وسلاسة في الحركة للمنزل",
      },
    ],
  },

  LYING_LEG_CURL_MACHINE: {
    movement_pattern: "KNEE_FLEXION",
    target_muscle_ar: "الفخذ الخلفي",
    target_head_ar: "عضلات الهامسترنج (Hamstrings Peak Contraction)",
    biomechanical_focus_ar: "ثني الركبة وعصر الفخذ الخلفي",
    swaps: [
      {
        exercise_code: "SEATED_LEG_CURL",
        name_ar: "مرجحة أرجل خلفية جالساً على الجهاز",
        name_en: "Seated Leg Curl Machine",
        equipment: "MACHINE",
        equipment_ar: "جهاز المرجحة الجالس",
        environment: "GYM",
        biomechanical_match_ar: "يضع عضلة الهامسترنج في استطالة أكبر لتحفيز النمو الميكانيكي",
        joint_safety_benefit_ar: "أسهل في التثبيت ولا يسبب ضغطاً على أسفل الظهر",
      },
      {
        exercise_code: "NORDIC_HAMSTRING_CURL",
        name_ar: "تمرين النورديك للهامسترنج",
        name_en: "Nordic Hamstring Curl",
        equipment: "BODYWEIGHT",
        equipment_ar: "تثبيت الكعبين",
        environment: "GYM_OR_HOME",
        biomechanical_match_ar: "تحميل لا مركزي جبار لبناء ألياف الهامسترنج",
        joint_safety_benefit_ar: "تقوية أوتار الركبة وخفض معدل الإصابات",
      },
    ],
  },

  // ==========================================
  // --- TRICEPS (OVERHEAD / LONG HEAD) ---
  // ==========================================
  OVERHEAD_CABLE_TRICEPS_EXTENSION: {
    movement_pattern: "ELBOW_EXTENSION_LONG_HEAD",
    target_muscle_ar: "عضلة الترايسبس",
    target_head_ar: "الرأس الطويل للترايسبس في وضعية الاستطالة (Long Head Stretch)",
    biomechanical_focus_ar: "مد الكوع فوق مستوى الرأس لتحفيز تضخيم الرأس الطويل",
    swaps: [
      {
        exercise_code: "INCLINE_DUMBBELL_OVERHEAD_EXTENSION",
        name_ar: "مد ترايسبس دمبل خلف الرأس على بنش مائل",
        name_en: "Incline Dumbbell Overhead Triceps Extension",
        equipment: "DUMBBELL",
        equipment_ar: "دمبلز ودكة مائلة",
        environment: "GYM_OR_HOME",
        biomechanical_match_ar: "استطالة ميكانيكية عميقة للرأس الطويل مع بنش مائل يريح مفصل الكتف",
        joint_safety_benefit_ar: "أكثر أماناً لمفصل الكتف والكوع من التمرين واقفاً",
      },
      {
        exercise_code: "DUAL_CABLE_CROSS_EXTENSION",
        name_ar: "مد ترايسبس متقاطع بالكابل المزدوج (كابل كيك باك)",
        name_en: "Dual Cable Cross Triceps Extension",
        equipment: "CABLE",
        equipment_ar: "كيبل مزدوج بدون مقابض",
        environment: "GYM",
        biomechanical_match_ar: "تتبع المسار الطبيعي لمفصل الكوع مع عصر كامل في نهاية المدى",
        joint_safety_benefit_ar: "انعدام أي احتكاك في مفصل الكوع (Zero Elbow Joint Pain)",
      },
      {
        exercise_code: "SKULL_CRUSHERS_EZ",
        name_ar: "سكال كراشر بالبار المتعرج EZ نائماً",
        name_en: "EZ-Bar Lying Skull Crushers",
        equipment: "BARBELL",
        equipment_ar: "بار متعرج EZ ودكة مستوية",
        environment: "GYM",
        biomechanical_match_ar: "تحميل ثقيل ومباشر على الرأس الطويل والمتوسط للترايسبس",
        joint_safety_benefit_ar: "البار المتعرج يقلل الضغط على معصم اليد",
      },
      {
        exercise_code: "BAND_OVERHEAD_TRICEPS_EXTENSION",
        name_ar: "مد ترايسبس خلف الرأس بحبل المقاومة (منزلي)",
        name_en: "Overhead Band Triceps Extension",
        equipment: "RESISTANCE_BAND",
        equipment_ar: "حبل مقاومة مطاطي",
        environment: "HOME",
        biomechanical_match_ar: "استطالة الرأس الطويل في المنزل مع مقاومة سلسة",
        joint_safety_benefit_ar: "خالي تماماً من الإجهاد المفصلي",
      },
    ],
  },

  // ==========================================
  // --- BICEPS (LENGTHENED POSITION) ---
  // ==========================================
  INCLINE_DUMBBELL_CURL: {
    movement_pattern: "ELBOW_FLEXION_LENGTHENED",
    target_muscle_ar: "عضلة البايسبس",
    target_head_ar: "الرأس الطويل للبايسبس في وضعية الاستطالة (Long Head Stretch)",
    biomechanical_focus_ar: "ثني الكوع مع إرجاع الذراعين للخلف لوضع البايسبس في أقصى استطالة",
    swaps: [
      {
        exercise_code: "BEHIND_BACK_CABLE_CURL",
        name_ar: "بايسبس كابل من الخلف (Bayesian Cable Curl)",
        name_en: "Behind-the-Back Bayesian Cable Curl",
        equipment: "CABLE",
        equipment_ar: "جهاز الكابل السفلي",
        environment: "GYM",
        biomechanical_match_ar: "شد مستمر وثابت حتى في نقطة البداية مع وضع البايسبس في استطالة كاملة",
        joint_safety_benefit_ar: "مسار حركة سلس جداً يحمي أوتار الكوع",
      },
      {
        exercise_code: "PREACHER_CURL",
        name_ar: "مرجحة بايسبس على مسند الواعظ (بريتشر)",
        name_en: "Preacher Biceps Curl",
        equipment: "BARBELL",
        equipment_ar: "مسند بريتشر وبار EZ أو دمبل",
        environment: "GYM",
        biomechanical_match_ar: "عزل كامل يمنع الغش والتأرجح مع تركيز الحمل في الجزء السفلي للحركة",
        joint_safety_benefit_ar: "ثبات كامل للكتف وأمان تام للعمود الفقري",
      },
      {
        exercise_code: "SPIDER_CURL",
        name_ar: "سبايدر كيرل نائماً على بنش مائل بالدمبل",
        name_en: "Spider Curl on Incline Bench",
        equipment: "DUMBBELL",
        equipment_ar: "دكة مائلة وزوج دمبلز",
        environment: "GYM_OR_HOME",
        biomechanical_match_ar: "عزل ميكانيكي تام للبايسبس دون أي حركة مساعدة من الظهر",
        joint_safety_benefit_ar: "يلغي الحمل عن أسفل الظهر تماماً",
      },
      {
        exercise_code: "BAND_BICEPS_CURL",
        name_ar: "مرجحة بايسبس بحبل المقاومة واقفاً (منزلي)",
        name_en: "Standing Band Biceps Curl",
        equipment: "RESISTANCE_BAND",
        equipment_ar: "حبل مقاومة",
        environment: "HOME",
        biomechanical_match_ar: "ثني كوع ومقاومة متصاعدة في قمة الحركة",
        joint_safety_benefit_ar: "أمان كامل للمنزل",
      },
    ],
  },

  // ==========================================
  // --- VERTICAL PULL (LATS) ---
  // ==========================================
  LAT_PULLDOWN: {
    movement_pattern: "VERTICAL_PULL",
    target_muscle_ar: "عضلة الظهر العريضة (المجنص)",
    target_head_ar: "ألياف اللاتس العلوية والوسطى (Latissimus Dorsi)",
    biomechanical_focus_ar: "سحب عمودي لتعريض الظهر وسحب لوحي الكتف للأسفل",
    swaps: [
      {
        exercise_code: "PULL_UPS",
        name_ar: "تمرين العقلة بالوزن أو وزن الجسم (بول آب)",
        name_en: "Bodyweight / Weighted Pull-ups",
        equipment: "BODYWEIGHT",
        equipment_ar: "عقلة سحب",
        environment: "GYM_OR_HOME",
        biomechanical_match_ar: "أقوى تمرين سحب عمودي وظيفي لبناء قوة وتعريض الظهر بالكامل",
        joint_safety_benefit_ar: "حركة مغلقة السلسلة الحركية (Closed Kinetic Chain) تعزز ثبات الكتف",
      },
      {
        exercise_code: "SINGLE_ARM_HALF_KNEELING_LAT_PULLDOWN",
        name_ar: "سحب عالي فردي كابل نصف راكع (لات رُو كابل)",
        name_en: "Single-Arm Half-Kneeling Cable Pulldown",
        equipment: "CABLE",
        equipment_ar: "كيبل فردي بمقبض D",
        environment: "GYM",
        biomechanical_match_ar: "تتبع خط ألياف اللاتس بدقة تامة مع مدى حركي أطول من السحب العادي",
        joint_safety_benefit_ar: "يسمح بتعديل مسار السحب لراحة تامة لمفصل الكتف وتفادي الاحتكاك",
      },
      {
        exercise_code: "NEUTRAL_GRIP_LAT_PULLDOWN",
        name_ar: "سحب عالي للظهر بقبضة محايدة ضيقة (V-Bar)",
        name_en: "Neutral-Grip Lat Pulldown",
        equipment: "MACHINE",
        equipment_ar: "جهاز السحب العالي مع مقبض V",
        environment: "GYM",
        biomechanical_match_ar: "سحب الكوعين للأسفل والداخل مباشرة باتجاه الحوض لتركيز فائق على اللاتس",
        joint_safety_benefit_ar: "القبضة المحايدة تحمي الكتف والمرفقين من الإجهاد",
      },
      {
        exercise_code: "BAND_LAT_PULLDOWN",
        name_ar: "سحب عالي بحبل المقاومة مثبت من أعلى (منزلي)",
        name_en: "Door-Anchored Band Lat Pulldown",
        equipment: "RESISTANCE_BAND",
        equipment_ar: "حبل مقاومة مثبت بالباب",
        environment: "HOME",
        biomechanical_match_ar: "سحب عمودي بمقاومة الحبل للمنزل",
        joint_safety_benefit_ar: "خالي من الإجهاد ومناسب للمنزل",
      },
    ],
  },

  // ==========================================
  // --- HORIZONTAL PULL (UPPER/MID BACK) ---
  // ==========================================
  CHEST_SUPPORTED_ROW: {
    movement_pattern: "HORIZONTAL_PULL",
    target_muscle_ar: "كثافة الظهر والترابيس الوسطى",
    target_head_ar: "الترابيس الوسطى، الرومبويدز وأعلى الظهر",
    biomechanical_focus_ar: "سحب أفقي مع سحب لوحي الكتف للخلف دون أي حمل على أسفل الظهر",
    swaps: [
      {
        exercise_code: "SEATED_CABLE_ROW",
        name_ar: "سحب أرضي على الكيبل للظهر (كيبل رُو)",
        name_en: "Seated Cable Row",
        equipment: "CABLE",
        equipment_ar: "جهاز السحب الأرضي بالكابل",
        environment: "GYM",
        biomechanical_match_ar: "سحب أفقي مستمر مع إمكانية استخدام قبضات متعددة لاستهداف زوايا الظهر",
        joint_safety_benefit_ar: "تحكم كامل في مدى الحركة دون إجهاد الفقرات",
      },
      {
        exercise_code: "ONE_ARM_DUMBBELL_ROW",
        name_ar: "تجديف فردي بالدمبل على الدكة (وان آرم رُو)",
        name_en: "Single-Arm Dumbbell Row",
        equipment: "DUMBBELL",
        equipment_ar: "دمبل ودكة مستوية",
        environment: "GYM_OR_HOME",
        biomechanical_match_ar: "تمرين أحادي يوازن القوة بين جانبي الظهر مع استطالة عميقة وعصر كامل",
        joint_safety_benefit_ar: "استناد اليد والركبة على الدكة يلغي الحمل عن أسفل الظهر",
      },
      {
        exercise_code: "INCLINE_BENCH_DUMBBELL_ROW",
        name_ar: "تجديف بالدمبل مسنود الصدر على دكة مائلة",
        name_en: "Chest-Supported Incline Dumbbell Row",
        equipment: "DUMBBELL",
        equipment_ar: "دكة مائلة وزوج دمبلز",
        environment: "GYM_OR_HOME",
        biomechanical_match_ar: "عزل تام لعضلات الظهر العلوية مع منع الغش وتأرجح الجذع نهائياً",
        joint_safety_benefit_ar: "أقصى حماية لأسفل الظهر (Zero Lumbar Strain)",
      },
      {
        exercise_code: "BAND_SEATED_ROW",
        name_ar: "سحب أرضي بحبل المقاومة جالساً (منزلي)",
        name_en: "Seated Resistance Band Row",
        equipment: "RESISTANCE_BAND",
        equipment_ar: "حبل مقاومة",
        environment: "HOME",
        biomechanical_match_ar: "سحب أفقي وعصر لوحي الكتف في المنزل",
        joint_safety_benefit_ar: "خالي تماماً من الضغط المفصلي",
      },
    ],
  },

  // ==========================================
  // --- KNEE DOMINANT (QUADS & GLUTES) ---
  // ==========================================
  BARBELL_BACK_SQUAT: {
    movement_pattern: "KNEE_DOMINANT",
    target_muscle_ar: "الفخذ الأمامي والأرجل بالكامل",
    target_head_ar: "عضلات الكوادريسيبس والمؤخرة والكور",
    biomechanical_focus_ar: "حركة سكوات مركبة لتحفيز القوة والتضخيم الشامل للأرجل",
    swaps: [
      {
        exercise_code: "HACK_SQUAT_MACHINE",
        name_ar: "هاك سكوات على الجهاز (هاك ماشين)",
        name_en: "Hack Squat Machine",
        equipment: "MACHINE",
        equipment_ar: "جهاز الهاك سكوات",
        environment: "GYM",
        biomechanical_match_ar: "تركيز جبار ومباشر على الفخذ الأمامي مع مسار حركة مائل وموجه",
        joint_safety_benefit_ar: "إسناد الظهر بالكامل يقلل الحمل المحوري على العمود الفقري",
      },
      {
        exercise_code: "LEG_PRESS_MACHINE",
        name_ar: "دفع الأرجل على جهاز المكبس (ليج برس)",
        name_en: "Leg Press Machine",
        equipment: "MACHINE",
        equipment_ar: "جهاز مكبس الأرجل",
        environment: "GYM",
        biomechanical_match_ar: "تحميل أوزان ثقيلة بأمان تام على الفخذين دون إجهاد للجهاز العصبي والظهر",
        joint_safety_benefit_ar: "أمان تام للفقرات وأسفل الظهر وتفادي فقدان التوازن",
      },
      {
        exercise_code: "GOBLET_SQUAT",
        name_ar: "جوبلت سكوات بالدمبل (سكوات أمامي)",
        name_en: "Dumbbell Goblet Squat",
        equipment: "DUMBBELL",
        equipment_ar: "دمبل واحد",
        environment: "GYM_OR_HOME",
        biomechanical_match_ar: "حمل الوزن أمام الصدر يجبر الجذع على الاستقامة ويزيد عمق النزول للفخذ",
        joint_safety_benefit_ar: "حماية فائقة لأسفل الظهر ومناسب للمبتدئين والتدريب المنزلي",
      },
    ],
  },

  BULGARIAN_SPLIT_SQUAT: {
    movement_pattern: "UNILATERAL_LOWER",
    target_muscle_ar: "الفخذ الأمامي والمؤخرة أحادي",
    target_head_ar: "الكوادريسيبس والجلوتس مع استقرار الحوض",
    biomechanical_focus_ar: "حركة سكوات أحادية القدم لعلاج عدم تناسق القوة وتضخيم الأرجل",
    swaps: [
      {
        exercise_code: "DUMBBELL_REVERSE_LUNGE",
        name_ar: "طعن خلفي بالدمبل (ريفيرس لانجز)",
        name_en: "Dumbbell Reverse Lunges",
        equipment: "DUMBBELL",
        equipment_ar: "زوج دمبلز",
        environment: "GYM_OR_HOME",
        biomechanical_match_ar: "تمرين أرجل أحادي يقلل الضغط على صابونة الركبة مقارنة بالطعن الأمامي",
        joint_safety_benefit_ar: "أكثر أماناً لمفصل الركبة وتوازن الجسم",
      },
      {
        exercise_code: "DUMBBELL_WALKING_LUNGES",
        name_ar: "مشي طعن بالدمبل (Walking Lunges)",
        name_en: "Dumbbell Walking Lunges",
        equipment: "DUMBBELL",
        equipment_ar: "زوج دمبلز",
        environment: "GYM_OR_HOME",
        biomechanical_match_ar: "تمرين ديناميكي قوي يحفز العضلات المثبتة والأرداف والفخذ",
        joint_safety_benefit_ar: "تحسين التوازن العضلي الحركي",
      },
      {
        exercise_code: "SINGLE_LEG_LEG_PRESS",
        name_ar: "دفع أرجل فردي على المكبس (ليج برس فردي)",
        name_en: "Single-Leg Leg Press",
        equipment: "MACHINE",
        equipment_ar: "جهاز مكبس الأرجل",
        environment: "GYM",
        biomechanical_match_ar: "عزل أحادي للأرجل مع ثبات تام ودعم كامل للظهر",
        joint_safety_benefit_ar: "أمان تام للمفاصل والتوازن",
      },
    ],
  },

  // ==========================================
  // --- HIP HINGE (POSTERIOR CHAIN) ---
  // ==========================================
  DUMBBELL_ROMANIAN_DEADLIFT: {
    movement_pattern: "HIP_HINGE",
    target_muscle_ar: "الفخذ الخلفي والأرداف",
    target_head_ar: "الهامسترنج والجلوتس وأسفل الظهر",
    biomechanical_focus_ar: "دفع الحوض للخلف لإطالة وتحميل أوتار الفخذ الخلفية",
    swaps: [
      {
        exercise_code: "BARBELL_ROMANIAN_DEADLIFT",
        name_ar: "ديدليفت روماني بالبار (باربل RDL)",
        name_en: "Barbell Romanian Deadlift",
        equipment: "BARBELL",
        equipment_ar: "بار أولمبي وأوزان",
        environment: "GYM",
        biomechanical_match_ar: "إمكانية زيادة الأحمال التدريجية لبناء قوة وحجم السلسلة الخلفية",
        joint_safety_benefit_ar: "مسار حركة مستقيم ملاصق للساقين يحمي أسفل الظهر",
      },
      {
        exercise_code: "BACK_EXTENSION_45",
        name_ar: "هايبر إكستنشن بزاوية 45 درجة مع ثني الظهر الخفيف للتركيز على الجلوتس",
        name_en: "45-Degree Back Extension (Glute-Ham Focus)",
        equipment: "MACHINE",
        equipment_ar: "دكة الهايبر إكستنشن 45",
        environment: "GYM",
        biomechanical_match_ar: "استهداف نقي للهامسترنج والجلوتس مع تقليل الحمل المحوري",
        joint_safety_benefit_ar: "مثالي للمتدربين الذين يعانون من حساسية في الفقرات القطنية",
      },
      {
        exercise_code: "CABLE_PULL_THROUGH",
        name_ar: "سحب بالحبل بين الساقين على الكابل (كيبل بول ثرو)",
        name_en: "Cable Pull-Through",
        equipment: "CABLE",
        equipment_ar: "كيبل سفلي مع حبل",
        environment: "GYM",
        biomechanical_match_ar: "خط مقاومة أفقي يسحب الحوض للخلف مباشرة ويحفز عصر الجلوتس والهامسترنج",
        joint_safety_benefit_ar: "أمان تام وانعدام الحمل الرأسي على العمود الفقري",
      },
      {
        exercise_code: "BAND_ROMANIAN_DEADLIFT",
        name_ar: "ديدليفت روماني بحبل المقاومة (منزلي)",
        name_en: "Resistance Band Romanian Deadlift",
        equipment: "RESISTANCE_BAND",
        equipment_ar: "حبل مقاومة مطاطي عريض",
        environment: "HOME",
        biomechanical_match_ar: "حركة هيب هينج بمقاومة تصاعدية للمنزل",
        joint_safety_benefit_ar: "خالي تماماً من الإجهاد المفصلي",
      },
    ],
  },

  // ==========================================
  // --- SIDE DELTS (SHOULDERS) ---
  // ==========================================
  CABLE_LATERAL_RAISE: {
    movement_pattern: "SHOULDER_ABDUCTION",
    target_muscle_ar: "عضلة الكتف الجانبي",
    target_head_ar: "الرأس الجانبي للدلتويد (Lateral Deltoid)",
    biomechanical_focus_ar: "شد مستمر من وضعية الاستطالة حتى قمة الانقباض لتدوير الكتف",
    swaps: [
      {
        exercise_code: "DUMBBELL_LATERAL_RAISE",
        name_ar: "رفرفة جانبية بالدمبل (لترال رايز دمبل)",
        name_en: "Dumbbell Lateral Raise",
        equipment: "DUMBBELL",
        equipment_ar: "زوج دمبلز خفيفة إلى متوسطة",
        environment: "GYM_OR_HOME",
        biomechanical_match_ar: "أشهر تمرين كلاسيكي لعزل وتدوير عضلة الكتف الجانبي",
        joint_safety_benefit_ar: "الرفع في المستوى الكتفي (Scapular Plane) يحمي أوتار الكتف",
      },
      {
        exercise_code: "MACHINE_LATERAL_RAISE",
        name_ar: "رفرفة كتف جانبي على الجهاز (لترال ماشين)",
        name_en: "Machine Lateral Raise",
        equipment: "MACHINE",
        equipment_ar: "جهاز الرفرفة الجانبية",
        environment: "GYM",
        biomechanical_match_ar: "عزل تام لعضلة الكتف الجانبي بدون استخدام أي عضلات مساعدة أو عزم دوران",
        joint_safety_benefit_ar: "دعم المرفقين بالوسائد يلغي إجهاد مفصل الكوع والمعصم",
      },
      {
        exercise_code: "LEANING_CABLE_LATERAL_RAISE",
        name_ar: "رفرفة كابل مائل بيد واحدة (Leaning Lateral Raise)",
        name_en: "Single-Arm Leaning Cable Lateral Raise",
        equipment: "CABLE",
        equipment_ar: "كيبل ومقبض D",
        environment: "GYM",
        biomechanical_match_ar: "الميلان يزيد التوتر في وضعية الاستطالة العضلية في أسفل المدى",
        joint_safety_benefit_ar: "توزيع مريح للمقاومة على المدى الحركي",
      },
      {
        exercise_code: "BAND_LATERAL_RAISE",
        name_ar: "رفرفة كتف جانبي بحبل المقاومة (منزلي)",
        name_en: "Resistance Band Lateral Raise",
        equipment: "RESISTANCE_BAND",
        equipment_ar: "حبل مقاومة",
        environment: "HOME",
        biomechanical_match_ar: "عزل الكتف الجانبي في المنزل مع مقاومة متصاعدة",
        joint_safety_benefit_ar: "أمان تام للمفاصل",
      },
    ],
  },

  DUMBBELL_LATERAL_RAISE: {
    movement_pattern: "SHOULDER_ABDUCTION",
    target_muscle_ar: "عضلة الكتف الجانبي",
    target_head_ar: "الرأس الجانبي للدلتويد (Lateral Deltoid)",
    biomechanical_focus_ar: "عزل وتدوير عضلة الكتف الجانبي",
    swaps: [
      {
        exercise_code: "DUMBBELL_LATERAL_RAISE",
        name_ar: "رفرفة جانبية بالدمبل (لترال رايز دمبل)",
        name_en: "Dumbbell Lateral Raise",
        equipment: "DUMBBELL",
        equipment_ar: "زوج دمبلز خفيفة إلى متوسطة",
        environment: "GYM_OR_HOME",
        biomechanical_match_ar: "عزل وتدوير عضلة الكتف الجانبي الكلاسيكي",
        joint_safety_benefit_ar: "الرفع في المستوى الكتفي يحمي الأوتار",
      },
      {
        exercise_code: "CABLE_LATERAL_RAISE",
        name_ar: "رفرفة جانبية للأكتاف على الكيبل",
        name_en: "Cable Lateral Raise",
        equipment: "CABLE",
        equipment_ar: "جهاز الكيبل",
        environment: "GYM",
        biomechanical_match_ar: "شد مستمر على العضلة حتى في وضعية البداية لزيادة الحجم العضلي",
        joint_safety_benefit_ar: "حركة ناعمة بدون صدمات مفصلية",
      },
      {
        exercise_code: "MACHINE_LATERAL_RAISE",
        name_ar: "رفرفة كتف جانبي على الجهاز",
        name_en: "Machine Lateral Raise",
        equipment: "MACHINE",
        equipment_ar: "جهاز الرفرفة الجانبية",
        environment: "GYM",
        biomechanical_match_ar: "عزل صارم للكتف الجانبي بدون تأرجح",
        joint_safety_benefit_ar: "إسناد الكوعين يلغي الحمل عن الأوتار",
      },
      {
        exercise_code: "LEANING_CABLE_LATERAL_RAISE",
        name_ar: "رفرفة كابل مائل بيد واحدة",
        name_en: "Single-Arm Leaning Cable Lateral Raise",
        equipment: "CABLE",
        equipment_ar: "كيبل ومقبض D",
        environment: "GYM",
        biomechanical_match_ar: "الميلان يزيد التوتر في وضعية الاستطالة العضلية",
        joint_safety_benefit_ar: "توزيع مريح للمقاومة على المدى الحركي",
      },
    ],
  },

  // ==========================================
  // --- REAR DELTS (POSTERIOR SHOULDER) ---
  // ==========================================
  FACE_PULL: {
    movement_pattern: "POSTERIOR_DELTOID",
    target_muscle_ar: "عضلة الكتف الخلفي والروتاتور كاف",
    target_head_ar: "الكتف الخلفي (Posterior Deltoid) والمدورة الخارجية",
    biomechanical_focus_ar: "سحب بالحبل مع تدوير الكتف للخارج لحماية المفصل وتكبير الكتف الخلفي",
    swaps: [
      {
        exercise_code: "REAR_DELT_FLY_DUMBBELL",
        name_ar: "رفرفة كتف خلفي بالدمبل منحني الجذع",
        name_en: "Bent-Over Dumbbell Rear Delt Fly",
        equipment: "DUMBBELL",
        equipment_ar: "زوج دمبلز خفيفة",
        environment: "GYM_OR_HOME",
        biomechanical_match_ar: "عزل مباشر للكتف الخلفي بالدمبلز في المستوى الأفقي",
        joint_safety_benefit_ar: "تمرين بسيط يمكن أداؤه مسنود الصدر لحماية الظهر",
      },
      {
        exercise_code: "REVERSE_PECK_DECK",
        name_ar: "جهاز الفراشة المقلوب للكتف الخلفي (ريفيرس بيك ديك)",
        name_en: "Reverse Pec Deck Fly Machine",
        equipment: "MACHINE",
        equipment_ar: "جهاز الفراشة المقلوبة",
        environment: "GYM",
        biomechanical_match_ar: "أعلى تمرين في تفعيل الكتف الخلفي بدون أي تدخل من الترابيس العلوية",
        joint_safety_benefit_ar: "مسار حركة موجه وثابت يحمي الكتف بالكامل",
      },
      {
        exercise_code: "BAND_FACE_PULL",
        name_ar: "فيس بول بحبل المقاومة مثبت بالباب (منزلي)",
        name_en: "Resistance Band Face Pull",
        equipment: "RESISTANCE_BAND",
        equipment_ar: "حبل مقاومة",
        environment: "HOME",
        biomechanical_match_ar: "سحب للوجه وتدوير خارجي للكتف للمنزل",
        joint_safety_benefit_ar: "تأهيل وقائي ممتاز للروتاتور كاف",
      },
    ],
  },

  // ==========================================
  // --- CORE & ABS ---
  // ==========================================
  HANGING_LEG_RAISE: {
    movement_pattern: "CORE_STABILITY",
    target_muscle_ar: "عضلات البطن السفلية والكور",
    target_head_ar: "المستقيمة البطنية السفلية (Rectus Abdominis)",
    biomechanical_focus_ar: "رفع الحوض للأعلى لعصر عضلات البطن السفلية",
    swaps: [
      {
        exercise_code: "CAPTAINS_CHAIR_LEG_RAISE",
        name_ar: "رفع أرجل على الكرسي الروماني (مسنود الكوعين)",
        name_en: "Captain's Chair Leg Raise",
        equipment: "MACHINE",
        equipment_ar: "جهاز الكرسي الروماني",
        environment: "GYM",
        biomechanical_match_ar: "نفس تفعيل رفع الأرجل مع إسناد الكوعين والظهر لمنع التأرجح",
        joint_safety_benefit_ar: "يلغي إجهاد قبضة اليد والكتف ويتيح التركيز الكامل على البطن",
      },
      {
        exercise_code: "CABLE_CRUNCH",
        name_ar: "طحن كابل للبطن راكعاً (كيبل كرانش)",
        name_en: "Kneeling Cable Crunch",
        equipment: "CABLE",
        equipment_ar: "كيبل علوي مع حبل",
        environment: "GYM",
        biomechanical_match_ar: "إمكانية زيادة الأوزان تدريجياً لتكبير وتحديد عضلات السكس باك",
        joint_safety_benefit_ar: "ثبات الركبتين على الأرض يحمي المفاصل",
      },
      {
        exercise_code: "AB_WHEEL_ROLLOUT",
        name_ar: "تمرين عجلة البطن للثبات المتقدم (آب رول أوت)",
        name_en: "Ab Wheel Rollout",
        equipment: "AB_WHEEL",
        equipment_ar: "عجلة البطن وسجادة",
        environment: "GYM_OR_HOME",
        biomechanical_match_ar: "أقوى تمرين مقاومة لتمدد العمود الفقري (Anti-Extension) وبناء كور حديدي",
        joint_safety_benefit_ar: "يقوي عضلات العمود الفقري العميقة",
      },
      {
        exercise_code: "DEAD_BUG",
        name_ar: "تمرين الحشرة الميتة لثبات الكور والظهر",
        name_en: "Dead Bug Core Exercise",
        equipment: "BODYWEIGHT",
        equipment_ar: "سجادة تمارين",
        environment: "HOME",
        biomechanical_match_ar: "ثبات الجذع وتثبيت أسفل الظهر بالأرض للمبتدئين والتأهيل",
        joint_safety_benefit_ar: "حماية تامة من آلام أسفل الظهر",
      },
    ],
  },

  DEAD_BUG: {
    movement_pattern: "CORE_STABILITY",
    target_muscle_ar: "عضلات الكور العميقة واستقرار الجذع",
    target_head_ar: "المستعرضة البطنية ومثبتات الحوض",
    biomechanical_focus_ar: "تثبيت أسفل الظهر بالأرض أثناء تحريك الأطراف",
    swaps: [
      {
        exercise_code: "BIRD_DOG",
        name_ar: "تمرين الكلب الطائر لثبات العمود الفقري (بيرد دوج)",
        name_en: "Bird Dog Core Exercise",
        equipment: "BODYWEIGHT",
        equipment_ar: "سجادة تمارين",
        environment: "HOME",
        biomechanical_match_ar: "تدريب التوازن العضلي المتقاطع وتقوية عضلات الظهر العميقة",
        joint_safety_benefit_ar: "تمرين تأهيلي ذهبي للوقاية من آلام الظهر",
      },
      {
        exercise_code: "PLANK_STANDARD",
        name_ar: "تمرين البلانك للثبات الكلي",
        name_en: "Standard Front Plank",
        equipment: "BODYWEIGHT",
        equipment_ar: "سجادة تمارين",
        environment: "HOME",
        biomechanical_match_ar: "مقاومة الجاذبية وتثبيت الجسم كقطعة واحدة",
        joint_safety_benefit_ar: "أمان تام للمبتدئين",
      },
    ],
  },

  SEATED_DUMBBELL_SHOULDER_PRESS: {
    movement_pattern: "VERTICAL_PUSH",
    target_muscle_ar: "عضلات الكتف الأمامي والجانبي (دفع عمودي)",
    target_head_ar: "Anterior & Lateral Deltoid",
    biomechanical_focus_ar: "مسار دفع رأسي مع حرية حركة مفصل الكتف والتوافق مع مستوى لوح الكتف",
    swaps: [
      {
        exercise_code: "MACHINE_SHOULDER_PRESS",
        name_ar: "دفع أكتاف على الجهاز (ماشين شولدر برس)",
        name_en: "Machine Shoulder Press",
        equipment: "MACHINE",
        equipment_ar: "جهاز دفع أكتاف موجه",
        environment: "GYM",
        biomechanical_match_ar: "مسار حركة موجه وثابت يعزل الكتف الأمامي ويلغي الحاجة للموازنة",
        joint_safety_benefit_ar: "ثبات كامل يحمي الكفة المدورة من الإجهاد",
      },
      {
        exercise_code: "STANDING_OVERHEAD_BARBELL_PRESS",
        name_ar: "دفع أكتاف بالبار واقفاً (أوفرهيد برس)",
        name_en: "Standing Barbell Overhead Press (OHP)",
        equipment: "BARBELL",
        equipment_ar: "بار أولمبي واقفاً",
        environment: "GYM_OR_HOME",
        biomechanical_match_ar: "القوة الوظيفية الشاملة لكامل الجسم مع تحميل وزني عالي",
        joint_safety_benefit_ar: "تفعيل الكور والأرداف لتثبيت العمود الفقري",
      },
      {
        exercise_code: "PIKE_PUSH_UP",
        name_ar: "تمرين بايك بوش آب للأكتاف بوزن الجسم",
        name_en: "Pike Push-Up",
        equipment: "BODYWEIGHT",
        equipment_ar: "سجادة تمارين أو دكة لرفع القدمين",
        environment: "HOME",
        biomechanical_match_ar: "دفع عمودي بوزن الجسم يطابق زاوية دفع الأكتاف بدقة",
        joint_safety_benefit_ar: "حرية تامة لمفصل الكتف وأمان منزلي بدون أوزان",
      },
      {
        exercise_code: "DUMBBELL_LATERAL_RAISE",
        name_ar: "رفرفة جانبية بالدمبل (عزل الكتف)",
        name_en: "Dumbbell Lateral Raise",
        equipment: "DUMBBELL",
        equipment_ar: "زوج دمبلز",
        environment: "GYM_OR_HOME",
        biomechanical_match_ar: "عزل نقي للكتف عند وجود إجهاد في عضلات الترايسبس يمنع الدفع",
        joint_safety_benefit_ar: "تجاوز آلام الكوع والترايسبس تماماً",
      },
    ],
  },

  STANDING_CALF_RAISE_MACHINE: {
    movement_pattern: "CALF_RAISE",
    target_muscle_ar: "عضلات السمانة التوأمية والنعلية",
    target_head_ar: "Gastrocnemius & Soleus",
    biomechanical_focus_ar: "استطالة كاملة لأوتار الكاحل مع عصر وانقباض قمي للسمانة",
    swaps: [
      {
        exercise_code: "SEATED_CALF_RAISE_MACHINE",
        name_ar: "رفع السمانة جالساً على الجهاز",
        name_en: "Seated Calf Raise Machine",
        equipment: "MACHINE",
        equipment_ar: "جهاز سمانة جالس",
        environment: "GYM",
        biomechanical_match_ar: "عزل العضلة النعلية العميقة مع ثني الركبة 90 درجة",
        joint_safety_benefit_ar: "إلغاء التحميل الرأسي على العمود الفقري ومفصل الركبة",
      },
      {
        exercise_code: "DUMBBELL_SINGLE_LEG_CALF_RAISE",
        name_ar: "رفع السمانة فردي بالدمبل",
        name_en: "Single-Leg Dumbbell Calf Raise",
        equipment: "DUMBBELL",
        equipment_ar: "دمبل ودرجة مرتفعة (Step)",
        environment: "GYM_OR_HOME",
        biomechanical_match_ar: "مدى حركي عميق مع معالجة التباين العضلي بين الساقين",
        joint_safety_benefit_ar: "تحكم كامل وتوازن بدون أجهزة ضخمة",
      },
      {
        exercise_code: "BODYWEIGHT_STANDING_CALF_RAISE",
        name_ar: "رفع السمانة واقفاً بوزن الجسم",
        name_en: "Bodyweight Standing Calf Raise",
        equipment: "BODYWEIGHT",
        equipment_ar: "حافة درج أو سجادة",
        environment: "HOME",
        biomechanical_match_ar: "تكرارات عالية مع توقف لثانية في قمة الحركة",
        joint_safety_benefit_ar: "أمان تام للمبتدئين وللتدريب المنزلي",
      },
      {
        exercise_code: "WALL_TIBIALIS_RAISE",
        name_ar: "رفع قصبة الساق الأمامية على الحائط",
        name_en: "Wall Tibialis Raise",
        equipment: "BODYWEIGHT",
        equipment_ar: "حائط مستوي",
        environment: "HOME",
        biomechanical_match_ar: "تقوية العضلة الظنبوبية الأمامية وموازنة مفصل الكاحل",
        joint_safety_benefit_ar: "وقاية فائقة من آلام قصبة الساق وخشونة الركبة",
      },
    ],
  },

  SEATED_HIP_ADDUCTION_MACHINE: {
    movement_pattern: "HIP_ADDUCTION",
    target_muscle_ar: "عضلات الفخذ الضامة الداخلية (Adductors)",
    target_head_ar: "Adductor Magnus & Longus",
    biomechanical_focus_ar: "تقريب الفخذين للداخل مع عصر وانقباض قمي لعضلات الضامة",
    swaps: [
      {
        exercise_code: "SEATED_HIP_ADDUCTION_MACHINE",
        name_ar: "جهاز ضم الأرجل جالس (عضلات الضامة)",
        name_en: "Seated Hip Adduction Machine",
        equipment: "MACHINE",
        equipment_ar: "جهاز ضم الأرجل جالس",
        environment: "GYM",
        biomechanical_match_ar: "عزل ميكانيكي صارم لعضلات الفخذ الضامة الداخلية",
        joint_safety_benefit_ar: "حركة جلوس معزولة ومستقرة تماماً",
      },
      {
        exercise_code: "COPENHAGEN_PLANK",
        name_ar: "بلانك كوبنهاجن للضامة وثبات الركبة",
        name_en: "Copenhagen Adductor Plank",
        equipment: "BODYWEIGHT",
        equipment_ar: "دكة مستوية وسجادة",
        environment: "HOME",
        biomechanical_match_ar: "تفعيل وظيفي عالي القوة للضامة والجذع بوزن الجسم",
        joint_safety_benefit_ar: "حماية أوتار العانة والمغبن من التمزق الرياضي",
      },
      {
        exercise_code: "CABLE_HIP_ADDUCTION",
        name_ar: "ضم الفخذ بالكابل واقفا (كيبل أداكشن)",
        name_en: "Standing Cable Hip Adduction",
        equipment: "CABLE",
        equipment_ar: "جهاز الكيبل وحزام كاحل",
        environment: "GYM",
        biomechanical_match_ar: "عزل نقي ومقاومة موجهة لعضلات الضامة",
        joint_safety_benefit_ar: "حرية مسار حركة مفصل الفخذ دون ضغط",
      },
      {
        exercise_code: "SEATED_HIP_ABDUCTION_MACHINE",
        name_ar: "جهاز إبعاد الفخذ جالس",
        name_en: "Seated Hip Abduction Machine",
        equipment: "MACHINE",
        equipment_ar: "جهاز تفتيح الأرجل جالس",
        environment: "GYM",
        biomechanical_match_ar: "موازنة عضلات الحوض المقابلة وحماية مفصل الفخذ",
        joint_safety_benefit_ar: "حركة جلوس معزولة وآمنة",
      },
    ],
  },
});

export const CANONICAL_SWAP_ALIASES = Object.freeze({
  // Chest
  "BARBELL_FLAT_BENCH_PRESS": "BARBELL_BENCH_PRESS",
  "CHEST_FLAT_BARBELL_PRESS": "BARBELL_BENCH_PRESS",
  "CHEST_INCLINE_DB_PRESS": "INCLINE_DUMBBELL_BENCH_PRESS",
  "INCLINE_BARBELL_BENCH_PRESS": "INCLINE_DUMBBELL_BENCH_PRESS",
  "INCLINE_SMITH_MACHINE_PRESS": "INCLINE_DUMBBELL_BENCH_PRESS",
  "MACHINE_CHEST_PRESS": "BARBELL_BENCH_PRESS",
  "PUSH_UP": "BARBELL_BENCH_PRESS",
  "PUSH_UPS_STANDARD": "BARBELL_BENCH_PRESS",
  "CHEST_STANDARD_PUSHUP": "BARBELL_BENCH_PRESS",
  "INCLINE_PUSH_UP": "INCLINE_DUMBBELL_BENCH_PRESS",
  "CHEST_INCLINE_PUSHUP": "INCLINE_DUMBBELL_BENCH_PRESS",
  "FEET_ELEVATED_PUSH_UP": "INCLINE_DUMBBELL_BENCH_PRESS",
  "CHEST_FEET_ELEVATED_PUSHUP": "INCLINE_DUMBBELL_BENCH_PRESS",
  "DUMBBELL_FLAT_BENCH_PRESS": "BARBELL_BENCH_PRESS",
  "DUMBBELL_FLOOR_PRESS": "BARBELL_BENCH_PRESS",
  "PEC_DECK_MACHINE_FLY": "BARBELL_BENCH_PRESS",
  "CHEST_PEC_DECK_FLY": "BARBELL_BENCH_PRESS",
  "STANDING_CABLE_CROSSOVER": "BARBELL_BENCH_PRESS",
  "FLAT_DUMBBELL_CHEST_FLY": "BARBELL_BENCH_PRESS",
  "CHEST_DIPS": "BARBELL_BENCH_PRESS",
  "HIGH_TO_LOW_CABLE_FLY": "BARBELL_BENCH_PRESS",
  "CABLE_LOW_TO_HIGH_FLY": "INCLINE_DUMBBELL_BENCH_PRESS",

  // Back
  "WIDE_GRIP_LAT_PULLDOWN": "LAT_PULLDOWN",
  "BACK_WIDE_LAT_PULLDOWN": "LAT_PULLDOWN",
  "CLOSE_GRIP_V_BAR_LAT_PULLDOWN": "LAT_PULLDOWN",
  "PULL_UPS": "LAT_PULLDOWN",
  "CHIN_UPS": "LAT_PULLDOWN",
  "BACK_PULLUP_CHINUP": "LAT_PULLDOWN",
  "BAND_LAT_PULLDOWN": "LAT_PULLDOWN",
  "SINGLE_ARM_CABLE_LAT_PULLDOWN": "LAT_PULLDOWN",
  "STRAIGHT_ARM_LAT_PULLDOWN": "LAT_PULLDOWN",
  "BACK_STRAIGHT_ARM_PULLDOWN": "LAT_PULLDOWN",
  "BARBELL_BENT_OVER_ROW": "CHEST_SUPPORTED_ROW",
  "SEATED_CABLE_ROW": "CHEST_SUPPORTED_ROW",
  "BACK_SEATED_CABLE_ROW": "CHEST_SUPPORTED_ROW",
  "ONE_ARM_DUMBBELL_ROW": "CHEST_SUPPORTED_INCLINE_DB_ROW",
  "BACK_SINGLE_ARM_DB_ROW": "CHEST_SUPPORTED_INCLINE_DB_ROW",
  "BACK_CHEST_SUPPORTED_ROW": "CHEST_SUPPORTED_INCLINE_DB_ROW",
  "CHEST_SUPPORTED_T_BAR_ROW": "CHEST_SUPPORTED_ROW",
  "INVERTED_ROW_BODYWEIGHT": "CHEST_SUPPORTED_ROW",
  "BACK_INVERTED_ROW": "CHEST_SUPPORTED_ROW",
  "BARBELL_CONVENTIONAL_DEADLIFT": "DUMBBELL_ROMANIAN_DEADLIFT",
  "BACK_CONVENTIONAL_DEADLIFT": "DUMBBELL_ROMANIAN_DEADLIFT",
  "BARBELL_ROMANIAN_DEADLIFT": "DUMBBELL_ROMANIAN_DEADLIFT",
  "HAMSTRINGS_ROMANIAN_DEADLIFT": "DUMBBELL_ROMANIAN_DEADLIFT",
  "BACK_45_HYPEREXTENSION": "KAS_GLUTE_BRIDGE",
  "GLUTE_BIASED_45_HYPEREXTENSION": "KAS_GLUTE_BRIDGE",
  "BARBELL_DUMBBELL_SHRUGS": "CHEST_SUPPORTED_ROW",
  "BACK_SHRUGS": "CHEST_SUPPORTED_ROW",
  "LAT_PRAYER": "LAT_PULLDOWN",
  "CHEST_INCLINE_MACHINE_PRESS": "INCLINE_DUMBBELL_BENCH_PRESS",
  "ABDUCTORS_CABLE_BAND_LATERAL": "CABLE_GLUTE_KICKBACK",
  "CHEST_HIGH_TO_LOW_CABLE_FLY": "BARBELL_BENCH_PRESS",
  "DECLINE_CABLE_FLY": "BARBELL_BENCH_PRESS",
  "SHOULDERS_ROTATOR_CUFF_ROTATION": "FACE_PULL",
  "EXTERNAL_ROTATION": "FACE_PULL",
  "HIP_ADDUCTION": "SEATED_HIP_ADDUCTION_MACHINE",

  // Lower Body / Legs / Quads / Hamstrings / Glutes
  "QUADS_BARBELL_SQUAT": "BARBELL_BACK_SQUAT",
  "BARBELL_FRONT_SQUAT": "BARBELL_BACK_SQUAT",
  "GOBLET_SQUAT": "BARBELL_BACK_SQUAT",
  "QUADS_GOBLET_SQUAT": "BARBELL_BACK_SQUAT",
  "LEG_PRESS_MACHINE": "BARBELL_BACK_SQUAT",
  "QUADS_HACK_PENDULUM_SQUAT": "BARBELL_BACK_SQUAT",
  "SMITH_MACHINE_SQUAT": "BARBELL_BACK_SQUAT",
  "BODYWEIGHT_AIR_SQUAT": "BARBELL_BACK_SQUAT",
  "QUADS_BULGARIAN_SPLIT_SQUAT": "BULGARIAN_SPLIT_SQUAT",
  "LEGS_BULGARIAN_SPLIT_SQUAT": "BULGARIAN_SPLIT_SQUAT",
  "DUMBBELL_WALKING_LUNGES": "BULGARIAN_SPLIT_SQUAT",
  "DEFICIT_REVERSE_LUNGE": "BULGARIAN_SPLIT_SQUAT",
  "BODYWEIGHT_SPLIT_SQUAT": "BULGARIAN_SPLIT_SQUAT",
  "DUMBBELL_STEP_UPS": "BULGARIAN_SPLIT_SQUAT",
  "SEATED_LEG_CURL_MACHINE": "SEATED_LEG_CURL",
  "HAMSTRINGS_LEG_CURL": "SEATED_LEG_CURL",
  "NORDIC_HAMSTRING_CURL": "SEATED_LEG_CURL",
  "HAMSTRINGS_NORDIC_CURL": "SEATED_LEG_CURL",
  "SLIDER_HAMSTRING_CURL": "SEATED_LEG_CURL",
  "HAMSTRINGS_SLIDER_TOWEL_CURL": "SEATED_LEG_CURL",
  "BARBELL_HIP_THRUST": "KAS_GLUTE_BRIDGE",
  "GLUTES_BARBELL_HIP_THRUST": "KAS_GLUTE_BRIDGE",
  "GLUTE_BRIDGE": "KAS_GLUTE_BRIDGE",
  "BODYWEIGHT_GLUTE_BRIDGE": "KAS_GLUTE_BRIDGE",
  "SINGLE_LEG_GLUTE_BRIDGE": "KAS_GLUTE_BRIDGE",
  "GLUTES_SINGLE_LEG_BRIDGE": "KAS_GLUTE_BRIDGE",
  "CABLE_45_GLUTE_KICKBACK": "CABLE_GLUTE_KICKBACK",
  "SEATED_HIP_ABDUCTION_LEAN_FORWARD": "SEATED_HIP_ABDUCTION_MACHINE",
  "ABDUCTORS_SEATED_MACHINE": "SEATED_HIP_ABDUCTION_MACHINE",
  "ADDUCTORS_SEATED_MACHINE": "SEATED_HIP_ADDUCTION_MACHINE",
  "COPENHAGEN_PLANK": "SEATED_HIP_ADDUCTION_MACHINE",
  "ADDUCTORS_COPENHAGEN_PLANK": "SEATED_HIP_ADDUCTION_MACHINE",
  "LEG_EXTENSION_MACHINE": "BARBELL_BACK_SQUAT",
  "QUADS_SEATED_LEG_EXTENSION": "BARBELL_BACK_SQUAT",
  "SISSY_SQUAT_BODYWEIGHT": "BARBELL_BACK_SQUAT",
  "QUADS_SISSY_SQUAT": "BARBELL_BACK_SQUAT",
  "DUMBBELL_SINGLE_LEG_CALF_RAISE": "STANDING_CALF_RAISE_MACHINE",
  "BODYWEIGHT_STANDING_CALF_RAISE": "STANDING_CALF_RAISE_MACHINE",
  "CALVES_STANDING_RAISE": "STANDING_CALF_RAISE_MACHINE",
  "SEATED_CALF_RAISE_MACHINE": "STANDING_CALF_RAISE_MACHINE",
  "CALVES_SEATED_RAISE": "STANDING_CALF_RAISE_MACHINE",
  "WALL_TIBIALIS_RAISE": "STANDING_CALF_RAISE_MACHINE",
  "CALVES_WALL_TIBIALIS_RAISE": "STANDING_CALF_RAISE_MACHINE",

  // Shoulders
  "STANDING_OVERHEAD_BARBELL_PRESS": "SEATED_DUMBBELL_SHOULDER_PRESS",
  "SHOULDERS_STANDING_BARBELL_OHP": "SEATED_DUMBBELL_SHOULDER_PRESS",
  "SHOULDERS_SEATED_DB_PRESS": "SEATED_DUMBBELL_SHOULDER_PRESS",
  "MACHINE_SHOULDER_PRESS": "SEATED_DUMBBELL_SHOULDER_PRESS",
  "PIKE_PUSH_UP": "SEATED_DUMBBELL_SHOULDER_PRESS",
  "SHOULDERS_PIKE_PUSHUP": "SEATED_DUMBBELL_SHOULDER_PRESS",
  "SHOULDERS_DB_LATERAL_RAISE": "DUMBBELL_LATERAL_RAISE",
  "SHOULDERS_CABLE_LATERAL_RAISE": "CABLE_LATERAL_RAISE",
  "MACHINE_LATERAL_RAISE": "DUMBBELL_LATERAL_RAISE",
  "BAND_LATERAL_RAISE": "DUMBBELL_LATERAL_RAISE",
  "BEHIND_BACK_CABLE_LATERAL_RAISE": "CABLE_LATERAL_RAISE",
  "CABLE_FACE_PULL": "FACE_PULL",
  "SHOULDERS_FACE_PULL": "FACE_PULL",
  "REVERSE_PEC_DECK_FLY": "FACE_PULL",
  "INCLINE_DUMBBELL_REAR_DELT_FLY": "FACE_PULL",
  "SHOULDERS_INCLINE_REAR_DELT_FLY": "FACE_PULL",
  "ROTATOR_CUFF_EXTERNAL_ROTATION": "FACE_PULL",

  // Arms
  "BARBELL_BICEPS_CURL": "INCLINE_DUMBBELL_CURL",
  "ARMS_STANDING_BARBELL_CURL": "INCLINE_DUMBBELL_CURL",
  "ARMS_INCLINE_DB_CURL": "INCLINE_DUMBBELL_CURL",
  "DUMBBELL_HAMMER_CURL": "INCLINE_DUMBBELL_CURL",
  "ARMS_HAMMER_CURL": "INCLINE_DUMBBELL_CURL",
  "CABLE_BICEPS_CURL": "INCLINE_DUMBBELL_CURL",
  "PREACHER_CURL_MACHINE": "INCLINE_DUMBBELL_CURL",
  "ARMS_PREACHER_SPIDER_CURL": "INCLINE_DUMBBELL_CURL",
  "CABLE_TRICEPS_ROPE_PUSHDOWN": "OVERHEAD_CABLE_TRICEPS_EXTENSION",
  "ARMS_CABLE_PUSHDOWN": "OVERHEAD_CABLE_TRICEPS_EXTENSION",
  "CABLE_OVERHEAD_TRICEPS_EXTENSION": "OVERHEAD_CABLE_TRICEPS_EXTENSION",
  "ARMS_OVERHEAD_TRICEPS_EXTENSION": "OVERHEAD_CABLE_TRICEPS_EXTENSION",
  "SKULL_CRUSHERS_EZ_BAR": "OVERHEAD_CABLE_TRICEPS_EXTENSION",
  "ARMS_LYING_SKULL_CRUSHERS": "OVERHEAD_CABLE_TRICEPS_EXTENSION",
  "DUMBBELL_OVERHEAD_TRICEPS_EXTENSION": "OVERHEAD_CABLE_TRICEPS_EXTENSION",
  "BENCH_DIPS": "OVERHEAD_CABLE_TRICEPS_EXTENSION",
  "BENCH_DIPS_BODYWEIGHT": "OVERHEAD_CABLE_TRICEPS_EXTENSION",
  "ARMS_CLOSE_GRIP_PUSHUP_DIPS": "OVERHEAD_CABLE_TRICEPS_EXTENSION",
  "SEATED_WRIST_CURL": "INCLINE_DUMBBELL_CURL",
  "REVERSE_WRIST_CURL": "INCLINE_DUMBBELL_CURL",
  "REVERSE_EZ_BAR_CURL": "INCLINE_DUMBBELL_CURL",
  "FARMERS_WALK": "CHEST_SUPPORTED_ROW",
  "DEAD_HANGS": "LAT_PULLDOWN",

  // Core
  "CORE_HANGING_LEG_RAISE": "HANGING_LEG_RAISE",
  "CABLE_KNEELING_CRUNCH": "HANGING_LEG_RAISE",
  "CORE_CABLE_KNEELING_CRUNCH": "HANGING_LEG_RAISE",
  "CORE_DEADBUG_BIRDDOG": "DEAD_BUG",
  "FRONT_PLANK": "DEAD_BUG",
  "STOMACH_VACUUM": "DEAD_BUG",
  "PALLOF_PRESS": "DEAD_BUG",
  "CORE_PALLOF_PRESS": "DEAD_BUG",
  "AB_WHEEL_ROLLOUT": "DEAD_BUG",
  "CORE_AB_WHEEL_ROLLOUT": "DEAD_BUG",
  "CABLE_WOODCHOPPER": "DEAD_BUG",
  "CORE_CABLE_WOODCHOPPER": "DEAD_BUG"
});

function getCatalogExercises() {
  try {
    const settingsPath = path.resolve(__dirname, "../../data/settings/exercises_catalog.json");
    if (fs.existsSync(settingsPath)) {
      return JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
    }
    const srcPath = path.resolve(__dirname, "../data/exercises-catalog.json");
    if (fs.existsSync(srcPath)) {
      return JSON.parse(fs.readFileSync(srcPath, "utf-8"));
    }
  } catch (_) {}
  return [];
}

/**
 * Retrieves smart biomechanical exercise swaps for a given exercise code.
 * Seamlessly integrates catalog-defined bidirectional alternatives and biomechanical defaults.
 * 
 * @param {string} exerciseCode - Code of base exercise
 * @param {Object} options - Filtering options (environment: "GYM" | "HOME", injury: string)
 * @returns {Array} List of biomechanically matched swap candidates
 */
export function getSmartExerciseSwaps(exerciseCode, options = {}) {
  const normalizedCode = (exerciseCode || "").toUpperCase().trim();
  const canonicalCode = CANONICAL_SWAP_ALIASES[normalizedCode] || normalizedCode;
  const entry = SMART_EXERCISE_SWAP_REGISTRY[canonicalCode] || SMART_EXERCISE_SWAP_REGISTRY[normalizedCode];

  const catalog = getCatalogExercises();
  const catalogEx = catalog.find((e) => 
    String(e.id || "").toUpperCase().trim() === normalizedCode ||
    String(e.code || "").toUpperCase().trim() === normalizedCode ||
    (Array.isArray(e.aliases) && e.aliases.some((a) => String(a).toUpperCase().trim() === normalizedCode))
  );

  const { environment = "GYM", injuryFlags = [] } = options;

  // 1. Resolve Catalog-Defined Bidirectional Direct Twin Alternatives
  const directTwins = [];
  const selfCodes = new Set([
    normalizedCode,
    ...(catalogEx?.aliases || []).map((a) => String(a).toUpperCase().trim())
  ]);
  const addedCodes = new Set(selfCodes);

  if (catalogEx && Array.isArray(catalogEx.alternatives)) {
    for (const rawAlt of catalogEx.alternatives) {
      const altId = String(rawAlt?.id || rawAlt?.exercise_code || rawAlt || "").toUpperCase().trim();
      if (!altId || addedCodes.has(altId)) continue;

      const altEx = catalog.find((e) =>
        String(e.id || "").toUpperCase().trim() === altId ||
        String(e.code || "").toUpperCase().trim() === altId ||
        (Array.isArray(e.aliases) && e.aliases.some((a) => String(a).toUpperCase().trim() === altId))
      );

      if (altEx) {
        const canonicalAltCode = String(altEx.id || altEx.code || altId).toUpperCase().trim();
        addedCodes.add(canonicalAltCode);
        const altEquip = altEx.equipment || "MACHINE";
        const isHomeCompatible = Array.isArray(altEx.environments)
          ? altEx.environments.includes("HOME")
          : (altEquip === "DUMBBELL" || altEquip === "BODYWEIGHT" || altEquip === "RESISTANCE_BAND");

        directTwins.push({
          exercise_code: altEx.id || altEx.code,
          name_ar: altEx.name_ar,
          name_en: altEx.name_en,
          equipment: altEquip,
          equipment_ar: altEx.equipment_ar || altEquip,
          environment: isHomeCompatible ? "GYM_OR_HOME" : "GYM",
          biomechanical_match_ar: `بديل توأم متبادل معتمد (${altEx.equipment_ar || altEquip})`,
          joint_safety_benefit_ar: altEx.cues_ar || "مسار حركي معتمد ومطابق للزاوية العضلية",
          is_direct_twin: true,
          image_stretch: altEx.image_stretch || (altEx.images && altEx.images[0]) || `/exercises/${altEx.id}/0.jpg`,
          image_contraction: altEx.image_contraction || (altEx.images && altEx.images[1]) || `/exercises/${altEx.id}/1.jpg`,
          thumbnail_url: altEx.thumbnail_url || altEx.image_stretch || `/exercises/${altEx.id}/0.jpg`,
          video_url: altEx.video_url || (altEx.video_id ? `https://www.youtube.com/watch?v=${altEx.video_id}` : "")
        });
      }
    }
  }

  // 2. Base Registry Candidates (fallback or supplementary)
  let registryCandidates = [];
  if (entry && Array.isArray(entry.swaps)) {
    registryCandidates = entry.swaps.filter((c) => !addedCodes.has(String(c.exercise_code).toUpperCase().trim()));
  }

  // Combine direct twins first, then registry candidates
  let candidates = [...directTwins, ...registryCandidates];

  if (candidates.length === 0 && !entry && !catalogEx) {
    return [];
  }

  // 3. Environment Filter (If HOME, prioritize Home & Bodyweight/Bands)
  if (environment === "HOME") {
    candidates = candidates.filter(
      (c) => c.environment === "HOME" || c.environment === "GYM_OR_HOME" || c.equipment === "DUMBBELL" || c.equipment === "BODYWEIGHT" || c.equipment === "RESISTANCE_BAND"
    );
  }

  // 4. Injury & Joint-Pain Bypass
  if (injuryFlags.includes("LOWER_BACK")) {
    candidates = candidates.filter(
      (c) => !c.exercise_code.includes("BARBELL_ROMANIAN_DEADLIFT") && !c.exercise_code.includes("BARBELL_BACK_SQUAT")
    );
  }
  if (injuryFlags.includes("SHOULDER")) {
    candidates = candidates.filter(
      (c) => (c.joint_safety_benefit_ar && c.joint_safety_benefit_ar.includes("كتف")) || c.equipment === "CABLE" || c.equipment === "MACHINE" || c.equipment === "DUMBBELL"
    );
  }

  const defaultPattern = entry?.movement_pattern || catalogEx?.biomechanical_focus || "STRENGTH_HYPERTROPHY";
  const defaultMuscleAr = entry?.target_muscle_ar || catalogEx?.muscle_ar || catalogEx?.target_muscle || "العضلة المستهدفة";
  const defaultHeadAr = entry?.target_head_ar || catalogEx?.muscle_group || "Target Area";

  return candidates.map((c) => ({
    ...c,
    base_movement_pattern: c.base_movement_pattern || defaultPattern,
    target_muscle_ar: c.target_muscle_ar || defaultMuscleAr,
    target_head_ar: c.target_head_ar || defaultHeadAr,
    youtube_search_url: `https://www.youtube.com/results?search_query=${encodeURIComponent((c.name_ar || "") + " " + (c.name_en || "") + " form technique")}`,
  }));
}

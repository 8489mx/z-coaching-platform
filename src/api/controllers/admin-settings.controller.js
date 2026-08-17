import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SETTINGS_DIR = path.join(__dirname, '../../../data/settings');
const INTAKE_QUESTIONS_FILE = path.join(SETTINGS_DIR, 'intake_questions.json');
const EXERCISES_CATALOG_FILE = path.join(SETTINGS_DIR, 'exercises_catalog.json');
const SYSTEM_SETTINGS_FILE = path.join(SETTINGS_DIR, 'system_settings.json');

// Helper to ensure settings directory exists
function ensureSettingsDir() {
  if (!fs.existsSync(SETTINGS_DIR)) {
    fs.mkdirSync(SETTINGS_DIR, { recursive: true });
  }
}

// ----------------------------------------------------
// DEFAULT INTAKE QUESTIONS CATALOG
// ----------------------------------------------------
const DEFAULT_INTAKE_SCHEMA = [
  // SECTION 1: Personal & Goals
  {
    id: "first_name",
    section: "personal",
    title_ar: "الاسم الأول",
    type: "text",
    required: true,
    active: true,
    placeholder_ar: "مثال: أحمد",
    order: 1
  },
  {
    id: "last_name",
    section: "personal",
    title_ar: "اسم العائلة / اللقب",
    type: "text",
    required: true,
    active: true,
    placeholder_ar: "مثال: سمير",
    order: 2
  },
  {
    id: "phone_number",
    section: "personal",
    title_ar: "رقم الواتساب للتواصل ومتابعة الخطة",
    type: "text",
    required: true,
    active: true,
    placeholder_ar: "010XXXXXXXX",
    order: 3
  },
  {
    id: "date_of_birth",
    section: "personal",
    title_ar: "تاريخ الميلاد / السن",
    type: "date",
    required: true,
    active: true,
    order: 4
  },
  {
    id: "sex",
    section: "personal",
    title_ar: "النوع",
    type: "select",
    required: true,
    active: true,
    options: [
      { value: "MALE", label: "ذكر" },
      { value: "FEMALE", label: "أنثى" }
    ],
    order: 5
  },
  {
    id: "primary_goal",
    section: "personal",
    title_ar: "الهدف الرئيسي من الاشتراك",
    type: "select",
    required: true,
    active: true,
    options: [
      { value: "FAT_LOSS", label: "حرق الدهون ونحت الجسم (تنشيف)" },
      { value: "MUSCLE_GAIN", label: "زيادة الكتلة العضلية (تضخيم)" },
      { value: "RECOMPOSITION", label: "إعادة التكوين الجسدي (حرق دهون وبناء عضلات معاً)" },
      { value: "ATHLETIC_PERFORMANCE", label: "تحسين اللياقة والأداء الرياضي" }
    ],
    order: 6
  },

  // SECTION 2: Body & Lifestyle
  {
    id: "height_cm",
    section: "body",
    title_ar: "الطول (سم)",
    type: "number",
    required: true,
    active: true,
    placeholder_ar: "175",
    order: 7
  },
  {
    id: "weight_kg",
    section: "body",
    title_ar: "الوزن الحالي الصباحي (كجم)",
    type: "number",
    required: true,
    active: true,
    placeholder_ar: "80",
    order: 8
  },
  {
    id: "waist_cm",
    section: "body",
    title_ar: "محيط الخصر عند السرة (سم)",
    type: "number",
    required: true,
    active: true,
    placeholder_ar: "85",
    order: 9
  },
  {
    id: "daily_activity",
    section: "body",
    title_ar: "طبيعة النشاط والعمل اليومي",
    type: "select",
    required: true,
    active: true,
    options: [
      { value: "SEDENTARY", label: "مكتبي خامل (قليل الحركة)" },
      { value: "LIGHT", label: "نشاط خفيف (حركة متوسطة)" },
      { value: "MODERATE", label: "نشاط معتدل (وقوف وحركة مستمرة)" },
      { value: "VERY_ACTIVE", label: "نشاط عالي (عمل بدني شاق / رياضي)" }
    ],
    order: 10
  },
  {
    id: "sleep_hours",
    section: "body",
    title_ar: "متوسط عدد ساعات النوم يومياً",
    type: "number",
    required: true,
    active: true,
    placeholder_ar: "7",
    order: 11
  },

  // SECTION 3: Medical
  {
    id: "medical_conditions",
    section: "medical",
    title_ar: "هل تعاني من أي أمراض مزمنة؟ (ضغط، سكر، غدة، حساسية، إلخ)",
    type: "textarea",
    required: false,
    active: true,
    placeholder_ar: "اكتب 'لا يوجد' إن لم تكن تعاني من شيء",
    order: 12
  },
  {
    id: "injuries",
    section: "medical",
    title_ar: "هل تعاني من إصابات سابقة أو آلام مفاصل (ركبة، كتف، أسفل ظهر)؟",
    type: "textarea",
    required: false,
    active: true,
    placeholder_ar: "اذكر مكان الإصابة وطبيعة الألم إن وجد",
    order: 13
  },

  // SECTION 4: Nutrition
  {
    id: "preferred_meal_count",
    section: "nutrition",
    title_ar: "عدد الوجبات المفضلة لك يومياً",
    type: "select",
    required: true,
    active: true,
    options: [
      { value: "2", label: "وجبتين رئيسيتين" },
      { value: "3", label: "3 وجبات رئيسية (موصى به)" },
      { value: "4", label: "4 وجبات موزعة" },
      { value: "5", label: "5 وجبات" }
    ],
    order: 14
  },
  {
    id: "allergies_and_dislikes",
    section: "nutrition",
    title_ar: "أطعمة تسبب لك حساسية أو لا تحب تناولها إطلاقاً",
    type: "textarea",
    required: false,
    active: true,
    placeholder_ar: "مثل: حساسية لاكتوز، كاره للسمك، كاره للبيض...",
    order: 15
  },

  // SECTION 5: Training & Experience
  {
    id: "training_location",
    section: "training",
    title_ar: "مكان التمرين المتاح",
    type: "select",
    required: true,
    active: true,
    options: [
      { value: "GYM", label: "جيم تجاري كامل التجهيزات" },
      { value: "HOME_DUMBBELLS", label: "المنزل مع أوزان ودمبلز" },
      { value: "HOME_BODYWEIGHT", label: "المنزل بوزن الجسم فقط" }
    ],
    order: 16
  },
  {
    id: "available_days_per_week",
    section: "training",
    title_ar: "عدد الأيام المتاحة للتمرين أسبوعياً",
    type: "select",
    required: true,
    active: true,
    options: [
      { value: "3", label: "3 أيام أسبوعياً" },
      { value: "4", label: "4 أيام أسبوعياً (مثالي)" },
      { value: "5", label: "5 أيام أسبوعياً" },
      { value: "6", label: "6 أيام أسبوعياً" }
    ],
    order: 17
  },
  {
    id: "experience_level",
    section: "training",
    title_ar: "مستوى خبرتك السابقة في الجيم",
    type: "select",
    required: true,
    active: true,
    options: [
      { value: "BEGINNER", label: "مبتدئ تماماً (أول مرة أتمرن بانتظام)" },
      { value: "INTERMEDIATE", label: "متوسط (أتمرن منذ 6 شهور إلى سنتين)" },
      { value: "ADVANCED", label: "متقدم (خبرة أكثر من سنتين وأعرف التكنيك جيداً)" }
    ],
    order: 18
  }
];

// Helper to get or init intake questions
export function getIntakeQuestionsFile() {
  ensureSettingsDir();
  if (!fs.existsSync(INTAKE_QUESTIONS_FILE)) {
    fs.writeFileSync(INTAKE_QUESTIONS_FILE, JSON.stringify(DEFAULT_INTAKE_SCHEMA, null, 2), 'utf-8');
    return DEFAULT_INTAKE_SCHEMA;
  }
  try {
    const raw = fs.readFileSync(INTAKE_QUESTIONS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_INTAKE_SCHEMA;
  }
}

export function saveIntakeQuestionsFile(data) {
  ensureSettingsDir();
  fs.writeFileSync(INTAKE_QUESTIONS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// ----------------------------------------------------
// DEFAULT EXERCISES CATALOG
// ----------------------------------------------------
const DEFAULT_EXERCISES_CATALOG = [
  {
    id: "BARBELL_BENCH_PRESS",
    name_ar: "بنش برس بالبار مستوي",
    name_en: "Barbell Bench Press",
    muscle_group: "CHEST",
    muscle_ar: "عضلات الصدر (الصدر الأوسط)",
    equipment: "BARBELL",
    equipment_ar: "بار مستوي",
    difficulty: "متوسط",
    video_url: "https://www.youtube.com/watch?v=rT7DgCr-3pg",
    video_id: "rT7DgCr-3pg",
    cues_ar: "ثبّت لوحي الكتف للخلف والأسفل (Scapular Retraction)، اجعل قدميك ثابتتين على الأرض، وانزل بالبار إلى منتصف الصدر مع زاوية كوع 45-60 درجة.",
    mistakes_ar: "فتح الكوع بزاوية 90 درجة بالكامل مما يضع حملاً زائداً على مفصل الكتف، أو ارتداد البار عن عظام الصدر."
  },
  {
    id: "INCLINE_DUMBBELL_BENCH_PRESS",
    name_ar: "بنش برس مائل بالدمبل",
    name_en: "Incline Dumbbell Bench Press",
    muscle_group: "CHEST",
    muscle_ar: "الصدر العلوي (Clavicular Head)",
    equipment: "DUMBBELL",
    equipment_ar: "دمبلز ودكة مائلة",
    difficulty: "متوسط",
    video_url: "https://www.youtube.com/watch?v=8iPEnn-ltC8",
    video_id: "8iPEnn-ltC8",
    cues_ar: "اضبط الدكة بزاوية 30-45 درجة، انزل بالدمبلز مع عصر كامل لأعلى الصدر وتحكم تام في المسار السلبي.",
    mistakes_ar: "رفع زاوية الدكة أكثر من 45 درجة مما يحول الحمل لعضلات الكتف الأمامي بدلاً من الصدر."
  },
  {
    id: "BARBELL_DEADLIFT",
    name_ar: "ديدليفت بالبار (الرفعة الميتة)",
    name_en: "Conventional Barbell Deadlift",
    muscle_group: "BACK",
    muscle_ar: "الظهر بالكامل، السلسلة الخلفية والأرداف",
    equipment: "BARBELL",
    equipment_ar: "بار وأوزان أولمبية",
    difficulty: "متقدم",
    video_url: "https://www.youtube.com/watch?v=op9kVnSso6Q",
    video_id: "op9kVnSso6Q",
    cues_ar: "اجعل البار ملاصقاً لقصبة الساق، الظهر مستقيم ومشدود بالكامل، وادفع الأرض بقدميك مع إحكام عضلات اللاتس والكور.",
    mistakes_ar: "تقوس أسفل الظهر (Lumbar Flexion) أو سحب الوزن بالذراعين بدلاً من دفع الأرض بالأرجل."
  },
  {
    id: "LAT_PULLDOWN_WIDE_GRIP",
    name_ar: "سحب عالي قبضة واسعة (لات بول داون)",
    name_en: "Wide Grip Lat Pulldown",
    muscle_group: "BACK",
    muscle_ar: "عضلة اللاتس (تعريض الظهر)",
    equipment: "MACHINE",
    equipment_ar: "جهاز السحب العالي",
    difficulty: "مبتدئ",
    video_url: "https://www.youtube.com/watch?v=CAwf7n6Luuc",
    video_id: "CAwf7n6Luuc",
    cues_ar: "امسك البار أوسع قليلاً من الكتفين، انزل بالبار باتجاه أعلى الصدر مع إرجاع الكوعين للأسفل والداخل وعصر لوحي الكتف.",
    mistakes_ar: "التأرجح للخلف بزاوية مفرطة أو سحب البار خلف الرقبة."
  },
  {
    id: "BARBELL_SQUAT",
    name_ar: "سكوات بالبار حر (القرفصاء الخلفية)",
    name_en: "Barbell Back Squat",
    muscle_group: "LEGS",
    muscle_ar: "عضلات الفخذ الأمامية (Quadriceps) والأرداف",
    equipment: "BARBELL",
    equipment_ar: "راك سكوات وبار أولمبي",
    difficulty: "متقدم",
    video_url: "https://www.youtube.com/watch?v=bEv6CCg2BC8",
    video_id: "bEv6CCg2BC8",
    cues_ar: "ثبت البار على الترابيس، خذ نفساً عميقاً في البطن (Valsalva Maneuver)، انزل بوزنك حتى يصبح الفخذ موازياً للأرض مع الحفاظ على استقامة العمود الفقري.",
    mistakes_ar: "ارتفاع الكعبين عن الأرض أو انحناء الركبتين للداخل أثناء الصعود (Knee Valgus)."
  },
  {
    id: "ROMANIAN_DEADLIFT_DB",
    name_ar: "ديدليفت روماني بالدمبل (RDL)",
    name_en: "Dumbbell Romanian Deadlift",
    muscle_group: "LEGS",
    muscle_ar: "عضلات الفخذ الخلفية (Hamstrings) والأرداف (Glutes)",
    equipment: "DUMBBELL",
    equipment_ar: "زوج دمبلز",
    difficulty: "متوسط",
    video_url: "https://www.youtube.com/watch?v=vbpjSpvH_4M",
    video_id: "vbpjSpvH_4M",
    cues_ar: "ارجع الحوض للخلف (Hip Hinge) مع ثنية طفيفة وثابتة في الركبة، وانزل بالدمبلز بمحاذاة الساقين حتى تشعر بإطالة قوية في أوتار الفخذ الخلفية.",
    mistakes_ar: "ثني الركبتين والنزول كأنه سكوات، أو تقوس الظهر بدلاً من حركة الحوض."
  },
  {
    id: "OVERHEAD_PRESS_BARBELL",
    name_ar: "ضغط كتف بالبار واقفاً (Overhead Press)",
    name_en: "Standing Barbell Overhead Press",
    muscle_group: "SHOULDERS",
    muscle_ar: "عضلات الكتف الأمامية والجانبية واستقرار الكور",
    equipment: "BARBELL",
    equipment_ar: "بار أولمبي واقفاً",
    difficulty: "متقدم",
    video_url: "https://www.youtube.com/watch?v=2yjwXTZQDDI",
    video_id: "2yjwXTZQDDI",
    cues_ar: "اضغط عضلات المؤخرة والبطن بإحكام، ادفع البار رأسياً في خط مستقيم فوق الرأس مع تمرير الرأس للأمام قليلاً في قمة الحركة.",
    mistakes_ar: "تقوس مفرط في أسفل الظهر لاستخدام عضلات الصدر العلوي للدفع."
  },
  {
    id: "DUMBBELL_LATERAL_RAISE",
    name_ar: "رفرفة كتف جانبي بالدمبل",
    name_en: "Dumbbell Lateral Raise",
    muscle_group: "SHOULDERS",
    muscle_ar: "عضلة الكتف الجانبي (Lateral Deltoid)",
    equipment: "DUMBBELL",
    equipment_ar: "زوج دمبلز خفيف إلى متوسط",
    difficulty: "مبتدئ",
    video_url: "https://www.youtube.com/watch?v=3VcKaXpzqRo",
    video_id: "3VcKaXpzqRo",
    cues_ar: "انحنِ للأمام 5 درجات، ارفع الدمبلز بزاوية طفيفة للأمام (Scapular Plane) مع توجيه الكوع للأعلى كأنك تسكب الماء من إبريق.",
    mistakes_ar: "أرجحة الجذع واستخدام عضلات الترابيس لرفع الوزن بدلاً من عزل الكتف الجانبي."
  },
  {
    id: "DUMBBELL_BICEPS_CURL",
    name_ar: "مرجحة بايسبس بالدمبل متبادل",
    name_en: "Alternating Dumbbell Biceps Curl",
    muscle_group: "ARMS",
    muscle_ar: "عضلات البايسبس (ذراع أمامي)",
    equipment: "DUMBBELL",
    equipment_ar: "زوج دمبلز",
    difficulty: "مبتدئ",
    video_url: "https://www.youtube.com/watch?v=ykJmrZ5v0Oo",
    video_id: "ykJmrZ5v0Oo",
    cues_ar: "ثبّت الكوعين بجانب الجسم تماماً، لف المعصم للخارج في قمة الحركة (Supination) لعصر عضلة البايسبس بقوة.",
    mistakes_ar: "تحريك الكوعين للأمام أو الخلف للاستعانة بعضلات الكتف والظهر."
  },
  {
    id: "TRICEPS_ROPE_PUSHDOWN",
    name_ar: "ضغط ترايسبس بالحبل على الكابل",
    name_en: "Cable Rope Triceps Pushdown",
    muscle_group: "ARMS",
    muscle_ar: "عضلات الترايسبس (الرأس الجانبي والطويل)",
    equipment: "CABLE",
    equipment_ar: "جهاز الكابل وحبل الترايسبس",
    difficulty: "مبتدئ",
    video_url: "https://www.youtube.com/watch?v=vB5OHsJ3EME",
    video_id: "vB5OHsJ3EME",
    cues_ar: "ثبت الكوعين بجوار الأضلاع، اضغط لأسفل مع فتح طرفي الحبل للخارج في نهاية الحركة لتحقيق أقصى انقباض.",
    mistakes_ar: "السماح للكوعين بالصعود والنزول أثناء الحركة مما يلغي التركيز على الترايسبس."
  }
];

export function getExercisesCatalogFile() {
  ensureSettingsDir();
  if (!fs.existsSync(EXERCISES_CATALOG_FILE)) {
    fs.writeFileSync(EXERCISES_CATALOG_FILE, JSON.stringify(DEFAULT_EXERCISES_CATALOG, null, 2), 'utf-8');
    return DEFAULT_EXERCISES_CATALOG;
  }
  try {
    const raw = fs.readFileSync(EXERCISES_CATALOG_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_EXERCISES_CATALOG;
  }
}

export function saveExercisesCatalogFile(data) {
  ensureSettingsDir();
  fs.writeFileSync(EXERCISES_CATALOG_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// ----------------------------------------------------
// CONTROLLER HANDLERS
// ----------------------------------------------------

// 1. Intake Schema Endpoints
export const getIntakeSchema = (req, res) => {
  try {
    const questions = getIntakeQuestionsFile();
    return res.status(200).json({ success: true, questions });
  } catch (err) {
    return res.status(500).json({ error: "فشل جلب أسئلة الاستمارة", details: err.message });
  }
};

export const updateIntakeQuestion = (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    let questions = getIntakeQuestionsFile();

    const idx = questions.findIndex(q => q.id === id);
    if (idx === -1) {
      // If not found, add as new question
      const newQ = {
        id: id || `q_${Date.now()}`,
        section: updateData.section || "personal",
        title_ar: updateData.title_ar || "سؤال جديد",
        type: updateData.type || "text",
        required: updateData.required ?? false,
        active: updateData.active ?? true,
        options: updateData.options || [],
        placeholder_ar: updateData.placeholder_ar || "",
        order: questions.length + 1
      };
      questions.push(newQ);
    } else {
      questions[idx] = { ...questions[idx], ...updateData };
    }

    saveIntakeQuestionsFile(questions);
    return res.status(200).json({ success: true, message: "تم تحديث السؤال بنجاح", questions });
  } catch (err) {
    return res.status(500).json({ error: "فشل تحديث السؤال", details: err.message });
  }
};

export const deleteIntakeQuestion = (req, res) => {
  try {
    const { id } = req.params;
    let questions = getIntakeQuestionsFile();
    questions = questions.filter(q => q.id !== id);
    saveIntakeQuestionsFile(questions);
    return res.status(200).json({ success: true, message: "تم حذف السؤال بنجاح", questions });
  } catch (err) {
    return res.status(500).json({ error: "فشل حذف السؤال", details: err.message });
  }
};

// 2. Exercise Catalog Endpoints
export const getAdminExercises = (req, res) => {
  try {
    const exercises = getExercisesCatalogFile();
    return res.status(200).json({ success: true, total: exercises.length, exercises });
  } catch (err) {
    return res.status(500).json({ error: "فشل جلب مكتبة التمارين", details: err.message });
  }
};

export const saveAdminExercise = (req, res) => {
  try {
    const exerciseData = req.body;
    let exercises = getExercisesCatalogFile();

    // Extract video ID from youtube URL if provided
    let video_id = exerciseData.video_id;
    if (exerciseData.video_url && !video_id) {
      const match = exerciseData.video_url.match(/(?:v=|\/embed\/|\.be\/)([\w-]{11})/);
      if (match) video_id = match[1];
    }

    const exId = exerciseData.id || `EX_${Date.now()}`;
    const idx = exercises.findIndex(e => e.id === exId);

    const fullExercise = {
      id: exId,
      name_ar: exerciseData.name_ar || "تمرين جديد",
      name_en: exerciseData.name_en || "New Exercise",
      muscle_group: exerciseData.muscle_group || "CHEST",
      muscle_ar: exerciseData.muscle_ar || "عضلات الصدر",
      equipment: exerciseData.equipment || "BARBELL",
      equipment_ar: exerciseData.equipment_ar || "بار مستوي",
      difficulty: exerciseData.difficulty || "متوسط",
      video_url: exerciseData.video_url || (video_id ? `https://www.youtube.com/watch?v=${video_id}` : ""),
      video_id: video_id || "",
      cues_ar: exerciseData.cues_ar || "",
      mistakes_ar: exerciseData.mistakes_ar || ""
    };

    if (idx === -1) {
      exercises.push(fullExercise);
    } else {
      exercises[idx] = { ...exercises[idx], ...fullExercise };
    }

    saveExercisesCatalogFile(exercises);
    return res.status(200).json({ success: true, message: "تم حفظ التمرين بنجاح", exercise: fullExercise, exercises });
  } catch (err) {
    return res.status(500).json({ error: "فشل حفظ التمرين", details: err.message });
  }
};

export const deleteAdminExercise = (req, res) => {
  try {
    const { id } = req.params;
    let exercises = getExercisesCatalogFile();
    exercises = exercises.filter(e => e.id !== id);
    saveExercisesCatalogFile(exercises);
    return res.status(200).json({ success: true, message: "تم حذف التمرين بنجاح", exercises });
  } catch (err) {
    return res.status(500).json({ error: "فشل حذف التمرين", details: err.message });
  }
};

// ----------------------------------------------------
// SUBSCRIPTION PACKAGES MANAGEMENT
// ----------------------------------------------------
const PACKAGES_FILE = path.join(SETTINGS_DIR, 'subscription_packages.json');

const DEFAULT_PACKAGES = [
  {
    id: "ELITE_3_PLUS_1",
    name_ar: "باقة إيليت",
    name_en: "Elite Package",
    badge_ar: "عرض خاص 3 شهور + 1 مجاناً",
    duration_months: 3,
    free_months: 1,
    total_months: 4,
    price_egp: 2500,
    features: [
      "خطة تغذية ذكية مع توزين الماكروز بالجرام",
      "جدول تمارين تفاعلي بالأجهزة والوزن المطلوب",
      "متابعة أسبوعية وتكيف تلقائي للخطة",
      "دعم مستمر عبر الواتساب"
    ],
    active: true,
    is_featured: true,
    order: 1
  },
  {
    id: "MAX_3_PLUS_1",
    name_ar: "باقة ماكس",
    name_en: "Max VIP Package",
    badge_ar: "VIP أقصى اهتمام ومتابعة",
    duration_months: 3,
    free_months: 1,
    total_months: 4,
    price_egp: 3500,
    features: [
      "كل مميزات باقة إيليت بالكامل",
      "مراجعة وتدقيق تكنيك التمارين بالفيديو",
      "تعديلات فورية غير محدودة على الوجبات والتمارين",
      "أولوية التواصل المباشر والمكالمات مع الكابتن"
    ],
    active: true,
    is_featured: true,
    order: 2
  },
  {
    id: "MONTH_1",
    name_ar: "باقة شهر واحد",
    name_en: "1 Month Starter",
    badge_ar: "تجربة سريعة",
    duration_months: 1,
    free_months: 0,
    total_months: 1,
    price_egp: 900,
    features: [
      "خطة تغذية وتدريب مخصصة لشهر كامل",
      "متابعة وتكييف أسبوعي"
    ],
    active: true,
    is_featured: false,
    order: 3
  },
  {
    id: "MONTHS_6",
    name_ar: "باقة 6 شهور",
    name_en: "6 Months Transformation",
    badge_ar: "تحول بدني كامل",
    duration_months: 6,
    free_months: 2,
    total_months: 8,
    price_egp: 4500,
    features: [
      "تحول بدني شامل على مرحلتين (تنشيف ثم بناء)",
      "تطوير مستمر للأوزان والتغذية",
      "شاملة شهرين إضافيين مجاناً"
    ],
    active: true,
    is_featured: false,
    order: 4
  }
];

export function getPackagesFile() {
  ensureSettingsDir();
  if (!fs.existsSync(PACKAGES_FILE)) {
    fs.writeFileSync(PACKAGES_FILE, JSON.stringify(DEFAULT_PACKAGES, null, 2), 'utf8');
    return DEFAULT_PACKAGES;
  }
  try {
    const raw = fs.readFileSync(PACKAGES_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return DEFAULT_PACKAGES;
  }
}

export function savePackagesFile(packages) {
  ensureSettingsDir();
  fs.writeFileSync(PACKAGES_FILE, JSON.stringify(packages, null, 2), 'utf8');
}

export const getSubscriptionPackages = (req, res) => {
  try {
    const packages = getPackagesFile();
    return res.status(200).json({ success: true, packages });
  } catch (err) {
    return res.status(500).json({ error: "فشل استرجاع الباقات", details: err.message });
  }
};

export const saveSubscriptionPackage = (req, res) => {
  try {
    const pkgData = req.body;
    let packages = getPackagesFile();

    const pkgId = pkgData.id || `PKG_${Date.now()}`;
    const idx = packages.findIndex(p => p.id === pkgId);

    const fullPackage = {
      id: pkgId,
      name_ar: pkgData.name_ar || "باقة جديدة",
      name_en: pkgData.name_en || "New Package",
      badge_ar: pkgData.badge_ar || "",
      duration_months: Number(pkgData.duration_months) || 3,
      free_months: Number(pkgData.free_months) || 0,
      total_months: (Number(pkgData.duration_months) || 3) + (Number(pkgData.free_months) || 0),
      price_egp: Number(pkgData.price_egp) || 2500,
      features: Array.isArray(pkgData.features) ? pkgData.features : (typeof pkgData.features === 'string' ? pkgData.features.split('\n').filter(Boolean) : []),
      active: pkgData.active !== undefined ? pkgData.active : true,
      is_featured: Boolean(pkgData.is_featured),
      order: Number(pkgData.order) || (packages.length + 1)
    };

    if (idx === -1) {
      packages.push(fullPackage);
    } else {
      packages[idx] = { ...packages[idx], ...fullPackage };
    }

    savePackagesFile(packages);
    return res.status(200).json({ success: true, message: "تم حفظ بيانات الباقة بنجاح", package: fullPackage, packages });
  } catch (err) {
    return res.status(500).json({ error: "فشل حفظ الباقة", details: err.message });
  }
};

export const deleteSubscriptionPackage = (req, res) => {
  try {
    const { id } = req.params;
    let packages = getPackagesFile();
    packages = packages.filter(p => p.id !== id);
    savePackagesFile(packages);
    return res.status(200).json({ success: true, message: "تم حذف الباقة بنجاح", packages });
  } catch (err) {
    return res.status(500).json({ error: "فشل حذف الباقة", details: err.message });
  }
};

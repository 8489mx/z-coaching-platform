import { MASTER_EXERCISE_DICTIONARY } from "../../exercise-catalog-v2/master-exercise-translations.js";

// Enriched Exercise Catalog with muscle classifications, equipment, coaching cues and video tutorials
const EXERCISES_DATABASE = [
  // CHEST (الصدر)
  {
    id: "BARBELL_BENCH_PRESS",
    name_ar: "بنش برس بالبار مستوي",
    name_en: "Barbell Bench Press",
    muscle_group: "CHEST",
    muscle_ar: "عضلات الصدر (الصدر الأوسط)",
    equipment: "BARBELL",
    equipment_ar: "بار مستوي",
    difficulty: "متوسط",
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
    video_id: "8iPEnn-ltC8",
    cues_ar: "اضبط الدكة بزاوية 30-45 درجة، انزل بالدمبلز مع عصر كامل لأعلى الصدر وتحكم تام في المسار السلبي.",
    mistakes_ar: "رفع زاوية الدكة أكثر من 45 درجة مما يحول الحمل لعضلات الكتف الأمامي بدلاً من الصدر."
  },
  {
    id: "CHEST_FLY_CABLE",
    name_ar: "تفتيح كابل للصدر (كيبل فلاي)",
    name_en: "Cable Chest Fly",
    muscle_group: "CHEST",
    muscle_ar: "عضلات الصدر وعزل الألياف الداخلية",
    equipment: "CABLE",
    equipment_ar: "جهاز الكيبل المزدوج",
    difficulty: "مبتدئ",
    video_id: "taI4XduLpBe",
    cues_ar: "حافظ على انحناءة بسيطة وثابتة في الكوعين، واجمع المقبضين أمام منتصف الصدر مع عصر لمدة ثانية واحدة في قمة الحركة.",
    mistakes_ar: "ثني وفرد الذراعين أثناء الحركة كأنها تمرين دفع، أو استخدام أوزان ثقيلة تمنع العزل."
  },

  // BACK (الظهر)
  {
    id: "BARBELL_DEADLIFT",
    name_ar: "ديدليفت بالبار (الرفعة الميتة)",
    name_en: "Conventional Barbell Deadlift",
    muscle_group: "BACK",
    muscle_ar: "الظهر بالكامل، السلسلة الخلفية والأرداف",
    equipment: "BARBELL",
    equipment_ar: "بار وأوزان أولمبية",
    difficulty: "متقدم",
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
    video_id: "CAwf7n6Luuc",
    cues_ar: "امسك البار أوسع قليلاً من الكتفين، انزل بالبار باتجاه أعلى الصدر مع إرجاع الكوعين للأسفل والداخل وعصر لوحي الكتف.",
    mistakes_ar: "الميلان للخلف بشدة واستخدام عزم الجسم المفرط بدلاً من سحب عضلات الظهر."
  },
  {
    id: "BARBELL_BENT_OVER_ROW",
    name_ar: "تجديف بالبار منحني (بار رُو)",
    name_en: "Barbell Bent Over Row",
    muscle_group: "BACK",
    muscle_ar: "كثافة الظهر والترابيس الوسطى والسفلية",
    equipment: "BARBELL",
    equipment_ar: "بار أولمبي",
    difficulty: "متوسط",
    video_id: "6TSzn_i2Gzg",
    cues_ar: "انحنِ بجذعك للأمام بزاوية 45 درجة مع الحفاظ على استقامة الظهر، واسحب البار باتجاه السرة مع توجيه الكوعين للخلف.",
    mistakes_ar: "الوقوف بشكل مستقيم جداً أو تأرجح الجذع للأعلى والأسفل أثناء السحب."
  },

  // LEGS (الأرجل)
  {
    id: "BARBELL_BACK_SQUAT",
    name_ar: "سكوات خلفي بالبار (القرفصاء)",
    name_en: "Barbell Back Squat",
    muscle_group: "LEGS",
    muscle_ar: "الفخذ الأمامي، المؤخرة والسمانة",
    equipment: "BARBELL",
    equipment_ar: "راك الاسكوات والبار",
    difficulty: "متقدم",
    video_id: "bEv6CCg2BC8",
    cues_ar: "ضع البار على عضلات الترابيس (High Bar) أو الكتف الخلفي (Low Bar)، افتح ركبتيك في اتجاه أصابع القدمين وانزل حتى يتوازى الفخذ مع الأرض.",
    mistakes_ar: "انهيار الركبتين للداخل (Valgus Collapse) أو رفع الكعبين عن الأرض أثناء النزول."
  },
  {
    id: "ROMANIAN_DEADLIFT_DUMBBELL",
    name_ar: "ديدليفت روماني بالدمبل (RDL)",
    name_en: "Dumbbell Romanian Deadlift",
    muscle_group: "LEGS",
    muscle_ar: "الفخذ الخلفي (Hamstrings) والأرداف",
    equipment: "DUMBBELL",
    equipment_ar: "زوج دمبلز",
    difficulty: "متوسط",
    video_id: "JCXUYuzwNrM",
    cues_ar: "اثنِ الركبتين انثناءة طفيفة جداً وثابتة، وادفع الحوض للخلف كأنك تغلق باباً بمؤخرتك حتى تشعر بإطالة عميقة في الفخذ الخلفي.",
    mistakes_ar: "ثني الركبتين كأنك تلعب سكوات، مما يقلل التركيز على عضلات الفخذ الخلفية."
  },
  {
    id: "LEG_EXTENSION_MACHINE",
    name_ar: "تمديد الأرجل على الجهاز (ليج إكستنشن)",
    name_en: "Leg Extension",
    muscle_group: "LEGS",
    muscle_ar: "عزل عضلة الفخذ الأمامية (Quadriceps)",
    equipment: "MACHINE",
    equipment_ar: "جهاز الليج إكستنشن",
    difficulty: "مبتدئ",
    video_id: "YyvSfVjQeL0",
    cues_ar: "ثبّت ظهرك بالمقعد، افرد الساقين بالكامل مع عصر عضلات الفخذ لمدة ثانية في الأعلى، ثم اهبط ببطء خلال ثانيتين.",
    mistakes_ar: "استخدام وزن مفرط يسبب ركل الوزن بدون تحكم عضلي في النزول."
  },

  // SHOULDERS (الأكتاف)
  {
    id: "OVERHEAD_SHOULDER_PRESS_DUMBBELL",
    name_ar: "ضغط كتف بالدمبل جالس (شولدر برس)",
    name_en: "Seated Dumbbell Shoulder Press",
    muscle_group: "SHOULDERS",
    muscle_ar: "الكتف الأمامي والجانبي",
    equipment: "DUMBBELL",
    equipment_ar: "دمبلز ودكة عمودية",
    difficulty: "متوسط",
    video_id: "qEwKCR5JCog",
    cues_ar: "اجعل الكوعين مائلين للأمام قليلاً في المستوى الكتفي (Scapular Plane)، ادفع الدمبلز لأعلى الرأس بسلاسة دون ملامستها بقوة.",
    mistakes_ar: "تقويس أسفل الظهر بشدة أو فرد الكوعين بزاوية حادة خارج نطاق الراحة المفصلية."
  },
  {
    id: "LATERAL_RAISE_DUMBBELL",
    name_ar: "رفرفة جانبية بالدمبل (لترال رايز)",
    name_en: "Dumbbell Lateral Raise",
    muscle_group: "SHOULDERS",
    muscle_ar: "عضلة الكتف الجانبي (عزل وتدوير)",
    equipment: "DUMBBELL",
    equipment_ar: "دمبلز خفيفة إلى متوسطة",
    difficulty: "مبتدئ",
    video_id: "3VcKaXpzqRo",
    cues_ar: "ارفع الذراعين للأجناب حتى مستوى الكتف مع قيادة الحركة بالكوعين والإبهام مائل للأسفل قليلاً، مع ثبات كامل للجذع.",
    mistakes_ar: "تأرجح الظهر والاعتماد على عزم القصور الذاتي لرفع أوزان ثقيلة."
  },
  {
    id: "FACE_PULL_CABLE",
    name_ar: "فيس بول بالحبل على الكابل",
    name_en: "Cable Face Pull",
    muscle_group: "SHOULDERS",
    muscle_ar: "الكتف الخلفي، الترابيس والعضلات المدورة",
    equipment: "CABLE",
    equipment_ar: "جهاز الكيبل مع ملحق الحبل",
    difficulty: "مبتدئ",
    video_id: "rep-qVOkqgk",
    cues_ar: "اسحب الحبل باتجاه الجبهة والعينين مع تدوير الكتف للخارج وعصر لوحي الكتف للخلف.",
    mistakes_ar: "السحب للأسفل باتجاه الصدر بدلاً من الجبهة."
  },

  // ARMS: BICEPS & TRICEPS (الذراعين)
  {
    id: "BARBELL_BICEP_CURL",
    name_ar: "تبادل أو باي بالبار واقف (بايسبس كيرل)",
    name_en: "Standing Barbell Bicep Curl",
    muscle_group: "ARMS",
    muscle_ar: "عضلة البايسبس (الرأسين)",
    equipment: "BARBELL",
    equipment_ar: "بار مستقيم أو بار EZ",
    difficulty: "مبتدئ",
    video_id: "kwG2ipFRgfo",
    cues_ar: "ثبّت الكوعين بجانب خصرك طوال الحركة، ارفع البار مع عصر البايسبس في القمة وانزل ببطء وتحكم تام.",
    mistakes_ar: "تحريك الكوعين للأمام وللخلف أو أرجحة الظهر أثناء الرفع."
  },
  {
    id: "TRICEPS_ROPE_PUSHDOWN",
    name_ar: "ترايسبس بالحبل على الكابل (بوش داون)",
    name_en: "Triceps Rope Pushdown",
    muscle_group: "ARMS",
    muscle_ar: "عضلة الترايسبس (الرأس الجانبي والطويل)",
    equipment: "CABLE",
    equipment_ar: "كيبل وحبل",
    difficulty: "مبتدئ",
    video_id: "vB5OHsJ3EME",
    cues_ar: "ثبّت الكوعين بجانبيك، ادفع الحبل للأسفل وافردهما للأطراف في نهاية المدى الحركي لعصر كامل للترايسبس.",
    mistakes_ar: "ترك الكوعين يتحركان للأعلى مع الكيبل أثناء الصعود."
  },

  // ABS & CORE (البطن والكور)
  {
    id: "HANGING_LEG_RAISE",
    name_ar: "رفع الأرجل على العقلة (هانجينج ليج رايز)",
    name_en: "Hanging Leg Raise",
    muscle_group: "CORE",
    muscle_ar: "عضلات البطن السفلية والكور",
    equipment: "BODYWEIGHT",
    equipment_ar: "عقلة سحب",
    difficulty: "متقدم",
    video_id: "hdng3Nm1x_E",
    cues_ar: "تعلق بالعقلة بقبضة محكمة، ارفع ساقيك مع لف الحوض للأعلى (Posterior Pelvic Tilt) لعصر عضلات البطن وليس فقط عضلات الفخذ.",
    mistakes_ar: "أرجحة الجسم واستخدام قوة الاندفاع بدلاً من سحب عضلات البطن."
  },
  {
    id: "PLANK_STANDARD",
    name_ar: "تمرين البلانك للثبات الكلي",
    name_en: "Standard Front Plank",
    muscle_group: "CORE",
    muscle_ar: "عضلات الكور العميقة والعمود الفقري",
    equipment: "BODYWEIGHT",
    equipment_ar: "سجادة تمارين (Mat)",
    difficulty: "مبتدئ",
    video_id: "ASdvN_XEl_c",
    cues_ar: "حافظ على استقامة الجسم من الرأس إلى الكعبين، واضغط عضلات البطن والمؤخرة بقوة طوال فترة الثبات.",
    mistakes_ar: "سقوط الحوض للأسفل مما يضع ضغطاً سلبياً على فقرات أسفل الظهر."
  }
];

export const getExercisesList = (req, res) => {
  try {
    const { muscle, equipment, search } = req.query;
    let results = [...EXERCISES_DATABASE];

    if (muscle && muscle !== "ALL") {
      results = results.filter((e) => e.muscle_group === muscle);
    }
    if (equipment && equipment !== "ALL") {
      results = results.filter((e) => e.equipment === equipment);
    }
    if (search) {
      const q = search.trim().toLowerCase();
      results = results.filter(
        (e) =>
          e.name_ar.toLowerCase().includes(q) ||
          e.name_en.toLowerCase().includes(q) ||
          e.muscle_ar.toLowerCase().includes(q)
      );
    }

    return res.status(200).json({
      total: results.length,
      exercises: results,
    });
  } catch (err) {
    console.error("getExercisesList error:", err);
    return res.status(500).json({ error: "فشل استرجاع مكتبة التمارين", details: err.message });
  }
};

import { MASTER_EXERCISE_DICTIONARY } from "../../exercise-catalog-v2/master-exercise-translations.js";
import { getExercisesCatalogFile } from "./admin-settings.controller.js";
import { getExercisesEtag, handleConditionalGet } from "../services/catalogCache.service.js";

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

function normalizeArabicText(text) {
  if (text === undefined || text === null) return '';
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱٵ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[ىئ]/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ء/g, '')
    .replace(/\s+/g, ' ');
}

export const getExercisesList = (req, res) => {
  try {
    const { muscle, equipment, search } = req.query;

    const isUnfiltered = (!muscle || muscle === "ALL") && (!equipment || equipment === "ALL") && !search;
    if (isUnfiltered) {
      const etag = getExercisesEtag();
      if (handleConditionalGet(req, res, etag)) {
        return;
      }
    }

    let results = getExercisesCatalogFile();

    if (muscle && muscle !== "ALL") {
      results = results.filter((e) => e.muscle_group === muscle);
    }
    if (equipment && equipment !== "ALL") {
      results = results.filter((e) => e.equipment === equipment);
    }
    if (search) {
      const q = normalizeArabicText(search);
      results = results.filter(
        (e) =>
          normalizeArabicText(e.name_ar).includes(q) ||
          normalizeArabicText(e.name_en).includes(q) ||
          normalizeArabicText(e.muscle_ar).includes(q) ||
          normalizeArabicText(e.id).includes(q) ||
          (Array.isArray(e.aliases) && e.aliases.some((a) => normalizeArabicText(a).includes(q)))
      );
    }

    if (isUnfiltered) {
      const etag = getExercisesEtag();
      res.setHeader('ETag', `"${etag}"`);
      res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
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

/**
 * Controller to fetch biomechanically matched exercise alternatives
 */
export const getExerciseSwapsHandler = async (req, res) => {
  try {
    const { exercise_code } = req.params;
    const { environment, injury } = req.query;
    const { getSmartExerciseSwaps } = await import("../../exercise-swap-engine/index.js");

    let injuryFlags = [];
    if (injury) {
      if (Array.isArray(injury)) {
        injuryFlags = injury.flatMap((i) => String(i).split(","));
      } else {
        injuryFlags = String(injury).split(",");
      }
      injuryFlags = injuryFlags.map((s) => s.trim().toUpperCase()).filter(Boolean);
    }

    const swaps = getSmartExerciseSwaps(exercise_code, {
      environment: environment || "GYM",
      injuryFlags,
    });

    return res.status(200).json({
      base_exercise_code: exercise_code,
      total_swaps: swaps.length,
      swaps,
    });
  } catch (err) {
    console.error("getExerciseSwapsHandler error:", err);
    return res.status(500).json({ error: "فشل احتساب بدائل التمرين الذكية", details: err.message });
  }
};

/**
 * Controller to execute an exercise swap in a client's program
 */
export const swapProgramExerciseHandler = async (req, res) => {
  try {
    const { programId } = req.params;
    const { sessionIndex, exerciseIndex, newExerciseCode, newExerciseNameAr, newExerciseNameEn } = req.body;

    const { Program } = await import("../models/index.js");
    const program = await Program.findByPk(programId);
    if (!program) {
      return res.status(404).json({ error: "البرنامج التدريبي غير موجود" });
    }

    const programData = JSON.parse(JSON.stringify(program.program_data || {}));
    const weeks = programData.training_program?.weeks || [];

    // Update across all weeks for consistency
    weeks.forEach((week) => {
      const session = week.sessions?.[sessionIndex];
      if (session && session.exercises?.[exerciseIndex]) {
        const ex = session.exercises[exerciseIndex];
        ex.exercise_code = newExerciseCode;
        ex.name_ar = newExerciseNameAr || ex.name_ar;
        ex.name_en = newExerciseNameEn || ex.name_en;
      }
    });

    program.program_data = programData;
    program.changed("program_data", true);
    await program.save();

    return res.status(200).json({
      message: "تم تبديل التمرين بنجاح في خطة المتدرب",
      program: programData,
    });
  } catch (err) {
    console.error("swapProgramExerciseHandler error:", err);
    return res.status(500).json({ error: "فشل تبديل التمرين في الخطة", details: err.message });
  }
};


import fsUploadSync from 'fs';
import pathUpload from 'path';
import { fileURLToPath as fu2p } from 'url';

export const uploadExerciseImage = async (req, res) => {
  try {
    const { exercise_id, image_index, image_base64 } = req.body;
    
    if (!exercise_id || image_index === undefined || !image_base64) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const safeExId = String(exercise_id).replace(/[^a-zA-Z0-9_-]/g, "");
    const safeIndex = parseInt(image_index, 10);
    if (!safeExId || isNaN(safeIndex) || safeIndex < 0 || safeIndex > 10) {
      return res.status(400).json({ success: false, error: "Invalid parameters" });
    }

    const base64Data = image_base64.replace(/^data:image\/\w+;base64,/, "");
    if (base64Data.length > 5 * 1024 * 1024) {
      return res.status(400).json({ success: false, error: "Image size exceeds 5MB limit" });
    }
    const buffer = Buffer.from(base64Data, 'base64');
    
    const currDir = pathUpload.dirname(fu2p(import.meta.url));
    const basePublicPath = pathUpload.resolve(currDir, '../../../frontend/public/exercises');
    const publicExercisesDir = pathUpload.resolve(basePublicPath, safeExId);
    
    if (!publicExercisesDir.startsWith(basePublicPath)) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    if (!fsUploadSync.existsSync(publicExercisesDir)) {
      fsUploadSync.mkdirSync(publicExercisesDir, { recursive: true });
    }
    
    const filePath = pathUpload.resolve(publicExercisesDir, `${safeIndex}.jpg`);
    if (!filePath.startsWith(publicExercisesDir)) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    fsUploadSync.writeFileSync(filePath, buffer);
    
    return res.status(200).json({ 
      success: true, 
      imageUrl: `/exercises/${safeExId}/${safeIndex}.jpg?ts=${Date.now()}` 
    });
  } catch (err) {
    console.error("uploadExerciseImage error:", err);
    return res.status(500).json({ success: false, error: "فشل حفظ الصورة" });
  }
};

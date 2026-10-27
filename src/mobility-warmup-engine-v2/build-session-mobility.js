/**
 * Session-Specific Dynamic Mobility & Static Cool-down Engine (V2)
 * 
 * Provides clinically and biomechanically tailored:
 * 1. Pre-workout Dynamic Mobility Routines (5-7 mins).
 * 2. Post-workout Static Stretching & Nervous System Cool-down Routines (5 mins).
 * 3. Automatic clinical filtering and bypassing of contraindicated stretches for injured joints.
 */

export const DYNAMIC_MOBILITY_CATALOG = Object.freeze({
  UPPER: [
    {
      id: "ARM_CIRCLES_SWINGS",
      name_ar: "دوائر وتأرجح الذراعين للأمام والخلف",
      name_en: "Arm Circles & Dynamic Cross Swings",
      dose: "10 دوائر للأمام + 10 للخلف + 10 تأرجح متقاطع",
      target_joints_ar: "مفصل الكتف والقفص الصدري",
      cues_ar: "حرك ذراعيك في مدى دائري كامل وبوتيرة هادئة لضخ الدم وتليين محفظة الكتف.",
      video_query: "arm circles dynamic warm up"
    },
    {
      id: "CAT_COW_THORACIC",
      name_ar: "تمرين القطة والبقرة مع تدوير القفص الصدري",
      name_en: "Cat-Cow & Thoracic Spine Rotations",
      dose: "8-10 تكرارات سلسة مع التنفس",
      target_joints_ar: "الفقرات الصدرية (T-Spine) وأسفل الظهر",
      cues_ar: "انحنِ للأعلى مع الزفير وافرد عمودك الفقري مع الشهيق، ثم دوّر جذعك لفتح الصدر.",
      video_query: "cat cow thoracic rotation"
    },
    {
      id: "BAND_PULL_APARTS",
      name_ar: "سحب حبل المقاومة لعصر لوحي الكتف",
      name_en: "Band Pull-Aparts / Scapular Wall Slides",
      dose: "12-15 تكرار متحكم به",
      target_joints_ar: "لوحي الكتف والعضلات المدورة (Rotator Cuff)",
      cues_ar: "اسحب الحبل باتجاه صدرك مع عصر لوحي الكتف للخلف والأسفل وتثبيت الكوعين.",
      video_query: "band pull aparts form"
    },
    {
      id: "WRIST_FOREARM_ROTATIONS",
      name_ar: "تدوير المعصم والساعدين",
      name_en: "Wrist Rotations & Forearm Flexion",
      dose: "10 تدويرات لكل اتجاه",
      target_joints_ar: "مفصل المعصم والأوتار الساعدية",
      cues_ar: "هيّئ معصمك لتحمل أوزان الدفع والسحب لمنع أي ألم في المعصم.",
      video_query: "wrist mobility warm up"
    }
  ],

  LOWER: [
    {
      id: "WORLDS_GREATEST_STRETCH",
      name_ar: "أعظم إطالة حركية في العالم (World's Greatest Stretch)",
      name_en: "World's Greatest Stretch",
      dose: "5 تكرارات لكل جانب مع الثبات ثانيتين",
      target_joints_ar: "الحوض، الفخذ الخلفي، والعمود الفقري",
      cues_ar: "انزل في وضعية الطعن العميق، المس الأرض بكوعك ثم افتح صدرك للأعلى باتجاه السقف.",
      video_query: "worlds greatest stretch"
    },
    {
      id: "LEG_SWINGS_DYNAMIC",
      name_ar: "أرجحة الساقين للأمام والخلف وللأجناب",
      name_en: "Dynamic Leg Swings (Front-to-Back & Lateral)",
      dose: "10 تأرجحات لكل ساق",
      target_joints_ar: "مفصل الورك (Hip Flexors & Adductors)",
      cues_ar: "استند على جدار وأرجح ساقك بحرية مع الحفاظ على استقامة الجذع.",
      video_query: "dynamic leg swings"
    },
    {
      id: "SQUAT_TO_STAND",
      name_ar: "سكوات عميق مع إطالة الخلفيات (Squat to Stand)",
      name_en: "Deep Squat to Stand (Hamstring & Ankle Mobility)",
      dose: "8 تكرارات بطيئة",
      target_joints_ar: "مفصل الكاحل والركبتين والحوض",
      cues_ar: "امسك أصابع قدميك، انزل في قرفصاء عميقة وافرد صدرك، ثم ارفع حوضك للأعلى لإطالة الخلفيات.",
      video_query: "squat to stand mobility"
    },
    {
      id: "GLUTE_BRIDGE_HIP_90_90",
      name_ar: "تفعيل الجلوتس بحركة الحوض 90/90",
      name_en: "Glute Bridges & Hip 90/90 Rotations",
      dose: "10 تكرارات جسر + 5 تكرارات 90/90 لكل جانب",
      target_joints_ar: "عضلات المؤخرة وتدوير مفصل الحوض الداخلي والخارجي",
      cues_ar: "اعصر عضلات المؤخرة في قمة جسر الحوض لتنشيطها قبل تمارين السكوات والديدليفت.",
      video_query: "hip 90 90 mobility"
    }
  ],

  FULL_BODY: [
    {
      id: "WORLDS_GREATEST_STRETCH",
      name_ar: "أعظم إطالة حركية في العالم (World's Greatest Stretch)",
      name_en: "World's Greatest Stretch",
      dose: "5 تكرارات لكل جانب",
      target_joints_ar: "الحوض، الفخذ، والقفص الصدري",
      cues_ar: "إطالة حركية متكاملة لفتح الجسم بالكامل قبل التمرين.",
      video_query: "worlds greatest stretch"
    },
    {
      id: "CAT_COW_THORACIC",
      name_ar: "تمرين القطة والبقرة لتحرير العمود الفقري",
      name_en: "Cat-Cow & Thoracic Rotations",
      dose: "8 تكرارات مع التنفس العميق",
      target_joints_ar: "العمود الفقري بالكامل",
      cues_ar: "تحريك وتليين فقرات الظهر بالكامل.",
      video_query: "cat cow stretch"
    },
    {
      id: "SQUAT_TO_STAND",
      name_ar: "سكوات عميق مع إطالة الخلفيات",
      name_en: "Deep Squat to Stand",
      dose: "8 تكرارات",
      target_joints_ar: "الكاحل والركبة والحوض",
      cues_ar: "تليين الجزء السفلي بالكامل وتهيئة المفاصل للأوزان.",
      video_query: "squat to stand mobility"
    },
    {
      id: "BAND_PULL_APARTS",
      name_ar: "سحب الحبل وتفعيل الأكتاف واللوحين",
      name_en: "Band Pull-Aparts",
      dose: "12 تكرار",
      target_joints_ar: "الكتف واللوحين",
      cues_ar: "عصر لوحي الكتف للخلف والأسفل لتثبيت الكتف.",
      video_query: "band pull aparts"
    }
  ]
});

export const STATIC_COOL_DOWN_CATALOG = Object.freeze({
  UPPER: [
    {
      id: "DOORWAY_CHEST_STRETCH",
      name_ar: "إطالة الصدر والبايسبس عند مدخل الباب",
      name_en: "Doorway Chest & Biceps Stretch",
      duration_seconds: 30,
      target_muscle_ar: "عضلات الصدر والكتف الأمامي والبايسبس",
      cues_ar: "ضع ساعدك على إطار الباب واخطُ خطوة للأمام حتى تشعر بإطالة مريحة في عضلات الصدر.",
      video_query: "doorway chest stretch"
    },
    {
      id: "OVERHEAD_TRICEPS_LAT_STRETCH",
      name_ar: "إطالة الترايسبس وعضلة اللاتس خلف الرأس",
      name_en: "Overhead Triceps & Lat Stretch",
      duration_seconds: 30,
      target_muscle_ar: "الرأس الطويل للترايسبس والظهر العريض",
      cues_ar: "اثنِ كوعك خلف رأسك واسحبه بيدك الأخرى بلطف مع ميلان طفيف في الجذع.",
      video_query: "overhead triceps stretch"
    },
    {
      id: "CROSS_BODY_SHOULDER_STRETCH",
      name_ar: "إطالة الكتف الخلفي المتقاطعة",
      name_en: "Cross-Body Posterior Shoulder Stretch",
      duration_seconds: 30,
      target_muscle_ar: "الكتف الخلفي والكبسولة المفصلية",
      cues_ar: "اسحب ذراعك المستقيمة عبر صدرك بلطف واضغط عليها بالذراع الأخرى.",
      video_query: "cross body shoulder stretch"
    },
    {
      id: "CHILDS_POSE_UPPER",
      name_ar: "وضعية الطفل الممتدة (Child's Pose)",
      name_en: "Extended Child's Pose",
      duration_seconds: 45,
      target_muscle_ar: "الظهر بالكامل وعضلات اللاتس والعمود الفقري",
      cues_ar: "اجلس على كعبيك وافرد ذراعيك للأمام على الأرض مع تنفس بطني عميق لتهدئة الجهاز العصبي.",
      video_query: "childs pose stretch"
    }
  ],

  LOWER: [
    {
      id: "STANDING_QUAD_STRETCH",
      name_ar: "إطالة الفخذ الأمامي واقفاً",
      name_en: "Standing Quadriceps & Hip Flexor Stretch",
      duration_seconds: 30,
      target_muscle_ar: "عضلة الفخذ الأمامية ومثنيات الحوض",
      cues_ar: "امسك كاحلك واسحبه باتجاه المؤخرة مع ضم الركبتين معاً ودفع الحوض للأمام قليلاً.",
      video_query: "standing quad stretch"
    },
    {
      id: "SEATED_HAMSTRING_STRETCH",
      name_ar: "إطالة الفخذ الخلفي جالساً مع استقامة الظهر",
      name_en: "Seated Single-Leg Hamstring Stretch",
      duration_seconds: 30,
      target_muscle_ar: "أوتار الفخذ الخلفية (Hamstrings)",
      cues_ar: "افرد ساقك وانحنِ من مفصل الحوض للأمام مع الحفاظ على استقامة ظهرك وتفادي التقوس.",
      video_query: "seated hamstring stretch"
    },
    {
      id: "PIGEON_POSE_GLUTES",
      name_ar: "وضعية الحمام لإطالة الأرداف والحوض (Pigeon Pose)",
      name_en: "Pigeon Pose Glute Stretch",
      duration_seconds: 40,
      target_muscle_ar: "عضلات المؤخرة والكمثرية وأسفل الظهر",
      cues_ar: "اثنِ ساقك أمامك بزاوية مريحة وافرد الساق الخلفية، وانزل بجذعك بلطف لإطالة عميقة للجلوتس.",
      video_query: "pigeon pose glutes"
    },
    {
      id: "STANDING_CALF_STRETCH",
      name_ar: "إطالة عضلة السمانة على الحائط",
      name_en: "Standing Wall Calf Stretch",
      duration_seconds: 30,
      target_muscle_ar: "عضلة السمانة وأوتار الكاحل (Gastrocnemius & Soleus)",
      cues_ar: "ادفع الحائط بكلتا يديك واجعل ساقك الخلفية مستقيمة وكعبك ملتصقاً بالأرض.",
      video_query: "standing calf stretch"
    }
  ],

  FULL_BODY: [
    {
      id: "DOORWAY_CHEST_STRETCH",
      name_ar: "إطالة الصدر والبايسبس عند مدخل الباب",
      name_en: "Doorway Chest Stretch",
      duration_seconds: 30,
      target_muscle_ar: "عضلات الصدر والكتف الأمامي",
      cues_ar: "فتح وإطالة الصدر بعد جلسات الدفع.",
      video_query: "doorway chest stretch"
    },
    {
      id: "SEATED_HAMSTRING_STRETCH",
      name_ar: "إطالة الفخذ الخلفي جالساً",
      name_en: "Seated Hamstring Stretch",
      duration_seconds: 30,
      target_muscle_ar: "عضلات الفخذ الخلفية",
      cues_ar: "استطالة ناعمة لأوتار الركبة والخلفيات.",
      video_query: "seated hamstring stretch"
    },
    {
      id: "PIGEON_POSE_GLUTES",
      name_ar: "وضعية الحمام لإطالة الجلوتس والحوض",
      name_en: "Pigeon Pose Glute Stretch",
      duration_seconds: 40,
      target_muscle_ar: "عضلات المؤخرة والحوض",
      cues_ar: "تخفيف أي شد في الحوض وأسفل الظهر.",
      video_query: "pigeon pose stretch"
    },
    {
      id: "CHILDS_POSE_UPPER",
      name_ar: "وضعية الطفل لإراحة الظهر والتهدئة الكلية",
      name_en: "Child's Pose Full Relaxation",
      duration_seconds: 45,
      target_muscle_ar: "الظهر بالكامل والاسترخاء العصبي",
      cues_ar: "تنفس بعمق لمساعدة الجهاز العصبي على الانتقال لمرحلة الاستشفاء والبناء.",
      video_query: "childs pose stretch"
    }
  ]
});

/**
 * Builds tailored Dynamic Mobility Warm-Up and Static Cool-down for a given session,
 * enforcing strict clinical contraindication filtering for injuries.
 * 
 * @param {string} sessionCode - Code of the session (e.g. UPPER_A, LOWER_B, FULL_BODY_A, PUSH, PULL, LEGS)
 * @param {Array} exercises - List of exercises in the session
 * @param {Object} [medicalContext={}] - Medical conditions, injuries, and movement restrictions
 * @returns {Object} Complete mobility protocol with pre-workout warm-up and post-workout cool-down
 */
export function buildSessionMobilityProtocol(sessionCode = "FULL_BODY", exercises = [], medicalContext = {}) {
  const code = (sessionCode || "").toUpperCase();
  let sessionType = "FULL_BODY";

  if (code.includes("UPPER") || code.includes("PUSH") || code.includes("PULL") || code.includes("CHEST") || code.includes("BACK") || code.includes("ARM")) {
    sessionType = "UPPER";
  } else if (code.includes("LOWER") || code.includes("LEG") || code.includes("QUAD") || code.includes("HAMSTRING") || code.includes("GLUTE")) {
    sessionType = "LOWER";
  }

  let dynamicWarmup = [...(DYNAMIC_MOBILITY_CATALOG[sessionType] || DYNAMIC_MOBILITY_CATALOG.FULL_BODY)];
  let staticCooldown = [...(STATIC_COOL_DOWN_CATALOG[sessionType] || STATIC_COOL_DOWN_CATALOG.FULL_BODY)];

  let effectiveMedical = medicalContext && typeof medicalContext === "object" ? { ...medicalContext } : {};
  if (!Array.isArray(exercises) && typeof exercises === "object" && exercises !== null) {
    effectiveMedical = { ...exercises, ...effectiveMedical };
  } else if (Array.isArray(exercises) && exercises.length > 0 && typeof exercises[0] === "string" && (!medicalContext || Object.keys(medicalContext).length === 0)) {
    effectiveMedical.injuries = exercises;
  }

  const conditions = Array.isArray(effectiveMedical?.conditions) ? effectiveMedical.conditions : [];
  const restrictions = Array.isArray(effectiveMedical?.movementRestrictions) ? effectiveMedical.movementRestrictions : [];
  const injuries = Array.isArray(effectiveMedical?.injuries) ? effectiveMedical.injuries : [];

  const getConditionStr = (c) => {
    if (!c) return "";
    if (typeof c === "string") return c;
    return [c.conditionCode, c.label, c.area, c.name, c.substance, c.id].filter(Boolean).join(" ");
  };
  const allInjuryTokens = conditions.concat(restrictions).concat(injuries).map(getConditionStr);

  const hasLumbarDisc = effectiveMedical?.hasHerniation || allInjuryTokens.some(c => {
    const s = String(c).toUpperCase();
    return s.includes("DISC") || s.includes("LUMBAR") || s.includes("HERNIATION") || s.includes("L4") || s.includes("L5") || s.includes("SPINE") || s.includes("LOWER_BACK") || s.includes("BACK");
  }) || restrictions.includes("NO_AXIAL_SPINAL_LOADING");

  const hasDiastasisRecti = effectiveMedical?.hasDiastasisRecti || allInjuryTokens.some(c => String(c).toUpperCase().includes("DIASTASIS_RECTI")) || restrictions.includes("NO_CRUNCHES");

  const hasRotatorCuff = effectiveMedical?.hasRotatorCuff || allInjuryTokens.some(c => {
    const s = String(c).toUpperCase();
    return s.includes("ROTATOR") || s.includes("SHOULDER_IMPINGEMENT") || s.includes("IMPINGEMENT") || s.includes("SHOULDER");
  }) || restrictions.includes("NO_BEHIND_NECK_PRESS");

  const hasKneeIssues = effectiveMedical?.hasKneeIssues || allInjuryTokens.some(c => {
    const s = String(c).toUpperCase();
    return s.includes("PATELL") || s.includes("KNEE") || s.includes("MENISCUS") || s.includes("CHONDROMALACIA");
  }) || restrictions.includes("NO_DEEP_SQUATS");

  const contraindicationsBypassed = [];


  // 1. Lumbar Disc Herniation & Spine Safety
  if (hasLumbarDisc) {
    // Dynamic Warm-Up: Filter out deep spinal flexion movements (e.g. SQUAT_TO_STAND)
    const hadSquatToStand = dynamicWarmup.some(d => d.id === "SQUAT_TO_STAND");
    dynamicWarmup = dynamicWarmup.filter(d => d.id !== "SQUAT_TO_STAND");
    if (hadSquatToStand && !dynamicWarmup.some(d => d.id === "BIRD_DOG_NEUTRAL_SPINE")) {
      dynamicWarmup.push({
        id: "BIRD_DOG_NEUTRAL_SPINE",
        name_ar: "تمرين بيرد دوج لتثبيت فقرات الظهر المحايدة (Bird Dog)",
        name_en: "Bird Dog Core & Lumbar Stabilizer",
        dose: "8 تكرارات لكل جانب مع ثبات ثانيتين",
        target_joints_ar: "العمود الفقري القطني وعضلات الكور العميقة",
        cues_ar: "مد الذراع المعاكس والساق في خط مستقيم مع تثبيت الحوض والعمود الفقري في وضع محايد تماماً بدون تقوس.",
        video_query: "bird dog neutral spine form"
      });
      contraindicationsBypassed.push("استبعاد حركات الإحماء ذات الثني العميق للظهر (Squat to Stand) واستبدالها بتمرين Bird Dog المحايد للفقرات القطنية");
    }

    // Static Cool-down: Remove deep seated hamstring flexion with rounded back
    staticCooldown = staticCooldown.filter(s => s.id !== "SEATED_HAMSTRING_STRETCH");
    staticCooldown.push({
      id: "NEUTRAL_SPINE_HAMSTRING_STRAP",
      name_ar: "إطالة الفخذ الخلفي مستلقياً بحزام مع عمود فقري محايد",
      name_en: "Supine Hamstring Stretch with Strap (Neutral Spine)",
      duration_seconds: 30,
      target_muscle_ar: "أوتار الفخذ الخلفية بأمان قطني تام",
      cues_ar: "استلقِ على ظهرك واستخدم حزاماً لرفع الساق مع إبقاء فقرات أسفل الظهر في وضعيتها المحايدة المستقيمة دون أي انحناء.",
      video_query: "supine hamstring stretch strap neutral spine"
    });
    contraindicationsBypassed.push("حظر استطالات ثني العمود الفقري وتدوير الجذع الحاد لحماية الغضاريف L4-L5");
  }

  // 2. Diastasis Recti
  if (hasDiastasisRecti) {
    contraindicationsBypassed.push("حظر استطالات التمدد البطني العنيف كالكوبرا ووضعيات التقوس الخلفي لحماية الخط الأبيض");
  }

  // 3. Rotator Cuff Impingement & Shoulder Safety
  if (hasRotatorCuff) {
    // Dynamic Warm-Up: Gentle band dislocates instead of full unrestricted arm swings
    const hadArmCircles = dynamicWarmup.some(d => d.id === "ARM_CIRCLES_SWINGS");
    if (hadArmCircles) {
      dynamicWarmup = dynamicWarmup.filter(d => d.id !== "ARM_CIRCLES_SWINGS");
      dynamicWarmup.unshift({
        id: "BANDED_DISLOCATES_GENTLE",
        name_ar: "تدوير الكتف بحبل مطاطي واسع بنطاق مريح (Band Dislocates)",
        name_en: "Gentle Band Dislocates (Wide Grip)",
        dose: "10 تكرارات سلسة وبطيئة بدون أي ألم",
        target_joints_ar: "مفصل الكتف واللوحين بأمان تام",
        cues_ar: "امسك الحبل بقبضة واسعة وحركه فوق رأسك برفق مع التوقف قبل أي نقطة انضغاط لوتر الروتاتور كاف.",
        video_query: "band dislocates shoulder mobility"
      });
      contraindicationsBypassed.push("استبدال دوائر الذراعين بتدوير الحبل الواسع لتجنب انحصار وتر الروتاتور كاف");
    }

    // Static Cool-down: Remove forced cross-body internal rotation stretch
    staticCooldown = staticCooldown.filter(s => s.id !== "CROSS_BODY_SHOULDER_STRETCH");
    staticCooldown.push({
      id: "DOORWAY_CHEST_NEUTRAL",
      name_ar: "إطالة الصدر والكتف عند مدخل الباب بقبضة محايدة",
      name_en: "Neutral Humerus Doorway Stretch",
      duration_seconds: 30,
      target_muscle_ar: "الصدر والأكتاف بدون أي اختناق لوتر الكتف",
      cues_ar: "ضع ساعدك بزاوية 90 درجة بقبضة محايدة واخطُ للأمام بلطف دون التواء مفصل الكتف للداخل.",
      video_query: "neutral grip doorway chest stretch rotator cuff"
    });
    contraindicationsBypassed.push("حظر استطالات الضغط الحاد والالتواء الداخلي لمفصل الكتف لتفادي تهيج وتر الروتاتور كاف");
  }

  // 4. Patellar Tendonitis & Knee Joint Issues
  if (hasKneeIssues) {
    // Dynamic Warm-Up: Filter out deep knee flexion movements (e.g. SQUAT_TO_STAND)
    const hadSquatToStand = dynamicWarmup.some(d => d.id === "SQUAT_TO_STAND");
    dynamicWarmup = dynamicWarmup.filter(d => d.id !== "SQUAT_TO_STAND");
    if (hadSquatToStand && !dynamicWarmup.some(d => d.id === "GLUTE_BRIDGE_ACTIVATION")) {
      dynamicWarmup.push({
        id: "GLUTE_BRIDGE_ACTIVATION",
        name_ar: "جسر الحوض لتفعيل المؤخرة بدون إجهاد للركبة (Glute Bridge)",
        name_en: "Floor Glute Bridge Activation",
        dose: "12 تكرار مع عصر المؤخرة ثانيتين",
        target_joints_ar: "مفصل الحوض وعضلات المؤخرة",
        cues_ar: "ادفع الأرض بكعبيك وارفع حوضك مع الحفاظ على زاوية ركبة مريحة لتجنب أي إجهاد لغضروف الركبة أو صابونة الركبة.",
        video_query: "glute bridge knee friendly warm up"
      });
      contraindicationsBypassed.push("استبعاد حركات الإحماء ذات الثني الحاد للركبة (Squat to Stand) واستبدالها بتفعيل الجسر الحوضي الآمن للركبة");
    }

    // Static Cool-down
    staticCooldown = staticCooldown.filter(s => s.id !== "STANDING_QUAD_STRETCH");
    staticCooldown.push({
      id: "SUPPORTED_WALL_QUAD_STRETCH",
      name_ar: "إطالة الفخذ الأمامي المسنودة على الحائط بزاوية ركبة آمنة",
      name_en: "Supported Wall Quad Stretch (Knee-Safe Angle)",
      duration_seconds: 30,
      target_muscle_ar: "الفخذ الأمامي دون ضغط حاد على صابونة الركبة",
      cues_ar: "استند بكلتا يديك واسحب كاحلك بلطف دون ثني الركبة بزاوية حادة لتجنب إجهاد الوتر الرضفي.",
      video_query: "patellar tendonitis safe quad stretch"
    });
    contraindicationsBypassed.push("حظر استطالات الجلوس في قرفصاء عميقة وثني الركبة الحاد لحماية أوتار الرضفة والغضروف الهلالي");
  }

  return {
    session_target: sessionType,
    estimated_warmup_minutes: 6,
    estimated_cooldown_minutes: 5,
    clinical_contraindications_bypassed_ar: contraindicationsBypassed,
    dynamic_warmup: {
      title_ar: "بروتوكول الإحماء الحركي الديناميكي (Pre-Workout Dynamic Warm-Up)",
      description_ar: "حركات ديناميكية مجهزة لرفع درجة حرارة المفاصل وتدفق السائل الزلالي وتفعيل الجهاز العصبي قبل الأوزان.",
      total_exercises: dynamicWarmup.length,
      exercises: dynamicWarmup.map((ex) => ({
        ...ex,
        youtube_url: `https://www.youtube.com/results?search_query=${encodeURIComponent(ex.video_query + ' exercise')}`,
      })),
    },
    static_cooldown: {
      title_ar: "بروتوكول الاستطالات الثابتة والتهدئة (Post-Workout Static Stretching & Cool-Down)",
      description_ar: "استطالات ثابتة لتخفيف التوتر العضلي وتحفيز الجهاز العصبي الباراسمبثاوي لتسريع الاستشفاء.",
      total_exercises: staticCooldown.length,
      exercises: staticCooldown.map((ex) => ({
        ...ex,
        youtube_url: `https://www.youtube.com/results?search_query=${encodeURIComponent(ex.video_query + ' stretch')}`,
      })),
    },
  };
}

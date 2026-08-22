/**
 * Postural & Joint Prehab Injection Engine
 * Pure Deterministic Function - Zero External Dependencies
 */

export const POSTURAL_ISSUES = {
  ROUNDED_SHOULDERS: 'ROUNDED_SHOULDERS',
  ANTERIOR_PELVIC_TILT: 'ANTERIOR_PELVIC_TILT',
  ANKLE_MOBILITY_RESTRICTION: 'ANKLE_MOBILITY_RESTRICTION',
  KNEE_DISCOMFORT: 'KNEE_DISCOMFORT',
  TIGHT_HIPS_LUMBAR: 'TIGHT_HIPS_LUMBAR',
  SHOULDER_IMPINGEMENT: 'SHOULDER_IMPINGEMENT',
  WRIST_STRAIN: 'WRIST_STRAIN'
};

export const MASTER_PREHAB_ROUTINES = [
  {
    id: "prehab_rounded_shoulders",
    issue_tag: "ROUNDED_SHOULDERS",
    name_ar: "روتين تصحيح انحناء الكتفين والأكتاف المتقدمة",
    target_session: ["PUSH", "UPPER", "CHEST", "UPPER_PULL", "UPPER_PUSH"],
    duration_minutes: 3,
    exercises: [
      {
        id: "BANDED_PULL_APART",
        name_ar: "سحب شريط المقاومة للصدر (Banded Pull-Apart)",
        sets: 2,
        reps: "20-25",
        duration_seconds: 45,
        cue: "تثبيت لوحي الكتف للخلف والأسفل وسحب الشريط حتى يلامس الصدر مع عصر الظهر العلوي.",
        cue_ar: "تثبيت لوحي الكتف للخلف والأسفل وسحب الشريط حتى يلامس الصدر مع عصر الظهر العلوي.",
        thumbnail_url: "/assets/prehab/banded-pull-apart.webp",
        video_url: "https://video.zplatform.com/prehab/banded-pull-apart.mp4",
        target_area: "أعلى الظهر والأكتاف"
      },
      {
        id: "DOORWAY_PEC_STRETCH",
        name_ar: "إطالة الصدر في الزاوية (Doorway/Corner Pec Stretch)",
        sets: 2,
        hold_seconds: 30,
        duration_seconds: 60,
        cue: "إسناد الساعدين على زاويتي الجدار والميل بالجذع برفق للأمام دون تقوس أسفل الظهر.",
        cue_ar: "إسناد الساعدين على زاويتي الجدار والميل بالجذع برفق للأمام دون تقوس أسفل الظهر.",
        thumbnail_url: "/assets/prehab/corner-pec-stretch.webp",
        video_url: "https://video.zplatform.com/prehab/corner-pec-stretch.mp4",
        target_area: "عضلات الصدر"
      },
      {
        id: "FOAM_ROLLER_THORACIC",
        name_ar: "تمديد الفقرات الصدرية بالفوم رولر (Foam Roller Thoracic Ext.)",
        sets: 2,
        reps: "10",
        duration_seconds: 45,
        cue: "وضع الرولر أسفل أعلى الظهر ودعم الرأس باليدين والميل للخلف برفق مع الزفير.",
        cue_ar: "وضع الرولر أسفل أعلى الظهر ودعم الرأس باليدين والميل للخلف برفق مع الزفير.",
        thumbnail_url: "/assets/prehab/foam-roller-thoracic.webp",
        video_url: "https://video.zplatform.com/prehab/foam-roller-thoracic.mp4",
        target_area: "العمود الفقري الصدري"
      }
    ]
  },
  {
    id: "prehab_anterior_pelvic_tilt",
    issue_tag: "ANTERIOR_PELVIC_TILT",
    name_ar: "روتين تعديل ميل الحوض للأمام وتخفيف ضغط القطنية",
    target_session: ["LEGS", "LOWER", "FULL_BODY", "LEGS_HYPERTROPHY", "SQUAT_FOCUS_LOWER"],
    duration_minutes: 4,
    exercises: [
      {
        id: "HIP_FLEXOR_STRETCH",
        name_ar: "إطالة ثني الفخذ نصف راكع (Half-Kneeling Hip Flexor Stretch)",
        sets: 2,
        hold_seconds: 30,
        duration_seconds: 60,
        cue: "الارتكاز على ركبة واحدة وشد المؤخرة للداخل مع دفع الحوض للأمام بلطف.",
        cue_ar: "الارتكاز على ركبة واحدة وشد المؤخرة للداخل مع دفع الحوض للأمام بلطف.",
        thumbnail_url: "/assets/prehab/hip-flexor-stretch.webp",
        video_url: "https://video.zplatform.com/prehab/hip-flexor-stretch.mp4",
        target_area: "ثنيات الحوض"
      },
      {
        id: "GLUTE_BRIDGES_POSTERIOR_TILT",
        name_ar: "جسر الأرداف بتدوير الحوض (Glute Bridge w/ Posterior Tilt)",
        sets: 2,
        reps: "15",
        duration_seconds: 45,
        cue: "الضغط بالكعبين ورفع الحوض مع عصر الجلوتس وتسطيح أسفل الظهر تماماً في القمة.",
        cue_ar: "الضغط بالكعبين ورفع الحوض مع عصر الجلوتس وتسطيح أسفل الظهر تماماً في القمة.",
        thumbnail_url: "/assets/prehab/glute-bridge.webp",
        video_url: "https://video.zplatform.com/prehab/glute-bridge.mp4",
        target_area: "عضلات المؤخرة"
      },
      {
        id: "DEADBUG",
        name_ar: "تمرين الحشرة الميتة لتثبيت الكور (Deadbug)",
        sets: 2,
        reps: "10 per side",
        duration_seconds: 45,
        cue: "إلصاق أسفل الظهر بالأرض تماماً ومنع أي فراغ هوائي أثناء تحريك الأطراف المتقابلة.",
        cue_ar: "إلصاق أسفل الظهر بالأرض تماماً ومنع أي فراغ هوائي أثناء تحريك الأطراف المتقابلة.",
        thumbnail_url: "/assets/prehab/deadbug.webp",
        video_url: "https://video.zplatform.com/prehab/deadbug.mp4",
        target_area: "عضلات الكور وأسفل البطن"
      }
    ]
  },
  {
    id: "prehab_knee_and_ankle",
    issue_tag: "KNEE_DISCOMFORT",
    name_ar: "روتين حماية صابونة الركبة وزيادة مرونة الكاحل",
    target_session: ["LEGS", "LOWER", "SQUAT_DAY", "LEGS_HYPERTROPHY", "SQUAT_FOCUS_LOWER"],
    duration_minutes: 3,
    exercises: [
      {
        id: "WALL_TIBIALIS_RAISES",
        name_ar: "رفع قصبة الساق الجداري (Wall Tibialis Raise)",
        sets: 2,
        reps: "20",
        duration_seconds: 45,
        cue: "إسناد الظهر على جدار ورفع أمشاط القدمين لأعلى نقطة لتقوية عضلة القصبة وامتصاص الصدمات.",
        cue_ar: "إسناد الظهر على جدار ورفع أمشاط القدمين لأعلى نقطة لتقوية عضلة القصبة وامتصاص الصدمات.",
        thumbnail_url: "/assets/prehab/wall-tibialis.webp",
        video_url: "https://video.zplatform.com/prehab/wall-tibialis.mp4",
        target_area: "عضلة قصبة الساق"
      },
      {
        id: "KNEE_TO_WALL_DORSIFLEXION",
        name_ar: "دفع الركبة الجداري لمرونة الكاحل (Knee-to-Wall Dorsiflexion)",
        sets: 2,
        reps: "12 per leg",
        duration_seconds: 45,
        cue: "تثبيت الكعب بالكامل على الأرض ودفع الركبة للأمام لتجاوز أصابع القدم باتجاه الحائط.",
        cue_ar: "تثبيت الكعب بالكامل على الأرض ودفع الركبة للأمام لتجاوز أصابع القدم باتجاه الحائط.",
        thumbnail_url: "/assets/prehab/knee-to-wall.webp",
        video_url: "https://video.zplatform.com/prehab/knee-to-wall.mp4",
        target_area: "مفصل الكاحل"
      },
      {
        id: "BANDED_TKE",
        name_ar: "فرد الركبة بالاستك (Banded Terminal Knee Extension)",
        sets: 2,
        reps: "15 per leg",
        duration_seconds: 45,
        cue: "تثبيت الاستك خلف الركبة وفرد المفصل كاملاً لعزل رأس الـ VMO الداخلي.",
        cue_ar: "تثبيت الاستك خلف الركبة وفرد المفصل كاملاً لعزل رأس الـ VMO الداخلي.",
        thumbnail_url: "/assets/prehab/banded-tke.webp",
        video_url: "https://video.zplatform.com/prehab/banded-tke.mp4",
        target_area: "الرأس الداخلي للفخذ (VMO)"
      }
    ]
  },
  {
    id: "prehab_rotator_cuff",
    issue_tag: "SHOULDER_IMPINGEMENT",
    name_ar: "روتين تحرير أوتار الكتف الدوارة ومنع الاحتكاك",
    target_session: ["PUSH", "UPPER", "SHOULDERS", "CHEST_AND_SHOULDERS_PUSH", "UPPER_PUSH"],
    duration_minutes: 3,
    exercises: [
      {
        id: "BANDED_EXTERNAL_ROTATIONS",
        name_ar: "تدوير الكتف الخارجي بالمطاط (Banded External Rotation)",
        sets: 2,
        reps: "15",
        duration_seconds: 45,
        cue: "تثبيت الكوع بجانب الخصر بزاوية 90 درجة وسحب المطاط للخارج ببطء وبوزن خفيف.",
        cue_ar: "تثبيت الكوع بجانب الخصر بزاوية 90 درجة وسحب المطاط للخارج ببطء وبوزن خفيف.",
        thumbnail_url: "/assets/prehab/shoulder-ext-rotation.webp",
        video_url: "https://video.zplatform.com/prehab/shoulder-ext-rotation.mp4",
        target_area: "أوتار الكتف الدوارة (Rotator Cuff)"
      },
      {
        id: "SLEEPER_STRETCH",
        name_ar: "استرتش النائم لمرونة الدوران الداخلي (Sleeper Stretch)",
        sets: 2,
        hold_seconds: 20,
        duration_seconds: 40,
        cue: "الاستلقاء على الجانب والضغط باليد المعاكسة برفق للأسفل دون رفع لوح الكتف عن الأرض.",
        cue_ar: "الاستلقاء على الجانب والضغط باليد المعاكسة برفق للأسفل دون رفع لوح الكتف عن الأرض.",
        thumbnail_url: "/assets/prehab/sleeper-stretch.webp",
        video_url: "https://video.zplatform.com/prehab/sleeper-stretch.mp4",
        target_area: "محفظة الكتف الخلفية"
      },
      {
        id: "WALL_SLIDES_FOREARMS",
        name_ar: "انزلاق الساعدين على الحائط (Wall Slides with Forearms)",
        sets: 2,
        reps: "10",
        duration_seconds: 45,
        cue: "رفع الساعدين ملامسين للحائط للأعلى مع إبعاد لوحي الكتف لتفعيل السراتوس.",
        cue_ar: "رفع الساعدين ملامسين للحائط للأعلى مع إبعاد لوحي الكتف لتفعيل السراتوس.",
        thumbnail_url: "/assets/prehab/wall-slides.webp",
        video_url: "https://video.zplatform.com/prehab/wall-slides.mp4",
        target_area: "عضلة السراتوس واللوح"
      }
    ]
  },
  {
    id: "prehab_wrist_and_forearms",
    issue_tag: "WRIST_STRAIN",
    name_ar: "روتين تخفيف إجهاد المعصم وتيبس الساعدين",
    target_session: ["PUSH", "UPPER", "PULL", "UPPER_PUSH"],
    duration_minutes: 2,
    exercises: [
      {
        id: "FOREARM_BALL_RELEASE",
        name_ar: "تدليك الساعد بالكرة (Tennis Ball Forearm Release)",
        sets: 1,
        hold_seconds: 30,
        duration_seconds: 60,
        cue: "تمرير عضلات الساعد فوق كرة تنس على الدكة لتحرير العقد العضلية.",
        cue_ar: "تمرير عضلات الساعد فوق كرة تنس على الدكة لتحرير العقد العضلية.",
        thumbnail_url: "/assets/prehab/forearm-release.webp",
        video_url: "https://video.zplatform.com/prehab/forearm-release.mp4",
        target_area: "عضلات الساعد"
      },
      {
        id: "QUADRUPED_WRIST_ROCKERS",
        name_ar: "إطالة أوتار الرسغ على الأرض (Quadruped Wrist Rockers)",
        sets: 2,
        reps: "15",
        duration_seconds: 45,
        cue: "وضع الراحتين والأصابع للخلف على الأرض والميل للخلف برفق لإطالة أوتار الرسغ.",
        cue_ar: "وضع الراحتين والأصابع للخلف على الأرض والميل للخلف برفق لإطالة أوتار الرسغ.",
        thumbnail_url: "/assets/prehab/wrist-rockers.webp",
        video_url: "https://video.zplatform.com/prehab/wrist-rockers.mp4",
        target_area: "أوتار المعصم والرست"
      }
    ]
  }
];

export const PREHAB_EXERCISE_DATABASE = Object.freeze(
  MASTER_PREHAB_ROUTINES.reduce((acc, routine) => {
    routine.exercises.forEach(ex => {
      acc[ex.id] = ex;
    });
    return acc;
  }, {})
);

export function getPrehabRoutine(clientIssues = [], sessionType = 'FULL_BODY', mobilityCatalog = MASTER_PREHAB_ROUTINES) {
  const catalog = (mobilityCatalog && mobilityCatalog.length > 0) ? mobilityCatalog : MASTER_PREHAB_ROUTINES;
  
  if (!clientIssues || clientIssues.length === 0 || !catalog || catalog.length === 0) {
    return {
      has_prehab: false,
      total_duration_minutes: 0,
      estimated_time_minutes: 0,
      session_type: sessionType,
      target_workout_type: sessionType,
      matched_issues: [],
      exercises: []
    };
  }

  const normalizedSession = (sessionType || 'FULL_BODY').toUpperCase();
  const matchedProtocols = [];

  for (const issue of clientIssues) {
    const issueUpper = String(issue).toUpperCase();
    const protocol = catalog.find(
      (item) => (item.issue_tag === issueUpper || issueUpper.includes(item.issue_tag)) && (
        item.target_session.some(ts => normalizedSession.includes(ts) || ts.includes(normalizedSession)) || 
        item.target_session.includes('FULL_BODY') ||
        normalizedSession.includes('FULL')
      )
    );

    if (protocol) {
      matchedProtocols.push(protocol);
    }
  }

  // Cap at 2 distinct issues maximum per workout to prevent pre-workout fatigue (under 5 mins)
  const selectedProtocols = matchedProtocols.slice(0, 2);
  const injectedExercises = [];
  let totalDuration = 0;

  selectedProtocols.forEach((protocol) => {
    totalDuration += protocol.duration_minutes || 2;
    protocol.exercises.forEach((ex) => {
      injectedExercises.push({
        ...ex,
        origin_issue: protocol.issue_tag,
        routine_name: protocol.name_ar
      });
    });
  });

  const cappedExercises = injectedExercises.slice(0, 3); // Hard limit of 3 corrective drills max

  return {
    has_prehab: cappedExercises.length > 0,
    total_duration_minutes: Math.min(totalDuration, 4),
    estimated_time_minutes: Math.min(totalDuration, 4),
    duration_minutes: Math.min(totalDuration, 4),
    session_type: normalizedSession,
    target_workout_type: normalizedSession,
    target_session: selectedProtocols.map(p => p.target_session).flat(),
    matched_issues: selectedProtocols.map(p => p.issue_tag),
    routine_title_ar: selectedProtocols[0]?.name_ar || 'روتين الإحماء والتجهيز المفصلي',
    name_ar: selectedProtocols[0]?.name_ar || 'روتين الإحماء والتجهيز المفصلي',
    exercises: cappedExercises,
    coach_tip_ar: 'قم بأداء هذه الحركات بهدوء وتركيز قبل البدء؛ الهدف هو تجهيز المفاصل وتنبيه العضلات وليس الإرهاق.'
  };
}

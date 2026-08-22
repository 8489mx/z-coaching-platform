export const EXPANDED_EXERCISE_CATALOG = [
  // 1. Specialized Glute Hypertrophy
  {
    id: 'kas_glute_bridge',
    name_ar: 'كاس جلوت بريدج (Kas Glute Bridge)',
    target_muscle: 'GLUTES',
    target_rep_range: [10, 15],
    target_rir: 2,
    cues_ar: [
      'تثبيت أعلى الظهر على البنش تحت لوح الكتف مباشرة.',
      'المدى الحركي صغير ومركز في الثلث العلوي فقط مع عصر ثانيتين بالأعلى.',
      'الذقن مضمومة للصدر والنظر للأمام طوال الحركة لحماية أسفل الظهر.'
    ]
  },
  {
    id: 'glute_hyperextension_45',
    name_ar: 'هايبراكتنشن جلوتس 45 درجة (Glute-Biased Hyperextension)',
    target_muscle: 'GLUTES_HAMSTRINGS',
    target_rep_range: [12, 15],
    target_rir: 2,
    cues_ar: [
      'تثبيت وسادة الجهاز تحت مفصل الحوض مباشرة.',
      'تقويس الظهر العلوي عمداً (Rounded Upper Back) لإلغاء مشاركة عضلات القطنية.',
      'الدفع وعصر الجلوتس بالكامل عند الصعود.'
    ]
  },
  {
    id: 'cable_glute_kickback',
    name_ar: 'كيك باك كابل للجلوتس (Cable Glute Kickback)',
    target_muscle: 'GLUTES',
    target_rep_range: [12, 15],
    target_rir: 2,
    cues_ar: [
      'توجيه مسار الساق للخلف وللخارج قليلاً بزاوية 30 درجة.',
      'تثبيت الجذع تماماً دون أرجحة أسفل الظهر.',
      'التحكم في الرجوع البطيء بالوزن في ثانيتين.'
    ]
  },

  // 2. Specialized Arms & Lateral Delts
  {
    id: 'bayesian_cable_curl',
    name_ar: 'بايسبس كابل بايزيان (Bayesian Cable Curl)',
    target_muscle: 'BICEPS',
    target_rep_range: [10, 12],
    target_rir: 2,
    cues_ar: [
      'الوقوف خطوة للأمام من جهاز الكابل لتكون الذراع خلف الجذع في وضع استطالة كاملة.',
      'تثبيت الكوع في مكانه طوال الصعود والنزول.',
      'النزول البطيء للوصول لقمة التمدد العضلي.'
    ]
  },
  {
    id: 'cross_body_triceps_ext',
    name_ar: 'ترايسبس كابل متقاطع (Cross-Body Cable Extension)',
    target_muscle: 'TRICEPS',
    target_rep_range: [10, 15],
    target_rir: 2,
    cues_ar: [
      'الإمساك بطرفي الكابل بدون مقابض بزاوية متقاطعة.',
      'سحب الكابل للخلف وللجانب بما يتماشى مع زاوية لوح الكتف الطبيعية.',
      'فرد الكوع بالكامل دون تقديم الكتف للأمام.'
    ]
  },
  {
    id: 'behind_back_lateral_raise',
    name_ar: 'رفرفة جانبي كابل من الخلف (Behind-The-Back Cable Lateral)',
    target_muscle: 'SIDE_DELTS',
    target_rep_range: [12, 15],
    target_rir: 2,
    cues_ar: [
      'تمرير الكابل من خلف الظهر لتوفير أقصى مقاومة في بداية الحركة.',
      'رفع الذراع بزاوية 15 درجة للأمام في مستوى لوح الكتف.',
      'التركيز على دفع الكوع للأعلى وللخارج.'
    ]
  },
  {
    id: 'arnold_pullover',
    name_ar: 'بولوفر دمبل / كابل كلاسيكي (Dumbbell Pullover)',
    target_muscle: 'LATS_CHEST',
    target_rep_range: [10, 12],
    target_rir: 2,
    cues_ar: [
      'وضع أعلى الظهر فقط عرضياً على البنش.',
      'ثني الكوعين ثنية بسيطة وثابتة طوال مسار الحركة.',
      'النزول حتى مستوى موازاة الرأس للشعور بتمدد اللاتس والصدر.'
    ]
  }
];

export function getExerciseById(id) {
  return EXPANDED_EXERCISE_CATALOG.find((e) => e.id === id) || null;
}

export function getExercisesByMuscle(targetMuscle) {
  return EXPANDED_EXERCISE_CATALOG.filter((e) => e.target_muscle === targetMuscle || e.target_muscle.includes(targetMuscle));
}

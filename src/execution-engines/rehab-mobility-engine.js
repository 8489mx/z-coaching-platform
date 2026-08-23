/**
 * Clinical Mobility, Prehab & Postural Correction Engine (محرك التأهيل والإحماء الحركي والاستطالات العلاجية)
 *
 * Deterministic generation of:
 * 1. Targeted Prehab Warmup Routines (McGill 3, Rotator Cuff, Spanish Squats, Ankle Mobility)
 * 2. Post-Workout Therapeutic Stretches (Hip flexor, Piriformis, Legs-Up-The-Wall, Pec, Lats)
 * 3. Targeted Postural Corrections (Anterior Pelvic Tilt, Rounded Shoulders, Kyphosis)
 * 4. Movement Prohibitions (No spinal flexion, no open-chain leg extensions, etc.)
 */

export function generateRehabAndMobilityRoutine({
  medicalConditions = [],
  posturalIssues = [], // ['ANTERIOR_PELVIC_TILT', 'ROUNDED_SHOULDERS']
  workoutTarget = 'UPPER' // 'UPPER', 'LOWER', 'FULL_BODY'
}) {
  const conds = (Array.isArray(medicalConditions) ? medicalConditions : [medicalConditions])
    .map(c => String(c || '').toUpperCase());
  const postures = (Array.isArray(posturalIssues) ? posturalIssues : [posturalIssues])
    .map(p => String(p || '').toUpperCase());

  let prehabWarmup = [];
  let postWorkoutStretches = [];
  let posturalCorrections = [];
  let prohibitedMovements = [];

  // 1. تأهيل الغضروف وآلام أسفل الظهر (McGill Protocol)
  if (conds.includes('LOWER_BACK_PAIN') || conds.includes('HERNIATED_DISC') || conds.includes('DISC_HERNIATION')) {
    prehabWarmup.push(
      { name_ar: 'تمرين Bird-Dog لتثبيت العمود الفقري', sets: 2, reps: '8 لكل جانب', tempo: 'ثبات ثانيتين' },
      { name_ar: 'تمرين Side Plank للكور الجانبي', sets: 2, reps: '20-30 ثانية لكل جانب' },
      { name_ar: 'تفعيل الجلوتس بالباند (Glute Bridges)', sets: 2, reps: '12 تكرار' }
    );
    postWorkoutStretches.push(
      { name_ar: 'إطالة عضلات الحوض (Kneeling Hip Flexor Stretch)', duration: '45 ثانية لكل جانب' },
      { name_ar: 'إطالة عضلة الكمثرى (Figure 4 Piriformis Stretch)', duration: '45 ثانية' }
    );
    prohibitedMovements.push('NO_SEATED_TOE_TOUCH', 'NO_LOADED_SPINAL_FLEXION');
  }

  // 2. تأهيل نغزة ومفصل الكتف (Rotator Cuff Prehab)
  if (conds.includes('SHOULDER_IMPINGEMENT')) {
    prehabWarmup.push(
      { name_ar: 'دوران خارجي للكتف بالكيبل/الباند (External Rotations)', sets: 2, reps: '15 تكرار' },
      { name_ar: 'سحب الباند للصدر (Band Pull-Aparts)', sets: 2, reps: '15-20 تكرار' }
    );
    postWorkoutStretches.push(
      { name_ar: 'إطالة عضلات الصدر على زاوية الحائط/الباب (Doorway Pec Stretch)', duration: '45 ثانية' },
      { name_ar: 'إطالة العضلة الظهرية العريضة (Lat Stretch)', duration: '45 ثانية' }
    );
    prohibitedMovements.push('NO_INTERNAL_ROTATION_PRESSING', 'NO_BEHIND_NECK_MOVEMENTS');
  }

  // 3. تأهيل أوتار وصابونة الركبة (Patellar Tendon Prehab)
  if (conds.includes('PATELLAR_TENDINITIS') || conds.includes('KNEE_PAIN')) {
    prehabWarmup.push(
      { name_ar: 'ثبات السكوات الإيزومتري بالباند (Isometric Spanish Squat)', sets: 3, reps: '45 ثانية ثبات' },
      { name_ar: 'مرونة مفصل الكاحل على الحائط (Ankle Dorsiflexion)', sets: 2, reps: '10 تكرارات لكل قدم' }
    );
    postWorkoutStretches.push(
      { name_ar: 'إطالة عضلات السمانة (Calf Stretch on Step)', duration: '45 ثانية' },
      { name_ar: 'إطالة الفخذ الخلفية بالباند مستلقياً (Lying Hamstring Band Stretch)', duration: '45 ثانية' }
    );
    prohibitedMovements.push('NO_OPEN_CHAIN_LEG_EXTENSION');
  }

  // 4. تصريف احتقان الأوردة لدوالي الساقين
  if (conds.includes('HERNIA_VARICOSE') || conds.includes('VARICOSE_VEINS')) {
    postWorkoutStretches.push(
      { name_ar: 'رفع الساقين للأعلى بزاوية 90° على الحائط (Legs-Up-The-Wall)', duration: '5 دقائق متواصلة' }
    );
  }

  // 5. تصحيح ميل الحوض الأمامي (Anterior Pelvic Tilt)
  if (postures.includes('ANTERIOR_PELVIC_TILT') || conds.includes('ANTERIOR_PELVIC_TILT')) {
    posturalCorrections.push(
      { name_ar: 'تقوية عضلات البطن السفلية بتفريغ الحوض (Deadbug)', sets: 3, reps: '10 تكرارات' },
      { name_ar: 'إطالة الفخذ الأمامية ومثنيات الحوض (Couch Stretch)', duration: '60 ثانية لكل جانب' }
    );
  }

  // 6. تصحيح تقوس الأكتاف والرقبة (Rounded Shoulders / Kyphosis)
  if (postures.includes('ROUNDED_SHOULDERS') || conds.includes('ROUNDED_SHOULDERS')) {
    posturalCorrections.push(
      { name_ar: 'تمرين Face Pulls بحبل الكيبل مع التركيز على دوران الكتف', sets: 3, reps: '15 تكرار' },
      { name_ar: 'تمرين Prone Y-Raises للظهر الأوسط والسفلي', sets: 2, reps: '12 تكرار' }
    );
  }

  // Default baseline if no specific injuries
  if (prehabWarmup.length === 0) {
    if (workoutTarget === 'UPPER') {
      prehabWarmup.push(
        { name_ar: 'دوران الأكتاف بالباند (Band Shoulder Dislocates)', sets: 2, reps: '12 تكرار' },
        { name_ar: 'سحب الباند للصدر (Band Pull-Aparts)', sets: 2, reps: '15 تكرار' }
      );
    } else {
      prehabWarmup.push(
        { name_ar: 'إحماء الحوض (World Greatest Stretch)', sets: 2, reps: '6 لكل جانب' },
        { name_ar: 'تفعيل الجلوتس بالباند (Bodyweight Glute Bridges)', sets: 2, reps: '15 تكرار' }
      );
    }
  }

  if (postWorkoutStretches.length === 0) {
    postWorkoutStretches.push(
      { name_ar: 'إطالة الصدر والأكتاف المهدئة', duration: '60 ثانية' },
      { name_ar: 'إطالة عضلات الفخذ الخلفية وأسفل الظهر', duration: '60 ثانية' }
    );
  }

  return {
    prehabWarmup,
    postWorkoutStretches,
    posturalCorrections,
    prohibitedMovements
  };
}

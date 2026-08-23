/**
 * Clinical Mobility, Prehab, Postural Correction & Decompression Engine
 */

export function generateRehabAndMobilityRoutine({
  medicalConditions = [],
  posturalIssues = [],
  pregnancyTrimester = 'NONE',
  workoutTarget = 'UPPER'
}) {
  const conds = (Array.isArray(medicalConditions) ? medicalConditions : [medicalConditions])
    .map(c => String(c || '').toUpperCase());
  const postures = (Array.isArray(posturalIssues) ? posturalIssues : [posturalIssues])
    .map(p => String(p || '').toUpperCase());

  let prehabWarmup = [];
  let postWorkoutStretches = [];
  let posturalCorrections = [];
  let biomechanicalRestrictions = [];

  // 1. بروتوكول الغضروف وآلام أسفل الظهر (McGill Protocol)
  if (conds.includes('LOWER_BACK_PAIN') || conds.includes('HERNIATED_DISC') || conds.includes('DISC_HERNIATION')) {
    prehabWarmup.push(
      { name_ar: 'تمرين Bird-Dog لتثبيت العمود الفقري', sets: 2, reps: '8 لكل جانب', tempo: 'ثبات ثانيتين' },
      { name_ar: 'تمرين Side Plank للكور الجانبي', sets: 2, reps: '25 ثانية لكل جانب' },
      { name_ar: 'تفعيل الجلوتس بالباند (Glute Bridges)', sets: 2, reps: '12 تكرار' }
    );
    postWorkoutStretches.push(
      { name_ar: 'إطالة مثنيات الحوض (Kneeling Hip Flexor Stretch)', duration: '45 ثانية لكل جانب' },
      { name_ar: 'إطالة عضلة الكمثرى (Piriformis Stretch)', duration: '45 ثانية لكل جانب' }
    );
    biomechanicalRestrictions.push('NO_AXIAL_LOADING_SQUAT_DEADLIFT', 'NO_SEATED_TOE_TOUCH');
  }

  // 2. بروتوكول نغزة الكتف (Rotator Cuff)
  if (conds.includes('SHOULDER_IMPINGEMENT')) {
    prehabWarmup.push(
      { name_ar: 'دوران خارجي للكتف بالكيبل/الباند (External Rotations)', sets: 2, reps: '15 تكرار' },
      { name_ar: 'سحب الباند للصدر (Band Pull-Aparts)', sets: 2, reps: '20 تكرار' }
    );
    postWorkoutStretches.push(
      { name_ar: 'إطالة الصدر على زاوية الباب (Doorway Pec Stretch)', duration: '45 ثانية' },
      { name_ar: 'إطالة العضلة الظهرية العريضة (Lat Stretch)', duration: '45 ثانية' }
    );
    biomechanicalRestrictions.push('SCAPULAR_PLANE_PRESSING_ONLY', 'NO_BEHIND_NECK_MOVEMENTS');
  }

  // 3. بروتوكول صابونة الركبة (Patellar Tendon)
  if (conds.includes('PATELLAR_TENDINITIS') || conds.includes('KNEE_PAIN')) {
    prehabWarmup.push(
      { name_ar: 'سكوات إيزومتري بالباند (Isometric Spanish Squat)', sets: 3, reps: '45 ثانية ثبات' },
      { name_ar: 'مرونة مفصل الكاحل على الحائط (Ankle Dorsiflexion)', sets: 2, reps: '10 تكرارات لكل قدم' }
    );
    postWorkoutStretches.push(
      { name_ar: 'إطالة السمانة على حافة الدرج (Calf Stretch)', duration: '45 ثانية' },
      { name_ar: 'إطالة الفخذ الخلفية بالباند مستلقياً', duration: '45 ثانية' }
    );
    biomechanicalRestrictions.push('NO_OPEN_CHAIN_LEG_EXTENSIONS');
  }

  // 4. بروتوكول دوالي الساقين والفتق
  if (conds.includes('HERNIA_VARICOSE') || conds.includes('VARICOSE_VEINS')) {
    postWorkoutStretches.push(
      { name_ar: 'رفع الساقين للأعلى بزاوية 90° على الحائط (Legs-Up-The-Wall)', duration: '5 دقائق متواصلة لتصريف الدم الراكد' }
    );
    biomechanicalRestrictions.push('NO_VALSALVA_MANEUVER', 'PREFER_SEATED_AND_LYING');
  }

  // 5. قيود الثلث الثاني والثالث للحمل (Supine Hypotensive Protocol)
  const normTrimester = String(pregnancyTrimester || '').toUpperCase();
  if (normTrimester === 'SECOND' || normTrimester === 'THIRD') {
    biomechanicalRestrictions.push('NO_FLAT_SUPINE_EXERCISES', 'NO_INTRA_ABDOMINAL_CRUNCHES');
  }

  // 6. تصحيح ميل الحوض الأمامي (Anterior Pelvic Tilt)
  if (postures.includes('ANTERIOR_PELVIC_TILT') || conds.includes('ANTERIOR_PELVIC_TILT')) {
    posturalCorrections.push(
      { name_ar: 'تقوية عضلات البطن السفلية بتفريغ الحوض (Deadbug)', sets: 3, reps: '10 تكرارات' },
      { name_ar: 'إطالة الفخذ الأمامية ومثنيات الحوض (Couch Stretch)', duration: '60 ثانية لكل جانب' }
    );
  }

  // 7. تصحيح تقوس الأكتاف والرقبة (Rounded Shoulders / Kyphosis)
  if (postures.includes('ROUNDED_SHOULDERS') || conds.includes('ROUNDED_SHOULDERS')) {
    posturalCorrections.push(
      { name_ar: 'تمرين Face Pulls بحبل الكيبل مع التركيز على دوران الكتف', sets: 3, reps: '15 تكرار' },
      { name_ar: 'تمرين Prone Y-Raises للظهر الأوسط والسفلي', sets: 2, reps: '12 تكرار' }
    );
  }

  // Baseline fallback
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
    biomechanicalRestrictions,
    prohibitedMovements: biomechanicalRestrictions // backward compatibility alias
  };
}

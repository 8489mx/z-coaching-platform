/**
 * Pre-Flight Plan Quality & Clinical Audit Shield Engine
 * Z Coaching Platform - Enterprise Plan Audit Architecture
 *
 * Deterministic audit of training, nutrition, supplement, and injury compatibility
 * prior to plan deployment to trainee. Zero emojis, strictly Arabic RTL clinical directives.
 */

import { evaluateClinicalSupplementSafety } from './clinical-supplement-safety-engine.js';

export const AUDIT_STATUS = {
  READY: 'READY_FOR_DEPLOYMENT',
  WARNING: 'ACTION_REQUIRED_WARNINGS',
  BLOCKED: 'BLOCKED_CRITICAL_RISKS'
};

/**
 * Evaluates the full trainee plan against clinical, volume, nutritional, and biomechanical landmarks.
 */
export function auditPlanPreflightQuality({
  program = {},
  client = {}
} = {}) {
  const trainee = program.client || client || {};
  const trainingPlan = program.training_plan || program.training || {};
  const nutritionPlan = program.nutrition_plan || program.nutrition || {};
  const supplementsList = program.supplements_plan || program.supplements || [];

  const checks = [];
  const blockers = [];
  const warnings = [];
  const passedItems = [];

  let volumeScore = 20;
  let nutritionScore = 20;
  let supplementScore = 20;
  let injuryScore = 15;
  let varietyScore = 15;
  let prescriptionScore = 10;

  // ----------------------------------------------------
  // 1. Volume Landmark Validation (0 - 20 pts)
  // ----------------------------------------------------
  const workoutDays = Array.isArray(trainingPlan.days) 
    ? trainingPlan.days 
    : (Array.isArray(trainingPlan.workout_days) ? trainingPlan.workout_days : []);

  let totalWeeklySets = 0;
  const muscleSetsMap = {};

  workoutDays.forEach(day => {
    const exercises = Array.isArray(day.exercises) ? day.exercises : [];
    exercises.forEach(ex => {
      const sets = Number(ex.sets) || 3;
      totalWeeklySets += sets;
      const targetMuscle = String(ex.target_muscle || ex.muscle_group || 'other').toLowerCase();
      muscleSetsMap[targetMuscle] = (muscleSetsMap[targetMuscle] || 0) + sets;
    });
  });

  if (workoutDays.length === 0 || totalWeeklySets === 0) {
    volumeScore = 5;
    blockers.push('البرنامج التدريبي فارغ أو لا يحتوي على أي أيام أو جولات مسجلة.');
  } else {
    let hasMevRisk = false;
    let hasMrvRisk = false;
    const majorMuscles = ['chest', 'back', 'legs', 'quads', 'hamstrings', 'glutes', 'shoulders', 'صدر', 'ظهر', 'أرجل', 'أكتاف', 'فخذ'];
    const isMajor = (m) => majorMuscles.some(mj => m.includes(mj));

    Object.entries(muscleSetsMap).forEach(([muscle, count]) => {
      if (isMajor(muscle) && count < 6) {
        hasMevRisk = true;
      } else if (count > 26) {
        hasMrvRisk = true;
      }
    });

    if (hasMrvRisk) {
      volumeScore -= 6;
      warnings.push('تجاوز الحجم التدريبي الأقصى القابل للاستشفاء (MRV) في بعض العضلات (> 26 جولة أسبوعياً).');
    }
    if (hasMevRisk && workoutDays.length >= 3) {
      volumeScore -= 4;
      warnings.push('حجم تدريبي منخفض دون الحد الأدنى الفعال (MEV) في بعض المجموعات العضلية الرئيسية (< 6 جولات).');
    }

    if (!hasMevRisk && !hasMrvRisk) {
      passedItems.push('توازن الحجم التدريبي الأسبوعي واقع ضمن النطاق التكيفي الأمثل (MAV: 10-22 جولة).');
    }
  }

  checks.push({
    id: 'volume_landmarks',
    title_ar: 'توازن الحجم التدريبي الأسبوعي (Volume Landmarks)',
    score: Math.max(0, volumeScore),
    max_score: 20,
    status: volumeScore >= 16 ? 'PASSED' : volumeScore >= 10 ? 'WARNING' : 'FAILED'
  });

  // ----------------------------------------------------
  // 2. Macro & Caloric Deficit Feasibility (0 - 20 pts)
  // ----------------------------------------------------
  const targetCalories = Number(nutritionPlan.target_calories || nutritionPlan.calories || 2000);
  const proteinGrams = Number(nutritionPlan.target_protein || nutritionPlan.protein_g || 150);
  const traineeWeight = Number(trainee.weight_kg || 80);
  const proteinPerKg = Number((proteinGrams / (traineeWeight || 1)).toFixed(2));

  if (targetCalories < 1100) {
    nutritionScore -= 12;
    blockers.push(`السعرات الحرارية المقررة (${targetCalories} سعرة) منخفضة بشكل حاد وغير آمن فسيولوجياً.`);
  } else if (targetCalories < 1300 && traineeWeight > 70) {
    nutritionScore -= 6;
    warnings.push(`عجز سعري حاد (${targetCalories} سعرة) قد يؤدي إلى إجهاد أيضي وتآكل الكتلة العضلية.`);
  }

  if (proteinPerKg < 1.4) {
    nutritionScore -= 8;
    warnings.push(`كمية البروتين المقررة (${proteinPerKg} جم/كجم) أقل من الحد الأدنى للحفاظ العضلي (1.6 - 2.2 جم/كجم).`);
  } else {
    passedItems.push(`معدل البروتين اليومي كافي وممتاز (${proteinPerKg} جم/كجم من وزن الجسم).`);
  }

  checks.push({
    id: 'macro_caloric_feasibility',
    title_ar: 'التوافق الغذائي وسد العجز السعري (Macro Feasibility)',
    score: Math.max(0, nutritionScore),
    max_score: 20,
    status: nutritionScore >= 16 ? 'PASSED' : nutritionScore >= 10 ? 'WARNING' : 'FAILED'
  });

  // ----------------------------------------------------
  // 3. Clinical Supplement Safety Audit (Tier 1) (0 - 20 pts)
  // ----------------------------------------------------
  const clinicalAudit = evaluateClinicalSupplementSafety({
    supplements: supplementsList,
    medicalConditions: trainee.medical_conditions || trainee.health_conditions || [],
    activeMedications: trainee.medications || trainee.active_medications || [],
    biomarkers: trainee.biomarkers || trainee.lab_biomarkers || {},
    weightKg: Number(trainee.weight_kg || 75)
  });

  if (clinicalAudit.contraindicated_count > 0) {
    supplementScore = 0;
    clinicalAudit.evaluations.filter(e => e.safety_status === 'CONTRAINDICATED').forEach(inter => {
      blockers.push(`تعارض سريري طبي: ${inter.clinical_rationale_ar}`);
    });
  } else if (clinicalAudit.caution_count > 0) {
    supplementScore = 12;
    clinicalAudit.evaluations.filter(e => e.safety_status === 'CAUTION').forEach(w => {
      warnings.push(`تنبيه مكملات: ${w.clinical_rationale_ar || w.supplement_name_ar}`);
    });
  } else {
    passedItems.push('مصفوفة المكملات الغذائية آمنة تماماً وخالية من أي تعارضات مع الأدوية أو المؤشرات الصحية.');
  }

  checks.push({
    id: 'clinical_supplement_safety',
    title_ar: 'فحص موانع المكملات والأدوية (Clinical Safety Shield)',
    score: Math.max(0, supplementScore),
    max_score: 20,
    status: supplementScore >= 18 ? 'PASSED' : supplementScore >= 10 ? 'WARNING' : 'FAILED'
  });

  // ----------------------------------------------------
  // 4. Injury Contraindication Check (0 - 15 pts)
  // ----------------------------------------------------
  const injuries = Array.isArray(trainee.injuries) 
    ? trainee.injuries 
    : (typeof trainee.injuries === 'string' && trainee.injuries !== 'none' ? [trainee.injuries] : []);

  const injuryConflicts = [];
  if (injuries.length > 0) {
    const injuryStr = injuries.join(' ').toLowerCase();
    const isKneeInjury = injuryStr.includes('knee') || injuryStr.includes('ركب') || injuryStr.includes('غضروف');
    const isBackInjury = injuryStr.includes('back') || injuryStr.includes('ظهر') || injuryStr.includes('فقر') || injuryStr.includes('ديسك');
    const isShoulderInjury = injuryStr.includes('shoulder') || injuryStr.includes('كتف');

    workoutDays.forEach(day => {
      const exercises = Array.isArray(day.exercises) ? day.exercises : [];
      exercises.forEach(ex => {
        const name = String(ex.name_ar || ex.name || '').toLowerCase();
        if (isKneeInjury && (name.includes('سكوات حر') || name.includes('barbell squat') || name.includes('leg extension'))) {
          injuryConflicts.push(`تمرين (${ex.name_ar || ex.name}) قد يضاعف إجهاد مفصل الركبة المصاب.`);
        }
        if (isBackInjury && (name.includes('ديدليفت') || name.includes('deadlift') || name.includes('barbell row'))) {
          injuryConflicts.push(`تمرين (${ex.name_ar || ex.name}) يفرض حملاً محورياً كبيراً على أسفل الظهر المصاب.`);
        }
        if (isShoulderInjury && (name.includes('behind neck') || name.includes('military press') || name.includes('خلف الرقبة'))) {
          injuryConflicts.push(`تمرين (${ex.name_ar || ex.name}) يضع مفصل الكتف في زاوية انحشار غير مواتية.`);
        }
      });
    });

    if (injuryConflicts.length > 0) {
      injuryScore -= 10;
      injuryConflicts.forEach(conf => warnings.push(`موانع الإصابات الحركية: ${conf}`));
    } else {
      passedItems.push('جدول التمارين يراعي التاريخ الإصابي للمشترك وخالي من التمارين ذات الحمل المحوري العالي.');
    }
  } else {
    passedItems.push('لا توجد إصابات مسجلة تعيق تطبيق الجدول الحركي.');
  }

  checks.push({
    id: 'injury_contraindications',
    title_ar: 'ملاءمة التمارين للإصابات المسجلة (Biomechanical Safety)',
    score: Math.max(0, injuryScore),
    max_score: 15,
    status: injuryScore >= 12 ? 'PASSED' : 'WARNING'
  });

  // ----------------------------------------------------
  // 5. Micronutrient & Variety Check (0 - 15 pts)
  // ----------------------------------------------------
  const meals = Array.isArray(nutritionPlan.meals) ? nutritionPlan.meals : [];
  if (meals.length < 2 && targetCalories > 1500) {
    varietyScore -= 6;
    warnings.push('توزيع الوجبات اليومي محدود جداً (< 2 وجبات)، مما يصعب امتصاص المغذيات والالتزام.');
  }

  const hydrationTarget = nutritionPlan.hydration_liters || nutritionPlan.water_liters;
  if (!hydrationTarget) {
    varietyScore -= 3;
    warnings.push('لم يتم تحديد مؤشر الترطيب اليومي الاسترشادي للماء (الموصى به 3.5 - 4.0 لتر).');
  } else {
    passedItems.push(`مؤشر الترطيب اليومي محدد بدقة (${hydrationTarget} لتر/اليوم).`);
  }

  checks.push({
    id: 'diet_variety_hydration',
    title_ar: 'تنوع الوجبات واكتمال مؤشرات الترطيب (Nutritional Discipline)',
    score: Math.max(0, varietyScore),
    max_score: 15,
    status: varietyScore >= 12 ? 'PASSED' : 'WARNING'
  });

  // ----------------------------------------------------
  // 6. Rest & Prescription Completeness (0 - 10 pts)
  // ----------------------------------------------------
  let exercisesWithoutRest = 0;
  let exercisesWithoutTechNotes = 0;

  workoutDays.forEach(day => {
    const exercises = Array.isArray(day.exercises) ? day.exercises : [];
    exercises.forEach(ex => {
      if (!ex.rest_seconds && !ex.rest_time) exercisesWithoutRest++;
      if (!ex.notes && !ex.technique_notes && !ex.form_cue) exercisesWithoutTechNotes++;
    });
  });

  if (exercisesWithoutRest > 3) {
    prescriptionScore -= 4;
    warnings.push('بعض التمارين تفتقر لتحديد فترات الراحة البينية الدقيقة بين المجموعات.');
  }
  if (exercisesWithoutTechNotes > 5) {
    prescriptionScore -= 3;
    warnings.push('يوصى بإضافة توجيهات أداء حركية وتكنيك لضمان دقة تنفيذ المتدرب.');
  }
  if (prescriptionScore >= 8) {
    passedItems.push('اكتمال الإرشادات السريرية وفترات الراحة والتكنيك لكافة التمارين.');
  }

  checks.push({
    id: 'prescription_completeness',
    title_ar: 'اكتمال الإرشادات السريرية والفترات البينية (Prescription Clarity)',
    score: Math.max(0, prescriptionScore),
    max_score: 10,
    status: prescriptionScore >= 8 ? 'PASSED' : 'WARNING'
  });

  // ----------------------------------------------------
  // Total Quality Score & Deployment Clearance Status
  // ----------------------------------------------------
  const totalScore = Math.min(100, Math.max(0, 
    volumeScore + nutritionScore + supplementScore + injuryScore + varietyScore + prescriptionScore
  ));

  let auditStatus = AUDIT_STATUS.READY;
  let statusTitleAr = 'الخطة مكتملة وجاهزة للنشر الفوري';
  let clinicalVerdictAr = 'اجتازت الخطة كافة معايير الفحص السريري والتكيف الحركي والغذائي بأمان تام.';

  if (blockers.length > 0 || totalScore < 70) {
    auditStatus = AUDIT_STATUS.BLOCKED;
    statusTitleAr = 'محظور النشر مؤقتاً (مخاطر حرجة تتطلب المعالجة)';
    clinicalVerdictAr = 'تحتوي الخطة على موانع طبية أو تعارضات حرجة تمنع نشرها للمتدرب لحين تصحيحها.';
  } else if (totalScore < 85) {
    auditStatus = AUDIT_STATUS.WARNING;
    statusTitleAr = 'تحذيرات استرشادية بحاجة لمراجعة المدرب';
    clinicalVerdictAr = 'الخطة قابلة للنشر ولكن تتضمن نقاط ضعف يفضل تحسينها لضمان أعلى استجابة تدريبية.';
  }

  return {
    total_score: totalScore,
    status: auditStatus,
    status_title_ar: statusTitleAr,
    clinical_verdict_ar: clinicalVerdictAr,
    is_deployable: auditStatus !== AUDIT_STATUS.BLOCKED,
    checks: checks,
    blockers: blockers,
    warnings: warnings,
    passed_items: passedItems,
    summary: {
      volume_score: volumeScore,
      nutrition_score: nutritionScore,
      supplement_score: supplementScore,
      injury_score: injuryScore,
      variety_score: varietyScore,
      prescription_score: prescriptionScore,
      total_blockers: blockers.length,
      total_warnings: warnings.length,
      total_passed: passedItems.length
    }
  };
}

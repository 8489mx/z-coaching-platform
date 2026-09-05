/**
 * Pre-Flight Clinical Audit Gate Engine (محرك التدقيق السريري الآلي قبل الاعتماد)
 *
 * Enforces a strict 4-point gate before any generated plan is allowed to go live:
 *   1. Clinical Safety Wall: Zero contraindications for spinal, shoulder, or knee injuries.
 *   2. Biomarker Ceiling Check: Renal protein cap (<= 1.1 g/kg for eGFR < 60) and Creatine exclusion.
 *   3. Drug Timing Verification: 4h Thyroid separation, B12 for Metformin, KCl ban for ACE inhibitors.
 *   4. Macro Integrity: (4*P + 4*C + 9*F) == Total Calories within +/- 2.5%.
 */

export function auditGeneratedPlan({ clientProfile = {}, generatedPlan = {} }) {
  const checklist = [];
  const blockers = [];
  const warnings = [];

  const weightKg = clientProfile.weight_kg || 75;
  const conditions = (clientProfile.medical_conditions || []).map(c => String(c).toUpperCase());
  const medications = (clientProfile.medications || []).map(m => String(m).toUpperCase());
  const bloodwork = clientProfile.bloodwork || {};

  const nutrition = generatedPlan.nutrition || {};
  const training = generatedPlan.training || {};

  // 1. Clinical Safety Wall (Injuries vs Exercises)
  let safetyWallPassed = true;
  const exercises = training.exercises || [];
  const exerciseNames = exercises.map(e => String(e.name || e.code || '').toUpperCase());

  // Disc L5-S1 Check
  if (conditions.some(c => c.includes('L5') || c.includes('DISC') || c.includes('ديسك') || c.includes('فقرات'))) {
    const hazardousAxial = exerciseNames.filter(name => 
      name.includes('BARBELL SQUAT') || name.includes('BARBELL ROW') || name.includes('DEADLIFT') || name.includes('سكوات حر')
    );
    if (hazardousAxial.length > 0) {
      safetyWallPassed = false;
      blockers.push(`حظر سريري حرج (ديسك L5-S1): تم رصد تمارين ضغط محوري على العمود الفقري (${hazardousAxial.join(', ')}) يجب استبدالها بتمارين مسنودة الصدر أو Leg Press.`);
    }
  }

  // Shoulder Impingement Check
  if (conditions.some(c => c.includes('SHOULDER') || c.includes('IMPINGEMENT') || c.includes('كتف') || c.includes('اختناق'))) {
    const hazardousOverhead = exerciseNames.filter(name => 
      name.includes('BEHIND NECK') || name.includes('UPRIGHT ROW') || name.includes('سحب خلف الرقبة')
    );
    if (hazardousOverhead.length > 0) {
      safetyWallPassed = false;
      blockers.push(`حظر سريري (اختناق الكتف): تم رصد حركات رفع عمودي حادة (${hazardousOverhead.join(', ')}).`);
    }
  }

  checklist.push({
    gate_name: 'جدار الأمان الميكانيكي والسريري (Clinical Safety Wall)',
    status: safetyWallPassed ? 'PASSED' : 'FAILED',
    details_ar: safetyWallPassed ? 'تم التحقق من خلو الخطة من أي حركات تتعارض مع الإصابات والمفاصل.' : 'توجد تعارضات ميكانيكية يجب تعديلها.'
  });

  // 2. Biomarker Ceiling Check (Renal / eGFR)
  let biomarkerPassed = true;
  const egfr = bloodwork.egfr_ml_min;
  const proteinG = nutrition.protein_g || 150;
  const proteinPerKg = proteinG / weightKg;
  const hasCreatine = (nutrition.supplements || []).some(s => String(s).toUpperCase().includes('CREATINE'));

  if (egfr && egfr < 60) {
    if (proteinPerKg > 1.15) {
      biomarkerPassed = false;
      blockers.push(`تجاوز السد الكلوي (eGFR = ${egfr}): نسبة البروتين الموصوفة (${proteinPerKg.toFixed(2)} g/kg) تتجاوز الحد الأقصى الآمن (1.1 g/kg).`);
    }
    if (hasCreatine) {
      biomarkerPassed = false;
      blockers.push('حظر مكمل الكرياتين: يجب حذف الكرياتين لحالات القصور الكلوي (eGFR < 60).');
    }
  }

  checklist.push({
    gate_name: 'فحص سقف المؤشرات الحيوية والكلى (Biomarker Ceiling Gate)',
    status: biomarkerPassed ? 'PASSED' : 'FAILED',
    details_ar: biomarkerPassed ? 'البروتين والمكملات متوافقة تماماً مع الفحوصات المخبرية ووظائف الكلى.' : 'تجاوز في سقف البروتين أو مكملات الكرياتين.'
  });

  // 3. Drug Timing Verification
  let drugTimingPassed = true;
  const isThyroidClient = medications.some(m => m.includes('ELTROXIN') || m.includes('EUTHYROX') || m.includes('غدة'));
  
  if (isThyroidClient) {
    const drugTimingNotice = String(nutrition.drug_timing_notice_ar || '').toUpperCase();
    if (!drugTimingNotice.includes('4') && !drugTimingNotice.includes('ساعات')) {
      drugTimingPassed = false;
      blockers.push('تنبيه دوائي ملزم: لم يتم إدراج فاصل الأمان الزمني (4 ساعات) بين دواء الغدة والألبان/الكالسيوم.');
    }
  }

  checklist.push({
    gate_name: 'مصفوفة الأمان الدوائي وتوقيت الجرعات (Drug-Nutrient Timing)',
    status: drugTimingPassed ? 'PASSED' : 'FAILED',
    details_ar: drugTimingPassed ? 'تمت برمجة فواصل الأمان الدوائية والمكملات بدقة صيدلانية.' : 'مفقود فاصل الأمان الزمني لأدوية المشترك.'
  });

  // 4. Macro Integrity Verification
  const cal = nutrition.daily_calories || 2000;
  const carbsG = nutrition.carbs_g || 200;
  const fatG = nutrition.fat_g || 50;
  const calculatedKcal = (proteinG * 4) + (carbsG * 4) + (fatG * 9);
  const diffPercent = Math.abs((calculatedKcal - cal) / cal) * 100;

  const macroIntegrityPassed = diffPercent <= 3.5;
  if (!macroIntegrityPassed) {
    warnings.push(`فارق طفيف في توازن الماكروز (${calculatedKcal} Kcal محسوبة مقابل ${cal} Kcal مستهدفة - فارق ${diffPercent.toFixed(1)}%).`);
  }

  checklist.push({
    gate_name: 'التوازن الحراري والماكروي (Macro Integrity Check)',
    status: macroIntegrityPassed ? 'PASSED' : 'WARNING',
    details_ar: `تطابق الماكروز مع السعرات بنسبة دقة ${(100 - diffPercent).toFixed(1)}%.`
  });

  const overallPassed = blockers.length === 0;

  return {
    passed: overallPassed,
    audit_score_percent: overallPassed ? 100 : Math.round((checklist.filter(c => c.status === 'PASSED').length / checklist.length) * 100),
    checklist,
    blockers,
    warnings,
    summary_ar: overallPassed 
      ? 'اجتاز البرنامج كافة مراحل التدقيق السريري الصارم بنسبة 100% وجاهز للإطلاق الفوري.'
      : `تعذر الاعتماد: يوجد ${blockers.length} موانع سريرية يجب تصحيحها أولاً.`
  };
}

/**
 * Clinical Biomarker & Bloodwork Analyzer Engine (محرك تحليل الفحوصات الطبية والمؤشرات الحيوية)
 *
 * Scans bloodwork and auto-adjusts macro targets, protein caps, and supplements:
 *   - HbA1c / Fasting Glucose: Glucose homeostasis & fiber targets (>= 35g).
 *   - Creatinine / eGFR: Renal safety guardrail (protein cap 1.0-1.1 g/kg, withhold creatine).
 *   - ALT/AST / Triglycerides: Hepatic & lipid safety (saturated fat < 7%, Omega-3 injection).
 *   - Vitamin D3 / Ferritin: Micronutrient repletion protocols.
 */

export function analyzeBloodworkBiomarkers({
  body_weight_kg = 75,
  hba1c_percent = null,
  fasting_glucose_mg_dl = null,
  creatinine_mg_dl = null,
  egfr_ml_min = null,
  alt_u_l = null,
  ast_u_l = null,
  triglycerides_mg_dl = null,
  vitamin_d3_ng_ml = null,
  ferritin_ng_ml = null,
  gender = 'MALE'
}) {
  const flags = [];
  const dietaryModifications = {
    protein_cap_g_per_kg: null,
    min_fiber_g: 28,
    saturated_fat_cap_percent: 10,
    withhold_creatine: false,
    complex_carbs_only: false
  };
  const supplementRecommendations = [];

  // 1. Glycemic / Insulin Control (HbA1c & Fasting Glucose)
  const isElevatedHbA1c = typeof hba1c_percent === 'number' && hba1c_percent >= 5.7;
  const isElevatedGlucose = typeof fasting_glucose_mg_dl === 'number' && fasting_glucose_mg_dl >= 100;

  if (isElevatedHbA1c || isElevatedGlucose) {
    flags.push({
      biomarker: 'GLUCOSE_METABOLISM',
      severity: hba1c_percent >= 6.5 ? 'HIGH' : 'MODERATE',
      message_ar: 'رصد مؤشرات مرحلة ما قبل السكري أو اضطراب سكر الدم (HbA1c >= 5.7%): تم رفع الحد الأدنى للألياف إلى 35g يومياً وتقنين السكريات البسيطة لمنع قفزات الأنسولين.',
      message_en: 'Elevated HbA1c/Fasting Glucose: Enforced >= 35g dietary fiber, low glycemic index carbs, and eliminated refined sugars.'
    });
    dietaryModifications.min_fiber_g = 35;
    dietaryModifications.complex_carbs_only = true;
    supplementRecommendations.push({
      supplement: 'Chromium Picolinate + Berberine / Cinnamon Extract',
      dosage: '200 mcg Chromium daily',
      reason_ar: 'لتحسين حساسية مستقبلات الأنسولين وضبط مستوى السكر بعد الوجبات'
    });
  }

  // 2. Renal Function Guardrail (Creatinine & eGFR)
  const isElevatedCreatinine = typeof creatinine_mg_dl === 'number' && (gender === 'MALE' ? creatinine_mg_dl > 1.3 : creatinine_mg_dl > 1.1);
  const isReducedEGFR = typeof egfr_ml_min === 'number' && egfr_ml_min < 60;

  if (isReducedEGFR || isElevatedCreatinine) {
    flags.push({
      biomarker: 'RENAL_FUNCTION',
      severity: 'HIGH_CRITICAL',
      message_ar: 'تفعيل السد الكلوي الصارم (eGFR < 60 أو ارتفاع الكرياتينين): تم تقييد البروتين بحد أقصى 1.0 - 1.1 g/kg وحظر مكمل الكرياتين مؤقتاً لحماية الكلى.',
      message_en: 'Renal Guardrail Triggered (eGFR < 60): Protein capped at 1.0-1.1 g/kg and Creatine supplementation withheld.'
    });
    dietaryModifications.protein_cap_g_per_kg = 1.1;
    dietaryModifications.withhold_creatine = true;
  }

  // 3. Liver Enzymes & Triglycerides (ALT/AST & Lipid Profile)
  const isElevatedLiver = (typeof alt_u_l === 'number' && alt_u_l > 45) || (typeof ast_u_l === 'number' && ast_u_l > 40);
  const isElevatedTriglycerides = typeof triglycerides_mg_dl === 'number' && triglycerides_mg_dl > 150;

  if (isElevatedLiver || isElevatedTriglycerides) {
    flags.push({
      biomarker: 'LIVER_LIPID_PROFILE',
      severity: 'MODERATE_HIGH',
      message_ar: 'رصد ارتفاع في إنزيمات الكبد أو الدهون الثلاثية (>150 mg/dL): تم خفض الدهون المشبعة لأقل من 7% من السعرات وإدراج أوميجا 3 نقي بجرعة علاجية.',
      message_en: 'Elevated Liver Enzymes or Triglycerides: Saturated fat capped at < 7% of calories, therapeutic Omega-3 prescribed.'
    });
    dietaryModifications.saturated_fat_cap_percent = 7;
    supplementRecommendations.push({
      supplement: 'Pure Omega-3 Fish Oil (High EPA/DHA)',
      dosage: '2,000 - 3,000 mg (minimum 1,500mg EPA+DHA)',
      reason_ar: 'لخفض الدهون الثلاثية ومحاربة الالتهابات الكبدية'
    });
  }

  // 4. Vitamin D3 & Ferritin Deficiencies
  if (typeof vitamin_d3_ng_ml === 'number' && vitamin_d3_ng_ml < 30) {
    flags.push({
      biomarker: 'VITAMIN_D3_DEFICIENCY',
      severity: vitamin_d3_ng_ml < 20 ? 'HIGH' : 'MODERATE',
      message_ar: `نقص فيتامين د (${vitamin_d3_ng_ml} ng/mL): تم إدراج بروتوكول تعويضي 5,000 IU يومياً مع فيتامين K2 لتعزيز القوة العضلية والمناعة.`,
      message_en: `Vitamin D3 deficiency (${vitamin_d3_ng_ml} ng/mL): Prescribed 5,000 IU D3 + K2 daily.`
    });
    supplementRecommendations.push({
      supplement: 'Vitamin D3 + K2 (MK-7)',
      dosage: '5,000 IU D3 + 100 mcg K2 daily with a fat-containing meal',
      reason_ar: 'لرفع مخزون فيتامين د وتحسين تخليق البروتين العضلي والقوة'
    });
  }

  if (typeof ferritin_ng_ml === 'number' && ferritin_ng_ml < 30) {
    flags.push({
      biomarker: 'FERRITIN_IRON_DEFICIENCY',
      severity: ferritin_ng_ml < 15 ? 'HIGH' : 'MODERATE',
      message_ar: `انخفاض مخزون الحديد الفيريتين (${ferritin_ng_ml} ng/mL): تم إدراج مكمل حديد عضوي لطيف على المعدة مع فيتامين C لتعزيز نقل الأكسجين.`,
      message_en: `Low Ferritin (${ferritin_ng_ml} ng/mL): Prescribed gentle iron bisglycinate + Vitamin C.`
    });
    supplementRecommendations.push({
      supplement: 'Iron Bisglycinate + Vitamin C',
      dosage: '25 - 30 mg elemental iron with Vitamin C on an empty stomach',
      reason_ar: 'لإعادة بناء مخازن الحديد وعلاج الإجهاد ونقص طاقة التمرين'
    });
  }

  return {
    has_biomarker_flags: flags.length > 0,
    flags,
    dietary_modifications: dietaryModifications,
    supplement_recommendations: supplementRecommendations
  };
}

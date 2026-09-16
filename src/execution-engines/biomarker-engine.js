/**
 * Clinical Biomarker & Bloodwork Analyzer Engine (محرك تحليل الفحوصات الطبية والمؤشرات الحيوية)
 *
 * Scans bloodwork and auto-adjusts macro targets, protein caps, and supplements:
 *   - HbA1c / Fasting Glucose: Glucose homeostasis & fiber targets (>= 35g).
 *   - Creatinine / eGFR: Renal safety guardrail (protein cap 1.0-1.1 g/kg, withhold creatine).
 *   - ALT/AST / Triglycerides: Hepatic & lipid safety (saturated fat < 7%, Omega-3 injection).
 *   - Vitamin D3 / Ferritin: Micronutrient repletion protocols.
 */

export function analyzeBloodworkBiomarkers(rawInput = {}) {
  const normalized = { ...rawInput };

  // Flexible key resolution
  const body_weight_kg = Number(normalized.body_weight_kg ?? normalized.weight_kg ?? normalized.weight ?? 75);
  const gender = String(normalized.gender ?? normalized.sex ?? 'MALE').toUpperCase();
  const isMale = gender === 'MALE';

  const hba1c_percent = normalized.hba1c_percent !== undefined ? Number(normalized.hba1c_percent) : (normalized.hba1c !== undefined ? Number(normalized.hba1c) : null);
  const fasting_glucose_mg_dl = normalized.fasting_glucose_mg_dl !== undefined ? Number(normalized.fasting_glucose_mg_dl) : (normalized.fasting_glucose !== undefined ? Number(normalized.fasting_glucose) : null);
  const creatinine_mg_dl = normalized.creatinine_mg_dl !== undefined ? Number(normalized.creatinine_mg_dl) : (normalized.creatinine !== undefined ? Number(normalized.creatinine) : null);
  const egfr_ml_min = normalized.egfr_ml_min !== undefined ? Number(normalized.egfr_ml_min) : (normalized.egfr !== undefined ? Number(normalized.egfr) : null);
  const alt_u_l = normalized.alt_u_l !== undefined ? Number(normalized.alt_u_l) : (normalized.alt !== undefined ? Number(normalized.alt) : null);
  const ast_u_l = normalized.ast_u_l !== undefined ? Number(normalized.ast_u_l) : (normalized.ast !== undefined ? Number(normalized.ast) : null);
  const triglycerides_mg_dl = normalized.triglycerides_mg_dl !== undefined ? Number(normalized.triglycerides_mg_dl) : (normalized.triglycerides !== undefined ? Number(normalized.triglycerides) : null);
  const uric_acid_mg_dl = normalized.uric_acid_mg_dl !== undefined ? Number(normalized.uric_acid_mg_dl) : (normalized.uric_acid !== undefined ? Number(normalized.uric_acid) : null);
  const total_cholesterol_mg_dl = normalized.total_cholesterol_mg_dl !== undefined ? Number(normalized.total_cholesterol_mg_dl) : (normalized.total_cholesterol !== undefined ? Number(normalized.total_cholesterol) : null);
  const ldl_mg_dl = normalized.ldl_mg_dl !== undefined ? Number(normalized.ldl_mg_dl) : (normalized.ldl !== undefined ? Number(normalized.ldl) : null);
  const vitamin_d3_ng_ml = normalized.vitamin_d3_ng_ml !== undefined ? Number(normalized.vitamin_d3_ng_ml) : (normalized.vitamin_d !== undefined ? Number(normalized.vitamin_d) : null);
  const ferritin_ng_ml = normalized.ferritin_ng_ml !== undefined ? Number(normalized.ferritin_ng_ml) : (normalized.ferritin !== undefined ? Number(normalized.ferritin) : null);

  const flags = [];
  const dietaryModifications = {
    protein_cap_g_per_kg: null,
    min_fiber_g: 28,
    saturated_fat_cap_percent: 10,
    withhold_creatine: false,
    complex_carbs_only: false,
    purine_restriction: false,
    daily_water_target_liters: 3.5,
    sodium_limit_mg: null
  };
  const supplementRecommendations = [];
  const wholeFoodInterventions = [];
  const medicalReferrals = [];

  // 1. Glycemic / Insulin Control (HbA1c & Fasting Glucose)
  const isElevatedHbA1c = typeof hba1c_percent === 'number' && Number.isFinite(hba1c_percent) && hba1c_percent >= 5.7;
  const isElevatedGlucose = typeof fasting_glucose_mg_dl === 'number' && Number.isFinite(fasting_glucose_mg_dl) && fasting_glucose_mg_dl >= 100;

  if (isElevatedHbA1c || isElevatedGlucose) {
    const isDiabetic = (hba1c_percent !== null && hba1c_percent >= 6.5) || (fasting_glucose_mg_dl !== null && fasting_glucose_mg_dl >= 126);
    flags.push({
      biomarker: 'GLUCOSE_METABOLISM',
      severity: isDiabetic ? 'HIGH' : 'MODERATE',
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
    wholeFoodInterventions.push({
      food_title_ar: 'بروتوكول النشا المقاوم والألياف الذائبة (Resistant Starch)',
      rationale_ar: 'إدراج الشوفان الكامل، بذور الشيا، والبطاطا المبردة وتتبيل السلطة بخل التفاح الطبيعي.'
    });
    if (isDiabetic) {
      medicalReferrals.push('مستوى السكر في نطاق السكري السريري؛ يلزم فحص طبي متخصص لدى طبيب الغدد والسكر.');
    }
  }

  // 2. Renal Function Guardrail (Creatinine & eGFR)
  const isElevatedCreatinine = typeof creatinine_mg_dl === 'number' && Number.isFinite(creatinine_mg_dl) && (isMale ? creatinine_mg_dl > 1.3 : creatinine_mg_dl > 1.1);
  const isReducedEGFR = typeof egfr_ml_min === 'number' && Number.isFinite(egfr_ml_min) && egfr_ml_min < 60;

  if (isReducedEGFR || isElevatedCreatinine) {
    const isCritical = (creatinine_mg_dl !== null && creatinine_mg_dl > 1.8) || (egfr_ml_min !== null && egfr_ml_min < 45);
    flags.push({
      biomarker: 'RENAL_FUNCTION',
      severity: isCritical ? 'CRITICAL' : 'HIGH_CRITICAL',
      message_ar: 'تفعيل السد الكلوي الصارم (eGFR < 60 أو ارتفاع الكرياتينين): تم تقييد البروتين بحد أقصى 1.0 - 1.1 g/kg وحظر مكمل الكرياتين مؤقتاً لحماية الكلى.',
      message_en: 'Renal Guardrail Triggered (eGFR < 60): Protein capped at 1.0-1.1 g/kg and Creatine supplementation withheld.'
    });
    dietaryModifications.protein_cap_g_per_kg = isCritical ? 0.9 : 1.1;
    dietaryModifications.withhold_creatine = true;
    dietaryModifications.daily_water_target_liters = 4.0;
    if (isCritical) {
      medicalReferrals.push('تراجع ملحوظ في كفاءة وظائف الكلى؛ يلزم التنسيق الفوري مع طبيب أمراض كلى.');
    }
  }

  // 3. Uric Acid & Hyperuricemia Guardrail (Gout Shield)
  const isElevatedUricAcid = typeof uric_acid_mg_dl === 'number' && Number.isFinite(uric_acid_mg_dl) && (isMale ? uric_acid_mg_dl > 7.0 : uric_acid_mg_dl > 6.0);
  if (isElevatedUricAcid) {
    flags.push({
      biomarker: 'URIC_ACID_HYPERURICEMIA',
      severity: uric_acid_mg_dl > 8.0 ? 'HIGH' : 'MODERATE',
      message_ar: `ارتفاع حمض اليوريك (${uric_acid_mg_dl} mg/dL): تم تفعيل حماية النقرس بتقنين اللحوم الحمراء والأعضاء، ورفع مستهدف الماء اليومي إلى 4.0 لتر، ومنع الفركتوز المركز.`,
      message_en: `Elevated Uric Acid (${uric_acid_mg_dl} mg/dL): Purine restriction enforced, red meat capped, and hydration increased to 4.0L/day.`
    });
    dietaryModifications.purine_restriction = true;
    dietaryModifications.daily_water_target_liters = Math.max(dietaryModifications.daily_water_target_liters, 4.0);
    supplementRecommendations.push({
      supplement: 'Tart Cherry Extract + Vitamin C (500mg)',
      dosage: '500 - 1000 mg Tart Cherry daily',
      reason_ar: 'لتسريع إخراج حمض اليوريك عبر البول وتقليل التهاب المفاصل'
    });
    wholeFoodInterventions.push({
      food_title_ar: 'استبدال اللحوم الحمراء بالدواجن البيضاء، الأسماك البيضاء، بياض البيض، والألبان خالية الدسم',
      rationale_ar: 'لتوفير احتياج البروتين الكامل دون تحميل الجسم بيورينات زائدة تحفز نوبات النقرس.'
    });
  }

  // 4. Liver Enzymes & Lipid Profile (ALT/AST, Triglycerides & Cholesterol)
  const isElevatedLiver = (typeof alt_u_l === 'number' && Number.isFinite(alt_u_l) && alt_u_l > 45) || (typeof ast_u_l === 'number' && Number.isFinite(ast_u_l) && ast_u_l > 40);
  const isElevatedTriglycerides = typeof triglycerides_mg_dl === 'number' && Number.isFinite(triglycerides_mg_dl) && triglycerides_mg_dl > 150;
  const isElevatedCholesterol = (typeof total_cholesterol_mg_dl === 'number' && Number.isFinite(total_cholesterol_mg_dl) && total_cholesterol_mg_dl > 200) || (typeof ldl_mg_dl === 'number' && Number.isFinite(ldl_mg_dl) && ldl_mg_dl > 130);

  if (isElevatedLiver || isElevatedTriglycerides || isElevatedCholesterol) {
    flags.push({
      biomarker: 'LIVER_LIPID_PROFILE',
      severity: (triglycerides_mg_dl > 250 || ldl_mg_dl > 160) ? 'HIGH' : 'MODERATE_HIGH',
      message_ar: 'رصد ارتفاع في إنزيمات الكبد أو الدهون الثلاثية (>150 mg/dL) أو الكوليسترول: تم خفض الدهون المشبعة لأقل من 7% من السعرات وإدراج أوميجا 3 نقي بجرعة علاجية.',
      message_en: 'Elevated Liver Enzymes or Lipids: Saturated fat capped at < 7% of calories, therapeutic Omega-3 prescribed.'
    });
    dietaryModifications.saturated_fat_cap_percent = (ldl_mg_dl && ldl_mg_dl > 160) ? 6 : 7;
    supplementRecommendations.push({
      supplement: 'Pure Omega-3 Fish Oil (High EPA/DHA)',
      dosage: '2,000 - 3,000 mg (minimum 1,500mg EPA+DHA)',
      reason_ar: 'لخفض الدهون الثلاثية ومحاربة الالتهابات الكبدية'
    });
    wholeFoodInterventions.push({
      food_title_ar: 'بروتوكول الدهون غير المشبعة ومضادات الأكسدة',
      rationale_ar: 'إدراج حصتين أسبوعياً من السلمون، استخدام زيت الزيتون البكر الممتاز، وتناول 20 جم عين جمل يومياً.'
    });
  }

  // 5. Vitamin D3 & Ferritin Deficiencies
  if (typeof vitamin_d3_ng_ml === 'number' && Number.isFinite(vitamin_d3_ng_ml) && vitamin_d3_ng_ml < 30) {
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

  if (typeof ferritin_ng_ml === 'number' && Number.isFinite(ferritin_ng_ml) && ferritin_ng_ml < 30) {
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
    supplement_recommendations: supplementRecommendations,
    whole_food_interventions: wholeFoodInterventions,
    medical_referrals: medicalReferrals,
    clinical_action_ar: flags.length > 0
      ? `تم تفعيل حماية المؤشرات الحيوية لعدد ${flags.length} مؤشر مخبري، وتعديل الماكروز والمكملات إجبارياً وفق المعايير السريرية.`
      : 'كافة المؤشرات المخبرية ضمن النطاقات الفسيولوجية الطبيعية.'
  };
}

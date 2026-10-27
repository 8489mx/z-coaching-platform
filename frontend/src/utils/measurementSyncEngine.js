/**
 * Measurement Sync & Source of Truth Engine
 * Z Coaching Platform - Clinical & Biomechanical Operations (Tier 0 & Tier 1)
 *
 * Single Source of Truth for client measurements, check-in post-submission corrections,
 * authoritative BMI calculation, and cross-dashboard measurement synchronization.
 *
 * Invariants:
 * 1. Zero Emojis in any status, label, or output.
 * 2. Missing height or weight NEVER yields BMI 0 or bogus clinical labels ("Extreme thinness").
 * 3. Coach corrections to check-in measurements cascade authoritatively to weight history,
 *    active program client_profile, and calculator inputs with a full immutable audit trail.
 */

/**
 * Calculates BMI safely and returns clean Arabic classification.
 * Strictly refuses to compute BMI when weight or height is missing or non-positive.
 */
export function calculateBmiSafe(weightKg, heightCm) {
  const w = Number(weightKg);
  const h = Number(heightCm);

  if (!Number.isFinite(w) || w <= 20 || w > 350 || !Number.isFinite(h) || h <= 50 || h > 260) {
    return {
      is_valid: false,
      bmi: null,
      classification_ar: 'غير متوفر (يتطلب تسجيل الطول والوزن بدقة)',
      status_code: 'INCOMPLETE_DATA'
    };
  }

  const heightMeters = h / 100;
  const rawBmi = w / (heightMeters * heightMeters);
  const roundedBmi = Math.round(rawBmi * 10) / 10;

  let classificationAr = 'وزن طبيعي متزن';
  let statusCode = 'NORMAL';

  if (roundedBmi < 18.5) {
    classificationAr = 'نحافة أقل من المعدل الطبيعي';
    statusCode = 'UNDERWEIGHT';
  } else if (roundedBmi < 25.0) {
    classificationAr = 'وزن طبيعي متزن';
    statusCode = 'NORMAL';
  } else if (roundedBmi < 30.0) {
    classificationAr = 'زيادة وزن معتدلة (Overweight)';
    statusCode = 'OVERWEIGHT';
  } else if (roundedBmi < 35.0) {
    classificationAr = 'سمنة من الدرجة الأولى (Class I Obesity)';
    statusCode = 'OBESE_CLASS_1';
  } else if (roundedBmi < 40.0) {
    classificationAr = 'سمنة من الدرجة الثانية (Class II Obesity)';
    statusCode = 'OBESE_CLASS_2';
  } else {
    classificationAr = 'سمنة مفرطة من الدرجة الثالثة (Class III Obesity)';
    statusCode = 'OBESE_CLASS_3';
  }

  return {
    is_valid: true,
    bmi: roundedBmi,
    classification_ar: classificationAr,
    status_code: statusCode,
    is_obese_cap_eligible: roundedBmi >= 30.0
  };
}

/**
 * Resolves authoritative measurements across multiple data sources:
 * Priority: Latest Check-in > Active Program Profile > Intake Form > User Record.
 */
export function resolveAuthoritativeMeasurements({ user = {}, intake = {}, checkin = null, program = {} } = {}) {
  const intakeAnswers = intake?.answers || {};
  const progData = typeof program?.program_data === 'string'
    ? JSON.parse(program.program_data)
    : (program?.program_data || {});
  const clientProfile = progData.client_profile || {};

  // 1. Resolve Height (Intake > Program Profile > User)
  const rawHeight = intakeAnswers.height_cm || intakeAnswers.height || clientProfile.height || user.height_cm || user.height;
  const parsedHeight = Number(rawHeight);
  const heightCm = Number.isFinite(parsedHeight) && parsedHeight > 50 && parsedHeight <= 260 ? Math.round(parsedHeight) : null;

  // 2. Resolve Age (Intake > Program Profile > User)
  const rawAge = intakeAnswers.age || clientProfile.age || user.age;
  const parsedAge = Number(rawAge);
  const age = Number.isFinite(parsedAge) && parsedAge >= 10 && parsedAge <= 110 ? Math.round(parsedAge) : null;

  // 3. Resolve Gender (User > Intake > Program Profile)
  const rawGender = String(user.gender || intakeAnswers.gender || clientProfile.gender || 'MALE').toUpperCase();
  const gender = rawGender.includes('FEMALE') ? 'FEMALE' : 'MALE';

  // 4. Resolve Starting Weight
  const rawStartWeight = intakeAnswers.weight_kg || intakeAnswers.weight || clientProfile.starting_weight || user.start_weight;
  const parsedStartWeight = Number(rawStartWeight);
  const startingWeightKg = Number.isFinite(parsedStartWeight) && parsedStartWeight > 20 ? Math.round(parsedStartWeight * 10) / 10 : null;

  // 5. Resolve Current Weight & Measurement Source
  let currentWeightKg = null;
  let measurementSource = { type: 'NONE', label_ar: 'لا توجد قياسات مسجلة' };
  let isMeasurementCorrected = false;
  let correctionAudit = null;

  if (checkin && Number.isFinite(Number(checkin.average_weight_kg)) && Number(checkin.average_weight_kg) > 20) {
    currentWeightKg = Math.round(Number(checkin.average_weight_kg) * 10) / 10;
    const analysisObj = typeof checkin.analysis_output === 'string'
      ? JSON.parse(checkin.analysis_output)
      : (checkin.analysis_output || {});

    isMeasurementCorrected = Boolean(analysisObj.is_measurement_corrected);
    const corrections = Array.isArray(analysisObj.measurement_corrections) ? analysisObj.measurement_corrections : [];
    correctionAudit = corrections.length > 0 ? corrections[corrections.length - 1] : null;

    measurementSource = {
      type: 'CHECKIN',
      week_number: checkin.week_number,
      checkin_id: checkin.id,
      date: checkin.createdAt || null,
      is_corrected: isMeasurementCorrected,
      correction_audit: correctionAudit,
      label_ar: `آخر متابعة (الأسبوع ${checkin.week_number}) — ${currentWeightKg} كجم${isMeasurementCorrected ? ' (مصحح بواسطة الكوتش)' : ''}`
    };
  } else if (clientProfile.weight && Number.isFinite(Number(clientProfile.weight))) {
    currentWeightKg = Math.round(Number(clientProfile.weight) * 10) / 10;
    measurementSource = {
      type: 'PROGRAM_PROFILE',
      label_ar: `ملف الخطة المعتمدة — ${currentWeightKg} كجم`
    };
  } else if (startingWeightKg !== null) {
    currentWeightKg = startingWeightKg;
    measurementSource = {
      type: 'INTAKE',
      date: intake.createdAt || null,
      label_ar: `استمارة المتدرب الأولية — ${currentWeightKg} كجم`
    };
  }

  // 6. Safe BMI Calculation
  const bmiEvaluation = calculateBmiSafe(currentWeightKg, heightCm);

  // 7. Weight Deltas
  const totalChangeKg = (currentWeightKg !== null && startingWeightKg !== null)
    ? Math.round((currentWeightKg - startingWeightKg) * 10) / 10
    : null;

  return {
    is_complete: Boolean(currentWeightKg && heightCm && age),
    gender,
    age,
    height_cm: heightCm,
    starting_weight_kg: startingWeightKg,
    current_weight_kg: currentWeightKg,
    total_change_kg: totalChangeKg,
    measurement_source: measurementSource,
    is_measurement_corrected: isMeasurementCorrected,
    correction_audit: correctionAudit,
    bmi_evaluation: bmiEvaluation
  };
}

/**
 * Builds an immutable measurement correction audit record.
 */
export function buildMeasurementCorrectionAudit({
  previousWeightKg,
  correctedWeightKg,
  previousWaistCm = null,
  correctedWaistCm = null,
  previousHipCm = null,
  correctedHipCm = null,
  reason = '',
  coachId = 'COACH'
}) {
  return {
    previous_weight_kg: Number(previousWeightKg) || null,
    corrected_weight_kg: Number(correctedWeightKg) || null,
    previous_waist_cm: Number(previousWaistCm) || null,
    corrected_waist_cm: Number(correctedWaistCm) || null,
    previous_hip_cm: Number(previousHipCm) || null,
    corrected_hip_cm: Number(correctedHipCm) || null,
    reason: String(reason || 'تصحيح قراءة القياس بواسطة الكوتش').trim(),
    corrected_by: coachId,
    corrected_at: new Date().toISOString()
  };
}

/**
 * Formats a clean Arabic badge text for the measurement source in UI and Modals.
 */
export function formatMeasurementBadge(source = {}) {
  if (!source || source.type === 'NONE') {
    return {
      text: 'بيانات القياس غير مكتملة',
      color: '#64748B',
      background: '#F1F5F9',
      border: '#E2E8F0'
    };
  }

  if (source.is_corrected) {
    return {
      text: source.label_ar || 'تم تصحيح القياس بواسطة الكوتش',
      color: '#673DE6',
      background: '#F4F0FD',
      border: '#DDD6FE'
    };
  }

  if (source.type === 'CHECKIN') {
    return {
      text: source.label_ar || 'آخر متابعة أسبوعية',
      color: '#0284C7',
      background: '#F0F9FF',
      border: '#BAE6FD'
    };
  }

  return {
    text: source.label_ar || 'استمارة المتدرب',
    color: '#0F766E',
    background: '#F0FDFA',
    border: '#CCFBF1'
  };
}

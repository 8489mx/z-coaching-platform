/**
 * Subscription Flexibility, Track Decoupling & Injury Recovery Engine
 *
 * 1. Subscription Freeze & Resume:
 *    - Max 21 days freeze per 16-week cycle.
 *    - Shifting of subscription end date and check-in schedules.
 *    - WhatsApp notifications for freeze/resume.
 * 2. Track Decoupling:
 *    - FULL_PROGRAM | NUTRITION_ONLY | WORKOUT_ONLY.
 *    - Sedentary calorie adjustment for NUTRITION_ONLY.
 * 3. Injury Shift Protocol (Muscle Guard):
 *    - Maintenance calories for tissue repair.
 *    - High protein (2.0-2.2 g/kg) to prevent muscle atrophy.
 *    - Anti-inflammatory supplements (Omega-3 3000mg, Collagen + Vit C).
 *    - Body part isolation & rehab protocol.
 */

export const MAX_FREEZE_DAYS_PER_CYCLE = 21;

export const SUBSCRIPTION_TRACKS = {
  FULL_PROGRAM: 'FULL_PROGRAM',
  NUTRITION_ONLY: 'NUTRITION_ONLY',
  WORKOUT_ONLY: 'WORKOUT_ONLY'
};

/**
 * Freezes client subscription and shifts upcoming check-ins forward.
 */
export function freezeSubscription({
  client_id = '1',
  client_name = 'سارة المنصوري',
  phone_number = '01011111110',
  freeze_days = 7,
  reason = 'سفر وظروف عمل',
  current_end_date = new Date('2026-12-01'),
  scheduled_checkins = [],
  total_frozen_days_used = 0
}) {
  const remainingFreezeAllowance = MAX_FREEZE_DAYS_PER_CYCLE - total_frozen_days_used;

  if (freeze_days > remainingFreezeAllowance) {
    throw new Error(`تجاوز الحد الأقصى للتجميد: الأيام المتبقية المسموح بها هي ${remainingFreezeAllowance} يوماً فقط من أصل 21 يوماً.`);
  }

  if (freeze_days <= 0) {
    throw new Error('عدد أيام التجميد يجب أن يكون أكبر من صفر.');
  }

  const startDateObj = new Date();
  const autoResumeDate = new Date(startDateObj);
  autoResumeDate.setDate(startDateObj.getDate() + freeze_days);

  const currentEndDateObj = new Date(current_end_date);
  const newEndDate = new Date(currentEndDateObj);
  newEndDate.setDate(currentEndDateObj.getDate() + freeze_days);

  // Shift all future checkins forward by freeze_days
  const updatedCheckins = scheduled_checkins.map(chk => {
    const dueDateObj = new Date(chk.due_date);
    if (dueDateObj >= startDateObj) {
      const shifted = new Date(dueDateObj);
      shifted.setDate(dueDateObj.getDate() + freeze_days);
      return { ...chk, due_date: shifted.toISOString().split('T')[0], is_shifted_by_freeze: true };
    }
    return chk;
  });

  const messageAr = `تم تجميد اشتراكك بنجاح لمدة ${freeze_days} أيام يا ${client_name}! ⏸️\n\nالسبب: ${reason}\nتاريخ الاستئناف التلقائي: ${autoResumeDate.toISOString().split('T')[0]}\nالموعد النهائي الجديد لاشتراكك: ${newEndDate.toISOString().split('T')[0]}\n\nتم ترحيل مواعيد متابعاتك تلقائياً بنفس المدة. استمتع بإجازتك ونشوفك على خير قريباً!`;

  const cleanPhone = String(phone_number || '').replace(/[^0-9]/g, '');
  const normalizedPhone = cleanPhone.startsWith('20')
    ? cleanPhone
    : (cleanPhone.startsWith('0') ? '20' + cleanPhone.substring(1) : (cleanPhone ? '20' + cleanPhone : '201011111110'));

  return {
    success: true,
    client_id,
    new_status: 'FROZEN',
    freeze_record: {
      freeze_start_date: startDateObj.toISOString().split('T')[0],
      auto_resume_date: autoResumeDate.toISOString().split('T')[0],
      freeze_days,
      reason,
      total_frozen_days_accumulated: total_frozen_days_used + freeze_days,
      remaining_freeze_days: remainingFreezeAllowance - freeze_days
    },
    updated_end_date: newEndDate.toISOString().split('T')[0],
    updated_checkins: updatedCheckins,
    whatsapp_message_ar: messageAr,
    whatsapp_dispatch_url: `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(messageAr)}`
  };
}

/**
 * Resumes client subscription early and finalizes subscription dates.
 */
export function resumeSubscription({
  client_id = '1',
  client_name = 'سارة المنصوري',
  phone_number = '01011111110',
  freeze_start_date = new Date(),
  actual_resume_date = new Date(),
  current_end_date = new Date('2026-12-08'),
  planned_freeze_days = 14,
  scheduled_checkins = []
}) {
  const startObj = new Date(freeze_start_date);
  const resumeObj = new Date(actual_resume_date);
  const diffTime = Math.abs(resumeObj - startObj);
  const actualDaysFrozen = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const unusedDays = Math.max(0, planned_freeze_days - actualDaysFrozen);

  // Recalculate end date by pulling back unused days
  const endObj = new Date(current_end_date);
  endObj.setDate(endObj.getDate() - unusedDays);

  const messageAr = `حمد الله على السلامة يا ${client_name}! تم استئناف اشتراكك بنجاح. 🚀\n\nالأيام المستخدمة في التجميد: ${actualDaysFrozen} يوماً.\nتاريخ انتهاء الاشتراك المعتمد: ${endObj.toISOString().split('T')[0]}.\n\nتطبيقك جاهز بالخطة الكاملة، ومستنيين أول تمرين ووجبة تسجلهم اليوم!`;

  const cleanPhone = String(phone_number || '').replace(/[^0-9]/g, '');
  const normalizedPhone = cleanPhone.startsWith('20')
    ? cleanPhone
    : (cleanPhone.startsWith('0') ? '20' + cleanPhone.substring(1) : (cleanPhone ? '20' + cleanPhone : '201011111110'));

  return {
    success: true,
    client_id,
    new_status: 'ACTIVE',
    actual_days_frozen: actualDaysFrozen,
    unused_freeze_days_credited_back: unusedDays,
    final_subscription_end_date: endObj.toISOString().split('T')[0],
    whatsapp_message_ar: messageAr,
    whatsapp_dispatch_url: `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(messageAr)}`
  };
}

/**
 * Decouples tracks (FULL_PROGRAM, NUTRITION_ONLY, WORKOUT_ONLY).
 */
export function setSubscriptionTrack({
  client_id = '1',
  track_type = SUBSCRIPTION_TRACKS.FULL_PROGRAM,
  body_weight_kg = 75,
  bmr_kcal = 1600,
  current_daily_calories = 2000
}) {
  const track = String(track_type).toUpperCase();
  let adjustedCalories = current_daily_calories;
  let rationaleAr = '';

  if (track === SUBSCRIPTION_TRACKS.NUTRITION_ONLY) {
    // Sedentary activity multiplier (1.2 * BMR) to prevent fat gain during training halt
    adjustedCalories = Math.round(bmr_kcal * 1.25);
    rationaleAr = 'تم ضبط السعرات على معامل النشاط المكتبي (1.25 × BMR) لمنع تراكم الدهون أثناء توقف التمرين.';
  } else if (track === SUBSCRIPTION_TRACKS.WORKOUT_ONLY) {
    rationaleAr = 'مسار التدريب فقط: التركيز على تسجيل الأوزان والزيادة التدريجية في الأحمال مع إخفاء جدول التغذية.';
  } else {
    rationaleAr = 'المسار المتكامل: تغذية وتدريب ومتابعة أداء شاملة.';
  }

  return {
    client_id,
    subscription_track: track,
    adjusted_calories: adjustedCalories,
    is_workout_active: track !== SUBSCRIPTION_TRACKS.NUTRITION_ONLY,
    is_nutrition_active: track !== SUBSCRIPTION_TRACKS.WORKOUT_ONLY,
    rationale_ar: rationaleAr
  };
}

/**
 * Applies Injury Shift Protocol & Muscle Guard (Anti-Catabolic Healing Protocol).
 */
export function applyInjuryShiftProtocol({
  client_id = '1',
  client_name = 'سارة',
  injury_type = 'KNEE_SPRAIN', // 'KNEE' | 'LOWER_BACK' | 'SHOULDER'
  affected_joint = 'الركبة اليمنى',
  body_weight_kg = 75,
  base_calories = 1750,
  exercises = []
}) {
  // 1. Shift calories to Maintenance (no deep deficit during tissue healing)
  const maintenanceCalories = base_calories + 350;

  // 2. High anti-catabolic protein target (2.1 g/kg)
  const targetProteinG = Math.round(body_weight_kg * 2.1);

  // 3. Clinical Anti-inflammatory Supplement Protocol
  const antiInflammatoryProtocol = [
    { supplement: 'Pure Omega-3 (High EPA/DHA)', dosage: '3,000 mg daily', reason: 'لخفض السيتوكينات الالتهابية وتسريع الاستشفاء' },
    { supplement: 'Hydrolyzed Collagen Peptides + Vitamin C', dosage: '15g Collagen + 500mg Vit C', reason: 'لإعادة بناء الأوتار والأربطة والغضاريف المتضررة' },
    { supplement: 'Curcumin / Turmeric Extract (with Piperine)', dosage: '500 mg daily', reason: 'مضاد أكسدة طبيعي لتخفيف آلام والتهابات المفصل' }
  ];

  // 4. Adapt training exercises
  const adaptedExercises = exercises.map(ex => {
    const exName = String(ex.name || '').toUpperCase();
    if (injury_type.includes('KNEE') && (exName.includes('SQUAT') || exName.includes('LUNGE') || exName.includes('LEG EXTENSION'))) {
      return {
        ...ex,
        name: `${ex.name} (مُعطل مؤقتاً لحماية ${affected_joint} - استبدال بتأهيل حركي)`,
        is_paused: true,
        rehab_alternative_ar: 'تمرين Glute Bridges وثبات Isometric للتقوية بدون ضغط على الركبة'
      };
    }
    return ex;
  });

  return {
    client_id,
    client_name,
    injury_type,
    affected_joint,
    protocol_name: 'بروتوكول التحول السريري وحماية العضلات (Injury Shift & Muscle Guard)',
    nutrition_adjustments: {
      target_calories: maintenanceCalories,
      target_protein_g: targetProteinG,
      protein_ratio_g_per_kg: 2.1,
      rationale_ar: 'تثبيت السعرات عند حد الصيانة لمنع الإجهاد وسرعة التئام الأنسجة، مع رفع البروتين إلى 2.1 g/kg لحماية الكتلة العضلية من الهدم.'
    },
    supplement_protocol: antiInflammatoryProtocol,
    training_isolation: {
      adapted_exercises: adaptedExercises,
      focus_ar: `عزل وتجنيب ${affected_joint} من الأحمال الضاغطة والتركيز على الأجزاء السليمة والتأهيل الحركي.`
    }
  };
}

export const RE_ENTRY_TRAINING_STATUS = {
  COMPLETE_SEDENTARY_REST: 'COMPLETE_SEDENTARY_REST',
  TRAINED_INDEPENDENTLY: 'TRAINED_INDEPENDENTLY',
  LIGHT_HOTEL_BODYWEIGHT: 'LIGHT_HOTEL_BODYWEIGHT'
};

/**
 * Evaluates Re-Entry Protocol after Freeze or Injury Recovery
 */
export function evaluateReEntryProtocol({
  client_id = '1',
  client_name = 'سارة المنصوري',
  phone_number = '01011111110',
  pre_freeze_weight_kg = 75.0,
  current_weight_kg = 76.8,
  pre_freeze_waist_cm = 82.0,
  current_waist_cm = 83.5,
  training_status_during_freeze = RE_ENTRY_TRAINING_STATUS.COMPLETE_SEDENTARY_REST,
  is_injury_recovery = false,
  joint_pain_score = 0,
  base_calories = 1800,
  base_protein_g = 150
}) {
  const weightDeltaKg = Math.round((current_weight_kg - pre_freeze_weight_kg) * 10) / 10;
  const waistDeltaCm = Math.round((current_waist_cm - pre_freeze_waist_cm) * 10) / 10;

  // 1. Workout Path Decision
  let workoutDecision = {};
  if (training_status_during_freeze === RE_ENTRY_TRAINING_STATUS.TRAINED_INDEPENDENTLY && !is_injury_recovery && joint_pain_score === 0) {
    workoutDecision = {
      path: 'IMMEDIATE_FULL_LOAD',
      ramp_up_needed: false,
      volume_reduction_percent: 0,
      target_rir: '1-2 RIR',
      tempo: '2-0-1',
      rationale_ar: 'المتدرب حافظ على الحمل العضلي والكفاءة العصبية أثناء التوقف؛ العودة فوراً لكامل الشدة والأوزان دون خفض للحجم.'
    };
  } else if (is_injury_recovery || joint_pain_score > 0) {
    workoutDecision = {
      path: 'INJURY_GRADUAL_TESTING',
      ramp_up_needed: true,
      volume_reduction_percent: 40,
      target_rir: '3-4 RIR',
      tempo: '3-1-2',
      free_weights_banned_week_1: true,
      rationale_ar: 'العودة من إصابة؛ تفعيل اختبار التحميل التدرجي للأجهزة المعزولة وحظر الأوزان الحرة للأسبوع الأول.'
    };
  } else {
    // COMPLETE_SEDENTARY_REST or LIGHT_HOTEL_BODYWEIGHT
    workoutDecision = {
      path: 'NEURAL_RAMP_UP_WEEK',
      ramp_up_needed: true,
      volume_reduction_percent: 35,
      target_rir: '3-4 RIR',
      tempo: '3-1-2',
      rationale_ar: 'تفعيل أسبوع التهيئة العصبية (Ramp-Up Week): خفض الحجم 35% وضبط الشدة على 3-4 RIR وسرعة 3-1-2 لحماية الأوتار والمفاصل ومنع الـ DOMS الحاد.'
    };
  }

  // 2. Nutrition Path Decision
  let nutritionDecision = {};
  if (weightDeltaKg > 1.5) {
    nutritionDecision = {
      phase: 'MAINTENANCE_FLUID_RESET',
      target_calories: base_calories + 300, // Shift to maintenance
      target_protein_g: base_protein_g,
      duration_days: 7,
      rationale_ar: `زيادة طارئة في الوزن (+${weightDeltaKg} كجم احتباس سوائل/كارب)؛ وضع المتدرب على سعرات الصيانة لمدة 5-7 أيام مع رفع الألياف لتهدئة حساسية الأنسولين وتصريف السوائل قبل العودة للعجز.`
    };
  } else if (weightDeltaKg < -1.0) {
    nutritionDecision = {
      phase: 'GLYCOGEN_RELOAD',
      target_calories: base_calories + 250,
      target_protein_g: Math.round(base_protein_g * 1.1),
      duration_days: 5,
      rationale_ar: 'نزول في الوزن؛ رفع الكارب والبروتين لإعادة شحن مخازن الجليكوجين العضلي واستعادة طاقة التمرين.'
    };
  } else {
    nutritionDecision = {
      phase: 'RESUME_PRIMARY_DEFICIT',
      target_calories: base_calories,
      target_protein_g: base_protein_g,
      duration_days: null,
      rationale_ar: 'استقرار الوزن والقياسات؛ استئناف الخطة الغذائية الأساسية بنجاح.'
    };
  }

  const welcomeBackScriptAr = `أهلاً بعودتك يا ${client_name}! جاهزين للرجوع بقوة واستكمال فورمتك. 🚀\n\n📋 خطة العودة للأسبوع الأول:\n🏋️‍♂️ التدريب: ${workoutDecision.rationale_ar}\n🥗 التغذية: ${nutritionDecision.rationale_ar}\n\nشيك على تطبيقك الآن هتلاقي خطة أسبوع العودة جاهزة ومبرمجة بدقة!`;

  const cleanPhone = String(phone_number || '').replace(/[^0-9]/g, '');
  const normalizedPhone = cleanPhone.startsWith('20')
    ? cleanPhone
    : (cleanPhone.startsWith('0') ? '20' + cleanPhone.substring(1) : (cleanPhone ? '20' + cleanPhone : '201011111110'));

  return {
    client_id,
    client_name,
    weight_comparison: {
      pre_freeze_kg: pre_freeze_weight_kg,
      current_kg: current_weight_kg,
      delta_kg: weightDeltaKg
    },
    waist_comparison: {
      pre_freeze_cm: pre_freeze_waist_cm,
      current_cm: current_waist_cm,
      delta_cm: waistDeltaCm
    },
    workout_protocol: workoutDecision,
    nutrition_protocol: nutritionDecision,
    welcome_back_script_ar: welcomeBackScriptAr,
    whatsapp_dispatch_url: `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(welcomeBackScriptAr)}`
  };
}

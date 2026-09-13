/**
 * Weekly Check-in & Dynamic Adjustment Engine (Z-Coaching Platform 2026)
 *
 * Automated Coach Decision Matrix with 1-Click WhatsApp & Plan Update:
 *
 * 1. Case 1 (EXCELLENT_PROGRESS): Weight loss >= 0.4kg or waist drop >= 0.5cm -> Maintain calories.
 * 2. Case 2 (LOW_ADHERENCE_WARNING): Weight plateau with adherence < 80% -> Warn client, lock deficit cut.
 * 3. Case 3 (TRUE_PLATEAU_TITRATION): Plateau for 2+ consecutive weeks with adherence >= 85% -> Titrate -120 kcal from carbs or +15 min cardio.
 * 4. Case 4 (FEMALE_PMS_BUFFER): PMS active / luteal phase -> Lock deficit cuts, reassure water retention.
 * 5. Case 5 (DELOAD_ACTIVATION): Consecutive performance drop or joint pain -> Trigger deload week.
 */

import { evaluateFemaleCycleBuffer } from './female-cycle-buffer-engine.js';
import { evaluateAutoDeloadRequirement } from './progressive-overload-engine.js';

export const CHECKIN_DECISION_CODES = {
  EXCELLENT_PROGRESS: 'EXCELLENT_PROGRESS',
  LOW_ADHERENCE_WARNING: 'LOW_ADHERENCE_WARNING',
  TRUE_PLATEAU_TITRATION: 'TRUE_PLATEAU_TITRATION',
  FEMALE_PMS_BUFFER: 'FEMALE_PMS_BUFFER',
  DELOAD_ACTIVATION: 'DELOAD_ACTIVATION',
  MAINTAIN_PLAN: 'MAINTAIN_PLAN',
  // Deep check-in v3: new decision codes
  FALSE_PLATEAU_DETECTED: 'FALSE_PLATEAU_DETECTED',
  OCCUPATIONAL_NEAT_LOCK: 'OCCUPATIONAL_NEAT_LOCK',
  TRAVEL_WEEK_PREVIEW: 'TRAVEL_WEEK_PREVIEW'
};

export function evaluateWeeklyCheckinAudit({
  clientProfile = {},
  previousWeekData = {},
  currentCheckin = {}
}) {
  const rawCurrentWeight = currentCheckin?.current_weight_kg;
  if (rawCurrentWeight === undefined || rawCurrentWeight === null || String(rawCurrentWeight).trim() === '') {
    throw new RangeError("الوزن الحالي مطلوب لإجراء المتابعة الأسبوعية.");
  }
  const currentWeight = Number(rawCurrentWeight);
  if (!Number.isFinite(currentWeight) || currentWeight <= 20 || currentWeight > 300) {
    throw new RangeError(`قيمة الوزن الحالي غير صالحة (${rawCurrentWeight} كجم). يجب إدخال وزن حقيقي موجب أكبر من 20 كجم وأقل من 300 كجم.`);
  }

  const rawPrevWeight = previousWeekData?.weight_kg;
  let previousWeight = currentWeight;
  if (rawPrevWeight !== undefined && rawPrevWeight !== null && String(rawPrevWeight).trim() !== '') {
    const parsedPrev = Number(rawPrevWeight);
    if (!Number.isFinite(parsedPrev) || parsedPrev <= 20 || parsedPrev > 300) {
      throw new RangeError(`قيمة الوزن السابق غير صالحة (${rawPrevWeight} كجم). يجب أن يكون رقماً موجباً أكبر من 20 كجم.`);
    }
    previousWeight = parsedPrev;
  }
  const weightDelta = Math.round((currentWeight - previousWeight) * 100) / 100;

  const currentWaist = Number(currentCheckin.waist_circumference_cm) || 80;
  const previousWaist = Number(previousWeekData.waist_cm) || currentWaist;
  const waistDelta = Math.round((currentWaist - previousWaist) * 10) / 10;

  const adherencePercent = Math.max(0, Math.min(100, Number(currentCheckin.overall_adherence_percent) || 85));
  const consecutivePlateauWeeks = Number(previousWeekData.consecutive_plateau_weeks || 0) + (weightDelta >= 0 && waistDelta >= 0 ? 1 : 0);

  const rawCalories = clientProfile?.current_daily_calories;
  if (rawCalories === undefined || rawCalories === null || String(rawCalories).trim() === '') {
    throw new TypeError("قيمة السعرات الحالية (current_daily_calories) غير محددة أو مفقودة.");
  }
  const currentCalories = Number(rawCalories);
  if (!Number.isFinite(currentCalories) || currentCalories <= 500 || currentCalories > 10000) {
    throw new RangeError(`قيمة السعرات الحالية غير صالحة (${rawCalories}). يجب أن تكون رقماً صالحاً وموجباً (بين 500 و 10000 سعرة).`);
  }

  const currentProtein = Number(clientProfile.protein_g) || 160;
  const currentCarbs = Number(clientProfile.carbs_g) || 200;
  const currentFat = Number(clientProfile.fat_g) || 50;

  // 1. Female Cycle Evaluation
  const femaleBuffer = evaluateFemaleCycleBuffer({
    is_female: Boolean(clientProfile.is_female),
    is_pms_active: Boolean(currentCheckin.is_pms_active),
    weight_delta_kg: weightDelta,
    adherence_score: adherencePercent,
    current_calories: currentCalories,
    has_pcos: Boolean(clientProfile.has_pcos)
  });

  // 2. Deload Evaluation
  const deloadEval = evaluateAutoDeloadRequirement({
    consecutive_training_weeks: Number(previousWeekData.consecutive_training_weeks) || 1,
    consecutive_performance_drop_weeks: Number(currentCheckin.consecutive_performance_drop_weeks) || 0,
    joint_ache_flag: Boolean(currentCheckin.joint_ache_flag)
  });

  // 2b. False Plateau Triad Detection (2 of 3)
  let falsePlateauScore = 0;
  if (currentCheckin.bowel_regularity && currentCheckin.bowel_regularity !== 'REGULAR') falsePlateauScore++;
  if (currentCheckin.sleep_stress_composite && Number(currentCheckin.sleep_stress_composite) <= 2) falsePlateauScore++;
  if (currentCheckin.menstrual_phase === 'LUTEAL' || currentCheckin.menstrual_phase === 'MENSTRUATION' || currentCheckin.is_pms_active) falsePlateauScore++;
  const isFalsePlateau = falsePlateauScore >= 2;

  // 2c. Occupational NEAT Lock (Baseline or temporary lifestyle drop like vacation)
  const isOccupationalNeatLock = (
    (
      (currentCheckin.lifestyle_variance === 'NORMAL_WORK' && (clientProfile.occupation_type === 'DESK_OFFICE' || clientProfile.occupation_type === 'STUDENT')) ||
      (currentCheckin.lifestyle_variance === 'HOME_VACATION' || currentCheckin.lifestyle_variance === 'TRAVEL_AWAY' || currentCheckin.lifestyle_variance === 'SICK_RECOVERY')
    ) &&
    Math.abs(weightDelta) < 0.3
  );

  // 2d. Next week travel preview
  const isTravelPreview = Boolean(currentCheckin.next_week_travel);

  // 3. Deterministic Decision Matrix
  let decisionCode = CHECKIN_DECISION_CODES.MAINTAIN_PLAN;
  let actionType = 'MAINTAIN';
  let calorieAdjustment = 0;
  let cardioDeltaMinutes = 0;
  let coachRecommendationAr = '';
  let clinicalReasoningAr = '';

  if (femaleBuffer.deficit_adjustment_locked) {
    decisionCode = CHECKIN_DECISION_CODES.FEMALE_PMS_BUFFER;
    actionType = 'MAINTAIN';
    coachRecommendationAr = 'تثبيت السعرات الحالية وعدم خفضها بسبب مرحلة الـ PMS واحتباس السوائل الطبيعي.';
    clinicalReasoningAr = 'هرمون البروجسترون يسبب احتباس مؤقت للماء؛ خفض السعرات الآن يجهد الغدة الدرقية بلا فائدة.';
  } else if (deloadEval.is_deload_active) {
    decisionCode = CHECKIN_DECISION_CODES.DELOAD_ACTIVATION;
    actionType = 'DELOAD';
    coachRecommendationAr = 'تفعيل أسبوع الديلود لإنعاش الجهاز العصبي وخفض الحجم التدريبي بنسبة 50%.';
    clinicalReasoningAr = 'تراجع الأداء وألم المفاصل مؤشر لإجهاد الجهاز العصبي المركزي (CNS Fatigue).';
  } else if (weightDelta <= -0.4 || waistDelta <= -0.5) {
    // Case 1: Excellent Progress
    decisionCode = CHECKIN_DECISION_CODES.EXCELLENT_PROGRESS;
    actionType = 'MAINTAIN';
    coachRecommendationAr = 'نزول ممتاز ومستمر في القياسات؛ الاستمرار على نفس السعرات والماكروز دون أي تغيير.';
    clinicalReasoningAr = 'معدل الحرق مثالي؛ تغيير الخطة الآن قد يسبب خسارة عضلية أو جوع غير مبرر.';
  } else if (adherencePercent < 80) {
    // Case 2: Low Adherence Warning
    decisionCode = CHECKIN_DECISION_CODES.LOW_ADHERENCE_WARNING;
    actionType = 'WARN_ADHERENCE';
    coachRecommendationAr = 'تنبيه المشترك لرفع نسبة الالتزام إلى 90%+ مع تثبيت السعرات الحالية تماماً.';
    clinicalReasoningAr = 'ثبات الوزن ناتج عن عدم الالتزام وليس تكيف الأيض؛ خفض السعرات الآن سيزيد من الشراهة.';
  } else if (consecutivePlateauWeeks >= 2 && adherencePercent >= 85 && isFalsePlateau) {
    // False Plateau Triad: Stall under high adherence is temporary water retention
    decisionCode = CHECKIN_DECISION_CODES.FALSE_PLATEAU_DETECTED;
    actionType = 'MAINTAIN';
    calorieAdjustment = 0;
    coachRecommendationAr = 'ثبات زائف على الميزان ناتج عن احتباس السوائل أو الإمساك؛ تم قفل خفض السعرات تماماً لتفادي الإجهاد الأيضي.';
    clinicalReasoningAr = 'عوامل احتباس الماء (الجهاز الهضمي أو التوتر أو الهرمونات) تحجب نزول الدهون الحقيقي؛ السعرات تبقى ثابتة.';
  } else if (consecutivePlateauWeeks >= 1 && adherencePercent >= 85 && isOccupationalNeatLock) {
    // Occupational / Lifestyle NEAT Lock: Low movement is occupational baseline or temporary drop
    decisionCode = CHECKIN_DECISION_CODES.OCCUPATIONAL_NEAT_LOCK;
    actionType = 'MAINTAIN';
    calorieAdjustment = 0;
    coachRecommendationAr = 'ثبات الوزن متوافق مع نمط العمل المكتبي أو إجازة مؤقتة؛ تثبيت السعرات ومراقبة أسبوع إضافي قبل أي تعديل.';
    clinicalReasoningAr = 'مستوى النشاط الحركي غير الرياضي NEAT يمثل الأساس المهني أو ظرفاً مؤقتاً للمتدرب وليس تراجعاً سلوكياً.';
  } else if (consecutivePlateauWeeks >= 2 && adherencePercent >= 85) {
    // Case 3: True Plateau Titration
    decisionCode = CHECKIN_DECISION_CODES.TRUE_PLATEAU_TITRATION;
    actionType = 'CUT_CARBS';
    calorieAdjustment = -120; // 30g carbs cut
    coachRecommendationAr = 'ثبات حقيقي مع التزام ممتاز لأسبوعين؛ خفض تدريجي بمقدار -120 سعرة من الكارب لدفع الحرق.';
    clinicalReasoningAr = 'تكيف أيضي طفيف بعد أسابيع من النزول؛ خفض 30 جم كارب كافٍ لإعادة تحفيز أكسدة الدهون.';
  } else if (isTravelPreview) {
    // Forward-Looking: Travel next week
    decisionCode = CHECKIN_DECISION_CODES.TRAVEL_WEEK_PREVIEW;
    actionType = 'TRAVEL_PREP';
    coachRecommendationAr = 'تم رصد سفر مرتقب الأسبوع القادم؛ تجهيز إرشادات المطاعم والتمرين المرن مع تثبيت الخطة.';
    clinicalReasoningAr = 'الاستباق يمنع التخبط ويوفر خيارات مرنة أثناء السفر دون كسر الالتزام.';
  } else {
    // Default: Normal Progress / Maintenance
    decisionCode = CHECKIN_DECISION_CODES.MAINTAIN_PLAN;
    actionType = 'MAINTAIN';
    coachRecommendationAr = 'الاستمرار على نفس الخطة الحالية مع التركيز على التدرج في أوزان التمارين.';
    clinicalReasoningAr = 'مؤشرات الأداء مستقرة وضمن الحدود الفسيولوجية الطبيعية.';
  }

  const nextWeekCalories = Math.max(1200, currentCalories + calorieAdjustment);
  const nextCarbsG = Math.max(80, Math.round(currentCarbs + (calorieAdjustment / 4)));
  const nextMacros = {
    protein_g: currentProtein,
    carbs_g: nextCarbsG,
    fat_g: currentFat
  };

  // 4. Construct WhatsApp 1-Click Message
  const cleanPhone = String(clientProfile.phone_number || '').replace(/[^0-9]/g, '');
  const normalizedPhone = cleanPhone.startsWith('20')
    ? cleanPhone
    : (cleanPhone.startsWith('0') ? '20' + cleanPhone.substring(1) : (cleanPhone ? '20' + cleanPhone : '201011111110'));

  const clientName = clientProfile.name || 'بطل';
  const weightSign = weightDelta > 0 ? '+' : '';
  const waistSign = waistDelta > 0 ? '+' : '';

  const messageAr = [
    `تحياتي يا ${clientName}، تم اعتماد تقرير متابعتك الأسبوعية بنجاح.`,
    '',
    'ملخص نتائج الأسبوع:',
    `- الوزن الحالي: ${currentWeight} كجم (تغير ${weightSign}${weightDelta} كجم)`,
    `- محيط الخصر: ${currentWaist} سم (تغير ${waistSign}${waistDelta} سم)`,
    `- نسبة الالتزام: ${adherencePercent}%`,
    '',
    'قرارات وتوجيهات الأسبوع القادم:',
    `- ${coachRecommendationAr}`,
    `- مستهدف السعرات اليومي: ${nextWeekCalories} Kcal (بروتين: ${nextMacros.protein_g}g | كارب: ${nextMacros.carbs_g}g | دهون: ${nextMacros.fat_g}g)`,
    '',
    'استمر في التركيز والانضباط لمواصلة التقدم نحو الهدف المحدد.'
  ].join('\n');

  return {
    client_id: clientProfile.id || '1',
    client_name: clientName,
    decision_code: decisionCode,
    action_type: actionType,
    weight_delta_kg: weightDelta,
    waist_delta_cm: waistDelta,
    adherence_percent: adherencePercent,
    consecutive_plateau_weeks: consecutivePlateauWeeks,
    female_cycle_buffer: femaleBuffer,
    deload_evaluation: deloadEval,
    coach_action_summary_ar: coachRecommendationAr,
    clinical_reasoning_ar: clinicalReasoningAr,
    current_calories: currentCalories,
    next_week_calories: nextWeekCalories,
    next_week_macros: nextMacros,
    calorie_adjustment: calorieAdjustment,
    cardio_delta_minutes: cardioDeltaMinutes,
    whatsapp_dispatch: {
      phone_number: normalizedPhone,
      message_ar: messageAr,
      dispatch_url: 'https://wa.me/' + normalizedPhone + '?text=' + encodeURIComponent(messageAr)
    }
  };
}


/**
 * Weekly Check-in & Dynamic Calorie Adjustment Engine
 * Pure Deterministic Logic - Zero Guesswork
 */
export function evaluateWeeklyProgress({
  currentWeightKg,
  previousWeightKg,
  currentWaistCm,
  previousWaistCm,
  adherenceRatePct, // 0 to 100
  currentCalories,
  weeksOnCurrentCalories = 1,
  goalType = 'FAT_LOSS', // 'FAT_LOSS' | 'MAINTENANCE' | 'LEAN_BULK'
  isFemale = false,
  isMenstrualPhase = false, // Menstrual safety firewall
  bowelRegularity = 'REGULAR',
  sleepStressComposite = 3,
  lifestyleVariance = 'NORMAL_WORK',
  occupationType = null
}) {
  if (currentWeightKg === undefined || currentWeightKg === null || String(currentWeightKg).trim() === '') {
    throw new RangeError("قيمة الوزن الحالي (currentWeightKg) مطلوبة.");
  }
  const parsedCurrentWeight = Number(currentWeightKg);
  if (!Number.isFinite(parsedCurrentWeight) || parsedCurrentWeight <= 20 || parsedCurrentWeight > 300) {
    throw new RangeError(`قيمة الوزن الحالي غير صالحة (${currentWeightKg} كجم). يجب إدخال وزن حقيقي موجب أكبر من 20 كجم وأقل من 300 كجم.`);
  }

  if (previousWeightKg === undefined || previousWeightKg === null || String(previousWeightKg).trim() === '') {
    throw new RangeError("قيمة الوزن السابق (previousWeightKg) مطلوبة.");
  }
  const parsedPrevWeight = Number(previousWeightKg);
  if (!Number.isFinite(parsedPrevWeight) || parsedPrevWeight <= 20 || parsedPrevWeight > 300) {
    throw new RangeError(`قيمة الوزن السابق غير صالحة (${previousWeightKg} كجم). يجب أن يكون الوزن السابق رقماً موجباً أكبر من 20 كجم.`);
  }

  if (currentCalories === undefined || currentCalories === null || String(currentCalories).trim() === '') {
    throw new TypeError("قيمة السعرات الحالية (currentCalories) غير محددة أو مفقودة.");
  }
  const parsedCalories = Number(currentCalories);
  if (!Number.isFinite(parsedCalories) || parsedCalories <= 500 || parsedCalories > 10000) {
    throw new RangeError(`قيمة السعرات الحالية غير صالحة (${currentCalories}). يجب أن تكون رقماً صالحاً وموجباً (بين 500 و 10000 سعرة).`);
  }

  const deltaWeight = +(parsedCurrentWeight - parsedPrevWeight).toFixed(2);
  const deltaWaist = +(Number(currentWaistCm || 80) - Number(previousWaistCm || 80)).toFixed(2);

  // 1. Female Safety Firewall: Lock deficit adjustments during fluid-retention phases
  if (isFemale && isMenstrualPhase && goalType === 'FAT_LOSS') {
    return {
      status: 'MENSTRUAL_RETENTION_LOCK',
      decision: 'MAINTAIN_CALORIES',
      calorie_adjustment: 0,
      new_calories: parsedCalories,
      message_ar: 'تم قفل تعديل السعرات تلقائياً لاحتباس السوائل الطبيعي في هذه الفترة. حافظي على نفس الخطة دون قلق.',
      action_required: false
    };
  }

  // 2. Adherence Deficit Check (<85% Adherence is an execution gap, NOT an engine plateau)
  if (adherenceRatePct < 85 && (deltaWeight >= 0 && deltaWaist >= 0)) {
    return {
      status: 'ADHERENCE_WARNING',
      decision: 'MAINTAIN_CALORIES',
      calorie_adjustment: 0,
      new_calories: parsedCalories,
      message_ar: 'ثبات الأرقام ناتج عن انخفاض الالتزام هذا الأسبوع (أقل من 85%). نوصي بالالتزام التام دون خفض السعرات لتفادي الإرهاق.',
      action_required: false
    };
  }

  // 3. Goal: Fat Loss Evaluation
  if (goalType === 'FAT_LOSS') {
    // State A: Excellent Progress (Weight drop >= 0.4kg OR Waist drop >= 0.5cm)
    if (deltaWeight <= -0.4 || deltaWaist <= -0.5) {
      return {
        status: 'EXCELLENT_PROGRESS',
        decision: 'MAINTAIN_CALORIES',
        calorie_adjustment: 0,
        new_calories: parsedCalories,
        message_ar: 'معدل الحرق ممتاز ونزول الوزن والقياسات يسير بسلاسة. يتم تثبيت السعرات الحالية للحفاظ على الاستدامة.',
        action_required: false
      };
    }

    // State B: Moderate/Safe Progress (Weight drop between 0.1kg and 0.39kg)
    if (deltaWeight < 0 || deltaWaist < 0) {
      return {
        status: 'STEADY_PROGRESS',
        decision: 'MAINTAIN_CALORIES',
        calorie_adjustment: 0,
        new_calories: parsedCalories,
        message_ar: 'تقدم ثابت ومستمر. نستمر على نفس السعرات دون حرق أوراق الخفض مبكراً.',
        action_required: false
      };
    }

    // False Plateau Triad Detection (2 of 3)
    let falsePlateauScore = 0;
    if (bowelRegularity !== 'REGULAR') falsePlateauScore++;
    if (Number(sleepStressComposite) <= 2) falsePlateauScore++;
    if (isMenstrualPhase) falsePlateauScore++;

    // State C: True Plateau vs False Plateau vs NEAT Lock
    if (weeksOnCurrentCalories >= 2 && adherenceRatePct >= 90 && deltaWeight >= 0 && deltaWaist >= 0) {
      if (falsePlateauScore >= 2) {
        return {
          status: 'FALSE_PLATEAU_DETECTED',
          decision: 'MAINTAIN_CALORIES',
          calorie_adjustment: 0,
          new_calories: parsedCalories,
          message_ar: 'ثبات زائف على الميزان ناتج عن احتباس السوائل أو اضطراب الهضم. يتم تثبيت السعرات لتفادي الإجهاد الأيضي.',
          action_required: false
        };
      }

      if (lifestyleVariance === 'NORMAL_WORK' && (occupationType === 'DESK_OFFICE' || occupationType === 'STUDENT') && Math.abs(deltaWeight) < 0.3) {
        return {
          status: 'OCCUPATIONAL_NEAT_LOCK',
          decision: 'MAINTAIN_CALORIES',
          calorie_adjustment: 0,
          new_calories: parsedCalories,
          message_ar: 'ثبات الوزن متوافق مع نمط العمل المكتبي الأساسي. يتم تثبيت السعرات دون خفض إضافي.',
          action_required: false
        };
      }
    }

    // State C: True Plateau (>= 2 weeks without progress with >= 90% adherence)
    if (weeksOnCurrentCalories >= 2 && adherenceRatePct >= 90 && deltaWeight >= 0 && deltaWaist >= 0) {
      const calorieDrop = -125; // Controlled conservative drop from carbs
      const calculatedNewCalories = Math.max(1200, parsedCalories + calorieDrop);
      if (!Number.isFinite(calculatedNewCalories) || Number.isNaN(calculatedNewCalories)) {
        throw new RangeError("خطأ في حساب السعرات الجديدة: القيمة الناتجة غير صالحة (NaN).");
      }
      return {
        status: 'CONFIRMED_PLATEAU',
        decision: 'REDUCE_CALORIES',
        calorie_adjustment: calorieDrop,
        new_calories: calculatedNewCalories,
        message_ar: 'تم رصد ثبات حقيقي لمدة أسبوعين متتاليين مع التزام كامل. تم تطبيق خفض تدريجي مقنن بمقدار 125 سعرة لكسر الثبات.',
        action_required: true,
        recommended_cardio_addition_mins: 15
      };
    }

    // Default Single-Week Stall
    return {
      status: 'MONITOR_WEEK_ONE',
      decision: 'MAINTAIN_CALORIES',
      calorie_adjustment: 0,
      new_calories: parsedCalories,
      message_ar: 'ثبات مؤقت للأسبوع الأول قد يعود لتوتر عضلي أو ماء زائد. نثبت السعرات ونراقب الأسبوع القادم بدقة.',
      action_required: false
    };
  }

  // 4. Default Fallback
  return {
    status: 'MAINTENANCE_LOCKED',
    decision: 'MAINTAIN_CALORIES',
    calorie_adjustment: 0,
    new_calories: parsedCalories,
    message_ar: 'الاستمرار على نفس السعرات المحددة مسبقاً.',
    action_required: false
  };
}

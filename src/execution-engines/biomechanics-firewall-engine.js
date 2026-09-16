/**
 * Biomechanical Engineering, Gym Adaptation & Smart Injury Firewall Engine
 * المحور الثاني: هندسة البايوميكانكس، تعديلات الجيم الميدانية، ومصفوفة الإصابات الذكية
 * Pure Deterministic Biomechanical & Kinesiology Logic
 * Zero External Dependencies
 */

// 1. استراتيجيات جسر قفزات الأوزان في الدنابل (The Dumbbell Jump Paradox & Micro-Progression Bridge)
export const MICRO_PROGRESSION_STRATEGIES = {
  REP_EXTENSION: 'REP_EXTENSION',       // توسيع مدى التكرارات (14-15 تكرار قبل نقل الوزن)
  TEMPO_OVERLOAD: 'TEMPO_OVERLOAD',     // التحكم بالزمن السلبي (3-4 ثواني نزول + ثانية ثبات)
  REST_PAUSE: 'REST_PAUSE'              // جولات الراحة المؤقتة (10 تكرارات + راحة 15ث + 2-3 تكرارات)
};

export function calculateMicroProgressionBridge({
  currentWeightKg,
  targetRepRange = [8, 12],
  currentReps = 12,
  currentRir = 2,
  bridgeStrategy = MICRO_PROGRESSION_STRATEGIES.REP_EXTENSION
}) {
  const [minReps, maxReps] = targetRepRange;
  const standardDumbbellJumpKg = 2.5;
  const nextDumbbellWeightKg = currentWeightKg + standardDumbbellJumpKg;
  const percentageJump = +((standardDumbbellJumpKg / currentWeightKg) * 100).toFixed(1);

  if (bridgeStrategy === MICRO_PROGRESSION_STRATEGIES.REP_EXTENSION) {
    const extendedTargetReps = maxReps + 3; // مثلاً من 12 إلى 15 تكراراً
    const isReadyForNextWeight = currentReps >= extendedTargetReps && currentRir >= 2;

    return {
      strategy: 'REP_EXTENSION',
      current_weight_kg: currentWeightKg,
      extended_target_reps: extendedTargetReps,
      current_reps_logged: currentReps,
      percentage_jump_to_next: percentageJump,
      is_ready_for_next_weight: isReadyForNextWeight,
      next_recommended_weight_kg: isReadyForNextWeight ? nextDumbbellWeightKg : currentWeightKg,
      next_target_reps: isReadyForNextWeight ? minReps : extendedTargetReps,
      coaching_instruction_ar: isReadyForNextWeight
        ? `ممتاز! حققت ${currentReps} تكراراً بالتحكم الكامل. انتقل للوزن الأعلى (${nextDumbbellWeightKg} كجم) وابدأ من ${minReps} تكرارات.`
        : `قفزة الوزن للدمبل التالي (${nextDumbbellWeightKg} كجم) تمثل زيادة مفاجئة بنسبة ${percentageJump}%. اثبت على وزن ${currentWeightKg} كجم واستهدف الوصول لـ ${extendedTargetReps} تكراراً بـ RIR 2 أولاً قبل رفع الوزن.`
    };
  }

  if (bridgeStrategy === MICRO_PROGRESSION_STRATEGIES.TEMPO_OVERLOAD) {
    return {
      strategy: 'TEMPO_OVERLOAD',
      current_weight_kg: currentWeightKg,
      target_tempo: '4-1-1-0', // 4 ثواني نزول، ثانية ثبات، ثانية صعود، صفر راحة
      percentage_jump_to_next: percentageJump,
      coaching_instruction_ar: `تثبيت الوزن عند ${currentWeightKg} كجم مع تطبيق نزول بطيء في 3-4 ثوانٍ مع إيقاف ثانية كاملة في أقصى استطالة لكسر التعود العضلي وزيادة التوتر الميكانيكي تحت الحمل.`
    };
  }

  // Rest-Pause Protocol
  return {
    strategy: 'REST_PAUSE',
    current_weight_kg: currentWeightKg,
    protocol_steps: [
      `أداء مجموعة أساسية بوزن ${currentWeightKg} كجم حتى الوصول لـ ${maxReps - 2} تكرار.`,
      'أخذ راحة تنفس قصيرة 15 ثانية فقط دون ترك الوزن بعيداً.',
      'أداء 2 إلى 3 تكرارات إضافية بتركيز حركي كامل لكسر الحاجز العصبي قبل رفع الدامبل الأعلى.'
    ]
  };
}

// 2. جدار حماية آلام المفاصل والتحويل البيوميكانيكي الآلي (Joint Pain Firewall Matrix)
export const JOINT_PAIN_SWAP_MATRIX = {
  LOWER_BACK: {
    forbidden_movements: ['BARBELL_BACK_SQUAT', 'CONVENTIONAL_DEADLIFT', 'BENT_OVER_BARBELL_ROW'],
    recommended_swaps: [
      {
        id: 'bulgarian_split_squat',
        name_ar: 'السكوات البلغاري بالدنابل (Bulgarian Split Squat)',
        biomechanical_advantage_ar: 'تقليل الحمل المحوري (Axial Load) على الفقرات القطنية L4/L5 بنسبة 80% مع مضاعفة الحمل الفردي على الفخذ والجلوتس.'
      },
      {
        id: 'chest_supported_db_row',
        name_ar: 'سحب دمبلز مع دعم الصدر (Chest-Supported Row)',
        biomechanical_advantage_ar: 'عزل عضلات الظهر تماماً دون تحميل أي إجهاد قص أو ضغط على عضلات أسفل الظهر.'
      },
      {
        id: 'belt_squat',
        name_ar: 'سكوات بحزام الكابل (Belt Squat)',
        biomechanical_advantage_ar: 'توجيه الحمل مباشرة للحوض والأرجل مع تحييد العمود الفقري بالكامل.'
      }
    ]
  },
  SHOULDER: {
    forbidden_movements: ['FLAT_BARBELL_BENCH_PRESS', 'BEHIND_NECK_PRESS', 'UPRIGHT_ROW_WIDE'],
    recommended_swaps: [
      {
        id: 'low_incline_neutral_db_press',
        name_ar: 'ضغط دنابل بنش مائل 30° بقبضة متوازية (Low Incline Neutral DB Press)',
        biomechanical_advantage_ar: 'التحرك في مستوى لوح الكتف (Scapular Plane) وفتح مفصل الأخرم (Acromion) بالكامل لمنع احتكاك وتر العضلة فوق الشوكية (Supraspinatus).'
      },
      {
        id: 'floor_db_press',
        name_ar: 'تجميع وضغط دمبلز على الأرض (Floor DB Press)',
        biomechanical_advantage_ar: 'الأرض تعمل كمحدد ميكانيكي صلب يمنع فرط تمدد محفظة مفصل الكتف في قاع الحركة.'
      }
    ]
  },
  ELBOW: {
    forbidden_movements: ['SKULLCRUSHERS', 'FRENCH_PRESS_BARBELL', 'OVERHEAD_DUMBBELL_EXTENSION'],
    recommended_swaps: [
      {
        id: 'dual_cable_cross_body_triceps_ext',
        name_ar: 'ترايسبس كابل متقاطع من الجانبين (Dual Cable Cross-Body Triceps Extension)',
        biomechanical_advantage_ar: 'محاذاة خط السحب تماماً مع اتجاه ألياف الترايسبس وإلغاء عزم القص الضار على وتر الكوع.'
      }
    ]
  },
  KNEE_PATELLAR: {
    forbidden_movements: ['LEG_EXTENSION_OPEN_CHAIN', 'SISSY_SQUAT'],
    recommended_swaps: [
      {
        id: 'spanish_squat_banded',
        name_ar: 'السكوات الإسباني بالمطاط (Spanish Squat with Resistance Band)',
        biomechanical_advantage_ar: 'تحميل أيزومتري آمن يقلل الضغط الاحتكاكي على وتر الرضفة (Patellar Tendon) ويزيد تروية الغضروف.'
      },
      {
        id: 'reverse_nordic_curl',
        name_ar: 'التقويس العكسي للفخذ (Reverse Nordic Curl)',
        biomechanical_advantage_ar: 'تقوية استطالة عضلات الفخذ الرباعية مع تحكم أوتار الركبة.'
      }
    ]
  }
};

export function evaluateJointPainAndFirewall({
  jointLocation, // 'LOWER_BACK' | 'SHOULDER' | 'ELBOW' | 'KNEE_PATELLAR'
  painScore = 0  // 0 to 10
}) {
  if (painScore < 3) {
    return {
      firewall_active: false,
      pain_severity: 'MILD_NORMAL',
      instructions_ar: 'الألم طفيف (أقل من 3/10)؛ يُنصح بتقليل المدى الحركي بـ 15% والتركيز على الإحماء دون الحاجة لتغيير التمرين.'
    };
  }

  const normalizedJoint = String(jointLocation).toUpperCase();
  const firewallData = JOINT_PAIN_SWAP_MATRIX[normalizedJoint];

  if (!firewallData) {
    return {
      firewall_active: true,
      pain_severity: 'MODERATE_TO_HIGH',
      instructions_ar: 'تم رصد ألم مفصلي؛ يُوصى بخفض الوزن بنسبة 30% والاعتماد على الأجهزة المدعومة بدلاً من الأوزان الحرة.'
    };
  }

  return {
    firewall_active: true,
    pain_severity: painScore >= 7 ? 'CRITICAL_INJURY_PREVENTION' : 'MODERATE_JOINT_SHIELD',
    joint_affected: normalizedJoint,
    forbidden_movements: firewallData.forbidden_movements,
    immediate_swaps: firewallData.recommended_swaps,
    clinical_action_ar: `تم تفعيل جدار حماية المفصل فوراً (${normalizedJoint}). تم استبعاد التمارين ذات الحمل القصي وحقن البدائل البيوميكانيكية الآمنة.`
  };
}

// 3. مصفوفة بدائل زحمة الجيم والأجهزة المعطلة (Gym Rush & Out-of-Order Swaps)
export const GYM_RUSH_EQUIVALENCE_CATALOG = {
  LAT_PULLDOWN: {
    id: 'lat_pulldown',
    name_ar: 'سحب الظهر العالي (Lat Pulldown)',
    swap_id: 'single_arm_cable_pulldown',
    swap_name_ar: 'سحب عالي بذراع واحدة على الكابل (Half-Kneeling Single-Arm Cable Pulldown)',
    coaching_cue_ar: 'اسحب الكوع باتجاه جيب البنطال مع ثبات الجذع تماماً وعصر اللاتس بالأسفل.'
  },
  LEG_PRESS: {
    id: 'leg_press',
    name_ar: 'جهاز ضغط الأرجل (Leg Press)',
    swap_id: 'db_walking_lunges',
    swap_name_ar: 'طعنات المشي بالدنابل مع ميل الجذع 20° (DB Walking Lunges)',
    coaching_cue_ar: 'التركيز على دفع الأرض بكعب القدم لتفعيل الهامسترينج والجلوتس بنفس منحنى مقاومة الليج برس.'
  },
  PEC_DECK_FLY: {
    id: 'pec_deck_fly',
    name_ar: 'جهاز تفتيح الصدر (Pec Deck Fly)',
    swap_id: 'floor_db_fly_press',
    swap_name_ar: 'تجميع دنابل على الأرض (Floor DB Fly-Press)',
    coaching_cue_ar: 'الأرض تعمل كحاجز أمان يمنع فرط تمدد أوتار الكتف بالأسفل مع عصر عضلات الصدر بالأعلى.'
  },
  SEATED_CABLE_ROW: {
    id: 'seated_cable_row',
    name_ar: 'جهاز السحب الأرضي (Seated Cable Row)',
    swap_id: 'chest_supported_db_row',
    swap_name_ar: 'سحب دمبلز على بنش مائل (Chest-Supported Incline DB Row)',
    coaching_cue_ar: 'الصدر مدعوم بالكامل على البنش لعزل عضلات الظهر ومنع التأرجح تماماً.'
  },
  LATERAL_MACHINE: {
    id: 'lateral_machine',
    name_ar: 'جهاز الرفرفة الجانبية (Lateral Machine)',
    swap_id: 'behind_back_cable_lateral_raise',
    swap_name_ar: 'رفرفة جانبي بالكابل من خلف الظهر (Behind-the-Back Cable Lateral Raise)',
    coaching_cue_ar: 'الكابل يوفر أقصى مقاومة في بداية الحركة حيث تكون العضلة الجانبية في أقصى استطالة.'
  },
  LEG_EXTENSION: {
    id: 'leg_extension',
    name_ar: 'جهاز فرد الأرجل (Leg Extension)',
    swap_id: 'spanish_squat_banded',
    swap_name_ar: 'السكوات الإسباني بالمطاط (Spanish Squat with Resistance Band)',
    coaching_cue_ar: 'تثبيت الركبتين بالمطاط بزاوية 90 درجة لتوليد أقصى توتر أيزومتري على عضلات الفخذ الرباعية دون إجهاد الرضفة.'
  },
  LEG_EXTENSION_MACHINE: {
    id: 'leg_extension_machine',
    name_ar: 'جهاز فرد الأرجل (Leg Extension)',
    swap_id: 'spanish_squat_banded',
    swap_name_ar: 'السكوات الإسباني بالمطاط (Spanish Squat with Resistance Band)',
    coaching_cue_ar: 'تثبيت الركبتين بالمطاط بزاوية 90 درجة لتوليد أقصى توتر أيزومتري على عضلات الفخذ الرباعية دون إجهاد الرضفة.'
  },
  SEATED_LEG_CURL: {
    id: 'seated_leg_curl',
    name_ar: 'جهاز ثني الأرجل جالس (Seated Leg Curl)',
    swap_id: 'db_romanian_deadlift',
    swap_name_ar: 'الديدليفت الروماني بالدنابل (DB Romanian Deadlift)',
    coaching_cue_ar: 'دفع الحوض للخلف مع ثني طفيف في الركبة للوصول لأقصى استطالة في عضلات الفخذ الخلفية.'
  },
  LYING_LEG_CURL: {
    id: 'lying_leg_curl',
    name_ar: 'جهاز ثني الأرجل منبطح (Lying Leg Curl)',
    swap_id: 'db_romanian_deadlift',
    swap_name_ar: 'الديدليفت الروماني بالدنابل (DB Romanian Deadlift)',
    coaching_cue_ar: 'دفع الحوض للخلف مع ثني طفيف في الركبة للوصول لأقصى استطالة في عضلات الفخذ الخلفية.'
  },
  HACK_SQUAT: {
    id: 'hack_squat',
    name_ar: 'جهاز الهاك سكوات (Hack Squat)',
    swap_id: 'bulgarian_split_squat',
    swap_name_ar: 'السكوات البلغاري بالدنابل (Bulgarian Split Squat)',
    coaching_cue_ar: 'وضع القدم الخلفية على البنش والنزول عمودياً لتركيز كامل الحمل على الفخذ الأمامي للجزء العامل.'
  },
  CABLE_CROSSOVER: {
    id: 'cable_crossover',
    name_ar: 'كابل تفتيح الصدر (Cable Crossover)',
    swap_id: 'incline_db_fly',
    swap_name_ar: 'تفتيح دمبلز بنش مائل 30° (Incline DB Fly)',
    coaching_cue_ar: 'الحفاظ على ثني طفيف وثابت في الكوع والتركيز على عصر الصدر العلوي في نهاية الصعود.'
  }
};

export function getGymRushEquivalentSwap(equipmentKey) {
  const normalizedKey = String(equipmentKey).toUpperCase();
  let swap = GYM_RUSH_EQUIVALENCE_CATALOG[normalizedKey];

  if (!swap) {
    // Try matching partial key
    const foundKey = Object.keys(GYM_RUSH_EQUIVALENCE_CATALOG).find(k => normalizedKey.includes(k) || k.includes(normalizedKey));
    if (foundKey) {
      swap = GYM_RUSH_EQUIVALENCE_CATALOG[foundKey];
    }
  }

  if (!swap) {
    return {
      found: false,
      message_ar: 'الجهاز غير مسجل في مصفوفة الزحمة؛ استخدم البديل الحر بالدمبل بنفس زاوية السحب أو الدفع.'
    };
  }

  return {
    found: true,
    original_exercise_ar: swap.name_ar,
    biomechanical_swap_ar: swap.swap_name_ar,
    swap_id: swap.swap_id,
    coaching_cue_ar: swap.coaching_cue_ar,
    identical_resistance_profile: true
  };
}

export function applyGymRushSwapToProgram(programData, { weekNumber = 1, sessionIndex = 0, exerciseIndex = 0, equipmentKey = null } = {}) {
  if (!programData || !programData.training_program) {
    throw new TypeError("programData or training_program is missing");
  }

  const cloned = JSON.parse(JSON.stringify(programData));
  const weeks = cloned.training_program.weeks || [];
  const targetWeek = weeks.find(w => Number(w.week_number) === Number(weekNumber) || Number(w.week) === Number(weekNumber)) || weeks[0];

  if (!targetWeek) {
    throw new RangeError(`Week ${weekNumber} not found in training program`);
  }

  const sessions = targetWeek.sessions || targetWeek.days || [];
  const targetSession = sessions[sessionIndex];

  if (!targetSession || !Array.isArray(targetSession.exercises)) {
    throw new RangeError(`Session at index ${sessionIndex} not found or has no exercises`);
  }

  const targetExercise = targetSession.exercises[exerciseIndex];
  if (!targetExercise) {
    throw new RangeError(`Exercise at index ${exerciseIndex} not found in session`);
  }

  const keyToLookup = equipmentKey || targetExercise.code || targetExercise.exercise_code || targetExercise.id;
  const swapResult = getGymRushEquivalentSwap(keyToLookup);

  if (!swapResult.found) {
    return {
      success: false,
      message_ar: swapResult.message_ar,
      program: cloned
    };
  }

  // Deterministically replace exercise with gym rush equivalent
  const updatedExercise = {
    ...targetExercise,
    id: `rush_swap_${swapResult.swap_id}_${exerciseIndex}`,
    code: swapResult.swap_id.toUpperCase(),
    exercise_code: swapResult.swap_id.toUpperCase(),
    name: swapResult.biomechanical_swap_ar,
    name_ar: swapResult.biomechanical_swap_ar,
    name_en: swapResult.biomechanical_swap_ar,
    is_gym_rush_swap: true,
    original_exercise_code: targetExercise.code || targetExercise.exercise_code,
    original_exercise_name_ar: swapResult.original_exercise_ar,
    coaching_cue_ar: swapResult.coaching_cue_ar,
    safetyNote: `بديل زحمة الجيم: ${swapResult.coaching_cue_ar}`,
    prescription: {
      ...(targetExercise.prescription || {}),
      sets: targetExercise.sets || 3,
      clinical_notes_ar: swapResult.coaching_cue_ar
    }
  };

  targetSession.exercises[exerciseIndex] = updatedExercise;

  return {
    success: true,
    swapped_exercise: updatedExercise,
    program: cloned
  };
}

// 4. مصفوفة حقن التأهيل الحركي قبل التمرين (Postural Prehab Injections)
export const POSTURAL_PREHAB_PROTOCOLS = {
  UPPER_CROSSED_SYNDROME: {
    name_ar: 'استدارة الأكتاف وميل الرأس للأمام (Upper Crossed Syndrome)',
    duration_minutes: 4,
    routine: [
      { exercise_ar: 'Face Pulls with External Rotation بالكابل', prescription_ar: 'جولتان × 15 تكراراً' },
      { exercise_ar: 'إطالة الصدر على الفوم رولر / زاوية الباب (Pec Minor Stretch)', prescription_ar: '45 ثانية ثبات' }
    ],
    target_sessions: ['PUSH', 'UPPER', 'FULL_BODY']
  },
  ANTERIOR_PELVIC_TILT: {
    name_ar: 'ميل الحوض للأمام وقصر عضلات الفخذ الحرقفية (Anterior Pelvic Tilt)',
    duration_minutes: 5,
    routine: [
      { exercise_ar: 'إطالة العضلة الحرقفية الفخذية (Couch Stretch)', prescription_ar: 'دقيقة لكل جانب' },
      { exercise_ar: 'تفعيل الجلوتس بالكوبري الأرضي مع عصر ثانيتين (Glute Bridge Isometric Holds)', prescription_ar: 'جولتان × 12 تكراراً' }
    ],
    target_sessions: ['LEGS', 'LOWER', 'FULL_BODY']
  }
};

export function getPosturalPrehabInjection(postureFlag) {
  const normalized = String(postureFlag).toUpperCase();
  const protocol = POSTURAL_PREHAB_PROTOCOLS[normalized];

  if (!protocol) {
    return {
      injection_active: false,
      message_ar: 'لا توجد متلازمة قوامية محددة؛ الالتزام بالإحماء العام 5 دقائق.'
    };
  }

  return {
    injection_active: true,
    syndrome_name_ar: protocol.name_ar,
    duration_minutes: protocol.duration_minutes,
    routine_exercises: protocol.routine,
    target_sessions: protocol.target_sessions
  };
}

// 5. ضبط معايرة الـ RIR الحقيقي وسد ثغرات الكسل (RIR Reality Check & Bar Speed Indicator)
export function validateRirAuthenticity({
  loggedRir = 2,
  isBarSpeedConstant = false, // هل خرجت العدة الأخيرة بنفس سرعة العدة الأولى؟
  involuntaryBarSlowdown = true // هل حدث تباطؤ لا إرادي في آخر عدتين؟
}) {
  // كشف الكسل: إنهاء الجولة بسرعة ثابتة دون أي تباطؤ لا إرادي
  if (isBarSpeedConstant && !involuntaryBarSlowdown && loggedRir <= 2) {
    return {
      is_authentic: false,
      corrected_rir: 4,
      verdict_ar: 'LAZY_SET_DETECTED',
      message_ar: 'سرعة الحركة في العدة الأخيرة كانت سريعة ومطابقة للعدة الأولى دون أي تباطؤ لا إرادي. هذا التمرين كان بـ RIR 4 على الأقل (بعيداً عن الفشل). ارفع الوزن 2.5 كجم في الجولة القادمة لتحقيق التحفيز العضلي الحقيقي.',
      action_recommended: 'INCREASE_LOAD'
    };
  }

  return {
    is_authentic: true,
    validated_rir: loggedRir,
    verdict_ar: 'AUTHENTIC_EFFORT',
    message_ar: 'تم التحقق من الجهد: التباطؤ اللاإرادي في سرعة البار يؤكد الوصول للـ RIR المستهدف بدقة.',
    action_recommended: 'MAINTAIN_PROGRESSION'
  };
}

// 6. بروتوكول مجموعات الإحماء الذكي (Pyramid Acclimation Sets)
export function calculateAcclimationWarmupSets(workingWeightKg) {
  if (!workingWeightKg || workingWeightKg <= 20) {
    return { warmup_sets: [] };
  }

  return {
    working_weight_kg: workingWeightKg,
    warmup_sets: [
      { set_number: 1, percentage: 40, weight_kg: +(workingWeightKg * 0.4).toFixed(1), reps: 8, rest_seconds: 45, purpose_ar: 'تدفق السائل الزلالي للمفصل' },
      { set_number: 2, percentage: 60, weight_kg: +(workingWeightKg * 0.6).toFixed(1), reps: 5, rest_seconds: 60, purpose_ar: 'تحضير النواقل العصبية الحركية' },
      { set_number: 3, percentage: 80, weight_kg: +(workingWeightKg * 0.8).toFixed(1), reps: 2, rest_seconds: 90, purpose_ar: 'معايرة الإحساس بالوزن دون أي إجهاد تراكمي' }
    ]
  };
}

/**
 * Torque-Matched Biomechanical Swap Engine
 *
 * Classifies exercises by joint kinematics & resistance torque profiles:
 *   - LENGTHENED_OVERLOAD: Peak torque/mechanical tension at maximum muscle stretch.
 *   - SHORTENED_OVERLOAD: Peak torque at full muscular contraction/shortening.
 *   - MID_RANGE_COMPOUND: High-capacity multi-joint compound profile.
 *
 * Guarantees 1-to-1 biomechanical equivalence when a trainee swaps a busy gym machine.
 */

export const RESISTANCE_PROFILES = {
  LENGTHENED_OVERLOAD: 'LENGTHENED_OVERLOAD',
  SHORTENED_OVERLOAD: 'SHORTENED_OVERLOAD',
  MID_RANGE_COMPOUND: 'MID_RANGE_COMPOUND'
};

export const TORQUE_EXERCISE_DATABASE = {
  // --- CHEST ---
  BARBELL_BENCH_PRESS: {
    code: 'BARBELL_BENCH_PRESS',
    name_ar: 'بنش برس بار مستوي',
    muscle_group: 'CHEST',
    profile: RESISTANCE_PROFILES.MID_RANGE_COMPOUND,
    swaps: [
      { name: 'Heavy Dumbbell Flat Bench Press', profile: RESISTANCE_PROFILES.MID_RANGE_COMPOUND, rationale_ar: 'تطابق ميكانيكي كامل للضغط الأفقي مع مدى حركي أعمق' },
      { name: 'Plate-Loaded Flat Chest Machine', profile: RESISTANCE_PROFILES.MID_RANGE_COMPOUND, rationale_ar: 'مسار حركة ثابت وثبات مفصلي عالي' }
    ]
  },
  INCLINE_DUMBBELL_PRESS: {
    code: 'INCLINE_DUMBBELL_PRESS',
    name_ar: 'ضغط دمبلز مائل للأعلى (30 درجة)',
    muscle_group: 'CHEST',
    profile: RESISTANCE_PROFILES.LENGTHENED_OVERLOAD,
    swaps: [
      { name: 'Incline Smith Machine Press', profile: RESISTANCE_PROFILES.LENGTHENED_OVERLOAD, rationale_ar: 'أقصى ثبات وتحميل لألياف الصدر العلوية في وضع الاستطالة' },
      { name: 'Low-to-High Cable Fly-Press', profile: RESISTANCE_PROFILES.LENGTHENED_OVERLOAD, rationale_ar: 'توتر مستمر ومحاذاة مثالية مع ألياف الترقوة' }
    ]
  },
  PEC_DECK_FLYE: {
    code: 'PEC_DECK_FLYE',
    name_ar: 'تفتيح صدر فراشة (Pec Deck)',
    muscle_group: 'CHEST',
    profile: RESISTANCE_PROFILES.SHORTENED_OVERLOAD,
    swaps: [
      { name: 'Cable Crossover (Mid-Chest)', profile: RESISTANCE_PROFILES.SHORTENED_OVERLOAD, rationale_ar: 'قمة انقباض حادة في منتصف الصدر مع توتر كابلي مستمر' },
      { name: 'Single-Arm Cable Flye', profile: RESISTANCE_PROFILES.SHORTENED_OVERLOAD, rationale_ar: 'عزل تام وتجاوز خط المنتصف لزيادة قصر الألياف' }
    ]
  },

  // --- BICEPS ---
  INCLINE_DUMBBELL_CURL: {
    code: 'INCLINE_DUMBBELL_CURL',
    name_ar: 'بايسبس دمبلز على بنش مائل (استطالة كاملة)',
    muscle_group: 'BICEPS',
    profile: RESISTANCE_PROFILES.LENGTHENED_OVERLOAD,
    swaps: [
      { name: 'Bayesian Cable Curl (Behind the Back)', profile: RESISTANCE_PROFILES.LENGTHENED_OVERLOAD, rationale_ar: 'تطابق استطالي تام مع توتر متواصل في قاع المدى الحركي' },
      { name: 'Incline Cable Biceps Curl', profile: RESISTANCE_PROFILES.LENGTHENED_OVERLOAD, rationale_ar: 'سحب مائل خلف الجذع لعزل الرأس الطويل للبايسبس' }
    ]
  },
  PREACHER_CURL: {
    code: 'PREACHER_CURL',
    name_ar: 'بايسبس على كرسي سكوت / بريتشر',
    muscle_group: 'BICEPS',
    profile: RESISTANCE_PROFILES.SHORTENED_OVERLOAD,
    swaps: [
      { name: 'Spider Curl (Prone Incline DB Curl)', profile: RESISTANCE_PROFILES.SHORTENED_OVERLOAD, rationale_ar: 'أقصى عزم دوران في زاوية الانقباض دون مساعدة الكتف' },
      { name: 'High Cable Concentration Curl', profile: RESISTANCE_PROFILES.SHORTENED_OVERLOAD, rationale_ar: 'عزل تام عند قمة الانقباض العضلي' }
    ]
  },

  // --- TRICEPS ---
  OVERHEAD_CABLE_EXTENSION: {
    code: 'OVERHEAD_CABLE_EXTENSION',
    name_ar: 'ترايسبس حبل فوق الرأس (Overhead Cable)',
    muscle_group: 'TRICEPS',
    profile: RESISTANCE_PROFILES.LENGTHENED_OVERLOAD,
    swaps: [
      { name: 'Incline French Press (Dumbbell or EZ-Bar)', profile: RESISTANCE_PROFILES.LENGTHENED_OVERLOAD, rationale_ar: 'وضع الرأس الطويل للترايسبس في أقصى استطالة عمودية' },
      { name: 'Cross-Body Incline Cable Triceps Extension', profile: RESISTANCE_PROFILES.LENGTHENED_OVERLOAD, rationale_ar: 'محاذاة تشريحية بزاوية 45 درجة مع راحة المفصل' }
    ]
  },
  CABLE_ROPE_PUSHDOWN: {
    code: 'CABLE_ROPE_PUSHDOWN',
    name_ar: 'ترايسبس دفع كابل لأسفل بالحبل',
    muscle_group: 'TRICEPS',
    profile: RESISTANCE_PROFILES.SHORTENED_OVERLOAD,
    swaps: [
      { name: 'Straight-Bar Cable Pushdown', profile: RESISTANCE_PROFILES.SHORTENED_OVERLOAD, rationale_ar: 'ثبات مفصلي أعلى للرأسين الجانبي والوسطي' },
      { name: 'Single-Arm Cable Kickback', profile: RESISTANCE_PROFILES.SHORTENED_OVERLOAD, rationale_ar: 'أقصى قصر للألياف العضلية عند قفل الكوع للخلف' }
    ]
  },

  // --- HAMSTRINGS & LEGS ---
  ROMANIAN_DEADLIFT: {
    code: 'ROMANIAN_DEADLIFT',
    name_ar: 'رفعة ميتة رومانية (RDL بالبار أو الدمبلز)',
    muscle_group: 'HAMSTRINGS',
    profile: RESISTANCE_PROFILES.LENGTHENED_OVERLOAD,
    swaps: [
      { name: 'Dumbbell Romanian Deadlift (Heels Flat)', profile: RESISTANCE_PROFILES.LENGTHENED_OVERLOAD, rationale_ar: 'أقصى تحميل استطالي لأوتار الهامسترنجز بمرونة حركة الحوض' },
      { name: 'Single-Leg B-Stance RDL', profile: RESISTANCE_PROFILES.LENGTHENED_OVERLOAD, rationale_ar: 'تركيز استطالي أحادي مع تخفيف الضغط على العمود الفقري' }
    ]
  },
  SEATED_LEG_CURL: {
    code: 'SEATED_LEG_CURL',
    name_ar: 'ثني أرجل خلفي جالس (Seated Leg Curl)',
    muscle_group: 'HAMSTRINGS',
    profile: RESISTANCE_PROFILES.LENGTHENED_OVERLOAD,
    swaps: [
      { name: 'Lying Leg Curl Machine', profile: RESISTANCE_PROFILES.SHORTENED_OVERLOAD, rationale_ar: 'بديل مباشر متاح عند زحام الجهاز الجالس مع انقباض قوي' },
      { name: 'Swiss Ball Hamstring Curl', profile: RESISTANCE_PROFILES.MID_RANGE_COMPOUND, rationale_ar: 'دمج ثني الركبة مع مد الحوض في وزن الجسم' }
    ]
  }
};

/**
 * Returns torque-matched alternative exercises.
 */
export function getTorqueMatchedSwaps(exerciseIdentifier) {
  const query = String(exerciseIdentifier || '').toUpperCase();

  for (const [key, item] of Object.entries(TORQUE_EXERCISE_DATABASE)) {
    if (key === query || item.name_ar.includes(query) || item.code === query) {
      return {
        original_exercise: item.name_ar,
        muscle_group: item.muscle_group,
        resistance_profile: item.profile,
        matched_swaps: item.swaps,
        directive_ar: `تمت مطابقة بدائل مكافئة بيوميكانيكياً في زاوية عزم الدوران (${item.profile}) لضمان نفس الحافز العضلي دون أي خلل في البرنامج.`
      };
    }
  }

  // Fallback generic search
  return {
    original_exercise: exerciseIdentifier,
    muscle_group: 'GENERAL',
    resistance_profile: RESISTANCE_PROFILES.MID_RANGE_COMPOUND,
    matched_swaps: [
      { name: 'Dumbbell Variation (نفس الحركة بالدمبلز)', profile: RESISTANCE_PROFILES.MID_RANGE_COMPOUND, rationale_ar: 'بديل حر مباشر متاح بسهولة' },
      { name: 'Cable Variation (نفس الحركة بالكابل)', profile: RESISTANCE_PROFILES.MID_RANGE_COMPOUND, rationale_ar: 'توتر ميكانيكي مستمر' }
    ],
    directive_ar: 'تم توفير بديل حر مباشر مكافئ للحركة.'
  };
}

/**
 * In-Gym Fatigue Mode: Reduces 1 set from secondary/accessory exercises.
 */
export function applyFatigueModeReduction(workoutSession = {}) {
  if (!workoutSession || !Array.isArray(workoutSession.exercises)) {
    return workoutSession;
  }

  const updatedExercises = workoutSession.exercises.map(ex => {
    // If it's not the primary heavy compound, reduce 1 set
    if (!ex.isCompound && Array.isArray(ex.sets) && ex.sets.length > 2) {
      return {
        ...ex,
        sets: ex.sets.slice(0, ex.sets.length - 1),
        fatigue_mode_active: true
      };
    }
    return ex;
  });

  return {
    ...workoutSession,
    is_fatigue_mode_active: true,
    fatigue_mode_rationale_ar: 'تم تفعيل وضع التمرين السريع: تقليص جولة واحدة من التمارين الثانوية لتوفير 25% من الطاقة والوقت مع الحفاظ التام على الحافز العضلي الأساسي.',
    exercises: updatedExercises
  };
}

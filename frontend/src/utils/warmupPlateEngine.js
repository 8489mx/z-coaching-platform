/**
 * Neural Warm-Up Ramp & Plate Loading Calculator Engine
 *
 * 1. Neural Warm-Up Ramp Protocol:
 *    - Working Set Weight (W):
 *      - Set 1: 50% of W (5-6 reps) -> General joint blood flow.
 *      - Set 2: 70% of W (3 reps) -> Motor pattern grooving.
 *      - Set 3: 85% of W (1 rep) -> Post-activation potentiation (PAP) without fatigue.
 *
 * 2. Plate Loading Calculator:
 *    - Olympic Bar: 20kg base.
 *    - Available standard plates: 20kg, 15kg, 10kg, 5kg, 2.5kg, 1.25kg.
 *    - Calculates exact plates required per side.
 */

export const STANDARD_OLYMPIC_PLATES_KG = [20, 15, 10, 5, 2.5, 1.25];

/**
 * Calculates exact barbell plate configuration per side.
 */
export function calculateBarbellPlates({
  target_weight_kg = 100,
  bar_weight_kg = 20,
  available_plates = STANDARD_OLYMPIC_PLATES_KG
}) {
  const target = Math.max(bar_weight_kg, Number(target_weight_kg) || bar_weight_kg);
  const totalPlateWeight = target - bar_weight_kg;
  const weightPerSide = totalPlateWeight / 2;

  let remaining = weightPerSide;
  const platesPerSide = [];

  const sortedPlates = [...available_plates].sort((a, b) => b - a);

  for (const plate of sortedPlates) {
    while (remaining >= plate) {
      platesPerSide.push(plate);
      remaining = Math.round((remaining - plate) * 100) / 100;
    }
  }

  return {
    target_weight_kg: target,
    bar_weight_kg,
    total_plate_weight_kg: totalPlateWeight,
    weight_per_side_kg: weightPerSide,
    plates_per_side: platesPerSide,
    unresolved_remainder_kg: remaining,
    display_per_side_ar: platesPerSide.length > 0 ? 
      `ركب لكل جانب: (${platesPerSide.map(p => `${p}kg`).join(' + ')})` : 
      'البار فارغ بدون طارات (20kg)'
  };
}

/**
 * Calculates Neural Warm-Up ramp sets for heavy compound lifts.
 */
export function calculateNeuralWarmupRamp({
  working_weight_kg = 100,
  bar_weight_kg = 20
}) {
  const w = Math.max(bar_weight_kg, Number(working_weight_kg) || bar_weight_kg);

  // Set 1: 50%
  const set1Weight = Math.max(bar_weight_kg, Math.round((w * 0.50) / 2.5) * 2.5);
  // Set 2: 70%
  const set2Weight = Math.max(bar_weight_kg, Math.round((w * 0.70) / 2.5) * 2.5);
  // Set 3: 85%
  const set3Weight = Math.max(bar_weight_kg, Math.round((w * 0.85) / 2.5) * 2.5);

  const warmups = [
    {
      set_number: 1,
      target_percent: 50,
      weight_kg: set1Weight,
      reps: '5-6 عدات',
      rest_seconds: 60,
      plates_info: calculateBarbellPlates({ target_weight_kg: set1Weight, bar_weight_kg }),
      purpose_ar: 'تدفق الدم للمفصل وتسخين الألياف العضلية'
    },
    {
      set_number: 2,
      target_percent: 70,
      weight_kg: set2Weight,
      reps: '3 عدات',
      rest_seconds: 90,
      plates_info: calculateBarbellPlates({ target_weight_kg: set2Weight, bar_weight_kg }),
      purpose_ar: 'ضبط المسار الحركي وتجهيز الجهاز العصبي'
    },
    {
      set_number: 3,
      target_percent: 85,
      weight_kg: set3Weight,
      reps: 'تكرار واحد فقط (1 Rep)',
      rest_seconds: 120,
      plates_info: calculateBarbellPlates({ target_weight_kg: set3Weight, bar_weight_kg }),
      purpose_ar: 'تهيئة الألياف العصبية سريعة الانقباض (PAP) دون استنزاف حمض اللاكتيك'
    }
  ];

  return {
    working_weight_kg: w,
    bar_weight_kg,
    warmup_sets_count: warmups.length,
    warmup_protocol: warmups,
    ready_for_work_sets_directive_ar: `بعد الجولة الثالثة (${set3Weight}kg × 1)، خذ راحة 2-3 دقائق وابدأ جولات العمل الأساسية بوزن ${w}kg بكامل طاقتك الانفجارية.`
  };
}

/**
 * Returns a simple, passive warm-up note string without input logging fields.
 */
export function getPassiveWarmupCueCard({
  working_weight_kg = 80,
  bar_weight_kg = 20
}) {
  const w = Math.max(bar_weight_kg, Number(working_weight_kg) || bar_weight_kg);
  const set1 = Math.max(bar_weight_kg, Math.round((w * 0.50) / 2.5) * 2.5);
  const set2 = Math.max(bar_weight_kg, Math.round((w * 0.80) / 2.5) * 2.5);

  const plate1 = calculateBarbellPlates({ target_weight_kg: set1, bar_weight_kg });
  const plate2 = calculateBarbellPlates({ target_weight_kg: set2, bar_weight_kg });

  return {
    working_weight_kg: w,
    passive_cue_card_ar: `تسخين مقترح: جولة 1 (${set1}kg × 5 عدات) ثم جولة 2 (${set2}kg × 1 عدة لتهيئة المفصل).`,
    set_1_display_ar: `${set1}kg × 5 عدات (${plate1.display_per_side_ar})`,
    set_2_display_ar: `${set2}kg × 1 عدة (${plate2.display_per_side_ar})`
  };
}

export const SPLIT_TYPES = {
  UPPER_BODY: 'UPPER_BODY',
  LOWER_BODY: 'LOWER_BODY'
};

/**
 * Generates full scientific 3-stage RAMP warm-up protocol.
 */
export function generateScientificRampWarmup({
  working_weight_kg = 100,
  split_type = SPLIT_TYPES.UPPER_BODY,
  bar_weight_kg = 20
}) {
  const w = Math.max(bar_weight_kg, Number(working_weight_kg) || bar_weight_kg);

  // Phase 1: Raise (2 mins)
  const raise = {
    phase: 'RAISE',
    duration_minutes: 2,
    directive_ar: 'دقيقتان مشي مائل خفيف أو دراجة لرفع حرارة الجسم وتليين المفاصل وضخ الدم.'
  };

  // Phase 2: Mobilize & Activate (3-4 mins)
  const isUpper = split_type === SPLIT_TYPES.UPPER_BODY;
  const mobilize = {
    phase: 'MOBILIZE_ACTIVATE',
    duration_minutes: 3,
    directive_ar: isUpper ? 
      'تفعيل الكتف والفقرات الصدرية: (Band Pull-Aparts + Thoracic Rotations)' : 
      'تليين الحوض والكاحل: (Hip 90/90 + Ankle Dorsiflexion Wall Drive)'
  };

  // Phase 3: Potentiate (Bar ramp)
  const set1Weight = bar_weight_kg; // Empty bar 20kg
  const set2Weight = Math.max(bar_weight_kg, Math.round((w * 0.50) / 2.5) * 2.5);
  const set3Weight = Math.max(bar_weight_kg, Math.round((w * 0.80) / 2.5) * 2.5);

  const potentiate = {
    phase: 'POTENTIATE',
    bar_sets: [
      { set_number: 1, weight_kg: set1Weight, reps: '6-8 عدات', note_ar: 'البار فارغ لضبط المسار' },
      { set_number: 2, weight_kg: set2Weight, reps: '4-5 عدات', note_ar: '50% من وزن التشغيل' },
      { set_number: 3, weight_kg: set3Weight, reps: 'عدة واحدة فقط (1 Rep)', note_ar: '80% من وزن التشغيل للتحفيز العصبي دون إجهاد' }
    ],
    ready_directive_ar: `ابدأ جولاتك الأساسية المسجلة بالأسفل فوراً بوزن ${w}kg بكامل طاقتك.`
  };

  return {
    working_weight_kg: w,
    split_type,
    total_warmup_duration_minutes: '8 - 10 دقائق',
    ramp_protocol: {
      raise,
      mobilize,
      potentiate
    },
    display_cue_card_ar: `بروتوكول RAMP: دقيقتان كارديو خفيف -> تليين المفاصل -> تدرج البار (${set1Weight}kg × 8 ثم ${set2Weight}kg × 5 ثم ${set3Weight}kg × 1) -> بدء جولات العمل الأساسية (${w}kg).`
  };
}



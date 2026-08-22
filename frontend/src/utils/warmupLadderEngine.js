/**
 * Warm-up Sets Ladder Engine
 * Pure Deterministic Biomechanical Warm-up Calculator
 */

export function calculateWarmupLadder(workingWeightKg = 0) {
  if (workingWeightKg <= 20) {
    return [
      { set_type: 'WARMUP_1', weight_kg: workingWeightKg, reps: 10, note_ar: 'إحماء عام بوزن خفيف وتركيز حركي' }
    ];
  }

  const roundToNearest = (val) => +(Math.round(val / 2.5) * 2.5).toFixed(1);

  return [
    {
      set_type: 'WARMUP_1',
      percentage: 50,
      weight_kg: Math.max(20, roundToNearest(workingWeightKg * 0.50)),
      reps: 8,
      note_ar: 'تهيئة المفصل وتنشيط الجهاز العصبي (راحة 60 ثانية)'
    },
    {
      set_type: 'WARMUP_2',
      percentage: 70,
      weight_kg: roundToNearest(workingWeightKg * 0.70),
      reps: 4,
      note_ar: 'رفع الجاهزية الحركية دون إنهاك (راحة 90 ثانية)'
    },
    {
      set_type: 'WARMUP_3',
      percentage: 90,
      weight_kg: roundToNearest(workingWeightKg * 0.90),
      reps: 1,
      note_ar: 'معايرة الثقل والتحكم العصبي الكامل (راحة دقيقتين قبل جولات العمل)'
    }
  ];
}

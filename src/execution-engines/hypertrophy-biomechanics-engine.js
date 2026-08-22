/**
 * Stretch-Mediated Hypertrophy & Volume Landmarks Engine
 *
 * 1. Stretch-Mediated Exercise Selection:
 *    - Prioritizes movements placing maximum mechanical tension in the lengthened position.
 * 2. Deterministic Volume Landmark Tuning (MEV/MRV Matrix):
 *    - High-Capacity Muscles (Side Delts, Rear Delts, Calves): 16 - 22 sets/week.
 *    - High-Damage/Tension Muscles (Hamstrings, Quads, Chest): 10 - 14 sets/week.
 *    - General Muscles (Back, Biceps, Triceps): 12 - 18 sets/week.
 */

export const MUSCLE_GROUPS = {
  SIDE_DELTS: 'SIDE_DELTS',
  REAR_DELTS: 'REAR_DELTS',
  CALVES: 'CALVES',
  HAMSTRINGS: 'HAMSTRINGS',
  QUADS: 'QUADS',
  CHEST: 'CHEST',
  BACK: 'BACK',
  BICEPS: 'BICEPS',
  TRICEPS: 'TRICEPS'
};

export const VOLUME_LANDMARKS = {
  [MUSCLE_GROUPS.SIDE_DELTS]: { mev_sets_week: 16, mrv_sets_week: 22, frequency_days: '3-4x', damage_profile: 'LOW_DAMAGE_FAST_RECOVERY' },
  [MUSCLE_GROUPS.REAR_DELTS]: { mev_sets_week: 16, mrv_sets_week: 22, frequency_days: '3-4x', damage_profile: 'LOW_DAMAGE_FAST_RECOVERY' },
  [MUSCLE_GROUPS.CALVES]: { mev_sets_week: 16, mrv_sets_week: 22, frequency_days: '3-4x', damage_profile: 'LOW_DAMAGE_FAST_RECOVERY' },
  [MUSCLE_GROUPS.HAMSTRINGS]: { mev_sets_week: 10, mrv_sets_week: 14, frequency_days: '2x', damage_profile: 'HIGH_DAMAGE_HIGH_STRETCH' },
  [MUSCLE_GROUPS.QUADS]: { mev_sets_week: 10, mrv_sets_week: 14, frequency_days: '2x', damage_profile: 'HIGH_DAMAGE_HIGH_TENSION' },
  [MUSCLE_GROUPS.CHEST]: { mev_sets_week: 10, mrv_sets_week: 14, frequency_days: '2x', damage_profile: 'HIGH_DAMAGE_MODERATE_STRETCH' },
  [MUSCLE_GROUPS.BACK]: { mev_sets_week: 12, mrv_sets_week: 18, frequency_days: '2-3x', damage_profile: 'MODERATE_DAMAGE' },
  [MUSCLE_GROUPS.BICEPS]: { mev_sets_week: 12, mrv_sets_week: 18, frequency_days: '2-3x', damage_profile: 'MODERATE_DAMAGE' },
  [MUSCLE_GROUPS.TRICEPS]: { mev_sets_week: 12, mrv_sets_week: 18, frequency_days: '2-3x', damage_profile: 'MODERATE_DAMAGE' }
};

export const STRETCH_MEDIATED_EXERCISE_LIBRARY = {
  [MUSCLE_GROUPS.BICEPS]: [
    { name: 'Incline Dumbbell Curl', biomechanical_benefit_ar: 'وضع البايسبس في أقصى استطالة خلف الجذع لزيادة التوتر الميكانيكي' },
    { name: 'Bayesian Cable Curl (Behind the Back)', biomechanical_benefit_ar: 'توتر متواصل عند أقصى تمدد للألياف العضلية' }
  ],
  [MUSCLE_GROUPS.TRICEPS]: [
    { name: 'Overhead Cable Triceps Extension', biomechanical_benefit_ar: 'وضع الرأس الطويل للترايسبس في أقصى استطالة عمودية' },
    { name: 'Cross-Body Incline Cable Extension', biomechanical_benefit_ar: 'محاذاة زاوية الألياف مع ذراع المقاومة' }
  ],
  [MUSCLE_GROUPS.HAMSTRINGS]: [
    { name: 'Romanian Deadlift (RDL / Dumbbell or Barbell)', biomechanical_benefit_ar: 'أقصى تحميل استطالي لأوتار ومفاصل الهامسترنجز' },
    { name: 'Seated Leg Curl', biomechanical_benefit_ar: 'استطالة أعلى للرأسين بفضل زاوية ثني الحوض 90 درجة' }
  ],
  [MUSCLE_GROUPS.QUADS]: [
    { name: 'Sissy Squat / Heel-Elevated Squat', biomechanical_benefit_ar: 'أقصى ثني للركبة واستطالة العضلة المستقيمة الفخذية' },
    { name: 'Deep Leg Press (Full Knee Flexion)', biomechanical_benefit_ar: 'تحميل آمن في قاع الحركة بدون ضغط قطني' }
  ],
  [MUSCLE_GROUPS.CHEST]: [
    { name: 'Deep Incline Dumbbell Fly-Press', biomechanical_benefit_ar: 'أقصى تمدد لألياف الصدر العلوية في أسفل المدى الحركي' },
    { name: 'Deficit Push-Up / Chest Dips', biomechanical_benefit_ar: 'تجاوز مستوى اليدين لزيادة الاستطالة السفلية' }
  ],
  [MUSCLE_GROUPS.CALVES]: [
    { name: 'Deficit Straight-Leg Calf Raise', biomechanical_benefit_ar: 'تمدد كامل لأوتار الكعب (Achilles) مع ثبات 2 ثانية في القاع' }
  ]
};

/**
 * Returns volume landmarks for a muscle group.
 */
export function getMuscleGroupVolumeLandmarks(muscleGroup) {
  const group = String(muscleGroup || '').toUpperCase();
  return VOLUME_LANDMARKS[group] || { mev_sets_week: 12, mrv_sets_week: 16, frequency_days: '2x', damage_profile: 'STANDARD' };
}

/**
 * Returns stretch-mediated exercise recommendations for a muscle group.
 */
export function getStretchMediatedExercises(muscleGroup) {
  const group = String(muscleGroup || '').toUpperCase();
  return STRETCH_MEDIATED_EXERCISE_LIBRARY[group] || [];
}

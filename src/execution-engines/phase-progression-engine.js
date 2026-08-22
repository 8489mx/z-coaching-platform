/**
 * Phase Progression State Machine (محرك الانتقال بين مراحل التحول الأربعة)
 *
 * Coordinates the 16-Week Client Transformation Mesocycle:
 *   - Phase 1 (Weeks 1-4):   BASELINE_PRIMING (طور التأسيس والتكيف الحركي)
 *   - Phase 2 (Weeks 5-10):  PROGRESSIVE_HYPERTROPHY (طور زيادة الأحمال وتدوير الكارب)
 *   - Phase 3 (Weeks 11-12): DIET_BREAK_PHASE (طور كسر الثبات وإعادة التغذية)
 *   - Phase 4 (Weeks 13-16): REVERSE_DIETING (طور الفورمة القصوى والدايت العكسي والتثبيت)
 */

export const MESOCYCLE_PHASES = {
  BASELINE_PRIMING: {
    code: 'BASELINE_PRIMING',
    name_ar: 'طور التأسيس والمعايرة العصبية',
    name_en: 'Baseline Priming & Neuromuscular Adaptation',
    week_range: [1, 4],
    rir_target: '2-3 RIR',
    carb_strategy: 'BALANCED_DEFICIT',
    cardio_strategy: 'ZONE_2_BASE (8,000 steps)',
    focus_ar: 'إتقان المسارات الحركية، ضبط حساسية الأنسولين، ومعايرة السعرات الحقيقية.'
  },
  PROGRESSIVE_HYPERTROPHY: {
    code: 'PROGRESSIVE_HYPERTROPHY',
    name_ar: 'طور زيادة الأحمال وتدوير الكارب',
    name_en: 'Progressive Hypertrophy & Fat Loss Waves',
    week_range: [5, 10],
    rir_target: '1-2 RIR',
    carb_strategy: 'CARB_CYCLING (High Carb Training / Low Carb Rest)',
    cardio_strategy: 'ZONE_2_PROGRESSIVE (10,000 steps)',
    focus_ar: 'تطبيق الزيادة الدورية في الأوزان والتكرارات مع توجيه الكارب لأيام التدريب القوية.'
  },
  DIET_BREAK_PHASE: {
    code: 'DIET_BREAK_PHASE',
    name_ar: 'طور كسر الثبات وإعادة التغذية',
    name_en: 'Diet Break & Metabolic Restoration',
    week_range: [11, 12],
    rir_target: '2 RIR',
    carb_strategy: 'MAINTENANCE_CALORIES (+350 Kcal Carbs)',
    cardio_strategy: 'MAINTENANCE_STEPS (8,000 steps)',
    focus_ar: 'إعادة شحن هرمونات الحرق (Leptin و T3) وتهدئة الكورتيزول لكسر أي ثبات وزني.'
  },
  REVERSE_DIETING: {
    code: 'REVERSE_DIETING',
    name_ar: 'طور الفورمة القصوى والدايت العكسي والتثبيت',
    name_en: 'Peak Shape, Reverse Dieting & Sustainability',
    week_range: [13, 16],
    rir_target: '1-2 RIR (Peak Intensity)',
    carb_strategy: 'REVERSE_INCREMENT (+75 to +100 Kcal weekly)',
    cardio_strategy: 'LIFESTYLE_SUSTAINABILITY',
    focus_ar: 'الخروج من العجز ورفع معدل الأيض الأساسي مع تثبيت نسبة الدهون المنخفضة للأبد.'
  }
};

/**
 * Determines the current Mesocycle Phase and tailored parameters based on week number.
 */
export function getPhaseByWeekNumber(weekNumber = 1) {
  const week = Math.max(1, Math.min(16, Number(weekNumber) || 1));

  let activePhase = MESOCYCLE_PHASES.BASELINE_PRIMING;

  if (week >= 1 && week <= 4) {
    activePhase = MESOCYCLE_PHASES.BASELINE_PRIMING;
  } else if (week >= 5 && week <= 10) {
    activePhase = MESOCYCLE_PHASES.PROGRESSIVE_HYPERTROPHY;
  } else if (week >= 11 && week <= 12) {
    activePhase = MESOCYCLE_PHASES.DIET_BREAK_PHASE;
  } else if (week >= 13 && week <= 16) {
    activePhase = MESOCYCLE_PHASES.REVERSE_DIETING;
  }

  const phaseWeekIndex = week - activePhase.week_range[0] + 1;
  const totalPhaseWeeks = activePhase.week_range[1] - activePhase.week_range[0] + 1;

  return {
    week_number: week,
    phase_code: activePhase.code,
    phase_name_ar: activePhase.name_ar,
    phase_name_en: activePhase.name_en,
    phase_progress: `الأسبوع ${phaseWeekIndex} من ${totalPhaseWeeks} في هذا الطور`,
    rir_target: activePhase.rir_target,
    carb_strategy: activePhase.carb_strategy,
    cardio_strategy: activePhase.cardio_strategy,
    clinical_focus: activePhase.focus_ar
  };
}

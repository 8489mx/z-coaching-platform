/**
 * NEAT & Step Titration Protocol Engine
 *
 * 1. Step-First Activity Escalation Hierarchy:
 *    - Level 1: Increase daily steps by +1,500 steps (e.g. 7,500 -> 9,000).
 *    - Level 2: When step ceiling reached (>= 12,000 steps) -> introduce two 25-minute Zone 2 cardio sessions.
 *    - Level 3 (Last Resort): Reduce daily calories by 150 kcal.
 *
 * 2. Cardio Ceiling Guard:
 *    - Strictly caps daily steps at 12,000 and Zone 2 cardio at 3 sessions/week to guard against muscle catabolism and systemic fatigue.
 */

export const NEAT_LEVELS = {
  LEVEL_1_STEPS_TITRATION: 'LEVEL_1_STEPS_TITRATION',
  LEVEL_2_ZONE2_CARDIO: 'LEVEL_2_ZONE2_CARDIO',
  LEVEL_3_CALORIE_DEFICIT_CUT: 'LEVEL_3_CALORIE_DEFICIT_CUT'
};

export const MAX_DAILY_STEPS_CEILING = 12000;
export const MAX_ZONE2_CARDIO_SESSIONS = 3;

/**
 * Calculates deterministic NEAT & cardio adjustment on fat-loss stall.
 */
export function calculateNeatTitrationStep({
  current_daily_steps = 7500,
  current_weekly_cardio_sessions = 0,
  current_daily_calories = 1800,
  weight_stalled_consecutive_weeks = 2
}) {
  const steps = Number(current_daily_steps) || 7500;
  const cardioSessions = Number(current_weekly_cardio_sessions) || 0;
  const calories = Number(current_daily_calories) || 1800;

  // Level 1: Steps Titration (Under 12,000 steps)
  if (steps < MAX_DAILY_STEPS_CEILING) {
    const nextSteps = Math.min(MAX_DAILY_STEPS_CEILING, steps + 1500);
    return {
      hierarchy_level: NEAT_LEVELS.LEVEL_1_STEPS_TITRATION,
      action_type: 'INCREASE_DAILY_STEPS',
      current_daily_steps: steps,
      next_daily_steps_target: nextSteps,
      steps_delta: nextSteps - steps,
      weekly_cardio_sessions: cardioSessions,
      daily_calories_target: calories,
      calories_cut_applied: 0,
      protocol_rationale_ar: `المستوى 1 (زيادة النشاط اللاإرادي NEAT): رفع مستهدف الخطوات اليومية بمقدار +${nextSteps - steps} خطوة لتصبح (${nextSteps} خطوة/يوم) لتنشيط الحرق دون تقليل الأكل أو إجهاد المفاصل.`
    };
  }

  // Level 2: Zone 2 Cardio (Steps already at 12,000, Cardio < 3)
  if (cardioSessions < MAX_ZONE2_CARDIO_SESSIONS) {
    const nextCardioSessions = Math.min(MAX_ZONE2_CARDIO_SESSIONS, cardioSessions + 2);
    return {
      hierarchy_level: NEAT_LEVELS.LEVEL_2_ZONE2_CARDIO,
      action_type: 'ADD_ZONE2_CARDIO',
      current_daily_steps: steps,
      next_daily_steps_target: steps,
      steps_delta: 0,
      weekly_cardio_sessions: nextCardioSessions,
      daily_calories_target: calories,
      calories_cut_applied: 0,
      protocol_rationale_ar: `المستوى 2 (بلوغ سقف الخطوات 12,000): إدراج ${nextCardioSessions} جلسات كارديو زون 2 أسبوعياً (25 دقيقة للجلسة) لزيادة حرق الدهون النقي دون التأثير على الاستشفاء العضلي.`
    };
  }

  // Level 3: Calorie Cut as Last Resort (Steps at 12,000 AND Cardio at Max 3)
  const nextCalories = Math.max(1200, calories - 150);
  return {
    hierarchy_level: NEAT_LEVELS.LEVEL_3_CALORIE_DEFICIT_CUT,
    action_type: 'REDUCE_CALORIES_LAST_RESORT',
    current_daily_steps: steps,
    next_daily_steps_target: steps,
    steps_delta: 0,
    weekly_cardio_sessions: cardioSessions,
    daily_calories_target: nextCalories,
    calories_cut_applied: 150,
    protocol_rationale_ar: `المستوى 3 (المعايرة المتقدمة بعد استيفاء مستهدفات النشاط والكارديو): خفض السعرات بمقدار -150 سعرة حرارية لتصبح (${nextCalories} Kcal) لكسر ثبات الوزن واستئناف النزول.`
  };
}

/**
 * Rebuilds an evaluateCheckin input from a stored check-in row plus its
 * predecessor, for measurement corrections (P1-B10). The correction handler
 * updates the row first, then re-runs the evaluation on the corrected
 * numbers so the stored analysis stops describing numbers that no longer
 * exist. Fields the row never stored (free-text notes, cardiac inputs)
 * are left empty here; the caller must preserve any safety lock the
 * original analysis carried, because a weight typo fix must never clear
 * a cardiac or clinical lockout.
 */
function parseAnalysisOutput(row) {
  if (!row) return {};
  if (typeof row.analysis_output === "string") {
    try { return JSON.parse(row.analysis_output); } catch { return {}; }
  }
  return row.analysis_output || {};
}

export function buildReevaluationInput({ checkin = {}, prevCheckin = null, primaryGoal = null, isFemale = false } = {}) {
  const prevAnalysis = parseAnalysisOutput(prevCheckin);
  const ownAnalysis = parseAnalysisOutput(checkin);
  return {
    primary_goal: primaryGoal,
    is_female: isFemale,
    weight_kg: checkin.average_weight_kg,
    daily_weights_kg: Array.isArray(checkin.daily_weights_kg) ? checkin.daily_weights_kg : undefined,
    previous_weight_kg: prevCheckin ? prevCheckin.average_weight_kg : null,
    previous_week_average_weight_kg: prevCheckin ? prevCheckin.average_weight_kg : null,
    waist_circumference_cm: checkin.waist_circumference_cm ?? null,
    previous_waist_circumference_cm: prevCheckin ? prevCheckin.waist_circumference_cm ?? null : null,
    hip_circumference_cm: ownAnalysis.hip_circumference_cm ?? null,
    previous_hip_circumference_cm: prevAnalysis.hip_circumference_cm ?? null,
    nutrition_adherence_percent: checkin.nutrition_adherence_percent,
    workouts_completed: checkin.workouts_completed,
    workouts_scheduled: checkin.workouts_scheduled,
    biofeedback: checkin.biofeedback || {},
    pain_reports: Array.isArray(checkin.pain_reports) ? checkin.pain_reports : [],
    lifestyle_variance: checkin.lifestyle_variance,
    bowel_regularity: checkin.bowel_regularity,
    sleep_stress_composite: checkin.sleep_stress_composite,
    menstrual_phase: checkin.menstrual_phase,
    next_week_travel: checkin.next_week_travel,
    next_week_gym_available: checkin.next_week_gym_available,
    next_week_realistic_days: checkin.next_week_realistic_days,
  };
}

/**
 * Adaptive (observed) energy expenditure from real check-in data.
 *
 * Energy balance: intake - expenditure = change in body energy stores. Over a few weeks the weekly
 * weight trend (least-squares slope of the weekly average weights) converts to an energy balance at
 * ~7700 kcal per kg of tissue (Hall 2008; Thomas et al. 2014), so
 *
 *   observed TDEE = mean daily intake - (weight slope kg/week x 7700 / 7)
 *
 * This replaces the prediction formulas (Mifflin-St Jeor / Katch-McArdle, error +-10-15% per person) as
 * soon as enough reliable weeks exist, the same principle used by expenditure-tracking apps.
 *
 * Intake per week: the client's reported average daily calories when given; otherwise the planned target
 * for weeks with adherence >= 80% (lower-adherence weeks without a report are excluded, their intake is
 * unknown). Weekly weights are the average of the daily morning weigh-ins when provided.
 */

export const KCAL_PER_KG_TISSUE = 7700;
export const MIN_WEIGHT_POINTS = 3; // 3 weekly averages = 2 weeks of trend
export const MAX_WEIGHT_POINTS = 5; // last 4 weeks of trend
export const RELIABLE_ADHERENCE_PERCENT = 80;
export const MAX_WEEKLY_TARGET_STEP_KCAL = 150;
export const MAX_DEVIATION_FROM_FORMULA = 0.3;
// Check-ins come every week (MAX) or every two weeks (ELITE). A longer gap is a break: what the
// client ate in it is unknown, so the trend starts again after it.
export const MAX_GAP_WEEKS = 2;

const GOAL_ENERGY_FACTOR = Object.freeze({
  FAT_LOSS: 0.8,
  BODY_RECOMPOSITION: 0.9,
  MUSCLE_GAIN: 1.1,
  WEIGHT_MAINTENANCE: 1.0,
  GENERAL_HEALTH: 1.0,
  PERFORMANCE: 1.0,
});

function slopePerWeek(points) {
  // points: [{ week, weight }], least squares slope in kg per week
  const n = points.length;
  const meanX = points.reduce((s, p) => s + p.week, 0) / n;
  const meanY = points.reduce((s, p) => s + p.weight, 0) / n;
  let num = 0;
  let den = 0;
  for (const p of points) {
    num += (p.week - meanX) * (p.weight - meanY);
    den += (p.week - meanX) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

function weekIntake(week) {
  const reported = Number(week.reported_intake_kcal);
  if (Number.isFinite(reported) && reported >= 800 && reported <= 6000) return { kcal: reported, source: "REPORTED" };
  const planned = Number(week.planned_target_kcal);
  const adherence = Number(week.adherence_percent);
  if (Number.isFinite(planned) && planned > 0 && Number.isFinite(adherence) && adherence >= RELIABLE_ADHERENCE_PERCENT) {
    return { kcal: planned, source: "PLANNED_HIGH_ADHERENCE" };
  }
  return null;
}

/**
 * @param {Object} input
 * @param {Array<{week_number:number, average_weight_kg:number, adherence_percent?:number, planned_target_kcal?:number, reported_intake_kcal?:number}>} input.weeks
 *   check-ins in any order (week_number orders them).
 * @param {number} input.formula_tdee_kcal       TDEE from the prediction formula (fallback and sanity anchor).
 * @param {number} input.current_target_kcal     calories currently prescribed.
 * @param {string} [input.primary_goal]          canonical goal (FAT_LOSS, MUSCLE_GAIN, ...); BODY_RECOMPOSITION allowed.
 * @param {boolean} [input.is_female]
 */
export function estimateAdaptiveTdee({ weeks = [], formula_tdee_kcal, current_target_kcal, primary_goal = null, is_female = false } = {}) {
  const formulaTdee = Number(formula_tdee_kcal);
  const currentTarget = Number(current_target_kcal);
  const base = {
    ready: false,
    source: "FORMULA",
    formula_tdee_kcal: Number.isFinite(formulaTdee) ? Math.round(formulaTdee) : null,
    observed_tdee_kcal: null,
    weight_trend_kg_per_week: null,
    mean_intake_kcal: null,
    weeks_used: 0,
    intake_sources: [],
    recommended_target_kcal: Number.isFinite(currentTarget) ? Math.round(currentTarget) : null,
    calorie_delta: 0,
    clamped: false,
    reason_ar: null,
  };

  const valid = weeks
    .filter((w) => Number.isFinite(Number(w.average_weight_kg)) && Number(w.average_weight_kg) > 20 && Number.isFinite(Number(w.week_number)))
    .sort((a, b) => Number(a.week_number) - Number(b.week_number));
  // Only the unbroken run of check-ins that ends with this one: a month off the plan followed by a
  // return would otherwise read as "gained weight while eating the target" and cut the calories.
  let runStart = valid.length - 1;
  while (runStart > 0 && Number(valid[runStart].week_number) - Number(valid[runStart - 1].week_number) <= MAX_GAP_WEEKS) runStart--;
  const ordered = valid.slice(Math.max(0, runStart)).slice(-MAX_WEIGHT_POINTS);

  if (ordered.length < MIN_WEIGHT_POINTS) {
    return Object.freeze({ ...base, reason_ar: `يلزم ${MIN_WEIGHT_POINTS} متابعات أسبوعية على الأقل لحساب الحرق الفعلي (المتوفر: ${ordered.length}). السعرات الحالية مبنية على المعادلة.` });
  }

  // Intake of the weeks that produced the weight change (every week after the first point).
  const intakes = ordered.slice(1).map(weekIntake);
  if (intakes.some((i) => i === null)) {
    return Object.freeze({ ...base, weeks_used: ordered.length, reason_ar: "أسبوع أو أكثر بدون بيانات أكل موثوقة (التزام أقل من 80% بدون تسجيل السعرات)، لذلك لم يُحسب الحرق الفعلي هذا الأسبوع." });
  }

  const points = ordered.map((w) => ({ week: Number(w.week_number), weight: Number(w.average_weight_kg) }));
  const trend = slopePerWeek(points);
  const meanIntake = intakes.reduce((s, i) => s + i.kcal, 0) / intakes.length;
  let observed = meanIntake - (trend * KCAL_PER_KG_TISSUE) / 7;

  // Reject physiologically implausible readings (water swings, scale errors) by anchoring to the formula.
  let clamped = false;
  if (Number.isFinite(formulaTdee) && formulaTdee > 0) {
    const low = formulaTdee * (1 - MAX_DEVIATION_FROM_FORMULA);
    const high = formulaTdee * (1 + MAX_DEVIATION_FROM_FORMULA);
    if (observed < low || observed > high) {
      observed = Math.min(high, Math.max(low, observed));
      clamped = true;
    }
  }

  const goal = String(primary_goal || "FAT_LOSS").toUpperCase();
  const factor = GOAL_ENERGY_FACTOR[goal] ?? GOAL_ENERGY_FACTOR.FAT_LOSS;
  const floor = is_female ? 1200 : 1500;
  let ideal = observed * factor;
  if (ideal < floor) ideal = Math.min(observed, floor);

  // Move at most MAX_WEEKLY_TARGET_STEP_KCAL per check-in so one noisy week cannot swing the plan.
  const anchor = Number.isFinite(currentTarget) ? currentTarget : ideal;
  const step = Math.max(-MAX_WEEKLY_TARGET_STEP_KCAL, Math.min(MAX_WEEKLY_TARGET_STEP_KCAL, ideal - anchor));
  const recommended = Math.round(anchor + step);

  return Object.freeze({
    ...base,
    ready: true,
    source: "OBSERVED",
    observed_tdee_kcal: Math.round(observed),
    weight_trend_kg_per_week: Math.round(trend * 100) / 100,
    mean_intake_kcal: Math.round(meanIntake),
    weeks_used: ordered.length,
    intake_sources: intakes.map((i) => i.source),
    recommended_target_kcal: recommended,
    calorie_delta: recommended - Math.round(anchor),
    clamped,
    reason_ar: `الحرق الفعلي المحسوب من استجابة جسمك: ${Math.round(observed)} سعرة يومياً (متوسط أكل ${Math.round(meanIntake)} سعرة، واتجاه الوزن ${(Math.round(trend * 100) / 100)} كجم أسبوعياً على ${ordered.length} متابعات)${clamped ? "، مع تقييده بحدود 30% من المعادلة لاستبعاد تذبذب الماء" : ""}. السعرات المستهدفة الجديدة ${recommended} سعرة (تعديل بحد أقصى ${MAX_WEEKLY_TARGET_STEP_KCAL} سعرة أسبوعياً).`,
  });
}

/**
 * Adaptive (observed) energy expenditure from real check-in data.
 *
 * Energy balance: intake - expenditure = change in body energy stores. Over a few weeks the weekly
 * weight trend (Theil-Sen slope of the weekly weights — the median of all
 * pairwise slopes, so one bad weigh-in cannot drag the trend) converts to
 * an energy balance at ~7700 kcal per kg of tissue (Hall 2008; Thomas et
 * al. 2014), so
 *
 *   observed TDEE = mean daily intake - (weight slope kg/week x 7700 / 7)
 *
 * This replaces the prediction formulas (Mifflin-St Jeor / Katch-McArdle, error +-10-15% per person) as
 * soon as enough reliable weeks exist, the same principle used by expenditure-tracking apps.
 *
 * Intake per week: the client's reported average daily calories when given
 * AND the week's adherence is >= 80% (a report from a week the client did
 * not follow is not reliable intake — it is flagged as a disagreement and
 * the week contributes no intake); otherwise the planned target for weeks
 * with adherence >= 80% (lower-adherence weeks without a reliable report
 * are excluded, their intake is unknown). Weekly weights are the median of
 * the daily morning weigh-ins when provided.
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
  // points: [{ week, weight }]. Theil-Sen slope in kg per week: the median
  // of all pairwise slopes. Least squares let one bad weigh-in (a water
  // drop, a scale error) drag the whole trend and move the next target by
  // the full step; a single outlier can move at most half the pairwise
  // slopes, so the median stays near the true trend. On clean linear data
  // Theil-Sen equals least squares exactly.
  const slopes = [];
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const dx = points[j].week - points[i].week;
      if (dx !== 0) slopes.push((points[j].weight - points[i].weight) / dx);
    }
  }
  if (slopes.length === 0) return 0;
  slopes.sort((a, b) => a - b);
  const mid = Math.floor(slopes.length / 2);
  return slopes.length % 2 === 1 ? slopes[mid] : (slopes[mid - 1] + slopes[mid]) / 2;
}

function weekIntake(week) {
  // P1-B10: a reported intake is trusted only when the week's adherence
  // is reliable (>= 80%). A client at 40% adherence reporting 1200 kcal
  // while their weight is flat is not eating 1200 — the report disagrees
  // with the adherence signal, so the week contributes no intake and the
  // trend waits for reliable weeks instead of cutting on a false deficit.
  const reported = Number(week.reported_intake_kcal);
  const adherence = Number(week.adherence_percent);
  const adherenceReliable = Number.isFinite(adherence) && adherence >= RELIABLE_ADHERENCE_PERCENT;
  if (Number.isFinite(reported) && reported >= 800 && reported <= 6000 && adherenceReliable) {
    return { kcal: reported, source: "REPORTED" };
  }
  const planned = Number(week.planned_target_kcal);
  if (Number.isFinite(planned) && planned > 0 && adherenceReliable) {
    return { kcal: planned, source: "PLANNED_HIGH_ADHERENCE" };
  }
  return null;
}

// Weeks whose in-range reported intake was refused for low adherence: the
// disagreement is named in the not-ready reason so the coach sees WHY the
// trend paused instead of a generic "no reliable data" message.
function intakeDisagreementWeeks(weeks) {
  return weeks
    .filter((w) => {
      const reported = Number(w.reported_intake_kcal);
      const adherence = Number(w.adherence_percent);
      return Number.isFinite(reported) && reported >= 800 && reported <= 6000
        && !(Number.isFinite(adherence) && adherence >= RELIABLE_ADHERENCE_PERCENT);
    })
    .map((w) => Number(w.week_number));
}

/**
 * @param {Object} input
 * @param {Array<{week_number:number, average_weight_kg:number, adherence_percent?:number, planned_target_kcal?:number, reported_intake_kcal?:number}>} input.weeks
 *   check-ins in any order (week_number orders them).
 * @param {number} input.formula_tdee_kcal       TDEE from the prediction formula (fallback and sanity anchor).
 * @param {number} input.current_target_kcal     calories currently prescribed.
 * @param {string} input.primary_goal          canonical goal (FAT_LOSS, MUSCLE_GAIN, ...); BODY_RECOMPOSITION allowed.
 *   Required for a recommendation — a missing or unknown goal refuses
 *   (ready: false) instead of silently applying fat-loss factors (B3-1 #33).
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
    intake_disagreement_weeks: [],
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
    const disagreementWeeks = intakeDisagreementWeeks(ordered.slice(1));
    return Object.freeze({
      ...base,
      weeks_used: ordered.length,
      intake_disagreement_weeks: disagreementWeeks,
      reason_ar: disagreementWeeks.length > 0
        ? `تسجيل سعرات (أسبوع ${disagreementWeeks.join("، ")}) مع التزام أقل من 80% غير موثوق — الرقم لا يتفق مع الالتزام — لذلك لم يُحسب الحرق الفعلي هذا الأسبوع حتى تتوفر أسابيع موثوقة.`
        : "أسبوع أو أكثر بدون بيانات أكل موثوقة (التزام أقل من 80% بدون تسجيل سعرات)، لذلك لم يُحسب الحرق الفعلي هذا الأسبوع.",
    });
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

  // B3-1 (#33): the goal is required for a recommendation. A missing or
  // unknown goal used to silently fall back to FAT_LOSS factors (0.8), so a
  // caller with no goal got a fat-loss cut it never asked for. Refuse
  // instead: report the measured burn but recommend nothing, so the current
  // target is kept and the coach sees why.
  const rawGoal = typeof primary_goal === "string" ? primary_goal.trim().toUpperCase() : "";
  const factor = GOAL_ENERGY_FACTOR[rawGoal];
  if (factor === undefined) {
    return Object.freeze({
      ...base,
      ready: false,
      observed_tdee_kcal: Math.round(observed),
      weight_trend_kg_per_week: Math.round(trend * 100) / 100,
      mean_intake_kcal: Math.round(meanIntake),
      weeks_used: ordered.length,
      intake_sources: intakes.map((i) => i.source),
      clamped,
      reason_ar: "الهدف غير محدد أو غير معروف — لا يمكن حساب السعرات المستهدفة من الحرق الفعلي بدون هدف معلن، لذلك بقيت السعرات الحالية كما هي.",
    });
  }
  const floor = is_female ? 1200 : 1500;
  let ideal = observed * factor;
  if (ideal < floor) ideal = floor;

  // Move at most MAX_WEEKLY_TARGET_STEP_KCAL per check-in so one noisy week cannot swing the plan.
  const anchor = Number.isFinite(currentTarget) ? currentTarget : ideal;
  const step = Math.max(-MAX_WEEKLY_TARGET_STEP_KCAL, Math.min(MAX_WEEKLY_TARGET_STEP_KCAL, ideal - anchor));
  const recommended = Math.max(floor, Math.round(anchor + step));

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

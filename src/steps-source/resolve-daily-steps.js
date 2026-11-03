// Single source of truth for daily step numbers (P1-B1).
//
// The same client used to yield a different step number in every layer:
// the adapter guessed from daily activity (6500, or 4500/6500/8500/12500),
// the master engine and two controllers silently fell back to 6000, the
// merge and auto-apply fell back to 8000, and the card showed 10000 or a
// generic "daily walking" text. Every layer below reads from here instead.
//
// Unknown steps stay unknown (null). Nothing in this module invents a step
// count: no activity-map guess, no 6000/6500/8000 fallback. Callers that
// need a number for an unknown client use the conservative factor or the
// minimum target below, and say so.

// Client-reported bands from the intake form (midpoints of the form bands).
// A band is the client's own answer, so it counts as known (approximate).
export const FORM_DAILY_STEPS = Object.freeze({
  under_3000: 2500,
  "3000_6000": 4500,
  "6000_9000": 7500,
  over_9000: 10500,
});

const MIN_KNOWN_STEPS = 1000;
const MAX_KNOWN_STEPS = 30000;

function clampKnownSteps(value) {
  return Math.min(MAX_KNOWN_STEPS, Math.max(MIN_KNOWN_STEPS, value));
}

/**
 * Resolve one daily step number from the intake.
 * Priority: an explicitly reported number wins, then the client's form band,
 * then unknown (null) — never a guessed number.
 *
 * @param {{ averageDailySteps?: number|null, formBand?: string|null }} input
 * @returns {{ value: number|null, known: boolean, source: "REPORTED"|"FORM_BAND"|"UNKNOWN" }}
 */
export function resolveDailySteps(input = {}) {
  const reported = Number(input.averageDailySteps);
  if (Number.isFinite(reported) && reported > 0) {
    return { value: clampKnownSteps(reported), known: true, source: "REPORTED" };
  }
  const band =
    FORM_DAILY_STEPS[String(input.formBand || "").trim().toLowerCase()];
  if (band) {
    return { value: band, known: true, source: "FORM_BAND" };
  }
  return { value: null, known: false, source: "UNKNOWN" };
}

// The master engine's own TDEE activity ladder, keyed by step band.
// Unknown steps take the sedentary floor (1.20) — the codebase's existing
// conservative default — instead of the old silent 6000 (which scored 1.35).
export function stepsActivityFactor(steps) {
  if (steps === null || steps === undefined) return 1.2;
  if (steps >= 12000) return 1.7;
  if (steps >= 8000) return 1.5;
  if (steps >= 5000) return 1.35;
  return 1.2;
}

// The same ladder, keyed by reported daily activity. VERY_ACTIVE is capped
// at the engine's maximum (1.70); unknown activity contributes nothing.
export const ACTIVITY_LEVEL_FACTOR = Object.freeze({
  SEDENTARY: 1.2,
  LIGHT: 1.35,
  MODERATE: 1.5,
  HIGH: 1.7,
  VERY_ACTIVE: 1.7,
  VERY_HIGH: 1.7,
});

/**
 * One TDEE activity factor from both signals: the steps band and the
 * reported daily activity, taking the higher of the two so neither signal
 * is ignored. Unknown steps fall back to the sedentary floor; unknown
 * activity adds nothing.
 */
export function resolveTdeeActivityFactor(input = {}) {
  const fromSteps = stepsActivityFactor(input.steps);
  const fromActivity =
    ACTIVITY_LEVEL_FACTOR[String(input.dailyActivity || "").toUpperCase()] ??
    null;
  return fromActivity === null ? fromSteps : Math.max(fromSteps, fromActivity);
}

// Minimum daily movement target. Source: the codebase's own low-movement
// threshold (CardioPolicy.LOW_DAILY_STEPS_THRESHOLD = 5000 in the decision
// rules): below 5000 is "low daily movement" by the system's own definition,
// so the minimum target that lifts a client out of "low" is 5000. This is a
// floor for the prescription, not a clinical prescription for any individual.
export const MINIMUM_STEP_TARGET = 5000;

/**
 * One prescribed daily step target: the client's own baseline when known,
 * lifted to the minimum floor when low or unknown.
 */
export function resolveStepTarget(baselineSteps) {
  const baseline = Number(baselineSteps);
  const known =
    Number.isFinite(baseline) && baseline > 0 ? clampKnownSteps(baseline) : 0;
  return Math.max(known, MINIMUM_STEP_TARGET);
}

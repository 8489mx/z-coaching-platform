// P1-B8: cardio progression. The prescription dose (max_duration_minutes) is
// a CEILING, not a starting dose: week 1 starts below it, builds to it by
// week 3, deloads in week 4, then repeats in 4-week blocks. Nothing here ever
// exceeds the prescribed ceiling, and no week drops below the unified 15-minute
// minimum effective LISS dose (CardioPrescriptionPolicy.MIN_LISS_DURATION_MINUTES).
// The horizon defaults to 5 weeks to mirror the training mesocycle default.
// Pure module, zero imports.

const MIN_LISS_DURATION_MINUTES = 15;

// Weeks 1-3 of each 4-week block: 80%, 90%, 100% of the prescribed ceiling.
const RAMP_FACTORS = Object.freeze([0.8, 0.9, 1.0]);
// Week 4 of each block: deload to 70% of the ceiling (floored at 15).
const DELOAD_FACTOR = 0.7;
const BLOCK_LENGTH = 4;

function scaledDuration(baseDurationMinutes, factor) {
  return Math.max(
    MIN_LISS_DURATION_MINUTES,
    Math.round(baseDurationMinutes * factor),
  );
}

/**
 * @param {Object} input
 * @param {number} input.baseDurationMinutes the prescribed per-session ceiling
 * @param {string} input.intensity session intensity (carried unchanged; LISS ramps duration only)
 * @param {number} input.sessionsPerWeek sessions per week (carried unchanged)
 * @param {number} [input.totalWeeks=5] horizon in weeks (mesocycle default)
 * @returns {Array<{week_number:number,duration_minutes:number,intensity:string,sessions_per_week:number,is_deload:boolean}>}
 */
export function buildCardioProgression({
  baseDurationMinutes,
  intensity,
  sessionsPerWeek,
  totalWeeks = 5,
}) {
  const weeks = [];
  const count = Math.max(1, Math.min(12, Number(totalWeeks) || 5));
  for (let week = 1; week <= count; week++) {
    const position = (week - 1) % BLOCK_LENGTH;
    const isDeload = position === BLOCK_LENGTH - 1;
    const factor = isDeload ? DELOAD_FACTOR : RAMP_FACTORS[position];
    weeks.push({
      week_number: week,
      duration_minutes: scaledDuration(baseDurationMinutes, factor),
      intensity,
      sessions_per_week: sessionsPerWeek,
      is_deload: isDeload,
    });
  }
  return Object.freeze(weeks);
}

/** Week-1 dose: 80% of the prescribed ceiling, floored at the 15-minute minimum. */
export function weekOneDuration(baseDurationMinutes) {
  return scaledDuration(baseDurationMinutes, RAMP_FACTORS[0]);
}

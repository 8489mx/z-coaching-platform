// Diet-break state (H1: diet-break ratchet, CB1-CB6 + CB4).
//
// One small, pure state machine carried inside the stored program
// (`program_data.adaptation_state`). It is the only memory the engine has
// of a diet break: the check-in streak is counted from stored check-ins
// and nothing ever reset it, so approving a break proposed another one
// every week forever. This state is what ends the break, returns the
// client to deficit, and stops the next break until a fresh compliant
// streak has been earned.
//
// Shape (all fields optional; a missing state means "no break ever"):
//   {
//     diet_break: {
//       status: "NONE" | "ACTIVE" | "COMPLETED",
//       started_week: number | null,          // check-in week the break was approved
//       pre_break_calories_kcal: number | null,
//       pre_break_macros: { protein_g, carbohydrate_g, fat_g } | null,
//       maintenance_calories_kcal: number | null,
//       deficit_weeks_since_break: number,    // compliant deficit weeks since the break ended
//     },
//     last_adapted_calories_kcal: number | null,
//     last_adapted_macros: { protein_g, carbohydrate_g, fat_g } | null,
//     formula_calories_at_adaptation_kcal: number | null,
//     calorie_offset_kcal: number,            // last non-break adapted target minus its formula target
//     coach_step_target: number | null,       // coach-set daily step target (CB7)
//   }
//
// Rules:
// - A break lasts exactly one week (DIET_BREAK_WEEKS = 1), as the
//   coach-facing message promises. The week after approval the client
//   returns to the pre-break deficit automatically.
// - "Maintenance" is the observed TDEE (or the formula TDEE when no
//   observed value is ready yet). It is never base + 350: the old
//   `observed > base` test failed once base had been set to observed
//   (equal, not greater), so every following week added +350.
// - Only a client in a deficit is eligible: FAT_LOSS and
//   BODY_RECOMPOSITION. A muscle-gain client is already in surplus; a
//   maintenance client is already at maintenance. Neither gets a break.
// - After a break ends, a fresh streak of DIET_BREAK_MIN_STREAK
//   compliant deficit weeks is required before the next break.

export const DIET_BREAK_WEEKS = 1;
export const DIET_BREAK_MIN_STREAK = 6;
export const DIET_BREAK_COOLDOWN_WEEKS = 6;

export const DIET_BREAK_ELIGIBLE_GOALS = Object.freeze([
  "FAT_LOSS",
  "BODY_RECOMPOSITION",
]);

export function normalizeGoal(value) {
  const goal = String(value ?? "").trim().toUpperCase();
  if (goal === "LEAN_BULK") return "MUSCLE_GAIN";
  if (goal === "MAINTENANCE" || goal === "WEIGHT_MAINTENANCE") return "WEIGHT_MAINTENANCE";
  return goal || null;
}

export function isDietBreakGoalEligible(goal) {
  return DIET_BREAK_ELIGIBLE_GOALS.includes(normalizeGoal(goal));
}

/** Read the adaptation state off a stored program (never throws, never invents). */
export function readAdaptationState(program = {}) {
  const raw = program?.adaptation_state;
  const state = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const dietBreak = state.diet_break && typeof state.diet_break === "object" ? state.diet_break : {};
  const finiteOrNull = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : null);
  return {
    diet_break: {
      status: ["ACTIVE", "COMPLETED"].includes(dietBreak.status) ? dietBreak.status : "NONE",
      started_week: Number.isFinite(Number(dietBreak.started_week)) ? Number(dietBreak.started_week) : null,
      pre_break_calories_kcal: finiteOrNull(dietBreak.pre_break_calories_kcal),
      pre_break_macros: dietBreak.pre_break_macros && typeof dietBreak.pre_break_macros === "object"
        ? {
            protein_g: finiteOrNull(dietBreak.pre_break_macros.protein_g),
            carbohydrate_g: finiteOrNull(dietBreak.pre_break_macros.carbohydrate_g),
            fat_g: finiteOrNull(dietBreak.pre_break_macros.fat_g),
          }
        : null,
      maintenance_calories_kcal: finiteOrNull(dietBreak.maintenance_calories_kcal),
      deficit_weeks_since_break: Number.isFinite(Number(dietBreak.deficit_weeks_since_break))
        ? Math.max(0, Math.floor(Number(dietBreak.deficit_weeks_since_break)))
        : 0,
    },
    last_adapted_calories_kcal: finiteOrNull(state.last_adapted_calories_kcal),
    last_adapted_macros: state.last_adapted_macros && typeof state.last_adapted_macros === "object"
      ? {
          protein_g: finiteOrNull(state.last_adapted_macros.protein_g),
          carbohydrate_g: finiteOrNull(state.last_adapted_macros.carbohydrate_g),
          fat_g: finiteOrNull(state.last_adapted_macros.fat_g),
        }
      : null,
    formula_calories_at_adaptation_kcal: finiteOrNull(state.formula_calories_at_adaptation_kcal),
    calorie_offset_kcal: Number.isFinite(Number(state.calorie_offset_kcal)) ? Number(state.calorie_offset_kcal) : 0,
    coach_step_target: finiteOrNull(state.coach_step_target),
    // B5-1 (#18 Option A): the latest measured check-in fatigue score,
    // stored by the adaptation engine so a regeneration can deload on it.
    // A missing score reads as null and falls through to the experience
    // heuristic, exactly as before. (finiteOrNull maps 0 to null, same as
    // the other fields; a 0 behaves exactly as absent in the mesocycle,
    // since 0 >= 7 is false, so nothing is lost.)
    accumulated_fatigue_score: finiteOrNull(state.accumulated_fatigue_score),
  };
}

/**
 * True maintenance for a diet break: the observed TDEE when it is ready
 * (even when it equals the current base — equality is maintenance, not a
 * reason to add 350), else the formula TDEE, else the current base.
 * Never base + 350: that fallback is the ratchet.
 */
export function resolveDietBreakMaintenance({ observedTdeeKcal = null, observedReady = false, planTdeeKcal = null, baseEnergyKcal = null } = {}) {
  const observed = Number(observedTdeeKcal);
  if (observedReady && Number.isFinite(observed) && observed > 0) return Math.round(observed);
  const plan = Number(planTdeeKcal);
  if (Number.isFinite(plan) && plan > 0) return Math.round(plan);
  const base = Number(baseEnergyKcal);
  if (Number.isFinite(base) && base > 0) return Math.round(base);
  return null;
}

/**
 * Is a NEW diet break eligible this week? The streak alone is not
 * enough: the goal must be a deficit goal, no break may be active, and
 * a previous break must be followed by a fresh compliant streak.
 */
export function isNewDietBreakEligible({ goal = null, consecutiveHighComplianceWeeks = 0, adaptationState = null, forced = false } = {}) {
  if (!isDietBreakGoalEligible(goal)) return false;
  const state = adaptationState || readAdaptationState({});
  if (state.diet_break.status === "ACTIVE") return false;
  if (state.diet_break.status === "COMPLETED") {
    const sinceBreak = state.diet_break.deficit_weeks_since_break;
    const streak = Number(consecutiveHighComplianceWeeks) || 0;
    // The streak counted from check-ins never resets, so the state is
    // the reset: a new break needs a full fresh streak AFTER the last
    // break ended, counted in deficit weeks since the break.
    if (sinceBreak < DIET_BREAK_COOLDOWN_WEEKS) return false;
    if (streak < DIET_BREAK_MIN_STREAK) return false;
    return true;
  }
  if (forced) return true;
  return (Number(consecutiveHighComplianceWeeks) || 0) >= DIET_BREAK_MIN_STREAK;
}

/** State to store when a diet break is approved this week. */
export function startDietBreakState({ state = null, currentWeekNumber = 1, baseCaloriesKcal = null, baseMacros = null, maintenanceCaloriesKcal = null } = {}) {
  const prev = state || readAdaptationState({});
  return {
    ...prev,
    diet_break: {
      status: "ACTIVE",
      started_week: Number(currentWeekNumber) || 1,
      pre_break_calories_kcal: baseCaloriesKcal,
      pre_break_macros: baseMacros,
      maintenance_calories_kcal: maintenanceCaloriesKcal,
      deficit_weeks_since_break: 0,
    },
  };
}

/** State to store when the break week is over: back to the pre-break deficit. */
export function endDietBreakState({ state = null, resumedCaloriesKcal = null, resumedMacros = null } = {}) {
  const prev = state || readAdaptationState({});
  const resumedKcal = resumedCaloriesKcal ?? prev.diet_break.pre_break_calories_kcal;
  const ended = {
    ...prev,
    diet_break: {
      status: "COMPLETED",
      started_week: prev.diet_break.started_week,
      pre_break_calories_kcal: resumedKcal,
      pre_break_macros: resumedMacros ?? prev.diet_break.pre_break_macros,
      maintenance_calories_kcal: prev.diet_break.maintenance_calories_kcal,
      deficit_weeks_since_break: 0,
    },
    // The resumed deficit is the last adapted (non-break) target, so a
    // later regeneration starts from it instead of the formula target.
    last_adapted_calories_kcal: resumedKcal ?? prev.last_adapted_calories_kcal,
    last_adapted_macros: resumedMacros ?? prev.last_adapted_macros,
  };
  if (Number.isFinite(ended.last_adapted_calories_kcal) && Number.isFinite(prev.calorie_offset_kcal)) {
    ended.formula_calories_at_adaptation_kcal = Math.round(ended.last_adapted_calories_kcal - prev.calorie_offset_kcal);
  }
  return ended;
}

/** Advance the post-break deficit counter by one compliant week (no break this week). */
export function advanceDeficitWeeksSinceBreak(state = null) {
  const prev = state || readAdaptationState({});
  if (prev.diet_break.status !== "COMPLETED") return prev;
  return {
    ...prev,
    diet_break: {
      ...prev.diet_break,
      deficit_weeks_since_break: prev.diet_break.deficit_weeks_since_break + 1,
    },
  };
}

/**
 * Preserved calorie offset for a regeneration (CB4): the difference
 * between the last adapted non-break target and the formula target it
 * was adapted from. A diet-break week stores no offset (maintenance is
 * not a new baseline), so a regeneration never bakes a break into the
 * client's permanent target.
 */
export function preservedCalorieOffset(state = null) {
  const s = state || readAdaptationState({});
  if (!Number.isFinite(s.last_adapted_calories_kcal) || !Number.isFinite(s.formula_calories_at_adaptation_kcal)) return 0;
  return Math.round(s.last_adapted_calories_kcal - s.formula_calories_at_adaptation_kcal);
}

/** A step target is valid when it is a whole number inside the known human range. */
export function validateStepTarget(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return null;
  if (n < 1000 || n > 30000) return null;
  return n;
}

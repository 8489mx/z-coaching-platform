/**
 * Self-reported workout completion vs actually logged sessions.
 *
 * The check-in asks "how many workouts did you complete", and the app also
 * holds real workout logs. When both exist they must agree: a client who
 * reports four sessions but logged none (or logged more than reported) has
 * numbers that contradict each other, and the contradiction goes to coach
 * review instead of silently feeding the evaluation. When no logs exist at
 * all, there is nothing to cross-check, so the report stands as-is.
 */
export function compareWorkoutCompletion({ reported = null, logged = null } = {}) {
  // Explicit null/undefined/empty check first: Number(null) is 0, so a
  // naive conversion would read "no logs at all" as "zero sessions
  // logged" and flag every non-logger as a mismatch.
  const reportedWorkouts = (reported === null || reported === undefined || reported === "") ? NaN : Number(reported);
  const loggedWorkouts = (logged === null || logged === undefined || logged === "") ? NaN : Number(logged);
  if (!Number.isFinite(loggedWorkouts)) {
    return Object.freeze({
      agreement: "NO_LOGS",
      reported_workouts: Number.isFinite(reportedWorkouts) ? reportedWorkouts : null,
      logged_workouts: null,
      requires_coach_review: false,
    });
  }
  const agreement = Number.isFinite(reportedWorkouts) && reportedWorkouts === loggedWorkouts
    ? "MATCH"
    : "MISMATCH";
  return Object.freeze({
    agreement,
    reported_workouts: Number.isFinite(reportedWorkouts) ? reportedWorkouts : null,
    logged_workouts: loggedWorkouts,
    requires_coach_review: agreement === "MISMATCH",
  });
}

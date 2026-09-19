import { WorkoutLog, CheckinSubmission } from "../models/index.js";
import { buildProgressionState } from "../../training-engine-v2/progression/index.js";

const DELOAD_DAYS = 7;

/**
 * Coach-approved early deloads live in the approving check-in's analysis_output.deload_decision.
 * @returns {Array<{starts_at, ends_at, reason, affected_exercises}>}
 */
export async function loadDeloadWindows(userId) {
  const checkins = await CheckinSubmission.findAll({ where: { user_id: userId }, attributes: ["analysis_output"] });
  return checkins
    .map((c) => c.analysis_output?.deload_decision)
    .filter((d) => d && d.approved === true && d.starts_at && d.ends_at)
    .map((d) => ({ starts_at: d.starts_at, ends_at: d.ends_at, reason: d.reason, affected_exercises: d.affected_exercises || [] }));
}

/** Per-exercise progression state for a client, replayed from all their workout logs. */
export async function loadProgressionState(userId, now = new Date()) {
  const [logs, deloadWindows] = await Promise.all([
    WorkoutLog.findAll({ where: { user_id: userId }, order: [["createdAt", "ASC"]], attributes: ["createdAt", "week_number", "logged_exercises"] }),
    loadDeloadWindows(userId),
  ]);
  return buildProgressionState({
    logs: logs.map((l) => ({ created_at: l.createdAt, week_number: l.week_number, logged_exercises: l.logged_exercises })),
    deload_windows: deloadWindows,
    now,
  });
}

export function buildDeloadDecision({ approved, reason, affected_exercises = [], approved_by = null, now = new Date() }) {
  const start = new Date(now);
  return {
    approved: approved === true,
    decided_at: start.toISOString(),
    decided_by_user_id: approved_by,
    reason,
    affected_exercises,
    ...(approved === true
      ? { starts_at: start.toISOString(), ends_at: new Date(start.getTime() + DELOAD_DAYS * 86400000).toISOString() }
      : {}),
  };
}

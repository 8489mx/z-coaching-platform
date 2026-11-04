/**
 * Coach-opened late check-in windows (P1-B10). The schedule service already
 * reads program_data.checkin_overrides[cycle] and honors an unexpired
 * entry, but nothing ever wrote one — the coach's only remedy for a late
 * client was hand-editing program data. This module is the single shape
 * for those entries: the controller writes them, the schedule service
 * validates them, so the two can never drift apart.
 */

export function buildLateWindowOverride({ cycleSequence, windowHours = 72, coachId = null, reason = null, now = new Date() } = {}) {
  const cycle = Number(cycleSequence);
  if (!Number.isInteger(cycle) || cycle < 1) {
    throw new TypeError("cycleSequence must be a positive integer.");
  }
  const hours = Number(windowHours);
  const validHours = Number.isFinite(hours) && hours > 0 ? hours : 72;
  const openedAt = now instanceof Date ? now : new Date(now);
  return Object.freeze({
    cycle_sequence: cycle,
    opened_at: openedAt.toISOString(),
    expires_at: new Date(openedAt.getTime() + validHours * 3600 * 1000).toISOString(),
    opened_by: coachId,
    reason: reason ? String(reason) : null,
  });
}

export function isValidLateWindowOverride(override, nowMs = Date.now()) {
  if (!override || typeof override !== "object") return false;
  if (!override.expires_at) return true;
  const expires = new Date(override.expires_at).getTime();
  return Number.isFinite(expires) && expires > nowMs;
}

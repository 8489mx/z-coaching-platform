/**
 * P1-B11: ONE adherence definition for every coach surface.
 *
 * Adherence is the server's raw nutrition adherence percent, exactly as the
 * client reported it. It is never blended with workout completion, never
 * defaulted to 100, and never invented: when the server sent no value the
 * result is null and the screen must render "unknown", not a number.
 */
export function getCheckinAdherencePercent(checkin) {
  const raw = checkin?.nutrition_adherence_percent ?? checkin?.adherence;
  const value = Number(raw);
  // A percent outside 0-100 is corrupt data, not a measurement: unknown,
  // never a displayed "140%".
  if (!Number.isFinite(value) || value < 0 || value > 100) return null;
  return value;
}

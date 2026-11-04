/**
 * P1-B11: milestone-card metrics resolved from real field names only.
 *
 * The review flow's history uses weight/waist/adherence keys while the old
 * card read weight_kg/waist_cm/diet_adherence_percentage — so every read
 * missed and the card fell back to invented defaults (85 kg, 90 cm, 90% /
 * 92%, 4 / 4.5) rendered as a formal certificate. This helper accepts both
 * key sets, never invents a value, and reports whether the anchors needed
 * for a certificate exist at all: when start and current weight are both
 * unknown the card must refuse to render instead of celebrating fiction.
 */
function finiteNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function resolveMilestoneMetrics({ client = {}, activeCheckin = {}, history = [] } = {}) {
  const list = Array.isArray(history) ? history : [];
  const first = list[0] || {};
  const last = list[list.length - 1] || {};
  const metrics = activeCheckin?.metrics || {};
  const bio = activeCheckin?.biofeedback || {};

  const startWeight = finiteNumber(
    first.weight_kg ?? first.weight ?? client.initial_weight ?? client.weight,
  );
  const currentWeight = finiteNumber(
    activeCheckin?.weight_kg ?? activeCheckin?.weight ?? metrics.current_weight
      ?? last.weight_kg ?? last.weight,
  );
  const startWaist = finiteNumber(
    first.waist_cm ?? first.waist ?? client.initial_waist ?? client.waist,
  );
  const currentWaist = finiteNumber(
    activeCheckin?.waist_cm ?? activeCheckin?.waist ?? metrics.waist_current
      ?? last.waist_cm ?? last.waist,
  );
  const dietAdh = finiteNumber(
    activeCheckin?.diet_adherence_percentage ?? metrics.adherence
      ?? activeCheckin?.nutrition_adherence_percent ?? last.adherence,
  );
  const trainAdh = finiteNumber(
    activeCheckin?.workout_adherence_percentage ?? metrics.workout_adherence,
  );
  const sleepScore = finiteNumber(
    activeCheckin?.sleep_quality ?? bio.sleep_quality ?? bio.sleep,
  );
  const energyScore = finiteNumber(
    activeCheckin?.energy_level ?? bio.energy_level ?? bio.energy,
  );
  const weeksCount = finiteNumber(activeCheckin?.week_number ?? activeCheckin?.checkin_number)
    ?? (list.length > 0 ? list.length : null);

  const weightDropKg = startWeight !== null && currentWeight !== null
    ? Math.max(0, Number((startWeight - currentWeight).toFixed(1)))
    : null;
  const waistDropCm = startWaist !== null && currentWaist !== null
    ? Math.max(0, Number((startWaist - currentWaist).toFixed(1)))
    : null;
  const avgAdherence = dietAdh !== null && trainAdh !== null
    ? Math.round((dietAdh + trainAdh) / 2)
    : dietAdh;
  const avgReadiness = sleepScore !== null && energyScore !== null
    ? Number(((sleepScore + energyScore) / 2).toFixed(1))
    : null;

  return {
    startWeight,
    currentWeight,
    weightDropKg,
    startWaist,
    currentWaist,
    waistDropCm,
    weeksCount,
    avgAdherence,
    avgReadiness,
    // A certificate needs real anchors. Without both weights there is
    // nothing to celebrate and the card must refuse, not invent.
    canRender: startWeight !== null && currentWeight !== null,
  };
}

/* Phase 3 wiring helpers, pure and testable without a database: package
 * cadence resolution and the AUTO_APPLIED dashboard window. The controller
 * uses both, but neither helper touches the database, so both are proven
 * here; the controller wiring itself is verified by the reviewer in an
 * environment with the database package. */
import test from "node:test";
import assert from "node:assert/strict";

import {
  packageCadenceDays,
  filterDigestRowsForAutoAppliedWindow,
} from "../src/execution-engines/follow-up-auto-apply.js";

const NOW = new Date("2026-11-01T00:00:00.000Z");
const DAYS = 24 * 3600 * 1000;
function daysAgo(n) {
  return new Date(NOW.getTime() - n * DAYS).toISOString();
}

test("package cadence: MAX is 7 days, ELITE is 14 days, unknown is null (never invented)", () => {
  assert.equal(packageCadenceDays("MAX"), 7);
  assert.equal(packageCadenceDays("max"), 7);
  assert.equal(packageCadenceDays("ELITE"), 14);
  assert.equal(packageCadenceDays("elite"), 14);
  assert.equal(packageCadenceDays("PREMIUM"), null);
  assert.equal(packageCadenceDays(null), null);
  assert.equal(packageCadenceDays(""), null);
});

test("AUTO_APPLIED window: older than 14 days is hidden from display, recent and pending are kept", () => {
  const rows = [
    { id: 1, status: "AUTO_APPLIED", created_at: daysAgo(15) },
    { id: 2, status: "AUTO_APPLIED", created_at: daysAgo(14) },
    { id: 3, status: "AUTO_APPLIED", created_at: daysAgo(1) },
    { id: 4, status: "AUTO_APPLIED" },
    { id: 5, status: "PENDING_REVIEW", created_at: daysAgo(30) },
  ];
  const kept = filterDigestRowsForAutoAppliedWindow(rows, { now: NOW, windowDays: 14 });
  assert.deepEqual(kept.map((r) => r.id), [2, 3, 4, 5]);
});

test("AUTO_APPLIED window: without a window, nothing is hidden", () => {
  const rows = [{ id: 1, status: "AUTO_APPLIED", created_at: daysAgo(90) }];
  assert.deepEqual(filterDigestRowsForAutoAppliedWindow(rows, { now: NOW }), rows);
  assert.deepEqual(filterDigestRowsForAutoAppliedWindow(rows), rows);
});

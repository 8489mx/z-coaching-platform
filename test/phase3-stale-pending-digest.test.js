/* Phase 3, read-only flagging only: stale and ghost PENDING_REVIEW rows are
 * shown in a separate stale_pending section of the coach digest. Nothing
 * is closed, deleted, re-triaged, or merged here: a stale row stays in its
 * normal tier list too, and a stale RED row stays in red_pending. The
 * classifier never invents a flag: without a submission date and a package
 * cadence, age cannot be judged and the row is not flagged stale. */
import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCoachDigest,
  classifyStalePending,
} from "../src/execution-engines/follow-up-auto-apply.js";

const NOW = new Date("2026-11-01T00:00:00.000Z");
const DAYS = 24 * 3600 * 1000;
function daysAgo(n) {
  return new Date(NOW.getTime() - n * DAYS).toISOString();
}

function pending(overrides = {}) {
  return {
    id: 1,
    user_id: 10,
    week_number: 3,
    status: "PENDING_REVIEW",
    analysis_output: {
      triage: { tier: "GREEN", reasons: [{ code: "ON_TRACK" }] },
    },
    ...overrides,
  };
}

test("MAX pending older than 7 days is stale by age, and stays in green_pending too", () => {
  const row = pending({ created_at: daysAgo(8), package_cadence_days: 7 });
  const result = classifyStalePending(row, NOW);
  assert.equal(result.is_stale, true);
  assert.ok(result.stale_reasons.includes("STALE_AGE"));
  const digest = buildCoachDigest([row], { now: NOW });
  assert.equal(digest.counts.stale_pending, 1);
  assert.equal(digest.stale_pending[0].checkin_id, 1);
  assert.equal(digest.counts.green_pending, 1);
  assert.equal(digest.green_pending[0].checkin_id, 1);
});

test("ELITE pending is stale only after 14 days, not at exactly 14", () => {
  assert.equal(
    classifyStalePending(pending({ created_at: daysAgo(14), package_cadence_days: 14 }), NOW).is_stale,
    false,
  );
  const stale = classifyStalePending(pending({ created_at: daysAgo(15), package_cadence_days: 14 }), NOW);
  assert.equal(stale.is_stale, true);
  assert.ok(stale.stale_reasons.includes("STALE_AGE"));
});

test("without a submission date or a package cadence, age is never invented", () => {
  assert.equal(classifyStalePending(pending({ created_at: daysAgo(30) }), NOW).is_stale, false);
  assert.equal(
    classifyStalePending(pending({ package_cadence_days: 7 }), NOW).is_stale,
    false,
  );
  assert.equal(classifyStalePending(pending(), NOW).is_stale, false);
});

test("ghost reasons flag a fresh row: inactive client, superseded program, duplicate week", () => {
  const inactive = classifyStalePending(pending({ created_at: daysAgo(1), package_cadence_days: 7, client_active: false }), NOW);
  assert.equal(inactive.is_stale, true);
  assert.ok(inactive.stale_reasons.includes("GHOST_INACTIVE_CLIENT"));

  const superseded = classifyStalePending(pending({ created_at: daysAgo(1), package_cadence_days: 7, program_superseded: true }), NOW);
  assert.equal(superseded.is_stale, true);
  assert.ok(superseded.stale_reasons.includes("GHOST_SUPERSEDED_PROGRAM"));

  const duplicate = classifyStalePending(pending({ created_at: daysAgo(1), package_cadence_days: 7, duplicate_week: true }), NOW);
  assert.equal(duplicate.is_stale, true);
  assert.ok(duplicate.stale_reasons.includes("GHOST_DUPLICATE_WEEK"));
});

test("a stale RED row is flagged but never hidden from red_pending", () => {
  const row = pending({
    created_at: daysAgo(20),
    package_cadence_days: 7,
    analysis_output: { triage: { tier: "RED", reasons: [{ code: "INJURY_FLAGGED" }] } },
  });
  const digest = buildCoachDigest([row], { now: NOW });
  assert.equal(digest.counts.stale_pending, 1);
  assert.equal(digest.counts.red_pending, 1);
  assert.equal(digest.red_pending[0].checkin_id, 1);
  assert.equal(digest.stale_pending[0].tier, "RED");
});

test("AUTO_APPLIED rows are never in stale_pending; the sweep scope is pending only", () => {
  const row = pending({
    status: "AUTO_APPLIED",
    created_at: daysAgo(30),
    package_cadence_days: 7,
  });
  const digest = buildCoachDigest([row], { now: NOW });
  assert.equal(digest.counts.stale_pending, 0);
  assert.equal(digest.counts.auto_applied, 1);
});

test("existing digest counts are unchanged for fresh rows", () => {
  const digest = buildCoachDigest([
    pending({ id: 1, created_at: daysAgo(1), package_cadence_days: 7 }),
    pending({ id: 2, created_at: daysAgo(2), package_cadence_days: 7, analysis_output: { triage: { tier: "YELLOW", reasons: [{ code: "PLATEAU_DETECTED" }] } } }),
  ], { now: NOW });
  assert.equal(digest.counts.total, 2);
  assert.equal(digest.counts.green_pending, 1);
  assert.equal(digest.counts.yellow_pending, 1);
  assert.equal(digest.counts.stale_pending, 0);
});

import test from "node:test";
import assert from "node:assert/strict";

import { evaluateClientCheckinOverdue, resolveCheckinCycleDays } from "../src/execution-engines/overdue-checkin-engine.js";
import { SUBSCRIPTION_TIERS } from "../src/config/subscription-tiers.js";

/**
 * The two packages are reviewed at different rhythms on purpose: MAX every week, ELITE every
 * fortnight, which is steadier physiologically and doubles how many clients one coach can carry.
 * Chasing an ELITE client on day nine, while they are exactly on schedule, is the fastest way to
 * make a paying client feel nagged.
 */
const NOW = new Date("2026-09-20T09:00:00Z");
const daysAgo = (n) => new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000).toISOString();
const client = (pkg, lastCheckinDaysAgo) => ({
  status: "ACTIVE",
  subscription_package: pkg,
  checkinSubmissions: [{ created_at: daysAgo(lastCheckinDaysAgo) }],
});

test("the cadence is read from the client's package, not assumed", () => {
  assert.equal(resolveCheckinCycleDays({ subscription_package: "MAX" }), 7);
  assert.equal(resolveCheckinCycleDays({ subscription_package: "ELITE_8M" }), 14);
  assert.equal(resolveCheckinCycleDays({ subscription_package: "MAX_4M" }), 7);
  assert.equal(resolveCheckinCycleDays({}), 7, "an unknown package falls back to the weekly rhythm");
  // The numbers come from the packages themselves.
  assert.equal(SUBSCRIPTION_TIERS.MAX.checkinIntervalDays, 7);
  assert.equal(SUBSCRIPTION_TIERS.ELITE.checkinIntervalDays, 14);
});

test("an ELITE client on the fortnightly rhythm is not chased as if they had disappeared", () => {
  assert.equal(evaluateClientCheckinOverdue(client("ELITE_4M", 10), NOW).isOverdue, false, "day ten of a fortnight is on schedule");
  assert.equal(evaluateClientCheckinOverdue(client("ELITE_4M", 15), NOW).isOverdue, false, "the two days of grace still apply");
  const late = evaluateClientCheckinOverdue(client("ELITE_4M", 18), NOW);
  assert.equal(late.isOverdue, true);
  assert.equal(late.daysOverdue, 4, "counted against the fortnight, not against a week");
});

test("a MAX client is still chased after the week plus grace", () => {
  assert.equal(evaluateClientCheckinOverdue(client("MAX_8M", 8), NOW).isOverdue, false);
  const late = evaluateClientCheckinOverdue(client("MAX_8M", 10), NOW);
  assert.equal(late.isOverdue, true);
  assert.equal(late.daysOverdue, 3);
});

import test from "node:test";
import assert from "node:assert/strict";

import { getSubscriptionOverview } from "../src/api/controllers/subscription.controller.js";
import sequelize from "../src/api/config/database.js";

// Regression: the query selected a non-existent checkin_submissions.created_at column,
// so the overview (renewals dashboard, overdue radar, notification bell) always returned 500.
test("getSubscriptionOverview runs against the real schema and returns clients", async () => {
  const out = { status: 200, body: null };
  const res = {
    status(code) { out.status = code; return res; },
    json(data) { out.body = data; return res; }
  };

  try {
    await getSubscriptionOverview({ query: {}, user: { id: 1, role: "ADMIN" } }, res);
    assert.equal(out.status, 200, `expected 200, got ${out.status}: ${JSON.stringify(out.body)?.slice(0, 200)}`);
    assert.ok(Array.isArray(out.body?.clients), "response must contain a clients array");
  } finally {
    await sequelize.close().catch(() => {});
  }
});

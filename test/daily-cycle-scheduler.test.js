import test from "node:test";
import assert from "node:assert/strict";

import { shouldRunDueCycles, runDueCyclesNow } from "../src/api/services/cycleScheduler.service.js";

// 04:00 Cairo is 01:00 UTC (UTC+3 in summer) or 02:00 UTC (UTC+2 in winter).
test("the daily run happens once per Cairo day, from 04:00", () => {
  assert.equal(shouldRunDueCycles(new Date("2026-01-10T00:30:00Z"), null), false, "02:30 Cairo is too early");
  assert.equal(shouldRunDueCycles(new Date("2026-01-10T03:00:00Z"), null), true, "05:00 Cairo runs");
  const day = "2026-1-10";
  assert.equal(shouldRunDueCycles(new Date("2026-01-10T10:00:00Z"), day), false, "not twice the same day");
  assert.equal(shouldRunDueCycles(new Date("2026-01-11T03:00:00Z"), day), true, "the next day runs again");
});

test("the run acts as an admin, through the coach's own run-due action", async () => {
  let seen = null;
  const body = await runDueCyclesNow({
    findActor: async () => ({ id: 77 }),
    run: async (req, res) => { seen = req.user; res.status(200).json({ message_ar: "ok", published_count: 0, waiting_count: 0 }); },
  });
  assert.deepEqual(seen, { id: 77, role: "ADMIN" });
  assert.equal(body.published_count, 0);
});

test("without an admin account nothing runs", async () => {
  let ran = false;
  const body = await runDueCyclesNow({ findActor: async () => null, run: async () => { ran = true; } });
  assert.equal(body, null);
  assert.equal(ran, false);
});

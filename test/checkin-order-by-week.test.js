import test from "node:test";
import assert from "node:assert/strict";

import { submitCheckin } from "../src/api/controllers/checkin.controller.js";
import { User, CheckinSubmission } from "../src/api/models/index.js";
import sequelize from "../src/api/config/database.js";

/**
 * The week-to-week change is measured against the previous check-in. Check-ins saved in the same
 * second (the mobile app uploads its offline queue in one go) used to tie on their timestamp, and
 * the engine could pick an older week as "previous": a steady half-kilo loss then read as a
 * rapid-loss alarm. The previous check-in is the previous week, whatever the clock says.
 */
const CODE = "TEST_CHECKIN_ORDER_935";

function mockRes() {
  const out = { status: 200, body: null };
  const res = { status(c) { out.status = c; return res; }, json(b) { out.body = b; return res; } };
  return { res, out };
}

test("four check-ins sent back to back are each compared with the week before", async () => {
  let user = await User.findOne({ where: { client_code: CODE } });
  if (user) { await CheckinSubmission.destroy({ where: { user_id: user.id } }); await user.destroy(); }
  user = await User.create({ client_code: CODE, phone_number: "01099000935", full_name: "Order", role: "CLIENT" });

  try {
    const statuses = [];
    // 95 kg losing half a kilo a week: about 0.5% of bodyweight, the textbook pace, never "rapid".
    for (const weight of [96, 95.5, 95, 94.5]) {
      const r = mockRes();
      await submitCheckin({ body: { user_id: CODE, weight_kg: weight, nutrition_adherence_percent: 90 } }, r.res);
      assert.equal(r.out.status, 201, JSON.stringify(r.out.body));
      statuses.push(r.out.body.analysis.analysis_status);
    }
    assert.ok(!statuses.includes("RAPID_LOSS_WARNING"), `a steady 0.5 kg/week was flagged as rapid loss: ${statuses.join(", ")}`);
  } finally {
    await CheckinSubmission.destroy({ where: { user_id: user.id } }).catch(() => {});
    await user.destroy().catch(() => {});
    await sequelize.close().catch(() => {});
  }
});

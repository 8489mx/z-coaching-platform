import test from "node:test";
import assert from "node:assert/strict";

import { submitCheckin } from "../src/api/controllers/checkin.controller.js";
import { User, CheckinSubmission } from "../src/api/models/index.js";
import sequelize from "../src/api/config/database.js";

const CODE = "TEST_WEEK_AUTO_919";

function mockRes() {
  const out = { status: 200, body: null };
  const res = { status(c) { out.status = c; return res; }, json(b) { out.body = b; return res; } };
  return { res, out };
}

// The web form and the mobile app send no week_number: consecutive check-ins must land on consecutive weeks.
test("check-ins without week_number go to the next week instead of colliding with week 1", async () => {
  let user = await User.findOne({ where: { client_code: CODE } });
  if (user) { await CheckinSubmission.destroy({ where: { user_id: user.id } }); await user.destroy(); }
  user = await User.create({ client_code: CODE, phone_number: "01099000919", full_name: "Weeks", role: "CLIENT" });
  try {
    const weeks = [];
    for (const weight of [90, 89.4]) {
      const r = mockRes();
      await submitCheckin({ body: { user_id: CODE, weight_kg: weight, nutrition_adherence_percent: 90 } }, r.res);
      assert.equal(r.out.status, 201, JSON.stringify(r.out.body));
      weeks.push(r.out.body.checkin.week_number);
    }
    assert.deepEqual(weeks, [1, 2]);

    const explicit = mockRes();
    await submitCheckin({ body: { user_id: CODE, week_number: 2, weight_kg: 89, nutrition_adherence_percent: 90 } }, explicit.res);
    assert.equal(explicit.out.status, 409, "an explicit week that already exists is still a duplicate");
  } finally {
    await CheckinSubmission.destroy({ where: { user_id: user.id } }).catch(() => {});
    await user.destroy().catch(() => {});
    await sequelize.close().catch(() => {});
  }
});

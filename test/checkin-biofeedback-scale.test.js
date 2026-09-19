import test from "node:test";
import assert from "node:assert/strict";

import { submitCheckin } from "../src/api/controllers/checkin.controller.js";
import { User, CheckinSubmission } from "../src/api/models/index.js";
import sequelize from "../src/api/config/database.js";

const CODE = "TEST_SCALE_909";

function mockRes() {
  const out = { status: 200, body: null };
  const res = { status(c) { out.status = c; return res; }, json(b) { out.body = b; return res; } };
  return { res, out };
}

test("web check-in 1-10 sliders are converted to the engine's 1-5 scale", async (t) => {
  let user = await User.findOne({ where: { client_code: CODE } });
  if (user) { await CheckinSubmission.destroy({ where: { user_id: user.id } }); await user.destroy(); }
  user = await User.create({ client_code: CODE, phone_number: "01099000909", full_name: "Scale Test", role: "CLIENT" });
  try {
    const submit = async (week, biofeedback, extra = {}) => {
      const r = mockRes();
      await submitCheckin({ body: { user_id: CODE, week_number: week, weight_kg: 80, nutrition_adherence_percent: 90, biofeedback, ...extra } }, r.res);
      assert.equal(r.out.status, 201, JSON.stringify(r.out.body));
      return r.out.body;
    };

    await t.test("the form's default sliders (energy 7, sleep 7, hunger 5 of 10) raise no alert", async () => {
      const out = await submit(1, { energyLevel: 7, sleepQuality: 7, hungerLevel: 5 }, { biofeedback_scale: 10 });
      assert.deepEqual(out.checkin.biofeedback.hunger_level, 3);
      assert.deepEqual(out.checkin.biofeedback.energy_level, 4);
      assert.ok(!out.analysis.biofeedback_alerts.includes("HIGH_HUNGER"), JSON.stringify(out.analysis.biofeedback_alerts));
    });

    await t.test("low energy on the 10-point slider (3/10) is read as low (2/5)", async () => {
      const out = await submit(2, { energyLevel: 3, sleepQuality: 7, hungerLevel: 5 }, { biofeedback_scale: 10 });
      assert.equal(out.checkin.biofeedback.energy_level, 2);
      assert.ok(out.analysis.biofeedback_alerts.includes("LOW_RECOVERY_ENERGY"));
    });

    await t.test("payloads without a scale keep the 1-5 meaning", async () => {
      const out = await submit(3, { energy_level: 2, hunger_level: 4, sleep_quality: 4 });
      assert.equal(out.checkin.biofeedback.energy_level, 2);
      assert.equal(out.checkin.biofeedback.hunger_level, 4);
    });
  } finally {
    await CheckinSubmission.destroy({ where: { user_id: user.id } }).catch(() => {});
    await user.destroy().catch(() => {});
    await sequelize.close().catch(() => {});
  }
});

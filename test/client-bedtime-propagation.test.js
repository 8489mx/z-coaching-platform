import test from "node:test";
import assert from "node:assert/strict";

import { resolveClientBedtimeHour } from "../src/api/controllers/program.controller.js";
import { User, IntakeSubmission } from "../src/api/models/index.js";
import { encryptMedicalData } from "../src/utils/crypto.js";
import sequelize from "../src/api/config/database.js";

test("client bedtime is read from the latest (encrypted) intake for the caffeine cutoff guide", async (t) => {
  const code = "TEST_BEDTIME_903";
  await User.destroy({ where: { client_code: code } }).catch(() => {});
  const user = await User.create({ client_code: code, phone_number: "01099000903", full_name: "Bedtime Test" });

  try {
    await t.test("returns null when the client has no intake", async () => {
      assert.equal(await resolveClientBedtimeHour(user.id), null);
    });

    await t.test("decrypts the latest intake and returns a valid HH:MM bedtime", async () => {
      await IntakeSubmission.create({
        user_id: user.id,
        answers: { _isEncrypted: true, data: encryptMedicalData({ sleep_schedule: { bedtime_hour: "00:30" } }) }
      });
      assert.equal(await resolveClientBedtimeHour(user.id), "00:30");
    });

    await t.test("ignores malformed bedtime values instead of propagating them", async () => {
      await IntakeSubmission.create({
        user_id: user.id,
        answers: { _isEncrypted: true, data: encryptMedicalData({ sleep_schedule: { bedtime_hour: "late night" } }) }
      });
      assert.equal(await resolveClientBedtimeHour(user.id), null);
    });
  } finally {
    await IntakeSubmission.destroy({ where: { user_id: user.id } }).catch(() => {});
    await user.destroy().catch(() => {});
    await sequelize.close().catch(() => {});
  }
});

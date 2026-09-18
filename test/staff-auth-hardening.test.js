import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loginFast } from "../src/api/controllers/auth.controller.js";
import { User } from "../src/api/models/index.js";
import sequelize from "../src/api/config/database.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function mockRes() {
  const out = { status: 0, body: null };
  out.res = {
    status(code) {
      out.status = code;
      return { json: (data) => { out.body = data; return data; } };
    }
  };
  return out;
}

test("Staff authentication hardening", async (t) => {
  const staffCode = "TEST_STAFF_AUTH_901";
  const staffPhone = "01099000901";
  const clientCode = "TEST_CLIENT_AUTH_902";
  const clientPhone = "01099000902";

  await User.destroy({ where: { client_code: [staffCode, clientCode] } }).catch(() => {});
  const staff = await User.create({ client_code: staffCode, phone_number: staffPhone, full_name: "Staff Test", role: "ADMIN" });
  const client = await User.create({
    client_code: clientCode,
    phone_number: clientPhone,
    full_name: "Client Test",
    subscription_status: "ACTIVE",
    password: "$2b$10$abcdefghijklmnopqrstuuFakeHashForSerializationTestOnly1"
  });

  try {
    await t.test("login-fast refuses ADMIN/COACH accounts even with a matching code + phone", async () => {
      const out = mockRes();
      await loginFast({ body: { client_code: staffCode, phone_number: staffPhone }, clientIp: "10.77.0.1", headers: {} }, out.res);
      assert.equal(out.status, 403);
      assert.ok(!out.body.token, "no token may be issued for staff via login-fast");
    });

    await t.test("login-fast still works for clients and never returns the password hash", async () => {
      const out = mockRes();
      await loginFast({ body: { client_code: clientCode, phone_number: clientPhone }, clientIp: "10.77.0.2", headers: {} }, out.res);
      assert.equal(out.status, 200);
      assert.ok(out.body.token);
      const serialized = JSON.parse(JSON.stringify(out.body));
      assert.equal("password" in serialized.user, false, "password hash must not be serialized");
    });

    await t.test("raw queries (backups) still include the password column", async () => {
      const raw = await User.findOne({ where: { client_code: clientCode }, raw: true });
      assert.ok(raw.password, "raw rows keep the hash so backups remain restorable");
    });
  } finally {
    await staff.destroy().catch(() => {});
    await client.destroy().catch(() => {});
    await sequelize.close().catch(() => {});
  }
});

test("Frontend bundle source contains no hardcoded staff credentials or magic login codes", () => {
  const offenders = [];
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(jsx?|tsx?)$/.test(entry.name)) {
        const src = fs.readFileSync(full, "utf8");
        if (/COACH-KZ|\+?201000000000|=== '8489'/.test(src)) offenders.push(path.relative(ROOT, full));
      }
    }
  })(path.join(ROOT, "frontend", "src"));
  assert.deepEqual(offenders, []);
});

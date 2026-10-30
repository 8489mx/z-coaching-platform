import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcrypt";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loginFast, setClientPassword } from "../src/api/controllers/auth.controller.js";
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
  const clientPassword = "ClientPass123";
  const noPasswordCode = "TEST_CLIENT_AUTH_903";
  const noPasswordPhone = "01099000903";
  const chosenPassword = "ChosenPass123";

  await User.destroy({ where: { client_code: [staffCode, clientCode, noPasswordCode] } }).catch(() => {});
  const staff = await User.create({ client_code: staffCode, phone_number: staffPhone, full_name: "Staff Test", role: "ADMIN" });
  const client = await User.create({
    client_code: clientCode,
    phone_number: clientPhone,
    full_name: "Client Test",
    subscription_status: "ACTIVE",
    password: await bcrypt.hash(clientPassword, 10)
  });
  const clientNoPassword = await User.create({
    client_code: noPasswordCode,
    phone_number: noPasswordPhone,
    full_name: "Client No Password Test",
    subscription_status: "ACTIVE"
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
      await loginFast({ body: { client_code: clientCode, phone_number: clientPhone, password: clientPassword }, clientIp: "10.77.0.2", headers: {} }, out.res);
      assert.equal(out.status, 200);
      assert.ok(out.body.token);
      const serialized = JSON.parse(JSON.stringify(out.body));
      assert.equal("password" in serialized.user, false, "password hash must not be serialized");
    });

    await t.test("login-fast refuses a wrong or missing password with the generic 401", async () => {
      for (const password of ["WrongPass123", undefined]) {
        const out = mockRes();
        const body = { client_code: clientCode, phone_number: clientPhone };
        if (password !== undefined) body.password = password;
        await loginFast({ body, clientIp: "10.77.0.3", headers: {} }, out.res);
        assert.equal(out.status, 401);
        assert.ok(!out.body.token, "no token may be issued without the right password");
      }
    });

    await t.test("login-fast tells a password-less account to set a password, without a token", async () => {
      const out = mockRes();
      await loginFast({ body: { client_code: noPasswordCode, phone_number: noPasswordPhone }, clientIp: "10.77.0.4", headers: {} }, out.res);
      assert.equal(out.status, 403);
      assert.equal(out.body.code, "PASSWORD_NOT_SET");
      assert.ok(!out.body.token);
    });

    await t.test("set-password refuses a weak password, then sets a strong one once", async () => {
      const weak = mockRes();
      await setClientPassword({ body: { client_code: noPasswordCode, phone_number: noPasswordPhone, new_password: "123456" }, clientIp: "10.77.0.5", headers: {} }, weak.res);
      assert.equal(weak.status, 400);
      assert.ok(!weak.body.token);

      const ok = mockRes();
      await setClientPassword({ body: { client_code: noPasswordCode, phone_number: noPasswordPhone, new_password: chosenPassword }, clientIp: "10.77.0.5", headers: {} }, ok.res);
      assert.equal(ok.status, 200);
      assert.ok(ok.body.token);

      const again = mockRes();
      await setClientPassword({ body: { client_code: noPasswordCode, phone_number: noPasswordPhone, new_password: "AnotherPass123" }, clientIp: "10.77.0.5", headers: {} }, again.res);
      assert.equal(again.status, 403);
      assert.equal(again.body.code, "PASSWORD_ALREADY_SET");
      assert.ok(!again.body.token);

      const login = mockRes();
      await loginFast({ body: { client_code: noPasswordCode, phone_number: noPasswordPhone, password: chosenPassword }, clientIp: "10.77.0.6", headers: {} }, login.res);
      assert.equal(login.status, 200);
      assert.ok(login.body.token);
    });

    await t.test("raw queries (backups) still include the password column", async () => {
      const raw = await User.findOne({ where: { client_code: clientCode }, raw: true });
      assert.ok(raw.password, "raw rows keep the hash so backups remain restorable");
    });
  } finally {
    await staff.destroy().catch(() => {});
    await client.destroy().catch(() => {});
    await clientNoPassword.destroy().catch(() => {});
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

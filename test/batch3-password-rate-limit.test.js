/* B3-2 (#29): failed password changes are never rate-limited.
 * The /change-password route already runs authRateLimiter (5 failures per
 * 15 minutes, failures only), and the login handlers feed that limiter via
 * recordAuthFailedAttempt — but changePassword never recorded anything, so
 * a wrong current password could be guessed without end and never tripped
 * the 429. After this fix a wrong current password records a failed auth
 * attempt like a failed login, and a successful change clears the failure
 * budget like a successful login. */
import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcrypt";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { changePassword } from "../src/api/controllers/auth.controller.js";
import { authRateLimiter, resetAuthAttempts } from "../src/api/middlewares/rateLimiter.js";
import { User, RateLimitLog } from "../src/api/models/index.js";
import sequelize from "../src/api/config/database.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CURRENT = "CorrectPass123";
const NEW = "NewStrongPass456";
const WRONG = "WrongPass000";

const IP_BLOCK = "203.0.113.99";
const IP_SUCCESS = "203.0.113.98";
const IP_RESET = "203.0.113.97";

const call = async (fn, req) => {
  const out = {};
  await fn(req, {
    status(c) { out.status = c; return this; },
    json(b) { out.body = b; return this; },
    setHeader() {},
  });
  return out;
};
const passes = async (req) => {
  let passed = false;
  const out = await call((r, s) => authRateLimiter(r, s, () => { passed = true; }), req);
  return { passed, status: out.status };
};
const changeReq = (userId, ip, current, next) => ({
  user: { id: userId },
  headers: { "x-forwarded-for": ip },
  socket: { remoteAddress: ip },
  body: { current_password: current, new_password: next },
});

const users = {};
test.before(async () => {
  for (const [key, code, phone, ip] of [
    ["block", "TEST_B3_PW_991", "01099330097", IP_BLOCK],
    ["success", "TEST_B3_PW_992", "01099330098", IP_SUCCESS],
    ["reset", "TEST_B3_PW_993", "01099330099", IP_RESET],
  ]) {
    const old = await User.findOne({ where: { client_code: code } });
    if (old) await old.destroy();
    users[key] = await User.create({
      client_code: code,
      phone_number: phone,
      full_name: `B3-2 ${key} user`,
      role: "CLIENT",
      password: await bcrypt.hash(CURRENT, 10),
    });
    resetAuthAttempts(ip);
    await RateLimitLog.destroy({ where: { ip_address: ip } }).catch(() => {});
  }
});
test.after(async () => {
  for (const ip of [IP_BLOCK, IP_SUCCESS, IP_RESET]) {
    resetAuthAttempts(ip);
    await RateLimitLog.destroy({ where: { ip_address: ip } }).catch(() => {});
  }
  for (const u of Object.values(users)) await u?.destroy().catch(() => {});
  await sequelize.close().catch(() => {});
});

test("change-password route still runs the auth limiter before the handler", () => {
  const routes = fs.readFileSync(path.join(ROOT, "src/api/routes/auth.routes.js"), "utf8");
  assert.match(
    routes,
    /router\.post\("\/change-password",\s*requireAuth,\s*authRateLimiter,\s*changePassword\)/,
    "the limiter must stay on the change-password route"
  );
});

test("five wrong current passwords block the IP", async () => {
  const user = users.block;
  for (let i = 0; i < 5; i += 1) {
    const out = await call(changePassword, changeReq(user.id, IP_BLOCK, WRONG, NEW));
    assert.equal(out.status, 401, `wrong attempt ${i + 1} must be refused`);
  }
  const rows = await RateLimitLog.findAll({ where: { ip_address: IP_BLOCK }, order: [["id", "ASC"]] });
  assert.equal(rows.length, 5, "each failed change must be recorded in the rate-limit log");
  assert.equal(rows[4].attempt_count, 5, "the fifth failure must reach the limit count");
  assert.equal(rows[4].is_blocked, true, "the fifth failure must be marked blocked");
  const blocked = await passes({ headers: { "x-forwarded-for": IP_BLOCK } });
  assert.equal(blocked.passed, false, "the IP must be blocked after five failed changes");
  assert.equal(blocked.status, 429, "the block must answer 429");
});

test("a correct change still works and really changes the password", async () => {
  const user = users.success;
  const before = await User.findByPk(user.id);
  const out = await call(changePassword, changeReq(user.id, IP_SUCCESS, CURRENT, NEW));
  assert.equal(out.status, 200, "a correct change must succeed");
  assert.equal(out.body.success, true, "the success flag must be set");
  assert.ok(out.body.token, "a fresh token must be issued for the current session");
  const after = await User.findByPk(user.id);
  assert.equal(await bcrypt.compare(NEW, after.password), true, "the stored hash must match the new password");
  assert.equal(after.token_version, (before.token_version || 1) + 1, "token_version must bump so old sessions die");
});

test("a successful change clears the failure budget", async () => {
  const user = users.reset;
  for (let i = 0; i < 4; i += 1) {
    const out = await call(changePassword, changeReq(user.id, IP_RESET, WRONG, NEW));
    assert.equal(out.status, 401, `wrong attempt ${i + 1} must be refused`);
  }
  const ok = await call(changePassword, changeReq(user.id, IP_RESET, CURRENT, NEW));
  assert.equal(ok.status, 200, "the correct change must succeed");
  const afterReset = await call(changePassword, changeReq(user.id, IP_RESET, WRONG, NEW));
  assert.equal(afterReset.status, 401, "one more wrong attempt must still be refused");
  const stillOpen = await passes({ headers: { "x-forwarded-for": IP_RESET } });
  assert.equal(stillOpen.passed, true, "the IP must not be blocked: the success cleared the four failures");
});

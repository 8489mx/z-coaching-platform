import test from "node:test";
import assert from "node:assert/strict";

import router from "../src/api/routes/intake.routes.js";
import { getClientIntakeDraft, saveDraftIntake } from "../src/api/controllers/intake.controller.js";
import { intakeRateLimiter, resetAttempts } from "../src/api/middlewares/rateLimiter.js";
import { User, RateLimitLog } from "../src/api/models/index.js";
import sequelize from "../src/api/config/database.js";
import { buildHealthDataConsent } from "../frontend/src/config/healthDataConsent.js";

/**
 * Reading or writing a client's intake needs the code and the phone on file, but nothing limited
 * guessing: a script could try codes and phones without end. Wrong pairs now count as failed
 * attempts (the same store as the client login), and after five the IP gets 429 for 15 minutes.
 */
const CODE = "TEST_INTAKE_GUESS_982";
const IP = "203.0.113.82";
const call = async (fn, req) => { const out = {}; await fn(req, { status(c) { out.status = c; return this; }, json(b) { out.body = b; return this; }, setHeader() {} }); return out; };
const passes = async (req) => { let passed = false; const out = await call((r, s) => intakeRateLimiter(r, s, () => { passed = true; }), req); return { passed, status: out.status }; };

let client;
test.before(async () => {
  const old = await User.findOne({ where: { client_code: CODE } });
  if (old) await old.destroy();
  client = await User.create({ client_code: CODE, phone_number: "01099000982", full_name: "Guess Test", role: "CLIENT" });
  resetAttempts(IP);
});
test.after(async () => {
  resetAttempts(IP);
  await RateLimitLog.destroy({ where: { ip_address: IP } }).catch(() => {});
  await client?.destroy().catch(() => {});
  await sequelize.close().catch(() => {});
});

test("the public intake routes run the limiter first", () => {
  for (const path of ["/client-draft", "/save-draft", "/submit"]) {
    const layer = router.stack.find((l) => l.route?.path === path);
    assert.equal(layer.route.stack[0].handle, intakeRateLimiter, path);
  }
});

test("five wrong code/phone pairs block the IP", async () => {
  const req = (phone) => ({ headers: { "x-forwarded-for": IP }, query: { client_code: CODE, phone }, body: {} });
  assert.equal((await passes(req("01000000001"))).passed, true);
  for (let i = 0; i < 3; i += 1) await call(getClientIntakeDraft, req(`0101111000${i}`));
  await call(saveDraftIntake, { headers: { "x-forwarded-for": IP }, body: { client_code: CODE, phone_number: "01011110009", answers: { health_data_consent: buildHealthDataConsent(new Date("2026-09-22T10:00:00Z")), gender: "male", age: "30", height_cm: "175", weight_kg: "80" } } });
  await call(getClientIntakeDraft, req("01011110008"));
  const blocked = await passes(req("01099000982"));
  assert.equal(blocked.passed, false);
  assert.equal(blocked.status, 429);
});

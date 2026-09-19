import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { submitPublicIntake, saveDraftIntake } from "../src/api/controllers/intake.controller.js";
import { User, IntakeSubmission } from "../src/api/models/index.js";
import { hasHealthDataConsent, buildHealthDataConsent, HEALTH_DATA_CONSENT_VERSION } from "../frontend/src/config/healthDataConsent.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function mockRes() {
  const out = { status: 200, body: null };
  const res = { status(c) { out.status = c; return res; }, json(b) { out.body = b; return res; } };
  return { res, out };
}

const answers = (extra = {}) => ({ gender: "male", age: "30", height_cm: "175", weight_kg: "80", ...extra });

test("consent helper: only an accepted, versioned, timestamped consent counts", () => {
  assert.equal(hasHealthDataConsent({}), false);
  assert.equal(hasHealthDataConsent({ health_data_consent: { accepted: false, version: "", accepted_at: "" } }), false);
  assert.equal(hasHealthDataConsent({ health_data_consent: { accepted: true } }), false);
  const c = buildHealthDataConsent(new Date("2026-09-19T10:00:00Z"));
  assert.deepEqual(c, { accepted: true, version: HEALTH_DATA_CONSENT_VERSION, accepted_at: "2026-09-19T10:00:00.000Z" });
  assert.equal(hasHealthDataConsent({ health_data_consent: c }), true);
});

test("intake submit and draft save are refused without consent, before any user or answer is written", async () => {
  const writes = [];
  const originals = { userFind: User.findOne, userCreate: User.create, subFind: IntakeSubmission.findOne, subCreate: IntakeSubmission.create };
  User.findOne = async () => { writes.push("user.find"); return null; };
  User.create = async () => { writes.push("user.create"); return null; };
  IntakeSubmission.findOne = async () => { writes.push("intake.find"); return null; };
  IntakeSubmission.create = async () => { writes.push("intake.create"); return null; };
  try {
    for (const handler of [submitPublicIntake, saveDraftIntake]) {
      const r = mockRes();
      await handler({ body: { client_code: "TEST_CONSENT_1", phone_number: "01099000999", answers: answers() } }, r.res);
      assert.equal(r.out.status, 400, handler.name);
      assert.equal(r.out.body.code, "HEALTH_DATA_CONSENT_REQUIRED");
    }
    assert.deepEqual(writes, [], "no database access happens without consent");
  } finally {
    Object.assign(User, { findOne: originals.userFind, create: originals.userCreate });
    Object.assign(IntakeSubmission, { findOne: originals.subFind, create: originals.subCreate });
  }
});

test("the intake form puts the consent first and gates draft sync, navigation and submit on it", () => {
  const src = fs.readFileSync(path.join(ROOT, "frontend/src/pages/FullIntakeForm.jsx"), "utf8");
  assert.match(src, /const DEFAULT_MASTER_INTAKE = \{\s*\/\/[^\n]*\n\s*health_data_consent: \{ accepted: false/);
  assert.match(src, /if \(code !== 'guest' && consentGiven\)/);
  assert.match(src, /if \(step > 1 && !consentGiven\)/);
  assert.match(src, /const handleSubmit = async \(\) => \{\s*if \(!consentGiven\)/);
  assert.ok(src.indexOf("role=\"checkbox\"") > src.indexOf("{currentStep === 1 && ("), "consent is inside step 1");
  assert.ok(src.indexOf("role=\"checkbox\"") < src.indexOf("{/* Gender Switcher */}"), "and before the first question");
});

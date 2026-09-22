import test from "node:test";
import assert from "node:assert/strict";

import { submitPublicIntake, saveDraftIntake, getClientIntakeDraft } from "../src/api/controllers/intake.controller.js";
import { User, IntakeSubmission } from "../src/api/models/index.js";
import sequelize from "../src/api/config/database.js";
import { buildHealthDataConsent } from "../frontend/src/config/healthDataConsent.js";
import { decryptMedicalData } from "../src/utils/crypto.js";

/**
 * Client codes are sequential (1001, 1002 ...). save-draft and submit found the client by the code
 * alone: anyone could overwrite a real client's medical intake and rename them, and submit returned
 * the client's record with the phone number - which then opened client-draft (code + phone).
 * Writing now needs the phone on file too; submit no longer returns the client record.
 */
const CODE = "TEST_INTAKE_OWNER_981";
const PHONE = "01099000981";
const call = async (fn, req) => { const out = {}; await fn(req, { status(c) { out.status = c; return this; }, json(b) { out.body = b; return this; } }); return out; };
const answers = (weight) => ({ health_data_consent: buildHealthDataConsent(new Date("2026-09-22T10:00:00Z")), gender: "male", age: "30", height_cm: "175", weight_kg: String(weight) });
const storedWeight = async (userId) => {
  const sub = await IntakeSubmission.findOne({ where: { user_id: userId }, order: [["id", "DESC"]] });
  const payload = sub.answers?._isEncrypted ? decryptMedicalData(sub.answers.data) : sub.answers;
  return (payload.answers || payload).weight_kg;
};

let client;
test.before(async () => {
  const old = await User.findOne({ where: { client_code: CODE } });
  if (old) { await IntakeSubmission.destroy({ where: { user_id: old.id } }); await old.destroy(); }
  client = await User.create({ client_code: CODE, phone_number: PHONE, full_name: "Real Client", role: "CLIENT" });
  const saved = await call(saveDraftIntake, { body: { client_code: CODE, phone_number: PHONE, answers: answers(80) } });
  assert.equal(saved.status, 200, JSON.stringify(saved.body));
});
test.after(async () => {
  await IntakeSubmission.destroy({ where: { user_id: client.id } }).catch(() => {});
  await client?.destroy().catch(() => {});
  await sequelize.close().catch(() => {});
});

test("a draft save with the code but another phone (or none) is refused and changes nothing", async () => {
  for (const phone of ["01011112222", undefined]) {
    const out = await call(saveDraftIntake, { body: { client_code: CODE, phone_number: phone, answers: answers(150) } });
    assert.equal(out.status, 403, JSON.stringify(out.body));
  }
  assert.equal(await storedWeight(client.id), "80");
});

test("a submit with the code but another phone (or none) is refused; the name and answers stay", async () => {
  for (const phone of ["01011112222", undefined]) {
    const out = await call(submitPublicIntake, { body: { client_code: CODE, phone_number: phone, full_name: "Attacker", answers: answers(150) } });
    assert.equal(out.status, 403, JSON.stringify(out.body));
    assert.ok(!JSON.stringify(out.body).includes(PHONE), "the phone never leaks");
  }
  await client.reload();
  assert.equal(client.full_name, "Real Client");
  assert.equal(await storedWeight(client.id), "80");
});

test("the client with their own code and phone saves and submits; the reply carries no client record", async () => {
  const out = await call(submitPublicIntake, { body: { client_code: CODE, phone_number: PHONE, answers: answers(81) } });
  assert.equal(out.status, 201, JSON.stringify(out.body));
  assert.equal(out.body.user, undefined);
  assert.ok(!JSON.stringify(out.body).includes(PHONE));
  assert.equal(await storedWeight(client.id), "81");
});

test("reading the draft still needs the matching phone", async () => {
  const wrong = await call(getClientIntakeDraft, { query: { client_code: CODE, phone: "01011112222" } });
  assert.equal(wrong.body.submission, null);
});

/* Guard for audit finding S3-1: a client whose training is under an active
   clinical lockout (cardiac red flag, syncope, exertional chest pain) must
   never have a fresh ACTIVE cycle auto-published. The lockout is enforced
   at client-view time today, but prepareNextCycle created the new program
   ACTIVE without checking it. The fix adds the lockout to the
   evaluateAutoPublish inputs in prepareNextCycle; runDueCycles and the
   daily scheduler both go through prepareNextCycle, so one gate covers
   every publish path. getActiveClinicalLockout already fails closed
   (locked:true on lookup error), and that must be preserved: a failed
   lookup must wait for the coach, never publish. */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { evaluateAutoPublish } from "../src/api/services/nextCycleService.js";

const recent = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
const clean = { summary: { exercises_needing_coach_review: [] }, last_checkin_at: recent };

test("an active clinical lockout blocks auto-publish and names the directive", () => {
  const decision = evaluateAutoPublish({
    ...clean,
    clinical_lockout: {
      locked: true,
      checkin_id: 7,
      week_number: 3,
      directive_ar: "إيقاف النشاط التدريبي فوراً والرجوع للطبيب المعالج.",
    },
  });
  assert.equal(decision.allowed, false);
  assert.ok(decision.reasons_ar.some((reason) => /قفل سريري/.test(reason)));
  assert.ok(decision.reasons_ar.some((reason) => reason.includes("إيقاف النشاط التدريبي")));
});

test("a failed lockout lookup blocks auto-publish instead of assuming unlocked", () => {
  const decision = evaluateAutoPublish({
    ...clean,
    clinical_lockout: { locked: true, error: true, directive_ar: "تعذر التحقق من الأمان السريري." },
  });
  assert.equal(decision.allowed, false);
});

test("no lockout means the cycle may publish as before", () => {
  assert.equal(evaluateAutoPublish({ ...clean, clinical_lockout: { locked: false } }).allowed, true);
});

test("prepareNextCycle passes the live lockout into the publish decision", () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const controller = fs.readFileSync(
    path.join(root, "src/api/controllers/program.controller.js"),
    "utf8"
  );
  const start = controller.indexOf("export const prepareNextCycle =");
  const end = controller.indexOf("export const runDueCycles =", start);
  assert.ok(start >= 0 && end > start, "prepareNextCycle handler not found");
  const body = controller.slice(start, end);
  assert.ok(body.includes("getActiveClinicalLockout"), "handler must read the live clinical lockout");
  assert.ok(body.includes("clinical_lockout"), "handler must pass the lockout to evaluateAutoPublish");
});

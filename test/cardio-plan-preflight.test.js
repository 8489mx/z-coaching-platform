import test from "node:test";
import assert from "node:assert/strict";

import { evaluateCardioPlanPreflight } from "../src/cardio-plan-preflight/index.js";
import { CardioPreflightResult, CardioPreflightIssueCode, CardioPreflightIssueSeverity } from "../src/cardio-plan-preflight/domain/enums.js";

const baseSchedule = {
  schedule_version: "weekly-cardio-schedule-v1",
  status: "READY",
  schedule_review_required: false,
  recommended_sessions: 2,
  sessions: [
    { sequence: 1 },
    { sequence: 2 },
  ],
  reasons: [],
};

test("Cardio Plan Preflight Tests", async (t) => {
  await t.test("It passes a valid READY plan", () => {
    const result = evaluateCardioPlanPreflight(baseSchedule);
    assert.equal(result.result, CardioPreflightResult.PASSED);
    assert.equal(result.can_approve, true);
    assert.equal(result.issues.length, 0);
  });

  await t.test("It requires review for PROVISIONAL_REVIEW_REQUIRED status", () => {
    const provisionalPlan = { ...baseSchedule, status: "PROVISIONAL_REVIEW_REQUIRED" };
    const result = evaluateCardioPlanPreflight(provisionalPlan);
    assert.equal(result.result, CardioPreflightResult.REVIEW_REQUIRED);
    assert.equal(result.can_approve, false);
    assert.equal(result.issues[0].code, CardioPreflightIssueCode.UPSTREAM_REVIEW_REQUIRED);
  });

  await t.test("It requires review for HIGH sport day conflicts", () => {
    const highSportPlan = { 
      ...baseSchedule, 
      status: "PROVISIONAL_REVIEW_REQUIRED",
      schedule_review_required: true 
    };
    const result = evaluateCardioPlanPreflight(highSportPlan);
    assert.equal(result.result, CardioPreflightResult.REVIEW_REQUIRED);
    assert.equal(result.can_approve, false);
    assert.equal(result.issues[0].code, CardioPreflightIssueCode.HIGH_SPORT_DAY_REQUIRES_REVIEW);
  });

  await t.test("It returns WITHHELD and blocks a WITHHELD plan", () => {
    const withheldPlan = { 
      ...baseSchedule, 
      status: "WITHHELD",
      recommended_sessions: 0,
      sessions: [] 
    };
    const result = evaluateCardioPlanPreflight(withheldPlan);
    assert.equal(result.result, CardioPreflightResult.WITHHELD);
    assert.equal(result.can_approve, false);
    assert.equal(result.issues[0].code, CardioPreflightIssueCode.PLAN_WITHHELD);
  });

  await t.test("It throws TypeError for mismatched sessions array length", () => {
    const invalidPlan = { ...baseSchedule, sessions: [{ sequence: 1 }] }; // Expected 2, got 1
    assert.throws(() => evaluateCardioPlanPreflight(invalidPlan), TypeError);
  });

  await t.test("It throws TypeError for READY plan that has review flags", () => {
    const invalidPlan = { ...baseSchedule, schedule_review_required: true };
    assert.throws(() => evaluateCardioPlanPreflight(invalidPlan), TypeError);
  });
});

/* Reproduction for audit finding R2: the intake adapter must not erase
   UNKNOWN / UNSTABLE stability or POSSIBLY_PREGNANT / UNKNOWN pregnancy
   status, because the safety rules use exactly those values to require
   medical review or to block. Direct canonical evaluation already does
   this (see test/domain-branches.test.js); the adapted path must agree. */
import test from "node:test";
import assert from "node:assert/strict";

import { adaptIntakePayloadToCanonicalEngine } from "../src/intake-decision-engine/adapters/intake-adapter.js";
import { evaluateIntake, PlanStatus } from "../src/intake-decision-engine/index.js";
import { ASSESSMENT_CONTEXT, completeIntake } from "./fixtures/complete-intake.js";

const context = { assessmentDate: ASSESSMENT_CONTEXT.assessmentDate };

function evaluateAdapted(overrides) {
  const adapted = adaptIntakePayloadToCanonicalEngine(completeIntake(overrides));
  return { adapted, decision: evaluateIntake(adapted, context) };
}

function condition(stability) {
  return {
    conditionCode: "DIABETES",
    stability,
    physicianInstructions: [],
    otherConditionText: null,
  };
}

test("adapter preserves UNKNOWN condition stability so medical review is required", () => {
  const { adapted, decision } = evaluateAdapted({
    medical: { conditions: [condition("UNKNOWN")] },
  });
  assert.equal(adapted.medical.conditions[0].stability, "UNKNOWN");
  assert.equal(decision.plan_status, PlanStatus.MEDICAL_REVIEW_REQUIRED);
  assert.ok(decision.review_flags.some((flag) => flag.code === "CONDITION_NOT_STABLE"));
});

test("adapter preserves UNSTABLE condition stability so medical review is required", () => {
  const { adapted, decision } = evaluateAdapted({
    medical: { conditions: [condition("UNSTABLE")] },
  });
  assert.equal(adapted.medical.conditions[0].stability, "UNSTABLE");
  assert.equal(decision.plan_status, PlanStatus.MEDICAL_REVIEW_REQUIRED);
});

test("adapter preserves POSSIBLY_PREGNANT so medical review is required", () => {
  const { adapted, decision } = evaluateAdapted({
    medical: { pregnancyStatus: "POSSIBLY_PREGNANT" },
  });
  assert.equal(adapted.medical.pregnancyStatus, "POSSIBLY_PREGNANT");
  assert.equal(decision.plan_status, PlanStatus.MEDICAL_REVIEW_REQUIRED);
});

test("adapter preserves UNKNOWN pregnancy status so the intake is blocked", () => {
  const { adapted, decision } = evaluateAdapted({
    medical: { pregnancyStatus: "UNKNOWN" },
  });
  assert.equal(adapted.medical.pregnancyStatus, "UNKNOWN");
  assert.equal(decision.plan_status, PlanStatus.BLOCKED);
});

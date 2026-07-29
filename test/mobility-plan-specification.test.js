import test from "node:test";
import assert from "node:assert/strict";

import { completeIntake } from "./fixtures/complete-intake.js";
import { evaluateIntake } from "../src/intake-decision-engine/index.js";
import { buildMobilityPlanSpecification } from "../src/mobility-plan-specification/index.js";
import { MobilityFormalSessionState, MobilityPlanStatus } from "../src/mobility-plan-specification/domain/enums.js";
import { MobilityStrategy, PlanStatus } from "../src/intake-decision-engine/domain/enums.js";

test("buildMobilityPlanSpecification maps a READY_FOR_DRAFT decision to a valid specification", () => {
  const intake = completeIntake();
  const decision = evaluateIntake(intake, { assessmentDate: "2026-07-29" });
  
  assert.equal(decision.plan_status, PlanStatus.READY_FOR_DRAFT);
  assert.equal(decision.mobility_decision.strategy, MobilityStrategy.INTEGRATED_AND_SEPARATE);

  const spec = buildMobilityPlanSpecification(decision);
  assert.equal(spec._version, "mobility-plan-spec-v1");
  assert.equal(spec.plan_status, MobilityPlanStatus.READY);
  assert.equal(spec.strategy, MobilityStrategy.INTEGRATED_AND_SEPARATE);
  assert.equal(spec.formal_session_state, MobilityFormalSessionState.PRESCRIPTION_REQUIRED);
  assert.equal(spec.max_duration_minutes, 5);
});

test("throws TypeError if intakeDecision is missing or invalid", () => {
  assert.throws(() => buildMobilityPlanSpecification(null), TypeError);
  assert.throws(() => buildMobilityPlanSpecification({}), TypeError);
});

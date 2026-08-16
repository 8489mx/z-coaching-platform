import test from "node:test";
import assert from "node:assert/strict";

import { completeIntake } from "./fixtures/complete-intake.js";
import { evaluateIntake } from "../src/intake-decision-engine/index.js";
import { buildMobilityEngine } from "../src/mobility-engine/index.js";
import { MobilityApprovalState } from "../src/mobility-plan-preflight/domain/enums.js";
import { MobilityStrategy } from "../src/intake-decision-engine/domain/enums.js";

const VALID_MINIMAL_PROFILE = completeIntake();

test("Mobility Engine Pipeline Tests", async (t) => {
  await t.test("It generates a full APPROVED pipeline for a healthy client", () => {
    const intakeDecision = evaluateIntake(VALID_MINIMAL_PROFILE, { assessmentDate: "2026-07-29" });
    const weeklyTrainingSchedule = {
      schedule_mode: "FIXED_DAYS",
      sessions: [
        { scheduled_day: "MONDAY", sequence: null },
      ]
    };

    const result = buildMobilityEngine(intakeDecision, weeklyTrainingSchedule);

    assert.equal(result.plan_specification.plan_status, "READY");
    assert.equal(result.prescription.status, "READY");
    assert.equal(result.weekly_schedule.status, "READY");
    assert.equal(result.preflight_report.approval_state, MobilityApprovalState.APPROVED);
    
    // We default to INTEGRATED_AND_SEPARATE in rules for mobility
    assert.equal(result.plan_specification.strategy, MobilityStrategy.INTEGRATED_AND_SEPARATE);
    
    // Should have scheduled on all days provided
    assert.equal(result.weekly_schedule.scheduled_days.length, 7);
  });

  await t.test("It blocks pipeline and returns PROVISIONAL_REVIEW_REQUIRED for an injured client", () => {
    const injuredProfile = completeIntake({
      training: {
        injuries: [{
          area: "LOWER_BACK",
          painLevel: 4,
          movementImpact: "LIMITS",
          worsening: false,
          numbnessOrWeakness: false,
          affectedMovements: [],
          medicalRestrictions: []
        }]
      }
    });
    const intakeDecision = evaluateIntake(injuredProfile, { assessmentDate: "2026-07-29" });
    const weeklyTrainingSchedule = {
      schedule_mode: "FIXED_DAYS",
      sessions: [
        { scheduled_day: "MONDAY", sequence: null },
      ]
    };

    const result = buildMobilityEngine(intakeDecision, weeklyTrainingSchedule);

    assert.equal(result.plan_specification.plan_status, "PROVISIONAL_REVIEW_REQUIRED");
    assert.equal(result.prescription.status, "PROVISIONAL_REVIEW_REQUIRED");
    assert.equal(result.weekly_schedule.status, "PROVISIONAL_REVIEW_REQUIRED");
    assert.equal(result.preflight_report.approval_state, MobilityApprovalState.PROVISIONAL_REVIEW_REQUIRED);
    assert.equal(result.weekly_schedule.scheduled_days.length, 0);
  });
});

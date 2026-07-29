import test from "node:test";
import assert from "node:assert/strict";

import { evaluateIntake } from "../src/intake-decision-engine/index.js";
import { buildMobilityEngine } from "../src/mobility-engine/index.js";
import { MobilityApprovalState } from "../src/mobility-plan-preflight/domain/enums.js";
import { MobilityStrategy } from "../src/intake-decision-engine/domain/enums.js";

const VALID_MINIMAL_PROFILE = Object.freeze({
  age_years: 30,
  sex: "MALE",
  biological_sex: "MALE",
  bmi: 22,
  activity_level: "SEDENTARY",
  sleep_quality: "GOOD",
  primary_goal: "MUSCLE_GAIN",
  training_experience: "INTERMEDIATE",
  preferred_session_duration: 60,
  available_days_per_week: 3,
  available_equipment: ["DUMBBELLS"],
  available_cardio_equipment: [],
  medical_conditions: [],
  movement_restrictions: [],
  injuries: [],
  dietary_preference: "OMNIVORE",
  budget_level: "MEDIUM"
});

test("Mobility Engine Pipeline Tests", async (t) => {
  await t.test("It generates a full APPROVED pipeline for a healthy client", () => {
    const intakeDecision = evaluateIntake(VALID_MINIMAL_PROFILE);
    const weeklyTrainingSchedule = {
      scheduled_days: [
        { day_of_week: "MONDAY", sequence: null, has_primary_training: true },
        { day_of_week: "TUESDAY", sequence: null, has_primary_training: false }
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
    assert.equal(result.weekly_schedule.scheduled_days.length, 2);
  });

  await t.test("It blocks pipeline and returns PROVISIONAL_REVIEW_REQUIRED for an injured client", () => {
    const injuredProfile = { ...VALID_MINIMAL_PROFILE, injuries: ["LOWER_BACK"] };
    const intakeDecision = evaluateIntake(injuredProfile);
    const weeklyTrainingSchedule = {
      scheduled_days: [
        { day_of_week: "MONDAY", sequence: null, has_primary_training: true },
        { day_of_week: "TUESDAY", sequence: null, has_primary_training: false }
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

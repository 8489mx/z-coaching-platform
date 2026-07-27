import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { evaluateIntake } from "../src/intake-decision-engine/index.js";
import { buildCardioEngine } from "../src/cardio-engine/index.js";
import { CardioPreflightResult } from "../src/cardio-plan-preflight/index.js";

function buildContext() {
  const file = readFileSync(new URL("../examples/evaluation-context.json", import.meta.url), "utf-8");
  return JSON.parse(file);
}

function buildReadyIntake() {
  const file = readFileSync(new URL("../examples/full-intake.json", import.meta.url), "utf-8");
  const intake = JSON.parse(file);
  intake.medical.conditions = [];
  intake.nutrition.allergies = [];
  intake.training.equipment = [
    { equipmentCode: "DUMBBELLS", otherEquipmentText: null, loadCapacity: "HEAVY" },
    { equipmentCode: "BARBELL_AND_PLATES", otherEquipmentText: null, loadCapacity: "HEAVY" },
    { equipmentCode: "PULL_UP_BAR", otherEquipmentText: null, loadCapacity: "HEAVY" },
    { equipmentCode: "ADJUSTABLE_BENCH", otherEquipmentText: null, loadCapacity: "HEAVY" },
    { equipmentCode: "CABLE_STATION", otherEquipmentText: null, loadCapacity: "HEAVY" }
  ];
  intake.training.location = "GYM";
  return intake;
}

test("Cardio Engine Facade Tests", async (t) => {
  await t.test("It builds a complete cardio pipeline from intake to preflight", () => {
    const context = buildContext();
    const intake = buildReadyIntake();
    const intakeDecision = evaluateIntake(intake, context);
    
    // Create a mock weekly training schedule since training isn't the focus here,
    // but the builder needs to coordinate around it (or accept null/empty).
    const weeklyTrainingSchedule = {
      schedule_version: "weekly-training-schedule-v1",
      status: "READY",
      schedule_mode: "SESSION_SEQUENCE",
      sessions: [
        { sequence: 1, scheduled_day: null, sport_load: "NONE", schedule_reason_code: "SESSION_SEQUENCE_REQUIRED", exercises: [] },
        { sequence: 2, scheduled_day: null, sport_load: "NONE", schedule_reason_code: "SESSION_SEQUENCE_REQUIRED", exercises: [] },
        { sequence: 3, scheduled_day: null, sport_load: "NONE", schedule_reason_code: "SESSION_SEQUENCE_REQUIRED", exercises: [] }
      ],
      schedule_review_required: false,
      schedule_reasons: [],
      constraints: [],
      reasons: [],
      recommended_days: 3
    };

    const result = buildCardioEngine(
      intakeDecision,
      intake,
      weeklyTrainingSchedule
    );

    assert.equal(result.engine_version, "cardio-engine-v1");
    assert.equal(result.plan_specification.cardio_plan_spec_version, "cardio-plan-spec-v1");
    assert.equal(result.modality_requirements.cardio_modality_requirements_version, "cardio-modality-requirements-v1");
    assert.equal(result.prescription.cardio_prescription_version, "cardio-prescription-v1");
    assert.equal(result.weekly_schedule.schedule_version, "weekly-cardio-schedule-v1");
    assert.equal(result.preflight_report.preflight_version, "cardio-plan-preflight-v1");

    // The result should pass
    assert.equal(result.preflight_report.result, CardioPreflightResult.PASSED);
    assert.equal(result.preflight_report.can_approve, true);
  });
});

import test from "node:test";
import assert from "node:assert/strict";

import { evaluateIntake } from "../src/intake-decision-engine/index.js";
import { buildTrainingEngine, TRAINING_ENGINE_VERSION } from "../src/training-engine/index.js";

// We need to load the real examples
import { readFileSync } from "node:fs";

function buildContext() {
  const file = readFileSync(new URL("../examples/evaluation-context.json", import.meta.url), "utf-8");
  return JSON.parse(file);
}

function buildIntake() {
  const file = readFileSync(new URL("../examples/full-intake.json", import.meta.url), "utf-8");
  const intake = JSON.parse(file);
  // Clear the conditions and allergies to make it READY by default
  intake.medical.conditions = [];
  intake.nutrition.allergies = [];
  // Ensure enough equipment for READY
  intake.training.equipment = [
    { equipmentCode: "DUMBBELLS", otherEquipmentText: null, loadCapacity: "HEAVY" },
    { equipmentCode: "BARBELL_AND_PLATES", otherEquipmentText: null, loadCapacity: "HEAVY" },
    { equipmentCode: "PULL_UP_BAR", otherEquipmentText: null, loadCapacity: "BODYWEIGHT_ONLY" },
    { equipmentCode: "ADJUSTABLE_BENCH", otherEquipmentText: null, loadCapacity: "HEAVY" },
    { equipmentCode: "CABLE_STATION", otherEquipmentText: null, loadCapacity: "HEAVY" }
  ];
  intake.training.location = "GYM";
  return intake;
}

test("Public API: TRAINING_ENGINE_VERSION is correct and function is available", () => {
  assert.equal(TRAINING_ENGINE_VERSION, "training-engine-v1");
  assert.equal(typeof buildTrainingEngine, "function");
});

test("End-to-End: full-intake with evaluation-context produces valid output structure", () => {
  const context = buildContext();
  const intake = buildIntake();
  const intakeDecision = evaluateIntake(intake, context);

  const engineOutput = buildTrainingEngine(intakeDecision);
  assert.equal(engineOutput.engine_version, "training-engine-v1");
  assert.ok(engineOutput.weekly_training_plan);
  assert.ok(engineOutput.preflight_report);
  assert.ok(engineOutput.weekly_training_plan.sessions.length > 0);
  
  const firstSession = engineOutput.weekly_training_plan.sessions[0];
  assert.ok(firstSession.exercises);
  assert.ok(firstSession.exercises.length > 0);
  
  const firstExercise = firstSession.exercises[0];
  assert.ok(firstExercise.prescription);

  assert.equal(
    engineOutput.weekly_training_plan.status,
    engineOutput.preflight_report.plan_status
  );
  
  // No intermediate objects should leak
  assert.equal("training_draft" in engineOutput, false);
  assert.equal("session_blueprint" in engineOutput, false);
  assert.equal("exercise_selection" in engineOutput, false);
});

test("READY: basic correct intake produces READY and PASSED", () => {
  const context = buildContext();
  const intake = buildIntake();
  const intakeDecision = evaluateIntake(intake, context);

  const engineOutput = buildTrainingEngine(intakeDecision);
  assert.equal(engineOutput.weekly_training_plan.status, "READY");
  assert.equal(engineOutput.preflight_report.result, "PASSED");
  assert.equal(engineOutput.preflight_report.can_approve, true);
});

test("COACH_REVIEW_REQUIRED: basic unconfirmed allergy produces PROVISIONAL_REVIEW_REQUIRED", () => {
  const context = buildContext();
  const intake = buildIntake();
  intake.nutrition.allergies = [{ substance: "SESAME", medicallyConfirmed: false }];
  const intakeDecision = evaluateIntake(intake, context);

  const engineOutput = buildTrainingEngine(intakeDecision);
  assert.equal(engineOutput.weekly_training_plan.status, "PROVISIONAL_REVIEW_REQUIRED");
  assert.equal(engineOutput.preflight_report.plan_status, "PROVISIONAL_REVIEW_REQUIRED");
  assert.equal(engineOutput.preflight_report.result, "REVIEW_REQUIRED");
  assert.equal(engineOutput.preflight_report.can_approve, false);
  assert.ok(engineOutput.weekly_training_plan.sessions.length > 0);
});

test("COACH_REVIEW_REQUIRED with 0 days produces PROVISIONAL_REVIEW_REQUIRED and no sessions", () => {
  const context = buildContext();
  const intake = buildIntake();
  // 0 max days per week triggers upstream error, but wait, 0 days is rejected in intake.
  // We can just force it via constraints if possible, or mock the intake decision.
  const intakeDecision = evaluateIntake(intake, context);
  // Force 0 days and COACH_REVIEW_REQUIRED
  intakeDecision.training_decision.max_days_per_week = 0;
  intakeDecision.plan_status = "COACH_REVIEW_REQUIRED";
  
  const engineOutput = buildTrainingEngine(intakeDecision);
  assert.equal(engineOutput.weekly_training_plan.status, "PROVISIONAL_REVIEW_REQUIRED");
  assert.equal(engineOutput.preflight_report.plan_status, "PROVISIONAL_REVIEW_REQUIRED");
  assert.equal(engineOutput.preflight_report.result, "REVIEW_REQUIRED");
  assert.equal(engineOutput.preflight_report.can_approve, false);
  assert.equal(engineOutput.weekly_training_plan.sessions.length, 0);
  assert.ok(engineOutput.preflight_report.issues.some((i) => i.code === "UPSTREAM_REVIEW_REQUIRED"));
});

test("MEDICAL_REVIEW_REQUIRED produces WITHHELD and PLAN_WITHHELD", () => {
  const context = buildContext();
  const intake = buildIntake();
  intake.medical.conditions = [
    {
      conditionCode: "THYROID_CONDITION",
      otherConditionText: null,
      stability: "UNSTABLE",
      physicianInstructions: [],
      unclassifiedInstructionsText: null
    }
  ];
  const intakeDecision = evaluateIntake(intake, context);

  const engineOutput = buildTrainingEngine(intakeDecision);
  assert.equal(engineOutput.weekly_training_plan.status, "WITHHELD");
  assert.equal(engineOutput.weekly_training_plan.sessions.length, 0);
  assert.equal(engineOutput.preflight_report.plan_status, "WITHHELD");
  assert.equal(engineOutput.preflight_report.result, "WITHHELD");
  assert.equal(engineOutput.preflight_report.can_approve, false);
  assert.ok(engineOutput.preflight_report.issues.some((i) => i.code === "PLAN_WITHHELD"));
});

test("BLOCKED produces WITHHELD and PLAN_WITHHELD", () => {
  const context = buildContext();
  const intake = buildIntake();
  intake.personal.dateOfBirth = "2015-01-01"; // Age 11 -> BLOCKED
  const intakeDecision = evaluateIntake(intake, context);

  const engineOutput = buildTrainingEngine(intakeDecision);
  assert.equal(engineOutput.weekly_training_plan.status, "WITHHELD");
  assert.equal(engineOutput.weekly_training_plan.sessions.length, 0);
  assert.equal(engineOutput.preflight_report.plan_status, "WITHHELD");
  assert.equal(engineOutput.preflight_report.result, "WITHHELD");
  assert.equal(engineOutput.preflight_report.can_approve, false);
  assert.ok(engineOutput.preflight_report.issues.some((i) => i.code === "PLAN_WITHHELD"));
});

test("Exercise Review Slot due to Injury Constraint", () => {
  const context = buildContext();
  const intake = buildIntake();
  const intakeDecision = evaluateIntake(intake, context);
  
  // Inject an injury constraint targeting SQUAT
  intakeDecision.hard_constraints.push({
    code: "INJURY_AFFECTED_MOVEMENT",
    scope: "TRAINING",
    value: { movement: "SQUAT", instruction: "AVOID" },
    reason: "Testing",
  });
  
  const engineOutput = buildTrainingEngine(intakeDecision);
  assert.equal(engineOutput.weekly_training_plan.status, "PROVISIONAL_REVIEW_REQUIRED");
  assert.equal(engineOutput.preflight_report.plan_status, "PROVISIONAL_REVIEW_REQUIRED");
  assert.equal(engineOutput.preflight_report.can_approve, false);
  
  assert.ok(engineOutput.preflight_report.issues.some((i) => i.code === "EXERCISE_SLOT_REQUIRES_REVIEW"));
  
  let foundSquatSlot = null;
  for (const session of engineOutput.weekly_training_plan.sessions) {
    for (const ex of session.exercises) {
      if (ex.slot_code === "KNEE_DOMINANT") {
        foundSquatSlot = ex;
      }
    }
  }
  assert.ok(foundSquatSlot);
  assert.equal(foundSquatSlot.selection_status, "REVIEW_REQUIRED");
  assert.equal(foundSquatSlot.prescription, null);
});

test("High Sport Day causes REVIEW_REQUIRED", () => {
  const context = buildContext();
  const intake = buildIntake();
  intake.cardio.additionalSports = [
    {
      sportCode: "FOOTBALL",
      otherSportText: null,
      participationLevel: "COMPETITIVE",
      daysPerWeek: 1,
      averageSessionMinutes: 60,
      actualDays: ["MONDAY"]
    }
  ];
  intake.training.trainingScheduleAvailabilityType = "FIXED_AVAILABLE_DAYS";
  intake.training.availableTrainingDays = ["MONDAY", "TUESDAY", "WEDNESDAY"];
  
  const intakeDecision = evaluateIntake(intake, context);
  const engineOutput = buildTrainingEngine(intakeDecision);
  
  assert.equal(engineOutput.weekly_training_plan.status, "PROVISIONAL_REVIEW_REQUIRED");
  assert.equal(engineOutput.weekly_training_plan.schedule_review_required, true);
  
  assert.equal(engineOutput.preflight_report.plan_status, "PROVISIONAL_REVIEW_REQUIRED");
  assert.equal(engineOutput.preflight_report.can_approve, false);
  assert.ok(engineOutput.preflight_report.issues.some((i) => i.code === "HIGH_SPORT_DAY_REQUIRES_REVIEW"));
});

test("SESSION_SEQUENCE: unmapped days remain null and order is untouched", () => {
  const context = buildContext();
  const intake = buildIntake();
  intake.training.trainingScheduleAvailabilityType = "FLEXIBLE";
  
  const intakeDecision = evaluateIntake(intake, context);
  const engineOutput = buildTrainingEngine(intakeDecision);
  
  for (const session of engineOutput.weekly_training_plan.sessions) {
    assert.equal(session.scheduled_day, null);
  }
});

test("intakeDecision is not mutated", () => {
  const context = buildContext();
  const intake = buildIntake();
  const intakeDecision = evaluateIntake(intake, context);
  
  const stringifiedBefore = JSON.stringify(intakeDecision);
  buildTrainingEngine(intakeDecision);
  const stringifiedAfter = JSON.stringify(intakeDecision);
  
  assert.equal(stringifiedBefore, stringifiedAfter);
});

test("Invalid inputs throw TypeError from upstream", () => {
  assert.throws(() => {
    buildTrainingEngine(null);
  }, TypeError);
  
  assert.throws(() => {
    buildTrainingEngine({});
  }, TypeError);
});

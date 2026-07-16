import test from "node:test";
import assert from "node:assert/strict";

import { evaluateIntake } from "../src/intake-decision-engine/index.js";
import { buildTrainingEngine, TRAINING_ENGINE_VERSION } from "../src/training-engine/index.js";
import { buildTrainingDraft } from "../src/training-draft/index.js";
import { buildWeeklyTrainingSchedule } from "../src/weekly-training-schedule/index.js";
import { evaluateTrainingPlanPreflight } from "../src/training-plan-preflight/index.js";

import { readFileSync } from "node:fs";

function buildContext() {
  const file = readFileSync(new URL("../examples/evaluation-context.json", import.meta.url), "utf-8");
  return JSON.parse(file);
}

// Helper to create a READY intake (modified from full-intake)
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

test("Public API: TRAINING_ENGINE_VERSION is correct and function is available", () => {
  assert.equal(TRAINING_ENGINE_VERSION, "training-engine-v1");
  assert.equal(typeof buildTrainingEngine, "function");
});

test("End-to-End Actual: full-intake with evaluation-context produces valid output structure (PROVISIONAL_REVIEW_REQUIRED)", () => {
  const context = buildContext();
  const file = readFileSync(new URL("../examples/full-intake.json", import.meta.url), "utf-8");
  const intake = JSON.parse(file);
  const intakeDecision = evaluateIntake(intake, context);

  const engineOutput = buildTrainingEngine(intakeDecision);
  
  // The actual full-intake.json produces PROVISIONAL_REVIEW_REQUIRED because of UNCONFIRMED_FOOD_ALLERGY or other reviews.
  assert.equal(engineOutput.engine_version, "training-engine-v1");
  assert.equal(engineOutput.weekly_training_plan.status, "PROVISIONAL_REVIEW_REQUIRED");
  assert.equal(engineOutput.preflight_report.plan_status, "PROVISIONAL_REVIEW_REQUIRED");
  assert.equal(engineOutput.preflight_report.result, "REVIEW_REQUIRED");
  assert.equal(engineOutput.preflight_report.can_approve, false);
});

test("Pass-through: output is exactly equal to the composition of the three pipelines", () => {
  const context = buildContext();
  const file = readFileSync(new URL("../examples/full-intake.json", import.meta.url), "utf-8");
  const intake = JSON.parse(file);
  const intakeDecision = evaluateIntake(intake, context);

  const expectedDraft = buildTrainingDraft(intakeDecision);
  const expectedWeekly = buildWeeklyTrainingSchedule(expectedDraft);
  const expectedPreflight = evaluateTrainingPlanPreflight(expectedWeekly);

  const actual = buildTrainingEngine(intakeDecision);

  assert.deepEqual(actual.weekly_training_plan, expectedWeekly);
  assert.deepEqual(actual.preflight_report, expectedPreflight);
  
  // Check leaks
  assert.equal("training_draft" in actual, false);
  assert.equal("session_blueprint" in actual, false);
  assert.equal("exercise_selection" in actual, false);
  assert.equal("training_prescription" in actual, false);
  assert.equal("prescription" in actual, false);
});

test("READY: basic correct intake produces READY and PASSED", () => {
  const context = buildContext();
  const intake = buildReadyIntake();
  const intakeDecision = evaluateIntake(intake, context);

  const engineOutput = buildTrainingEngine(intakeDecision);
  assert.equal(engineOutput.weekly_training_plan.status, "READY");
  assert.equal(engineOutput.preflight_report.result, "PASSED");
  assert.equal(engineOutput.preflight_report.can_approve, true);
});

test("COACH_REVIEW_REQUIRED: basic unconfirmed allergy produces PROVISIONAL_REVIEW_REQUIRED", () => {
  const context = buildContext();
  const intake = buildReadyIntake();
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
  const intake = buildReadyIntake();
  const intakeDecision = evaluateIntake(intake, context);
  
  // Force 0 recommended days and COACH_REVIEW_REQUIRED directly on the IntakeDecision fixture
  intakeDecision.plan_status = "COACH_REVIEW_REQUIRED";
  intakeDecision.training_decision.recommended_days = 0;
  
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
  const intake = buildReadyIntake();
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
  const intake = buildReadyIntake();
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
  const intake = buildReadyIntake();
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
  const intake = buildReadyIntake();
  intake.cardio.additionalSports = [
    {
      sportCode: "FOOTBALL",
      otherSportText: null,
      days: ["MONDAY", "WEDNESDAY", "FRIDAY"],
      minutesPerSession: 60,
      intensity: "HIGH",
      participationLevel: "COMPETITIVE"
    }
  ];
  intake.training.trainingScheduleAvailabilityType = "FIXED_AVAILABLE_DAYS";
  intake.training.availableTrainingDays = ["MONDAY", "WEDNESDAY", "FRIDAY"];
  
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
  const intake = buildReadyIntake();
  intake.training.trainingScheduleAvailabilityType = "VARIABLE";
  intake.training.availableTrainingDays = [];
  intake.training.unavailableTrainingDays = [];
  
  const intakeDecision = evaluateIntake(intake, context);
  const engineOutput = buildTrainingEngine(intakeDecision);
  
  assert.equal(engineOutput.weekly_training_plan.schedule_mode, "SESSION_SEQUENCE");
  for (const session of engineOutput.weekly_training_plan.sessions) {
    assert.equal(session.scheduled_day, null);
  }
});

test("intakeDecision is not mutated", () => {
  const context = buildContext();
  const intake = buildReadyIntake();
  const intakeDecision = evaluateIntake(intake, context);
  
  const stringifiedBefore = JSON.stringify(intakeDecision);
  buildTrainingEngine(intakeDecision);
  const stringifiedAfter = JSON.stringify(intakeDecision);
  
  assert.equal(stringifiedBefore, stringifiedAfter);
});

test("Invalid inputs throw TypeError from upstream", () => {
  const inputs = [null, undefined, [], {}, "string", 123];
  
  for (const input of inputs) {
    assert.throws(() => {
      buildTrainingEngine(input);
    }, TypeError, `Should throw TypeError for ${JSON.stringify(input)}`);
  }
});

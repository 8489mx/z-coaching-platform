import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

import { evaluateIntake, PlanStatus } from "../src/intake-decision-engine/index.js";
import { TRAINING_PLAN_SPEC_VERSION } from "../src/training-plan-specification/index.js";
import { TRAINING_SESSION_BLUEPRINT_VERSION } from "../src/training-session-blueprint/index.js";
import { EXERCISE_SELECTION_VERSION } from "../src/exercise-selection/index.js";
import { TRAINING_PRESCRIPTION_VERSION } from "../src/training-prescription/index.js";
import { buildTrainingDraft, TRAINING_DRAFT_VERSION } from "../src/training-draft/index.js";
import { TrainingPlanStatus } from "../src/training-plan-specification/index.js";

const FULL_INTAKE = JSON.parse(
  readFileSync(new URL("../examples/full-intake.json", import.meta.url), "utf8"),
);

const FULL_INTAKE_CONTEXT = JSON.parse(
  readFileSync(new URL("../examples/evaluation-context.json", import.meta.url), "utf8"),
);

function buildBasicIntake() {
  return evaluateIntake(FULL_INTAKE, FULL_INTAKE_CONTEXT);
}

test("end-to-end integration and basic output shape", () => {
  const intakeDecision = buildBasicIntake();
  const draft = buildTrainingDraft(intakeDecision);

  assert.equal(draft.draft_version, TRAINING_DRAFT_VERSION);
  assert.equal(draft.prescription_version, TRAINING_PRESCRIPTION_VERSION);
  
  assert.deepEqual(draft.pipeline_versions, {
    plan_spec: TRAINING_PLAN_SPEC_VERSION,
    session_blueprint: TRAINING_SESSION_BLUEPRINT_VERSION,
    exercise_selection: EXERCISE_SELECTION_VERSION,
    training_prescription: TRAINING_PRESCRIPTION_VERSION,
  });

  assert.ok(Array.isArray(draft.sessions));
  assert.equal(draft.status, TrainingPlanStatus.PROVISIONAL_REVIEW_REQUIRED);

  assert.equal("plan_spec" in draft, false);
  assert.equal("session_blueprint" in draft, false);
  assert.equal("exercise_selection" in draft, false);

  const firstSession = draft.sessions[0];
  assert.ok(Array.isArray(firstSession.exercises));
  assert.ok(firstSession.exercises.length > 0);
  
  const firstExercise = firstSession.exercises[0];
  assert.ok(firstExercise.exercise_code);
  assert.ok(firstExercise.prescription);
  assert.equal(firstExercise.selection_status, "SELECTED");
});

test("READY_FOR_DRAFT produces READY with all slots solved", () => {
  const intakeDecision = buildBasicIntake();
  intakeDecision.plan_status = PlanStatus.READY_FOR_DRAFT;
  const locConstraint = intakeDecision.training_decision.constraints.find(
    (c) => c.code === "TRAINING_LOCATION"
  );
  if (locConstraint) locConstraint.value = { location: "GYM" };
  
  const draft = buildTrainingDraft(intakeDecision);
  assert.equal(draft.status, TrainingPlanStatus.READY);
});

test("COACH_REVIEW_REQUIRED with > 0 days produces PROVISIONAL_REVIEW_REQUIRED with sessions", () => {
  const intakeDecision = buildBasicIntake();
  intakeDecision.plan_status = PlanStatus.COACH_REVIEW_REQUIRED;
  intakeDecision.training_decision.recommended_days = 3;
  const draft = buildTrainingDraft(intakeDecision);
  assert.equal(draft.status, TrainingPlanStatus.PROVISIONAL_REVIEW_REQUIRED);
  assert.ok(draft.sessions.length > 0);
});

test("COACH_REVIEW_REQUIRED with 0 days produces PROVISIONAL_REVIEW_REQUIRED without sessions", () => {
  const intakeDecision = buildBasicIntake();
  intakeDecision.plan_status = PlanStatus.COACH_REVIEW_REQUIRED;
  intakeDecision.training_decision.recommended_days = 0;
  const draft = buildTrainingDraft(intakeDecision);
  assert.equal(draft.status, TrainingPlanStatus.PROVISIONAL_REVIEW_REQUIRED);
  assert.equal(draft.sessions.length, 0);
});

test("MEDICAL_REVIEW_REQUIRED produces WITHHELD without sessions", () => {
  const intakeDecision = buildBasicIntake();
  intakeDecision.plan_status = PlanStatus.MEDICAL_REVIEW_REQUIRED;
  const draft = buildTrainingDraft(intakeDecision);
  assert.equal(draft.status, TrainingPlanStatus.WITHHELD);
  assert.equal(draft.sessions.length, 0);
});

test("BLOCKED produces WITHHELD without sessions", () => {
  const intakeDecision = buildBasicIntake();
  intakeDecision.plan_status = PlanStatus.BLOCKED;
  const draft = buildTrainingDraft(intakeDecision);
  assert.equal(draft.status, TrainingPlanStatus.WITHHELD);
  assert.equal(draft.sessions.length, 0);
});

test("INJURY_AFFECTED_MOVEMENT constraint reaches Exercise Selection", () => {
  const intakeDecision = buildBasicIntake();
  intakeDecision.hard_constraints.push({
    code: "INJURY_AFFECTED_MOVEMENT",
    scope: "TRAINING",
    value: { movement: "SQUAT", instruction: "AVOID" },
    reason: "Testing",
  });
  
  const draft = buildTrainingDraft(intakeDecision);
  
  let foundSquatSlot = null;
  for (const session of draft.sessions) {
    for (const ex of session.exercises) {
      if (ex.slot_code === "KNEE_DOMINANT") {
        foundSquatSlot = ex;
        break;
      }
    }
    if (foundSquatSlot) break;
  }
  
  assert.ok(foundSquatSlot, "Squat pattern should be present");
  assert.equal(foundSquatSlot.selection_status, "REVIEW_REQUIRED");
  assert.equal(foundSquatSlot.prescription, null);
  assert.ok(foundSquatSlot.source_constraint_codes.includes("INJURY_AFFECTED_MOVEMENT"));
});

test("constraints and reasons are passed through", () => {
  const intakeDecision = buildBasicIntake();
  const draft = buildTrainingDraft(intakeDecision);
  assert.deepEqual(draft.constraints, intakeDecision.training_decision.constraints);
  assert.deepEqual(draft.reasons, intakeDecision.training_decision.reasons);
});

test("intakeDecision is not mutated", () => {
  const intakeDecision = buildBasicIntake();
  const snapshot = JSON.stringify(intakeDecision);
  buildTrainingDraft(intakeDecision);
  assert.equal(JSON.stringify(intakeDecision), snapshot);
});

test("validation: null, array, and primitives throw TypeError", () => {
  assert.throws(() => buildTrainingDraft(null), TypeError);
  assert.throws(() => buildTrainingDraft(undefined), TypeError);
  assert.throws(() => buildTrainingDraft([]), TypeError);
  assert.throws(() => buildTrainingDraft("string"), TypeError);
  assert.throws(() => buildTrainingDraft(123), TypeError);
});

test("validation: missing or invalid hard_constraints throws TypeError", () => {
  const base = { plan_status: "READY_FOR_DRAFT", training_decision: {} };
  assert.throws(() => buildTrainingDraft(base), TypeError);
  base.hard_constraints = null;
  assert.throws(() => buildTrainingDraft(base), TypeError);
  base.hard_constraints = {};
  assert.throws(() => buildTrainingDraft(base), TypeError);
});

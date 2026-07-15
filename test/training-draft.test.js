import assert from "node:assert/strict";
import test from "node:test";

import { completeIntake } from "./fixtures/complete-intake.js";
import { evaluateIntake } from "../src/intake-decision-engine/index.js";
import { buildTrainingDraft, TRAINING_DRAFT_VERSION } from "../src/training-draft/index.js";

const ASSESSMENT_CONTEXT = Object.freeze({
  assessmentDate: "2026-07-15",
  clientTimezone: "Africa/Cairo",
});

test("buildTrainingDraft assembles the full training draft pipeline correctly", () => {
  const input = completeIntake();
  const intakeDecision = evaluateIntake(input, ASSESSMENT_CONTEXT);

  const draft = buildTrainingDraft(intakeDecision);

  assert.equal(draft.draft_version, TRAINING_DRAFT_VERSION);
  assert.ok(draft.plan_spec);
  assert.ok(draft.session_blueprint);
  assert.ok(draft.exercise_selection);
  assert.ok(draft.prescription);
  
  // Basic structural assertions
  assert.equal(typeof draft.plan_spec.status, "string");
  assert.equal(Array.isArray(draft.session_blueprint.sessions), true);
  assert.equal(Array.isArray(draft.exercise_selection.sessions), true);
  assert.equal(Array.isArray(draft.prescription.sessions), true);
});

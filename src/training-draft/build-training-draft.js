import { buildTrainingPlanSpec, TRAINING_PLAN_SPEC_VERSION } from "../training-plan-specification/index.js";
import { buildTrainingSessionBlueprint, TRAINING_SESSION_BLUEPRINT_VERSION } from "../training-session-blueprint/index.js";
import { buildExerciseSelection, EXERCISE_SELECTION_VERSION } from "../exercise-selection/index.js";
import { buildTrainingPrescription, TRAINING_PRESCRIPTION_VERSION } from "../training-prescription/index.js";
import { TRAINING_DRAFT_VERSION } from "./domain/contracts.js";

export function buildTrainingDraft(intakeDecision) {
  if (!intakeDecision || typeof intakeDecision !== "object" || Array.isArray(intakeDecision)) {
    throw new TypeError("intakeDecision must be an object.");
  }
  if (!Array.isArray(intakeDecision.hard_constraints)) {
    throw new TypeError("intakeDecision.hard_constraints must be an array.");
  }

  const planSpec = buildTrainingPlanSpec(intakeDecision);
  const sessionBlueprint = buildTrainingSessionBlueprint(planSpec);
  const exerciseSelection = buildExerciseSelection({
    trainingSessionBlueprint: sessionBlueprint,
    hardConstraints: intakeDecision.hard_constraints,
  });
  const prescription = buildTrainingPrescription(exerciseSelection);

  return {
    draft_version: TRAINING_DRAFT_VERSION,
    pipeline_versions: {
      plan_spec: TRAINING_PLAN_SPEC_VERSION,
      session_blueprint: TRAINING_SESSION_BLUEPRINT_VERSION,
      exercise_selection: EXERCISE_SELECTION_VERSION,
      training_prescription: TRAINING_PRESCRIPTION_VERSION,
    },
    ...prescription,
  };
}

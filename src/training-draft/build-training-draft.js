import { buildTrainingPlanSpec } from "../training-plan-specification/index.js";
import { buildTrainingSessionBlueprint } from "../training-session-blueprint/index.js";
import { buildExerciseSelection } from "../exercise-selection/index.js";
import { buildTrainingPrescription } from "../training-prescription/index.js";

export const TRAINING_DRAFT_VERSION = "training-draft-v1";

export function buildTrainingDraft(intakeDecision) {
  const planSpec = buildTrainingPlanSpec(intakeDecision);
  const sessionBlueprint = buildTrainingSessionBlueprint(planSpec);
  const exerciseSelection = buildExerciseSelection({
    trainingSessionBlueprint: sessionBlueprint,
    hardConstraints: intakeDecision.training_decision.constraints,
  });
  const prescription = buildTrainingPrescription(exerciseSelection);

  return {
    draft_version: TRAINING_DRAFT_VERSION,
    plan_spec: planSpec,
    session_blueprint: sessionBlueprint,
    exercise_selection: exerciseSelection,
    prescription: prescription,
  };
}

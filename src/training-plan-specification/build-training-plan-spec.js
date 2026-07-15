import {
  TRAINING_PLAN_SPEC_VERSION,
  TrainingPlanStatus,
  TrainingSessionCode,
  TrainingSessionFocus,
  TrainingSplitCode,
} from "./domain/enums.js";

const PLAN_TEMPLATES = Object.freeze({
  2: {
    splitCode: TrainingSplitCode.FULL_BODY,
    sessions: [
      [TrainingSessionCode.FULL_BODY_A, TrainingSessionFocus.FULL_BODY],
      [TrainingSessionCode.FULL_BODY_B, TrainingSessionFocus.FULL_BODY],
    ],
  },
  3: {
    splitCode: TrainingSplitCode.FULL_BODY,
    sessions: [
      [TrainingSessionCode.FULL_BODY_A, TrainingSessionFocus.FULL_BODY],
      [TrainingSessionCode.FULL_BODY_B, TrainingSessionFocus.FULL_BODY],
      [TrainingSessionCode.FULL_BODY_C, TrainingSessionFocus.FULL_BODY],
    ],
  },
  4: {
    splitCode: TrainingSplitCode.UPPER_LOWER,
    sessions: [
      [TrainingSessionCode.UPPER_A, TrainingSessionFocus.UPPER_BODY],
      [TrainingSessionCode.LOWER_A, TrainingSessionFocus.LOWER_BODY],
      [TrainingSessionCode.UPPER_B, TrainingSessionFocus.UPPER_BODY],
      [TrainingSessionCode.LOWER_B, TrainingSessionFocus.LOWER_BODY],
    ],
  },
  5: {
    splitCode: TrainingSplitCode.UPPER_LOWER_PPL,
    sessions: [
      [TrainingSessionCode.UPPER_A, TrainingSessionFocus.UPPER_BODY],
      [TrainingSessionCode.LOWER_A, TrainingSessionFocus.LOWER_BODY],
      [TrainingSessionCode.PUSH_A, TrainingSessionFocus.PUSH],
      [TrainingSessionCode.PULL_A, TrainingSessionFocus.PULL],
      [TrainingSessionCode.LEGS_A, TrainingSessionFocus.LEGS],
    ],
  },
  6: {
    splitCode: TrainingSplitCode.PUSH_PULL_LEGS,
    sessions: [
      [TrainingSessionCode.PUSH_A, TrainingSessionFocus.PUSH],
      [TrainingSessionCode.PULL_A, TrainingSessionFocus.PULL],
      [TrainingSessionCode.LEGS_A, TrainingSessionFocus.LEGS],
      [TrainingSessionCode.PUSH_B, TrainingSessionFocus.PUSH],
      [TrainingSessionCode.PULL_B, TrainingSessionFocus.PULL],
      [TrainingSessionCode.LEGS_B, TrainingSessionFocus.LEGS],
    ],
  },
});

function specificationStatusFor(planStatus) {
  switch (planStatus) {
    case "READY_FOR_DRAFT":
      return TrainingPlanStatus.READY;
    case "COACH_REVIEW_REQUIRED":
      return TrainingPlanStatus.PROVISIONAL_REVIEW_REQUIRED;
    case "MEDICAL_REVIEW_REQUIRED":
    case "BLOCKED":
      return TrainingPlanStatus.WITHHELD;
    default:
      throw new TypeError(`Unsupported intake plan_status: ${planStatus}.`);
  }
}

function buildSessions(recommendedDays) {
  const template = PLAN_TEMPLATES[recommendedDays];
  if (template === undefined) {
    throw new RangeError(
      `A buildable training plan requires recommended_days from 2 to 6; received ${recommendedDays}.`,
    );
  }

  return {
    splitCode: template.splitCode,
    sessions: template.sessions.map(([sessionCode, focus], index) => ({
      sequence: index + 1,
      session_code: sessionCode,
      focus,
    })),
  };
}

/**
 * Builds a deterministic training-plan skeleton from the frozen Intake Decision
 * training output. It never recalculates days or interprets constraints.
 *
 * @param {import('./domain/contracts.js').TrainingPlanSpecificationInput} intakeDecision
 * @returns {import('./domain/contracts.js').TrainingPlanSpecification}
 */
export function buildTrainingPlanSpec(intakeDecision) {
  const { plan_status: planStatus, training_decision: trainingDecision } = intakeDecision;
  const status = specificationStatusFor(planStatus);
  const coachReviewWithNoDays =
    status === TrainingPlanStatus.PROVISIONAL_REVIEW_REQUIRED &&
    trainingDecision.recommended_days === 0;
  const plan =
    status === TrainingPlanStatus.WITHHELD || coachReviewWithNoDays
      ? { splitCode: null, sessions: [] }
      : buildSessions(trainingDecision.recommended_days);

  return {
    spec_version: TRAINING_PLAN_SPEC_VERSION,
    status,
    recommended_days: trainingDecision.recommended_days,
    split_code: plan.splitCode,
    schedule_mode: trainingDecision.schedule_mode,
    intro_week_required: trainingDecision.intro_week_required,
    volume_start: trainingDecision.volume_start,
    sessions: plan.sessions,
    constraints: trainingDecision.constraints,
    reasons: trainingDecision.reasons,
  };
}

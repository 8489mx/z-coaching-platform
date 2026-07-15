export const TRAINING_PLAN_SPEC_VERSION = "training-plan-spec-v1";

export const TrainingPlanStatus = Object.freeze({
  READY: "READY",
  PROVISIONAL_REVIEW_REQUIRED: "PROVISIONAL_REVIEW_REQUIRED",
  WITHHELD: "WITHHELD",
});

export const TrainingSplitCode = Object.freeze({
  FULL_BODY: "FULL_BODY",
  UPPER_LOWER: "UPPER_LOWER",
  UPPER_LOWER_PPL: "UPPER_LOWER_PPL",
  PUSH_PULL_LEGS: "PUSH_PULL_LEGS",
});

export const TrainingSessionCode = Object.freeze({
  FULL_BODY_A: "FULL_BODY_A",
  FULL_BODY_B: "FULL_BODY_B",
  FULL_BODY_C: "FULL_BODY_C",
  UPPER_A: "UPPER_A",
  UPPER_B: "UPPER_B",
  LOWER_A: "LOWER_A",
  LOWER_B: "LOWER_B",
  PUSH_A: "PUSH_A",
  PUSH_B: "PUSH_B",
  PULL_A: "PULL_A",
  PULL_B: "PULL_B",
  LEGS_A: "LEGS_A",
  LEGS_B: "LEGS_B",
});

export const TrainingSessionFocus = Object.freeze({
  FULL_BODY: "FULL_BODY",
  UPPER_BODY: "UPPER_BODY",
  LOWER_BODY: "LOWER_BODY",
  PUSH: "PUSH",
  PULL: "PULL",
  LEGS: "LEGS",
});

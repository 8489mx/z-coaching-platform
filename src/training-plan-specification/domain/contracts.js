/** @typedef {"READY_FOR_DRAFT"|"COACH_REVIEW_REQUIRED"|"MEDICAL_REVIEW_REQUIRED"|"BLOCKED"} IntakePlanStatusValue */
/** @typedef {"READY"|"PROVISIONAL_REVIEW_REQUIRED"|"WITHHELD"} TrainingPlanStatusValue */
/** @typedef {"FULL_BODY"|"UPPER_LOWER"|"UPPER_LOWER_PPL"|"PUSH_PULL_LEGS"} TrainingSplitCodeValue */
/** @typedef {"FULL_BODY_A"|"FULL_BODY_B"|"FULL_BODY_C"|"UPPER_A"|"UPPER_B"|"LOWER_A"|"LOWER_B"|"PUSH_A"|"PUSH_B"|"PULL_A"|"PULL_B"|"LEGS_A"|"LEGS_B"} TrainingSessionCodeValue */
/** @typedef {"FULL_BODY"|"UPPER_BODY"|"LOWER_BODY"|"PUSH"|"PULL"|"LEGS"} TrainingSessionFocusValue */

/** @typedef {{code:string,scope:string,value:unknown,reason:string}} TrainingConstraint */
/** @typedef {{code:string,scope:string,message:string}} TrainingReason */

/**
 * @typedef {Object} TrainingDecisionInput
 * @property {number} recommended_days
 * @property {string} schedule_mode
 * @property {boolean} intro_week_required
 * @property {string} volume_start
 * @property {TrainingConstraint[]} constraints
 * @property {TrainingReason[]} reasons
 */

/**
 * @typedef {Object} TrainingPlanSpecificationInput
 * @property {IntakePlanStatusValue} plan_status
 * @property {TrainingDecisionInput} training_decision
 */

/**
 * @typedef {Object} TrainingPlanSession
 * @property {number} sequence
 * @property {TrainingSessionCodeValue} session_code
 * @property {TrainingSessionFocusValue} focus
 */

/**
 * @typedef {Object} TrainingPlanSpecification
 * @property {"training-plan-spec-v1"} spec_version
 * @property {TrainingPlanStatusValue} status
 * @property {number} recommended_days
 * @property {TrainingSplitCodeValue|null} split_code
 * @property {string} schedule_mode
 * @property {boolean} intro_week_required
 * @property {string} volume_start
 * @property {TrainingPlanSession[]} sessions
 * @property {TrainingConstraint[]} constraints
 * @property {TrainingReason[]} reasons
 */

export {};

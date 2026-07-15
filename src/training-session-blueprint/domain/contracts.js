/** @typedef {import("../../training-plan-specification/domain/contracts.js").TrainingPlanSpecification} TrainingPlanSpecification */
/** @typedef {import("../../training-plan-specification/domain/contracts.js").TrainingConstraint} TrainingConstraint */
/** @typedef {import("../../training-plan-specification/domain/contracts.js").TrainingReason} TrainingReason */

/** @typedef {"READY"|"PROVISIONAL_REVIEW_REQUIRED"|"WITHHELD"} TrainingPlanStatusValue */
/** @typedef {"FULL_BODY"|"UPPER_LOWER"|"UPPER_LOWER_PPL"|"PUSH_PULL_LEGS"} TrainingSplitCodeValue */
/** @typedef {"FULL_BODY_A"|"FULL_BODY_B"|"FULL_BODY_C"|"UPPER_A"|"UPPER_B"|"LOWER_A"|"LOWER_B"|"PUSH_A"|"PUSH_B"|"PULL_A"|"PULL_B"|"LEGS_A"|"LEGS_B"} TrainingSessionCodeValue */
/** @typedef {"FULL_BODY"|"UPPER_BODY"|"LOWER_BODY"|"PUSH"|"PULL"|"LEGS"} TrainingSessionFocusValue */
/** @typedef {"KNEE_DOMINANT"|"HIP_HINGE"|"UNILATERAL_LOWER"|"KNEE_FLEXION"|"CALF_RAISE"|"HORIZONTAL_PUSH"|"HORIZONTAL_PULL"|"VERTICAL_PUSH"|"VERTICAL_PULL"|"SHOULDER_ABDUCTION"|"REAR_DELT"|"ELBOW_FLEXION"|"ELBOW_EXTENSION"|"CORE_STABILITY"} MovementSlotCodeValue */

/**
 * @typedef {Object} MovementSlot
 * @property {number} order
 * @property {MovementSlotCodeValue} slot_code
 */

/**
 * @typedef {Object} TrainingSessionBlueprintSession
 * @property {number} sequence
 * @property {TrainingSessionCodeValue} session_code
 * @property {TrainingSessionFocusValue} focus
 * @property {MovementSlot[]} movement_slots
 */

/**
 * @typedef {Object} TrainingSessionBlueprint
 * @property {"training-session-blueprint-v1"} blueprint_version
 * @property {TrainingPlanStatusValue} status
 * @property {number} recommended_days
 * @property {TrainingSplitCodeValue|null} split_code
 * @property {string} schedule_mode
 * @property {boolean} intro_week_required
 * @property {string} volume_start
 * @property {TrainingSessionBlueprintSession[]} sessions
 * @property {TrainingConstraint[]} constraints
 * @property {TrainingReason[]} reasons
 */

export {};

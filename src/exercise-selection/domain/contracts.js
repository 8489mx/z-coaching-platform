/** @typedef {"READY"|"PROVISIONAL_REVIEW_REQUIRED"|"WITHHELD"} ExerciseSelectionPlanStatusValue */
/** @typedef {"FULL_BODY"|"UPPER_LOWER"|"UPPER_LOWER_PPL"|"PUSH_PULL_LEGS"} TrainingSplitCodeValue */
/** @typedef {"FULL_BODY_A"|"FULL_BODY_B"|"FULL_BODY_C"|"UPPER_A"|"UPPER_B"|"LOWER_A"|"LOWER_B"|"PUSH_A"|"PUSH_B"|"PULL_A"|"PULL_B"|"LEGS_A"|"LEGS_B"} TrainingSessionCodeValue */
/** @typedef {"FULL_BODY"|"UPPER_BODY"|"LOWER_BODY"|"PUSH"|"PULL"|"LEGS"} TrainingSessionFocusValue */
/** @typedef {"KNEE_DOMINANT"|"HIP_HINGE"|"UNILATERAL_LOWER"|"KNEE_FLEXION"|"CALF_RAISE"|"HORIZONTAL_PUSH"|"HORIZONTAL_PULL"|"VERTICAL_PUSH"|"VERTICAL_PULL"|"SHOULDER_ABDUCTION"|"REAR_DELT"|"ELBOW_FLEXION"|"ELBOW_EXTENSION"|"CORE_STABILITY"} MovementSlotCodeValue */
/** @typedef {"SELECTED"|"REVIEW_REQUIRED"} ExerciseSlotSelectionStatusValue */
/** @typedef {"SELECTED_EXPLICIT_EQUIPMENT"|"SELECTED_BODYWEIGHT_FALLBACK"|"MOVEMENT_CONSTRAINT_REQUIRES_REVIEW"|"NO_ELIGIBLE_EXERCISE"} ExerciseSelectionReasonCodeValue */

/** @typedef {{code:string,scope:string,value:unknown,reason:string}} SelectionConstraint */
/** @typedef {{code:string,scope:string,message:string}} SelectionReason */
/** @typedef {{code:string,scope:string,value:unknown,reason:string}} HardConstraint */

/**
 * @typedef {Object} BlueprintMovementSlot
 * @property {number} order
 * @property {MovementSlotCodeValue} slot_code
 */

/**
 * @typedef {Object} BlueprintSession
 * @property {number} sequence
 * @property {TrainingSessionCodeValue} session_code
 * @property {TrainingSessionFocusValue} focus
 * @property {BlueprintMovementSlot[]} movement_slots
 */

/**
 * @typedef {Object} TrainingSessionBlueprintInput
 * @property {"training-session-blueprint-v1"} blueprint_version
 * @property {ExerciseSelectionPlanStatusValue} status
 * @property {number} recommended_days
 * @property {TrainingSplitCodeValue|null} split_code
 * @property {string} schedule_mode
 * @property {boolean} intro_week_required
 * @property {string} volume_start
 * @property {BlueprintSession[]} sessions
 * @property {SelectionConstraint[]} constraints
 * @property {SelectionReason[]} reasons
 */

/**
 * @typedef {Object} SelectedExerciseSlot
 * @property {number} order
 * @property {MovementSlotCodeValue} slot_code
 * @property {"SELECTED"} selection_status
 * @property {string} exercise_code
 * @property {string} name_en
 * @property {"SELECTED_EXPLICIT_EQUIPMENT"|"SELECTED_BODYWEIGHT_FALLBACK"} reason_code
 * @property {[]} source_constraint_codes
 */

/**
 * @typedef {Object} ReviewRequiredExerciseSlot
 * @property {number} order
 * @property {MovementSlotCodeValue} slot_code
 * @property {"REVIEW_REQUIRED"} selection_status
 * @property {null} exercise_code
 * @property {null} name_en
 * @property {"MOVEMENT_CONSTRAINT_REQUIRES_REVIEW"|"NO_ELIGIBLE_EXERCISE"} reason_code
 * @property {string[]} source_constraint_codes
 */

/** @typedef {SelectedExerciseSlot|ReviewRequiredExerciseSlot} ExerciseSlotSelection */

/**
 * @typedef {Object} ExerciseSelectionSession
 * @property {number} sequence
 * @property {TrainingSessionCodeValue} session_code
 * @property {TrainingSessionFocusValue} focus
 * @property {ExerciseSlotSelection[]} exercises
 */

/**
 * @typedef {Object} ExerciseSelection
 * @property {"exercise-selection-v1"} selection_version
 * @property {ExerciseSelectionPlanStatusValue} status
 * @property {number} recommended_days
 * @property {TrainingSplitCodeValue|null} split_code
 * @property {string} schedule_mode
 * @property {boolean} intro_week_required
 * @property {string} volume_start
 * @property {ExerciseSelectionSession[]} sessions
 * @property {SelectionConstraint[]} constraints
 * @property {SelectionReason[]} reasons
 */

/**
 * @typedef {Object} BuildExerciseSelectionInput
 * @property {TrainingSessionBlueprintInput} trainingSessionBlueprint
 * @property {HardConstraint[]} hardConstraints
 */

export {};

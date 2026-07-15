/** @typedef {"READY"|"PROVISIONAL_REVIEW_REQUIRED"|"WITHHELD"} TrainingPrescriptionStatusValue */
/** @typedef {"FULL_BODY"|"UPPER_LOWER"|"UPPER_LOWER_PPL"|"PUSH_PULL_LEGS"} TrainingSplitCodeValue */
/** @typedef {"FULL_BODY_A"|"FULL_BODY_B"|"FULL_BODY_C"|"UPPER_A"|"UPPER_B"|"LOWER_A"|"LOWER_B"|"PUSH_A"|"PUSH_B"|"PULL_A"|"PULL_B"|"LEGS_A"|"LEGS_B"} TrainingSessionCodeValue */
/** @typedef {"FULL_BODY"|"UPPER_BODY"|"LOWER_BODY"|"PUSH"|"PULL"|"LEGS"} TrainingSessionFocusValue */
/** @typedef {"KNEE_DOMINANT"|"HIP_HINGE"|"UNILATERAL_LOWER"|"KNEE_FLEXION"|"CALF_RAISE"|"HORIZONTAL_PUSH"|"HORIZONTAL_PULL"|"VERTICAL_PUSH"|"VERTICAL_PULL"|"SHOULDER_ABDUCTION"|"REAR_DELT"|"ELBOW_FLEXION"|"ELBOW_EXTENSION"|"CORE_STABILITY"} MovementSlotCodeValue */
/** @typedef {"SELECTED"|"REVIEW_REQUIRED"} ExerciseSlotSelectionStatusValue */
/** @typedef {"REPS"|"REPS_PER_SIDE"|"SECONDS"} ExercisePrescriptionUnitValue */

/** @typedef {{code:string,scope:string,value:unknown,reason:string}} TrainingPrescriptionConstraint */
/** @typedef {{code:string,scope:string,message:string}} TrainingPrescriptionReason */

/**
 * @typedef {Object} ExerciseSelectionSlotInput
 * @property {number} order
 * @property {MovementSlotCodeValue} slot_code
 * @property {ExerciseSlotSelectionStatusValue} selection_status
 * @property {string|null} exercise_code
 * @property {string|null} name_en
 * @property {string} reason_code
 * @property {string[]} source_constraint_codes
 */

/**
 * @typedef {Object} ExerciseSelectionSessionInput
 * @property {number} sequence
 * @property {TrainingSessionCodeValue} session_code
 * @property {TrainingSessionFocusValue} focus
 * @property {ExerciseSelectionSlotInput[]} exercises
 */

/**
 * @typedef {Object} ExerciseSelectionInput
 * @property {"exercise-selection-v1"} selection_version
 * @property {TrainingPrescriptionStatusValue} status
 * @property {number} recommended_days
 * @property {TrainingSplitCodeValue|null} split_code
 * @property {string} schedule_mode
 * @property {boolean} intro_week_required
 * @property {"CONSERVATIVE"|"NORMAL"} volume_start
 * @property {ExerciseSelectionSessionInput[]} sessions
 * @property {TrainingPrescriptionConstraint[]} constraints
 * @property {TrainingPrescriptionReason[]} reasons
 */

/**
 * @typedef {Object} ExercisePrescription
 * @property {number} sets
 * @property {ExercisePrescriptionUnitValue} unit
 * @property {number} target_min
 * @property {number} target_max
 * @property {number} rest_seconds
 */

/**
 * @typedef {Object} PrescribedExerciseSlot
 * @property {number} order
 * @property {MovementSlotCodeValue} slot_code
 * @property {ExerciseSlotSelectionStatusValue} selection_status
 * @property {string|null} exercise_code
 * @property {string|null} name_en
 * @property {string} reason_code
 * @property {string[]} source_constraint_codes
 * @property {ExercisePrescription|null} prescription
 */

/**
 * @typedef {Object} TrainingPrescriptionSession
 * @property {number} sequence
 * @property {TrainingSessionCodeValue} session_code
 * @property {TrainingSessionFocusValue} focus
 * @property {PrescribedExerciseSlot[]} exercises
 */

/**
 * @typedef {Object} TrainingPrescription
 * @property {"training-prescription-v1"} prescription_version
 * @property {TrainingPrescriptionStatusValue} status
 * @property {number} recommended_days
 * @property {TrainingSplitCodeValue|null} split_code
 * @property {string} schedule_mode
 * @property {boolean} intro_week_required
 * @property {"CONSERVATIVE"|"NORMAL"} volume_start
 * @property {TrainingPrescriptionSession[]} sessions
 * @property {TrainingPrescriptionConstraint[]} constraints
 * @property {TrainingPrescriptionReason[]} reasons
 */

export {};

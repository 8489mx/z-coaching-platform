/**
 * @typedef {Object} PrescribedCardioSession
 * @property {number} sequence
 * @property {"LISS"|"STEPS"} modality_type
 * @property {number} duration_minutes
 * @property {"LOW"|"MODERATE"} intensity
 */

/**
 * @typedef {Object} PrescribedSteps
 * @property {boolean} active
 * @property {"LOW"} intensity
 */

/**
 * @typedef {Object} CardioPrescription
 * @property {"cardio-prescription-v1"} cardio_prescription_version
 * @property {"READY"|"PROVISIONAL_REVIEW_REQUIRED"|"WITHHELD"} status
 * @property {number} recommended_sessions
 * @property {PrescribedCardioSession[]} sessions
 * @property {PrescribedSteps|null} steps_prescription
 * @property {import("../../cardio-plan-specification/domain/contracts.js").CardioConstraint[]} constraints
 * @property {import("../../cardio-plan-specification/domain/contracts.js").CardioReason[]} reasons
 */

export {};

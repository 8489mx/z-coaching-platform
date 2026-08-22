/**
 * @typedef {import("../../cardio-prescription/domain/contracts.js").PrescribedCardioSession} PrescribedCardioSession
 * @typedef {import("../../cardio-prescription/domain/contracts.js").PrescribedSteps} PrescribedSteps
 * @typedef {import("../../intake-decision-engine/domain/enums.js").DayOfWeekValue} DayOfWeekValue
 */

/**
 * @typedef {Object} ScheduledCardioSession
 * @property {number} sequence
 * @property {"LISS"|"STEPS"} modality_type
 * @property {number} duration_minutes
 * @property {"LOW"|"MODERATE"} intensity
 * @property {DayOfWeekValue|null} scheduled_day
 * @property {string} schedule_reason_code
 * @property {string} instruction
 */

/**
 * @typedef {Object} WeeklyCardioSchedule
 * @property {"weekly-cardio-schedule-v1"} schedule_version
 * @property {"cardio-prescription-v1"} prescription_version
 * @property {"READY"|"PROVISIONAL_REVIEW_REQUIRED"|"WITHHELD"} status
 * @property {boolean} schedule_review_required
 * @property {number} recommended_sessions
 * @property {ScheduledCardioSession[]} sessions
 * @property {PrescribedSteps|null} steps_prescription
 * @property {import("../../cardio-plan-specification/domain/contracts.js").CardioConstraint[]} constraints
 * @property {import("../../cardio-plan-specification/domain/contracts.js").CardioReason[]} reasons
 */

export {};

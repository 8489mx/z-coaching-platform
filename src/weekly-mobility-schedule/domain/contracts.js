/**
 * @typedef {import("../../intake-decision-engine/domain/contracts.js").DecisionConstraint} DecisionConstraint
 * @typedef {import("../../intake-decision-engine/domain/contracts.js").DecisionReason} DecisionReason
 * @typedef {import("../../mobility-prescription/domain/contracts.js").PrescribedMobilityModality} PrescribedMobilityModality
 */

/**
 * @typedef {Object} ScheduledMobilityDay
 * @property {string|null} day_of_week - "MONDAY", etc., or null if session sequence mode
 * @property {number|null} sequence - The sequence number if in session sequence mode, or null if fixed days
 * @property {PrescribedMobilityModality[]} modalities
 * @property {string[]} schedule_instructions
 */

/**
 * @typedef {Object} WeeklyMobilitySchedule
 * @property {string} schedule_version
 * @property {string} prescription_version
 * @property {string} status
 * @property {ScheduledMobilityDay[]} scheduled_days
 * @property {DecisionConstraint[]} constraints
 * @property {DecisionReason[]} reasons
 */

export {};

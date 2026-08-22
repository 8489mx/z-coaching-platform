/**
 * @typedef {import("../../intake-decision-engine/domain/contracts.js").DecisionConstraint} DecisionConstraint
 * @typedef {import("../../intake-decision-engine/domain/contracts.js").DecisionReason} DecisionReason
 */

/**
 * @typedef {Object} PrescribedMobilityModality
 * @property {string} modality_type
 * @property {number} duration_minutes
 * @property {string[]} instructions
 */

/**
 * @typedef {Object} MobilityPrescription
 * @property {string} mobility_prescription_version
 * @property {string} status
 * @property {PrescribedMobilityModality[]} prescribed_modalities
 * @property {DecisionConstraint[]} constraints
 * @property {DecisionReason[]} reasons
 */

export {};

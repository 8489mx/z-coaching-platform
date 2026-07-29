/**
 * @typedef {import("../../intake-decision-engine/domain/contracts.js").DecisionConstraint} DecisionConstraint
 * @typedef {import("../../intake-decision-engine/domain/contracts.js").DecisionReason} DecisionReason
 */

/**
 * @typedef {Object} MobilityModalityRequirement
 * @property {string} modality_type - e.g. "STATIC_STRETCHING", "FOAM_ROLLING"
 */

/**
 * @typedef {Object} MobilityModalityRequirements
 * @property {string} mobility_modality_requirements_version
 * @property {string} status
 * @property {MobilityModalityRequirement[]} requirements
 * @property {DecisionConstraint[]} constraints
 * @property {DecisionReason[]} reasons
 */

export {};

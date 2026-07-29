/**
 * @typedef {import("../../intake-decision-engine/domain/contracts.js").IntakeDecision} IntakeDecision
 * @typedef {import("../../intake-decision-engine/domain/contracts.js").DecisionConstraint} DecisionConstraint
 */

/**
 * @typedef {Object} MobilityPlanSpecification
 * @property {string} plan_status
 * @property {string} strategy
 * @property {number} max_duration_minutes
 * @property {string} formal_session_state
 * @property {DecisionConstraint[]} constraints
 * @property {import("../../intake-decision-engine/domain/contracts.js").DecisionReason[]} reasons
 * @property {import("../../intake-decision-engine/domain/contracts.js").DecisionReason[]} limitations
 */

export {};

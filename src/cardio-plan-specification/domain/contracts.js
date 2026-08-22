export const CARDIO_PLAN_SPEC_VERSION = "cardio-plan-spec-v1";

/** @typedef {"READY"|"PROVISIONAL_REVIEW_REQUIRED"|"WITHHELD"} CardioPlanStatusValue */
/** @typedef {"NOT_INDICATED"|"DAILY_MOVEMENT_ONLY"|"PRESCRIPTION_REQUIRED"|"REVIEW_REQUIRED"|"WITHHELD"} CardioFormalSessionStateValue */

/** @typedef {{code:string,scope:"CARDIO"|"GLOBAL",value:unknown,reason:string}} CardioConstraint */
/** @typedef {{code:string,scope:"CARDIO",message:string}} CardioReason */
/** @typedef {{code:string,scope:string,level:string,message:string,sourcePath:string}} CardioSourceReviewFlag */
/** @typedef {{code:string,scope:string,message:string}} CardioSourceDecisionReason */
/** @typedef {{code:string,path:string,message:string}} CardioSourceDataIssue */

/**
 * @typedef {Object} CardioPlanLimits
 * @property {number} max_sessions_per_week
 * @property {number} max_duration_minutes_per_session
 * @property {"LOW"|"MODERATE"} intensity_start
 */

/**
 * @typedef {Object} CardioSourceReviewContext
 * @property {CardioSourceReviewFlag[]} review_flags
 * @property {CardioSourceDecisionReason[]} decision_reasons
 * @property {CardioSourceDataIssue[]} missing_or_uncertain_data
 */

/**
 * The runtime builder accepts the complete Intake Decision but reads only the
 * authoritative Cardio projection and the three top-level review arrays.
 *
 * @typedef {import("../../intake-decision-engine/domain/contracts.js").IntakeDecision} CardioPlanSpecificationInput
 */

/**
 * @typedef {Object} CardioPlanSpecification
 * @property {"cardio-plan-spec-v1"} cardio_plan_spec_version
 * @property {CardioPlanStatusValue} status
 * @property {"NO_ADDITIONAL_CARDIO"|"STEPS_ONLY"|"CARDIO_SESSIONS"|"REVIEW_REQUIRED"} strategy
 * @property {CardioFormalSessionStateValue} formal_session_state
 * @property {CardioPlanLimits} limits
 * @property {CardioConstraint[]} constraints
 * @property {CardioReason[]} reasons
 * @property {CardioSourceReviewContext} source_review_context
 */

export {};

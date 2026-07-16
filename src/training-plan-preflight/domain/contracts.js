export const TRAINING_PLAN_PREFLIGHT_VERSION = "training-plan-preflight-v1";

/** @typedef {"PASSED"|"REVIEW_REQUIRED"|"WITHHELD"} TrainingPlanPreflightResultValue */
/** @typedef {"REVIEW"|"BLOCKING"} PreflightIssueSeverityValue */
/** @typedef {"PLAN_WITHHELD"|"UPSTREAM_REVIEW_REQUIRED"|"EXERCISE_SLOT_REQUIRES_REVIEW"|"HIGH_SPORT_DAY_REQUIRES_REVIEW"} PreflightIssueCodeValue */

/**
 * @typedef {Object} PreflightIssue
 * @property {PreflightIssueCodeValue} code
 * @property {PreflightIssueSeverityValue} severity
 * @property {string} message
 * @property {number|null} session_sequence
 * @property {number|null} slot_order
 */

/**
 * @typedef {Object} TrainingPlanPreflightReport
 * @property {"training-plan-preflight-v1"} preflight_version
 * @property {"weekly-training-schedule-v1"} schedule_version
 * @property {"READY"|"PROVISIONAL_REVIEW_REQUIRED"|"WITHHELD"} plan_status
 * @property {TrainingPlanPreflightResultValue} result
 * @property {boolean} can_approve
 * @property {PreflightIssue[]} issues
 */

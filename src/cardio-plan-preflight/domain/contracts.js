/**
 * @typedef {import("./enums.js").CardioPreflightResultValue} CardioPreflightResultValue
 * @typedef {import("./enums.js").CardioPreflightIssueSeverityValue} CardioPreflightIssueSeverityValue
 * @typedef {import("./enums.js").CardioPreflightIssueCodeValue} CardioPreflightIssueCodeValue
 */

/**
 * @typedef {Object} CardioPreflightIssue
 * @property {CardioPreflightIssueCodeValue} code
 * @property {CardioPreflightIssueSeverityValue} severity
 * @property {string} message
 * @property {number|null} session_sequence
 */

/**
 * @typedef {Object} CardioPlanPreflightReport
 * @property {"cardio-plan-preflight-v1"} preflight_version
 * @property {"weekly-cardio-schedule-v1"} schedule_version
 * @property {"READY"|"PROVISIONAL_REVIEW_REQUIRED"|"WITHHELD"} plan_status
 * @property {CardioPreflightResultValue} result
 * @property {boolean} can_approve
 * @property {CardioPreflightIssue[]} issues
 */

export {};

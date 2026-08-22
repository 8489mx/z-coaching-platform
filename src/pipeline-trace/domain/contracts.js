export const PIPELINE_TRACE_VERSION = "pipeline-trace-v1";

/** @typedef {"Z_COACHING_PIPELINE_TRACE_V1"} PipelineTracePolicyValue */
/** @typedef {"READY"|"REVIEW_REQUIRED"|"WITHHELD"|"FAILED"} PipelineTraceStatusValue */

/**
 * @typedef {Object} PipelineTraceStageInput
 * @property {string} stageCode
 * @property {string} stageVersion
 * @property {PipelineTraceStatusValue} status
 * @property {string[]} issueCodes
 * @property {string[]} reasonCodes
 * @property {number|null} durationMs
 */

/**
 * @typedef {Object} PipelineTraceInput
 * @property {string} pipelineCode
 * @property {string} engineVersion
 * @property {PipelineTraceStatusValue} finalStatus
 * @property {boolean} readyForCoachReview
 * @property {PipelineTraceStageInput[]} stages
 */

/**
 * @typedef {Object} PipelineTraceStage
 * @property {number} sequence
 * @property {string} stage_code
 * @property {string} stage_version
 * @property {PipelineTraceStatusValue} status
 * @property {string[]} issue_codes
 * @property {string[]} reason_codes
 * @property {number|null} duration_ms
 */

/**
 * @typedef {Object} PipelineTrace
 * @property {"pipeline-trace-v1"} pipeline_trace_version
 * @property {string} pipeline_code
 * @property {string} engine_version
 * @property {PipelineTraceStatusValue} status
 * @property {PipelineTracePolicyValue} trace_policy
 * @property {boolean} ready_for_coach_review
 * @property {PipelineTraceStage[]} stages
 */

export {};

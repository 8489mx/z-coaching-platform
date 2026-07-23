import { PIPELINE_TRACE_VERSION } from "./domain/contracts.js";
import {
  PipelineTracePolicy,
  PipelineTraceStatus,
} from "./domain/enums.js";

const KNOWN_STATUSES = new Set(Object.values(PipelineTraceStatus));

function requireObject(value, path) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${path} must be an object.`);
  }
}

function requireNonEmptyString(value, path) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`${path} must be a non-empty string.`);
  }
}

function requireKnownStatus(value, path) {
  if (!KNOWN_STATUSES.has(value)) {
    throw new TypeError(
      `${path} must be one of ${[...KNOWN_STATUSES].join(", ")}.`,
    );
  }
}

function requireCodeArray(value, path) {
  if (!Array.isArray(value)) {
    throw new TypeError(`${path} must be an array.`);
  }
  value.forEach((code, index) => {
    requireNonEmptyString(code, `${path}[${index}]`);
  });
}

function requireDuration(value, path) {
  if (
    value !== null &&
    (typeof value !== "number" || !Number.isFinite(value) || value < 0)
  ) {
    throw new TypeError(`${path} must be a finite non-negative number or null.`);
  }
}

function deduplicate(values) {
  return [...new Set(values)];
}

function validateStage(stage, index, seenStageCodes) {
  const path = `stages[${index}]`;
  requireObject(stage, path);
  requireNonEmptyString(stage.stageCode, `${path}.stageCode`);
  if (seenStageCodes.has(stage.stageCode)) {
    throw new TypeError(`stages contains duplicate stageCode ${stage.stageCode}.`);
  }
  seenStageCodes.add(stage.stageCode);
  requireNonEmptyString(stage.stageVersion, `${path}.stageVersion`);
  requireKnownStatus(stage.status, `${path}.status`);
  requireCodeArray(stage.issueCodes, `${path}.issueCodes`);
  requireCodeArray(stage.reasonCodes, `${path}.reasonCodes`);
  requireDuration(stage.durationMs, `${path}.durationMs`);
}

function deepFreeze(value, seen = new WeakSet()) {
  if (value === null || typeof value !== "object" || seen.has(value)) {
    return value;
  }
  seen.add(value);
  for (const key of Reflect.ownKeys(value)) {
    deepFreeze(value[key], seen);
  }
  return Object.freeze(value);
}

function finalize(value) {
  return deepFreeze(structuredClone(value));
}

/**
 * Builds a deterministic, metadata-only trace from caller-supplied stages.
 *
 * @param {import("./domain/contracts.js").PipelineTraceInput} inputs
 * @returns {import("./domain/contracts.js").PipelineTrace}
 */
export function buildPipelineTrace(inputs) {
  requireObject(inputs, "inputs");
  const {
    pipelineCode,
    engineVersion,
    finalStatus,
    readyForCoachReview,
    stages,
  } = inputs;

  requireNonEmptyString(pipelineCode, "pipelineCode");
  requireNonEmptyString(engineVersion, "engineVersion");
  requireKnownStatus(finalStatus, "finalStatus");
  if (typeof readyForCoachReview !== "boolean") {
    throw new TypeError("readyForCoachReview must be a boolean.");
  }
  if (!Array.isArray(stages)) {
    throw new TypeError("stages must be an array.");
  }

  const seenStageCodes = new Set();
  stages.forEach((stage, index) => {
    validateStage(stage, index, seenStageCodes);
  });

  return finalize({
    pipeline_trace_version: PIPELINE_TRACE_VERSION,
    pipeline_code: pipelineCode,
    engine_version: engineVersion,
    status: finalStatus,
    trace_policy: PipelineTracePolicy.Z_COACHING_PIPELINE_TRACE_V1,
    ready_for_coach_review: readyForCoachReview,
    stages: stages.map((stage, index) => ({
      sequence: index + 1,
      stage_code: stage.stageCode,
      stage_version: stage.stageVersion,
      status: stage.status,
      issue_codes: deduplicate(stage.issueCodes),
      reason_codes: deduplicate(stage.reasonCodes),
      duration_ms: stage.durationMs,
    })),
  });
}

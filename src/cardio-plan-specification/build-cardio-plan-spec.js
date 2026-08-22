import {
  CardioIntensity,
  CardioStrategy,
  PlanStatus,
  ReviewLevel,
  Scope,
} from "../intake-decision-engine/index.js";
import { CARDIO_PLAN_SPEC_VERSION } from "./domain/contracts.js";
import {
  CardioFormalSessionState,
  CardioPlanStatus,
} from "./domain/enums.js";

const PLAN_STATUSES = new Set(Object.values(PlanStatus));
const CARDIO_STRATEGIES = new Set(Object.values(CardioStrategy));
const CARDIO_INTENSITIES = new Set(Object.values(CardioIntensity));
const REVIEW_LEVELS = new Set(Object.values(ReviewLevel));
const SCOPES = new Set(Object.values(Scope));
const CARDIO_CONSTRAINT_SCOPES = new Set([Scope.CARDIO, Scope.GLOBAL]);

const CARDIO_DECISION_KEYS = Object.freeze([
  "strategy",
  "max_sessions",
  "max_duration_minutes",
  "intensity_start",
  "constraints",
  "reasons",
]);
const CONSTRAINT_KEYS = Object.freeze(["code", "scope", "value", "reason"]);
const REASON_KEYS = Object.freeze(["code", "scope", "message"]);
const REVIEW_FLAG_KEYS = Object.freeze([
  "code",
  "scope",
  "level",
  "message",
  "sourcePath",
]);
const DATA_ISSUE_KEYS = Object.freeze(["code", "path", "message"]);

const STATUS_BY_INTAKE_STATUS = Object.freeze({
  [PlanStatus.READY_FOR_DRAFT]: CardioPlanStatus.READY,
  [PlanStatus.COACH_REVIEW_REQUIRED]:
    CardioPlanStatus.PROVISIONAL_REVIEW_REQUIRED,
  [PlanStatus.MEDICAL_REVIEW_REQUIRED]: CardioPlanStatus.WITHHELD,
  [PlanStatus.BLOCKED]: CardioPlanStatus.WITHHELD,
});

const FORMAL_STATE_BY_STRATEGY = Object.freeze({
  [CardioStrategy.NO_ADDITIONAL_CARDIO]:
    CardioFormalSessionState.NOT_INDICATED,
  [CardioStrategy.STEPS_ONLY]:
    CardioFormalSessionState.DAILY_MOVEMENT_ONLY,
  [CardioStrategy.CARDIO_SESSIONS]:
    CardioFormalSessionState.PRESCRIPTION_REQUIRED,
  [CardioStrategy.REVIEW_REQUIRED]:
    CardioFormalSessionState.REVIEW_REQUIRED,
});

function isPlainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function requirePlainObject(value, path) {
  if (!isPlainObject(value)) {
    throw new TypeError(`${path} must be a plain object.`);
  }
}

function requireOwnDataProperty(value, key, path) {
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  if (
    descriptor === undefined ||
    descriptor.enumerable !== true ||
    !Object.hasOwn(descriptor, "value")
  ) {
    throw new TypeError(`${path}.${key} must be an enumerable data property.`);
  }
}

function requireExactKeys(value, expectedKeys, path) {
  requirePlainObject(value, path);
  const ownKeys = Reflect.ownKeys(value);
  const exact =
    ownKeys.length === expectedKeys.length &&
    ownKeys.every(
      (key) =>
        typeof key === "string" &&
        expectedKeys.includes(key) &&
        Object.prototype.propertyIsEnumerable.call(value, key) &&
        Object.hasOwn(Object.getOwnPropertyDescriptor(value, key), "value"),
    );
  if (!exact) {
    throw new TypeError(
      `${path} must contain exactly ${expectedKeys.join(", ")}.`,
    );
  }
}

function requireNonEmptyString(value, path) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`${path} must be a non-empty string.`);
  }
}

function requireKnownValue(value, allowedValues, path) {
  if (!allowedValues.has(value)) {
    throw new TypeError(
      `${path} must be one of ${[...allowedValues].join(", ")}.`,
    );
  }
}

function requireNonNegativeInteger(value, path) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    !Number.isInteger(value) ||
    value < 0
  ) {
    throw new TypeError(`${path} must be a non-negative integer.`);
  }
}

function requireDenseArray(value, path) {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) {
    throw new TypeError(`${path} must be a dense array.`);
  }
  const ownKeys = Reflect.ownKeys(value);
  if (ownKeys.length !== value.length + 1) {
    throw new TypeError(`${path} must be a dense array.`);
  }
  for (let index = 0; index < value.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (
      descriptor === undefined ||
      descriptor.enumerable !== true ||
      !Object.hasOwn(descriptor, "value")
    ) {
      throw new TypeError(`${path} must be a dense array.`);
    }
  }
}

function validateJsonValue(value, path, ancestors = new WeakSet()) {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError(`${path} must be JSON-compatible.`);
    }
    return;
  }
  if (typeof value !== "object") {
    throw new TypeError(`${path} must be JSON-compatible.`);
  }
  if (ancestors.has(value)) {
    throw new TypeError(`${path} must not contain a cyclic reference.`);
  }

  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      requireDenseArray(value, path);
      value.forEach((item, index) => {
        validateJsonValue(item, `${path}[${index}]`, ancestors);
      });
      return;
    }

    requirePlainObject(value, path);
    for (const key of Reflect.ownKeys(value)) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (
        typeof key !== "string" ||
        descriptor.enumerable !== true ||
        !Object.hasOwn(descriptor, "value")
      ) {
        throw new TypeError(`${path} must be JSON-compatible.`);
      }
      validateJsonValue(descriptor.value, `${path}.${key}`, ancestors);
    }
  } finally {
    ancestors.delete(value);
  }
}

function validateConstraint(constraint, index) {
  const path = `intakeDecision.cardio_decision.constraints[${index}]`;
  requireExactKeys(constraint, CONSTRAINT_KEYS, path);
  requireNonEmptyString(constraint.code, `${path}.code`);
  requireKnownValue(constraint.scope, CARDIO_CONSTRAINT_SCOPES, `${path}.scope`);
  validateJsonValue(constraint.value, `${path}.value`);
  requireNonEmptyString(constraint.reason, `${path}.reason`);
}

function validateCardioReason(reason, index) {
  const path = `intakeDecision.cardio_decision.reasons[${index}]`;
  requireExactKeys(reason, REASON_KEYS, path);
  requireNonEmptyString(reason.code, `${path}.code`);
  if (reason.scope !== Scope.CARDIO) {
    throw new TypeError(`${path}.scope must equal CARDIO.`);
  }
  requireNonEmptyString(reason.message, `${path}.message`);
}

function validateReviewFlag(flag, index) {
  const path = `intakeDecision.review_flags[${index}]`;
  requireExactKeys(flag, REVIEW_FLAG_KEYS, path);
  requireNonEmptyString(flag.code, `${path}.code`);
  requireKnownValue(flag.scope, SCOPES, `${path}.scope`);
  requireKnownValue(flag.level, REVIEW_LEVELS, `${path}.level`);
  requireNonEmptyString(flag.message, `${path}.message`);
  requireNonEmptyString(flag.sourcePath, `${path}.sourcePath`);
}

function validateDecisionReason(reason, index) {
  const path = `intakeDecision.decision_reasons[${index}]`;
  requireExactKeys(reason, REASON_KEYS, path);
  requireNonEmptyString(reason.code, `${path}.code`);
  requireKnownValue(reason.scope, SCOPES, `${path}.scope`);
  requireNonEmptyString(reason.message, `${path}.message`);
}

function validateDataIssue(issue, index) {
  const path = `intakeDecision.missing_or_uncertain_data[${index}]`;
  requireExactKeys(issue, DATA_ISSUE_KEYS, path);
  requireNonEmptyString(issue.code, `${path}.code`);
  requireNonEmptyString(issue.path, `${path}.path`);
  requireNonEmptyString(issue.message, `${path}.message`);
}

function validateDecisionCombinations(planStatus, cardioDecision) {
  const {
    strategy,
    max_sessions: maxSessions,
    max_duration_minutes: maxDurationMinutes,
    intensity_start: intensityStart,
  } = cardioDecision;

  if (strategy === CardioStrategy.CARDIO_SESSIONS) {
    if (maxSessions === 0 || maxDurationMinutes === 0) {
      throw new TypeError(
        "intakeDecision.cardio_decision CARDIO_SESSIONS requires positive session and duration limits.",
      );
    }
  } else {
    if (maxSessions !== 0 || maxDurationMinutes !== 0) {
      throw new TypeError(
        "intakeDecision.cardio_decision non-session strategies require zero session and duration limits.",
      );
    }
    if (intensityStart !== CardioIntensity.LOW) {
      throw new TypeError(
        "intakeDecision.cardio_decision non-session strategies require LOW intensity_start.",
      );
    }
  }

  if (
    planStatus === PlanStatus.READY_FOR_DRAFT &&
    strategy === CardioStrategy.REVIEW_REQUIRED
  ) {
    throw new TypeError(
      "READY_FOR_DRAFT cannot pair with cardio strategy REVIEW_REQUIRED.",
    );
  }

  if (
    [PlanStatus.MEDICAL_REVIEW_REQUIRED, PlanStatus.BLOCKED].includes(
      planStatus,
    ) &&
    strategy !== CardioStrategy.REVIEW_REQUIRED
  ) {
    throw new TypeError(
      `${planStatus} requires cardio strategy REVIEW_REQUIRED.`,
    );
  }
}

function validateInput(intakeDecision) {
  requirePlainObject(intakeDecision, "intakeDecision");
  for (const key of [
    "plan_status",
    "review_flags",
    "decision_reasons",
    "missing_or_uncertain_data",
    "cardio_decision",
  ]) {
    requireOwnDataProperty(intakeDecision, key, "intakeDecision");
  }

  requireKnownValue(
    intakeDecision.plan_status,
    PLAN_STATUSES,
    "intakeDecision.plan_status",
  );
  requireExactKeys(
    intakeDecision.cardio_decision,
    CARDIO_DECISION_KEYS,
    "intakeDecision.cardio_decision",
  );

  const cardioDecision = intakeDecision.cardio_decision;
  requireKnownValue(
    cardioDecision.strategy,
    CARDIO_STRATEGIES,
    "intakeDecision.cardio_decision.strategy",
  );
  requireNonNegativeInteger(
    cardioDecision.max_sessions,
    "intakeDecision.cardio_decision.max_sessions",
  );
  requireNonNegativeInteger(
    cardioDecision.max_duration_minutes,
    "intakeDecision.cardio_decision.max_duration_minutes",
  );
  requireKnownValue(
    cardioDecision.intensity_start,
    CARDIO_INTENSITIES,
    "intakeDecision.cardio_decision.intensity_start",
  );

  requireDenseArray(
    cardioDecision.constraints,
    "intakeDecision.cardio_decision.constraints",
  );
  cardioDecision.constraints.forEach(validateConstraint);
  requireDenseArray(
    cardioDecision.reasons,
    "intakeDecision.cardio_decision.reasons",
  );
  cardioDecision.reasons.forEach(validateCardioReason);

  requireDenseArray(intakeDecision.review_flags, "intakeDecision.review_flags");
  intakeDecision.review_flags.forEach(validateReviewFlag);
  requireDenseArray(
    intakeDecision.decision_reasons,
    "intakeDecision.decision_reasons",
  );
  intakeDecision.decision_reasons.forEach(validateDecisionReason);
  requireDenseArray(
    intakeDecision.missing_or_uncertain_data,
    "intakeDecision.missing_or_uncertain_data",
  );
  intakeDecision.missing_or_uncertain_data.forEach(validateDataIssue);

  validateDecisionCombinations(intakeDecision.plan_status, cardioDecision);
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
 * Builds the deterministic Cardio Plan Specification from the authoritative
 * Intake Decision without re-evaluating goals, activity, safety, or capacity.
 *
 * @param {import("./domain/contracts.js").CardioPlanSpecificationInput} intakeDecision
 * @returns {import("./domain/contracts.js").CardioPlanSpecification}
 */
export function buildCardioPlanSpec(intakeDecision) {
  validateInput(intakeDecision);

  const cardioDecision = intakeDecision.cardio_decision;
  const status = STATUS_BY_INTAKE_STATUS[intakeDecision.plan_status];
  const formalSessionState =
    status === CardioPlanStatus.WITHHELD
      ? CardioFormalSessionState.WITHHELD
      : FORMAL_STATE_BY_STRATEGY[cardioDecision.strategy];

  return finalize({
    cardio_plan_spec_version: CARDIO_PLAN_SPEC_VERSION,
    status,
    strategy: cardioDecision.strategy,
    formal_session_state: formalSessionState,
    limits: {
      max_sessions_per_week: cardioDecision.max_sessions,
      max_duration_minutes_per_session:
        cardioDecision.max_duration_minutes,
      intensity_start: cardioDecision.intensity_start,
    },
    constraints: cardioDecision.constraints,
    reasons: cardioDecision.reasons,
    source_review_context: {
      review_flags: intakeDecision.review_flags,
      decision_reasons: intakeDecision.decision_reasons,
      missing_or_uncertain_data: intakeDecision.missing_or_uncertain_data,
    },
  });
}

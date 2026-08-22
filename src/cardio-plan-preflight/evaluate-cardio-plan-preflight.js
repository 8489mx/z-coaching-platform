import { CardioScheduleStatus, CardioScheduleReasonCode, WEEKLY_CARDIO_SCHEDULE_VERSION } from "../weekly-cardio-schedule/index.js";
import { CardioPreflightResult, CardioPreflightIssueSeverity, CardioPreflightIssueCode, CARDIO_PLAN_PREFLIGHT_VERSION } from "./domain/enums.js";

const ISSUE_MESSAGES = Object.freeze({
  [CardioPreflightIssueCode.PLAN_WITHHELD]: "The cardio plan is withheld and cannot be approved until the blocking condition is resolved.",
  [CardioPreflightIssueCode.UPSTREAM_REVIEW_REQUIRED]: "The cardio plan requires coach review because of an unresolved upstream intake or planning decision.",
  [CardioPreflightIssueCode.HIGH_SPORT_DAY_REQUIRES_REVIEW]: "A cardio session overlaps a high-intensity sport day and requires coach review.",
});

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validateTopLevel(weeklyCardioSchedule) {
  if (!isObject(weeklyCardioSchedule)) {
    throw new TypeError("weeklyCardioSchedule must be an object.");
  }
  if (weeklyCardioSchedule.schedule_version !== WEEKLY_CARDIO_SCHEDULE_VERSION) {
    throw new TypeError(`schedule_version must equal ${WEEKLY_CARDIO_SCHEDULE_VERSION}.`);
  }
  if (!Object.values(CardioScheduleStatus).includes(weeklyCardioSchedule.status)) {
    throw new TypeError("weeklyCardioSchedule.status must be a CardioScheduleStatus.");
  }
  if (!Array.isArray(weeklyCardioSchedule.sessions)) {
    throw new TypeError("weeklyCardioSchedule.sessions must be an array.");
  }
  if (typeof weeklyCardioSchedule.schedule_review_required !== "boolean") {
    throw new TypeError("weeklyCardioSchedule.schedule_review_required must be a boolean.");
  }
  if (!Array.isArray(weeklyCardioSchedule.reasons)) {
    throw new TypeError("weeklyCardioSchedule.reasons must be an array.");
  }
  if (!Number.isInteger(weeklyCardioSchedule.recommended_sessions) || weeklyCardioSchedule.recommended_sessions < 0) {
    throw new TypeError("weeklyCardioSchedule.recommended_sessions must be a non-negative integer.");
  }
}

function validateWithheldPlan(weeklyCardioSchedule) {
  if (weeklyCardioSchedule.sessions.length !== 0) {
    throw new TypeError("A withheld cardio plan must not contain sessions.");
  }
  if (weeklyCardioSchedule.schedule_review_required !== false) {
    throw new TypeError("A withheld cardio plan cannot require weekly schedule review.");
  }
}

function validateSessionCount(weeklyCardioSchedule) {
  const sessionCount = weeklyCardioSchedule.sessions.length;
  if (sessionCount === 0) {
    if (weeklyCardioSchedule.status !== CardioScheduleStatus.PROVISIONAL_REVIEW_REQUIRED || weeklyCardioSchedule.recommended_sessions !== 0) {
      if (!weeklyCardioSchedule.reasons.some((r) => r.code === CardioScheduleReasonCode.NO_CARDIO_TO_SCHEDULE)) {
         throw new TypeError("A non-withheld plan without sessions must have zero recommended_sessions and a NO_CARDIO_TO_SCHEDULE reason.");
      }
    }
    return;
  }
  if (sessionCount !== weeklyCardioSchedule.recommended_sessions) {
    throw new TypeError("Session count must equal recommended_sessions.");
  }
  const sequences = weeklyCardioSchedule.sessions.map((session) => session.sequence);
  const sortedSequences = [...sequences].sort((left, right) => left - right);
  if (sortedSequences.some((value, index) => value !== index + 1)) {
    throw new TypeError("Session sequence values must be unique, contiguous, and start at 1.");
  }
}

function issue(code, severity, sessionSequence = null) {
  return {
    code,
    severity,
    message: ISSUE_MESSAGES[code],
    session_sequence: sessionSequence,
  };
}

function report(weeklyCardioSchedule, result, canApprove, issues) {
  return {
    preflight_version: CARDIO_PLAN_PREFLIGHT_VERSION,
    schedule_version: weeklyCardioSchedule.schedule_version,
    plan_status: weeklyCardioSchedule.status,
    result,
    can_approve: canApprove,
    issues,
  };
}

function buildProvisionalIssues(weeklyCardioSchedule) {
  const issues = [];
  
  if (weeklyCardioSchedule.schedule_review_required) {
    issues.push(issue(CardioPreflightIssueCode.HIGH_SPORT_DAY_REQUIRES_REVIEW, CardioPreflightIssueSeverity.REVIEW));
  }
  
  if (issues.length === 0) {
    issues.push(issue(CardioPreflightIssueCode.UPSTREAM_REVIEW_REQUIRED, CardioPreflightIssueSeverity.REVIEW));
  }
  
  return issues;
}

export function evaluateCardioPlanPreflight(weeklyCardioSchedule) {
  validateTopLevel(weeklyCardioSchedule);

  if (weeklyCardioSchedule.status === CardioScheduleStatus.WITHHELD) {
    validateWithheldPlan(weeklyCardioSchedule);
    return report(weeklyCardioSchedule, CardioPreflightResult.WITHHELD, false, [
      issue(CardioPreflightIssueCode.PLAN_WITHHELD, CardioPreflightIssueSeverity.BLOCKING),
    ]);
  }

  validateSessionCount(weeklyCardioSchedule);

  if (weeklyCardioSchedule.status === CardioScheduleStatus.READY) {
    if (weeklyCardioSchedule.schedule_review_required) {
      throw new TypeError("A READY cardio plan cannot require schedule review.");
    }
    return report(weeklyCardioSchedule, CardioPreflightResult.PASSED, true, []);
  }

  return report(
    weeklyCardioSchedule,
    CardioPreflightResult.REVIEW_REQUIRED,
    false,
    buildProvisionalIssues(weeklyCardioSchedule)
  );
}

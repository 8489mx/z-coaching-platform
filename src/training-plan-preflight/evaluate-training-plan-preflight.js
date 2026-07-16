import { DayOfWeek, ScheduleMode } from "../intake-decision-engine/index.js";
import { TrainingPlanStatus } from "../training-plan-specification/index.js";
import { ExerciseSlotSelectionStatus } from "../exercise-selection/index.js";
import { ExercisePrescriptionUnit } from "../exercise-catalog/index.js";
import {
  ScheduleReasonCode,
  WEEKLY_TRAINING_SCHEDULE_VERSION,
  WeeklySportLoad,
} from "../weekly-training-schedule/index.js";
import { TRAINING_PLAN_PREFLIGHT_VERSION } from "./domain/contracts.js";
import {
  PreflightIssueCode,
  PreflightIssueSeverity,
  TrainingPlanPreflightResult,
} from "./domain/enums.js";

const knownPlanStatuses = new Set(Object.values(TrainingPlanStatus));
const knownScheduleModes = new Set(Object.values(ScheduleMode));
const knownDays = new Set(Object.values(DayOfWeek));
const knownSportLoads = new Set(Object.values(WeeklySportLoad));
const knownScheduleReasonCodes = new Set(Object.values(ScheduleReasonCode));
const knownSelectionStatuses = new Set(Object.values(ExerciseSlotSelectionStatus));
const knownPrescriptionUnits = new Set(Object.values(ExercisePrescriptionUnit));

const ISSUE_MESSAGES = Object.freeze({
  [PreflightIssueCode.PLAN_WITHHELD]:
    "The training plan is withheld and cannot be approved until the blocking condition is resolved.",
  [PreflightIssueCode.UPSTREAM_REVIEW_REQUIRED]:
    "The training plan requires coach review because of an unresolved upstream intake or planning decision.",
  [PreflightIssueCode.EXERCISE_SLOT_REQUIRES_REVIEW]:
    "A training exercise slot is unresolved and must be reviewed before approval.",
  [PreflightIssueCode.HIGH_SPORT_DAY_REQUIRES_REVIEW]:
    "A training session overlaps a reported high-intensity sport day and requires coach review.",
});

const FIXED_DAY_REASON_BY_LOAD = Object.freeze({
  [WeeklySportLoad.NONE]: ScheduleReasonCode.SELECTED_FIXED_TRAINING_DAY,
  [WeeklySportLoad.LOW]: ScheduleReasonCode.SELECTED_AROUND_ADDITIONAL_SPORT,
  [WeeklySportLoad.MODERATE]:
    ScheduleReasonCode.SELECTED_AROUND_ADDITIONAL_SPORT,
  [WeeklySportLoad.HIGH]: ScheduleReasonCode.HIGH_SPORT_DAY_REQUIRES_REVIEW,
});

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

function validateTopLevel(weeklyTrainingSchedule) {
  if (!isObject(weeklyTrainingSchedule)) {
    throw new TypeError("weeklyTrainingSchedule must be an object.");
  }
  if (
    weeklyTrainingSchedule.schedule_version !==
    WEEKLY_TRAINING_SCHEDULE_VERSION
  ) {
    throw new TypeError(
      `schedule_version must equal ${WEEKLY_TRAINING_SCHEDULE_VERSION}.`,
    );
  }
  if (!knownPlanStatuses.has(weeklyTrainingSchedule.status)) {
    throw new TypeError("weeklyTrainingSchedule.status must be a TrainingPlanStatus.");
  }
  if (!knownScheduleModes.has(weeklyTrainingSchedule.schedule_mode)) {
    throw new TypeError("weeklyTrainingSchedule.schedule_mode must be a ScheduleMode.");
  }
  if (!Array.isArray(weeklyTrainingSchedule.sessions)) {
    throw new TypeError("weeklyTrainingSchedule.sessions must be an array.");
  }
  if (typeof weeklyTrainingSchedule.schedule_review_required !== "boolean") {
    throw new TypeError(
      "weeklyTrainingSchedule.schedule_review_required must be a boolean.",
    );
  }
  if (!Array.isArray(weeklyTrainingSchedule.schedule_reasons)) {
    throw new TypeError("weeklyTrainingSchedule.schedule_reasons must be an array.");
  }
  if (!Array.isArray(weeklyTrainingSchedule.constraints)) {
    throw new TypeError("weeklyTrainingSchedule.constraints must be an array.");
  }
  if (!Array.isArray(weeklyTrainingSchedule.reasons)) {
    throw new TypeError("weeklyTrainingSchedule.reasons must be an array.");
  }
  if (
    !Number.isInteger(weeklyTrainingSchedule.recommended_days) ||
    weeklyTrainingSchedule.recommended_days < 0
  ) {
    throw new TypeError(
      "weeklyTrainingSchedule.recommended_days must be a non-negative integer.",
    );
  }
}

function validateContiguousPositiveIntegers(values, label) {
  if (values.some((value) => !isPositiveInteger(value))) {
    throw new TypeError(`${label} values must be positive integers.`);
  }
  const sortedValues = [...values].sort((left, right) => left - right);
  if (sortedValues.some((value, index) => value !== index + 1)) {
    throw new TypeError(`${label} values must be unique, contiguous, and start at 1.`);
  }
}

function validateWithheldPlan(weeklyTrainingSchedule) {
  if (weeklyTrainingSchedule.sessions.length !== 0) {
    throw new TypeError("A withheld training plan must not contain sessions.");
  }
  if (weeklyTrainingSchedule.schedule_review_required !== false) {
    throw new TypeError(
      "A withheld training plan cannot require weekly schedule review.",
    );
  }
  if (weeklyTrainingSchedule.schedule_reasons.length !== 0) {
    throw new TypeError("A withheld training plan cannot contain schedule reasons.");
  }
}

function validateActiveSessionCount(weeklyTrainingSchedule) {
  const sessionCount = weeklyTrainingSchedule.sessions.length;
  if (sessionCount === 0) {
    if (
      weeklyTrainingSchedule.status !==
        TrainingPlanStatus.PROVISIONAL_REVIEW_REQUIRED ||
      weeklyTrainingSchedule.recommended_days !== 0
    ) {
      throw new TypeError(
        "A non-withheld plan without sessions must be provisional with zero recommended days.",
      );
    }
    return;
  }
  if (sessionCount < 2 || sessionCount > 6) {
    throw new TypeError("A non-withheld training plan must contain 2 to 6 sessions.");
  }
  if (sessionCount !== weeklyTrainingSchedule.recommended_days) {
    throw new TypeError("Session count must equal recommended_days.");
  }
  if (weeklyTrainingSchedule.sessions.some((session) => !isObject(session))) {
    throw new TypeError("Every training session must be an object.");
  }
  validateContiguousPositiveIntegers(
    weeklyTrainingSchedule.sessions.map((session) => session.sequence),
    "Session sequence",
  );
}

function validateFixedDaySession(session, scheduledDays) {
  if (!knownDays.has(session.scheduled_day)) {
    throw new TypeError("FIXED_DAYS sessions must use a known DayOfWeek.");
  }
  if (scheduledDays.has(session.scheduled_day)) {
    throw new TypeError("FIXED_DAYS sessions cannot repeat scheduled_day.");
  }
  scheduledDays.add(session.scheduled_day);

  if (!knownSportLoads.has(session.sport_load)) {
    throw new TypeError("FIXED_DAYS session sport_load must be a WeeklySportLoad.");
  }
  if (!knownScheduleReasonCodes.has(session.schedule_reason_code)) {
    throw new TypeError(
      "FIXED_DAYS schedule_reason_code must be a ScheduleReasonCode.",
    );
  }
  if (session.schedule_reason_code !== FIXED_DAY_REASON_BY_LOAD[session.sport_load]) {
    throw new TypeError(
      "FIXED_DAYS sport_load and schedule_reason_code are inconsistent.",
    );
  }
}

function validateSessionSequenceSession(session) {
  if (
    session.scheduled_day !== null ||
    session.sport_load !== WeeklySportLoad.NONE ||
    session.schedule_reason_code !== ScheduleReasonCode.SESSION_SEQUENCE_REQUIRED
  ) {
    throw new TypeError(
      "SESSION_SEQUENCE sessions require null day, NONE load, and SESSION_SEQUENCE_REQUIRED reason.",
    );
  }
}

function validateWeeklySchedule(weeklyTrainingSchedule) {
  const scheduledDays = new Set();
  let hasHighSportDay = false;

  for (const session of weeklyTrainingSchedule.sessions) {
    if (weeklyTrainingSchedule.schedule_mode === ScheduleMode.FIXED_DAYS) {
      validateFixedDaySession(session, scheduledDays);
      if (session.sport_load === WeeklySportLoad.HIGH) {
        hasHighSportDay = true;
      }
    } else {
      validateSessionSequenceSession(session);
    }
  }

  return hasHighSportDay;
}

function validatePrescription(prescription) {
  if (!isObject(prescription)) {
    throw new TypeError("A selected exercise must contain a prescription object.");
  }
  if (!isPositiveInteger(prescription.sets)) {
    throw new TypeError("Prescription sets must be a positive integer.");
  }
  if (!knownPrescriptionUnits.has(prescription.unit)) {
    throw new TypeError("Prescription unit must be an ExercisePrescriptionUnit.");
  }
  if (
    !isPositiveInteger(prescription.target_min) ||
    !isPositiveInteger(prescription.target_max) ||
    prescription.target_min > prescription.target_max
  ) {
    throw new TypeError(
      "Prescription targets must be positive integers with target_min <= target_max.",
    );
  }
  if (!isPositiveInteger(prescription.rest_seconds)) {
    throw new TypeError("Prescription rest_seconds must be a positive integer.");
  }
}

function validateSelectedExercise(exercise) {
  if (!isNonEmptyString(exercise.exercise_code)) {
    throw new TypeError("A selected exercise must have a non-empty exercise_code.");
  }
  if (!isNonEmptyString(exercise.name_en)) {
    throw new TypeError("A selected exercise must have a non-empty name_en.");
  }
  validatePrescription(exercise.prescription);
}

function validateReviewExercise(exercise) {
  if (
    exercise.exercise_code !== null ||
    exercise.name_en !== null ||
    exercise.prescription !== null
  ) {
    throw new TypeError(
      "A review-required exercise slot must keep exercise_code, name_en, and prescription null.",
    );
  }
}

function validateExercises(weeklyTrainingSchedule) {
  const reviewSlots = [];

  for (const session of weeklyTrainingSchedule.sessions) {
    if (!Array.isArray(session.exercises)) {
      throw new TypeError("Every training session exercises field must be an array.");
    }
    if (session.exercises.some((exercise) => !isObject(exercise))) {
      throw new TypeError("Every exercise slot must be an object.");
    }
    validateContiguousPositiveIntegers(
      session.exercises.map((exercise) => exercise.order),
      `Exercise order for session ${session.sequence}`,
    );

    for (const exercise of session.exercises) {
      if (!knownSelectionStatuses.has(exercise.selection_status)) {
        throw new TypeError(
          "Exercise selection_status must be an ExerciseSlotSelectionStatus.",
        );
      }

      if (exercise.selection_status === ExerciseSlotSelectionStatus.SELECTED) {
        validateSelectedExercise(exercise);
        continue;
      }

      validateReviewExercise(exercise);
      reviewSlots.push({
        session_sequence: session.sequence,
        slot_order: exercise.order,
      });
    }
  }

  return reviewSlots;
}

function validateHighSportReview(weeklyTrainingSchedule, hasHighSportDay) {
  if (hasHighSportDay) {
    if (
      weeklyTrainingSchedule.schedule_review_required !== true ||
      weeklyTrainingSchedule.status === TrainingPlanStatus.READY ||
      weeklyTrainingSchedule.schedule_reasons.length !== 1 ||
      weeklyTrainingSchedule.schedule_reasons[0]?.code !==
        ScheduleReasonCode.HIGH_SPORT_DAY_REQUIRES_REVIEW
    ) {
      throw new TypeError(
        "A HIGH sport day requires one matching schedule review and a non-ready status.",
      );
    }
    return;
  }

  if (
    weeklyTrainingSchedule.schedule_review_required !== false ||
    weeklyTrainingSchedule.schedule_reasons.length !== 0
  ) {
    throw new TypeError(
      "A schedule without HIGH sport days cannot require schedule review or reasons.",
    );
  }
}

function issue(code, severity, sessionSequence = null, slotOrder = null) {
  return {
    code,
    severity,
    message: ISSUE_MESSAGES[code],
    session_sequence: sessionSequence,
    slot_order: slotOrder,
  };
}

function report(weeklyTrainingSchedule, result, canApprove, issues) {
  return {
    preflight_version: TRAINING_PLAN_PREFLIGHT_VERSION,
    schedule_version: weeklyTrainingSchedule.schedule_version,
    plan_status: weeklyTrainingSchedule.status,
    result,
    can_approve: canApprove,
    issues,
  };
}

function buildProvisionalIssues(hasHighSportDay, reviewSlots) {
  const issues = [];
  if (hasHighSportDay) {
    issues.push(
      issue(
        PreflightIssueCode.HIGH_SPORT_DAY_REQUIRES_REVIEW,
        PreflightIssueSeverity.REVIEW,
      ),
    );
  }

  const sortedReviewSlots = [...reviewSlots].sort(
    (left, right) =>
      left.session_sequence - right.session_sequence ||
      left.slot_order - right.slot_order,
  );
  for (const reviewSlot of sortedReviewSlots) {
    issues.push(
      issue(
        PreflightIssueCode.EXERCISE_SLOT_REQUIRES_REVIEW,
        PreflightIssueSeverity.REVIEW,
        reviewSlot.session_sequence,
        reviewSlot.slot_order,
      ),
    );
  }

  if (issues.length === 0) {
    issues.push(
      issue(
        PreflightIssueCode.UPSTREAM_REVIEW_REQUIRED,
        PreflightIssueSeverity.REVIEW,
      ),
    );
  }
  return issues;
}

/**
 * Validates a final weekly training schedule and returns an approval report
 * without changing or embedding the schedule.
 *
 * @param {Object} weeklyTrainingSchedule
 * @returns {import("./domain/contracts.js").TrainingPlanPreflightReport}
 */
export function evaluateTrainingPlanPreflight(weeklyTrainingSchedule) {
  validateTopLevel(weeklyTrainingSchedule);

  if (weeklyTrainingSchedule.status === TrainingPlanStatus.WITHHELD) {
    validateWithheldPlan(weeklyTrainingSchedule);
    return report(
      weeklyTrainingSchedule,
      TrainingPlanPreflightResult.WITHHELD,
      false,
      [
        issue(
          PreflightIssueCode.PLAN_WITHHELD,
          PreflightIssueSeverity.BLOCKING,
        ),
      ],
    );
  }

  validateActiveSessionCount(weeklyTrainingSchedule);
  const hasHighSportDay = validateWeeklySchedule(weeklyTrainingSchedule);
  const reviewSlots = validateExercises(weeklyTrainingSchedule);
  validateHighSportReview(weeklyTrainingSchedule, hasHighSportDay);

  if (
    weeklyTrainingSchedule.status === TrainingPlanStatus.READY &&
    reviewSlots.length > 0
  ) {
    throw new TypeError("A READY training plan cannot contain review-required slots.");
  }

  if (weeklyTrainingSchedule.status === TrainingPlanStatus.READY) {
    return report(
      weeklyTrainingSchedule,
      TrainingPlanPreflightResult.PASSED,
      true,
      [],
    );
  }

  return report(
    weeklyTrainingSchedule,
    TrainingPlanPreflightResult.REVIEW_REQUIRED,
    false,
    buildProvisionalIssues(hasHighSportDay, reviewSlots),
  );
}

import {
  DayOfWeek,
  ScheduleMode,
  SportIntensity,
} from "../intake-decision-engine/index.js";
import { TrainingPlanStatus } from "../training-plan-specification/index.js";
import { WEEKLY_TRAINING_SCHEDULE_VERSION } from "./domain/contracts.js";
import { ScheduleReasonCode, WeeklySportLoad } from "./domain/enums.js";

const DAYS_OF_WEEK = Object.freeze([
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY,
]);

const PREFERRED_DAY_ORDER = Object.freeze({
  2: Object.freeze([
    DayOfWeek.MONDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.FRIDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.SATURDAY,
    DayOfWeek.SUNDAY,
  ]),
  3: Object.freeze([
    DayOfWeek.MONDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.FRIDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.SATURDAY,
    DayOfWeek.SUNDAY,
  ]),
  4: Object.freeze([
    DayOfWeek.MONDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.SATURDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.FRIDAY,
    DayOfWeek.SUNDAY,
  ]),
  5: Object.freeze([
    DayOfWeek.MONDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.FRIDAY,
    DayOfWeek.SATURDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.SUNDAY,
  ]),
  6: DAYS_OF_WEEK,
});

const SPORT_LOAD_RANK = Object.freeze({
  [WeeklySportLoad.NONE]: 0,
  [WeeklySportLoad.LOW]: 1,
  [WeeklySportLoad.MODERATE]: 2,
  [WeeklySportLoad.HIGH]: 3,
});

const INTENSITY_TO_SPORT_LOAD = Object.freeze({
  [SportIntensity.LOW]: WeeklySportLoad.LOW,
  [SportIntensity.MODERATE]: WeeklySportLoad.MODERATE,
  [SportIntensity.HIGH]: WeeklySportLoad.HIGH,
});

const knownDays = new Set(DAYS_OF_WEEK);
const naturalDayRank = new Map(DAYS_OF_WEEK.map((day, index) => [day, index]));

function validateTrainingDraft(trainingDraft) {
  if (
    trainingDraft === null ||
    typeof trainingDraft !== "object" ||
    Array.isArray(trainingDraft)
  ) {
    throw new TypeError("trainingDraft must be an object.");
  }
  if (!Array.isArray(trainingDraft.sessions)) {
    throw new TypeError("trainingDraft.sessions must be an array.");
  }
  if (
    trainingDraft.schedule_mode !== ScheduleMode.FIXED_DAYS &&
    trainingDraft.schedule_mode !== ScheduleMode.SESSION_SEQUENCE
  ) {
    throw new TypeError(
      `Unsupported schedule_mode in weekly training schedule: ${trainingDraft.schedule_mode}.`,
    );
  }

  const sequences = trainingDraft.sessions.map((session) => session?.sequence);
  if (sequences.some((sequence) => !Number.isInteger(sequence))) {
    throw new TypeError("Every training session sequence must be an integer.");
  }
  const sortedSequences = [...sequences].sort((left, right) => left - right);
  if (sortedSequences.some((sequence, index) => sequence !== index + 1)) {
    throw new TypeError(
      "Training session sequence values must be unique, contiguous, and start at 1.",
    );
  }
}

function buildOutput(
  trainingDraft,
  { status, sessions, scheduleReviewRequired, scheduleReasons },
) {
  return {
    schedule_version: WEEKLY_TRAINING_SCHEDULE_VERSION,
    draft_version: trainingDraft.draft_version,
    pipeline_versions: trainingDraft.pipeline_versions,
    prescription_version: trainingDraft.prescription_version,
    status,
    recommended_days: trainingDraft.recommended_days,
    split_code: trainingDraft.split_code,
    schedule_mode: trainingDraft.schedule_mode,
    intro_week_required: trainingDraft.intro_week_required,
    volume_start: trainingDraft.volume_start,
    schedule_review_required: scheduleReviewRequired,
    schedule_reasons: scheduleReasons,
    sessions,
    constraints: trainingDraft.constraints,
    reasons: trainingDraft.reasons,
  };
}

function addUniqueConstraintDay(target, seen, constraintCode, constraint) {
  const day = constraint?.value?.day;
  if (!knownDays.has(day)) {
    throw new TypeError(`${constraintCode} must contain a known DayOfWeek value.`);
  }
  if (seen.has(day)) {
    throw new TypeError(`${constraintCode} cannot repeat day ${day}.`);
  }
  seen.add(day);
  target.push(day);
}

function extractScheduleConstraints(constraints) {
  if (!Array.isArray(constraints)) {
    throw new TypeError("trainingDraft.constraints must be an array when sessions exist.");
  }

  const availableDays = [];
  const unavailableDays = [];
  const seenAvailableDays = new Set();
  const seenUnavailableDays = new Set();
  const sportLoadByDay = new Map(
    DAYS_OF_WEEK.map((day) => [day, WeeklySportLoad.NONE]),
  );

  for (const constraint of constraints) {
    if (constraint?.code === "TRAINING_AVAILABLE_DAY") {
      addUniqueConstraintDay(
        availableDays,
        seenAvailableDays,
        "TRAINING_AVAILABLE_DAY",
        constraint,
      );
      continue;
    }
    if (constraint?.code === "TRAINING_UNAVAILABLE_DAY") {
      addUniqueConstraintDay(
        unavailableDays,
        seenUnavailableDays,
        "TRAINING_UNAVAILABLE_DAY",
        constraint,
      );
      continue;
    }
    if (constraint?.code !== "EXISTING_ADDITIONAL_SPORT") {
      continue;
    }

    const days = constraint?.value?.days;
    const intensity = constraint?.value?.intensity;
    if (!Array.isArray(days)) {
      throw new TypeError("EXISTING_ADDITIONAL_SPORT must contain a days array.");
    }
    if (!Object.hasOwn(INTENSITY_TO_SPORT_LOAD, intensity)) {
      throw new TypeError(
        "EXISTING_ADDITIONAL_SPORT must contain a known SportIntensity value.",
      );
    }

    const sportLoad = INTENSITY_TO_SPORT_LOAD[intensity];
    for (const day of days) {
      if (!knownDays.has(day)) {
        throw new TypeError(
          "EXISTING_ADDITIONAL_SPORT days must contain only known DayOfWeek values.",
        );
      }
      if (SPORT_LOAD_RANK[sportLoad] > SPORT_LOAD_RANK[sportLoadByDay.get(day)]) {
        sportLoadByDay.set(day, sportLoad);
      }
    }
  }

  return { availableDays, unavailableDays, sportLoadByDay };
}

function validateFixedDayPlan(trainingDraft) {
  const sessionCount = trainingDraft.sessions.length;
  if (sessionCount < 2 || sessionCount > 6) {
    throw new TypeError("A fixed weekly training schedule requires 2 to 6 sessions.");
  }
  if (trainingDraft.recommended_days !== sessionCount) {
    throw new TypeError(
      "Fixed weekly training sessions must equal trainingDraft.recommended_days.",
    );
  }
}

function buildCandidateDays(availableDays, unavailableDays, sessionCount) {
  if (availableDays.length > 0 && unavailableDays.length > 0) {
    throw new TypeError(
      "TRAINING_AVAILABLE_DAY and TRAINING_UNAVAILABLE_DAY cannot be combined.",
    );
  }

  const candidateDays =
    availableDays.length > 0
      ? [...availableDays]
      : DAYS_OF_WEEK.filter((day) => !unavailableDays.includes(day));
  if (candidateDays.length < sessionCount) {
    throw new TypeError(
      "Candidate training days cannot be fewer than the fixed training sessions.",
    );
  }
  return candidateDays;
}

function chooseTrainingDays(candidateDays, sportLoadByDay, sessionCount) {
  const preferredRank = new Map(
    PREFERRED_DAY_ORDER[sessionCount].map((day, index) => [day, index]),
  );
  return [...candidateDays]
    .sort((left, right) => {
      const loadDifference =
        SPORT_LOAD_RANK[sportLoadByDay.get(left)] -
        SPORT_LOAD_RANK[sportLoadByDay.get(right)];
      return loadDifference || preferredRank.get(left) - preferredRank.get(right);
    })
    .slice(0, sessionCount)
    .sort((left, right) => naturalDayRank.get(left) - naturalDayRank.get(right));
}

function reasonCodeForSportLoad(sportLoad) {
  if (sportLoad === WeeklySportLoad.NONE) {
    return ScheduleReasonCode.SELECTED_FIXED_TRAINING_DAY;
  }
  if (sportLoad === WeeklySportLoad.HIGH) {
    return ScheduleReasonCode.HIGH_SPORT_DAY_REQUIRES_REVIEW;
  }
  return ScheduleReasonCode.SELECTED_AROUND_ADDITIONAL_SPORT;
}

function buildSessionSequenceSchedule(trainingDraft) {
  const sessions = trainingDraft.sessions.map((session) => ({
    ...session,
    scheduled_day: null,
    sport_load: WeeklySportLoad.NONE,
    schedule_reason_code: ScheduleReasonCode.SESSION_SEQUENCE_REQUIRED,
  }));
  return buildOutput(trainingDraft, {
    status: trainingDraft.status,
    sessions,
    scheduleReviewRequired: false,
    scheduleReasons: [],
  });
}

function buildFixedDaySchedule(trainingDraft, constraintData) {
  validateFixedDayPlan(trainingDraft);
  const sessionCount = trainingDraft.sessions.length;
  const candidateDays = buildCandidateDays(
    constraintData.availableDays,
    constraintData.unavailableDays,
    sessionCount,
  );
  const selectedDays = chooseTrainingDays(
    candidateDays,
    constraintData.sportLoadByDay,
    sessionCount,
  );
  const sessions = trainingDraft.sessions.map((session) => {
    const scheduledDay = selectedDays[session.sequence - 1];
    const sportLoad = constraintData.sportLoadByDay.get(scheduledDay);
    return {
      ...session,
      scheduled_day: scheduledDay,
      sport_load: sportLoad,
      schedule_reason_code: reasonCodeForSportLoad(sportLoad),
    };
  });
  const scheduleReviewRequired = selectedDays.some(
    (day) => constraintData.sportLoadByDay.get(day) === WeeklySportLoad.HIGH,
  );
  const status =
    scheduleReviewRequired && trainingDraft.status === TrainingPlanStatus.READY
      ? TrainingPlanStatus.PROVISIONAL_REVIEW_REQUIRED
      : trainingDraft.status;
  const scheduleReasons = scheduleReviewRequired
    ? [
        {
          code: ScheduleReasonCode.HIGH_SPORT_DAY_REQUIRES_REVIEW,
          message:
            "A training session overlaps a reported high-intensity sport day and requires coach review.",
        },
      ]
    : [];

  return buildOutput(trainingDraft, {
    status,
    sessions,
    scheduleReviewRequired,
    scheduleReasons,
  });
}

/**
 * Adds a deterministic weekly schedule to a final Training Draft without
 * changing its exercises, prescriptions, constraints, or reasons.
 *
 * @param {import("./domain/contracts.js").TrainingDraftInput} trainingDraft
 * @returns {import("./domain/contracts.js").WeeklyTrainingSchedule}
 */
export function buildWeeklyTrainingSchedule(trainingDraft) {
  validateTrainingDraft(trainingDraft);

  if (
    trainingDraft.status === TrainingPlanStatus.WITHHELD ||
    trainingDraft.sessions.length === 0
  ) {
    return buildOutput(trainingDraft, {
      status: trainingDraft.status,
      sessions: [],
      scheduleReviewRequired: false,
      scheduleReasons: [],
    });
  }

  const constraintData = extractScheduleConstraints(trainingDraft.constraints);
  if (trainingDraft.schedule_mode === ScheduleMode.SESSION_SEQUENCE) {
    return buildSessionSequenceSchedule(trainingDraft);
  }
  return buildFixedDaySchedule(trainingDraft, constraintData);
}

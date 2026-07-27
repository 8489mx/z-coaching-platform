import { DayOfWeek, SportIntensity } from "../intake-decision-engine/index.js";
import {
  WEEKLY_CARDIO_SCHEDULE_VERSION,
  CardioScheduleStatus,
  CardioScheduleReasonCode,
} from "./domain/enums.js";

const DAYS_OF_WEEK = Object.freeze([
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY,
]);

// Prefer spacing out sessions. We can reuse a simple deterministic spread.
const PREFERRED_DAY_ORDER = Object.freeze({
  1: Object.freeze([
    DayOfWeek.WEDNESDAY,
    DayOfWeek.SATURDAY,
    DayOfWeek.MONDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.FRIDAY,
    DayOfWeek.SUNDAY,
  ]),
  2: Object.freeze([
    DayOfWeek.TUESDAY,
    DayOfWeek.SATURDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.MONDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.FRIDAY,
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
  7: DAYS_OF_WEEK,
});

const naturalDayRank = new Map(DAYS_OF_WEEK.map((day, index) => [day, index]));

function extractSportLoadByDay(constraints) {
  const sportLoadByDay = new Map(DAYS_OF_WEEK.map((day) => [day, "NONE"]));
  const loadLevels = { NONE: 0, LOW: 1, MODERATE: 2, HIGH: 3 };
  const intensityMap = {
    [SportIntensity.LOW]: "LOW",
    [SportIntensity.MODERATE]: "MODERATE",
    [SportIntensity.HIGH]: "HIGH",
  };

  for (const constraint of constraints) {
    if (constraint?.code === "EXISTING_ADDITIONAL_SPORT") {
      const days = constraint?.value?.days || [];
      const intensity = constraint?.value?.intensity;
      const sportLoad = intensityMap[intensity] || "NONE";

      for (const day of days) {
        if (loadLevels[sportLoad] > loadLevels[sportLoadByDay.get(day)]) {
          sportLoadByDay.set(day, sportLoad);
        }
      }
    }
  }
  return sportLoadByDay;
}

function getDayRank(hasTraining, sportLoad) {
  if (sportLoad === "HIGH") return 6; // Worst
  if (hasTraining && sportLoad === "MODERATE") return 5;
  if (hasTraining && sportLoad === "LOW") return 4;
  if (!hasTraining && sportLoad === "MODERATE") return 3;
  if (hasTraining && sportLoad === "NONE") return 2;
  if (!hasTraining && sportLoad === "LOW") return 1;
  return 0; // Best: No training, no sport
}

function getScheduleReasonCode(hasTraining, sportLoad) {
  if (sportLoad === "HIGH") return CardioScheduleReasonCode.CARDIO_SCHEDULED_ON_HIGH_SPORT_DAY;
  if (hasTraining) return CardioScheduleReasonCode.CARDIO_SCHEDULED_ON_TRAINING_DAY;
  if (sportLoad === "MODERATE") return CardioScheduleReasonCode.CARDIO_SCHEDULED_ON_MODERATE_SPORT_DAY;
  if (sportLoad === "LOW") return CardioScheduleReasonCode.CARDIO_SCHEDULED_ON_LOW_SPORT_DAY;
  return CardioScheduleReasonCode.CARDIO_SCHEDULED_ON_REST_DAY;
}

function validateInputs(cardioPrescription, weeklyTrainingSchedule) {
  if (!cardioPrescription || !weeklyTrainingSchedule) {
    throw new TypeError("Both cardioPrescription and weeklyTrainingSchedule are required.");
  }
  if (!Array.isArray(cardioPrescription.sessions)) {
    throw new TypeError("cardioPrescription.sessions must be an array.");
  }
}

export function buildWeeklyCardioSchedule(cardioPrescription, weeklyTrainingSchedule) {
  validateInputs(cardioPrescription, weeklyTrainingSchedule);

  if (
    cardioPrescription.status === CardioScheduleStatus.WITHHELD ||
    cardioPrescription.sessions.length === 0
  ) {
    const reasons = [...cardioPrescription.reasons];
    if (cardioPrescription.sessions.length === 0 && cardioPrescription.status !== CardioScheduleStatus.WITHHELD) {
      reasons.push({
        code: CardioScheduleReasonCode.NO_CARDIO_TO_SCHEDULE,
        scope: "CARDIO",
        message: "No cardio sessions to schedule.",
      });
    }

    return {
      schedule_version: WEEKLY_CARDIO_SCHEDULE_VERSION,
      prescription_version: cardioPrescription.cardio_prescription_version,
      status: cardioPrescription.status,
      schedule_review_required: false,
      recommended_sessions: cardioPrescription.recommended_sessions,
      sessions: [],
      steps_prescription: cardioPrescription.steps_prescription,
      constraints: cardioPrescription.constraints,
      reasons,
    };
  }

  const sessions = [];
  const reasons = [...cardioPrescription.reasons];
  let status = cardioPrescription.status;
  let schedule_review_required = false;

  const baseInstruction =
    "This is a recommended day, but you can flexibly perform your cardio after resistance training or on a rest day based on your schedule and energy. Prefer low-impact options like Elliptical or Bike to protect your joints.";

  if (weeklyTrainingSchedule.schedule_mode === "SESSION_SEQUENCE") {
    for (const session of cardioPrescription.sessions) {
      sessions.push({
        ...session,
        scheduled_day: null,
        schedule_reason_code: CardioScheduleReasonCode.CARDIO_SESSION_SEQUENCE_REQUIRED,
        instruction: baseInstruction,
      });
    }
  } else {
    // FIXED_DAYS
    const trainingDays = new Set(
      weeklyTrainingSchedule.sessions
        .map((s) => s.scheduled_day)
        .filter((d) => d !== null)
    );

    const sportLoadByDay = extractSportLoadByDay(cardioPrescription.constraints);
    const sessionCount = cardioPrescription.sessions.length;

    const preferredRank = new Map(
      (PREFERRED_DAY_ORDER[sessionCount] || DAYS_OF_WEEK).map((day, index) => [day, index])
    );

    const candidateDays = [...DAYS_OF_WEEK].sort((left, right) => {
      const leftRank = getDayRank(trainingDays.has(left), sportLoadByDay.get(left));
      const rightRank = getDayRank(trainingDays.has(right), sportLoadByDay.get(right));
      
      const rankDiff = leftRank - rightRank;
      if (rankDiff !== 0) return rankDiff;
      
      return preferredRank.get(left) - preferredRank.get(right);
    });

    const selectedDays = candidateDays
      .slice(0, sessionCount)
      .sort((left, right) => naturalDayRank.get(left) - naturalDayRank.get(right));

    for (let i = 0; i < cardioPrescription.sessions.length; i++) {
      const session = cardioPrescription.sessions[i];
      const day = selectedDays[i];
      const hasTraining = trainingDays.has(day);
      const sportLoad = sportLoadByDay.get(day);
      const reasonCode = getScheduleReasonCode(hasTraining, sportLoad);

      if (reasonCode === CardioScheduleReasonCode.CARDIO_SCHEDULED_ON_HIGH_SPORT_DAY) {
        schedule_review_required = true;
      }

      sessions.push({
        ...session,
        scheduled_day: day,
        schedule_reason_code: reasonCode,
        instruction: baseInstruction,
      });
    }

    if (schedule_review_required) {
      if (status === CardioScheduleStatus.READY) {
        status = CardioScheduleStatus.PROVISIONAL_REVIEW_REQUIRED;
      }
      reasons.push({
        code: CardioScheduleReasonCode.CARDIO_SCHEDULED_ON_HIGH_SPORT_DAY,
        scope: "CARDIO",
        message:
          "A cardio session overlaps a high-intensity sport day because no other lower-load days were available. Coach review is required.",
      });
    }
  }

  return {
    schedule_version: WEEKLY_CARDIO_SCHEDULE_VERSION,
    prescription_version: cardioPrescription.cardio_prescription_version,
    status,
    schedule_review_required,
    recommended_sessions: cardioPrescription.recommended_sessions,
    sessions,
    steps_prescription: cardioPrescription.steps_prescription,
    constraints: cardioPrescription.constraints,
    reasons,
  };
}

import { DayOfWeek, SportIntensity } from "../intake-decision-engine/index.js";
import {
  WEEKLY_CARDIO_SCHEDULE_VERSION,
  CardioScheduleStatus,
  CardioScheduleReasonCode,
} from "./domain/enums.js";
import {
  buildCardioProgression,
  weekOneDuration,
} from "../cardio-progression/build-cardio-progression.js";

// P1-B8: every scheduled session carries a warm-up and a cool-down. The
// intense (HIIT) protocol already warmed up; the beginner (LISS) one did not.
const WARM_UP_MINUTES = 3;
const COOL_DOWN_MINUTES = 3;
const WARM_UP_GUIDANCE_AR =
  "إحماء 3 دقائق: مشي خفيف ثم زيادة تدريجية للسرعة لحد ما توصل لسرعة الجلسة.";
const COOL_DOWN_GUIDANCE_AR =
  "تهدئة 3 دقائق: مشي هادئ لحد ما النفس يهدأ قبل ما توقف.";

// P1-B8: static hot-climate guidance carried on the schedule itself (the
// schedule has days but no times, so the live country-specific advisory
// stays in the frontend heat function; this is the time-of-day rule).
const HEAT_GUIDANCE = Object.freeze({
  applies_to_countries: Object.freeze(["EG", "SA", "AE", "KW", "QA", "BH", "OM"]),
  outdoor_blocked_window: Object.freeze({ start_hour: 10, end_hour: 17 }),
  time_of_day_guidance_ar:
    "في الحر: الكارديو الخارجي قبل 7 صباحاً أو بعد المغرب بساعة، وممنوع من 10 صباحاً حتى 5 مساءً، واشرب 500 مل ماء قبل الجلسة.",
});

function withWarmUpCoolDown(session) {
  return {
    ...session,
    warm_up_minutes: WARM_UP_MINUTES,
    warm_up_guidance_ar: WARM_UP_GUIDANCE_AR,
    cool_down_minutes: COOL_DOWN_MINUTES,
    cool_down_guidance_ar: COOL_DOWN_GUIDANCE_AR,
  };
}

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

export function buildWeeklyCardioSchedule(cardioPrescription, weeklyTrainingSchedule, options = {}) {
  validateInputs(cardioPrescription, weeklyTrainingSchedule);
  // P1-B8 (Q49): equipment-aware scheduling. Unknown stays machines (the old
  // behavior); only an explicit no-machines client gets the outdoor plan.
  // The canonical equipment model holds resistance gear only, so a HOME
  // client has no cardio machines by the system's own data.
  const machinesAvailable = options.machinesAvailable !== false;

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

  const baseInstruction = machinesAvailable
    ? "This is a recommended day, but you can flexibly perform your cardio after resistance training or on a rest day based on your schedule and energy. Prefer low-impact options like Elliptical or Bike to protect your joints."
    : "This is a recommended day, but you can flexibly perform your cardio after resistance training or on a rest day based on your schedule and energy. No machines are assumed: walk briskly outdoors or in a mall, or use stairs when available, to protect your joints.";

  // P1-B8: the prescription dose is a ceiling; week 1 starts at 80% of it
  // and the forward plan ramps to the ceiling by week 3 with a week-4 deload.
  const baseDuration = cardioPrescription.sessions[0]?.duration_minutes;
  const baseIntensity = cardioPrescription.sessions[0]?.intensity;
  const progression =
    cardioPrescription.sessions.length > 0 && Number.isFinite(baseDuration)
      ? buildCardioProgression({
          baseDurationMinutes: baseDuration,
          intensity: baseIntensity,
          sessionsPerWeek: cardioPrescription.sessions.length,
          totalWeeks: options.totalWeeks,
        })
      : null;

  if (weeklyTrainingSchedule.schedule_mode === "SESSION_SEQUENCE") {
    for (const session of cardioPrescription.sessions) {
      sessions.push(withWarmUpCoolDown({
        ...session,
        duration_minutes: weekOneDuration(session.duration_minutes),
        scheduled_day: null,
        schedule_reason_code: CardioScheduleReasonCode.CARDIO_SESSION_SEQUENCE_REQUIRED,
        instruction: baseInstruction,
      }));
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

      sessions.push(withWarmUpCoolDown({
        ...session,
        duration_minutes: weekOneDuration(session.duration_minutes),
        scheduled_day: day,
        schedule_reason_code: reasonCode,
        instruction: baseInstruction,
      }));
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

  // P1-B8: joint weekly load with iron training, surfaced (never hidden).
  // No new clinical threshold is invented: the bound stays the client's own
  // prescribed dose, enforced by the final preflight; this summary is what
  // the coach reviews, and the HIGH-sport-day rule above is the gate.
  const trainingSessions = Array.isArray(weeklyTrainingSchedule.sessions)
    ? weeklyTrainingSchedule.sessions
    : [];
  const trainingDays = new Set(
    trainingSessions.map((s) => s?.scheduled_day).filter((d) => d !== null && d !== undefined),
  );
  const sessionsOnTrainingDays = sessions.filter((s) => trainingDays.has(s.scheduled_day));
  const weeklyLoad = {
    cardio_sessions: sessions.length,
    cardio_minutes_total: sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0),
    training_sessions: trainingSessions.length,
    training_days: trainingDays.size,
    days_with_both: new Set(sessionsOnTrainingDays.map((s) => s.scheduled_day)).size,
    cardio_minutes_on_training_days: sessionsOnTrainingDays.reduce(
      (sum, s) => sum + (s.duration_minutes || 0),
      0,
    ),
  };

  return {
    schedule_version: WEEKLY_CARDIO_SCHEDULE_VERSION,
    prescription_version: cardioPrescription.cardio_prescription_version,
    status,
    schedule_review_required,
    recommended_sessions: cardioPrescription.recommended_sessions,
    sessions,
    progression,
    weekly_load: weeklyLoad,
    heat_guidance: HEAT_GUIDANCE,
    steps_prescription: cardioPrescription.steps_prescription,
    constraints: cardioPrescription.constraints,
    reasons,
  };
}

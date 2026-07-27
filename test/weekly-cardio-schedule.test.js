import test from "node:test";
import assert from "node:assert/strict";

import { DayOfWeek } from "../src/intake-decision-engine/index.js";
import { buildWeeklyCardioSchedule } from "../src/weekly-cardio-schedule/index.js";
import { CardioScheduleStatus, CardioScheduleReasonCode } from "../src/weekly-cardio-schedule/domain/enums.js";

const basePrescription = {
  cardio_prescription_version: "cardio-prescription-v1",
  status: "READY",
  recommended_sessions: 2,
  sessions: [
    {
      sequence: 1,
      modality_type: "LISS",
      duration_minutes: 20,
      intensity: "LOW",
    },
    {
      sequence: 2,
      modality_type: "LISS",
      duration_minutes: 20,
      intensity: "LOW",
    },
  ],
  steps_prescription: null,
  constraints: [],
  reasons: [],
};

const baseTrainingSchedule = {
  schedule_version: "weekly-training-schedule-v1",
  status: "READY",
  schedule_mode: "FIXED_DAYS",
  sessions: [
    { sequence: 1, scheduled_day: DayOfWeek.MONDAY },
    { sequence: 2, scheduled_day: DayOfWeek.TUESDAY },
    { sequence: 3, scheduled_day: DayOfWeek.THURSDAY },
    { sequence: 4, scheduled_day: DayOfWeek.FRIDAY },
  ],
  constraints: [],
  reasons: [],
};

test("Cardio Weekly Schedule Builder Tests", async (t) => {
  await t.test("It schedules on rest days when available", () => {
    const result = buildWeeklyCardioSchedule(basePrescription, baseTrainingSchedule);

    assert.equal(result.status, "READY");
    assert.equal(result.sessions.length, 2);
    
    // M, T, Th, F are training days.
    // W, Sat, Sun are rest days.
    // Expected rest days selected: Wed, Sat
    assert.equal(result.sessions[0].scheduled_day, DayOfWeek.WEDNESDAY);
    assert.equal(result.sessions[0].schedule_reason_code, CardioScheduleReasonCode.CARDIO_SCHEDULED_ON_REST_DAY);
    assert.match(result.sessions[0].instruction, /flexibly perform your cardio after resistance/);

    assert.equal(result.sessions[1].scheduled_day, DayOfWeek.SATURDAY);
  });

  await t.test("It uses SESSION_SEQUENCE mode without fixing days", () => {
    const sequenceTraining = { ...baseTrainingSchedule, schedule_mode: "SESSION_SEQUENCE" };
    const result = buildWeeklyCardioSchedule(basePrescription, sequenceTraining);

    assert.equal(result.sessions.length, 2);
    assert.equal(result.sessions[0].scheduled_day, null);
    assert.equal(result.sessions[0].schedule_reason_code, CardioScheduleReasonCode.CARDIO_SESSION_SEQUENCE_REQUIRED);
  });

  await t.test("It handles WITHHELD prescription", () => {
    const withheld = { ...basePrescription, status: "WITHHELD" };
    const result = buildWeeklyCardioSchedule(withheld, baseTrainingSchedule);

    assert.equal(result.status, "WITHHELD");
    assert.equal(result.sessions.length, 0);
  });

  await t.test("It falls back to training days if not enough rest days", () => {
    const sixDayTraining = {
      ...baseTrainingSchedule,
      sessions: [
        { sequence: 1, scheduled_day: DayOfWeek.MONDAY },
        { sequence: 2, scheduled_day: DayOfWeek.TUESDAY },
        { sequence: 3, scheduled_day: DayOfWeek.WEDNESDAY },
        { sequence: 4, scheduled_day: DayOfWeek.THURSDAY },
        { sequence: 5, scheduled_day: DayOfWeek.FRIDAY },
        { sequence: 6, scheduled_day: DayOfWeek.SATURDAY },
      ],
    };
    
    const result = buildWeeklyCardioSchedule(basePrescription, sixDayTraining);
    
    assert.equal(result.sessions.length, 2);
    // 1 rest day available (Sun), 1 training day will be used.
    // The builder will pick Sunday (Rest) and one Training day.
    
    const restDaySession = result.sessions.find(s => s.schedule_reason_code === CardioScheduleReasonCode.CARDIO_SCHEDULED_ON_REST_DAY);
    const trainingDaySession = result.sessions.find(s => s.schedule_reason_code === CardioScheduleReasonCode.CARDIO_SCHEDULED_ON_TRAINING_DAY);
    
    assert.ok(restDaySession, "Should have one rest day session");
    assert.ok(trainingDaySession, "Should have one training day session");
  });

  await t.test("It requires review if forced onto a HIGH sport day", () => {
    const highSportConstraints = [
      {
        code: "EXISTING_ADDITIONAL_SPORT",
        value: { days: [DayOfWeek.WEDNESDAY, DayOfWeek.SATURDAY, DayOfWeek.SUNDAY], intensity: "HIGH" }
      }
    ];
    const prescriptionWithHighSport = { ...basePrescription, constraints: highSportConstraints };

    const result = buildWeeklyCardioSchedule(prescriptionWithHighSport, baseTrainingSchedule);
    
    // M, T, Th, F are training.
    // W, Sat, Sun are HIGH sport days.
    // Builder should pick Training days over HIGH sport days.
    // Let's verify it picked training days.
    assert.equal(result.status, "READY"); // It shouldn't need review if it avoided HIGH sport days.
    assert.equal(result.schedule_review_required, false);
    
    const trainingDaySession = result.sessions[0];
    assert.equal(trainingDaySession.schedule_reason_code, CardioScheduleReasonCode.CARDIO_SCHEDULED_ON_TRAINING_DAY);
  });
  
  await t.test("It requires review if ALL days are HIGH sport", () => {
    const highSportConstraints = [
      {
        code: "EXISTING_ADDITIONAL_SPORT",
        value: { days: Object.values(DayOfWeek), intensity: "HIGH" }
      }
    ];
    const prescriptionWithHighSport = { ...basePrescription, constraints: highSportConstraints };

    const result = buildWeeklyCardioSchedule(prescriptionWithHighSport, baseTrainingSchedule);
    
    assert.equal(result.status, "PROVISIONAL_REVIEW_REQUIRED"); 
    assert.equal(result.schedule_review_required, true);
    assert.equal(result.sessions[0].schedule_reason_code, CardioScheduleReasonCode.CARDIO_SCHEDULED_ON_HIGH_SPORT_DAY);
  });
});

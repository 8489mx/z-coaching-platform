import test from "node:test";
import assert from "node:assert/strict";

import { MobilityStrategy } from "../src/intake-decision-engine/index.js";
import { MobilityFormalSessionState } from "../src/mobility-plan-specification/domain/enums.js";
import { MobilityScheduleStatus, MobilityScheduleReasonCode } from "../src/weekly-mobility-schedule/domain/enums.js";
import { buildWeeklyMobilitySchedule } from "../src/weekly-mobility-schedule/index.js";

test("buildWeeklyMobilitySchedule assigns mobility to all days for INTEGRATED_AND_SEPARATE strategy", () => {
  const mobilityPrescription = {
    status: "READY",
    prescribed_modalities: [
      { modality_type: "DYNAMIC_STRETCHING", duration_minutes: 3, instructions: [] },
      { modality_type: "STATIC_STRETCHING", duration_minutes: 2, instructions: [] }
    ],
    constraints: [],
    reasons: []
  };

  const mobilityPlanSpec = {
    formal_session_state: MobilityFormalSessionState.PRESCRIPTION_REQUIRED,
    strategy: MobilityStrategy.INTEGRATED_AND_SEPARATE,
    plan_status: "READY"
  };

  const weeklyTrainingSchedule = {
    scheduled_days: [
      { day_of_week: "MONDAY", sequence: null, has_primary_training: true },
      { day_of_week: "TUESDAY", sequence: null, has_primary_training: false },
      { day_of_week: "WEDNESDAY", sequence: null, has_primary_training: true }
    ]
  };

  const schedule = buildWeeklyMobilitySchedule(mobilityPrescription, mobilityPlanSpec, weeklyTrainingSchedule);

  assert.equal(schedule.status, MobilityScheduleStatus.READY);
  assert.equal(schedule.scheduled_days.length, 3);
  
  const monday = schedule.scheduled_days.find(d => d.day_of_week === "MONDAY");
  assert.ok(monday.schedule_instructions[0].includes("كإحماء")); // Training day text

  const tuesday = schedule.scheduled_days.find(d => d.day_of_week === "TUESDAY");
  assert.ok(tuesday.schedule_instructions[0].includes("الصباح الباكر")); // Rest day text
  
  assert.ok(schedule.reasons.some(r => r.code === MobilityScheduleReasonCode.SCHEDULE_BUILT_INTEGRATED_AND_SEPARATE));
});



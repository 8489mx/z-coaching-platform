import { MobilityStrategy } from "../intake-decision-engine/index.js";
import { MobilityFormalSessionState } from "../mobility-plan-specification/domain/enums.js";
import { MobilityPrescriptionStatus } from "../mobility-prescription/domain/enums.js";
import {
  WEEKLY_MOBILITY_SCHEDULE_VERSION,
  MobilityScheduleStatus,
  MobilityScheduleReasonCode,
} from "./domain/enums.js";

/**
 * Builds the weekly mobility schedule by distributing the prescribed modalities across the week.
 *
 * @param {import("../mobility-prescription/domain/contracts.js").MobilityPrescription} mobilityPrescription
 * @param {import("../mobility-plan-specification/domain/contracts.js").MobilityPlanSpecification} mobilityPlanSpec
 * @param {import("../weekly-training-schedule/domain/contracts.js").WeeklyTrainingSchedule} weeklyTrainingSchedule
 * @returns {import("./domain/contracts.js").WeeklyMobilitySchedule}
 */
export function buildWeeklyMobilitySchedule(mobilityPrescription, mobilityPlanSpec, weeklyTrainingSchedule) {
  const reasons = [...mobilityPrescription.reasons];
  const scheduled_days = [];
  let status = mobilityPrescription.status;

  if (status === MobilityPrescriptionStatus.WITHHELD || mobilityPlanSpec.formal_session_state === MobilityFormalSessionState.WITHHELD) {
    reasons.push({
      code: MobilityScheduleReasonCode.SCHEDULE_WITHHELD_DUE_TO_UPSTREAM_STATUS,
      scope: "MOBILITY",
      message: "Schedule cannot be built because the upstream prescription is withheld.",
    });

    return {
      schedule_version: WEEKLY_MOBILITY_SCHEDULE_VERSION,
      prescription_version: mobilityPrescription.mobility_prescription_version,
      status: MobilityScheduleStatus.WITHHELD,
      scheduled_days: [],
      constraints: mobilityPrescription.constraints,
      reasons,
    };
  }

  if (mobilityPlanSpec.formal_session_state === MobilityFormalSessionState.NOT_INDICATED) {
    reasons.push({
      code: MobilityScheduleReasonCode.SCHEDULE_CLEARED_BY_NO_MOBILITY_STRATEGY,
      scope: "MOBILITY",
      message: "No mobility schedule is built because mobility is not indicated.",
    });

    return {
      schedule_version: WEEKLY_MOBILITY_SCHEDULE_VERSION,
      prescription_version: mobilityPrescription.mobility_prescription_version,
      status: mobilityPlanSpec.plan_status,
      scheduled_days: [],
      constraints: mobilityPrescription.constraints,
      reasons,
    };
  }

  if (mobilityPrescription.prescribed_modalities.length === 0 && status !== MobilityScheduleStatus.WITHHELD) {
    reasons.push({
      code: MobilityScheduleReasonCode.NO_MOBILITY_TO_SCHEDULE,
      scope: "MOBILITY",
      message: "No mobility modalities to schedule.",
    });

    return {
      schedule_version: WEEKLY_MOBILITY_SCHEDULE_VERSION,
      prescription_version: mobilityPrescription.mobility_prescription_version,
      status,
      scheduled_days: [],
      constraints: mobilityPrescription.constraints,
      reasons,
    };
  }

  const strategy = mobilityPlanSpec.strategy;
  
  const INSTRUCTION_TRAINING_DAY = "يُفضل أداء الجلسة كإحماء قبل التمرين، أو للتهدئة بعده.";
  const INSTRUCTION_REST_DAY = "يُفضل أداؤها في الصباح الباكر لبدء اليوم بنشاط، أو في أي وقت مناسب لك خلال يوم الراحة.";

  const trainingDays = new Set();
  const sequenceSessions = [];

  if (weeklyTrainingSchedule && weeklyTrainingSchedule.sessions) {
    for (const session of weeklyTrainingSchedule.sessions) {
      if (session.scheduled_day) {
        trainingDays.add(session.scheduled_day);
      } else if (session.sequence !== null) {
        sequenceSessions.push(session.sequence);
      }
    }
  }

  const DAYS_OF_WEEK = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
  const isSessionSequence = weeklyTrainingSchedule?.schedule_mode === "SESSION_SEQUENCE";

  if (isSessionSequence) {
    // If it's a sequence, we might just provide sequence sessions for training days, and no fixed rest days.
    // Or we provide 7 sequence days. For simplicity, we just provide the training sequence days.
    for (const seq of sequenceSessions) {
      let instructions = [];
      if (strategy === MobilityStrategy.INTEGRATED_AND_SEPARATE) {
        instructions.push(INSTRUCTION_TRAINING_DAY);
      }

      if (instructions.length > 0) {
        scheduled_days.push({
          day_of_week: null,
          sequence: seq,
          modalities: [...mobilityPrescription.prescribed_modalities],
          schedule_instructions: instructions
        });
      }
    }
  } else {
    for (const day of DAYS_OF_WEEK) {
      const hasTraining = trainingDays.has(day);
      
      let shouldSchedule = false;
      let instructions = [];

      if (strategy === MobilityStrategy.INTEGRATED_AND_SEPARATE) {
        shouldSchedule = true;
        instructions.push(hasTraining ? INSTRUCTION_TRAINING_DAY : INSTRUCTION_REST_DAY);
      }

      if (shouldSchedule) {
        scheduled_days.push({
          day_of_week: day,
          sequence: null,
          modalities: [...mobilityPrescription.prescribed_modalities],
          schedule_instructions: instructions
        });
      }
    }
  }

  if (strategy === MobilityStrategy.INTEGRATED_AND_SEPARATE) {
    reasons.push({
      code: MobilityScheduleReasonCode.SCHEDULE_BUILT_INTEGRATED_AND_SEPARATE,
      scope: "MOBILITY",
      message: "Mobility scheduled on all days.",
    });
  }

  return {
    schedule_version: WEEKLY_MOBILITY_SCHEDULE_VERSION,
    prescription_version: mobilityPrescription.mobility_prescription_version,
    status,
    scheduled_days,
    constraints: mobilityPrescription.constraints,
    reasons,
  };
}

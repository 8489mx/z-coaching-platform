import { MobilityScheduleStatus } from "../weekly-mobility-schedule/domain/enums.js";
import { MOBILITY_PLAN_PREFLIGHT_VERSION, MobilityApprovalState } from "./domain/enums.js";

/**
 * @typedef {Object} MobilityPreflightReport
 * @property {string} preflight_version
 * @property {string} schedule_version
 * @property {string} approval_state
 * @property {import("../intake-decision-engine/domain/contracts.js").DecisionReason[]} reasons
 */

/**
 * Evaluates the weekly mobility schedule and returns a preflight report.
 *
 * @param {import("../weekly-mobility-schedule/domain/contracts.js").WeeklyMobilitySchedule} weeklyMobilitySchedule
 * @returns {MobilityPreflightReport}
 */
export function evaluateMobilityPlanPreflight(weeklyMobilitySchedule) {
  let approval_state = MobilityApprovalState.APPROVED;

  if (weeklyMobilitySchedule.status === MobilityScheduleStatus.WITHHELD) {
    approval_state = MobilityApprovalState.WITHHELD;
  } else if (weeklyMobilitySchedule.status === MobilityScheduleStatus.PROVISIONAL_REVIEW_REQUIRED) {
    approval_state = MobilityApprovalState.PROVISIONAL_REVIEW_REQUIRED;
  }

  return {
    preflight_version: MOBILITY_PLAN_PREFLIGHT_VERSION,
    schedule_version: weeklyMobilitySchedule.schedule_version,
    approval_state,
    reasons: [...weeklyMobilitySchedule.reasons],
  };
}

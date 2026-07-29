import { MobilityStrategy, PlanStatus, Scope } from "../intake-decision-engine/index.js";
import { MobilityFormalSessionState, MobilityPlanStatus } from "./domain/enums.js";

const STATUS_BY_INTAKE_STATUS = Object.freeze({
  [PlanStatus.READY_FOR_DRAFT]: MobilityPlanStatus.READY,
  [PlanStatus.COACH_REVIEW_REQUIRED]: MobilityPlanStatus.PROVISIONAL_REVIEW_REQUIRED,
  [PlanStatus.MEDICAL_REVIEW_REQUIRED]: MobilityPlanStatus.WITHHELD,
  [PlanStatus.BLOCKED]: MobilityPlanStatus.WITHHELD,
});

const FORMAL_STATE_BY_STRATEGY = Object.freeze({
  [MobilityStrategy.INTEGRATED_AND_SEPARATE]: MobilityFormalSessionState.PRESCRIPTION_REQUIRED,
  [MobilityStrategy.REVIEW_REQUIRED]: MobilityFormalSessionState.REVIEW_REQUIRED,
  [MobilityStrategy.NONE]: MobilityFormalSessionState.NOT_INDICATED,
});

export const MOBILITY_PLAN_SPEC_VERSION = "mobility-plan-spec-v1";

/**
 * @param {import("../../intake-decision-engine/domain/contracts.js").IntakeDecision} intakeDecision
 * @returns {import("./domain/contracts.js").MobilityPlanSpecification}
 */
export function buildMobilityPlanSpecification(intakeDecision) {
  if (!intakeDecision || typeof intakeDecision !== "object") {
    throw new TypeError("IntakeDecision must be a valid object.");
  }

  const { plan_status, mobility_decision } = intakeDecision;

  if (!mobility_decision || !mobility_decision.strategy) {
    throw new TypeError("mobility_decision is missing or invalid in IntakeDecision.");
  }

  const status = STATUS_BY_INTAKE_STATUS[plan_status] ?? MobilityPlanStatus.WITHHELD;
  const formalState = FORMAL_STATE_BY_STRATEGY[mobility_decision.strategy] ?? MobilityFormalSessionState.WITHHELD;

  const constraints = (mobility_decision.constraints || []).filter(
    (c) => c.scope === Scope.MOBILITY || c.scope === Scope.GLOBAL
  );

  const limitations = constraints.filter(
    (c) => c.code === "MOBILITY_INJURY_RESTRICTION" || c.code === "MOBILITY_MEDICAL_RESTRICTION"
  );

  return JSON.parse(
    JSON.stringify({
      _version: MOBILITY_PLAN_SPEC_VERSION,
      plan_status: status,
      strategy: mobility_decision.strategy,
      max_duration_minutes: mobility_decision.max_duration_minutes,
      formal_session_state: formalState,
      constraints,
      reasons: mobility_decision.reasons || [],
      limitations,
    })
  );
}

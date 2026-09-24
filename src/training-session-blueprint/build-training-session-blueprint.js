import {
  TrainingPlanStatus,
  TrainingSessionCode,
} from "../training-plan-specification/index.js";
import {
  MovementSlotCode,
  TRAINING_SESSION_BLUEPRINT_VERSION,
} from "./domain/enums.js";

const LOWER_A_SLOTS = Object.freeze([
  MovementSlotCode.KNEE_DOMINANT,
  MovementSlotCode.HIP_HINGE,
  MovementSlotCode.UNILATERAL_LOWER,
  MovementSlotCode.KNEE_FLEXION,
  MovementSlotCode.CALF_RAISE,
  MovementSlotCode.CORE_STABILITY,
]);

const LOWER_B_SLOTS = Object.freeze([
  MovementSlotCode.HIP_HINGE,
  MovementSlotCode.KNEE_DOMINANT,
  MovementSlotCode.KNEE_FLEXION,
  MovementSlotCode.UNILATERAL_LOWER,
  MovementSlotCode.CALF_RAISE,
  MovementSlotCode.CORE_STABILITY,
]);

const SESSION_MOVEMENT_SLOTS = Object.freeze({
  [TrainingSessionCode.FULL_BODY_A]: Object.freeze([
    MovementSlotCode.KNEE_DOMINANT,
    MovementSlotCode.HIP_HINGE,
    MovementSlotCode.HORIZONTAL_PUSH,
    MovementSlotCode.HORIZONTAL_PULL,
    MovementSlotCode.CORE_STABILITY,
  ]),
  [TrainingSessionCode.FULL_BODY_B]: Object.freeze([
    MovementSlotCode.HIP_HINGE,
    MovementSlotCode.KNEE_DOMINANT,
    MovementSlotCode.VERTICAL_PUSH,
    MovementSlotCode.VERTICAL_PULL,
    MovementSlotCode.CORE_STABILITY,
  ]),
  [TrainingSessionCode.FULL_BODY_C]: Object.freeze([
    MovementSlotCode.UNILATERAL_LOWER,
    MovementSlotCode.KNEE_FLEXION,
    MovementSlotCode.HORIZONTAL_PUSH,
    MovementSlotCode.HORIZONTAL_PULL,
    MovementSlotCode.CORE_STABILITY,
  ]),
  // The shoulders had the overhead press and nothing else on an upper/lower week - 6 weekly sets
  // against a minimum of 8 - and the press works the front delt while the side delt is what makes
  // a shoulder look like a shoulder. A lateral raise on each upper day brings them to about 12
  // (>= 10 weekly sets per muscle: Schoenfeld et al. 2017), the same reasoning as the second chest
  // movement below.
  [TrainingSessionCode.UPPER_A]: Object.freeze([
    MovementSlotCode.HORIZONTAL_PUSH,
    MovementSlotCode.HORIZONTAL_PULL,
    MovementSlotCode.VERTICAL_PUSH,
    MovementSlotCode.VERTICAL_PULL,
    MovementSlotCode.SHOULDER_ABDUCTION,
    MovementSlotCode.ELBOW_FLEXION,
    MovementSlotCode.ELBOW_EXTENSION,
  ]),
  // Chest had one movement per upper or push day against two for the back (6 weekly sets vs 12-16).
  // A second chest movement on UPPER_B and on both push days brings it to about 9-12 weekly sets
  // (>= 10 weekly sets per muscle: Schoenfeld et al. 2017 dose-response meta-analysis); the repeated
  // slot becomes a different exercise in the mesocycle (DUPLICATE_ALTERNATIVES).
  [TrainingSessionCode.UPPER_B]: Object.freeze([
    MovementSlotCode.VERTICAL_PUSH,
    MovementSlotCode.VERTICAL_PULL,
    MovementSlotCode.HORIZONTAL_PUSH,
    MovementSlotCode.HORIZONTAL_PULL,
    MovementSlotCode.HORIZONTAL_PUSH,
    MovementSlotCode.SHOULDER_ABDUCTION,
    MovementSlotCode.ELBOW_EXTENSION,
    MovementSlotCode.ELBOW_FLEXION,
  ]),
  [TrainingSessionCode.LOWER_A]: LOWER_A_SLOTS,
  [TrainingSessionCode.LOWER_B]: LOWER_B_SLOTS,
  [TrainingSessionCode.PUSH_A]: Object.freeze([
    MovementSlotCode.HORIZONTAL_PUSH,
    MovementSlotCode.VERTICAL_PUSH,
    MovementSlotCode.HORIZONTAL_PUSH,
    MovementSlotCode.SHOULDER_ABDUCTION,
    MovementSlotCode.ELBOW_EXTENSION,
  ]),
  // The second push day trades its second overhead press for the second chest movement: the front
  // delts already work in every press, the side delts keep their lateral raise.
  [TrainingSessionCode.PUSH_B]: Object.freeze([
    MovementSlotCode.HORIZONTAL_PUSH,
    MovementSlotCode.HORIZONTAL_PUSH,
    MovementSlotCode.SHOULDER_ABDUCTION,
    MovementSlotCode.ELBOW_EXTENSION,
  ]),
  [TrainingSessionCode.PULL_A]: Object.freeze([
    MovementSlotCode.VERTICAL_PULL,
    MovementSlotCode.HORIZONTAL_PULL,
    MovementSlotCode.REAR_DELT,
    MovementSlotCode.ELBOW_FLEXION,
  ]),
  [TrainingSessionCode.PULL_B]: Object.freeze([
    MovementSlotCode.HORIZONTAL_PULL,
    MovementSlotCode.VERTICAL_PULL,
    MovementSlotCode.REAR_DELT,
    MovementSlotCode.ELBOW_FLEXION,
  ]),
  [TrainingSessionCode.LEGS_A]: LOWER_A_SLOTS,
  [TrainingSessionCode.LEGS_B]: LOWER_B_SLOTS,
});

function buildMovementSlots(sessionCode) {
  const slotCodes = SESSION_MOVEMENT_SLOTS[sessionCode];
  if (slotCodes === undefined) {
    throw new TypeError(`Unsupported training session_code: ${sessionCode}.`);
  }

  return slotCodes.map((slotCode, index) => ({
    order: index + 1,
    slot_code: slotCode,
  }));
}

/**
 * Enriches a Training Plan Specification with deterministic movement slots.
 * It preserves the upstream plan and never selects exercises or interprets
 * constraints.
 *
 * @param {import("./domain/contracts.js").TrainingPlanSpecification} trainingPlanSpec
 * @returns {import("./domain/contracts.js").TrainingSessionBlueprint}
 */
export function buildTrainingSessionBlueprint(trainingPlanSpec) {
  const sessionsWithheld =
    trainingPlanSpec.status === TrainingPlanStatus.WITHHELD ||
    (trainingPlanSpec.status === TrainingPlanStatus.PROVISIONAL_REVIEW_REQUIRED &&
      trainingPlanSpec.recommended_days === 0);
  const sessions = sessionsWithheld
    ? []
    : trainingPlanSpec.sessions.map((session) => ({
        sequence: session.sequence,
        session_code: session.session_code,
        focus: session.focus,
        movement_slots: buildMovementSlots(session.session_code),
      }));

  return {
    blueprint_version: TRAINING_SESSION_BLUEPRINT_VERSION,
    status: trainingPlanSpec.status,
    recommended_days: trainingPlanSpec.recommended_days,
    split_code: trainingPlanSpec.split_code,
    schedule_mode: trainingPlanSpec.schedule_mode,
    intro_week_required: trainingPlanSpec.intro_week_required,
    volume_start: trainingPlanSpec.volume_start,
    sessions,
    constraints: trainingPlanSpec.constraints,
    reasons: trainingPlanSpec.reasons,
  };
}

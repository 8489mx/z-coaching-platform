import {
  EquipmentCode,
  EquipmentLoadCapacity,
  Movement,
  RestrictionInstruction,
  TrainingLocation,
} from "../intake-decision-engine/index.js";
import { TrainingPlanStatus } from "../training-plan-specification/index.js";
import { MovementSlotCode } from "../training-session-blueprint/index.js";
import { listExercisesForSlot } from "../exercise-catalog/index.js";
import {
  EXERCISE_SELECTION_VERSION,
  ExerciseSlotSelectionStatus,
} from "./domain/enums.js";

const SelectionReasonCode = Object.freeze({
  SELECTED_EXPLICIT_EQUIPMENT: "SELECTED_EXPLICIT_EQUIPMENT",
  SELECTED_STANDARD_GYM_EQUIPMENT: "SELECTED_STANDARD_GYM_EQUIPMENT",
  SELECTED_BODYWEIGHT_FALLBACK: "SELECTED_BODYWEIGHT_FALLBACK",
  MOVEMENT_CONSTRAINT_REQUIRES_REVIEW: "MOVEMENT_CONSTRAINT_REQUIRES_REVIEW",
  NO_ELIGIBLE_EXERCISE: "NO_ELIGIBLE_EXERCISE",
});

const MOVEMENT_CONSTRAINT_CODES = Object.freeze({
  INJURY_AFFECTED_MOVEMENT: "INJURY_AFFECTED_MOVEMENT",
  INJURY_MEDICAL_RESTRICTION: "INJURY_MEDICAL_RESTRICTION",
  MEDICAL_MOVEMENT_RESTRICTION: "MEDICAL_MOVEMENT_RESTRICTION",
});

const MEDICAL_MOVEMENT_CONSTRAINT_CODES = new Set([
  MOVEMENT_CONSTRAINT_CODES.INJURY_MEDICAL_RESTRICTION,
  MOVEMENT_CONSTRAINT_CODES.MEDICAL_MOVEMENT_RESTRICTION,
]);

const ALL_MOVEMENT_SLOTS = Object.freeze(Object.values(MovementSlotCode));
const NO_STRENGTH_SLOTS = Object.freeze([]);
const MOVEMENT_TO_SLOTS = Object.freeze({
  [Movement.ALL_ACTIVITY]: ALL_MOVEMENT_SLOTS,
  [Movement.ALL_TRAINING]: ALL_MOVEMENT_SLOTS,
  [Movement.SQUAT]: Object.freeze([
    MovementSlotCode.KNEE_DOMINANT,
    MovementSlotCode.UNILATERAL_LOWER,
  ]),
  [Movement.HINGE]: Object.freeze([MovementSlotCode.HIP_HINGE]),
  [Movement.PUSH]: Object.freeze([
    MovementSlotCode.HORIZONTAL_PUSH,
    MovementSlotCode.VERTICAL_PUSH,
  ]),
  [Movement.PULL]: Object.freeze([
    MovementSlotCode.HORIZONTAL_PULL,
    MovementSlotCode.VERTICAL_PULL,
  ]),
  [Movement.OVERHEAD]: Object.freeze([MovementSlotCode.VERTICAL_PUSH]),
  [Movement.WALKING]: NO_STRENGTH_SLOTS,
  [Movement.RUNNING]: NO_STRENGTH_SLOTS,
  [Movement.CYCLING]: NO_STRENGTH_SLOTS,
  [Movement.SWIMMING]: NO_STRENGTH_SLOTS,
  [Movement.ROWING]: NO_STRENGTH_SLOTS,
  [Movement.STAIRS]: NO_STRENGTH_SLOTS,
  [Movement.JUMPING]: NO_STRENGTH_SLOTS,
  [Movement.ALL_CARDIO]: NO_STRENGTH_SLOTS,
});

const LOAD_CAPACITY_RANK = Object.freeze({
  [EquipmentLoadCapacity.LIGHT]: 1,
  [EquipmentLoadCapacity.MODERATE]: 2,
  [EquipmentLoadCapacity.HEAVY]: 3,
});

const EquipmentAvailabilitySource = Object.freeze({
  EXPLICIT: "EXPLICIT",
  STANDARD_GYM: "STANDARD_GYM",
  BODYWEIGHT: "BODYWEIGHT",
});

const STANDARD_GYM_EQUIPMENT_PROFILE = Object.freeze([
  Object.freeze({
    equipmentCode: EquipmentCode.DUMBBELLS,
    loadCapacity: EquipmentLoadCapacity.LIGHT,
  }),
  Object.freeze({
    equipmentCode: EquipmentCode.CABLE_STATION,
    loadCapacity: EquipmentLoadCapacity.LIGHT,
  }),
  Object.freeze({
    equipmentCode: EquipmentCode.SELECTORIZED_MACHINES,
    loadCapacity: EquipmentLoadCapacity.LIGHT,
  }),
]);

function extractTrainingLocation(constraints) {
  const locationConstraints = constraints.filter(
    ({ code }) => code === "TRAINING_LOCATION",
  );
  if (locationConstraints.length !== 1) {
    throw new TypeError(
      "Exercise selection requires exactly one TRAINING_LOCATION constraint when sessions exist.",
    );
  }

  const location = locationConstraints[0].value?.location;
  if (!Object.values(TrainingLocation).includes(location)) {
    throw new TypeError(
      "The TRAINING_LOCATION constraint must contain a known training location.",
    );
  }

  return location;
}

function mergeLoadCapacity(availableEquipment, equipmentCode, loadCapacity) {
  const incomingRank = LOAD_CAPACITY_RANK[loadCapacity];
  if (incomingRank === undefined) {
    return false;
  }

  const currentCapacity = availableEquipment.get(equipmentCode);
  const currentRank = LOAD_CAPACITY_RANK[currentCapacity] ?? 0;
  if (incomingRank > currentRank) {
    availableEquipment.set(equipmentCode, loadCapacity);
  }
  return true;
}

function extractAvailableEquipment(constraints, location) {
  const availableEquipment = new Map([
    [EquipmentCode.BODYWEIGHT, EquipmentLoadCapacity.BODYWEIGHT_ONLY],
  ]);
  const equipmentSources = new Map([
    [EquipmentCode.BODYWEIGHT, EquipmentAvailabilitySource.BODYWEIGHT],
  ]);

  if (location === TrainingLocation.GYM) {
    STANDARD_GYM_EQUIPMENT_PROFILE.forEach(({ equipmentCode, loadCapacity }) => {
      availableEquipment.set(equipmentCode, loadCapacity);
      equipmentSources.set(equipmentCode, EquipmentAvailabilitySource.STANDARD_GYM);
    });
  }

  constraints
    .filter(({ code }) => code === "AVAILABLE_TRAINING_EQUIPMENT")
    .forEach(({ value }) => {
      const { equipmentCode, loadCapacity } = value;
      if (equipmentCode === EquipmentCode.BODYWEIGHT) {
        return;
      }
      if (!mergeLoadCapacity(availableEquipment, equipmentCode, loadCapacity)) {
        return;
      }
      equipmentSources.set(equipmentCode, EquipmentAvailabilitySource.EXPLICIT);
    });

  return { availableEquipment, equipmentSources };
}

function equipmentRequirementIsMet(requirement, availableEquipment) {
  const availableCapacity = availableEquipment.get(requirement.equipment_code);
  if (requirement.equipment_code === EquipmentCode.BODYWEIGHT) {
    return (
      availableCapacity === EquipmentLoadCapacity.BODYWEIGHT_ONLY &&
      requirement.minimum_load_capacity === EquipmentLoadCapacity.BODYWEIGHT_ONLY
    );
  }

  if (
    availableCapacity === undefined ||
    availableCapacity === EquipmentLoadCapacity.NOT_APPLICABLE
  ) {
    return false;
  }

  const availableRank = LOAD_CAPACITY_RANK[availableCapacity];
  const requiredRank = LOAD_CAPACITY_RANK[requirement.minimum_load_capacity];
  return availableRank !== undefined && requiredRank !== undefined && availableRank >= requiredRank;
}

function equipmentSourceForExercise(exercise, equipmentSources) {
  const sources = exercise.equipment_requirements.map(
    ({ equipment_code: equipmentCode }) => equipmentSources.get(equipmentCode),
  );
  if (sources.includes(EquipmentAvailabilitySource.EXPLICIT)) {
    return EquipmentAvailabilitySource.EXPLICIT;
  }
  if (sources.includes(EquipmentAvailabilitySource.STANDARD_GYM)) {
    return EquipmentAvailabilitySource.STANDARD_GYM;
  }
  return EquipmentAvailabilitySource.BODYWEIGHT;
}

function selectPreferredCandidate(candidates, introWeekRequired, equipmentSources) {
  let preferredCandidates = candidates;
  if (introWeekRequired) {
    const beginnerFriendlyCandidates = candidates.filter(
      ({ beginner_friendly: beginnerFriendly }) => beginnerFriendly,
    );
    if (beginnerFriendlyCandidates.length > 0) {
      preferredCandidates = beginnerFriendlyCandidates;
    }
  }

  return (
    preferredCandidates.find(
      (exercise) =>
        equipmentSourceForExercise(exercise, equipmentSources) ===
        EquipmentAvailabilitySource.EXPLICIT,
    ) ??
    preferredCandidates.find(
      (exercise) =>
        equipmentSourceForExercise(exercise, equipmentSources) ===
        EquipmentAvailabilitySource.STANDARD_GYM,
    ) ??
    preferredCandidates[0]
  );
}

function buildMovementConstraintSources(hardConstraints) {
  const sourcesBySlot = new Map();

  for (const constraint of hardConstraints) {
    if (!Object.values(MOVEMENT_CONSTRAINT_CODES).includes(constraint.code)) {
      continue;
    }
    if (
      MEDICAL_MOVEMENT_CONSTRAINT_CODES.has(constraint.code) &&
      constraint.value?.instruction !== RestrictionInstruction.AVOID
    ) {
      continue;
    }

    const affectedSlots = MOVEMENT_TO_SLOTS[constraint.value?.movement] ?? NO_STRENGTH_SLOTS;
    for (const slotCode of affectedSlots) {
      const sourceCodes = sourcesBySlot.get(slotCode) ?? new Set();
      sourceCodes.add(constraint.code);
      sourcesBySlot.set(slotCode, sourceCodes);
    }
  }

  return sourcesBySlot;
}

function reviewRequiredSelection(slot, reasonCode, sourceConstraintCodes = []) {
  return {
    order: slot.order,
    slot_code: slot.slot_code,
    selection_status: ExerciseSlotSelectionStatus.REVIEW_REQUIRED,
    exercise_code: null,
    name_en: null,
    reason_code: reasonCode,
    source_constraint_codes: sourceConstraintCodes,
  };
}

function selectExerciseForSlot({
  slot,
  location,
  availableEquipment,
  equipmentSources,
  introWeekRequired,
  movementConstraintSources,
}) {
  const sourceCodes = movementConstraintSources.get(slot.slot_code);
  if (sourceCodes !== undefined) {
    return reviewRequiredSelection(
      slot,
      SelectionReasonCode.MOVEMENT_CONSTRAINT_REQUIRES_REVIEW,
      [...sourceCodes],
    );
  }

  const eligibleCandidates = listExercisesForSlot(slot.slot_code).filter(
    (exercise) =>
      exercise.allowed_locations.includes(location) &&
      exercise.equipment_requirements.every((requirement) =>
        equipmentRequirementIsMet(requirement, availableEquipment),
      ),
  );
  if (eligibleCandidates.length === 0) {
    return reviewRequiredSelection(slot, SelectionReasonCode.NO_ELIGIBLE_EXERCISE);
  }

  const selectedExercise = selectPreferredCandidate(
    eligibleCandidates,
    introWeekRequired,
    equipmentSources,
  );
  const equipmentSource = equipmentSourceForExercise(selectedExercise, equipmentSources);
  return {
    order: slot.order,
    slot_code: slot.slot_code,
    selection_status: ExerciseSlotSelectionStatus.SELECTED,
    exercise_code: selectedExercise.exercise_code,
    name_en: selectedExercise.name_en,
    reason_code:
      equipmentSource === EquipmentAvailabilitySource.EXPLICIT
        ? SelectionReasonCode.SELECTED_EXPLICIT_EQUIPMENT
        : equipmentSource === EquipmentAvailabilitySource.STANDARD_GYM
          ? SelectionReasonCode.SELECTED_STANDARD_GYM_EQUIPMENT
          : SelectionReasonCode.SELECTED_BODYWEIGHT_FALLBACK,
    source_constraint_codes: [],
  };
}

function buildOutput(trainingSessionBlueprint, status, sessions) {
  return {
    selection_version: EXERCISE_SELECTION_VERSION,
    status,
    recommended_days: trainingSessionBlueprint.recommended_days,
    split_code: trainingSessionBlueprint.split_code,
    schedule_mode: trainingSessionBlueprint.schedule_mode,
    intro_week_required: trainingSessionBlueprint.intro_week_required,
    volume_start: trainingSessionBlueprint.volume_start,
    sessions,
    constraints: trainingSessionBlueprint.constraints,
    reasons: trainingSessionBlueprint.reasons,
  };
}

/**
 * Selects one catalog exercise for each blueprint movement slot without
 * re-evaluating Intake rules or changing the upstream blueprint.
 *
 * @param {import("./domain/contracts.js").BuildExerciseSelectionInput} input
 * @returns {import("./domain/contracts.js").ExerciseSelection}
 */
export function buildExerciseSelection({ trainingSessionBlueprint, hardConstraints }) {
  if (trainingSessionBlueprint.status === TrainingPlanStatus.WITHHELD) {
    return buildOutput(trainingSessionBlueprint, TrainingPlanStatus.WITHHELD, []);
  }
  if (trainingSessionBlueprint.sessions.length === 0) {
    return buildOutput(trainingSessionBlueprint, trainingSessionBlueprint.status, []);
  }

  const location = extractTrainingLocation(trainingSessionBlueprint.constraints);
  const { availableEquipment, equipmentSources } = extractAvailableEquipment(
    trainingSessionBlueprint.constraints,
    location,
  );
  const movementConstraintSources = buildMovementConstraintSources(hardConstraints);
  let hasReviewRequiredSlot = false;
  const sessions = trainingSessionBlueprint.sessions.map((session) => ({
    sequence: session.sequence,
    session_code: session.session_code,
    focus: session.focus,
    exercises: session.movement_slots.map((slot) => {
      const selection = selectExerciseForSlot({
        slot,
        location,
        availableEquipment,
        equipmentSources,
        introWeekRequired: trainingSessionBlueprint.intro_week_required,
        movementConstraintSources,
      });
      if (selection.selection_status === ExerciseSlotSelectionStatus.REVIEW_REQUIRED) {
        hasReviewRequiredSlot = true;
      }
      return selection;
    }),
  }));
  const status =
    trainingSessionBlueprint.status === TrainingPlanStatus.READY && hasReviewRequiredSlot
      ? TrainingPlanStatus.PROVISIONAL_REVIEW_REQUIRED
      : trainingSessionBlueprint.status;

  return buildOutput(trainingSessionBlueprint, status, sessions);
}

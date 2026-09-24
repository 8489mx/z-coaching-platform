import { VolumeStart } from "../intake-decision-engine/index.js";
import { TrainingPlanStatus } from "../training-plan-specification/index.js";
import { MovementSlotCode } from "../training-session-blueprint/index.js";
import {
  ExercisePrescriptionUnit,
  getExerciseByCode,
} from "../exercise-catalog/index.js";
import { ExerciseSlotSelectionStatus } from "../exercise-selection/index.js";

export const TRAINING_PRESCRIPTION_VERSION = "training-prescription-v1";

const MovementSlotCategory = Object.freeze({
  PRIMARY: "PRIMARY",
  ACCESSORY: "ACCESSORY",
  CORE: "CORE",
});

const MOVEMENT_SLOT_CATEGORY = Object.freeze({
  [MovementSlotCode.KNEE_DOMINANT]: MovementSlotCategory.PRIMARY,
  [MovementSlotCode.HIP_HINGE]: MovementSlotCategory.PRIMARY,
  [MovementSlotCode.UNILATERAL_LOWER]: MovementSlotCategory.PRIMARY,
  [MovementSlotCode.HORIZONTAL_PUSH]: MovementSlotCategory.PRIMARY,
  [MovementSlotCode.HORIZONTAL_PULL]: MovementSlotCategory.PRIMARY,
  [MovementSlotCode.VERTICAL_PUSH]: MovementSlotCategory.PRIMARY,
  [MovementSlotCode.VERTICAL_PULL]: MovementSlotCategory.PRIMARY,
  [MovementSlotCode.HIP_EXTENSION]: MovementSlotCategory.ACCESSORY,
  [MovementSlotCode.KNEE_FLEXION]: MovementSlotCategory.ACCESSORY,
  [MovementSlotCode.CALF_RAISE]: MovementSlotCategory.ACCESSORY,
  [MovementSlotCode.SHOULDER_ABDUCTION]: MovementSlotCategory.ACCESSORY,
  [MovementSlotCode.REAR_DELT]: MovementSlotCategory.ACCESSORY,
  [MovementSlotCode.ELBOW_FLEXION]: MovementSlotCategory.ACCESSORY,
  [MovementSlotCode.ELBOW_EXTENSION]: MovementSlotCategory.ACCESSORY,
  [MovementSlotCode.CORE_STABILITY]: MovementSlotCategory.CORE,
});

const knownMovementSlots = Object.values(MovementSlotCode);
if (
  Object.keys(MOVEMENT_SLOT_CATEGORY).length !== knownMovementSlots.length ||
  knownMovementSlots.some((slotCode) => MOVEMENT_SLOT_CATEGORY[slotCode] === undefined)
) {
  throw new TypeError("Every MovementSlotCode must have exactly one prescription category.");
}

function buildOutput(exerciseSelection, sessions) {
  return {
    prescription_version: TRAINING_PRESCRIPTION_VERSION,
    status: exerciseSelection.status,
    recommended_days: exerciseSelection.recommended_days,
    split_code: exerciseSelection.split_code,
    schedule_mode: exerciseSelection.schedule_mode,
    intro_week_required: exerciseSelection.intro_week_required,
    volume_start: exerciseSelection.volume_start,
    sessions,
    constraints: exerciseSelection.constraints,
    reasons: exerciseSelection.reasons,
  };
}

function extractMaxSessionDuration(constraints) {
  const durationConstraints = constraints.filter(
    ({ code }) => code === "TRAINING_MAX_SESSION_DURATION",
  );
  if (durationConstraints.length !== 1) {
    throw new TypeError(
      "Training prescription requires exactly one TRAINING_MAX_SESSION_DURATION constraint when sessions exist.",
    );
  }

  const minutes = durationConstraints[0].value?.minutes;
  if (!Number.isInteger(minutes) || minutes <= 0) {
    throw new TypeError(
      "TRAINING_MAX_SESSION_DURATION must contain a positive integer minutes value.",
    );
  }
  return minutes;
}

function categoryForSlot(slotCode) {
  const category = MOVEMENT_SLOT_CATEGORY[slotCode];
  if (category === undefined) {
    throw new TypeError(`Unsupported Movement Slot in training prescription: ${slotCode}.`);
  }
  return category;
}

function validateVolumeStart(volumeStart) {
  if (volumeStart !== VolumeStart.CONSERVATIVE && volumeStart !== VolumeStart.NORMAL) {
    throw new TypeError(`Unsupported volume_start in training prescription: ${volumeStart}.`);
  }
}

function setsForExercise(category, durationMinutes, volumeStart) {
  validateVolumeStart(volumeStart);
  if (durationMinutes <= 30 || volumeStart === VolumeStart.CONSERVATIVE) {
    return 2;
  }
  return category === MovementSlotCategory.PRIMARY ? 3 : 2;
}

function targetsForExercise(category, prescriptionUnit) {
  if (!Object.values(ExercisePrescriptionUnit).includes(prescriptionUnit)) {
    throw new TypeError(
      `Unsupported exercise prescription unit from Exercise Catalog: ${prescriptionUnit}.`,
    );
  }

  if (prescriptionUnit === ExercisePrescriptionUnit.SECONDS) {
    if (category !== MovementSlotCategory.CORE) {
      throw new TypeError(
        "SECONDS prescriptions are supported only for CORE_STABILITY exercises.",
      );
    }
    return { target_min: 20, target_max: 30 };
  }

  if (category === MovementSlotCategory.ACCESSORY) {
    return { target_min: 10, target_max: 15 };
  }
  return { target_min: 8, target_max: 12 };
}

function restForExercise(category, durationMinutes) {
  const isShortSession = durationMinutes <= 30;
  if (category === MovementSlotCategory.PRIMARY) {
    return isShortSession ? 60 : 90;
  }
  if (category === MovementSlotCategory.ACCESSORY) {
    return isShortSession ? 45 : 60;
  }
  return isShortSession ? 30 : 45;
}

function prescriptionForSelectedExercise(slot, category, durationMinutes, volumeStart) {
  const exerciseRecord = getExerciseByCode(slot.exercise_code);
  if (exerciseRecord === null) {
    throw new TypeError(
      `Selected exercise_code does not exist in Exercise Catalog: ${slot.exercise_code}.`,
    );
  }

  const unit = exerciseRecord.prescription_unit;
  const targets = targetsForExercise(category, unit);
  return {
    sets: setsForExercise(category, durationMinutes, volumeStart),
    unit,
    target_min: targets.target_min,
    target_max: targets.target_max,
    rest_seconds: restForExercise(category, durationMinutes),
  };
}

function prescribeSlot(slot, durationMinutes, volumeStart) {
  const category = categoryForSlot(slot.slot_code);
  const outputSlot = {
    order: slot.order,
    slot_code: slot.slot_code,
    selection_status: slot.selection_status,
    exercise_code: slot.exercise_code,
    name_en: slot.name_en,
    reason_code: slot.reason_code,
    source_constraint_codes: slot.source_constraint_codes,
  };

  if (slot.selection_status === ExerciseSlotSelectionStatus.REVIEW_REQUIRED) {
    return { ...outputSlot, prescription: null };
  }
  if (slot.selection_status !== ExerciseSlotSelectionStatus.SELECTED) {
    throw new TypeError(
      `Unsupported exercise selection status in training prescription: ${slot.selection_status}.`,
    );
  }

  return {
    ...outputSlot,
    prescription: prescriptionForSelectedExercise(
      slot,
      category,
      durationMinutes,
      volumeStart,
    ),
  };
}

/**
 * Adds deterministic sets, targets, units, and rest to an Exercise Selection
 * without changing upstream decisions or mutating the input.
 *
 * @param {import("./domain/contracts.js").ExerciseSelectionInput} exerciseSelection
 * @returns {import("./domain/contracts.js").TrainingPrescription}
 */
export function buildTrainingPrescription(exerciseSelection) {
  if (exerciseSelection.status === TrainingPlanStatus.WITHHELD) {
    return buildOutput(exerciseSelection, []);
  }
  if (exerciseSelection.sessions.length === 0) {
    return buildOutput(exerciseSelection, []);
  }

  const durationMinutes = extractMaxSessionDuration(exerciseSelection.constraints);
  const sessions = exerciseSelection.sessions.map((session) => ({
    sequence: session.sequence,
    session_code: session.session_code,
    focus: session.focus,
    exercises: session.exercises.map((slot) =>
      prescribeSlot(slot, durationMinutes, exerciseSelection.volume_start),
    ),
  }));

  return buildOutput(exerciseSelection, sessions);
}

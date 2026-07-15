import {
  EquipmentCode,
  EquipmentLoadCapacity,
  TrainingLocation,
} from "../intake-decision-engine/index.js";
import { MovementSlotCode } from "../training-session-blueprint/index.js";

export const EXERCISE_CATALOG_VERSION = "exercise-catalog-v1";

const ALLOWED_LOCATIONS_BY_EQUIPMENT = Object.freeze({
  [EquipmentCode.BODYWEIGHT]: Object.freeze([
    TrainingLocation.HOME,
    TrainingLocation.GYM,
    TrainingLocation.OUTDOORS,
    TrainingLocation.MIXED,
  ]),
  [EquipmentCode.DUMBBELLS]: Object.freeze([
    TrainingLocation.HOME,
    TrainingLocation.GYM,
    TrainingLocation.MIXED,
  ]),
  [EquipmentCode.RESISTANCE_BANDS]: Object.freeze([
    TrainingLocation.HOME,
    TrainingLocation.GYM,
    TrainingLocation.MIXED,
  ]),
  [EquipmentCode.CABLE_STATION]: Object.freeze([
    TrainingLocation.GYM,
    TrainingLocation.MIXED,
  ]),
  [EquipmentCode.SELECTORIZED_MACHINES]: Object.freeze([
    TrainingLocation.GYM,
    TrainingLocation.MIXED,
  ]),
});

function createExercise({
  exerciseCode,
  nameEn,
  slotCode,
  equipmentCode,
  minimumLoadCapacity,
  beginnerFriendly,
}) {
  return Object.freeze({
    exercise_code: exerciseCode,
    name_en: nameEn,
    slot_code: slotCode,
    equipment_requirements: Object.freeze([
      Object.freeze({
        equipment_code: equipmentCode,
        minimum_load_capacity: minimumLoadCapacity,
      }),
    ]),
    allowed_locations: ALLOWED_LOCATIONS_BY_EQUIPMENT[equipmentCode],
    beginner_friendly: beginnerFriendly,
  });
}

const EXERCISES = Object.freeze([
  createExercise({
    exerciseCode: "BODYWEIGHT_SQUAT",
    nameEn: "Bodyweight Squat",
    slotCode: MovementSlotCode.KNEE_DOMINANT,
    equipmentCode: EquipmentCode.BODYWEIGHT,
    minimumLoadCapacity: EquipmentLoadCapacity.BODYWEIGHT_ONLY,
    beginnerFriendly: true,
  }),
  createExercise({
    exerciseCode: "GOBLET_SQUAT",
    nameEn: "Goblet Squat",
    slotCode: MovementSlotCode.KNEE_DOMINANT,
    equipmentCode: EquipmentCode.DUMBBELLS,
    minimumLoadCapacity: EquipmentLoadCapacity.LIGHT,
    beginnerFriendly: true,
  }),
  createExercise({
    exerciseCode: "GLUTE_BRIDGE",
    nameEn: "Glute Bridge",
    slotCode: MovementSlotCode.HIP_HINGE,
    equipmentCode: EquipmentCode.BODYWEIGHT,
    minimumLoadCapacity: EquipmentLoadCapacity.BODYWEIGHT_ONLY,
    beginnerFriendly: true,
  }),
  createExercise({
    exerciseCode: "DUMBBELL_ROMANIAN_DEADLIFT",
    nameEn: "Dumbbell Romanian Deadlift",
    slotCode: MovementSlotCode.HIP_HINGE,
    equipmentCode: EquipmentCode.DUMBBELLS,
    minimumLoadCapacity: EquipmentLoadCapacity.LIGHT,
    beginnerFriendly: true,
  }),
  createExercise({
    exerciseCode: "SPLIT_SQUAT",
    nameEn: "Split Squat",
    slotCode: MovementSlotCode.UNILATERAL_LOWER,
    equipmentCode: EquipmentCode.BODYWEIGHT,
    minimumLoadCapacity: EquipmentLoadCapacity.BODYWEIGHT_ONLY,
    beginnerFriendly: true,
  }),
  createExercise({
    exerciseCode: "DUMBBELL_REVERSE_LUNGE",
    nameEn: "Dumbbell Reverse Lunge",
    slotCode: MovementSlotCode.UNILATERAL_LOWER,
    equipmentCode: EquipmentCode.DUMBBELLS,
    minimumLoadCapacity: EquipmentLoadCapacity.LIGHT,
    beginnerFriendly: false,
  }),
  createExercise({
    exerciseCode: "HAMSTRING_WALKOUT",
    nameEn: "Hamstring Walkout",
    slotCode: MovementSlotCode.KNEE_FLEXION,
    equipmentCode: EquipmentCode.BODYWEIGHT,
    minimumLoadCapacity: EquipmentLoadCapacity.BODYWEIGHT_ONLY,
    beginnerFriendly: true,
  }),
  createExercise({
    exerciseCode: "LYING_LEG_CURL_MACHINE",
    nameEn: "Lying Leg Curl Machine",
    slotCode: MovementSlotCode.KNEE_FLEXION,
    equipmentCode: EquipmentCode.SELECTORIZED_MACHINES,
    minimumLoadCapacity: EquipmentLoadCapacity.LIGHT,
    beginnerFriendly: true,
  }),
  createExercise({
    exerciseCode: "STANDING_CALF_RAISE",
    nameEn: "Standing Calf Raise",
    slotCode: MovementSlotCode.CALF_RAISE,
    equipmentCode: EquipmentCode.BODYWEIGHT,
    minimumLoadCapacity: EquipmentLoadCapacity.BODYWEIGHT_ONLY,
    beginnerFriendly: true,
  }),
  createExercise({
    exerciseCode: "DUMBBELL_CALF_RAISE",
    nameEn: "Dumbbell Calf Raise",
    slotCode: MovementSlotCode.CALF_RAISE,
    equipmentCode: EquipmentCode.DUMBBELLS,
    minimumLoadCapacity: EquipmentLoadCapacity.LIGHT,
    beginnerFriendly: true,
  }),
  createExercise({
    exerciseCode: "PUSH_UP",
    nameEn: "Push-Up",
    slotCode: MovementSlotCode.HORIZONTAL_PUSH,
    equipmentCode: EquipmentCode.BODYWEIGHT,
    minimumLoadCapacity: EquipmentLoadCapacity.BODYWEIGHT_ONLY,
    beginnerFriendly: true,
  }),
  createExercise({
    exerciseCode: "DUMBBELL_FLOOR_PRESS",
    nameEn: "Dumbbell Floor Press",
    slotCode: MovementSlotCode.HORIZONTAL_PUSH,
    equipmentCode: EquipmentCode.DUMBBELLS,
    minimumLoadCapacity: EquipmentLoadCapacity.LIGHT,
    beginnerFriendly: true,
  }),
  createExercise({
    exerciseCode: "RESISTANCE_BAND_ROW",
    nameEn: "Resistance Band Row",
    slotCode: MovementSlotCode.HORIZONTAL_PULL,
    equipmentCode: EquipmentCode.RESISTANCE_BANDS,
    minimumLoadCapacity: EquipmentLoadCapacity.LIGHT,
    beginnerFriendly: true,
  }),
  createExercise({
    exerciseCode: "ONE_ARM_DUMBBELL_ROW",
    nameEn: "One-Arm Dumbbell Row",
    slotCode: MovementSlotCode.HORIZONTAL_PULL,
    equipmentCode: EquipmentCode.DUMBBELLS,
    minimumLoadCapacity: EquipmentLoadCapacity.LIGHT,
    beginnerFriendly: true,
  }),
  createExercise({
    exerciseCode: "PIKE_PUSH_UP",
    nameEn: "Pike Push-Up",
    slotCode: MovementSlotCode.VERTICAL_PUSH,
    equipmentCode: EquipmentCode.BODYWEIGHT,
    minimumLoadCapacity: EquipmentLoadCapacity.BODYWEIGHT_ONLY,
    beginnerFriendly: false,
  }),
  createExercise({
    exerciseCode: "STANDING_DUMBBELL_SHOULDER_PRESS",
    nameEn: "Standing Dumbbell Shoulder Press",
    slotCode: MovementSlotCode.VERTICAL_PUSH,
    equipmentCode: EquipmentCode.DUMBBELLS,
    minimumLoadCapacity: EquipmentLoadCapacity.LIGHT,
    beginnerFriendly: true,
  }),
  createExercise({
    exerciseCode: "BAND_LAT_PULLDOWN",
    nameEn: "Band Lat Pulldown",
    slotCode: MovementSlotCode.VERTICAL_PULL,
    equipmentCode: EquipmentCode.RESISTANCE_BANDS,
    minimumLoadCapacity: EquipmentLoadCapacity.LIGHT,
    beginnerFriendly: true,
  }),
  createExercise({
    exerciseCode: "LAT_PULLDOWN",
    nameEn: "Lat Pulldown",
    slotCode: MovementSlotCode.VERTICAL_PULL,
    equipmentCode: EquipmentCode.CABLE_STATION,
    minimumLoadCapacity: EquipmentLoadCapacity.LIGHT,
    beginnerFriendly: true,
  }),
  createExercise({
    exerciseCode: "DUMBBELL_LATERAL_RAISE",
    nameEn: "Dumbbell Lateral Raise",
    slotCode: MovementSlotCode.SHOULDER_ABDUCTION,
    equipmentCode: EquipmentCode.DUMBBELLS,
    minimumLoadCapacity: EquipmentLoadCapacity.LIGHT,
    beginnerFriendly: true,
  }),
  createExercise({
    exerciseCode: "CABLE_LATERAL_RAISE",
    nameEn: "Cable Lateral Raise",
    slotCode: MovementSlotCode.SHOULDER_ABDUCTION,
    equipmentCode: EquipmentCode.CABLE_STATION,
    minimumLoadCapacity: EquipmentLoadCapacity.LIGHT,
    beginnerFriendly: true,
  }),
  createExercise({
    exerciseCode: "BAND_FACE_PULL",
    nameEn: "Band Face Pull",
    slotCode: MovementSlotCode.REAR_DELT,
    equipmentCode: EquipmentCode.RESISTANCE_BANDS,
    minimumLoadCapacity: EquipmentLoadCapacity.LIGHT,
    beginnerFriendly: true,
  }),
  createExercise({
    exerciseCode: "DUMBBELL_REAR_DELT_RAISE",
    nameEn: "Dumbbell Rear Delt Raise",
    slotCode: MovementSlotCode.REAR_DELT,
    equipmentCode: EquipmentCode.DUMBBELLS,
    minimumLoadCapacity: EquipmentLoadCapacity.LIGHT,
    beginnerFriendly: true,
  }),
  createExercise({
    exerciseCode: "BAND_BICEPS_CURL",
    nameEn: "Band Biceps Curl",
    slotCode: MovementSlotCode.ELBOW_FLEXION,
    equipmentCode: EquipmentCode.RESISTANCE_BANDS,
    minimumLoadCapacity: EquipmentLoadCapacity.LIGHT,
    beginnerFriendly: true,
  }),
  createExercise({
    exerciseCode: "DUMBBELL_BICEPS_CURL",
    nameEn: "Dumbbell Biceps Curl",
    slotCode: MovementSlotCode.ELBOW_FLEXION,
    equipmentCode: EquipmentCode.DUMBBELLS,
    minimumLoadCapacity: EquipmentLoadCapacity.LIGHT,
    beginnerFriendly: true,
  }),
  createExercise({
    exerciseCode: "CLOSE_GRIP_PUSH_UP",
    nameEn: "Close-Grip Push-Up",
    slotCode: MovementSlotCode.ELBOW_EXTENSION,
    equipmentCode: EquipmentCode.BODYWEIGHT,
    minimumLoadCapacity: EquipmentLoadCapacity.BODYWEIGHT_ONLY,
    beginnerFriendly: false,
  }),
  createExercise({
    exerciseCode: "BAND_TRICEPS_EXTENSION",
    nameEn: "Band Triceps Extension",
    slotCode: MovementSlotCode.ELBOW_EXTENSION,
    equipmentCode: EquipmentCode.RESISTANCE_BANDS,
    minimumLoadCapacity: EquipmentLoadCapacity.LIGHT,
    beginnerFriendly: true,
  }),
  createExercise({
    exerciseCode: "DEAD_BUG",
    nameEn: "Dead Bug",
    slotCode: MovementSlotCode.CORE_STABILITY,
    equipmentCode: EquipmentCode.BODYWEIGHT,
    minimumLoadCapacity: EquipmentLoadCapacity.BODYWEIGHT_ONLY,
    beginnerFriendly: true,
  }),
  createExercise({
    exerciseCode: "FRONT_PLANK",
    nameEn: "Front Plank",
    slotCode: MovementSlotCode.CORE_STABILITY,
    equipmentCode: EquipmentCode.BODYWEIGHT,
    minimumLoadCapacity: EquipmentLoadCapacity.BODYWEIGHT_ONLY,
    beginnerFriendly: true,
  }),
]);

/** @type {import("./domain/contracts.js").ExerciseCatalog} */
export const EXERCISE_CATALOG = Object.freeze({
  catalog_version: EXERCISE_CATALOG_VERSION,
  exercises: EXERCISES,
});

const EXERCISES_BY_CODE = new Map(
  EXERCISE_CATALOG.exercises.map((exercise) => [exercise.exercise_code, exercise]),
);

/**
 * @param {string} exerciseCode
 * @returns {import("./domain/contracts.js").ExerciseRecord|null}
 */
export function getExerciseByCode(exerciseCode) {
  return EXERCISES_BY_CODE.get(exerciseCode) ?? null;
}

/**
 * @param {import("./domain/contracts.js").MovementSlotCodeValue} slotCode
 * @returns {import("./domain/contracts.js").ExerciseRecord[]}
 */
export function listExercisesForSlot(slotCode) {
  return EXERCISE_CATALOG.exercises.filter((exercise) => exercise.slot_code === slotCode);
}

import assert from "node:assert/strict";
import test from "node:test";

import {
  EquipmentCode,
  EquipmentLoadCapacity,
  TrainingLocation,
} from "../src/intake-decision-engine/index.js";
import { MovementSlotCode } from "../src/training-session-blueprint/index.js";
import {
  EXERCISE_CATALOG,
  EXERCISE_CATALOG_VERSION,
  ExercisePrescriptionUnit,
  getExerciseByCode,
  listExercisesForSlot,
} from "../src/exercise-catalog/index.js";

const EXPECTED_EXERCISES = [
  ["BODYWEIGHT_SQUAT", "Bodyweight Squat", "KNEE_DOMINANT", "BODYWEIGHT", "BODYWEIGHT_ONLY", true],
  ["GOBLET_SQUAT", "Goblet Squat", "KNEE_DOMINANT", "DUMBBELLS", "LIGHT", true],
  ["GLUTE_BRIDGE", "Glute Bridge", "HIP_EXTENSION", "BODYWEIGHT", "BODYWEIGHT_ONLY", true],
  ["HIP_THRUST", "Hip Thrust", "HIP_EXTENSION", "SELECTORIZED_MACHINES", "MODERATE", true],
  ["SINGLE_LEG_RDL_BODYWEIGHT", "Single-Leg Romanian Deadlift (Bodyweight)", "HIP_HINGE", "BODYWEIGHT", "BODYWEIGHT_ONLY", true],
  ["DUMBBELL_ROMANIAN_DEADLIFT", "Dumbbell Romanian Deadlift", "HIP_HINGE", "DUMBBELLS", "LIGHT", true],
  ["SPLIT_SQUAT", "Split Squat", "UNILATERAL_LOWER", "BODYWEIGHT", "BODYWEIGHT_ONLY", true],
  ["DUMBBELL_REVERSE_LUNGE", "Dumbbell Reverse Lunge", "UNILATERAL_LOWER", "DUMBBELLS", "LIGHT", false],
  ["HAMSTRING_WALKOUT", "Hamstring Walkout", "KNEE_FLEXION", "BODYWEIGHT", "BODYWEIGHT_ONLY", true],
  ["LYING_LEG_CURL_MACHINE", "Lying Leg Curl Machine", "KNEE_FLEXION", "SELECTORIZED_MACHINES", "LIGHT", true],
  ["STANDING_CALF_RAISE", "Standing Calf Raise", "CALF_RAISE", "BODYWEIGHT", "BODYWEIGHT_ONLY", true],
  ["DUMBBELL_CALF_RAISE", "Dumbbell Calf Raise", "CALF_RAISE", "DUMBBELLS", "LIGHT", true],
  ["PUSH_UP", "Push-Up", "HORIZONTAL_PUSH", "BODYWEIGHT", "BODYWEIGHT_ONLY", true],
  ["DUMBBELL_FLOOR_PRESS", "Dumbbell Floor Press", "HORIZONTAL_PUSH", "DUMBBELLS", "LIGHT", true],
  ["RESISTANCE_BAND_ROW", "Resistance Band Row", "HORIZONTAL_PULL", "RESISTANCE_BANDS", "LIGHT", true],
  ["ONE_ARM_DUMBBELL_ROW", "One-Arm Dumbbell Row", "HORIZONTAL_PULL", "DUMBBELLS", "LIGHT", true],
  ["PIKE_PUSH_UP", "Pike Push-Up", "VERTICAL_PUSH", "BODYWEIGHT", "BODYWEIGHT_ONLY", false],
  ["STANDING_DUMBBELL_SHOULDER_PRESS", "Standing Dumbbell Shoulder Press", "VERTICAL_PUSH", "DUMBBELLS", "LIGHT", true],
  ["BAND_LAT_PULLDOWN", "Band Lat Pulldown", "VERTICAL_PULL", "RESISTANCE_BANDS", "LIGHT", true],
  ["LAT_PULLDOWN", "Lat Pulldown", "VERTICAL_PULL", "CABLE_STATION", "LIGHT", true],
  ["DUMBBELL_LATERAL_RAISE", "Dumbbell Lateral Raise", "SHOULDER_ABDUCTION", "DUMBBELLS", "LIGHT", true],
  ["CABLE_LATERAL_RAISE", "Cable Lateral Raise", "SHOULDER_ABDUCTION", "CABLE_STATION", "LIGHT", true],
  ["BAND_FACE_PULL", "Band Face Pull", "REAR_DELT", "RESISTANCE_BANDS", "LIGHT", true],
  ["DUMBBELL_REAR_DELT_RAISE", "Dumbbell Rear Delt Raise", "REAR_DELT", "DUMBBELLS", "LIGHT", true],
  ["BAND_BICEPS_CURL", "Band Biceps Curl", "ELBOW_FLEXION", "RESISTANCE_BANDS", "LIGHT", true],
  ["DUMBBELL_BICEPS_CURL", "Dumbbell Biceps Curl", "ELBOW_FLEXION", "DUMBBELLS", "LIGHT", true],
  ["CLOSE_GRIP_PUSH_UP", "Close-Grip Push-Up", "ELBOW_EXTENSION", "BODYWEIGHT", "BODYWEIGHT_ONLY", false],
  ["BAND_TRICEPS_EXTENSION", "Band Triceps Extension", "ELBOW_EXTENSION", "RESISTANCE_BANDS", "LIGHT", true],
  ["DEAD_BUG", "Dead Bug", "CORE_STABILITY", "BODYWEIGHT", "BODYWEIGHT_ONLY", true],
  ["FRONT_PLANK", "Front Plank", "CORE_STABILITY", "BODYWEIGHT", "BODYWEIGHT_ONLY", true],
].map(
  ([exerciseCode, nameEn, slotCode, equipmentCode, minimumLoadCapacity, beginnerFriendly]) => ({
    exerciseCode,
    nameEn,
    slotCode,
    equipmentCode,
    minimumLoadCapacity,
    beginnerFriendly,
  }),
);

const EXPECTED_CODES_BY_SLOT = {
  KNEE_DOMINANT: ["BODYWEIGHT_SQUAT", "GOBLET_SQUAT"],
  // The glutes have their own movement now; the hinge keeps a pair of its own.
  HIP_EXTENSION: ["GLUTE_BRIDGE", "HIP_THRUST"],
  HIP_HINGE: ["SINGLE_LEG_RDL_BODYWEIGHT", "DUMBBELL_ROMANIAN_DEADLIFT"],
  UNILATERAL_LOWER: ["SPLIT_SQUAT", "DUMBBELL_REVERSE_LUNGE"],
  KNEE_FLEXION: ["HAMSTRING_WALKOUT", "LYING_LEG_CURL_MACHINE"],
  CALF_RAISE: ["STANDING_CALF_RAISE", "DUMBBELL_CALF_RAISE"],
  HORIZONTAL_PUSH: ["PUSH_UP", "DUMBBELL_FLOOR_PRESS"],
  HORIZONTAL_PULL: ["RESISTANCE_BAND_ROW", "ONE_ARM_DUMBBELL_ROW"],
  VERTICAL_PUSH: ["PIKE_PUSH_UP", "STANDING_DUMBBELL_SHOULDER_PRESS"],
  VERTICAL_PULL: ["BAND_LAT_PULLDOWN", "LAT_PULLDOWN"],
  SHOULDER_ABDUCTION: ["DUMBBELL_LATERAL_RAISE", "CABLE_LATERAL_RAISE"],
  REAR_DELT: ["BAND_FACE_PULL", "DUMBBELL_REAR_DELT_RAISE"],
  ELBOW_FLEXION: ["BAND_BICEPS_CURL", "DUMBBELL_BICEPS_CURL"],
  ELBOW_EXTENSION: ["CLOSE_GRIP_PUSH_UP", "BAND_TRICEPS_EXTENSION"],
  CORE_STABILITY: ["DEAD_BUG", "FRONT_PLANK"],
};

const EXPECTED_CODES_BY_PRESCRIPTION_UNIT = {
  [ExercisePrescriptionUnit.REPS]: [
    "BODYWEIGHT_SQUAT",
    "GOBLET_SQUAT",
    "GLUTE_BRIDGE",
    "HIP_THRUST",
    "DUMBBELL_ROMANIAN_DEADLIFT",
    "HAMSTRING_WALKOUT",
    "LYING_LEG_CURL_MACHINE",
    "STANDING_CALF_RAISE",
    "DUMBBELL_CALF_RAISE",
    "PUSH_UP",
    "DUMBBELL_FLOOR_PRESS",
    "RESISTANCE_BAND_ROW",
    "PIKE_PUSH_UP",
    "STANDING_DUMBBELL_SHOULDER_PRESS",
    "BAND_LAT_PULLDOWN",
    "LAT_PULLDOWN",
    "DUMBBELL_LATERAL_RAISE",
    "BAND_FACE_PULL",
    "DUMBBELL_REAR_DELT_RAISE",
    "BAND_BICEPS_CURL",
    "DUMBBELL_BICEPS_CURL",
    "CLOSE_GRIP_PUSH_UP",
    "BAND_TRICEPS_EXTENSION",
  ],
  [ExercisePrescriptionUnit.REPS_PER_SIDE]: [
    "SINGLE_LEG_RDL_BODYWEIGHT",
    "SPLIT_SQUAT",
    "DUMBBELL_REVERSE_LUNGE",
    "ONE_ARM_DUMBBELL_ROW",
    "CABLE_LATERAL_RAISE",
    "DEAD_BUG",
  ],
  [ExercisePrescriptionUnit.SECONDS]: ["FRONT_PLANK"],
};

const EXPECTED_PRESCRIPTION_UNIT_BY_CODE = new Map(
  Object.entries(EXPECTED_CODES_BY_PRESCRIPTION_UNIT).flatMap(
    ([prescriptionUnit, exerciseCodes]) =>
      exerciseCodes.map((exerciseCode) => [exerciseCode, prescriptionUnit]),
  ),
);

const EXPECTED_LOCATIONS_BY_EQUIPMENT = {
  BODYWEIGHT: ["HOME", "GYM", "OUTDOORS", "MIXED"],
  DUMBBELLS: ["HOME", "GYM", "MIXED"],
  RESISTANCE_BANDS: ["HOME", "GYM", "MIXED"],
  CABLE_STATION: ["GYM", "MIXED"],
  SELECTORIZED_MACHINES: ["GYM", "MIXED"],
};

test("exercise catalog version is stable", () => {
  assert.equal(EXERCISE_CATALOG_VERSION, "exercise-catalog-v1");
  assert.equal(EXERCISE_CATALOG.catalog_version, EXERCISE_CATALOG_VERSION);
});

test("ExercisePrescriptionUnit exposes only the three approved units", () => {
  assert.deepEqual(Object.keys(ExercisePrescriptionUnit), ["REPS", "REPS_PER_SIDE", "SECONDS"]);
  assert.deepEqual(Object.values(ExercisePrescriptionUnit), ["REPS", "REPS_PER_SIDE", "SECONDS"]);
});

test("catalog contains exactly 30 exercise records with the required shape", () => {
  assert.equal(EXERCISE_CATALOG.exercises.length, 30);
  assert.deepEqual(
    EXERCISE_CATALOG.exercises.map(({ exercise_code: exerciseCode }) => exerciseCode),
    EXPECTED_EXERCISES.map(({ exerciseCode }) => exerciseCode),
  );

  for (const exercise of EXERCISE_CATALOG.exercises) {
    assert.deepEqual(Object.keys(exercise).sort(), [
      "allowed_locations",
      "beginner_friendly",
      "equipment_requirements",
      "exercise_code",
      "name_en",
      "prescription_unit",
      "slot_code",
    ]);
    for (const requirement of exercise.equipment_requirements) {
      assert.deepEqual(Object.keys(requirement).sort(), [
        "equipment_code",
        "minimum_load_capacity",
      ]);
    }
  }
});

test("all 30 exercises use the exact approved prescription-unit distribution", () => {
  const knownUnits = new Set(Object.values(ExercisePrescriptionUnit));
  assert.equal(EXPECTED_PRESCRIPTION_UNIT_BY_CODE.size, 30);
  assert.ok(
    EXERCISE_CATALOG.exercises.every(({ prescription_unit: unit }) => knownUnits.has(unit)),
  );

  for (const [prescriptionUnit, expectedCodes] of Object.entries(
    EXPECTED_CODES_BY_PRESCRIPTION_UNIT,
  )) {
    assert.deepEqual(
      EXERCISE_CATALOG.exercises
        .filter(({ prescription_unit: unit }) => unit === prescriptionUnit)
        .map(({ exercise_code: exerciseCode }) => exerciseCode),
      expectedCodes,
    );
  }
});

test("exercise codes are unique upper-snake-case identifiers", () => {
  const codes = EXERCISE_CATALOG.exercises.map(({ exercise_code: exerciseCode }) => exerciseCode);

  assert.equal(new Set(codes).size, codes.length);
  assert.ok(codes.every((code) => /^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/.test(code)));
});

test("every movement slot contains exactly two exercises", () => {
  const countsBySlot = new Map();
  for (const { slot_code: slotCode } of EXERCISE_CATALOG.exercises) {
    countsBySlot.set(slotCode, (countsBySlot.get(slotCode) ?? 0) + 1);
  }

  assert.equal(countsBySlot.size, Object.values(MovementSlotCode).length);
  for (const slotCode of Object.values(MovementSlotCode)) {
    assert.equal(countsBySlot.get(slotCode), 2);
  }
});

test("English names and beginner flags match the approved records", () => {
  const recordsByCode = new Map(
    EXERCISE_CATALOG.exercises.map((exercise) => [exercise.exercise_code, exercise]),
  );

  for (const expected of EXPECTED_EXERCISES) {
    const actual = recordsByCode.get(expected.exerciseCode);
    assert.equal(actual.name_en, expected.nameEn);
    assert.ok(actual.name_en.trim().length > 0);
    assert.equal(actual.beginner_friendly, expected.beginnerFriendly);
    assert.equal(typeof actual.beginner_friendly, "boolean");
  }
});

test("every exercise uses a public MovementSlotCode", () => {
  const knownSlots = new Set(Object.values(MovementSlotCode));

  assert.ok(EXERCISE_CATALOG.exercises.every(({ slot_code: slotCode }) => knownSlots.has(slotCode)));
});

test("equipment requirements use known equipment and match the approved records", () => {
  const knownEquipment = new Set(Object.values(EquipmentCode));
  const recordsByCode = new Map(
    EXERCISE_CATALOG.exercises.map((exercise) => [exercise.exercise_code, exercise]),
  );

  for (const expected of EXPECTED_EXERCISES) {
    const requirements = recordsByCode.get(expected.exerciseCode).equipment_requirements;
    assert.equal(requirements.length, 1);
    assert.equal(new Set(requirements.map(({ equipment_code: code }) => code)).size, requirements.length);
    assert.ok(requirements.every(({ equipment_code: code }) => knownEquipment.has(code)));
    assert.deepEqual(requirements[0], {
      equipment_code: expected.equipmentCode,
      minimum_load_capacity: expected.minimumLoadCapacity,
    });
  }
});

test("bodyweight requirements use BODYWEIGHT_ONLY", () => {
  const bodyweightRequirements = EXERCISE_CATALOG.exercises.flatMap(
    ({ equipment_requirements: requirements }) =>
      requirements.filter(({ equipment_code: code }) => code === EquipmentCode.BODYWEIGHT),
  );

  assert.ok(bodyweightRequirements.length > 0);
  assert.ok(
    bodyweightRequirements.every(
      ({ minimum_load_capacity: capacity }) =>
        capacity === EquipmentLoadCapacity.BODYWEIGHT_ONLY,
    ),
  );
});

test("non-bodyweight requirements never use BODYWEIGHT_ONLY or NOT_APPLICABLE", () => {
  const allowedCapacities = new Set([
    EquipmentLoadCapacity.LIGHT,
    EquipmentLoadCapacity.MODERATE,
    EquipmentLoadCapacity.HEAVY,
  ]);
  const nonBodyweightRequirements = EXERCISE_CATALOG.exercises.flatMap(
    ({ equipment_requirements: requirements }) =>
      requirements.filter(({ equipment_code: code }) => code !== EquipmentCode.BODYWEIGHT),
  );

  assert.ok(nonBodyweightRequirements.length > 0);
  assert.ok(
    nonBodyweightRequirements.every(({ minimum_load_capacity: capacity }) =>
      allowedCapacities.has(capacity),
    ),
  );
});

test("allowed locations are known, unique, and equipment-appropriate", () => {
  const knownLocations = new Set(Object.values(TrainingLocation));

  for (const exercise of EXERCISE_CATALOG.exercises) {
    assert.ok(exercise.allowed_locations.length > 0);
    assert.equal(new Set(exercise.allowed_locations).size, exercise.allowed_locations.length);
    assert.ok(exercise.allowed_locations.every((location) => knownLocations.has(location)));
    assert.deepEqual(
      exercise.allowed_locations,
      EXPECTED_LOCATIONS_BY_EQUIPMENT[
        exercise.equipment_requirements[0].equipment_code
      ],
    );
  }
});

test("getExerciseByCode returns the matching record or null", () => {
  for (const exercise of EXERCISE_CATALOG.exercises) {
    const result = getExerciseByCode(exercise.exercise_code);
    assert.strictEqual(result, exercise);
    assert.equal(
      result.prescription_unit,
      EXPECTED_PRESCRIPTION_UNIT_BY_CODE.get(exercise.exercise_code),
    );
  }

  assert.equal(getExerciseByCode("UNKNOWN_EXERCISE"), null);
});

test("listExercisesForSlot returns the approved pair for every slot", () => {
  for (const [slotCode, expectedCodes] of Object.entries(EXPECTED_CODES_BY_SLOT)) {
    const exercises = listExercisesForSlot(slotCode);
    assert.deepEqual(
      exercises.map(({ exercise_code: exerciseCode }) => exerciseCode),
      expectedCodes,
    );
    assert.deepEqual(
      exercises.map(({ prescription_unit: unit }) => unit),
      expectedCodes.map((exerciseCode) => EXPECTED_PRESCRIPTION_UNIT_BY_CODE.get(exerciseCode)),
    );
  }
});

test("modifying a returned slot list does not modify the catalog", () => {
  const firstResult = listExercisesForSlot(MovementSlotCode.KNEE_DOMINANT);
  const secondResult = listExercisesForSlot(MovementSlotCode.KNEE_DOMINANT);

  assert.notStrictEqual(firstResult, secondResult);
  firstResult.pop();
  firstResult.push({ exercise_code: "LOCAL_ONLY" });

  assert.equal(secondResult.length, 2);
  assert.deepEqual(
    listExercisesForSlot(MovementSlotCode.KNEE_DOMINANT).map(
      ({ exercise_code: exerciseCode }) => exerciseCode,
    ),
    EXPECTED_CODES_BY_SLOT.KNEE_DOMINANT,
  );
  assert.equal(EXERCISE_CATALOG.exercises.length, 30);
});

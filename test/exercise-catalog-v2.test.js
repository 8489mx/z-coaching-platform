import test from "node:test";
import assert from "node:assert/strict";

import {
  EXERCISE_CATALOG_V2,
  EXERCISE_CATALOG_V2_VERSION,
  ExercisePrescriptionUnit,
  MovementSlotCodeV2,
  MuscleGroup,
  getExerciseV2ByCode,
  listExercisesV2ForSlot,
  listExercisesV2ForMuscle,
} from "../src/exercise-catalog-v2/index.js";

test("Exercise Catalog V2 Suite", async (t) => {
  await t.test("catalog version is stable", () => {
    assert.equal(EXERCISE_CATALOG_V2.catalog_version, "exercise-catalog-v2");
    assert.equal(EXERCISE_CATALOG_V2_VERSION, "exercise-catalog-v2");
  });

  await t.test("catalog contains at least 50 comprehensive exercises", () => {
    assert.ok(EXERCISE_CATALOG_V2.exercises.length >= 50);
  });

  await t.test("every exercise code is unique and uppercase snake_case", () => {
    const seen = new Set();
    const snakeCaseRegex = /^[A-Z0-9]+(_[A-Z0-9]+)*$/;
    for (const ex of EXERCISE_CATALOG_V2.exercises) {
      assert.ok(snakeCaseRegex.test(ex.exercise_code), `Invalid code format: ${ex.exercise_code}`);
      assert.ok(!seen.has(ex.exercise_code), `Duplicate exercise code: ${ex.exercise_code}`);
      seen.add(ex.exercise_code);
    }
  });

  await t.test("every exercise has English and Arabic names", () => {
    for (const ex of EXERCISE_CATALOG_V2.exercises) {
      assert.ok(typeof ex.name_en === "string" && ex.name_en.length > 0, `Missing name_en on ${ex.exercise_code}`);
      assert.ok(typeof ex.name_ar === "string" && ex.name_ar.length > 0, `Missing name_ar on ${ex.exercise_code}`);
    }
  });

  await t.test("every exercise has valid slot_code and primary_muscle", () => {
    const slots = Object.values(MovementSlotCodeV2);
    const muscles = Object.values(MuscleGroup);

    for (const ex of EXERCISE_CATALOG_V2.exercises) {
      assert.ok(slots.includes(ex.slot_code), `Unknown slot on ${ex.exercise_code}: ${ex.slot_code}`);
      assert.ok(muscles.includes(ex.primary_muscle), `Unknown muscle on ${ex.exercise_code}: ${ex.primary_muscle}`);
    }
  });

  await t.test("every exercise has equipment requirements and allowed locations", () => {
    for (const ex of EXERCISE_CATALOG_V2.exercises) {
      assert.ok(Array.isArray(ex.equipment_requirements) && ex.equipment_requirements.length > 0);
      assert.ok(Array.isArray(ex.allowed_locations) && ex.allowed_locations.length > 0);
      assert.ok(Object.values(ExercisePrescriptionUnit).includes(ex.prescription_unit));
    }
  });

  await t.test("getExerciseV2ByCode returns correct record or null", () => {
    const squat = getExerciseV2ByCode("BARBELL_BACK_SQUAT");
    assert.ok(squat);
    assert.equal(squat.name_en, "Barbell Back Squat");
    assert.equal(squat.primary_muscle, MuscleGroup.QUADS);

    const nonExistent = getExerciseV2ByCode("NON_EXISTENT_CODE");
    assert.equal(nonExistent, null);
  });

  await t.test("listExercisesV2ForSlot returns all exercises for a given slot", () => {
    const pushExercises = listExercisesV2ForSlot(MovementSlotCodeV2.HORIZONTAL_PUSH);
    assert.ok(pushExercises.length >= 3);
    assert.ok(pushExercises.every((e) => e.slot_code === MovementSlotCodeV2.HORIZONTAL_PUSH));
  });

  await t.test("listExercisesV2ForMuscle returns exercises targeting primary or secondary muscle", () => {
    const quadExercises = listExercisesV2ForMuscle(MuscleGroup.QUADS);
    assert.ok(quadExercises.length >= 4);
    assert.ok(
      quadExercises.every(
        (e) => e.primary_muscle === MuscleGroup.QUADS || e.secondary_muscles.includes(MuscleGroup.QUADS),
      ),
    );
  });

  await t.test("catalog and exercises are deeply frozen and immutable", () => {
    assert.ok(Object.isFrozen(EXERCISE_CATALOG_V2));
    assert.ok(Object.isFrozen(EXERCISE_CATALOG_V2.exercises));
    assert.ok(Object.isFrozen(EXERCISE_CATALOG_V2.exercises[0]));
  });
});

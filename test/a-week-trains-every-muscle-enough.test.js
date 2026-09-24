import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { auditWeeklyMuscleVolume, resolveMuscleGroupKey } from "../src/api/utils/trainingNutritionCoupling.js";

/**
 * The weekly volume the coach is shown. Four exercises the plan writes were not recognised at all -
 * a push-up, a close-grip push-up, a reverse lunge and a glute bridge - so the quadriceps read 6
 * sets when the lunges made them 12 and the triceps read zero. And the shoulders really were short:
 * an upper/lower week pressed overhead twice and never raised laterally, 6 sets against a minimum of
 * 8, when it is the front delt that a press works.
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"));

const weekOf = ({ days = 4, experience = "intermediate", env = "commercial_gym", gender = "male" } = {}) => buildMasterEngineV2({
  intake: {
    gender, age: "30", height_cm: "178", weight_kg: "85", circumferences: { neck_cm: "38", waist_cm: "90", hips_cm: "100" },
    primary_goal: "lean_bulk", neat_level: "moderate", occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
    medical_conditions: { has_conditions: false, selected: ["none"] },
    injuries_map: { has_injuries: false, selected_areas: ["none"] }, religion: "MUSLIM", strict_allergies: ["none"],
    meal_structure: { meals_count: "3_meals", intermittent_fasting: "none" }, training_environment: env,
    training_logistics: { days_per_week: days, experience_level: experience }, recent_training: "ACTIVE",
  },
  evaluationContext: { system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" },
  nutritionFoodCatalog: CATALOG, options: {},
}).training_program.weeks[0].sessions || [];

test("every exercise the plan writes is counted against a muscle", () => {
  const unknown = new Set();
  for (const days of [3, 4, 5, 6]) {
    for (const env of ["commercial_gym", "home_gym", "calisthenics_bands"]) {
      for (const session of weekOf({ days, env, experience: days >= 5 ? "advanced" : "intermediate" })) {
        for (const exercise of session.exercises || []) {
          if (resolveMuscleGroupKey(exercise) === "OTHER") unknown.add(String(exercise.exercise_code || exercise.code));
        }
      }
    }
  }
  assert.deepEqual([...unknown], []);
});

test("the muscles of a trained week reach their minimum effective volume", () => {
  for (const days of [4, 5, 6]) {
    const audit = auditWeeklyMuscleVolume(weekOf({ days, experience: days >= 5 ? "advanced" : "intermediate" }));
    const below = Object.entries(audit.analysis)
      .filter(([, muscle]) => muscle.status === "BELOW_MEV")
      .map(([key, muscle]) => `${key} ${muscle.weekly_sets}/${muscle.mev}`);
    assert.deepEqual(below, [], `${days} days`);
  }
});

test("the shoulders are raised as well as pressed", () => {
  for (const days of [4, 5, 6]) {
    const audit = auditWeeklyMuscleVolume(weekOf({ days, experience: days >= 5 ? "advanced" : "intermediate" }));
    assert.ok(audit.analysis.SHOULDERS.weekly_sets >= 8, `${days} days: ${audit.analysis.SHOULDERS.weekly_sets} shoulder sets`);
  }
});

test("a muscle with no direct sets says so instead of reading as optimal", () => {
  const audit = auditWeeklyMuscleVolume([{ exercises: [{ exercise_code: "BARBELL_BENCH_PRESS", sets: 4 }] }]);
  assert.equal(audit.analysis.CHEST.weekly_sets, 4);
  assert.equal(audit.analysis.GLUTES.weekly_sets, 0);
  assert.equal(audit.analysis.GLUTES.status, "NOT_TRAINED_DIRECTLY");
  assert.match(audit.analysis.GLUTES.status_label_ar, /غير مباشر/);
});

test("every exercise is counted against the muscle it actually trains", () => {
  const cases = [
    ["CHEST_SUPPORTED_ROW", "BACK"],
    ["LAT_PULLDOWN", "BACK"],
    ["FACE_PULL", "SHOULDERS"],
    ["DUMBBELL_REAR_DELT_RAISE", "SHOULDERS"],
    ["PIKE_PUSH_UP", "SHOULDERS"],
    ["BENCH_DIPS_BODYWEIGHT", "TRICEPS"],
    ["CLOSE_GRIP_PUSH_UP", "TRICEPS"],
    ["PUSH_UP", "CHEST"],
    ["BARBELL_BENCH_PRESS", "CHEST"],
    ["SEATED_LEG_CURL", "HAMSTRINGS"],
    ["DUMBBELL_ROMANIAN_DEADLIFT", "HAMSTRINGS"],
    ["DUMBBELL_REVERSE_LUNGE", "QUADS"],
    ["BULGARIAN_SPLIT_SQUAT", "QUADS"],
    ["GLUTE_BRIDGE", "GLUTES"],
    ["DUMBBELL_BICEPS_CURL", "BICEPS"],
    ["STANDING_CALF_RAISE", "CALVES"],
  ];
  for (const [code, muscle] of cases) {
    assert.equal(resolveMuscleGroupKey({ exercise_code: code }), muscle, code);
  }
});

test("a beginner's week is judged by a beginner's table", async () => {
  const { volumeLandmarksFor } = await import("../src/api/utils/trainingNutritionCoupling.js");
  const intermediate = volumeLandmarksFor("INTERMEDIATE");
  const beginner = volumeLandmarksFor("BEGINNER");
  assert.equal(intermediate.CHEST.mev, 8);
  assert.ok(beginner.CHEST.mev < intermediate.CHEST.mev, `${beginner.CHEST.mev} against ${intermediate.CHEST.mev}`);
  assert.ok(beginner.CHEST.mev >= 3, "a beginner still trains the muscle");
  // The same week reads short against the wrong table and fine against its own.
  const week = weekOf({ days: 3, experience: "beginner" });
  const strict = auditWeeklyMuscleVolume(week, "INTERMEDIATE").warnings.length;
  const fair = auditWeeklyMuscleVolume(week, "BEGINNER").warnings.length;
  assert.ok(fair < strict, `${fair} warnings against ${strict}`);
});

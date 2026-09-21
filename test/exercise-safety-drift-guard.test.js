import test from "node:test";
import assert from "node:assert/strict";

import { JOINT_STRESS_BY_NAME as CLIENT_RULES, exerciseConflicts } from "../frontend/src/utils/exerciseSafety.js";
import { getExerciseJointStress, SMART_EXERCISE_SWAP_REGISTRY } from "../src/exercise-swap-engine/smart-exercise-swap-registry.js";

/** The coach editor's exercise warnings use the same joint rules as the server swap engine. */
test("the coach editor's joint rules match the swap engine's for every known exercise", () => {
  const codes = Object.keys(SMART_EXERCISE_SWAP_REGISTRY).concat(["BACK_EXTENSION_45", "PIKE_PUSH_UP", "STEP_UP", "ARNOLD_DUMBBELL_PRESS"]);
  for (const code of codes) {
    const server = getExerciseJointStress(code).filter((joint) => CLIENT_RULES[joint]);
    for (const joint of Object.keys(CLIENT_RULES)) {
      if (CLIENT_RULES[joint].test(code)) assert.ok(server.includes(joint), `${code} ${joint}`);
    }
  }
});

test("the coach is warned when a pick loads an injured joint or needs missing equipment", () => {
  const profile = { injuries: ["knee"], training_environment: "calisthenics_bands" };
  assert.ok(exerciseConflicts("BARBELL_BACK_SQUAT", profile).length >= 2);
  assert.deepEqual(exerciseConflicts("BODYWEIGHT_GLUTE_BRIDGE", profile), []);
  assert.deepEqual(exerciseConflicts("BARBELL_BACK_SQUAT", {}), []);
});

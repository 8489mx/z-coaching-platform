import test from "node:test";
import assert from "node:assert/strict";

import { resolveFocusMuscleBias } from "../src/master-engine-v2/build-master-engine-v2.js";
import { buildTrainingMesoCycle } from "../src/training-engine-v2/index.js";
import { adaptIntakePayloadToCanonicalEngine } from "../src/intake-decision-engine/adapters/intake-adapter.js";
import { evaluateIntake } from "z-coaching-intake-decision-engine";
import { COMPLETE_INTAKE } from "./fixtures/complete-intake.js";

test("the priority muscles picked in the intake become catalog muscle codes", () => {
  assert.equal(resolveFocusMuscleBias({}), null);
  // the form sends lowercase keys in the raw answers
  assert.deepEqual(resolveFocusMuscleBias({ focus_muscles: ["arms", "glutes_legs"] }), ["BICEPS", "TRICEPS", "GLUTES", "QUADS", "HAMSTRINGS"]);
  assert.equal(resolveFocusMuscleBias({}, { training: { targetFocusMuscles: [] } }), null);
  assert.deepEqual(resolveFocusMuscleBias({}, { training: { targetFocusMuscles: ["UPPER_CHEST"] } }), ["UPPER_CHEST"]);
  assert.deepEqual(resolveFocusMuscleBias({}, { training: { targetFocusMuscles: ["LATS_WIDTH"] } }), ["LATS"]);
  assert.deepEqual(resolveFocusMuscleBias({}, { training: { targetFocusMuscles: ["ARMS"] } }), ["BICEPS", "TRICEPS"]);
  assert.deepEqual(resolveFocusMuscleBias({}, { training: { targetFocusMuscles: ["GLUTES_LEGS"] } }), ["GLUTES", "QUADS", "HAMSTRINGS"]);
  // The form allows two picks; anything beyond that, or an unknown value, is ignored.
  assert.deepEqual(resolveFocusMuscleBias({}, { training: { targetFocusMuscles: ["ARMS", "SIDE_DELTS", "UPPER_CHEST"] } }), ["BICEPS", "TRICEPS", "SIDE_DELTS"]);
  assert.equal(resolveFocusMuscleBias({}, { training: { targetFocusMuscles: ["SOMETHING_ELSE"] } }), null);
});

const countSets = (program, muscleCodes, catalog) =>
  program.weeks.flatMap((w) => w.sessions).flatMap((s) => s.exercises)
    .filter((e) => {
      const rec = catalog(e.exercise_code || e.code);
      return rec && (muscleCodes.includes(rec.primary_muscle) || rec.secondary_muscles.some((m) => muscleCodes.includes(m)));
    })
    .reduce((sum, e) => sum + Number(e.sets || e.set_count || 0), 0);

test("a client who prioritises arms gets more arm sets than the same client with no priority", async () => {
  const { getExerciseV2ByCode } = await import("../src/exercise-catalog-v2/exercise-catalog-v2.js");
  const ctx = Object.freeze({ system_time: "2026-09-20T08:00:00.000Z", assessmentDate: "2026-09-20" });
  const decision = evaluateIntake(adaptIntakePayloadToCanonicalEngine(COMPLETE_INTAKE), ctx);

  const plain = buildTrainingMesoCycle(decision, { weeksCount: 5 });
  const armsFirst = buildTrainingMesoCycle(decision, { weeksCount: 5, muscleBias: ["BICEPS", "TRICEPS"] });

  const arms = ["BICEPS", "TRICEPS"];
  const before = countSets(plain, arms, getExerciseV2ByCode);
  const after = countSets(armsFirst, arms, getExerciseV2ByCode);
  assert.ok(before > 0, "the fixture plan already trains arms");
  assert.ok(after > before, `arm sets should rise: ${before} -> ${after}`);
  assert.deepEqual(armsFirst.muscle_bias, arms);

  // A single muscle code still works exactly as before.
  const single = buildTrainingMesoCycle(decision, { weeksCount: 5, muscleBias: "QUADS" });
  assert.equal(single.muscle_bias, "QUADS");
  assert.ok(countSets(single, ["QUADS"], getExerciseV2ByCode) > countSets(plain, ["QUADS"], getExerciseV2ByCode));
});

test("the whole path works: the form value reaches the built plan", async () => {
  const fs = await import("node:fs/promises");
  const { buildMasterEngineV2 } = await import("../src/master-engine-v2/index.js");
  const catalog = JSON.parse(await fs.readFile(new URL("../data/catalogs/core-global-food-batch-v1.json", import.meta.url), "utf8"));
  const ctx = Object.freeze({ system_time: "2026-09-20T08:00:00.000Z", assessmentDate: "2026-09-20" });
  // The API hands the engine the raw stored answers, exactly like generateDraftFromIntake does.
  const program = buildMasterEngineV2({ intake: { ...COMPLETE_INTAKE, focus_muscles: ["arms"] }, evaluationContext: ctx, nutritionFoodCatalog: catalog, options: {} });
  assert.deepEqual(program.training_program.muscle_bias, ["BICEPS", "TRICEPS"]);
});

import test from "node:test";
import assert from "node:assert/strict";

import { evaluateIntake } from "../src/intake-decision-engine/index.js";
import {
  buildTrainingMesoCycle,
  TRAINING_ENGINE_V2_VERSION,
  MesoCyclePhase,
} from "../src/training-engine-v2/index.js";
import { completeIntake } from "./fixtures/complete-intake.js";

test("Training Engine V2 Meso-Cycle Suite", async (t) => {
  const validIntake = completeIntake();
  const evaluationContext = { assessmentDate: "2026-08-16" };
  const decision = evaluateIntake(validIntake, evaluationContext);

  await t.test("generates a 5-week periodized meso-cycle by default", () => {
    const meso = buildTrainingMesoCycle(decision);

    assert.equal(meso.engine_version, TRAINING_ENGINE_V2_VERSION);
    assert.equal(meso.total_weeks, 5);
    assert.equal(meso.weeks.length, 5);

    // Verify progression phases
    assert.equal(meso.weeks[0].phase, MesoCyclePhase.INTRO_ACCUMULATION);
    assert.equal(meso.weeks[0].target_rir, 3);

    assert.equal(meso.weeks[1].phase, MesoCyclePhase.PROGRESSIVE_OVERLOAD);
    assert.equal(meso.weeks[1].target_rir, 2);

    assert.equal(meso.weeks[2].phase, MesoCyclePhase.PROGRESSIVE_OVERLOAD);
    assert.equal(meso.weeks[2].target_rir, 1);

    assert.equal(meso.weeks[3].phase, MesoCyclePhase.PEAK_OVERLOAD);
    assert.equal(meso.weeks[3].target_rir, 0);

    assert.equal(meso.weeks[4].phase, MesoCyclePhase.DELOAD);
    assert.equal(meso.weeks[4].target_rir, 4);
  });

  await t.test("deload week reduces sets appropriately across exercises", () => {
    const meso = buildTrainingMesoCycle(decision);
    const deloadWeek = meso.weeks[4];

    for (const session of deloadWeek.sessions) {
      for (const exercise of session.exercises) {
        assert.equal(exercise.prescription.sets, 2);
        assert.equal(exercise.prescription.target_rir, 4);
      }
    }
  });

  await t.test("enriches exercises with Arabic names and muscle classifications", () => {
    const meso = buildTrainingMesoCycle(decision);
    const firstExercise = meso.weeks[0].sessions[0].exercises[0];

    assert.ok(firstExercise.exercise_code);
    assert.ok(typeof firstExercise.name_en === "string");
    // Some exercises matched in catalog have name_ar
    if (firstExercise.name_ar) {
      assert.ok(typeof firstExercise.name_ar === "string");
    }
  });

  await t.test("supports muscle bias customization", () => {
    const mesoBiased = buildTrainingMesoCycle(decision, { muscleBias: "QUADS" });
    assert.equal(mesoBiased.muscle_bias, "QUADS");
  });

  await t.test("returns empty weeks when base intake is withheld", () => {
    const withheldDecision = {
      ...decision,
      plan_status: "BLOCKED",
      training_decision: {
        ...decision.training_decision,
        recommended_days: 0,
      },
    };
    const mesoWithheld = buildTrainingMesoCycle(withheldDecision);
    assert.equal(mesoWithheld.total_weeks, 0);
    assert.equal(mesoWithheld.weeks.length, 0);
  });
});

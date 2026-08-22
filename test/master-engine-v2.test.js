import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { buildMasterEngineV2, MASTER_ENGINE_V2_VERSION } from "../src/master-engine-v2/index.js";
import { completeIntake, ASSESSMENT_CONTEXT } from "./fixtures/complete-intake.js";

const VALID_MINIMAL_PROFILE = completeIntake();

const evaluationContext = Object.freeze({
  system_time: new Date(ASSESSMENT_CONTEXT.assessmentDate).toISOString(),
  assessmentDate: ASSESSMENT_CONTEXT.assessmentDate,
});

const nutritionFoodCatalog = JSON.parse(
  fs.readFileSync(new URL("../data/catalogs/core-global-food-batch-v1.json", import.meta.url), "utf8"),
);

test("Master Engine V2 Pipeline Tests", async (t) => {
  await t.test("It generates a full Master Program V2 with meso-cycle, quantized meals, and cardio HR zones", () => {
    const inputs = {
      intake: VALID_MINIMAL_PROFILE,
      evaluationContext,
      nutritionFoodCatalog,
      options: {
        weeksCount: 5,
        muscleBias: "QUADS",
      },
    };

    const result = buildMasterEngineV2(inputs);

    // Validate structure
    assert.equal(result.engine_version, MASTER_ENGINE_V2_VERSION);
    assert.ok(result.intake_decision);
    assert.ok(result.training_program);
    assert.ok(result.cardio_program);
    assert.ok(result.mobility_program);
    assert.ok(result.nutrition_program);

    // V2 Specific features
    assert.equal(result.training_program.total_weeks, 5);
    assert.equal(result.training_program.muscle_bias, "QUADS");
    assert.ok(result.nutrition_program.quantized_plan);
    assert.equal(result.nutrition_program.quantized_plan.meals.length, 3);

    // Cardio HR Zones
    const firstCardioSession = result.cardio_program.weekly_schedule?.sessions?.[0];
    if (firstCardioSession) {
      assert.ok(firstCardioSession.heart_rate_target);
      assert.equal(firstCardioSession.heart_rate_target.zone, "ZONE_2");
      assert.ok(firstCardioSession.heart_rate_target.target_range_bpm.includes("BPM"));
    }
  });
});

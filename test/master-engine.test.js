import test from "node:test";
import assert from "node:assert/strict";
import { buildMasterEngine } from "../src/master-engine/index.js";

import { completeIntake, ASSESSMENT_CONTEXT } from "./fixtures/complete-intake.js";

const VALID_MINIMAL_PROFILE = completeIntake();

import { readFileSync } from "node:fs";

const evaluationContext = Object.freeze({
  system_time: new Date(ASSESSMENT_CONTEXT.assessmentDate).toISOString(),
  assessmentDate: ASSESSMENT_CONTEXT.assessmentDate,
});

const nutritionFoodCatalog = JSON.parse(
  readFileSync(new URL("../data/catalogs/core-global-food-batch-v1.json", import.meta.url), "utf8")
);

test("Master Engine Pipeline Tests", async (t) => {
  await t.test("It generates a full program for a healthy client", () => {
    const inputs = {
      intake: VALID_MINIMAL_PROFILE,
      evaluationContext,
      nutritionFoodCatalog
    };

    const result = buildMasterEngine(inputs);

    // Validate structure
    assert.equal(result.engine_version, "master-engine-v1");
    assert.ok(result.intake_decision);
    assert.ok(result.training_program);
    assert.ok(result.cardio_program);
    assert.ok(result.mobility_program);
    assert.ok(result.nutrition_program);

    // Preflight validations
    assert.equal(result.training_program.preflight_report.plan_status, "READY");
    assert.equal(result.cardio_program.preflight_report.result, "APPROVED");
    assert.equal(result.mobility_program.preflight_report.approval_state, "APPROVED");
    assert.equal(result.nutrition_program.stages.plan_preflight.status, "READY");
  });
});

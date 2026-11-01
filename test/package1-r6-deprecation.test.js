import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildMasterEngine } from "../src/master-engine/index.js";
import { completeIntake, ASSESSMENT_CONTEXT } from "./fixtures/complete-intake.js";

const VALID_MINIMAL_PROFILE = completeIntake();
const evaluationContext = Object.freeze({
  system_time: new Date(ASSESSMENT_CONTEXT.assessmentDate).toISOString(),
  assessmentDate: ASSESSMENT_CONTEXT.assessmentDate,
});
const nutritionFoodCatalog = JSON.parse(
  readFileSync(new URL("../data/catalogs/core-global-food-batch-v1.json", import.meta.url), "utf8")
);

test("R6: legacy buildMasterEngine v1 returns is_deprecated: true and preserves backwards test compatibility", () => {
  const result = buildMasterEngine({
    intake: VALID_MINIMAL_PROFILE,
    evaluationContext,
    nutritionFoodCatalog,
  });

  assert.equal(result.engine_version, "master-engine-v1");
  assert.equal(result.is_deprecated, true, "v1 engine result must carry is_deprecated flag");
});

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { evaluateIntake } from "z-coaching-intake-decision-engine";
import * as nutritionEngineApi from "z-coaching-intake-decision-engine/nutrition-engine";
import { buildNutritionEnergyTarget } from "z-coaching-intake-decision-engine/nutrition-energy-target";
import { buildNutritionPlanningSnapshot } from "z-coaching-intake-decision-engine/nutrition-planning-snapshot";

const { buildNutritionEngine, NutritionEngineStatus } = nutritionEngineApi;

function readJson(url) {
  return JSON.parse(readFileSync(url, "utf8"));
}

const BASE_INPUTS = Object.freeze({
  intake: readJson(new URL("../examples/full-intake.json", import.meta.url)),
  evaluationContext: readJson(
    new URL("../examples/evaluation-context.json", import.meta.url),
  ),
  nutritionFoodCatalog: readJson(
    new URL(
      "../data/catalogs/core-global-food-batch-v1.json",
      import.meta.url,
    ),
  ),
});

function reasonCodes(stage) {
  return (stage.reasons || []).map((reason) => reason.code);
}

// The golden READY shape from the nutrition-engine tests, but as a FIRST
// intake: no weight history and no measurement attestation. The public form
// never collects weightTrend or measurementQuality, so every real first
// plan arrives with both UNKNOWN.
function firstPlanInputs() {
  const inputs = structuredClone(BASE_INPUTS);
  inputs.intake.personal.sex = "MALE";
  inputs.intake.nutrition.preferredMealCount = 2;
  inputs.intake.body.weightKg = 50;
  inputs.intake.body.heightCm = 155;
  inputs.intake.lifestyle.dailyActivity = "SEDENTARY";
  inputs.intake.body.weightTrend = "UNKNOWN";
  inputs.intake.body.measurementQuality = "UNKNOWN";
  return inputs;
}

function energyTargetFor(inputs) {
  const intakeDecision = evaluateIntake(
    inputs.intake,
    inputs.evaluationContext,
  );
  const snapshot = buildNutritionPlanningSnapshot({
    intake: inputs.intake,
    evaluationContext: inputs.evaluationContext,
    intakeDecision,
  });
  return {
    intakeDecision,
    snapshot,
    target: buildNutritionEnergyTarget(snapshot),
  };
}

test("a clean first plan reaches READY: unknown trend/quality is absence of follow-up data, not evidence against the estimate", () => {
  const inputs = firstPlanInputs();
  const result = buildNutritionEngine(inputs);

  assert.equal(result.stages.intake_decision.plan_status, "READY_FOR_DRAFT");
  assert.equal(
    result.stages.planning_snapshot.goal.decision_confidence,
    "MEDIUM",
  );
  assert.equal(result.stages.energy_target.status, "READY");
  // The first estimate stays conservative (10% deficit, not 15%) and still
  // carries its calibration obligation — only the blanket hold is gone.
  assert.equal(result.stages.energy_target.adjustment_percent, 10);
  assert.equal(result.stages.energy_target.calibration_required, true);
  assert.ok(
    reasonCodes(result.stages.energy_target).includes("CALIBRATION_REQUIRED"),
  );
  assert.equal(
    reasonCodes(result.stages.energy_target).includes(
      "LOW_NUTRITION_DECISION_CONFIDENCE",
    ),
    false,
  );
  assert.equal(result.stages.plan_preflight.status, "READY");
  assert.equal(result.status, NutritionEngineStatus.READY);
});

test("an explicitly unreliable measurement still holds the first plan", () => {
  const inputs = firstPlanInputs();
  inputs.intake.body.weightTrend = "STABLE";
  inputs.intake.body.measurementQuality = "LOW";
  const { snapshot, target } = energyTargetFor(inputs);

  assert.equal(snapshot.goal.decision_confidence, "LOW");
  assert.equal(target.status, "PROVISIONAL_REVIEW_REQUIRED");
  assert.ok(
    reasonCodes(target).includes("LOW_NUTRITION_DECISION_CONFIDENCE"),
  );
});

test("a first plan with unknown trend and explicitly low measurement quality is held, not served", () => {
  const inputs = firstPlanInputs();
  inputs.intake.body.measurementQuality = "LOW";
  const { snapshot, target } = energyTargetFor(inputs);

  assert.equal(snapshot.goal.decision_confidence, "LOW");
  assert.equal(target.status, "PROVISIONAL_REVIEW_REQUIRED");
  assert.ok(
    reasonCodes(target).includes("LOW_NUTRITION_DECISION_CONFIDENCE"),
  );
});

test("a coach-review decision still holds the first plan even when confidence is medium", () => {
  const inputs = firstPlanInputs();
  inputs.intake.nutrition.allergies = [
    { substance: "SESAME", medicallyConfirmed: false },
  ];
  const { intakeDecision, target } = energyTargetFor(inputs);

  assert.equal(intakeDecision.plan_status, "COACH_REVIEW_REQUIRED");
  assert.equal(target.status, "PROVISIONAL_REVIEW_REQUIRED");
  assert.ok(
    reasonCodes(target).includes("UPSTREAM_COACH_REVIEW_REQUIRED"),
  );
  const result = buildNutritionEngine(inputs);
  assert.equal(result.status, NutritionEngineStatus.REVIEW_REQUIRED);
});

test("a known trend with high-quality measurement is still full confidence", () => {
  const inputs = firstPlanInputs();
  inputs.intake.body.weightTrend = "STABLE";
  inputs.intake.body.measurementQuality = "HIGH";
  const { snapshot, target } = energyTargetFor(inputs);

  assert.equal(snapshot.goal.decision_confidence, "HIGH");
  assert.equal(target.status, "READY");
  // 10%, not 15%: this fixture client never trained, so the intro-week
  // conservative adjustment still applies — confidence and adjustment are
  // independent gates, and the 15% path is pinned by the existing tests.
  assert.equal(target.adjustment_percent, 10);
  assert.equal(target.calibration_required, true);
});

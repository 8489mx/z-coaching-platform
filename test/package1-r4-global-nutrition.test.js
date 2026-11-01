import test from "node:test";
import assert from "node:assert/strict";
import { Scope } from "../src/intake-decision-engine/domain/enums.js";
import { evaluateIntake } from "../src/intake-decision-engine/index.js";
import { buildNutritionPlanningSnapshot } from "../src/nutrition-planning-snapshot/index.js";
import { COMPLETE_INTAKE, ASSESSMENT_CONTEXT } from "./fixtures/complete-intake.js";

test("R4: GLOBAL hard constraints appear in nutrition_decision.constraints", () => {
  const intake = structuredClone(COMPLETE_INTAKE);
  intake.training.medicalMovementRestrictions = [
    {
      movement: "OVERHEAD",
      instruction: "AVOID",
      source: "PHYSICIAN",
    },
  ];

  const decision = evaluateIntake(intake, ASSESSMENT_CONTEXT);

  // Hard constraints at root should have the GLOBAL constraint
  const hasGlobalAtRoot = decision.hard_constraints.some(
    (c) => c.code === "MEDICAL_MOVEMENT_RESTRICTION" && c.scope === Scope.GLOBAL
  );
  assert.equal(hasGlobalAtRoot, true, "Root hard constraints must include the GLOBAL constraint");

  // Nutrition decision constraints must ALSO include the GLOBAL constraint
  const nutritionConstraint = decision.nutrition_decision.constraints.find(
    (c) => c.code === "MEDICAL_MOVEMENT_RESTRICTION"
  );
  assert.ok(
    nutritionConstraint,
    "R4: nutrition_decision.constraints must include GLOBAL constraints (NUTRITION exception removed)"
  );
  assert.equal(nutritionConstraint.scope, Scope.GLOBAL);
});

test("R4: downstream nutrition planning snapshot preserves GLOBAL constraints in nutrition_constraints", () => {
  const intake = structuredClone(COMPLETE_INTAKE);
  intake.training.medicalMovementRestrictions = [
    {
      movement: "SQUAT",
      instruction: "AVOID",
      source: "PHYSICIAN",
    },
  ];

  const decision = evaluateIntake(intake, ASSESSMENT_CONTEXT);
  const snapshot = buildNutritionPlanningSnapshot({
    intake,
    evaluationContext: ASSESSMENT_CONTEXT,
    intakeDecision: decision,
  });

  const snapshotNutritionConstraint = snapshot.decision_context.nutrition_constraints.find(
    (c) => c.code === "MEDICAL_MOVEMENT_RESTRICTION"
  );
  assert.ok(
    snapshotNutritionConstraint,
    "R4: snapshot.decision_context.nutrition_constraints must contain the GLOBAL constraint"
  );
  assert.equal(snapshotNutritionConstraint.scope, Scope.GLOBAL);
});

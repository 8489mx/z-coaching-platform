import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildClientTargets } from "../src/api/utils/calculateClientTargets.js";
import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { completeIntake, ASSESSMENT_CONTEXT } from "./fixtures/complete-intake.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(
  fs.readFileSync(path.join(root, "data/catalogs/core-global-food-batch-v1.json"), "utf8")
);
const EVALUATION_CONTEXT = {
  system_time: new Date(ASSESSMENT_CONTEXT.assessmentDate).toISOString(),
  assessmentDate: ASSESSMENT_CONTEXT.assessmentDate,
};

const TARGET_KEYS = [
  "target_calories_kcal",
  "protein_g",
  "carb_g",
  "fat_g",
  "water_liters",
  "bmr",
  "tdee",
  "activity_factor",
  "diet_framework",
];

test("R3: Parity between buildClientTargets (target-calculation path) and buildMasterEngineV2 on standard intake", () => {
  const answers = completeIntake();
  const evaluationDate = ASSESSMENT_CONTEXT.assessmentDate;

  // 1. Target calculation path
  const calcResult = buildClientTargets({
    answers,
    measurements: {
      weight_kg: answers.body.weightKg,
      height_cm: answers.body.heightCm,
    },
    assessmentDate: evaluationDate,
  });

  // 2. Master V2 build path
  const masterResult = buildMasterEngineV2({
    intake: answers,
    evaluationContext: {
      system_time: new Date(evaluationDate).toISOString(),
      assessmentDate: evaluationDate,
    },
    nutritionFoodCatalog: CATALOG,
    options: { weeksCount: 5 },
  });

  const masterTargets = masterResult.nutrition_program.targets;
  const masterDecision = masterResult.intake_decision;

  // Assert nutrition targets parity
  for (const key of TARGET_KEYS) {
    assert.deepEqual(
      calcResult.targets[key],
      masterTargets[key],
      `Parity mismatch on target key '${key}': ${calcResult.targets[key]} vs ${masterTargets[key]}`
    );
  }

  // Assert decision status and constraints parity
  assert.equal(
    calcResult.plan_status,
    masterDecision.plan_status,
    "Plan status must match between target calculation path and master V2 path"
  );

  const calcConstraints = (calcResult.hard_constraints || []).map((c) => c.code).sort();
  const masterConstraints = (masterDecision.hard_constraints || []).map((c) => c.code).sort();
  assert.deepEqual(
    calcConstraints,
    masterConstraints,
    "Hard constraints must match exactly between target calculation path and master V2 path"
  );
});

test("R3: Parity on eligible clinical profile (PCOS / Insulin Resistance)", () => {
  const answers = {
    ...completeIntake(),
    medical: {
      ...completeIntake().medical,
      hasPcos: true,
      hasInsulinResistance: true,
    },
  };
  const evaluationDate = ASSESSMENT_CONTEXT.assessmentDate;

  const calcResult = buildClientTargets({
    answers,
    measurements: {
      weight_kg: answers.body.weightKg,
      height_cm: answers.body.heightCm,
    },
    assessmentDate: evaluationDate,
  });

  const masterResult = buildMasterEngineV2({
    intake: answers,
    evaluationContext: {
      system_time: new Date(evaluationDate).toISOString(),
      assessmentDate: evaluationDate,
    },
    nutritionFoodCatalog: CATALOG,
    options: { weeksCount: 5 },
  });

  const masterTargets = masterResult.nutrition_program.targets;
  for (const key of TARGET_KEYS) {
    assert.deepEqual(
      calcResult.targets[key],
      masterTargets[key],
      `Clinical parity mismatch on '${key}'`
    );
  }

  assert.equal(
    calcResult.targets.diet_framework,
    "TARGETED_LOW_CARB",
    "PCOS must resolve to TARGETED_LOW_CARB on both paths"
  );
  assert.equal(
    masterTargets.diet_framework,
    "TARGETED_LOW_CARB",
    "PCOS must resolve to TARGETED_LOW_CARB on master path"
  );
});

test("R3: Both paths agree on MEDICAL_REVIEW_REQUIRED for high-risk clinical intake (Type 1 Diabetes)", () => {
  const answers = {
    ...completeIntake(),
    medical: {
      ...completeIntake().medical,
      conditions: [{ conditionCode: "TYPE_1_DIABETES" }],
    },
  };
  const evaluationDate = ASSESSMENT_CONTEXT.assessmentDate;

  // Master V2 build path flags MEDICAL_REVIEW_REQUIRED in intake_decision
  const masterResult = buildMasterEngineV2({
    intake: answers,
    evaluationContext: {
      system_time: new Date(evaluationDate).toISOString(),
      assessmentDate: evaluationDate,
    },
    nutritionFoodCatalog: CATALOG,
    options: { weeksCount: 5 },
  });
  assert.equal(
    masterResult.intake_decision.plan_status,
    "MEDICAL_REVIEW_REQUIRED",
    "Master engine V2 must evaluate Type 1 diabetes to MEDICAL_REVIEW_REQUIRED"
  );

  // Target calculation path refuses with matching MEDICAL_REVIEW_REQUIRED code
  assert.throws(
    () => {
      buildClientTargets({
        answers,
        measurements: {
          weight_kg: answers.body.weightKg,
          height_cm: answers.body.heightCm,
        },
        assessmentDate: evaluationDate,
      });
    },
    (err) => err.code === "MEDICAL_REVIEW_REQUIRED"
  );
});

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(
  fs.readFileSync(path.join(root, "data/catalogs/core-global-food-batch-v1.json"), "utf8")
);
const EVALUATION_CONTEXT = {
  system_time: "2026-07-14T00:00:00.000Z",
  assessmentDate: "2026-07-14",
};

test("S2-5: manual INTERMITTENT_FASTING choice is rejected for Type 1 diabetic and raises conflict flag", () => {
  const intake = {
    primary_goal: "FAT_LOSS",
    gender: "male",
    date_of_birth: "1990-01-15",
    weight_kg: 85,
    height_cm: 180,
    training_logistics: { days_per_week: 3, experience_level: "beginner" },
    recent_training: "ACTIVE",
    training_environment: "commercial_gym",
    nutrition: {
      dietFramework: "INTERMITTENT_FASTING",
    },
    medical_conditions: {
      selected: ["diabetes"],
      diabetes: {
        type: "type1",
        uses_insulin: true,
      },
    },
  };

  const program = buildMasterEngineV2({
    intake,
    evaluationContext: EVALUATION_CONTEXT,
    nutritionFoodCatalog: CATALOG,
  });

  const targets = program.nutrition_program?.targets;
  assert.ok(targets, "Nutrition targets must be present");

  // Safety gate: Intermittent fasting must NOT be applied to Type 1 Diabetic
  assert.notEqual(
    targets.diet_framework,
    "INTERMITTENT_FASTING",
    "INTERMITTENT_FASTING must not be blindly applied to Type 1 diabetic"
  );

  const conflict = targets.diet_framework_conflict;
  assert.ok(conflict, "A diet_framework_conflict object must be raised");
  assert.equal(conflict.rejected_choice, "INTERMITTENT_FASTING");
  assert.equal(conflict.coach_review_required, true);
  assert.equal(conflict.reason, "CLINICAL_CONTRAINDICATION_DIABETES");
  assert.ok(conflict.reason_ar.includes("السكري"), "reason_ar must explain the diabetes conflict");
});

test("S2-5: healthy client with no contraindications gets requested dietFramework without conflict", () => {
  const intake = {
    primary_goal: "FAT_LOSS",
    gender: "male",
    date_of_birth: "1990-01-15",
    weight_kg: 85,
    height_cm: 180,
    training_logistics: { days_per_week: 3, experience_level: "beginner" },
    recent_training: "ACTIVE",
    training_environment: "commercial_gym",
    nutrition: {
      dietFramework: "INTERMITTENT_FASTING",
    },
    medical_conditions: {
      selected: [],
    },
  };

  const program = buildMasterEngineV2({
    intake,
    evaluationContext: EVALUATION_CONTEXT,
    nutritionFoodCatalog: CATALOG,
  });

  const targets = program.nutrition_program?.targets;
  assert.ok(targets, "Nutrition targets must be present");
  assert.equal(targets.diet_framework, "INTERMITTENT_FASTING");
  assert.equal(targets.diet_framework_conflict, null);
});

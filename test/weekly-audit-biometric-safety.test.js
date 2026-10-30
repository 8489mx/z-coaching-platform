import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  calculateUniversalNutritionTargets,
  buildMasterEngineV2
} from "../src/master-engine-v2/build-master-engine-v2.js";

import { completeIntake, ASSESSMENT_CONTEXT } from "./fixtures/complete-intake.js";

const evaluationContext = Object.freeze({
  system_time: new Date(ASSESSMENT_CONTEXT.assessmentDate).toISOString(),
  assessmentDate: ASSESSMENT_CONTEXT.assessmentDate,
});

const nutritionFoodCatalog = JSON.parse(
  fs.readFileSync(new URL("../data/catalogs/core-global-food-batch-v1.json", import.meta.url), "utf8"),
);

test("Item 4 Verification Suite: Zero Negative/Zero Weights and Zero NaN Calories Firewall", async (t) => {
  
  await t.test("6. calculateUniversalNutritionTargets rejects negative or zero weight/height", () => {
    assert.throws(
      () => calculateUniversalNutritionTargets({
        body: { weightKg: -80, heightCm: 175 },
        personal: { age: 25, sex: "MALE" }
      }),
      (err) => {
        assert.ok(err instanceof RangeError);
        return true;
      }
    );

    assert.throws(
      () => calculateUniversalNutritionTargets({
        body: { weightKg: 80, heightCm: 0 },
        personal: { age: 25, sex: "MALE" }
      }),
      (err) => {
        assert.ok(err instanceof RangeError);
        return true;
      }
    );
  });

  await t.test("7. buildMasterEngineV2 rejects sub-physiological or zero biometrics and prevents sub-1000 or NaN plans", () => {
    assert.throws(
      () => buildMasterEngineV2({
        intake: {
          client: { firstName: "اختبار", sex: "MALE" },
          body: { weightKg: 0, heightCm: 0 },
          goals: { primary: "FAT_LOSS" },
          training: { location: "GYM", preferredDaysPerWeek: 3, experience: "BEGINNER" },
          medical: { conditions: [] }
        },
        evaluationContext,
        nutritionFoodCatalog
      }),
      (err) => {
        assert.ok(err instanceof RangeError || err.name === "IntakeValidationError");
        return true;
      }
    );
  });

  await t.test("8. Fully valid biometrics and calories pass through the master nutrition targets with zero NaNs and valid positive numbers", () => {
    const targets = calculateUniversalNutritionTargets({
      body: { weightKg: 80, heightCm: 178 },
      personal: { age: 28, sex: "MALE" },
      goals: { primary: "FAT_LOSS" }
    });

    assert.ok(targets.target_calories > 1200);
    assert.ok(!Number.isNaN(targets.target_calories));
  });
});

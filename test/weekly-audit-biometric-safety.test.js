import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  evaluateWeeklyCheckinAudit,
  evaluateWeeklyProgress,
  CHECKIN_DECISION_CODES
} from "../src/execution-engines/weekly-audit-engine.js";

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
  
  await t.test("1. evaluateWeeklyCheckinAudit rejects negative current weight (e.g. -80kg) instead of calculating fake EXCELLENT_PROGRESS", () => {
    assert.throws(
      () => evaluateWeeklyCheckinAudit({
        clientProfile: { name: "أحمد", current_daily_calories: 2000, protein_g: 160, carbs_g: 220, fat_g: 50 },
        previousWeekData: { weight_kg: 80.0, waist_cm: 85.0 },
        currentCheckin: { current_weight_kg: -80, waist_circumference_cm: 80, overall_adherence_percent: 95 }
      }),
      (err) => {
        assert.ok(err instanceof RangeError);
        assert.ok(err.message.includes("غير صالحة"));
        return true;
      }
    );
  });

  await t.test("2. evaluateWeeklyCheckinAudit rejects zero or sub-physiological weight (<=20kg)", () => {
    assert.throws(
      () => evaluateWeeklyCheckinAudit({
        clientProfile: { name: "أحمد", current_daily_calories: 2000 },
        previousWeekData: { weight_kg: 80.0 },
        currentCheckin: { current_weight_kg: 0 }
      }),
      (err) => {
        assert.ok(err instanceof RangeError);
        return true;
      }
    );

    assert.throws(
      () => evaluateWeeklyCheckinAudit({
        clientProfile: { name: "أحمد", current_daily_calories: 2000 },
        previousWeekData: { weight_kg: 80.0 },
        currentCheckin: { current_weight_kg: 15 }
      }),
      (err) => {
        assert.ok(err instanceof RangeError);
        return true;
      }
    );
  });

  await t.test("3. evaluateWeeklyCheckinAudit rejects missing or undefined current_daily_calories instead of returning NaN", () => {
    assert.throws(
      () => evaluateWeeklyCheckinAudit({
        clientProfile: { name: "أحمد" }, // current_daily_calories missing
        previousWeekData: { weight_kg: 80.0 },
        currentCheckin: { current_weight_kg: 79.0, waist_circumference_cm: 84.0, overall_adherence_percent: 95 }
      }),
      (err) => {
        assert.ok(err instanceof TypeError || err instanceof RangeError);
        return true;
      }
    );
  });

  await t.test("4. evaluateWeeklyProgress rejects negative or zero weight", () => {
    assert.throws(
      () => evaluateWeeklyProgress({
        currentWeightKg: -75,
        previousWeightKg: 80,
        currentWaistCm: 80,
        previousWaistCm: 82,
        adherenceRatePct: 95,
        currentCalories: 2000
      }),
      (err) => {
        assert.ok(err instanceof RangeError);
        return true;
      }
    );

    assert.throws(
      () => evaluateWeeklyProgress({
        currentWeightKg: 80,
        previousWeightKg: 0,
        currentWaistCm: 80,
        previousWaistCm: 82,
        adherenceRatePct: 95,
        currentCalories: 2000
      }),
      (err) => {
        assert.ok(err instanceof RangeError);
        return true;
      }
    );
  });

  await t.test("5. evaluateWeeklyProgress rejects undefined calories instead of returning NaN new_calories", () => {
    assert.throws(
      () => evaluateWeeklyProgress({
        currentWeightKg: 80,
        previousWeightKg: 80,
        currentWaistCm: 85,
        previousWaistCm: 85,
        adherenceRatePct: 95,
        weeksOnCurrentCalories: 2,
        goalType: "FAT_LOSS"
        // currentCalories omitted
      }),
      (err) => {
        assert.ok(err instanceof TypeError || err instanceof RangeError);
        return true;
      }
    );
  });

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

  await t.test("8. Fully valid biometrics and calories pass through all engines with zero NaNs and valid positive numbers", () => {
    const checkinRes = evaluateWeeklyCheckinAudit({
      clientProfile: { name: "أحمد", current_daily_calories: 2000, protein_g: 160, carbs_g: 220, fat_g: 50 },
      previousWeekData: { weight_kg: 80.0, waist_cm: 85.0 },
      currentCheckin: { current_weight_kg: 79.4, waist_circumference_cm: 84.0, overall_adherence_percent: 95 }
    });

    assert.equal(checkinRes.decision_code, CHECKIN_DECISION_CODES.EXCELLENT_PROGRESS);
    assert.equal(checkinRes.next_week_calories, 2000);
    assert.ok(!Number.isNaN(checkinRes.next_week_calories));

    const progressRes = evaluateWeeklyProgress({
      currentWeightKg: 79.4,
      previousWeightKg: 80.0,
      currentWaistCm: 84.0,
      previousWaistCm: 85.0,
      adherenceRatePct: 95,
      currentCalories: 2000,
      goalType: "FAT_LOSS"
    });

    assert.equal(progressRes.new_calories, 2000);
    assert.ok(!Number.isNaN(progressRes.new_calories));

    const targets = calculateUniversalNutritionTargets({
      body: { weightKg: 80, heightCm: 178 },
      personal: { age: 28, sex: "MALE" },
      goals: { primary: "FAT_LOSS" }
    });

    assert.ok(targets.target_calories > 1200);
    assert.ok(!Number.isNaN(targets.target_calories));
  });
});

import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { calculateUniversalNutritionTargets } from "../src/master-engine-v2/build-master-engine-v2.js";
import { estimateAdaptiveTdee } from "../src/checkin-engine/adaptive-tdee.js";
import { mergeAdaptedPlanIntoProgram } from "../src/api/utils/planMergeEngine.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("Stage 3 - S3-1: Calorie floor is absolute and unbreakable (1200 kcal female / 1500 kcal male)", () => {
  // 1. Female trainee with tiny body & low TDEE: target must never breach 1200 kcal
  const femaleSmallClient = {
    body: { weightKg: 42, heightCm: 148, bodyFat: 28 },
    personal: { sex: "FEMALE", dateOfBirth: "1985-01-01" },
    goals: { primaryGoal: "FAT_LOSS" },
    nutrition: { activityLevel: "sedentary" }
  };
  const femaleTargets = calculateUniversalNutritionTargets(femaleSmallClient);
  assert.ok(femaleTargets.target_calories >= 1200, `Female target (${femaleTargets.target_calories}) must be >= 1200 kcal`);
  assert.equal(femaleTargets.target_calories, 1200, "Should be locked at 1200 kcal absolute floor");

  // 2. Male trainee with low TDEE: target must never breach 1500 kcal
  const maleSmallClient = {
    body: { weightKg: 50, heightCm: 155, bodyFat: 20 },
    personal: { sex: "MALE", dateOfBirth: "1975-01-01" },
    goals: { primaryGoal: "FAT_LOSS" },
    nutrition: { activityLevel: "sedentary" }
  };
  const maleTargets = calculateUniversalNutritionTargets(maleSmallClient);
  assert.ok(maleTargets.target_calories >= 1500, `Male target (${maleTargets.target_calories}) must be >= 1500 kcal`);
  assert.equal(maleTargets.target_calories, 1500, "Should be locked at 1500 kcal absolute floor");
});

test("Stage 3 - S3-1: Adaptive TDEE check-in engine respects unbreakable calorie floor", () => {
  // Female with low observed intake & weight stall
  const femaleCheckin = estimateAdaptiveTdee({
    weeks: [
      { week_number: 1, weight_kg: 48, mean_intake_kcal: 1100, adherence_percent: 95 },
      { week_number: 2, weight_kg: 48, mean_intake_kcal: 1050, adherence_percent: 95 },
      { week_number: 3, weight_kg: 48, mean_intake_kcal: 1000, adherence_percent: 95 },
    ],
    is_female: true,
    primary_goal: "FAT_LOSS",
    current_target_kcal: 1200,
  });

  if (femaleCheckin.ready) {
    assert.ok(femaleCheckin.recommended_target_kcal >= 1200, "Female adaptive TDEE target must be >= 1200 kcal");
  }

  // Male with low observed intake
  const maleCheckin = estimateAdaptiveTdee({
    weeks: [
      { week_number: 1, weight_kg: 58, mean_intake_kcal: 1400, adherence_percent: 95 },
      { week_number: 2, weight_kg: 58, mean_intake_kcal: 1350, adherence_percent: 95 },
      { week_number: 3, weight_kg: 58, mean_intake_kcal: 1300, adherence_percent: 95 },
    ],
    is_female: false,
    primary_goal: "FAT_LOSS",
    current_target_kcal: 1500,
  });

  if (maleCheckin.ready) {
    assert.ok(maleCheckin.recommended_target_kcal >= 1500, "Male adaptive TDEE target must be >= 1500 kcal");
  }
});

test("Stage 3 - S3-1: Coach manual override has NO sub-floor bypass (only coach_override_protein_g is allowed)", () => {
  const baseProgram = {
    client_profile: { gender: "female", weight_kg: 60, age: 30 },
    nutrition_program: {
      targets: {
        target_calories: 1400,
        protein_g: 120,
        carb_g: 130,
        fat_g: 45,
        tdee: 1600,
        protein_reference_weight_kg: 60,
        protein_reference_basis: "TOTAL_BODY_WEIGHT",
        clinical_guardrails: {},
      },
      macro_targets: { calories_kcal: 1400, protein_g: 120, carbohydrate_g: 130, fat_g: 45 },
    },
  };

  // 1. Attempting custom sub-floor calories for female (e.g. 1100 kcal) is strictly rejected
  assert.throws(
    () => mergeAdaptedPlanIntoProgram(baseProgram, {}, { calories: 1100, protein: 100, carbs: 100, fats: 30 }),
    (err) => {
      assert.equal(err.code, "CUSTOM_MACROS_OUT_OF_RANGE");
      assert.ok(err.message.includes("1200"), "Error message must cite 1200 kcal female floor");
      return true;
    }
  );

  // 2. Male sub-floor calories (e.g. 1400 kcal) is strictly rejected
  const maleProgram = structuredClone(baseProgram);
  maleProgram.client_profile.gender = "male";
  assert.throws(
    () => mergeAdaptedPlanIntoProgram(maleProgram, {}, { calories: 1400, protein: 120, carbs: 140, fats: 40 }),
    (err) => {
      assert.equal(err.code, "CUSTOM_MACROS_OUT_OF_RANGE");
      assert.ok(err.message.includes("1500"), "Error message must cite 1500 kcal male floor");
      return true;
    }
  );

  // 3. Protein override for kidney cap works without modifying calorie floor
  const kidneyProgram = structuredClone(baseProgram);
  kidneyProgram.nutrition_program.targets.clinical_guardrails = {
    kidney_protein_capped: true,
    max_protein_g: 50,
    coach_override_protein_g: 65,
  };
  const merged = mergeAdaptedPlanIntoProgram(kidneyProgram, { suggested_calorie_delta: 0 });
  assert.equal(merged.nutrition_program.targets.protein_g, 65, "Documented coach_override_protein_g should be respected");
  assert.ok(merged.nutrition_program.targets.target_calories >= 1200, "Calorie floor must remain intact");
});

test("Stage 3 - Flat check-in form validation and numeric bounds", () => {
  const formPath = path.join(root, "frontend/src/pages/WeeklyCheckinForm.jsx");
  const formContent = fs.readFileSync(formPath, "utf8");

  // 1. Single-level flat form structure preserved (no wizard multi-page split)
  assert.ok(formContent.includes("WeeklyCheckinForm"), "WeeklyCheckinForm must exist");
  assert.ok(formContent.includes("cleanArabicNumStr"), "cleanArabicNumStr helper must be present");

  // 2. Weight numeric bounds [30, 350]
  assert.ok(formContent.includes("parsedWeight < 30 || parsedWeight > 350"), "Weight bounds 30-350 must be checked");
  assert.ok(formContent.includes("قيمة الوزن غير صالحة"), "Arabic error message for weight out of bounds");

  // 3. Waist circumference bounds [40, 220]
  assert.ok(formContent.includes("parsedWaist < 40 || parsedWaist > 220"), "Waist bounds 40-220 must be checked");

  // 4. Calories bounds [800, 10000]
  assert.ok(formContent.includes("parsedCal < 800 || parsedCal > 10000"), "Calorie bounds 800-10000 must be checked");

  // 5. Workouts completed bounds [0, 14]
  assert.ok(formContent.includes("parsedWorkouts < 0 || parsedWorkouts > 14"), "Workouts bounds 0-14 must be checked");

  // 6. Nutrition adherence bounds [0, 100]
  assert.ok(formContent.includes("parsedAdherence < 0 || parsedAdherence > 100"), "Adherence bounds 0-100 must be checked");
});

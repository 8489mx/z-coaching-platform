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

test("S2-6: when dateOfBirth is present, heart_rate_target flags real age", () => {
  const intake = {
    primary_goal: "PERFORMANCE",
    average_daily_steps: 10000,
    gender: "male",
    date_of_birth: "1990-01-15",
    weight_kg: 80,
    height_cm: 180,
    training_logistics: { days_per_week: 4, experience_level: "intermediate" },
    recent_training: "ACTIVE",
    training_environment: "commercial_gym",
  };

  const program = buildMasterEngineV2({
    intake,
    evaluationContext: EVALUATION_CONTEXT,
    nutritionFoodCatalog: CATALOG,
    options: { weeksCount: 5 },
  });

  const sessions = program.cardio_program?.weekly_schedule?.sessions || [];
  assert.ok(sessions.length > 0, "PERFORMANCE goal with cardio capacity must yield cardio sessions");

  const hrTarget = sessions[0].heart_rate_target;
  assert.ok(hrTarget, "Cardio session must have heart_rate_target");
  assert.equal(hrTarget.is_age_estimated, false, "is_age_estimated must be false when age is provided");
  assert.equal(hrTarget.age_source, "CLIENT_PROVIDED", "age_source must be CLIENT_PROVIDED when age is provided");
  assert.equal(hrTarget.guidance_ar.includes("تقريبي"), false, "guidance_ar should not claim approximate when age is real");
});

test("S2-6: when age is missing from raw intake, age defaults to 30 with explicit flags and guidance note", () => {
  const intake = {
    primary_goal: "PERFORMANCE",
    average_daily_steps: 10000,
    gender: "male",
    // No date_of_birth, no DOB, no age in raw intake
    weight_kg: 80,
    height_cm: 180,
    training_logistics: { days_per_week: 4, experience_level: "intermediate" },
    recent_training: "ACTIVE",
    training_environment: "commercial_gym",
  };

  const program = buildMasterEngineV2({
    intake,
    evaluationContext: EVALUATION_CONTEXT,
    nutritionFoodCatalog: CATALOG,
    options: { weeksCount: 5 },
  });

  const sessions = program.cardio_program?.weekly_schedule?.sessions || [];
  assert.ok(sessions.length > 0, "PERFORMANCE goal with cardio capacity must yield cardio sessions");

  const hrTarget = sessions[0].heart_rate_target;
  assert.ok(hrTarget, "Cardio session must have heart_rate_target");
  // Tanaka for age 30: 208 - 0.7 * 30 = 187
  assert.equal(hrTarget.estimated_hr_max, 187, "Tanaka HR max for default age 30 must be 187");
  assert.equal(hrTarget.is_age_estimated, true, "is_age_estimated must be true when age is defaulted");
  assert.equal(hrTarget.age_source, "DEFAULT_FALLBACK", "age_source must be DEFAULT_FALLBACK when age is defaulted");
  assert.ok(
    hrTarget.guidance_ar.includes("تقريبي") || hrTarget.guidance_ar.includes("لعدم تحديد العمر"),
    "guidance_ar must state the range is approximate because age is missing"
  );
});

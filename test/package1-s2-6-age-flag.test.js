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
    // A completed intake answers the walking question: EASY means the
    // client has confirmed walking capacity (P1-B4 fail-closed rule).
    // Steps are a reported number inside cardio: the top-level
    // average_daily_steps is a form band key, not a number (P1-B1).
    cardio: { walkingAbility: "EASY", averageDailySteps: 10000 },
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

test("S2-6: when age is missing from raw intake, generation stops instead of defaulting to 30", () => {
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

  // P1-B3 (Q1): a missing age stops generation — it never silently becomes
  // 30 with flags. The old DEFAULT_FALLBACK zone behavior is retired; the
  // decision gate refuses the intake before any plan is built.
  assert.throws(
    () =>
      buildMasterEngineV2({
        intake,
        evaluationContext: EVALUATION_CONTEXT,
        nutritionFoodCatalog: CATALOG,
        options: { weeksCount: 5 },
      }),
    /validation failed/,
    "Missing age must stop generation, never invent an age"
  );
});

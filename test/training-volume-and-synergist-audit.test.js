import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  calculateSessionDemand as backendSessionDemand,
  auditWeeklyMuscleVolume as backendVolumeAudit,
  calculateEnergyAdjustedLandmarks as backendEnergyLandmarks,
  auditDeficitVolumeShield as backendDeficitShield,
} from "../src/api/utils/trainingNutritionCoupling.js";

import {
  calculateSessionDemand as frontendSessionDemand,
  auditWeeklyMuscleVolume as frontendVolumeAudit,
  calculateEnergyAdjustedLandmarks as frontendEnergyLandmarks,
  auditDeficitVolumeShield as frontendDeficitShield,
} from "../frontend/src/utils/trainingCouplingUtils.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("Axis 1 (Unit F): Weekly muscle volume MAV/MRV, compound/isolation accounting, and generator-editor parity", async (t) => {
  await t.test("1. Generator exercises (exercise_code + target_sets / prescription.sets) produce identical demand and volume in backend and frontend", () => {
    const generatorSession = {
      name: "Upper Push/Pull",
      exercises: [
        { exercise_code: "BARBELL_BENCH_PRESS", target_sets: 4 },
        { exercise_code: "BARBELL_BENT_OVER_ROW", prescription: { sets: 4 } },
        { exercise_code: "DUMBBELL_LATERAL_RAISE", target_sets: 4 },
      ],
    };

    const bDemand = backendSessionDemand(generatorSession.exercises);
    const fDemand = frontendSessionDemand(generatorSession.exercises);

    assert.equal(bDemand.total_sets, 12);
    assert.equal(fDemand.total_sets, 12, "Frontend calculateSessionDemand must read target_sets and prescription.sets");
    assert.equal(fDemand.heavy_compounds_count, 2, "Frontend calculateSessionDemand must recognize exercise_code for heavy compounds");
    assert.equal(fDemand.glycolytic_score, bDemand.glycolytic_score);

    const bAudit = backendVolumeAudit([generatorSession], "INTERMEDIATE");
    const fAudit = frontendVolumeAudit([generatorSession], "INTERMEDIATE");

    assert.equal(bAudit.analysis.CHEST.weekly_sets, 4);
    assert.equal(fAudit.analysis.CHEST.weekly_sets, 4);
    assert.equal(bAudit.analysis.BACK.weekly_sets, 4, "Backend auditWeeklyMuscleVolume must read prescription.sets");
    assert.equal(fAudit.analysis.BACK.weekly_sets, 4, "Frontend auditWeeklyMuscleVolume must read target_sets and prescription.sets");
  });

  await t.test("2. Compound vs Isolation accounting: direct sets are not inflated, while compound synergist sets (0.5x) are tracked accurately", () => {
    const sessions = [
      {
        name: "Push & Pull",
        exercises: [
          { code: "BARBELL_BENCH_PRESS", sets: 4 }, // Compound Chest (4 direct CHEST, +2 synergist TRICEPS, +2 synergist SHOULDERS)
          { code: "CABLE_FLY", sets: 3 }, // Isolation Chest (3 direct CHEST, 0 synergist)
          { code: "LAT_PULLDOWN", sets: 4 }, // Compound Back (4 direct BACK, +2 synergist BICEPS)
          { code: "TRICEPS_PUSHDOWN", sets: 3 }, // Isolation Triceps (3 direct TRICEPS)
        ],
      },
    ];

    for (const auditFn of [backendVolumeAudit, frontendVolumeAudit]) {
      const audit = auditFn(sessions, "INTERMEDIATE");

      // Chest: 4 compound + 3 isolation = 7 direct sets, 0 synergist
      assert.equal(audit.analysis.CHEST.weekly_sets, 7);
      assert.equal(audit.analysis.CHEST.direct_sets, 7);
      assert.equal(audit.analysis.CHEST.compound_sets, 4);
      assert.equal(audit.analysis.CHEST.isolation_sets, 3);
      assert.equal(audit.analysis.CHEST.synergist_sets, 0);
      assert.equal(audit.analysis.CHEST.effective_sets, 7);

      // Triceps: 0 compound + 3 isolation = 3 direct sets, + 2.0 synergist sets from 4 sets of bench press = 5.0 effective sets
      assert.equal(audit.analysis.TRICEPS.weekly_sets, 3, "Direct weekly_sets must not be inflated by compound chest presses");
      assert.equal(audit.analysis.TRICEPS.direct_sets, 3);
      assert.equal(audit.analysis.TRICEPS.compound_sets, 0);
      assert.equal(audit.analysis.TRICEPS.isolation_sets, 3);
      assert.equal(audit.analysis.TRICEPS.synergist_sets, 2);
      assert.equal(audit.analysis.TRICEPS.effective_sets, 5);

      // Biceps: 0 direct sets, + 2.0 synergist sets from 4 sets of lat pulldown
      assert.equal(audit.analysis.BICEPS.weekly_sets, 0);
      assert.equal(audit.analysis.BICEPS.direct_sets, 0);
      assert.equal(audit.analysis.BICEPS.synergist_sets, 2);
      assert.equal(audit.analysis.BICEPS.effective_sets, 2);
      assert.equal(audit.analysis.BICEPS.status, "NOT_TRAINED_DIRECTLY");
    }
  });

  await t.test("3. Deficit Volume Shield respects experienceLevel (BEGINNER vs INTERMEDIATE) so MAV/MRV never contradict auditWeeklyMuscleVolume", () => {
    const beginnerLandmarks = backendEnergyLandmarks({
      targetCalories: 1800,
      tdee: 2400,
      experienceLevel: "BEGINNER",
    });
    const intermediateLandmarks = backendEnergyLandmarks({
      targetCalories: 1800,
      tdee: 2400,
      experienceLevel: "INTERMEDIATE",
    });

    assert.ok(
      beginnerLandmarks.adjusted_landmarks.CHEST.base_mrv < intermediateLandmarks.adjusted_landmarks.CHEST.base_mrv,
      `Beginner base MRV (${beginnerLandmarks.adjusted_landmarks.CHEST.base_mrv}) must be lower than intermediate (${intermediateLandmarks.adjusted_landmarks.CHEST.base_mrv})`
    );

    // 14 sets of Quads in a 25% deficit exceeds a beginner's deficit-adjusted MRV (~10 sets)
    const quadSessions = [
      { exercises: [{ code: "BARBELL_BACK_SQUAT", sets: 7 }, { code: "LEG_EXTENSION_MACHINE", sets: 7 }] },
    ];
    const bShield = backendDeficitShield({
      sessions: quadSessions,
      targetCalories: 1800,
      tdee: 2400,
      experienceLevel: "BEGINNER",
    });
    const fShield = frontendDeficitShield({
      sessions: quadSessions,
      targetCalories: 1800,
      tdee: 2400,
      experienceLevel: "BEGINNER",
    });

    assert.equal(bShield.analysis.QUADS.status, "EXCEEDS_DEFICIT_MRV");
    assert.equal(fShield.analysis.QUADS.status, "EXCEEDS_DEFICIT_MRV");
    assert.equal(bShield.requires_volume_consolidation, true);
  });

  await t.test("4. useCoachEditorData and program.controller resolve experienceLevel from all program paths", () => {
    const hookSrc = fs.readFileSync(
      path.join(ROOT, "frontend/src/pages/CoachEditor/hooks/useCoachEditorData.js"),
      "utf8"
    );
    const controllerSrc = fs.readFileSync(
      path.join(ROOT, "src/api/controllers/program.controller.js"),
      "utf8"
    );

    assert.ok(
      hookSrc.includes("training_program?.experience") && hookSrc.includes("training?.experience_level"),
      "useCoachEditorData must fallback across client, training, and training_program experience_level"
    );
    assert.ok(
      controllerSrc.includes("experienceLevel:") && controllerSrc.includes("training_program?.experience"),
      "program.controller must pass resolved experienceLevel to both auditWeeklyMuscleVolume and auditDeficitVolumeShield"
    );
  });
});

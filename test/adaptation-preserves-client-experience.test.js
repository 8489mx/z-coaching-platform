import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { evaluateIntake } from "../src/intake-decision-engine/index.js";
import { buildTrainingMesoCycle } from "../src/training-engine-v2/index.js";
import { buildAdaptedPlan } from "../src/adaptation-engine/build-adapted-plan.js";
import { CheckinAnalysisStatus } from "../src/checkin-engine/domain/enums.js";
import { completeIntake } from "./fixtures/complete-intake.js";

test("FIX-07: Trainee experience level persists through training engine into adaptation engine instead of defaulting to BEGINNER", async (t) => {
  const validIntake = completeIntake();
  validIntake.training.experience = "ADVANCED";
  const decision = evaluateIntake(validIntake, { assessmentDate: "2026-08-16" });
  const advancedTrainingMeso = buildTrainingMesoCycle(decision, {
    experience: "ADVANCED",
    rawIntake: validIntake,
  });

  const advancedMasterProgram = {
    training_program: advancedTrainingMeso,
    nutrition_program: {
      targets: { target_calories_kcal: 2400, protein_g: 180, carbohydrate_g: 260, fat_g: 70 },
    },
  };

  await t.test("1. Training mesocycle exposes experience and experience_level = ADVANCED", () => {
    assert.equal(advancedTrainingMeso.experience, "ADVANCED");
    assert.equal(advancedTrainingMeso.experience_level, "ADVANCED");
  });

  await t.test("2. Week 5 adaptation for ADVANCED trainee without explicit options.experience triggers ADVANCED deload (RIR 4, 60% volume) instead of BEGINNER consolidation", () => {
    const adapted = buildAdaptedPlan({
      currentMasterProgram: advancedMasterProgram,
      checkinAnalysis: {
        analysis_status: CheckinAnalysisStatus.ON_TRACK,
        fatigue_score: 5,
      },
      options: {
        currentWeekNumber: 4,
        weeks_of_accumulated_training: 5,
        accumulated_fatigue_score: 5,
      },
    });

    assert.equal(adapted.adapted_training_week.phase, "DELOAD");
    assert.equal(adapted.adapted_training_week.target_rir, 4);
    assert.ok(
      adapted.adapted_training_week.focus_note.includes("Regenerative Deload"),
      `Expected Advanced Regenerative Deload focus note, got: ${adapted.adapted_training_week.focus_note}`
    );
    assert.ok(
      !adapted.adaptation_reasons.some((r) => r.code === "BEGINNER_CONSOLIDATION_MAINTAINED"),
      "Advanced trainee must never receive BEGINNER_CONSOLIDATION_MAINTAINED"
    );
  });

  await t.test("3. Program with training.experience_level or client_profile.experience_level = INTERMEDIATE uses INTERMEDIATE strategic deload (70% volume, RIR 3)", () => {
    const intermediateProgram = {
      client_profile: { experience_level: "INTERMEDIATE" },
      training: {
        experience_level: "INTERMEDIATE",
        weeks: [
          {
            week_number: 1,
            phase: "ACCUMULATION",
            target_rir: 2,
            sessions: [
              {
                session_name: "Upper A",
                exercises: [{ code: "BARBELL_BENCH_PRESS", sets: 4, rir: 2 }],
              },
            ],
          },
        ],
      },
    };

    const adapted = buildAdaptedPlan({
      currentMasterProgram: intermediateProgram,
      checkinAnalysis: {
        analysis_status: CheckinAnalysisStatus.ON_TRACK,
        fatigue_score: 5,
      },
      options: {
        currentWeekNumber: 1,
        weeks_of_accumulated_training: 5,
        accumulated_fatigue_score: 5,
      },
    });

    assert.equal(adapted.adapted_training_week.phase, "DELOAD");
    assert.equal(adapted.adapted_training_week.target_rir, 3);
    assert.ok(
      adapted.adapted_training_week.focus_note.includes("Strategic Deload"),
      `Expected Intermediate Strategic Deload focus note, got: ${adapted.adapted_training_week.focus_note}`
    );
  });

  await t.test("4. checkin.controller.js passes resolved experience to buildAdaptedPlan options", () => {
    const src = fs.readFileSync(new URL("../src/api/controllers/checkin.controller.js", import.meta.url), "utf8");
    assert.ok(src.includes("experience:"), "checkin.controller.js must pass experience in buildAdaptedPlan options");
  });
});

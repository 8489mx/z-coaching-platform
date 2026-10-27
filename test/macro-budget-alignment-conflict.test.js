import test from "node:test";
import assert from "node:assert/strict";
import { buildAdaptedPlan } from "../src/adaptation-engine/build-adapted-plan.js";

test("FIX-08: buildAdaptedPlan surfaces macro budget alignment_conflict and requires coach approval when protein+fat exceed target calories", () => {
  const currentMasterProgram = {
    engine_version: "master_v2.0.0",
    client: { gender: "female" },
    nutrition_program: {
      targets: {
        calories_kcal: 1350,
        protein_g: 220, // 880 kcal
        carbohydrate_g: 20,
        fat_g: 60 // 540 kcal -> protein + fat = 1420 kcal > 1225 kcal after plateau cut
      }
    },
    training_program: {
      mesocycle: {
        client_experience: "INTERMEDIATE",
        weeks: [{ week_number: 1, sessions: [] }]
      }
    },
    cardio_program: {
      prescription: { daily_step_target: 8000 },
      weekly_schedule: { sessions: [] }
    }
  };

  const checkinAnalysis = {
    analysis_status: "PLATEAU_DETECTED",
    suggested_calorie_delta: -125,
    is_female: true,
    current_average_weight_kg: 68
  };

  const adapted = buildAdaptedPlan({
    currentMasterProgram,
    checkinAnalysis,
    options: { currentWeekNumber: 1, isFemale: true }
  });

  assert.equal(adapted.adapted_nutrition.alignment_conflict, true);
  assert.equal(
    adapted.adapted_nutrition.conflict_reason,
    "CALORIC_BUDGET_BELOW_MINIMUM_MACRO_CONSTRAINTS"
  );
  assert.equal(adapted.requires_coach_approval, true);
  assert.ok(
    adapted.adaptation_reasons.some((r) => r.code === "MACRO_BUDGET_ALIGNMENT_CONFLICT"),
    "Expected MACRO_BUDGET_ALIGNMENT_CONFLICT in adaptation_reasons"
  );
});

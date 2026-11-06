/**
 * PACKAGE S1 — smaller findings (round 2), frontend helpers.
 *
 * The coach editor's nutrition tab and the intake form are JSX, which the
 * node-environment vitest suite cannot render — so the logic S1 adds lives
 * in plain modules, tested here, and the JSX only calls them.
 */
import { describe, it, expect } from "vitest";

import { pcosProtocolCard } from "../frontend/src/features/coach/components/pcosProtocol.js";
import { doseForEditorExercise } from "../frontend/src/pages/CoachEditor/utils/exerciseDose.js";
import {
  MEDICAL_CONDITION_OPTIONS,
  DIETARY_PREFERENCE_OPTIONS,
} from "../frontend/src/pages/FullIntakeForm.constants.js";

describe("S1 item 1: the PCOS protocol is visible to the coach", () => {
  it("returns the card with the engine's PCOS note when the carb cap applied", () => {
    const card = pcosProtocolCard({
      clinical_guardrails: {
        pcos_carb_cap_applied: true,
        pcos_carb_cap_share: 0.3,
        pcos_fat_increase_g: 5,
        pcos_carb_cap_note_ar: "سقف كارب PCOS اتطبق: الكارب اتحدد بـ 130 جم (30% من السعرات).",
      },
      targeted_low_carb: {
        framework: "TARGETED_LOW_CARB",
        framework_name_ar: "نظام الكارب المنخفض المعتدل (Moderate Low-Carb)",
        net_carbs_target_g: 130,
        carb_timing_ar: "130 جم كاربوهيدرات يومياً من مصادر بطيئة الامتصاص.",
      },
    });
    expect(card).not.toBeNull();
    expect(card.frameworkNameAr).toContain("الكارب المنخفض المعتدل");
    expect(card.noteAr).toContain("PCOS");
    expect(card.carbCapSharePercent).toBe(30);
    expect(card.netCarbsTargetG).toBe(130);
  });

  it("returns null when no PCOS handling applies to the plan", () => {
    expect(pcosProtocolCard({ clinical_guardrails: {}, targeted_low_carb: null })).toBeNull();
    expect(pcosProtocolCard({})).toBeNull();
    expect(pcosProtocolCard(null)).toBeNull();
  });

  it("flags a relaxed cap so the coach sees the 40% relaxation", () => {
    const card = pcosProtocolCard({
      clinical_guardrails: { pcos_carb_cap_applied: true, pcos_carb_cap_relaxed: true, pcos_carb_cap_share: 0.3 },
      targeted_low_carb: { framework: "TARGETED_LOW_CARB" },
    });
    expect(card.carbCapRelaxed).toBe(true);
  });
});

describe("S1 item 13: the editor keeps a held row's dose empty", () => {
  it("returns null sets/reps for a HELD_SLOT row", () => {
    expect(doseForEditorExercise({ exercise_code: "HELD_SLOT_KNEE_DOMINANT_1" })).toEqual({
      sets: null,
      reps: null,
    });
    expect(doseForEditorExercise({ code: "HELD_SLOT_HORIZONTAL_PUSH_2", prescription: { sets: 3 } })).toEqual({
      sets: null,
      reps: null,
    });
  });

  it("keeps the old behaviour for real exercises", () => {
    expect(
      doseForEditorExercise({ exercise_code: "GOBLET_SQUAT", prescription: { sets: 3, target_min: 10, target_max: 12 } }),
    ).toEqual({ sets: 3, reps: "10 - 12" });
    expect(doseForEditorExercise({ exercise_code: "GOBLET_SQUAT", sets: 4, reps: "8 - 10" })).toEqual({
      sets: 4,
      reps: "8 - 10",
    });
    expect(doseForEditorExercise({ exercise_code: "GOBLET_SQUAT" })).toEqual({ sets: 3, reps: "10 - 12" });
  });
});

describe("S1 items 9 and 15: the intake form's option lists", () => {
  it("offers the high-cholesterol and osteoporosis conditions", () => {
    const keys = MEDICAL_CONDITION_OPTIONS.map((o) => o.key);
    expect(keys).toContain("high_cholesterol");
    expect(keys).toContain("osteoporosis");
    expect(keys).toContain("hypertension");
  });

  it("Batch 1: offers the epilepsy and depression/anxiety conditions", () => {
    const keys = MEDICAL_CONDITION_OPTIONS.map((o) => o.key);
    expect(keys).toContain("epilepsy");
    expect(keys).toContain("depression_anxiety");
  });

  it("offers the vegetarian dietary preference", () => {
    const keys = DIETARY_PREFERENCE_OPTIONS.map((o) => o.key);
    expect(keys).toContain("vegetarian");
    expect(keys).toContain("none");
  });
});

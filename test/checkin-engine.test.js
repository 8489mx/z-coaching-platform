import test from "node:test";
import assert from "node:assert/strict";

import {
  evaluateCheckin,
  CheckinAnalysisStatus,
  AdherenceTier,
  CHECKIN_ENGINE_VERSION,
} from "../src/checkin-engine/index.js";

test("Check-in Engine Suite", async (t) => {
  await t.test("version is stable", () => {
    assert.equal(CHECKIN_ENGINE_VERSION, "checkin-engine-v2");
  });

  await t.test("supports single weekly morning weigh-in", () => {
    const input = {
      weight_kg: 84.5,
      previous_weight_kg: 85.0,
      waist_circumference_cm: 88,
      previous_waist_circumference_cm: 88.5,
      nutrition_adherence_percent: 90,
      workouts_completed: 4,
      workouts_scheduled: 4,
      biofeedback: { hunger_level: 2, energy_level: 4, sleep_quality: 4, stress_level: 2 },
    };

    const result = evaluateCheckin(input);
    assert.equal(result.analysis_status, CheckinAnalysisStatus.ON_TRACK);
    assert.equal(result.current_average_weight_kg, 84.5);
    assert.equal(result.weight_change_kg, -0.5);
    assert.equal(result.adherence_tier, AdherenceTier.OPTIMAL);
  });

  await t.test("Adherence Gate locks calories when adherence < 80%", () => {
    const input = {
      weight_kg: 85.0,
      previous_weight_kg: 85.0,
      nutrition_adherence_percent: 70, // Below 80% threshold
      workouts_completed: 2,
      workouts_scheduled: 4,
      biofeedback: { hunger_level: 3, energy_level: 3, sleep_quality: 3, stress_level: 3 },
    };

    const result = evaluateCheckin(input);
    assert.equal(result.analysis_status, CheckinAnalysisStatus.POOR_ADHERENCE);
    assert.equal(result.adherence_tier, AdherenceTier.LOW);
    assert.equal(result.suggested_calorie_delta, 0); // No cuts allowed
    assert.ok(result.recommendations_ar.some((r) => r.includes("تثبيت السعرات")));
  });

  await t.test("Waist-First / Body Recomposition detects fat loss + muscle gain", () => {
    const input = {
      weight_kg: 85.2, // Weight slightly up by +0.2 kg
      previous_weight_kg: 85.0,
      waist_circumference_cm: 86.0, // Waist dropped by 1.5 cm
      previous_waist_circumference_cm: 87.5,
      nutrition_adherence_percent: 95,
      workouts_completed: 4,
      workouts_scheduled: 4,
      biofeedback: { hunger_level: 2, energy_level: 4, sleep_quality: 4, stress_level: 2 },
    };

    const result = evaluateCheckin(input);
    assert.equal(result.analysis_status, CheckinAnalysisStatus.BODY_RECOMP_SUCCESS);
    assert.equal(result.suggested_calorie_delta, 0); // Keep calories steady
    assert.ok(result.recommendations_ar.some((r) => r.includes("إعادة تكوين عضلي ناجحة")));
  });

  await t.test("identifies TRUE_PLATEAU and suggests -125 kcal adjustment", () => {
    const input = {
      weight_kg: 85.0,
      previous_weight_kg: 85.0,
      waist_circumference_cm: 88.0,
      previous_waist_circumference_cm: 88.0,
      nutrition_adherence_percent: 95,
      is_consecutive_plateau: true,
      workouts_completed: 4,
      workouts_scheduled: 4,
      biofeedback: { hunger_level: 2, energy_level: 4, sleep_quality: 4, stress_level: 2 },
    };

    const result = evaluateCheckin(input);
    assert.equal(result.analysis_status, CheckinAnalysisStatus.TRUE_PLATEAU);
    assert.equal(result.suggested_calorie_delta, -125);
    assert.equal(result.suggested_steps_delta, 1000);
    assert.ok(result.recommendations_ar.some((r) => r.includes("ثبات في الميزان ومحيط الخصر")));
  });

  await t.test("identifies REFEED_RECOMMENDED when hunger is high and recovery energy is low under optimal adherence", () => {
    const input = {
      weight_kg: 84.0,
      previous_weight_kg: 84.5,
      nutrition_adherence_percent: 90,
      biofeedback: { hunger_level: 5, energy_in_gym: 1, sleep_quality: 3, stress_level: 2 },
    };

    const result = evaluateCheckin(input);
    assert.equal(result.analysis_status, CheckinAnalysisStatus.HIGH_FATIGUE_WARNING);
    assert.equal(result.is_refeed_recommended, true);
    assert.ok(result.recommendations_ar.some((r) => r.includes("Refeed Day")));

  });

  await t.test("identifies RAPID_LOSS_WARNING when weight drops > 1.5%", () => {
    const input = {
      weight_kg: 83.0,
      previous_weight_kg: 85.0, // -2.0kg = -2.35% drop
      nutrition_adherence_percent: 90,
      biofeedback: { hunger_level: 3, energy_in_gym: 3, sleep_quality: 3, stress_level: 2 },
    };

    const result = evaluateCheckin(input);
    assert.equal(result.analysis_status, CheckinAnalysisStatus.RAPID_LOSS_WARNING);
    assert.equal(result.suggested_calorie_delta, 150);
    assert.ok(result.recommendations_ar.some((r) => r.includes("سريع جداً")));
  });

  await t.test("identifies INJURY_FLAGGED when pain level >= 4 is reported", () => {
    const input = {
      weight_kg: 84.5,
      previous_weight_kg: 85.0,
      nutrition_adherence_percent: 85,
      biofeedback: { hunger_level: 2, energy_in_gym: 3, sleep_quality: 3, stress_level: 2 },
      pain_reports: [{ body_part: "LOWER_BACK", pain_level: 6, description: "Sharp pain during squats" }],
    };

    const result = evaluateCheckin(input);
    assert.equal(result.analysis_status, CheckinAnalysisStatus.INJURY_FLAGGED);
    assert.equal(result.requires_coach_review, true);
    assert.equal(result.flagged_pains.length, 1);
  });
});


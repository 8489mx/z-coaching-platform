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
    assert.equal(CHECKIN_ENGINE_VERSION, "checkin-engine-v1");
  });

  await t.test("identifies ON_TRACK when weight loss is steady and adherence is high", () => {
    const input = {
      daily_weights_kg: [85.2, 85.0, 84.8, 85.1, 84.7, 84.6, 84.8], // avg ~ 84.89
      previous_week_average_weight_kg: 85.5,
      waist_circumference_cm: 91,
      previous_waist_circumference_cm: 92,
      nutrition_adherence_percent: 90,
      workouts_completed: 4,
      workouts_scheduled: 4,
      biofeedback: { hunger_level: 2, energy_in_gym: 4, sleep_quality: 4, stress_level: 2 },
      pain_reports: [],
    };

    const result = evaluateCheckin(input);
    assert.equal(result.analysis_status, CheckinAnalysisStatus.ON_TRACK);
    assert.equal(result.adherence_tier, AdherenceTier.OPTIMAL);
    assert.ok(result.weight_change_kg < 0);
    assert.equal(result.requires_coach_review, false);
  });

  await t.test("identifies PLATEAU_DETECTED when weight is unchanged despite high adherence", () => {
    const input = {
      daily_weights_kg: [85.0, 85.1, 85.0, 85.0, 85.1, 85.0, 85.0], // avg = 85.03
      previous_week_average_weight_kg: 85.0,
      nutrition_adherence_percent: 95,
      workouts_completed: 4,
      workouts_scheduled: 4,
      biofeedback: { hunger_level: 2, energy_in_gym: 4, sleep_quality: 4, stress_level: 2 },
    };

    const result = evaluateCheckin(input);
    assert.equal(result.analysis_status, CheckinAnalysisStatus.PLATEAU_DETECTED);
    assert.ok(result.recommendations_ar.some((r) => r.includes("ثبات في الوزن")));
  });

  await t.test("identifies RAPID_LOSS_WARNING when weight drops > 1.5%", () => {
    const input = {
      daily_weights_kg: [83.0, 83.2, 83.0, 83.1, 82.9, 82.8, 83.0], // avg ~ 83.0kg
      previous_week_average_weight_kg: 85.0, // -2.0kg = -2.35% drop
      nutrition_adherence_percent: 90,
      biofeedback: { hunger_level: 3, energy_in_gym: 3, sleep_quality: 3, stress_level: 2 },
    };

    const result = evaluateCheckin(input);
    assert.equal(result.analysis_status, CheckinAnalysisStatus.RAPID_LOSS_WARNING);
    assert.ok(result.recommendations_ar.some((r) => r.includes("سريع جداً")));
  });

  await t.test("identifies INJURY_FLAGGED when pain level >= 4 is reported", () => {
    const input = {
      daily_weights_kg: [84.5, 84.5, 84.4],
      previous_week_average_weight_kg: 85.0,
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

import test from "node:test";
import assert from "node:assert/strict";

import {
  evaluateCheckin,
  CheckinAnalysisStatus,
  BiofeedbackAlert,
} from "../src/checkin-engine/index.js";

// S3-7 Option C: rapid loss is flagged independently of the else-if chain
// position, while the primary status and the calorie lock stay unchanged.

const baseBiofeedback = {
  hunger_level: 2,
  energy_level: 4,
  sleep_quality: 4,
  stress_level: 2,
};

test("low adherence plus rapid loss keeps POOR_ADHERENCE and calorie lock, but flags rapid loss", () => {
  const result = evaluateCheckin({
    weight_kg: 83.0,
    previous_weight_kg: 85.0, // -2.35% in one week
    nutrition_adherence_percent: 70,
    workouts_completed: 2,
    workouts_scheduled: 4,
    biofeedback: baseBiofeedback,
  });
  assert.equal(result.analysis_status, CheckinAnalysisStatus.POOR_ADHERENCE);
  assert.equal(result.suggested_calorie_delta, 0);
  assert.equal(result.is_rapid_loss, true);
  assert.ok(result.biofeedback_alerts.includes(BiofeedbackAlert.RAPID_LOSS_DETECTED));
});

test("high adherence plus rapid loss keeps RAPID_LOSS_WARNING and flags rapid loss", () => {
  const result = evaluateCheckin({
    weight_kg: 83.0,
    previous_weight_kg: 85.0,
    nutrition_adherence_percent: 95,
    workouts_completed: 4,
    workouts_scheduled: 4,
    biofeedback: baseBiofeedback,
  });
  assert.equal(result.analysis_status, CheckinAnalysisStatus.RAPID_LOSS_WARNING);
  assert.equal(result.is_rapid_loss, true);
  assert.ok(result.biofeedback_alerts.includes(BiofeedbackAlert.RAPID_LOSS_DETECTED));
});

test("normal loss does not flag rapid loss", () => {
  const result = evaluateCheckin({
    weight_kg: 84.5,
    previous_weight_kg: 85.0, // -0.59% in one week
    nutrition_adherence_percent: 70,
    workouts_completed: 2,
    workouts_scheduled: 4,
    biofeedback: baseBiofeedback,
  });
  assert.equal(result.is_rapid_loss, false);
  assert.ok(!result.biofeedback_alerts.includes(BiofeedbackAlert.RAPID_LOSS_DETECTED));
});

test("exactly -1.5% is not rapid loss, matching the < -1.5 rule", () => {
  const result = evaluateCheckin({
    weight_kg: 98.5,
    previous_weight_kg: 100.0,
    nutrition_adherence_percent: 95,
    workouts_completed: 4,
    workouts_scheduled: 4,
    biofeedback: baseBiofeedback,
  });
  assert.equal(result.is_rapid_loss, false);
});

test("missing previous weight cannot flag rapid loss", () => {
  const result = evaluateCheckin({
    weight_kg: 85.0,
    nutrition_adherence_percent: 95,
    workouts_completed: 4,
    workouts_scheduled: 4,
    biofeedback: baseBiofeedback,
  });
  assert.equal(result.weight_change_percent, null);
  assert.equal(result.is_rapid_loss, false);
});

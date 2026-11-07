import test from "node:test";
import assert from "node:assert/strict";

import { evaluateCheckin } from "../src/checkin-engine/evaluate-checkin.js";
import { CheckinAnalysisStatus, AdherenceTier } from "../src/checkin-engine/domain/enums.js";
import { classifyFollowUp } from "../src/execution-engines/coach-triage-engine.js";
import { submitCheckin } from "../src/api/controllers/checkin.controller.js";
import { User, CheckinSubmission } from "../src/api/models/index.js";
import sequelize from "../src/api/config/database.js";

const CODE = "TEST_B4_ADH_001";
const PHONE = "01099000401";

function mockRes() {
  const out = { status: 200, body: null };
  const res = { status(c) { out.status = c; return res; }, json(b) { out.body = b; return res; } };
  return { res, out };
}

// Plateau-shaped input: weight 80 -> 80, waist 90 -> 90, 4/4 workouts,
// normal biofeedback. Under known-high adherence this earns the -125 kcal
// plateau cut; under unknown adherence it must earn no cut at all.
function plateauInput(overrides = {}) {
  return {
    weight_kg: 80,
    previous_weight_kg: 80,
    waist_circumference_cm: 90,
    previous_waist_circumference_cm: 90,
    workouts_completed: 4,
    workouts_scheduled: 4,
    biofeedback: { hunger_level: 3, energy_level: 3, sleep_quality: 3, stress_level: 2 },
    ...overrides,
  };
}

function codes(result) {
  return result.reasons.map((r) => r.code);
}

test.after(async () => {
  await sequelize.close().catch(() => {});
});

test("B2-3: omitted adherence is unknown — coach review, all deltas zero, NOT POOR_ADHERENCE", () => {
  const result = evaluateCheckin(plateauInput());
  assert.equal(result.adherence_without_level, true);
  assert.equal(result.adherence_tier, null);
  assert.equal(result.requires_coach_review, true);
  assert.equal(result.suggested_calorie_delta, 0);
  assert.equal(result.suggested_carb_delta_g, 0);
  assert.equal(result.suggested_steps_delta, 0);
  assert.notEqual(result.analysis_status, CheckinAnalysisStatus.POOR_ADHERENCE);
});

test("B2-3: explicit null adherence behaves the same as omitted", () => {
  const result = evaluateCheckin(plateauInput({ nutrition_adherence_percent: null }));
  assert.equal(result.adherence_without_level, true);
  assert.equal(result.adherence_tier, null);
  assert.equal(result.requires_coach_review, true);
  assert.equal(result.suggested_calorie_delta, 0);
  assert.equal(result.suggested_carb_delta_g, 0);
  assert.equal(result.suggested_steps_delta, 0);
  assert.notEqual(result.analysis_status, CheckinAnalysisStatus.POOR_ADHERENCE);
});

test("B2-3: stated low adherence (70) still POOR_ADHERENCE — pin preserved", () => {
  const result = evaluateCheckin(plateauInput({ nutrition_adherence_percent: 70 }));
  assert.equal(result.analysis_status, CheckinAnalysisStatus.POOR_ADHERENCE);
  assert.equal(result.adherence_tier, AdherenceTier.LOW);
  assert.equal(result.suggested_calorie_delta, 0);
  assert.ok(!result.adherence_without_level);
});

test("B2-3: stated 100 keeps the plateau cut — unchanged behaviour", () => {
  const result = evaluateCheckin(plateauInput({ nutrition_adherence_percent: 100 }));
  assert.equal(result.analysis_status, CheckinAnalysisStatus.PLATEAU_DETECTED);
  assert.equal(result.adherence_tier, AdherenceTier.OPTIMAL);
  assert.equal(result.suggested_calorie_delta, -125);
  assert.equal(result.suggested_carb_delta_g, -30);
  assert.equal(result.suggested_steps_delta, 500);
  assert.ok(!result.adherence_without_level);
  assert.equal(result.requires_coach_review, false);
});

test("B2-3: stated 85 keeps the OPTIMAL plateau path", () => {
  const result = evaluateCheckin(plateauInput({ nutrition_adherence_percent: 85 }));
  assert.equal(result.adherence_tier, AdherenceTier.OPTIMAL);
  assert.equal(result.analysis_status, CheckinAnalysisStatus.PLATEAU_DETECTED);
  assert.equal(result.suggested_calorie_delta, -125);
  assert.ok(!result.adherence_without_level);
});

test("B2-3: rapid loss with unknown adherence — alert stays, RULE D +150 is deliberately zeroed", () => {
  // RULE D's +150 kcal is deliberately zeroed per the owner decision
  // ("all suggested deltas 0" for unknown adherence); the rapid-loss
  // alert and the coach review remain — the +150 is a suggestion, and no
  // suggestion may be computed from adherence the client never reported.
  const result = evaluateCheckin({
    weight_kg: 82,
    previous_weight_kg: 85,
    workouts_completed: 4,
    workouts_scheduled: 4,
    biofeedback: { hunger_level: 3, energy_level: 3, sleep_quality: 3, stress_level: 2 },
  });
  assert.equal(result.analysis_status, CheckinAnalysisStatus.RAPID_LOSS_WARNING);
  assert.equal(result.suggested_calorie_delta, 0);
  assert.equal(result.adherence_without_level, true);
  assert.equal(result.requires_coach_review, true);
  assert.ok(result.biofeedback_alerts.includes("RAPID_LOSS_DETECTED"));
});

test("B2-3: unknown adherence never engages the luteal deficit lock", () => {
  // The female-cycle buffer receives a null adherence_score, so
  // isHighAdherence is false and the luteal deficit lock cannot engage;
  // the unknown-adherence zeroing is the stronger protection. Control:
  // the same week with stated 95 DOES lock (setup proven to engage it).
  const unknown = evaluateCheckin(plateauInput({
    weight_kg: 80.8,
    previous_weight_kg: 80,
    menstrual_phase: "LUTEAL",
  }));
  assert.equal(unknown.female_cycle_buffer.deficit_adjustment_locked, false);
  assert.equal(unknown.adherence_without_level, true);
  assert.equal(unknown.requires_coach_review, true);

  const knownHigh = evaluateCheckin(plateauInput({
    weight_kg: 80.8,
    previous_weight_kg: 80,
    menstrual_phase: "LUTEAL",
    nutrition_adherence_percent: 95,
  }));
  assert.equal(knownHigh.female_cycle_buffer.deficit_adjustment_locked, true);
  assert.equal(knownHigh.analysis_status, CheckinAnalysisStatus.FEMALE_PMS_WATER_RETENTION);
});

test("B2-3: triage maps adherence_without_level to YELLOW ADHERENCE_WITHOUT_LEVEL", () => {
  const engineResult = evaluateCheckin(plateauInput());
  const triage = classifyFollowUp({
    analysis_status: engineResult.analysis_status,
    analysis: engineResult,
    adherence_percent: null,
    weight_change_percent: engineResult.weight_change_percent,
    max_pain_level: 0,
    flagged_pains: [],
    clinical_lockout: { locked: false },
    medical_review_required: false,
    clinical_alert: null,
    previous_analysis_status: null,
    deficit_locked: false,
    safety_signals_unknown: false,
    withheld_stage: false,
    proposed: {
      calorie_delta: engineResult.suggested_calorie_delta,
      steps_delta: engineResult.suggested_steps_delta,
    },
  });
  assert.equal(triage.tier, "YELLOW");
  assert.ok(codes(triage).includes("ADHERENCE_WITHOUT_LEVEL"));
  assert.equal(triage.signals.adherence_without_level, true);
});

test("B2-3: POOR_ADHERENCE with a zero delta stays GREEN — the lock, not the flag, holds it", () => {
  const engineResult = evaluateCheckin(plateauInput({ nutrition_adherence_percent: 70 }));
  const triage = classifyFollowUp({
    analysis_status: engineResult.analysis_status,
    analysis: engineResult,
    adherence_percent: 70,
    weight_change_percent: engineResult.weight_change_percent,
    max_pain_level: 0,
    flagged_pains: [],
    clinical_lockout: { locked: false },
    medical_review_required: false,
    clinical_alert: null,
    previous_analysis_status: null,
    deficit_locked: false,
    safety_signals_unknown: false,
    withheld_stage: false,
    proposed: {
      calorie_delta: engineResult.suggested_calorie_delta,
      steps_delta: engineResult.suggested_steps_delta,
    },
  });
  assert.equal(triage.tier, "GREEN");
});

test("B2-3: submit with null adherence -> 201, stored null, triage YELLOW", async (t) => {
  const user = await User.create({
    client_code: CODE,
    phone_number: PHONE,
    full_name: "B4 Adherence Test",
    role: "CLIENT",
    subscription_package: "MAX",
  });
  try {
    // Bare mock (no headers): the schedule guard is skipped, exactly as
    // the unit-test path of submitCheckin intends.
    const r = mockRes();
    await submitCheckin({
      user: { id: user.id, role: "CLIENT" },
      body: {
        user_id: CODE,
        weight_kg: 80,
        nutrition_adherence_percent: null,
        workouts_completed: 4,
        workouts_scheduled: 4,
        biofeedback: { hunger_level: 3, energy_level: 3, sleep_quality: 3, sleep_hours: 7, stress_level: 2 },
      },
    }, r.res);
    assert.equal(r.out.status, 201, JSON.stringify(r.out.body));
    assert.equal(r.out.body.analysis.adherence_without_level, true);
    assert.equal(r.out.body.analysis.requires_coach_review, true);
    assert.equal(r.out.body.analysis.suggested_calorie_delta, 0);
    assert.equal(r.out.body.analysis.triage.tier, "YELLOW");
    assert.ok(codes(r.out.body.analysis.triage).includes("ADHERENCE_WITHOUT_LEVEL"));

    const stored = await CheckinSubmission.findOne({ where: { user_id: user.id } });
    assert.ok(stored, "check-in row must exist");
    assert.equal(stored.nutrition_adherence_percent, null);
    assert.equal(stored.analysis_output.adherence_without_level, true);
  } finally {
    await CheckinSubmission.destroy({ where: { user_id: user.id } }).catch(() => {});
    await user.destroy().catch(() => {});
  }
});

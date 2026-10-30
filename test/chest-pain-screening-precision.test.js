/* S3-5: structured chest-area pain reports used to trigger the cardiac
   lockout at ANY pain level, with no DOMS exception — while the free-text
   screener in the same function already has both a negation check and a
   DOMS exception. A mild chest-muscle ache (pain_level 2, no exertional
   symptoms) locked training and required a coach unlock with confirmed
   medical clearance, exactly like a real cardiac event.
   Fix, mirroring the engine's own existing rules: a chest-area report
   counts as a cardiac flag only when its pain_level is at or above the
   engine's injury threshold (4, the same threshold flaggedPains uses),
   or when its level is unknown (fail closed), or when its own text
   matches the cardiac emergency patterns. Benign DOMS wording in the
   report (the same patterns the free-text screener exempts, with the
   same emergency-keyword guard) exempts the report from the cardiac
   flag — the injury path still applies at level >= 4. Structured
   cardiac fields (exertional_chest_pain / syncope / dizziness) and a
   prior clinical lockout are untouched and still always lock. */
import test from "node:test";
import assert from "node:assert/strict";
import { evaluateCheckin } from "../src/checkin-engine/evaluate-checkin.js";
import { CheckinAnalysisStatus, BiofeedbackAlert } from "../src/checkin-engine/domain/enums.js";

const baseSubmission = {
  weight_kg: 82,
  previous_weight_kg: 82.4,
  nutrition_adherence_percent: 90,
};

test("S3-5: mild chest-area pain (level 2) with no cardiac symptoms does not lock training", () => {
  const res = evaluateCheckin({
    ...baseSubmission,
    pain_reports: [{ area: "CHEST", pain_level: 2, body_part: "chest muscles" }],
  });
  assert.equal(res.analysis_status, CheckinAnalysisStatus.ON_TRACK);
  assert.equal(res.training_locked, false);
  assert.ok(!res.biofeedback_alerts.includes(BiofeedbackAlert.CARDIAC_RED_FLAG));
});

test("S3-5: significant chest-area pain (level 5) still triggers the cardiac flag", () => {
  const res = evaluateCheckin({
    ...baseSubmission,
    pain_reports: [{ area: "CHEST", pain_level: 5, body_part: "chest muscles" }],
  });
  assert.equal(res.analysis_status, CheckinAnalysisStatus.CRITICAL_CARDIAC_FLAG);
  assert.equal(res.training_locked, true);
});

test("S3-5: chest-area pain with unknown severity fails closed", () => {
  const res = evaluateCheckin({
    ...baseSubmission,
    pain_reports: [{ area: "CHEST", body_part: "chest muscles" }],
  });
  assert.equal(res.analysis_status, CheckinAnalysisStatus.CRITICAL_CARDIAC_FLAG);
  assert.equal(res.training_locked, true);
});

test("S3-5: structured cardiac fields still lock even with mild chest pain", () => {
  const res = evaluateCheckin({
    ...baseSubmission,
    exertional_chest_pain: true,
    pain_reports: [{ area: "CHEST", pain_level: 1, body_part: "chest muscles" }],
  });
  assert.equal(res.analysis_status, CheckinAnalysisStatus.CRITICAL_CARDIAC_FLAG);
  assert.equal(res.training_locked, true);
});

test("S3-5: DOMS wording in a chest report exempts the cardiac flag but keeps the injury path", () => {
  const res = evaluateCheckin({
    ...baseSubmission,
    pain_reports: [{
      area: "CHEST",
      pain_level: 6,
      body_part: "chest muscles",
      description: "شد عضلي في عضلات الصدر بعد التمرين",
    }],
  });
  assert.equal(res.analysis_status, CheckinAnalysisStatus.INJURY_FLAGGED);
  assert.equal(res.training_locked, false);
  assert.equal(res.requires_coach_review, true);
});

test("S3-5: emergency wording in a mild chest report still triggers the cardiac flag", () => {
  const res = evaluateCheckin({
    ...baseSubmission,
    pain_reports: [{
      area: "CHEST",
      pain_level: 2,
      body_part: "chest muscles",
      description: "chest pain radiating to my left arm",
    }],
  });
  assert.equal(res.analysis_status, CheckinAnalysisStatus.CRITICAL_CARDIAC_FLAG);
  assert.equal(res.training_locked, true);
});

test("S3-5: free-text DOMS wording still does not trigger the cardiac flag (regression pin)", () => {
  const res = evaluateCheckin({
    ...baseSubmission,
    client_notes: "شد عضلي في عضلات الصدر",
  });
  assert.equal(res.analysis_status, CheckinAnalysisStatus.ON_TRACK);
  assert.equal(res.training_locked, false);
});

test("S3-5: a prior clinical lockout still locks even with only mild chest pain", () => {
  const res = evaluateCheckin({
    ...baseSubmission,
    has_prior_clinical_lock: true,
    prior_clinical_lock_week: 3,
    pain_reports: [{ area: "CHEST", pain_level: 2, body_part: "chest muscles" }],
  });
  assert.equal(res.analysis_status, CheckinAnalysisStatus.CRITICAL_CARDIAC_FLAG);
  assert.equal(res.training_locked, true);
});

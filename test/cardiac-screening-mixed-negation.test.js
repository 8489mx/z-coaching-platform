import test from "node:test";
import assert from "node:assert/strict";
import { evaluateCheckin } from "../src/checkin-engine/evaluate-checkin.js";
import { CheckinAnalysisStatus, BiofeedbackAlert } from "../src/checkin-engine/domain/enums.js";

const baseSubmission = {
  weight_kg: 82,
  previous_weight_kg: 82.4,
  nutrition_adherence_percent: 90,
};

test("FIX-05: negation-only notes in Arabic and English do not trigger cardiac lockout", () => {
  const negatedNotes = [
    "لا يوجد ألم بالصدر",
    "لا يوجد ألم بالصدر أو دوخة",
    "ما فيش دوخة ولا وجع بالصدر الحمد لله",
    "بدون أي ألم في الصدر أو إغماء",
    "no chest pain, no dizziness",
    "without chest pain or syncope",
  ];

  for (const client_notes of negatedNotes) {
    const res = evaluateCheckin({ ...baseSubmission, client_notes });
    assert.equal(res.analysis_status, CheckinAnalysisStatus.ON_TRACK, `Failed negation-only for: ${client_notes}`);
    assert.equal(res.training_locked, false, `Should not lock for: ${client_notes}`);
    assert.equal(res.biofeedback_alerts.includes(BiofeedbackAlert.CARDIAC_RED_FLAG), false);
  }
});

test("FIX-05: affirmative cardiac symptoms trigger CRITICAL_CARDIAC_FLAG and lock training", () => {
  const affirmativeNotes = [
    "عندي ألم بالصدر أثناء الجري",
    "حسيت بإغماء بعد التمرين",
    "felt chest pain during heavy squats",
  ];

  for (const client_notes of affirmativeNotes) {
    const res = evaluateCheckin({ ...baseSubmission, client_notes });
    assert.equal(res.analysis_status, CheckinAnalysisStatus.CRITICAL_CARDIAC_FLAG, `Failed affirmative for: ${client_notes}`);
    assert.equal(res.training_locked, true, `Should lock for: ${client_notes}`);
    assert.ok(res.biofeedback_alerts.includes(BiofeedbackAlert.CARDIAC_RED_FLAG));
  }
});

test("FIX-05: mixed negation and affirmative symptom in either order still triggers CRITICAL_CARDIAC_FLAG", () => {
  const mixedNotes = [
    "لا يوجد دوخة لكن عندي ألم بالصدر أثناء الجري",
    "ما فيش دوخة بس حسيت بألم في الصدر وأنا بتمرن",
    "لا يوجد خفقان وعندي ضغط بالصدر وقت المجهود",
    "عندي ألم بالصدر أثناء الجري لكن لا يوجد دوخة",
    "no dizziness but I had chest pain while running",
    "without syncope; however experienced chest pain on exertion",
  ];

  for (const client_notes of mixedNotes) {
    const res = evaluateCheckin({ ...baseSubmission, client_notes });
    assert.equal(res.analysis_status, CheckinAnalysisStatus.CRITICAL_CARDIAC_FLAG, `Missed mixed symptom in: ${client_notes}`);
    assert.equal(res.training_locked, true, `Should lock for mixed symptom in: ${client_notes}`);
    assert.ok(res.biofeedback_alerts.includes(BiofeedbackAlert.CARDIAC_RED_FLAG));
  }
});

test("FIX-05: structured cardiac red flags are never cancelled by reassuring text notes", () => {
  const resChest = evaluateCheckin({
    ...baseSubmission,
    exertional_chest_pain: true,
    client_notes: "لا يوجد ألم بالصدر ولا دوخة والأسبوع ممتاز",
  });
  assert.equal(resChest.analysis_status, CheckinAnalysisStatus.CRITICAL_CARDIAC_FLAG);
  assert.equal(resChest.training_locked, true);

  const resSyncope = evaluateCheckin({
    ...baseSubmission,
    syncope: true,
    client_notes: "no chest pain, no syncope, feeling great",
  });
  assert.equal(resSyncope.analysis_status, CheckinAnalysisStatus.CRITICAL_CARDIAC_FLAG);
  assert.equal(resSyncope.training_locked, true);
});

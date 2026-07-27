import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildCardioPrescription,
  CARDIO_PRESCRIPTION_VERSION,
  CardioPrescriptionStatus,
  PrescriptionReasonCode,
} from "../src/cardio-prescription/index.js";

function createMockInput(status, strategy, maxSessions, maxDuration) {
  const spec = {
    cardio_plan_spec_version: "cardio-plan-spec-v1",
    status,
    strategy,
    limits: {
      max_sessions_per_week: maxSessions,
      max_duration_minutes_per_session: maxDuration,
      intensity_start: "LOW",
    },
    constraints: [],
  };

  const requirements = {
    cardio_modality_requirements_version: "cardio-modality-requirements-v1",
    status,
    requirements: [],
    reasons: [],
    constraints: [],
  };

  if (strategy === "STEPS_ONLY") {
    requirements.requirements.push({
      modality_type: "STEPS",
      allowed_intensity: "LOW",
      max_duration_minutes: 0,
    });
  } else if (strategy === "CARDIO_SESSIONS") {
    requirements.requirements.push({
      modality_type: "LISS",
      allowed_intensity: "LOW",
      max_duration_minutes: maxDuration,
    });
  }

  return { spec, requirements };
}

test("buildCardioPrescription: returns WITHHELD when upstream is WITHHELD", () => {
  const { spec, requirements } = createMockInput("WITHHELD", "CARDIO_SESSIONS", 2, 20);
  const result = buildCardioPrescription(spec, requirements);

  assert.equal(result.cardio_prescription_version, CARDIO_PRESCRIPTION_VERSION);
  assert.equal(result.status, CardioPrescriptionStatus.WITHHELD);
  assert.equal(result.recommended_sessions, 0);
  assert.deepEqual(result.sessions, []);
  assert.equal(result.steps_prescription, null);
  assert.equal(
    result.reasons[0].code,
    PrescriptionReasonCode.PRESCRIPTION_WITHHELD_DUE_TO_UPSTREAM_STATUS,
  );
});

test("buildCardioPrescription: handles NO_ADDITIONAL_CARDIO correctly", () => {
  const { spec, requirements } = createMockInput("READY", "NO_ADDITIONAL_CARDIO", 0, 0);
  const result = buildCardioPrescription(spec, requirements);

  assert.equal(result.status, CardioPrescriptionStatus.READY);
  assert.equal(result.recommended_sessions, 0);
  assert.deepEqual(result.sessions, []);
  assert.equal(result.steps_prescription, null);
  assert.equal(
    result.reasons[0].code,
    PrescriptionReasonCode.PRESCRIPTION_CLEARED_BY_NO_CARDIO_STRATEGY,
  );
});

test("buildCardioPrescription: prescribes steps only when strategy is STEPS_ONLY", () => {
  const { spec, requirements } = createMockInput("READY", "STEPS_ONLY", 0, 0);
  const result = buildCardioPrescription(spec, requirements);

  assert.equal(result.status, CardioPrescriptionStatus.READY);
  assert.equal(result.recommended_sessions, 0);
  assert.deepEqual(result.sessions, []);
  assert.deepEqual(result.steps_prescription, { active: true, intensity: "LOW" });
  assert.equal(
    result.reasons[0].code,
    PrescriptionReasonCode.PRESCRIPTION_STEPS_ONLY,
  );
});

test("buildCardioPrescription: prescribes correct number of LISS sessions", () => {
  const { spec, requirements } = createMockInput("READY", "CARDIO_SESSIONS", 3, 20);
  const result = buildCardioPrescription(spec, requirements);

  assert.equal(result.status, CardioPrescriptionStatus.READY);
  assert.equal(result.recommended_sessions, 3);
  assert.equal(result.sessions.length, 3);
  
  result.sessions.forEach((session, index) => {
    assert.equal(session.sequence, index + 1);
    assert.equal(session.modality_type, "LISS");
    assert.equal(session.duration_minutes, 20);
    assert.equal(session.intensity, "LOW");
  });

  assert.equal(
    result.reasons[0].code,
    PrescriptionReasonCode.PRESCRIPTION_LISS_SESSIONS_BUILT,
  );
});

test("buildCardioPrescription: flags REVIEW_REQUIRED if LISS dose is below minimum", () => {
  const { spec, requirements } = createMockInput("READY", "CARDIO_SESSIONS", 2, 10);
  const result = buildCardioPrescription(spec, requirements);

  assert.equal(result.status, CardioPrescriptionStatus.PROVISIONAL_REVIEW_REQUIRED);
  assert.equal(result.recommended_sessions, 0); // No sessions are prescribed
  assert.deepEqual(result.sessions, []);
  assert.equal(
    result.reasons[0].code,
    PrescriptionReasonCode.PRESCRIPTION_INSUFFICIENT_DURATION_FOR_LISS,
  );
});

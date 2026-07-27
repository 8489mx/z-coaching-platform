import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildCardioModalityRequirements,
  CARDIO_MODALITY_REQUIREMENTS_VERSION,
  CardioModalityRequirementsStatus,
  ModalityType,
  ModalityReasonCode,
} from "../src/cardio-modality-requirements/index.js";

function createMockSpec(status, strategy, intensityStart = "LOW", maxDuration = 20) {
  return {
    cardio_plan_spec_version: "cardio-plan-spec-v1",
    status,
    strategy,
    formal_session_state: "NOT_INDICATED",
    limits: {
      max_sessions_per_week: 2,
      max_duration_minutes_per_session: maxDuration,
      intensity_start: intensityStart,
    },
    constraints: [{ code: "MOCK_CONSTRAINT", scope: "CARDIO", value: {}, reason: "Mock" }],
    reasons: [{ code: "MOCK_REASON", scope: "CARDIO", message: "Mock" }],
    source_review_context: {
      review_flags: [],
      decision_reasons: [],
      missing_or_uncertain_data: [],
    },
  };
}

test("buildCardioModalityRequirements: returns WITHHELD when upstream is WITHHELD", () => {
  const spec = createMockSpec("WITHHELD", "NO_ADDITIONAL_CARDIO");
  const result = buildCardioModalityRequirements(spec);

  assert.equal(result.cardio_modality_requirements_version, CARDIO_MODALITY_REQUIREMENTS_VERSION);
  assert.equal(result.status, CardioModalityRequirementsStatus.WITHHELD);
  assert.deepEqual(result.requirements, []);
  assert.equal(result.constraints.length, 1);
  assert.equal(result.reasons.length, 2);
  assert.equal(
    result.reasons[1].code,
    ModalityReasonCode.MODALITIES_WITHHELD_DUE_TO_UPSTREAM_STATUS,
  );
});

test("buildCardioModalityRequirements: clears requirements for NO_ADDITIONAL_CARDIO", () => {
  const spec = createMockSpec("READY", "NO_ADDITIONAL_CARDIO");
  const result = buildCardioModalityRequirements(spec);

  assert.equal(result.status, CardioModalityRequirementsStatus.READY);
  assert.deepEqual(result.requirements, []);
  assert.equal(
    result.reasons[1].code,
    ModalityReasonCode.MODALITIES_CLEARED_BY_NO_CARDIO_STRATEGY,
  );
});

test("buildCardioModalityRequirements: adds STEPS modality for STEPS_ONLY", () => {
  const spec = createMockSpec("READY", "STEPS_ONLY");
  const result = buildCardioModalityRequirements(spec);

  assert.equal(result.status, CardioModalityRequirementsStatus.READY);
  assert.equal(result.requirements.length, 1);
  assert.deepEqual(result.requirements[0], {
    modality_type: ModalityType.STEPS,
    allowed_intensity: "LOW",
    max_duration_minutes: 0,
  });
  assert.equal(result.reasons[1].code, ModalityReasonCode.MODALITY_STEPS_ONLY);
});

test("buildCardioModalityRequirements: adds LISS modality for CARDIO_SESSIONS with limits", () => {
  const spec = createMockSpec("READY", "CARDIO_SESSIONS", "MODERATE", 30);
  const result = buildCardioModalityRequirements(spec);

  assert.equal(result.status, CardioModalityRequirementsStatus.READY);
  assert.equal(result.requirements.length, 1);
  assert.deepEqual(result.requirements[0], {
    modality_type: ModalityType.LISS,
    allowed_intensity: "MODERATE",
    max_duration_minutes: 30,
  });
  assert.equal(result.reasons[1].code, ModalityReasonCode.MODALITY_LISS_SELECTED);
});

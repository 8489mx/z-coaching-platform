import test from "node:test";
import assert from "node:assert/strict";

import { completeIntake } from "./fixtures/complete-intake.js";
import { evaluateIntake, EquipmentCode, EquipmentLoadCapacity } from "../src/intake-decision-engine/index.js";
import { buildMobilityPlanSpecification } from "../src/mobility-plan-specification/index.js";
import { buildMobilityModalityRequirements, MobilityModalityType } from "../src/mobility-modality-requirements/index.js";
import { buildMobilityPrescription, MobilityPrescriptionStatus, MobilityPrescriptionReasonCode } from "../src/mobility-prescription/index.js";

test("buildMobilityPrescription allocates 3m dynamic and 2m static for a healthy client", () => {
  const equipment = []; // Bodyweight only
  const intake = completeIntake({
    training: { equipment, injuries: [], medicalMovementRestrictions: [] }
  });
  const decision = evaluateIntake(intake, { assessmentDate: "2026-07-29" });
  const spec = buildMobilityPlanSpecification(decision);
  const modalities = buildMobilityModalityRequirements(spec, equipment);
  const prescription = buildMobilityPrescription(spec, modalities);

  assert.equal(prescription.status, MobilityPrescriptionStatus.READY);
  assert.equal(prescription.prescribed_modalities.length, 2);
  
  const dynamicReq = prescription.prescribed_modalities.find(m => m.modality_type === MobilityModalityType.DYNAMIC_STRETCHING);
  assert.ok(dynamicReq);
  assert.equal(dynamicReq.duration_minutes, 3);
  
  const staticReq = prescription.prescribed_modalities.find(m => m.modality_type === MobilityModalityType.STATIC_STRETCHING);
  assert.ok(staticReq);
  assert.equal(staticReq.duration_minutes, 2);
});

test("buildMobilityPrescription requires coach review if client has an injury", () => {
  const equipment = [];
  const intake = completeIntake({
    training: { 
      equipment, 
      injuries: [{ type: "SPRAIN", bodyPart: "KNEE", side: "LEFT", limitation: "Cannot fully bend" }],
      medicalMovementRestrictions: []
    }
  });
  
  const decision = evaluateIntake(intake, { assessmentDate: "2026-07-29" });
  const spec = buildMobilityPlanSpecification(decision);
  const modalities = buildMobilityModalityRequirements(spec, equipment);
  const prescription = buildMobilityPrescription(spec, modalities);

  assert.equal(prescription.status, MobilityPrescriptionStatus.PROVISIONAL_REVIEW_REQUIRED);
  assert.equal(prescription.prescribed_modalities.length, 0);
  assert.ok(prescription.reasons.some(r => r.code === MobilityPrescriptionReasonCode.PRESCRIPTION_REVIEW_REQUIRED_DUE_TO_INJURY));
});

test("buildMobilityPrescription is withheld when mobility strategy is NONE", () => {
  const intake = completeIntake({
    primaryGoal: "PERFORMANCE",
    activityLevel: "VERY_HIGH" // Forces NONE strategy as seen in previous phase
  });
  // Note: Just mocking the spec instead since forcing NO mobility might require complex fixture setup
  const spec = {
    formal_session_state: "NOT_INDICATED",
    plan_status: "READY",
    limitations: []
  };
  const modalities = { status: "READY", requirements: [], constraints: [], reasons: [] };
  const prescription = buildMobilityPrescription(spec, modalities);
  
  assert.equal(prescription.status, "READY");
  assert.equal(prescription.prescribed_modalities.length, 0);
  assert.ok(prescription.reasons.some(r => r.code === MobilityPrescriptionReasonCode.PRESCRIPTION_CLEARED_BY_NO_MOBILITY_STRATEGY));
});

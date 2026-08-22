import test from "node:test";
import assert from "node:assert/strict";

import { completeIntake } from "./fixtures/complete-intake.js";
import { evaluateIntake, EquipmentCode, EquipmentLoadCapacity } from "../src/intake-decision-engine/index.js";
import { buildMobilityPlanSpecification } from "../src/mobility-plan-specification/index.js";
import { buildMobilityModalityRequirements } from "../src/mobility-modality-requirements/index.js";
import { MobilityModalityType, MobilityModalityRequirementsStatus } from "../src/mobility-modality-requirements/domain/enums.js";

test("buildMobilityModalityRequirements includes foam rolling and resistance bands when equipment is available", () => {
  const equipment = [
    { equipmentCode: EquipmentCode.FOAM_ROLLER, otherEquipmentText: null, loadCapacity: EquipmentLoadCapacity.LIGHT },
    { equipmentCode: EquipmentCode.RESISTANCE_BANDS, otherEquipmentText: null, loadCapacity: EquipmentLoadCapacity.LIGHT }
  ];
  const intake = completeIntake({
    training: { equipment }
  });
  const decision = evaluateIntake(intake, { assessmentDate: "2026-07-29" });
  const spec = buildMobilityPlanSpecification(decision);
  const modalities = buildMobilityModalityRequirements(spec, equipment);

  assert.equal(modalities.status, MobilityModalityRequirementsStatus.READY);
  assert.equal(modalities.requirements.length, 4);
  assert.ok(modalities.requirements.some(r => r.modality_type === MobilityModalityType.STATIC_STRETCHING));
  assert.ok(modalities.requirements.some(r => r.modality_type === MobilityModalityType.DYNAMIC_STRETCHING));
  assert.ok(modalities.requirements.some(r => r.modality_type === MobilityModalityType.FOAM_ROLLING));
  assert.ok(modalities.requirements.some(r => r.modality_type === MobilityModalityType.RESISTANCE_BAND_MOBILITY));
});

test("buildMobilityModalityRequirements omits equipment-dependent modalities when equipment is missing", () => {
  const equipment = [];
  const intake = completeIntake({
    training: { equipment }
  });
  const decision = evaluateIntake(intake, { assessmentDate: "2026-07-29" });
  const spec = buildMobilityPlanSpecification(decision);
  const modalities = buildMobilityModalityRequirements(spec, equipment);

  assert.equal(modalities.status, MobilityModalityRequirementsStatus.READY);
  assert.equal(modalities.requirements.length, 2);
  assert.ok(modalities.requirements.some(r => r.modality_type === MobilityModalityType.STATIC_STRETCHING));
  assert.ok(modalities.requirements.some(r => r.modality_type === MobilityModalityType.DYNAMIC_STRETCHING));
});

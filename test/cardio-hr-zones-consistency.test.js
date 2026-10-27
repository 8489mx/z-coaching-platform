import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateHeartRateZones,
  evaluateCardioInterferenceDecoupling,
  CARDIO_INTENSITIES
} from "../src/execution-engines/cardio-interference-engine.js";

test("FIX-04: Cardio HR zones match Tanaka (208 - 0.7 * age, 60%-70% Zone 2) and reject silent age 28 fallback", () => {
  // 1. Age 40: Tanaka maxHR = 208 - 28 = 180 -> Zone 2 (60%-70%) = 108 - 126 bpm (matches master-engine-v2)
  const zones40 = calculateHeartRateZones(40);
  assert.equal(zones40.age, 40);
  assert.equal(zones40.max_heart_rate_bpm, 180);
  assert.equal(zones40.zone_2_target.min_bpm, 108);
  assert.equal(zones40.zone_2_target.max_bpm, 126);
  assert.equal(zones40.zone_2_target.range_display, "108 - 126 نبضة/دقيقة");

  // 2. Missing age must NOT silently assume 28 years old
  const missingAgeZones = calculateHeartRateZones(undefined);
  assert.equal(missingAgeZones.age, null);
  assert.equal(missingAgeZones.max_heart_rate_bpm, null);
  assert.equal(missingAgeZones.zone_2_target.min_bpm, null);
  assert.equal(missingAgeZones.zone_2_target.max_bpm, null);
  assert.equal(missingAgeZones.zone_2_target.range_display, null);
  assert.equal(missingAgeZones.zone_2_target.missing_age, true);

  // 3. evaluateCardioInterferenceDecoupling without age preserves timing check without fabricated 28yo BPM
  const auditNoAge = evaluateCardioInterferenceDecoupling({
    cardio_type: CARDIO_INTENSITIES.ZONE_2_STEADY_STATE,
    is_same_day: true
  });
  assert.equal(auditNoAge.is_decoupled, true);
  assert.equal(auditNoAge.heart_rate_prescription.missing_age, true);
  assert.equal(auditNoAge.heart_rate_prescription.range_display, null);
});

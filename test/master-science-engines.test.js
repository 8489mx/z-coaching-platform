import test from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluateCardioInterferenceDecoupling,
  CARDIO_INTENSITIES
} from '../src/execution-engines/index.js';

test('3. Cardio Interference Decoupling - Blocks HIIT Same-Hour Clash & Clears Zone 2', () => {
  // Clash scenario: Resistance + HIIT 1 hour apart
  const clash = evaluateCardioInterferenceDecoupling({
    age: 30,
    cardio_type: CARDIO_INTENSITIES.HIGH_INTENSITY_HIIT,
    resistance_session_time: '17:00',
    cardio_session_time: '18:00',
    is_same_day: true
  });
  assert.equal(clash.has_interference_risk, true);
  assert.equal(clash.is_decoupled, false);

  // Safe scenario: Resistance + Zone 2
  const safe = evaluateCardioInterferenceDecoupling({
    age: 30,
    cardio_type: CARDIO_INTENSITIES.ZONE_2_STEADY_STATE,
    resistance_session_time: '17:00',
    cardio_session_time: '18:00',
    is_same_day: true
  });
  assert.equal(safe.has_interference_risk, false);
  assert.equal(safe.is_decoupled, true);
  assert.ok(safe.heart_rate_prescription.range_display.includes('نبضة/دقيقة'));
});


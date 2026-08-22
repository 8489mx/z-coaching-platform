import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateSubscriptionStatus
} from '../src/execution-engines/subscription-lifecycle-engine.js';

test('Subscription Lifecycle, Freeze & Radar Engine Suite', async (t) => {

  await t.test('1. Calculates active subscription status with no freeze logs', () => {
    const result = calculateSubscriptionStatus({
      startDateStr: '2026-08-01',
      durationDays: 30,
      freezeLogs: [],
      referenceDate: '2026-08-15'
    });

    assert.equal(result.status, 'ACTIVE');
    assert.equal(result.is_frozen, false);
    assert.equal(result.days_remaining, 16);
    assert.equal(result.total_frozen_days, 0);
    assert.equal(result.effective_expiry_date, '2026-08-31');
    assert.equal(result.radar_alert, false);
  });

  await t.test('2. Accurately accounts for closed freeze periods and extends expiry date', () => {
    const result = calculateSubscriptionStatus({
      startDateStr: '2026-08-01',
      durationDays: 30,
      freezeLogs: [
        { start: '2026-08-05', end: '2026-08-12', days: 7 }
      ],
      referenceDate: '2026-08-15'
    });

    assert.equal(result.status, 'ACTIVE');
    assert.equal(result.is_frozen, false);
    assert.equal(result.total_frozen_days, 7);
    assert.equal(result.effective_expiry_date, '2026-09-07');
    assert.equal(result.days_remaining, 23);
  });

  await t.test('3. Detects currently frozen state and adjusts status accordingly', () => {
    const result = calculateSubscriptionStatus({
      startDateStr: '2026-08-01',
      durationDays: 30,
      freezeLogs: [
        { start: '2026-08-10', end: null }
      ],
      referenceDate: '2026-08-15'
    });

    assert.equal(result.status, 'FROZEN');
    assert.equal(result.is_frozen, true);
    assert.ok(result.total_frozen_days >= 5);
  });

  await t.test('4. Triggers EXPIRING_SOON and radar alert when <= 5 days remaining', () => {
    const result = calculateSubscriptionStatus({
      startDateStr: '2026-08-01',
      durationDays: 30,
      freezeLogs: [],
      referenceDate: '2026-08-27'
    });

    assert.equal(result.status, 'EXPIRING_SOON');
    assert.equal(result.radar_alert, true);
    assert.equal(result.days_remaining, 4);
    assert.ok(result.whatsapp_renewal_template.includes('4 أيام'));
  });

  await t.test('5. Marks subscription as EXPIRED when days remaining <= 0', () => {
    const result = calculateSubscriptionStatus({
      startDateStr: '2026-08-01',
      durationDays: 30,
      freezeLogs: [],
      referenceDate: '2026-09-05'
    });

    assert.equal(result.status, 'EXPIRED');
    assert.equal(result.days_remaining, 0);
    assert.ok(result.whatsapp_renewal_template.includes('انتهى اليوم'));
  });
});

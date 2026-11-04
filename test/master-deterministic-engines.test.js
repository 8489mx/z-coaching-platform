import test from 'node:test';
import assert from 'node:assert/strict';

import { getPrehabRoutine } from '../src/execution-engines/postural-prehab-engine.js';
import { calculateSubscriptionStatus } from '../src/execution-engines/subscription-lifecycle-engine.js';

// Mock Databases for Deterministic Testing
const mockMobilityCatalog = [
  {
    id: 'prehab_rounded_shoulders',
    issue_tag: 'ROUNDED_SHOULDERS',
    name_ar: 'تصحيح انحناء الكتفين',
    target_session: ['PUSH', 'UPPER'],
    duration_minutes: 3,
    exercises: [{ name_ar: 'Banded Pull-Apart', reps: '20' }]
  },
  {
    id: 'prehab_apt',
    issue_tag: 'ANTERIOR_PELVIC_TILT',
    name_ar: 'تعديل ميل الحوض',
    target_session: ['LEGS', 'LOWER'],
    duration_minutes: 4,
    exercises: [{ name_ar: 'Hip Flexor Stretch', reps: '30s' }]
  }
];



test('Z Coaching Platform - Master Deterministic Engines Suite', async (t) => {

  // 1. Prehab Engine Tests
  await t.test('1. Postural Prehab Engine: injects shoulder prehab before PUSH workouts for clients with rounded shoulders', () => {
    const routine = getPrehabRoutine(['ROUNDED_SHOULDERS'], 'PUSH', mockMobilityCatalog);
    assert.equal(routine.has_prehab, true);
    assert.equal(routine.exercises.length, 1);
    assert.equal(routine.exercises[0].name_ar, 'Banded Pull-Apart');
  });

  await t.test('2. Postural Prehab Engine: ignores upper body prehab on leg day to prevent unnecessary session bloat', () => {
    const routine = getPrehabRoutine(['ROUNDED_SHOULDERS'], 'LEGS', mockMobilityCatalog);
    assert.equal(routine.has_prehab, false);
    assert.equal(routine.exercises.length, 0);
  });

  // 4. Subscription Lifecycle Engine Tests
  await t.test('8. Subscription Lifecycle Engine: accurately accounts for frozen days in final expiration calculations', () => {
    const status = calculateSubscriptionStatus({
      startDateStr: '2026-08-01',
      durationDays: 30,
      freezeLogs: [{ days: 7 }],
      referenceDate: new Date('2026-08-20')
    });

    // 30 base days + 7 frozen days = 37 total days from Aug 1 -> Expires Sept 7
    assert.equal(status.total_frozen_days, 7);
    assert.ok(status.days_remaining > 15);
    assert.equal(status.status, 'ACTIVE');
  });

  await t.test('9. Subscription Lifecycle Engine: triggers radar alert when remaining days are <= 5', () => {
    const status = calculateSubscriptionStatus({
      startDateStr: '2026-08-01',
      durationDays: 25,
      freezeLogs: [],
      referenceDate: new Date('2026-08-22') // 21 days passed, 4 remaining
    });

    assert.equal(status.days_remaining, 4);
    assert.equal(status.radar_alert, true);
    assert.equal(status.status, 'EXPIRING_SOON');
  });

});

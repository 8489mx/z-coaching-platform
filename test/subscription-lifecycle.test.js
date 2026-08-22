import test from 'node:test';
import assert from 'node:assert/strict';

import {
  SUBSCRIPTION_STATUSES,
  evaluateSubscriptionStatus,
  generateRenewalWhatsAppDispatch,
  freezeSubscriptionLifecycle,
  resumeSubscriptionLifecycle,
  calculateBusinessRetentionKpis
} from '../src/execution-engines/index.js';

test('1. Subscription Lifecycle - Evaluates Active, Expiring Soon, Expired and Frozen States', () => {
  const refDate = '2026-10-01';

  // Active: 15 days left
  const active = evaluateSubscriptionStatus({
    subscription_end_date: '2026-10-16',
    is_frozen: false,
    reference_date: refDate
  });
  assert.equal(active.status, SUBSCRIPTION_STATUSES.ACTIVE);
  assert.equal(active.remaining_days, 15);

  // Expiring soon: 2 days left
  const expiring = evaluateSubscriptionStatus({
    subscription_end_date: '2026-10-03',
    is_frozen: false,
    reference_date: refDate
  });
  assert.equal(expiring.status, SUBSCRIPTION_STATUSES.EXPIRING_SOON);
  assert.equal(expiring.remaining_days, 2);

  // Expired: 0 days left
  const expired = evaluateSubscriptionStatus({
    subscription_end_date: '2026-09-30',
    is_frozen: false,
    reference_date: refDate
  });
  assert.equal(expired.status, SUBSCRIPTION_STATUSES.EXPIRED);

  // Frozen
  const frozen = evaluateSubscriptionStatus({
    subscription_end_date: '2026-11-01',
    is_frozen: true,
    reference_date: refDate
  });
  assert.equal(frozen.status, SUBSCRIPTION_STATUSES.FROZEN);
});

test('2. Subscription Lifecycle - Generates 1-Click WhatsApp Renewal Dispatch Link', () => {
  const renewal = generateRenewalWhatsAppDispatch({
    client_name: 'أحمد كمال',
    phone_number: '01012345678',
    package_name: 'باقة ELITE VIP',
    remaining_days: 3,
    current_progress_summary: 'خسارة 6 كجم وزيادة أوزان السكوات +15kg'
  });

  assert.ok(renewal.dispatch_url.includes('https://wa.me/201012345678'));
  assert.ok(renewal.message_ar.includes('أحمد كمال'));
  assert.ok(renewal.message_ar.includes('ELITE VIP'));
  assert.ok(renewal.message_ar.includes('3 أيام'));
});

test('3. Subscription Lifecycle - Freeze & Resume Extends End Date by Exact Freeze Elapsed Days', () => {
  // Freeze on 2026-10-01
  const freeze = freezeSubscriptionLifecycle({
    client_id: 'c50',
    current_end_date: '2026-12-01',
    freeze_start_date: '2026-10-01',
    reason: 'سفر عمل'
  });
  assert.equal(freeze.success, true);
  assert.equal(freeze.new_status, SUBSCRIPTION_STATUSES.FROZEN);

  // Resume on 2026-10-15 (14 days of freeze elapsed)
  const resume = resumeSubscriptionLifecycle({
    client_id: 'c50',
    freeze_start_date: '2026-10-01',
    resume_date: '2026-10-15',
    original_end_date: '2026-12-01'
  });

  assert.equal(resume.success, true);
  assert.equal(resume.new_status, SUBSCRIPTION_STATUSES.ACTIVE);
  assert.equal(resume.freeze_duration_days, 14);
  assert.equal(resume.updated_end_date, '2026-12-15'); // 2026-12-01 + 14 days
});

test('4. Subscription Lifecycle - Calculates Business Retention & Overview KPIs', () => {
  const sampleSubscriptions = [
    { id: '1', end_date: '2026-12-30', is_frozen: false, is_renewed: false },
    { id: '2', end_date: '2026-12-31', is_frozen: false, is_renewed: false },
    { id: '3', end_date: '2026-10-01', is_frozen: true, is_renewed: false },
    { id: '4', end_date: '2026-08-01', is_frozen: false, is_renewed: true },
    { id: '5', end_date: '2026-08-01', is_frozen: false, is_renewed: true }
  ];

  const kpis = calculateBusinessRetentionKpis(sampleSubscriptions, '2026-08-21');
  assert.equal(kpis.total_subscriptions, 5);
  assert.equal(kpis.frozen_subscriptions, 1);
  assert.ok(kpis.monthly_retention_rate_percent >= 50);
});

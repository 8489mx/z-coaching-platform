import test from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluateClientActivityChurnRisk,
  generatePackageCheckinSchedule,
  evaluateMilestonesAndPRs,
  calculateCohortRetentionAnalytics,
  RETENTION_RISK_LEVELS
} from '../src/execution-engines/behavioral-retention-engine.js';

test('1. Behavioral Engine - 48h Inactivity Triggers CRITICAL Alert & Empathetic WhatsApp Message', () => {
  const now = new Date('2026-08-21T12:00:00Z');
  const lastActive = new Date('2026-08-19T10:00:00Z'); // 50 hours inactive

  const result = evaluateClientActivityChurnRisk({
    client_name: 'طارق عبد العزيز',
    phone_number: '01011111112',
    package_tier: 'max',
    last_activity_date: lastActive,
    current_week_number: 3,
    reference_time: now
  });

  assert.equal(result.risk_level, RETENTION_RISK_LEVELS.CRITICAL_INACTIVE_48H);
  assert.equal(result.alert_required, true);
  assert.ok(result.whatsapp_template && result.whatsapp_template.includes('آخر 48 ساعة'));
  assert.ok(result.whatsapp_url && result.whatsapp_url.includes('https://wa.me/201011111112'));
});

test('2. Behavioral Engine - Active Client (<24h) Has No Critical Alert', () => {
  const now = new Date('2026-08-21T12:00:00Z');
  const lastActive = new Date('2026-08-21T06:00:00Z'); // 6 hours inactive

  const result = evaluateClientActivityChurnRisk({
    client_name: 'سارة المنصوري',
    phone_number: '01011111110',
    package_tier: 'max',
    last_activity_date: lastActive,
    current_week_number: 2,
    reference_time: now
  });

  assert.equal(result.risk_level, RETENTION_RISK_LEVELS.ACTIVE_ENGAGED);
  assert.equal(result.alert_required, false);
});

test('3. Behavioral Engine - Package-Aware Check-in Schedules', () => {
  // MAX VIP: Every 7 days (Weekly)
  const maxSched = generatePackageCheckinSchedule('max', 3);
  assert.equal(maxSched.checkin_interval_days, 7);
  assert.equal(maxSched.is_checkin_due_this_week, true);

  // ELITE: Every 14 days (Bi-weekly)
  const eliteWeek1 = generatePackageCheckinSchedule('elite', 1);
  assert.equal(eliteWeek1.checkin_interval_days, 14);
  assert.equal(eliteWeek1.is_checkin_due_this_week, false);

  const eliteWeek2 = generatePackageCheckinSchedule('elite', 2);
  assert.equal(eliteWeek2.is_checkin_due_this_week, true);
});

test('4. Behavioral Engine - Personal Record (PR) Milestone Celebration Loop', () => {
  const prResult = evaluateMilestonesAndPRs({
    current_exercise_name: 'Leg Press',
    logged_weight_kg: 220,
    previous_best_weight_kg: 200
  });

  assert.equal(prResult.has_celebration, true);
  assert.equal(prResult.celebration.type, 'PERSONAL_RECORD');
  assert.ok(prResult.celebration.message_ar.includes('220 كجم'));
});

test('5. Behavioral Engine - Cohort Retention & Drop-off Risk Analytics', () => {
  const clients = [
    { current_week: 2, hours_inactive: 5 },
    { current_week: 5, hours_inactive: 52 }, // Critical in week 5
    { current_week: 6, hours_inactive: 30 }, // At risk in week 6
    { current_week: 14, hours_inactive: 10 }
  ];

  const analytics = calculateCohortRetentionAnalytics(clients);
  assert.equal(analytics.total_clients, 4);
  assert.equal(analytics.critical_inactive_count, 1);
  assert.equal(analytics.at_risk_count, 1);
  assert.equal(analytics.active_count, 2);
  assert.equal(analytics.overall_retention_rate_percent, 50);
});

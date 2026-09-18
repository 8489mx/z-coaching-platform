import test from 'node:test';
import assert from 'node:assert/strict';

import {
  TRIAGE_TIERS,
  QUICK_ACTIONS,
  evaluateClientTriageItem,
  generateDailyCoachTriage
} from '../src/execution-engines/index.js';

test('3. Coach Triage Cockpit - Deterministic Client Matrix Classification', () => {
  const clients = [
    { id: '1', name: 'سارة', has_pending_checkin: true, phone: '01011111110' },
    { id: '2', name: 'أحمد', has_reported_pain: true, pain_joint: 'الركبة', phone: '01011111111' },
    { id: '3', name: 'محمد', subscription_remaining_days: 2, is_frozen: false, phone: '01011111112' },
    { id: '4', name: 'كريم', days_since_last_workout: 4, is_frozen: false, phone: '01011111113' },
    { id: '5', name: 'محمود', is_weight_stalled: true, phone: '01011111114' },
    { id: '6', name: 'عمر', days_since_last_workout: 0, phone: '01011111115' }
  ];

  const triage = generateDailyCoachTriage(clients);

  assert.equal(triage.total_clients, 6);
  assert.equal(triage.counts.red_flags, 3);    // סارة, أحمد, محمد
  assert.equal(triage.counts.yellow_flags, 2); // كريم, محمود
  assert.equal(triage.counts.green_flags, 1);  // عمر

  assert.equal(triage.red_flag_queue[0].primary_action, QUICK_ACTIONS.APPROVE_CHECKIN);
  assert.equal(triage.red_flag_queue[1].primary_action, QUICK_ACTIONS.TRIGGER_DELOAD);
  assert.equal(triage.red_flag_queue[2].primary_action, QUICK_ACTIONS.DISPATCH_WHATSAPP);
});

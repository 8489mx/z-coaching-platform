import test from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluateCoachCapacity,
  calculateRetentionAndChurn,
  generateDailyCoachTriage
} from '../src/execution-engines/coach-capacity-engine.js';

test('Coach Capacity, Retention Analytics & Daily Triage Engine Suite', async (t) => {

  await t.test('1. evaluateCoachCapacity: Calculates utilization rate and flags capacity limits', () => {
    const optimal = evaluateCoachCapacity({
      activeClientsCount: 30,
      maxCapacityCap: 50,
      pendingCheckinsCount: 5
    });

    assert.equal(optimal.utilization_rate_pct, 60);
    assert.equal(optimal.remaining_slots, 20);
    assert.equal(optimal.can_accept_new_clients, true);
    assert.equal(optimal.status, 'OPTIMAL_CAPACITY');
    assert.equal(optimal.estimated_daily_triage_minutes, 20); // 5 * 4 min

    const full = evaluateCoachCapacity({
      activeClientsCount: 50,
      maxCapacityCap: 50,
      pendingCheckinsCount: 10
    });

    assert.equal(full.utilization_rate_pct, 100);
    assert.equal(full.remaining_slots, 0);
    assert.equal(full.can_accept_new_clients, false);
    assert.equal(full.status, 'CAPACITY_REACHED');
  });

  await t.test('2. calculateRetentionAndChurn: Calculates Renewal, Churn, LTV, and MRR', () => {
    const metrics = calculateRetentionAndChurn({
      startPeriodClientsCount: 40,
      renewedClientsCount: 18,
      churnedClientsCount: 2,
      newClientsCount: 5,
      averageSubscriptionPrice: 1000
    });

    // Renewal: 18 / 20 = 90%
    assert.equal(metrics.renewal_rate_pct, 90);
    assert.equal(metrics.churn_rate_pct, 10);
    assert.equal(metrics.estimated_lifetime_months, 10.0);
    assert.equal(metrics.customer_lifetime_value, 10000);
    assert.equal(metrics.active_clients_total, 43); // 40 - 2 + 5 = 43
    assert.equal(metrics.estimated_mrr, 43000);
    assert.equal(metrics.health_rating, 'EXCELLENT');
  });

  await t.test('3. generateDailyCoachTriage: Categorizes clients into High, Medium, and Routine queues', () => {
    const clients = [
      { id: 'c1', name: 'أحمد', has_pending_checkin: true },
      { id: 'c2', name: 'سارة', days_remaining: 2, is_frozen: false },
      { id: 'c3', name: 'محمود', days_remaining: 5, is_frozen: false },
      { id: 'c4', name: 'كريم', consecutive_stalls: 2 },
      { id: 'c5', name: 'علي', days_remaining: 20, is_frozen: false }
    ];

    const triage = generateDailyCoachTriage(clients);

    assert.equal(triage.high_priority_queue.length, 2); // أحمد (تشك إن) + سارة (تجديد 2 يوم)
    assert.equal(triage.medium_priority_queue.length, 2); // محمود (رادار 5 يوم) + كريم (ثبات 2 أسبوع)
    assert.equal(triage.routine_queue.length, 1); // علي (مستقر)
    assert.equal(triage.total_actions_needed, 4);
  });

});

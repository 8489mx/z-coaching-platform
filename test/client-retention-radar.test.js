import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateClientRetentionHealth,
  batchEvaluateRetentionRadar
} from '../src/execution-engines/client-retention-radar-engine.js';

test('Client Retention & Renewal Radar Engine Suite', async (t) => {

  await t.test('1. Scores high propensity client with strong adherence and steady weight loss', () => {
    const client = {
      name: 'أحمد محمود',
      client_code: 'Z-101',
      primary_goal: 'fat_loss',
      weight_kg: 82
    };

    const history = [
      { week_number: 1, weight_kg: 85, diet_adherence_percentage: 95, workout_adherence_percentage: 90, sleep_quality: 4, stress_level: 2 },
      { week_number: 2, weight_kg: 84, diet_adherence_percentage: 90, workout_adherence_percentage: 95, sleep_quality: 5, stress_level: 2 },
      { week_number: 3, weight_kg: 83, diet_adherence_percentage: 92, workout_adherence_percentage: 90, sleep_quality: 4, stress_level: 2 },
      { week_number: 4, weight_kg: 82, diet_adherence_percentage: 94, workout_adherence_percentage: 95, sleep_quality: 4, stress_level: 2 }
    ];

    const sub = { days_left: 6 };

    const result = calculateClientRetentionHealth({
      client,
      checkinHistory: history,
      subscription: sub,
      currentWeekNumber: 4
    });

    assert.ok(result.total_retention_score >= 80, `Score was: ${result.total_retention_score}`);
    assert.strictEqual(result.category, 'HIGH_PROPENSITY');
    assert.strictEqual(result.is_urgent_renewal, true);
    assert.strictEqual(result.has_risks, false);
    assert.ok(result.whatsapp_outreach_message.includes('أحمد محمود'));
    assert.ok(result.whatsapp_outreach_message.includes('-3 كجم'));
  });

  await t.test('2. Detects AT_RISK client with low adherence and stalled weight', () => {
    const client = {
      name: 'سامي كمال',
      client_code: 'Z-102',
      primary_goal: 'fat_loss',
      weight_kg: 90
    };

    const history = [
      { week_number: 1, weight_kg: 90, diet_adherence_percentage: 60, workout_adherence_percentage: 65, sleep_quality: 2, stress_level: 5 },
      { week_number: 2, weight_kg: 90.5, diet_adherence_percentage: 65, workout_adherence_percentage: 60, sleep_quality: 2, stress_level: 5 }
    ];

    const result = calculateClientRetentionHealth({
      client,
      checkinHistory: history,
      subscription: { days_left: 10 },
      currentWeekNumber: 4
    });

    assert.strictEqual(result.category, 'AT_RISK');
    assert.ok(result.has_risks);
    assert.ok(result.risk_factors.length >= 2);
    assert.ok(result.recommended_action_ar.includes('تدخل فوري'));
  });

  await t.test('3. Batch evaluation computes cohort statistics and projected retention rate', () => {
    const cohort = [
      {
        client: { name: 'علي حسن', primary_goal: 'fat_loss' },
        checkinHistory: [{ weight_kg: 85 }, { weight_kg: 82, diet_adherence_percentage: 95, workout_adherence_percentage: 95 }],
        subscription: { days_left: 5 }
      },
      {
        client: { name: 'عمر نبيل', primary_goal: 'fat_loss' },
        checkinHistory: [{ weight_kg: 80 }, { weight_kg: 80.5, diet_adherence_percentage: 55, workout_adherence_percentage: 60 }],
        subscription: { days_left: 4 }
      }
    ];

    const batch = batchEvaluateRetentionRadar(cohort);

    assert.strictEqual(batch.total_trainees, 2);
    assert.ok(batch.high_propensity_count >= 0);
    assert.ok(batch.at_risk_count >= 1);
    assert.ok(batch.projected_retention_rate_pct > 0);
    assert.strictEqual(batch.evaluations.length, 2);
  });
});

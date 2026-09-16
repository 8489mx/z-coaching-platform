import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { generateMesocycleDebriefReport } from '../src/execution-engines/mesocycle-debrief-engine.js';

describe('Mesocycle Clinical Debrief Report Engine Suite', () => {

  test('1. Calculates accurate biometric deltas, adherence grade, and milestones for fat loss', () => {
    const mockClient = {
      id: 'client_101',
      client_code: '101',
      full_name: 'أحمد محمود العوضي',
      goal_label: 'خسارة دهون وتنشيف',
      initial_weight: 86.0,
      initial_waist_cm: 92
    };

    const mockCheckins = [
      { date: '2026-08-01', weight_kg: 86.0, waist_circumference_cm: 92, diet_adherence_percentage: 95, workout_adherence_percentage: 90, sleep_quality: 4, energy_level: 4, stress_level: 2 },
      { date: '2026-08-08', weight_kg: 85.1, waist_circumference_cm: 91, diet_adherence_percentage: 92, workout_adherence_percentage: 95, sleep_quality: 4, energy_level: 4, stress_level: 2 },
      { date: '2026-08-15', weight_kg: 84.2, waist_circumference_cm: 90, diet_adherence_percentage: 90, workout_adherence_percentage: 95, sleep_quality: 4, energy_level: 3, stress_level: 3 },
      { date: '2026-08-22', weight_kg: 83.0, waist_circumference_cm: 88, diet_adherence_percentage: 94, workout_adherence_percentage: 100, sleep_quality: 4, energy_level: 4, stress_level: 2 }
    ];

    const report = generateMesocycleDebriefReport({
      client: mockClient,
      checkins: mockCheckins,
      mesocycleNumber: 1
    });

    assert.strictEqual(report.client_name, 'أحمد محمود العوضي');
    assert.strictEqual(report.mesocycle_number, 1);
    assert.strictEqual(report.biometrics.net_change_kg, -3.0);
    assert.strictEqual(report.biometrics.net_waist_change_cm, -4.0);
    assert.ok(report.adherence.combined_adherence_pct >= 90);
    assert.ok(['A+', 'A'].includes(report.adherence.grade));
    assert.strictEqual(report.biofeedback.fatigue_level, 'LOW');
    assert.strictEqual(report.biofeedback.deload_recommended, false);
    assert.ok(report.next_mesocycle_directives.length >= 3);
  });

  test('2. Recommends deload week and fatigue mitigation when high fatigue is accumulated', () => {
    const fatiguedClient = {
      id: 'client_102',
      client_code: '102',
      full_name: 'طارق حسام',
      goal_label: 'بناء عضلي وتطوير القوة',
      weight_kg: 78
    };

    // 6 weeks of intense training with high stress and dropping sleep
    const longCheckins = [
      { date: '2026-07-01', weight_kg: 78, sleep_quality: 4, stress_level: 2 },
      { date: '2026-07-08', weight_kg: 78.3, sleep_quality: 3.5, stress_level: 3 },
      { date: '2026-07-15', weight_kg: 78.6, sleep_quality: 3, stress_level: 3.5 },
      { date: '2026-07-22', weight_kg: 79.0, sleep_quality: 2.5, stress_level: 4 },
      { date: '2026-07-29', weight_kg: 79.2, sleep_quality: 2.5, stress_level: 4.5 },
      { date: '2026-08-05', weight_kg: 79.5, sleep_quality: 2.0, stress_level: 4.5 }
    ];

    const report = generateMesocycleDebriefReport({
      client: fatiguedClient,
      checkins: longCheckins,
      mesocycleNumber: 2
    });

    assert.strictEqual(report.total_weeks, 6);
    assert.strictEqual(report.biofeedback.fatigue_level, 'HIGH');
    assert.strictEqual(report.biofeedback.deload_recommended, true);
    assert.ok(report.next_mesocycle_directives.some(d => d.includes('Deload') || d.includes('خفض أحمال')));
  });

});

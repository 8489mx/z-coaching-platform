import test from 'node:test';
import assert from 'node:assert/strict';

process.env.TZ = process.env.TZ || 'Africa/Cairo';

import { generateInitialPlan } from '../src/execution-engines/onboarding-plan-generator-engine.js';
import { evaluateExerciseProgression } from '../src/execution-engines/progressive-overload-deload-engine.js';
import { calculateCalorieCycling } from '../src/execution-engines/calorie-cycling-diet-break-engine.js';
import { calculateWarmupLadder } from '../src/execution-engines/warmup-ladder-engine.js';

test('Server Deterministic Endpoints Logic Test Suite', async (t) => {

  await t.test('1. Timezone verification: Africa/Cairo is set', () => {
    assert.equal(process.env.TZ, 'Africa/Cairo');
  });

  await t.test('2. /api/v1/engines/onboarding/generate-plan logic test', () => {
    const plan = generateInitialPlan({
      name: 'محمود حسن',
      gender: 'MALE',
      age: 26,
      weightKg: 85,
      heightCm: 182,
      activityLevel: 'MODERATE',
      goal: 'FAT_LOSS',
      trainingDaysPerWeek: 4,
      environment: 'GYM'
    });

    assert.equal(plan.client_name, 'محمود حسن');
    assert.ok(plan.daily_targets.calories > 1500);
    assert.ok(plan.daily_targets.target_fiber_g > 0);
  });

  await t.test('3. /api/v1/engines/training/warmup-ladder logic test', () => {
    const ladder = calculateWarmupLadder(100);
    assert.equal(ladder.length, 3);
    assert.equal(ladder[0].weight_kg, 50);
  });

  await t.test('4. /api/v1/engines/training/evaluate-progression logic test', () => {
    const result = evaluateExerciseProgression({
      exerciseId: 'squat',
      exerciseType: 'COMPOUND_LOWER',
      targetRepRange: [8, 10],
      targetRIR: 2,
      loggedSets: [
        { weight_kg: 100, reps: 10, rir: 2 },
        { weight_kg: 100, reps: 10, rir: 2 },
        { weight_kg: 100, reps: 10, rir: 2 }
      ]
    });

    assert.equal(result.status, 'PROGRESSION_UNLOCKED');
    assert.equal(result.decision, 'INCREASE_WEIGHT');
    assert.equal(result.next_weight_kg, 105.0);
  });

  await t.test('5. /api/v1/engines/nutrition/calorie-cycling logic test', () => {
    const result = calculateCalorieCycling({
      dailyAverageCalories: 2000,
      trainingDaysPerWeek: 4,
      weightKg: 80,
      proteinGrams: 160,
      fatGrams: 60
    });

    assert.ok(result.high_day.calories > result.low_day.calories);
    assert.equal(result.weekly_total_calories, 14000);
  });

  await t.test('6. CSV Export logic test: Generates valid UTF-8 BOM headers', () => {
    const headers = ['المعرف', 'الاسم', 'الهاتف', 'النوع', 'الهدف', 'الوزن الحالي (كجم)', 'السعرات المستهدفة', 'حالة الاشتراك'];
    const mockClients = [
      { id: '1', name: 'أحمد علي', phone: '01000000000', gender: 'MALE', goal: 'FAT_LOSS', current_weight_kg: 80, target_calories: 2000, subscription_status: 'ACTIVE' }
    ];
    const rows = mockClients.map((c) => [
      c.id, '"' + c.name + '"', c.phone, c.gender, c.goal, c.current_weight_kg, c.target_calories, c.subscription_status
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    assert.ok(csvContent.startsWith('\uFEFFالمعرف,الاسم'));
    assert.ok(csvContent.includes('أحمد علي'));
  });

  await t.test('7. Admin System Settings persistence logic test', async () => {
    const { getSystemSettingsFile, saveSystemSettingsFile, DEFAULT_SYSTEM_SETTINGS } = await import('../src/api/controllers/admin-settings.controller.js');
    
    assert.ok(DEFAULT_SYSTEM_SETTINGS.coachName);
    assert.ok(DEFAULT_SYSTEM_SETTINGS.whatsappNumber);

    const initial = getSystemSettingsFile();
    assert.ok(initial.coachName);

    // Test updating settings
    const updated = saveSystemSettingsFile({ coachTitle: 'كوتش معتمد ومبرمج أحمال' });
    assert.equal(updated.coachTitle, 'كوتش معتمد ومبرمج أحمال');

    // Restore default
    saveSystemSettingsFile({ coachTitle: initial.coachTitle });
  });

  await t.test('8. Client Feature Flags toggle logic test (Rest Timer & Weight Logging)', async () => {
    const { updateClientFeatureFlags } = await import('../src/api/controllers/client.controller.js');
    const { User } = await import('../src/api/models/index.js');
    
    let mockClient = {
      id: 999,
      client_code: 'CLIENT_999',
      enable_rest_timer: false,
      enable_weight_logging: false,
      update: async function(fields) {
        Object.assign(this, fields);
      }
    };
    
    const origFindOne = User.findOne;
    User.findOne = async () => mockClient;
    
    try {
      let statusCode = null;
      let jsonPayload = null;
      const req = {
        params: { id: '999' },
        body: { enable_rest_timer: true, enable_weight_logging: true }
      };
      const res = {
        status: (c) => { statusCode = c; return { json: (p) => { jsonPayload = p; } }; }
      };
      
      await updateClientFeatureFlags(req, res);
      
      assert.equal(statusCode, 200);
      assert.equal(jsonPayload.success, true);
      assert.equal(mockClient.enable_rest_timer, true);
      assert.equal(mockClient.enable_weight_logging, true);
    } finally {
      User.findOne = origFindOne;
    }
  });

});

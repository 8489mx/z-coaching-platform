import test from 'node:test';
import assert from 'node:assert/strict';

import {
  completeSingleSet,
  completeWorkoutSession,
  getCachedWorkoutLog,
  cacheProgramLocally,
  getCachedProgram,
  cacheGymRushCatalogLocally,
  getCachedGymRushCatalog
} from '../src/execution-engines/offline-workout-sync-engine.js';

class MockStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
}

test('Offline Workout Cache & 1-Tap Completion Suite', async (t) => {

  await t.test('1. Completes a single set and stores in mock storage', () => {
    const storage = new MockStorage();
    const result = completeSingleSet({
      workoutId: 'leg_day_1',
      exerciseId: 'squat_barbell',
      setNumber: 1,
      targetWeightKg: 80,
      targetReps: 10,
      storageDriver: storage
    });

    assert.equal(result.success, true);
    assert.equal(result.updatedSet.weightKg, 80);
    assert.equal(result.updatedSet.completed, true);
  });

  await t.test('2. Completes entire workout session in 1-tap with autoFillTargets', () => {
    const storage = new MockStorage();
    const sampleExercises = [
      {
        id: 'bench_press',
        name_ar: 'بنش برس بالبار',
        sets: [
          { number: 1, targetWeightKg: 70, targetReps: 8 },
          { number: 2, targetWeightKg: 70, targetReps: 8 }
        ]
      },
      {
        id: 'incline_db_press',
        name_ar: 'تجميع دمبلز مائل',
        sets: [
          { number: 1, targetWeightKg: 24, targetReps: 10 }
        ]
      }
    ];

    const result = completeWorkoutSession({
      workoutId: 'push_day_1',
      exercises: sampleExercises,
      autoFillTargets: true,
      storageDriver: storage
    });

    assert.equal(result.success, true);
    assert.equal(result.totalSetsCompleted, 3);

    const cached = getCachedWorkoutLog({ workoutId: 'push_day_1', storageDriver: storage });
    assert.ok(cached !== null);
    assert.equal(cached.data[0].sets[0].weightKg, 70);
  });

  await t.test('3. Caches full client master program locally and retrieves it when offline', () => {
    const storage = new MockStorage();
    const mockProgram = {
      version: 'v2.1',
      training_program: {
        split: 'UPPER_LOWER',
        weeks: [{ week_number: 1, phase: 'ACCUMULATION' }]
      }
    };

    const cacheResult = cacheProgramLocally({
      clientCode: '#105',
      programData: mockProgram,
      storageDriver: storage
    });

    assert.equal(cacheResult.success, true);
    assert.ok(cacheResult.storageKey.includes('105'));

    const retrieved = getCachedProgram({
      clientCode: '105',
      storageDriver: storage
    });

    assert.ok(retrieved !== null);
    assert.equal(retrieved.version, 'v2.1');
    assert.equal(retrieved.training_program.split, 'UPPER_LOWER');
  });

  await t.test('4. Caches Gym Rush equivalence catalog locally and retrieves it for offline gym swaps', () => {
    const storage = new MockStorage();
    const sampleCatalog = [
      {
        original_code: 'BARBELL_BENCH_PRESS',
        swap_id: 'DUMBBELL_FLAT_BENCH_PRESS',
        name_ar: 'تجميع دمبلز مستوي',
        primary_muscle: 'CHEST'
      },
      {
        original_code: 'LAT_PULLDOWN',
        swap_id: 'SEATED_CABLE_ROW',
        name_ar: 'سحب أرضي بالكابل',
        primary_muscle: 'BACK'
      }
    ];

    const cacheResult = cacheGymRushCatalogLocally({
      catalog: sampleCatalog,
      storageDriver: storage
    });

    assert.equal(cacheResult.success, true);
    assert.equal(cacheResult.count, 2);

    const retrievedCatalog = getCachedGymRushCatalog({
      storageDriver: storage
    });

    assert.ok(Array.isArray(retrievedCatalog));
    assert.equal(retrievedCatalog.length, 2);
    assert.equal(retrievedCatalog[0].swap_id, 'DUMBBELL_FLAT_BENCH_PRESS');
  });

});


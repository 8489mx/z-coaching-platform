import test from 'node:test';
import assert from 'node:assert/strict';

import { completeSingleSet, completeWorkoutSession, getCachedWorkoutLog } from '../src/execution-engines/offline-workout-sync-engine.js';

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

});

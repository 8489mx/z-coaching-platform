import { describe, it, expect } from 'vitest';
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

describe('Offline Workout Cache & 1-Tap Completion Suite', () => {

  it('completes a single set and stores in mock storage', () => {
    const storage = new MockStorage();
    const result = completeSingleSet({
      workoutId: 'leg_day_1',
      exerciseId: 'squat_barbell',
      setNumber: 1,
      targetWeightKg: 80,
      targetReps: 10,
      storageDriver: storage
    });

    expect(result.success).toBe(true);
    expect(result.updatedSet.weightKg).toBe(80);
    expect(result.updatedSet.completed).toBe(true);
  });

  it('completes entire workout session in 1-tap with autoFillTargets', () => {
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

    expect(result.success).toBe(true);
    expect(result.totalSetsCompleted).toBe(3);
    expect(result.directive_ar).toContain('تم توثيق كافة المجموعات');

    const cached = getCachedWorkoutLog({ workoutId: 'push_day_1', storageDriver: storage });
    expect(cached).not.toBeNull();
    expect(cached.data[0].sets[0].weightKg).toBe(70);
  });

});

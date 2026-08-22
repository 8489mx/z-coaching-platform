import test from 'node:test';
import assert from 'node:assert/strict';

import {
  saveWorkoutSetOffline,
  getPendingOfflineLogs,
  clearPendingOfflineLogs,
  syncPendingLogsToServer
} from '../src/utils/offline-sync.js';

test('Offline Gym Resilience & Background Sync Suite', async (t) => {

  await t.test('1. saveWorkoutSetOffline saves items to queue with temporary ID and timestamp', () => {
    clearPendingOfflineLogs();
    const res = saveWorkoutSetOffline({
      exercise_id: 'squat',
      weight_kg: 100,
      reps: 10,
      rir: 2
    });

    assert.equal(res.success, true);
    assert.equal(res.is_offline, true);
    assert.ok(res.queued_item.id_temp.startsWith('temp_'));
    assert.ok(res.queued_item.queued_at);

    const pending = getPendingOfflineLogs();
    assert.equal(pending.length, 1);
    assert.equal(pending[0].exercise_id, 'squat');
  });

  await t.test('2. syncPendingLogsToServer sends queued items with mock fetch', async () => {
    clearPendingOfflineLogs();
    saveWorkoutSetOffline({ exercise_id: 'bench_press', weight_kg: 80, reps: 8 });
    saveWorkoutSetOffline({ exercise_id: 'overhead_press', weight_kg: 50, reps: 10 });

    assert.equal(getPendingOfflineLogs().length, 2);

    const mockFetchSuccess = async (url, options) => {
      return { ok: true, status: 200, json: async () => ({ success: true }) };
    };

    const syncRes = await syncPendingLogsToServer('/api/v1/workouts/log-set', mockFetchSuccess);
    assert.equal(syncRes.synced_count, 2);
    assert.equal(syncRes.remaining_count, 0);
    assert.equal(getPendingOfflineLogs().length, 0);
  });

  await t.test('3. syncPendingLogsToServer retains failed items in queue on network error', async () => {
    clearPendingOfflineLogs();
    saveWorkoutSetOffline({ exercise_id: 'deadlift', weight_kg: 140, reps: 5 });

    const mockFetchFail = async () => {
      throw new Error('Network timeout in gym basement');
    };

    const syncRes = await syncPendingLogsToServer('/api/v1/workouts/log-set', mockFetchFail);
    assert.equal(syncRes.synced_count, 0);
    assert.equal(syncRes.remaining_count, 1);
    assert.equal(getPendingOfflineLogs().length, 1);

    clearPendingOfflineLogs();
  });

});

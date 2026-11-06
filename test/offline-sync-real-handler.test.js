import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ACTION_TYPES,
  SYNC_STATUS,
  enqueueOfflineAction,
  flushPendingQueue,
  buildSyncHandler,
} from '../frontend/src/utils/offlineSyncEngine.js';
import {
  flushPendingQueue as flushBackend,
  buildSyncHandler as buildSyncHandlerBackend,
} from '../src/execution-engines/offline-sync-engine.js';

// B2-SYNC: a queued action must be marked SYNCED only on an explicit server
// acknowledgement (success === true). Anything else — a bare {}, undefined,
// a missing handler, a network error, or an action type with no server
// endpoint — stays PENDING/FAILED and is retried, never SYNCED.

const mealQueue = () =>
  enqueueOfflineAction({
    queue: [],
    actionType: ACTION_TYPES.CHECK_MEAL,
    clientId: 'c1',
    payload: { day: 1, mealId: 'm1', mealTitle: 'Breakfast', completed: true },
  }).queue;

test('B2-SYNC: a bare {} response never marks an action SYNCED', async () => {
  for (const flush of [flushPendingQueue, flushBackend]) {
    const res = await flush({ queue: mealQueue(), syncHandler: async () => ({}) });
    assert.equal(res.queue[0].syncStatus, SYNC_STATUS.FAILED);
    assert.equal(res.is_fully_synced, false);
    assert.equal(res.flushed_count, 0);
  }
});

test('B2-SYNC: an undefined response never marks an action SYNCED', async () => {
  const res = await flushPendingQueue({ queue: mealQueue(), syncHandler: async () => undefined });
  assert.equal(res.queue[0].syncStatus, SYNC_STATUS.FAILED);
  assert.equal(res.is_fully_synced, false);
});

test('B2-SYNC: no sync handler at all fails closed, never SYNCED', async () => {
  const res = await flushPendingQueue({ queue: mealQueue() });
  assert.equal(res.queue[0].syncStatus, SYNC_STATUS.FAILED);
  assert.equal(res.is_fully_synced, false);
});

test('B2-SYNC: an explicit { success: true } ack still marks SYNCED', async () => {
  for (const flush of [flushPendingQueue, flushBackend]) {
    const res = await flush({ queue: mealQueue(), syncHandler: async () => ({ success: true }) });
    assert.equal(res.queue[0].syncStatus, SYNC_STATUS.SYNCED);
    assert.equal(res.is_fully_synced, true);
  }
});

test('B2-SYNC: CHECK_MEAL posts to the real meal-logs endpoint with its actionId', async () => {
  const calls = [];
  const mockFetch = async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) });
    return { ok: true, status: 201, json: async () => ({ success: true }) };
  };
  for (const build of [buildSyncHandler, buildSyncHandlerBackend]) {
    calls.length = 0;
    const handler = build({ apiBase: 'http://test', fetchImpl: mockFetch });
    const queue = mealQueue();
    const res = await flushPendingQueue({ queue, syncHandler: handler });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'http://test/api/v1/checkin/meal-logs');
    assert.equal(calls[0].body.action_id, queue[0].actionId);
    assert.equal(calls[0].body.user_id, 'c1');
    assert.equal(calls[0].body.meal_id, 'm1');
    assert.equal(calls[0].body.completed, true);
    assert.equal(res.queue[0].syncStatus, SYNC_STATUS.SYNCED);
  }
});

test('B2-SYNC: CHECK_MEAL with the server down stays FAILED, never SYNCED', async () => {
  const mockFetchDown = async () => {
    throw new Error('fetch failed');
  };
  const handler = buildSyncHandler({ apiBase: 'http://test', fetchImpl: mockFetchDown });
  const res = await flushPendingQueue({ queue: mealQueue(), syncHandler: handler });
  assert.equal(res.queue[0].syncStatus, SYNC_STATUS.FAILED);
  assert.equal(res.queue[0].retryCount, 1);
  assert.equal(res.is_fully_synced, false);
});

test('B2-SYNC: a 500 from the server stays FAILED, never SYNCED', async () => {
  const mockFetch500 = async () => ({
    ok: false,
    status: 500,
    json: async () => ({ success: false, error: 'boom' }),
  });
  const handler = buildSyncHandler({ apiBase: 'http://test', fetchImpl: mockFetch500 });
  const res = await flushPendingQueue({ queue: mealQueue(), syncHandler: handler });
  assert.equal(res.queue[0].syncStatus, SYNC_STATUS.FAILED);
  assert.equal(res.is_fully_synced, false);
});

test('B2-SYNC: LOG_SET posts to the real workout-logs endpoint', async () => {
  const calls = [];
  const mockFetch = async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) });
    return { ok: true, status: 201, json: async () => ({ success: true }) };
  };
  const handler = buildSyncHandler({ apiBase: 'http://test', fetchImpl: mockFetch });
  const queue = enqueueOfflineAction({
    queue: [],
    actionType: ACTION_TYPES.LOG_SET,
    clientId: 'c1',
    payload: {
      program_id: 7,
      week_number: 2,
      day_number: 3,
      session_title: 'Legs',
      logged_exercises: [{ exercise_code: 'SQUAT', weight_kg: 80, last_set_reps: 8 }],
    },
  }).queue;
  const res = await flushPendingQueue({ queue, syncHandler: handler });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'http://test/api/v1/checkin/workout-logs');
  assert.equal(calls[0].body.program_id, 7);
  assert.equal(calls[0].body.logged_exercises.length, 1);
  assert.equal(res.queue[0].syncStatus, SYNC_STATUS.SYNCED);
});

test('B2-SYNC: LOG_WATER and SAVE_CHECKIN_DRAFT have no endpoint and fail closed', async () => {
  // No server endpoint covers these types and no UI producer enqueues them.
  // The handler must never report success for them — they stay FAILED so a
  // future endpoint can pick them up instead of silently dropping them.
  const calls = [];
  const mockFetch = async (url) => {
    calls.push(url);
    return { ok: true, status: 200, json: async () => ({ success: true }) };
  };
  const handler = buildSyncHandler({ apiBase: 'http://test', fetchImpl: mockFetch });
  for (const actionType of [ACTION_TYPES.LOG_WATER, ACTION_TYPES.SAVE_CHECKIN_DRAFT]) {
    const queue = enqueueOfflineAction({ queue: [], actionType, clientId: 'c1', payload: {} }).queue;
    const res = await flushPendingQueue({ queue, syncHandler: handler });
    assert.equal(res.queue[0].syncStatus, SYNC_STATUS.FAILED, actionType);
    assert.equal(res.is_fully_synced, false, actionType);
  }
  assert.equal(calls.length, 0);
});

test('B2-SYNC: an unknown action type fails closed and never reaches the server', async () => {
  const calls = [];
  const mockFetch = async (url) => {
    calls.push(url);
    return { ok: true, status: 200, json: async () => ({ success: true }) };
  };
  const handler = buildSyncHandler({ apiBase: 'http://test', fetchImpl: mockFetch });
  const queue = [{ actionId: 'act_x', syncStatus: SYNC_STATUS.PENDING, actionType: 'NOPE', clientId: 'c1', payload: {} }];
  const res = await flushPendingQueue({ queue, syncHandler: handler });
  assert.equal(res.queue[0].syncStatus, SYNC_STATUS.FAILED);
  assert.equal(calls.length, 0);
});

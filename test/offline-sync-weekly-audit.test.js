import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ACTION_TYPES,
  SYNC_STATUS,
  enqueueOfflineAction,
  flushPendingQueue,
  getQueueSyncStatus,
  evaluateWeeklyCheckinAudit
} from '../src/execution-engines/index.js';

test('1. Persistent Action Queue - Enqueues Multiple In-Gym Offline Transactions', () => {
  let queue = [];

  const res1 = enqueueOfflineAction({
    queue,
    actionType: ACTION_TYPES.LOG_SET,
    clientId: 'c101',
    payload: { exerciseId: 'e1', setNumber: 1, weightKg: 100, reps: 10 }
  });
  queue = res1.queue;

  const res2 = enqueueOfflineAction({
    queue,
    actionType: ACTION_TYPES.CHECK_MEAL,
    clientId: 'c101',
    payload: { mealId: 'm1', completed: true }
  });
  queue = res2.queue;

  const res3 = enqueueOfflineAction({
    queue,
    actionType: ACTION_TYPES.LOG_WATER,
    clientId: 'c101',
    payload: { amountMl: 250 }
  });
  queue = res3.queue;

  assert.equal(queue.length, 3);
  assert.equal(queue[0].syncStatus, SYNC_STATUS.PENDING);
  assert.equal(queue[1].syncStatus, SYNC_STATUS.PENDING);
  assert.equal(queue[2].syncStatus, SYNC_STATUS.PENDING);

  const status = getQueueSyncStatus(queue);
  assert.equal(status.pending_count, 3);
  assert.equal(status.is_fully_synced, false);
});

test('2. Deterministic Auto-Sync Dispatcher - Flushes Queue Idempotently on Reconnection', async () => {
  const mockSyncedServerIds = [];
  const mockSyncApi = async (action) => {
    mockSyncedServerIds.push(action.actionId);
    return { success: true, serverRecordedId: action.actionId };
  };

  let queue = [];
  queue = enqueueOfflineAction({ queue, actionType: ACTION_TYPES.LOG_SET, payload: { set: 1 } }).queue;
  queue = enqueueOfflineAction({ queue, actionType: ACTION_TYPES.LOG_SET, payload: { set: 2 } }).queue;

  const flushResult = await flushPendingQueue({ queue, syncHandler: mockSyncApi });

  assert.equal(flushResult.is_fully_synced, true);
  assert.equal(flushResult.flushed_count, 2);
  assert.equal(flushResult.pending_remaining_count, 0);
  assert.equal(mockSyncedServerIds.length, 2);

  // Idempotency: Re-flushing should not duplicate server calls
  const secondFlush = await flushPendingQueue({ queue: flushResult.queue, syncHandler: mockSyncApi });
  assert.equal(secondFlush.is_fully_synced, true);
  assert.equal(mockSyncedServerIds.length, 2); // No extra calls made
});

test('3. 3-Input Frictionless Weekly Audit & 1-Click WhatsApp Dispatch', () => {
  const clientProfile = {
    id: 'c200',
    name: 'مريم العتيبي',
    phone_number: '01099887766',
    is_female: true,
    has_pcos: false,
    goal: 'FAT_LOSS',
    current_daily_calories: 1700
  };

  const previousWeekData = {
    weight_kg: 70.0,
    waist_cm: 75.0,
    consecutive_training_weeks: 4
  };

  const currentCheckin = {
    current_weight_kg: 70.8, // +0.8kg due to PMS water retention
    waist_circumference_cm: 75.0,
    overall_adherence_percent: 95,
    is_pms_active: true
  };

  const auditResult = evaluateWeeklyCheckinAudit({
    clientProfile,
    previousWeekData,
    currentCheckin
  });

  assert.equal(auditResult.client_id, 'c200');
  assert.equal(auditResult.weight_delta_kg, 0.8);
  assert.equal(auditResult.female_cycle_buffer.deficit_adjustment_locked, true);
  assert.equal(auditResult.next_week_calories, 1700); // Calories protected from deficit drop
  assert.ok(auditResult.whatsapp_dispatch.dispatch_url.includes('https://wa.me/201099887766'));
  assert.ok(auditResult.whatsapp_dispatch.message_ar.includes('مريم العتيبي'));
});

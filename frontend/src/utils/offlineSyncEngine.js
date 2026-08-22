/**
 * Persistent Action Queue & Deterministic Offline-Sync Dispatcher
 *
 * 1. Persistent Action Queue Ledger:
 *    - Captures in-gym inputs (sets, reps, meal completion, water intake, check-in drafts)
 *      as immutable, timestamped transactions in local queue.
 * 2. Idempotent Queue Flushing:
 *    - Flushes pending transactions in strict chronological order upon internet reconnection.
 *    - Deduplicates actions to prevent duplicate server writes.
 */

export const ACTION_TYPES = {
  LOG_SET: 'LOG_SET',
  CHECK_MEAL: 'CHECK_MEAL',
  LOG_WATER: 'LOG_WATER',
  SAVE_CHECKIN_DRAFT: 'SAVE_CHECKIN_DRAFT'
};

export const SYNC_STATUS = {
  PENDING: 'PENDING',
  SYNCED: 'SYNCED',
  FAILED: 'FAILED'
};

/**
 * Creates and enqueues a new offline transaction.
 */
export function enqueueOfflineAction({
  queue = [],
  actionType = ACTION_TYPES.LOG_SET,
  clientId = '1',
  payload = {},
  timestamp = new Date().toISOString()
}) {
  const safeQueue = Array.isArray(queue) ? [...queue] : [];
  const actionId = `act_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  const newAction = {
    actionId,
    clientId,
    timestamp,
    actionType,
    payload,
    syncStatus: SYNC_STATUS.PENDING,
    retryCount: 0
  };

  safeQueue.push(newAction);

  return {
    queue: safeQueue,
    enqueued_action: newAction,
    pending_count: safeQueue.filter(a => a.syncStatus === SYNC_STATUS.PENDING).length,
    status_badge_ar: 'تم الحفظ محلياً (جاهز للمزامنة)'
  };
}

/**
 * Flushes pending offline actions idempotently.
 */
export async function flushPendingQueue({
  queue = [],
  syncHandler = async (action) => ({ success: true })
}) {
  const safeQueue = Array.isArray(queue) ? [...queue] : [];
  const processedActions = [];
  const syncedActionIds = new Set();

  for (let i = 0; i < safeQueue.length; i++) {
    const item = safeQueue[i];

    if (item.syncStatus === SYNC_STATUS.SYNCED) {
      syncedActionIds.add(item.actionId);
      processedActions.push(item);
      continue;
    }

    // Deduplicate
    if (syncedActionIds.has(item.actionId)) {
      processedActions.push({ ...item, syncStatus: SYNC_STATUS.SYNCED });
      continue;
    }

    try {
      const response = await syncHandler(item);
      if (response && response.success !== false) {
        syncedActionIds.add(item.actionId);
        processedActions.push({
          ...item,
          syncStatus: SYNC_STATUS.SYNCED,
          syncedAt: new Date().toISOString()
        });
      } else {
        processedActions.push({
          ...item,
          syncStatus: SYNC_STATUS.FAILED,
          retryCount: (item.retryCount || 0) + 1
        });
      }
    } catch (err) {
      processedActions.push({
        ...item,
        syncStatus: SYNC_STATUS.FAILED,
        retryCount: (item.retryCount || 0) + 1,
        errorMessage: err.message
      });
    }
  }

  const pendingRemaining = processedActions.filter(a => a.syncStatus === SYNC_STATUS.PENDING || a.syncStatus === SYNC_STATUS.FAILED).length;

  return {
    queue: processedActions,
    flushed_count: processedActions.filter(a => a.syncStatus === SYNC_STATUS.SYNCED).length,
    pending_remaining_count: pendingRemaining,
    is_fully_synced: pendingRemaining === 0,
    status_badge_ar: pendingRemaining === 0 ? 'متزامن بالكامل مع الخادم' : `متبقي ${pendingRemaining} عمليات قيد المزامنة`
  };
}

/**
 * Returns summary status for the UI sync badge.
 */
export function getQueueSyncStatus(queue = []) {
  const safeQueue = Array.isArray(queue) ? queue : [];
  const pending = safeQueue.filter(a => a.syncStatus === SYNC_STATUS.PENDING || a.syncStatus === SYNC_STATUS.FAILED).length;
  const synced = safeQueue.filter(a => a.syncStatus === SYNC_STATUS.SYNCED).length;

  return {
    total_actions_count: safeQueue.length,
    pending_count: pending,
    synced_count: synced,
    is_fully_synced: pending === 0,
    status_badge_ar: pending === 0 ? 'متزامن بالكامل' : `${pending} عملية محفوظة محلياً`
  };
}

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
  // Fail-closed default: a caller that forgets its sync handler must never
  // report success. SYNCED requires an explicit server acknowledgement
  // (response.success === true) from a real handler.
  syncHandler = async (_action) => ({ success: false, error: 'NO_SYNC_HANDLER' })
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
      // B2-SYNC: SYNCED only on an explicit server acknowledgement.
      // A bare {} (or any response without success === true) used to count
      // as success, which marked queued completions SYNCED without the
      // server ever seeing them.
      if (response && response.success === true) {
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
          retryCount: (item.retryCount || 0) + 1,
          errorMessage: response?.error || response?.errorMessage || 'SYNC_NOT_ACKNOWLEDGED'
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
 * Builds a real sync handler that sends each queued action to its server
 * endpoint and returns the server's own acknowledgement.
 *
 * B2-SYNC: this replaces the stub that reported { success: true } without
 * sending anything. Routing per action type (inventory at the base head):
 * - LOG_SET -> POST /api/v1/checkin/workout-logs (exists, mirrors the
 *   direct session-log submit).
 * - CHECK_MEAL -> POST /api/v1/checkin/meal-logs (new in this package;
 *   idempotent by actionId, see logMeal in checkin.controller.js).
 * - LOG_WATER / SAVE_CHECKIN_DRAFT -> NO server endpoint exists and no UI
 *   producer enqueues them, so the handler fails closed ({ success: false })
 *   and the action stays FAILED for retry instead of being marked SYNCED.
 * - Unknown action types fail closed the same way.
 *
 * A transport error or a non-2xx response is returned as
 * { success: false } so flushPendingQueue marks the action FAILED — never
 * SYNCED. Only an explicit { success: true } body marks it SYNCED.
 */
export function buildSyncHandler({ apiBase = '', fetchImpl = globalThis.fetch } = {}) {
  const post = async (path, body) => {
    try {
      const res = await fetchImpl(`${apiBase}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { success: false, error: data?.error || `HTTP_${res.status}` };
      return data && typeof data === 'object' ? data : {};
    } catch (err) {
      return { success: false, error: err?.message || 'NETWORK_ERROR' };
    }
  };

  return async (action) => {
    const payload = action?.payload || {};
    switch (action?.actionType) {
      case ACTION_TYPES.CHECK_MEAL:
        return post('/api/v1/checkin/meal-logs', {
          user_id: action.clientId,
          action_id: action.actionId,
          day_number: payload.day ?? null,
          week_number: payload.week ?? null,
          meal_id: payload.mealId,
          meal_title: payload.mealTitle,
          completed: payload.completed !== false,
          logged_at: action.timestamp,
        });
      case ACTION_TYPES.LOG_SET:
        return post('/api/v1/checkin/workout-logs', {
          user_id: action.clientId,
          action_id: action.actionId,
          program_id: payload.program_id ?? null,
          week_number: payload.week_number ?? 1,
          day_number: payload.day_number ?? payload.day ?? 1,
          session_title: payload.session_title ?? null,
          is_quick_completed: payload.is_quick_completed === true,
          logged_exercises: payload.logged_exercises ?? [],
          duration_minutes: payload.duration_minutes ?? 60,
          session_rpe: payload.session_rpe ?? 8,
          notes: payload.notes ?? '',
        });
      case ACTION_TYPES.LOG_WATER:
      case ACTION_TYPES.SAVE_CHECKIN_DRAFT:
        return { success: false, error: `NO_ENDPOINT_FOR_ACTION_TYPE:${action.actionType}` };
      default:
        return { success: false, error: `UNKNOWN_ACTION_TYPE:${action?.actionType}` };
    }
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

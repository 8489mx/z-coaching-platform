/**
 * Offline Gym Resilience & Background Sync Helper
 * Safely caches workout logs and auto-syncs when internet restores.
 */

const OFFLINE_WORKOUT_KEY = 'z_coaching_offline_workout_queue';

// In-memory fallback storage if localStorage is unavailable (e.g. in test/SSR environments)
let inMemoryStorage = [];

function getStorageArray() {
  if (typeof localStorage !== 'undefined') {
    try {
      return JSON.parse(localStorage.getItem(OFFLINE_WORKOUT_KEY) || '[]');
    } catch {
      return [];
    }
  }
  return inMemoryStorage;
}

function setStorageArray(arr) {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(OFFLINE_WORKOUT_KEY, JSON.stringify(arr));
      return;
    } catch (e) {
      console.error('localStorage set error:', e);
    }
  }
  inMemoryStorage = arr;
}

export function saveWorkoutSetOffline(logPayload = {}) {
  try {
    const existing = getStorageArray();
    const item = {
      ...logPayload,
      queued_at: new Date().toISOString(),
      id_temp: 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
    };
    existing.push(item);
    setStorageArray(existing);
    return { success: true, is_offline: true, queued_item: item };
  } catch (err) {
    console.error('Failed to save offline log:', err);
    return { success: false, error: err.message };
  }
}

export function getPendingOfflineLogs() {
  return getStorageArray();
}

export function clearPendingOfflineLogs() {
  setStorageArray([]);
  return { success: true };
}

export async function syncPendingLogsToServer(apiEndpoint = '/api/v1/workouts/log-set', customFetch = null) {
  const pending = getPendingOfflineLogs();
  if (pending.length === 0) return { synced_count: 0, remaining_count: 0 };

  const remaining = [];
  let syncedCount = 0;
  const fetchFn = customFetch || (typeof fetch !== 'undefined' ? fetch : null);

  if (!fetchFn) {
    return { synced_count: 0, remaining_count: pending.length, notice: 'No fetch provider available' };
  }

  for (const log of pending) {
    try {
      const response = await fetchFn(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log)
      });
      if (response.ok || response.status === 200 || response.status === 201) {
        syncedCount++;
      } else {
        remaining.push(log);
      }
    } catch {
      remaining.push(log);
    }
  }

  setStorageArray(remaining);
  return { synced_count: syncedCount, remaining_count: remaining.length };
}

// Auto-sync listener on reconnection
if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('online', () => {
    syncPendingLogsToServer();
  });
}

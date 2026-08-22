/**
 * Offline Sync Manager for Gym Sessions
 * Stores workout sets and meals locally when offline, and automatically syncs when online.
 */

const QUEUE_KEY = 'z_offline_sync_queue';

export function getOfflineQueue() {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function queueOfflineAction(action) {
  const queue = getOfflineQueue();
  queue.push({
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    ...action
  });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function flushOfflineQueue(apiBase) {
  const queue = getOfflineQueue();
  if (queue.length === 0) return { synced: 0 };

  const remaining = [];
  let syncedCount = 0;

  for (const item of queue) {
    try {
      if (item.type === 'LOG_WORKOUT') {
        const res = await fetch(`${apiBase}/api/v1/programs/workout/log`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.payload)
        });
        if (res.ok) {
          syncedCount++;
        } else {
          remaining.push(item);
        }
      }
    } catch (e) {
      remaining.push(item);
    }
  }

  localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  return { synced: syncedCount, remaining: remaining.length };
}

// Auto-register online listener
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[OfflineSync] Network connectivity restored. Flushing pending queue...');
    flushOfflineQueue('');
  });
}

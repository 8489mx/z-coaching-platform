/**
 * Z-Coaching Offline Storage Engine (IndexedDB)
 * يحمي البيانات من المسح العشوائي (Safari 7-day purge) ويتيح تخزين الخطط والعمليات المعلقة.
 */

const DB_NAME = 'z_coaching_db';
const DB_VERSION = 1;
const STORE_CACHE = 'plan_cache';
const STORE_OUTBOX = 'sync_outbox';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject('فشل في فتح قاعدة البيانات المحلية');

    request.onsuccess = (e) => resolve(e.target.result);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_CACHE)) {
        db.createObjectStore(STORE_CACHE); // Key-Value cache
      }
      if (!db.objectStoreNames.contains(STORE_OUTBOX)) {
        db.createObjectStore(STORE_OUTBOX, { keyPath: 'id', autoIncrement: true }); // Queue for offline actions
      }
    };
  });
}

export const OfflineDB = {
  // --- Plan Cache (Key-Value) ---
  async setItem(key, value) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CACHE, 'readwrite');
      tx.objectStore(STORE_CACHE).put(value, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject('خطأ في حفظ البيانات المحفوظة');
    });
  },

  async getItem(key) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CACHE, 'readonly');
      const req = tx.objectStore(STORE_CACHE).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject('خطأ في قراءة البيانات');
    });
  },

  // --- Outbox (Sync Queue) ---
  async addToOutbox(actionPayload) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_OUTBOX, 'readwrite');
      const item = {
        ...actionPayload,
        timestamp: Date.now(),
        retryCount: 0
      };
      tx.objectStore(STORE_OUTBOX).add(item);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject('تعذر حفظ العملية في الصندوق المؤقت');
    });
  },

  async getOutbox() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_OUTBOX, 'readonly');
      const req = tx.objectStore(STORE_OUTBOX).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject('خطأ في قراءة صندوق العمليات');
    });
  },

  async removeFromOutbox(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_OUTBOX, 'readwrite');
      tx.objectStore(STORE_OUTBOX).delete(id);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject('خطأ في مسح العملية المكتملة');
    });
  },

  async incrementRetry(id, currentCount) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_OUTBOX, 'readwrite');
      const store = tx.objectStore(STORE_OUTBOX);
      const req = store.get(id);
      req.onsuccess = () => {
        const data = req.result;
        if (data) {
          data.retryCount = currentCount + 1;
          store.put(data);
        }
      };
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject('خطأ في تحديث عداد المحاولات');
    });
  }
};

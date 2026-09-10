import { OfflineDB } from './offlineStorage';

/**
 * Z-Coaching Sync Manager
 * يدير إرسال البيانات للسيرفر. إذا كان الإنترنت مقطوعاً أو فشل الاتصال،
 * يقوم بتخزين العملية في الـ Outbox ومحاولة إرسالها لاحقاً.
 */

const MAX_RETRIES = 5; // To prevent "Stuck Outbox" infinite loop

export class SyncManager {
  
  /**
   * محاولة إرسال طلب API. إذا فشل (أوفلاين أو خطأ شبكة)، يحفظه في الـ Outbox.
   */
  static async requestOrQueue(endpoint, method, payload) {
    if (!navigator.onLine) {
      await OfflineDB.addToOutbox({ endpoint, method, payload });
      return { success: false, queued: true, message: 'أنت غير متصل بالإنترنت. تم حفظ العملية محلياً وستُرفع لاحقاً.' };
    }

    try {
      const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
      };
      if (method && method.toUpperCase() !== 'GET' && method.toUpperCase() !== 'HEAD' && payload !== undefined) {
        options.body = JSON.stringify(payload);
      }
      const res = await fetch(endpoint, options);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        
        // إذا كان الخطأ بسبب انتهاء الاشتراك أو خطأ 4xx لا نضعه في طابور الإعادة لتجنب الحلقات المفرغة
        if (res.status >= 400 && res.status < 500) {
          throw new Error(errorData.error || 'طلب مرفوض من الخادم');
        }
        
        // أخطاء السيرفر 5xx قد تُحل لاحقاً، لذلك نضعها في الطابور
        throw new Error('خطأ مؤقت في الخادم'); 
      }

      const data = await res.json();
      return { success: true, queued: false, data };

    } catch (error) {
      // خطأ شبكة (Network Error) أو خطأ 5xx
      if (error.message.includes('طلب مرفوض')) {
        throw error; // خطأ قاتل، لا تحاول مرة أخرى
      }
      
      await OfflineDB.addToOutbox({ endpoint, method, payload });
      return { success: false, queued: true, message: 'تعذر الاتصال بالخادم. تم حفظ العملية للمزامنة التلقائية.' };
    }
  }

  /**
   * سحب العمليات العالقة في الـ Outbox ومحاولة إرسالها
   */
  static async syncOutbox() {
    if (!navigator.onLine) return;

    const outbox = await OfflineDB.getOutbox();
    if (outbox.length === 0) return;

    console.log(`[SyncManager] Found ${outbox.length} pending actions. Syncing...`);

    for (const item of outbox) {
      if (item.retryCount >= MAX_RETRIES) {
        console.warn(`[SyncManager] Action ${item.id} exceeded max retries. Discarding.`);
        await OfflineDB.removeFromOutbox(item.id);
        continue;
      }

      try {
        const res = await fetch(item.endpoint, {
          method: item.method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.payload)
        });

        if (res.ok || (res.status >= 400 && res.status < 500)) {
          // نجح الإرسال أو تم الرفض القاطع (مثل انتهاء الاشتراك) -> نحذف من الطابور
          await OfflineDB.removeFromOutbox(item.id);
        } else {
          // السيرفر معطل 5xx -> زد عداد المحاولات
          await OfflineDB.incrementRetry(item.id, item.retryCount);
        }
      } catch (err) {
        // فشل الاتصال -> زد عداد المحاولات
        await OfflineDB.incrementRetry(item.id, item.retryCount);
      }
    }
  }
}

// استمع لعودة الإنترنت لعمل مزامنة تلقائية
window.addEventListener('online', () => {
  SyncManager.syncOutbox();
});

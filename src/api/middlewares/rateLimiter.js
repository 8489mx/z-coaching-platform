import { RateLimitLog } from "../models/index.js";

/**
 * Universal In-Memory Sliding Window Rate Limiter Factory
 */
export function createRateLimiter({
  windowMs = 15 * 60 * 1000,
  maxAttempts = 5,
  message = "تم تجاوز الحد الأقصى للمحاولات المسموحة. يرجى الانتظار قبل المحاولة مرة أخرى.",
  keyPrefix = "global",
  countAllRequests = false
}) {
  const store = new Map();

  const limiter = async (req, res, next) => {
    try {
      const ip = req.headers['x-forwarded-for'] 
        || req.socket.remoteAddress 
        || req.ip 
        || '127.0.0.1';
      
      const key = `${keyPrefix}:${ip}`;
      const now = Date.now();

      let record = store.get(key);

      if (record) {
        if (now - record.firstAttempt < windowMs) {
          if (record.count >= maxAttempts) {
            const remainingMins = Math.max(1, Math.ceil((windowMs - (now - record.firstAttempt)) / 60000));
            const remainingSec = Math.max(1, Math.ceil((windowMs - (now - record.firstAttempt)) / 1000));
            
            res.setHeader('Retry-After', remainingSec);
            res.setHeader('X-RateLimit-Limit', maxAttempts);
            res.setHeader('X-RateLimit-Remaining', 0);
            res.setHeader('X-RateLimit-Reset', Math.ceil((record.firstAttempt + windowMs) / 1000));

            return res.status(429).json({
              error: typeof message === 'function' ? message(remainingMins) : message.replace('${remainingMins}', String(remainingMins)),
              blocked: true,
              remainingMinutes: remainingMins
            });
          }
        } else {
          // Window expired, reset window
          record = { count: 0, firstAttempt: now };
          store.set(key, record);
        }
      } else {
        record = { count: 0, firstAttempt: now };
        store.set(key, record);
      }

      if (countAllRequests) {
        record.count += 1;
      }

      const remaining = Math.max(0, maxAttempts - record.count);
      res.setHeader('X-RateLimit-Limit', maxAttempts);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', Math.ceil((record.firstAttempt + windowMs) / 1000));

      req.clientIp = ip;
      next();
    } catch (err) {
      console.error(`RateLimiter (${keyPrefix}) error:`, err);
      next();
    }
  };

  limiter.recordFailure = (ip) => {
    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();
    const record = store.get(key) || { count: 0, firstAttempt: now };
    record.count += 1;
    store.set(key, record);
    return record;
  };

  limiter.reset = (ip) => {
    const key = `${keyPrefix}:${ip}`;
    store.delete(key);
  };

  limiter.getStore = () => store;

  return limiter;
}

// 1. Authentication Rate Limiter (Brute-Force Protection for Login & Registration)
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxAttempts: 5,
  keyPrefix: "auth",
  countAllRequests: true,
  message: (remainingMins) => `تم تجاوز الحد الأقصى لمحاولات تسجيل الدخول (5 محاولات). يرجى الانتظار لمدة ${remainingMins} دقيقة قبل المحاولة مجدداً.`
});

// 2. Upload Rate Limiter (Storage & DoS Protection for Photos and Exercise Images)
export const uploadRateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutes
  maxAttempts: 20,
  keyPrefix: "upload",
  countAllRequests: true,
  message: (remainingMins) => `تم تجاوز الحد الأقصى المسموح لرفع الملفات (20 ملف خلال 10 دقائق). يرجى الانتظار لمدة ${remainingMins} دقيقة.`
});

// 3. Export & Backup Rate Limiter (Heavy DB & Memory Resource Protection)
export const exportRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxAttempts: 5,
  keyPrefix: "export",
  countAllRequests: true,
  message: (remainingMins) => `تم تجاوز الحد الأقصى لعمليات التصدير والنسخ الاحتياطي (5 محاولات خلال 15 دقيقة). يرجى الانتظار ${remainingMins} دقيقة.`
});

// 4. Intake Rate Limiter (Preserves existing contract for client intake flows)
export const intakeRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxAttempts: 5,
  keyPrefix: "intake",
  countAllRequests: false, // Counts on failure via recordFailedAttempt
  message: (remainingMins) => `تم تجاوز الحد الأقصى للمحاولات الخاطئة (5 محاولات). يرجى الانتظار لمدة ${remainingMins} دقيقة قبل المحاولة مرة أخرى.`
});

// Retain legacy helpers for full backward compatibility
export const recordFailedAttempt = async (ip, attemptedCode = '') => {
  try {
    const record = intakeRateLimiter.recordFailure(ip);

    // Also persist in Database
    if (RateLimitLog && typeof RateLimitLog.create === 'function') {
      await RateLimitLog.create({
        ip_address: String(ip).substring(0, 45),
        attempted_code: String(attemptedCode).substring(0, 30),
        attempt_count: record.count,
        is_blocked: record.count >= 5,
        last_attempt: new Date()
      });
    }
  } catch (e) {
    console.error("recordFailedAttempt DB log error:", e);
  }
};

export const resetAttempts = (ip) => {
  intakeRateLimiter.reset(ip);
};

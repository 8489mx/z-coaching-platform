import { RateLimitLog } from "../models/index.js";

/**
 * Universal In-Memory Sliding Window Rate Limiter Factory.
 *
 * P1-B12: all limiter instances share ONE module-level store (keyed by the
 * full `${keyPrefix}:${identifier}`), so limits are shared infrastructure
 * instead of per-operation silos. Each record carries its own windowMs, so
 * the shared cleanup never applies one limiter's window to another's record.
 *
 * Single-instance assumption (documented, not assumed silently): the
 * production deployment runs ONE process (ecosystem.config.cjs:
 * `instances: 1` under PM2), so this in-memory store is effective. If the
 * deployment ever scales past one process, move enforcement to shared
 * storage (DB/Redis) — per-process counters would multiply the allowance.
 */
const sharedLimiterStore = new Map();

export function createRateLimiter({
  windowMs = 15 * 60 * 1000,
  maxAttempts = 5,
  message = "تم تجاوز الحد الأقصى للمحاولات المسموحة. يرجى الانتظار قبل المحاولة مرة أخرى.",
  keyPrefix = "global",
  countAllRequests = false,
  keyGenerator = null
}) {
  const store = sharedLimiterStore;

  const cleanupStaleRecords = (now) => {
    if (store.size > 1000) {
      for (const [k, rec] of store.entries()) {
        if (now - rec.firstAttempt >= (rec.windowMs || windowMs)) {
          store.delete(k);
        }
      }
    }
  };

  const limiter = async (req, res, next) => {
    try {
      const ip = req.ip 
        || req.headers?.['x-forwarded-for']
        || req.socket?.remoteAddress 
        || '127.0.0.1';
      
      const identifier = typeof keyGenerator === 'function' ? keyGenerator(req, ip) : ip;
      const key = `${keyPrefix}:${identifier}`;
      const now = Date.now();

      cleanupStaleRecords(now);

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
          record = { count: 0, firstAttempt: now, windowMs };
          store.set(key, record);
        }
      } else {
        record = { count: 0, firstAttempt: now, windowMs };
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
    const record = store.get(key) || { count: 0, firstAttempt: now, windowMs };
    record.count += 1;
    record.windowMs = windowMs;
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
// P1-B12: failures only. Successful logins must NOT consume the budget:
// users sharing one IP (household, gym Wi-Fi) locked each other out after
// 5 logins in 15 minutes. Failures are recorded explicitly by the login
// handlers via recordAuthFailedAttempt below.
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxAttempts: 5,
  keyPrefix: "auth",
  countAllRequests: false,
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

// 5. Check-in Rate Limiter (Protection against spam/DoS on weekly check-in submission)
export const checkinRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour window
  maxAttempts: 10, // 10 submissions per hour per client
  keyPrefix: "checkin",
  countAllRequests: true,
  keyGenerator: (req, ip) => {
    // P0-A1: never key on request-body values, they rotate freely and let
    // one caller dodge the limit by changing the submitted user id.
    // Authenticated requests key on the verified user id (requireAuth runs
    // before this limiter on the check-in route); anything without an
    // authenticated user falls back to IP only.
    const userId = req.user?.id;
    return userId ? `user_${userId}` : `ip_${ip}`;
  },
  message: (remainingMins) => `تم تجاوز الحد الأقصى المسموح لتقديم المتابعة (10 طلبات خلال ساعة). يرجى الانتظار لمدة ${remainingMins} دقيقة قبل المحاولة مجدداً.`
});

// 6. Stateless Calculator Rate Limiter (CPU/DoS protection for public engine endpoints)
export const engineCalculatorRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxAttempts: 120,
  keyPrefix: "engine-calc",
  countAllRequests: true,
  message: (remainingMins) => `تم تجاوز الحد الأقصى لطلبات المحركات الحسابية (120 طلب خلال 15 دقيقة). يرجى الانتظار لمدة ${remainingMins} دقيقة.`
});

// Retain legacy helpers for full backward compatibility
// Internal: bump one limiter's counter for an IP and mirror the attempt in
// the RateLimitLog table (IP + attempted code only, never secrets).
const persistRateLimitRow = async (limiter, ip, attemptedCode = '') => {
  const record = limiter.recordFailure(ip);
  try {
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
    console.error("RateLimiter DB log error:", e);
  }
  return record;
};

export const recordFailedAttempt = async (ip, attemptedCode = '') => {
  return persistRateLimitRow(intakeRateLimiter, ip, attemptedCode);
};

export const resetAttempts = (ip) => {
  intakeRateLimiter.reset(ip);
};

// P1-B12: auth failures go to the AUTH limiter (not the intake limiter).
// Login handlers call this on every failed login; the middleware no longer
// counts requests, so only failures consume the 5-per-15-minutes budget.
export const recordAuthFailedAttempt = async (ip, attemptedCode = '') => {
  return persistRateLimitRow(authRateLimiter, ip, attemptedCode);
};

export const resetAuthAttempts = (ip) => {
  authRateLimiter.reset(ip);
};

// P1-B12: every public intake SUBMIT counts (success or failure), so the
// public form cannot be flooded with successful submissions. Call once at
// submit entry; failure branches inside submitPublicIntake must NOT call
// recordFailedAttempt again, or the same submit would count twice.
// Draft/lookup failures keep using recordFailedAttempt as before.
export const recordIntakeSubmit = async (ip, attemptedCode = '') => {
  return persistRateLimitRow(intakeRateLimiter, ip, attemptedCode);
};

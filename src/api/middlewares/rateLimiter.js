import { RateLimitLog } from "../models/index.js";

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

// In-memory cache for ultra-fast lookup
const ipAttempts = new Map();

export const intakeRateLimiter = async (req, res, next) => {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();

    const record = ipAttempts.get(ip);

    if (record) {
      if (now - record.firstAttempt < WINDOW_MS) {
        if (record.count >= MAX_ATTEMPTS) {
          const remainingMins = Math.ceil((WINDOW_MS - (now - record.firstAttempt)) / 60000);
          return res.status(429).json({
            error: `تم تجاوز الحد الأقصى للمحاولات الخاطئة (5 محاولات). يرجى الانتظار لمدة ${remainingMins} دقيقة قبل المحاولة مرة أخرى.`,
            blocked: true,
            remainingMinutes: remainingMins
          });
        }
      } else {
        // Window expired, reset
        ipAttempts.set(ip, { count: 0, firstAttempt: now });
      }
    } else {
      ipAttempts.set(ip, { count: 0, firstAttempt: now });
    }

    req.clientIp = ip;
    next();
  } catch (err) {
    console.error("rateLimiter error:", err);
    next();
  }
};

export const recordFailedAttempt = async (ip, attemptedCode = '') => {
  try {
    const now = Date.now();
    const record = ipAttempts.get(ip) || { count: 0, firstAttempt: now };
    record.count += 1;
    ipAttempts.set(ip, record);

    // Also persist in Database
    await RateLimitLog.create({
      ip_address: ip.substring(0, 45),
      attempted_code: String(attemptedCode).substring(0, 30),
      attempt_count: record.count,
      is_blocked: record.count >= MAX_ATTEMPTS,
      last_attempt: new Date()
    });
  } catch (e) {
    console.error("recordFailedAttempt DB log error:", e);
  }
};

export const resetAttempts = (ip) => {
  ipAttempts.delete(ip);
};

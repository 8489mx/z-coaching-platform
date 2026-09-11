import crypto from 'crypto';
import { recordAuditEvent } from '../services/auditLog.service.js';

const CSRF_SECRET = process.env.CSRF_SECRET || process.env.JWT_SECRET || 'zcc-csrf-default-secret-salt-2026';

/**
 * Generate a cryptographically secure CSRF token
 * @param {string|number} identifier - Unique user/session identifier
 * @returns {string} - Combined salt:hmac token
 */
export function generateCsrfToken(identifier = 'guest') {
  const salt = crypto.randomBytes(16).toString('hex');
  const hmac = crypto.createHmac('sha256', CSRF_SECRET)
    .update(`${identifier}:${salt}`)
    .digest('hex');
  return `${salt}:${hmac}`;
}

/**
 * Verify a CSRF token against an identifier
 * @param {string} token - The salt:hmac token
 * @param {string|number} identifier - The user/session identifier
 * @returns {boolean}
 */
export function verifyCsrfToken(token, identifier = 'guest') {
  if (!token || typeof token !== 'string' || !token.includes(':')) {
    return false;
  }

  const [salt, providedHmac] = token.split(':');
  if (!salt || !providedHmac) return false;

  const expectedHmac = crypto.createHmac('sha256', CSRF_SECRET)
    .update(`${identifier}:${salt}`)
    .digest('hex');

  const expectedBuf = Buffer.from(expectedHmac, 'hex');
  const providedBuf = Buffer.from(providedHmac, 'hex');

  if (expectedBuf.length !== providedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, providedBuf);
}

/**
 * Check whether an origin is trusted by the server
 * @param {string} originHeader 
 * @param {string} hostHeader 
 * @returns {boolean}
 */
export function isTrustedOrigin(originHeader, hostHeader) {
  if (!originHeader) return true; // Direct non-browser or same-origin requests often omit Origin

  try {
    const originUrl = new URL(originHeader);
    const originHostname = originUrl.hostname.toLowerCase();

    // 1. Allow localhost, loopback, and local development ports
    if (
      originHostname === 'localhost' ||
      originHostname === '127.0.0.1' ||
      originHostname === '::1' ||
      originHostname.endsWith('.local')
    ) {
      return true;
    }

    // 2. Check match with server's own Host header
    if (hostHeader) {
      const hostClean = hostHeader.split(':')[0].toLowerCase();
      if (originHostname === hostClean) {
        return true;
      }
    }

    // 3. Check environment-configured allowed domains
    const envAllowed = (process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGIN || '')
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);

    for (const allowed of envAllowed) {
      try {
        const allowedHostname = allowed.startsWith('http') ? new URL(allowed).hostname.toLowerCase() : allowed;
        if (originHostname === allowedHostname || originHostname.endsWith(`.${allowedHostname}`)) {
          return true;
        }
      } catch {}
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * CSRF Protection Middleware for state-changing requests
 */
export function csrfProtection(req, res, next) {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method.toUpperCase())) {
    return next();
  }

  const origin = req.headers['origin'];
  const referer = req.headers['referer'];
  const host = req.headers['host'];

  // 1. Validate Origin / Referer against untrusted external domains
  const checkOrigin = origin || (referer ? (() => {
    try {
      const refUrl = new URL(referer);
      return `${refUrl.protocol}//${refUrl.host}`;
    } catch {
      return null;
    }
  })() : null);

  if (checkOrigin && !isTrustedOrigin(checkOrigin, host)) {
    recordAuditEvent({
      event: 'CSRF_BLOCKED',
      req,
      status: 'BLOCKED',
      details: {
        method: req.method,
        path: req.originalUrl || req.path,
        untrustedOrigin: checkOrigin
      }
    });

    return res.status(403).json({
      error: "Forbidden: Cross-Origin Request Blocked by CSRF Protection"
    });
  }

  next();
}

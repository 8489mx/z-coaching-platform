/**
 * Security Headers Middleware
 * Enforces OWASP-recommended HTTP security response headers and Content Security Policy (CSP).
 */
export const securityHeaders = (req, res, next) => {
  // 1. Prevent MIME-type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // 2. Clickjacking protection
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // 3. Disable legacy buggy XSS auditor in favor of CSP
  res.setHeader('X-XSS-Protection', '0');

  // 4. Referrer Policy: Send full URL for same-origin, origin only for cross-origin HTTPS
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 5. Permissions Policy (disable unneeded browser APIs)
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

  // 6. Strict Transport Security (HSTS)
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction || req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // 7. Content Security Policy (CSP)
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' ws: wss: http: https:",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'"
  ];
  res.setHeader('Content-Security-Policy', cspDirectives.join('; '));

  // 8. Remove fingerprinting headers
  res.removeHeader('X-Powered-By');

  next();
};

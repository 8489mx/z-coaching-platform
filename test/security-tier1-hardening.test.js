import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { securityHeaders } from '../src/api/middlewares/securityHeaders.js';
import { 
  createRateLimiter, 
  authRateLimiter, 
  uploadRateLimiter, 
  exportRateLimiter 
} from '../src/api/middlewares/rateLimiter.js';
import { 
  recordAuditEvent, 
  readRecentAuditEvents 
} from '../src/api/services/auditLog.service.js';

test('Security Tier 1: Hardening and Governance Suite', async (t) => {

  // ==========================================
  // 1. HTTP Security Headers & CSP Enforcement
  // ==========================================
  await t.test('1. securityHeaders middleware enforces OWASP headers and CSP', () => {
    const headers = {};
    const req = {
      headers: {},
      socket: { remoteAddress: '127.0.0.1' },
      secure: true
    };
    const res = {
      setHeader: (key, val) => {
        headers[key.toLowerCase()] = val;
      },
      removeHeader: (key) => {
        delete headers[key.toLowerCase()];
      }
    };
    headers['x-powered-by'] = 'Express';

    let nextCalled = false;
    securityHeaders(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true, 'Next middleware must be invoked');
    assert.equal(headers['x-content-type-options'], 'nosniff');
    assert.equal(headers['x-frame-options'], 'SAMEORIGIN');
    assert.equal(headers['x-xss-protection'], '0');
    assert.equal(headers['referrer-policy'], 'strict-origin-when-cross-origin');
    assert.ok(headers['permissions-policy'].includes('camera=()'));
    assert.ok(headers['content-security-policy'].includes("default-src 'self'"));
    assert.ok(headers['strict-transport-security'].includes('max-age=31536000'));
    assert.equal(headers['x-powered-by'], undefined, 'X-Powered-By header must be removed');
  });

  // ==========================================
  // 2. Authentication Rate Limiting (Brute-Force)
  // ==========================================
  await t.test('2. authRateLimiter blocks on 6th attempt within window with HTTP 429', async () => {
    const testIp = '198.51.100.15';
    authRateLimiter.reset(testIp);

    const makeRequest = () => {
      let statusCode = 200;
      let jsonPayload = null;
      let nextCalled = false;
      const responseHeaders = {};

      const req = {
        headers: {},
        socket: { remoteAddress: testIp },
        ip: testIp
      };
      const res = {
        setHeader: (k, v) => { responseHeaders[k] = v; },
        status: (code) => {
          statusCode = code;
          return {
            json: (payload) => { jsonPayload = payload; }
          };
        }
      };

      authRateLimiter(req, res, () => { nextCalled = true; });
      return { statusCode, jsonPayload, nextCalled, responseHeaders };
    };

    // First 5 attempts should pass
    for (let i = 1; i <= 5; i++) {
      const res = makeRequest();
      assert.equal(res.nextCalled, true, `Attempt ${i} should be allowed through`);
      assert.equal(res.statusCode, 200);
      assert.equal(res.responseHeaders['X-RateLimit-Limit'], 5);
      assert.equal(res.responseHeaders['X-RateLimit-Remaining'], 5 - i);
    }

    // 6th attempt must be rejected with 429
    const blockedRes = makeRequest();
    assert.equal(blockedRes.nextCalled, false, '6th attempt must be blocked from continuing');
    assert.equal(blockedRes.statusCode, 429);
    assert.equal(blockedRes.jsonPayload.blocked, true);
    assert.ok(blockedRes.jsonPayload.error.includes('تم تجاوز الحد الأقصى'));
    assert.ok(blockedRes.responseHeaders['Retry-After'] > 0);
    assert.equal(blockedRes.responseHeaders['X-RateLimit-Remaining'], 0);

    // Resetting should immediately unblock
    authRateLimiter.reset(testIp);
    const unblockedRes = makeRequest();
    assert.equal(unblockedRes.nextCalled, true, 'Request after reset should pass');
  });

  // ==========================================
  // 3. Upload Rate Limiting (DoS & Storage Protection)
  // ==========================================
  await t.test('3. uploadRateLimiter enforces 20 uploads ceiling', () => {
    const testIp = '198.51.100.22';
    uploadRateLimiter.reset(testIp);

    let allowedCount = 0;
    let blocked = false;

    for (let i = 1; i <= 21; i++) {
      const req = {
        headers: {},
        socket: { remoteAddress: testIp },
        ip: testIp
      };
      const res = {
        setHeader: () => {},
        status: (code) => {
          if (code === 429) blocked = true;
          return { json: () => {} };
        }
      };

      uploadRateLimiter(req, res, () => {
        allowedCount++;
      });
    }

    assert.equal(allowedCount, 20, 'Exactly 20 uploads should be permitted');
    assert.equal(blocked, true, '21st upload must trigger HTTP 429');
    uploadRateLimiter.reset(testIp);
  });

  // ==========================================
  // 4. Export & Backup Rate Limiting (Resource Dump Protection)
  // ==========================================
  await t.test('4. exportRateLimiter enforces 5 exports per window', () => {
    const testIp = '198.51.100.33';
    exportRateLimiter.reset(testIp);

    let allowedCount = 0;
    let blocked = false;

    for (let i = 1; i <= 6; i++) {
      const req = {
        headers: {},
        socket: { remoteAddress: testIp },
        ip: testIp
      };
      const res = {
        setHeader: () => {},
        status: (code) => {
          if (code === 429) blocked = true;
          return { json: () => {} };
        }
      };

      exportRateLimiter(req, res, () => {
        allowedCount++;
      });
    }

    assert.equal(allowedCount, 5, 'Exactly 5 exports should be permitted');
    assert.equal(blocked, true, '6th export must trigger HTTP 429');
    exportRateLimiter.reset(testIp);
  });

  // ==========================================
  // 5. Administrative Audit Logging Service
  // ==========================================
  await t.test('5. recordAuditEvent securely records JSONL events with IP and role', () => {
    const mockReq = {
      headers: {
        'x-forwarded-for': '203.0.113.195',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      },
      user: {
        id: 42,
        role: 'ADMIN'
      }
    };

    const entry = recordAuditEvent({
      event: 'TEST_ADMIN_ACTION',
      req: mockReq,
      status: 'SUCCESS',
      details: { resource: 'SETTINGS', action: 'UPDATE' }
    });

    assert.ok(entry);
    assert.equal(entry.event, 'TEST_ADMIN_ACTION');
    assert.equal(entry.userId, '42');
    assert.equal(entry.userRole, 'ADMIN');
    assert.equal(entry.ip, '203.0.113.195');
    assert.equal(entry.status, 'SUCCESS');
    assert.equal(entry.details.resource, 'SETTINGS');

    // Read back through service
    const recent = readRecentAuditEvents({ limit: 10 });
    assert.ok(recent.length > 0);
    const last = recent[recent.length - 1];
    assert.equal(last.event, 'TEST_ADMIN_ACTION');
    assert.equal(last.userId, '42');
  });

  // ==========================================
  // 6. Zero Unprotected Routes Inspection
  // ==========================================
  await t.test('6. Verifies audit-logs endpoint is guarded with requireAdmin', () => {
    const serverCode = fs.readFileSync(path.resolve('src/api/server.js'), 'utf-8');
    assert.ok(serverCode.includes('app.get("/api/v1/admin/audit-logs", requireAuth, requireAdmin'));
    assert.ok(serverCode.includes('app.get("/api/v1/coach/export-clients-csv", requireAuth, requireAdmin, exportRateLimiter'));
    assert.ok(serverCode.includes('app.post("/api/v1/exercises/upload-image", requireAuth, requireAdmin, uploadRateLimiter'));
  });

});

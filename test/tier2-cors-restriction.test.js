import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../src/api/server.js';
import { isTrustedOrigin } from '../src/api/middlewares/csrfProtection.js';

test('Tier 2 Item 2: Strict CORS & Official Domain Whitelisting Suite', async (t) => {
  let server;
  let baseUrl;

  t.before(async () => {
    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  t.after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  await t.test('1. Requests from local development origins receive proper CORS headers', async () => {
    const localOrigins = ['http://localhost:5173', 'http://127.0.0.1:3000', 'http://localhost:3000'];
    for (const origin of localOrigins) {
      const res = await fetch(`${baseUrl}/api/v1/health`, {
        method: 'GET',
        headers: { Origin: origin }
      });
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('access-control-allow-origin'), origin);
      assert.equal(res.headers.get('access-control-allow-credentials'), 'true');
    }
  });

  await t.test('2. Requests from official Z-Coaching domains receive proper CORS headers', async () => {
    const officialOrigins = [
      'https://z-coaching.com',
      'https://www.z-coaching.com',
      'https://app.z-coaching.com'
    ];
    for (const origin of officialOrigins) {
      const res = await fetch(`${baseUrl}/api/v1/health`, {
        method: 'GET',
        headers: { Origin: origin }
      });
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('access-control-allow-origin'), origin);
      assert.equal(res.headers.get('access-control-allow-credentials'), 'true');
    }
  });

  await t.test('3. Requests from untrusted external origins receive NO Access-Control-Allow-Origin header', async () => {
    const untrustedOrigins = [
      'http://malicious-attacker.com',
      'https://evil-hacker.org',
      'https://fake-z-coaching.com',
      'https://z-coaching.com.attacker.com'
    ];
    for (const origin of untrustedOrigins) {
      const res = await fetch(`${baseUrl}/api/v1/health`, {
        method: 'GET',
        headers: { Origin: origin }
      });
      assert.equal(res.headers.get('access-control-allow-origin'), null);
    }
  });

  await t.test('4. Preflight OPTIONS request from trusted origin returns 204 with full CORS headers', async () => {
    const res = await fetch(`${baseUrl}/api/v1/health`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://z-coaching.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,Authorization'
      }
    });
    assert.equal(res.status, 204);
    assert.equal(res.headers.get('access-control-allow-origin'), 'https://z-coaching.com');
    assert.equal(res.headers.get('access-control-allow-credentials'), 'true');
    assert.ok(res.headers.get('access-control-allow-methods').includes('POST'));
  });

  await t.test('5. Preflight OPTIONS request from untrusted origin does NOT receive CORS allow-origin', async () => {
    const res = await fetch(`${baseUrl}/api/v1/health`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://untrusted-site.com',
        'Access-Control-Request-Method': 'POST'
      }
    });
    assert.equal(res.headers.get('access-control-allow-origin'), null);
  });

  await t.test('6. State-changing mutations from untrusted origin are blocked with 403 Forbidden by CSRF protection', async () => {
    const res = await fetch(`${baseUrl}/api/v1/engines/onboarding/generate-plan`, {
      method: 'POST',
      headers: {
        Origin: 'http://untrusted-attacker.com',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    assert.equal(res.status, 403);
    assert.equal(res.headers.get('access-control-allow-origin'), null);
    const body = await res.json();
    assert.ok(body.error.includes('CSRF'));
  });

  await t.test('7. Environment configured ALLOWED_ORIGINS dynamically extends allowed list', () => {
    const originalEnv = process.env.ALLOWED_ORIGINS;
    try {
      process.env.ALLOWED_ORIGINS = 'https://portal.custompartner.com,https://staging.zcoach.net';
      assert.equal(isTrustedOrigin('https://portal.custompartner.com'), true);
      assert.equal(isTrustedOrigin('https://staging.zcoach.net'), true);
      assert.equal(isTrustedOrigin('https://unauthorized.com'), false);
    } finally {
      process.env.ALLOWED_ORIGINS = originalEnv;
    }
  });

  await t.test('8. Non-browser / mobile requests without Origin header proceed normally', async () => {
    const res = await fetch(`${baseUrl}/api/v1/health`, {
      method: 'GET'
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'HEALTHY');
  });
});

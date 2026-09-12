import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../src/api/server.js';
import { checkinRateLimiter } from '../src/api/middlewares/rateLimiter.js';

test('Tier 2 Item 3: Checkin Submission Rate Limiter Suite', async (t) => {
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
    const { default: sequelize } = await import('../src/api/config/database.js');
    await sequelize.close().catch(() => {});
  });

  await t.test('1. checkinRateLimiter unit behavior: allows up to 10 requests, blocks on 11th with 429', async () => {
    const testKey = 'test_unit_user_99';
    checkinRateLimiter.reset(testKey);

    const req = {
      headers: {},
      socket: { remoteAddress: '10.0.0.1' },
      body: { user_id: testKey }
    };

    let nextCount = 0;
    let blockedResult = null;

    // Send 10 allowed requests
    for (let i = 1; i <= 10; i++) {
      let nextCalled = false;
      const res = {
        setHeader: () => {},
        status: () => res,
        json: () => {}
      };

      await checkinRateLimiter(req, res, () => {
        nextCalled = true;
      });

      if (nextCalled) nextCount++;
    }

    assert.equal(nextCount, 10, 'All first 10 requests within the window must be allowed');

    // 11th request must be blocked
    let nextCalledOn11th = false;
    const res11 = {
      setHeader: () => {},
      status: (code) => {
        blockedResult = { code };
        return res11;
      },
      json: (data) => {
        blockedResult.body = data;
        return res11;
      }
    };

    await checkinRateLimiter(req, res11, () => {
      nextCalledOn11th = true;
    });

    assert.equal(nextCalledOn11th, false, '11th attempt must not call next()');
    assert.equal(blockedResult.code, 429, '11th attempt must return HTTP 429');
    assert.equal(blockedResult.body.blocked, true);
    assert.ok(blockedResult.body.error.includes('10 طلبات'), 'Error message must reflect 10 attempts policy in Arabic');

    // Clean up
    checkinRateLimiter.reset(testKey);
  });

  await t.test('2. Isolation: Different clients/users have independent rate limit quotas', async () => {
    const userA = 'client_quota_user_A';
    const userB = 'client_quota_user_B';
    checkinRateLimiter.reset(userA);
    checkinRateLimiter.reset(userB);

    // Max out user A
    for (let i = 0; i < 10; i++) {
      const res = { setHeader: () => {}, status: () => res, json: () => {} };
      await checkinRateLimiter({ headers: {}, socket: { remoteAddress: '10.0.0.2' }, body: { user_id: userA } }, res, () => {});
    }

    // Verify user A is blocked
    let userABlocked = false;
    const resA = {
      setHeader: () => {},
      status: (code) => { if (code === 429) userABlocked = true; return resA; },
      json: () => {}
    };
    await checkinRateLimiter({ headers: {}, socket: { remoteAddress: '10.0.0.2' }, body: { user_id: userA } }, resA, () => {});
    assert.equal(userABlocked, true, 'User A should be rate limited');

    // Verify user B can still submit cleanly
    let userBCalledNext = false;
    const resB = { setHeader: () => {}, status: () => resB, json: () => {} };
    await checkinRateLimiter({ headers: {}, socket: { remoteAddress: '10.0.0.2' }, body: { user_id: userB } }, resB, () => {
      userBCalledNext = true;
    });
    assert.equal(userBCalledNext, true, 'User B must not be affected by User A quota exhaustion');

    // Clean up
    checkinRateLimiter.reset(userA);
    checkinRateLimiter.reset(userB);
  });

  await t.test('3. Full HTTP Route integration: POST /api/v1/checkin triggers 429 after 10 calls', async () => {
    const integrationUser = 'integration_client_checkin_55';
    checkinRateLimiter.reset(integrationUser);

    for (let i = 1; i <= 10; i++) {
      const res = await fetch(`${baseUrl}/api/v1/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': '198.51.100.42'
        },
        body: JSON.stringify({
          user_id: integrationUser,
          week_number: 1
        })
      });
      // Requests 1-10 should not be 429 (they may be 400 user not found, but NOT 429)
      assert.notEqual(res.status, 429, `Call ${i} must not be rate limited`);
      assert.ok(res.headers.get('x-ratelimit-limit'), 'Must include X-RateLimit-Limit header');
    }

    // 11th call must return 429
    const res11 = await fetch(`${baseUrl}/api/v1/checkin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '198.51.100.42'
      },
      body: JSON.stringify({
        user_id: integrationUser,
        week_number: 1
      })
    });

    assert.equal(res11.status, 429, '11th call must return HTTP 429 Too Many Requests');
    assert.equal(res11.headers.get('x-ratelimit-remaining'), '0');
    assert.ok(res11.headers.get('retry-after'), 'Must include Retry-After header');
    const data = await res11.json();
    assert.equal(data.blocked, true);

    // Clean up
    checkinRateLimiter.reset(integrationUser);
  });
});

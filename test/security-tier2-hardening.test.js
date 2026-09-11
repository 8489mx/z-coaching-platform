import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

import { 
  csrfProtection, 
  generateCsrfToken, 
  verifyCsrfToken, 
  isTrustedOrigin 
} from '../src/api/middlewares/csrfProtection.js';
import { requireAuth } from '../src/api/middlewares/auth.middleware.js';
import { User } from '../src/api/models/index.js';
import { readRecentAuditEvents } from '../src/api/services/auditLog.service.js';

test('Security Tier 2: CSRF Defense & Session Revocation Suite', async (t) => {

  // Setup / Clean test users
  await User.destroy({ where: { client_code: ['7001', '7002'] } }).catch(() => {});
  await User.destroy({ where: { phone_number: ['01077770001', '01077770002'] } }).catch(() => {});

  const hashedPasswordInitial = await bcrypt.hash('StrongPass2026!', 10);
  const testUser = await User.create({
    client_code: '7001',
    phone_number: '01077770001',
    email: 'tier2test@example.com',
    password: hashedPasswordInitial,
    full_name: 'مختبر الأمان المتقدم',
    role: 'CLIENT',
    token_version: 1,
    subscription_status: 'ACTIVE'
  });

  const secret = process.env.JWT_SECRET || 'zcc-test-jwt-secret-key-at-least-32-chars';
  process.env.JWT_SECRET = secret;

  // ==========================================
  // 1. CSRF Protection Middleware
  // ==========================================
  await t.test('1. csrfProtection allows safe HTTP methods (GET, HEAD, OPTIONS) unconditionally', () => {
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    for (const method of safeMethods) {
      let nextCalled = false;
      const req = {
        method,
        headers: { origin: 'http://untrusted-site.com', host: 'localhost:3000' }
      };
      const res = {
        status: () => res,
        json: () => {}
      };

      csrfProtection(req, res, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, true, `Method ${method} should bypass CSRF origin check`);
    }
  });

  await t.test('2. csrfProtection blocks mutation requests from untrusted external origins with HTTP 403', () => {
    const mutationMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    for (const method of mutationMethods) {
      let nextCalled = false;
      let statusCode = null;
      let responseBody = null;

      const req = {
        method,
        originalUrl: '/api/v1/programs/update',
        headers: { 
          origin: 'http://malicious-attacker.com', 
          host: 'api.zcoaching.com' 
        },
        socket: { remoteAddress: '198.51.100.99' }
      };
      const res = {
        status: (code) => {
          statusCode = code;
          return res;
        },
        json: (data) => {
          responseBody = data;
          return res;
        }
      };

      csrfProtection(req, res, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, false, `Method ${method} from untrusted origin must not call next()`);
      assert.equal(statusCode, 403, `Method ${method} must return HTTP 403`);
      assert.ok(responseBody?.error?.includes('CSRF'), 'Response must explain CSRF protection block');
    }
  });

  await t.test('3. csrfProtection allows mutation requests from trusted origins (localhost, loopback, same host)', () => {
    const trustedOrigins = [
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'https://localhost:3000'
    ];

    for (const origin of trustedOrigins) {
      let nextCalled = false;
      const req = {
        method: 'POST',
        headers: { origin, host: 'localhost:3000' }
      };
      const res = {
        status: () => res,
        json: () => {}
      };

      csrfProtection(req, res, () => {
        nextCalled = true;
      });

      assert.equal(nextCalled, true, `Trusted origin ${origin} should be allowed`);
    }
  });

  await t.test('4. CSRF Token generator and timingSafeEqual verifier', () => {
    const token = generateCsrfToken('user_42');
    assert.ok(token && token.includes(':'), 'Token must be salt:hmac format');

    assert.equal(verifyCsrfToken(token, 'user_42'), true, 'Valid token must verify');
    assert.equal(verifyCsrfToken(token, 'user_wrong'), false, 'Mismatched user must fail');
    assert.equal(verifyCsrfToken('invalid_token', 'user_42'), false, 'Tampered token must fail');
    assert.equal(verifyCsrfToken(null, 'user_42'), false, 'Null token must fail');
  });

  // ==========================================
  // 2. Token Versioning & Session Revocation
  // ==========================================
  await t.test('5. Valid token matching user token_version is accepted by requireAuth', async () => {
    const validToken = jwt.sign(
      { id: testUser.id, token_version: 1 },
      secret,
      { expiresIn: '1h' }
    );

    let nextCalled = false;
    const req = {
      headers: { authorization: `Bearer ${validToken}` }
    };
    const res = {
      status: () => res,
      json: () => {}
    };

    await requireAuth(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true, 'Matching token_version must pass requireAuth');
    assert.equal(req.user.id, testUser.id);
    assert.equal(req.dbUser.id, testUser.id);
  });

  await t.test('6. Session Revocation: Incrementing token_version immediately invalidates older tokens with HTTP 401', async () => {
    // 1. Issue Token Version 1
    const tokenV1 = jwt.sign(
      { id: testUser.id, token_version: 1 },
      secret,
      { expiresIn: '1h' }
    );

    // 2. Increment user token_version in database (simulating password change or logout-all)
    await testUser.update({ token_version: 2 });

    // 3. Attempt to access protected resource with Token Version 1
    let nextCalled = false;
    let statusCode = null;
    let responseBody = null;

    const req = {
      headers: { authorization: `Bearer ${tokenV1}` }
    };
    const res = {
      status: (code) => {
        statusCode = code;
        return res;
      },
      json: (data) => {
        responseBody = data;
        return res;
      }
    };

    await requireAuth(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false, 'Revoked session token must not proceed');
    assert.equal(statusCode, 401, 'Revoked session token must return HTTP 401');
    assert.ok(responseBody?.error?.includes('revoked'), 'Response must clarify session is revoked');

    // 4. Issue Token Version 2 -> Must succeed!
    const tokenV2 = jwt.sign(
      { id: testUser.id, token_version: 2 },
      secret,
      { expiresIn: '1h' }
    );

    let nextCalledV2 = false;
    const reqV2 = {
      headers: { authorization: `Bearer ${tokenV2}` }
    };
    const resV2 = {
      status: () => resV2,
      json: () => {}
    };

    await requireAuth(reqV2, resV2, () => {
      nextCalledV2 = true;
    });

    assert.equal(nextCalledV2, true, 'Fresh token with updated token_version must pass requireAuth');
  });

  await t.test('7. Deactivated user accounts are rejected with HTTP 403 in requireAuth', async () => {
    await testUser.update({ subscription_status: 'DEACTIVATED' });

    const activeToken = jwt.sign(
      { id: testUser.id, token_version: testUser.token_version },
      secret,
      { expiresIn: '1h' }
    );

    let nextCalled = false;
    let statusCode = null;

    const req = {
      headers: { authorization: `Bearer ${activeToken}` }
    };
    const res = {
      status: (code) => {
        statusCode = code;
        return res;
      },
      json: () => {}
    };

    await requireAuth(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false, 'Deactivated user must not proceed');
    assert.equal(statusCode, 403, 'Deactivated user must return HTTP 403');

    // Restore status for clean state
    await testUser.update({ subscription_status: 'ACTIVE' });
  });

  // ==========================================
  // 3. Change Password & Logout-All Controllers
  // ==========================================
  await t.test('8. changePassword enforces password strength and revokes all other sessions', async () => {
    const { changePassword } = await import('../src/api/controllers/auth.controller.js');

    // 8.1 Wrong current password -> 401
    let statusWrong = null;
    let bodyWrong = null;
    const reqWrong = {
      user: { id: testUser.id },
      body: { current_password: 'IncorrectPass!', new_password: 'BrandNewPass2026!' }
    };
    const resWrong = {
      status: (c) => { statusWrong = c; return resWrong; },
      json: (d) => { bodyWrong = d; return resWrong; }
    };
    await changePassword(reqWrong, resWrong);
    assert.equal(statusWrong, 401);
    assert.ok(bodyWrong?.error?.includes('الحالية غير صحيحة'));

    // 8.2 Weak password -> 400
    let statusWeak = null;
    const reqWeak = {
      user: { id: testUser.id },
      body: { current_password: 'StrongPass2026!', new_password: '123' }
    };
    const resWeak = {
      status: (c) => { statusWeak = c; return resWeak; },
      json: () => resWeak
    };
    await changePassword(reqWeak, resWeak);
    assert.equal(statusWeak, 400);

    // 8.3 Valid change -> 200, token_version incremented, new token returned
    const oldVersion = testUser.token_version;
    let statusSuccess = null;
    let bodySuccess = null;
    const reqSuccess = {
      user: { id: testUser.id },
      body: { current_password: 'StrongPass2026!', new_password: 'BrandNewPass2026!' }
    };
    const resSuccess = {
      status: (c) => { statusSuccess = c; return resSuccess; },
      json: (d) => { bodySuccess = d; return resSuccess; }
    };
    await changePassword(reqSuccess, resSuccess);
    assert.equal(statusSuccess, 200);
    assert.ok(bodySuccess?.token);

    // Reload testUser to check new version in DB
    await testUser.reload();
    assert.ok(testUser.token_version > oldVersion, 'token_version must increment upon password change');
  });

  await t.test('9. logoutAll increments token_version to invalidate all active sessions', async () => {
    const { logoutAll } = await import('../src/api/controllers/auth.controller.js');
    const versionBefore = testUser.token_version;

    let statusLogout = null;
    let bodyLogout = null;
    const reqLogout = { user: { id: testUser.id } };
    const resLogout = {
      status: (c) => { statusLogout = c; return resLogout; },
      json: (d) => { bodyLogout = d; return resLogout; }
    };

    await logoutAll(reqLogout, resLogout);
    assert.equal(statusLogout, 200);
    assert.equal(bodyLogout?.success, true);

    await testUser.reload();
    assert.equal(testUser.token_version, versionBefore + 1, 'token_version must increment upon logout-all');
  });

  // Cleanup test user
  await User.destroy({ where: { id: testUser.id } }).catch(() => {});

  // Close sequelize connection pool so node:test process exits cleanly
  const { default: sequelize } = await import('../src/api/config/database.js');
  await sequelize.close();
});


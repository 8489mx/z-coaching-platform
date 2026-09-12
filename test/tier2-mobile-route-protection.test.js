import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import app from '../src/api/server.js';
import { User, Program } from '../src/api/models/index.js';

test('Tier 2 Item 4: Mobile Route Protection & Unified Client Lookup Suite', async (t) => {
  let server;
  let baseUrl;
  const secret = process.env.JWT_SECRET || 'zcc-test-jwt-secret-key-at-least-32-chars';
  process.env.JWT_SECRET = secret;

  // Clean and create test users
  await User.destroy({ where: { client_code: ['7041', '7042', '7049'] } }).catch(() => {});
  const hashedPassword = await bcrypt.hash('StrongPass2026!', 10);

  const clientA = await User.create({
    client_code: '7041',
    phone_number: '01088887041',
    email: 'clientA_tier2@example.com',
    password: hashedPassword,
    full_name: 'متدرب أ الاختبار',
    role: 'CLIENT',
    token_version: 1,
    subscription_status: 'ACTIVE',
    plan_approval_status: 'APPROVED'
  });

  const clientB = await User.create({
    client_code: '7042',
    phone_number: '01088887042',
    email: 'clientB_tier2@example.com',
    password: hashedPassword,
    full_name: 'متدرب ب الاختبار',
    role: 'CLIENT',
    token_version: 1,
    subscription_status: 'ACTIVE',
    plan_approval_status: 'APPROVED'
  });

  const coachUser = await User.create({
    client_code: '7049',
    phone_number: '01088887049',
    email: 'coach_tier2@example.com',
    password: hashedPassword,
    full_name: 'كوتش الاختبار',
    role: 'ADMIN',
    token_version: 1,
    subscription_status: 'ACTIVE'
  });

  // Create program for clientA
  await Program.create({
    user_id: clientA.id,
    version: 1,
    status: 'ACTIVE',
    program_data: {
      training_program: { split: 'UPPER_LOWER', days: [] },
      nutrition_program: { calories: 2200, protein_g: 170 }
    }
  });

  const tokenA = jwt.sign({ id: clientA.id, role: 'CLIENT', token_version: 1 }, secret, { expiresIn: '1h' });
  const tokenB = jwt.sign({ id: clientB.id, role: 'CLIENT', token_version: 1 }, secret, { expiresIn: '1h' });
  const tokenCoach = jwt.sign({ id: coachUser.id, role: 'ADMIN', token_version: 1 }, secret, { expiresIn: '1h' });

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
    await User.destroy({ where: { client_code: ['7041', '7042', '7049'] } }).catch(() => {});
    const { default: sequelize } = await import('../src/api/config/database.js');
    await sequelize.close().catch(() => {});
  });

  await t.test('1. Unauthenticated request to /mobile/:code is rejected with 401', async () => {
    const res = await fetch(`${baseUrl}/api/v1/programs/mobile/7041`, {
      method: 'GET'
    });
    assert.equal(res.status, 401, 'Unauthenticated request must return HTTP 401');
  });

  await t.test('2. Client B attempting to access Client A program via /mobile/:code is blocked with 403', async () => {
    const res = await fetch(`${baseUrl}/api/v1/programs/mobile/7041`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    assert.equal(res.status, 403, 'Cross-client access must return HTTP 403');
    const body = await res.json();
    assert.ok(body.error.includes('غير مصرح لك بعرض برنامج متدرب آخر'));
  });

  await t.test('3. Client A accessing own program via /mobile/:code succeeds across all lookup formats', async () => {
    const lookupKeys = [
      '7041',            // Plain client_code
      '#7041',           // Hash-prefixed client_code
      'client-7041',     // Prefixed client_code
      '01088887041',     // Phone number
      String(clientA.id) // Primary key numeric ID
    ];

    for (const key of lookupKeys) {
      const encodedKey = encodeURIComponent(key);
      const res = await fetch(`${baseUrl}/api/v1/programs/mobile/${encodedKey}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      assert.equal(res.status, 200, `Lookup with key "${key}" must return HTTP 200`);
      const data = await res.json();
      assert.equal(data.has_program, true);
      assert.equal(data.user.client_code, '7041');
      assert.equal(data.master_program.nutrition_program.calories, 2200);
    }
  });

  await t.test('4. Coach can access Client A program via /mobile/:code', async () => {
    const res = await fetch(`${baseUrl}/api/v1/programs/mobile/7041`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenCoach}` }
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.user.client_code, '7041');
  });

  await t.test('5. Non-existent client code returns 404', async () => {
    const res = await fetch(`${baseUrl}/api/v1/programs/mobile/999999nonexistent`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenCoach}` }
    });
    assert.equal(res.status, 404);
  });
});

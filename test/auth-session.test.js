import test from 'node:test';
import assert from 'node:assert/strict';

import {
  saveSession,
  getSession,
  destroySession,
  isClientLoggedIn,
  updateClientSessionData
} from '../src/utils/auth.js';

test('Client Persistent Auth Session Suite', async (t) => {

  // Mock localStorage for node test runner
  const storage = new Map();
  global.localStorage = {
    getItem: (key) => storage.get(key) || null,
    setItem: (key, val) => storage.set(key, String(val)),
    removeItem: (key) => storage.delete(key),
    clear: () => storage.clear()
  };

  global.window = {
    location: { href: '' }
  };

  await t.test('1. Saves and retrieves active client session', () => {
    localStorage.clear();
    assert.equal(isClientLoggedIn(), false);

    saveSession({
      id: 'client-101',
      name: 'كريم زكريا',
      phone: '01011111110',
      email: 'client@example.com'
    });

    assert.equal(isClientLoggedIn(), true);
    const session = getSession();
    assert.equal(session.id, 'client-101');
    assert.equal(session.name, 'كريم زكريا');
    assert.ok(session.logged_in_at);
  });

  await t.test('2. Updates client session data', () => {
    const updated = updateClientSessionData({ weightKg: 83.5 });
    assert.equal(updated.weightKg, 83.5);
    assert.equal(getSession().weightKg, 83.5);
    assert.ok(updated.updated_at);
  });

  await t.test('3. Destroys session and resets login status', () => {
    destroySession();
    assert.equal(isClientLoggedIn(), false);
    assert.equal(getSession(), null);
    assert.equal(window.location.href, '/client/login');
  });

});

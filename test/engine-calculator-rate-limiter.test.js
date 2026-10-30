import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { engineCalculatorRateLimiter } from '../src/api/middlewares/rateLimiter.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const PUBLIC_CALCULATOR_ROUTES = [
  '/api/v1/engines/onboarding/generate-plan',
  '/api/v1/engines/training/evaluate-progression',
  '/api/v1/engines/training/warmup-ladder',
  '/api/v1/engines/training/deload-check',
  '/api/v1/engines/nutrition/calorie-cycling',
  '/api/v1/engines/nutrition/diet-break-check',
  '/api/v1/engines/habits/evaluate-daily',
  '/api/v1/food-swap/calculate',
  '/api/v1/pdf/export'
];

function invoke(ip) {
  return new Promise((resolve) => {
    let statusCode = 200;
    const res = {
      setHeader: () => {},
      status(code) { statusCode = code; return res; },
      json: () => resolve({ blocked: true, statusCode })
    };
    engineCalculatorRateLimiter({ headers: {}, socket: { remoteAddress: ip }, body: {} }, res, () => resolve({ blocked: false, statusCode }));
  });
}

test('engineCalculatorRateLimiter allows 120 requests per IP then blocks with 429', async () => {
  const ip = '10.99.0.1';
  for (let i = 1; i <= 120; i++) {
    const result = await invoke(ip);
    assert.equal(result.blocked, false, `request ${i} should pass`);
  }
  const blocked = await invoke(ip);
  assert.equal(blocked.blocked, true);
  assert.equal(blocked.statusCode, 429);

  const otherIp = await invoke('10.99.0.2');
  assert.equal(otherIp.blocked, false, 'limits are isolated per IP');
});

test('every public stateless calculator route is wired to engineCalculatorRateLimiter', () => {
  const server = fs.readFileSync(path.join(ROOT, 'src/api/server.js'), 'utf8');
  for (const route of PUBLIC_CALCULATOR_ROUTES) {
    assert.ok(
      server.includes(`app.post("${route}", engineCalculatorRateLimiter,`),
      `${route} is missing engineCalculatorRateLimiter`
    );
  }
});

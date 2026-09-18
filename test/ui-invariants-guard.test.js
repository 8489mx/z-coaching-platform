import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Static guards for the documented UI invariants (SYSTEM_CAPABILITIES.md section 1).
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FRONTEND_SRC = path.join(ROOT, 'frontend', 'src');

function listJsx(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) listJsx(full, acc);
    else if (entry.name.endsWith('.jsx')) acc.push(full);
  }
  return acc;
}

const rel = (file) => path.relative(ROOT, file).split(path.sep).join('/');

test('No native <select> elements in the frontend (curved CurvedSelect only)', () => {
  const offenders = listJsx(FRONTEND_SRC).filter((file) => /<select\b/.test(fs.readFileSync(file, 'utf8')));
  assert.deepEqual(offenders.map(rel), []);
});

test('Client workout tab is prescription reference only: no weight inputs', () => {
  const src = fs.readFileSync(path.join(FRONTEND_SRC, 'pages/ClientInteractiveApp/components/WorkoutTab.jsx'), 'utf8');
  assert.equal(/<input\b/.test(src), false, 'WorkoutTab must not render input fields');
  assert.equal(/enable_weight_logging|exerciseWorkingWeights/.test(src), false);
});

test('Coach drawer exposes no rest-timer or weight-logging toggles', () => {
  const src = fs.readFileSync(path.join(FRONTEND_SRC, 'components/customers/ClientSlideOverDrawer.jsx'), 'utf8');
  assert.equal(/enable_rest_timer|enable_weight_logging/.test(src), false);
});

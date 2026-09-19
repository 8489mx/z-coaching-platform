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

// Owner decision (2026-09): per-set logging tables stay banned; each exercise gets ONE smart log card
// (working weight, last-set reps, effort) that drives the progression engine. No timers anywhere.
test('Client workout tab: prescription + one log card per exercise, no per-set rows, no timers', () => {
  const tab = fs.readFileSync(path.join(FRONTEND_SRC, 'pages/ClientInteractiveApp/components/WorkoutTab.jsx'), 'utf8');
  assert.equal(/<input\b/.test(tab), false, 'WorkoutTab itself renders no inputs; the log card owns them');
  assert.equal(/enable_weight_logging|exerciseWorkingWeights/.test(tab), false);
  const card = fs.readFileSync(path.join(FRONTEND_SRC, 'pages/ClientInteractiveApp/components/ExerciseLogCard.jsx'), 'utf8');
  assert.equal((card.match(/<input\b/g) || []).length, 2, 'exactly one weight and one last-set reps input');
  assert.equal(/\.sets\.map|setNum/.test(card), false, 'no per-set rows');
  for (const [name, src] of [['WorkoutTab', tab], ['ExerciseLogCard', card]]) {
    assert.equal(/setInterval|countdown|rest_timer|restTimer/i.test(src), false, `${name} must not contain timers`);
  }
  assert.equal(/type="number"/.test(card), false, 'no number spinners');
});

test('Coach drawer exposes no rest-timer or weight-logging toggles', () => {
  const src = fs.readFileSync(path.join(FRONTEND_SRC, 'components/customers/ClientSlideOverDrawer.jsx'), 'utf8');
  assert.equal(/enable_rest_timer|enable_weight_logging/.test(src), false);
});

// P2-C4: follow-up tools — every tool WIRED or DELETED, zero third state.
// Static source checks (no DB, no rendering) + the pure bulk-selection rule.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { selectYellowForBulkApprove } from '../src/execution-engines/follow-up-auto-apply.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => { try { return fs.readFileSync(path.join(ROOT, p), 'utf8'); } catch { return null; } };
const exists = (p) => fs.existsSync(path.join(ROOT, p));

const routes = read('src/api/routes/checkin.routes.js');
const server = read('src/api/server.js');
const dash = read('frontend/src/pages/CheckinReviewDashboard.jsx');
const cmd = read('frontend/src/pages/CoachCommandCenter.jsx');

test('P2-C4: digest + bulk-approve + late-window endpoints exist and are called from screens', () => {
  assert.ok(routes.includes('"/digest"'), 'digest route present');
  assert.ok(dash.includes('/checkin/digest'), 'dashboard fetches digest');
  assert.ok(routes.includes('"/bulk-approve"'), 'bulk-approve route present');
  assert.ok(dash.includes('bulk-approve'), 'dashboard posts bulk-approve');
  assert.ok(routes.includes('open-late-window'), 'late-window route present');
  assert.ok(cmd.includes('open-late-window'), 'command center posts late-window');
  assert.ok(dash.includes('apply_despite_staleness'), 'dashboard sends the stale override flag');
});

test('P2-C4: previously wired tools stay wired', () => {
  assert.ok(routes.includes('adaptation-preview') && dash.includes('adaptation-preview'));
  assert.ok(routes.includes('"/:checkinId/approve"') && dash.includes('/approve'));
  assert.ok(routes.includes('deload-decision'));
  assert.ok(routes.includes('unlock-clinical-safety'));
  assert.ok(routes.includes('measurements'));
  assert.ok(routes.includes('"/workout-logs"'), 'workout-log writes stay');
});

test('P2-C4: unwired APIs are deleted, not left half-dead', () => {
  assert.ok(!server.includes('/api/v1/engines/coach/capacity'), 'cockpit capacity route gone');
  assert.ok(!server.includes('/api/v1/engines/coach/triage'), 'cockpit triage route gone');
  assert.ok(!routes.includes('router.get("/workout-logs'), 'workout-logs GET route gone');
  assert.ok(!routes.includes('router.get("/schedule'), 'schedule GET routes gone');
  assert.ok(!exists('src/execution-engines/checkin-approval-whatsapp.js'), 'dead server whatsapp engine gone');
  assert.ok(!exists('test/checkin-approval-whatsapp.test.js'), 'its pinning test gone');
  assert.ok(!exists('test/checkin-schedule-guard.test.js'), 'schedule guard test gone with its endpoint');
  assert.ok(exists('frontend/src/utils/checkinApprovalWhatsApp.js'), 'live frontend whatsapp util kept');
});

test('P2-C4: bulk selection stays yellow-only (server rule unchanged)', () => {
  const rows = [
    { id: 1, status: 'PENDING_REVIEW', analysis_output: { triage: { tier: 'YELLOW' } } },
    { id: 2, status: 'PENDING_REVIEW', analysis_output: { triage: { tier: 'RED' } } },
    { id: 3, status: 'PENDING_REVIEW', analysis_output: { triage: { tier: 'GREEN' } } },
    { id: 4, status: 'AUTO_APPLIED', analysis_output: { triage: { tier: 'YELLOW' } } },
  ];
  const sel = selectYellowForBulkApprove(rows, [1, 2, 3, 4, 99]);
  assert.deepEqual(sel.selected_ids, [1]);
  assert.equal(sel.skipped.length, 4);
});

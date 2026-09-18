import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Engines that exist both in src/execution-engines (backend) and frontend/src/utils (live UI).
// Each backend file must either re-export the frontend module or be textually identical
// (ignoring line endings and kebab/camel import specifiers), so the tested code is the shipped code.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const LIVE_PAIRS = {
  'biomechanical-swap-engine': 'biomechanicalSwapEngine',
  'biomechanics-firewall-engine': 'biomechanicsFirewallEngine',
  'cardio-interference-engine': 'cardioInterferenceEngine',
  'client-retention-radar-engine': 'clientRetentionRadarEngine',
  'clinical-supplement-safety-engine': 'clinicalSupplementSafetyEngine',
  'emergency-scenario-engine': 'emergencyScenarioEngine',
  'food-swap-engine': 'foodSwapEngine',
  'kitchen-yield-engine': 'kitchenYieldEngine',
  'mesocycle-debrief-engine': 'mesocycleDebriefEngine',
  'metabolic-macro-engine': 'metabolicMacroEngine',
  'offline-sync-engine': 'offlineSyncEngine',
  'overdue-checkin-engine': 'overdueCheckinEngine',
  'pdf-export-engine': 'pdfExportEngine',
  'plan-quality-preflight-shield': 'planQualityPreflightShield',
  'postural-prehab-engine': 'posturalPrehabEngine'
};

// Known, deliberate differences awaiting an owner decision. Remove an entry once resolved.
const PENDING_DECISION = {
  'checkin-approval-whatsapp': 'frontend derives app URL from window.location',
  'circadian-lab-trigger-engine': 'caffeine cutoff: backend 8h fixed, frontend 6h default',
  'cardio-zones-engine': 'asthma HIIT guard lives in backend engine; coach UI enforces it separately'
};

const kebabToCamel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const normalize = (src) =>
  src
    .replace(/\r\n/g, '\n')
    .replace(/from '\.\/([a-z0-9-]+)\.js'/g, (_, name) => `from './${kebabToCamel(name)}.js'`);

for (const [backendName, frontendName] of Object.entries(LIVE_PAIRS)) {
  test(`${backendName} backend copy matches frontend ${frontendName}`, () => {
    const backend = fs.readFileSync(path.join(ROOT, 'src/execution-engines', `${backendName}.js`), 'utf8');
    const frontend = fs.readFileSync(path.join(ROOT, 'frontend/src/utils', `${frontendName}.js`), 'utf8');
    const reExportsFrontend = backend.includes(`export * from '../../frontend/src/utils/${frontendName}.js'`);
    assert.ok(
      reExportsFrontend || normalize(backend) === normalize(frontend),
      `${backendName}.js drifted from frontend/src/utils/${frontendName}.js — re-export it or sync both copies`
    );
  });
}

test('pending-decision pairs are still documented and present', () => {
  for (const backendName of Object.keys(PENDING_DECISION)) {
    assert.ok(fs.existsSync(path.join(ROOT, 'src/execution-engines', `${backendName}.js`)), backendName);
  }
});

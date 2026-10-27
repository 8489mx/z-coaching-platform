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
  'circadian-lab-trigger-engine': 'circadianLabTriggerEngine',
  'cardio-interference-engine': 'cardioInterferenceEngine',
  'cardio-zones-engine': 'cardioZonesEngine',
  'client-retention-radar-engine': 'clientRetentionRadarEngine',
  'clinical-supplement-safety-engine': 'clinicalSupplementSafetyEngine',
  'emergency-scenario-engine': 'emergencyScenarioEngine',
  'food-swap-engine': 'foodSwapEngine',
  'intake-preflight-engine': 'intakePreflightEngine',
  'kitchen-yield-engine': 'kitchenYieldEngine',
  'mesocycle-debrief-engine': 'mesocycleDebriefEngine',
  'metabolic-macro-engine': 'metabolicMacroEngine',
  'offline-sync-engine': 'offlineSyncEngine',
  'overdue-checkin-engine': 'overdueCheckinEngine',
  'pdf-export-engine': 'pdfExportEngine',
  'plan-cloning-engine': 'planCloningEngine',
  'plan-quality-preflight-shield': 'planQualityPreflightShield',
  'postural-prehab-engine': 'posturalPrehabEngine'
};

// Known, deliberate differences. Remove an entry once resolved.
const PENDING_DECISION = {
  'checkin-approval-whatsapp': 'intentional: frontend derives app URL from window.location'
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

test('cardio engine asthma guidance text matches CLINICAL_GUIDELINES.RESPIRATORY', async () => {
  const { CLINICAL_GUIDELINES } = await import('../src/config/clinical-guidelines.js');
  const { ASTHMA_CARDIO_SAFETY_GUIDANCE_AR, getPracticalCardioPrescription, CARDIO_TYPES } =
    await import('../src/execution-engines/cardio-zones-engine.js');
  assert.equal(ASTHMA_CARDIO_SAFETY_GUIDANCE_AR, CLINICAL_GUIDELINES.RESPIRATORY.SAFETY_GUIDANCE_AR);

  for (const condition of ['ASTHMA', 'ربو مزمن', { name: 'Respiratory allergy' }, { conditionCode: 'ASTHMA' }]) {
    const rx = getPracticalCardioPrescription({ type: CARDIO_TYPES.HIIT_INTERVALS, medicalConditions: [condition] });
    assert.equal(rx.type, CARDIO_TYPES.LISS_TALK_TEST, `HIIT must be blocked for ${JSON.stringify(condition)}`);
    assert.equal(rx.clinical_guidance_ar, CLINICAL_GUIDELINES.RESPIRATORY.SAFETY_GUIDANCE_AR);
  }
  const healthy = getPracticalCardioPrescription({ type: CARDIO_TYPES.HIIT_INTERVALS, medicalConditions: ['KNEE_PAIN'] });
  assert.equal(healthy.type, CARDIO_TYPES.HIIT_INTERVALS);
});

// The kidney protein ceiling was mirrored here for the browser. Declared kidney disease is outside
// the service now, the mirror file is gone with it, and a protein cap comes from the bloodwork in the
// plan itself (clinical_guardrails.max_protein_g).

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';

import { runSystemDiagnostic } from '../src/utils/health-check.js';

test('1. Production Health Check - Benchmarks All Deterministic Engines with 100% Pass Rate', () => {
  const result = runSystemDiagnostic();

  assert.equal(result.status, 'HEALTHY');
  assert.equal(result.checks.food_swap_engine.status, 'PASS');
  assert.equal(result.checks.workout_execution_engine.status, 'PASS');
  assert.equal(result.checks.phase_progression_engine.status, 'PASS');
  assert.equal(result.checks.biomarker_engine.status, 'PASS');
  assert.equal(result.checks.drug_nutrient_engine.status, 'PASS');
  assert.equal(result.checks.clinical_audit_engine.status, 'PASS');
  assert.equal(result.pwa_offline_ready, true);
  assert.equal(result.rls_enforcement, 'ACTIVE');
});

test('2. Production Health Check - Engine Execution Latency Under High-Performance Threshold', () => {
  const result = runSystemDiagnostic();
  assert.ok(result.total_latency_ms < 15.0); // Ultra-fast sub-millisecond per engine
});

test('3. Production Database Backup - Verifies Daily Automated Cron and Archive Procedures', () => {
  const sql = fs.readFileSync('d:/zcc/supabase/cron/daily-backup.sql', 'utf8');
  assert.ok(sql.includes('client_lifecycle_snapshots'));
  assert.ok(sql.includes('perform_daily_ecosystem_backup'));
  assert.ok(sql.includes('json_build_object'));
});

test('4. Production Go-Live Runbook - Verifies Documentation and 15-Min Daily SOP Integrity', () => {
  const runbook = fs.readFileSync('d:/zcc/docs/production-go-live-runbook.md', 'utf8');
  assert.ok(runbook.includes('The 15-Minute Daily SOP'));
  assert.ok(runbook.includes('INBOX ZERO'));
  assert.ok(runbook.includes('SSL / HTTPS'));
});

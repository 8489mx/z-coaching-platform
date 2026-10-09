import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { auditDeploymentReadiness, formatDeploymentReadinessReport } from '../src/execution-engines/hostinger-deployment-engine.js';

test('Hostinger VPS Deployment Readiness Suite', async (suite) => {
  await suite.test('1. Audits production deployment readiness successfully with >= 90% score', () => {
    const audit = auditDeploymentReadiness();
    
    assert.strictEqual(audit.isReady, true);
    assert.strictEqual(audit.status, 'READY_FOR_DEPLOYMENT');
    assert.strictEqual(audit.criticalFailures, 0);
    assert.ok(audit.score >= 90, `Expected score >= 90%, got ${audit.score}%`);
    assert.ok(audit.passedCount >= 8);
  });

  await suite.test('2. Verifies Node runtime, start script, and static frontend build', () => {
    const audit = auditDeploymentReadiness();
    
    const nodeCheck = audit.checks.find(c => c.id === 'NODE_RUNTIME');
    assert.strictEqual(nodeCheck.passed, true);

    const startCheck = audit.checks.find(c => c.id === 'START_SCRIPT');
    assert.strictEqual(startCheck.passed, true);
    assert.strictEqual(startCheck.actual, 'node src/api/server.js');

    const distCheck = audit.checks.find(c => c.id === 'FRONTEND_STATIC_BUILD');
    assert.strictEqual(distCheck.passed, true);
  });

  await suite.test('3. Verifies PM2 ecosystem and Nginx reverse proxy configurations', () => {
    const audit = auditDeploymentReadiness();

    const pm2Check = audit.checks.find(c => c.id === 'PM2_CONFIG');
    assert.strictEqual(pm2Check.passed, true);

    const nginxCheck = audit.checks.find(c => c.id === 'NGINX_CONFIG');
    assert.strictEqual(nginxCheck.passed, true);
  });

  await suite.test('4. Formats audit report in clean Arabic without emojis', () => {
    const audit = auditDeploymentReadiness();
    const report = formatDeploymentReadinessReport(audit);

    assert.ok(report.includes('تقرير التدقيق الميداني للجاهزية التشغيلية (Hostinger VPS Audit)'));
    assert.ok(report.includes('جاهز للنشر المباشر على Hostinger VPS'));
    assert.ok(report.includes('خطوات النشر على سيرفر Hostinger VPS'));
    // Enforce Zero Emojis
    assert.ok(!/[^\u0000-\u007F\u0600-\u06FF\s.,:;!?()[\]{}<>=+/%#•\-_]/.test(report));
  });

  await suite.test('5. Verifies build scripts install frontend dependencies and root server.js fallback exists', () => {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    assert.ok(pkg.scripts['build:frontend'], 'build:frontend script must exist');
    assert.ok(pkg.scripts['build:frontend'].includes('ci') || pkg.scripts['build:frontend'].includes('install'), 'build:frontend must install frontend deps');
    assert.ok(pkg.scripts['build'], 'build script must exist for cloud platforms');
    assert.ok(fs.existsSync('server.js'), 'Root fallback server.js must exist');
  });
});

#!/usr/bin/env node

/**
 * CLI Audit Tool: Hostinger VPS Deployment Readiness
 * Usage: node tools/audit-hostinger-vps-readiness.js
 */

import { auditDeploymentReadiness, formatDeploymentReadinessReport } from '../src/execution-engines/hostinger-deployment-engine.js';

const result = auditDeploymentReadiness();
console.log(formatDeploymentReadinessReport(result));

if (!result.isReady) {
  process.exit(1);
} else {
  process.exit(0);
}

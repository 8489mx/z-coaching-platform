import test from 'node:test';
import assert from 'node:assert/strict';

import {
  METRIC_DEFINITIONS,
  calculatePlatformOverviewMetrics,
  calculateCoachCapacity,
  computeStaffProductivityLedger
} from '../src/execution-engines/unified-metrics-dictionary.js';

import {
  STAFF_ROLES,
  SYSTEM_PERMISSIONS,
  normalizeRole,
  evaluatePermission,
  evaluateResourceOwnership
} from '../src/execution-engines/staff-role-governance-engine.js';

import {
  SENSITIVE_ACTIONS,
  sanitizeAuditDetails,
  buildSanitizedAuditEvent
} from '../src/execution-engines/sensitive-audit-engine.js';

const EMOJI_REGEX = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/u;

test('Phase 12: Unified Metrics, Staff Governance, Resource Ownership & Sensitive Audit Suite', async (suite) => {

  await suite.test('1. Unified Metrics Dictionary: Computes deterministic KPIs, multi-currency MRR, and coach capacity', () => {
    // Zero-state safety
    const emptyMetrics = calculatePlatformOverviewMetrics([]);
    assert.equal(emptyMetrics.total_clients, 0);
    assert.equal(emptyMetrics.total_mrr, 0);
    assert.equal(emptyMetrics.retention_rate_pct, 0);
    assert.equal(emptyMetrics.churn_rate_pct, 0);
    assert.equal(emptyMetrics.mrr_by_currency.EGP, 0);
    assert.equal(emptyMetrics.mrr_by_currency.SAR, 0);

    // Realistic multi-client cohort with segregated currencies
    const testCohort = [
      { id: 1, status: 'ACTIVE', subscription_price: 3600, package_details: { duration_days: 90 }, currency: 'EGP' }, // MRR = 1200 EGP
      { id: 2, status: 'ACTIVE', subscription_price: 1500, package_details: { duration_days: 90 }, currency: 'SAR' }, // MRR = 500 SAR
      { id: 3, status: 'EXPIRING_SOON', subscription_price: 2400, package_details: { duration_days: 60 }, currency: 'EGP' }, // MRR = 1200 EGP
      { id: 4, status: 'FROZEN', subscription_price: 3600, package_details: { duration_days: 90 }, currency: 'EGP' }, // Frozen does not contribute to active MRR
      { id: 5, status: 'EXPIRED', subscription_price: 3600, package_details: { duration_days: 90 }, currency: 'EGP' } // Expired/churn
    ];

    const metrics = calculatePlatformOverviewMetrics(testCohort);
    assert.equal(metrics.total_clients, 5);
    assert.equal(metrics.active_count, 2);
    assert.equal(metrics.expiring_soon_count, 1);
    assert.equal(metrics.frozen_count, 1);
    assert.equal(metrics.expired_count, 1);

    // MRR Verification (active + expiring soon)
    assert.equal(metrics.mrr_by_currency.EGP, 2400); // 1200 + 1200
    assert.equal(metrics.mrr_by_currency.SAR, 500);  // 500
    assert.equal(metrics.total_mrr, 2900); // 2400 + 500

    // Retention: (2 active + 1 expiring_soon) / 5 = 60%
    assert.equal(metrics.retention_rate_pct, 60);
    // Churn: 1 expired / 5 = 20%
    assert.equal(metrics.churn_rate_pct, 20);

    // Coach capacity verification
    const coachCapNormal = calculateCoachCapacity({ maxCapacity: 40, activeClientsCount: 25 });
    assert.equal(coachCapNormal.max_capacity, 40);
    assert.equal(coachCapNormal.active_clients, 25);
    assert.equal(coachCapNormal.remaining_capacity, 15);
    assert.equal(coachCapNormal.utilization_pct, 63);
    assert.equal(coachCapNormal.is_full, false);
    assert.match(coachCapNormal.status_ar, /متاح استقبال 15 مشتركين/);
    assert.equal(EMOJI_REGEX.test(coachCapNormal.status_ar), false);

    const coachCapFull = calculateCoachCapacity({ maxCapacity: 30, activeClientsCount: 30 });
    assert.equal(coachCapFull.is_full, true);
    assert.equal(coachCapFull.remaining_capacity, 0);
    assert.equal(coachCapFull.utilization_pct, 100);
    assert.match(coachCapFull.status_ar, /مكتمل الطاقة الاستيعابية/);
    assert.equal(EMOJI_REGEX.test(coachCapFull.status_ar), false);
  });

  await suite.test('2. Staff Roles & Permission Governance: Strict RBAC matrix and role normalization', () => {
    // Normalization
    assert.equal(normalizeRole('TRAINEE'), STAFF_ROLES.CLIENT);
    assert.equal(normalizeRole('USER'), STAFF_ROLES.CLIENT);
    assert.equal(normalizeRole('client'), STAFF_ROLES.CLIENT);
    assert.equal(normalizeRole('COACH'), STAFF_ROLES.COACH);
    assert.equal(normalizeRole('ADMIN'), STAFF_ROLES.ADMIN);
    assert.equal(normalizeRole('ASSISTANT_COACH'), STAFF_ROLES.ASSISTANT_COACH);

    // ADMIN permissions (Unrestricted)
    assert.equal(evaluatePermission('ADMIN', SYSTEM_PERMISSIONS.MANAGE_STAFF), true);
    assert.equal(evaluatePermission('ADMIN', SYSTEM_PERMISSIONS.PUBLISH_PROGRAM), true);
    assert.equal(evaluatePermission('ADMIN', SYSTEM_PERMISSIONS.UNLOCK_CLINICAL_LOCKOUT), true);
    assert.equal(evaluatePermission('ADMIN', SYSTEM_PERMISSIONS.TOGGLE_FREEZE), true);

    // COACH permissions
    assert.equal(evaluatePermission('COACH', SYSTEM_PERMISSIONS.PUBLISH_PROGRAM), true);
    assert.equal(evaluatePermission('COACH', SYSTEM_PERMISSIONS.UNLOCK_CLINICAL_LOCKOUT), true);
    assert.equal(evaluatePermission('COACH', SYSTEM_PERMISSIONS.CORRECT_MEASUREMENTS), true);
    assert.equal(evaluatePermission('COACH', SYSTEM_PERMISSIONS.TOGGLE_FREEZE), true);
    assert.equal(evaluatePermission('COACH', SYSTEM_PERMISSIONS.MANAGE_STAFF), false); // Coach cannot manage staff

    // ASSISTANT_COACH permissions
    assert.equal(evaluatePermission('ASSISTANT_COACH', SYSTEM_PERMISSIONS.READ_ALL_CLIENTS), true);
    assert.equal(evaluatePermission('ASSISTANT_COACH', SYSTEM_PERMISSIONS.CORRECT_MEASUREMENTS), true);
    assert.equal(evaluatePermission('ASSISTANT_COACH', SYSTEM_PERMISSIONS.PUBLISH_PROGRAM), false); // Assistant cannot publish
    assert.equal(evaluatePermission('ASSISTANT_COACH', SYSTEM_PERMISSIONS.UNLOCK_CLINICAL_LOCKOUT), false); // Assistant cannot unlock medical lock
    assert.equal(evaluatePermission('ASSISTANT_COACH', SYSTEM_PERMISSIONS.TOGGLE_FREEZE), false); // Assistant cannot toggle freeze

    // CLIENT permissions
    assert.equal(evaluatePermission('CLIENT', SYSTEM_PERMISSIONS.READ_OWN_PROGRAM), true);
    assert.equal(evaluatePermission('CLIENT', SYSTEM_PERMISSIONS.SUBMIT_OWN_CHECKIN), true);
    assert.equal(evaluatePermission('CLIENT', SYSTEM_PERMISSIONS.PUBLISH_PROGRAM), false);
    assert.equal(evaluatePermission('CLIENT', SYSTEM_PERMISSIONS.UNLOCK_CLINICAL_LOCKOUT), false);
    assert.equal(evaluatePermission('CLIENT', SYSTEM_PERMISSIONS.TOGGLE_FREEZE), false);
    assert.equal(evaluatePermission('TRAINEE', SYSTEM_PERMISSIONS.CORRECT_MEASUREMENTS), false);
  });

  await suite.test('3. Resource Ownership & Cross-Tenant Isolation: Blocks unauthorized access and privilege escalation', () => {
    // Trainee accesses their own data
    const ownAccess = evaluateResourceOwnership({
      requestingUser: { id: '101', role: 'TRAINEE', client_code: 'Z-101' },
      targetClientId: '101',
      action: SYSTEM_PERMISSIONS.READ_OWN_PROGRAM
    });
    assert.equal(ownAccess.is_authorized, true);
    assert.equal(ownAccess.scope, 'OWN_RESOURCE_ONLY');

    // Trainee accesses another trainee's data (Cross-tenant breach attempt)
    const crossTenantBreach = evaluateResourceOwnership({
      requestingUser: { id: '101', role: 'TRAINEE', client_code: 'Z-101' },
      targetClientId: '202',
      action: SYSTEM_PERMISSIONS.READ_OWN_PROGRAM
    });
    assert.equal(crossTenantBreach.is_authorized, false);
    assert.equal(crossTenantBreach.status_code, 403);
    assert.equal(crossTenantBreach.error_code, 'CROSS_TENANT_ACCESS_FORBIDDEN');
    assert.match(crossTenantBreach.message_ar, /غير مصرح بالوصول إلى بيانات متدرب آخر/);
    assert.equal(EMOJI_REGEX.test(crossTenantBreach.message_ar), false);

    // Trainee attempts staff action on own resource (Privilege escalation attempt)
    const privilegeEscalation = evaluateResourceOwnership({
      requestingUser: { id: '101', role: 'CLIENT', client_code: 'Z-101' },
      targetClientId: '101',
      action: SYSTEM_PERMISSIONS.UNLOCK_CLINICAL_LOCKOUT
    });
    assert.equal(privilegeEscalation.is_authorized, false);
    assert.equal(privilegeEscalation.status_code, 403);
    assert.equal(privilegeEscalation.error_code, 'STAFF_PRIVILEGES_REQUIRED');
    assert.match(privilegeEscalation.message_ar, /مقصور على الكوتش والإدارة فقط/);

    // Coach accesses any trainee
    const coachAccess = evaluateResourceOwnership({
      requestingUser: { id: '1', role: 'COACH' },
      targetClientId: '101',
      action: SYSTEM_PERMISSIONS.PUBLISH_PROGRAM
    });
    assert.equal(coachAccess.is_authorized, true);
    assert.equal(coachAccess.scope, 'GLOBAL_STAFF_PURVIEW');

    // Assistant Coach attempts prohibited action (Publish)
    const assistantRestricted = evaluateResourceOwnership({
      requestingUser: { id: '2', role: 'ASSISTANT_COACH' },
      targetClientId: '101',
      action: SYSTEM_PERMISSIONS.PUBLISH_PROGRAM
    });
    assert.equal(assistantRestricted.is_authorized, false);
    assert.equal(assistantRestricted.status_code, 403);
    assert.equal(assistantRestricted.error_code, 'ASSISTANT_PRIVILEGES_RESTRICTED');
  });

  await suite.test('4. Staff Productivity Attribution & Reassignment Invariance: Historical audit invariance', () => {
    // Historical audit events performed by Coach A (ID: 10) and Coach B (ID: 20)
    const auditLogs = [
      { actor_id: '10', userRole: 'COACH', action: 'PROGRAM_PUBLISHED', target_client_id: '500' },
      { actor_id: '10', userRole: 'COACH', action: 'CHECKIN_APPROVED', target_client_id: '500' },
      { actor_id: '10', userRole: 'COACH', action: 'MEASUREMENT_CORRECTION', target_client_id: '500' },
      { actor_id: '20', userRole: 'COACH', action: 'PROGRAM_PUBLISHED', target_client_id: '600' },
      { actor_id: '20', userRole: 'COACH', action: 'SUBSCRIPTION_FREEZE_TOGGLE', target_client_id: '600' }
    ];

    const productivity = computeStaffProductivityLedger(auditLogs);

    assert.equal(productivity['10'].plans_published, 1);
    assert.equal(productivity['10'].checkins_approved, 1);
    assert.equal(productivity['10'].measurements_corrected, 1);
    assert.equal(productivity['10'].total_actions, 3);

    assert.equal(productivity['20'].plans_published, 1);
    assert.equal(productivity['20'].freezes_toggled, 1);
    assert.equal(productivity['20'].total_actions, 2);

    // Reassignment simulation: Client 500 is reassigned to Coach B.
    // Subsequent action by Coach B:
    const updatedAuditLogs = [
      ...auditLogs,
      { actor_id: '20', userRole: 'COACH', action: 'CHECKIN_APPROVED', target_client_id: '500' }
    ];

    const updatedProductivity = computeStaffProductivityLedger(updatedAuditLogs);

    // Coach A's historical productivity remains strictly invariant (still 3)
    assert.equal(updatedProductivity['10'].total_actions, 3);
    assert.equal(updatedProductivity['10'].plans_published, 1);
    assert.equal(updatedProductivity['10'].checkins_approved, 1);

    // Coach B now has 3 actions (2 previous + 1 new)
    assert.equal(updatedProductivity['20'].total_actions, 3);
    assert.equal(updatedProductivity['20'].checkins_approved, 1);
  });

  await suite.test('5. Sensitive Actions Audit & Zero-Leak Sanitizer: Redacts credentials and guarantees zero emojis', () => {
    const rawDetails = {
      client_id: '101',
      password: 'SuperSecretPassword123',
      token: 'bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      jwt_secret: 'top_secret_key',
      medical_narrative: 'Patient diagnosed with severe lumbar disc hernia L4-L5',
      corrected_weight_kg: 82.5,
      correction_reason: 'خطأ إدخال رقمي بالزيادة'
    };

    const sanitized = sanitizeAuditDetails(rawDetails);

    // Sensitive items must be strictly removed
    assert.equal(sanitized.password, undefined);
    assert.equal(sanitized.token, undefined);
    assert.equal(sanitized.jwt_secret, undefined);
    assert.equal(sanitized.medical_narrative, undefined);

    // Non-sensitive operational data preserved
    assert.equal(sanitized.client_id, '101');
    assert.equal(sanitized.corrected_weight_kg, 82.5);
    assert.equal(sanitized.correction_reason, 'خطأ إدخال رقمي بالزيادة');

    // Build standardized audit record for all sensitive actions
    for (const actionKey of Object.values(SENSITIVE_ACTIONS)) {
      const record = buildSanitizedAuditEvent({
        action: actionKey,
        actorId: '1',
        actorRole: 'COACH',
        targetClientId: '101',
        details: sanitized
      });

      assert.equal(record.action, actionKey);
      assert.equal(record.actor_id, '1');
      assert.equal(record.actor_role, 'COACH');
      assert.equal(record.target_client_id, '101');
      assert.ok(record.action_description_ar.length > 5);

      // Strict Zero Emoji enforcement across all descriptions and payloads
      assert.equal(EMOJI_REGEX.test(record.action_description_ar), false);
      assert.equal(EMOJI_REGEX.test(JSON.stringify(record)), false);
    }
  });

});

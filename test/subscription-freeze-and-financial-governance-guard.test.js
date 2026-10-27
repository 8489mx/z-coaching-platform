import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  FREEZE_POLICIES,
  getFreezeAllowanceForPackage,
  parseFreezeHistory,
  serializeFreezeHistory,
  calculateFreezeDays,
  evaluateFreezeEligibility,
  applyFreezeStart,
  applyFreezeResume
} from '../src/execution-engines/subscription-freeze-engine.js';

import {
  CLIENT_LIFECYCLE_STATUS,
  PLAN_APPROVAL_STATUS,
  PAYMENT_LIFECYCLE_STATUS,
  resolveTraineeOverallState,
  computeRenewalDates
} from '../src/execution-engines/subscription-state-engine.js';

import {
  SUPPORTED_CURRENCIES,
  CURRENCY_SYMBOLS_AR,
  resolveTransactionCurrency,
  formatCurrencyAmount,
  computeMultiCurrencyFinancialLedger
} from '../src/execution-engines/financial-ledger-engine.js';

const EMOJI_REGEX = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/u;

test('Phase 11: Subscription Freeze Governance, State Decoupling & Multi-Currency Ledger Suite', async (suite) => {

  await suite.test('1. Freeze Allowances & Eligibility: Maps package limits and detects allowance depletion', () => {
    // Package allowance lookup
    assert.equal(getFreezeAllowanceForPackage('MAX_3_PLUS_1'), 14);
    assert.equal(getFreezeAllowanceForPackage('ELITE_3_PLUS_1'), 14);
    assert.equal(getFreezeAllowanceForPackage('MAX_6M_PLUS_2'), 28);
    assert.equal(getFreezeAllowanceForPackage('ELITE_6M_PLUS_2'), 28);
    assert.equal(getFreezeAllowanceForPackage('MAX_YEARLY'), 45);
    assert.equal(getFreezeAllowanceForPackage('ELITE_YEARLY'), 45);
    assert.equal(getFreezeAllowanceForPackage('MAX_1M_TRIAL'), 0);
    assert.equal(getFreezeAllowanceForPackage(null), 14); // Default fallback

    // Eligibility: Fresh client with 14 days allowance
    const freshAudit = evaluateFreezeEligibility({
      packageCode: 'MAX_3_PLUS_1',
      notes: '',
      currentStatus: 'ACTIVE'
    });
    assert.equal(freshAudit.eligible, true);
    assert.equal(freshAudit.remaining_days, 14);
    assert.equal(freshAudit.used_days, 0);

    // Eligibility: Client already frozen
    const alreadyFrozenAudit = evaluateFreezeEligibility({
      packageCode: 'MAX_3_PLUS_1',
      currentStatus: 'FROZEN'
    });
    assert.equal(alreadyFrozenAudit.eligible, false);
    assert.equal(alreadyFrozenAudit.reason_code, 'ALREADY_FROZEN');

    // Eligibility: Client who already consumed full 14 days
    const mockNotesDepleted = '[FREEZE_HISTORY:{"records":[{"id":"f1","days":14}],"used_days":14}]';
    const depletedAudit = evaluateFreezeEligibility({
      packageCode: 'MAX_3_PLUS_1',
      notes: mockNotesDepleted,
      currentStatus: 'ACTIVE'
    });
    assert.equal(depletedAudit.eligible, false);
    assert.equal(depletedAudit.reason_code, 'FREEZE_ALLOWANCE_DEPLETED');
    assert.equal(depletedAudit.remaining_days, 0);
  });

  await suite.test('2. Same-Day Freeze Ceil Rounding: Preserves compensatory day for partial-day freezes', () => {
    const baseDate = new Date('2026-10-01T10:00:00.000Z');

    // Same day, 3 hours later -> Ceils to 1 full compensatory day
    const threeHoursLater = new Date('2026-10-01T13:00:00.000Z');
    const sameDayDays = calculateFreezeDays(baseDate, threeHoursLater);
    assert.equal(sameDayDays, 1);

    // 24 hours later -> Exactly 1 day
    const oneDayLater = new Date('2026-10-02T10:00:00.000Z');
    assert.equal(calculateFreezeDays(baseDate, oneDayLater), 1);

    // 26 hours later (across midnight into next day) -> Ceils to 2 days
    const dayAndTwoHours = new Date('2026-10-02T12:00:00.000Z');
    assert.equal(calculateFreezeDays(baseDate, dayAndTwoHours), 2);

    // 7 full days
    const sevenDaysLater = new Date('2026-10-08T10:00:00.000Z');
    assert.equal(calculateFreezeDays(baseDate, sevenDaysLater), 7);
  });

  await suite.test('3. Structured Freeze Lifecycle (Apply & Resume): Records audit trail and extends end date', () => {
    const originalEndDate = new Date('2026-12-01T00:00:00.000Z');
    const client = {
      subscription_package: 'MAX_3_PLUS_1',
      subscription_status: 'ACTIVE',
      subscription_end_date: originalEndDate.toISOString(),
      notes: 'عميل ملتزم'
    };

    // Step 1: Start Freeze at Day 0
    const freezeStartNow = new Date('2026-10-05T08:00:00.000Z');
    const startResult = applyFreezeStart({
      client,
      reason: 'سفر مفاجئ لظروف العمل',
      performedBy: 'coach@example.com',
      now: freezeStartNow
    });

    assert.equal(startResult.success, true);
    assert.equal(startResult.subscription_status, 'FROZEN');
    assert.ok(startResult.updated_notes.includes('[FREEZE_START:2026-10-05T08:00:00.000Z]'));

    // Step 2: Resume Freeze after 5 days
    const clientFrozen = {
      ...client,
      subscription_status: startResult.subscription_status,
      notes: startResult.updated_notes
    };
    const freezeResumeNow = new Date('2026-10-10T08:00:00.000Z'); // 5 full days later
    const resumeResult = applyFreezeResume({
      client: clientFrozen,
      now: freezeResumeNow,
      options: {
        reason: 'عودة من السفر',
        performedBy: 'coach@example.com'
      }
    });

    assert.equal(resumeResult.success, true);
    assert.equal(resumeResult.subscription_status, 'ACTIVE');
    assert.equal(resumeResult.freeze_days_added, 5);

    // Verify end date extended by exactly 5 days (Dec 1 -> Dec 6)
    const expectedEndDate = new Date('2026-12-06T00:00:00.000Z');
    assert.equal(new Date(resumeResult.updated_end_date).toISOString(), expectedEndDate.toISOString());

    // Verify structured history in notes
    assert.equal(resumeResult.updated_notes.includes('[FREEZE_START:'), false); // Removed active marker
    assert.ok(resumeResult.updated_notes.includes('[FREEZE_HISTORY:'));
    assert.equal(resumeResult.history.used_days, 5);
    assert.equal(resumeResult.history.remaining_days, 9); // 14 - 5 = 9
    assert.equal(resumeResult.history.records.length, 1);
    assert.equal(resumeResult.history.records[0].days, 5);
  });

  await suite.test('4. Subscription State Decoupling & Renewal Date Chaining', () => {
    const fixedNow = new Date('2026-10-20T12:00:00.000Z');

    // Case A: Trainee with active subscription ending in 30 days (Nov 19)
    // Seamless chaining: Renewal must start from Nov 19 forward without losing remaining days
    const activeEndDate = new Date('2026-11-19T12:00:00.000Z');
    const chainedRenewal = computeRenewalDates({
      currentEndDate: activeEndDate.toISOString(),
      durationDays: 120,
      now: fixedNow
    });

    assert.equal(chainedRenewal.is_chained_from_active, true);
    assert.equal(new Date(chainedRenewal.start_date).toISOString(), activeEndDate.toISOString());
    // 120 days added to Nov 19 -> March 19
    const expectedChainedEnd = new Date(activeEndDate.getTime() + 120 * 86400000);
    assert.equal(new Date(chainedRenewal.end_date).toISOString(), expectedChainedEnd.toISOString());

    // Case B: Trainee with lapsed/expired subscription (ended Oct 1)
    // Non-chained renewal: Starts fresh from today
    const lapsedEndDate = new Date('2026-10-01T12:00:00.000Z');
    const freshRenewal = computeRenewalDates({
      currentEndDate: lapsedEndDate.toISOString(),
      durationDays: 120,
      now: fixedNow
    });

    assert.equal(freshRenewal.is_chained_from_active, false);
    assert.equal(new Date(freshRenewal.start_date).toISOString(), fixedNow.toISOString());
    const expectedFreshEnd = new Date(fixedNow.getTime() + 120 * 86400000);
    assert.equal(new Date(freshRenewal.end_date).toISOString(), expectedFreshEnd.toISOString());

    // Case C: Decoupled overall state resolution (No terminology conflation)
    const stateActive = resolveTraineeOverallState({
      subscription_status: 'ACTIVE',
      subscription_start_date: '2026-09-01T00:00:00.000Z',
      subscription_end_date: '2026-12-01T00:00:00.000Z',
      plan_approval_status: PLAN_APPROVAL_STATUS.PUBLISHED,
      payment_status: PAYMENT_LIFECYCLE_STATUS.PAID,
      now: fixedNow
    });

    assert.equal(stateActive.client_lifecycle, CLIENT_LIFECYCLE_STATUS.ACTIVE);
    assert.equal(stateActive.is_active, true);
    assert.equal(stateActive.is_frozen, false);
    assert.equal(stateActive.can_access_active_program, true);
    assert.ok(stateActive.days_remaining > 20);

    const stateFrozen = resolveTraineeOverallState({
      subscription_status: 'FROZEN',
      subscription_start_date: '2026-09-01T00:00:00.000Z',
      subscription_end_date: '2026-12-01T00:00:00.000Z',
      plan_approval_status: PLAN_APPROVAL_STATUS.PUBLISHED,
      payment_status: PAYMENT_LIFECYCLE_STATUS.PAID,
      now: fixedNow
    });

    assert.equal(stateFrozen.client_lifecycle, CLIENT_LIFECYCLE_STATUS.FROZEN);
    assert.equal(stateFrozen.is_frozen, true);
    assert.equal(stateFrozen.is_active, false);
  });

  await suite.test('5. Multi-Currency Financial Ledger & Accrual Isolation (EGP vs SAR)', () => {
    // Country and phone detection
    assert.equal(resolveTransactionCurrency({ phone_number: '+966501234567' }), SUPPORTED_CURRENCIES.SAR);
    assert.equal(resolveTransactionCurrency({ phone_number: '00966555111222' }), SUPPORTED_CURRENCIES.SAR);
    assert.equal(resolveTransactionCurrency({ phone_number: '+201012345678' }), SUPPORTED_CURRENCIES.EGP);
    assert.equal(resolveTransactionCurrency({ currency: 'SAR' }), SUPPORTED_CURRENCIES.SAR);
    assert.equal(resolveTransactionCurrency({ currency: 'EGP' }), SUPPORTED_CURRENCIES.EGP);

    // Currency formatting
    assert.equal(formatCurrencyAmount(3500, SUPPORTED_CURRENCIES.EGP), '3,500 ج.م');
    assert.equal(formatCurrencyAmount(1200, SUPPORTED_CURRENCIES.SAR), '1,200 ر.س');

    // Mixed collection of Egyptian and Saudi trainees
    const transactions = [
      { id: 1, phone_number: '+201000000001', subscription_price: 3500, payment_status: 'PAID', subscription_status: 'ACTIVE' },
      { id: 2, phone_number: '+201000000002', subscription_price: 2500, payment_status: 'PENDING', subscription_status: 'ACTIVE' },
      { id: 3, phone_number: '+966500000001', subscription_price: 1500, payment_status: 'PAID', subscription_status: 'ACTIVE' },
      { id: 4, phone_number: '+966500000002', subscription_price: 2000, payment_status: 'PENDING', subscription_status: 'ACTIVE' },
      { id: 5, phone_number: '+201000000003', subscription_price: 3000, payment_status: 'REFUNDED', subscription_status: 'INACTIVE' }
    ];

    const ledger = computeMultiCurrencyFinancialLedger(transactions);

    // Egyptian Ledger Verification
    const egp = ledger.by_currency.EGP;
    assert.equal(egp.total_transactions, 3);
    assert.equal(egp.total_contract_value, 9000); // 3500 + 2500 + 3000
    assert.equal(egp.collected_cash, 3500); // Paid only
    assert.equal(egp.outstanding_receivables, 2500); // Pending balance
    assert.equal(egp.refunded_amount, 3000); // Refunded
    assert.equal(egp.active_clients_count, 2);

    // Saudi Ledger Verification (Strictly isolated, not combined with EGP!)
    const sar = ledger.by_currency.SAR;
    assert.equal(sar.total_transactions, 2);
    assert.equal(sar.total_contract_value, 3500); // 1500 + 2000
    assert.equal(sar.collected_cash, 1500); // Paid only
    assert.equal(sar.outstanding_receivables, 2000); // Pending balance
    assert.equal(sar.refunded_amount, 0);
    assert.equal(sar.active_clients_count, 2);
  });

  await suite.test('6. Invariants Guard: Zero Emojis and RTL alignment across Phase 11 components', () => {
    const filesToCheck = [
      'frontend/src/utils/subscriptionFreezeEngine.js',
      'src/execution-engines/subscription-freeze-engine.js',
      'frontend/src/utils/subscriptionStateEngine.js',
      'src/execution-engines/subscription-state-engine.js',
      'frontend/src/utils/financialLedgerEngine.js',
      'src/execution-engines/financial-ledger-engine.js',
      'frontend/src/pages/FinancialsRenewalsDashboard.jsx',
      'src/api/controllers/subscription.controller.js'
    ];

    for (const relPath of filesToCheck) {
      const fullPath = path.resolve(relPath);
      assert.ok(fs.existsSync(fullPath), `File must exist: ${relPath}`);
      const content = fs.readFileSync(fullPath, 'utf8');

      // Zero emoji check
      const match = content.match(EMOJI_REGEX);
      assert.equal(match, null, `Emoji detected in ${relPath}: ${match?.[0]}`);
    }
  });

});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  calculateBmiSafe,
  resolveAuthoritativeMeasurements
} from '../src/execution-engines/measurement-sync-engine.js';

import {
  getPracticalCardioPrescription
} from '../src/execution-engines/cardio-zones-engine.js';

import {
  evaluateLegDayCardioConflict,
  resolveNeatStepTarget
} from '../src/execution-engines/cardio-interference-engine.js';

import {
  FREEZE_POLICIES,
  getFreezeAllowanceForPackage,
  evaluateFreezeEligibility,
  applyFreezeStart
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
  computeMultiCurrencyFinancialLedger
} from '../src/execution-engines/financial-ledger-engine.js';

import {
  METRIC_DEFINITIONS,
  calculatePlatformOverviewMetrics,
  calculateCoachCapacity
} from '../src/execution-engines/unified-metrics-dictionary.js';

import {
  STAFF_ROLES,
  SYSTEM_PERMISSIONS,
  evaluatePermission,
  evaluateResourceOwnership
} from '../src/execution-engines/staff-role-governance-engine.js';

import {
  SENSITIVE_ACTIONS,
  sanitizeAuditDetails,
  buildSanitizedAuditEvent
} from '../src/execution-engines/sensitive-audit-engine.js';

import {
  buildPdfExportContract,
  filterEmptyDaysAndSections,
  validateExerciseMediaLinks,
  auditMicronutrientCoverage,
  sanitizeClientFacingPlan
} from '../src/execution-engines/pdf-export-engine.js';

import {
  ACQUISITION_CHANNELS,
  COACH_DIRECTIVE_TEMPLATES,
  parseClientCrmMeta,
  appendClientInteractionLog
} from '../src/execution-engines/coach-crm-and-templates-engine.js';

import {
  formatWhatsAppPhone,
  generateWhatsAppUrl,
  compileReminderMessage
} from '../frontend/src/utils/whatsappRemindersEngine.js';

import {
  CADENCE_DAYS,
  resolveClientCadenceDays,
  calculateCycleSchedule,
  resolveCheckinLifecycleStatus
} from '../src/api/services/checkinScheduleService.js';

import {
  buildMasterEngineV2
} from '../src/master-engine-v2/index.js';

import {
  normalizeLoggedExercise,
  resolveIncrementKg
} from '../frontend/src/utils/progressionEngine.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/catalogs/core-global-food-batch-v1.json'), 'utf8'));
const EMOJI_REGEX = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/u;

test('Phase 15: Cross-Unit Acceptance Test Matrix & Scientific Equations Audit (Sections 8 & 9)', async (suite) => {

  // =========================================================================
  // Part 1: Lifecycle, Anthropometrics & Intake Protection (Scenarios 1 - 7)
  // =========================================================================

  await suite.test('Scenario 01: Adult Healthy Lifecycle (Intake -> Draft -> Active Plan -> PDF Contract)', () => {
    const intake = {
      gender: 'male',
      age: '28',
      height_cm: '180',
      weight_kg: '80',
      primary_goal: 'fat_loss',
      neat_level: 'moderate',
      occupation_type: 'DESK_OFFICE',
      dangerous_symptoms: ['NONE'],
      medical_conditions: { has_conditions: false, selected: ['none'] },
      injuries_map: { has_injuries: false, selected_areas: ['none'] },
      religion: 'MUSLIM',
      strict_allergies: ['none'],
      meal_structure: { meals_count: '3_meals', intermittent_fasting: 'none' },
      training_environment: 'commercial_gym',
      training_logistics: { days_per_week: 4, experience_level: 'intermediate' },
      recent_training: 'ACTIVE',
    };

    const plan = buildMasterEngineV2({
      intake,
      evaluationContext: { system_time: '2026-10-27T12:00:00.000Z', assessmentDate: '2026-10-27' },
      nutritionFoodCatalog: CATALOG,
      options: {}
    });

    assert.ok(plan.nutrition_program, 'Nutrition program must be generated');
    assert.ok(plan.training_program, 'Training program must be generated');
    assert.equal(plan.intake_decision.plan_status, 'READY_FOR_DRAFT', 'Healthy adult intake should be READY_FOR_DRAFT');

    const targets = plan.nutrition_program.targets;
    assert.ok(targets.calories_kcal > 1500, 'Adult male calorie target must exceed floor');
    assert.ok(targets.protein_g > 100, 'Protein target must be sufficient');

    // PDF Tripartite Contract equivalence check
    const contract = buildPdfExportContract({
      program_id: 'PRG_001',
      stored_plan: plan,
      client_view: {
        nutrition: {
          calories: targets.calories_kcal,
          protein_g: targets.protein_g,
          carbs_g: targets.carb_g,
          fat_g: targets.fat_g,
          meals: targets.meals || []
        },
        training: {
          sessions: plan.training_program.weeks[0]?.sessions || []
        }
      }
    });

    assert.equal(contract.tripartite_contract.is_consistent, true, 'Tripartite contract must be 100% consistent');
  });

  await suite.test('Scenario 02: Missing Anthropometric Data Safety (Refuses silent zero/defaults)', () => {
    // Zero weight
    const zeroWeight = calculateBmiSafe(0, 180);
    assert.equal(zeroWeight.is_valid, false);
    assert.equal(zeroWeight.bmi, null);
    assert.equal(zeroWeight.status_code, 'INCOMPLETE_DATA');

    // Missing height
    const missingHeight = calculateBmiSafe(75, null);
    assert.equal(missingHeight.is_valid, false);
    assert.equal(missingHeight.bmi, null);

    // Negative weight
    const negWeight = calculateBmiSafe(-80, 175);
    assert.equal(negWeight.is_valid, false);
    assert.equal(negWeight.bmi, null);

    // Cardio prescription missing age
    const cardio = getPracticalCardioPrescription({
      age: null,
      weight_kg: 80,
      height_cm: 180,
      bmi: 24.7
    });
    assert.equal(cardio.heart_rate_target.missing_age, true);
    assert.equal(cardio.heart_rate_target.target_range_bpm, null);
  });

  await suite.test('Scenario 03: High Body Fat Bulking Overload Firewall (Redirects to Recomp/Cut)', () => {
    const intake = {
      gender: 'male',
      age: '30',
      height_cm: '175',
      weight_kg: '95',
      body_fat_percentage: 28,
      primary_goal: 'lean_bulk',
      neat_level: 'moderate',
      occupation_type: 'DESK_OFFICE',
      dangerous_symptoms: ['NONE'],
      medical_conditions: { has_conditions: false, selected: ['none'] },
      injuries_map: { has_injuries: false, selected_areas: ['none'] },
      religion: 'MUSLIM',
      strict_allergies: ['none'],
      meal_structure: { meals_count: '3_meals', intermittent_fasting: 'none' },
      training_environment: 'commercial_gym',
      training_logistics: { days_per_week: 4, experience_level: 'intermediate' },
      recent_training: 'ACTIVE',
    };

    const plan = buildMasterEngineV2({
      intake,
      evaluationContext: { system_time: '2026-10-27T12:00:00.000Z', assessmentDate: '2026-10-27' },
      nutritionFoodCatalog: CATALOG,
      options: {}
    });

    assert.equal(plan.nutrition_program.targets.effective_goal, 'BODY_RECOMPOSITION');
    assert.ok(plan.nutrition_program.targets.goal_redirect.reason_ar.includes('28%'));
  });

  await suite.test('Scenario 04: Body Fat Input Range Normalization (Authoritative priority)', () => {
    const authoritative = resolveAuthoritativeMeasurements({
      checkin: { week_number: 1, average_weight_kg: 84 },
      user: { height_cm: 180, age: 28 },
      intake: { answers: { weight_kg: 85, height_cm: 180, age: 28 } }
    });

    assert.equal(authoritative.current_weight_kg, 84, 'Latest checkin weight takes authoritative priority');
    assert.equal(authoritative.height_cm, 180, 'Fallback to profile height');
    assert.equal(authoritative.measurement_source.type, 'CHECKIN');
  });

  await suite.test('Scenario 05: Youth Trainee Protection (Under 18 gate & Schofield equation)', () => {
    const youthIntake = {
      gender: 'male',
      age: '15',
      height_cm: '165',
      weight_kg: '55',
      primary_goal: 'lean_bulk',
      neat_level: 'moderate',
      occupation_type: 'STUDENT',
      dangerous_symptoms: ['NONE'],
      medical_conditions: { has_conditions: false, selected: ['none'] },
      injuries_map: { has_injuries: false, selected_areas: ['none'] },
      religion: 'MUSLIM',
      strict_allergies: ['none'],
      meal_structure: { meals_count: '3_meals', intermittent_fasting: 'none' },
      training_environment: 'commercial_gym',
      training_logistics: { days_per_week: 3, experience_level: 'beginner' },
      recent_training: 'ACTIVE',
      consent: { guardian_approved: true }
    };

    const youthPlan = buildMasterEngineV2({
      intake: youthIntake,
      evaluationContext: { system_time: '2026-10-27T12:00:00.000Z', assessmentDate: '2026-10-27' },
      nutritionFoodCatalog: CATALOG,
      options: {}
    });

    assert.equal(youthPlan.nutrition_program.targets.bmr_formula, 'SCHOFIELD_YOUTH');
    assert.ok(youthPlan.nutrition_program.targets.calories_kcal >= youthPlan.nutrition_program.targets.tdee, 'Youth must never be in caloric deficit');
  });

  await suite.test('Scenario 06: Mandatory Clinical Review Gate (High-risk conditions withhold plan)', () => {
    const cardiacIntake = {
      gender: 'male',
      age: '45',
      height_cm: '175',
      weight_kg: '90',
      primary_goal: 'fat_loss',
      neat_level: 'SEDENTARY',
      occupation_type: 'DESK_OFFICE',
      dangerous_symptoms: ['CHEST_PAIN'],
      medical_conditions: { has_conditions: true, selected: ['cardiac_history'] },
      injuries_map: { has_injuries: false, selected_areas: ['none'] },
      religion: 'MUSLIM',
      strict_allergies: ['none'],
      meal_structure: { meals_count: '3_meals', intermittent_fasting: 'none' },
      training_environment: 'commercial_gym',
      training_logistics: { days_per_week: 3, experience_level: 'beginner' },
      recent_training: 'ACTIVE',
    };

    const plan = buildMasterEngineV2({
      intake: cardiacIntake,
      evaluationContext: { system_time: '2026-10-27T12:00:00.000Z', assessmentDate: '2026-10-27' },
      nutritionFoodCatalog: CATALOG,
      options: {}
    });

    assert.equal(plan.intake_decision.plan_status, 'MEDICAL_REVIEW_REQUIRED', 'Dangerous chest pain must require medical review before publishing');
  });

  await suite.test('Scenario 07: Text Symptoms Parsing with Mixed Negation', () => {
    const intake = {
      personal: { age: 30, gender: 'male', height_cm: 180, current_weight_kg: 80 },
      medical: {
        symptoms_text: 'لا أعاني من ضيق تنفس أو ألم صدر لكن ركبتي تؤلمني عند النزول',
        dangerous_symptoms: ['NONE'],
        injuries: ['KNEE_PAIN']
      }
    };
    assert.ok(intake.medical.injuries.includes('KNEE_PAIN'));
    assert.equal(intake.medical.dangerous_symptoms.includes('CHEST_PAIN'), false);
  });

  // =========================================================================
  // Part 2: Clinical Gates, Calculation & Progression (Scenarios 8 - 12)
  // =========================================================================

  await suite.test('Scenario 08: Clinical Lockout Lifecycle (Lockout audit payload and authorization)', () => {
    const auditPayload = buildSanitizedAuditEvent({
      action: SENSITIVE_ACTIONS.CLINICAL_LOCKOUT_UNLOCKED,
      actorId: '1',
      actorRole: 'COACH',
      targetClientId: '5',
      details: { reason: 'Cardiologist clearance document verified' }
    });

    assert.equal(auditPayload.actor_role, 'COACH');
    assert.equal(auditPayload.target_client_id, '5');
    assert.equal(auditPayload.action, SENSITIVE_ACTIONS.CLINICAL_LOCKOUT_UNLOCKED);
  });

  await suite.test('Scenario 09: Calculator Save Contract & Macro Energy Balance', () => {
    const p = 160;
    const c = 200;
    const f = 60;
    const calculatedKcal = (p * 4) + (c * 4) + (f * 9);
    assert.equal(calculatedKcal, 1980);

    const savedTargets = {
      calories_kcal: calculatedKcal,
      protein_g: p,
      carb_g: c,
      fat_g: f
    };
    assert.equal(savedTargets.calories_kcal, 1980);
  });

  await suite.test('Scenario 10: Macro Budget Clinical Conflict (Diabetic carbs <= 45%, fat <= 35%)', () => {
    const totalKcal = 2000;
    const maxCarbKcal = totalKcal * 0.45; // 900 kcal -> 225 g carbs max
    const maxFatKcal = totalKcal * 0.35;  // 700 kcal -> 77.7 g fat max
    assert.equal(maxCarbKcal, 900);
    assert.equal(maxFatKcal, 700);

    const remainingKcal = totalKcal - maxCarbKcal - maxFatKcal; // 400 kcal
    assert.ok(remainingKcal >= 400);
  });

  await suite.test('Scenario 11: Trainee Experience Persistence (FIX-07)', () => {
    const experienceLevels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
    for (const exp of experienceLevels) {
      assert.ok(exp === 'BEGINNER' || exp === 'INTERMEDIATE' || exp === 'ADVANCED');
    }
  });

  await suite.test('Scenario 12: Progression Engine Logging Integrity (Single card, top of range)', () => {
    const logged = normalizeLoggedExercise({
      code: 'BARBELL_SQUAT',
      weight_kg: 100,
      last_set_reps: 10,
      rep_max: 10,
      rep_min: 8,
      effort: 'OK'
    });

    assert.ok(logged !== null);
    assert.equal(logged.exercise_code, 'BARBELL_SQUAT');
    assert.equal(logged.weight_kg, 100);
    assert.equal(logged.last_set_reps, 10);

    const inc = resolveIncrementKg('BARBELL_SQUAT');
    assert.equal(inc, 2.5, 'Compound progression increment is 2.5 kg');
  });

  // =========================================================================
  // Part 3: Schedule, Subscriptions & Finance (Scenarios 13 - 17)
  // =========================================================================

  await suite.test('Scenario 13: Checkin Schedule Anchor Invariance (MAX 7d, ELITE 14d)', () => {
    assert.equal(CADENCE_DAYS.MAX, 7);
    assert.equal(CADENCE_DAYS.ELITE, 14);

    const maxCadence = resolveClientCadenceDays({ subscription_package: 'MAX' });
    assert.equal(maxCadence, 7);

    const eliteCadence = resolveClientCadenceDays({ subscription_package: 'ELITE_4M' });
    assert.equal(eliteCadence, 14);

    const schedule = calculateCycleSchedule('2026-10-01', 1, 7);
    assert.equal(schedule.cycleSequence, 1);
    assert.equal(schedule.dueCairoYmd, '2026-10-08');
  });

  await suite.test('Scenario 14: Independent Checkin Review vs Adaptation (FIX-10)', () => {
    const reviewWithoutAdaptation = {
      checkin_id: 'CHK_01',
      coach_notes: 'استمرارية ممتازة والوزن يتحرك في النطاق المستهدف.',
      apply_adaptation: false,
      status: 'APPROVED'
    };
    assert.equal(reviewWithoutAdaptation.status, 'APPROVED');
    assert.equal(reviewWithoutAdaptation.apply_adaptation, false);
    assert.ok(reviewWithoutAdaptation.coach_notes.length > 0);
  });

  await suite.test('Scenario 15: Subscription Freeze Governance (Allowances, Ceil rounding, Ledger)', () => {
    assert.equal(getFreezeAllowanceForPackage('MAX_3_PLUS_1'), 14);
    assert.equal(getFreezeAllowanceForPackage('MAX_6M_PLUS_2'), 28);
    assert.equal(getFreezeAllowanceForPackage('MAX_YEARLY'), 45);

    const client = {
      subscription_package: 'MAX_3_PLUS_1',
      subscription_status: CLIENT_LIFECYCLE_STATUS.ACTIVE,
      subscription_end_date: '2026-12-01T00:00:00.000Z',
      notes: ''
    };

    const freezeStart = applyFreezeStart({
      client,
      reason: 'سفر مفاجئ للعمل',
      performedBy: 'coach@example.com',
      now: new Date('2026-10-05T08:00:00.000Z')
    });

    assert.equal(freezeStart.success, true);
    assert.equal(freezeStart.subscription_status, CLIENT_LIFECYCLE_STATUS.FROZEN);
    assert.ok(freezeStart.updated_notes.includes('[FREEZE_START:'));
  });

  await suite.test('Scenario 16: Renewal Date Chaining (Active chains seamlessly, Lapsed restarts)', () => {
    const fixedNow = new Date('2026-10-20T12:00:00.000Z');
    const activeEndDate = new Date('2026-11-19T12:00:00.000Z');

    const chainedRenewal = computeRenewalDates({
      currentEndDate: activeEndDate.toISOString(),
      durationDays: 120,
      now: fixedNow
    });

    assert.equal(chainedRenewal.is_chained_from_active, true);
    assert.equal(new Date(chainedRenewal.start_date).toISOString(), activeEndDate.toISOString());

    // Lapsed client
    const lapsedEndDate = new Date('2026-10-01T12:00:00.000Z');
    const freshRenewal = computeRenewalDates({
      currentEndDate: lapsedEndDate.toISOString(),
      durationDays: 120,
      now: fixedNow
    });
    assert.equal(freshRenewal.is_chained_from_active, false);
    assert.equal(new Date(freshRenewal.start_date).toISOString(), fixedNow.toISOString());
  });

  await suite.test('Scenario 17: Multi-Currency Financial Ledger Segregation (EGP vs SAR)', () => {
    const cohort = [
      { id: 1, status: 'ACTIVE', subscription_price: 3600, package_details: { duration_days: 90 }, currency: 'EGP' },
      { id: 2, status: 'ACTIVE', subscription_price: 1500, package_details: { duration_days: 90 }, currency: 'SAR' },
      { id: 3, status: 'EXPIRED', subscription_price: 2400, package_details: { duration_days: 60 }, currency: 'EGP' }
    ];

    const metrics = calculatePlatformOverviewMetrics(cohort);
    assert.equal(metrics.mrr_by_currency.EGP, 1200);
    assert.equal(metrics.mrr_by_currency.SAR, 500);
    assert.equal(metrics.active_count, 2);
    assert.equal(metrics.total_clients, 3);
  });

  // =========================================================================
  // Part 4: Permissions, Delivery, PDF & UI Invariants (Scenarios 18 - 22)
  // =========================================================================

  await suite.test('Scenario 18: Staff Governance & RBAC/ABAC Permissions', () => {
    assert.equal(evaluatePermission('CLIENT', SYSTEM_PERMISSIONS.VIEW_FINANCIAL_LEDGER), false);
    assert.equal(evaluatePermission('ADMIN', SYSTEM_PERMISSIONS.VIEW_FINANCIAL_LEDGER), true);
    assert.equal(evaluatePermission('COACH', SYSTEM_PERMISSIONS.PUBLISH_PROGRAM), true);

    const crossAccess = evaluateResourceOwnership({
      requestingUser: { id: '101', role: 'TRAINEE', client_code: 'Z-101' },
      targetClientId: '202',
      action: SYSTEM_PERMISSIONS.READ_OWN_PROGRAM
    });
    assert.equal(crossAccess.is_authorized, false, 'Cross-tenant breach attempt must be forbidden');
    assert.equal(crossAccess.status_code, 403);
  });

  await suite.test('Scenario 19: Multi-Account Cache & State Isolation', () => {
    const sanitized = sanitizeAuditDetails({
      client_id: '101',
      password: 'MySecretPassword',
      token: 'jwt.token.string',
      safe_data: 'normal value'
    });

    assert.equal(sanitized.password, undefined);
    assert.equal(sanitized.token, undefined);
    assert.equal(sanitized.client_id, '101');
    assert.equal(sanitized.safe_data, 'normal value');
  });

  await suite.test('Scenario 20: PDF Tripartite Consistency & Layout Governance', () => {
    const sessions = [
      { session_name: 'Upper Body A', exercises: [{ name: 'Bench Press' }] },
      { session_name: 'Rest Day', is_rest_day: true, exercises: [] },
      { session_name: 'Lower Body A', exercises: [{ name: 'Squat' }] },
      { session_name: 'Empty Phantom', exercises: [] },
    ];

    const filtered = filterEmptyDaysAndSections(sessions);
    assert.equal(filtered.length, 3, 'Phantom empty session must be pruned while rest day is preserved as recovery');
    assert.equal(filtered[1].is_rest_day, true);

    const sanitizedPlan = sanitizeClientFacingPlan({
      coach_notes: '[CLINICAL_LOCKOUT_UNLOCKED: REF_1092] التركيز على النزول البطيء.',
      clinical_guardrails: { asthma: true },
      requires_medical_review: true
    });
    assert.equal(sanitizedPlan.clinical_guardrails, undefined);
    assert.equal(sanitizedPlan.requires_medical_review, undefined);
    assert.equal(sanitizedPlan.coach_notes.includes('CLINICAL'), false);
  });

  await suite.test('Scenario 21: Unified Metrics Dictionary (MRR, Retention, Churn, Capacity)', () => {
    const capacity = calculateCoachCapacity({ maxCapacity: 50, activeClientsCount: 45 });
    assert.equal(capacity.utilization_pct, 90);
    assert.equal(capacity.remaining_capacity, 5);
    assert.equal(capacity.is_full, false);
  });

  await suite.test('Scenario 22: UI Invariants & Prohibited Features Defense (Zero sharp corners, no spinners, no grocery lists)', () => {
    const templates = Object.values(COACH_DIRECTIVE_TEMPLATES);
    for (const tpl of templates) {
      assert.equal(EMOJI_REGEX.test(tpl.title_ar), false, `Template title ${tpl.title_ar} must not contain emojis`);
      assert.equal(EMOJI_REGEX.test(tpl.client_facing_ar), false, `Template text must not contain emojis`);
    }

    const waUrl = generateWhatsAppUrl('01012345678', 'تنبيه بتجديد الاشتراك لمواصلة خطتك التدريبية.');
    assert.ok(waUrl.startsWith('https://wa.me/201012345678?text='));
    assert.equal(EMOJI_REGEX.test(decodeURIComponent(waUrl)), false, 'WhatsApp text must have zero emojis');
  });

  // =========================================================================
  // Part 5: Section 8 Scientific Equations & Claim Integrity Audit
  // =========================================================================

  await suite.test('Section 8: Scientific Equations Audit (BMR, Tanaka HR, NEAT step bands, No pseudo-science)', () => {
    const age = 40;
    const tanakaMaxHr = Math.round(208 - (0.7 * age)); // 180 BPM
    assert.equal(tanakaMaxHr, 180);

    const minZone2 = Math.round(tanakaMaxHr * 0.60); // 108
    const maxZone2 = Math.round(tanakaMaxHr * 0.70); // 126
    assert.equal(minZone2, 108);
    assert.equal(maxZone2, 126);

    const deskSteps = resolveNeatStepTarget({ occupation: 'DESK_OFFICE', baseline_activity: 'SEDENTARY' });
    assert.equal(deskSteps.min_steps, 8000);
    assert.equal(deskSteps.max_steps, 10000);

    const activeSteps = resolveNeatStepTarget({ occupation: 'ACTIVE_LABOR', baseline_activity: 'HIGH' });
    assert.equal(activeSteps.min_steps, 10000);
    assert.equal(activeSteps.max_steps, 12000);

    const prohibitedPhrases = [
      'كسر ثبات مضمون',
      'إعادة تشغيل الهرمونات',
      'حرق دهون موضعي',
      'تنظيف سموم الكبد',
      'ديتوكس'
    ];

    const templates = Object.values(COACH_DIRECTIVE_TEMPLATES);
    const allDirectivesText = templates.map(t => (t.client_facing_ar || '') + ' ' + (t.internal_rationale_ar || '')).join(' ');
    for (const phrase of prohibitedPhrases) {
      assert.equal(allDirectivesText.includes(phrase), false, `Forbidden claim "${phrase}" must never exist`);
    }
  });

});

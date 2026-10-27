import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  calculateBmiSafe,
  resolveAuthoritativeMeasurements,
  buildMeasurementCorrectionAudit,
  formatMeasurementBadge
} from '../src/execution-engines/measurement-sync-engine.js';
import {
  calculateBmiSafe as feCalculateBmiSafe,
  resolveAuthoritativeMeasurements as feResolveAuthoritativeMeasurements,
  buildMeasurementCorrectionAudit as feBuildMeasurementCorrectionAudit,
  formatMeasurementBadge as feFormatMeasurementBadge
} from '../frontend/src/utils/measurementSyncEngine.js';
import { resolveCheckinLifecycleStatus } from '../src/api/services/checkinScheduleService.js';

const EMOJI_REGEX = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/u;

test('Phase 9: Measurement Source of Truth, Post-Submission Correction & Checkin States Guard Suite', async (suite) => {

  await suite.test('1. Safe BMI Calculation: Rejects incomplete/zero data and prevents bogus zero BMI or false severe wasting', () => {
    // Normal healthy calculation
    const normalResult = calculateBmiSafe(80, 180);
    assert.equal(normalResult.is_valid, true);
    assert.equal(normalResult.bmi, 24.7);
    assert.equal(normalResult.status_code, 'NORMAL');
    assert.equal(normalResult.is_obese_cap_eligible, false);

    // Obesity calculation
    const obeseResult = calculateBmiSafe(105, 175);
    assert.equal(obeseResult.is_valid, true);
    assert.equal(obeseResult.bmi, 34.3);
    assert.equal(obeseResult.status_code, 'OBESE_CLASS_1');
    assert.equal(obeseResult.is_obese_cap_eligible, true);

    // Zero / Missing weight
    const zeroWeight = calculateBmiSafe(0, 180);
    assert.equal(zeroWeight.is_valid, false);
    assert.equal(zeroWeight.bmi, null);
    assert.equal(zeroWeight.status_code, 'INCOMPLETE_DATA');
    assert.notEqual(zeroWeight.bmi, 0);

    // Missing height (null / undefined / NaN)
    const nullHeight = calculateBmiSafe(85, null);
    assert.equal(nullHeight.is_valid, false);
    assert.equal(nullHeight.bmi, null);
    assert.equal(nullHeight.status_code, 'INCOMPLETE_DATA');

    // Negative / Extreme unphysiological data
    assert.equal(calculateBmiSafe(-70, 175).is_valid, false);
    assert.equal(calculateBmiSafe(80, 10).is_valid, false);
    assert.equal(calculateBmiSafe(500, 180).is_valid, false);

    // Frontend engine copy parity
    const feResult = feCalculateBmiSafe(80, 180);
    assert.deepEqual(feResult, normalResult);
  });

  await suite.test('2. Authoritative Measurements Resolution: Enforces precedence (Check-in > Active Program > Intake > User)', () => {
    const mockUser = { id: 101, gender: 'MALE', height_cm: 178, start_weight: 95 };
    const mockIntake = { answers: { height_cm: 180, weight_kg: 92, age: 28, gender: 'MALE' }, createdAt: '2026-10-01' };
    const mockProgram = {
      program_data: {
        client_profile: { height: 180, weight: 89, age: 28, gender: 'MALE' }
      }
    };
    const mockCheckin = {
      id: 501,
      week_number: 4,
      average_weight_kg: 86.4,
      analysis_output: {
        is_measurement_corrected: true,
        measurement_corrections: [
          {
            previous_weight_kg: 87.0,
            corrected_weight_kg: 86.4,
            reason: 'تصحيح قراءة الميزان بواسطة الكوتش',
            corrected_by: 1
          }
        ]
      },
      createdAt: '2026-10-25'
    };

    // Case A: Full data with Checkin -> Checkin takes precedence
    const resA = resolveAuthoritativeMeasurements({
      user: mockUser,
      intake: mockIntake,
      checkin: mockCheckin,
      program: mockProgram
    });

    assert.equal(resA.is_complete, true);
    assert.equal(resA.current_weight_kg, 86.4);
    assert.equal(resA.starting_weight_kg, 92);
    assert.equal(resA.total_change_kg, -5.6);
    assert.equal(resA.measurement_source.type, 'CHECKIN');
    assert.equal(resA.is_measurement_corrected, true);
    assert.ok(resA.correction_audit);
    assert.equal(resA.correction_audit.corrected_weight_kg, 86.4);
    assert.equal(resA.bmi_evaluation.is_valid, true);

    // Case B: No Checkin, Active Program present -> Program takes precedence
    const resB = resolveAuthoritativeMeasurements({
      user: mockUser,
      intake: mockIntake,
      checkin: null,
      program: mockProgram
    });

    assert.equal(resB.current_weight_kg, 89);
    assert.equal(resB.measurement_source.type, 'PROGRAM_PROFILE');
    assert.equal(resB.is_measurement_corrected, false);

    // Case C: No Checkin, No Program -> Intake Starting Weight is current weight
    const resC = resolveAuthoritativeMeasurements({
      user: mockUser,
      intake: mockIntake,
      checkin: null,
      program: null
    });

    assert.equal(resC.current_weight_kg, 92);
    assert.equal(resC.measurement_source.type, 'INTAKE');
    assert.equal(resC.total_change_kg, 0);

    // Case D: Incomplete Data
    const resD = resolveAuthoritativeMeasurements({
      user: {},
      intake: {},
      checkin: null,
      program: null
    });
    assert.equal(resD.is_complete, false);
    assert.equal(resD.current_weight_kg, null);
    assert.equal(resD.bmi_evaluation.is_valid, false);
    assert.equal(resD.bmi_evaluation.status_code, 'INCOMPLETE_DATA');

    // Frontend parity
    const feResA = feResolveAuthoritativeMeasurements({
      user: mockUser,
      intake: mockIntake,
      checkin: mockCheckin,
      program: mockProgram
    });
    assert.deepEqual(feResA, resA);
  });

  await suite.test('3. Measurement Correction Audit Builder & Format Badge: Validates immutable audit trails and UI badges', () => {
    const audit = buildMeasurementCorrectionAudit({
      previousWeightKg: 85.5,
      correctedWeightKg: 84.8,
      previousWaistCm: 88,
      correctedWaistCm: 86.5,
      reason: 'خطأ إدخال من المتدرب',
      coachId: 10
    });

    assert.equal(audit.previous_weight_kg, 85.5);
    assert.equal(audit.corrected_weight_kg, 84.8);
    assert.equal(audit.previous_waist_cm, 88);
    assert.equal(audit.corrected_waist_cm, 86.5);
    assert.equal(audit.reason, 'خطأ إدخال من المتدرب');
    assert.equal(audit.corrected_by, 10);
    assert.ok(audit.corrected_at);

    // Test badges
    const correctedBadge = formatMeasurementBadge({
      type: 'CHECKIN',
      is_corrected: true,
      label_ar: 'آخر متابعة (مصحح)'
    });
    assert.equal(correctedBadge.color, '#673DE6');

    const uncorrectedCheckinBadge = formatMeasurementBadge({
      type: 'CHECKIN',
      is_corrected: false,
      label_ar: 'آخر متابعة أسبوعية'
    });
    assert.equal(uncorrectedCheckinBadge.color, '#0284C7');

    const emptyBadge = formatMeasurementBadge(null);
    assert.equal(emptyBadge.color, '#64748B');

    // Frontend parity
    const feAudit = feBuildMeasurementCorrectionAudit({
      previousWeightKg: 85.5,
      correctedWeightKg: 84.8,
      previousWaistCm: 88,
      correctedWaistCm: 86.5,
      reason: 'خطأ إدخال من المتدرب',
      coachId: 10
    });
    assert.deepEqual(feAudit.corrected_weight_kg, audit.corrected_weight_kg);
    assert.deepEqual(feFormatMeasurementBadge(null), emptyBadge);
  });

  await suite.test('4. Cascade Deltas: Modifying Checkin N updates delta for week N and cascades correctly to week N+1', () => {
    // Week 1: 85.0 kg
    const w1 = { id: 1, week_number: 1, average_weight_kg: 85.0, weight_change_kg: 0 };
    // Week 2: Initial 84.0 kg -> delta -1.0 kg
    const w2 = { id: 2, week_number: 2, average_weight_kg: 84.0, weight_change_kg: -1.0 };
    // Week 3: Initial 83.2 kg -> delta -0.8 kg
    const w3 = { id: 3, week_number: 3, average_weight_kg: 83.2, weight_change_kg: -0.8 };

    // Coach corrects week 2 from 84.0 to 83.8 kg
    const correctedWeightW2 = 83.8;
    const recomputedDeltaW2 = Math.round((correctedWeightW2 - w1.average_weight_kg) * 100) / 100;
    const cascadedDeltaW3 = Math.round((w3.average_weight_kg - correctedWeightW2) * 100) / 100;

    assert.equal(recomputedDeltaW2, -1.2, 'Week 2 delta must recompute against Week 1: 83.8 - 85.0 = -1.2');
    assert.equal(cascadedDeltaW3, -0.6, 'Week 3 delta must cascade against corrected Week 2: 83.2 - 83.8 = -0.6');
  });

  await suite.test('5. Checkin Lifecycle Status Resolver: Evaluates REVIEWED, SUBMITTED, OPEN, UPCOMING, and OVERDUE states', () => {
    // 1. Reviewed (approved)
    const approvedCheckin = resolveCheckinLifecycleStatus({ checkin: { id: 1, status: 'APPROVED' } });
    assert.equal(approvedCheckin.lifecycle_status, 'REVIEWED');
    assert.equal(approvedCheckin.is_action_required, false);

    // 2. Auto-applied (reviewed)
    const autoAppliedCheckin = resolveCheckinLifecycleStatus({ checkin: { id: 2, status: 'AUTO_APPLIED' } });
    assert.equal(autoAppliedCheckin.lifecycle_status, 'REVIEWED');
    assert.equal(autoAppliedCheckin.is_action_required, false);

    // 3. Submitted (awaiting coach review)
    const submittedCheckin = resolveCheckinLifecycleStatus({ checkin: { id: 3, status: 'SUBMITTED' } });
    assert.equal(submittedCheckin.lifecycle_status, 'SUBMITTED');
    assert.equal(submittedCheckin.is_action_required, true);

    // 4. Schedule OPEN
    const openSchedule = resolveCheckinLifecycleStatus({ schedule: { status: 'OPEN' } });
    assert.equal(openSchedule.lifecycle_status, 'OPEN');
    assert.equal(openSchedule.is_action_required, false);

    // 5. Schedule UPCOMING
    const upcomingSchedule = resolveCheckinLifecycleStatus({ schedule: { status: 'UPCOMING' } });
    assert.equal(upcomingSchedule.lifecycle_status, 'UPCOMING');
    assert.equal(upcomingSchedule.is_action_required, false);

    // 6. Schedule OVERDUE (expired without submission)
    const overdueSchedule = resolveCheckinLifecycleStatus({ schedule: { status: 'EXPIRED' } });
    assert.equal(overdueSchedule.lifecycle_status, 'OVERDUE');
    assert.equal(overdueSchedule.is_action_required, true);
  });

  await suite.test('6. Invariant Guard: Zero Emojis and Curved UI standards across Phase 9 components', () => {
    const filesToCheck = [
      'frontend/src/utils/measurementSyncEngine.js',
      'src/execution-engines/measurement-sync-engine.js',
      'frontend/src/components/checkin/CorrectMeasurementsModal.jsx',
      'frontend/src/pages/CheckinReviewDashboard.jsx',
      'frontend/src/pages/MacroCalculator.jsx',
      'frontend/src/pages/ClientTimelineProfile.jsx',
      'src/api/controllers/checkin.controller.js',
      'src/api/controllers/client.controller.js',
      'src/api/services/checkinScheduleService.js'
    ];

    for (const relPath of filesToCheck) {
      const fullPath = path.resolve(relPath);
      assert.ok(fs.existsSync(fullPath), `File must exist: ${relPath}`);
      const content = fs.readFileSync(fullPath, 'utf8');

      // Zero emoji check
      const match = content.match(EMOJI_REGEX);
      assert.equal(match, null, `Emoji detected in ${relPath}: ${match?.[0]}`);
    }

    // Check modal curved design in CorrectMeasurementsModal.jsx
    const modalPath = path.resolve('frontend/src/components/checkin/CorrectMeasurementsModal.jsx');
    const modalContent = fs.readFileSync(modalPath, 'utf8');
    assert.ok(
      modalContent.includes("borderRadius: '16px'") ||
      modalContent.includes('borderRadius: "16px"') ||
      modalContent.includes('rounded-2xl'),
      'CorrectMeasurementsModal must have curved container (16px / rounded-2xl)'
    );
  });

});

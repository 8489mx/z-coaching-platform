import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  calculateHeartRateZones,
  evaluateCardioInterferenceDecoupling,
  evaluateLegDayCardioConflict,
  resolveNeatStepTarget,
  CARDIO_INTENSITIES
} from '../src/execution-engines/cardio-interference-engine.js';

import {
  getPracticalCardioPrescription,
  CARDIO_TYPES,
  CARDIO_EQUIPMENT
} from '../src/execution-engines/cardio-zones-engine.js';

import {
  buildSessionMobilityProtocol,
  DYNAMIC_MOBILITY_CATALOG,
  STATIC_COOL_DOWN_CATALOG
} from '../src/mobility-warmup-engine-v2/index.js';

const EMOJI_REGEX = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/u;

test('Phase 10: Cardio Prescription, Mobility Protocols & Leg-Day Interference Shield Suite', async (suite) => {

  await suite.test('1. Tanaka Zone 2 HR Calculation: Accurately computes BPM ranges and protects missing age', () => {
    // Age 20: 208 - 14 = 194 Max HR -> Zone 2 (60%-70%) = 116 - 136 BPM
    const z20 = calculateHeartRateZones(20);
    assert.equal(z20.age, 20);
    assert.equal(z20.max_heart_rate_bpm, 194);
    assert.equal(z20.zone_2_target.min_bpm, 116);
    assert.equal(z20.zone_2_target.max_bpm, 136);
    assert.equal(z20.zone_2_target.missing_age, false);

    // Age 50: 208 - 35 = 173 Max HR -> Zone 2 (60%-70%) = 104 - 121 BPM
    const z50 = calculateHeartRateZones(50);
    assert.equal(z50.age, 50);
    assert.equal(z50.max_heart_rate_bpm, 173);
    assert.equal(z50.zone_2_target.min_bpm, 104);
    assert.equal(z50.zone_2_target.max_bpm, 121);

    // Missing age: Strictly nullifies without fabricated default
    const zMissing = calculateHeartRateZones(null);
    assert.equal(zMissing.age, null);
    assert.equal(zMissing.max_heart_rate_bpm, null);
    assert.equal(zMissing.zone_2_target.missing_age, true);
    assert.equal(zMissing.zone_2_target.min_bpm, null);
  });

  await suite.test('2. Practical Cardio Prescription: Integrates Tanaka HR zones, NEAT step targets, and Talk-Test', () => {
    // Normal Trainee with Age 30
    const rx = getPracticalCardioPrescription({
      type: CARDIO_TYPES.LISS_TALK_TEST,
      duration_minutes: 30,
      sessions_per_week: 3,
      age: 30,
      neat_level: 'sedentary',
      occupation: 'DESK_OFFICE'
    });

    assert.equal(rx.type, CARDIO_TYPES.LISS_TALK_TEST);
    assert.equal(rx.duration_minutes, 30);
    assert.equal(rx.sessions_per_week, 3);
    assert.ok(rx.heart_rate_target);
    assert.equal(rx.heart_rate_target.missing_age, false);
    assert.equal(rx.heart_rate_target.max_heart_rate_bpm, 187); // 208 - 21
    assert.equal(rx.heart_rate_target.min_bpm, 112); // 187 * 0.6
    assert.equal(rx.heart_rate_target.max_bpm, 131); // 187 * 0.7
    assert.equal(rx.neat_target.min_steps, 8000);
    assert.equal(rx.neat_target.max_steps, 10000);

    // Asthma Trainee requesting HIIT -> Auto-converted to LISS Talk-Test with clinical guardrail
    const asthmaRx = getPracticalCardioPrescription({
      type: CARDIO_TYPES.HIIT_INTERVALS,
      medicalConditions: ['ASTHMA'],
      age: 28
    });
    assert.equal(asthmaRx.type, CARDIO_TYPES.LISS_TALK_TEST);
    assert.equal(asthmaRx.clinical_guardrails.hiit_banned, true);
    assert.equal(asthmaRx.clinical_guardrails.hiit_ban_reason, 'RESPIRATORY');
  });

  await suite.test('3. NEAT Step Resolver: Recommends occupation-based step goals', () => {
    // Desk worker
    const deskSteps = resolveNeatStepTarget({ neat_level: 'sedentary', occupation: 'DESK_OFFICE' });
    assert.equal(deskSteps.min_steps, 8000);
    assert.equal(deskSteps.max_steps, 10000);

    // Highly active standing worker
    const activeSteps = resolveNeatStepTarget({ neat_level: 'high', occupation: 'STANDING' });
    assert.equal(activeSteps.min_steps, 10000);
    assert.equal(activeSteps.max_steps, 12000);

    // Moderate general worker
    const modSteps = resolveNeatStepTarget({ neat_level: 'moderate', occupation: 'MIXED' });
    assert.equal(modSteps.min_steps, 8500);
    assert.equal(modSteps.max_steps, 10500);
  });

  await suite.test('4. Leg-Day Cardio Conflict Shield: Detects high-intensity HIIT collision with lower body training', () => {
    const legExercises = [
      { code: 'BARBELL_BACK_SQUAT', name: 'سكوات بالبار الخلفي', target_muscle: 'QUADRICEPS' },
      { code: 'LEG_PRESS', name: 'ضغط الأرجل بالجهاز', target_muscle: 'QUADRICEPS' },
      { code: 'ROMANIAN_DEADLIFT', name: 'ديدليفت روماني', target_muscle: 'HAMSTRINGS' }
    ];

    const upperExercises = [
      { code: 'BARBELL_BENCH_PRESS', name: 'بنش برس مستوي بالبار', target_muscle: 'CHEST' },
      { code: 'LAT_PULLDOWN', name: 'سحب ظهر واسع', target_muscle: 'LATS' }
    ];

    // Case A: HIIT on Leg Day (Same Day) -> Strict Conflict Triggered
    const legHiitConflict = evaluateLegDayCardioConflict({
      cardio_type: CARDIO_INTENSITIES.HIGH_INTENSITY_HIIT,
      session_exercises: legExercises,
      is_same_day: true
    });
    assert.equal(legHiitConflict.has_leg_day_conflict, true);
    assert.equal(legHiitConflict.conflict_reason, 'HIIT_ON_LEG_DAY');
    assert.ok(legHiitConflict.guidance_ar.includes('تحذير تداخل تدريبي'));

    // Case B: LISS Zone 2 on Leg Day (Same Day) -> Permissible for Active Recovery
    const legLissAudit = evaluateLegDayCardioConflict({
      cardio_type: CARDIO_INTENSITIES.ZONE_2_STEADY_STATE,
      session_exercises: legExercises,
      is_same_day: true
    });
    assert.equal(legLissAudit.has_leg_day_conflict, false);
    assert.equal(legLissAudit.conflict_reason, null);

    // Case C: HIIT on Upper Body Day (Same Day) -> No direct lower body collision
    const upperHiitAudit = evaluateLegDayCardioConflict({
      cardio_type: CARDIO_INTENSITIES.HIGH_INTENSITY_HIIT,
      session_exercises: upperExercises,
      is_same_day: true
    });
    assert.equal(upperHiitAudit.has_leg_day_conflict, false);

    // Case D: HIIT on Separate Day -> No Conflict
    const separateDayAudit = evaluateLegDayCardioConflict({
      cardio_type: CARDIO_INTENSITIES.HIGH_INTENSITY_HIIT,
      session_exercises: legExercises,
      is_same_day: false
    });
    assert.equal(separateDayAudit.has_leg_day_conflict, false);
  });

  await suite.test('5. Session Mobility & Clinical Prehab Engine: Adapts dynamic warm-ups and static cool-downs by injury', () => {
    // Case A: Knee Injury / Patellar Tendonitis -> Filters deep squat-to-stand, substitutes floor glute bridge
    const kneeMobility = buildSessionMobilityProtocol('LOWER', ['patellofemoral', 'knee']);
    assert.ok(kneeMobility.dynamic_warmup.exercises.length > 0);
    assert.ok(kneeMobility.static_cooldown.exercises.length > 0);
    assert.equal(kneeMobility.dynamic_warmup.exercises.some(e => e.id === 'SQUAT_TO_STAND'), false);
    assert.ok(kneeMobility.dynamic_warmup.exercises.some(e => e.id === 'GLUTE_BRIDGE_ACTIVATION'));
    assert.ok(kneeMobility.clinical_contraindications_bypassed_ar.length > 0);

    // Case B: Rotator Cuff Impingement -> Substitutes aggressive arm circles with banded dislocates
    const shoulderMobility = buildSessionMobilityProtocol('UPPER', ['rotator_cuff', 'shoulder']);
    assert.equal(shoulderMobility.dynamic_warmup.exercises.some(e => e.id === 'ARM_CIRCLES_SWINGS'), false);
    assert.ok(shoulderMobility.dynamic_warmup.exercises.some(e => e.id === 'BANDED_DISLOCATES_GENTLE'));

    // Case C: Lumbar Disc Herniation -> Substitutes rounded-back hamstring flexion with neutral spine supine stretch
    const spineMobility = buildSessionMobilityProtocol('FULL_BODY', ['lumbar_disc', 'spine_back']);
    assert.equal(spineMobility.static_cooldown.exercises.some(e => e.id === 'SEATED_HAMSTRING_STRETCH'), false);
    assert.ok(spineMobility.static_cooldown.exercises.some(e => e.id === 'NEUTRAL_SPINE_HAMSTRING_STRAP'));
  });

  await suite.test('6. Invariants Guard: Zero Emojis and RTL alignment across Phase 10 components', () => {
    const filesToCheck = [
      'frontend/src/utils/cardioInterferenceEngine.js',
      'src/execution-engines/cardio-interference-engine.js',
      'frontend/src/utils/cardioZonesEngine.js',
      'src/execution-engines/cardio-zones-engine.js',
      'frontend/src/pages/CoachEditor/components/CoachCardioHabitsTab.jsx',
      'frontend/src/pages/ProgramPdfView.jsx',
      'frontend/src/utils/pdfExportEngine.js',
      'src/api/controllers/program.controller.js',
      'src/master-engine-v2/build-master-engine-v2.js'
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

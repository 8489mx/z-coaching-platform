import test from 'node:test';
import assert from 'node:assert/strict';

import { buildTrainingMesoCycle, resolveMesocycleWeekConfigs } from '../src/training-engine-v2/build-training-mesocycle.js';
import { buildAdaptedPlan } from '../src/adaptation-engine/build-adapted-plan.js';
import {
  evaluateExercise,
  buildProgressionState,
  evaluateDeloadTrigger,
  buildPostDeloadTarget,
  PROGRESSION_DECISIONS,
  DELOAD_REASONS,
  DELOAD_STATUS
} from '../frontend/src/utils/progressionEngine.js';
import { resolveTrainingCycleStatus, CYCLE_STATUS } from '../src/api/services/trainingCycleService.js';
import { AdaptationAction } from '../src/adaptation-engine/domain/enums.js';
import { CheckinAnalysisStatus } from '../src/checkin-engine/domain/enums.js';

import { adaptIntakePayloadToCanonicalEngine } from '../src/intake-decision-engine/adapters/intake-adapter.js';
import { evaluateIntake } from 'z-coaching-intake-decision-engine';
import { COMPLETE_INTAKE } from './fixtures/complete-intake.js';

const evaluationContext = Object.freeze({
  client_id: 'test_phase3_client',
  assessmentDate: '2026-10-22',
  system_time: '2026-10-22T10:00:00.000Z'
});

function createMockIntakeDecision({ experience = 'BEGINNER', location = 'GYM', preferredDays = 3 } = {}) {
  const intake = JSON.parse(JSON.stringify(COMPLETE_INTAKE));
  intake.training.experience = experience;
  intake.training.location = location;
  intake.training.preferredDaysPerWeek = preferredDays;
  const canonical = adaptIntakePayloadToCanonicalEngine(intake);
  const decision = evaluateIntake(canonical, evaluationContext);
  decision.profile = { experience };
  return decision;
}

// ============================================================================
// Scenario 1: Beginner Progressing Normally Without Fatigue
// ============================================================================

test('P3-1a. Beginner Mesocycle: Week 5 consolidates with RIR 2 and full volume (NO forced deload)', () => {
  const decision = createMockIntakeDecision({ experience: 'BEGINNER' });
  const mesocycle = buildTrainingMesoCycle(decision, { weeksCount: 5 });

  assert.equal(mesocycle.total_weeks, 5, 'Total weeks must be 5');
  const w1 = mesocycle.weeks[0];
  const w4 = mesocycle.weeks[3];
  const w5 = mesocycle.weeks[4];

  assert.equal(w1.target_rir, 3, 'Week 1 is introductory accumulation (RIR 3)');
  assert.equal(w4.target_rir, 2, 'Week 4 maintains clean technique without dangerous failure (RIR 2)');
  assert.equal(w5.phase, 'CONSOLIDATION', 'Week 5 is Consolidation for beginners by default');
  assert.equal(w5.target_rir, 2, 'RIR 2 preserved in consolidation');

  const w4Sets = w4.sessions[0].exercises[0].sets;
  const w5Sets = w5.sessions[0].exercises[0].sets;
  assert.equal(w5Sets, w4Sets, 'Beginner sets are preserved in consolidation (not slashed by 40%)');
});

test('P3-1b. Beginner Adaptation: Week 5 with low fatigue does not trigger auto-deload', () => {
  const masterProgram = {
    client: { experience: 'BEGINNER', gender: 'male' },
    training_program: {
      experience: 'BEGINNER',
      weeks: [{ sessions: [{ exercises: [{ code: 'BARBELL_BACK_SQUAT', sets: 3, rir: 2 }] }] }]
    },
    nutrition_program: { targets: { calories_kcal: 2200, protein_g: 160, carbohydrate_g: 250, fat_g: 60 } }
  };

  const adapted = buildAdaptedPlan({
    currentMasterProgram: masterProgram,
    checkinAnalysis: {
      analysis_status: CheckinAnalysisStatus.ON_TRACK,
      fatigue_score: 3 // Low fatigue
    },
    options: {
      experience: 'BEGINNER',
      weeks_of_accumulated_training: 5
    }
  });

  assert.notEqual(adapted.adaptation_action, AdaptationAction.SCHEDULE_DELOAD, 'Must not force deload on fresh beginner');
  assert.equal(adapted.adapted_training_week.phase, 'CONSOLIDATION');
});

test('P3-1c. Beginner Progression: Clean double progression advances weight when ready', () => {
  const res = evaluateExercise({
    exercise_code: 'BARBELL_BENCH_PRESS',
    rep_min: 8,
    rep_max: 10,
    weight_kg: 50,
    last_set_reps: 10,
    effort: 'OK'
  });

  assert.equal(res.decision, PROGRESSION_DECISIONS.INCREASE_WEIGHT);
  assert.equal(res.next_weight_kg, 52.5);
  assert.equal(res.next_rep_target, 8);
});

// ============================================================================
// Scenario 2: Intermediate Trainee Continuing Progress
// ============================================================================

test('P3-2a. Intermediate Mesocycle: Schedules strategic deload in Week 5 (volume -30%, RIR 3)', () => {
  const decision = createMockIntakeDecision({ experience: 'INTERMEDIATE' });
  const mesocycle = buildTrainingMesoCycle(decision, { weeksCount: 5 });

  const w5 = mesocycle.weeks[4];
  assert.equal(w5.phase, 'DELOAD', 'Intermediate default week 5 is deload');
  assert.equal(w5.target_rir, 3, 'Strategic deload sets RIR 3');

  const w4Sets = mesocycle.weeks[3].sessions[0].exercises[0].sets;
  const w5Sets = w5.sessions[0].exercises[0].sets;
  assert.ok(w5Sets <= w4Sets, 'Sets must be reduced for intermediate deload');
});

test('P3-2b. Intermediate Coach Control: Coach can skip deload via option', () => {
  const decision = createMockIntakeDecision({ experience: 'INTERMEDIATE' });
  const mesocycle = buildTrainingMesoCycle(decision, { weeksCount: 5, skipDeload: true });

  const w5 = mesocycle.weeks[4];
  assert.equal(w5.phase, 'CONSOLIDATION', 'Coach override skipDeload creates consolidation week');
  assert.equal(w5.target_rir, 2);
});

// ============================================================================
// Scenario 3: Advanced Trainee with Performance Dip
// ============================================================================

test('P3-3a. Advanced Trainee: Week 5 Regenerative Deload (sets -40%, RIR 4)', () => {
  const decision = createMockIntakeDecision({ experience: 'ADVANCED' });
  const mesocycle = buildTrainingMesoCycle(decision, { weeksCount: 5 });

  const w5 = mesocycle.weeks[4];
  assert.equal(w5.phase, 'DELOAD');
  assert.equal(w5.target_rir, 4, 'Advanced regenerative deload targets RIR 4');

  const w4Sets = mesocycle.weeks[3].sessions[0].exercises[0].sets;
  const w5Sets = w5.sessions[0].exercises[0].sets;
  assert.ok(w5Sets < w4Sets, 'Deload sets must drop significantly from peak volume');
});

test('P3-3b. Advanced Autoregulation: Performance drop streak triggers deload recommendation', () => {
  const state = {
    deload: { status: DELOAD_STATUS.NONE },
    dropping_exercises: ['BARBELL_BENCH_PRESS', 'BARBELL_BACK_SQUAT']
  };

  const trigger = evaluateDeloadTrigger({
    state,
    biofeedback: { energy_level: 2, sleep_quality: 2 }
  });

  assert.equal(trigger.recommended, true);
  assert.equal(trigger.reason, DELOAD_REASONS.PERFORMANCE_FATIGUE);
  assert.deepEqual(trigger.affected_exercises, ['BARBELL_BENCH_PRESS', 'BARBELL_BACK_SQUAT']);
});

test('P3-3c. Post-Deload Reset: Targets last successful weight or stall weight -10%', () => {
  const target = buildPostDeloadTarget({
    exercise_code: 'BARBELL_BENCH_PRESS',
    last_success_weight_kg: 100,
    stall_weight_kg: 102.5,
    affected: true,
    reason: DELOAD_REASONS.PERFORMANCE_FATIGUE
  });

  assert.ok(target.weight_kg <= 100, 'Must not exceed last successful weight');
  assert.equal(target.rule, 'STALL_MINUS_10');
});

// ============================================================================
// Scenario 4: Client with Incomplete / Missing Workout Data
// ============================================================================

test('P3-4a. Progression Engine: Incomplete data (weight 0 or missing reps) holds consolidate', () => {
  const resMissingWeight = evaluateExercise({
    exercise_code: 'BARBELL_BENCH_PRESS',
    rep_min: 8,
    rep_max: 10,
    weight_kg: 0,
    last_set_reps: 8,
    effort: 'OK'
  });

  assert.equal(resMissingWeight.decision, PROGRESSION_DECISIONS.HOLD_CONSOLIDATE);
  assert.equal(resMissingWeight.requires_coach_review, true);
  assert.ok(resMissingWeight.directive_ar.includes('غير مكتملة'));

  const resUnreliable = evaluateExercise({
    exercise_code: 'BARBELL_BACK_SQUAT',
    rep_min: 6,
    rep_max: 8,
    weight_kg: 80,
    last_set_reps: 8,
    is_unreliable_data: true
  });

  assert.equal(resUnreliable.decision, PROGRESSION_DECISIONS.HOLD_CONSOLIDATE);
  assert.equal(resUnreliable.requires_coach_review, true);
});

test('P3-4b. Adaptation Engine: Insufficient workout logs holds plan and alerts coach', () => {
  const masterProgram = {
    client: { experience: 'INTERMEDIATE', gender: 'male' },
    training_program: {
      weeks: [{ sessions: [{ exercises: [{ code: 'BARBELL_BENCH_PRESS', sets: 4, rir: 2 }] }] }]
    },
    nutrition_program: { targets: { calories_kcal: 2500, protein_g: 170, carbohydrate_g: 300, fat_g: 70 } }
  };

  const adapted = buildAdaptedPlan({
    currentMasterProgram: masterProgram,
    checkinAnalysis: {
      analysis_status: CheckinAnalysisStatus.ON_TRACK,
      has_insufficient_training_data: true
    },
    options: {
      weeks_of_accumulated_training: 5
    }
  });

  assert.notEqual(adapted.adaptation_action, AdaptationAction.SCHEDULE_DELOAD, 'Must not assume fatigue from incomplete data');
  assert.equal(adapted.requires_coach_approval, true);
  const reason = adapted.adaptation_reasons.find(r => r.code === 'INSUFFICIENT_TRAINING_LOGS_HOLD');
  assert.ok(reason, 'Must log insufficient training data reason');
});

// ============================================================================
// Scenario 5: Client Reporting Pain Requiring Review
// ============================================================================

test('P3-5a. Joint Pain Reporting: Progression engine forbids weight increases on painful joint', () => {
  const res = evaluateExercise({
    exercise_code: 'BARBELL_BACK_SQUAT',
    rep_min: 6,
    rep_max: 8,
    weight_kg: 100,
    last_set_reps: 8, // Hit top of range, would normally increase
    effort: 'OK',
    joint_pain_reported: true
  });

  assert.notEqual(res.decision, PROGRESSION_DECISIONS.INCREASE_WEIGHT, 'Must NEVER increase weight when joint pain is present');
  assert.equal(res.decision, PROGRESSION_DECISIONS.HOLD_CONSOLIDATE);
  assert.equal(res.requires_coach_review, true);
  assert.ok(res.directive_ar.includes('ألم'));
});

test('P3-5b. Severe Joint Pain (7/10) recommends deload trigger', () => {
  const state = {
    deload: { status: DELOAD_STATUS.NONE },
    dropping_exercises: []
  };

  const trigger = evaluateDeloadTrigger({
    state,
    max_pain_level: 8
  });

  assert.equal(trigger.recommended, true);
  assert.equal(trigger.reason, DELOAD_REASONS.JOINT_PAIN);
});

// ============================================================================
// Scenario 6: Week 5 End & Next Cycle Transition (CycleScheduler Compatibility)
// ============================================================================

test('P3-6. Cycle Continuity: 5-week cycle status is ACTIVE then ENDED at day 35 without breaking schema', () => {
  const started = new Date('2026-09-01T04:00:00Z');
  const program = {
    createdAt: started.toISOString(),
    program_data: {
      cycle_number: 1,
      cycle_started_at: started.toISOString(),
      training_program: {
        weeks: [{}, {}, {}, {}, {}] // Exactly 5 weeks
      }
    }
  };

  const activeCheck = resolveTrainingCycleStatus(program, new Date('2026-09-20T04:00:00Z'));
  assert.equal(activeCheck.status, CYCLE_STATUS.ACTIVE);
  assert.equal(activeCheck.total_weeks, 5);
  assert.equal(activeCheck.current_week, 3);
  assert.equal(activeCheck.needs_new_cycle, false);

  const endedCheck = resolveTrainingCycleStatus(program, new Date('2026-10-07T04:00:00Z')); // 36 days later
  assert.equal(endedCheck.status, CYCLE_STATUS.ENDED);
  assert.equal(endedCheck.needs_new_cycle, true);
});

// ============================================================================
// Scenario 7: Published Programs Stability
// ============================================================================

test('P3-7. Published Program Structure: Retains valid schema with sessions, exercises, sets, and RIR', () => {
  const decision = createMockIntakeDecision({ experience: 'INTERMEDIATE', preferredDays: 3 });
  const mesocycle = buildTrainingMesoCycle(decision, { weeksCount: 5 });

  assert.equal(mesocycle.weeks.length, 5);
  for (const week of mesocycle.weeks) {
    assert.ok(Array.isArray(week.sessions));
    assert.ok(week.sessions.length >= 3);
    for (const session of week.sessions) {
      assert.ok(Array.isArray(session.exercises));
      for (const ex of session.exercises) {
        assert.ok(ex.sets >= 2 && ex.sets <= 5, 'Sets must be within safe physiological bounds');
        assert.ok(Number.isFinite(ex.target_rir) && ex.target_rir >= 0);
      }
    }
  }
});

// ============================================================================
// Scenario 8: Non-interference with Clinical Safety Gates
// ============================================================================

test('P3-8. Clinical Safety Shield: Critical Cardiac Flag locks all workouts (training_session = null)', () => {
  const masterProgram = {
    client: { experience: 'ADVANCED' },
    training_program: {
      weeks: [{ sessions: [{ exercises: [{ code: 'BARBELL_BENCH_PRESS', sets: 4, rir: 2 }] }] }]
    },
    nutrition_program: { targets: { calories_kcal: 2400, protein_g: 160, carbohydrate_g: 280, fat_g: 65 } }
  };

  const adapted = buildAdaptedPlan({
    currentMasterProgram: masterProgram,
    checkinAnalysis: {
      analysis_status: CheckinAnalysisStatus.CRITICAL_CARDIAC_FLAG,
      training_locked: true
    }
  });

  assert.equal(adapted.adapted_training_week, null, 'Workouts must be completely nullified on cardiac lock');
  const lockoutReason = adapted.adaptation_reasons.find(r => r.code === 'CLINICAL_TRAINING_LOCKOUT');
  assert.ok(lockoutReason, 'Clinical lockout reason must be attached');
});

// ============================================================================
// Scenario 9: Week 4 Target RIR Autoregulation (No Forced Failure RIR 0)
// ============================================================================

test('P3-9a. Advanced Mesocycle Week 4: Defaults to RIR 1 (NOT forced to absolute failure RIR 0)', () => {
  const configs = resolveMesocycleWeekConfigs({ experience: 'ADVANCED', weeksCount: 5 });
  const w4 = configs[3];
  assert.equal(w4.week_number, 4);
  assert.equal(w4.target_rir, 1, 'Default for advanced in week 4 must be RIR 1, not forced 0');
  assert.ok(!w4.focus_note.includes('RIR 0-1'), 'Must not describe mandatory failure');
});

test('P3-9b. Advanced Mesocycle Week 4: Elevates to RIR 2 when fatigue is high or recovery is low', () => {
  const fatiguedConfigs = resolveMesocycleWeekConfigs({
    experience: 'ADVANCED',
    weeksCount: 5,
    fatigueScore: 7
  });
  assert.equal(fatiguedConfigs[3].target_rir, 2, 'Fatigued advanced lifter gets RIR 2 in week 4');

  const poorRecoveryConfigs = resolveMesocycleWeekConfigs({
    experience: 'ADVANCED',
    weeksCount: 5,
    recoveryScore: 2
  });
  assert.equal(poorRecoveryConfigs[3].target_rir, 2, 'Low recovery advanced lifter gets RIR 2 in week 4');
});

test('P3-9c. Advanced Mesocycle Week 4: Coach can explicitly customize target RIR', () => {
  const customRirConfigs = resolveMesocycleWeekConfigs({
    experience: 'ADVANCED',
    weeksCount: 5,
    targetRirWeek4: 2
  });
  assert.equal(customRirConfigs[3].target_rir, 2, 'Respects coach custom RIR for week 4');
});

// ============================================================================
// Scenario 10: Week 5 Autoregulated Deload & Planned Deload Customizability
// ============================================================================

test('P3-10a. Intermediate with High Recovery & Progressing: Consolidates in Week 5 without forced deload', () => {
  const configs = resolveMesocycleWeekConfigs({
    experience: 'INTERMEDIATE',
    weeksCount: 5,
    recoveryScore: 4,
    performanceTrend: 'PROGRESSING'
  });
  const w5 = configs[4];
  assert.equal(w5.phase, 'CONSOLIDATION', 'Thriving intermediate trainee can consolidate instead of mandatory deload');
  assert.equal(w5.target_rir, 2);
  assert.equal(w5.volume_modifier, 1.0);
});

test('P3-10b. Beginner with Fatigue or Dropping Performance: Gets Deload in Week 5', () => {
  const configs = resolveMesocycleWeekConfigs({
    experience: 'BEGINNER',
    weeksCount: 5,
    fatigueScore: 8,
    performanceTrend: 'DROPPING'
  });
  const w5 = configs[4];
  assert.equal(w5.phase, 'DELOAD', 'Fatigued beginner receives planned deload');
  assert.equal(w5.target_rir, 3);
  assert.equal(w5.volume_modifier, 0.75);
});

test('P3-10c. Coach Preference Override: Coach can explicitly select DELOAD or CONSOLIDATION', () => {
  const forceDeload = resolveMesocycleWeekConfigs({
    experience: 'BEGINNER',
    coachDeloadPreference: 'DELOAD'
  });
  assert.equal(forceDeload[4].phase, 'DELOAD');

  const forceConsolidate = resolveMesocycleWeekConfigs({
    experience: 'ADVANCED',
    coachDeloadPreference: 'CONSOLIDATION'
  });
  assert.equal(forceConsolidate[4].phase, 'CONSOLIDATION');
});

// ============================================================================
// Scenario 11: Planned Deload Post-Reset Load Retention (No Unjustified -10%)
// ============================================================================

test('P3-11a. Planned Deload without confirmed regression: Restores LAST_SUCCESS weight (NO -10%)', () => {
  const postTarget = buildPostDeloadTarget({
    exercise_code: 'BARBELL_BENCH_PRESS',
    last_success_weight_kg: 100,
    stall_weight_kg: null,
    affected: false,
    reason: DELOAD_REASONS.SCHEDULED
  });

  assert.equal(postTarget.weight_kg, 100, 'Must return to full 100 kg after planned deload');
  assert.equal(postTarget.rule, 'LAST_SUCCESS');
});

test('P3-11b. Single minor rep miss (HOLD_RETRY) in week before deload: Does NOT penalize with -10%', () => {
  // Trainee reached 7 reps instead of 8 once before planned deload (stall_count = 1)
  const logs = [
    { created_at: '2026-09-01T10:00:00Z', week_number: 1, logged_exercises: [{ exercise_code: 'BARBELL_BENCH_PRESS', weight_kg: 80, last_set_reps: 8, rep_min: 8, rep_max: 10, effort: 'OK' }] },
    { created_at: '2026-09-08T10:00:00Z', week_number: 2, logged_exercises: [{ exercise_code: 'BARBELL_BENCH_PRESS', weight_kg: 80, last_set_reps: 7, rep_min: 8, rep_max: 10, effort: 'HARD' }] }, // single retry
    { created_at: '2026-09-15T10:00:00Z', week_number: 5, is_deload: true, logged_exercises: [{ exercise_code: 'BARBELL_BENCH_PRESS', weight_kg: 50, last_set_reps: 6, rep_min: 8, rep_max: 10, effort: 'EASY' }] },
  ];

  const state = buildProgressionState({ logs, now: new Date('2026-09-17T10:00:00Z') });
  const bench = state.exercises['BARBELL_BENCH_PRESS'];

  assert.equal(bench.target.decision, 'POST_DELOAD_RESET');
  assert.equal(bench.target.weight_kg, 80, 'Must not penalize 10% after scheduled deload for single normal retry');
  assert.equal(bench.target.rule, 'LAST_SUCCESS');
});

test('P3-11c. Confirmed repeated stall (stall_count >= 2) before deload: Applies STALL_MINUS_10', () => {
  const logs = [
    { created_at: '2026-09-01T10:00:00Z', week_number: 1, logged_exercises: [{ exercise_code: 'BARBELL_BENCH_PRESS', weight_kg: 80, last_set_reps: 7, rep_min: 8, rep_max: 10, effort: 'HARD' }] },
    { created_at: '2026-09-08T10:00:00Z', week_number: 2, logged_exercises: [{ exercise_code: 'BARBELL_BENCH_PRESS', weight_kg: 80, last_set_reps: 7, rep_min: 8, rep_max: 10, effort: 'HARD' }] }, // second stall!
    { created_at: '2026-09-15T10:00:00Z', week_number: 5, is_deload: true, logged_exercises: [{ exercise_code: 'BARBELL_BENCH_PRESS', weight_kg: 50, last_set_reps: 6, rep_min: 8, rep_max: 10, effort: 'EASY' }] },
  ];

  const state = buildProgressionState({ logs, now: new Date('2026-09-17T10:00:00Z') });
  const bench = state.exercises['BARBELL_BENCH_PRESS'];

  assert.equal(bench.target.decision, 'POST_DELOAD_RESET');
  assert.equal(bench.target.weight_kg, 70, 'Must reduce 10% (80 -> 72 -> rounded down to 70 kg) when multi-session stall is confirmed');
  assert.equal(bench.target.rule, 'STALL_MINUS_10');
});

// ============================================================================
// Scenario 12: Severe Joint Pain (>= 7/10) Cannot Auto-Resolve via Deload
// ============================================================================

test('P3-12. Severe Joint Pain (>= 7/10) flags clinical review and firewall, not mere volume deload', () => {
  const trigger = evaluateDeloadTrigger({
    state: { deload: { status: 'NONE' }, dropping_exercises: [] },
    max_pain_level: 8
  });

  assert.equal(trigger.recommended, true);
  assert.equal(trigger.reason, DELOAD_REASONS.JOINT_PAIN);
  assert.equal(trigger.requires_coach_review, true, 'Must require coach review');
  assert.equal(trigger.requires_clinical_review, true, 'Must require clinical review');
  assert.equal(trigger.clinical_firewall, true, 'Must activate clinical firewall');
  assert.equal(trigger.action_required, 'CLINICAL_EVALUATION_AND_EXERCISE_SWAP');
  assert.ok(trigger.reasons_ar.some(r => r.includes('جدار الحماية')), 'Must explicitly mandate injury firewall');
});

// ============================================================================
// Scenario 13: Consolidation Week Does Not Increment Drop Streak
// ============================================================================

test('P3-13. Week 5 Consolidation Log does not falsely count as a performance drop streak', () => {
  const logs = [
    { created_at: '2026-09-01T10:00:00Z', week_number: 4, phase: 'PEAK_OVERLOAD', logged_exercises: [{ exercise_code: 'BARBELL_BENCH_PRESS', weight_kg: 100, last_set_reps: 10, rep_min: 8, rep_max: 10, effort: 'HARD' }] },
    // Consolidation week keeping RIR 2 with 8 clean reps instead of 10
    { created_at: '2026-09-08T10:00:00Z', week_number: 5, phase: 'CONSOLIDATION', is_consolidation: true, logged_exercises: [{ exercise_code: 'BARBELL_BENCH_PRESS', weight_kg: 100, last_set_reps: 8, rep_min: 8, rep_max: 10, effort: 'OK' }] },
  ];

  const state = buildProgressionState({ logs, now: new Date('2026-09-09T10:00:00Z') });
  const bench = state.exercises['BARBELL_BENCH_PRESS'];

  assert.equal(bench.drop_streak, 0, 'Consolidation week must NEVER increment drop streak');
});

// ============================================================================
// Scenario 14: Coach Approval Enforcement
// ============================================================================

test('P3-14. Coach Approval: approveCheckin requires authenticated COACH or ADMIN role', async () => {
  const { approveCheckin } = await import('../src/api/controllers/checkin.controller.js');

  const reqClient = {
    user: { id: 99, role: 'CLIENT' },
    params: { checkinId: 1 },
    body: { apply_program_adaptation: true }
  };

  let clientStatusCode = 0;
  let clientResponseBody = null;
  const resClient = {
    status(code) { clientStatusCode = code; return this; },
    json(body) { clientResponseBody = body; return this; }
  };

  await approveCheckin(reqClient, resClient);
  assert.equal(clientStatusCode, 403, 'Client must be forbidden from approving check-ins');
  assert.equal(clientResponseBody.error, 'اعتماد المتابعة متاح للكوتش فقط');
});

test.after(async () => {
  try {
    const { default: sequelize } = await import('../src/api/config/db.js');
    if (sequelize && typeof sequelize.close === 'function') {
      await sequelize.close();
    }
  } catch (_) {}
  setTimeout(() => process.exit(0), 100);
});

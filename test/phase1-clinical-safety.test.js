import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { evaluateIntake } from '../src/intake-decision-engine/index.js';
import { adaptIntakePayloadToCanonicalEngine } from '../src/intake-decision-engine/adapters/intake-adapter.js';
import { evaluateCheckin } from '../src/checkin-engine/evaluate-checkin.js';
import { CheckinAnalysisStatus, BiofeedbackAlert } from '../src/checkin-engine/domain/enums.js';
import { buildAdaptedPlan } from '../src/adaptation-engine/build-adapted-plan.js';
import { buildMasterEngineV2 } from '../src/master-engine-v2/index.js';
import { logWorkout, submitCheckin, unlockClinicalSafety } from "../src/api/controllers/checkin.controller.js";
import { updateCustomProgram } from "../src/api/controllers/program.controller.js";
import { User, WorkoutLog, CheckinSubmission, Program, IntakeSubmission } from "../src/api/models/index.js";
import sequelize from "../src/api/config/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const catalogPath = path.join(__dirname, '..', 'data', 'catalogs', 'core-global-food-batch-v1.json');
const nutritionFoodCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

const evaluationContext = Object.freeze({
  system_time: '2026-10-21T00:00:00.000Z',
  assessmentDate: '2026-10-21'
});

function mockRes() {
  const out = { status: 200, body: null };
  const res = {
    status(c) { out.status = c; return res; },
    json(b) { out.body = b; return res; }
  };
  return { res, out };
}

async function cleanupUser(code) {
  const u = await User.findOne({ where: { client_code: code } });
  if (!u) return;
  await Program.destroy({ where: { user_id: u.id } }).catch(() => {});
  await WorkoutLog.destroy({ where: { user_id: u.id } }).catch(() => {});
  await CheckinSubmission.destroy({ where: { user_id: u.id } }).catch(() => {});
  await IntakeSubmission.destroy({ where: { user_id: u.id } }).catch(() => {});
  await u.destroy().catch(() => {});
}

// ============================================================================
// PHASE 1: COMPREHENSIVE CLINICAL SAFETY & INTEGRATION SUITE
// ============================================================================

test('S1. Diabetes Safety: Type 1 Diabetes Triggers MANDATORY MEDICAL_REVIEW_REQUIRED', () => {
  const rawIntake = {
    gender: 'male',
    age: 28,
    weight_kg: 80,
    height_cm: 180,
    primary_goal: 'fat_loss',
    dangerous_symptoms: ['NONE'],
    medical_conditions: {
      has_conditions: true,
      selected: ['diabetes'],
      diabetes: { type: 'type1', uses_insulin: true, hba1c: '7.8' }
    }
  };

  const adapted = adaptIntakePayloadToCanonicalEngine(rawIntake);
  const decision = evaluateIntake(adapted, evaluationContext);

  assert.equal(decision.plan_status, 'MEDICAL_REVIEW_REQUIRED');
  const hasInsulinFlag = decision.review_flags.some(f => f.code === 'INSULIN_SAFETY_REVIEW_REQUIRED');
  assert.ok(hasInsulinFlag, 'Expected INSULIN_SAFETY_REVIEW_REQUIRED flag');
});

test('S2. Diabetes Safety: Client Reporting Insulin Medication Triggers MEDICAL_REVIEW_REQUIRED', () => {
  const rawIntake = {
    gender: 'female',
    age: 35,
    weight_kg: 72,
    height_cm: 165,
    primary_goal: 'fat_loss',
    dangerous_symptoms: ['NONE'],
    current_meds_supplements_list: ['Lantus 20 IU', 'Metformin 500mg'],
    medical_conditions: {
      has_conditions: false,
      selected: []
    }
  };

  const adapted = adaptIntakePayloadToCanonicalEngine(rawIntake);
  const decision = evaluateIntake(adapted, evaluationContext);

  assert.equal(decision.plan_status, 'MEDICAL_REVIEW_REQUIRED');
  const flag = decision.review_flags.find(f => f.code === 'INSULIN_SAFETY_REVIEW_REQUIRED');
  assert.ok(flag, 'Must trigger INSULIN_SAFETY_REVIEW_REQUIRED for insulin medications');
  assert.equal(flag.level, 'MEDICAL');
});

test('S3. Diabetes Safety: Master Engine Identifies Insulin High-Risk and Attaches Medical Coordination Guidance', () => {
  const rawIntake = {
    gender: 'male',
    age: 32,
    weight_kg: 84,
    height_cm: 178,
    primary_goal: 'recomposition',
    medical_conditions: {
      has_conditions: true,
      selected: ['diabetes'],
      diabetes: { type: 'type1', uses_insulin: true }
    }
  };

  const master = buildMasterEngineV2({
    intake: rawIntake,
    evaluationContext,
    nutritionFoodCatalog
  });

  const guardrails = master.nutrition_program.targets.clinical_guardrails;
  assert.equal(guardrails.hypoglycemia_guard_active, true);
  assert.equal(guardrails.hypoglycemia_risk, 'HIGH');
  assert.equal(guardrails.medical_coordination_required, true);
  assert.ok(guardrails.medical_coordination_notice_ar.includes('تنسيقاً مع الفريق الطبي المعالج'));
  assert.ok(guardrails.ear_130g_disclaimer_ar.includes('تقدير فسيولوجي لاستهلاك جلوكوز الدماغ'));
});

test('S4. Diabetes Safety: Insulin Secretagogues (Sulfonylureas / Meglitinides) Trigger High Hypoglycemia Risk', () => {
  const rawIntake = {
    gender: 'male',
    age: 45,
    weight_kg: 90,
    height_cm: 175,
    primary_goal: 'fat_loss',
    current_meds_supplements_list: ['Amaryl 2mg (Glimepiride)'],
    medical_conditions: {
      has_conditions: true,
      selected: ['diabetes'],
      diabetes: { type: 'type2', uses_insulin: false }
    }
  };

  const master = buildMasterEngineV2({
    intake: rawIntake,
    evaluationContext,
    nutritionFoodCatalog
  });

  const guardrails = master.nutrition_program.targets.clinical_guardrails;
  assert.equal(guardrails.hypoglycemia_guard_active, true);
  assert.equal(guardrails.hypoglycemia_risk, 'HIGH');
  assert.equal(guardrails.takes_insulin_secretagogue, true);
  assert.ok(guardrails.secretagogue_alert_ar.includes('محفزات إفراز الأنسولين'));
});

test('S5. Cardiac Safety: Exertional Chest Pain and Syncope Trigger Immediate Lockout', () => {
  // Case A: Structured chest pain
  const resChest = evaluateCheckin({
    weight_kg: 85,
    previous_weight_kg: 85,
    nutrition_adherence_percent: 95,
    exertional_chest_pain: true,
    client_notes: 'شعرت بألم وضغط في منتصف الصدر أثناء مجموعة الاسكوات'
  });
  assert.equal(resChest.analysis_status, CheckinAnalysisStatus.CRITICAL_CARDIAC_FLAG);
  assert.equal(resChest.training_locked, true);
  assert.ok(resChest.biofeedback_alerts.includes(BiofeedbackAlert.CARDIAC_RED_FLAG));
  assert.ok(resChest.emergency_directive_ar.includes('توقف فوري عن كافة التمارين'));

  // Case B: Syncope / Fainting
  const resSyncope = evaluateCheckin({
    weight_kg: 78,
    previous_weight_kg: 78,
    nutrition_adherence_percent: 90,
    syncope: true,
    client_notes: 'أغمي علي لبضع ثوان بعد تمرين الديدليفت'
  });
  assert.equal(resSyncope.analysis_status, CheckinAnalysisStatus.CRITICAL_CARDIAC_FLAG);
  assert.equal(resSyncope.training_locked, true);
  assert.ok(resSyncope.biofeedback_alerts.includes(BiofeedbackAlert.CARDIAC_RED_FLAG));
});

test('S6. Screening Accuracy: Negations ("لا يوجد ألم بالصدر" / "no chest pain") DO NOT Trigger False Lockout', () => {
  // Arabic Negation
  const resArabicNeg = evaluateCheckin({
    weight_kg: 82,
    previous_weight_kg: 82.5,
    nutrition_adherence_percent: 90,
    client_notes: 'الأسبوع كان ممتاز والحمد لله لا يوجد أي ألم بالصدر أو دوخة'
  });
  assert.equal(resArabicNeg.analysis_status, CheckinAnalysisStatus.ON_TRACK);
  assert.equal(resArabicNeg.training_locked, false);
  assert.equal(resArabicNeg.biofeedback_alerts.includes(BiofeedbackAlert.CARDIAC_RED_FLAG), false);

  // English Negation
  const resEnglishNeg = evaluateCheckin({
    weight_kg: 82,
    previous_weight_kg: 82.5,
    nutrition_adherence_percent: 90,
    client_notes: 'great sessions this week, no chest pain, no dizziness at all'
  });
  assert.equal(resEnglishNeg.analysis_status, CheckinAnalysisStatus.ON_TRACK);
  assert.equal(resEnglishNeg.training_locked, false);
});

test('S7. Screening Accuracy: Benign Muscular Soreness (DOMS) DOES NOT Trigger False Lockout', () => {
  // Arabic Pectoral DOMS description
  const resArabicDoms = evaluateCheckin({
    weight_kg: 83,
    previous_weight_kg: 83.5,
    nutrition_adherence_percent: 92,
    client_notes: 'شد عضلي عادي في عضلات الصدر بعد تمرين البنش برس، استشفاء طبيعي'
  });
  assert.equal(resArabicDoms.analysis_status, CheckinAnalysisStatus.ON_TRACK);
  assert.equal(resArabicDoms.training_locked, false);

  // English Pectoral DOMS description
  const resEnglishDoms = evaluateCheckin({
    weight_kg: 83,
    previous_weight_kg: 83.5,
    nutrition_adherence_percent: 92,
    client_notes: 'normal chest muscle soreness after heavy bench press'
  });
  assert.equal(resEnglishDoms.analysis_status, CheckinAnalysisStatus.ON_TRACK);
  assert.equal(resEnglishDoms.training_locked, false);
});

test('S8. Adaptation Engine: Locks and Suspends All Workouts When Clinical Training Lockout Is Active', () => {
  const mockMaster = {
    client: { gender: 'male' },
    training_program: {
      weeks: [
        {
          week_number: 2,
          sessions: [
            { session_name: 'Upper A', exercises: [{ code: 'BENCH_PRESS', sets: 3 }] }
          ]
        }
      ]
    },
    nutrition_program: {
      targets: { calories_kcal: 2200, carbohydrate_g: 220, fat_g: 65, protein_g: 165 },
      cardio_program: { prescription: { daily_step_target: 8000 } }
    }
  };

  const adapted = buildAdaptedPlan({
    currentMasterProgram: mockMaster,
    checkinAnalysis: {
      analysis_status: CheckinAnalysisStatus.CRITICAL_CARDIAC_FLAG,
      training_locked: true,
      suggested_calorie_delta: 0,
      weight_kg: 85
    },
    currentWeekNumber: 1,
    nextWeekNumber: 2
  });

  assert.equal(adapted.adapted_training_week, null, 'Adapted training week must be null during clinical lockout');
  const reasons = adapted.adaptation_reasons || adapted.reasons || [];
  const lockoutReason = reasons.find(r => r.code === 'CLINICAL_TRAINING_LOCKOUT');
  assert.ok(lockoutReason, 'Must include CLINICAL_TRAINING_LOCKOUT reason');
});

test('S9. Medical Review Gate: Blocks Plan Publishing in updateCustomProgram (HTTP 409)', async () => {
  const GATE_USER_CODE = 'SAFE_GATE_USER_01';
  await cleanupUser(GATE_USER_CODE);

  const client = await User.create({
    client_code: GATE_USER_CODE,
    phone_number: '01007770001',
    full_name: 'Gate Test Client',
    role: 'CLIENT'
  });

  const coach = await User.create({
    client_code: 'SAFE_GATE_COACH_01',
    phone_number: '01007770002',
    full_name: 'Gate Coach',
    role: 'ADMIN'
  });

  // Attach intake submission with Type 1 Diabetes
  await IntakeSubmission.create({
    user_id: client.id,
    status: 'APPROVED',
    answers: {
      gender: 'male',
      age: 28,
      weight_kg: 80,
      height_cm: 180,
      primary_goal: 'fat_loss',
      medical_conditions: {
        has_conditions: true,
        selected: ['diabetes'],
        diabetes: { type: 'type1', uses_insulin: true }
      }
    }
  });

  try {
    // Attempt to publish program without medical_review_confirmed -> HTTP 409
    const rBlocked = mockRes();
    await updateCustomProgram({
      body: {
        user_id: GATE_USER_CODE,
        publish: true,
        program_data: { training_program: {}, nutrition_program: {} }
      },
      user: { id: coach.id }
    }, rBlocked.res);

    assert.equal(rBlocked.out.status, 409);
    assert.equal(rBlocked.out.body.code, 'MEDICAL_REVIEW_CONFIRMATION_REQUIRED');

    // Attempt to publish with medical_review_confirmed: true -> HTTP 200/201
    const rAllowed = mockRes();
    await updateCustomProgram({
      body: {
        user_id: GATE_USER_CODE,
        publish: true,
        medical_review_confirmed: true,
        program_data: { training_program: {}, nutrition_program: {} }
      },
      user: { id: coach.id }
    }, rAllowed.res);

    assert.equal(rAllowed.out.status, 200);
    assert.ok(rAllowed.out.body.program_id || rAllowed.out.body.message);
  } finally {
    await cleanupUser(GATE_USER_CODE);
    await cleanupUser('SAFE_GATE_COACH_01');
  }
});

test('S10. Clinical Lock Persistence Across Subsequent Check-ins, Re-submissions & Lockout Verification', async (t) => {
  const TRAINEE_CODE = 'SAFE_PERSIST_TRN_01';
  const COACH_CODE = 'SAFE_PERSIST_COACH_01';

  await cleanupUser(TRAINEE_CODE);
  await cleanupUser(COACH_CODE);

  const trainee = await User.create({
    client_code: TRAINEE_CODE,
    phone_number: '01009990011',
    full_name: 'Persistent Lock Trainee',
    role: 'CLIENT'
  });

  const coach = await User.create({
    client_code: COACH_CODE,
    phone_number: '01009990012',
    full_name: 'Attending Coach',
    role: 'ADMIN'
  });

  try {
    let week1CheckinId = null;

    // 1. Week 1: Trainee submits check-in with exertional chest pain
    await t.test('Step 1: Week 1 Check-in triggers CRITICAL_CARDIAC_FLAG and locks training', async () => {
      const r = mockRes();
      await submitCheckin({
        body: {
          user_id: TRAINEE_CODE,
          week_number: 1,
          weight_kg: 84.0,
          nutrition_adherence_percent: 90,
          exertional_chest_pain: true,
          client_notes: 'ألم ضاغط في منتصف الصدر أثناء التمرين',
          bypass_schedule_guard: true
        }
      }, r.res);

      assert.equal(r.out.status, 201);
      assert.equal(r.out.body.checkin.analysis_status, CheckinAnalysisStatus.CRITICAL_CARDIAC_FLAG);
      assert.equal(r.out.body.checkin.analysis_output.training_locked, true);
      week1CheckinId = r.out.body.checkin.id;
    });

    // 2. Trainee attempts to log workout -> Blocked with HTTP 403 CLINICAL_SAFETY_LOCKOUT
    await t.test('Step 2: Trainee workout log is rejected with HTTP 403', async () => {
      const r = mockRes();
      await logWorkout({
        body: {
          user_id: TRAINEE_CODE,
          week_number: 1,
          session_title: 'Chest & Back',
          logged_exercises: [{ exercise_code: 'BENCH_PRESS', weight_kg: 80, last_set_reps: 8 }]
        },
        user: { id: trainee.id }
      }, r.res);

      assert.equal(r.out.status, 403);
      assert.equal(r.out.body.code, 'CLINICAL_SAFETY_LOCKOUT');
    });

    // 3. Week 2: Trainee submits new check-in WITHOUT symptoms -> LOCK PERSISTS!
    await t.test('Step 3: Subsequent Week 2 Check-in without symptoms MAINTAINS clinical lock', async () => {
      const r = mockRes();
      await submitCheckin({
        body: {
          user_id: TRAINEE_CODE,
          week_number: 2,
          weight_kg: 83.5,
          nutrition_adherence_percent: 95,
          exertional_chest_pain: false,
          syncope: false,
          client_notes: 'الأسبوع ده مفيش أعراض وحاسس إني كويس',
          bypass_schedule_guard: true
        }
      }, r.res);

      assert.equal(r.out.status, 201);
      assert.equal(r.out.body.checkin.analysis_status, CheckinAnalysisStatus.CRITICAL_CARDIAC_FLAG);
      assert.equal(r.out.body.checkin.analysis_output.training_locked, true);
      assert.ok(r.out.body.checkin.analysis_output.emergency_directive_ar.includes('لا يزال قفل التدريب سارياً'));
    });

    // 4. Trainee still cannot log workout in Week 2 -> Lock persists!
    await t.test('Step 4: Workout log in Week 2 remains blocked with HTTP 403', async () => {
      const r = mockRes();
      await logWorkout({
        body: {
          user_id: TRAINEE_CODE,
          week_number: 2,
          session_title: 'Leg Day',
          logged_exercises: [{ exercise_code: 'SQUAT', weight_kg: 100, last_set_reps: 8 }]
        },
        user: { id: trainee.id }
      }, r.res);

      assert.equal(r.out.status, 403);
      assert.equal(r.out.body.code, 'CLINICAL_SAFETY_LOCKOUT');
    });

    // 5. Unauthorized client unlock attempt -> HTTP 403
    await t.test('Step 5: Client cannot self-unlock training (HTTP 403)', async () => {
      const r = mockRes();
      await unlockClinicalSafety({
        params: { checkinId: week1CheckinId },
        body: { medical_clearance_confirmed: true },
        user: { id: trainee.id }
      }, r.res);

      assert.equal(r.out.status, 403);
    });

    // 6. Coach unlocks with verified medical clearance -> Unlocks ALL locked checkins
    await t.test('Step 6: Coach unlocks with confirmed clearance and restores workout logging', async () => {
      const r = mockRes();
      await unlockClinicalSafety({
        params: { checkinId: week1CheckinId },
        body: {
          medical_clearance_confirmed: true,
          clearance_notes: 'تم فحص المتدرب بواسطة استشاري القلب وتخطيط القلب والمجهود سليم تماماً مع تصريح طبي باستئناف التدريب.'
        },
        user: { id: coach.id }
      }, r.res);

      assert.equal(r.out.status, 200);
      assert.equal(r.out.body.clinical_unlock.unlocked, true);

      // Trainee logs workout now -> HTTP 201 Success!
      const rLog = mockRes();
      await logWorkout({
        body: {
          user_id: TRAINEE_CODE,
          week_number: 2,
          session_title: 'Leg Day',
          logged_exercises: [{ exercise_code: 'SQUAT', weight_kg: 100, last_set_reps: 8 }]
        },
        user: { id: trainee.id }
      }, rLog.res);

      assert.equal(rLog.out.status, 201);
      assert.equal(rLog.out.body.success, true);
    });

  } finally {
    await cleanupUser(TRAINEE_CODE);
    await cleanupUser(COACH_CODE);
    await sequelize.close().catch(() => {});
  }
});

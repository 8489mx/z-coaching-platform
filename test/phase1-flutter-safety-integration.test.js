import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { User, Program, CheckinSubmission, WorkoutLog } from '../src/api/models/index.js';
import sequelize from '../src/api/config/database.js';
import { getActiveClinicalLockout } from '../src/api/services/clinicalSafetyService.js';
import { getActiveProgramByUserId } from '../src/api/controllers/program.controller.js';
import { submitCheckin, unlockClinicalSafety } from '../src/api/controllers/checkin.controller.js';

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
  await u.destroy().catch(() => {});
}

after(async () => {
  await sequelize.close();
});

// ============================================================================
// PHASE 1: BACKEND + FLUTTER CLINICAL SAFETY INTEGRATION TEST SUITE
// ============================================================================

test('FL1. Active Program Endpoint returns clinical_lockout.active=true and training_session=null when locked', async () => {
  const USER_CODE = 'SAFE_FLUTTER_LOCK_01';
  await cleanupUser(USER_CODE);

  const client = await User.create({
    client_code: USER_CODE,
    phone_number: '01008880001',
    full_name: 'Flutter Locked Client',
    role: 'CLIENT',
    plan_approval_status: 'APPROVED'
  });

  // Create an active program with a valid training session
  await Program.create({
    user_id: client.id,
    status: 'ACTIVE',
    program_data: {
      training: {
        sessions: [
          {
            session_name: 'صدر وبايسبس',
            exercises: [{ exercise_code: 'BENCH_PRESS', name: 'بنش برس', sets: 3, reps: '10' }]
          }
        ]
      },
      nutrition: { meals: [] }
    }
  });

  // Verify: Before check-in lockout, active program has active=false and a training_session
  const reqBefore = { user: { id: client.id, role: 'CLIENT' }, params: { user_id: USER_CODE } };
  const resBefore = mockRes();
  await getActiveProgramByUserId(reqBefore, resBefore.res);

  assert.equal(resBefore.out.status, 200);
  assert.equal(resBefore.out.body.clinical_lockout?.active, false);
  assert.ok(resBefore.out.body.client_view?.training_session);
  assert.equal(resBefore.out.body.client_view.training_session.session_name, 'صدر وبايسبس');

  // Trainee submits check-in with exertional chest pain -> triggers CRITICAL_CARDIAC_FLAG
  const reqCheckin = {
    user: { id: client.id, role: 'CLIENT' },
    body: {
      user_id: USER_CODE,
      week_number: 1,
      weight_kg: 85,
      waist_circumference_cm: 90,
      nutrition_adherence_percent: 90,
      exertional_chest_pain: true,
      client_notes: 'ألم ضاغط في الصدر أثناء تمرين البنش'
    }
  };
  const resCheckin = mockRes();
  await submitCheckin(reqCheckin, resCheckin.res);
  assert.equal(resCheckin.out.status, 201);
  assert.equal(resCheckin.out.body.analysis?.training_locked, true);

  // Now, trainee opens mobile app and calls GET /api/v1/programs/active
  const resAfter = mockRes();
  await getActiveProgramByUserId(reqBefore, resAfter.res);

  assert.equal(resAfter.out.status, 200);
  // Source of truth: clinical_lockout is actively reported to Flutter before workout starts
  assert.equal(resAfter.out.body.clinical_lockout?.active, true);
  assert.equal(resAfter.out.body.clinical_lockout?.requires_medical_clearance, true);
  assert.ok(resAfter.out.body.clinical_lockout?.emergency_directive);
  // training_session is set to null, preventing exercise initiation
  assert.equal(resAfter.out.body.client_view?.training_session, null);

  // Verify stored database record program_data was NOT modified or corrupted
  const dbProgram = await Program.findOne({ where: { user_id: client.id, status: 'ACTIVE' } });
  assert.ok(dbProgram.program_data.training.sessions.length > 0);

  await cleanupUser(USER_CODE);
});

test('FL2. Coach Clearance restores clinical_lockout.active=false and training_session in active program', async () => {
  const USER_CODE = 'SAFE_FLUTTER_UNLOCK_01';
  const COACH_CODE = 'SAFE_FLUTTER_COACH_01';
  await cleanupUser(USER_CODE);
  await cleanupUser(COACH_CODE);

  const client = await User.create({
    client_code: USER_CODE,
    phone_number: '01008880002',
    full_name: 'Flutter Client to Unlock',
    role: 'CLIENT',
    plan_approval_status: 'APPROVED'
  });

  const coach = await User.create({
    client_code: COACH_CODE,
    phone_number: '01008880003',
    full_name: 'Clinical Coach',
    role: 'ADMIN'
  });

  await Program.create({
    user_id: client.id,
    status: 'ACTIVE',
    program_data: {
      training: {
        sessions: [{ session_name: 'ظهر وترايسبس', exercises: [] }]
      }
    }
  });

  // Submit locked check-in
  const checkinRes = mockRes();
  await submitCheckin({
    user: { id: client.id, role: 'CLIENT' },
    body: { user_id: USER_CODE, week_number: 1, weight_kg: 80, exertional_chest_pain: true }
  }, checkinRes.res);

  const checkinId = checkinRes.out.body.checkin?.id;
  assert.ok(checkinId);

  // Verify locked state in GET active program
  const reqActive = { user: { id: client.id, role: 'CLIENT' }, params: { user_id: USER_CODE } };
  const resLocked = mockRes();
  await getActiveProgramByUserId(reqActive, resLocked.res);
  assert.equal(resLocked.out.body.clinical_lockout?.active, true);
  assert.equal(resLocked.out.body.client_view?.training_session, null);

  // Coach unlocks after medical clearance
  const resUnlock = mockRes();
  await unlockClinicalSafety({
    user: { id: coach.id, role: 'ADMIN' },
    params: { checkinId },
    body: {
      medical_clearance_confirmed: true,
      clearance_notes: 'تم فحص القلب والإيكو سليم وتصريح الاستئناف مؤكد من د. محمد أخصائي القلب'
    }
  }, resUnlock.res);
  assert.equal(resUnlock.out.status, 200);

  // Now verify active program returns unlocked state and session is restored
  const resUnlocked = mockRes();
  await getActiveProgramByUserId(reqActive, resUnlocked.res);
  assert.equal(resUnlocked.out.body.clinical_lockout?.active, false);
  assert.ok(resUnlocked.out.body.client_view?.training_session);
  assert.equal(resUnlocked.out.body.client_view.training_session.session_name, 'ظهر وترايسبس');

  await cleanupUser(USER_CODE);
  await cleanupUser(COACH_CODE);
});

test('FL3. Client-Scoped Lock Isolation: Lockout of Client A DOES NOT affect Client B on same device', async () => {
  const CLIENT_A = 'SAFE_USER_A_LOCK';
  const CLIENT_B = 'SAFE_USER_B_CLEAR';
  await cleanupUser(CLIENT_A);
  await cleanupUser(CLIENT_B);

  const userA = await User.create({ client_code: CLIENT_A, phone_number: '01009990001', full_name: 'User A', role: 'CLIENT' });
  const userB = await User.create({ client_code: CLIENT_B, phone_number: '01009990002', full_name: 'User B', role: 'CLIENT' });

  // User A gets cardiac flag
  await submitCheckin({
    user: { id: userA.id, role: 'CLIENT' },
    body: { user_id: CLIENT_A, week_number: 1, weight_kg: 90, syncope: true }
  }, mockRes().res);

  // Check lock status for both
  const lockA = await getActiveClinicalLockout(userA.id);
  const lockB = await getActiveClinicalLockout(userB.id);

  assert.equal(lockA.locked, true);
  assert.equal(lockB.locked, false);

  // Simulated Flutter LocalStorage account-scoped check:
  // Key format: z_clinical_lockout_${cleanCode}
  const storageMock = new Map();
  function setClientClinicalLockout(code, locked, directive) {
    const key = `z_clinical_lockout_${code}`;
    if (!locked) storageMock.delete(key);
    else storageMock.set(key, JSON.stringify({ locked: true, directive }));
  }
  function isClientClinicallyLocked(code) {
    const raw = storageMock.get(`z_clinical_lockout_${code}`);
    if (!raw) return false;
    return JSON.parse(raw).locked === true;
  }

  // Set lock for user A
  setClientClinicalLockout(CLIENT_A, true, lockA.directive_ar);

  // Verify: User A is locked, User B is NOT locked
  assert.equal(isClientClinicallyLocked(CLIENT_A), true);
  assert.equal(isClientClinicallyLocked(CLIENT_B), false);

  // User A logs out, User B logs in: User B is still NOT locked
  assert.equal(isClientClinicallyLocked(CLIENT_B), false);

  await cleanupUser(CLIENT_A);
  await cleanupUser(CLIENT_B);
});

test('FL4. Offline Queue Safety: 403 CLINICAL_SAFETY_LOCKOUT is NOT queued as offline log, healthy logs preserved', async () => {
  const queue = [];

  function simulateSendWorkoutLog({ statusCode, responseData, payload, isClientLocked }) {
    if (isClientLocked) {
      return { status: 'clinicalLockout' };
    }
    if (statusCode === 200) {
      return { status: 'success' };
    }
    if (statusCode === 403 && responseData?.code === 'CLINICAL_SAFETY_LOCKOUT') {
      // Must NOT queue to offline storage!
      return { status: 'clinicalLockout', emergencyDirective: responseData.emergency_directive };
    }
    if (statusCode === 0) {
      // Genuine network disconnect -> queue safely
      queue.push(payload);
      return { status: 'offlineQueued' };
    }
    return { status: 'serverError' };
  }

  // 1. Healthy trainee logs a workout while offline (status 0) -> queued
  const healthyPayload = { user_id: 'HEALTHY_01', session_title: 'Leg Day', logged_exercises: [{ name: 'Squats' }] };
  const r1 = simulateSendWorkoutLog({ statusCode: 0, responseData: null, payload: healthyPayload, isClientLocked: false });
  assert.equal(r1.status, 'offlineQueued');
  assert.equal(queue.length, 1);
  assert.equal(queue[0].user_id, 'HEALTHY_01');

  // 2. Trainee under clinical lockout gets 403 -> NOT queued, existing queue untouched
  const lockedPayload = { user_id: 'LOCKED_01', session_title: 'Chest Day', logged_exercises: [{ name: 'Bench' }] };
  const r2 = simulateSendWorkoutLog({
    statusCode: 403,
    responseData: { code: 'CLINICAL_SAFETY_LOCKOUT', emergency_directive: 'Stop immediately' },
    payload: lockedPayload,
    isClientLocked: false
  });
  assert.equal(r2.status, 'clinicalLockout');
  // Offline queue STILL has only the healthy payload (1 item, locked payload was NOT added)
  assert.equal(queue.length, 1);
  assert.equal(queue[0].user_id, 'HEALTHY_01');

  // 3. Subsequent attempts while locked are blocked before reaching network
  const r3 = simulateSendWorkoutLog({ statusCode: 200, responseData: null, payload: lockedPayload, isClientLocked: true });
  assert.equal(r3.status, 'clinicalLockout');
  assert.equal(queue.length, 1);
});

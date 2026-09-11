import test from 'node:test';
import assert from 'node:assert/strict';

import { submitWeeklyCheckin } from '../src/api/controllers/program.controller.js';
import { submitCheckin } from '../src/api/controllers/checkin.controller.js';
import { User, CheckinSubmission, ProgressPhoto } from '../src/api/models/index.js';

test('Tier 1 Suite: Check-in Identity Validation & Strict 7-Day Weight Integrity', async (t) => {

  const mockUser = {
    id: 105,
    client_code: 'CLIENT_105',
    phone_number: '01099887766',
    full_name: 'كابتن محمود'
  };

  // Helper to build mock Express req/res
  function buildMockReqRes(body = {}) {
    let statusCode = 200;
    let jsonOutput = null;

    const req = { body };
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        jsonOutput = data;
        return this;
      }
    };

    return {
      req,
      res,
      getStatus: () => statusCode,
      getBody: () => jsonOutput
    };
  }

  // Preserve originals
  const origFindOne = User.findOne;
  const origFindByPk = User.findByPk;
  const origCheckinCreate = CheckinSubmission.create;
  const origPhotoCreate = ProgressPhoto.create;

  let createdCheckinRecords = [];

  t.beforeEach(() => {
    createdCheckinRecords = [];
    CheckinSubmission.create = async (data) => {
      const record = { id: 7001 + createdCheckinRecords.length, ...data };
      createdCheckinRecords.push(record);
      return record;
    };
    ProgressPhoto.create = async (data) => ({ id: 8001, ...data });
    User.findOne = async ({ where }) => {
      if (where.client_code === 'CLIENT_105' || where.phone_number === '01099887766') {
        return mockUser;
      }
      return null;
    };
    User.findByPk = async (id) => (Number(id) === 105 ? mockUser : null);
  });

  t.afterEach(() => {
    User.findOne = origFindOne;
    User.findByPk = origFindByPk;
    CheckinSubmission.create = origCheckinCreate;
    ProgressPhoto.create = origPhotoCreate;
  });

  await t.test('1. submitWeeklyCheckin: Rejects request with missing user identity with HTTP 400 and zero DB writes', async () => {
    const { req, res, getStatus, getBody } = buildMockReqRes({
      user_id: '',
      client_code: '',
      daily_weights_kg: [80, 80.2, 80.1, 79.9, 80.0, 79.8, 79.7]
    });

    await submitWeeklyCheckin(req, res);

    assert.equal(getStatus(), 400);
    assert.ok(getBody().error.includes('يجب تقديم كود المشترك أو معرف المستخدم'));
    assert.equal(createdCheckinRecords.length, 0, 'No checkin record must be created in DB');
  });

  await t.test('2. submitWeeklyCheckin: Rejects request with non-existent user identifier with HTTP 400 and zero DB writes', async () => {
    const { req, res, getStatus, getBody } = buildMockReqRes({
      client_code: 'GHOST_USER_9999',
      daily_weights_kg: [80, 80.2, 80.1, 79.9, 80.0, 79.8, 79.7]
    });

    await submitWeeklyCheckin(req, res);

    assert.equal(getStatus(), 400);
    assert.ok(getBody().error.includes('المستخدم غير موجود'));
    assert.equal(createdCheckinRecords.length, 0, 'Zero DB records must be saved for non-existent users');
  });

  await t.test('3. submitWeeklyCheckin: Rejects checkin when daily_weights_kg is missing or not an array', async () => {
    const { req, res, getStatus, getBody } = buildMockReqRes({
      client_code: 'CLIENT_105',
      daily_weights_kg: null
    });

    await submitWeeklyCheckin(req, res);

    assert.equal(getStatus(), 400);
    assert.ok(getBody().error.includes('الأيام السبعة'));
    assert.equal(createdCheckinRecords.length, 0);
  });

  await t.test('4. submitWeeklyCheckin: Rejects checkin when daily_weights_kg has less than 7 days', async () => {
    const { req, res, getStatus, getBody } = buildMockReqRes({
      client_code: 'CLIENT_105',
      daily_weights_kg: [80.5, 80.3, 80.1, 80.0] // Only 4 days!
    });

    await submitWeeklyCheckin(req, res);

    assert.equal(getStatus(), 400);
    assert.ok(getBody().error.includes('الأيام السبعة'));
    assert.equal(createdCheckinRecords.length, 0, 'Must not accept partial checkin with missing days');
  });

  await t.test('5. submitWeeklyCheckin: Rejects checkin when daily_weights_kg contains invalid or unrealistic values (<= 20kg)', async () => {
    const { req, res, getStatus, getBody } = buildMockReqRes({
      client_code: 'CLIENT_105',
      daily_weights_kg: [80, 80, 0, 80, 80, 80, 80] // Zero weight on day 3
    });

    await submitWeeklyCheckin(req, res);

    assert.equal(getStatus(), 400);
    assert.ok(getBody().error.includes('الأيام السبعة'));
    assert.equal(createdCheckinRecords.length, 0);
  });

  await t.test('6. submitWeeklyCheckin: Accepts full 7-day weights and associates checkin strictly to resolved user ID with zero fake weight injection', async () => {
    const fullSevenDaysWeights = [82.5, 82.3, 82.1, 82.0, 81.9, 81.8, 81.6];
    const { req, res, getStatus, getBody } = buildMockReqRes({
      client_code: 'CLIENT_105',
      week_number: 2,
      daily_weights_kg: fullSevenDaysWeights,
      previous_average_weight_kg: 83.2,
      waist_circumference_cm: 86.5,
      nutrition_adherence_percent: 95
    });

    await submitWeeklyCheckin(req, res);

    assert.equal(getStatus(), 201);
    assert.ok(getBody().checkin_id);
    assert.equal(createdCheckinRecords.length, 1);

    const saved = createdCheckinRecords[0];
    assert.equal(saved.user_id, 105, 'Checkin MUST be associated strictly with mockUser.id (105), not fallback to user 1');
    assert.equal(saved.week_number, 2);
    assert.deepEqual(saved.daily_weights_kg, fullSevenDaysWeights);
    // Average calculation check: (82.5 + 82.3 + 82.1 + 82.0 + 81.9 + 81.8 + 81.6) / 7 = 574.2 / 7 = 82.03
    assert.equal(saved.average_weight_kg, 82.03);
    assert.equal(saved.weight_change_kg, -1.17); // 82.03 - 83.2 = -1.17
  });

  await t.test('7. submitCheckin (checkin.controller): Rejects invalid user and invalid weight with HTTP 400', async () => {
    // Missing user
    const noUserReq = buildMockReqRes({ user_id: '', weight_kg: 75 });
    await submitCheckin(noUserReq.req, noUserReq.res);
    assert.equal(noUserReq.getStatus(), 400);

    // Non-existent user
    const ghostUserReq = buildMockReqRes({ user_id: 'GHOST_999', weight_kg: 75 });
    await submitCheckin(ghostUserReq.req, ghostUserReq.res);
    assert.equal(ghostUserReq.getStatus(), 400);

    // Incomplete daily weights (if array sent with < 7 elements)
    const incompleteDaysReq = buildMockReqRes({
      user_id: 'CLIENT_105',
      daily_weights_kg: [75, 75, 75]
    });
    await submitCheckin(incompleteDaysReq.req, incompleteDaysReq.res);
    assert.equal(incompleteDaysReq.getStatus(), 400);
    assert.ok(incompleteDaysReq.getBody().error.includes('الأيام السبعة'));

    // Zero/invalid single weight
    const invalidWeightReq = buildMockReqRes({
      user_id: 'CLIENT_105',
      weight_kg: 10 // Too low <= 20kg
    });
    await submitCheckin(invalidWeightReq.req, invalidWeightReq.res);
    assert.equal(invalidWeightReq.getStatus(), 400);
    assert.ok(invalidWeightReq.getBody().error.includes('وزن حقيقي'));
  });

});

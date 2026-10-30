import test from 'node:test';
import assert from 'node:assert/strict';

import { submitCheckin } from '../src/api/controllers/checkin.controller.js';
import { User, CheckinSubmission, ProgressPhoto, IntakeSubmission } from '../src/api/models/index.js';

/* S3-4/S4-5: subtests 1-6 exercised the retired submitWeeklyCheckin handler and were
   removed with it. The canonical submitCheckin validation case below is retained. */
test('Tier 1 Suite: Check-in Identity Validation (canonical submitCheckin)', async (t) => {

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
  const origIntakeFindOne = IntakeSubmission.findOne;

  let createdCheckinRecords = [];

  t.beforeEach(() => {
    createdCheckinRecords = [];
    CheckinSubmission.create = async (data) => {
      const record = { id: 7001 + createdCheckinRecords.length, ...data };
      createdCheckinRecords.push(record);
      return record;
    };
    ProgressPhoto.create = async (data) => ({ id: 8001, ...data });
    // The check-in reads the client's goal from the latest intake; keep this suite off the real DB.
    IntakeSubmission.findOne = async () => null;
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
    IntakeSubmission.findOne = origIntakeFindOne;
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

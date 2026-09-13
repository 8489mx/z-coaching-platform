import test from 'node:test';
import assert from 'node:assert/strict';

import { submitCheckin } from '../src/api/controllers/checkin.controller.js';
import { User, CheckinSubmission } from '../src/api/models/index.js';
import sequelize from '../src/api/config/database.js';

test('Red Team Item 6: Unique Check-in Submission per Week & 409 Conflict Guard', async (suite) => {

  const mockUser = {
    id: 9991,
    client_code: 'CLIENT_9991',
    phone_number: '01012345678',
    full_name: 'كابتن عمر',
  };

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
      },
    };

    return {
      req,
      res,
      getStatus: () => statusCode,
      getBody: () => jsonOutput,
    };
  }

  // Preserve originals
  const origUserFindOne = User.findOne;
  const origUserFindByPk = User.findByPk;
  const origCheckinFindOne = CheckinSubmission.findOne;
  const origCheckinFindAll = CheckinSubmission.findAll;
  const origCheckinCreate = CheckinSubmission.create;

  let memoryStore = [];

  suite.beforeEach(() => {
    memoryStore = [];

    User.findOne = async ({ where }) => {
      if (where.client_code === 'CLIENT_9991' || where.phone_number === '01012345678') {
        return mockUser;
      }
      return null;
    };

    User.findByPk = async (id) => {
      if (Number(id) === 9991) return mockUser;
      return null;
    };

    CheckinSubmission.findOne = async ({ where }) => {
      return memoryStore.find(
        (c) => Number(c.user_id) === Number(where.user_id) && Number(c.week_number) === Number(where.week_number)
      ) || null;
    };

    CheckinSubmission.findAll = async () => [];

    CheckinSubmission.create = async (data) => {
      // Simulate database unique constraint check
      const existing = memoryStore.find(
        (c) => Number(c.user_id) === Number(data.user_id) && Number(c.week_number) === Number(data.week_number)
      );
      if (existing) {
        const err = new Error('Validation error');
        err.name = 'SequelizeUniqueConstraintError';
        throw err;
      }
      const record = { id: 8000 + memoryStore.length + 1, ...data };
      memoryStore.push(record);
      return record;
    };
  });

  suite.afterEach(() => {
    User.findOne = origUserFindOne;
    User.findByPk = origUserFindByPk;
    CheckinSubmission.findOne = origCheckinFindOne;
    CheckinSubmission.findAll = origCheckinFindAll;
    CheckinSubmission.create = origCheckinCreate;
  });

  await suite.test('1. First check-in submission for week 1 succeeds (HTTP 201)', async () => {
    const { req, res, getStatus, getBody } = buildMockReqRes({
      user_id: 9991,
      week_number: 1,
      weight_kg: 82.5,
      nutrition_adherence_percent: 95,
      workouts_completed: 4,
      workouts_scheduled: 4,
      biofeedback: { hunger_level: 2, energy_level: 4, sleep_quality: 4, sleep_hours: 7 },
    });

    await submitCheckin(req, res);

    assert.equal(getStatus(), 201, 'First submission must succeed with HTTP 201');
    assert.equal(getBody().success, true);
    assert.equal(memoryStore.length, 1);
    assert.equal(memoryStore[0].week_number, 1);
  });

  await suite.test('2. Consecutive second check-in for the exact same week is rejected with HTTP 409 Conflict', async () => {
    // First submission
    const call1 = buildMockReqRes({
      user_id: 9991,
      week_number: 1,
      weight_kg: 82.5,
      nutrition_adherence_percent: 95,
      workouts_completed: 4,
    });
    await submitCheckin(call1.req, call1.res);
    assert.equal(call1.getStatus(), 201);

    // Immediate second submission for the same week
    const call2 = buildMockReqRes({
      user_id: 9991,
      week_number: 1,
      weight_kg: 82.3,
      nutrition_adherence_percent: 90,
      workouts_completed: 4,
    });
    await submitCheckin(call2.req, call2.res);

    assert.equal(call2.getStatus(), 409, 'Duplicate submission must be rejected with HTTP 409 Conflict');
    assert.equal(call2.getBody().success, false);
    assert.equal(call2.getBody().code, 'DUPLICATE_CHECKIN_SUBMISSION');
    assert.ok(call2.getBody().error.includes('مسبقاً'));

    // Zero duplicate rows in memory store
    assert.equal(memoryStore.length, 1, 'Memory store must retain exactly 1 record, zero duplicates created');
  });

  await suite.test('3. Subsequent check-in for next week (week 2) succeeds without conflict', async () => {
    // First submission (Week 1)
    const call1 = buildMockReqRes({
      user_id: 9991,
      week_number: 1,
      weight_kg: 82.5,
    });
    await submitCheckin(call1.req, call1.res);
    assert.equal(call1.getStatus(), 201);

    // Second submission for Week 2
    const call2 = buildMockReqRes({
      user_id: 9991,
      week_number: 2,
      weight_kg: 82.0,
    });
    await submitCheckin(call2.req, call2.res);

    assert.equal(call2.getStatus(), 201, 'Week 2 submission must succeed with HTTP 201');
    assert.equal(call2.getBody().success, true);
    assert.equal(memoryStore.length, 2);
  });

  await suite.test('4. Database unique constraint violation (race condition) is safely caught as HTTP 409', async () => {
    // Simulate race condition where findOne check passed concurrently
    CheckinSubmission.findOne = async () => null;

    // Simulate database engine throwing unique constraint violation on write
    CheckinSubmission.create = async () => {
      const err = new Error('Validation error');
      err.name = 'SequelizeUniqueConstraintError';
      throw err;
    };

    const { req, res, getStatus, getBody } = buildMockReqRes({
      user_id: 9991,
      week_number: 1,
      weight_kg: 82.5,
    });

    await submitCheckin(req, res);

    assert.equal(getStatus(), 409, 'Database constraint violation must be translated to HTTP 409');
    assert.equal(getBody().code, 'DUPLICATE_CHECKIN_SUBMISSION');
  });

  await suite.test('5. Real Database Unique Constraint Check (Schema verification)', async () => {
    try {
      await sequelize.authenticate();
      const [indexes] = await sequelize.query('SHOW INDEXES FROM checkin_submissions');
      const uniqueIdx = indexes.find((i) => i.Key_name === 'unique_user_week_checkin');
      assert.ok(uniqueIdx, 'unique_user_week_checkin must exist in MySQL checkin_submissions table');
      assert.equal(uniqueIdx.Non_unique, 0, 'Index must be strictly UNIQUE (Non_unique = 0)');
    } catch (e) {
      if (e.message.includes('ECONNREFUSED')) {
        // Skip DB connection if offline
        return;
      }
      throw e;
    }
  });

  suite.after(async () => {
    await sequelize.close().catch(() => {});
  });

});

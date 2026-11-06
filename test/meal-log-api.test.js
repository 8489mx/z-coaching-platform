import test from "node:test";
import assert from "node:assert/strict";

import { logMeal } from "../src/api/controllers/checkin.controller.js";
import { User, MealLog } from "../src/api/models/index.js";
import sequelize from "../src/api/config/database.js";

// B2-SYNC: POST /meal-logs is the server end of the client offline queue.
// Contract mirrors POST /workout-logs (logWorkout): auth, user resolution by
// client code / id / phone, ownership (own account, or COACH/ADMIN), and
// idempotency by actionId — a replayed flush never stores a second row.

const CODE = "TEST_MEAL_LOG_920";
const OTHER = "TEST_MEAL_LOG_921";
const COACH = "TEST_MEAL_LOG_COACH_920";

function mockRes() {
  const out = { status: 200, body: null };
  const res = { status(c) { out.status = c; return res; }, json(b) { out.body = b; return res; } };
  return { res, out };
}

async function cleanup(code) {
  const u = await User.findOne({ where: { client_code: code } });
  if (!u) return;
  await MealLog.destroy({ where: { user_id: u.id } }).catch(() => {});
  await u.destroy().catch(() => {});
}

test("meal-log endpoint: create, idempotent replay, ownership, validation", async (t) => {
  // The meal_logs table is new in this package; CI creates it via
  // sequelize.sync() from models/index.js — create-if-missing here so the
  // test also runs against a pre-existing local z_ci.
  await MealLog.sync();
  await cleanup(CODE); await cleanup(OTHER); await cleanup(COACH);
  const client = await User.create({ client_code: CODE, phone_number: "01099000920", full_name: "Meal", role: "CLIENT", plan_approval_status: "APPROVED" });
  const other = await User.create({ client_code: OTHER, phone_number: "01099000921", full_name: "Other", role: "CLIENT" });
  const coach = await User.create({ client_code: COACH, phone_number: "01099000922", full_name: "Coach", role: "COACH" });
  const post = async (body, userId) => {
    const r = mockRes();
    await logMeal({ body, user: { id: userId } }, r.res);
    return r.out;
  };
  const mealBody = (actionId, overrides = {}) => ({
    user_id: CODE,
    action_id: actionId,
    day_number: 2,
    week_number: 1,
    meal_id: "m1",
    meal_title: "Breakfast",
    completed: true,
    ...overrides,
  });

  try {
    await t.test("client logs a meal completion; the row exists server-side", async () => {
      const out = await post(mealBody("act_meal_1"), client.id);
      assert.equal(out.status, 201, JSON.stringify(out.body));
      assert.equal(out.body.success, true);
      assert.equal(out.body.log.meal_id, "m1");
      assert.equal(out.body.log.completed, true);
      assert.equal(await MealLog.count({ where: { user_id: client.id } }), 1);
    });

    await t.test("replaying the same action_id returns the same row, no duplicate", async () => {
      const out = await post(mealBody("act_meal_1"), client.id);
      assert.equal(out.status, 200, JSON.stringify(out.body));
      assert.equal(out.body.success, true);
      assert.equal(out.body.duplicate, true);
      assert.equal(out.body.log.id, (await MealLog.findOne({ where: { user_id: client.id, action_id: "act_meal_1" } })).id);
      assert.equal(await MealLog.count({ where: { user_id: client.id } }), 1);
    });

    await t.test("a toggle-off completion is stored as completed false", async () => {
      const out = await post(mealBody("act_meal_2", { completed: false }), client.id);
      assert.equal(out.status, 201, JSON.stringify(out.body));
      assert.equal(out.body.log.completed, false);
      assert.equal(await MealLog.count({ where: { user_id: client.id } }), 2);
    });

    await t.test("another client cannot write meal logs into this account", async () => {
      const out = await post(mealBody("act_meal_3"), other.id);
      assert.equal(out.status, 403);
      assert.equal(await MealLog.count({ where: { user_id: client.id } }), 2);
    });

    await t.test("a coach can write a meal log for a client", async () => {
      const out = await post(mealBody("act_meal_4"), coach.id);
      assert.equal(out.status, 201, JSON.stringify(out.body));
      assert.equal(await MealLog.count({ where: { user_id: client.id } }), 3);
    });

    await t.test("missing user_id, action_id or meal_id is refused", async () => {
      assert.equal((await post({ action_id: "x", meal_id: "m1" }, client.id)).status, 400);
      assert.equal((await post({ user_id: CODE, meal_id: "m1" }, client.id)).status, 400);
      assert.equal((await post({ user_id: CODE, action_id: "x" }, client.id)).status, 400);
    });

    await t.test("unknown user is refused", async () => {
      const out = await post(mealBody("act_meal_5", { user_id: "NO_SUCH_CODE" }), client.id);
      assert.equal(out.status, 404);
    });
  } finally {
    await cleanup(CODE); await cleanup(OTHER); await cleanup(COACH);
    await sequelize.close().catch(() => {});
  }
});

import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

import { requireAuth, requireAdmin } from "../src/api/middlewares/auth.middleware.js";
import {
  loginFast,
  loginEmail,
  deleteAccount,
  restoreClientAccount,
  logout
} from "../src/api/controllers/auth.controller.js";
import { purgeExpiredDeletedAccounts } from "../src/api/services/deletionLifecycle.service.js";
import { User, Order } from "../src/api/models/index.js";
import sequelize from "../src/api/config/database.js";
import { PLAN_APPROVAL_STATUS, resolveTraineeOverallState } from "../frontend/src/utils/subscriptionStateEngine.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function createMockRes() {
  const out = {
    statusCode: 200,
    headers: {},
    body: null,
    cookies: {}
  };
  out.res = {
    status(code) {
      out.statusCode = code;
      return this;
    },
    json(data) {
      out.body = data;
      return data;
    },
    cookie(name, val, opts) {
      out.cookies[name] = { val, opts };
      return this;
    },
    clearCookie(name, opts) {
      delete out.cookies[name];
      out.clearedCookie = { name, opts };
      return this;
    }
  };
  return out;
}

test("Stage 2 - S4-3 & Option B: token_version activation strictly revokes sessions", async (t) => {
  const secret = process.env.JWT_SECRET || "test_jwt_secret_for_stage_2";
  process.env.JWT_SECRET = secret;

  const testUser = await User.create({
    client_code: "TEST_TOKEN_VER_101",
    phone_number: "01099999101",
    full_name: "Token Version Test",
    role: "CLIENT",
    token_version: 3,
    subscription_status: "ACTIVE"
  });

  try {
    // 1. Token without token_version must be rejected
    const tokenNoVer = jwt.sign({ id: testUser.id }, secret);
    const mock1 = createMockRes();
    const req1 = { headers: { authorization: `Bearer ${tokenNoVer}` } };
    let next1Called = false;
    await requireAuth(req1, mock1.res, () => { next1Called = true; });
    assert.equal(next1Called, false, "Token without token_version must NOT pass requireAuth");
    assert.equal(mock1.statusCode, 401);

    // 2. Token with outdated token_version must be rejected
    const tokenOutdated = jwt.sign({ id: testUser.id, token_version: 2 }, secret);
    const mock2 = createMockRes();
    const req2 = { headers: { authorization: `Bearer ${tokenOutdated}` } };
    let next2Called = false;
    await requireAuth(req2, mock2.res, () => { next2Called = true; });
    assert.equal(next2Called, false, "Token with outdated token_version must NOT pass requireAuth");
    assert.equal(mock2.statusCode, 401);

    // 3. Token with matching token_version must succeed
    const tokenValid = jwt.sign({ id: testUser.id, token_version: 3 }, secret);
    const mock3 = createMockRes();
    const req3 = { headers: { authorization: `Bearer ${tokenValid}` } };
    let next3Called = false;
    await requireAuth(req3, mock3.res, () => { next3Called = true; });
    assert.equal(next3Called, true, "Token with matching token_version must pass requireAuth");
    assert.equal(req3.user.id, testUser.id);
  } finally {
    await testUser.destroy().catch(() => {});
  }
});

test("Stage 2 - S4-8: Coach/admin httpOnly cookies authenticate without Bearer header", async () => {
  const secret = process.env.JWT_SECRET || "test_jwt_secret_for_stage_2";
  process.env.JWT_SECRET = secret;
  const rawPass = "CoachSecurePass123";

  const coachUser = await User.create({
    client_code: "TEST_COACH_COOKIE_201",
    phone_number: "01088888201",
    email: "coach.cookie.test@example.com",
    full_name: "Coach Cookie Test",
    role: "ADMIN",
    token_version: 1,
    subscription_status: "ACTIVE",
    password: await bcrypt.hash(rawPass, 10)
  });

  try {
    // 1. loginEmail sets httpOnly cookie for coach/admin
    const loginMock = createMockRes();
    await loginEmail(
      { body: { email: coachUser.email, password: rawPass } },
      loginMock.res
    );
    assert.equal(loginMock.statusCode, 200);
    assert.ok(loginMock.cookies.coach_token, "loginEmail must set coach_token cookie for staff");
    assert.equal(loginMock.cookies.coach_token.opts.httpOnly, true, "coach_token cookie must be httpOnly");

    const coachToken = loginMock.cookies.coach_token.val;

    // 2. requireAuth accepts cookie without Authorization header
    const authMock = createMockRes();
    const reqWithCookie = {
      headers: {
        cookie: `coach_token=${coachToken}`
      }
    };
    let authNextCalled = false;
    await requireAuth(reqWithCookie, authMock.res, () => { authNextCalled = true; });
    assert.equal(authNextCalled, true, "requireAuth must authenticate coach via httpOnly cookie");

    // 3. requireAdmin succeeds for this request
    let adminNextCalled = false;
    await requireAdmin(reqWithCookie, authMock.res, () => { adminNextCalled = true; });
    assert.equal(adminNextCalled, true, "requireAdmin must succeed for authenticated coach");

    // 4. logout clears coach_token cookie
    const logoutMock = createMockRes();
    await logout(reqWithCookie, logoutMock.res);
    assert.equal(logoutMock.statusCode, 200);
    assert.equal(logoutMock.clearedCookie?.name, "coach_token");
  } finally {
    await coachUser.destroy().catch(() => {});
  }
});

test("Stage 2 - Account deletion lifecycle: 90-day grace period, coach restore & PII purge", async () => {
  const testClient = await User.create({
    client_code: "TEST_DELETE_CLIENT_301",
    phone_number: "01077777301",
    email: "delete.client.test@example.com",
    full_name: "Delete Lifecycle Test",
    role: "CLIENT",
    token_version: 1,
    subscription_status: "ACTIVE"
  });

  try {
    // 1. Client requests deletion -> DEACTIVATED, timestamp recorded, token_version bumped
    const delMock = createMockRes();
    await deleteAccount({ user: { id: testClient.id } }, delMock.res);
    assert.equal(delMock.statusCode, 200);

    const reloaded = await User.findByPk(testClient.id);
    assert.equal(reloaded.subscription_status, "DEACTIVATED");
    assert.ok(reloaded.notes.includes("[DELETION_REQUESTED:"), "Notes must record structured deletion request timestamp");
    assert.equal(reloaded.token_version, 2, "Deletion must increment token_version to invalidate all existing tokens");

    // 2. Coach can restore client within 90 days
    const coachReq = {
      adminUser: { id: 999 },
      body: {
        client_code: testClient.client_code,
        confirmation_channel: "REGISTERED_PHONE"
      }
    };
    const restoreMock = createMockRes();
    await restoreClientAccount(coachReq, restoreMock.res);
    assert.equal(restoreMock.statusCode, 200);

    const restored = await User.findByPk(testClient.id);
    assert.equal(restored.subscription_status, "ACTIVE");
    assert.ok(restored.notes.includes("[ACCOUNT_RESTORED_BY_COACH:"), "Notes must record coach restoration event");

    // 3. If account was deleted > 90 days ago, restore is rejected
    const ninetyFiveDaysAgo = new Date(Date.now() - 95 * 24 * 60 * 60 * 1000).toISOString();
    await restored.update({
      subscription_status: "DEACTIVATED",
      notes: `[DELETION_REQUESTED:${ninetyFiveDaysAgo}]`
    });

    const expiredRestoreMock = createMockRes();
    await restoreClientAccount(coachReq, expiredRestoreMock.res);
    assert.equal(expiredRestoreMock.statusCode, 400, "Restoration after 90 days must be rejected");
    assert.ok(expiredRestoreMock.body.error.includes("90"));

    // 4. Purge expired accounts: wipes PII while preserving financial orders
    const orderId = "ORD_STAGE2_" + Date.now();
    await Order.create({
      id: orderId,
      client_id: testClient.id,
      customer_name: testClient.full_name || "Client",
      phone_number: testClient.phone_number,
      package_tier: "ELITE",
      duration_months: 4,
      amount_paid: 2500,
      currency: "EGP",
      payment_method: "INSTAPAY",
      payment_status: "COMPLETED",
      transaction_reference: "REF_STAGE2_TEST_01"
    }).catch((err) => { console.error("Order.create error:", err); });

    const purgeStats = await purgeExpiredDeletedAccounts(90);
    assert.ok(purgeStats.purged_count >= 1, "Must purge at least the 95-day-old deleted account");

    const purgedUser = await User.findByPk(testClient.id);
    assert.equal(purgedUser.subscription_status, "PERMANENTLY_PURGED");
    assert.equal(purgedUser.full_name, "مشترك مؤرشف");

    // Financial orders must remain intact
    const orders = await Order.findAll({ where: { client_id: testClient.id } });
    assert.equal(orders.length, 1, "Financial ledger order must be preserved");
    await Order.destroy({ where: { client_id: testClient.id } }).catch(() => {});
  } finally {
    await testClient.destroy().catch(() => {});
  }
});

test("Stage 2 - S4-3: Client plan approval gating (workouts appear only after coach approval)", () => {
  // Before approval: pending coach review -> cannot access active program
  const pendingState = resolveTraineeOverallState({
    subscription_status: "ACTIVE",
    subscription_start_date: new Date(),
    subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    plan_approval_status: PLAN_APPROVAL_STATUS.PENDING_COACH_REVIEW
  });
  assert.equal(pendingState.can_access_active_program, false, "Pending coach review must block program access");

  // Draft state -> cannot access active program
  const draftState = resolveTraineeOverallState({
    subscription_status: "ACTIVE",
    subscription_start_date: new Date(),
    subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    plan_approval_status: PLAN_APPROVAL_STATUS.DRAFT
  });
  assert.equal(draftState.can_access_active_program, false, "Draft state must block program access");

  // Approved & Published state -> access granted
  const publishedState = resolveTraineeOverallState({
    subscription_status: "ACTIVE",
    subscription_start_date: new Date(),
    subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    plan_approval_status: PLAN_APPROVAL_STATUS.PUBLISHED
  });
  assert.equal(publishedState.can_access_active_program, true, "Published plan must grant access");
});

test.after(async () => {
  await sequelize.close().catch(() => {});
});

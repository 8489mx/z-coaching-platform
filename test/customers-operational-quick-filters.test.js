import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getClients } from "../src/api/controllers/client.controller.js";
import { User, Program, CheckinSubmission } from "../src/api/models/index.js";
import sequelize from "../src/api/config/database.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CODE_NEW = "TEST_OP_FILTER_NEW";
const CODE_CHK = "TEST_OP_FILTER_CHK";

test.after(async () => {
  await sequelize.close().catch(() => {});
});

test("Operational Quick Filters: getClients exposes needs_first_plan and has_pending_checkin and Customers.jsx renders 1-click quick filters", async () => {
  for (const code of [CODE_NEW, CODE_CHK]) {
    const u = await User.findOne({ where: { client_code: code } });
    if (u) {
      await CheckinSubmission.destroy({ where: { user_id: u.id } });
      await Program.destroy({ where: { user_id: u.id } });
      await u.destroy();
    }
  }

  const clientNeedsPlan = await User.create({
    client_code: CODE_NEW,
    phone_number: "01077665511",
    full_name: "New Trainee No Plan",
    role: "CLIENT",
    plan_approval_status: "PENDING_COACH_REVIEW",
    subscription_status: "ACTIVE"
  });

  const clientPendingCheckin = await User.create({
    client_code: CODE_CHK,
    phone_number: "01077665522",
    full_name: "Active Trainee Pending Checkin",
    role: "CLIENT",
    plan_approval_status: "APPROVED",
    subscription_status: "ACTIVE"
  });

  try {
    await Program.create({
      user_id: clientPendingCheckin.id,
      status: "ACTIVE",
      program_data: { nutrition_program: { targets: { calories_kcal: 2100 } } }
    });

    await CheckinSubmission.create({
      user_id: clientPendingCheckin.id,
      week_number: 2,
      daily_weights_kg: [80],
      average_weight_kg: 80,
      nutrition_adherence_percent: 90,
      workouts_completed: 4,
      workouts_scheduled: 4,
      biofeedback: {},
      analysis_output: {},
      status: "PENDING_REVIEW"
    });

    const out = {};
    await getClients(
      {},
      { status(c) { out.status = c; return this; }, json(b) { out.body = b; return this; } }
    );

    assert.equal(out.status, 200);
    const foundNew = out.body.clients.find((c) => c.client_code === CODE_NEW);
    const foundChk = out.body.clients.find((c) => c.client_code === CODE_CHK);

    assert.ok(foundNew, "Expected new client in getClients response");
    assert.equal(foundNew.needs_first_plan, true);
    assert.equal(foundNew.has_pending_checkin, false);

    assert.ok(foundChk, "Expected pending-checkin client in getClients response");
    assert.equal(foundChk.needs_first_plan, false);
    assert.equal(foundChk.has_pending_checkin, true);
    assert.equal(foundChk.pending_checkins_count, 1);

    const customersSource = fs.readFileSync(path.join(ROOT, "frontend/src/pages/Customers.jsx"), "utf8");
    assert.ok(customersSource.includes("ينتظر خطة أولى"), "Customers.jsx must include quick filter for needs_first_plan");
    assert.ok(customersSource.includes("ينتظر مراجعة متابعة"), "Customers.jsx must include quick filter for has_pending_checkin");
  } finally {
    await CheckinSubmission.destroy({ where: { user_id: clientPendingCheckin.id } }).catch(() => {});
    await Program.destroy({ where: { user_id: clientPendingCheckin.id } }).catch(() => {});
    await clientNeedsPlan.destroy().catch(() => {});
    await clientPendingCheckin.destroy().catch(() => {});
  }
});

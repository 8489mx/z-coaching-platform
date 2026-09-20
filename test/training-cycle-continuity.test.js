import test from "node:test";
import assert from "node:assert/strict";

import { resolveTrainingCycleStatus, CYCLE_STATUS } from "../src/api/services/trainingCycleService.js";
import { getActiveProgramByUserId, getCyclesNeedingAttention } from "../src/api/controllers/program.controller.js";
import { User, Program, IntakeSubmission } from "../src/api/models/index.js";
import sequelize from "../src/api/config/database.js";

/**
 * A client pays for months; the plan they train on covers weeks. Nothing used to notice when those
 * weeks ran out, so the client kept opening a finished plan and the coach never heard about it.
 */
const CODE = "TEST_CYCLE_922";
const COACH = "TEST_CYCLE_COACH_922";
const DAY = 24 * 60 * 60 * 1000;

function mockRes() {
  const out = { status: 200, body: null };
  const res = { status(c) { out.status = c; return res; }, json(b) { out.body = b; return res; } };
  return { res, out };
}

const planOf = (weeks, startedAt) => ({
  cycle_number: 2,
  cycle_started_at: startedAt,
  nutrition: { targets: { calories: 2200, protein: 170, carbs: 220, fats: 65 }, meals: [] },
  training_program: { weeks: Array.from({ length: weeks }, (_, i) => ({ week_number: i + 1, sessions: [{ session_name: "A", exercises: [{ exercise_code: "X", sets: 3, reps: "10" }] }] })) },
});

test("the cycle reports the week the client is in and the day it ends", () => {
  const started = new Date("2026-09-01T06:00:00Z");
  const program = { createdAt: started, program_data: planOf(5, started.toISOString()) };

  const week1 = resolveTrainingCycleStatus(program, new Date("2026-09-03T06:00:00Z"));
  assert.equal(week1.current_week, 1);
  assert.equal(week1.total_weeks, 5);
  assert.equal(week1.cycle_number, 2);
  assert.equal(week1.ends_on, "2026-10-06");
  assert.equal(week1.status, CYCLE_STATUS.ACTIVE);
  assert.equal(week1.needs_new_cycle, false);

  const week3 = resolveTrainingCycleStatus(program, new Date("2026-09-18T06:00:00Z"));
  assert.equal(week3.current_week, 3);
  assert.equal(week3.status, CYCLE_STATUS.ACTIVE);
});

test("a week before the end the coach is told, and after the end it is stated plainly", () => {
  const started = new Date("2026-09-01T06:00:00Z");
  const program = { createdAt: started, program_data: planOf(5, started.toISOString()) };

  const soon = resolveTrainingCycleStatus(program, new Date("2026-10-02T06:00:00Z"));
  assert.equal(soon.status, CYCLE_STATUS.ENDING_SOON);
  assert.equal(soon.needs_new_cycle, true);
  assert.match(soon.message_ar, /تنتهي خلال/);

  const ended = resolveTrainingCycleStatus(program, new Date("2026-10-20T06:00:00Z"));
  assert.equal(ended.status, CYCLE_STATUS.ENDED);
  assert.equal(ended.weeks_remaining, 0);
  assert.match(ended.message_ar, /خطة منتهية/);
});

test("a plan with a different number of weeks is respected, and a plan with none falls back to five", () => {
  const started = new Date("2026-09-01T06:00:00Z");
  assert.equal(resolveTrainingCycleStatus({ createdAt: started, program_data: planOf(8, started.toISOString()) }, started).total_weeks, 8);
  assert.equal(resolveTrainingCycleStatus({ createdAt: started, program_data: { nutrition: {} } }, started).total_weeks, 5);
  // Without a recorded start date the day the plan was created is used.
  assert.equal(resolveTrainingCycleStatus({ createdAt: started, program_data: {} }, started).started_on, "2026-09-01");
});

test("the active program response carries the cycle, and the coach list names the clients who need one", async (t) => {
  for (const code of [CODE, COACH]) {
    const existing = await User.findOne({ where: { client_code: code } });
    if (existing) {
      await Program.destroy({ where: { user_id: existing.id } });
      await existing.destroy();
    }
  }
  const client = await User.create({ client_code: CODE, phone_number: "01099000922", full_name: "Cycle", role: "CLIENT" });
  const coach = await User.create({ client_code: COACH, phone_number: "01099000923", full_name: "Coach", role: "ADMIN" });
  const startedLongAgo = new Date(Date.now() - 60 * DAY);
  await Program.create({ user_id: client.id, status: "ACTIVE", program_data: planOf(5, startedLongAgo.toISOString()) });

  const originalIntake = IntakeSubmission.findOne;
  IntakeSubmission.findOne = async () => ({ answers: { answers: { religion: "OTHER" } } });
  try {
    await t.test("the client's own program says where the cycle stands", async () => {
      const r = mockRes();
      await getActiveProgramByUserId({ user: { id: client.id }, params: { user_id: CODE } }, r.res);
      assert.equal(r.out.status, 200, JSON.stringify(r.out.body));
      assert.equal(r.out.body.training_cycle.status, CYCLE_STATUS.ENDED);
      assert.equal(r.out.body.training_cycle.needs_new_cycle, true);
    });

    await t.test("the coach list includes that client", async () => {
      const r = mockRes();
      await getCyclesNeedingAttention({ user: { id: coach.id } }, r.res);
      assert.equal(r.out.status, 200, JSON.stringify(r.out.body));
      const listed = r.out.body.clients.find((c) => c.client_code === CODE);
      assert.ok(listed, "a client on a finished plan must appear in the coach's list");
      assert.equal(listed.status, CYCLE_STATUS.ENDED);
      assert.ok(r.out.body.ended_count >= 1);
    });

    await t.test("a client may not read that list", async () => {
      const r = mockRes();
      await getCyclesNeedingAttention({ user: { id: client.id } }, r.res);
      assert.equal(r.out.status, 403);
    });
  } finally {
    IntakeSubmission.findOne = originalIntake;
    await Program.destroy({ where: { user_id: client.id } }).catch(() => {});
    await client.destroy().catch(() => {});
    await coach.destroy().catch(() => {});
    await sequelize.close().catch(() => {});
  }
});

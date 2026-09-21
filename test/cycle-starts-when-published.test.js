import test from "node:test";
import assert from "node:assert/strict";

import { updateCustomProgram } from "../src/api/controllers/program.controller.js";
import { resolveTrainingCycleStatus } from "../src/api/services/trainingCycleService.js";
import { User, Program } from "../src/api/models/index.js";
import sequelize from "../src/api/config/database.js";

/**
 * A draft waits for the coach (medical review, a pain flag). Its cycle used to count from the day
 * it was prepared, so a draft published five days later started the client in "week 1, day 6" and
 * the cycle ended five days early. The cycle now starts the day the client receives it.
 */
const DAY = 24 * 60 * 60 * 1000;
const CODE = "TEST_CYCLE_PUBLISH_951";
const COACH = "TEST_CYCLE_PUBLISH_COACH_951";
const weeks = [1, 2, 3, 4, 5].map((n) => ({ week_number: n, sessions: [{ exercises: [{ exercise_code: "GOBLET_SQUAT", sets: 3 }] }] }));

test.after(async () => {
  await sequelize.close().catch(() => {});
});

async function fresh(code, phone, role) {
  const existing = await User.findOne({ where: { client_code: code } });
  if (existing) {
    await Program.destroy({ where: { user_id: existing.id } });
    await existing.destroy();
  }
  return User.create({ client_code: code, phone_number: phone, full_name: code, role });
}

test("a draft published days after it was prepared starts its cycle on the day it is published", async () => {
  const client = await fresh(CODE, "01099000951", "CLIENT");
  const coach = await fresh(COACH, "01099000952", "ADMIN");
  try {
    const prepared = new Date(Date.now() - 5 * DAY).toISOString();
    const draft = await Program.create({ user_id: client.id, status: "DRAFT", program_data: { cycle_number: 2, cycle_started_at: prepared, training_program: { weeks } } });
    assert.equal(resolveTrainingCycleStatus(draft).days_remaining, 30, "precondition: five days already counted");

    const out = {};
    await updateCustomProgram({ user: { id: coach.id }, body: { client_code: CODE, program_data: draft.program_data, publish: true } },
      { status(c) { out.status = c; return this; }, json(b) { out.body = b; return this; } });
    assert.equal(out.status, 200, JSON.stringify(out.body));

    await draft.reload();
    const cycle = resolveTrainingCycleStatus(draft);
    assert.equal(draft.status, "ACTIVE");
    assert.equal(cycle.current_week, 1);
    assert.equal(cycle.days_remaining, 35, "the client gets the whole cycle");

    // Editing and re-publishing a live plan keeps its dates.
    const started = draft.program_data.cycle_started_at;
    const again = {};
    await updateCustomProgram({ user: { id: coach.id }, body: { client_code: CODE, program_data: { ...draft.program_data, cycle_started_at: started }, publish: true } },
      { status(c) { again.status = c; return this; }, json(b) { again.body = b; return this; } });
    await draft.reload();
    assert.equal(draft.program_data.cycle_started_at, started);
  } finally {
    await Program.destroy({ where: { user_id: client.id } }).catch(() => {});
    await client.destroy().catch(() => {});
    await coach.destroy().catch(() => {});
  }
});

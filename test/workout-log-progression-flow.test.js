import test from "node:test";
import assert from "node:assert/strict";

import { logWorkout } from "../src/api/controllers/checkin.controller.js";
import { getActiveProgramByUserId } from "../src/api/controllers/program.controller.js";
import { User, WorkoutLog, Program } from "../src/api/models/index.js";
import sequelize from "../src/api/config/database.js";

const CODE = "TEST_PROG_910";
const OTHER = "TEST_PROG_911";

function mockRes() {
  const out = { status: 200, body: null };
  const res = { status(c) { out.status = c; return res; }, json(b) { out.body = b; return res; } };
  return { res, out };
}

async function cleanup(code) {
  const u = await User.findOne({ where: { client_code: code } });
  if (!u) return;
  await WorkoutLog.destroy({ where: { user_id: u.id } }).catch(() => {});
  await Program.destroy({ where: { user_id: u.id } }).catch(() => {});
  await u.destroy().catch(() => {});
}

const bench = (w, r, effort = "OK") => ({ exercise_code: "BARBELL_BENCH_PRESS", name: "بنش", weight_kg: w, last_set_reps: r, effort, rep_min: 8, rep_max: 10, sets: 3 });

test("client logs one summary per exercise; the API returns the updated progression", async (t) => {
  await cleanup(CODE); await cleanup(OTHER);
  const client = await User.create({ client_code: CODE, phone_number: "01099000910", full_name: "Prog", role: "CLIENT" });
  const other = await User.create({ client_code: OTHER, phone_number: "01099000911", full_name: "Other", role: "CLIENT" });
  await Program.create({ user_id: client.id, status: "ACTIVE", program_data: { training: { weeks: [] } } });
  const post = async (body, userId) => {
    const r = mockRes();
    await logWorkout({ body, user: { id: userId } }, r.res);
    return r.out;
  };

  try {
    await t.test("another client cannot write logs into this account", async () => {
      const out = await post({ user_id: CODE, week_number: 1, logged_exercises: [bench(60, 10)] }, other.id);
      assert.equal(out.status, 403);
      assert.equal(await WorkoutLog.count({ where: { user_id: client.id } }), 0);
    });

    await t.test("invalid rows are dropped and an empty log is refused", async () => {
      const out = await post({ user_id: CODE, week_number: 1, logged_exercises: [{ exercise_code: "X", weight_kg: "abc", last_set_reps: 5 }] }, client.id);
      assert.equal(out.status, 400);
    });

    await t.test("top of range at OK effort -> next target +2.5 kg", async () => {
      const out = await post({ user_id: CODE, week_number: 1, logged_exercises: [bench(60, 10)] }, client.id);
      assert.equal(out.status, 201, JSON.stringify(out.body));
      assert.equal(out.body.log.logged_exercises.length, 1);
      assert.equal(out.body.progression.exercises.BARBELL_BENCH_PRESS.target.weight_kg, 62.5);
    });

    await t.test("the active program carries the progression for the client app", async () => {
      const r = mockRes();
      await getActiveProgramByUserId({ params: { user_id: CODE }, user: { id: client.id } }, r.res);
      assert.equal(r.out.status, 200);
      assert.equal(r.out.body.progression.exercises.BARBELL_BENCH_PRESS.target.weight_kg, 62.5);
      assert.equal(r.out.body.progression.deload.status, "NONE");
    });
  } finally {
    await cleanup(CODE); await cleanup(OTHER);
    await sequelize.close().catch(() => {});
  }
});

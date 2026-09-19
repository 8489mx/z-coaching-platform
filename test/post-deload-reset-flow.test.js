import test from "node:test";
import assert from "node:assert/strict";

import { getActiveProgramByUserId } from "../src/api/controllers/program.controller.js";
import { User, WorkoutLog, CheckinSubmission, Program } from "../src/api/models/index.js";
import sequelize from "../src/api/config/database.js";

const CODE = "TEST_RESET_914";
const DAY = 86400000;

function mockRes() {
  const out = { status: 200, body: null };
  const res = { status(c) { out.status = c; return res; }, json(b) { out.body = b; return res; } };
  return { res, out };
}

async function cleanup() {
  const u = await User.findOne({ where: { client_code: CODE } });
  if (!u) return;
  await WorkoutLog.destroy({ where: { user_id: u.id } }).catch(() => {});
  await CheckinSubmission.destroy({ where: { user_id: u.id } }).catch(() => {});
  await Program.destroy({ where: { user_id: u.id } }).catch(() => {});
  await u.destroy().catch(() => {});
}

async function logAt(userId, daysAgo, week, exercises) {
  const row = await WorkoutLog.create({ user_id: userId, week_number: week, day_number: 1, logged_exercises: exercises });
  const at = new Date(Date.now() - daysAgo * DAY);
  await sequelize.query("UPDATE workout_logs SET createdAt = ? WHERE id = ?", { replacements: [at, row.id] });
}

const ex = (code, w, r) => ({ exercise_code: code, weight_kg: w, last_set_reps: r, effort: "OK", rep_min: 8, rep_max: 10 });

test("after an approved deload window ends, the next targets are the post-deload reset", async () => {
  await cleanup();
  const user = await User.create({ client_code: CODE, phone_number: "01099000914", full_name: "Reset", role: "CLIENT" });
  try {
    await Program.create({ user_id: user.id, status: "ACTIVE", program_data: { training: { weeks: [] } } });
    // Bench progressing; overhead press stalled twice at 60 kg before the deload.
    await logAt(user.id, 20, 3, [ex("BARBELL_BENCH_PRESS", 70, 9), ex("BARBELL_OVERHEAD_PRESS", 60, 6)]);
    await logAt(user.id, 16, 4, [ex("BARBELL_BENCH_PRESS", 70, 10), ex("BARBELL_OVERHEAD_PRESS", 60, 6)]);
    // Coach-approved deload from 12 to 5 days ago, one light session inside it.
    await CheckinSubmission.create({
      user_id: user.id, week_number: 4, daily_weights_kg: [80], average_weight_kg: 80, nutrition_adherence_percent: 90, status: "APPROVED", biofeedback: {}, pain_reports: [],
      analysis_output: { deload_decision: { approved: true, reason: "PERFORMANCE_FATIGUE", affected_exercises: ["BARBELL_OVERHEAD_PRESS"], starts_at: new Date(Date.now() - 12 * DAY).toISOString(), ends_at: new Date(Date.now() - 5 * DAY).toISOString() } },
    });
    await logAt(user.id, 9, 2, [ex("BARBELL_BENCH_PRESS", 60, 10), ex("BARBELL_OVERHEAD_PRESS", 50, 10)]);

    const r = mockRes();
    await getActiveProgramByUserId({ params: { user_id: CODE }, user: { id: user.id } }, r.res);
    assert.equal(r.out.status, 200, JSON.stringify(r.out.body));
    const p = r.out.body.progression;
    assert.equal(p.deload.status, "NONE");
    assert.equal(p.new_cycle_ready, true);
    assert.equal(p.exercises.BARBELL_BENCH_PRESS.target.decision, "POST_DELOAD_RESET");
    assert.equal(p.exercises.BARBELL_BENCH_PRESS.target.weight_kg, 70, "progressing lift returns to its last success");
    assert.equal(p.exercises.BARBELL_OVERHEAD_PRESS.target.weight_kg, 52.5, "stalled lift restarts 10% under the stall weight (60 x 0.9 = 54 -> 52.5)");
  } finally {
    await cleanup();
    await sequelize.close().catch(() => {});
  }
});

import test from "node:test";
import assert from "node:assert/strict";

import { logWorkout, submitCheckin, decideDeload } from "../src/api/controllers/checkin.controller.js";
import { loadProgressionState } from "../src/api/services/progressionService.js";
import { User, WorkoutLog, CheckinSubmission } from "../src/api/models/index.js";
import sequelize from "../src/api/config/database.js";

const CODE = "TEST_DELOAD_912";
const COACH = "TEST_DELOAD_COACH_913";

function mockRes() {
  const out = { status: 200, body: null };
  const res = { status(c) { out.status = c; return res; }, json(b) { out.body = b; return res; } };
  return { res, out };
}

async function cleanup(code) {
  const u = await User.findOne({ where: { client_code: code } });
  if (!u) return;
  await WorkoutLog.destroy({ where: { user_id: u.id } }).catch(() => {});
  await CheckinSubmission.destroy({ where: { user_id: u.id } }).catch(() => {});
  await u.destroy().catch(() => {});
}

const lift = (code, w, r, effort = "OK") => ({ exercise_code: code, weight_kg: w, last_set_reps: r, effort, rep_min: 6, rep_max: 8 });

test("performance drop + low energy -> coach-approved deload -> active deload window", async (t) => {
  await cleanup(CODE); await cleanup(COACH);
  const client = await User.create({ client_code: CODE, phone_number: "01099000912", full_name: "Deload", role: "CLIENT" });
  const coach = await User.create({ client_code: COACH, phone_number: "01099000913", full_name: "Coach", role: "ADMIN" });

  try {
    // Three sessions where squat and bench e1RM fall twice in a row.
    for (const [week, bench, squat] of [[2, [80, 8], [120, 8]], [3, [80, 6], [120, 6]], [3, [80, 4, "HARD"], [120, 4, "HARD"]]]) {
      const r = mockRes();
      await logWorkout({ body: { user_id: CODE, week_number: week, logged_exercises: [lift("BARBELL_BENCH_PRESS", ...bench), lift("BARBELL_BACK_SQUAT", ...squat)] }, user: { id: client.id } }, r.res);
      assert.equal(r.out.status, 201, JSON.stringify(r.out.body));
    }

    let checkinId;
    await t.test("check-in with low energy produces a recommendation, not an automatic deload", async () => {
      const r = mockRes();
      await submitCheckin({ body: { user_id: CODE, week_number: 3, weight_kg: 85, nutrition_adherence_percent: 90, biofeedback_scale: 10, biofeedback: { energyLevel: 3, sleepQuality: 6, hungerLevel: 5 } } }, r.res);
      assert.equal(r.out.status, 201, JSON.stringify(r.out.body));
      const rec = r.out.body.analysis.deload_recommendation;
      assert.equal(rec.recommended, true);
      assert.equal(rec.reason, "PERFORMANCE_FATIGUE");
      assert.deepEqual([...rec.affected_exercises].sort(), ["BARBELL_BACK_SQUAT", "BARBELL_BENCH_PRESS"]);
      checkinId = r.out.body.checkin.id;
      assert.equal((await loadProgressionState(client.id)).deload.status, "NONE");
    });

    await t.test("only a coach can decide", async () => {
      const r = mockRes();
      await decideDeload({ params: { checkinId }, body: { approve: true }, user: { id: client.id } }, r.res);
      assert.equal(r.out.status, 403);
    });

    await t.test("coach approval opens a 7-day deload window", async () => {
      const r = mockRes();
      await decideDeload({ params: { checkinId }, body: { approve: true }, user: { id: coach.id } }, r.res);
      assert.equal(r.out.status, 200, JSON.stringify(r.out.body));
      assert.equal(r.out.body.deload_decision.approved, true);
      const days = (new Date(r.out.body.deload_decision.ends_at) - new Date(r.out.body.deload_decision.starts_at)) / 86400000;
      assert.equal(days, 7);
      assert.equal(r.out.body.progression.deload.status, "ACTIVE");
    });
  } finally {
    await cleanup(CODE); await cleanup(COACH);
    await sequelize.close().catch(() => {});
  }
});

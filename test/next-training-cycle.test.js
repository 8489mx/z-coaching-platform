import test from "node:test";
import assert from "node:assert/strict";

import { buildNextCycle, resolvePainFlaggedExercises } from "../src/api/services/nextCycleService.js";
import { prepareNextCycle } from "../src/api/controllers/program.controller.js";
import { User, Program, CheckinSubmission, WorkoutLog } from "../src/api/models/index.js";
import sequelize from "../src/api/config/database.js";

/**
 * A client on a long subscription finishes a cycle and needs the next one. The plan stays the same
 * plan; what carries over is the weight each lift actually finished at, from the client's own logs.
 */
const CODE = "TEST_NEXT_CYCLE_924";
const COACH = "TEST_NEXT_COACH_924";

function mockRes() {
  const out = { status: 200, body: null };
  const res = { status(c) { out.status = c; return res; }, json(b) { out.body = b; return res; } };
  return { res, out };
}

const PLAN = {
  cycle_number: 1,
  nutrition: { targets: { calories: 2400, protein: 180, carbs: 240, fats: 70 }, meals: [] },
  training_program: {
    weeks: [
      { week_number: 1, sessions: [{ session_name: "Push", exercises: [
        { exercise_code: "BARBELL_BENCH_PRESS", sets: 4, reps: "8-10" },
        { exercise_code: "DUMBBELL_LATERAL_RAISE", sets: 3, reps: "12-15" },
      ] }] },
      { week_number: 2, sessions: [{ session_name: "Push", exercises: [
        { exercise_code: "BARBELL_BENCH_PRESS", sets: 4, reps: "8-10" },
        { exercise_code: "DUMBBELL_LATERAL_RAISE", sets: 3, reps: "12-15" },
      ] }] },
    ],
  },
};

const PROGRESSION = {
  exercises: {
    BARBELL_BENCH_PRESS: { target: { weight_kg: 82.5, rule: "LAST_SUCCESS", decision: "POST_DELOAD_RESET", directive_ar: "ارجع لآخر وزن ناجح 82.5 كجم" } },
    DUMBBELL_LATERAL_RAISE: { target: { weight_kg: 12, rule: "STALL_MINUS_10", decision: "POST_DELOAD_RESET", directive_ar: "ابدأ أخف" } },
  },
  stalled_exercises: ["DUMBBELL_LATERAL_RAISE"],
  dropping_exercises: [],
};

test("the next cycle keeps the same exercises and starts each one at the weight the client reached", () => {
  const { program_data, summary } = buildNextCycle({
    program: { program_data: PLAN },
    progression: PROGRESSION,
    now: new Date("2026-10-06T06:00:00Z"),
  });

  const exercises = program_data.training_program.weeks[0].sessions[0].exercises;
  assert.deepEqual(exercises.map((e) => e.exercise_code), ["BARBELL_BENCH_PRESS", "DUMBBELL_LATERAL_RAISE"], "the plan a client knows stays the plan");
  assert.equal(exercises[0].start_weight_kg, 82.5);
  assert.equal(exercises[0].start_weight_rule, "LAST_SUCCESS");
  assert.match(exercises[0].start_weight_directive_ar, /82.5/);
  assert.equal(exercises[1].start_weight_kg, 12, "a stalled lift restarts lighter, as the engine decided");

  assert.equal(summary.cycle_number, 2);
  assert.deepEqual(summary.exercises_starting_lighter, ["DUMBBELL_LATERAL_RAISE"]);
  assert.equal(program_data.cycle_number, 2);
  assert.equal(program_data.cycle_started_at.slice(0, 10), "2026-10-06");
  assert.equal(program_data.previous_cycle.cycle_number, 1);
  // Nutrition is untouched here: it is re-targeted from the check-ins, not from the training cycle.
  assert.deepEqual(program_data.nutrition.targets, PLAN.nutrition.targets);
});

test("an exercise the client reported pain in is flagged for the coach, never swapped silently", () => {
  const { program_data, summary } = buildNextCycle({
    program: { program_data: PLAN },
    progression: PROGRESSION,
    flagged_exercises: ["BARBELL_BENCH_PRESS"],
  });

  const bench = program_data.training_program.weeks[0].sessions[0].exercises[0];
  assert.equal(bench.exercise_code, "BARBELL_BENCH_PRESS", "the exercise is not replaced by the machine");
  assert.equal(bench.needs_coach_review, true);
  assert.match(bench.coach_review_reason_ar, /ألم/);
  assert.deepEqual(summary.exercises_needing_coach_review, ["BARBELL_BENCH_PRESS"]);
  assert.match(summary.message_ar, /يحتاج مراجعتك/);
});

test("pain-flagged exercises are read from the check-ins the client actually submitted", () => {
  const checkins = [
    { analysis_output: { deload_recommendation: { reason: "JOINT_PAIN", affected_exercises: ["BARBELL_BACK_SQUAT"] } } },
    { analysis_output: JSON.stringify({ deload_recommendation: { reason: "PERFORMANCE_FATIGUE", affected_exercises: ["BARBELL_BENCH_PRESS"] } }) },
    { analysis_output: null },
  ];
  assert.deepEqual(resolvePainFlaggedExercises(checkins), ["BARBELL_BACK_SQUAT"], "only joint pain flags an exercise for review");
});

test("the coach prepares the next cycle from the endpoint, and it is saved as a draft, never published", async (t) => {
  for (const code of [CODE, COACH]) {
    const existing = await User.findOne({ where: { client_code: code } });
    if (existing) {
      await WorkoutLog.destroy({ where: { user_id: existing.id } }).catch(() => {});
      await CheckinSubmission.destroy({ where: { user_id: existing.id } }).catch(() => {});
      await Program.destroy({ where: { user_id: existing.id } });
      await existing.destroy();
    }
  }
  const client = await User.create({ client_code: CODE, phone_number: "01099000924", full_name: "Cycle Two", role: "CLIENT" });
  const coach = await User.create({ client_code: COACH, phone_number: "01099000925", full_name: "Coach", role: "ADMIN" });
  // خطة بدأت من 45 يوماً: دورتها انتهت فعلاً وحان وقت الدورة التالية
  const active = await Program.create({
    user_id: client.id,
    status: "ACTIVE",
    program_data: { ...PLAN, cycle_started_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString() },
  });

  try {
    await t.test("a client may not prepare their own cycle", async () => {
      const r = mockRes();
      await prepareNextCycle({ user: { id: client.id }, body: { client_code: CODE } }, r.res);
      assert.equal(r.out.status, 403);
    });

    await t.test("the coach gets a draft with the summary", async () => {
      const r = mockRes();
      await prepareNextCycle({ user: { id: coach.id }, body: { client_code: CODE } }, r.res);
      assert.equal(r.out.status, 201, JSON.stringify(r.out.body));
      assert.equal(r.out.body.summary.cycle_number, 2);

      const draft = await Program.findByPk(r.out.body.program_id);
      assert.equal(draft.status, "DRAFT", "the new cycle waits for the coach; it is never published by the machine");
      assert.equal(draft.program_data.cycle_number, 2);
      assert.equal(draft.user_id, client.id);
    });

    await t.test("a second request is refused while that draft is still pending", async () => {
      const r = mockRes();
      await prepareNextCycle({ user: { id: coach.id }, body: { client_code: CODE } }, r.res);
      assert.equal(r.out.status, 409);
      assert.equal(r.out.body.code, "DRAFT_ALREADY_PENDING");
    });

    await t.test("an unknown client is refused", async () => {
      const r = mockRes();
      await prepareNextCycle({ user: { id: coach.id }, body: { client_code: "NO_SUCH_CLIENT" } }, r.res);
      assert.equal(r.out.status, 404);
    });
  } finally {
    await Program.destroy({ where: { user_id: client.id } }).catch(() => {});
    await client.destroy().catch(() => {});
    await coach.destroy().catch(() => {});
    await active.destroy().catch(() => {});
  }
});

test("the safety gates decide whether the new cycle reaches the client or waits for the coach", async () => {
  const { evaluateAutoPublish } = await import("../src/api/services/nextCycleService.js");
  const recent = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const clean = { summary: { exercises_needing_coach_review: [] }, last_checkin_at: recent };

  assert.equal(evaluateAutoPublish(clean).allowed, true, "a client in good standing gets their next cycle without waiting");

  const blocked = [
    [{ ...clean, medical_review_required: true }, /مراجعة طبية/],
    [{ ...clean, summary: { exercises_needing_coach_review: ["BARBELL_BENCH_PRESS"] } }, /ألم/],
    [{ ...clean, deload_active: true }, /استشفاء/],
    [{ ...clean, subscription_active: false }, /اشتراك/],
    [{ ...clean, last_checkin_at: null }, /لا توجد متابعة/],
    [{ ...clean, last_checkin_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString() }, /منذ 40/],
  ];
  for (const [input, expected] of blocked) {
    const decision = evaluateAutoPublish(input);
    assert.equal(decision.allowed, false, JSON.stringify(input));
    assert.ok(decision.reasons_ar.some((reason) => expected.test(reason)), `reason missing: ${expected}`);
  }
});

test("a prepared draft never reaches the client's app before the coach publishes it", async () => {
  const { getActiveProgramByUserId } = await import("../src/api/controllers/program.controller.js");
  const code = "TEST_DRAFT_SHADOW_924";
  const existing = await User.findOne({ where: { client_code: code } });
  if (existing) {
    await Program.destroy({ where: { user_id: existing.id } });
    await existing.destroy();
  }
  const client = await User.create({ client_code: code, phone_number: "01099000926", full_name: "Shadow", role: "CLIENT" });
  const active = await Program.create({ user_id: client.id, status: "ACTIVE", program_data: { ...PLAN, cycle_number: 1 } });
  const draft = await Program.create({ user_id: client.id, status: "DRAFT", program_data: { ...PLAN, cycle_number: 2 } });

  try {
    const r = mockRes();
    await getActiveProgramByUserId({ user: { id: client.id }, params: { user_id: code } }, r.res);
    assert.equal(r.out.status, 200, JSON.stringify(r.out.body));
    assert.equal(r.out.body.program_id, active.id, "the client keeps seeing the published plan");
    assert.equal(r.out.body.training_cycle.cycle_number, 1);
    assert.equal(r.out.body.pending_draft_id, draft.id, "the coach is told a prepared cycle is waiting");
  } finally {
    await Program.destroy({ where: { user_id: client.id } }).catch(() => {});
    await client.destroy().catch(() => {});
  }
});

test.after(async () => {
  await sequelize.close().catch(() => {});
});

test("a cycle that is still running is not replaced by an accidental click", async () => {
  const code = "TEST_CYCLE_GUARD_930";
  const coachCode = "TEST_CYCLE_GUARD_COACH_930";
  for (const c of [code, coachCode]) {
    const existing = await User.findOne({ where: { client_code: c } });
    if (existing) {
      await Program.destroy({ where: { user_id: existing.id } });
      await existing.destroy();
    }
  }
  const client = await User.create({ client_code: code, phone_number: "01099000932", full_name: "Running", role: "CLIENT" });
  const coach = await User.create({ client_code: coachCode, phone_number: "01099000933", full_name: "Coach", role: "ADMIN" });
  // A plan that started three days ago: the client is in week one of five.
  await Program.create({
    user_id: client.id,
    status: "ACTIVE",
    program_data: { ...PLAN, cycle_started_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  });

  try {
    const refused = mockRes();
    await prepareNextCycle({ user: { id: coach.id }, body: { client_code: code } }, refused.res);
    assert.equal(refused.out.status, 409);
    assert.equal(refused.out.body.code, "CYCLE_STILL_RUNNING");
    assert.match(refused.out.body.error, /ما زالت جارية/);

    const forced = mockRes();
    await prepareNextCycle({ user: { id: coach.id }, body: { client_code: code, force: true } }, forced.res);
    assert.equal(forced.out.status, 201, "the coach can still decide to start a new cycle now");
  } finally {
    await Program.destroy({ where: { user_id: client.id } }).catch(() => {});
    await client.destroy().catch(() => {});
    await coach.destroy().catch(() => {});
  }
});

test("a cycle in its last (deload) week is left to finish; once it has ended the next one is prepared", async () => {
  const code = "TEST_CYCLE_LASTWEEK_931";
  const coachCode = "TEST_CYCLE_LASTWEEK_COACH_931";
  for (const c of [code, coachCode]) {
    const existing = await User.findOne({ where: { client_code: c } });
    if (existing) {
      await Program.destroy({ where: { user_id: existing.id } });
      await existing.destroy();
    }
  }
  const client = await User.create({ client_code: code, phone_number: "01099000934", full_name: "Last week", role: "CLIENT" });
  const coach = await User.create({ client_code: coachCode, phone_number: "01099000935", full_name: "Coach", role: "ADMIN" });
  const DAY_MS = 24 * 60 * 60 * 1000;
  const FIVE_WEEKS = { ...PLAN, training_program: { weeks: [1, 2, 3, 4, 5].map((n) => ({ ...PLAN.training_program.weeks[0], week_number: n })) } };
  // Thirty days into a five-week plan: the deload week, five days before the end.
  const program = await Program.create({
    user_id: client.id,
    status: "ACTIVE",
    program_data: { ...FIVE_WEEKS, cycle_started_at: new Date(Date.now() - 30 * DAY_MS).toISOString() },
  });

  try {
    const early = mockRes();
    await prepareNextCycle({ user: { id: coach.id }, body: { client_code: code } }, early.res);
    assert.equal(early.out.status, 409, "the deload week would have been skipped");
    assert.equal(early.out.body.code, "CYCLE_STILL_RUNNING");

    program.program_data = { ...FIVE_WEEKS, cycle_started_at: new Date(Date.now() - 36 * DAY_MS).toISOString() };
    program.changed("program_data", true);
    await program.save();
    const due = mockRes();
    await prepareNextCycle({ user: { id: coach.id }, body: { client_code: code } }, due.res);
    assert.equal(due.out.status, 201, JSON.stringify(due.out.body));
  } finally {
    await Program.destroy({ where: { user_id: client.id } }).catch(() => {});
    await client.destroy().catch(() => {});
    await coach.destroy().catch(() => {});
  }
});

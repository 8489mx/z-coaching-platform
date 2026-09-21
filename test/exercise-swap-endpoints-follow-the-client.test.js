import test from "node:test";
import assert from "node:assert/strict";

import { getExerciseSwapsHandler, swapProgramExerciseHandler } from "../src/api/controllers/exercise.controller.js";
import { User, Program, IntakeSubmission } from "../src/api/models/index.js";
import sequelize from "../src/api/config/database.js";

/**
 * The exercise swaps read the client's equipment and injuries from the intake instead of trusting
 * the page (which sent none), and only the program's client or a coach may change a program.
 */
const call = async (fn, req) => { const out = {}; await fn(req, { status(c) { out.status = c; return this; }, json(b) { out.body = b; return this; } }); return out; };
const INTAKE = { answers: { training_environment: "calisthenics_bands", injuries_map: { has_injuries: true, selected_areas: ["knee"] } } };
const CODES = ["TEST_EXSWAP_A_981", "TEST_EXSWAP_B_982", "TEST_EXSWAP_COACH_983"];
let a; let b; let coach; let program; let original;

test.before(async () => {
  for (const code of CODES) {
    const u = await User.findOne({ where: { client_code: code } });
    if (u) { await Program.destroy({ where: { user_id: u.id } }); await u.destroy(); }
  }
  a = await User.create({ client_code: CODES[0], phone_number: "01099000981", full_name: "A", role: "CLIENT" });
  b = await User.create({ client_code: CODES[1], phone_number: "01099000982", full_name: "B", role: "CLIENT" });
  coach = await User.create({ client_code: CODES[2], phone_number: "01099000983", full_name: "Coach", role: "ADMIN" });
  program = await Program.create({ user_id: a.id, status: "ACTIVE", program_data: { training_program: { weeks: [{ week_number: 1, sessions: [{ exercises: [{ exercise_code: "BARBELL_BACK_SQUAT" }] }] }] } } });
  original = IntakeSubmission.findOne;
  IntakeSubmission.findOne = async () => ({ answers: INTAKE });
});
test.after(async () => {
  IntakeSubmission.findOne = original;
  await Program.destroy({ where: { user_id: a.id } }).catch(() => {});
  for (const u of [a, b, coach]) await u?.destroy().catch(() => {});
  await sequelize.close().catch(() => {});
});

test("a bands-only client with a sore knee gets swaps for bands and a spared knee, even when the page asks for the gym", async () => {
  const out = await call(getExerciseSwapsHandler, { user: { id: a.id }, params: { exercise_code: "BARBELL_BACK_SQUAT" }, query: { environment: "GYM", injury: "" } });
  assert.equal(out.status, 200, JSON.stringify(out.body));
  const codes = out.body.swaps.map((s) => String(s.exercise_code));
  assert.ok(codes.length > 0);
  for (const code of codes) {
    assert.doesNotMatch(code, /DUMBBELL|BARBELL|CABLE|MACHINE|KETTLEBELL|GOBLET/, "equipment the client does not own");
    assert.doesNotMatch(code, /SQUAT|LUNGE|LEG_EXT|LEG_PRESS|SPLIT|STEP_UP/, "a knee-loading swap");
  }
});

test("another client cannot change this client's program", async () => {
  const out = await call(swapProgramExerciseHandler, { user: { id: b.id }, params: { programId: program.id }, body: { sessionIndex: 0, exerciseIndex: 0, newExerciseCode: "BODYWEIGHT_GLUTE_BRIDGE" } });
  assert.equal(out.status, 403);
});

test("the client cannot pick an exercise the engine would not offer them", async () => {
  const out = await call(swapProgramExerciseHandler, { user: { id: a.id }, params: { programId: program.id }, body: { sessionIndex: 0, exerciseIndex: 0, newExerciseCode: "BARBELL_BULGARIAN_SPLIT_SQUAT" } });
  assert.equal(out.status, 409);
});

test("the client can pick an offered swap, and the coach can set any exercise", async () => {
  const offered = await call(getExerciseSwapsHandler, { user: { id: a.id }, params: { exercise_code: "BARBELL_BACK_SQUAT" }, query: {} });
  const pick = offered.body.swaps[0].exercise_code;
  const mine = await call(swapProgramExerciseHandler, { user: { id: a.id }, params: { programId: program.id }, body: { sessionIndex: 0, exerciseIndex: 0, newExerciseCode: pick } });
  assert.equal(mine.status, 200, JSON.stringify(mine.body));
  const byCoach = await call(swapProgramExerciseHandler, { user: { id: coach.id }, params: { programId: program.id }, body: { sessionIndex: 0, exerciseIndex: 0, newExerciseCode: "BARBELL_BACK_SQUAT" } });
  assert.equal(byCoach.status, 200);
});

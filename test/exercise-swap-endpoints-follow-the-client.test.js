import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getExerciseSwapsHandler, swapProgramExerciseHandler, gymRushSwapHandler, uploadExerciseImage } from "../src/api/controllers/exercise.controller.js";
import { User, Program, IntakeSubmission, CheckinSubmission } from "../src/api/models/index.js";
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

// ---- B2-EX: medical lock (#3) + image-upload role check (#6 residual), fail-first ----

async function lockClientA() {
  await CheckinSubmission.destroy({ where: { user_id: a.id } }).catch(() => {});
  return CheckinSubmission.create({
    user_id: a.id,
    week_number: 1,
    daily_weights_kg: [80.0],
    average_weight_kg: 80.0,
    nutrition_adherence_percent: 95,
    workouts_completed: 4,
    workouts_scheduled: 4,
    biofeedback: {},
    pain_reports: [],
    analysis_status: "CRITICAL_CARDIAC_FLAG",
    analysis_output: { analysis_status: "CRITICAL_CARDIAC_FLAG", training_locked: true },
    status: "PENDING_REVIEW",
  });
}

async function unlockClientA() {
  await CheckinSubmission.destroy({ where: { user_id: a.id } }).catch(() => {});
}

async function offeredSwapCode() {
  const base = (await currentExerciseCode()) || "BARBELL_BACK_SQUAT";
  const offered = await call(getExerciseSwapsHandler, { user: { id: a.id }, params: { exercise_code: base }, query: {} });
  assert.equal(offered.status, 200, JSON.stringify(offered.body));
  assert.ok(offered.body.swaps.length > 0, "expected at least one offered swap");
  return offered.body.swaps[0].exercise_code;
}

async function currentExerciseCode() {
  const fresh = await Program.findByPk(program.id);
  return fresh.program_data?.training_program?.weeks?.[0]?.sessions?.[0]?.exercises?.[0]?.exercise_code;
}

test("B2-EX #3: a locked client's program cannot be changed by an exercise swap — not by the client, not by the coach", async () => {
  await lockClientA();
  const before = await currentExerciseCode();
  const pick = await offeredSwapCode();
  const byClient = await call(swapProgramExerciseHandler, { user: { id: a.id }, params: { programId: program.id }, body: { sessionIndex: 0, exerciseIndex: 0, newExerciseCode: pick } });
  assert.equal(byClient.status, 403, JSON.stringify(byClient.body));
  assert.equal(byClient.body.code, "CLINICAL_SAFETY_LOCKOUT");
  const byCoach = await call(swapProgramExerciseHandler, { user: { id: coach.id }, params: { programId: program.id }, body: { sessionIndex: 0, exerciseIndex: 0, newExerciseCode: "BARBELL_BACK_SQUAT" } });
  assert.equal(byCoach.status, 403, JSON.stringify(byCoach.body));
  assert.equal(byCoach.body.code, "CLINICAL_SAFETY_LOCKOUT");
  // Both refused swaps leave the stored program untouched.
  assert.equal(await currentExerciseCode(), before);
});

test("B2-EX #3: gym rush swap on a locked program is refused, and passes the gate again after the lock clears", async () => {
  await lockClientA();
  const locked = await call(gymRushSwapHandler, { user: { id: coach.id }, params: { programId: program.id }, body: { weekNumber: 1, sessionIndex: 0, exerciseIndex: 0 } });
  assert.equal(locked.status, 403, JSON.stringify(locked.body));
  assert.equal(locked.body.code, "CLINICAL_SAFETY_LOCKOUT");
  await unlockClientA();
  const unlocked = await call(gymRushSwapHandler, { user: { id: coach.id }, params: { programId: program.id }, body: { weekNumber: 1, sessionIndex: 0, exerciseIndex: 0 } });
  assert.notEqual(unlocked.status, 403, JSON.stringify(unlocked.body));
  assert.notEqual(unlocked.body?.code, "CLINICAL_SAFETY_LOCKOUT");
});

test("B2-EX #3: after the lock clears, the same offered swap succeeds again", async () => {
  await unlockClientA();
  const before = await currentExerciseCode();
  const pick = await offeredSwapCode();
  const mine = await call(swapProgramExerciseHandler, { user: { id: a.id }, params: { programId: program.id }, body: { sessionIndex: 0, exerciseIndex: 0, newExerciseCode: pick } });
  assert.equal(mine.status, 200, JSON.stringify(mine.body));
  assert.equal(await currentExerciseCode(), pick);
  // Restore the program for the tests below.
  const back = await call(swapProgramExerciseHandler, { user: { id: coach.id }, params: { programId: program.id }, body: { sessionIndex: 0, exerciseIndex: 0, newExerciseCode: before } });
  assert.equal(back.status, 200, JSON.stringify(back.body));
  assert.equal(await currentExerciseCode(), before);
});

test("B2-EX #6: a trainee cannot replace a public exercise image, but a coach and an admin can", async () => {
  const exId = "TEST_B2EX_IMG_991";
  const testDir = path.dirname(fileURLToPath(import.meta.url));
  const dir = path.resolve(testDir, "..", "frontend", "public", "exercises", exId);
  const body = { exercise_id: exId, image_index: 0, image_base64: Buffer.from("b2ex-fake-image-bytes").toString("base64") };
  let coachRole = null;
  try {
    const byClient = await call(uploadExerciseImage, { user: { id: a.id }, body });
    assert.equal(byClient.status, 403, JSON.stringify(byClient.body));
    assert.equal(fs.existsSync(path.join(dir, "0.jpg")), false, "trainee upload must not write a file");
    coachRole = await User.create({ client_code: "TEST_EXSWAP_COACHROLE_984", phone_number: "01099000984", full_name: "CoachRole", role: "COACH" });
    const byCoachRole = await call(uploadExerciseImage, { user: { id: coachRole.id }, body });
    assert.equal(byCoachRole.status, 200, JSON.stringify(byCoachRole.body));
    assert.equal(byCoachRole.body.success, true);
    const byAdmin = await call(uploadExerciseImage, { user: { id: coach.id }, body });
    assert.equal(byAdmin.status, 200, JSON.stringify(byAdmin.body));
    assert.equal(byAdmin.body.success, true);
    assert.equal(fs.existsSync(path.join(dir, "0.jpg")), true, "coach/admin upload must write the file");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
    await unlockClientA();
    await coachRole?.destroy().catch(() => {});
  }
});

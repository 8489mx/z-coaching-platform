import test from "node:test";
import assert from "node:assert/strict";

import { prepareNextCycle, updateCustomProgram } from "../src/api/controllers/program.controller.js";
import { User, Program, CheckinSubmission, IntakeSubmission } from "../src/api/models/index.js";
import sequelize from "../src/api/config/database.js";

/**
 * Gap #11: more than one ACTIVE program can exist for the same client.
 * prepareNextCycle publishes the new cycle ACTIVE without retiring the old
 * one, and publishing a prepared draft does the same. A client must have
 * exactly one ACTIVE program: the superseded one becomes ARCHIVED (the
 * third status in the Program model: DRAFT | ACTIVE | ARCHIVED).
 * generateProgram has the same shape but belongs to gap #7 (save-path
 * inconsistency) and is deliberately NOT covered here.
 */
const DAY = 24 * 60 * 60 * 1000;
const CLIENT1 = "TEST_B4_ONE_ACTIVE_961";
const COACH1 = "TEST_B4_ONE_ACTIVE_COACH_961";
const CLIENT2 = "TEST_B4_ONE_ACTIVE_963";
const COACH2 = "TEST_B4_ONE_ACTIVE_COACH_963";
const weeks = [1, 2, 3, 4, 5].map((n) => ({ week_number: n, sessions: [{ exercises: [{ exercise_code: "GOBLET_SQUAT", sets: 3 }] }] }));

const PLAN = {
  cycle_number: 1,
  nutrition: { targets: { calories: 2400, protein: 180, carbs: 240, fats: 70 }, meals: [] },
  training_program: {
    weeks: [
      { week_number: 1, sessions: [{ session_name: "Push", exercises: [{ exercise_code: "BARBELL_BENCH_PRESS", sets: 4, reps: "8-10" }] }] },
      { week_number: 2, sessions: [{ session_name: "Push", exercises: [{ exercise_code: "BARBELL_BENCH_PRESS", sets: 4, reps: "8-10" }] }] },
    ],
  },
};

// Publishing is fail-closed: updateCustomProgram returns 409 INTAKE_REQUIRED
// with no stored intake. A draft therefore needs a complete, healthy intake
// before it can publish — the same shape the editor-scope test publishes with.
const HEALTHY_INTAKE = { answers: {
  gender: "female", age: "34", height_cm: "165", weight_kg: "80", primary_goal: "fat_loss", dangerous_symptoms: ["NONE"],
  medical_conditions: { has_conditions: false, selected: [], female_cases: { is_pcos: false, is_lactating: false, is_postpartum: false, answered: true } },
  injuries_map: { has_injuries: false, selected_areas: ["none"] }, strict_allergies: ["none"],
  cardio: { walkingAbility: "EASY" },
  training_logistics: { days_per_week: 3, experience_level: "beginner" },
} };

function mockRes() {
  const out = { status: 200, body: null };
  const res = { status(c) { out.status = c; return res; }, json(b) { out.body = b; return res; } };
  return { res, out };
}

async function fresh(code, phone, role) {
  const existing = await User.findOne({ where: { client_code: code } });
  if (existing) {
    await CheckinSubmission.destroy({ where: { user_id: existing.id } }).catch(() => {});
    await Program.destroy({ where: { user_id: existing.id } });
    await IntakeSubmission.destroy({ where: { user_id: existing.id } }).catch(() => {});
    await existing.destroy();
  }
  return User.create({ client_code: code, phone_number: phone, full_name: code, role });
}

async function countActive(userId) {
  return Program.count({ where: { user_id: userId, status: "ACTIVE" } });
}

test.after(async () => {
  await sequelize.close().catch(() => {});
});

test("auto-publishing the next cycle archives the old ACTIVE program, so the client keeps exactly one", async () => {
  const client = await fresh(CLIENT1, "01099000961", "CLIENT");
  const coach = await fresh(COACH1, "01099000962", "ADMIN");
  try {
    // A plan that started 45 days ago: its two-week cycle has ended.
    const old = await Program.create({
      user_id: client.id,
      status: "ACTIVE",
      program_data: { ...PLAN, cycle_started_at: new Date(Date.now() - 45 * DAY).toISOString() },
    });
    // A recent, clean check-in: the auto-publish gates all pass.
    await CheckinSubmission.create({
      user_id: client.id,
      week_number: 2,
      daily_weights_kg: [80],
      average_weight_kg: 80,
      biofeedback: {},
      analysis_output: {},
    });

    const r = mockRes();
    await prepareNextCycle({ user: { id: coach.id }, body: { client_code: CLIENT1 } }, r.res);
    assert.equal(r.out.status, 201, JSON.stringify(r.out.body));
    assert.equal(r.out.body.published, true, "precondition: the gates allow auto-publish");

    const created = await Program.findByPk(r.out.body.program_id);
    assert.equal(created.status, "ACTIVE", "the new cycle reaches the client");
    assert.equal(await countActive(client.id), 1, "exactly one ACTIVE program per client");
    await old.reload();
    assert.equal(old.status, "ARCHIVED", "the superseded cycle is archived, not left ACTIVE");
  } finally {
    await CheckinSubmission.destroy({ where: { user_id: client.id } }).catch(() => {});
    await Program.destroy({ where: { user_id: client.id } }).catch(() => {});
    await client.destroy().catch(() => {});
    await coach.destroy().catch(() => {});
  }
});

test("publishing a prepared draft archives the old ACTIVE program instead of leaving two", async () => {
  const client = await fresh(CLIENT2, "01099000963", "CLIENT");
  const coach = await fresh(COACH2, "01099000964", "ADMIN");
  try {
    const old = await Program.create({
      user_id: client.id,
      status: "ACTIVE",
      program_data: { ...PLAN, cycle_number: 1, cycle_started_at: new Date(Date.now() - 45 * DAY).toISOString(), training_program: { weeks } },
    });
    const draft = await Program.create({
      user_id: client.id,
      status: "DRAFT",
      program_data: { cycle_number: 2, cycle_started_at: new Date(Date.now() - 5 * DAY).toISOString(), training_program: { weeks } },
    });
    assert.equal(await countActive(client.id), 1, "precondition: one ACTIVE before publishing");

    await IntakeSubmission.create({ user_id: client.id, answers: HEALTHY_INTAKE, status: "PENDING_COACH_REVIEW" });

    const out = {};
    await updateCustomProgram(
      { user: { id: coach.id }, body: { client_code: CLIENT2, program_data: draft.program_data, publish: true } },
      { status(c) { out.status = c; return this; }, json(b) { out.body = b; return this; } },
    );
    assert.equal(out.status, 200, JSON.stringify(out.body));

    await draft.reload();
    assert.equal(draft.status, "ACTIVE", "the draft reaches the client");
    assert.equal(await countActive(client.id), 1, "exactly one ACTIVE program per client");
    await old.reload();
    assert.equal(old.status, "ARCHIVED", "the superseded cycle is archived, not left ACTIVE");
  } finally {
    await Program.destroy({ where: { user_id: client.id } }).catch(() => {});
    await IntakeSubmission.destroy({ where: { user_id: client.id } }).catch(() => {});
    await client.destroy().catch(() => {});
    await coach.destroy().catch(() => {});
  }
});

test("a prepared draft leaves the old ACTIVE program alone until the coach publishes it", async () => {
  const client = await fresh(CLIENT1, "01099000961", "CLIENT");
  const coach = await fresh(COACH1, "01099000962", "ADMIN");
  try {
    const old = await Program.create({
      user_id: client.id,
      status: "ACTIVE",
      program_data: { ...PLAN, cycle_started_at: new Date(Date.now() - 45 * DAY).toISOString() },
    });
    // No recent check-in: the gates refuse auto-publish, so the new cycle is a draft.
    const r = mockRes();
    await prepareNextCycle({ user: { id: coach.id }, body: { client_code: CLIENT1 } }, r.res);
    assert.equal(r.out.status, 201, JSON.stringify(r.out.body));
    assert.equal(r.out.body.published, false, "precondition: the new cycle waits as a draft");

    const created = await Program.findByPk(r.out.body.program_id);
    assert.equal(created.status, "DRAFT");
    assert.equal(await countActive(client.id), 1, "the client keeps seeing the published plan");
    await old.reload();
    assert.equal(old.status, "ACTIVE", "the old plan stays live until the draft is published");
  } finally {
    await CheckinSubmission.destroy({ where: { user_id: client.id } }).catch(() => {});
    await Program.destroy({ where: { user_id: client.id } }).catch(() => {});
    await client.destroy().catch(() => {});
    await coach.destroy().catch(() => {});
  }
});

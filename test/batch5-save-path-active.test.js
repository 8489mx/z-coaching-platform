import test from "node:test";
import assert from "node:assert/strict";

import {
  generateProgram,
  generateAndSaveProgram,
  prepareNextCycle,
  updateCustomProgram,
} from "../src/api/controllers/program.controller.js";
import { User, Program, CheckinSubmission, IntakeSubmission } from "../src/api/models/index.js";
import sequelize from "../src/api/config/database.js";

/**
 * Gap #7: the save paths do not share one ACTIVE-uniqueness rule.
 * generateProgram creates a program ACTIVE without retiring the client's
 * existing ACTIVE program, so a client can end up with two live plans —
 * and two different readers (check-in merge, the client app) can each pick
 * a different one. B4-4 closed the same hole for the cycle-publish and
 * draft-publish paths (gap #11); this package routes every Program.create
 * in program.controller.js through one shared save helper, so every save
 * path goes through the same rule. A DRAFT never archives anything: the
 * old plan stays live until the new one is published.
 */
const DAY = 24 * 60 * 60 * 1000;
const CLIENT1 = "TEST_B5_SAVE_PATH_971";
const CLIENT2 = "TEST_B5_SAVE_PATH_973";
const CLIENT3 = "TEST_B5_SAVE_PATH_975";
const CLIENT4 = "TEST_B5_SAVE_PATH_977";
const COACH = "TEST_B5_SAVE_PATH_COACH_979";
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

// Healthy flat-form intake (matrix buildIntake shape): no medical flags,
// no injuries, no allergies — the engine builds a READY plan, so
// generateProgram saves it ACTIVE.
const HEALTHY_INTAKE = {
  gender: "male", age: "34", height_cm: "180", weight_kg: "85", waist_cm: "90",
  primary_goal: "fat_loss", neat_level: "moderate", occupation_type: "DESK_OFFICE",
  dangerous_symptoms: ["NONE"],
  medical_conditions: { has_conditions: false, selected: [] },
  injuries_map: { has_injuries: false, selected_areas: ["none"] },
  strict_allergies: ["none"],
  meal_structure: { meals_count: "3_meals", intermittent_fasting: "none" },
  training_environment: "commercial_gym",
  training_logistics: { days_per_week: 3, experience_level: "BEGINNER" },
  recent_training: "ACTIVE",
  cardio: { walkingAbility: "EASY", averageDailySteps: 8000, maxSessionsPerWeek: 2, maxDurationMinutes: 30 },
  sleep_hours: 7.5,
  sleep_schedule: { pattern: "regular", average_hours: 7.5 },
};

// Publishing is fail-closed: updateCustomProgram returns 409 INTAKE_REQUIRED
// with no stored intake. A draft therefore needs a complete, healthy intake
// before it can publish — the same shape the editor-scope test publishes with.
const HEALTHY_SUBMISSION = { answers: {
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

test("generating a program twice leaves exactly one ACTIVE program — the first is archived", async () => {
  const client = await fresh(CLIENT1, "01099000971", "CLIENT");
  try {
    const r1 = mockRes();
    await generateProgram({ user: { id: client.id }, body: { ...HEALTHY_INTAKE } }, r1.res);
    assert.equal(r1.out.status, 201, JSON.stringify(r1.out.body));
    assert.equal(r1.out.body.program_status, "ACTIVE", "precondition: a healthy intake generates ACTIVE");
    const firstId = r1.out.body.program_id;

    const r2 = mockRes();
    await generateProgram({ user: { id: client.id }, body: { ...HEALTHY_INTAKE } }, r2.res);
    assert.equal(r2.out.status, 201, JSON.stringify(r2.out.body));
    assert.equal(r2.out.body.program_status, "ACTIVE", "the second generation is ACTIVE too");

    assert.equal(await countActive(client.id), 1, "exactly one ACTIVE program per client");
    const first = await Program.findByPk(firstId);
    assert.equal(first.status, "ARCHIVED", "the superseded program is archived, not left ACTIVE");
    const second = await Program.findByPk(r2.out.body.program_id);
    assert.equal(second.status, "ACTIVE", "the newest program is the live one");
  } finally {
    await Program.destroy({ where: { user_id: client.id } }).catch(() => {});
    await client.destroy().catch(() => {});
  }
});

test("generating then auto-publishing the next cycle still leaves exactly one ACTIVE program", async () => {
  const client = await fresh(CLIENT2, "01099000973", "CLIENT");
  const coach = await fresh(COACH, "01099000979", "ADMIN");
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
    await prepareNextCycle({ user: { id: coach.id }, body: { client_code: CLIENT2 } }, r.res);
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

test("generating then publishing a prepared draft still leaves exactly one ACTIVE program", async () => {
  const client = await fresh(CLIENT3, "01099000975", "CLIENT");
  const coach = await fresh(COACH, "01099000979", "ADMIN");
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

    await IntakeSubmission.create({ user_id: client.id, answers: HEALTHY_SUBMISSION, status: "PENDING_COACH_REVIEW" });

    const out = {};
    await updateCustomProgram(
      { user: { id: coach.id }, body: { client_code: CLIENT3, program_data: draft.program_data, publish: true } },
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
  const client = await fresh(CLIENT4, "01099000977", "CLIENT");
  const coach = await fresh(COACH, "01099000979", "ADMIN");
  try {
    const old = await Program.create({
      user_id: client.id,
      status: "ACTIVE",
      program_data: { ...PLAN, cycle_started_at: new Date(Date.now() - 45 * DAY).toISOString() },
    });
    // No recent check-in: the gates refuse auto-publish, so the new cycle is a draft.
    const r = mockRes();
    await prepareNextCycle({ user: { id: coach.id }, body: { client_code: CLIENT4 } }, r.res);
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

test("generateAndSaveProgram still creates the first program ACTIVE for a brand-new client", async () => {
  const client = await fresh("TEST_B5_SAVE_PATH_981", "01099000981", "CLIENT");
  try {
    const r = mockRes();
    await generateAndSaveProgram(
      {
        user: { id: client.id },
        body: {
          client_code: "TEST_B5_SAVE_PATH_981",
          phone_number: "01099000981",
          full_name: "TEST_B5_SAVE_PATH_981",
          personal: { firstName: "Test", lastName: "B5" },
          ...HEALTHY_INTAKE,
        },
      },
      r.res,
    );
    assert.equal(r.out.status, 201, JSON.stringify(r.out.body));
    assert.equal(r.out.body.program_status, "ACTIVE", "the first program for a new client is ACTIVE");
    assert.equal(await countActive(client.id), 1, "exactly one ACTIVE program per client");
  } finally {
    await Program.destroy({ where: { user_id: client.id } }).catch(() => {});
    await IntakeSubmission.destroy({ where: { user_id: client.id } }).catch(() => {});
    await client.destroy().catch(() => {});
  }
});

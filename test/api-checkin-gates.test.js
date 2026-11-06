import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { submitCheckin, approveCheckin } from "../src/api/controllers/checkin.controller.js";
import { getPendingCheckins, updateCustomProgram } from "../src/api/controllers/program.controller.js";
import { approveAndPublishIntake } from "../src/api/controllers/intake.controller.js";
import { User, IntakeSubmission, Program, CheckinSubmission } from "../src/api/models/index.js";
import { encryptMedicalData } from "../src/utils/crypto.js";
import sequelize from "../src/api/config/database.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"));
const CODE = "TEST_API_GATES_909";
const COACH_CODE = "TEST_API_GATES_COACH_909";
const GATE_CODE = "TEST_API_GATES_PUB_909";

function mockRes() {
  const out = { status: 200, body: null };
  const res = { status(c) { out.status = c; return res; }, json(b) { out.body = b; return res; } };
  return { res, out };
}

// A live-like request: headers present, so the schedule guard is enforced
// exactly as over HTTP (submitCheckin treats a bare mock as a unit test
// and skips the guard unless enforce_schedule_guard is set).
const liveReq = (user, body) => ({ user, headers: {}, body });

const createSamplePlan = () => JSON.parse(JSON.stringify(buildMasterEngineV2({
  intake: {
    gender: "male", age: "28", height_cm: "178", weight_kg: "85",
    circumferences: { neck_cm: "38", waist_cm: "92", hips_cm: "102" },
    primary_goal: "fat_loss", neat_level: "moderate", occupation_type: "DESK_OFFICE", dangerous_symptoms: ["NONE"],
    medical_conditions: { has_conditions: false, selected: ["none"] }, injuries_map: { has_injuries: false, selected_areas: ["none"] },
    religion: "MUSLIM", strict_allergies: ["none"], meal_structure: { meals_count: "3_meals", intermittent_fasting: "none" },
    training_environment: "commercial_gym", training_logistics: { days_per_week: 4, experience_level: "intermediate" }, recent_training: "ACTIVE",
  },
  evaluationContext: { system_time: "2026-10-01T08:00:00.000Z", assessmentDate: "2026-10-01" },
  nutritionFoodCatalog: CATALOG,
  options: {},
})));

const kcalOf = (data) => Number(data?.nutrition?.targets?.calories ?? data?.nutrition_program?.macro_targets?.calories_kcal);

async function cleanup(code) {
  const user = await User.findOne({ where: { client_code: code } });
  if (!user) return;
  await CheckinSubmission.destroy({ where: { user_id: user.id } }).catch(() => {});
  await Program.destroy({ where: { user_id: user.id } }).catch(() => {});
  await IntakeSubmission.destroy({ where: { user_id: user.id } }).catch(() => {});
  await user.destroy().catch(() => {});
}

test.after(async () => {
  await sequelize.close().catch(() => {});
});

// Stored exactly like submitPublicIntake does: { answers: { ...form } }, encrypted.
const storedIntake = (meds) => ({
  _isEncrypted: true,
  data: encryptMedicalData({
    answers: {
      gender: "male", age: "45", height_cm: "175", weight_kg: "82", primary_goal: "fat_loss",
      dangerous_symptoms: ["NONE"],
      medical_conditions: { has_conditions: false, selected: [], diabetes: { type: "type2", uses_insulin: false } },
      current_meds_supplements_list: meds,
      cardio: { walkingAbility: "EASY" },
      training_logistics: { days_per_week: 3, experience_level: "beginner" },
    },
  }),
});

test("H6 B-API-1: a check-in dated in the future is rejected, never accepted as a future week", async (t) => {
  await cleanup(CODE);
  const user = await User.create({ client_code: CODE, phone_number: "01099000909", full_name: "API Gates Test", role: "CLIENT", subscription_package: "MAX" });
  try {
    await Program.create({ user_id: user.id, status: "ACTIVE", program_data: createSamplePlan() });

    await t.test("future submission_time -> 400 FUTURE_SUBMISSION_TIME, no row stored", async () => {
      const r = mockRes();
      await submitCheckin(liveReq({ id: user.id, role: "CLIENT" }, {
        user_id: CODE, weight_kg: 84.0, nutrition_adherence_percent: 95,
        workouts_completed: 4, workouts_scheduled: 4,
        biofeedback: { hunger_level: 2, energy_level: 4, sleep_quality: 4, sleep_hours: 7, stress_level: 2 },
        submission_time: "2027-01-01T08:00:00+02:00",
      }), r.res);
      assert.equal(r.out.status, 400, JSON.stringify(r.out.body));
      assert.equal(r.out.body.code, "FUTURE_SUBMISSION_TIME");
      assert.equal(await CheckinSubmission.count({ where: { user_id: user.id } }), 0);
    });

    await t.test("unparseable submission_time -> 400 INVALID_SUBMISSION_TIME", async () => {
      const r = mockRes();
      await submitCheckin(liveReq({ id: user.id, role: "CLIENT" }, {
        user_id: CODE, weight_kg: 84.0, nutrition_adherence_percent: 95,
        workouts_completed: 4, workouts_scheduled: 4, submission_time: "not-a-date",
      }), r.res);
      assert.equal(r.out.status, 400, JSON.stringify(r.out.body));
      assert.equal(r.out.body.code, "INVALID_SUBMISSION_TIME");
      assert.equal(await CheckinSubmission.count({ where: { user_id: user.id } }), 0);
    });
  } finally {
    await cleanup(CODE);
  }
});

test("H6 B-API-1: a past submission_time inside its own window is still honoured (offline queue)", async () => {
  await cleanup(CODE);
  const user = await User.create({ client_code: CODE, phone_number: "01099000909", full_name: "API Gates Test", role: "CLIENT", subscription_package: "MAX" });
  try {
    // Activation 8 days ago: week 1 was due yesterday, its window is still open.
    const activation = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    const planData = createSamplePlan();
    planData.cycle_started_at = activation.toISOString();
    await Program.create({ user_id: user.id, status: "ACTIVE", program_data: planData });
    const week1At = new Date(activation.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const r = mockRes();
    await submitCheckin(liveReq({ id: user.id, role: "CLIENT" }, {
      user_id: CODE, weight_kg: 84.5, nutrition_adherence_percent: 95,
      workouts_completed: 4, workouts_scheduled: 4,
      biofeedback: { hunger_level: 2, energy_level: 4, sleep_quality: 4, sleep_hours: 7, stress_level: 2 },
      submission_time: week1At,
    }), r.res);
    assert.equal(r.out.status, 201, JSON.stringify(r.out.body));
    assert.equal(r.out.body.checkin.week_number, 1);
  } finally {
    await cleanup(CODE);
  }
});

test("H6 B-API-2: the coach can approve a GREEN check-in that auto-applied at submit", async (t) => {
  await cleanup(CODE);
  await cleanup(COACH_CODE);
  const user = await User.create({ client_code: CODE, phone_number: "01099000909", full_name: "API Gates Test", role: "CLIENT", subscription_package: "MAX" });
  const coach = await User.create({ client_code: COACH_CODE, phone_number: "01099000910", full_name: "API Gates Coach", role: "ADMIN" });
  try {
    const activation = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    const planData = createSamplePlan();
    planData.cycle_started_at = activation.toISOString();
    const program = await Program.create({ user_id: user.id, status: "ACTIVE", program_data: planData });

    await t.test("end to end: GREEN submit auto-applies, coach approve works and merges nothing twice", async () => {
      const week1At = new Date(activation.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const r = mockRes();
      await submitCheckin(liveReq({ id: user.id, role: "CLIENT" }, {
        user_id: CODE, weight_kg: 84.5, nutrition_adherence_percent: 95,
        workouts_completed: 4, workouts_scheduled: 4,
        biofeedback: { hunger_level: 2, energy_level: 4, sleep_quality: 4, sleep_hours: 7, stress_level: 2 },
        submission_time: week1At,
      }), r.res);
      assert.equal(r.out.status, 201, JSON.stringify(r.out.body));
      assert.equal(r.out.body.checkin.status, "AUTO_APPLIED");
      assert.equal(r.out.body.analysis?.triage?.tier, "GREEN");

      // The submit's own auto-apply bumps the version; the approval must not move it further.
      await program.reload();
      const initialKcal = kcalOf(program.program_data);
      const initialVersion = program.version;

      const note = "تمت المراجعة، الالتزام ممتاز.";
      const a = mockRes();
      await approveCheckin(
        { user: { id: coach.id, role: "COACH" }, params: { checkinId: r.out.body.checkin.id }, body: { apply_program_adaptation: true, coach_notes: note } },
        a.res,
      );
      assert.equal(a.out.status, 200, JSON.stringify(a.out.body));
      assert.equal(a.out.body.success, true);

      const stored = await CheckinSubmission.findByPk(r.out.body.checkin.id);
      assert.equal(stored.status, "APPROVED");
      assert.equal(stored.coach_notes, note);
      await program.reload();
      assert.equal(program.version, initialVersion, "review-only approval must not bump the program version");
      assert.equal(kcalOf(program.program_data), initialKcal, "review-only approval must not re-merge the adaptation");

      // Approving the same row again is still a 409: it is genuinely approved now.
      const a2 = mockRes();
      await approveCheckin(
        { user: { id: coach.id, role: "COACH" }, params: { checkinId: r.out.body.checkin.id }, body: { coach_notes: "again" } },
        a2.res,
      );
      assert.equal(a2.out.status, 409);
      assert.equal(a2.out.body.code, "CHECKIN_NOT_PENDING");
    });
  } finally {
    await cleanup(CODE);
    await cleanup(COACH_CODE);
  }
});

test("H6 B-API-4: the pending queue lists only PENDING_REVIEW rows, never AUTO_APPLIED", async () => {
  await cleanup(CODE);
  const user = await User.create({ client_code: CODE, phone_number: "01099000909", full_name: "API Gates Test", role: "CLIENT", subscription_package: "MAX" });
  try {
    const program = await Program.create({ user_id: user.id, status: "ACTIVE", program_data: createSamplePlan() });
    const base = { user_id: user.id, week_number: 1, daily_weights_kg: [84], average_weight_kg: 84, nutrition_adherence_percent: 95, workouts_completed: 4, workouts_scheduled: 4, biofeedback: {}, pain_reports: [], analysis_output: {} };
    await CheckinSubmission.create({ ...base, week_number: 1, status: "PENDING_REVIEW", analysis_status: "ON_TRACK" });
    await CheckinSubmission.create({ ...base, week_number: 2, status: "AUTO_APPLIED", adapted_program_id: program.id, analysis_status: "ON_TRACK" });
    await CheckinSubmission.create({ ...base, week_number: 3, status: "APPROVED", analysis_status: "ON_TRACK" });

    const r = mockRes();
    await getPendingCheckins({ user: { id: user.id } }, r.res);
    assert.equal(r.out.status, 200, JSON.stringify(r.out.body));
    const rows = r.out.body.checkins.filter((x) => x.user_id === user.id);
    assert.equal(rows.length, 1, JSON.stringify(rows.map((x) => x.status)));
    assert.equal(rows[0].status, "PENDING_REVIEW");
    assert.equal(rows[0].week_number, 1);
  } finally {
    await cleanup(CODE);
  }
});

test("H6 B-API-7: a flagged plan needs an explicit review confirmation before it publishes", async (t) => {
  await cleanup(GATE_CODE);
  await cleanup(COACH_CODE);
  const user = await User.create({ client_code: GATE_CODE, phone_number: "01099000911", full_name: "Gate Test", role: "CLIENT" });
  const coach = await User.create({ client_code: COACH_CODE, phone_number: "01099000910", full_name: "API Gates Coach", role: "ADMIN" });
  try {
    await IntakeSubmission.create({ user_id: user.id, answers: storedIntake(["Vitamin D3"]), status: "PENDING_COACH_REVIEW" });
    const publish = async (extra = {}) => {
      const r = mockRes();
      await updateCustomProgram({ body: { client_code: GATE_CODE, program_data: { nutrition: {} }, publish: true, ...extra }, user: { id: coach.id } }, r.res);
      return r.out;
    };

    await t.test("editor publish without confirmation -> 409 with the medication flag named", async () => {
      const out = await publish();
      assert.equal(out.status, 409, JSON.stringify(out.body));
      assert.equal(out.body.code, "MEDICAL_REVIEW_CONFIRMATION_REQUIRED");
      assert.ok(out.body.reasons.includes("MEDICATION_REPORTED_NO_AUTOMATIC_INTERPRETATION"), JSON.stringify(out.body.reasons));
      assert.equal(await Program.count({ where: { user_id: user.id, status: "ACTIVE" } }), 0);
    });

    await t.test("editor publish with confirmation -> 200", async () => {
      const out = await publish({ medical_review_confirmed: true });
      assert.equal(out.status, 200, JSON.stringify(out.body));
    });

    await t.test("approve-and-publish without confirmation -> 409, with confirmation -> 200", async () => {
      await Program.destroy({ where: { user_id: user.id } });
      const submission = await IntakeSubmission.findOne({ where: { user_id: user.id } });
      await Program.create({ user_id: user.id, program_data: {}, status: "DRAFT" });
      const r1 = mockRes();
      await approveAndPublishIntake({ params: { submission_id: submission.id }, body: {} }, r1.res);
      assert.equal(r1.out.status, 409, JSON.stringify(r1.out.body));
      assert.equal(r1.out.body.code, "MEDICAL_REVIEW_CONFIRMATION_REQUIRED");
      const r2 = mockRes();
      await approveAndPublishIntake({ params: { submission_id: submission.id }, body: { medical_review_confirmed: true } }, r2.res);
      assert.equal(r2.out.status, 200, JSON.stringify(r2.out.body));
    });
  } finally {
    await cleanup(GATE_CODE);
    await cleanup(COACH_CODE);
  }
});

test("H6 B-API-7: a plan with no review flags still publishes with one click", async () => {
  await cleanup(GATE_CODE);
  await cleanup(COACH_CODE);
  const user = await User.create({ client_code: GATE_CODE, phone_number: "01099000911", full_name: "Gate Test", role: "CLIENT" });
  const coach = await User.create({ client_code: COACH_CODE, phone_number: "01099000910", full_name: "API Gates Coach", role: "ADMIN" });
  try {
    await IntakeSubmission.create({ user_id: user.id, answers: storedIntake([]), status: "PENDING_COACH_REVIEW" });
    const r = mockRes();
    await updateCustomProgram({ body: { client_code: GATE_CODE, program_data: { nutrition: {} }, publish: true }, user: { id: coach.id } }, r.res);
    assert.equal(r.out.status, 200, JSON.stringify(r.out.body));
  } finally {
    await cleanup(GATE_CODE);
    await cleanup(COACH_CODE);
  }
});

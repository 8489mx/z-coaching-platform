import test from "node:test";
import assert from "node:assert/strict";

import { getActiveProgramByUserId } from "../src/api/controllers/program.controller.js";
import { isFoodAllowedDuringFast, resolveFastingContext } from "../src/execution-engines/fasting-calendar-engine.js";
import { FOOD_DATABASE } from "../src/execution-engines/food-swap-engine.js";
import { User, Program, IntakeSubmission } from "../src/api/models/index.js";
import sequelize from "../src/api/config/database.js";

/**
 * The contract the Flutter app depends on. The phone renders and posts, nothing else: every
 * clinical decision (fasting substitutions, Ramadan meal slots, cardio limits) is already applied
 * here, server side, by the engines the web client uses. If this file passes, an app that simply
 * draws client_view is clinically correct by construction.
 */
const CODE = "TEST_CLIENT_VIEW_921";
const RAMADAN_DAY = new Date("2026-03-01T10:00:00Z"); // Ramadan 1447 (Umm al-Qura)
const LENT_DAY = new Date("2026-03-01T10:00:00Z"); // Coptic Great Lent 2026 (strict vegan)
const GULF_SUMMER = new Date("2026-07-15T09:00:00Z");

function mockRes() {
  const out = { status: 200, body: null };
  const res = { status(c) { out.status = c; return res; }, json(b) { out.body = b; return res; } };
  return { res, out };
}

const MEALS = [
  { id: "m1", title: "الفطار", time: "08:00", items: [
    { id: "i1", code: "CHICKEN_BREAST", name: "صدور دجاج", amount: 150, p: 46, c: 0, f: 5, cal: 240 },
    { id: "i2", code: "BASMATI_RICE_COOKED", name: "أرز بسمتي", amount: 150, p: 4, c: 40, f: 0, cal: 180 },
  ] },
  { id: "m2", title: "الغداء", time: "14:00", items: [
    { id: "i3", code: "WHOLE_EGG", name: "بيض", amount: 100, p: 13, c: 1, f: 10, cal: 150 },
  ] },
  { id: "m3", title: "العشاء", time: "20:00", items: [
    { id: "i4", code: "FAVA_BEANS", name: "فول", amount: 200, p: 16, c: 30, f: 1, cal: 200 },
  ] },
];

async function setup({ phone, religion }) {
  let user = await User.findOne({ where: { client_code: CODE } });
  if (user) {
    await Program.destroy({ where: { user_id: user.id } });
    await user.destroy();
  }
  user = await User.create({ client_code: CODE, phone_number: phone, full_name: "Client View", role: "CLIENT" });
  await Program.create({
    user_id: user.id,
    status: "ACTIVE",
    program_data: {
      nutrition: { targets: { calories: 2400, protein: 180, carbs: 240, fats: 70 }, meals: MEALS },
      training_program: { weeks: [{ week_number: 1, sessions: [{ session_name: "Push", exercises: [{ exercise_code: "BARBELL_BENCH_PRESS", sets: 4, reps: "8-10" }] }] }] },
    },
  });
  const originalIntake = IntakeSubmission.findOne;
  IntakeSubmission.findOne = async () => ({ answers: { answers: { religion, christianFastingStyle: "PESCATARIAN_ALLOWED" } } });
  return { user, restore: () => { IntakeSubmission.findOne = originalIntake; } };
}

async function clientView({ phone, religion, now }) {
  const { user, restore } = await setup({ phone, religion });
  try {
    const r = mockRes();
    await getActiveProgramByUserId({ user: { id: user.id }, params: { user_id: CODE }, query: { now: now?.toISOString() } }, r.res);
    assert.equal(r.out.status, 200, JSON.stringify(r.out.body));
    assert.ok(r.out.body.client_view, "the response must carry client_view for the mobile app");
    return r.out.body;
  } finally {
    restore();
  }
}

test("client_view carries the day's targets the phone displays as-is", async () => {
  const body = await clientView({ phone: "01099000921", religion: "OTHER" });
  const t = body.client_view.target_macros;
  assert.deepEqual(
    [t.calories, t.protein_g, t.carbs_g, t.fat_g],
    [2400, 180, 240, 70],
    "targets come from the plan, already normalised to one set of names",
  );
});

test("a Christian client in Great Lent gets meals with no animal products, substituted server side", async () => {
  const body = await clientView({ phone: "01099000921", religion: "CHRISTIAN", now: LENT_DAY });
  const context = resolveFastingContext({ religion: "CHRISTIAN", date: LENT_DAY });
  const items = body.client_view.meals.flatMap((meal) => meal.items || []);
  assert.ok(items.length > 0, "meals reach the phone");
  for (const item of items) {
    const food = FOOD_DATABASE[item.code];
    if (!food) continue;
    assert.equal(isFoodAllowedDuringFast(food, context), true, `${item.code} is not allowed during this fast and must not reach the phone`);
  }
  const substituted = items.filter((item) => item.fasting_substituted_from);
  assert.ok(substituted.length > 0, "the substitution is reported so the client sees what changed");
});

test("a Muslim client in Ramadan gets meals relabelled as Iftar, snack and Suhoor", async () => {
  const body = await clientView({ phone: "01099000921", religion: "MUSLIM", now: RAMADAN_DAY });
  assert.deepEqual(body.client_view.meals.map((m) => m.ramadan_slot), ["IFTAR", "SNACK", "SUHOOR"]);
  assert.ok(body.client_view.meals[0].title.includes("الإفطار"), "the meal title says Iftar");
});

test("cardio reaches the phone ready to draw, with the advisories that apply today", async () => {
  const ramadan = await clientView({ phone: "01099000921", religion: "MUSLIM", now: RAMADAN_DAY });
  const cardio = ramadan.client_view.cardio;
  assert.ok(cardio && cardio.talk_test_cue_ar && cardio.duration_minutes, "the cardio prescription is computed server side");
  assert.ok(cardio.advisories_ar.some((note) => note.includes("رمضان")), "Ramadan cardio guidance is included");

  const gulf = await clientView({ phone: "+966501234921", religion: "OTHER", now: GULF_SUMMER });
  assert.ok(
    gulf.client_view.cardio.advisories_ar.some((note) => note.includes("الهواء الطلق")),
    "a Gulf client in summer is warned against daytime outdoor cardio",
  );
});

test("the phone never has to decide anything clinical: no raw plan is needed to render the day", async () => {
  const body = await clientView({ phone: "01099000921", religion: "MUSLIM", now: RAMADAN_DAY });
  const view = body.client_view;
  for (const key of ["target_macros", "meals", "cardio", "training_session"]) {
    assert.ok(view[key], `client_view.${key} is missing`);
  }
  const session = view.training_session;
  assert.ok(Array.isArray(session.exercises), "the day's session comes with its exercises");
  for (const exercise of session.exercises) {
    assert.ok(exercise.sets !== undefined && exercise.reps !== undefined, "sets and reps are resolved server side");
  }
});

test.after(async () => {
  const user = await User.findOne({ where: { client_code: CODE } });
  if (user) {
    await Program.destroy({ where: { user_id: user.id } }).catch(() => {});
    await user.destroy().catch(() => {});
  }
  await sequelize.close().catch(() => {});
});

/**
 * The guard this file was missing the first time: the phone recomputes nothing, so the clinical
 * cardio gates (GINA asthma, hypertension, cardiac) have to be applied before the prescription
 * leaves the server. A client who declared a respiratory condition must never receive intervals.
 */
test("a client with a respiratory condition never receives HIIT through client_view", async () => {
  let user = await User.findOne({ where: { client_code: CODE } });
  if (user) {
    await Program.destroy({ where: { user_id: user.id } });
    await user.destroy();
  }
  user = await User.create({ client_code: CODE, phone_number: "01099000921", full_name: "Asthma", role: "CLIENT" });
  await Program.create({
    user_id: user.id,
    status: "ACTIVE",
    program_data: {
      nutrition: { targets: { calories: 2000, protein: 150, carbs: 200, fats: 60 }, meals: [] },
      cardio: { type: "HIIT_INTERVALS", duration_minutes: 20, sessions_per_week: 3 },
      training_program: { weeks: [{ sessions: [{ session_name: "A", exercises: [{ exercise_code: "X", sets: 4, reps: "8" }] }] }] },
    },
  });
  const originalIntake = IntakeSubmission.findOne;
  IntakeSubmission.findOne = async () => ({ answers: { answers: {
    religion: "OTHER",
    medical_conditions: { selected: ["asthma_respiratory"] },
  } } });
  try {
    const r = mockRes();
    await getActiveProgramByUserId({ user: { id: user.id }, params: { user_id: CODE }, query: {} }, r.res);
    assert.equal(r.out.status, 200, JSON.stringify(r.out.body));
    const cardio = r.out.body.client_view.cardio;
    assert.notEqual(cardio.type, "HIIT_INTERVALS", "intervals must be downgraded before they reach the phone");
    assert.match(cardio.clinical_guidance_ar || "", /ربو|تنفس/, "the reason is stated to the client");
  } finally {
    IntakeSubmission.findOne = originalIntake;
  }
});

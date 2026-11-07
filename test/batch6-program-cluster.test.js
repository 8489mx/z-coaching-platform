import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildMasterEngineV2 } from "../src/master-engine-v2/index.js";
import { getActiveProgramByUserId } from "../src/api/controllers/program.controller.js";
import { isFoodAllowedDuringFast, resolveFastingContext } from "../src/execution-engines/fasting-calendar-engine.js";
import { FOOD_DATABASE } from "../frontend/src/utils/foodSwapEngine.js";
import { User, Program, IntakeSubmission } from "../src/api/models/index.js";
import sequelize from "../src/api/config/database.js";

/**
 * Batch 6, B6-4 — gap #9: the display reader looks for targets and meals
 * under a top-level `nutrition` key, but the V2 master engine never writes
 * one (it writes `nutrition_program.macro_targets` /
 * `nutrition_program.culinary_meals`). Every fresh V2 plan therefore serves
 * client_view.target_macros all zeros and client_view.meals empty — the
 * exact payload the Flutter app and every other client_view consumer draw.
 * The web page works around it by reading master_program directly; the
 * contract itself is empty.
 *
 * Fail-first: the V2 tests below FAIL on the unmodified base (zeros / []),
 * the legacy guard test PASSES on the base and must keep passing.
 */
const CODE = "TEST_B6_CLUSTER_941";
const RAMADAN_DAY = new Date("2026-03-01T10:00:00Z"); // Ramadan 1447 (Umm al-Qura)
const LENT_DAY = new Date("2026-03-01T10:00:00Z"); // Coptic Great Lent 2026 (strict vegan)

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = JSON.parse(fs.readFileSync(path.join(ROOT, "data/catalogs/core-global-food-batch-v1.json"), "utf8"));
const CTX = Object.freeze({ system_time: "2026-09-21T08:00:00.000Z", assessmentDate: "2026-09-21" });

// C14: the matrix READY client — clean plan, culinary preflight READY.
const C14 = { sex: "female", age: 29, height_cm: 165, weight_kg: 62, waist_cm: 70, goal: "weight_maintenance", neat_level: "moderate", experience: "INTERMEDIATE", days_per_week: 3, training_environment: "commercial_gym", injuries: [], medical: [], meds: [], allergies: [], disliked_foods: [], intolerances: [], meals_count: "4_meals", fasting: "none", sleep_hours: 7.5, sleep_pattern: "regular_night", steps: 9000, walking: "EASY" };

function flatIntake(p) {
  return {
    gender: p.sex, age: String(p.age), height_cm: String(p.height_cm), weight_kg: String(p.weight_kg),
    ...(p.waist_cm ? { waist_cm: String(p.waist_cm) } : {}),
    primary_goal: p.goal, neat_level: p.neat_level, occupation_type: "DESK_OFFICE",
    dangerous_symptoms: ["NONE"],
    medical_conditions: { has_conditions: p.medical.length > 0, selected: p.medical },
    injuries_map: { has_injuries: p.injuries.length > 0, selected_areas: p.injuries.map((i) => i.area) },
    religion: "MUSLIM", strict_allergies: p.allergies,
    meal_structure: { meals_count: p.meals_count, intermittent_fasting: p.fasting },
    training_environment: p.training_environment,
    training_logistics: { days_per_week: p.days_per_week, experience_level: p.experience },
    recent_training: "ACTIVE",
    cardio: { walkingAbility: p.walking, averageDailySteps: p.steps, maxSessionsPerWeek: 2, maxDurationMinutes: 30 },
    sleep_hours: p.sleep_hours,
    sleep_schedule: { pattern: p.sleep_pattern, average_hours: p.sleep_hours },
  };
}

function mockRes() {
  const out = { status: 200, body: null };
  const res = { status(c) { out.status = c; return res; }, json(b) { out.body = b; return res; } };
  return { res, out };
}

async function seedUser() {
  let user = await User.findOne({ where: { client_code: CODE } });
  if (user) {
    await Program.destroy({ where: { user_id: user.id } });
    await user.destroy();
  }
  return User.create({ client_code: CODE, phone_number: "01099000942", full_name: "B6 Cluster", role: "CLIENT", plan_approval_status: "APPROVED" });
}

async function clientView({ programData, religion, now }) {
  const user = await seedUser();
  await Program.create({ user_id: user.id, status: "ACTIVE", program_data: programData });
  const originalIntake = IntakeSubmission.findOne;
  IntakeSubmission.findOne = async () => ({ answers: { answers: { religion } } });
  try {
    const r = mockRes();
    await getActiveProgramByUserId({ user: { id: user.id }, params: { user_id: CODE }, query: now ? { now: now.toISOString() } : {} }, r.res);
    assert.equal(r.out.status, 200, JSON.stringify(r.out.body));
    assert.ok(r.out.body.client_view, "the response must carry client_view for the mobile app");
    return r.out.body;
  } finally {
    IntakeSubmission.findOne = originalIntake;
  }
}

function v2ProgramData() {
  const program = buildMasterEngineV2({ intake: flatIntake(C14), evaluationContext: CTX, nutritionFoodCatalog: CATALOG, options: {} });
  assert.equal("nutrition" in program, false, "fixture check: a real V2 program has no top-level nutrition key");
  return JSON.parse(JSON.stringify(program));
}

test("B6-4 #9 (defect): a V2 program serves its real macro targets through client_view", async () => {
  const body = await clientView({ programData: v2ProgramData(), religion: "OTHER" });
  const t = body.client_view.target_macros;
  // C14 macro_targets, measured by the re-probe: 2018 kcal, P112/C282/F49.
  assert.deepEqual(
    [t.calories, t.protein_g, t.carbs_g, t.fat_g],
    [2018, 112, 282, 49],
    "targets must come from nutrition_program.macro_targets, not from a nutrition key that does not exist",
  );
});

test("B6-4 #9 (defect): a V2 program serves its real meals through client_view, in the shape the phone draws", async () => {
  const body = await clientView({ programData: v2ProgramData(), religion: "OTHER" });
  const meals = body.client_view.meals;
  assert.equal(meals.length, 4, "the four culinary meals reach the phone");
  for (const meal of meals) {
    assert.ok(Array.isArray(meal.items) && meal.items.length > 0, "each meal carries its items");
    for (const item of meal.items) {
      assert.equal(typeof item.code, "string", "each item carries a food code the phone can look up");
      assert.ok(Number(item.amount) > 0, "each item carries a portion in grams");
      for (const k of ["p", "c", "f", "cal"]) {
        assert.equal(typeof item[k], "number", `each item carries ${k} as a number`);
      }
    }
  }
});

test("B6-4 #9 (guard): a legacy-shaped program still serves its targets and meals unchanged", async () => {
  const legacyMeals = [
    { id: "m1", title: "الفطار", time: "08:00", items: [
      { id: "i1", code: "CHICKEN_BREAST", name: "صدور دجاج", amount: 150, p: 46, c: 0, f: 5, cal: 240 },
    ] },
    { id: "m2", title: "الغداء", time: "14:00", items: [
      { id: "i2", code: "WHOLE_EGG", name: "بيض", amount: 100, p: 13, c: 1, f: 10, cal: 150 },
    ] },
  ];
  const body = await clientView({
    programData: {
      nutrition: { targets: { calories: 2400, protein: 180, carbs: 240, fats: 70 }, meals: legacyMeals },
      training_program: { weeks: [{ week_number: 1, sessions: [{ session_name: "Push", exercises: [{ exercise_code: "BARBELL_BENCH_PRESS", sets: 4, reps: "8-10" }] }] }] },
    },
    religion: "OTHER",
  });
  const t = body.client_view.target_macros;
  assert.deepEqual([t.calories, t.protein_g, t.carbs_g, t.fat_g], [2400, 180, 240, 70]);
  assert.equal(body.client_view.meals.length, 2, "legacy meals still reach the phone");
});

test("B6-4 #9 (guard): Ramadan relabelling still works on V2 meals, in order", async () => {
  const body = await clientView({ programData: v2ProgramData(), religion: "MUSLIM", now: RAMADAN_DAY });
  assert.deepEqual(body.client_view.meals.map((m) => m.ramadan_slot), ["IFTAR", "SNACK", "SNACK", "SUHOOR"]);
  assert.ok(body.client_view.meals[0].title.includes("الإفطار"), "the first meal title says Iftar");
});

test("B6-4 #9 (guard): no disallowed animal product slips through to the phone during Lent on V2 meals", async () => {
  const body = await clientView({ programData: v2ProgramData(), religion: "CHRISTIAN", now: LENT_DAY });
  const context = resolveFastingContext({ religion: "CHRISTIAN", date: LENT_DAY });
  const items = body.client_view.meals.flatMap((meal) => meal.items || []);
  assert.ok(items.length > 0, "meals reach the phone");
  for (const item of items) {
    const food = FOOD_DATABASE[item.code];
    if (!food) continue;
    const allowed = isFoodAllowedDuringFast(food, context);
    assert.ok(
      allowed || item.fasting_blocked === true || item.fasting_substituted_from,
      `${item.code} is not allowed during Lent and must be substituted or flagged, never served silently`,
    );
  }
  const changed = items.filter((item) => item.fasting_substituted_from || item.fasting_blocked === true);
  assert.ok(changed.length > 0, "the Lent fast actually changes the V2 plate (eggs are substituted or flagged)");
});

test.after(async () => {
  const user = await User.findOne({ where: { client_code: CODE } });
  if (user) {
    await Program.destroy({ where: { user_id: user.id } }).catch(() => {});
    await user.destroy().catch(() => {});
  }
  await sequelize.close().catch(() => {});
});

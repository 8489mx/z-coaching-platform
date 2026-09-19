import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  resolveCountryFromPhone, resolveClientFastingContext, setFastingOverride,
} from "../src/api/controllers/program.controller.js";
import { User, Program, IntakeSubmission } from "../src/api/models/index.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");

function mockRes() {
  const out = { status: 200, body: null };
  const res = { status(c) { out.status = c; return res; }, json(b) { out.body = b; return res; } };
  return { res, out };
}

function withIntake(answers, fn) {
  const original = IntakeSubmission.findOne;
  IntakeSubmission.findOne = async () => ({ answers: { answers } });
  return Promise.resolve(fn()).finally(() => { IntakeSubmission.findOne = original; });
}

test("country comes from the phone prefix (international and local formats)", () => {
  assert.equal(resolveCountryFromPhone("+201001234567"), "EG");
  assert.equal(resolveCountryFromPhone("01001234567"), "EG");
  assert.equal(resolveCountryFromPhone("00966501234567"), "SA");
  assert.equal(resolveCountryFromPhone("+971 50 123 4567"), "AE");
  assert.equal(resolveCountryFromPhone("+96550123456"), "KW");
  assert.equal(resolveCountryFromPhone("0501234567"), "SA");
  assert.equal(resolveCountryFromPhone(""), null);
});

test("fasting context: intake religion + calendar + the coach override stored in program_data", async () => {
  const user = { id: 1, phone_number: "01001234567" };
  const lent = new Date("2026-03-01T10:00:00Z");
  await withIntake({ religion: "CHRISTIAN", christianFastingStyle: "PESCATARIAN_ALLOWED" }, async () => {
    const ctx = await resolveClientFastingContext(user, {}, lent);
    assert.equal(ctx.active, true);
    assert.equal(ctx.mode, "CHRISTIAN_FAST");
    assert.equal(ctx.religion, "CHRISTIAN");
    assert.equal(ctx.country_code, "EG");
    const off = await resolveClientFastingContext(user, { fasting_override: "OFF" }, lent);
    assert.equal(off.active, false);
    assert.equal(off.override, "OFF");
    const junk = await resolveClientFastingContext(user, { fasting_override: "BAD" }, lent);
    assert.equal(junk.override, "AUTO", "unknown override values fall back to the calendar");
  });
  await withIntake({ religion: "MUSLIM" }, async () => {
    assert.equal((await resolveClientFastingContext(user, {}, lent)).mode, "RAMADAN");
    assert.equal((await resolveClientFastingContext(user, {}, new Date("2026-06-01T10:00:00Z"))).active, false);
    assert.equal((await resolveClientFastingContext(user, { fasting_override: "FORCE_ON" }, new Date("2026-06-01T10:00:00Z"))).mode, "RAMADAN");
  });
});

test("fasting override endpoint: coaches only, validated values, merged into the latest program", async () => {
  const originals = { findByPk: User.findByPk, findOne: User.findOne, progFind: Program.findOne, intake: IntakeSubmission.findOne };
  const saved = [];
  const program = { program_data: { nutrition: { meals: [] } }, changed() {}, async save() { saved.push({ ...this.program_data }); } };
  User.findOne = async () => ({ id: 7, phone_number: "01001234567" });
  Program.findOne = async () => program;
  IntakeSubmission.findOne = async () => ({ answers: { answers: { religion: "MUSLIM" } } });
  try {
    User.findByPk = async () => ({ id: 2, role: "CLIENT" });
    let r = mockRes();
    await setFastingOverride({ user: { id: 2 }, body: { client_code: "7", override: "OFF" } }, r.res);
    assert.equal(r.out.status, 403);

    User.findByPk = async () => ({ id: 1, role: "ADMIN" });
    r = mockRes();
    await setFastingOverride({ user: { id: 1 }, body: { client_code: "7", override: "MAYBE" } }, r.res);
    assert.equal(r.out.status, 400);

    r = mockRes();
    await setFastingOverride({ user: { id: 1 }, body: { client_code: "#7", override: "FORCE_ON" } }, r.res);
    assert.equal(r.out.status, 200, JSON.stringify(r.out.body));
    assert.equal(saved.at(-1).fasting_override, "FORCE_ON");
    assert.deepEqual(saved.at(-1).nutrition, { meals: [] }, "the rest of the plan is untouched");
    assert.equal(r.out.body.fasting_context.active, true);
  } finally {
    User.findByPk = originals.findByPk; User.findOne = originals.findOne;
    Program.findOne = originals.progFind; IntakeSubmission.findOne = originals.intake;
  }
});

test("wiring: active program response, coach save carry-over, client meals, swaps, cardio and the coach toggle", () => {
  const controller = read("src/api/controllers/program.controller.js");
  assert.match(controller, /fasting_context: await resolveClientFastingContext\(user, program\.program_data\)/);
  assert.match(controller, /program_data\.fasting_override = previousOverride/);
  assert.match(read("src/api/routes/program.routes.js"), /router\.put\("\/fasting-override", requireAuth, setFastingOverride\)/);

  const hook = read("frontend/src/pages/ClientInteractiveApp/hooks/useClientInteractiveData.js");
  assert.match(hook, /applyFastingToMeals\(meals, fastingContext/);
  assert.match(hook, /const acc = displayedMeals\.reduce/, "consumed macros follow what the client actually sees");
  assert.match(hook, /meals: displayedMeals/);
  assert.match(hook, /RAMADAN_CARDIO_GUIDANCE_AR/);
  assert.match(read("frontend/src/pages/ClientInteractiveApp/components/FoodSwapModal.jsx"), /isFoodAllowedDuringFast\(f, fastingContext\)/);
  assert.match(read("frontend/src/pages/ClientInteractiveApp/components/WorkoutTab.jsx"), /cardioAdvisories\.map/);
  assert.match(read("frontend/src/pages/ClientInteractiveApp/components/MealsTab.jsx"), /fastingContext\?\.active/);
  assert.match(read("frontend/src/pages/CoachEditor.jsx"), /<CoachFastingToggle/);
  const toggle = read("frontend/src/pages/CoachEditor/components/CoachFastingToggle.jsx");
  for (const v of ["AUTO", "OFF", "FORCE_ON"]) assert.match(toggle, new RegExp(`value: '${v}'`));
  assert.doesNotMatch(toggle, /<select/);
});

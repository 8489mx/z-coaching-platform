import test from "node:test";
import assert from "node:assert/strict";

import { getPracticalCardioPrescription, CARDIO_EQUIPMENT } from "../frontend/src/utils/cardioZonesEngine.js";
import { getActiveProgramByUserId } from "../src/api/controllers/program.controller.js";
import { User, Program, IntakeSubmission } from "../src/api/models/index.js";
import sequelize from "../src/api/config/database.js";

/**
 * The cardio the client sees in the app was built without their injuries, weight, height or
 * equipment: the BMI and knee/back impact rules never fired, a treadmill was prescribed to a client
 * with bands only, and a steps-only plan showed three cardio sessions.
 */
test("without a machine, low-impact intervals become a moderate brisk walk", () => {
  const out = getPracticalCardioPrescription({ type: "HIIT_INTERVALS", medicalConditions: ["knee"], machines_available: false });
  assert.equal(out.type, "LISS_TALK_TEST");
  assert.equal(out.equipment_recommendation, CARDIO_EQUIPMENT.OUTDOOR_BRISK_WALK);
  assert.match(out.clinical_guidance_ar, /مفيش جهاز/);
});

test("with machines the low-impact intervals stay on a bike", () => {
  const out = getPracticalCardioPrescription({ type: "HIIT_INTERVALS", medicalConditions: ["knee"] });
  assert.equal(out.type, "HIIT_INTERVALS");
  assert.equal(out.equipment_recommendation, CARDIO_EQUIPMENT.STATIONARY_BIKE);
});

const CODE = "TEST_CLIENT_CARDIO_991";
let client; let original;
test.before(async () => {
  const u = await User.findOne({ where: { client_code: CODE } });
  if (u) { await Program.destroy({ where: { user_id: u.id } }); await u.destroy(); }
  client = await User.create({ client_code: CODE, phone_number: "01099000991", full_name: "Cardio", role: "CLIENT" });
  original = IntakeSubmission.findOne;
});
test.after(async () => {
  IntakeSubmission.findOne = original;
  await Program.destroy({ where: { user_id: client.id } }).catch(() => {});
  await client?.destroy().catch(() => {});
  await sequelize.close().catch(() => {});
});

async function viewFor(answers, programData) {
  await Program.destroy({ where: { user_id: client.id } });
  await Program.create({ user_id: client.id, status: "ACTIVE", program_data: programData });
  IntakeSubmission.findOne = async () => ({ answers: { answers } });
  const out = {};
  await getActiveProgramByUserId({ user: { id: client.id }, params: { user_id: CODE } }, { status(c) { out.status = c; return this; }, json(b) { out.body = b; return this; } });
  assert.equal(out.status, 200, JSON.stringify(out.body).slice(0, 300));
  return out.body.client_view.cardio;
}

test("a 130 kg client with a sore knee training with bands, on HIIT, gets a brisk walk", async () => {
  const cardio = await viewFor(
    { weight_kg: "130", height_cm: "175", training_environment: "calisthenics_bands", injuries_map: { has_injuries: true, selected_areas: ["knee"] }, religion: "OTHER" },
    { cardio: { type: "HIIT_INTERVALS" } },
  );
  assert.equal(cardio.type, "LISS_TALK_TEST", "BMI 42 bans HIIT");
  assert.equal(cardio.equipment_recommendation, CARDIO_EQUIPMENT.OUTDOOR_BRISK_WALK);
  assert.equal(cardio.clinical_guardrails.impact_restricted, true);
});

test("a steps-only plan is shown as daily walking, not cardio sessions", async () => {
  const cardio = await viewFor(
    { weight_kg: "80", height_cm: "175", training_environment: "commercial_gym", religion: "OTHER" },
    { cardio_program: { plan_specification: { strategy: "STEPS_ONLY" } } },
  );
  assert.equal(cardio.type, "RECOVERY_WALK");
});

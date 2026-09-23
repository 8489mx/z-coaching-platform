import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { updateCustomProgram } from "../src/api/controllers/program.controller.js";
import { approveAndPublishIntake } from "../src/api/controllers/intake.controller.js";
import { User, IntakeSubmission, Program } from "../src/api/models/index.js";
import { encryptMedicalData } from "../src/utils/crypto.js";
import sequelize from "../src/api/config/database.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CODE = "TEST_GATE_907";

function mockRes() {
  const out = { status: 200, body: null };
  const res = { status(c) { out.status = c; return res; }, json(b) { out.body = b; return res; } };
  return { res, out };
}

// Stored exactly like submitPublicIntake does: { answers: { ...form } }, encrypted.
const storedIntake = (selected) => ({
  _isEncrypted: true,
  data: encryptMedicalData({
    answers: {
      gender: "male", age: "45", height_cm: "175", weight_kg: "82", primary_goal: "fat_loss",
      dangerous_symptoms: ["NONE"],
      medical_conditions: { has_conditions: selected.length > 0, selected, diabetes: { type: "type2", uses_insulin: false } },
      training_logistics: { days_per_week: 3, experience_level: "beginner" },
    },
  }),
});

async function cleanup() {
  const user = await User.findOne({ where: { client_code: CODE } });
  if (!user) return;
  await Program.destroy({ where: { user_id: user.id } }).catch(() => {});
  await IntakeSubmission.destroy({ where: { user_id: user.id } }).catch(() => {});
  await user.destroy().catch(() => {});
}

test("publishing a plan for a kidney/liver client needs an explicit medical review confirmation", async (t) => {
  await cleanup();
  const user = await User.create({ client_code: CODE, phone_number: "01099000907", full_name: "Gate Test", role: "CLIENT" });
  const publish = async (extra = {}) => {
    const r = mockRes();
    await updateCustomProgram({ body: { client_code: CODE, program_data: { nutrition: {} }, publish: true, ...extra }, user: { id: user.id } }, r.res);
    return r.out;
  };

  try {
    for (const condition of ["renal", "hepatic"]) {
      await IntakeSubmission.destroy({ where: { user_id: user.id } });
      await Program.destroy({ where: { user_id: user.id } });
      const submission = await IntakeSubmission.create({ user_id: user.id, answers: storedIntake([condition]), status: "PENDING_COACH_REVIEW" });

      await t.test(`${condition}: update-custom publish is refused without confirmation`, async () => {
        const out = await publish();
        assert.equal(out.status, 409);
        assert.equal(out.body.code, "MEDICAL_REVIEW_CONFIRMATION_REQUIRED");
        assert.ok(out.body.reasons.includes("ORGAN_CONDITION_REQUIRES_MEDICAL_REVIEW"));
        assert.equal(await Program.count({ where: { user_id: user.id, status: "ACTIVE" } }), 0);
      });

      await t.test(`${condition}: approve-and-publish is refused`, async () => {
        await Program.create({ user_id: user.id, program_data: {}, status: "DRAFT" });
        const r = mockRes();
        await approveAndPublishIntake({ params: { submission_id: submission.id }, body: {} }, r.res);
        if (condition === "renal") {
          // Kidney disease is outside the service (serviceScope): refused outright, not "needs confirmation".
          assert.equal(r.out.status, 422);
          assert.equal(r.out.body.code, "OUTSIDE_SERVICE_SCOPE");
        } else {
          assert.equal(r.out.status, 409);
          assert.equal(r.out.body.code, "MEDICAL_REVIEW_CONFIRMATION_REQUIRED");
        }
      });

      await t.test(`${condition}: confirmed publish succeeds and records the confirmation`, async () => {
        const out = await publish({ medical_review_confirmed: true });
        assert.equal(out.status, 200, JSON.stringify(out.body));
        assert.equal(out.body.master_program.medical_review_confirmation.confirmed, true);
        assert.equal(out.body.master_program.medical_review_confirmation.confirmed_by_user_id, user.id);
      });
    }

    await t.test("a client without a medical flag publishes normally", async () => {
      await IntakeSubmission.destroy({ where: { user_id: user.id } });
      await IntakeSubmission.create({ user_id: user.id, answers: storedIntake([]), status: "PENDING_COACH_REVIEW" });
      const out = await publish();
      assert.equal(out.status, 200, JSON.stringify(out.body));
    });
  } finally {
    await cleanup();
    await sequelize.close().catch(() => {});
  }
});

test("coach editor: 'save draft' never publishes and a refused publish is never shown as success", () => {
  const header = fs.readFileSync(path.join(ROOT, "frontend/src/pages/CoachEditor/components/CoachHeaderBar.jsx"), "utf8");
  assert.doesNotMatch(header, /onClick=\{handleSaveDraft\}/, "passing the handler directly sends the click event as isPublish");
  const hook = fs.readFileSync(path.join(ROOT, "frontend/src/pages/CoachEditor/hooks/useCoachEditorData.js"), "utf8");
  assert.match(hook, /const isPublish = publishArg === true;/);
  assert.match(hook, /MEDICAL_REVIEW_CONFIRMATION_REQUIRED/);
  assert.match(hook, /if \(!res\.ok\) \{/);
  assert.match(hook, /medical_review_confirmed: medicalReviewConfirmed === true/);
});

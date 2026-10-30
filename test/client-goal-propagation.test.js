import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { resolveClientPrimaryGoal } from "../src/api/controllers/program.controller.js";
import { User, IntakeSubmission } from "../src/api/models/index.js";
import { encryptMedicalData } from "../src/utils/crypto.js";
import sequelize from "../src/api/config/database.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("client goal is read from the latest (encrypted) intake for goal-aware check-ins", async (t) => {
  const code = "TEST_GOAL_904";
  await User.destroy({ where: { client_code: code } }).catch(() => {});
  const user = await User.create({ client_code: code, phone_number: "01099000904", full_name: "Goal Test" });

  try {
    await t.test("returns null when the client has no intake", async () => {
      assert.equal(await resolveClientPrimaryGoal(user.id), null);
    });

    await t.test("decrypts the latest intake and returns the canonical goal", async () => {
      await IntakeSubmission.create({
        user_id: user.id,
        answers: { _isEncrypted: true, data: encryptMedicalData({ primary_goal: "muscle_gain", weight_kg: "80", height_cm: "178", gender: "male", age: "28" }) }
      });
      assert.equal(await resolveClientPrimaryGoal(user.id), "MUSCLE_GAIN");
    });
  } finally {
    await IntakeSubmission.destroy({ where: { user_id: user.id } }).catch(() => {});
    await user.destroy().catch(() => {});
    await sequelize.close().catch(() => {});
  }
});

test("the check-in endpoint passes the client goal to the check-in engine", () => {
  for (const rel of ["src/api/controllers/checkin.controller.js"]) {
    const src = fs.readFileSync(path.join(ROOT, rel), "utf8");
    const calls = [...src.matchAll(/evaluateCheckin\(\{[\s\S]*?\}\)|const evalInput = \{[\s\S]*?\n {4}\};/g)].map((m) => m[0]);
    // Either inline, or through a variable assigned from resolveClientPrimaryGoal in the same handler.
    const goalVar = src.match(/const (\w+) = await resolveClientPrimaryGoal\(/)?.[1];
    const withGoal = calls.filter((c) => c.includes("primary_goal: await resolveClientPrimaryGoal(") || (goalVar && c.includes(`primary_goal: ${goalVar}`)));
    assert.ok(withGoal.length >= 1, `${rel} must pass primary_goal`);
  }
});

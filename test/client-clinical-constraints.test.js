import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { deriveClinicalConstraints, resolveClientClinicalConstraints } from "../src/api/controllers/program.controller.js";
import { FOOD_DATABASE, isFoodClinicallySafe, calculateDynamicFoodSwap } from "../frontend/src/utils/foodSwapEngine.js";
import { User, IntakeSubmission } from "../src/api/models/index.js";
import { encryptMedicalData } from "../src/utils/crypto.js";
import sequelize from "../src/api/config/database.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Shape sent by FullIntakeForm (pre-filled sub-objects included).
const formAnswers = (selected = [], strict_allergies = []) => ({
  medical_conditions: {
    has_conditions: selected.length > 0, selected,
    diabetes: { type: "type2", uses_insulin: false }, bariatric: { is_operated: false },
    favism_g6pd: false, gout: false,
  },
  strict_allergies,
});

test("no condition and no allergy -> every flag off (pre-filled diabetes.type is ignored)", () => {
  const c = deriveClinicalConstraints(formAnswers());
  for (const flag of ["is_g6pd", "is_gout", "is_celiac", "is_lactose_intolerant", "is_diabetic", "is_ibs", "is_bariatric"]) {
    assert.equal(c[flag], false, flag);
  }
  assert.deepEqual(c.allergies, []);
  assert.equal(deriveClinicalConstraints(formAnswers([], ["none"])).allergies.length, 0);
});

test("form conditions and allergies map to the swap engine flags", () => {
  const c = deriveClinicalConstraints(formAnswers(["favism_g6pd", "gout", "diabetes", "gi_tract", "bariatric_surgery"], ["gluten_celiac", "dairy_lactose", "eggs"]));
  assert.deepEqual(
    [c.is_g6pd, c.is_gout, c.is_diabetic, c.is_ibs, c.is_bariatric, c.is_celiac, c.is_lactose_intolerant],
    [true, true, true, true, true, true, true],
  );
  assert.deepEqual(c.allergies, ["gluten_celiac", "dairy_lactose", "eggs"]);
});

test("with the derived flags the client swap engine refuses fava beans, high-purine and allergen foods", () => {
  const profile = deriveClinicalConstraints(formAnswers(["favism_g6pd", "gout"], ["eggs"]));
  assert.equal(isFoodClinicallySafe(FOOD_DATABASE.FAVA_BEANS, profile), false);
  assert.equal(isFoodClinicallySafe(FOOD_DATABASE.WHOLE_EGG, profile), false);
  const highPurine = Object.values(FOOD_DATABASE).find((f) => f.purine_level === "HIGH");
  assert.ok(highPurine);
  assert.equal(isFoodClinicallySafe(highPurine, profile), false);
  assert.throws(() => calculateDynamicFoodSwap({
    current_food_code: "CHICKEN_BREAST", current_portion_g: 150, target_food_code: "FAVA_BEANS",
    clinical_profile: profile, enforce_taste_profile: false,
  }), /Clinical Guardrail Violation/);
  assert.equal(isFoodClinicallySafe(FOOD_DATABASE.CHICKEN_BREAST, profile), true);
});

test("the active-program endpoint returns clinical_constraints and the client app applies them", () => {
  const controller = fs.readFileSync(path.join(ROOT, "src/api/controllers/program.controller.js"), "utf8");
  assert.match(controller, /clinical_constraints: await resolveClientClinicalConstraints\(user\.id\)/);
  const hook = fs.readFileSync(path.join(ROOT, "frontend/src/pages/ClientInteractiveApp/hooks/useClientInteractiveData.js"), "utf8");
  for (const flag of ["is_g6pd", "is_gout", "is_celiac", "is_lactose_intolerant"]) {
    assert.match(hook, new RegExp(`${flag}: .*constraints\\.${flag} === true`), flag);
  }
});

test("constraints are read from the latest encrypted intake", async () => {
  const code = "TEST_CLINICAL_905";
  await User.destroy({ where: { client_code: code } }).catch(() => {});
  const user = await User.create({ client_code: code, phone_number: "01099000905", full_name: "Clinical Test" });
  try {
    assert.equal(await resolveClientClinicalConstraints(user.id), null);
    await IntakeSubmission.create({
      user_id: user.id,
      answers: { _isEncrypted: true, data: encryptMedicalData(formAnswers(["favism_g6pd"], ["gluten_celiac"])) },
    });
    const c = await resolveClientClinicalConstraints(user.id);
    assert.equal(c.is_g6pd, true);
    assert.equal(c.is_celiac, true);
  } finally {
    await IntakeSubmission.destroy({ where: { user_id: user.id } }).catch(() => {});
    await user.destroy().catch(() => {});
    await sequelize.close().catch(() => {});
  }
});

import test from "node:test";
import assert from "node:assert/strict";

import { FOOD_DATABASE, isFoodClinicallySafe } from "../src/execution-engines/food-swap-engine.js";
import { deriveClinicalConstraints } from "../src/api/controllers/program.controller.js";

// Post-bariatric dumping syndrome: concentrated sugars are the classic trigger of an early
// dumping episode, so the client must never be offered them (ASMBS/ASPEN nutritional guidelines).
const DUMPING = { has_dumping_syndrome: true };

test("concentrated sugars are refused for a client with dumping syndrome", () => {
  for (const code of ["TABLE_SUGAR", "PURE_BEE_HONEY", "DATES_MEDJOOL", "DATES_KHALAS"]) {
    const food = FOOD_DATABASE[code];
    assert.ok(food, `${code} missing from the database`);
    assert.equal(isFoodClinicallySafe(food, DUMPING), false, code);
    assert.equal(isFoodClinicallySafe(food, {}), true, `${code} stays available for everyone else`);
  }
});

test("normal foods stay available with dumping syndrome", () => {
  for (const code of ["CHICKEN_BREAST", "BASMATI_RICE_COOKED", "WHOLE_EGG", "GRILLED_EGGPLANT"]) {
    assert.equal(isFoodClinicallySafe(FOOD_DATABASE[code], DUMPING), true, code);
  }
});

test("the intake answer becomes a clinical constraint the app and the swaps read", () => {
  const answers = (dumping) => ({ medical_conditions: { selected: ["bariatric_surgery"], bariatric: { is_operated: true, dumping_syndrome: dumping } } });
  assert.equal(deriveClinicalConstraints(answers(true)).has_dumping_syndrome, true);
  assert.equal(deriveClinicalConstraints(answers(false)).has_dumping_syndrome, false);
  assert.equal(deriveClinicalConstraints({}).has_dumping_syndrome, false);
  assert.equal(deriveClinicalConstraints(answers(true)).is_bariatric, true, "the surgery flag is unaffected");
});

test("the generated meals of a client with dumping syndrome carry no dates or sugar", async () => {
  const fs = await import("node:fs/promises");
  const { buildMasterEngineV2 } = await import("../src/master-engine-v2/index.js");
  const { COMPLETE_INTAKE } = await import("./fixtures/complete-intake.js");
  const catalog = JSON.parse(await fs.readFile(new URL("../data/catalogs/core-global-food-batch-v1.json", import.meta.url), "utf8"));
  const ctx = Object.freeze({ system_time: "2026-09-20T08:00:00.000Z", assessmentDate: "2026-09-20" });

  const intake = {
    ...COMPLETE_INTAKE,
    medical_conditions: {
      ...(COMPLETE_INTAKE.medical_conditions || {}),
      selected: ["bariatric_surgery"],
      bariatric: { is_operated: true, dumping_syndrome: true },
    },
  };
  const program = buildMasterEngineV2({ intake, evaluationContext: ctx, nutritionFoodCatalog: catalog, options: {} });
  const codes = (program.nutrition_program?.culinary_meals || [])
    .flatMap((meal) => meal.items || meal.foods || [])
    .map((item) => String(item.code || item.food_code || ""));
  assert.ok(codes.length > 0, "the plan actually contains meals");
  for (const code of codes) {
    assert.ok(!code.startsWith("DATES_"), `dates reached a dumping-syndrome plan: ${code}`);
    assert.ok(!/SUGAR|HONEY/.test(code), `a concentrated sugar reached a dumping-syndrome plan: ${code}`);
  }
});

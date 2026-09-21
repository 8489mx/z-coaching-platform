import test from "node:test";
import assert from "node:assert/strict";

import { FOOD_DATABASE, isFoodClinicallySafe, calculateDynamicFoodSwap } from "../frontend/src/utils/foodSwapEngine.js";

/** The web client app's swap engine hides every candidate its clinical checker refuses. */
test("commercial cornflakes (barley malt) are refused for coeliac disease", () => {
  assert.equal(isFoodClinicallySafe(FOOD_DATABASE.SUGAR_FREE_CORNFLAKES, { allergies: ["gluten_celiac"] }), false);
  assert.equal(isFoodClinicallySafe(FOOD_DATABASE.SUGAR_FREE_CORNFLAKES, {}), true);
});

test("pea protein follows the engine's favism rule on legumes", () => {
  assert.equal(isFoodClinicallySafe(FOOD_DATABASE.PEA_RICE_PROTEIN_POWDER, { is_g6pd: true }), false);
});

test("a diabetic's potato swap is offered only up to 200 g", () => {
  const rice = FOOD_DATABASE.BASMATI_RICE_COOKED;
  const potato = Object.values(FOOD_DATABASE).find((f) => /POTATO/.test(f.code || "") && f.macro_type === rice.macro_type);
  assert.ok(potato, "precondition: a potato in the carbohydrate family");
  const swap = (grams, profile) => calculateDynamicFoodSwap({ current_food_code: "BASMATI_RICE_COOKED", current_portion_g: grams, target_food_code: potato.code, clinical_profile: profile, enforce_taste_profile: false });
  assert.throws(() => swap(300, { is_diabetic: true }), /200 g/);
  assert.ok(swap(100, { is_diabetic: true }).replacement_food.portion_g <= 200);
  assert.ok(swap(300, {}).replacement_food.portion_g > 200, "no limit without diabetes");
});

test("allergy form values reach the checker for every allergen the form offers", () => {
  const byName = (re) => Object.values(FOOD_DATABASE).filter((f) => f.code === String(f.code).toUpperCase() && re.test(f.name_ar || ""));
  const cases = [
    ["sesame_seeds", /سمسم|طحينة/],
    ["fish_shellfish", /تونة|سلمون|جمبري|بلطي|هامور|سردين/],
    ["peanuts_tree_nuts", /لوز نيء|جوز عين|كاجو|فستق|بندق|سوداني/],
    ["dairy_lactose", /زبادي|جبن|لبنة/],
  ];
  for (const [allergy, re] of cases) {
    const leaks = byName(re).filter((f) => isFoodClinicallySafe(f, { allergies: [allergy] }));
    assert.deepEqual(leaks.map((f) => f.code), [], allergy);
  }
});

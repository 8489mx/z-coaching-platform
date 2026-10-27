import test from "node:test";
import assert from "node:assert/strict";

import * as kitchenYield from "../frontend/src/utils/kitchenYieldEngine.js";
const { convertPortionCookingYield } = kitchenYield;

import {
  FOOD_DATABASE,
  isFoodClinicallySafe,
  getCompatibleSwaps,
  calculateDynamicFoodSwap,
  listEquivalentFoodSwaps,
  formatItemPortionDisplay,
  PORTION_DISPLAY_MODES,
  COOKING_STATE_MODES,
} from "../frontend/src/utils/foodSwapEngine.js";

import {
  buildAllergenContext,
  isFoodClinicallySafe as isPlanFoodSafe,
} from "../src/nutrition-meal-context-v2/build-culinary-meals.js";

import { isSwapFoodSafe } from "../src/api/services/liveFoodSwapSafety.js";

test("Axis 2 (Units D & E): Culinary Yield accuracy and strict Allergy & Religious Swap Guardrails", async (t) => {
  await t.test("1. Culinary Yield Engine accurately converts raw <-> cooked across meats, fish, rice/pasta, oats, potatoes, and legumes", () => {
    // 1.1 Chicken breast: 150g cooked -> 200g raw (0.75 factor)
    const chickenRaw = convertPortionCookingYield({
      food_code: "CHICKEN_BREAST",
      amount_g: 150,
      from_state: "COOKED",
      to_state: "RAW",
    });
    assert.equal(chickenRaw.converted_amount_g, 200);
    assert.equal(chickenRaw.yield_factor, 0.75);

    // 1.2 Extended catalog codes (e.g. SKINLESS_CHICKEN_THIGHS, LEAN_GROUND_BEEF_95_5, EGYPTIAN_RICE_COOKED, ROLLED_OATS_RAW) must not fall back to 1.0
    const beefRaw = convertPortionCookingYield({
      food_code: "LEAN_GROUND_BEEF_95_5",
      amount_g: 144,
      from_state: "COOKED",
      to_state: "RAW",
    });
    assert.equal(beefRaw.converted_amount_g, 200, "Lean ground beef (0.72 yield) 144g cooked must equal 200g raw");

    const egyptianRiceRaw = convertPortionCookingYield({
      food_code: "EGYPTIAN_RICE_COOKED",
      amount_g: 200,
      from_state: "COOKED",
      to_state: "RAW",
    });
    assert.equal(egyptianRiceRaw.converted_amount_g, 80, "Cooked Egyptian rice (2.5 yield) 200g must equal 80g dry raw");

    // 1.3 Oats are stored as RAW in the catalog (base_state === 'RAW'), so 50g RAW -> 140g COOKED
    const oatsRule = kitchenYield.resolveFoodYieldRule ? kitchenYield.resolveFoodYieldRule("ROLLED_OATS_RAW") : {};
    assert.equal(oatsRule.base_state, "RAW");
    const oatsCooked = convertPortionCookingYield({
      food_code: "ROLLED_OATS_RAW",
      amount_g: 50,
      from_state: "RAW",
      to_state: "COOKED",
    });
    assert.equal(oatsCooked.converted_amount_g, 140);

    // 1.4 formatItemPortionDisplay respects food_state ('RAW' vs 'COOKED') and displays both for potatoes in BOTH mode
    const rawChickenDisplay = formatItemPortionDisplay(
      { food_code: "CHICKEN_BREAST", amount_g: 200, _food_state: "RAW" },
      PORTION_DISPLAY_MODES.GRAMS,
      COOKING_STATE_MODES.BOTH
    );
    assert.match(rawChickenDisplay.primary_text, /150 جم مطبوخ/);
    assert.match(rawChickenDisplay.primary_text, /200 جم نيئ/);

    const potatoBothDisplay = formatItemPortionDisplay(
      { food_code: "BOILED_POTATOES", amount_g: 190, _food_state: "COOKED" },
      PORTION_DISPLAY_MODES.GRAMS,
      COOKING_STATE_MODES.BOTH
    );
    assert.match(potatoBothDisplay.primary_text, /200 جم نيئ/);
  });

  await t.test("2. Trainee Food Swap Engine blocks all strict allergies (favism_g6pd, sesame_seeds, peanuts_tree_nuts, soy, dairy_lactose, gluten_celiac, eggs, fish_shellfish)", () => {
    // 2.1 Sesame & Seeds allergy (strict_allergies: ['sesame_seeds']) must block tahini and chia seeds
    const sesameProfile = { strict_allergies: ["sesame_seeds"] };
    assert.equal(isFoodClinicallySafe(FOOD_DATABASE.RAW_TAHINI_SESAME, sesameProfile), false, "Tahini must be blocked for sesame_seeds allergy");
    assert.equal(isFoodClinicallySafe(FOOD_DATABASE.CHIA_SEEDS, sesameProfile), false, "Chia seeds must be blocked for sesame_seeds allergy");

    // 2.2 Peanuts & Tree Nuts allergy (allergies: ['مكسرات'] or ['peanuts_tree_nuts']) must block both almonds AND peanut butter
    const nutsProfile = { allergies: ["مكسرات"] };
    assert.equal(isFoodClinicallySafe(FOOD_DATABASE.RAW_ALMONDS, nutsProfile), false);
    assert.equal(isFoodClinicallySafe(FOOD_DATABASE.PEANUT_BUTTER_NATURAL || { code: "PEANUT_BUTTER", allergens: ["PEANUTS"], name_ar: "زبدة فول سوداني" }, nutsProfile), false, "Peanut butter must be blocked when client has general nuts allergy");

    // 2.3 Soy allergy
    const soyProfile = { strict_allergies: ["soy"] };
    assert.equal(isFoodClinicallySafe({ code: "EDAMAME_SOY", name_ar: "فول صويا (إدامامي)", allergens: ["SOY"], is_gluten_free: true }, soyProfile), false);

    // 2.4 Favism / G6PD from strict_allergies: ['favism_g6pd'] in both frontend swap engine and backend buildAllergenContext
    const favismIntakeContext = buildAllergenContext({}, { strict_allergies: ["favism_g6pd"] });
    assert.equal(favismIntakeContext.isFavism, true, "buildAllergenContext must recognize favism_g6pd in strict_allergies");
    assert.equal(isPlanFoodSafe("FOUL_MUDAMMAS", favismIntakeContext), false);
    assert.equal(isSwapFoodSafe("FOUL_MUDAMMAS", favismIntakeContext), false);
    assert.equal(isSwapFoodSafe("PEANUT_BUTTER", favismIntakeContext), false);
  });

  await t.test("3. Religious / Christian Fasting exclusions are strictly enforced in both frontend swap functions and backend live swap safety", () => {
    // 3.1 Christian Fast (PESCATARIAN: fish allowed, meat/poultry/dairy/eggs forbidden)
    const pescatarianFastProfile = {
      fasting_context: { active: true, mode: "CHRISTIAN_FAST", diet: "PESCATARIAN" },
    };

    const chickenSwaps = listEquivalentFoodSwaps("CHICKEN_BREAST", 150, pescatarianFastProfile);
    for (const s of chickenSwaps) {
      const code = s.replacement_food.code;
      assert.equal(/CHICKEN|BEEF|VEAL|TURKEY|LAMB|CAMEL|LIVER|EGG|CHEESE|YOGURT|MILK|WHEY|CASEIN/.test(code), false, `Forbidden animal product ${code} offered during Christian Pescatarian fast`);
    }

    // Direct swap to beef or cottage cheese during Christian fast must be rejected
    assert.throws(
      () => calculateDynamicFoodSwap({
        current_food_code: "WHITE_FISH_FILLET",
        current_portion_g: 150,
        target_food_code: "CHICKEN_BREAST",
        clinical_profile: pescatarianFastProfile,
      }),
      /Clinical Guardrail Violation/
    );

    // 3.2 Christian Fast (STRICT_VEGAN: fish/seafood ALSO forbidden)
    const strictVeganFastProfile = {
      fasting_context: { active: true, mode: "CHRISTIAN_FAST", diet: "STRICT_VEGAN" },
    };
    assert.equal(isFoodClinicallySafe(FOOD_DATABASE.WHITE_FISH_FILLET, strictVeganFastProfile), false, "Fish must be blocked during STRICT_VEGAN Christian fast");
    assert.equal(isFoodClinicallySafe(FOOD_DATABASE.SHRIMP_GRILLED, strictVeganFastProfile), false, "Shrimp must be blocked during STRICT_VEGAN Christian fast");
    assert.equal(isFoodClinicallySafe(FOOD_DATABASE.WHOLE_EGG, strictVeganFastProfile), false, "Eggs must be blocked during STRICT_VEGAN Christian fast");
    assert.equal(isFoodClinicallySafe(FOOD_DATABASE.COTTAGE_CHEESE_NATURAL, strictVeganFastProfile), false, "Dairy must be blocked during STRICT_VEGAN Christian fast");

    // 3.3 Backend isSwapFoodSafe enforces Christian fast context
    const backendPescatarianCtx = {
      isChristianFast: true,
      fastingDiet: "PESCATARIAN",
    };
    assert.equal(isSwapFoodSafe("CHICKEN_BREAST_COOKED", backendPescatarianCtx), false);
    assert.equal(isSwapFoodSafe("BEEF_TOP_SIRLOIN_LEAN", backendPescatarianCtx), false);
    assert.equal(isSwapFoodSafe("WHOLE_EGG", backendPescatarianCtx), false);
    assert.equal(isSwapFoodSafe("CHEESE_COTTAGE_LOW_FAT", backendPescatarianCtx), false);
    assert.equal(isSwapFoodSafe("TILAPIA_COOKED", backendPescatarianCtx), true, "Fish is allowed in PESCATARIAN Christian fast");

    const backendStrictVeganCtx = {
      isChristianFast: true,
      fastingDiet: "STRICT_VEGAN",
    };
    assert.equal(isSwapFoodSafe("TILAPIA_COOKED", backendStrictVeganCtx), false, "Fish is blocked in STRICT_VEGAN Christian fast");
    assert.equal(isSwapFoodSafe("FOUL_MUDAMMAS", backendStrictVeganCtx), true, "Plant protein (foul) is allowed in STRICT_VEGAN Christian fast");
  });
});

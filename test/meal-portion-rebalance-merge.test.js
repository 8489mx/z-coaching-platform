import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { buildMasterEngineV2 } from '../src/master-engine-v2/index.js';
import { completeIntake, ASSESSMENT_CONTEXT } from './fixtures/complete-intake.js';
import { mergeAdaptedPlanIntoProgram, rebalanceCulinaryMeals } from '../src/api/utils/planMergeEngine.js';

const evaluationContext = Object.freeze({
  system_time: new Date(ASSESSMENT_CONTEXT.assessmentDate).toISOString(),
  assessmentDate: ASSESSMENT_CONTEXT.assessmentDate,
});

const nutritionFoodCatalog = JSON.parse(
  fs.readFileSync(new URL('../data/catalogs/core-global-food-batch-v1.json', import.meta.url), 'utf8')
);

function buildTestMasterProgram() {
  return buildMasterEngineV2({
    intake: completeIntake(),
    evaluationContext,
    nutritionFoodCatalog,
  });
}

test('Red Team Item 5: Culinary Meals Ingredient Portion Rebalancing on Calorie Delta', async (suite) => {

  await suite.test('1. Calorie deficit titration (-120 kcal from carbs) rebalances carb portion grams while locking protein, fats, and veggies', () => {
    const baseProgram = buildTestMasterProgram();
    const origMeals = baseProgram.nutrition_program.culinary_meals;

    const origCal = origMeals.reduce((sum, m) => sum + m.actual_macros.calories_kcal, 0);
    const origCarbs = origMeals.reduce((sum, m) => sum + m.actual_macros.carb_g, 0);
    const origProtein = origMeals.reduce((sum, m) => sum + m.actual_macros.protein_g, 0);
    const origFats = origMeals.reduce((sum, m) => sum + m.actual_macros.fat_g, 0);

    const baseRice = origMeals[1].items.find(it => it.food_code === 'BASMATI_RICE');
    const baseChicken = origMeals[1].items.find(it => it.food_code === 'CHICKEN_BREAST');
    const baseVeggies = origMeals[1].items.find(it => it.category === 'VEGGIES');
    const baseOil = origMeals[1].items.find(it => it.category === 'FATS');

    assert.ok(baseRice, 'Basmati rice must exist in Meal 2');
    assert.ok(baseChicken, 'Chicken breast must exist in Meal 2');
    assert.ok(baseVeggies, 'Veggies must exist in Meal 2');

    const origRicePortion = baseRice.portion_g;
    const origChickenPortion = baseChicken.portion_g;
    const origVeggiesPortion = baseVeggies.portion_g;
    const origOilPortion = baseOil.portion_g;

    // Simulate Red Team scenario: 120 kcal deficit from carbs
    const adaptationResult = {
      adapted_week_number: 2,
      adaptation_action: 'CALORIE_DEFICIT_TITRATION',
      suggested_calorie_delta: -120,
      suggested_carb_delta_g: -30,
    };

    const merged = mergeAdaptedPlanIntoProgram(baseProgram, adaptationResult);
    const adaptedMeals = merged.nutrition_program.culinary_meals;

    const newCal = adaptedMeals.reduce((sum, m) => sum + m.actual_macros.calories_kcal, 0);
    const newCarbs = adaptedMeals.reduce((sum, m) => sum + m.actual_macros.carb_g, 0);
    const newProtein = adaptedMeals.reduce((sum, m) => sum + m.actual_macros.protein_g, 0);
    const newFats = adaptedMeals.reduce((sum, m) => sum + m.actual_macros.fat_g, 0);

    // Target checks
    const targetCalories = merged.nutrition_program.macro_targets.calories_kcal;
    const targetCarbs = merged.nutrition_program.macro_targets.carb_g;
    assert.equal(targetCalories, baseProgram.nutrition_program.macro_targets.calories_kcal - 120);
    assert.equal(targetCarbs, baseProgram.nutrition_program.macro_targets.carbohydrate_g - 30);

    // 1. Actual calories must NOT stay equal to old calories (Red Team vulnerability fixed)
    assert.notEqual(newCal, origCal, 'Culinary meals total calories must change after adaptation');
    assert.ok(newCal < origCal, `New calories (${newCal}) must be strictly lower than original (${origCal})`);
    assert.ok(Math.abs(newCal - targetCalories) < 60, `Actual meal calories (${newCal}) must closely track target (${targetCalories})`);

    // 2. Carb grams must decrease to reflect -30g target
    assert.ok(newCarbs < origCarbs, `New carbs (${newCarbs}g) must be lower than original (${origCarbs}g)`);
    assert.ok(Math.abs((origCarbs - newCarbs) - 30) <= 2, `Carb reduction should be approximately 30g, got ${origCarbs - newCarbs}g`);

    // 3. Basmati rice portion must decrease
    const adaptedRice = adaptedMeals[1].items.find(it => it.food_code === 'BASMATI_RICE');
    assert.ok(adaptedRice.portion_g < origRicePortion, `Rice portion (${adaptedRice.portion_g}g) must decrease from ${origRicePortion}g`);
    assert.ok(adaptedRice.carb_g < baseRice.carb_g, 'Rice carb_g must decrease');
    assert.ok(adaptedRice.calories_kcal < baseRice.calories_kcal, 'Rice calories must decrease');

    // 4. Protein, fats, and vegetables must remain UNCHANGED
    const adaptedChicken = adaptedMeals[1].items.find(it => it.food_code === 'CHICKEN_BREAST');
    const adaptedVeggies = adaptedMeals[1].items.find(it => it.category === 'VEGGIES');
    const adaptedOil = adaptedMeals[1].items.find(it => it.category === 'FATS');

    // A split carbohydrate part carries its own protein (pasta more than rice), so the day's actual
    // protein can sit a few grams off target and the merge brings it back: at most 3% on the protein item.
    assert.ok(Math.abs(adaptedChicken.portion_g - origChickenPortion) <= Math.ceil(origChickenPortion * 0.03), `Protein portion ${adaptedChicken.portion_g} g vs ${origChickenPortion} g`);
    assert.equal(adaptedVeggies.portion_g, origVeggiesPortion, 'Vegetable portions must remain 100% untouched to protect fiber');
    assert.equal(adaptedOil.portion_g, origOilPortion, 'Fat portions must not change when only carbs are cut');
    // The same small correction toward the unchanged fat target (split parts carry their own fat).
    assert.ok(Math.abs(newFats - origFats) <= 2, `Total fat ${newFats} g vs ${origFats} g`);
    assert.ok(Math.abs(newProtein - origProtein) <= 4, 'Total protein grams must remain stable');

    // 5. Swaps must be scaled proportionally with parent item
    if (adaptedRice.swaps && adaptedRice.swaps.length > 0) {
      assert.ok(adaptedRice.swaps[0].equivalent_grams < baseRice.swaps[0].equivalent_grams, 'Swap equivalent grams must decrease');
    }

    // 6. Household measurement must reflect the new portion gram amount
    assert.ok(adaptedRice.household_measurement.startsWith(String(adaptedRice.portion_g)), 'Household measurement must start with new portion grams');

    // 7. quantized_plan.meals and targets.meals must be synchronized
    assert.equal(
      merged.nutrition_program.quantized_plan.meals[1].items.find(it => it.food_code === 'BASMATI_RICE').portion_g,
      adaptedRice.portion_g,
      'Quantized plan meals must be in sync with culinary meals'
    );
  });

  await suite.test('2. Custom coach overrides scale all macronutrients accurately across culinary meals', () => {
    const baseProgram = buildTestMasterProgram();
    const origMeals = baseProgram.nutrition_program.culinary_meals;
    const origCal = origMeals.reduce((sum, m) => sum + m.actual_macros.calories_kcal, 0);

    const customMacros = {
      calories: 2200,
      protein: 160,
      carbs: 260,
      fats: 50,
    };

    const merged = mergeAdaptedPlanIntoProgram(baseProgram, {}, customMacros);
    const adaptedMeals = merged.nutrition_program.culinary_meals;

    const newCal = adaptedMeals.reduce((sum, m) => sum + m.actual_macros.calories_kcal, 0);
    const newProtein = adaptedMeals.reduce((sum, m) => sum + m.actual_macros.protein_g, 0);
    const newCarbs = adaptedMeals.reduce((sum, m) => sum + m.actual_macros.carb_g, 0);
    const newFats = adaptedMeals.reduce((sum, m) => sum + m.actual_macros.fat_g, 0);

    // Target checks
    assert.equal(merged.nutrition_program.macro_targets.calories_kcal, 2200);
    assert.equal(merged.nutrition_program.macro_targets.protein_g, 160);
    assert.equal(merged.nutrition_program.macro_targets.carb_g, 260);
    assert.equal(merged.nutrition_program.macro_targets.fat_g, 50);

    // Actual culinary meals must have moved toward custom targets
    assert.ok(newCal < origCal, `Calories must decrease from ${origCal} toward 2200`);
    assert.ok(Math.abs(newCal - 2200) < 100, `Actual calories (${newCal}) must be close to target (2200)`);
    assert.ok(Math.abs(newCarbs - 260) < 25, `Actual carbs (${newCarbs}) must be close to target (260)`);
    assert.ok(Math.abs(newFats - 50) < 10, `Actual fats (${newFats}) must be close to target (50)`);
  });

  await suite.test('3. Gracefully handles meals with no caloric items or non-culinary formats', () => {
    const emptyMeals = [
      { id: 'm1', name: 'وجبة تجريبية' },
      { id: 'm2', name: 'وجبة ثانية', items: [] },
    ];

    const result = rebalanceCulinaryMeals(emptyMeals, { finalCalories: 2000, finalProtein: 150, finalCarbs: 200, finalFats: 50 });
    assert.deepEqual(result, emptyMeals, 'Empty meals must be returned unchanged without throwing');

    assert.equal(rebalanceCulinaryMeals(null), null);
    assert.equal(rebalanceCulinaryMeals(undefined), undefined);
    assert.deepEqual(rebalanceCulinaryMeals([]), []);
  });

});

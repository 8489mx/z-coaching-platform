import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCulinaryRecipeMeals, isFoodClinicallySafe } from '../src/nutrition-meal-context-v2/build-culinary-meals.js';

test('Culinary Meals Clinical Safety Suite: Legumes Restriction for Gout, Favism & Allergies', async (t) => {
  const universalTargets = {
    meal_distribution: [
      { meal_number: 1, meal_name: 'وجبة 1', protein_g: 35, carb_g: 60, fat_g: 15, calories_kcal: 515 },
      { meal_number: 2, meal_name: 'وجبة 2', protein_g: 45, carb_g: 75, fat_g: 20, calories_kcal: 660 },
      { meal_number: 3, meal_name: 'وجبة 3', protein_g: 40, carb_g: 65, fat_g: 15, calories_kcal: 555 }
    ]
  };

  await t.test('Case 1: Vegan client with GOUT strictly excludes MIXED_LEGUMES_STEW and legume swaps', () => {
    const intakeGout = {
      nutrition: { dietType: 'VEGAN' },
      medical: { conditions: [{ conditionCode: 'GOUT' }] }
    };

    const meals = buildCulinaryRecipeMeals(universalTargets, intakeGout);
    assert.equal(meals.length, 3);

    const foodCodes = meals.flatMap(m => m.items.map(i => i.food_code));
    assert.equal(foodCodes.includes('MIXED_LEGUMES_STEW'), false, 'Should not contain MIXED_LEGUMES_STEW for gout client');

    const swapCodes = meals.flatMap(m => m.items.flatMap(i => (i.swaps || []).map(s => s.food_code)));
    assert.equal(swapCodes.includes('MIXED_LEGUMES_STEW'), false, 'Should not have MIXED_LEGUMES_STEW in swaps');
    assert.equal(swapCodes.includes('FOUL_MUDAMMAS'), false, 'Should not have FOUL_MUDAMMAS in swaps for gout');
    assert.equal(swapCodes.includes('LUPINI_BEANS'), false, 'Should not have LUPINI_BEANS in swaps for gout');

    const json = JSON.stringify(meals);
    assert.equal(json.includes('بقوليات'), false, 'Plan text must not contain word بقوليات');
    assert.equal(json.includes('حمص'), false, 'Plan text must not contain word حمص');
    assert.equal(json.includes('عدس'), false, 'Plan text must not contain word عدس');
  });

  await t.test('Case 2: Vegan client with FAVISM (G6PD) strictly excludes legumes and fava beans', () => {
    const intakeFavism = {
      nutrition: { dietType: 'VEGAN', excludedFoodsList: ['FAVISM'] },
      medical: { conditions: [{ conditionCode: 'G6PD_DEFICIENCY' }] }
    };

    const meals = buildCulinaryRecipeMeals(universalTargets, intakeFavism);
    const foodCodes = meals.flatMap(m => m.items.map(i => i.food_code));
    assert.equal(foodCodes.includes('MIXED_LEGUMES_STEW'), false, 'Should not contain MIXED_LEGUMES_STEW for favism');

    const swapCodes = meals.flatMap(m => m.items.flatMap(i => (i.swaps || []).map(s => s.food_code)));
    assert.equal(swapCodes.includes('FOUL_MUDAMMAS'), false, 'Should not have fava beans in swaps for favism');
  });

  await t.test('Case 3: Vegan client with explicit LEGUMES exclusion strictly receives legume-free meals', () => {
    const intakeLegumes = {
      nutrition: { dietType: 'VEGAN', excludedFoodsList: ['LEGUMES'] }
    };

    const meals = buildCulinaryRecipeMeals(universalTargets, intakeLegumes);
    const foodCodes = meals.flatMap(m => m.items.map(i => i.food_code));
    assert.equal(foodCodes.includes('MIXED_LEGUMES_STEW'), false);
  });

  await t.test('Case 4: Regular Vegan client without gout or legume restrictions receives balanced legume stew', () => {
    const intakeRegular = {
      nutrition: { dietType: 'VEGAN' },
      medical: { conditions: [] }
    };

    const meals = buildCulinaryRecipeMeals(universalTargets, intakeRegular);
    const foodCodes = meals.flatMap(m => m.items.map(i => i.food_code));
    assert.equal(foodCodes.includes('MIXED_LEGUMES_STEW'), true, 'Regular vegan receives legume stew');
  });

  await t.test('Case 5: isFoodClinicallySafe helper accurately blocks unsafe foods across all clinical flags', () => {
    assert.equal(isFoodClinicallySafe('MIXED_LEGUMES_STEW', { isGout: true }), false);
    assert.equal(isFoodClinicallySafe('MIXED_LEGUMES_STEW', { isLegumesExcluded: true }), false);
    assert.equal(isFoodClinicallySafe('FOUL_MUDAMMAS', { isFavism: true }), false);
    assert.equal(isFoodClinicallySafe('LUPINI_BEANS', { isGout: true }), false);
    assert.equal(isFoodClinicallySafe('BASMATI_RICE', { isGout: true, isVegan: true }), true);
    assert.equal(isFoodClinicallySafe('PEA_RICE_PROTEIN_POWDER', { isGout: true, isVegan: true }), true);
  });

  await t.test('Case 6: 5-meal bariatric client with GOUT strictly excludes canned tuna snack and uses chicken breast', () => {
    const targets5 = {
      meal_distribution: [
        { meal_number: 1, meal_name: 'وجبة 1' },
        { meal_number: 2, meal_name: 'وجبة 2' },
        { meal_number: 3, meal_name: 'وجبة 3' },
        { meal_number: 4, meal_name: 'وجبة 4' },
        { meal_number: 5, meal_name: 'وجبة 5' },
      ],
      target_calories: 2000,
      protein_g: 140,
      carb_g: 220,
      fat_g: 50,
    };
    const intakeGout5 = {
      medical: { conditions: [{ conditionCode: 'GOUT' }] },
      nutrition: { dietType: 'STANDARD' },
    };
    const meals = buildCulinaryRecipeMeals(targets5, intakeGout5);
    const foodCodes = meals.flatMap(m => m.items.map(i => i.food_code));
    assert.equal(foodCodes.includes('CANNED_TUNA'), false, 'Gout client in 5-meal plan must not receive canned tuna');
    assert.ok(foodCodes.includes('CHICKEN_BREAST'), 'Gout client in 5-meal plan safely receives chicken breast snack');
  });

  await t.test('Case 7: Economic dinner for GOUT client strictly excludes canned tuna', () => {
    const targetsLowBudget = {
      meal_distribution: [
        { meal_number: 1, meal_name: 'وجبة 1' },
        { meal_number: 2, meal_name: 'وجبة 2' },
        { meal_number: 3, meal_name: 'وجبة 3' },
      ],
      target_calories: 2400,
      protein_g: 160,
      carb_g: 280,
      fat_g: 65,
    };
    const intakeLowBudgetGout = {
      medical: { conditions: [{ conditionCode: 'GOUT' }] },
      nutrition: { budget: 'LOW' },
    };
    const meals = buildCulinaryRecipeMeals(targetsLowBudget, intakeLowBudgetGout);
    const foodCodes = meals.flatMap(m => m.items.map(i => i.food_code));
    assert.equal(foodCodes.includes('CANNED_TUNA'), false, 'Gout client on low budget must not receive canned tuna in dinner');
  });
});

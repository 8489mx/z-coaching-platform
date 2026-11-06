import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isLevothyroxineMedicationList } from '../src/execution-engines/drug-interaction-firewall.js';
import {
  buildAllergenContext,
  buildCulinaryRecipeMeals,
  generateSmartSwaps,
  isFoodClinicallySafe,
} from '../src/nutrition-meal-context-v2/build-culinary-meals.js';
import { isSwapFoodSafe } from '../src/api/services/liveFoodSwapSafety.js';
import { evaluateIntake } from 'z-coaching-intake-decision-engine';
import { buildNutritionEnergyTarget } from 'z-coaching-intake-decision-engine/nutrition-energy-target';
import { buildNutritionFoodCatalog } from 'z-coaching-intake-decision-engine/nutrition-food-catalog';
import * as foodSelectionApi from 'z-coaching-intake-decision-engine/nutrition-food-selection';
import { buildNutritionMacroTargets } from 'z-coaching-intake-decision-engine/nutrition-macro-targets';
import { buildNutritionMealAssemblyBlueprint } from 'z-coaching-intake-decision-engine/nutrition-meal-assembly-blueprint';
import { buildNutritionMealDistribution } from 'z-coaching-intake-decision-engine/nutrition-meal-distribution';
import { buildNutritionPlanningSnapshot } from 'z-coaching-intake-decision-engine/nutrition-planning-snapshot';

const { buildNutritionFoodSelection, NutritionFoodSelectionStatus } = foodSelectionApi;

function readJson(url) {
  return JSON.parse(readFileSync(url, 'utf8'));
}

// A food is dairy when the culinary database says so, or when its code names a
// dairy food the same way the longitudinal harness detects it.
const DAIRY_CODE = /YOGURT|CHEESE|MILK|DAIRY|LABNEH|LABAN|HALLOUMI|MOZZARELLA|COTTAGE_CHEESE|WHEY|GHEE|BUTTER/;
const isDairyCode = (code) => DAIRY_CODE.test(String(code || '').toUpperCase());

const breakfastOf = (meals) => meals.find((m) => (m.meal_number || 0) === 1) || meals[0];
const breakfastCodes = (meals) => breakfastOf(meals).items.map((i) => i.food_code);
const breakfastSwapCodes = (meals) =>
  breakfastOf(meals).items.flatMap((i) => (i.swaps || []).map((s) => s.food_code));

const STANDARD_TARGETS = {
  meal_distribution: [
    { meal_number: 1, meal_name: 'وجبة 1', protein_g: 35, carb_g: 60, fat_g: 15, calories_kcal: 515 },
    { meal_number: 2, meal_name: 'وجبة 2', protein_g: 45, carb_g: 75, fat_g: 20, calories_kcal: 660 },
    { meal_number: 3, meal_name: 'وجبة 3', protein_g: 40, carb_g: 65, fat_g: 15, calories_kcal: 555 },
  ],
};

test('Levothyroxine breakfast dairy lock: detector matches the drug under every name the firewall knows', () => {
  assert.equal(isLevothyroxineMedicationList(['EUTHYROX']), true);
  assert.equal(isLevothyroxineMedicationList(['Euthyrox 50']), true);
  assert.equal(isLevothyroxineMedicationList(['Levothyroxine 100mcg']), true);
  assert.equal(isLevothyroxineMedicationList(['ELTROXIN']), true);
  assert.equal(isLevothyroxineMedicationList(['THYROXINE']), true);
  assert.equal(isLevothyroxineMedicationList(['METFORMIN', 'EUTHYROX']), true);
  assert.equal(isLevothyroxineMedicationList(['METFORMIN']), false);
  assert.equal(isLevothyroxineMedicationList([]), false);
  assert.equal(isLevothyroxineMedicationList(['NONE']), false);
  assert.equal(isLevothyroxineMedicationList(null), false);
  assert.equal(isLevothyroxineMedicationList(undefined), false);
});

test('Levothyroxine breakfast dairy lock: buildAllergenContext detects the drug from every intake source', () => {
  // Canonical medical.medications (the adapter normalises the meds list into it).
  const fromCanonical = buildAllergenContext({
    nutrition: {},
    medical: { conditions: [{ conditionCode: 'THYROID_CONDITION' }], medications: ['EUTHYROX'] },
  });
  assert.equal(fromCanonical.isLevothyroxineBreakfastDairyLocked, true);

  // Raw intake list (the form's current_meds_supplements_list).
  const fromRawList = buildAllergenContext(
    { nutrition: {}, medical: { conditions: [{ conditionCode: 'THYROID_CONDITION' }] } },
    { current_meds_supplements_list: ['Euthyrox 50'] },
  );
  assert.equal(fromRawList.isLevothyroxineBreakfastDairyLocked, true);

  // Raw intake free text (the form's current_meds_supplements string).
  const fromRawText = buildAllergenContext(
    { nutrition: {}, medical: { conditions: [{ conditionCode: 'THYROID_CONDITION' }] } },
    { current_meds_supplements: 'Euthyrox, vitamin D' },
  );
  assert.equal(fromRawText.isLevothyroxineBreakfastDairyLocked, true);

  // Thyroid condition alone, with no levothyroxine on file, does NOT lock:
  // the lock follows the drug, not the diagnosis.
  const conditionOnly = buildAllergenContext({
    nutrition: {},
    medical: { conditions: [{ conditionCode: 'THYROID_CONDITION' }], medications: [] },
  });
  assert.equal(conditionOnly.isLevothyroxineBreakfastDairyLocked, false);

  // No meds at all: no lock.
  const noMeds = buildAllergenContext({ nutrition: {}, medical: { conditions: [] } }, {});
  assert.equal(noMeds.isLevothyroxineBreakfastDairyLocked, false);
});

test('Levothyroxine breakfast dairy lock: isFoodClinicallySafe refuses dairy at breakfast only', () => {
  const locked = { isLevothyroxineBreakfastDairyLocked: true };
  for (const dairy of ['COTTAGE_CHEESE', 'SKIM_MILK', 'HALLOUMI_LIGHT', 'WHEY_PROTEIN', 'GREEK_YOGURT', 'LABNEH_LIGHT']) {
    assert.equal(isFoodClinicallySafe(dairy, locked, 'BREAKFAST'), false, `${dairy} must be refused at breakfast when locked`);
    assert.equal(isFoodClinicallySafe(dairy, locked, 'LUNCH'), true, `${dairy} stays allowed at lunch when locked`);
    assert.equal(isFoodClinicallySafe(dairy, locked, 'DINNER'), true, `${dairy} stays allowed at dinner when locked`);
    // No meal context means the old behaviour: dairy is not refused.
    assert.equal(isFoodClinicallySafe(dairy, locked), true, `${dairy} without a meal context keeps the old behaviour`);
  }
  // Non-dairy breakfast foods are untouched by the lock.
  assert.equal(isFoodClinicallySafe('CHICKEN_BREAST', locked, 'BREAKFAST'), true);
  assert.equal(isFoodClinicallySafe('EGGS_OMELETTE', locked, 'BREAKFAST'), true);
  // No lock: breakfast dairy stays allowed.
  assert.equal(isFoodClinicallySafe('COTTAGE_CHEESE', {}, 'BREAKFAST'), true);
  assert.equal(isFoodClinicallySafe('COTTAGE_CHEESE', { isLevothyroxineBreakfastDairyLocked: false }, 'BREAKFAST'), true);
});

test('Levothyroxine breakfast dairy lock: breakfast swaps never offer dairy when locked', () => {
  const locked = { isLevothyroxineBreakfastDairyLocked: true };
  const breakfastSwaps = generateSmartSwaps('PROTEIN', 100, 'EGGS_OMELETTE', 'BREAKFAST', 0, locked);
  const breakfastSwapCodes = breakfastSwaps.map((s) => s.food_code);
  assert.equal(
    breakfastSwapCodes.some(isDairyCode),
    false,
    `Breakfast swaps must contain no dairy when locked, got: ${breakfastSwapCodes.join(', ')}`,
  );

  // The same call at lunch is unchanged by the lock: dairy may still be offered.
  const lunchSwaps = generateSmartSwaps('PROTEIN', 100, 'EGGS_OMELETTE', 'LUNCH', 0, locked);
  const lunchNoLock = generateSmartSwaps('PROTEIN', 100, 'EGGS_OMELETTE', 'LUNCH', 0, {});
  assert.deepEqual(
    lunchSwaps.map((s) => s.food_code),
    lunchNoLock.map((s) => s.food_code),
    'Lunch swaps are identical with and without the lock',
  );
});

test('Levothyroxine breakfast dairy lock: served breakfast has no dairy food and no dairy swap', () => {
  const lockedIntake = {
    nutrition: { dietType: 'STANDARD' },
    medical: { conditions: [{ conditionCode: 'THYROID_CONDITION' }], medications: ['EUTHYROX'] },
  };
  const controlIntake = {
    nutrition: { dietType: 'STANDARD' },
    medical: { conditions: [{ conditionCode: 'THYROID_CONDITION' }], medications: [] },
  };

  // The control proves the test discriminates: without the drug, this same
  // intake IS served dairy at breakfast (the original bug).
  const controlMeals = buildCulinaryRecipeMeals(STANDARD_TARGETS, controlIntake);
  assert.equal(
    breakfastCodes(controlMeals).some(isDairyCode),
    true,
    `Control breakfast must serve dairy (otherwise the test proves nothing), got: ${breakfastCodes(controlMeals).join(', ')}`,
  );

  const lockedMeals = buildCulinaryRecipeMeals(STANDARD_TARGETS, lockedIntake);
  assert.equal(
    breakfastCodes(lockedMeals).some(isDairyCode),
    false,
    `Locked breakfast must serve no dairy, got: ${breakfastCodes(lockedMeals).join(', ')}`,
  );
  assert.equal(
    breakfastSwapCodes(lockedMeals).some(isDairyCode),
    false,
    `Locked breakfast swaps must offer no dairy, got: ${breakfastSwapCodes(lockedMeals).join(', ')}`,
  );

  // The lock is breakfast-scoped, not an all-day dairy ban: lunch or dinner
  // still serve dairy exactly when the control does.
  const controlOtherDairy = controlMeals.slice(1).flatMap((m) => m.items.map((i) => i.food_code)).some(isDairyCode);
  const lockedOtherDairy = lockedMeals.slice(1).flatMap((m) => m.items.map((i) => i.food_code)).some(isDairyCode);
  assert.equal(lockedOtherDairy, controlOtherDairy, 'Dairy outside breakfast is unchanged by the lock');
});

test('Levothyroxine breakfast dairy lock: the protein top-up covers the small remainder the cheese would have filled', () => {
  // L13 week-6 regeneration targets: breakfast P33 with only eggs, salad
  // and bread on the plate leaves about 5 g of protein unfilled — below
  // the chicken top-up's old 6 g threshold, so the meal landed 4 g short.
  const regenTargets = {
    meal_distribution: [
      { meal_number: 1, meal_name: 'وجبة 1', protein_g: 33, carb_g: 80, fat_g: 14, calories_kcal: 581 },
      { meal_number: 2, meal_name: 'وجبة 2', protein_g: 45, carb_g: 75, fat_g: 20, calories_kcal: 660 },
      { meal_number: 3, meal_name: 'وجبة 3', protein_g: 40, carb_g: 65, fat_g: 15, calories_kcal: 555 },
    ],
  };
  const lockedIntake = {
    nutrition: { dietType: 'STANDARD' },
    medical: { conditions: [{ conditionCode: 'THYROID_CONDITION' }], medications: ['EUTHYROX'] },
  };
  const lockedMeals = buildCulinaryRecipeMeals(regenTargets, lockedIntake);
  const breakfast = breakfastOf(lockedMeals);
  assert.equal(
    breakfastCodes(lockedMeals).some(isDairyCode),
    false,
    'Locked regen breakfast must serve no dairy',
  );
  assert.ok(
    breakfast.actual_macros.protein_g >= breakfast.target_macros.protein_g - 1,
    `Locked regen breakfast must still hit its protein target (target ${breakfast.target_macros.protein_g}g, actual ${breakfast.actual_macros.protein_g}g)`,
  );
});

test('Levothyroxine breakfast dairy lock: live swap endpoint refuses dairy at breakfast only', () => {
  const locked = { isLevothyroxineBreakfastDairyLocked: true };
  for (const dairy of ['HALLOUMI_LIGHT', 'COTTAGE_CHEESE', 'GREEK_YOGURT']) {
    assert.equal(isSwapFoodSafe(dairy, locked, 100, 'BREAKFAST'), false, `${dairy} must be refused as a breakfast swap when locked`);
    assert.equal(isSwapFoodSafe(dairy, locked, 100, 'MAIN_MEAL'), true, `${dairy} stays allowed as a main-meal swap when locked`);
  }
  assert.equal(isSwapFoodSafe('HALLOUMI_LIGHT', {}, 100, 'BREAKFAST'), true, 'No lock: breakfast dairy swap stays allowed');
  assert.equal(isSwapFoodSafe('CHICKEN_BREAST_COOKED', locked, 100, 'BREAKFAST'), true, 'Non-dairy breakfast swap is untouched');
});

function buildRealPipelineSelection(intake) {
  const evaluationContext = readJson(new URL('../examples/evaluation-context.json', import.meta.url));
  const nutritionFoodCatalog = readJson(
    new URL('../data/catalogs/core-global-food-batch-v1.json', import.meta.url),
  );
  const intakeDecision = evaluateIntake(intake, evaluationContext);
  const nutritionPlanningSnapshot = buildNutritionPlanningSnapshot({
    intake,
    evaluationContext,
    intakeDecision,
  });
  const nutritionEnergyTarget = buildNutritionEnergyTarget(nutritionPlanningSnapshot);
  const nutritionMacroTargets = buildNutritionMacroTargets({
    nutritionPlanningSnapshot,
    nutritionEnergyTarget,
  });
  const nutritionMealDistribution = buildNutritionMealDistribution({
    nutritionPlanningSnapshot,
    nutritionMacroTargets,
  });
  const nutritionMealAssemblyBlueprint = buildNutritionMealAssemblyBlueprint({
    nutritionPlanningSnapshot,
    nutritionMealDistribution,
  });
  const selection = buildNutritionFoodSelection({
    nutritionPlanningSnapshot,
    nutritionMealAssemblyBlueprint,
    nutritionFoodCatalog,
  });
  return { snapshot: nutritionPlanningSnapshot, selection };
}

test('Levothyroxine breakfast dairy lock: snapshot carries the lock and food selection keeps dairy out of breakfast', () => {
  const baseIntake = readJson(new URL('../examples/full-intake.json', import.meta.url));
  // The example intake carries a mild lactose intolerance, which would hide
  // dairy from breakfast on its own: clear it so the lock is what decides.
  const clearLactose = (intake) => {
    const copy = structuredClone(intake);
    copy.nutrition.intolerances = [];
    return copy;
  };
  const catalog = readJson(new URL('../data/catalogs/core-global-food-batch-v1.json', import.meta.url));
  const foodClassByCode = new Map((catalog.items || catalog || []).map((item) => [item.food_code, item.food_class]));

  const control = buildRealPipelineSelection(clearLactose(baseIntake));
  assert.equal(control.snapshot.clinical_flags?.levothyroxine_breakfast_dairy_lock, false);
  const controlBreakfast = control.selection.meals.find((m) => m.selected_pattern_code === 'BREAKFAST_SAVORY');
  assert.ok(controlBreakfast, 'Control run must select a breakfast pattern');
  // The control breakfast anchors on egg, so the lock is proven through the
  // rejection list, not through a changed selection: with no lock, no dairy
  // food is rejected from the breakfast anchor slot at all.
  const controlRejectedDairy = controlBreakfast.slots
    .flatMap((s) => s.rejected_foods || [])
    .filter((f) => foodClassByCode.get(f.food_code) === 'DAIRY_PROTEIN');
  assert.equal(controlRejectedDairy.length, 0, 'Control breakfast must reject no dairy food');

  const lockedIntake = clearLactose(baseIntake);
  lockedIntake.medical.medications = ['EUTHYROX'];
  const locked = buildRealPipelineSelection(lockedIntake);
  assert.equal(locked.snapshot.clinical_flags?.levothyroxine_breakfast_dairy_lock, true);
  // The medication itself puts the first plan under coach review (pre-existing
  // intake-decision behaviour: any reported medication needs a human look),
  // so the selection is PROVISIONAL, not READY — but every required slot is
  // still filled, so the lock did not break the plan.
  assert.equal(locked.selection.status, NutritionFoodSelectionStatus.PROVISIONAL_REVIEW_REQUIRED);
  for (const meal of locked.selection.meals) {
    for (const slot of meal.slots) {
      if (slot.requirement === 'REQUIRED') {
        assert.ok(
          slot.selected_food_codes.length >= slot.min_items,
          `${meal.selected_pattern_code}/${slot.slot} must meet its minimum despite the lock`,
        );
      }
    }
  }
  const lockedBreakfast = locked.selection.meals.find((m) => m.selected_pattern_code === 'BREAKFAST_SAVORY');
  assert.ok(lockedBreakfast, 'Locked run must still select a breakfast pattern');
  const lockedBreakfastClasses = lockedBreakfast.slots.flatMap((s) => s.selected_food_codes).map((code) => foodClassByCode.get(code));
  assert.equal(
    lockedBreakfastClasses.includes('DAIRY_PROTEIN'),
    false,
    `Locked breakfast must select no dairy food, got classes: ${lockedBreakfastClasses.join(', ')}`,
  );
  // Every dairy candidate for the breakfast anchor is now rejected, with the
  // medical reason recorded — the lock is visible in the output, not silent.
  const lockedRejectedDairy = lockedBreakfast.slots
    .flatMap((s) => s.rejected_foods || [])
    .filter((f) => foodClassByCode.get(f.food_code) === 'DAIRY_PROTEIN');
  assert.deepEqual(
    lockedRejectedDairy.map((f) => f.food_code).sort(),
    ['COTTAGE_CHEESE_LOW_FAT_2_PERCENT', 'GREEK_YOGURT_PLAIN_NONFAT', 'SKIM_MILK', 'YOGURT_PLAIN_LOW_FAT'],
    'All four breakfast dairy candidates must be rejected when locked',
  );
  assert.ok(
    lockedRejectedDairy.every((f) => (f.reason_codes || []).includes('MEDICAL_EXCLUDED')),
    `Rejected dairy must carry MEDICAL_EXCLUDED, got: ${JSON.stringify(lockedRejectedDairy)}`,
  );
  // The lock is breakfast-scoped: the main meal rejects no dairy food for it.
  const lockedMain = locked.selection.meals.find((m) => m.selected_pattern_code === 'MAIN_CLASSIC');
  const mainRejectedDairy = (lockedMain?.slots || [])
    .flatMap((s) => s.rejected_foods || [])
    .filter((f) => foodClassByCode.get(f.food_code) === 'DAIRY_PROTEIN' && (f.reason_codes || []).includes('MEDICAL_EXCLUDED'));
  assert.equal(mainRejectedDairy.length, 0, 'The main meal must reject no dairy food for the lock');
});

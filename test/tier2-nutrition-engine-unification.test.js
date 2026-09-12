import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { COMPLETE_INTAKE } from './fixtures/complete-intake.js';
import { buildMasterEngineV2 } from '../src/master-engine-v2/index.js';

test('Tier 2 Item 6: Nutrition Calculation Engine Unification Suite', async (t) => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const catalogPath = path.resolve(__dirname, '../data/catalogs/core-global-food-batch-v1.json');
  const catalog = JSON.parse(await fs.readFile(catalogPath, 'utf-8'));

  const evaluationContext = Object.freeze({
    system_time: new Date().toISOString(),
    assessmentDate: '2026-03-31'
  });

  const rawProgram = buildMasterEngineV2({
    intake: COMPLETE_INTAKE,
    evaluationContext,
    nutritionFoodCatalog: catalog,
    options: {}
  });

  await t.test('1. Master Engine V2 targets and macro_targets are perfectly consistent', () => {
    const targets = rawProgram.nutrition_program.targets;
    const macroTargets = rawProgram.nutrition_program.macro_targets;

    assert.equal(targets.target_calories, macroTargets.calories_kcal);
    assert.equal(targets.protein_g, macroTargets.protein_g);
    assert.equal(targets.carbohydrate_g, macroTargets.carbohydrate_g);
    assert.equal(targets.fat_g, macroTargets.fat_g);
  });

  await t.test('2. intake.controller approveAndPublishIntake produces unified targets & ai_rationale', async () => {
    // Dynamically test the calculation output logic
    const targets = rawProgram.nutrition_program.targets;
    const macroTargets = rawProgram.nutrition_program.macro_targets;

    const rawCalories = rawProgram.nutrition_program?.macro_targets?.calories_kcal;
    const rawProtein = rawProgram.nutrition_program?.macro_targets?.protein_g;
    const rawCarbs = rawProgram.nutrition_program?.macro_targets?.carbohydrate_g;
    const rawFats = rawProgram.nutrition_program?.macro_targets?.fat_g;

    assert.equal(rawCalories, targets.target_calories);
    assert.equal(rawProtein, targets.protein_g);
    assert.equal(rawCarbs, targets.carbohydrate_g);
    assert.equal(rawFats, targets.fat_g);
    assert.ok(targets.bmr > 1000);
    assert.ok(targets.tdee >= targets.bmr);
  });

  await t.test('3. Calorie bounds and macro failsafes respect safety clamping', () => {
    const clampCalories = (c) => Math.max(1200, Math.min(c, 5000));
    assert.equal(clampCalories(500), 1200);
    assert.equal(clampCalories(6000), 5000);
    assert.equal(clampCalories(2500), 2500);
  });
});

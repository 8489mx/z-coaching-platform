import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  unwrapIntakeAnswers,
  auditIntakeClinicalAndBiomechanicalSafety
} from '../src/execution-engines/intake-preflight-engine.js';

const EMOJI_REGEX = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/u;

test('Phase 8: Intake Preflight & Biomechanical Plan Automation Suite', async (suite) => {

  await suite.test('1. Biomechanical Swaps for Lower Back: Excludes axial loading and suggests chest-supported & hip thrust alternatives', () => {
    const intakeWithBackInjury = {
      personal: { age: 30, sex: 'MALE' },
      body: { weightKg: 85, heightCm: 180 },
      primary_goal: 'fat_loss',
      training_environment: 'commercial_gym',
      injuries_map: {
        has_injuries: true,
        selected_areas: ['spine_back']
      }
    };

    const audit = auditIntakeClinicalAndBiomechanicalSafety(intakeWithBackInjury);

    assert.equal(audit.has_injuries, true);
    assert.ok(audit.joint_restrictions.some(r => r.joint.includes('الظهر')));
    assert.ok(audit.exercise_swaps.some(s => s.contraindicated.includes('Back Squat') && s.safe_alternative.includes('Leg Press')));
    assert.ok(audit.exercise_swaps.some(s => s.contraindicated.includes('Deadlift') && s.safe_alternative.includes('Hip Thrust')));
    assert.ok(audit.exercise_swaps.some(s => s.contraindicated.includes('Row') && s.safe_alternative.includes('Chest-Supported')));
  });

  await suite.test('2. Biomechanical Swaps for Shoulder & Knee: Excludes overhead/bench pressing and shear lunges', () => {
    const intakeWithShoulderAndKnee = {
      personal: { age: 26, sex: 'MALE' },
      body: { weightKg: 78, heightCm: 175 },
      primary_goal: 'recomposition',
      training_environment: 'commercial_gym',
      injuries_map: {
        has_injuries: true,
        selected_areas: ['shoulder', 'knee']
      }
    };

    const audit = auditIntakeClinicalAndBiomechanicalSafety(intakeWithShoulderAndKnee);

    assert.equal(audit.has_injuries, true);
    // Shoulder swaps
    assert.ok(audit.exercise_swaps.some(s => s.contraindicated.includes('Barbell Bench Press')));
    assert.ok(audit.exercise_swaps.some(s => s.contraindicated.includes('Overhead Barbell Press') && s.safe_alternative.includes('Rotator Cuff')));
    // Knee swaps
    assert.ok(audit.exercise_swaps.some(s => s.contraindicated.includes('Walking Lunges')));
  });

  await suite.test('3. Clinical Nutrition Guard: Diabetic carb ceiling (<=45%) and Hypertension Zone 2 directives', () => {
    const diabeticIntake = {
      personal: { age: 45, sex: 'MALE' },
      body: { weightKg: 95, heightCm: 175 },
      primary_goal: 'fat_loss',
      neat_level: 'sedentary',
      medical_conditions: {
        selected: ['diabetes', 'hypertension']
      }
    };

    const audit = auditIntakeClinicalAndBiomechanicalSafety(diabeticIntake);

    assert.equal(audit.has_medical_conditions, true);
    // Carb calories <= 45% of total calories
    const carbKcal = audit.targets.carbs_g * 4;
    const carbShare = carbKcal / audit.targets.calories;
    assert.ok(carbShare <= 0.455, `Diabetic carb share must not exceed 45% (got ${carbShare})`);

    // Hypertension warnings
    assert.ok(audit.clinical_alerts.some(a => a.includes('ضغط دم')));
  });

  await suite.test('4. Fasting & Allergies Integration: Identifies strict vegan coptic fasting and allergen removals', () => {
    const copticIntake = {
      personal: { age: 28, sex: 'FEMALE' },
      body: { weightKg: 62, heightCm: 165 },
      religion: 'CHRISTIAN',
      christianFastingStyle: 'STRICT_VEGAN',
      strict_allergies: ['dairy_lactose', 'peanuts_tree_nuts']
    };

    const audit = auditIntakeClinicalAndBiomechanicalSafety(copticIntake);

    assert.ok(audit.fasting_mode.includes('صيام مسيحي نباتي صرف'));
    assert.ok(audit.strict_allergies.includes('الألبان والأجبان واللاكتوز'));
    assert.ok(audit.strict_allergies.includes('الفول السوداني والمكسرات'));
  });

  await suite.test('5. Zero Emojis Compliance: Preflight engine outputs strictly clean Arabic text without emojis', () => {
    const sample = auditIntakeClinicalAndBiomechanicalSafety({
      personal: { age: 30, sex: 'MALE' },
      body: { weightKg: 80, heightCm: 175 },
      primary_goal: 'fat_loss',
      medical_conditions: { selected: ['diabetes', 'gout', 'asthma'] },
      injuries_map: { has_injuries: true, selected_areas: ['knee', 'spine_back', 'shoulder'] },
      strict_allergies: ['dairy_lactose', 'gluten_celiac']
    });

    const fullText = JSON.stringify(sample);
    assert.equal(EMOJI_REGEX.test(fullText), false, 'Preflight output must contain zero emojis');
  });

  await suite.test('6. UI Code Integrations: Preflight Modal, Submissions CTA, Editor Draft Generator', () => {
    // 1. IntakeAuditDetailModal renders preflight shield
    const modalSrc = fs.readFileSync('frontend/src/components/intake/IntakeAuditDetailModal.jsx', 'utf8');
    assert.ok(modalSrc.includes('auditIntakeClinicalAndBiomechanicalSafety'), 'Modal must import preflight engine');
    assert.ok(modalSrc.includes('لوحة الفحص والتدقيق السريري والحركي المسبق'), 'Modal must render Preflight Shield');
    assert.equal(EMOJI_REGEX.test(modalSrc), false, 'Modal must contain zero emojis');

    // 2. IntakeSubmissions has 1-click generation CTA
    const submissionsSrc = fs.readFileSync('frontend/src/pages/IntakeSubmissions.jsx', 'utf8');
    assert.ok(submissionsSrc.includes('handleGenerateDraft'), 'Submissions must define handleGenerateDraft');
    assert.ok(submissionsSrc.includes('توليد الخطة'), 'Submissions must display generation action');
    assert.equal(EMOJI_REGEX.test(submissionsSrc), false, 'Submissions must contain zero emojis');

    // 3. CoachEditor and useCoachEditorData have 1-click pending intake banner
    const editorDataSrc = fs.readFileSync('frontend/src/pages/CoachEditor/hooks/useCoachEditorData.js', 'utf8');
    assert.ok(editorDataSrc.includes('handleGenerateDraftFromIntake'), 'Editor hook must expose handleGenerateDraftFromIntake');
    assert.ok(editorDataSrc.includes('pendingIntake'), 'Editor hook must track pendingIntake');

    const editorSrc = fs.readFileSync('frontend/src/pages/CoachEditor.jsx', 'utf8');
    assert.ok(editorSrc.includes('editor.pendingIntake'), 'Editor view must render pendingIntake banner');
    assert.equal(EMOJI_REGEX.test(editorSrc), false, 'Editor view must contain zero emojis');
  });

});

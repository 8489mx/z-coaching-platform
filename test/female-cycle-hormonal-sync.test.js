import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  estimateCyclePhase,
  evaluateFemaleCycleBuffer,
  CYCLE_PHASES
} from '../src/execution-engines/female-cycle-buffer-engine.js';
import {
  evaluateCheckin
} from '../src/checkin-engine/evaluate-checkin.js';
import {
  CheckinAnalysisStatus
} from '../src/checkin-engine/domain/enums.js';
import {
  buildAdaptedPlan
} from '../src/adaptation-engine/index.js';
import {
  buildMasterEngineV2
} from '../src/master-engine-v2/index.js';
import { completeIntake, ASSESSMENT_CONTEXT } from './fixtures/complete-intake.js';

const evaluationContext = Object.freeze({
  system_time: new Date(ASSESSMENT_CONTEXT.assessmentDate).toISOString(),
  assessmentDate: ASSESSMENT_CONTEXT.assessmentDate,
});

const nutritionFoodCatalog = JSON.parse(
  fs.readFileSync(new URL('../data/catalogs/core-global-food-batch-v1.json', import.meta.url), 'utf8')
);

function buildTestFemaleProgram() {
  const intake = completeIntake();
  const femaleIntake = {
    ...intake,
    personal: {
      ...intake.personal,
      sex: 'FEMALE'
    },
    body: {
      ...intake.body,
      weightKg: 68
    }
  };
  return buildMasterEngineV2({
    intake: femaleIntake,
    evaluationContext,
    nutritionFoodCatalog,
  });
}

test('Milestone 5: Female Cycle Hormonal Sync Engine Suite', async (suite) => {

  await suite.test('1. Cycle Phase Estimation: Accurately identifies all four menstrual cycle phases', () => {
    const today = new Date('2026-09-16');

    // PMS active toggle overrides
    assert.equal(estimateCyclePhase({ is_pms_active: true, current_date: today }), CYCLE_PHASES.LUTEAL);

    // 4 days until period -> Luteal
    assert.equal(estimateCyclePhase({ approximate_next_period_date: '2026-09-20', current_date: today }), CYCLE_PHASES.LUTEAL);

    // Today is period start -> Menstrual
    assert.equal(estimateCyclePhase({ approximate_next_period_date: '2026-09-16', current_date: today }), CYCLE_PHASES.MENSTRUAL);

    // 14 days until period -> Ovulation
    assert.equal(estimateCyclePhase({ approximate_next_period_date: '2026-09-30', current_date: today }), CYCLE_PHASES.OVULATION);

    // 22 days until period -> Follicular
    assert.equal(estimateCyclePhase({ approximate_next_period_date: '2026-10-08', current_date: today }), CYCLE_PHASES.FOLLICULAR);
  });

  await suite.test('2. Female Cycle Buffer: Locks calorie cut on PMS fluid retention & adds comfort buffer', () => {
    const buffer = evaluateFemaleCycleBuffer({
      is_female: true,
      cycle_phase: CYCLE_PHASES.LUTEAL,
      weight_delta_kg: 1.4,
      adherence_score: 95,
      current_calories: 1650,
      has_pcos: true
    });

    assert.equal(buffer.deficit_adjustment_locked, true);
    assert.equal(buffer.comfort_snack_added_kcal, 0);
    assert.equal(buffer.comfort_snack_recommended_kcal, 150);
    assert.equal(buffer.adjusted_calories_with_comfort_snack, 1650);
    assert.ok(buffer.prohibited_actions.includes('حظر خفض السعرات الحرارية اليومية'));
    assert.ok(buffer.reassurance_message_ar.includes('مؤقتة'));
    assert.ok(buffer.micro_adjustments.comfort_snack_options_ar.includes('شوكولاتة داكنة'));
    assert.ok(buffer.micro_adjustments.recommended_supplement.includes('Magnesium'));

    // Verify PCOS Clinical Protocol
    assert.ok(buffer.pcos_protocol);
    assert.equal(buffer.pcos_protocol.is_pcos_active, true);
    assert.ok(buffer.pcos_protocol.supplements.some(s => s.supplement === 'Myo-Inositol'));
  });

  await suite.test('3. Check-in Integration: Detects FEMALE_PMS_WATER_RETENTION and locks deficit', () => {
    const checkin = evaluateCheckin({
      is_female: true,
      menstrual_phase: 'LUTEAL',
      is_pms_active: true,
      weight_kg: 69.2,
      previous_weight_kg: 68.0, // +1.2kg temporary gain
      nutrition_adherence_percent: 95,
      workouts_completed: 4,
      workouts_scheduled: 4,
      biofeedback: { hunger_level: 2, sleep_quality: 4, energy_level: 4 },
      pain_reports: []
    });

    assert.equal(checkin.analysis_status, CheckinAnalysisStatus.FEMALE_PMS_WATER_RETENTION);
    assert.equal(checkin.suggested_calorie_delta, 0);
    assert.ok(checkin.recommendations_ar.some(r => r.includes('احتباس مائي هرموني')));
    assert.ok(checkin.female_cycle_buffer);
    assert.equal(checkin.female_cycle_buffer.deficit_adjustment_locked, true);
  });

  await suite.test('4. Weekly Adaptation Integration: Applies PMS comfort buffer and tunes training RIR & rest', () => {
    const baseProgram = buildTestFemaleProgram();

    const checkinAnalysis = evaluateCheckin({
      is_female: true,
      menstrual_phase: 'LUTEAL',
      is_pms_active: true,
      weight_kg: 69.0,
      previous_weight_kg: 68.0,
      nutrition_adherence_percent: 95,
      workouts_completed: 4,
      workouts_scheduled: 4,
      biofeedback: { hunger_level: 3, sleep_quality: 4, energy_level: 3 }
    });

    const adapted = buildAdaptedPlan({
      currentMasterProgram: baseProgram,
      checkinAnalysis,
      options: {
        weight_kg: 69,
        isFemale: true,
        currentWeekNumber: 1,
        apply_pms_comfort_snack: true
      }
    });

    assert.ok(adapted.adaptation_reasons.some(r => r.code === 'FEMALE_CYCLE_PMS_BUFFER_APPLIED'));
    // Calories adjusted with comfort carbs buffer (+150 kcal)
    const baseCalories = baseProgram.nutrition_program.macro_targets.calories_kcal;
    assert.equal(adapted.adapted_nutrition.target_calories_kcal, baseCalories + 150);

    // Training week tuned
    assert.ok(adapted.adapted_training_week.focus_note.includes('Luteal / PMS'));
    const ex = adapted.adapted_training_week.sessions[0].exercises[0];
    assert.ok(ex.rir >= 2);
    assert.ok(ex.rest_seconds >= 60);
    assert.ok(ex.safetyNote.includes('الدورة الشهرية'));
  });
});

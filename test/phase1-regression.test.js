import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { evaluateIntake } from '../src/intake-decision-engine/index.js';
import { adaptIntakePayloadToCanonicalEngine } from '../src/intake-decision-engine/adapters/intake-adapter.js';
import { evaluateCheckin } from '../src/checkin-engine/evaluate-checkin.js';
import { CheckinAnalysisStatus, BiofeedbackAlert } from '../src/checkin-engine/domain/enums.js';
import { buildAdaptedPlan } from '../src/adaptation-engine/build-adapted-plan.js';
import { buildMasterEngineV2 } from '../src/master-engine-v2/index.js';
import { logWorkout } from "../src/api/controllers/checkin.controller.js";
import { User, WorkoutLog, CheckinSubmission } from "../src/api/models/index.js";
import sequelize from "../src/api/config/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const catalogPath = path.join(__dirname, '..', 'data', 'catalogs', 'core-global-food-batch-v1.json');
const nutritionFoodCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

const evaluationContext = Object.freeze({
  system_time: '2026-10-21T00:00:00.000Z',
  assessmentDate: '2026-10-21'
});

function mockRes() {
  const out = { status: 200, body: null };
  const res = {
    status(c) { out.status = c; return res; },
    json(b) { out.body = b; return res; }
  };
  return { res, out };
}

// ============================================================================
// PHASE 1: REGRESSION TESTS (PRESERVING BASELINE HEALTHY WORKFLOWS)
// ============================================================================

test('R1. Healthy Adult Trainee Intake Produces Valid Master Program V2 Without Medical Gate', () => {
  const rawIntake = {
    gender: 'male',
    age: 26,
    weight_kg: 82,
    height_cm: 180,
    primary_goal: 'fat_loss',
    dangerous_symptoms: ['NONE'],
    medical_conditions: {
      has_conditions: false,
      selected: []
    }
  };

  const adapted = adaptIntakePayloadToCanonicalEngine(rawIntake);
  const decision = evaluateIntake(adapted, evaluationContext);
  assert.equal(decision.plan_status, 'READY_FOR_DRAFT');

  const master = buildMasterEngineV2({
    intake: rawIntake,
    evaluationContext,
    nutritionFoodCatalog
  });

  assert.ok(master.nutrition_program);
  assert.ok(master.training_program);
  assert.equal(master.nutrition_program.targets.clinical_guardrails.medical_coordination_required, false);
});

test('R2. Diet-Managed T2D / PCOS Individualized Macros Without 45% Carb Cap Distortion', () => {
  const rawIntake = {
    gender: 'female',
    age: 30,
    weight_kg: 70,
    height_cm: 165,
    primary_goal: 'fat_loss',
    medical_conditions: {
      has_conditions: true,
      selected: ['diabetes'],
      diabetes: { type: 'type2', uses_insulin: false }
    }
  };

  const master = buildMasterEngineV2({
    intake: rawIntake,
    evaluationContext,
    nutritionFoodCatalog
  });

  const targets = master.nutrition_program.targets;
  assert.equal(targets.clinical_guardrails.diabetic_carb_cap_applied, false, 'Mandatory 45% cap must not be forced');
  assert.equal(targets.clinical_guardrails.hypoglycemia_guard_active, true);
  assert.equal(targets.clinical_guardrails.hypoglycemia_risk, 'MODERATE');
  assert.equal(master.nutrition_program.hypoglycemia_guard.active, true);
});

test('R3. Exact Macro-Calorie Invariant: abs(targetCalories - (P*4 + C*4 + F*9)) <= 1', () => {
  const testCases = [
    { gender: 'male', weight_kg: 95, height_cm: 182, age: 35, primary_goal: 'fat_loss' },
    { gender: 'female', weight_kg: 62, height_cm: 160, age: 24, primary_goal: 'muscle_gain' },
    { gender: 'male', weight_kg: 78, height_cm: 175, age: 40, primary_goal: 'recomposition' },
  ];

  for (const c of testCases) {
    const master = buildMasterEngineV2({
      intake: c,
      evaluationContext,
      nutritionFoodCatalog
    });

    const targets = master.nutrition_program.targets;
    const computedEnergy = targets.protein_g * 4 + targets.carbohydrate_g * 4 + targets.fat_g * 9;
    const diff = Math.abs(targets.target_calories - computedEnergy);
    assert.ok(diff <= 1, `Energy mismatch: target=${targets.target_calories}, computed=${computedEnergy}, diff=${diff}`);
  }
});

test('R4. Normal Check-in Auto-Regulation Produces Correct Statuses Without False Cardiac Locks', () => {
  // Test A: Normal On-Track Checkin
  const onTrackRes = evaluateCheckin({
    weight_kg: 84.5,
    previous_weight_kg: 85.0,
    nutrition_adherence_percent: 90,
  });
  assert.equal(onTrackRes.analysis_status, CheckinAnalysisStatus.ON_TRACK);
  assert.equal(onTrackRes.training_locked, false);
  assert.equal(onTrackRes.biofeedback_alerts.includes(BiofeedbackAlert.CARDIAC_RED_FLAG), false);

  // Test B: Plateau Checkin
  const plateauRes = evaluateCheckin({
    weight_kg: 85.0,
    previous_weight_kg: 85.0,
    nutrition_adherence_percent: 95,
  });
  assert.equal(plateauRes.analysis_status, CheckinAnalysisStatus.PLATEAU_DETECTED);
  assert.equal(plateauRes.suggested_calorie_delta, -125);
  assert.equal(plateauRes.training_locked, false);
});

test('R5. Trainee with Musculoskeletal Joint Pain Gets INJURY_FLAGGED and Swaps, NOT Cardiac Lock', () => {
  const jointPainRes = evaluateCheckin({
    weight_kg: 80,
    previous_weight_kg: 80,
    nutrition_adherence_percent: 90,
    pain_reports: [{ area: 'KNEE', body_part: 'ركبة', pain_level: 6 }]
  });

  assert.equal(jointPainRes.analysis_status, CheckinAnalysisStatus.INJURY_FLAGGED);
  assert.equal(jointPainRes.training_locked, false, 'Musculoskeletal joint pain must NOT lock out training');
  assert.ok(jointPainRes.biofeedback_alerts.includes(BiofeedbackAlert.JOINT_DISCOMFORT));
  assert.equal(jointPainRes.biofeedback_alerts.includes(BiofeedbackAlert.CARDIAC_RED_FLAG), false);
});

test('R6. Healthy Unlocked Trainee Logs Workouts Successfully', async () => {
  const CODE = 'REGRESS_HEALTHY_TRN_01';
  const u = await User.findOne({ where: { client_code: CODE } });
  if (u) {
    await WorkoutLog.destroy({ where: { user_id: u.id } }).catch(() => {});
    await CheckinSubmission.destroy({ where: { user_id: u.id } }).catch(() => {});
    await u.destroy().catch(() => {});
  }

  const client = await User.create({
    client_code: CODE,
    phone_number: '01008880001',
    full_name: 'Healthy Trainee',
    role: 'CLIENT'
  });

  try {
    const r = mockRes();
    await logWorkout({
      body: {
        user_id: CODE,
        week_number: 1,
        day_number: 1,
        session_title: 'Upper Body A',
        logged_exercises: [
          { exercise_code: 'BARBELL_BENCH_PRESS', weight_kg: 80, last_set_reps: 8, effort: 'OK' }
        ]
      },
      user: { id: client.id }
    }, r.res);

    assert.equal(r.out.status, 201);
    assert.equal(r.out.body.success, true);
  } finally {
    await WorkoutLog.destroy({ where: { user_id: client.id } }).catch(() => {});
    await client.destroy().catch(() => {});
    await sequelize.close().catch(() => {});
  }
});

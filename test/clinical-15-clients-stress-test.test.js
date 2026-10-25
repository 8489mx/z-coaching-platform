import test from 'node:test';
import assert from 'node:assert/strict';

import { STRESS_TEST_CLIENTS, CLINICAL_MASTER_BLUEPRINTS } from '../frontend/src/data/stressTestClientsBlueprints.js';
import { evaluateJointPainAndFirewall, GYM_RUSH_EQUIVALENCE_CATALOG, getGymRushEquivalentSwap } from '../src/execution-engines/biomechanics-firewall-engine.js';
import { analyzeBloodworkBiomarkers } from '../src/execution-engines/biomarker-engine.js';
import { calculateTrainingReadiness, autoregulateWorkoutSession, rescheduleMissedWorkout } from '../src/execution-engines/autoregulated-recovery-engine.js';
import { generateMasterPdfExportData, generatePrintablePlanHTML } from '../src/execution-engines/pdf-export-engine.js';

test('Milestone 12: 15 Clinical Stress-Test Clients End-to-End Suite', async (suite) => {

  await suite.test('1. Roster Integrity: Verifies all 15 diverse clinical personas are loaded', () => {
    assert.equal(STRESS_TEST_CLIENTS.length, 15);
    const codes = STRESS_TEST_CLIENTS.map(c => c.client_code);
    assert.deepEqual(codes, ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15']);
  });

  await suite.test('2. Kidney Disease (CKD) Guardrail: Strict protein capping and zero creatine for Client 7 & 15', () => {
    const ckdClients = [STRESS_TEST_CLIENTS[6], STRESS_TEST_CLIENTS[14]]; // Client 7 and 15
    for (const c of ckdClients) {
      assert.ok(c.injuries.some(i => i.includes('CKD') || i.includes('الكلى')));
      const bp = CLINICAL_MASTER_BLUEPRINTS[c.client_code];
      const proteinPerKg = bp.nutrition.targets.protein / c.weight_kg;
      assert.ok(proteinPerKg <= 1.25, `CKD protein for client ${c.client_code} must not exceed clinical safety cap`);
    }

    // Biomarker engine evaluation on elevated creatinine
    const labAnalysis = analyzeBloodworkBiomarkers({
      creatinine: 1.8,
      egfr: 45
    }, { weight_kg: 80 });

    assert.equal(labAnalysis.dietary_modifications.protein_cap_g_per_kg, 1.1);
    assert.equal(labAnalysis.dietary_modifications.withhold_creatine, true);
    assert.ok(labAnalysis.flags.some(f => f.message_ar.includes('حظر مكمل الكرياتين')));
  });

  await suite.test('3. Metabolic & Diabetes Safety: Hypoglycemia rescue guard for Clients 1, 5, 13', () => {
    const diabeticClients = [STRESS_TEST_CLIENTS[0], STRESS_TEST_CLIENTS[4], STRESS_TEST_CLIENTS[12]];
    for (const c of diabeticClients) {
      assert.ok(c.allergies.some(a => a.includes('السكري')));
      const bp = CLINICAL_MASTER_BLUEPRINTS[c.client_code];
      assert.ok(bp.nutrition.targets.carbs >= 150, 'Diabetic patients require complex carbs and rescue buffer');
    }
  });

  await suite.test('4. Biomechanical Joint Firewall for Injured Personas (Back, Knee, Shoulder)', () => {
    // Client 5: Lower Back L4-L5 Herniation
    const backFirewall = evaluateJointPainAndFirewall({
      jointLocation: 'LOWER_BACK',
      painScore: 6
    });
    assert.equal(backFirewall.firewall_active, true);
    assert.ok(backFirewall.forbidden_movements.includes('CONVENTIONAL_DEADLIFT'));
    assert.ok(backFirewall.forbidden_movements.includes('BARBELL_BACK_SQUAT'));

    // Client 3: Knee OA / Patellar
    const kneeFirewall = evaluateJointPainAndFirewall({
      jointLocation: 'KNEE_PATELLAR',
      painScore: 5
    });
    assert.equal(kneeFirewall.firewall_active, true);
    assert.ok(kneeFirewall.forbidden_movements.includes('LEG_EXTENSION_OPEN_CHAIN'));

    // Client 2: Shoulder Impingement
    const shoulderFirewall = evaluateJointPainAndFirewall({
      jointLocation: 'SHOULDER',
      painScore: 6
    });
    assert.equal(shoulderFirewall.firewall_active, true);
    assert.ok(shoulderFirewall.forbidden_movements.includes('BEHIND_NECK_PRESS'));
  });

  await suite.test('5. Gym Rush & Busy Equipment Substitution Catalog Integrity', () => {
    assert.ok(Object.keys(GYM_RUSH_EQUIVALENCE_CATALOG).length >= 8);

    const latSwap = getGymRushEquivalentSwap('LAT_PULLDOWN');
    assert.equal(latSwap.found, true);
    assert.equal(latSwap.swap_id, 'single_arm_cable_pulldown');

    const legPressSwap = getGymRushEquivalentSwap('LEG_PRESS');
    assert.equal(legPressSwap.found, true);
    assert.equal(legPressSwap.swap_id, 'db_walking_lunges');
  });

  await suite.test('6. Dynamic Rescheduling & Readiness Autoregulation for All 15 Trainees', () => {
    for (const c of STRESS_TEST_CLIENTS) {
      // Simulate daily readiness
      const readiness = calculateTrainingReadiness({
        soreness: (c.id % 5) + 2,
        sleep_quality: c.id % 2 === 0 ? 'GOOD' : 'AVERAGE',
        sleep_hours: 7.0,
        stress_level: 4,
        energy_level: 7
      });

      assert.ok(readiness.readiness_score > 0 && readiness.readiness_score <= 100);
      assert.ok(readiness.tier_ar);

      // Simulate a missed session
      const sampleSessions = [
        { day_number: 1, is_rest_day: false, exercises: [{ code: 'SQUAT', target_sets: 3 }] },
        { day_number: 2, is_rest_day: true, exercises: [] },
        { day_number: 3, is_rest_day: false, exercises: [{ code: 'BENCH', target_sets: 3 }] }
      ];

      const rescheduled = rescheduleMissedWorkout({
        sessions: sampleSessions,
        missed_day_index: 0,
        remaining_days_in_week: 3
      });

      assert.ok(rescheduled.rescheduled_sessions);
      assert.ok(rescheduled.strategy);
    }
  });

  await suite.test('7. End-to-End PDF Plan Generation & Zero-Grocery Audit for All 15 Personas', () => {
    for (const c of STRESS_TEST_CLIENTS) {
      const bp = CLINICAL_MASTER_BLUEPRINTS[c.client_code];
      const pdfExport = generateMasterPdfExportData({
        client_name: c.full_name,
        client_code: c.client_code,
        package_tier: (c.package_name?.includes('MAX') || c.package_name?.includes('ماكس')) ? 'MAX' : 'ELITE',
        current_week: 1,
        nutrition_plan: {
          daily_calories: bp.nutrition.targets.calories,
          protein_g: bp.nutrition.targets.protein,
          carbs_g: bp.nutrition.targets.carbs,
          fat_g: bp.nutrition.targets.fats,
          water_liters: bp.nutrition.targets.water_liters,
          meals: (bp.nutrition.meals || []).map(m => ({
            title: m.name,
            items: (m.items || []).map(i => ({ name: i.name, portion: `${i.amount} ${i.unit}` })),
            macros: `${m.macros.calories} Kcal`
          }))
        }
      });

      const html = generatePrintablePlanHTML({
        client: { name: c.full_name, goal_title: c.goal_label },
        plan: {
          prehab: { has_prehab: false },
          workout: { title_ar: 'الجدول التدريبي', exercises: [] },
          meals: (bp.nutrition.meals || []).map(m => ({
            title_ar: m.name,
            items: (m.items || []).map(i => ({ name_ar: i.name, grams: i.amount })),
            calories: m.macros.calories
          }))
        }
      });

      assert.ok(pdfExport.client.name.includes(c.full_name.split(' ')[0]));
      assert.equal(html.includes('قائمة تسوق'), false, 'Zero grocery rule strictly enforced');
      assert.equal(html.includes('سوبرماركت'), false, 'Zero grocery rule strictly enforced');
      assert.ok(html.includes('dir="rtl"'));
    }
  });
});

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  auditGeneratedPlan
} from '../src/execution-engines/clinical-audit-engine.js';

import {
  activateClientProgram
} from '../src/execution-engines/activation-engine.js';

import {
  evaluateClientRenewalEligibility
} from '../src/execution-engines/renewal-engine.js';

test('1. Clinical Audit Gate - Passes Clean Plan with 100% Score', () => {
  const clientProfile = {
    weight_kg: 70,
    medical_conditions: [],
    medications: [],
    bloodwork: { egfr_ml_min: 95 }
  };

  const generatedPlan = {
    nutrition: {
      daily_calories: 1900,
      protein_g: 140, // 2.0 g/kg
      carbs_g: 210,
      fat_g: 55,
      supplements: ['Omega-3', 'Vitamin D3']
    },
    training: {
      exercises: [
        { name: 'Lat Pulldown' },
        { name: 'Chest Press Machine' }
      ]
    }
  };

  const result = auditGeneratedPlan({ clientProfile, generatedPlan });
  assert.equal(result.passed, true);
  assert.equal(result.audit_score_percent, 100);
  assert.equal(result.blockers.length, 0);
});

test('2. Clinical Audit Gate - Blocks Plan with Axial Loading for Disc L5-S1 Injury', () => {
  const clientProfile = {
    weight_kg: 80,
    medical_conditions: ['ديسك قطني L5-S1'],
    medications: []
  };

  const generatedPlan = {
    nutrition: { daily_calories: 2000, protein_g: 160, carbs_g: 210, fat_g: 55 },
    training: {
      exercises: [
        { name: 'Barbell Squat (سكوات حر بالبار)' }
      ]
    }
  };

  const result = auditGeneratedPlan({ clientProfile, generatedPlan });
  assert.equal(result.passed, false);
  assert.ok(result.blockers.some(b => b.includes('ديسك L5-S1')));
});

test('3. Clinical Audit Gate - Blocks Plan with Protein > 1.1 g/kg for Renal eGFR < 60', () => {
  const clientProfile = {
    weight_kg: 70,
    bloodwork: { egfr_ml_min: 48 }, // Renal insufficiency
    medical_conditions: []
  };

  const generatedPlan = {
    nutrition: {
      daily_calories: 1800,
      protein_g: 140, // 2.0 g/kg (Exceeds 1.1 g/kg)
      supplements: ['Creatine Monohydrate']
    },
    training: { exercises: [{ name: 'Leg Press' }] }
  };

  const result = auditGeneratedPlan({ clientProfile, generatedPlan });
  assert.equal(result.passed, false);
  assert.ok(result.blockers.some(b => b.includes('السد الكلوي')));
  assert.ok(result.blockers.some(b => b.includes('الكرياتين')));
});

test('4. Activation Pipeline - 1-Click Activation & 16-Week Schedule Generation', () => {
  // MAX VIP: 16 weekly check-ins
  const maxActivation = activateClientProgram({
    client_id: '101',
    client_name: 'سارة المنصوري',
    phone_number: '01011111110',
    package_tier: 'MAX',
    app_url: 'https://zcoaching.com/client-app',
    program_pdf_url: 'https://zcoaching.com/program-pdf?user_id=101'
  });

  assert.equal(maxActivation.success, true);
  assert.equal(maxActivation.new_status, 'ACTIVE');
  assert.equal(maxActivation.total_scheduled_checkins, 16);
  assert.ok(maxActivation.welcome_message_ar.includes('سارة المنصوري'));
  assert.ok(maxActivation.welcome_message_ar.includes('https://zcoaching.com/client-app'));
  assert.ok(maxActivation.whatsapp_dispatch_url.includes('https://wa.me/201011111110'));

  // ELITE: 8 bi-weekly check-ins
  const eliteActivation = activateClientProgram({
    package_tier: 'ELITE'
  });
  assert.equal(eliteActivation.total_scheduled_checkins, 8);
});

test('5. Pre-Renewal Engine - Week 14 Triggers VIP Offer & Reverse Dieting Trajectory', () => {
  const renewal = evaluateClientRenewalEligibility({
    client_id: '1',
    client_name: 'طارق عبد العزيز',
    phone_number: '01011111112',
    current_week: 14,
    starting_weight_kg: 92.0,
    current_weight_kg: 80.0, // 12 kg drop
    initial_goal: 'خسارة دهون وتنشيف',
    adherence_rate_percent: 98
  });

  assert.equal(renewal.is_renewal_window_active, true);
  assert.equal(renewal.transformation_summary.weight_drop_kg, 12);
  assert.ok(renewal.next_phase_recommendation.goal.includes('الدايت العكسي'));
  assert.equal(renewal.offer.discount_percent, 25);
  assert.ok(renewal.renewal_script_ar.includes('12 كجم'));
  assert.ok(renewal.whatsapp_dispatch_url.includes('https://wa.me/201011111112'));
});

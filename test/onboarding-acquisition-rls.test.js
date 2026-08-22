import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';

import {
  generateSecureIntakeToken,
  validateIntakeToken,
  generateInitialPlan,
  SUPPORTED_PACKAGES,
  PAYMENT_METHODS
} from '../src/execution-engines/onboarding-acquisition-engine.js';

test('1. Onboarding & Acquisition - Generates Valid Cryptographic Intake Token', () => {
  const result = generateSecureIntakeToken({
    client_name: 'سارة المنصوري',
    client_email: 'sara@example.com',
    client_phone: '01011111110',
    package_code: SUPPORTED_PACKAGES.MAX_3_PLUS_1.code,
    payment_method: PAYMENT_METHODS.INSTAPAY,
    payment_reference: 'INSTA-99881'
  });

  assert.equal(result.success, true);
  assert.ok(result.token.startsWith('zcc_'));
  assert.ok(result.intake_url.includes('token=zcc_'));
  assert.equal(result.package_details.tier, 'MAX');
  assert.ok(result.whatsapp_dispatch_url.includes('https://wa.me/201011111110'));
});

test('2. Onboarding & Acquisition - Validates Legitimate Intake Token Successfully', () => {
  const generated = generateSecureIntakeToken({
    client_name: 'طارق عبد العزيز',
    client_email: 'tarek@example.com',
    client_phone: '01011111112',
    package_code: SUPPORTED_PACKAGES.ELITE_3_PLUS_1.code
  });

  const validation = validateIntakeToken(generated.token);
  assert.equal(validation.valid, true);
  assert.equal(validation.entitlement.client_name, 'طارق عبد العزيز');
  assert.equal(validation.entitlement.package_tier, 'ELITE');
});

test('3. Onboarding & Acquisition - Detects and Blocks Tampered Token Signatures', () => {
  const generated = generateSecureIntakeToken({
    client_name: 'محمد',
    client_email: 'mohamed@example.com'
  });

  // Tamper token payload or signature
  const tamperedToken = generated.token + 'TAMPERED_SIG';
  const validation = validateIntakeToken(tamperedToken);

  assert.equal(validation.valid, false);
  assert.ok(validation.reason_ar.includes('فشل التحقق الأمني'));
});

test('4. Onboarding & Acquisition - Rejects Expired Intake Tokens', () => {
  const expiredGenerated = generateSecureIntakeToken({
    client_name: 'عمر',
    expires_in_hours: -1 // Expired 1 hour ago
  });

  const validation = validateIntakeToken(expiredGenerated.token);
  assert.equal(validation.valid, false);
  assert.ok(validation.reason_ar.includes('انتهت صلاحية'));
});

test('5. Supabase RLS Migration - Ensures Production SQL File Exists and Covers All Core Tables', () => {
  const sql = fs.readFileSync('d:/zcc/supabase/migrations/production_rls.sql', 'utf8');
  assert.ok(sql.includes('ENABLE ROW LEVEL SECURITY'));
  assert.ok(sql.includes('is_coach_admin'));
  assert.ok(sql.includes('clients FOR ALL'));
  assert.ok(sql.includes('check_ins FOR ALL'));
  assert.ok(sql.includes('diet_plans FOR ALL'));
  assert.ok(sql.includes('workout_logs FOR ALL'));
});


test('5. generateInitialPlan: Calculates accurate BMR, TDEE, Deficit and Macros for standard Male FAT_LOSS', () => {
  const plan = generateInitialPlan({
    name: 'أحمد سعيد',
    gender: 'MALE',
    age: 28,
    weightKg: 85,
    heightCm: 180,
    activityLevel: 'MODERATE',
    goal: 'FAT_LOSS',
    trainingDaysPerWeek: 4
  });

  // BMR = 10*85 + 6.25*180 - 5*28 + 5 = 850 + 1125 - 140 + 5 = 1840
  // TDEE = 1840 * 1.55 = 2852
  // Deficit (-22%) = 2852 * 0.78 = 2225
  assert.equal(plan.bmr, 1840);
  assert.equal(plan.tdee, 2852);
  assert.equal(plan.daily_targets.calories, 2225);
  // Protein: 85 * 2.2 = 187g
  assert.equal(plan.daily_targets.protein_grams, 187);
  // Fats: 85 * 0.8 = 68g
  assert.equal(plan.daily_targets.fats_grams, 68);
  assert.equal(plan.training_split.frequency, '4 أيام أسبوعياً');
  assert.equal(plan.training_split.schedule_blueprint.length, 4);
});

test('6. generateInitialPlan: Enforces Renal Firewall and clamps safety calorie floor for females', () => {
  const plan = generateInitialPlan({
    name: 'سارة',
    gender: 'FEMALE',
    age: 40,
    weightKg: 50,
    heightCm: 155,
    activityLevel: 'SEDENTARY',
    goal: 'AGGRESSIVE_CUT',
    medicalFlags: ['RENAL_INSUFFICIENCY']
  });

  // Clamps to female minimum floor 1200 kcal
  assert.equal(plan.daily_targets.calories, 1200);
  // Renal protein capped at 1.1 g/kg -> 50 * 1.1 = 55g
  assert.equal(plan.daily_targets.protein_grams, 55);
  assert.ok(plan.clinical_notes.length > 0);
  assert.ok(plan.clinical_notes[0].includes('لحماية الكلى'));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  User, 
  Program, 
  CheckinSubmission, 
  ProgressPhoto, 
  WorkoutLog, 
  Order, 
  NutritionPlan, 
  WorkoutPlan, 
  IntakeSubmission 
} from '../src/api/models/index.js';
import { deleteClient } from '../src/api/controllers/client.controller.js';
import sequelize from '../src/api/config/database.js';

test('Tier 2 Item 7: Atomic Cascading Delete Safety Suite (Zero Orphans)', async (t) => {
  t.before(async () => {
    await Order.destroy({ where: { id: ['ORD-TEST-7991', 'ORD-TEST-7992'] } }).catch(() => {});
    await User.destroy({ where: { client_code: ['7991', '7992'] } }).catch(() => {});
  });

  t.after(async () => {
    await Order.destroy({ where: { id: ['ORD-TEST-7991', 'ORD-TEST-7992'] } }).catch(() => {});
    await User.destroy({ where: { client_code: ['7991', '7992'] } }).catch(() => {});
    await sequelize.close().catch(() => {});
  });

  await t.test('1. Deleting client atomically cascades to all dependent tables without orphans', async () => {
    // 1. Create a client
    const client = await User.create({
      client_code: '7991',
      phone_number: '01099997991',
      full_name: 'مشترك اختبار الحذف المتتابع',
      role: 'CLIENT'
    });

    const clientId = client.id;

    // 2. Populate dependent records across all related tables
    const program = await Program.create({
      user_id: clientId,
      version: 1,
      status: 'ACTIVE',
      program_data: { test: true }
    });

    await IntakeSubmission.create({
      user_id: clientId,
      status: 'APPROVED',
      answers: { test: true }
    });

    await CheckinSubmission.create({
      user_id: clientId,
      week_number: 1,
      weight_kg: 80.5,
      average_weight_kg: 80.5,
      daily_weights_kg: [80.5],
      biofeedback: { energy: 'HIGH' },
      analysis_output: { recommendation: 'MAINTAIN' },
      status: 'APPROVED'
    });

    await ProgressPhoto.create({
      user_id: clientId,
      week_number: 1,
      pose: 'FRONT',
      photo_url: '/uploads/test_photo.jpg'
    });

    await WorkoutLog.create({
      user_id: clientId,
      program_id: program.id,
      week_number: 1,
      session_title: 'Upper Body',
      logged_exercises: []
    });

    await Order.create({
      id: 'ORD-TEST-7991',
      client_id: clientId,
      customer_name: 'مشترك اختبار',
      phone_number: '01099997991',
      package_tier: 'ELITE',
      payment_method: 'INSTAPAY',
      amount_paid: 2500,
      payment_status: 'COMPLETED'
    });

    await NutritionPlan.create({
      user_id: clientId,
      target_calories: 2000,
      protein_grams: 150,
      carbs_grams: 200,
      fats_grams: 60,
      meals_data: []
    });

    await WorkoutPlan.create({
      user_id: clientId,
      split_name: 'UPPER_LOWER',
      schedule_data: []
    });

    // Verify all 9 records exist before deletion
    assert.equal(await User.count({ where: { id: clientId } }), 1);
    assert.equal(await Program.count({ where: { user_id: clientId } }), 1);
    assert.equal(await IntakeSubmission.count({ where: { user_id: clientId } }), 1);
    assert.equal(await CheckinSubmission.count({ where: { user_id: clientId } }), 1);
    assert.equal(await ProgressPhoto.count({ where: { user_id: clientId } }), 1);
    assert.equal(await WorkoutLog.count({ where: { user_id: clientId } }), 1);
    assert.equal(await Order.count({ where: { client_id: clientId } }), 1);
    assert.equal(await NutritionPlan.count({ where: { user_id: clientId } }), 1);
    assert.equal(await WorkoutPlan.count({ where: { user_id: clientId } }), 1);

    // 3. Execute deleteClient via controller
    let statusCode = null;
    let responseBody = null;
    const req = { params: { id: String(clientId) } };
    const res = {
      status: (code) => { statusCode = code; return res; },
      json: (data) => { responseBody = data; return res; }
    };

    await deleteClient(req, res);

    assert.equal(statusCode, 200);
    assert.equal(responseBody.success, true);

    // 4. Verify ZERO orphans remain in any table
    assert.equal(await User.count({ where: { id: clientId } }), 0, 'User record must be deleted');
    assert.equal(await Program.count({ where: { user_id: clientId } }), 0, 'Program must have zero orphans');
    assert.equal(await IntakeSubmission.count({ where: { user_id: clientId } }), 0, 'IntakeSubmission must have zero orphans');
    assert.equal(await CheckinSubmission.count({ where: { user_id: clientId } }), 0, 'CheckinSubmission must have zero orphans');
    assert.equal(await ProgressPhoto.count({ where: { user_id: clientId } }), 0, 'ProgressPhoto must have zero orphans');
    assert.equal(await WorkoutLog.count({ where: { user_id: clientId } }), 0, 'WorkoutLog must have zero orphans');
    assert.equal(await Order.count({ where: { client_id: clientId } }), 0, 'Order must have zero orphans');
    assert.equal(await NutritionPlan.count({ where: { user_id: clientId } }), 0, 'NutritionPlan must have zero orphans');
    assert.equal(await WorkoutPlan.count({ where: { user_id: clientId } }), 0, 'WorkoutPlan must have zero orphans');
  });

  await t.test('2. deleteClient supports client_code string lookup (e.g. #7992)', async () => {
    const client = await User.create({
      client_code: '7992',
      phone_number: '01099997992',
      full_name: 'مشترك كود نصي',
      role: 'CLIENT'
    });

    let statusCode = null;
    const req = { params: { id: '#7992' } };
    const res = {
      status: (code) => { statusCode = code; return res; },
      json: () => {}
    };

    await deleteClient(req, res);
    assert.equal(statusCode, 200);
    assert.equal(await User.count({ where: { id: client.id } }), 0);
  });
});

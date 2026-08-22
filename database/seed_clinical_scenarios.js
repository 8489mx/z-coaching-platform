import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

export async function seedDatabase() {
  console.log('Starting Realistic Clinical Database Seeding...');
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'antigravity_db'
    });

    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    await connection.execute('TRUNCATE TABLE clients');
    await connection.execute('TRUNCATE TABLE weekly_checkins');
    await connection.execute('TRUNCATE TABLE exercise_logs');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // 1. المتدربة في أسبوع الهرمونات (PMS_WEEK)
    const client1Id = uuidv4();
    const date1 = new Date(today.getTime() - (20 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
    await connection.execute(`
      INSERT INTO clients (id, name, phone, gender, age, height_cm, starting_weight_kg, current_weight_kg, goal, medical_flags_json, subscription_start_date, subscription_duration_days, subscription_status)
      VALUES (?, 'سارة أحمد (PMS)', '01000000001', 'FEMALE', 25, 160, 70, 68, 'FAT_LOSS', '["PMS_WEEK"]', ?, 30, 'ACTIVE')
    `, [client1Id, date1]);

    // 2. متدرب ثبات وزن لـ 14 يوم (Diet Break Candidate)
    const client2Id = uuidv4();
    const date2 = new Date(today.getTime() - (84 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
    await connection.execute(`
      INSERT INTO clients (id, name, phone, gender, age, height_cm, starting_weight_kg, current_weight_kg, goal, medical_flags_json, subscription_start_date, subscription_duration_days, subscription_status)
      VALUES (?, 'محمد محمود (Plateau)', '01000000002', 'MALE', 30, 175, 90, 85, 'FAT_LOSS', '["CONFIRMED_PLATEAU_14D"]', ?, 90, 'ACTIVE')
    `, [client2Id, date2]);

    // 3. متدرب ينتهي اشتراكه خلال 48 ساعة (Renewal Radar)
    const client3Id = uuidv4();
    const date3 = new Date(today.getTime() - (28 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
    await connection.execute(`
      INSERT INTO clients (id, name, phone, gender, age, height_cm, starting_weight_kg, current_weight_kg, goal, subscription_start_date, subscription_duration_days, subscription_status)
      VALUES (?, 'خالد سعيد (Expiring)', '01000000003', 'MALE', 22, 180, 80, 78, 'LEAN_BULK', ?, 30, 'EXPIRING_SOON')
    `, [client3Id, date3]);

    // 4. متدرب يعاني من إصابة كتف (Shoulder Impingement)
    const client4Id = uuidv4();
    const date4 = new Date(today.getTime() - (10 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
    await connection.execute(`
      INSERT INTO clients (id, name, phone, gender, age, height_cm, starting_weight_kg, current_weight_kg, goal, medical_flags_json, subscription_start_date, subscription_duration_days, subscription_status)
      VALUES (?, 'يوسف علي (Shoulder Pain)', '01000000004', 'MALE', 35, 178, 85, 83, 'MAINTENANCE', '["SHOULDER_IMPINGEMENT"]', ?, 30, 'ACTIVE')
    `, [client4Id, date4]);

    // 5. متدرب كسر سقف التكرارات ومستعد لزيادة الوزن (Progression Ready)
    const client5Id = uuidv4();
    const date5 = new Date(today.getTime() - (5 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
    await connection.execute(`
      INSERT INTO clients (id, name, phone, gender, age, height_cm, starting_weight_kg, current_weight_kg, goal, subscription_start_date, subscription_duration_days, subscription_status)
      VALUES (?, 'عمر حسين (Overload)', '01000000005', 'MALE', 28, 185, 75, 75, 'LEAN_BULK', ?, 30, 'ACTIVE')
    `, [client5Id, date5]);

    // تسجيل 3 جولات تمرين لعمر حسين لرفع الوزن تلقائياً
    await connection.execute(`
      INSERT INTO exercise_logs (id, client_id, exercise_id, session_date, set_number, weight_kg, reps, rir)
      VALUES 
      (?, ?, 'bench_press', ?, 1, 60, 12, 2),
      (?, ?, 'bench_press', ?, 2, 60, 12, 2),
      (?, ?, 'bench_press', ?, 3, 60, 12, 2)
    `, [uuidv4(), client5Id, todayStr, uuidv4(), client5Id, todayStr, uuidv4(), client5Id, todayStr]);

    console.log('5 Realistic Clinical Scenarios Seeded Successfully into MySQL!');
    return true;
  } catch (err) {
    console.warn('Database Connection Notice for Seeder (will run on Hostinger/Local MySQL when available):', err.message);
    return false;
  } finally {
    if (connection) await connection.end();
  }
}

// Self-run if executed via CLI
if (process.argv[1] && process.argv[1].endsWith('seed_clinical_scenarios.js')) {
  seedDatabase().then(() => process.exit(0)).catch(() => process.exit(0));
}

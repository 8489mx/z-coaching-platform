/**
 * Production Audit Script: Program Calories & Client Schema Integrity
 * 
 * Safe, read-only audit script to run on Hostinger VPS production or locally.
 * Inspects all programs to detect if any live client suffered from calorie collapse (2000 kcal),
 * and audits differences between legacy `clients` table and modern `users` table.
 * 
 * Usage: node scripts/audit-production-programs-calories.js
 */

import sequelize from '../src/api/config/database.js';
import { User, Program, CheckinSubmission } from '../src/api/models/index.js';

async function runProductionAudit() {
  console.log('================================================================');
  console.log('Z COACHING PLATFORM - PRODUCTION CALORIE & SCHEMA AUDIT');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Database Host:', sequelize.config.host);
  console.log('Database Name:', sequelize.config.database);
  console.log('================================================================\n');

  try {
    // 1. Check existing tables in DB
    const [tablesResult] = await sequelize.query('SHOW TABLES;');
    const tableNames = tablesResult.map(r => Object.values(r)[0]);
    console.log('--- 1. DATABASE TABLES AUDIT ---');
    console.log('Tables found in database:', tableNames.join(', '));
    const hasLegacyClients = tableNames.includes('clients');
    const hasUsers = tableNames.includes('users');
    console.log(`Legacy 'clients' table exists: ${hasLegacyClients ? 'YES' : 'NO'}`);
    console.log(`Modern 'users' table exists:   ${hasUsers ? 'YES' : 'NO'}\n`);

    // 2. Audit Users count
    const totalUsers = await User.count();
    const clientUsers = await User.count({ where: { role: 'CLIENT' } });
    const adminUsers = await User.count({ where: { role: 'ADMIN' } });
    console.log('--- 2. USERS TABLE SUMMARY ---');
    console.log(`Total rows in 'users':       ${totalUsers}`);
    console.log(`Trainees (role = CLIENT):   ${clientUsers}`);
    console.log(`Admins (role = ADMIN):      ${adminUsers}\n`);

    // 3. If legacy `clients` table exists, compare rows with `users`
    if (hasLegacyClients) {
      console.log('--- 3. LEGACY CLIENTS VS MODERN USERS COMPARISON ---');
      const [countResult] = await sequelize.query('SELECT COUNT(*) as exact_count FROM clients;');
      const exactCount = countResult[0]?.exact_count ?? 0;
      console.log(`[SQL EXECUTION]: SELECT COUNT(*) FROM clients; -> ${exactCount} rows found.`);

      const [legacyClients] = await sequelize.query('SELECT * FROM clients;');
      console.log(`Total rows in legacy 'clients': ${legacyClients.length}`);

      const userPhones = new Set((await User.findAll({ attributes: ['phone_number'] })).map(u => u.phone_number));
      const unmigratedClients = legacyClients.filter(c => !userPhones.has(c.phone));

      console.log(`Legacy clients missing from 'users': ${unmigratedClients.length}`);
      if (unmigratedClients.length > 0) {
        console.warn('ATTENTION: The following clients exist in legacy `clients` but NOT in `users`:');
        unmigratedClients.forEach(c => {
          console.log(`  - ID: ${c.id} | Name: ${c.name} | Phone: ${c.phone}`);
        });
      } else {
        console.log('All legacy clients are already accounted for in `users` by phone number.');
      }
      console.log('');
    } else {
      console.log('--- 3. LEGACY CLIENTS TABLE CHECK ---');
      console.log("[SQL EXECUTION]: Table 'clients' does not exist in this database instance.");
      console.log("All application models and queries map to 'users' table directly.\n");
    }

    // 4. Audit all Programs for Calorie Collapse (The 2000 kcal anomaly)
    console.log('--- 4. MASTER PROGRAMS & CALORIE INTEGRITY AUDIT ---');
    const programs = await Program.findAll({
      order: [['id', 'ASC']]
    });
    console.log(`Total programs found: ${programs.length}`);

    let flaggedCount = 0;
    let healthyCount = 0;

    for (const prog of programs) {
      const data = typeof prog.program_data === 'string' ? JSON.parse(prog.program_data) : prog.program_data;
      if (!data) continue;

      const clientName = data.client?.full_name || data.client?.name || `User #${prog.user_id}`;
      const targetsCal = data.nutrition?.targets?.calories || data.nutrition_program?.macro_targets?.calories_kcal;
      const lastAdaptation = data._last_adaptation;

      // Check if last adaptation forced exactly 2000 kcal when there was an adaptation
      const isSuspicious = lastAdaptation && targetsCal === 2000 && lastAdaptation.action !== 'MAINTAIN_TRAJECTORY';

      if (isSuspicious) {
        flaggedCount++;
        console.warn(`[FLAGGED] Program #${prog.id} for ${clientName}:`);
        console.warn(`  Current Calories: ${targetsCal} kcal`);
        console.warn(`  Last Adaptation:`, lastAdaptation);
        console.warn(`  Recommendation: Review client intake to confirm target calories.\n`);
      } else {
        healthyCount++;
      }
    }

    console.log(`Healthy Programs: ${healthyCount}`);
    console.log(`Flagged Programs (possible 2000 kcal collapse): ${flaggedCount}`);

    // 5. Audit Checkin Submissions
    const checkinCount = await CheckinSubmission.count();
    console.log(`\n--- 5. CHECKINS AUDIT ---`);
    console.log(`Total checkin submissions in database: ${checkinCount}`);

    console.log('\n================================================================');
    console.log('AUDIT COMPLETE - ZERO DATABASE MODIFICATIONS PERFORMED (READ-ONLY)');
    console.log('================================================================');
    process.exit(0);
  } catch (err) {
    console.error('Audit failed with error:', err);
    process.exit(1);
  }
}

runProductionAudit();

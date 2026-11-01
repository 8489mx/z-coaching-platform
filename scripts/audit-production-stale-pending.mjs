/**
 * Read-Only Production Audit: Stale and Pending Check-ins Count
 * 
 * Audits the live database (local or VPS production) without performing
 * any writes, updates, repairs, or cleanups.
 * 
 * Reports:
 * 1. Total check-ins by status (PENDING_REVIEW, APPROVED, AUTO_APPLIED).
 * 2. PENDING_REVIEW rows older than package cadence (MAX > 7d, ELITE > 14d).
 * 3. AUTO_APPLIED rows older than 14 days (display window cutoff).
 * 4. Scale context: Active client users and active programs.
 * 
 * Usage:
 *   node --env-file=.env scripts/audit-production-stale-pending.mjs
 *   node --env-file=.env.production scripts/audit-production-stale-pending.mjs
 */

import sequelize from '../src/api/config/database.js';

async function runAudit() {
  console.log('================================================================');
  console.log('Z COACHING PLATFORM — STALE / PENDING CHECK-INS AUDIT (READ-ONLY)');
  console.log('Timestamp (UTC):', new Date().toISOString());
  console.log('Database Host:  ', sequelize.config.host);
  console.log('Database Name:  ', sequelize.config.database);
  console.log('================================================================\n');

  try {
    // 1. Total check-ins by status
    const [statusCounts] = await sequelize.query(`
      SELECT 
        status, 
        COUNT(*) AS count 
      FROM checkin_submissions 
      GROUP BY status
      ORDER BY count DESC
    `);
    console.log('--- 1. TOTAL CHECK-INS BY STATUS ---');
    console.table(statusCounts);

    const [[{ total_checkins }]] = await sequelize.query(`
      SELECT COUNT(*) AS total_checkins FROM checkin_submissions
    `);
    console.log(`Total check-in submissions in database: ${total_checkins}\n`);

    // 2. PENDING_REVIEW breakdown by package and stale threshold
    // MAX: stale after 7 days (> 7 days)
    // ELITE: stale after 14 days (> 14 days)
    const [pendingByPackage] = await sequelize.query(`
      SELECT 
        COALESCE(u.subscription_package, 'UNKNOWN / NOT_SET') AS package,
        COUNT(*) AS total_pending,
        SUM(CASE 
          WHEN u.subscription_package LIKE '%MAX%' AND c.createdAt < DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1
          WHEN (u.subscription_package LIKE '%ELITE%' OR u.subscription_package IS NULL OR (u.subscription_package NOT LIKE '%MAX%' AND u.subscription_package NOT LIKE '%ELITE%')) 
               AND c.createdAt < DATE_SUB(NOW(), INTERVAL 14 DAY) THEN 1
          ELSE 0
        END) AS stale_pending_count,
        SUM(CASE 
          WHEN u.subscription_package LIKE '%MAX%' AND c.createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1
          WHEN (u.subscription_package LIKE '%ELITE%' OR u.subscription_package IS NULL OR (u.subscription_package NOT LIKE '%MAX%' AND u.subscription_package NOT LIKE '%ELITE%')) 
               AND c.createdAt >= DATE_SUB(NOW(), INTERVAL 14 DAY) THEN 1
          ELSE 0
        END) AS fresh_pending_count
      FROM checkin_submissions c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.status = 'PENDING_REVIEW'
      GROUP BY u.subscription_package
    `);
    console.log('--- 2. PENDING_REVIEW BREAKDOWN (BY PACKAGE & STALENESS) ---');
    if (pendingByPackage.length === 0) {
      console.log('No PENDING_REVIEW records found (0 pending rows).\n');
    } else {
      console.table(pendingByPackage);
    }

    const [[pendingSummary]] = await sequelize.query(`
      SELECT 
        COUNT(*) AS total_pending,
        COALESCE(SUM(CASE 
          WHEN u.subscription_package LIKE '%MAX%' AND c.createdAt < DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1
          WHEN (u.subscription_package LIKE '%ELITE%' OR u.subscription_package IS NULL OR (u.subscription_package NOT LIKE '%MAX%' AND u.subscription_package NOT LIKE '%ELITE%')) 
               AND c.createdAt < DATE_SUB(NOW(), INTERVAL 14 DAY) THEN 1
          ELSE 0
        END), 0) AS total_stale_pending,
        COALESCE(SUM(CASE 
          WHEN u.subscription_package LIKE '%MAX%' AND c.createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1
          WHEN (u.subscription_package LIKE '%ELITE%' OR u.subscription_package IS NULL OR (u.subscription_package NOT LIKE '%MAX%' AND u.subscription_package NOT LIKE '%ELITE%')) 
               AND c.createdAt >= DATE_SUB(NOW(), INTERVAL 14 DAY) THEN 1
          ELSE 0
        END), 0) AS total_fresh_pending
      FROM checkin_submissions c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.status = 'PENDING_REVIEW'
    `);
    console.log('--- 2b. PENDING_REVIEW OVERALL SUMMARY ---');
    console.table([pendingSummary]);

    // 3. AUTO_APPLIED rows older than 14 days (display-window cutoff)
    const [[autoAppliedSummary]] = await sequelize.query(`
      SELECT 
        COUNT(*) AS total_auto_applied,
        COALESCE(SUM(CASE WHEN createdAt < DATE_SUB(NOW(), INTERVAL 14 DAY) THEN 1 ELSE 0 END), 0) AS older_than_14_days,
        COALESCE(SUM(CASE WHEN createdAt >= DATE_SUB(NOW(), INTERVAL 14 DAY) THEN 1 ELSE 0 END), 0) AS within_14_days
      FROM checkin_submissions
      WHERE status = 'AUTO_APPLIED'
    `);
    console.log('--- 3. AUTO_APPLIED ROWS (14-DAY DISPLAY-WINDOW CUTOFF) ---');
    console.table([autoAppliedSummary]);

    // 4. Scale context: Active client users and active programs
    const [usersSummary] = await sequelize.query(`
      SELECT 
        role, 
        subscription_status, 
        COUNT(*) AS count 
      FROM users 
      GROUP BY role, subscription_status
    `);
    console.log('--- 4a. SCALE CONTEXT: USERS BY ROLE & STATUS ---');
    console.table(usersSummary);

    const [[{ active_clients_count }]] = await sequelize.query(`
      SELECT COUNT(*) AS active_clients_count 
      FROM users 
      WHERE role = 'CLIENT' AND subscription_status = 'ACTIVE'
    `);
    console.log(`Total ACTIVE CLIENT trainees: ${active_clients_count}`);

    const [programsSummary] = await sequelize.query(`
      SELECT 
        status, 
        COUNT(*) AS count 
      FROM programs 
      GROUP BY status
    `);
    console.log('\n--- 4b. SCALE CONTEXT: PROGRAMS BY STATUS ---');
    console.table(programsSummary);

    const [[{ active_programs_count }]] = await sequelize.query(`
      SELECT COUNT(*) AS active_programs_count 
      FROM programs 
      WHERE status = 'ACTIVE'
    `);
    console.log(`Total ACTIVE programs: ${active_programs_count}\n`);

    console.log('Audit completed cleanly with zero modifications.');
  } finally {
    await sequelize.close();
  }
}

runAudit().catch((err) => {
  console.error('Audit failed with error:', err.message);
  process.exit(1);
});

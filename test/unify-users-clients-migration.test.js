import test from "node:test";
import assert from "node:assert/strict";
import sequelize from "../src/api/config/database.js";
import { runUnifyMigration } from "../src/api/migrations/unify-users-clients-migration.js";
import { QueryTypes } from "sequelize";

test("Database Schema & Migration Hardening: Users/Clients Unification Suite", async (t) => {
  await sequelize.authenticate();

  await t.test("1. Reports unified database when legacy 'clients' table is absent", async () => {
    const res = await runUnifyMigration({ silent: true });
    assert.equal(res.success, true);
    assert.equal(typeof res.legacyClientsFound, "boolean");
    assert.equal(typeof res.migratedCount, "number");
  });

  await t.test("2. Safely migrates records from legacy 'clients' table and archives it", async () => {
    // Setup a simulated legacy clients table with unique test data
    const testCode = `TEST_MIG_${Date.now()}`;
    const testPhone = `010${Math.floor(10000000 + Math.random() * 90000000)}`;

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`clients\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`client_code\` VARCHAR(50) NOT NULL,
        \`full_name\` VARCHAR(100),
        \`phone_number\` VARCHAR(25) NOT NULL,
        \`email\` VARCHAR(120),
        \`package_tier\` VARCHAR(50) DEFAULT 'ELITE',
        \`subscription_package\` VARCHAR(50) DEFAULT 'ELITE_TEST',
        \`subscription_price\` DECIMAL(10, 2) DEFAULT 3000.00,
        \`payment_status\` VARCHAR(50) DEFAULT 'PAID',
        \`payment_method\` VARCHAR(50) DEFAULT 'INSTAPAY',
        \`plan_approval_status\` VARCHAR(50) DEFAULT 'APPROVED',
        \`status\` VARCHAR(50) DEFAULT 'ACTIVE',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    await sequelize.query(`
      INSERT INTO \`clients\` (
        \`client_code\`, \`full_name\`, \`phone_number\`, \`email\`,
        \`subscription_package\`, \`subscription_price\`, \`payment_status\`,
        \`payment_method\`, \`plan_approval_status\`, \`status\`
      ) VALUES (
        :code, 'Legacy Test User', :phone, 'legacy@test.com',
        'ELITE_TEST', 3000.00, 'PAID', 'INSTAPAY', 'APPROVED', 'ACTIVE'
      );
    `, { replacements: { code: testCode, phone: testPhone } });

    // Execute migration
    const migrationRes = await runUnifyMigration({ silent: true });

    assert.equal(migrationRes.success, true);
    assert.equal(migrationRes.legacyClientsFound, true);
    assert.ok(migrationRes.migratedCount >= 1);
    assert.ok(migrationRes.archivedTableName && migrationRes.archivedTableName.startsWith("_legacy_clients_backup_"));

    // Verify user exists in users table
    const [migratedUser] = await sequelize.query(
      "SELECT * FROM `users` WHERE `client_code` = :code LIMIT 1",
      { replacements: { code: testCode }, type: QueryTypes.SELECT }
    );

    assert.ok(migratedUser, "Migrated user must exist in users table");
    assert.equal(migratedUser.client_code, testCode);
    assert.equal(migratedUser.phone_number, testPhone);
    assert.equal(migratedUser.full_name, "Legacy Test User");
    assert.equal(migratedUser.subscription_package, "ELITE_TEST");

    // Clean up test data and archived table
    await sequelize.query("DELETE FROM `users` WHERE `client_code` = :code", { replacements: { code: testCode } });
    if (migrationRes.archivedTableName) {
      await sequelize.query(`DROP TABLE IF EXISTS \`${migrationRes.archivedTableName}\``);
    }
  });

  await t.test("3. Idempotency test: Re-running migration produces clean pass without side effects", async () => {
    const secondPass = await runUnifyMigration({ silent: true });
    assert.equal(secondPass.success, true);
    assert.equal(secondPass.legacyClientsFound, false);
    assert.equal(secondPass.migratedCount, 0);
  });

  // Close connection cleanly so node test runner exits immediately
  await sequelize.close().catch(() => {});
});

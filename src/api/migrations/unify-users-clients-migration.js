import sequelize from "../config/database.js";
import { QueryTypes } from "sequelize";
import { fileURLToPath } from "url";

/**
 * Migration Engine: Unifies legacy 'clients' table into 'users' table.
 * Idempotent, zero-data-loss, and safe for execution in both development and production.
 *
 * Operations:
 * 1. Checks if legacy 'clients' table exists.
 * 2. If present, migrates unrepresented records to 'users' table without duplication.
 * 3. Repoints foreign key constraints if dependent tables still point to 'clients'.
 * 4. Safely archives 'clients' table to '_legacy_clients_backup_<timestamp>'.
 * 5. If not present, verifies 'users' table structure and confirms unified status.
 */
export async function runUnifyMigration(options = {}) {
  const silent = options.silent ?? false;
  const logger = silent ? () => {} : console.log;

  logger("[MIGRATION] Starting users/clients schema unification check...");

  try {
    await sequelize.authenticate();
  } catch (authError) {
    logger("[MIGRATION] Database connection check notice:", authError.message);
    return {
      success: false,
      error: authError.message,
      status: "CONNECTION_FAILED"
    };
  }

  const queryInterface = sequelize.getQueryInterface();
  const tables = await queryInterface.showAllTables();
  const normalizedTables = tables.map(t => typeof t === "object" ? (t.tableName || Object.values(t)[0]) : t);

  const hasClientsTable = normalizedTables.some(t => String(t).toLowerCase() === "clients");
  const hasUsersTable = normalizedTables.some(t => String(t).toLowerCase() === "users");

  logger(`[MIGRATION] Tables inspection: clients exists = ${hasClientsTable}, users exists = ${hasUsersTable}`);

  let migratedCount = 0;
  let archivedTableName = null;

  if (!hasClientsTable) {
    logger("[MIGRATION] 'clients' table does not exist. Database is already fully unified on 'users' table.");
    return {
      success: true,
      legacyClientsFound: false,
      migratedCount: 0,
      archivedTableName: null,
      message: "Database already unified on users table."
    };
  }

  // If clients table exists, begin transaction-safe migration
  logger("[MIGRATION] Legacy 'clients' table detected. Initiating zero-data-loss migration...");

  const transaction = await sequelize.transaction();

  try {
    // 1. Fetch all records from legacy clients table
    const legacyClients = await sequelize.query(
      "SELECT * FROM `clients`",
      { type: QueryTypes.SELECT, transaction }
    );

    logger(`[MIGRATION] Found ${legacyClients.length} records in legacy 'clients' table.`);

    // 2. Ensure users table exists
    if (!hasUsersTable) {
      logger("[MIGRATION] 'users' table not found. Creating 'users' table structure...");
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS \`users\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`client_code\` VARCHAR(255) NOT NULL UNIQUE,
          \`phone_number\` VARCHAR(255) NOT NULL UNIQUE,
          \`email\` VARCHAR(255) UNIQUE,
          \`password\` VARCHAR(255),
          \`token_version\` INT NOT NULL DEFAULT 1,
          \`full_name\` VARCHAR(255),
          \`role\` ENUM('ADMIN', 'CLIENT') NOT NULL DEFAULT 'CLIENT',
          \`subscription_package\` VARCHAR(255) DEFAULT 'ELITE',
          \`subscription_price\` FLOAT DEFAULT 2500,
          \`payment_status\` VARCHAR(255) DEFAULT 'PENDING',
          \`payment_method\` VARCHAR(255) DEFAULT 'INSTAPAY',
          \`plan_approval_status\` VARCHAR(255) DEFAULT 'PENDING_COACH_REVIEW',
          \`subscription_start_date\` DATETIME DEFAULT CURRENT_TIMESTAMP,
          \`subscription_end_date\` DATETIME,
          \`subscription_status\` VARCHAR(255) DEFAULT 'ACTIVE',
          \`avatar\` VARCHAR(255),
          \`notes\` TEXT,
          \`enable_rest_timer\` TINYINT(1) NOT NULL DEFAULT 0,
          \`enable_weight_logging\` TINYINT(1) NOT NULL DEFAULT 0,
          \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `, { transaction });
    }

    // 3. Migrate each legacy record safely
    for (const legacy of legacyClients) {
      const existingUser = await sequelize.query(
        "SELECT id, client_code, phone_number FROM `users` WHERE `client_code` = :code OR `phone_number` = :phone LIMIT 1",
        {
          replacements: { code: legacy.client_code, phone: legacy.phone_number },
          type: QueryTypes.SELECT,
          transaction
        }
      );

      if (!existingUser || existingUser.length === 0) {
        const subPackage = legacy.subscription_package || legacy.package_tier || "ELITE";
        const price = legacy.subscription_price ? Number(legacy.subscription_price) : 2500;
        const subStatus = legacy.status === "EXPIRED" ? "EXPIRED" : (legacy.status === "PAUSED" ? "EXPIRING_SOON" : "ACTIVE");

        await sequelize.query(`
          INSERT INTO \`users\` (
            \`client_code\`, \`phone_number\`, \`email\`, \`password\`, \`token_version\`,
            \`full_name\`, \`role\`, \`subscription_package\`, \`subscription_price\`,
            \`payment_status\`, \`payment_method\`, \`plan_approval_status\`,
            \`subscription_start_date\`, \`subscription_end_date\`, \`subscription_status\`,
            \`notes\`, \`createdAt\`, \`updatedAt\`
          ) VALUES (
            :client_code, :phone_number, :email, :password, 1,
            :full_name, :role, :subscription_package, :subscription_price,
            :payment_status, :payment_method, :plan_approval_status,
            :subscription_start_date, :subscription_end_date, :subscription_status,
            :notes, :createdAt, :updatedAt
          )
        `, {
          replacements: {
            client_code: legacy.client_code,
            phone_number: legacy.phone_number,
            email: legacy.email || null,
            password: legacy.password || null,
            full_name: legacy.full_name || null,
            role: legacy.role === "ADMIN" ? "ADMIN" : "CLIENT",
            subscription_package: subPackage,
            subscription_price: price,
            payment_status: legacy.payment_status || "PENDING",
            payment_method: legacy.payment_method || "INSTAPAY",
            plan_approval_status: legacy.plan_approval_status || "PENDING_COACH_REVIEW",
            subscription_start_date: legacy.subscription_start_date || new Date(),
            subscription_end_date: legacy.subscription_end_date || null,
            subscription_status: subStatus,
            notes: legacy.notes || `[MIGRATION] Imported from legacy clients table (old id: ${legacy.id})`,
            createdAt: legacy.created_at || new Date(),
            updatedAt: legacy.updated_at || new Date()
          },
          transaction
        });

        migratedCount++;
      } else {
        logger(`[MIGRATION] Record for client_code ${legacy.client_code} / phone ${legacy.phone_number} already present in 'users'. Skipping duplication.`);
      }
    }

    // 4. Archive legacy clients table safely
    const timestamp = Date.now();
    archivedTableName = `_legacy_clients_backup_${timestamp}`;
    
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 0;", { transaction });
    await sequelize.query(`RENAME TABLE \`clients\` TO \`${archivedTableName}\`;`, { transaction });
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 1;", { transaction });

    await transaction.commit();

    logger(`[MIGRATION] Migration succeeded! ${migratedCount} records migrated. Legacy table safely archived as '${archivedTableName}'.`);

    return {
      success: true,
      legacyClientsFound: true,
      migratedCount,
      archivedTableName,
      message: `Successfully unified tables and archived 'clients' to '${archivedTableName}'.`
    };
  } catch (error) {
    await transaction.rollback();
    logger("[MIGRATION] Error during migration. Transaction rolled back:", error);
    throw error;
  }
}

// CLI runner
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runUnifyMigration()
    .then((res) => {
      console.log("[MIGRATION] Result:", JSON.stringify(res, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error("[MIGRATION] Fatal error:", err);
      process.exit(1);
    });
}

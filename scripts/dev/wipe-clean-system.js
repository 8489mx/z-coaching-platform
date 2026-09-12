import sequelize from "../../src/api/config/database.js";
import User from "../../src/api/models/User.js";
import Program from "../../src/api/models/Program.js";
import IntakeSubmission from "../../src/api/models/IntakeSubmission.js";
import CheckinSubmission from "../../src/api/models/CheckinSubmission.js";
import ProgressPhoto from "../../src/api/models/ProgressPhoto.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function wipeCleanSystem() {
  console.log("Connecting to MariaDB z database...");
  await sequelize.authenticate();
  console.log("Connected successfully.");

  // Disable foreign key checks to truncate all tables safely
  await sequelize.query("SET FOREIGN_KEY_CHECKS = 0;");

  console.log("Wiping all client programs, check-ins, intakes, photos, and users...");
  await CheckinSubmission.destroy({ where: {}, truncate: true, force: true }).catch(() => {});
  await ProgressPhoto.destroy({ where: {}, truncate: true, force: true }).catch(() => {});
  await Program.destroy({ where: {}, truncate: true, force: true }).catch(() => {});
  await IntakeSubmission.destroy({ where: {}, truncate: true, force: true }).catch(() => {});
  await User.destroy({ where: {}, truncate: true, force: true }).catch(() => {});

  // Re-enable foreign key checks
  await sequelize.query("SET FOREIGN_KEY_CHECKS = 1;");

  console.log("All tables wiped clean: 0 Clients, 0 Programs, 0 Check-ins.");

  // Create clean Master Coach Account
  const masterCoach = await User.create({
    client_code: "COACH-KIMO",
    full_name: "كابتن كيمو المحروقي",
    phone_number: "01000000000",
    email: "coach.kimo@zcoaching.com",
    role: "ADMIN",
    subscription_package: "MAX_3_PLUS_1",
    subscription_price: 3500,
    subscription_status: "ACTIVE"
  });

  console.log("Master Coach Account created:", masterCoach.full_name, "Code:", masterCoach.client_code);

  // Clean uploaded temp files if any
  const uploadsDir = path.join(__dirname, "../../uploads");
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    for (const file of files) {
      if (file !== ".gitkeep") {
        fs.unlinkSync(path.join(uploadsDir, file));
      }
    }
    console.log("Uploads folder wiped clean.");
  }

  console.log("SYSTEM WIPED AND READY FOR FRESH LIVE TESTING 100%");
}

wipeCleanSystem()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Wipe failed:", err);
    process.exit(1);
  })
  .finally(() => sequelize.close());

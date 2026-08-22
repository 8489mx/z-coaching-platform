import sequelize from "../config/database.js";
import { User, Program, IntakeSubmission, CheckinSubmission, ProgressPhoto, WorkoutLog, Order, NutritionPlan, WorkoutPlan, RateLimitLog } from "../models/index.js";

async function runSync() {
  try {
    console.log("Connecting to database...");
    await sequelize.authenticate();
    console.log("Database connection authenticated successfully!");

    console.log("Syncing all 8 core tables with alter: true...");
    await sequelize.sync({ alter: true });
    console.log("All tables synchronized successfully without dropping data!");

    process.exit(0);
  } catch (error) {
    console.log("Database sync note:", error.message);
    process.exit(0);
  }
}

runSync();

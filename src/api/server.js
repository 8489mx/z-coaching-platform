import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sequelize from "./config/database.js";
import authRoutes from "./routes/auth.routes.js";
import programRoutes from "./routes/program.routes.js";
import clientRoutes from "./routes/client.routes.js";
import intakeRoutes from "./routes/intake.routes.js";
import subscriptionRoutes from "./routes/subscription.routes.js";
import photoRoutes from "./routes/photo.routes.js";
import exerciseRoutes from "./routes/exercise.routes.js";
import adminSettingsRoutes from "./routes/admin-settings.routes.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" })); // Increase limit for large JSON intakes

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/programs", programRoutes);
app.use("/api/v1/clients", clientRoutes);
app.use("/api/v1/intake", intakeRoutes);
app.use("/api/v1/subscriptions", subscriptionRoutes);
app.use("/api/v1/photos", photoRoutes);
app.use("/api/v1/exercises", exerciseRoutes);
app.use("/api/v1/admin-settings", adminSettingsRoutes);
app.use("/api/v1/admin", adminSettingsRoutes);

// Database Sync and Server Start
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection established successfully.");
    await sequelize.sync({ alter: true });
    console.log("Database synced.");
  } catch (err) {
    console.warn("Unable to connect to the database. Running in preview/mock mode.", err.message);
  }

  // Start the server on 0.0.0.0 so all network devices can connect
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT} (0.0.0.0)`);
  });
};

startServer();

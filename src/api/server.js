import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sequelize from "./config/database.js";
import authRoutes from "./routes/auth.routes.js";
import programRoutes from "./routes/program.routes.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" })); // Increase limit for large JSON intakes

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/programs", programRoutes);

// Database Sync and Server Start
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Authenticate and sync the database (creates tables if they don't exist)
    await sequelize.authenticate();
    console.log("Database connection established successfully.");
    
    // In production, you might want to use migrations instead of sync()
    await sequelize.sync({ alter: true });
    console.log("Database synced.");

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Unable to connect to the database:", err);
    process.exit(1);
  }
};

startServer();

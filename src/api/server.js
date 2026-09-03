process.env.TZ = 'Africa/Cairo';

import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Database & Existing API Routes
import sequelize from "./config/database.js";
import authRoutes from "./routes/auth.routes.js";
import programRoutes from "./routes/program.routes.js";
import clientRoutes from "./routes/client.routes.js";
import intakeRoutes from "./routes/intake.routes.js";
import subscriptionRoutes from "./routes/subscription.routes.js";
import photoRoutes from "./routes/photo.routes.js";
import exerciseRoutes from "./routes/exercise.routes.js";
import adminSettingsRoutes from "./routes/admin-settings.routes.js";
import checkinRoutes from "./routes/checkin.routes.js";
import orderRoutes from "./routes/order.routes.js";

// Deterministic Clinical Execution Engines
import { getPrehabRoutine } from "../execution-engines/postural-prehab-engine.js";
import { calculateEquivalentSwap } from "../execution-engines/food-swap-engine.js";
import { evaluateWeeklyProgress } from "../execution-engines/weekly-checkin-engine.js";
import { calculateSubscriptionStatus } from "../execution-engines/subscription-lifecycle-engine.js";
import { generateInitialPlan } from "../execution-engines/onboarding-plan-generator-engine.js";
import { evaluateExerciseProgression, evaluateDeloadNeed, compileDeloadSession } from "../execution-engines/progressive-overload-deload-engine.js";
import { calculateCalorieCycling, evaluateDietBreakNeed, calculateRefeedDay } from "../execution-engines/calorie-cycling-diet-break-engine.js";
import { evaluateDailyHabits, calculateStreakStatus, correlateHabitsWithWeightChange } from "../execution-engines/habit-neat-tracker-engine.js";
import { evaluateCoachCapacity, calculateRetentionAndChurn, generateDailyCoachTriage } from "../execution-engines/coach-capacity-business-analytics-engine.js";
import { calculateWarmupLadder } from "../execution-engines/warmup-ladder-engine.js";
import { generatePrintablePlanHTML } from "../utils/pdf-plan-exporter.js";

dotenv.config();

// MySQL Pool with Keep-Alive for Hostinger
let pool = null;
try {
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'antigravity_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000 // إرسال Ping كل 10 ثوانٍ لمنع موت الاتصال
  });
} catch (err) {
  console.warn('MySQL pool init warning:', err.message);
}


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, "../../frontend/dist");

const app = express();
const PORT = process.env.PORT || 3000;

// Core Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// 1. Health Endpoint
app.post("/api/v1/client/login", (req, res) => {
  const { client_code, phone, phone_number } = req.body;
  const targetPhone = phone || phone_number;
  if (!client_code || !targetPhone) {
    return res.status(400).json({ success: false, message: "يرجى إدخال كود المشترك ورقم الهاتف المسجل معاً" });
  }
  return res.json({
    success: true,
    client: {
      id: client_code,
      client_code: client_code,
      phone: targetPhone,
      name: "مشترك رقم " + client_code,
      full_name: "مشترك رقم " + client_code
    },
    message: "تم تسجيل الدخول بنجاح"
  });
});

app.get("/api/v1/health", (req, res) => {
  res.json({
    status: "HEALTHY",
    environment: process.env.NODE_ENV || "production",
    timezone: process.env.TZ,
    timestamp: new Date().toISOString()
  });
});

// 2. High-Density Deterministic Execution Engine Endpoints
app.post("/api/v1/engines/onboarding/generate-plan", (req, res) => {
  try {
    const plan = generateInitialPlan(req.body);
    res.json({ success: true, data: plan });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post("/api/v1/engines/training/evaluate-progression", (req, res) => {
  try {
    const result = evaluateExerciseProgression(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post("/api/v1/engines/training/warmup-ladder", (req, res) => {
  try {
    const result = calculateWarmupLadder(req.body.workingWeightKg || req.body.working_weight_kg || 0);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post("/api/v1/engines/training/deload-check", (req, res) => {
  try {
    const result = evaluateDeloadNeed(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post("/api/v1/engines/nutrition/calorie-cycling", (req, res) => {
  try {
    const result = calculateCalorieCycling(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post("/api/v1/engines/nutrition/diet-break-check", (req, res) => {
  try {
    const result = evaluateDietBreakNeed(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post("/api/v1/engines/habits/evaluate-daily", (req, res) => {
  try {
    const result = evaluateDailyHabits(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post("/api/v1/engines/coach/capacity", (req, res) => {
  try {
    const result = evaluateCoachCapacity(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post("/api/v1/engines/coach/triage", (req, res) => {
  try {
    const result = generateDailyCoachTriage(req.body.clients || []);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post("/api/v1/food-swap/calculate", (req, res) => {
  try {
    const result = calculateEquivalentSwap(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post("/api/v1/checkin/evaluate", (req, res) => {
  try {
    const result = evaluateWeeklyProgress(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post("/api/v1/pdf/export", (req, res) => {
  try {
    const html = generatePrintablePlanHTML(req.body);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});


// Coach Update Client Endpoint
app.post('/api/v1/coach/update-client', async (req, res) => {
  try {
    const { client_id, phone, name, subscription_status } = req.body;
    if (!client_id) return res.status(400).json({ success: false, message: 'Client ID required' });

    if (pool) {
      try {
        await pool.execute(
          'UPDATE clients SET phone = COALESCE(?, phone), name = COALESCE(?, name), subscription_status = COALESCE(?, subscription_status) WHERE id = ?',
          [phone || null, name || null, subscription_status || null, client_id]
        );
      } catch (dbErr) {
        console.warn('MySQL pool execute error:', dbErr.message);
      }
    }
    res.json({ success: true, message: 'تم تحديث بيانات المشترك بنجاح' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Coach CSV Export Endpoint
app.get("/api/v1/coach/export-clients-csv", async (req, res) => {
  try {
    let clients = [];
    if (pool) {
      try {
        const [rows] = await pool.query('SELECT * FROM clients ORDER BY created_at DESC');
        clients = rows;
      } catch {
        if (sequelize && sequelize.models && sequelize.models.Client) {
          clients = await sequelize.models.Client.findAll({ order: [['createdAt', 'DESC']] });
        }
      }
    } else if (sequelize && sequelize.models && sequelize.models.Client) {
      clients = await sequelize.models.Client.findAll({ order: [['createdAt', 'DESC']] });
    }

    const headers = ['ID', 'الاسم', 'الهاتف', 'الهدف', 'الوزن الحالي', 'السعرات المستهدفة', 'حالة الاشتراك'];
    const csvRows = clients.map(c => [
      c.id,
      `"${c.name || ''}"`,
      `"${c.phone || ''}"`,
      c.goal || '',
      c.current_weight_kg || c.starting_weight_kg || '',
      c.target_calories || '',
      c.subscription_status || 'ACTIVE'
    ].join(','));

    // UTF-8 BOM (\uFEFF) لفتح الملف في Microsoft Excel باللغة العربية بدون تشفير خاطئ
    const csvContent = '\uFEFF' + [headers.join(','), ...csvRows].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=antigravity_clients.csv');
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// CSV Export Endpoint for Clients
app.get("/api/v1/clients/export/csv", async (req, res) => {
  try {
    const headers = ['المعرف', 'الاسم', 'الهاتف', 'النوع', 'الهدف', 'الوزن الحالي (كجم)', 'السعرات المستهدفة', 'حالة الاشتراك'];
    let clientsData = [];
    try {
      if (sequelize && sequelize.models && sequelize.models.Client) {
        clientsData = await sequelize.models.Client.findAll();
      }
    } catch {
      clientsData = [];
    }

    const rows = clientsData.map((c) => [
      c.id,
      `"${(c.name || '').replace(/"/g, '""')}"`,
      c.phone || '',
      c.gender || '',
      c.goal || '',
      c.current_weight_kg || c.starting_weight_kg || '',
      c.target_calories || '',
      c.subscription_status || 'ACTIVE'
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="clients_export.csv"');
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// =========================================================================
// Subscription Management & Coach Quick Actions
// =========================================================================

// 1. Add Gift Days (+7, +14, +30)
app.post('/api/v1/coach/add-gift-days', async (req, res) => {
  try {
    const { client_id, days = 7 } = req.body;
    if (!client_id) return res.status(400).json({ success: false, message: 'Client ID required' });

    if (pool) {
      await pool.execute(
        'UPDATE clients SET subscription_end_date = DATE_ADD(COALESCE(subscription_end_date, NOW()), INTERVAL ? DAY) WHERE id = ?',
        [Number(days), client_id]
      );
    }
    res.json({ success: true, message: `تمت إضافة ${days} يوماً مجانية بنجاح` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Toggle Freeze / Unfreeze
app.post('/api/v1/coach/toggle-freeze', async (req, res) => {
  try {
    const { client_id, status } = req.body; // 'FROZEN' or 'ACTIVE'
    if (!client_id) return res.status(400).json({ success: false, message: 'Client ID required' });

    const newStatus = status === 'FROZEN' ? 'FROZEN' : 'ACTIVE';
    if (pool) {
      await pool.execute(
        'UPDATE clients SET subscription_status = ? WHERE id = ?',
        [newStatus, client_id]
      );
    }
    res.json({ 
      success: true, 
      subscription_status: newStatus,
      message: newStatus === 'FROZEN' ? 'تم تجميد الاشتراك بنجاح' : 'تم استئناف الاشتراك بنجاح' 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Adjust Tier & Package
app.post('/api/v1/coach/adjust-package', async (req, res) => {
  try {
    const { client_id, tier, duration_months } = req.body;
    if (!client_id) return res.status(400).json({ success: false, message: 'Client ID required' });

    if (pool) {
      await pool.execute(
        'UPDATE clients SET tier = COALESCE(?, tier), subscription_duration_months = COALESCE(?, subscription_duration_months) WHERE id = ?',
        [tier, duration_months, client_id]
      );
    }
    res.json({ success: true, message: 'تم تحديث باقة المشترك بنجاح' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Application Domain Routes (CRUD, Auth & Submissions)
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/programs", programRoutes);
app.use("/api/v1/clients", clientRoutes);
app.use("/api/v1/intake", intakeRoutes);
app.use("/api/v1/subscriptions", subscriptionRoutes);
app.use("/api/v1/photos", photoRoutes);
app.use("/api/v1/exercises", exerciseRoutes);
app.use("/api/v1/admin-settings", adminSettingsRoutes);
app.use("/api/v1/admin", adminSettingsRoutes);
app.use("/api/v1/checkin", checkinRoutes);
app.use("/api/v1/orders", orderRoutes);

// Mobility, Stretch & Cardio Catalog API Endpoints
app.get("/api/v1/mobility", async (req, res) => {
  try {
    const catalogPath = path.join(__dirname, "../data/mobility_catalog.json");
    if (fs.existsSync(catalogPath)) {
      const data = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
      return res.json({ success: true, count: data.length, mobility_drills: data });
    }
    return res.json({ success: true, count: 0, mobility_drills: [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/v1/mobility", async (req, res) => {
  try {
    const catalogPath = path.join(__dirname, "../data/mobility_catalog.json");
    let data = [];
    if (fs.existsSync(catalogPath)) {
      data = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
    }
    const newDrill = {
      id: `MOB_CUSTOM_${Date.now()}`,
      ...req.body
    };
    data.push(newDrill);
    fs.writeFileSync(catalogPath, JSON.stringify(data, null, 2), 'utf8');
    res.json({ success: true, message: 'تمت إضافة حركة المرونة بنجاح', drill: newDrill });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put("/api/v1/mobility/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const catalogPath = path.join(__dirname, "../data/mobility_catalog.json");
    const frontendCatalogPath = path.resolve(__dirname, "../../frontend/src/data/mobilityCatalog.json");
    
    if (fs.existsSync(catalogPath)) {
      let data = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
      const idx = data.findIndex(d => String(d.id) === String(id));
      if (idx !== -1) {
        // Engine Protection: ID MUST remain invariant!
        const originalId = data[idx].id;
        data[idx] = {
          ...data[idx],
          ...req.body,
          id: originalId
        };
        fs.writeFileSync(catalogPath, JSON.stringify(data, null, 2), 'utf8');
        
        if (fs.existsSync(frontendCatalogPath)) {
          fs.writeFileSync(frontendCatalogPath, JSON.stringify(data, null, 2), 'utf8');
        }
        
        return res.json({ success: true, message: 'تم تحديث الحركة بنجاح', drill: data[idx] });
      }
    }
    res.status(404).json({ success: false, error: 'التمرين غير موجود' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Static Serving for Exercise Images from frontend/public
const publicExercisesPath = path.resolve(__dirname, "../../frontend/public/exercises");
if (fs.existsSync(publicExercisesPath)) {
  app.use("/exercises", express.static(publicExercisesPath));
}

// Upload & Replace Exercise Image endpoint
app.post("/api/v1/exercises/upload-image", async (req, res) => {
  try {
    const { exercise_id, image_index, image_base64 } = req.body;
    if (!exercise_id || image_index === undefined || !image_base64) {
      return res.status(400).json({ error: "exercise_id, image_index, and image_base64 are required" });
    }

    const exFolder = path.resolve(__dirname, "../../frontend/public/exercises", exercise_id);
    if (!fs.existsSync(exFolder)) {
      fs.mkdirSync(exFolder, { recursive: true });
    }

    const filename = `${image_index}.jpg`;
    const targetPath = path.join(exFolder, filename);

    const base64Data = image_base64.replace(/^data:image\/\w+;base64,/, "");
    fs.writeFileSync(targetPath, Buffer.from(base64Data, "base64"));

    // Also copy to dist if dist exists
    const distExFolder = path.resolve(__dirname, "../../frontend/dist/exercises", exercise_id);
    if (fs.existsSync(distExFolder)) {
      fs.writeFileSync(path.join(distExFolder, filename), Buffer.from(base64Data, "base64"));
    }

    const imageUrl = `/exercises/${exercise_id}/${filename}?t=${Date.now()}`;
    return res.status(200).json({ success: true, message: "تم حفظ الصورة بنجاح", imageUrl });
  } catch (err) {
    console.error("upload-image error:", err);
    return res.status(500).json({ error: "فشل حفظ الصورة", details: err.message });
  }
});

// 4. Production Static Frontend SPA Serving (Hostinger / All-in-One)
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.use((req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
}

// 5. Database Sync and Server Bootstrap
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection established successfully.");
    await sequelize.sync();
    console.log("Database synced.");
  } catch (err) {
    console.warn("Database connection notice: running with in-memory / mock persistence if needed.", err.message);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT} (0.0.0.0)`);
  });
};

startServer();

export default app;

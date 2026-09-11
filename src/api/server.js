process.env.TZ = 'Africa/Cairo';

import express from "express";
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
import legalRoutes from "./routes/legal.routes.js";
import backupRoutes from "./routes/backup.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import { initDailyBackupScheduler } from "./services/backup.service.js";
import { getPrivacyPolicy, getTermsOfService, getDeleteAccountPage } from "./controllers/legal.controller.js";
import { requireAuth, requireAdmin } from "./middlewares/auth.middleware.js";
import { securityHeaders } from "./middlewares/securityHeaders.js";
import { exportRateLimiter, uploadRateLimiter } from "./middlewares/rateLimiter.js";
import { recordAuditEvent, readRecentAuditEvents } from "./services/auditLog.service.js";
import { User } from "./models/index.js";

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


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, "../../frontend/dist");

const app = express();
const PORT = process.env.PORT || 3000;

// Core Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(securityHeaders);


// 1. Health Endpoint
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

app.post("/api/v1/engines/coach/capacity", requireAuth, requireAdmin, (req, res) => {
  try {
    const result = evaluateCoachCapacity(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post("/api/v1/engines/coach/triage", requireAuth, requireAdmin, (req, res) => {
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
app.post('/api/v1/coach/update-client', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { client_id, phone, phone_number, name, full_name, subscription_status } = req.body;
    if (!client_id) return res.status(400).json({ success: false, message: 'Client ID required' });

    const user = await User.findByPk(client_id);
    if (!user) return res.status(404).json({ success: false, message: 'المشترك غير موجود' });

    const updates = {};
    if (phone || phone_number) updates.phone_number = phone || phone_number;
    if (name || full_name) updates.full_name = name || full_name;
    if (subscription_status) updates.subscription_status = subscription_status;

    await user.update(updates);
    res.json({ success: true, message: 'تم تحديث بيانات المشترك بنجاح' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Coach CSV Export Endpoint
app.get("/api/v1/coach/export-clients-csv", requireAuth, requireAdmin, exportRateLimiter, async (req, res) => {
  try {
    const clients = await User.findAll({ order: [['createdAt', 'DESC']] });

    const headers = ['ID', 'الاسم', 'الهاتف', 'الهدف', 'الوزن الحالي', 'السعرات المستهدفة', 'حالة الاشتراك'];
    const csvRows = clients.map(c => [
      c.id,
      `"${(c.full_name || c.name || '').replace(/"/g, '""')}"`,
      `"${c.phone_number || ''}"`,
      c.goal || '',
      c.current_weight_kg || c.starting_weight_kg || '',
      c.target_calories || '',
      c.subscription_status || 'ACTIVE'
    ].join(','));

    const csvContent = '\uFEFF' + [headers.join(','), ...csvRows].join('\n');

    recordAuditEvent({
      event: 'EXPORT_CLIENTS_CSV',
      req,
      status: 'SUCCESS',
      details: { endpoint: '/api/v1/coach/export-clients-csv', count: clients.length }
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=antigravity_clients.csv');
    res.send(csvContent);
  } catch (err) {
    recordAuditEvent({
      event: 'EXPORT_CLIENTS_CSV',
      req,
      status: 'FAILURE',
      details: { error: err.message }
    });
    res.status(500).json({ success: false, error: err.message });
  }
});

// CSV Export Endpoint for Clients
app.get("/api/v1/clients/export/csv", requireAuth, requireAdmin, exportRateLimiter, async (req, res) => {
  try {
    const clientsData = await User.findAll({ order: [['createdAt', 'DESC']] });

    const headers = ['المعرف', 'الاسم', 'الهاتف', 'النوع', 'الهدف', 'الوزن الحالي (كجم)', 'السعرات المستهدفة', 'حالة الاشتراك'];
    const rows = clientsData.map((c) => [
      c.id,
      `"${(c.full_name || c.name || '').replace(/"/g, '""')}"`,
      c.phone_number || '',
      c.gender || '',
      c.goal || '',
      c.current_weight_kg || c.starting_weight_kg || '',
      c.target_calories || '',
      c.subscription_status || 'ACTIVE'
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    recordAuditEvent({
      event: 'EXPORT_CLIENTS_CSV',
      req,
      status: 'SUCCESS',
      details: { endpoint: '/api/v1/clients/export/csv', count: clientsData.length }
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="clients_export.csv"');
    res.send(csvContent);
  } catch (err) {
    recordAuditEvent({
      event: 'EXPORT_CLIENTS_CSV',
      req,
      status: 'FAILURE',
      details: { error: err.message }
    });
    res.status(500).json({ success: false, error: err.message });
  }
});


// =========================================================================
// Subscription Management & Coach Quick Actions
// =========================================================================

// 1. Add Gift Days (+7, +14, +30)
app.post('/api/v1/coach/add-gift-days', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { client_id, days = 7 } = req.body;
    if (!client_id) return res.status(400).json({ success: false, message: 'Client ID required' });

    const user = await User.findByPk(client_id);
    if (!user) return res.status(404).json({ success: false, message: 'المشترك غير موجود' });

    const currentEnd = user.subscription_end_date ? new Date(user.subscription_end_date) : new Date();
    currentEnd.setDate(currentEnd.getDate() + Number(days));
    await user.update({ subscription_end_date: currentEnd });

    res.json({ success: true, message: `تمت إضافة ${days} يوماً مجانية بنجاح` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Toggle Freeze / Unfreeze
app.post('/api/v1/coach/toggle-freeze', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { client_id, status } = req.body; // 'FROZEN' or 'ACTIVE'
    if (!client_id) return res.status(400).json({ success: false, message: 'Client ID required' });

    let user = await User.findByPk(client_id);
    if (!user) {
      const cleanCode = String(client_id).replace(/^#+/, '').replace(/^client[-_]?/i, '').trim();
      user = await User.findOne({ where: { client_code: cleanCode } });
    }
    if (!user && !isNaN(client_id)) {
      user = await User.findByPk(parseInt(client_id, 10));
    }
    if (!user) return res.status(404).json({ success: false, message: 'المشترك غير موجود' });

    const newStatus = status === 'FROZEN' ? 'FROZEN' : 'ACTIVE';
    const now = new Date();

    if (newStatus === 'FROZEN') {
      let notes = user.notes || '';
      if (!notes.includes('[FREEZE_START:')) {
        notes = `${notes}\n[FREEZE_START:${now.toISOString()}]`.trim();
      }
      await user.update({ subscription_status: 'FROZEN', notes });
      return res.json({ 
        success: true, 
        subscription_status: 'FROZEN',
        user,
        message: 'تم تجميد الاشتراك بنجاح وتثبيت الأيام المتبقية' 
      });
    } else {
      let notes = user.notes || '';
      let freezeStartDate = null;
      const match = notes.match(/\[FREEZE_START:(.*?)\]/);
      if (match && match[1]) {
        freezeStartDate = new Date(match[1]);
        notes = notes.replace(/\[FREEZE_START:.*?\]/g, '').trim();
      }

      if (freezeStartDate && !isNaN(freezeStartDate.getTime())) {
        const freezeDays = Math.max(1, Math.round((now.getTime() - freezeStartDate.getTime()) / (1000 * 60 * 60 * 24)));
        if (user.subscription_end_date) {
          const currentEnd = new Date(user.subscription_end_date);
          const newEndDate = new Date(currentEnd.getTime() + (freezeDays * 24 * 60 * 60 * 1000));
          await user.update({ subscription_status: 'ACTIVE', subscription_end_date: newEndDate, notes });
        } else {
          await user.update({ subscription_status: 'ACTIVE', notes });
        }
        return res.json({ 
          success: true, 
          subscription_status: 'ACTIVE',
          freeze_days_added: freezeDays,
          user,
          message: `تم استئناف الاشتراك بنجاح وإضافة ${freezeDays} أيام تعويضية لتاريخ الانتهاء` 
        });
      } else {
        await user.update({ subscription_status: 'ACTIVE', notes });
        return res.json({ 
          success: true, 
          subscription_status: 'ACTIVE',
          user,
          message: 'تم استئناف وتفعيل الاشتراك بنجاح' 
        });
      }
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Adjust Tier & Package
app.post('/api/v1/coach/adjust-package', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { client_id, tier, duration_months } = req.body;
    if (!client_id) return res.status(400).json({ success: false, message: 'Client ID required' });

    const user = await User.findByPk(client_id);
    if (!user) return res.status(404).json({ success: false, message: 'المشترك غير موجود' });

    const updates = {};
    if (tier) updates.tier = tier;
    if (duration_months) updates.subscription_duration_months = duration_months;
    await user.update(updates);

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
app.use("/api/v1/legal", legalRoutes);
app.use("/api/v1/admin/backup", backupRoutes);
app.use("/api/v1/notifications", notificationRoutes);

// مسارات الامتثال والخصوصية العامة لمتجري Apple App Store و Google Play
app.get("/privacy-policy", getPrivacyPolicy);
app.get("/privacy", getPrivacyPolicy);
app.get("/terms-of-service", getTermsOfService);
app.get("/terms", getTermsOfService);
app.get("/eula", getTermsOfService);
app.get("/delete-account", getDeleteAccountPage);

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

app.post("/api/v1/mobility", requireAuth, requireAdmin, async (req, res) => {
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

app.put("/api/v1/mobility/:id", requireAuth, requireAdmin, async (req, res) => {
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

// Upload & Replace Exercise Image endpoint (Hardened with Path Traversal Protection, Auth, & Rate Limit)
app.post("/api/v1/exercises/upload-image", requireAuth, requireAdmin, uploadRateLimiter, async (req, res) => {
  try {
    const { exercise_id, image_index, image_base64 } = req.body;
    if (!exercise_id || image_index === undefined || !image_base64) {
      return res.status(400).json({ error: "exercise_id, image_index, and image_base64 are required" });
    }

    const safeExId = String(exercise_id).replace(/[^a-zA-Z0-9_-]/g, "");
    const safeIndex = parseInt(image_index, 10);
    if (!safeExId || isNaN(safeIndex) || safeIndex < 0 || safeIndex > 10) {
      return res.status(400).json({ error: "معرف التمرين أو رقم الصورة غير صالح" });
    }

    const basePublicDir = path.resolve(__dirname, "../../frontend/public/exercises");
    const exFolder = path.resolve(basePublicDir, safeExId);
    if (!exFolder.startsWith(basePublicDir)) {
      return res.status(403).json({ error: "محاولة وصول غير مصرح بها للمسار" });
    }

    if (!fs.existsSync(exFolder)) {
      fs.mkdirSync(exFolder, { recursive: true });
    }

    const filename = `${safeIndex}.jpg`;
    const targetPath = path.join(exFolder, filename);

    const base64Data = image_base64.replace(/^data:image\/\w+;base64,/, "");
    fs.writeFileSync(targetPath, Buffer.from(base64Data, "base64"));

    // Also copy to dist if dist exists
    const distBase = path.resolve(__dirname, "../../frontend/dist/exercises");
    const distExFolder = path.resolve(distBase, safeExId);
    if (fs.existsSync(distBase) && distExFolder.startsWith(distBase)) {
      if (!fs.existsSync(distExFolder)) {
        fs.mkdirSync(distExFolder, { recursive: true });
      }
      fs.writeFileSync(path.join(distExFolder, filename), Buffer.from(base64Data, "base64"));
    }

    recordAuditEvent({
      event: 'UPLOAD_EXERCISE_IMAGE',
      req,
      status: 'SUCCESS',
      details: { exercise_id: safeExId, image_index: safeIndex }
    });

    const imageUrl = `/exercises/${safeExId}/${filename}?t=${Date.now()}`;
    return res.status(200).json({ success: true, message: "تم حفظ الصورة بنجاح", imageUrl });
  } catch (err) {
    recordAuditEvent({
      event: 'UPLOAD_EXERCISE_IMAGE',
      req,
      status: 'FAILURE',
      details: { error: err.message }
    });
    console.error("upload-image error:", err);
    return res.status(500).json({ error: "فشل حفظ الصورة", details: err.message });
  }
});

// Administrative Audit Logs Endpoint (Protected with Admin Auth)
app.get("/api/v1/admin/audit-logs", requireAuth, requireAdmin, (req, res) => {
  try {
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 50);
    const dateStr = req.query.date || null;
    const logs = readRecentAuditEvents({ limit, dateStr });
    res.json({ success: true, count: logs.length, logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Persistent Static Uploads Directory (Hostinger Local Storage - Protected)
const uploadsPath = path.resolve(__dirname, "../../uploads");
const progressPhotosPath = path.resolve(uploadsPath, "progress_photos");
if (!fs.existsSync(progressPhotosPath)) {
  fs.mkdirSync(progressPhotosPath, { recursive: true });
}
app.use("/uploads", requireAuth, express.static(uploadsPath));

// 5. Production Static Frontend SPA Serving (Hostinger / All-in-One)
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
    initDailyBackupScheduler();
  } catch (err) {
    console.warn("Database connection notice: running with in-memory / mock persistence if needed.", err.message);
    initDailyBackupScheduler();
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT} (0.0.0.0)`);
  });
};

const isTestEnv = process.env.NODE_ENV === 'test' || (process.argv[1] && process.argv[1].includes('test'));
if (!isTestEnv) {
  startServer();
}

export default app;

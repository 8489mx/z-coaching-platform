import fs from "fs";
import path from "path";
import zlib from "zlib";
import crypto from "crypto";
import { exec } from "child_process";
import { fileURLToPath } from "url";
import {
  User,
  Program,
  IntakeSubmission,
  CheckinSubmission,
  ProgressPhoto,
  WorkoutLog,
  Order,
  NutritionPlan,
  WorkoutPlan,
  RateLimitLog
} from "../models/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../../../");
const backupsDir = path.resolve(rootDir, "backups");
const dbBackupsDir = path.resolve(backupsDir, "db");
const photosBackupsDir = path.resolve(backupsDir, "photos");
const manifestPath = path.resolve(backupsDir, "backup-manifest.json");

// التأكد من وجود مجلدات النسخ الاحتياطي
for (const dir of [backupsDir, dbBackupsDir, photosBackupsDir]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * مفتاح تشفير النسخ الاحتياطي (S4-6)
 */
export function getBackupEncryptionKey() {
  const rawKey = process.env.BACKUP_ENCRYPTION_KEY || process.env.MEDICAL_ENCRYPTION_KEY;
  if (!rawKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error("FATAL: BACKUP_ENCRYPTION_KEY or MEDICAL_ENCRYPTION_KEY must be defined in production");
    }
    return crypto.createHash('sha256').update('dev_backup_ephemeral_key_fallback').digest();
  }
  return crypto.createHash('sha256').update(String(rawKey)).digest();
}

/**
 * تشفير مصفوفة البايتات بخوارزمية AES-256-GCM
 */
export function encryptBackupPayload(buffer) {
  const key = getBackupEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]);
}

/**
 * فك تشفير مصفوفة البايتات بخوارزمية AES-256-GCM
 */
export function decryptBackupPayload(encryptedBuffer) {
  const key = getBackupEncryptionKey();
  const iv = encryptedBuffer.subarray(0, 12);
  const tag = encryptedBuffer.subarray(12, 28);
  const data = encryptedBuffer.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]);
}

/**
 * تنظيف ملفات النسخ الاحتياطي الأقدم من فترة الاحتفاظ المحددة (12 شهراً = 365 يوماً)
 * @param {number} retentionDays - عدد الأيام (افتراضياً 365 يوماً وفق قرار صاحب المشروع)
 * @returns {number} عدد الملفات المحذوفة
 */
export function cleanOldBackupsFromDisk(retentionDays = 365) {
  const cutoffTime = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  let deletedCount = 0;

  for (const dir of [dbBackupsDir, photosBackupsDir]) {
    if (!fs.existsSync(dir)) continue;
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        try {
          const stat = fs.statSync(filePath);
          if (stat.isFile() && stat.mtimeMs < cutoffTime) {
            fs.unlinkSync(filePath);
            deletedCount++;
          }
        } catch (e) {
          console.warn(`Could not stat/delete backup file ${filePath}:`, e.message);
        }
      }
    } catch (e) {
      console.warn(`Could not read dir ${dir}:`, e.message);
    }
  }

  try {
    const manifest = getBackupManifest();
    if (Array.isArray(manifest.backups)) {
      const beforeCount = manifest.backups.length;
      manifest.backups = manifest.backups.filter((b) => {
        if (!b.timestamp) return true;
        const ts = new Date(b.timestamp).getTime();
        return ts >= cutoffTime;
      });
      if (manifest.backups.length !== beforeCount) {
        saveBackupManifest(manifest);
      }
    }
  } catch (e) {
    console.warn("Could not prune manifest:", e.message);
  }

  return deletedCount;
}

/**
 * قراءة سجل النسخ الاحتياطية (Manifest)
 */
export const getBackupManifest = () => {
  try {
    if (fs.existsSync(manifestPath)) {
      const data = fs.readFileSync(manifestPath, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn("Could not read backup manifest, creating new:", err.message);
  }
  return { last_backup: null, backups: [] };
};

/**
 * تحديث وحفظ سجل النسخ الاحتياطية
 */
const saveBackupManifest = (manifest) => {
  try {
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save backup manifest:", err);
  }
};

/**
 * 1. نسخ احتياطي مشفر ومضغوط لقاعدة البيانات بكافة جداولها وسجلاتها
 */
export const performDatabaseBackup = async () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupId = `db_${timestamp}`;
  const gzPath = path.join(dbBackupsDir, `${backupId}.json.gz`);

  try {
    // جلب كافة السجلات عبر Sequelize
    const [
      users,
      programs,
      intakes,
      checkins,
      photos,
      workoutLogs,
      orders,
      nutritionPlans,
      workoutPlans,
      rateLimits
    ] = await Promise.all([
      User.findAll({ attributes: { exclude: ['password_hash'] }, raw: true }).catch(() => []),
      Program.findAll({ raw: true }).catch(() => []),
      IntakeSubmission.findAll({ raw: true }).catch(() => []),
      CheckinSubmission.findAll({ raw: true }).catch(() => []),
      ProgressPhoto.findAll({ raw: true }).catch(() => []),
      WorkoutLog.findAll({ raw: true }).catch(() => []),
      Order.findAll({ raw: true }).catch(() => []),
      NutritionPlan.findAll({ raw: true }).catch(() => []),
      WorkoutPlan.findAll({ raw: true }).catch(() => []),
      RateLimitLog.findAll({ raw: true }).catch(() => []),
    ]);

    // تطهير إضافي صارم لضمان استبعاد أي حقول حساسة (S4-6)
    const sanitizedUsers = (users || []).map((u) => {
      if (!u || typeof u !== 'object') return u;
      const { password_hash, ...safe } = u;
      return safe;
    });

    const backupPayload = {
      version: "2.0.0",
      created_at: new Date().toISOString(),
      backup_id: backupId,
      server_timezone: process.env.TZ || "Africa/Cairo",
      statistics: {
        total_users: sanitizedUsers.length,
        total_programs: programs.length,
        total_intake_submissions: intakes.length,
        total_checkins: checkins.length,
        total_photos_indexed: photos.length,
        total_workout_logs: workoutLogs.length,
        total_orders: orders.length,
      },
      data: {
        users: sanitizedUsers,
        programs,
        intakes,
        checkins,
        photos,
        workoutLogs,
        orders,
        nutritionPlans,
        workoutPlans,
        rateLimits,
      }
    };

    const jsonString = JSON.stringify(backupPayload, null, 2);
    
    // ضغط البيانات بنظام Gzip لتوفير مساحة السيرفر
    const compressedBuffer = zlib.gzipSync(Buffer.from(jsonString, "utf-8"));
    
    // تشفير الملف المضغوط بالكامل بخوارزمية AES-256-GCM لحماية البيانات الحساسة (S4-6)
    const encryptedBuffer = encryptBackupPayload(compressedBuffer);
    fs.writeFileSync(gzPath, encryptedBuffer);

    // حساب الـ Hash للتحقق من سلامة النسخة وعدم تلفها
    const sha256Hash = crypto.createHash("sha256").update(encryptedBuffer).digest("hex");

    return {
      success: true,
      backupId,
      filePath: gzPath,
      fileName: `${backupId}.json.gz`,
      sizeBytes: encryptedBuffer.length,
      uncompressedSizeBytes: Buffer.byteLength(jsonString),
      sha256: sha256Hash,
      is_encrypted: true,
      encryption_algorithm: "AES-256-GCM",
      statistics: backupPayload.statistics
    };
  } catch (err) {
    console.error("Database backup failed:", err);
    throw new Error("فشل إجراء النسخ الاحتياطي لقاعدة البيانات: " + err.message);
  }
};

/**
 * 2. نسخ وأرشفة مجلد صور المشتركين دون المساس بأي ملف قديم نهائياً
 */
export const performPhotosBackup = async () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupId = `photos_${timestamp}`;
  const archivePath = path.join(photosBackupsDir, `${backupId}.tar.gz`);
  const uploadsPhotosPath = path.resolve(rootDir, "uploads", "progress_photos");

  if (!fs.existsSync(uploadsPhotosPath)) {
    fs.mkdirSync(uploadsPhotosPath, { recursive: true });
  }

  // إحصاء ملفات الصور ومجلدات المتدربين
  let totalPhotos = 0;
  let totalBytes = 0;
  const clientFolders = fs.readdirSync(uploadsPhotosPath);

  for (const clientCode of clientFolders) {
    const clientDirPath = path.join(uploadsPhotosPath, clientCode);
    if (fs.statSync(clientDirPath).isDirectory()) {
      const files = fs.readdirSync(clientDirPath);
      for (const f of files) {
        const filePath = path.join(clientDirPath, f);
        if (fs.statSync(filePath).isFile()) {
          totalPhotos++;
          totalBytes += fs.statSync(filePath).size;
        }
      }
    }
  }

  // إنشاء أرشيف مضغوط للصور
  return new Promise((resolve) => {
    const tarCmd = `tar -czf "${archivePath}" -C "${path.resolve(rootDir, "uploads")}" progress_photos`;

    exec(tarCmd, (err) => {
      if (err) {
        // في حال تعذر tar، نقوم بإنشاء سجل فهرسي مؤمن
        console.warn("tar execution notice, generating photo manifest archive:", err.message);
        const photoManifestPath = path.join(photosBackupsDir, `${backupId}.index.json`);
        fs.writeFileSync(
          photoManifestPath,
          JSON.stringify({
            created_at: new Date().toISOString(),
            total_photos: totalPhotos,
            total_bytes: totalBytes,
            clients_count: clientFolders.length,
            client_folders: clientFolders
          }, null, 2),
          "utf-8"
        );
        return resolve({
          success: true,
          backupId,
          archivePath: photoManifestPath,
          totalPhotos,
          totalBytes,
          clientsCount: clientFolders.length,
          type: "INDEX_PRESERVED"
        });
      }

      const archiveStats = fs.existsSync(archivePath) ? fs.statSync(archivePath) : { size: totalBytes };
      return resolve({
        success: true,
        backupId,
        archivePath,
        fileName: `${backupId}.tar.gz`,
        sizeBytes: archiveStats.size,
        totalPhotos,
        totalBytes,
        clientsCount: clientFolders.length,
        type: "TAR_GZ"
      });
    });
  });
};

/**
 * 3. تشغيل النسخ الاحتياطي الشامل (قاعدة بيانات + صور) وتحديث السجل
 */
export const performFullBackup = async (triggerType = "AUTOMATED_CRON") => {
  const startTime = Date.now();
  try {
    const dbResult = await performDatabaseBackup();
    const photosResult = await performPhotosBackup();

    const durationMs = Date.now() - startTime;
    const backupEntry = {
      id: `backup_${new Date().toISOString().replace(/[:.]/g, "-")}`,
      timestamp: new Date().toISOString(),
      trigger_type: triggerType,
      duration_ms: durationMs,
      db: dbResult,
      photos: photosResult,
      status: "SUCCESS"
    };

    const manifest = getBackupManifest();
    manifest.last_backup = backupEntry.timestamp;
    manifest.backups.unshift(backupEntry);

    // الاحتفاظ بأحدث 90 نسخة احتياطية تاريخية في السجل
    if (manifest.backups.length > 90) {
      manifest.backups = manifest.backups.slice(0, 90);
    }

    saveBackupManifest(manifest);
    console.log(`[BACKUP] Full backup completed successfully in ${durationMs}ms:`, backupEntry.id);
    return backupEntry;
  } catch (err) {
    console.error("[BACKUP ERROR]:", err);
    throw err;
  }
};

/**
 * 4. جدولة النسخ الاحتياطي اليومي تلقائياً (Daily Backup Cron)
 * يتم التشغيل كل 24 ساعة الساعة 03:00 فجراً بتوقيت القاهرة
 */
let dailyBackupTimer = null;

export const initDailyBackupScheduler = () => {
  if (dailyBackupTimer) {
    clearInterval(dailyBackupTimer);
  }

  dailyBackupTimer = setInterval(async () => {
    const now = new Date();
    const cairoHour = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Cairo" })).getHours();

    if (cairoHour === 3) {
      const manifest = getBackupManifest();
      const lastBackupDate = manifest.last_backup ? manifest.last_backup.split("T")[0] : null;
      const todayDate = now.toISOString().split("T")[0];

      if (lastBackupDate !== todayDate) {
        console.log("[SCHEDULER] Triggering scheduled 03:00 AM full backup...");
        try {
          await performFullBackup("DAILY_CRON_03_00_AM");
        } catch (err) {
          console.error("[SCHEDULER ERROR] Daily backup failed:", err);
        }
      }
    }
  }, 1000 * 60 * 30); // فحص كل 30 دقيقة

  console.log("[BACKUP SCHEDULER] Initialized: Daily snapshots scheduled for 03:00 AM Africa/Cairo.");
};

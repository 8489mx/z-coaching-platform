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
  RateLimitLog,
  Notification
} from "../models/index.js";
import { sanitizeBackupPayload } from "./backupSanitizer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../../../");
const backupsDir = path.resolve(rootDir, "backups");
const dbBackupsDir = path.resolve(backupsDir, "db");
const photosBackupsDir = path.resolve(backupsDir, "photos");
const manifestPath = path.resolve(backupsDir, "backup-manifest.json");

// P1-B12: manifest history keeps the same 12 months (365 days) as the
// backup files themselves — the owner's locked retention decision.
const BACKUP_MANIFEST_RETENTION_DAYS = 365;

// التأكد من وجود مجلدات النسخ الاحتياطي
for (const dir of [backupsDir, dbBackupsDir, photosBackupsDir]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * مفتاح تشفير النسخ الاحتياطي (S4-6, P1-B12)
 *
 * P1-B12: NEW backups use ONLY their own key (BACKUP_ENCRYPTION_KEY).
 * The old fallback to MEDICAL_ENCRYPTION_KEY was key reuse across
 * purposes (medical answers and backups under one key). In production a
 * missing backup key is fatal; outside production the key is a random
 * per-process secret (cached for the process lifetime so encrypt and
 * decrypt agree within one run) — never a deterministic string anyone
 * with the code could derive.
 */
let ephemeralBackupKey = null;
export function getBackupEncryptionKey() {
  const rawKey = process.env.BACKUP_ENCRYPTION_KEY;
  if (!rawKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error("FATAL: BACKUP_ENCRYPTION_KEY must be defined in production");
    }
    if (!ephemeralBackupKey) {
      ephemeralBackupKey = crypto.randomBytes(32);
    }
    return ephemeralBackupKey;
  }
  return crypto.createHash('sha256').update(String(rawKey)).digest();
}

/**
 * Keys that may decrypt a backup, newest first. Old backups were
 * encrypted under the medical key (the pre-B12 fallback); they must
 * still restore, so decryption tries the backup key first and the
 * medical key second. Encryption never uses the medical key anymore.
 */
function getBackupDecryptionKeys() {
  // Built independently of getBackupEncryptionKey: a production deployment
  // that has not set BACKUP_ENCRYPTION_KEY yet must still restore old
  // backups (encrypted under the medical key) instead of throwing.
  const keys = [];
  const backupRaw = process.env.BACKUP_ENCRYPTION_KEY;
  if (backupRaw) {
    keys.push(crypto.createHash('sha256').update(String(backupRaw)).digest());
  } else if (process.env.NODE_ENV !== 'production') {
    keys.push(getBackupEncryptionKey()); // ephemeral, cached per process
  }
  const legacyRaw = process.env.MEDICAL_ENCRYPTION_KEY;
  if (legacyRaw) {
    const legacy = crypto.createHash('sha256').update(String(legacyRaw)).digest();
    if (!keys.some((k) => k.equals(legacy))) keys.push(legacy);
  }
  if (keys.length === 0) {
    throw new Error("FATAL: BACKUP_ENCRYPTION_KEY must be defined in production");
  }
  return keys;
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
  const iv = encryptedBuffer.subarray(0, 12);
  const tag = encryptedBuffer.subarray(12, 28);
  const data = encryptedBuffer.subarray(28);
  let lastError = null;
  for (const key of getBackupDecryptionKeys()) {
    try {
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(tag);
      return Buffer.concat([decipher.update(data), decipher.final()]);
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
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
      rateLimits,
      notifications
    ] = await Promise.all([
      // P0-A5: exclude the REAL password field. The old code excluded a
      // nonexistent `password_hash` column, so password hashes leaked into
      // backups. The payload sanitizer below strips both names anyway.
      User.findAll({ attributes: { exclude: ['password', 'password_hash'] }, raw: true }).catch(() => []),
      Program.findAll({ raw: true }).catch(() => []),
      IntakeSubmission.findAll({ raw: true }).catch(() => []),
      CheckinSubmission.findAll({ raw: true }).catch(() => []),
      ProgressPhoto.findAll({ raw: true }).catch(() => []),
      WorkoutLog.findAll({ raw: true }).catch(() => []),
      Order.findAll({ raw: true }).catch(() => []),
      NutritionPlan.findAll({ raw: true }).catch(() => []),
      WorkoutPlan.findAll({ raw: true }).catch(() => []),
      RateLimitLog.findAll({ raw: true }).catch(() => []),
      // P2-C7: inbox rows join the backup (pre-C7 they lived in a JSON file
      // no backup ever saw). Device tokens are excluded on purpose.
      Notification.findAll({ raw: true }).catch(() => []),
    ]);

    // P0-A5: sanitize the whole payload before it is written. New backups
    // contain no password, no client email, no phone number, and no health
    // field (intake answers, check-in health columns, clinical notes, and
    // health keys embedded in program_data.client). Table shapes are kept
    // so a future restore tolerates the missing keys without invented values.
    const sanitized = sanitizeBackupPayload({
      users,
      programs,
      intakes,
      checkins,
      photos,
      workoutLogs,
      orders,
      nutritionPlans,
      workoutPlans,
      rateLimits,
      notifications,
    });

    const backupPayload = {
      // 2.1.0 = sanitized format (2.0.0 backups may still contain secrets).
      version: "2.1.0",
      created_at: new Date().toISOString(),
      backup_id: backupId,
      server_timezone: process.env.TZ || "Africa/Cairo",
      statistics: {
        total_users: sanitized.users.length,
        total_programs: sanitized.programs.length,
        total_intake_submissions: sanitized.intakes.length,
        total_checkins: sanitized.checkins.length,
        total_photos_indexed: sanitized.photos.length,
        total_workout_logs: sanitized.workoutLogs.length,
        total_orders: sanitized.orders.length,
        total_notifications: sanitized.notifications.length,
      },
      data: {
        users: sanitized.users,
        programs: sanitized.programs,
        intakes: sanitized.intakes,
        checkins: sanitized.checkins,
        photos: sanitized.photos,
        workoutLogs: sanitized.workoutLogs,
        orders: sanitized.orders,
        nutritionPlans: sanitized.nutritionPlans,
        workoutPlans: sanitized.workoutPlans,
        rateLimits: sanitized.rateLimits,
        notifications: sanitized.notifications,
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
 * 2. نسخ وأرشفة مجلد صور المشتركين، مشفرة بالكامل (P0-A5).
 * الأرشيف نفسه (بما فيه أسماء الملفات والمجلدات داخل tar) يُشفّر بنفس
 * AES-256-GCM المستخدم لنسخة قاعدة البيانات، ثم يُحذف الأرشيف غير المشفر
 * المؤقت. لا يُنتَج أي نسخة صور غير مشفرة من هذا المسار أبداً.
 * فشل الأرشفة = فشل النسخة (رفض)، وليس نجاحاً بملف فهرس غير مشفر.
 */
export const performPhotosBackup = async () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupId = `photos_${timestamp}`;
  // Encrypted bytes, not gzip: the .enc suffix says so.
  const archivePath = path.join(photosBackupsDir, `${backupId}.tar.gz.enc`);
  const tmpTarPath = path.join(photosBackupsDir, `${backupId}.tar.gz.tmp`);
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

  // إنشاء أرشيف مضغوط للصور، ثم تشفيره وحذف النسخة غير المشفرة
  return new Promise((resolve, reject) => {
    const tarCmd = `tar -czf "${tmpTarPath}" -C "${path.resolve(rootDir, "uploads")}" progress_photos`;

    exec(tarCmd, (err) => {
      try {
        if (err) {
          throw new Error(`Photo archive failed: ${err.message}`);
        }
        const plainBuffer = fs.readFileSync(tmpTarPath);
        const encryptedBuffer = encryptBackupPayload(plainBuffer);
        fs.writeFileSync(archivePath, encryptedBuffer);
        return resolve({
          success: true,
          backupId,
          archivePath,
          fileName: `${backupId}.tar.gz.enc`,
          sizeBytes: encryptedBuffer.length,
          totalPhotos,
          totalBytes,
          clientsCount: clientFolders.length,
          type: "TAR_GZ_ENC",
          is_encrypted: true,
          encryption_algorithm: "AES-256-GCM",
        });
      } catch (e) {
        return reject(e);
      } finally {
        // The plaintext tar must never survive, success or failure.
        try {
          if (fs.existsSync(tmpTarPath)) fs.unlinkSync(tmpTarPath);
        } catch (cleanupErr) {
          console.warn("Could not remove plaintext photo tar temp file:", cleanupErr.message);
        }
      }
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

    // P1-B12: manifest retention matches file retention (12 months =
    // 365 days, the owner's locked decision). The old cap kept only the
    // last 90 ENTRIES, so after 90 backups the manifest no longer
    // described the files on disk (files live 365 days). Entries without
    // a timestamp are kept, matching the prune step's rule.
    const manifestCutoff = Date.now() - BACKUP_MANIFEST_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    manifest.backups = manifest.backups.filter((b) => {
      if (!b.timestamp) return true;
      return new Date(b.timestamp).getTime() >= manifestCutoff;
    });

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

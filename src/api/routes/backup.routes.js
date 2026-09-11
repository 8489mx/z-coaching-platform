import express from "express";
import { performFullBackup, getBackupManifest } from "../services/backup.service.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.middleware.js";
import { exportRateLimiter } from "../middlewares/rateLimiter.js";
import { recordAuditEvent } from "../services/auditLog.service.js";

const router = express.Router();

/**
 * الحصول على تقرير وسجل النسخ الاحتياطية
 */
router.get("/status", requireAuth, requireAdmin, async (req, res) => {
  try {
    const manifest = getBackupManifest();
    return res.status(200).json({
      success: true,
      last_backup: manifest.last_backup,
      total_backups: manifest.backups ? manifest.backups.length : 0,
      recent_backups: manifest.backups ? manifest.backups.slice(0, 10) : []
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * بدء تشغيل نسخة احتياطية فورية يدوياً من لوحة التحكم
 */
router.post("/trigger", requireAuth, requireAdmin, exportRateLimiter, async (req, res) => {
  try {
    const result = await performFullBackup("ADMIN_MANUAL_TRIGGER");
    recordAuditEvent({
      event: 'CREATE_BACKUP_TRIGGER',
      req,
      status: 'SUCCESS',
      details: { backupId: result?.backup_id || result?.filename }
    });
    return res.status(200).json({
      success: true,
      message: "تم إجراء النسخ الاحتياطي الشامل للبيانات والصور بنجاح",
      backup: result
    });
  } catch (err) {
    recordAuditEvent({
      event: 'CREATE_BACKUP_TRIGGER',
      req,
      status: 'FAILURE',
      details: { error: err.message }
    });
    return res.status(500).json({ success: false, error: "فشل النسخ الاحتياطي: " + err.message });
  }
});

export default router;

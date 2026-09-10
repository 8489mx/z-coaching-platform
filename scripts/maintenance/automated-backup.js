#!/usr/bin/env node

/**
 * Z Coaching Platform - Standalone Automated Backup CLI
 * Run manually or via Linux / Hostinger Crontab:
 * node scripts/maintenance/automated-backup.js
 */

import { performFullBackup, getBackupManifest } from "../../src/api/services/backup.service.js";
import sequelize from "../../src/api/config/database.js";

async function main() {
  console.log("=== بدء تشغيل عملية النسخ الاحتياطي لمنظومة Z Coaching ===");
  try {
    // التحقق من اتصال قاعدة البيانات
    try {
      await sequelize.authenticate();
      console.log("تم الاتصال بقاعدة البيانات بنجاح.");
    } catch (dbErr) {
      console.warn("تنبيه الاتصال بقاعدة البيانات:", dbErr.message);
    }

    const result = await performFullBackup("MANUAL_CLI_TRIGGER");

    console.log("تم اكتمال النسخ الاحتياطي الشامل بنجاح!");
    console.log(`معرف النسخة: ${result.id}`);
    console.log(`تاريخ التنفيذ: ${result.timestamp}`);
    console.log(`حجم ملف قاعدة البيانات المضغوط: ${(result.db.sizeBytes / 1024).toFixed(2)} KB`);
    console.log(`عدد المستخدمين المؤرشفين: ${result.db.statistics.total_users}`);
    console.log(`عدد البرامج المؤرشفة: ${result.db.statistics.total_programs}`);
    console.log(`عدد الشيك إن المؤرشف: ${result.db.statistics.total_checkins}`);
    console.log(`إجمالي الصور الميدانية: ${result.photos.totalPhotos}`);
    console.log(`استغرق التنفيذ: ${result.duration_ms} مللي ثانية`);
    
    process.exit(0);
  } catch (err) {
    console.error("فشل تنفيذ النسخ الاحتياطي:", err);
    process.exit(1);
  }
}

main();

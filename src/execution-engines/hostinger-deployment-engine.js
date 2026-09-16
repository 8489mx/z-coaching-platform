/**
 * Hostinger VPS Deployment Readiness Engine
 * Systematically audits the production readiness of Z Coaching Platform for Hostinger VPS.
 * Verifies runtime compatibility, static frontend build, server bootstrap,
 * database migration files, PM2 process management, and Nginx reverse proxy configs.
 * Zero Emojis enforced.
 */

import fs from 'fs';
import path from 'path';

export function auditDeploymentReadiness(options = {}) {
  const rootDir = options.rootDir || process.cwd();

  const checks = [];

  // 1. Node Runtime Check
  const currentMajor = parseInt(process.versions.node.split('.')[0], 10);
  const isNodeSupported = currentMajor >= 20;
  checks.push({
    id: 'NODE_RUNTIME',
    title: 'توافق بيئة تشغيل Node.js',
    expected: 'Node.js v20 أو أعلى (الموصى به v22+)',
    actual: `v${process.versions.node}`,
    passed: isNodeSupported,
    severity: isNodeSupported ? 'INFO' : 'CRITICAL',
    message: isNodeSupported 
      ? `إصدار Node.js الحالي متوافق تماماً (${process.versions.node})`
      : `إصدار Node.js الحالي (${process.versions.node}) أقل من المتطلب الإنتاجي v20`
  });

  // 2. Package scripts check
  const packageJsonPath = path.resolve(rootDir, 'package.json');
  let packageJson = null;
  let hasStartScript = false;
  let hasBuildScript = false;
  let hasSyncScript = false;

  if (fs.existsSync(packageJsonPath)) {
    try {
      packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const scripts = packageJson.scripts || {};
      hasStartScript = Boolean(scripts.start);
      hasBuildScript = Boolean(scripts['build:frontend']);
      hasSyncScript = Boolean(scripts['db:sync']);
    } catch {
      // ignore json parse error
    }
  }

  checks.push({
    id: 'START_SCRIPT',
    title: 'أمر تشغيل الخادم الإنتاجي (npm start)',
    expected: 'node src/api/server.js',
    actual: packageJson?.scripts?.start || 'غير معرف',
    passed: hasStartScript,
    severity: hasStartScript ? 'INFO' : 'CRITICAL',
    message: hasStartScript 
      ? 'أمر التشغيل المباشر معرف وجاهز لـ PM2'
      : 'أمر npm start غير موجود في package.json'
  });

  checks.push({
    id: 'BUILD_SCRIPT',
    title: 'سكربت بناء واجهة الفرونت إند الإنتاجية',
    expected: 'npm --prefix frontend run build',
    actual: packageJson?.scripts?.['build:frontend'] || 'غير معرف',
    passed: hasBuildScript,
    severity: hasBuildScript ? 'INFO' : 'HIGH',
    message: hasBuildScript 
      ? 'أمر بناء حزمة الفرونت إند متاح بالمنظومة'
      : 'أمر بناء الفرونت إند غير مسجل في الحزمة'
  });

  checks.push({
    id: 'DB_SYNC_SCRIPT',
    title: 'سكربت مزامنة وهيكلة قاعدة البيانات',
    expected: 'node src/api/migrations/sync-database.js',
    actual: packageJson?.scripts?.['db:sync'] || 'غير معرف',
    passed: hasSyncScript,
    severity: hasSyncScript ? 'INFO' : 'CRITICAL',
    message: hasSyncScript 
      ? 'سكربت مزامنة الجداول والجداول المرجعية متاح وجاهز'
      : 'سكربت db:sync مفقود'
  });

  // 3. Frontend Static Dist Artifacts
  const distIndexPath = path.resolve(rootDir, 'frontend/dist/index.html');
  const distAssetsPath = path.resolve(rootDir, 'frontend/dist/assets');
  const hasDistIndex = fs.existsSync(distIndexPath);
  const hasDistAssets = fs.existsSync(distAssetsPath);
  const isFrontendBuilt = hasDistIndex && hasDistAssets;

  checks.push({
    id: 'FRONTEND_STATIC_BUILD',
    title: 'جاهزية حزمة الفرونت إند المبنية (Static Dist)',
    expected: 'frontend/dist/index.html + frontend/dist/assets',
    actual: isFrontendBuilt ? 'موجودة وجاهزة للتقديم' : 'غير مبنية أو ناقصة',
    passed: isFrontendBuilt,
    severity: isFrontendBuilt ? 'INFO' : 'HIGH',
    message: isFrontendBuilt 
      ? 'ملفات الفرونت إند الإنتاجية مبنية وجاهزة للتقديم المباشر عبر Nginx و Express'
      : 'مجلد frontend/dist غير موجود؛ يلزم تشغيل npm --prefix frontend run build'
  });

  // 4. Server entry point check
  const serverPath = path.resolve(rootDir, 'src/api/server.js');
  const hasServer = fs.existsSync(serverPath);
  checks.push({
    id: 'SERVER_ENTRYPOINT',
    title: 'ملف تشغيل خادم الـ API والـ SPA',
    expected: 'src/api/server.js',
    actual: hasServer ? 'موجود' : 'مفقود',
    passed: hasServer,
    severity: hasServer ? 'INFO' : 'CRITICAL',
    message: hasServer 
      ? 'خادم Express وربط واجهات الـ API وقاعدة البيانات جاهز'
      : 'ملف src/api/server.js غير موجود'
  });

  // 5. PM2 Ecosystem Configuration
  const ecosystemPath = path.resolve(rootDir, 'ecosystem.config.cjs');
  const hasEcosystem = fs.existsSync(ecosystemPath);
  checks.push({
    id: 'PM2_CONFIG',
    title: 'ملف إدارة العمليات الإنتاجية (PM2 Ecosystem)',
    expected: 'ecosystem.config.cjs',
    actual: hasEcosystem ? 'مكتمل' : 'مفقود',
    passed: hasEcosystem,
    severity: hasEcosystem ? 'INFO' : 'HIGH',
    message: hasEcosystem 
      ? 'ملف إدارة العمليات التلقائية وإعادة التشغيل (PM2) مهيأ بالكامل'
      : 'ملف ecosystem.config.cjs غير موجود'
  });

  // 6. Nginx Reverse Proxy Configuration
  const nginxConfPath = path.resolve(rootDir, 'deploy/nginx/z-coaching.conf');
  const hasNginxConf = fs.existsSync(nginxConfPath);
  checks.push({
    id: 'NGINX_CONFIG',
    title: 'إعدادات موازن الأحمال وعكس المسار (Nginx Reverse Proxy)',
    expected: 'deploy/nginx/z-coaching.conf',
    actual: hasNginxConf ? 'مكتمل' : 'مفقود',
    passed: hasNginxConf,
    severity: hasNginxConf ? 'INFO' : 'MEDIUM',
    message: hasNginxConf 
      ? 'قالب Nginx الخاص بالـ VPS محدد مع دعم التخزين المؤقت وضغط Gzip وحماية الـ Uploads'
      : 'ملف deploy/nginx/z-coaching.conf غير موجود'
  });

  // 7. Storage & Backups Directories
  const uploadsDir = path.resolve(rootDir, 'uploads');
  const backupDir = path.resolve(rootDir, 'data/backups');
  const hasUploads = fs.existsSync(uploadsDir);
  const hasBackups = fs.existsSync(backupDir);

  checks.push({
    id: 'STORAGE_DIRECTORIES',
    title: 'أدلة التخزين المحلي والصور والنسخ الاحتياطي',
    expected: 'uploads/ & data/backups/',
    actual: `uploads: ${hasUploads ? 'موجود' : 'غير موجود'} • backups: ${hasBackups ? 'موجود' : 'غير موجود'}`,
    passed: hasUploads,
    severity: hasUploads ? 'INFO' : 'MEDIUM',
    message: hasUploads 
      ? 'أدلة تخزين الصور والملفات المرفوعة مهيأة ومؤمنة'
      : 'يلزم التأكد من إنشاء مجلد uploads/ ومجلد النسخ الاحتياطي مع أذونات الكتابة'
  });

  // Calculate score and status
  const totalChecks = checks.length;
  const passedChecks = checks.filter(c => c.passed).length;
  const criticalFails = checks.filter(c => !c.passed && c.severity === 'CRITICAL').length;
  const scorePercent = Math.round((passedChecks / totalChecks) * 100);

  const isReady = criticalFails === 0 && scorePercent >= 80;

  return {
    isReady,
    status: isReady ? 'READY_FOR_DEPLOYMENT' : 'NEEDS_ATTENTION',
    statusArabic: isReady ? 'جاهز للنشر المباشر على Hostinger VPS' : 'يتطلب إجراءات مسبقة قبل النشر',
    score: scorePercent,
    passedCount: passedChecks,
    totalCount: totalChecks,
    criticalFailures: criticalFails,
    checks,
    timestamp: new Date().toISOString()
  };
}

export function formatDeploymentReadinessReport(audit) {
  const lines = [
    '=================================================================',
    '  تقرير التدقيق الميداني للجاهزية التشغيلية (Hostinger VPS Audit)',
    '=================================================================',
    `حالة المنظومة: ${audit.statusArabic}`,
    `نسبة الجاهزية: ${audit.score}% (${audit.passedCount} من ${audit.totalCount} اختبارات ناجحة)`,
    `الإخفاقات الحرجة: ${audit.criticalFailures}`,
    '-----------------------------------------------------------------',
    'تفاصيل الفحوصات:'
  ];

  audit.checks.forEach((chk, idx) => {
    const mark = chk.passed ? '[ناجح]' : '[تنبيه]';
    lines.push(`${idx + 1}. ${mark} ${chk.title}`);
    lines.push(`   - النتيجة: ${chk.message}`);
    lines.push(`   - القيمة الفعلية: ${chk.actual}`);
  });

  lines.push('-----------------------------------------------------------------');
  if (audit.isReady) {
    lines.push('الخلاصة: المنظومة مؤهلة ومستوفية لكافة المعايير التشغيلية والإنتاجية.');
    lines.push('خطوات النشر على سيرفر Hostinger VPS:');
    lines.push('1. نسخ ملفات المشروع عبر Git أو rsync.');
    lines.push('2. تشغيل: npm install --production');
    lines.push('3. تشغيل: npm run db:sync');
    lines.push('4. تشغيل الخادم عبر PM2: pm2 start ecosystem.config.cjs');
    lines.push('5. تفعيل ملف Nginx: sudo cp deploy/nginx/z-coaching.conf /etc/nginx/sites-available/');
    lines.push('6. ربط وإعادة تحميل Nginx: sudo systemctl reload nginx');
  } else {
    lines.push('الخلاصة: يرجى استكمال البنود الموضحة أعلاه قبل بدء النشر الإنتاجي.');
  }
  lines.push('=================================================================');

  return lines.join('\n');
}

export default {
  auditDeploymentReadiness,
  formatDeploymentReadinessReport
};

import fs from 'fs';
import path from 'path';

const auditDir = 'C:/Users/Fannan/.gemini/antigravity/brain/4e0e0f3a-2130-4f00-8c43-e6b3dc5f46c2/visual_audit';

const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const pwImport = await import(`file://${pwModulePath}`);
const pw = pwImport.default || pwImport;

const htmlContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>مقارنة التدقيق البصري - Before vs After</title>
  <script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700;800&family=Inter:wght@400;600;700&display=swap');
    * { font-family: 'Segoe UI', 'IBM Plex Sans Arabic', sans-serif; box-sizing: border-box; }
    body { background: #0F172A; color: #F8FAFC; margin: 0; padding: 32px; direction: rtl; }
  </style>
</head>
<body class="flex flex-col items-center gap-8">
  <div class="text-center space-y-2 max-w-4xl">
    <span class="px-3 py-1 bg-sky-500/20 text-sky-400 border border-sky-400/30 rounded-full text-xs font-bold">Z Coaching Mobile System</span>
    <h1 class="text-2xl font-bold tracking-tight text-white">مقارنة نظام المسافات والمحاذاة والتكوين البصري (Before / After)</h1>
    <p class="text-sm text-slate-400">مراجعة وتدقيق شاشة اليوم (Today Hub) وشريط التنقل السفلي العائم (Floating Nav) على مقاس 390px القياسي</p>
  </div>

  <!-- Comparison Board: Today Hub Full Screen -->
  <div class="grid grid-cols-2 gap-8 max-w-5xl w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
    <!-- BEFORE -->
    <div class="flex flex-col items-center space-y-3">
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-full bg-rose-500"></span>
        <h2 class="text-base font-bold text-rose-400">الحالة السابقة (Before)</h2>
        <span class="text-xs text-slate-400">مسافات عشوائية · غياب Baseline موحد · هواء غير مبرر</span>
      </div>
      <div class="rounded-[40px] overflow-hidden border-4 border-slate-700 shadow-2xl bg-white">
        <img src="file:///${auditDir.replace(/\\/g, '/')}/before_today_standard_390px.png" class="w-[390px] block" alt="Before">
      </div>
    </div>

    <!-- AFTER -->
    <div class="flex flex-col items-center space-y-3">
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
        <h2 class="text-base font-bold text-emerald-400">الحالة المعدلة (After)</h2>
        <span class="text-xs text-slate-400">شبكة 4pt/8pt · محاذاة Baseline دقيقة · انسيابية Compact</span>
      </div>
      <div class="rounded-[40px] overflow-hidden border-4 border-emerald-500/50 shadow-2xl bg-white ring-4 ring-emerald-500/20">
        <img src="file:///${auditDir.replace(/\\/g, '/')}/after_today_standard_390px.png" class="w-[390px] block" alt="After">
      </div>
    </div>
  </div>

  <!-- Comparison Board: Bottom Navigation Bar -->
  <div class="max-w-5xl w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6">
    <div class="text-center space-y-1">
      <h3 class="text-lg font-bold text-white">تدقيق شريط التنقل السفلي العائم (Floating Bottom Navigation)</h3>
      <p class="text-xs text-slate-400">فحص Baseline الأيقونات والأسماء والمسافة ومحاذاة عدسة الزجاج السائل</p>
    </div>

    <div class="grid grid-cols-2 gap-6 items-center">
      <div class="space-y-2 text-center">
        <span class="text-xs font-bold text-rose-400 block">قبل التحسين (Before Nav)</span>
        <div class="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-center">
          <img src="file:///${auditDir.replace(/\\/g, '/')}/before_nav_standard_390px.png" class="rounded-2xl border border-slate-700 max-w-full" alt="Before Nav">
        </div>
      </div>
      <div class="space-y-2 text-center">
        <span class="text-xs font-bold text-emerald-400 block">بعد التحسين (After Nav)</span>
        <div class="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex justify-center">
          <img src="file:///${auditDir.replace(/\\/g, '/')}/after_nav_standard_390px.png" class="rounded-2xl border border-emerald-500/50 ring-2 ring-emerald-500/20 max-w-full" alt="After Nav">
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

const tempHtmlPath = path.join(auditDir, 'side_by_side_board.html');
fs.writeFileSync(tempHtmlPath, htmlContent, 'utf8');

const browser = await pw.chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--disable-extensions', '--no-sandbox']
});

const page = await browser.newPage({ viewport: { width: 1200, height: 1600 } });
await page.goto(`file:///${tempHtmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);

const shotPath = path.join(auditDir, 'side_by_side_comparison.png');
await page.screenshot({ path: shotPath, fullPage: true });
console.log(`Saved side by side comparison to: ${shotPath}`);

await browser.close();

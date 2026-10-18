import fs from 'fs';
import path from 'path';

const auditDir = 'C:/Users/Fannan/.gemini/antigravity/brain/4e0e0f3a-2130-4f00-8c43-e6b3dc5f46c2/visual_audit';
const userRefPath = 'C:/Users/Fannan/.gemini/antigravity/brain/4e0e0f3a-2130-4f00-8c43-e6b3dc5f46c2/.user_uploaded/media_1791819522635_e2764b68.png';
const userColorPath = 'C:/Users/Fannan/.gemini/antigravity/brain/4e0e0f3a-2130-4f00-8c43-e6b3dc5f46c2/.user_uploaded/media_1791819619180_5e8d2224.png';

const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const pwImport = await import(`file://${pwModulePath}`);
const pw = pwImport.default || pwImport;

const htmlContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>مقارنة Date Selector المجسم مع التصميم المرجعي</title>
  <script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700;800&family=Inter:wght@400;600;700&display=swap');
    * { font-family: 'Segoe UI', 'IBM Plex Sans Arabic', sans-serif; box-sizing: border-box; }
    body { background: #0B0F19; color: #F8FAFC; margin: 0; padding: 32px; direction: rtl; }
  </style>
</head>
<body class="flex flex-col items-center gap-6">
  <div class="text-center space-y-1.5 max-w-3xl">
    <span class="px-3 py-1 bg-[#7B4FFE]/20 text-[#A78BFA] border border-[#7B4FFE]/40 rounded-full text-xs font-bold font-inter">Color HEX: #7B4FFE · RGB(123, 79, 254)</span>
    <h1 class="text-2xl font-bold tracking-tight text-white">مطابقة مكون Date Selector (اليوم المختار المجسم)</h1>
    <p class="text-xs text-slate-400">مقارنة بصرية مباشرة بين التصميم المرجعي المطلوب والتنفيذ الحي داخل التطبيق</p>
  </div>

  <!-- Row 1: The Reference Image & Color Swatch -->
  <div class="max-w-4xl w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-full bg-amber-400"></span>
        <h2 class="text-sm font-bold text-amber-300">الصورة المرجعية التي أرسلها صاحب المشروع (User Reference)</h2>
      </div>
      <span class="text-xs text-slate-400 font-inter">Original Image + Color Swatch</span>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-center bg-slate-950 p-4 rounded-2xl border border-slate-800">
      <div class="md:col-span-3 flex justify-center items-center bg-[#8E8B99] p-4 rounded-xl">
        <img src="file:///${userRefPath.replace(/\\/g, '/')}" class="max-w-full rounded-2xl shadow-lg" alt="Reference">
      </div>
      <div class="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
        <div class="w-16 h-16 rounded-2xl shadow-inner border border-white/20" style="background-color: #7B4FFE;"></div>
        <span class="text-xs font-bold text-white font-inter">#7B4FFE</span>
        <span class="text-[10px] text-slate-400">اللون المختار</span>
      </div>
    </div>
  </div>

  <!-- Row 2: Live Implemented Date Selector Close-up -->
  <div class="max-w-4xl w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-full bg-emerald-400"></span>
        <h2 class="text-sm font-bold text-emerald-300">التنفيذ المتقن داخل التطبيق (Implemented Native Component)</h2>
      </div>
      <span class="text-xs text-emerald-400/90 font-bold">مجسم 3D · كبسولة Squircle · انعكاس علوي وظل هالة</span>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
      <div class="space-y-1.5 text-center">
        <span class="text-xs font-semibold text-slate-300">اليوم المختار: السبت 10</span>
        <div class="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex justify-center">
          <img src="file:///${auditDir.replace(/\\/g, '/')}/tactile_date_selector_card_closeup.png" class="rounded-2xl max-w-full shadow-lg" alt="Saturday Selected">
        </div>
      </div>
      <div class="space-y-1.5 text-center">
        <span class="text-xs font-semibold text-slate-300">اليوم المختار: الثلاثاء 13 (تفاعل حي مطابق للمرجع)</span>
        <div class="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex justify-center">
          <img src="file:///${auditDir.replace(/\\/g, '/')}/tactile_date_selector_tuesday_closeup.png" class="rounded-2xl max-w-full shadow-lg" alt="Tuesday Selected">
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

const tempHtmlPath = path.join(auditDir, 'date_selector_comparison_board.html');
fs.writeFileSync(tempHtmlPath, htmlContent, 'utf8');

const browser = await pw.chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--disable-extensions', '--no-sandbox']
});

const page = await browser.newPage({ viewport: { width: 1000, height: 950 } });
await page.goto(`file:///${tempHtmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle' });
await page.waitForTimeout(400);

const shotPath = path.join(auditDir, 'date_selector_reference_matching.png');
await page.screenshot({ path: shotPath, fullPage: true });
console.log(`Saved reference matching comparison to: ${shotPath}`);

await browser.close();

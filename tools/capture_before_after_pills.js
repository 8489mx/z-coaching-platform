import path from 'path';

(async () => {
  const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
  const pwImport = await import(`file://${pwModulePath}`);
  const pw = pwImport.default || pwImport;

  const browser = await pw.chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 440, height: 800 } });

  const html = `<!DOCTYPE html>
  <html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8">
    <script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>
    <style>
      * { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      .pill-old {
        display: inline-flex; align-items: center; justify-content: center; gap: 6px;
        height: 34px; padding: 0 13px; border-radius: 9999px; font-size: 13px; font-weight: 600;
        color: #284C7C; background-color: #F8FBFF; border: 1px solid #D9E7F5;
      }
      .pill-new {
        display: inline-flex; align-items: center; justify-content: center; gap: 4.5px;
        height: 26px; padding: 0 10px; border-radius: 9999px; font-size: 11px; font-weight: 600;
        color: #284C7C; background-color: #F8FBFF; border: 1px solid #D9E7F5;
      }
    </style>
  </head>
  <body class="bg-slate-100 p-4 space-y-4">
    <!-- Comparison 1: Nutrition Header -->
    <div class="bg-white rounded-[20px] p-4 border border-[#E7EEF3] space-y-3">
      <div class="text-[11px] font-bold text-slate-400">قبل التعديل (34px - الحجم السابق):</div>
      <div class="flex items-center justify-between">
        <span class="text-[13px] font-bold text-[#0F172A]">التغذية</span>
        <button class="pill-old">
          <span>عرض الوجبات</span>
          <svg class="w-3.5 h-3.5 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
      <div class="border-t border-slate-100 pt-2"></div>
      <div class="text-[11px] font-bold text-emerald-600">بعد التنحيف المباشر (26px - الحجم الحالي المتناسق):</div>
      <div class="flex items-center justify-between">
        <span class="text-[13px] font-bold text-[#0F172A]">التغذية</span>
        <button class="pill-new">
          <span>عرض الوجبات</span>
          <svg class="w-3 h-3 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
    </div>

    <!-- Comparison 2: Check-in Header -->
    <div class="bg-white rounded-[20px] p-4 border border-[#E7EEF3] space-y-3">
      <div class="text-[11px] font-bold text-slate-400">قبل التعديل (34px - الحجم السابق):</div>
      <div class="flex items-center justify-between">
        <span class="text-[14px] font-bold text-[#0F172A]">الجمعة 16 أكتوبر 2026</span>
        <button class="pill-old">
          <span>المتابعات السابقة</span>
          <svg class="w-3.5 h-3.5 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
      <div class="border-t border-slate-100 pt-2"></div>
      <div class="text-[11px] font-bold text-emerald-600">بعد التنحيف المباشر (26px - الحجم الحالي المتناسق):</div>
      <div class="flex items-center justify-between">
        <span class="text-[14px] font-bold text-[#0F172A]">الجمعة 16 أكتوبر 2026</span>
        <button class="pill-new">
          <span>المتابعات السابقة</span>
          <svg class="w-3 h-3 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
    </div>
  </body>
  </html>`;

  await page.setContent(html);
  await page.waitForTimeout(200);

  const outPath = 'C:/Users/Fannan/.gemini/antigravity/brain/4e0e0f3a-2130-4f00-8c43-e6b3dc5f46c2/visual_audit/pills_before_after_comparison.png';
  await page.screenshot({ path: outPath, fullPage: true });
  console.log('Saved comparison to', outPath);

  await browser.close();
})();

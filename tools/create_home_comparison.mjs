import fs from 'fs';
import path from 'path';

const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const pwImport = await import(`file://${pwModulePath}`);
const pw = pwImport.default || pwImport;

const auditDir = 'C:/Users/Fannan/.gemini/antigravity/brain/4e0e0f3a-2130-4f00-8c43-e6b3dc5f46c2/visual_audit';

const imgTopBefore = fs.readFileSync(path.join(auditDir, 'home_screen_top_current.png')).toString('base64');
const imgTopAfter = fs.readFileSync(path.join(auditDir, 'home_screen_top_new.png')).toString('base64');

const imgBottomBefore = fs.readFileSync(path.join(auditDir, 'home_screen_bottom_current.png')).toString('base64');
const imgBottomAfter = fs.readFileSync(path.join(auditDir, 'home_screen_bottom_new.png')).toString('base64');

const browser = await pw.chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 920, height: 1000 } });

// Top comparison
const comparisonHtml = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Tahoma, sans-serif; }
    body { background: #0F172A; color: white; padding: 24px; margin: 0; direction: rtl; }
    .header { text-align: center; margin-bottom: 24px; }
    .title { font-size: 20px; font-weight: 800; color: #F8FAFC; margin-bottom: 6px; }
    .subtitle { font-size: 12px; color: #94A3B8; }
    .grid { display: flex; justify-content: center; gap: 24px; }
    .card-col { display: flex; flex-direction: column; align-items: center; }
    .badge-before { background: #334155; color: #E2E8F0; padding: 6px 14px; border-radius: 999px; font-size: 11px; font-weight: bold; margin-bottom: 12px; }
    .badge-after { background: #0284C7; color: white; padding: 6px 14px; border-radius: 999px; font-size: 11px; font-weight: bold; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(2,132,199,0.3); }
    .img-frame { width: 380px; border-radius: 44px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5); border: 4px solid #1E293B; }
    .img-frame img { width: 100%; display: block; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">مقارنة الترقية المعمارية لصفحة الهوم (Home Hub)</div>
    <div class="subtitle">التصميم السابق مقابل التصميم الفاخر الجديد بمواصفات Apple Health والتغذية البصرية المتفق عليها</div>
  </div>
  <div class="grid">
    <div class="card-col">
      <div class="badge-before">التصميم السابق (قبل الترقية)</div>
      <div class="img-frame">
        <img src="data:image/png;base64,${imgTopBefore}" />
      </div>
    </div>
    <div class="card-col">
      <div class="badge-after">التصميم الجديد المعتمد (الترقية الفاخرة)</div>
      <div class="img-frame" style="border-color: #0284C7;">
        <img src="data:image/png;base64,${imgTopAfter}" />
      </div>
    </div>
  </div>
</body>
</html>
`;

await page.setContent(comparisonHtml, { waitUntil: 'load' });
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(auditDir, 'home_top_before_after.png'), fullPage: true });

// Bottom comparison
const bottomComparisonHtml = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Tahoma, sans-serif; }
    body { background: #0F172A; color: white; padding: 24px; margin: 0; direction: rtl; }
    .header { text-align: center; margin-bottom: 24px; }
    .title { font-size: 20px; font-weight: 800; color: #F8FAFC; margin-bottom: 6px; }
    .subtitle { font-size: 12px; color: #94A3B8; }
    .grid { display: flex; justify-content: center; gap: 24px; }
    .card-col { display: flex; flex-direction: column; align-items: center; }
    .badge-before { background: #334155; color: #E2E8F0; padding: 6px 14px; border-radius: 999px; font-size: 11px; font-weight: bold; margin-bottom: 12px; }
    .badge-after { background: #0284C7; color: white; padding: 6px 14px; border-radius: 999px; font-size: 11px; font-weight: bold; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(2,132,199,0.3); }
    .img-frame { width: 380px; border-radius: 44px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5); border: 4px solid #1E293B; }
    .img-frame img { width: 100%; display: block; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">مقارنة الجزء السفلي لصفحة الهوم (Check-in & Supplements)</div>
    <div class="subtitle">تنظيم كارت المتابعة على خط أساس أفقي + تحويل كارت المكملات إلى بطاقات مصغرة مهندمة</div>
  </div>
  <div class="grid">
    <div class="card-col">
      <div class="badge-before">التصميم السابق (قبل الترقية)</div>
      <div class="img-frame">
        <img src="data:image/png;base64,${imgBottomBefore}" />
      </div>
    </div>
    <div class="card-col">
      <div class="badge-after">التصميم الجديد المعتمد (الترقية الفاخرة)</div>
      <div class="img-frame" style="border-color: #0284C7;">
        <img src="data:image/png;base64,${imgBottomAfter}" />
      </div>
    </div>
  </div>
</body>
</html>
`;

await page.setContent(bottomComparisonHtml, { waitUntil: 'load' });
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(auditDir, 'home_bottom_before_after.png'), fullPage: true });

console.log('Base64 comparison screenshots generated successfully.');
await browser.close();

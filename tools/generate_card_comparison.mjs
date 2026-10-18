import fs from 'fs';
import path from 'path';

const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const pwImport = await import(`file://${pwModulePath}`);
const pw = pwImport.default || pwImport;

const auditDir = 'C:/Users/Fannan/.gemini/antigravity/brain/4e0e0f3a-2130-4f00-8c43-e6b3dc5f46c2/visual_audit';
const browser = await pw.chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 900, height: 420 } });

const beforeData = fs.readFileSync('C:/Users/Fannan/.gemini/antigravity/brain/4e0e0f3a-2130-4f00-8c43-e6b3dc5f46c2/.user_uploaded/media_1791893683112_7372e11e.png').toString('base64');
const afterData = fs.readFileSync('C:/Users/Fannan/.gemini/antigravity/brain/4e0e0f3a-2130-4f00-8c43-e6b3dc5f46c2/visual_audit/hero_card_pull_day.png').toString('base64');

const beforeUrl = `data:image/png;base64,${beforeData}`;
const afterUrl = `data:image/png;base64,${afterData}`;

const html = `
<!DOCTYPE html>
<html dir="rtl">
<head>
<meta charset="utf-8">
<style>
  body {
    margin: 0;
    padding: 24px;
    background: #F8FAFC;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    display: flex;
    justify-content: center;
    align-items: center;
    direction: rtl;
  }
  .container {
    display: flex;
    gap: 32px;
    align-items: flex-start;
  }
  .card-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
  .label-badge {
    font-size: 13px;
    font-weight: 700;
    padding: 6px 14px;
    border-radius: 999px;
  }
  .label-before {
    background: #FEE2E2;
    color: #DC2626;
  }
  .label-after {
    background: #DCFCE7;
    color: #16A34A;
  }
  .img-box {
    background: #FFFFFF;
    border-radius: 20px;
    padding: 10px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.06);
    border: 1px solid #E2E8F0;
  }
  img {
    display: block;
    max-height: 250px;
    border-radius: 14px;
  }
</style>
</head>
<body>
  <div class="container">
    <div class="card-wrap">
      <span class="label-badge label-before">قبل التعديل (شارة السعرات 320 سعرة)</span>
      <div class="img-box">
        <img src="${beforeUrl}">
      </div>
    </div>
    <div class="card-wrap">
      <span class="label-badge label-after">بعد التعديل (هادئ وأنيق 100%)</span>
      <div class="img-box">
        <img src="${afterUrl}">
      </div>
    </div>
  </div>
</body>
</html>
`;

await page.setContent(html, { waitUntil: 'load' });
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(auditDir, 'card_calories_comparison.png') });
await browser.close();
console.log('Card calories comparison captured successfully.');

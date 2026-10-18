import fs from 'fs';
import path from 'path';

const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const pwImport = await import(`file://${pwModulePath}`);
const pw = pwImport.default || pwImport;

const auditDir = 'C:/Users/Fannan/.gemini/antigravity/brain/4e0e0f3a-2130-4f00-8c43-e6b3dc5f46c2/visual_audit';
const browser = await pw.chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });

await page.goto('http://localhost:5173/mobile_app_preview.html', { waitUntil: 'networkidle' });

// Scroll to bottom
await page.evaluate(() => {
  const container = document.querySelector('#screen-today')?.parentElement;
  if (container) container.scrollTop = container.scrollHeight;
});
await page.waitForTimeout(200);

// Crop the two bottom cards container
const cardsContainer = await page.evaluate(() => {
  const sections = Array.from(document.querySelectorAll('#screen-today > section'));
  // The last two sections are check-in and supplements
  const checkin = sections[sections.length - 2];
  const supps = sections[sections.length - 1];
  if (!checkin || !supps) return null;
  const rect1 = checkin.getBoundingClientRect();
  const rect2 = supps.getBoundingClientRect();
  return {
    x: Math.min(rect1.left, rect2.left) - 10,
    y: Math.min(rect1.top, rect2.top) - 10,
    width: Math.max(rect1.width, rect2.width) + 20,
    height: (rect2.bottom - rect1.top) + 60
  };
});

if (cardsContainer) {
  await page.screenshot({
    path: path.join(auditDir, 'cards_bottom_closeup_new.png'),
    clip: cardsContainer
  });
}

// Now create side by side comparison
const beforeData = fs.readFileSync('C:/Users/Fannan/.gemini/antigravity/brain/4e0e0f3a-2130-4f00-8c43-e6b3dc5f46c2/.user_uploaded/media_1791894898301_61089385.png').toString('base64');
const afterData = fs.readFileSync(path.join(auditDir, 'cards_bottom_closeup_new.png')).toString('base64');

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
    gap: 24px;
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
    width: 360px;
  }
  img {
    display: block;
    width: 100%;
    border-radius: 14px;
  }
</style>
</head>
<body>
  <div class="container">
    <div class="card-wrap">
      <span class="label-badge label-before">قبل التعديل (فراغات وصندوق رمادي وتشويش ألوان)</span>
      <div class="img-box">
        <img src="data:image/png;base64,${beforeData}">
      </div>
    </div>
    <div class="card-wrap">
      <span class="label-badge label-after">بعد التعديل (مدمجة بدون فراغات وهوية موحدة)</span>
      <div class="img-box">
        <img src="data:image/png;base64,${afterData}">
      </div>
    </div>
  </div>
</body>
</html>
`;

const compPage = await browser.newPage({ viewport: { width: 850, height: 750 } });
await compPage.setContent(html, { waitUntil: 'load' });
await compPage.waitForTimeout(200);
await compPage.screenshot({ path: path.join(auditDir, 'bottom_cards_closeup_comparison.png') });
await browser.close();
console.log('Close up comparison captured successfully.');

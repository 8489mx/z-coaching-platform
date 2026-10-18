import fs from 'fs';
import path from 'path';

const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const pwImport = await import(`file://${pwModulePath}`);
const pw = pwImport.default || pwImport;

const auditDir = 'C:/Users/Fannan/.gemini/antigravity/brain/4e0e0f3a-2130-4f00-8c43-e6b3dc5f46c2/visual_audit';
const browser = await pw.chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 900, height: 320 } });

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
  .header-box {
    background: #FFFFFF;
    border-radius: 20px;
    padding: 18px 24px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.06);
    border: 1px solid #E2E8F0;
    width: 340px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
</style>
</head>
<body>
  <div class="container">
    <div class="card-wrap">
      <span class="label-badge label-before">قبل التعديل (مع شارة التاج MAX)</span>
      <div class="header-box">
        <div>
          <div style="font-size: 12px; color: #64748B; font-weight: 500;">السبت، 10 أكتوبر 2026</div>
          <div style="font-size: 19px; color: #0F172A; font-weight: 700; margin-top: 2px;">صباح الخير، أحمد</div>
        </div>
        <div style="height: 28px; padding: 0 12px; background: #FEFCE8; border: 1px solid rgba(253,224,71,0.7); border-radius: 999px; display: flex; align-items: center; gap: 6px;">
          <svg style="width: 12px; height: 12px; color: #D97706; fill: currentColor;" viewBox="0 0 24 24"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/></svg>
          <span style="font-size: 10.5px; font-weight: 800; color: #92400E; font-family: sans-serif;">MAX</span>
        </div>
      </div>
    </div>
    <div class="card-wrap">
      <span class="label-badge label-after">بعد التعديل (ترويسة نقية 100%)</span>
      <div class="header-box">
        <div>
          <div style="font-size: 12px; color: #64748B; font-weight: 500;">السبت، 10 أكتوبر 2026</div>
          <div style="font-size: 19px; color: #0F172A; font-weight: 700; margin-top: 2px;">صباح الخير، أحمد</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;

await page.setContent(html, { waitUntil: 'load' });
await page.waitForTimeout(300);
await page.screenshot({ path: path.join(auditDir, 'header_crown_removed_comparison.png') });
await browser.close();
console.log('Header comparison captured successfully.');

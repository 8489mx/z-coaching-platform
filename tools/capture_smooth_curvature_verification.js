import fs from 'fs';

const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const { default: pw } = await import(`file://${pwModulePath}`);

const auditDir = 'C:/Users/Fannan/.gemini/antigravity/brain/4e0e0f3a-2130-4f00-8c43-e6b3dc5f46c2/visual_audit';
if (!fs.existsSync(auditDir)) {
  fs.mkdirSync(auditDir, { recursive: true });
}

const browser = await pw.chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 450, height: 950 } });
await page.goto('http://localhost:5173/mobile_app_preview.html');
await page.waitForTimeout(1000);

// 1. Click Wednesday (date-item-4) exactly like user's screenshot
await page.click('#date-item-4');
await page.waitForTimeout(400);

// Close-up on the Wednesday pill itself (Zoomed in 2x equivalent)
const wednesdayBtn = await page.locator('#date-item-4').first();
await wednesdayBtn.screenshot({ path: `${auditDir}/wednesday_protruding_smooth_curve.png` });
console.log('Saved: wednesday_protruding_smooth_curve.png');

// Close-up on entire Date Selector row
const dateRow = await page.locator('#date-selector-row').first();
await dateRow.screenshot({ path: `${auditDir}/date_selector_row_smooth_wednesday.png` });
console.log('Saved: date_selector_row_smooth_wednesday.png');

// Full Device Shell
const shell = await page.locator('#device-shell').first();
await shell.screenshot({ path: `${auditDir}/today_390px_smooth_curvature.png` });
console.log('Saved: today_390px_smooth_curvature.png');

await browser.close();
console.log('Curvature verification captures completed successfully.');

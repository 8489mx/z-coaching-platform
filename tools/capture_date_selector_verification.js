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

// 1. Close-up on Date Selector Card (Saturday active)
const dateCard = await page.locator('section:has(#date-selector-row)').first();
await dateCard.screenshot({ path: `${auditDir}/new_capsule_date_selector_sat_closeup.png` });
console.log('Saved: new_capsule_date_selector_sat_closeup.png');

// 2. Full Device Shell Screen 390px
const shell = await page.locator('#device-shell').first();
await shell.screenshot({ path: `${auditDir}/new_capsule_today_390px.png` });
console.log('Saved: new_capsule_today_390px.png');

// 3. Click on Tuesday (date-item-3)
await page.click('#date-item-3');
await page.waitForTimeout(400);
await dateCard.screenshot({ path: `${auditDir}/new_capsule_date_selector_tue_active.png` });
console.log('Saved: new_capsule_date_selector_tue_active.png');

// 4. Click on Friday (date-item-6) to ensure no red on Friday when active or inactive
await page.click('#date-item-6');
await page.waitForTimeout(400);
await dateCard.screenshot({ path: `${auditDir}/new_capsule_date_selector_fri_active.png` });
console.log('Saved: new_capsule_date_selector_fri_active.png');

await browser.close();
console.log('Verification captures completed successfully.');

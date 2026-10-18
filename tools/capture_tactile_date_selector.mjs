import fs from 'fs';
import path from 'path';

const auditDir = 'C:/Users/Fannan/.gemini/antigravity/brain/4e0e0f3a-2130-4f00-8c43-e6b3dc5f46c2/visual_audit';

const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const pwImport = await import(`file://${pwModulePath}`);
const pw = pwImport.default || pwImport;

const browser = await pw.chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--disable-extensions', '--no-sandbox']
});

const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true
});

await page.goto('http://localhost:5173/mobile_app_preview.html?raw=1&tab=today', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);

// 1. Capture Today Screen with Day 0 selected
const fullPath0 = path.join(auditDir, 'tactile_date_selector_today_390px.png');
await page.screenshot({ path: fullPath0 });
console.log('Saved:', fullPath0);

// 2. Capture Close-up of Date Selector Card with Day 0 selected
const selectorCard = page.locator('#date-selector-row').locator('..');
const closeUp0 = path.join(auditDir, 'tactile_date_selector_card_closeup.png');
await selectorCard.screenshot({ path: closeUp0 });
console.log('Saved:', closeUp0);

// 3. Click Day 3 (الثلاثاء) to show dynamic interaction matching user reference
await page.locator('#date-item-3').click();
await page.waitForTimeout(300);

const fullPath3 = path.join(auditDir, 'tactile_date_selector_tuesday_active.png');
await page.screenshot({ path: fullPath3 });
console.log('Saved:', fullPath3);

const closeUp3 = path.join(auditDir, 'tactile_date_selector_tuesday_closeup.png');
await selectorCard.screenshot({ path: closeUp3 });
console.log('Saved:', closeUp3);

await browser.close();

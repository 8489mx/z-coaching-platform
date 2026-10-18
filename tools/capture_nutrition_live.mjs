import path from 'path';

const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const pwImport = await import(`file://${pwModulePath}`);
const pw = pwImport.default || pwImport;

const auditDir = 'C:/Users/Fannan/.gemini/antigravity/brain/4e0e0f3a-2130-4f00-8c43-e6b3dc5f46c2/visual_audit';

const browser = await pw.chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 1100 } });

await page.goto('http://localhost:5173/mobile_app_preview.html', { waitUntil: 'networkidle' });

// 1. Style A (Default - Apple Health Editorial)
const deviceFrame = await page.$('#device-shell');
if (deviceFrame) {
  await deviceFrame.screenshot({ path: path.join(auditDir, 'live_nutrition_style_a.png') });
}

// Focus on just the nutrition card in Style A
const nutrCard = await page.$('#home-nutrition-card');
if (nutrCard) {
  await nutrCard.screenshot({ path: path.join(auditDir, 'card_nutrition_style_a.png') });
}

// 2. Click Style B (Tonal Pods)
await page.click('#btn-nutr-b');
await page.waitForTimeout(300);

if (deviceFrame) {
  await deviceFrame.screenshot({ path: path.join(auditDir, 'live_nutrition_style_b.png') });
}
if (nutrCard) {
  await nutrCard.screenshot({ path: path.join(auditDir, 'card_nutrition_style_b.png') });
}

// 3. Click Style C (Structured Bar)
await page.click('#btn-nutr-c');
await page.waitForTimeout(300);

if (deviceFrame) {
  await deviceFrame.screenshot({ path: path.join(auditDir, 'live_nutrition_style_c.png') });
}
if (nutrCard) {
  await nutrCard.screenshot({ path: path.join(auditDir, 'card_nutrition_style_c.png') });
}

// 4. Reset to Style A
await page.click('#btn-nutr-a');
await page.waitForTimeout(200);

// 5. Capture Pure Mobile Screen (raw=1)
const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobilePage.goto('http://localhost:5173/mobile_app_preview.html?raw=1', { waitUntil: 'networkidle' });
await mobilePage.screenshot({ path: path.join(auditDir, 'live_pure_mobile_screen.png') });
await mobilePage.close();

await page.close();
await browser.close();
console.log('Nutrition visual captures finished successfully.');

import path from 'path';

const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const pwImport = await import(`file://${pwModulePath}`);
const pw = pwImport.default || pwImport;

const auditDir = 'C:/Users/Fannan/.gemini/antigravity/brain/4e0e0f3a-2130-4f00-8c43-e6b3dc5f46c2/visual_audit';

const browser = await pw.chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 1100 } });

await page.goto('http://localhost:5173/mobile_app_preview.html', { waitUntil: 'networkidle' });

const deviceFrame = await page.$('#device-shell');

// 1. Capture Today tab (Nutrition card + Check-in card with Ghost Pills)
if (deviceFrame) {
  await deviceFrame.screenshot({ path: path.join(auditDir, 'screen_today_ghost_pills.png') });
}

// Focus on Nutrition card
const nutrCard = await page.$('#home-nutrition-card');
if (nutrCard) {
  await nutrCard.screenshot({ path: path.join(auditDir, 'card_nutrition_ghost_pill.png') });
}

// 2. Switch to Workout tab
await page.evaluate(() => window.switchTab && window.switchTab(1));
await page.waitForTimeout(400);
if (deviceFrame) {
  await deviceFrame.screenshot({ path: path.join(auditDir, 'screen_workout_ghost_pills.png') });
}

// 3. Switch to Nutrition tab
await page.evaluate(() => window.switchTab && window.switchTab(2));
await page.waitForTimeout(400);
if (deviceFrame) {
  await deviceFrame.screenshot({ path: path.join(auditDir, 'screen_nutrition_ghost_pills.png') });
}

// 4. Switch to Check-in tab and show history
await page.evaluate(() => {
  if (window.switchTab) window.switchTab(3);
  if (window.toggleCheckinView) window.toggleCheckinView('history');
});
await page.waitForTimeout(400);
if (deviceFrame) {
  await deviceFrame.screenshot({ path: path.join(auditDir, 'screen_checkin_history_ghost_pills.png') });
}

console.log('Screenshots captured successfully.');
await browser.close();

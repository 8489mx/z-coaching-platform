import path from 'path';
import fs from 'fs';

const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const pwImport = await import(`file://${pwModulePath}`);
const pw = pwImport.default || pwImport;

const auditDir = 'C:/Users/Fannan/.gemini/antigravity/brain/4e0e0f3a-2130-4f00-8c43-e6b3dc5f46c2/visual_audit';
if (!fs.existsSync(auditDir)) {
  fs.mkdirSync(auditDir, { recursive: true });
}

const browser = await pw.chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--disable-extensions', '--no-sandbox']
});

const page = await browser.newPage({ viewport: { width: 440, height: 950 } });
await page.goto('http://localhost:5173/mobile_app_preview.html?raw=1', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);

// 1. Workout Day (Saturday - index 0)
await page.evaluate(() => window.selectDate(0));
await page.waitForTimeout(300);
const heroCard = await page.$('#home-hero-card');
if (heroCard) {
  await heroCard.screenshot({ path: path.join(auditDir, 'hero_state_workout_sat.png') });
  console.log('Saved hero_state_workout_sat.png');
}
await page.screenshot({ path: path.join(auditDir, 'today_screen_workout_sat.png') });
console.log('Saved today_screen_workout_sat.png');

// 2. Recovery Day (Monday - index 2)
await page.evaluate(() => window.selectDate(2));
await page.waitForTimeout(300);
if (heroCard) {
  await heroCard.screenshot({ path: path.join(auditDir, 'hero_state_recovery_mon.png') });
  console.log('Saved hero_state_recovery_mon.png');
}
await page.screenshot({ path: path.join(auditDir, 'today_screen_recovery_mon.png') });
console.log('Saved today_screen_recovery_mon.png');

// 3. Check-in Day (Friday - index 6)
await page.evaluate(() => window.selectDate(6));
await page.waitForTimeout(300);
if (heroCard) {
  await heroCard.screenshot({ path: path.join(auditDir, 'hero_state_checkin_fri.png') });
  console.log('Saved hero_state_checkin_fri.png');
}
await page.screenshot({ path: path.join(auditDir, 'today_screen_checkin_fri.png') });
console.log('Saved today_screen_checkin_fri.png');

await page.close();
await browser.close();
console.log('All hero state captures finished successfully.');

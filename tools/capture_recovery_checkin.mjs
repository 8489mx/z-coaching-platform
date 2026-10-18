import path from 'path';

const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const pwImport = await import(`file://${pwModulePath}`);
const pw = pwImport.default || pwImport;

const auditDir = 'C:/Users/Fannan/.gemini/antigravity/brain/4e0e0f3a-2130-4f00-8c43-e6b3dc5f46c2/visual_audit';

const browser = await pw.chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 1100 } });

await page.goto('http://localhost:5173/mobile_app_preview.html', { waitUntil: 'networkidle' });

const heroCard = await page.$('#home-hero-card');

// Select Monday (Recovery - index 2)
await page.evaluate(() => {
  if (window.selectDate) window.selectDate(2);
});
await page.waitForTimeout(300);
if (heroCard) {
  await heroCard.screenshot({ path: path.join(auditDir, 'hero_card_recovery_day.png') });
}

// Select Friday (Check-in - index 6)
await page.evaluate(() => {
  if (window.selectDate) window.selectDate(6);
});
await page.waitForTimeout(300);
if (heroCard) {
  await heroCard.screenshot({ path: path.join(auditDir, 'hero_card_checkin_day.png') });
}

console.log('Recovery and Check-in screenshots captured.');
await browser.close();

import path from 'path';

const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const pwImport = await import(`file://${pwModulePath}`);
const pw = pwImport.default || pwImport;

const auditDir = 'C:/Users/Fannan/.gemini/antigravity/brain/4e0e0f3a-2130-4f00-8c43-e6b3dc5f46c2/visual_audit';

const browser = await pw.chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 1100 } });

await page.goto('http://localhost:5173/mobile_app_preview.html', { waitUntil: 'networkidle' });

const deviceFrame = await page.$('#device-shell');

// 1. Capture Home Top (Saturday - Push Day)
if (deviceFrame) {
  await deviceFrame.screenshot({ path: path.join(auditDir, 'home_screen_top_new.png') });
}

// 2. Capture Home Bottom (Check-in & Supplements)
await page.evaluate(() => {
  const container = document.querySelector('#screen-today')?.parentElement;
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
});
await page.waitForTimeout(300);

if (deviceFrame) {
  await deviceFrame.screenshot({ path: path.join(auditDir, 'home_screen_bottom_new.png') });
}

// 3. Scroll back to top and select Sunday (Pull Day)
await page.evaluate(() => {
  const container = document.querySelector('#screen-today')?.parentElement;
  if (container) container.scrollTop = 0;
  if (window.selectDate) window.selectDate(1);
});
await page.waitForTimeout(300);

const heroCard = await page.$('#home-hero-card');
if (heroCard) {
  await heroCard.screenshot({ path: path.join(auditDir, 'hero_card_pull_day.png') });
}

// 4. Select Tuesday (Leg Day)
await page.evaluate(() => {
  if (window.selectDate) window.selectDate(3);
});
await page.waitForTimeout(300);

if (heroCard) {
  await heroCard.screenshot({ path: path.join(auditDir, 'hero_card_leg_day.png') });
}

console.log('New Home screen screenshots captured successfully.');
await browser.close();

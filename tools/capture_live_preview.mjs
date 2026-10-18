import path from 'path';

const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const pwImport = await import(`file://${pwModulePath}`);
const pw = pwImport.default || pwImport;

const auditDir = 'C:/Users/Fannan/.gemini/antigravity/brain/4e0e0f3a-2130-4f00-8c43-e6b3dc5f46c2/visual_audit';

const browser = await pw.chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 1100 } });

await page.goto('http://localhost:5173/mobile_app_preview.html', { waitUntil: 'networkidle' });

// 1. Capture full screen with Architectural Badges (Option A)
await page.screenshot({ path: path.join(auditDir, 'preview_badges_arch_full.png') });

const deviceFrame = await page.$('#device-shell');
if (deviceFrame) {
  await deviceFrame.screenshot({ path: path.join(auditDir, 'preview_badges_arch_device.png') });
}

// 2. Click Capsule Badges (Option B)
await page.click('#btn-badge-capsule');
await page.waitForTimeout(300);

if (deviceFrame) {
  await deviceFrame.screenshot({ path: path.join(auditDir, 'preview_badges_capsule_device.png') });
}

// 3. Switch back to Architectural for multi-day inspection
await page.click('#btn-badge-arch');
await page.waitForTimeout(200);

// Click Monday (Day 2) to verify Recovery day with architectural badges
await page.click('#date-item-2');
await page.waitForTimeout(300);

if (deviceFrame) {
  await deviceFrame.screenshot({ path: path.join(auditDir, 'preview_badges_arch_monday_recovery.png') });
}

// Click Friday (Day 6) to verify Check-in day with architectural badges
await page.click('#date-item-6');
await page.waitForTimeout(300);

if (deviceFrame) {
  await deviceFrame.screenshot({ path: path.join(auditDir, 'preview_badges_arch_friday_checkin.png') });
}

// Click Saturday (Day 0) and scroll to capture Supplements
await page.click('#date-item-0');
await page.waitForTimeout(200);
await page.evaluate(() => {
  const vp = document.getElementById('phone-viewport');
  if (vp) vp.scrollTop = 380;
});
await page.waitForTimeout(300);

if (deviceFrame) {
  await deviceFrame.screenshot({ path: path.join(auditDir, 'preview_badges_arch_scrolled.png') });
}

await page.close();
await browser.close();
console.log('Capture completed successfully');

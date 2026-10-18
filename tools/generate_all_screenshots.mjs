import fs from 'fs';
import path from 'path';

const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const pwImport = await import(`file://${pwModulePath}`);
const pw = pwImport.default || pwImport;

async function main() {
  const outputDir = path.resolve('d:/zcc/temp_screenshots');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('Launching browser...');
  const browser = await pw.chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--disable-extensions', '--no-sandbox']
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 1200 },
    deviceScaleFactor: 2
  });

  console.log('Navigating to http://localhost:5173/mobile_app_preview.html...');
  await page.goto('http://localhost:5173/mobile_app_preview.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const deviceShell = page.locator('#device-shell');

  // 1. Tab 0: Home Screen
  console.log('Capturing 01_Home_Screen.png...');
  await page.evaluate(() => { if (typeof switchTab === 'function') switchTab(0); });
  await page.waitForTimeout(500);
  await deviceShell.screenshot({ path: path.join(outputDir, '01_Home_Screen.png') });

  // 2. Tab 1: Workout Screen
  console.log('Capturing 02_Workout_Screen.png...');
  await page.evaluate(() => { if (typeof switchTab === 'function') switchTab(1); });
  await page.waitForTimeout(500);
  await deviceShell.screenshot({ path: path.join(outputDir, '02_Workout_Screen.png') });

  // 3. Tab 2: Nutrition Screen
  console.log('Capturing 03_Nutrition_Screen.png...');
  await page.evaluate(() => { if (typeof switchTab === 'function') switchTab(2); });
  await page.waitForTimeout(500);
  await deviceShell.screenshot({ path: path.join(outputDir, '03_Nutrition_Screen.png') });

  // 4. Tab 2: Nutrition Swap Modal (if present)
  console.log('Capturing 04_Nutrition_Food_Swap.png...');
  const swapTrigger = page.locator('button:has-text("تبديل"), button:has-text("بدائل")').first();
  if (await swapTrigger.count() > 0 && await swapTrigger.isVisible()) {
    await swapTrigger.click();
    await page.waitForTimeout(400);
    await deviceShell.screenshot({ path: path.join(outputDir, '04_Nutrition_Food_Swap.png') });
    // Close modal if open
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }

  // 5. Tab 3: Check-in (State: Due)
  console.log('Capturing 05_Checkin_Due_Screen.png...');
  await page.evaluate(() => {
    if (typeof switchTab === 'function') switchTab(3);
    if (typeof setCheckinState === 'function') setCheckinState('due');
    if (typeof toggleCheckinView === 'function') toggleCheckinView('form');
  });
  await page.waitForTimeout(500);
  await deviceShell.screenshot({ path: path.join(outputDir, '05_Checkin_Due_Screen.png') });

  // 6. Tab 3: Check-in (State: Upcoming)
  console.log('Capturing 06_Checkin_Upcoming_Screen.png...');
  await page.evaluate(() => {
    if (typeof setCheckinState === 'function') setCheckinState('upcoming');
  });
  await page.waitForTimeout(500);
  await deviceShell.screenshot({ path: path.join(outputDir, '06_Checkin_Upcoming_Screen.png') });

  // 7. Tab 3: Check-in (State: Submitted)
  console.log('Capturing 07_Checkin_Submitted_Screen.png...');
  await page.evaluate(() => {
    if (typeof setCheckinState === 'function') setCheckinState('submitted');
  });
  await page.waitForTimeout(500);
  await deviceShell.screenshot({ path: path.join(outputDir, '07_Checkin_Submitted_Screen.png') });

  // 8. Tab 3: Check-in History & Trend
  console.log('Capturing 08_Checkin_History_Screen.png...');
  await page.evaluate(() => {
    if (typeof toggleCheckinView === 'function') toggleCheckinView('history');
  });
  await page.waitForTimeout(500);
  await deviceShell.screenshot({ path: path.join(outputDir, '08_Checkin_History_Screen.png') });

  // 9. Tab 4: Account Screen
  console.log('Capturing 09_Account_Settings_Screen.png...');
  await page.evaluate(() => { if (typeof switchTab === 'function') switchTab(4); });
  await page.waitForTimeout(500);
  await deviceShell.screenshot({ path: path.join(outputDir, '09_Account_Settings_Screen.png') });

  // 10. Bottom Navigation Bar Closeup
  console.log('Capturing 10_Bottom_Navigation_SF_Symbols_Closeup.png...');
  const bottomNav = page.locator('#floating-bottom-nav');
  await bottomNav.screenshot({ path: path.join(outputDir, '10_Bottom_Navigation_SF_Symbols_Closeup.png') });

  await browser.close();
  console.log('All screenshots captured successfully.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const pwImport = await import(`file://${pwModulePath}`);
const pw = pwImport.default || pwImport;

async function main() {
  const outputDir = path.resolve('d:/zcc/temp_screenshots');
  const artifactDir = 'C:/Users/Fannan/.gemini/antigravity/brain/81dd76d6-ffef-4b71-b47f-0fc28953b459';
  
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
  await page.waitForTimeout(800);

  const deviceShell = page.locator('#device-shell');

  const scrollContainer = async (top) => {
    await page.evaluate((t) => {
      const el = document.querySelector('#device-shell .overflow-y-auto');
      if (el) el.scrollTop = t;
    }, top);
    await page.waitForTimeout(300);
  };

  // 1. Tab 0: Home Screen Top
  console.log('Capturing 01_Home_Overview.png...');
  await page.evaluate(() => { if (typeof switchTab === 'function') switchTab(0); });
  await scrollContainer(0);
  await deviceShell.screenshot({ path: path.join(outputDir, '01_Home_Overview.png') });

  // 2. Tab 0: Home Screen Scrolled
  console.log('Capturing 02_Home_Scrolled.png...');
  await scrollContainer(380);
  await deviceShell.screenshot({ path: path.join(outputDir, '02_Home_Scrolled.png') });

  // 3. Tab 1: Workout Screen Top
  console.log('Capturing 03_Workout_Overview.png...');
  await page.evaluate(() => { if (typeof switchTab === 'function') switchTab(1); });
  await scrollContainer(0);
  await deviceShell.screenshot({ path: path.join(outputDir, '03_Workout_Overview.png') });

  // 4. Tab 1: Workout Screen Scrolled (Exercises & Cardio & Complete Finish Button)
  console.log('Capturing 04_Workout_Scrolled_Cardio.png...');
  await scrollContainer(900);
  await deviceShell.screenshot({ path: path.join(outputDir, '04_Workout_Scrolled_Cardio.png') });

  // 5. Tab 1: Workout Alternative Sheet
  console.log('Capturing 05_Workout_Alternative_Sheet.png...');
  await scrollContainer(0);
  await page.evaluate(() => {
    if (typeof openAltSheet === 'function') {
      openAltSheet(1);
    }
  });
  await page.waitForTimeout(400);
  await deviceShell.screenshot({ path: path.join(outputDir, '05_Workout_Alternative_Sheet.png') });
  await page.evaluate(() => { if (typeof closeAltSheet === 'function') closeAltSheet(); });
  await page.waitForTimeout(200);

  // 6. Tab 2: Nutrition Screen Top
  console.log('Capturing 06_Nutrition_Overview.png...');
  await page.evaluate(() => { if (typeof switchTab === 'function') switchTab(2); });
  await scrollContainer(0);
  await deviceShell.screenshot({ path: path.join(outputDir, '06_Nutrition_Overview.png') });

  // 7. Tab 2: Nutrition Screen Scrolled (Meals & Rows)
  console.log('Capturing 07_Nutrition_Meals_Scrolled.png...');
  await scrollContainer(420);
  await deviceShell.screenshot({ path: path.join(outputDir, '07_Nutrition_Meals_Scrolled.png') });

  // 8. Tab 2: Nutrition Food Swap Sheet
  console.log('Capturing 08_Nutrition_Food_Swap_Sheet.png...');
  await scrollContainer(0);
  await page.evaluate(() => {
    if (typeof openSwapModal === 'function') {
      openSwapModal('شوفان كامل الحبة', 'food-m1-item1', 'carb');
    }
  });
  await page.waitForTimeout(400);
  await deviceShell.screenshot({ path: path.join(outputDir, '08_Nutrition_Food_Swap_Sheet.png') });
  await page.evaluate(() => { if (typeof closeSwapModal === 'function') closeSwapModal(); });
  await page.waitForTimeout(200);

  // 9. Tab 3: Check-in (State: Due Form Top)
  console.log('Capturing 09_Checkin_Due_Form.png...');
  await page.evaluate(() => {
    if (typeof switchTab === 'function') switchTab(3);
    if (typeof setCheckinState === 'function') setCheckinState('due');
    if (typeof toggleCheckinView === 'function') toggleCheckinView('form');
  });
  await scrollContainer(0);
  await deviceShell.screenshot({ path: path.join(outputDir, '09_Checkin_Due_Form.png') });

  // 10. Tab 3: Check-in (State: Due Form Scrolled)
  console.log('Capturing 10_Checkin_Form_Scrolled.png...');
  await scrollContainer(400);
  await deviceShell.screenshot({ path: path.join(outputDir, '10_Checkin_Form_Scrolled.png') });

  // 11. Tab 3: Check-in (State: Upcoming)
  console.log('Capturing 11_Checkin_Upcoming_State.png...');
  await page.evaluate(() => {
    if (typeof setCheckinState === 'function') setCheckinState('upcoming');
  });
  await scrollContainer(0);
  await deviceShell.screenshot({ path: path.join(outputDir, '11_Checkin_Upcoming_State.png') });

  // 12. Tab 3: Check-in (State: Submitted)
  console.log('Capturing 12_Checkin_Submitted_State.png...');
  await page.evaluate(() => {
    if (typeof setCheckinState === 'function') setCheckinState('submitted');
  });
  await scrollContainer(0);
  await deviceShell.screenshot({ path: path.join(outputDir, '12_Checkin_Submitted_State.png') });

  // 13. Tab 3: Check-in (History View)
  console.log('Capturing 13_Checkin_Progress_History.png...');
  await page.evaluate(() => {
    if (typeof toggleCheckinView === 'function') toggleCheckinView('history');
  });
  await scrollContainer(0);
  await deviceShell.screenshot({ path: path.join(outputDir, '13_Checkin_Progress_History.png') });

  // 14. Tab 4: Account Screen Top
  console.log('Capturing 14_Account_Profile.png...');
  await page.evaluate(() => { if (typeof switchTab === 'function') switchTab(4); });
  await scrollContainer(0);
  await deviceShell.screenshot({ path: path.join(outputDir, '14_Account_Profile.png') });

  // 15. Tab 4: Account Screen Scrolled
  console.log('Capturing 15_Account_Settings_Scrolled.png...');
  await scrollContainer(450);
  await deviceShell.screenshot({ path: path.join(outputDir, '15_Account_Settings_Scrolled.png') });

  // 16. Bottom Navigation Bar SF Symbols Closeup
  console.log('Capturing 16_Bottom_Navigation_SF_Symbols_Closeup.png...');
  const bottomNav = page.locator('#floating-bottom-nav');
  await bottomNav.screenshot({ path: path.join(outputDir, '16_Bottom_Navigation_SF_Symbols_Closeup.png') });

  await browser.close();
  console.log('All 16 screenshots captured.');

  // Copy to artifact directory for clickable preview
  const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.png'));
  for (const f of files) {
    fs.copyFileSync(path.join(outputDir, f), path.join(artifactDir, f));
  }
  console.log('Copied to artifact directory.');

  // Create Zip Archive using PowerShell
  const zipDest1 = path.resolve('d:/zcc/karim_zakaria_app_screenshots.zip');
  const zipDest2 = path.resolve('frontend/public/karim_zakaria_app_screenshots.zip');
  
  if (fs.existsSync(zipDest1)) fs.unlinkSync(zipDest1);
  if (fs.existsSync(zipDest2)) fs.unlinkSync(zipDest2);

  const psCmd = `powershell -Command "Compress-Archive -Path '${outputDir}/*.png' -DestinationPath '${zipDest1}' -Force"`;
  execSync(psCmd, { stdio: 'inherit' });
  console.log('Zip archive created at:', zipDest1);

  fs.copyFileSync(zipDest1, zipDest2);
  console.log('Zip archive copied to public folder at:', zipDest2);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

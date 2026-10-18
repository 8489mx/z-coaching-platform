import fs from 'fs';
import path from 'path';

const outDir = 'd:/zcc/karim_zakaria_app_screens';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const { chromium } = (await import(`file://${pwModulePath}`)).default;

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true
  });
  
  const page = await browser.newPage({
    viewport: { width: 1400, height: 1100 },
    deviceScaleFactor: 2 // High-definition retina capture
  });

  const fileUrl = 'file:///' + path.resolve('frontend/public/preview.html').replace(/\\/g, '/');
  await page.goto(fileUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);

  const device = await page.$('#device-shell');
  if (!device) {
    console.error('Device shell not found!');
    await browser.close();
    return;
  }

  const scrollContainer = async (top) => {
    await page.evaluate((t) => {
      const el = document.querySelector('#device-shell .overflow-y-auto');
      if (el) el.scrollTop = t;
    }, top);
    await page.waitForTimeout(350);
  };

  const switchAppTab = async (idx) => {
    await page.evaluate((i) => {
      if (typeof switchTab === 'function') switchTab(i);
    }, idx);
    await page.waitForTimeout(400);
  };

  console.log('Capturing Home screen...');
  // 1. Home Overview
  await switchAppTab(0);
  await scrollContainer(0);
  await device.screenshot({ path: path.join(outDir, '01_Home_Overview.png') });

  // 2. Home Scrolled
  await scrollContainer(380);
  await device.screenshot({ path: path.join(outDir, '02_Home_Scrolled.png') });

  console.log('Capturing Workout screen...');
  // 3. Workout Exercises & Logging
  await switchAppTab(1);
  await scrollContainer(0);
  await device.screenshot({ path: path.join(outDir, '03_Workout_Exercise_Logging.png') });

  // 4. Workout Cardio & Completion
  await scrollContainer(580);
  await device.screenshot({ path: path.join(outDir, '04_Workout_Cardio_Completion.png') });

  // 5. Workout Alternative Sheet
  await scrollContainer(0);
  await page.evaluate(() => {
    if (typeof openAltSheet === 'function') {
      openAltSheet('Wide Grip Lat Pulldown', 'سحب ظهر واسع بالجهاز', [
        { enName: 'Pull-up Assisted Machine', arName: 'عقلة مساعدة بالجهاز', toolType: 'جهاز' },
        { enName: 'Close Grip Lat Pulldown', arName: 'سحب ظهر قبضة ضيقة V-Bar', toolType: 'كابل' }
      ]);
    }
  });
  await page.waitForTimeout(400);
  await device.screenshot({ path: path.join(outDir, '05_Workout_Alternative_Sheet.png') });
  await page.evaluate(() => {
    if (typeof closeAltSheet === 'function') closeAltSheet();
  });
  await page.waitForTimeout(200);

  console.log('Capturing Nutrition screen...');
  // 6. Nutrition Overview (Clean verified images)
  await switchAppTab(2);
  await scrollContainer(0);
  await device.screenshot({ path: path.join(outDir, '06_Nutrition_Overview.png') });

  // 7. Nutrition Meals 2 & 3
  await scrollContainer(340);
  await device.screenshot({ path: path.join(outDir, '07_Nutrition_Meals_Food_Rows.png') });

  // 8. Nutrition Food Rows Continued
  await scrollContainer(700);
  await device.screenshot({ path: path.join(outDir, '08_Nutrition_Food_Rows_Continued.png') });

  // 9. Nutrition Food Swap Sheet
  await scrollContainer(0);
  await page.evaluate(() => {
    if (typeof openSwapModal === 'function') {
      openSwapModal('شوفان كامل الحبة', 'food-m1-item1', 'carb');
    }
  });
  await page.waitForTimeout(400);
  await device.screenshot({ path: path.join(outDir, '09_Nutrition_Food_Swap_Sheet.png') });
  await page.evaluate(() => {
    if (typeof closeSwapModal === 'function') closeSwapModal();
  });
  await page.waitForTimeout(200);

  console.log('Capturing Check-in screen...');
  // 10. Check-in Measurements
  await switchAppTab(3);
  await page.evaluate(() => {
    if (typeof toggleCheckinView === 'function') toggleCheckinView('form');
  });
  await scrollContainer(0);
  await device.screenshot({ path: path.join(outDir, '10_Checkin_Measurements.png') });

  // 11. Check-in Wellbeing & Photos
  await scrollContainer(380);
  await device.screenshot({ path: path.join(outDir, '11_Checkin_Wellbeing_Photos.png') });

  // 12. Check-in Submission
  await scrollContainer(750);
  await device.screenshot({ path: path.join(outDir, '12_Checkin_Submission.png') });

  // 13. Progress History
  await page.evaluate(() => {
    if (typeof toggleCheckinView === 'function') toggleCheckinView('history');
  });
  await scrollContainer(0);
  await page.waitForTimeout(300);
  await device.screenshot({ path: path.join(outDir, '13_Progress_History.png') });

  console.log('Capturing Account screen...');
  // 14. Account Profile
  await switchAppTab(4);
  await scrollContainer(0);
  await device.screenshot({ path: path.join(outDir, '14_Account_Profile.png') });

  // 15. Account Units & Notifications
  await scrollContainer(380);
  await device.screenshot({ path: path.join(outDir, '15_Account_Units_Notifications.png') });

  // 16. Account Security & Logout
  await scrollContainer(760);
  await device.screenshot({ path: path.join(outDir, '16_Account_Security_Logout.png') });

  console.log('All 16 high-definition screenshots captured successfully!');
  await browser.close();
})();

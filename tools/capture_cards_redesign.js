import path from 'path';

const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const pwImport = await import(`file://${pwModulePath}`);
const pw = pwImport.default || pwImport;

const baseDir = 'C:/Users/Fannan/.gemini/antigravity/brain/b18eb724-0caf-4c71-a8f7-2a9df1328823';

const browser = await pw.chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--disable-extensions', '--no-sandbox']
});

// 1. Mobile Simulator Captures (390px iPhone viewport)
const mobilePage = await browser.newPage({ viewport: { width: 450, height: 950 } });
await mobilePage.goto('http://localhost:5173/mobile_app_preview.html', { waitUntil: 'networkidle' });
await mobilePage.waitForTimeout(600);

// Today Screen
await mobilePage.screenshot({ path: path.join(baseDir, 'cards_redesign_today_390.png') });
console.log('Saved cards_redesign_today_390.png');

// Workout Screen (click tab 1)
await mobilePage.click('.nav-tab-item[data-index="1"]');
await mobilePage.waitForTimeout(500);
await mobilePage.screenshot({ path: path.join(baseDir, 'cards_redesign_workout_390.png') });
console.log('Saved cards_redesign_workout_390.png');

// Nutrition Screen (click tab 2)
await mobilePage.click('.nav-tab-item[data-index="2"]');
await mobilePage.waitForTimeout(500);
await mobilePage.screenshot({ path: path.join(baseDir, 'cards_redesign_nutrition_390.png') });
console.log('Saved cards_redesign_nutrition_390.png');

// Check-in Screen (click tab 3)
await mobilePage.click('.nav-tab-item[data-index="3"]');
await mobilePage.waitForTimeout(500);
// Also click "المتابعات السابقة" to show the redesigned Domino's style history cards!
await mobilePage.click('#chk-view-history');
await mobilePage.waitForTimeout(400);
await mobilePage.screenshot({ path: path.join(baseDir, 'cards_redesign_checkin_history_390.png') });
console.log('Saved cards_redesign_checkin_history_390.png');

// Account Screen (click tab 4)
await mobilePage.click('.nav-tab-item[data-index="4"]');
await mobilePage.waitForTimeout(500);
await mobilePage.screenshot({ path: path.join(baseDir, 'cards_redesign_account_390.png') });
console.log('Saved cards_redesign_account_390.png');

await mobilePage.close();

// 2. Full Desktop Studio Capture
const studioPage = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
await studioPage.goto('http://localhost:5173/preview.html', { waitUntil: 'networkidle' });
await studioPage.waitForTimeout(600);
await studioPage.screenshot({ path: path.join(baseDir, 'cards_redesign_studio_desktop.png') });
console.log('Saved cards_redesign_studio_desktop.png');

await studioPage.close();
await browser.close();
console.log('All card redesign screenshots completed successfully.');

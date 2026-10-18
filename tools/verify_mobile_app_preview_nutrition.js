import path from 'path';
import fs from 'fs';

const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const pwImport = await import(`file://${pwModulePath}`);
const pw = pwImport.default || pwImport;

const artifactDir = 'C:/Users/Fannan/.gemini/antigravity/brain/81dd76d6-ffef-4b71-b47f-0fc28953b459';

async function run() {
  const browser = await pw.chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--disable-extensions', '--no-sandbox']
  });

  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 1100 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  
  await page.goto('http://localhost:5173/mobile_app_preview.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // Switch to nutrition
  await page.evaluate(() => switchTab('nutrition'));
  await page.waitForTimeout(400);

  // Locate the nutrition screen
  const nutritionScreen = page.locator('#screen-nutrition');
  const shotPath = path.join(artifactDir, 'mobile_app_preview_nutrition_verified.png');
  await nutritionScreen.screenshot({ path: shotPath });
  console.log('Saved mobile_app_preview_nutrition_verified.png');

  // Open swap modal and screenshot
  await page.evaluate(() => openSwapModal('صدور دجاج مشوية', 'food-m2-item1', 'protein'));
  await page.waitForTimeout(400);
  const modalLocator = page.locator('#modal-swap-sheet > div');
  const modalShotPath = path.join(artifactDir, 'mobile_app_preview_modal_verified.png');
  await modalLocator.screenshot({ path: modalShotPath });
  console.log('Saved mobile_app_preview_modal_verified.png');

  await browser.close();
  console.log('All verifications finished.');
}

run().catch(console.error);

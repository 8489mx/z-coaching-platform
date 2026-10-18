import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';

const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const pwImport = await import(`file://${pwModulePath}`);
const pw = pwImport.default || pwImport;

const artifactDir = 'C:/Users/Fannan/.gemini/antigravity/brain/81dd76d6-ffef-4b71-b47f-0fc28953b459';
if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

const htmlFilePath = path.resolve('frontend/public/nutrition_apple_polish_comparison.html');
const fileUrl = pathToFileURL(htmlFilePath).href;

console.log('Loading Nutrition Comparison URL:', fileUrl);

async function run() {
  const browser = await pw.chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--disable-extensions', '--no-sandbox']
  });

  // 1. Capture 390px default side-by-side
  const ctx = await browser.newContext({
    viewport: { width: 1200, height: 1100 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await page.goto(fileUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // Capture full side-by-side comparison at 390px
  const shot390 = path.join(artifactDir, 'nutrition_comparison_390px.png');
  await page.screenshot({ path: shot390, fullPage: true });
  console.log('Saved 390px side-by-side:', shot390);

  // Close-up: Frame After (Refined Screen)
  const afterFrame = page.locator('#frame-after');
  if (await afterFrame.isVisible()) {
    const afterShot = path.join(artifactDir, 'nutrition_after_screen_closeup.png');
    await afterFrame.screenshot({ path: afterShot });
    console.log('Saved After screen closeup:', afterShot);
  }

  // Close-up: After Summary Card
  const summaryCard = page.locator('#after-summary-card');
  if (await summaryCard.isVisible()) {
    const cardShot = path.join(artifactDir, 'nutrition_summary_card_after.png');
    await summaryCard.screenshot({ path: cardShot });
    console.log('Saved summary card after:', cardShot);
  }

  // 2. Switch to 375px and capture
  await page.click('#btn-375');
  await page.waitForTimeout(400);
  const shot375 = path.join(artifactDir, 'nutrition_comparison_375px.png');
  await page.screenshot({ path: shot375, fullPage: true });
  console.log('Saved 375px:', shot375);

  // 3. Switch to 430px and capture
  await page.click('#btn-430');
  await page.waitForTimeout(400);
  const shot430 = path.join(artifactDir, 'nutrition_comparison_430px.png');
  await page.screenshot({ path: shot430, fullPage: true });
  console.log('Saved 430px:', shot430);

  // 4. Open and Capture Swap Bottom Sheet
  await page.click('#btn-390');
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    openSwapModalPreview('صدور دجاج مشوية', 'after-food-m2-item1', 'protein');
  });
  await page.waitForTimeout(400);

  const sheetShot = path.join(artifactDir, 'nutrition_swap_sheet_apple.png');
  await page.screenshot({ path: sheetShot, fullPage: true });
  console.log('Saved swap sheet preview:', sheetShot);

  await browser.close();
  console.log('All Nutrition Phase 02 captures completed successfully.');
}

run().catch(err => {
  console.error('Capture error:', err);
  process.exit(1);
});

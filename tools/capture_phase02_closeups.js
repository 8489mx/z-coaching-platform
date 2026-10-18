import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';

const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const pwImport = await import(`file://${pwModulePath}`);
const pw = pwImport.default || pwImport;

const artifactDir = 'C:/Users/Fannan/.gemini/antigravity/brain/81dd76d6-ffef-4b71-b47f-0fc28953b459';
const htmlFilePath = path.resolve('frontend/public/nutrition_apple_polish_comparison.html');
const fileUrl = pathToFileURL(htmlFilePath).href;

async function run() {
  const browser = await pw.chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--disable-extensions', '--no-sandbox']
  });

  const ctx = await browser.newContext({
    viewport: { width: 1200, height: 1100 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await page.goto(fileUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  // Before summary card
  const beforeSummary = page.locator('#frame-before section').nth(1);
  if (await beforeSummary.isVisible()) {
    await beforeSummary.screenshot({ path: path.join(artifactDir, 'nutrition_summary_card_before.png') });
  }

  // Before meal 1
  const beforeMeal1 = page.locator('#frame-before article').nth(0);
  if (await beforeMeal1.isVisible()) {
    await beforeMeal1.screenshot({ path: path.join(artifactDir, 'nutrition_meal_card_before.png') });
  }

  // After meal 1
  const afterMeal1 = page.locator('#frame-after article').nth(0);
  if (await afterMeal1.isVisible()) {
    await afterMeal1.screenshot({ path: path.join(artifactDir, 'nutrition_meal_card_after.png') });
  }

  await browser.close();
  console.log('Component closeups captured.');
}

run();

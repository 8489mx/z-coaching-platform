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

const htmlFilePath = path.resolve('frontend/public/workout_apple_polish_comparison.html');
const fileUrl = pathToFileURL(htmlFilePath).href;

console.log('Loading file URL:', fileUrl);

async function run() {
  const browser = await pw.chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--disable-extensions', '--no-sandbox']
  });

  // 1. Capture 390px default side-by-side
  const ctx = await browser.newContext({
    viewport: { width: 1100, height: 850 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await page.goto(fileUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  // Capture full side-by-side comparison
  const comparisonPath = path.join(artifactDir, 'workout_card_a_vs_b_390px.png');
  await page.screenshot({ path: comparisonPath, fullPage: true });
  console.log('Saved 390px side-by-side:', comparisonPath);

  // Capture Version B Card Only
  const bCardLocator = page.locator('#card-version-b');
  if (await bCardLocator.isVisible()) {
    const bCardPath = path.join(artifactDir, 'workout_card_b_refined.png');
    await bCardLocator.screenshot({ path: bCardPath });
    console.log('Saved card B refined:', bCardPath);
  }

  // 2. Switch to 375px and capture
  await page.click('#btn-375');
  await page.waitForTimeout(300);
  const shot375 = path.join(artifactDir, 'workout_card_a_vs_b_375px.png');
  await page.screenshot({ path: shot375, fullPage: true });
  console.log('Saved 375px:', shot375);

  // 3. Switch to 430px and capture
  await page.click('#btn-430');
  await page.waitForTimeout(300);
  const shot430 = path.join(artifactDir, 'workout_card_a_vs_b_430px.png');
  await page.screenshot({ path: shot430, fullPage: true });
  console.log('Saved 430px:', shot430);

  await ctx.close();
  await browser.close();
  console.log('All A/B comparison screenshots captured successfully.');
}

run().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});

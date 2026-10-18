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

  const page = await browser.newPage({ viewport: { width: 1200, height: 1200 }, deviceScaleFactor: 2 });
  await page.goto('http://localhost:5173/mobile_app_preview.html', { waitUntil: 'networkidle' });
  await page.evaluate(() => switchTab(2)); // Nutrition
  await page.waitForTimeout(400);

  // 1. Capture Top part of phone
  const shell = page.locator('#device-shell');
  const topShot = path.join(artifactDir, 'nutrition_polished_live_top.png');
  await shell.screenshot({ path: topShot });
  console.log('Saved top screenshot:', topShot);

  // 2. Scroll to the bottom inside the phone shell to test Clearance
  await page.evaluate(() => {
    const scrollable = document.querySelector('#device-shell .overflow-y-auto');
    if (scrollable) scrollable.scrollTop = scrollable.scrollHeight;
  });
  await page.waitForTimeout(400);

  const bottomShot = path.join(artifactDir, 'nutrition_polished_live_bottom_clearance.png');
  await shell.screenshot({ path: bottomShot });
  console.log('Saved bottom clearance screenshot:', bottomShot);

  // 3. Test on 375px phone frame in comparison page
  const compPage = await browser.newPage({ viewport: { width: 1200, height: 1200 }, deviceScaleFactor: 2 });
  await compPage.goto('http://localhost:5173/nutrition_apple_polish_comparison.html', { waitUntil: 'networkidle' });
  await compPage.click('#btn-375');
  await compPage.waitForTimeout(300);
  const shot375 = path.join(artifactDir, 'nutrition_polished_375px.png');
  await compPage.locator('#frame-after').screenshot({ path: shot375 });
  console.log('Saved 375px refined:', shot375);

  await browser.close();
  console.log('Visual QA completed successfully.');
}

run().catch(console.error);

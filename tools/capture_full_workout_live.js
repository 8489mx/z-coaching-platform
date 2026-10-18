import path from 'path';
import fs from 'fs';

const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const pwImport = await import(`file://${pwModulePath}`);
const pw = pwImport.default || pwImport;

const artifactDir = 'C:/Users/Fannan/.gemini/antigravity/brain/81dd76d6-ffef-4b71-b47f-0fc28953b459';
if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

const VIEWPORTS = [
  { name: '375px', width: 375, height: 812 },
  { name: '390px', width: 390, height: 844 },
  { name: '430px', width: 430, height: 932 },
];

async function run() {
  console.log('Launching browser to test http://localhost:5173/mobile_app_preview.html?tab=workout ...');
  const browser = await pw.chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--disable-extensions', '--no-sandbox']
  });

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });

    const page = await context.newPage();
    // Use raw=1 to view the mobile app canvas full viewport
    await page.goto(`http://localhost:5173/mobile_app_preview.html?raw=1&tab=workout`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // Capture Full Screen for this viewport
    const shotPath = path.join(artifactDir, `workout_live_${vp.name}.png`);
    await page.screenshot({ path: shotPath });
    console.log(`Saved screenshot for ${vp.name}: ${shotPath}`);

    // If 390px, perform interactive verification and capture card close-up
    if (vp.name === '390px') {
      const card = page.locator('#ex-card-1');
      if (await card.isVisible()) {
        const cardPath = path.join(artifactDir, 'workout_card_live_closeup.png');
        await card.screenshot({ path: cardPath });
        console.log(`Saved card close-up: ${cardPath}`);
      }

      // Test tapping + on weight
      const plusBtn = page.locator('#ex-card-1 button[aria-label="زيادة الوزن"]');
      if (await plusBtn.isVisible()) {
        await plusBtn.click();
        await page.waitForTimeout(200);
        console.log('Clicked + weight stepper.');
      }

      // Test tapping copy previous performance
      const copyBtn = page.locator('#ex-card-1 button:has-text("نسخ للأداء الحالي")');
      if (await copyBtn.isVisible()) {
        await copyBtn.click();
        await page.waitForTimeout(200);
        console.log('Clicked copy previous performance.');
      }

      // Test completion checkmark
      const doneBtn = page.locator('#ex-card-1 .ex-done-btn');
      if (await doneBtn.isVisible()) {
        await doneBtn.click();
        await page.waitForTimeout(200);
        console.log('Toggled completion checkmark.');
      }

      // Capture after interaction
      const activeShotPath = path.join(artifactDir, 'workout_live_390px_interacted.png');
      await page.screenshot({ path: activeShotPath });
      console.log(`Saved interacted screenshot: ${activeShotPath}`);
    }

    await context.close();
  }

  await browser.close();
  console.log('All live tests and captures completed successfully.');
}

run().catch(err => {
  console.error('Error during live test:', err);
  process.exit(1);
});

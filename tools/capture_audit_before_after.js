import path from 'path';
import fs from 'fs';

const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const pwImport = await import(`file://${pwModulePath}`);
const pw = pwImport.default || pwImport;

const auditDir = 'C:/Users/Fannan/.gemini/antigravity/brain/4e0e0f3a-2130-4f00-8c43-e6b3dc5f46c2/visual_audit';
if (!fs.existsSync(auditDir)) {
  fs.mkdirSync(auditDir, { recursive: true });
}

const VIEWPORTS = [
  { name: 'compact_375px', width: 375, height: 812 },
  { name: 'standard_390px', width: 390, height: 844 },
  { name: 'large_430px', width: 430, height: 932 },
];

const mode = process.argv[2] || 'before'; // 'before' or 'after'

async function capture() {
  console.log(`Starting capture mode: [${mode.toUpperCase()}] ...`);
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

    // 1. Capture Today Screen (Full Screen)
    await page.goto(`http://localhost:5173/mobile_app_preview.html?raw=1&tab=today`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    const fullShotPath = path.join(auditDir, `${mode}_today_${vp.name}.png`);
    await page.screenshot({ path: fullShotPath });
    console.log(`Saved: ${fullShotPath}`);

    // 2. Capture Nav Bar Close-up
    const navLocator = page.locator('#floating-bottom-nav');
    if (await navLocator.isVisible()) {
      const navShotPath = path.join(auditDir, `${mode}_nav_${vp.name}.png`);
      await navLocator.screenshot({ path: navShotPath });
      console.log(`Saved: ${navShotPath}`);
    }

    await context.close();
  }

  await browser.close();
  console.log(`Completed capture for [${mode.toUpperCase()}].`);
}

capture().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});

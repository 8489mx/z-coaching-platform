import path from 'path';

const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const pwImport = await import(`file://${pwModulePath}`);
const pw = pwImport.default || pwImport;

const auditDir = 'C:/Users/Fannan/.gemini/antigravity/brain/4e0e0f3a-2130-4f00-8c43-e6b3dc5f46c2/visual_audit';

const browser = await pw.chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--disable-extensions', '--no-sandbox']
});

const viewports = [
  { width: 375, height: 812, name: 'iphone_375px' },
  { width: 390, height: 844, name: 'iphone_390px' },
  { width: 430, height: 932, name: 'iphone_430px' }
];

for (const vp of viewports) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  await page.goto('http://localhost:5173/mobile_app_preview.html?raw=1', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  // Check overflow
  const hasOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth ||
           document.body.scrollWidth > window.innerWidth;
  });
  console.log(`Viewport ${vp.width}px: hasOverflow =`, hasOverflow);

  // Screenshot Today Workout
  await page.evaluate(() => window.selectDate(0));
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(auditDir, `screen_${vp.name}_workout.png`) });

  // Screenshot Today Recovery
  await page.evaluate(() => window.selectDate(2));
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(auditDir, `screen_${vp.name}_recovery.png`) });

  // Screenshot Today Checkin
  await page.evaluate(() => window.selectDate(6));
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(auditDir, `screen_${vp.name}_checkin.png`) });

  await page.close();
}

await browser.close();
console.log('All responsive viewport tests completed successfully.');

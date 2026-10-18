const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const pwImport = await import(`file://${pwModulePath}`);
const pw = pwImport.default || pwImport;

async function main() {
  const browser = await pw.chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--disable-extensions', '--no-sandbox']
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
    deviceScaleFactor: 2
  });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  console.log('Navigating to http://localhost:5173/mobile_app_preview.html');
  await page.goto('http://localhost:5173/mobile_app_preview.html', { waitUntil: 'networkidle' });

  // Switch to Checkin tab
  console.log('Switching to Checkin tab...');
  await page.evaluate(() => {
    if (typeof switchTab === 'function') switchTab(3);
  });
  await page.waitForTimeout(600);

  // Test setCheckinState('due')
  console.log('Testing setCheckinState("due")...');
  await page.evaluate(() => {
    if (typeof setCheckinState === 'function') setCheckinState('due');
  });
  await page.waitForTimeout(400);

  // Take screenshot of device shell
  const deviceShell = page.locator('#device-shell');
  await deviceShell.screenshot({ path: 'frontend/public/mobile_preview_checkin_live.png' });
  console.log('Saved screenshot to frontend/public/mobile_preview_checkin_live.png');

  console.log('Console/page errors count:', errors.length);
  if (errors.length > 0) {
    console.error('Errors found:', errors);
  }

  await browser.close();
  process.exit(errors.length > 0 ? 1 : 0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

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

async function captureScreen(deviceWidth, deviceHeight, deviceName) {
  const page = await browser.newPage({
    viewport: { width: 1400, height: 1100 }
  });

  const url = `http://localhost:5173/mobile_app_preview.html?tab=account&device=${deviceWidth}`;
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  // Take screenshot of the phone shell container
  const shell = await page.$('#device-shell');
  if (shell) {
    const filename = `account_hub_${deviceWidth}px.png`;
    await shell.screenshot({ path: path.join(baseDir, filename) });
    console.log(`Saved ${filename}`);
  }

  // Also take close-up screenshot of the 5-tab floating bottom nav
  const nav = await page.$('#floating-bottom-nav');
  if (nav) {
    const filename = `nav_5tabs_${deviceWidth}px.png`;
    await nav.screenshot({ path: path.join(baseDir, filename) });
    console.log(`Saved ${filename}`);
  }

  await page.close();
}

// 1. Capture 390px (Baseline - Top view)
await captureScreen('390', '844', 'iPhone 14/15 Pro (390px)');

// 1b. Capture 390px Scrolled Down (Support, Logout, Delete Account)
{
  const page = await browser.newPage({ viewport: { width: 1400, height: 1100 } });
  await page.goto('http://localhost:5173/mobile_app_preview.html?tab=account&device=390', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    const scrollEl = document.querySelector('#device-shell .overflow-y-auto');
    if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight;
  });
  await page.waitForTimeout(300);
  const shell = await page.$('#device-shell');
  if (shell) {
    await shell.screenshot({ path: path.join(baseDir, 'account_hub_390px_scrolled_bottom.png') });
    console.log('Saved account_hub_390px_scrolled_bottom.png');
  }
  await page.close();
}

// 2. Capture 375px (Compact)
await captureScreen('375', '812', 'iPhone SE / Mini (375px)');

// 3. Capture 430px (Max/Plus)
await captureScreen('430', '880', 'iPhone Pro Max (430px)');

// 4. Capture Full Studio Simulator View (390px)
{
  const page = await browser.newPage({ viewport: { width: 1380, height: 1050 } });
  await page.goto('http://localhost:5173/mobile_app_preview.html?tab=account', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(baseDir, 'account_hub_full_studio.png') });
  console.log('Saved account_hub_full_studio.png');
  await page.close();
}

await browser.close();
console.log('All screenshots captured successfully.');

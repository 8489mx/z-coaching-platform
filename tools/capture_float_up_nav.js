import path from 'path';

const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const pwImport = await import(`file://${pwModulePath}`);
const pw = pwImport.default || pwImport;
const { chromium } = pw;

const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--disable-extensions', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 1000 } });
await page.goto('http://localhost:5173/mobile_app_preview.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);

const baseDir = 'C:/Users/Fannan/.gemini/antigravity/brain/b18eb724-0caf-4c71-a8f7-2a9df1328823';

// 1. Full device shell with Float Up Nav active on Today
const shell = await page.$('#device-shell');
if (shell) {
  await shell.screenshot({ path: path.join(baseDir, 'device_shell_float_up_nav.png') });
  console.log('Saved device_shell_float_up_nav.png');
}

// 2. Zoomed in on bottom navigation bar (Tab 0: اليوم active)
const nav = await page.$('#floating-bottom-nav');
if (nav) {
  await nav.screenshot({ path: path.join(baseDir, 'bottom_nav_float_up_today.png') });
  console.log('Saved bottom_nav_float_up_today.png');
}

// 3. Switch to Tab 1 (التمارين) and capture
await page.click('#nav-btn-1');
await page.waitForTimeout(300);
if (nav) {
  await nav.screenshot({ path: path.join(baseDir, 'bottom_nav_float_up_workout.png') });
  console.log('Saved bottom_nav_float_up_workout.png');
}

// 4. Switch to Tab 2 (التغذية) and capture
await page.click('#nav-btn-2');
await page.waitForTimeout(300);
if (nav) {
  await nav.screenshot({ path: path.join(baseDir, 'bottom_nav_float_up_nutrition.png') });
  console.log('Saved bottom_nav_float_up_nutrition.png');
}

// 5. Switch back to Tab 0 and wait
await page.click('#nav-btn-0');
await page.waitForTimeout(300);

await browser.close();
console.log('All navigation screenshots captured successfully.');

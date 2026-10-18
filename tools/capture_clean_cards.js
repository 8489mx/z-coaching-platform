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

// 1. Capture Today (Home) screen (which the user uploaded in media_1791803701924_b5a74f9a.png)
{
  const page = await browser.newPage({ viewport: { width: 1400, height: 1100 } });
  await page.goto('http://localhost:5173/mobile_app_preview.html?tab=today&device=390', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const shell = await page.$('#device-shell');
  if (shell) {
    await shell.screenshot({ path: path.join(baseDir, 'home_today_clean_cards_390px.png') });
    console.log('Saved home_today_clean_cards_390px.png');
  }
  await page.close();
}

// 2. Capture Account Hub screen
{
  const page = await browser.newPage({ viewport: { width: 1400, height: 1100 } });
  await page.goto('http://localhost:5173/mobile_app_preview.html?tab=account&device=390', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const shell = await page.$('#device-shell');
  if (shell) {
    await shell.screenshot({ path: path.join(baseDir, 'account_hub_clean_cards_390px.png') });
    console.log('Saved account_hub_clean_cards_390px.png');
  }
  await page.close();
}

await browser.close();
console.log('Done.');

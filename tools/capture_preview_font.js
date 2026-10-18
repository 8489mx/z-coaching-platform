import path from 'path';

const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const pwImport = await import(`file://${pwModulePath}`);
const pw = pwImport.default || pwImport;
const { chromium } = pw;

const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--disable-extensions', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1200, height: 1000 } });
await page.goto('http://localhost:5173/mobile_app_preview.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
const shell = await page.$('#device-shell');
if (shell) {
  const outPath = 'C:/Users/Fannan/.gemini/antigravity/brain/b18eb724-0caf-4c71-a8f7-2a9df1328823/device_shell_new_font.png';
  await shell.screenshot({ path: outPath });
  console.log('Saved device_shell_new_font.png');
}
await browser.close();

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

const page = await browser.newPage({ viewport: { width: 950, height: 750 } });
const filePath = path.resolve('tools/test_chips_comparison.html');
await page.goto(`file://${filePath}`, { waitUntil: 'networkidle' });
await page.screenshot({ path: path.join(auditDir, 'chips_comparison.png') });
await page.close();
await browser.close();
console.log('Saved chips_comparison.png');

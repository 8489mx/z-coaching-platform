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

const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
await page.goto('http://localhost:5173/preview.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);

// 1. Capture View 1 on Tab 0 (Today)
await page.screenshot({ path: path.join(baseDir, 'preview_html_tuned_desktop.png') });
console.log('Saved preview_html_tuned_desktop.png');

// 2. Click Tab 4 (حسابي) in the lab
await page.click('#studio-tab-btn-4');
await page.waitForTimeout(500);
await page.screenshot({ path: path.join(baseDir, 'preview_html_tuned_account_tab.png') });
console.log('Saved preview_html_tuned_account_tab.png');

// 3. Click View 2 (لوحة المقارنة الثلاثية)
await page.click('button:has-text("لوحة المقارنة الثلاثية")');
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(baseDir, 'preview_html_tuned_benchmark_view.png') });
console.log('Saved preview_html_tuned_benchmark_view.png');

// 4. Click View 3 (المواصفات وكود Flutter)
await page.click('button:has-text("المواصفات وكود Flutter")');
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(baseDir, 'preview_html_tuned_flutter_view.png') });
console.log('Saved preview_html_tuned_flutter_view.png');

await browser.close();
console.log('All preview.html captures completed.');

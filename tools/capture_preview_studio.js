import path from 'path';

const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const pwImport = await import(`file://${pwModulePath}`);
const pw = pwImport.default || pwImport;

const browser = await pw.chromium.launch({ channel: 'chrome', headless: true, args: ['--disable-extensions', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });

await page.goto('http://localhost:5173/preview.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);

const baseDir = 'C:/Users/Fannan/.gemini/antigravity/brain/b18eb724-0caf-4c71-a8f7-2a9df1328823';
await page.screenshot({ path: path.join(baseDir, 'unified_preview_studio_desktop.png') });
console.log('Saved unified_preview_studio_desktop.png');

// Also test clicking the 3-Way Benchmark tab
await page.click('button:has-text("لوحة المقارنة الثلاثية")');
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(baseDir, 'unified_preview_benchmark_view.png') });
console.log('Saved unified_preview_benchmark_view.png');

await browser.close();

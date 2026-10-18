import fs from 'fs';

const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const pwImport = await import(`file://${pwModulePath}`);
const pw = pwImport.default || pwImport;

const browser = await pw.chromium.launch({ headless: true, channel: 'chrome' });
const page = await browser.newPage();
const imgPath = 'C:/Users/Fannan/.gemini/antigravity/brain/4e0e0f3a-2130-4f00-8c43-e6b3dc5f46c2/.user_uploaded/media_1791819619180_5e8d2224.png';
const base64 = fs.readFileSync(imgPath).toString('base64');
await page.setContent(`<img id="swatch" src="data:image/png;base64,${base64}" />`);
await page.waitForTimeout(100);

const color = await page.evaluate(() => {
  const img = document.getElementById('swatch');
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const pixel = ctx.getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1).data;
  const hex = '#' + ((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1).toUpperCase();
  return { r: pixel[0], g: pixel[1], b: pixel[2], hex };
});

console.log('Sampled Color Result:', JSON.stringify(color));
await browser.close();

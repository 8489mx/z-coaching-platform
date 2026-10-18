import fs from 'fs';

const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const { default: pw } = await import(`file://${pwModulePath}`);

const browser = await pw.chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();

const imgPath = 'C:/Users/Fannan/.gemini/antigravity/brain/4e0e0f3a-2130-4f00-8c43-e6b3dc5f46c2/.user_uploaded/media_1791822920999_d3599dd8.png';
const base64 = fs.readFileSync(imgPath).toString('base64');

await page.setContent(`<img id="img" src="data:image/png;base64,${base64}"><canvas id="c"></canvas>`);
await page.waitForTimeout(300);

const metrics = await page.evaluate(() => {
  const img = document.getElementById('img');
  const c = document.getElementById('c');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);

  return {
    width: img.naturalWidth,
    height: img.naturalHeight,
  };
});

console.log('Image dimensions:', metrics);
await browser.close();

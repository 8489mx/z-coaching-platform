import fs from 'fs';

const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const { default: pw } = await import(`file://${pwModulePath}`);

const browser = await pw.chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();

const imgPath = 'C:/Users/Fannan/.gemini/antigravity/brain/4e0e0f3a-2130-4f00-8c43-e6b3dc5f46c2/.user_uploaded/media_1791821131743_4736cc36.png';
const imgBase64 = fs.readFileSync(imgPath).toString('base64');

await page.setContent(`
  <img id="ref" src="data:image/png;base64,${imgBase64}">
  <canvas id="c"></canvas>
`);
await page.waitForTimeout(500);

const colors = await page.evaluate(() => {
  const img = document.getElementById('ref');
  const c = document.getElementById('c');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const w = c.width;
  const h = c.height;

  function sample(x, y) {
    const d = ctx.getImageData(x, y, 1, 1).data;
    return '#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join('');
  }

  return {
    dimensions: { w, h },
    bg: sample(5, Math.floor(h / 2)),
    thuTopCapsule: sample(Math.floor(w * 0.13), Math.floor(h * 0.2)),
    thuText: sample(Math.floor(w * 0.13), Math.floor(h * 0.3)),
    thuCircleBg: sample(Math.floor(w * 0.13), Math.floor(h * 0.65)),
    thuNumber: sample(Math.floor(w * 0.13), Math.floor(h * 0.72)),
    friTopCapsule: sample(Math.floor(w * 0.38), Math.floor(h * 0.2)),
    friText: sample(Math.floor(w * 0.38), Math.floor(h * 0.3)),
    friCircleBg: sample(Math.floor(w * 0.38), Math.floor(h * 0.65)),
    friNumber: sample(Math.floor(w * 0.38), Math.floor(h * 0.72)),
  };
});

console.log('Sampled Reference Colors:\n', JSON.stringify(colors, null, 2));
await browser.close();

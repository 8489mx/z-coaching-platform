import path from 'path';

const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const pwImport = await import(`file://${pwModulePath}`);
const pw = pwImport.default || pwImport;

const browser = await pw.chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--disable-extensions', '--no-sandbox']
});

const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
await page.goto(`file://${path.resolve('tools/workout_card_redesign_proposals.html')}`, { waitUntil: 'networkidle' });

const h2List = await page.$$('h2');
console.log('Found h2 count:', h2List.length);
for (let i = 0; i < h2List.length; i++) {
  const el = h2List[i];
  const box = await el.boundingBox();
  const text = await el.innerText();
  const style = await page.evaluate(node => ({
    textAlign: window.getComputedStyle(node).textAlign,
    direction: window.getComputedStyle(node).direction,
    width: window.getComputedStyle(node).width,
    display: window.getComputedStyle(node).display,
    parentTextAlign: window.getComputedStyle(node.parentElement).textAlign
  }), el);
  console.log(`H2 #${i} (${text}):`, box, style);
}

await page.close();
await browser.close();

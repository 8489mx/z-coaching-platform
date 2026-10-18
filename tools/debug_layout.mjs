import path from 'path';

const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const pwImport = await import(`file://${pwModulePath}`);
const pw = pwImport.default || pwImport;

const browser = await pw.chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 1100 } });
await page.goto(`file://${path.resolve('tools/workout_card_redesign_proposals.html')}`, { waitUntil: 'networkidle' });

const details = await page.evaluate(() => {
  const frameB = document.getElementById('proposal-frame-b');
  const cardB = frameB.querySelector('.bg-\\[\\#F4F9FD\\]');
  const btn = frameB.querySelector('button');
  const sessionSpan = frameB.querySelector('.rounded-full.font-inter');
  
  return {
    frameB: frameB.getBoundingClientRect(),
    cardB: cardB ? cardB.getBoundingClientRect() : null,
    btn: btn ? btn.getBoundingClientRect() : null,
    cardBStyles: cardB ? {
      width: getComputedStyle(cardB).width,
      padding: getComputedStyle(cardB).padding,
      boxSizing: getComputedStyle(cardB).boxSizing,
      direction: getComputedStyle(cardB).direction,
    } : null,
    btnStyles: btn ? {
      width: getComputedStyle(btn).width,
      margin: getComputedStyle(btn).margin,
      position: getComputedStyle(btn).position,
    } : null,
    dateSelector: frameB.querySelector('.grid-cols-7')?.getBoundingClientRect()
  };
});

console.log(JSON.stringify(details, null, 2));

await browser.close();

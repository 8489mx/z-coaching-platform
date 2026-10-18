import fs from 'fs';

const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const pwImport = await import(`file://${pwModulePath}`);
const pw = pwImport.default || pwImport;

async function test() {
  const browser = await pw.chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();
  
  const path = 'file:///' + process.cwd().replace(/\\/g, '/') + '/frontend/public/preview.html';
  await page.goto(path, { waitUntil: 'load' });
  
  await page.evaluate(() => {
    if (typeof switchTab === 'function') switchTab(3);
    if (typeof toggleCheckinView === 'function') toggleCheckinView('history');
  });
  await page.waitForTimeout(500);
  
  const data = await page.evaluate(() => {
    const list = [];
    document.querySelectorAll('.apple-badge-tint-green').forEach((el) => {
      const rect = el.getBoundingClientRect();
      const text = el.innerText.trim();
      const range = document.createRange();
      if (el.firstChild) {
        range.selectNode(el.firstChild);
        const rRect = range.getBoundingClientRect();
        list.push({ text, elH: rect.height, topSpace: (rRect.top - rect.top).toFixed(2), bottomSpace: (rect.bottom - rRect.bottom).toFixed(2), rH: rRect.height });
      }
    });
    const btns = [];
    document.querySelectorAll('button').forEach(b => {
      if (b.innerText.includes('عرض')) {
        const rect = b.getBoundingClientRect();
        const span = b.querySelector('span');
        const svg = b.querySelector('svg');
        const sRect = span ? span.getBoundingClientRect() : null;
        const svgRect = svg ? svg.getBoundingClientRect() : null;
        btns.push({
          btnH: rect.height,
          spanTop: sRect ? (sRect.top - rect.top).toFixed(2) : 0,
          spanBottom: sRect ? (rect.bottom - sRect.bottom).toFixed(2) : 0,
          svgTop: svgRect ? (svgRect.top - rect.top).toFixed(2) : 0,
          svgBottom: svgRect ? (rect.bottom - svgRect.bottom).toFixed(2) : 0
        });
      }
    });
    return { list, btns };
  });
  
  console.log('MEASURED DATA:\n', JSON.stringify(data, null, 2));
  await browser.close();
}

test();

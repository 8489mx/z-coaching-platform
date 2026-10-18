import fs from 'fs';

const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const pwImport = await import(`file://${pwModulePath}`);
const pw = pwImport.default || pwImport;
const { chromium } = pw;

async function checkLayout() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--disable-extensions', '--no-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  await page.goto('http://localhost:5173/mobile_app_preview.html', { waitUntil: 'networkidle' });

  const viewports = ['375', '390', '430'];
  const overallSummary = [];

  for (const vp of viewports) {
    await page.evaluate((size) => window.setDeviceSize(size), vp);
    await page.waitForTimeout(200);

    const screenSummary = [];

    for (let tabIndex = 0; tabIndex < 5; tabIndex++) {
      await page.evaluate((idx) => window.switchTab(idx), tabIndex);
      await page.waitForTimeout(150);

      const checkData = await page.evaluate((tabIdx) => {
        const shell = document.getElementById('device-shell');
        const screenIds = ['screen-today', 'screen-workout', 'screen-nutrition', 'screen-checkin', 'screen-account'];
        const activeScreen = document.getElementById(screenIds[tabIdx]);
        
        const shellRect = shell.getBoundingClientRect();
        const screenRect = activeScreen.getBoundingClientRect();

        const cards = activeScreen.querySelectorAll('.soft-card-shadow, .card-shadow, .card-elevated, section, article');
        const cardAnomalies = [];

        cards.forEach((card, i) => {
          const rect = card.getBoundingClientRect();
          if (rect.width === 0 && rect.height === 0) return;
          if (rect.right > shellRect.right + 2 || rect.left < shellRect.left - 2) {
            cardAnomalies.push({
              index: i,
              tag: card.tagName,
              rect: { left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width) },
              shell: { left: Math.round(shellRect.left), right: Math.round(shellRect.right), width: Math.round(shellRect.width) }
            });
          }
        });

        const contentContainer = shell.querySelector('.overflow-y-auto');
        const hasHorizontalScroll = contentContainer ? contentContainer.scrollWidth > contentContainer.clientWidth : false;

        return {
          screen: screenIds[tabIdx],
          shellWidth: Math.round(shellRect.width),
          hasHorizontalScroll,
          cardsChecked: cards.length,
          anomaliesCount: cardAnomalies.length,
          anomalies: cardAnomalies
        };
      }, tabIndex);

      screenSummary.push(checkData);
    }

    overallSummary.push({ device: `${vp}px`, screens: screenSummary });
  }

  await browser.close();

  console.log(JSON.stringify(overallSummary, null, 2));
}

checkLayout().catch(err => {
  console.error(err);
  process.exit(1);
});

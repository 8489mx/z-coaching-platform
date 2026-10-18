import fs from 'fs';

const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const pwImport = await import(`file://${pwModulePath}`);
const pw = pwImport.default || pwImport;
const { chromium } = pw;

async function verifyTactileComparison() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--disable-extensions', '--no-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });
  await page.goto('http://localhost:5173/tactile_visual_finish_comparison.html', { waitUntil: 'networkidle' });

  const viewports = [
    { name: '375px (Compact)', width: 375, height: 812 },
    { name: '390px (Standard)', width: 390, height: 844 },
    { name: '430px (Max)', width: 430, height: 932 }
  ];

  const results = [];

  for (const vp of viewports) {
    // Set viewport on page
    await page.evaluate(({ w, h }) => {
      document.querySelectorAll('.phone-viewport').forEach(shell => {
        shell.style.width = w + 'px';
        shell.style.height = h + 'px';
      });
    }, { w: vp.width, h: vp.height });

    await page.waitForTimeout(200);

    const audit = await page.evaluate((vpWidth) => {
      const beforeShell = document.querySelectorAll('.showcase-phone-shell')[0];
      const afterShell = document.querySelectorAll('.showcase-phone-shell')[1];

      const beforeScroll = beforeShell.querySelector('.overflow-y-auto');
      const afterScroll = afterShell.querySelector('.overflow-y-auto');

      const beforeHasHScroll = beforeScroll.scrollWidth > beforeScroll.clientWidth;
      const afterHasHScroll = afterScroll.scrollWidth > afterScroll.clientWidth;

      // Card comparisons
      const beforeCards = Array.from(beforeShell.querySelectorAll('section'));
      const afterCards = Array.from(afterShell.querySelectorAll('section'));

      const cardComparisons = beforeCards.map((bCard, i) => {
        const aCard = afterCards[i];
        if (!aCard) return { index: i, matched: false };

        const bRect = bCard.getBoundingClientRect();
        const aRect = aCard.getBoundingClientRect();

        const widthDiff = Math.abs(bRect.width - aRect.width);
        const heightDiff = Math.abs(bRect.height - aRect.height);

        return {
          index: i,
          title: (bCard.querySelector('span, h1, h2')?.textContent || '').trim().substring(0, 20),
          beforeWidth: Math.round(bRect.width),
          afterWidth: Math.round(aRect.width),
          widthDiff: Math.round(widthDiff * 100) / 100,
          beforeHeight: Math.round(bRect.height),
          afterHeight: Math.round(aRect.height),
          heightDiff: Math.round(heightDiff * 100) / 100,
          dimensionMatch: widthDiff < 1 && heightDiff < 2
        };
      });

      // Text comparison
      const beforeText = (beforeShell.innerText || '').replace(/\s+/g, ' ').trim();
      const afterText = (afterShell.innerText || '').replace(/\s+/g, ' ').trim();
      const textMatches = beforeText === afterText;

      return {
        viewport: vpWidth,
        beforeHasHScroll,
        afterHasHScroll,
        textMatches,
        cardsCount: beforeCards.length,
        cardComparisons
      };
    }, vp.width);

    results.push({
      viewport: vp.name,
      ...audit
    });
  }

  await browser.close();

  console.log(JSON.stringify(results, null, 2));
  fs.writeFileSync('frontend/public/tactile_verification_report.json', JSON.stringify(results, null, 2), 'utf8');
}

verifyTactileComparison().catch(err => {
  console.error('Error running verification:', err);
  process.exit(1);
});

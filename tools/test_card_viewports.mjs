import path from 'path';

const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const { chromium } = (await import(`file://${pwModulePath}`)).default;

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true
  });
  const page = await browser.newPage();
  const fileUrl = 'file:///' + path.resolve('frontend/public/preview.html').replace(/\\/g, '/');

  for (const width of [375, 390, 430]) {
    await page.setViewportSize({ width, height: 932 });
    await page.goto(fileUrl, { waitUntil: 'domcontentloaded' });

    // Ensure we switch to workout tab (index 1)
    await page.evaluate(() => {
      if (typeof switchTab === 'function') switchTab(1);
    });
    await page.waitForTimeout(300);

    const results = await page.evaluate((w) => {
      const cards = document.querySelectorAll('#screen-workout article.apple-fitness-card');
      const data = [];
      cards.forEach((c, idx) => {
        const h3 = c.querySelector('h3');
        const text = h3 ? h3.innerText.trim() : '';
        const rect = h3 ? h3.getBoundingClientRect() : {};
        const cardRect = c.getBoundingClientRect();
        const lineHeight = h3 ? parseFloat(window.getComputedStyle(h3).lineHeight) : 22;
        const numLines = Math.max(1, Math.round(rect.height / lineHeight));
        data.push({
          cardIdx: idx + 1,
          title: text,
          titleWidth: Math.round(rect.width),
          titleHeight: Math.round(rect.height),
          cardWidth: Math.round(cardRect.width),
          cardHeight: Math.round(cardRect.height),
          numLines
        });
      });
      return { width: w, cards: data };
    }, width);

    console.log(`\n================ VIEWPORT: ${width}px ================`);
    results.cards.forEach(c => {
      console.log(`Card ${c.cardIdx}: "${c.title}"`);
      console.log(`  -> Lines: ${c.numLines} | Title H: ${c.titleHeight}px | Card H: ${c.cardHeight}px | Avail Title W: ${c.titleWidth}px`);
    });
  }

  await browser.close();
})();

const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const fileUrl = 'file:///' + path.resolve('tools/workout_card_header_comparison.html').replace(/\\/g, '/');

  for (const width of [375, 390, 430]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(fileUrl, { waitUntil: 'networkidle' });

    const results = await page.evaluate((w) => {
      const cards = document.querySelectorAll('.apple-fitness-card');
      const data = [];
      cards.forEach((c, idx) => {
        const h3 = c.querySelector('h3');
        const text = h3 ? h3.innerText.trim() : '';
        const rect = h3 ? h3.getBoundingClientRect() : {};
        const lineHeight = h3 ? parseFloat(window.getComputedStyle(h3).lineHeight) : 22;
        const numLines = Math.max(1, Math.round(rect.height / lineHeight));
        data.push({
          cardIdx: idx,
          title: text,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          numLines
        });
      });
      return { width: w, cards: data };
    }, width);

    console.log(`=== VIEWPORT WIDTH: ${width}px ===`);
    results.cards.forEach(c => {
      console.log(`Card ${c.cardIdx}: "${c.title}" -> lines: ${c.numLines}, h: ${c.height}px, w: ${c.width}px`);
    });
  }

  await browser.close();
})();

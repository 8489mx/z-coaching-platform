import { createRequire } from 'module';
const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const pwImport = await import(`file://${pwModulePath}`);
const pw = pwImport.default || pwImport;

async function testClearance() {
  const browser = await pw.chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  await page.goto('http://localhost:5173/mobile_app_preview.html', { waitUntil: 'networkidle' });

  for (const size of ['375', '390', '430']) {
    await page.evaluate((s) => {
      setDeviceSize(s);
      switchTab(1);
    }, size);
    await page.waitForTimeout(400);

    const clearance = await page.evaluate(() => {
      const scrollEl = document.querySelector('#device-shell .overflow-y-auto');
      if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight;
      const btn = document.getElementById('btn-finish-workout');
      const nav = document.getElementById('floating-bottom-nav');
      const shell = document.getElementById('device-shell');
      const btnRect = btn.getBoundingClientRect();
      const navRect = nav.getBoundingClientRect();
      const shellRect = shell.getBoundingClientRect();
      return {
        btnBottom: btnRect.bottom - shellRect.top,
        btnTop: btnRect.top - shellRect.top,
        navTop: navRect.top - shellRect.top,
        shellHeight: shellRect.height,
        gap: navRect.top - btnRect.bottom,
        isFullyAbove: navRect.top >= btnRect.bottom
      };
    });

    console.log(`Size ${size}px: shellH=${clearance.shellHeight}, btnTop=${clearance.btnTop.toFixed(1)}, btnBottom=${clearance.btnBottom.toFixed(1)}, navTop=${clearance.navTop.toFixed(1)}, clearance = ${clearance.gap.toFixed(1)}px, isFullyAbove = ${clearance.isFullyAbove}`);
  }

  await browser.close();
}

testClearance();

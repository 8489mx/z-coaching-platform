const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const pwImport = await import(`file://${pwModulePath}`);
const pw = pwImport.default || pwImport;

const browser = await pw.chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--disable-extensions', '--no-sandbox']
});

const page = await browser.newPage({ viewport: { width: 440, height: 950 } });
await page.goto('http://localhost:5173/mobile_app_preview.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(500);

const getVisibleScreen = async () => {
  return await page.evaluate(() => {
    const screenMap = ['screen-today', 'screen-workout', 'screen-nutrition', 'screen-checkin', 'screen-account'];
    return screenMap.find(id => {
      const el = document.getElementById(id);
      return el && !el.classList.contains('hidden');
    });
  });
};

// 1. Test Workout CTA click
await page.evaluate(() => window.selectDate(0));
await page.waitForTimeout(200);
await page.click('#home-hero-cta');
await page.waitForTimeout(300);
let visible = await getVisibleScreen();
console.log('Workout CTA Click -> Visible Screen:', visible, visible === 'screen-workout' ? 'PASS' : 'FAIL');

// Go back to home tab (tab 0)
await page.evaluate(() => window.switchTab(0));
await page.waitForTimeout(300);

// 2. Test Recovery CTA click
await page.evaluate(() => window.selectDate(2));
await page.waitForTimeout(200);
await page.click('#home-hero-cta');
await page.waitForTimeout(300);
visible = await getVisibleScreen();
console.log('Recovery CTA Click -> Visible Screen:', visible, visible === 'screen-workout' ? 'PASS' : 'FAIL');

// Go back to home tab (tab 0)
await page.evaluate(() => window.switchTab(0));
await page.waitForTimeout(300);

// 3. Test Check-in CTA click (Friday)
await page.evaluate(() => window.selectDate(6));
await page.waitForTimeout(200);
await page.click('#home-hero-cta');
await page.waitForTimeout(300);
visible = await getVisibleScreen();
console.log('Check-in CTA Click -> Visible Screen:', visible, visible === 'screen-checkin' ? 'PASS' : 'FAIL');

await page.close();
await browser.close();
console.log('All interactive CTA tests completed successfully.');

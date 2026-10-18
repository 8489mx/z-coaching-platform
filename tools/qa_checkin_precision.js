import path from 'path';

const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const pwImport = await import(`file://${pwModulePath}`);
const pw = pwImport.default || pwImport;

const artifactDir = 'C:/Users/Fannan/.gemini/antigravity/brain/81dd76d6-ffef-4b71-b47f-0fc28953b459';

async function main() {
  const browser = await pw.chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--disable-extensions', '--no-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 1400, height: 1100 }, deviceScaleFactor: 2 });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err.toString()));

  const url = 'http://localhost:5173/checkin_apple_polish_comparison.html';
  console.log('Navigating to:', url);
  await page.goto(url, { waitUntil: 'networkidle' });

  // 1. Capture Due State (Default)
  await page.screenshot({
    path: path.join(artifactDir, 'checkin_phase03_due_comparison.png'),
    fullPage: false
  });
  console.log('Captured Due State');

  // 2. Switch to Upcoming State
  await page.click('#state-upcoming');
  await page.waitForTimeout(300);
  await page.screenshot({
    path: path.join(artifactDir, 'checkin_phase03_upcoming_comparison.png'),
    fullPage: false
  });
  console.log('Captured Upcoming State');

  // 3. Switch to Submitted State
  await page.click('#state-submitted');
  await page.waitForTimeout(300);
  await page.screenshot({
    path: path.join(artifactDir, 'checkin_phase03_submitted_state.png'),
    fullPage: false
  });
  console.log('Captured Submitted State');

  // 4. Switch to Expired State
  await page.click('#state-expired');
  await page.waitForTimeout(300);
  await page.screenshot({
    path: path.join(artifactDir, 'checkin_phase03_expired_state.png'),
    fullPage: false
  });
  console.log('Captured Expired State');

  // 5. Switch to Due State and open History tab in After screen
  await page.click('#state-due');
  await page.click('#after-tab-history');
  await page.waitForTimeout(300);
  await page.screenshot({
    path: path.join(artifactDir, 'checkin_phase03_history_and_trend.png'),
    fullPage: false
  });
  console.log('Captured History & Trend');

  // 6. Test 375px Viewport
  await page.click('#after-tab-form');
  await page.click('#btn-375');
  await page.waitForTimeout(350);
  await page.screenshot({
    path: path.join(artifactDir, 'checkin_phase03_375px_viewport.png'),
    fullPage: false
  });
  console.log('Captured 375px Viewport');

  await browser.close();
  console.log('All QA screenshots captured successfully.');
}

main().catch(err => {
  console.error('Error running QA:', err);
  process.exit(1);
});

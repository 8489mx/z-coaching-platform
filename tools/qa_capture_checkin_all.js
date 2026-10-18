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

  // Browser page with high DPI for crisp screenshots
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 }, deviceScaleFactor: 2 });

  const url = 'http://localhost:5173/checkin_apple_polish_comparison.html';
  console.log('Navigating to:', url);
  await page.goto(url, { waitUntil: 'networkidle' });

  const frameAfter = page.locator('#frame-after');
  const frameBefore = page.locator('#frame-before');

  // Set 390px standard viewport first
  await page.click('#btn-390');
  await page.waitForTimeout(300);

  // 1. Upcoming State (After Phone Frame)
  await page.click('#state-upcoming');
  await page.waitForTimeout(300);
  await frameAfter.screenshot({ path: path.join(artifactDir, 'checkin_state_upcoming.png') });
  console.log('1. Captured Upcoming State');

  // 2. Due State (After Phone Frame)
  await page.click('#state-due');
  await page.waitForTimeout(300);
  await frameAfter.screenshot({ path: path.join(artifactDir, 'checkin_state_due.png') });
  console.log('2. Captured Due State');

  // 3. Submitted State (After Phone Frame)
  await page.click('#state-submitted');
  await page.waitForTimeout(300);
  await frameAfter.screenshot({ path: path.join(artifactDir, 'checkin_state_submitted.png') });
  console.log('3. Captured Submitted State');

  // 4. Expired State (After Phone Frame)
  await page.click('#state-expired');
  await page.waitForTimeout(300);
  await frameAfter.screenshot({ path: path.join(artifactDir, 'checkin_state_expired.png') });
  console.log('4. Captured Expired State');

  // 5. Full Check-in Form (Due state, entire form scrolled)
  await page.click('#state-due');
  await page.waitForTimeout(200);
  // Full form scroll capture
  await frameAfter.screenshot({ path: path.join(artifactDir, 'checkin_full_form_flow.png') });
  console.log('5. Captured Full Form Flow');

  // 6. Progress History & Trend (History tab)
  await page.click('#after-tab-history');
  await page.waitForTimeout(350);
  await frameAfter.screenshot({ path: path.join(artifactDir, 'checkin_progress_history_full.png') });
  console.log('6. Captured Progress History & Trend');

  // 7. Before vs After comparison on 390px (Full comparison board)
  await page.click('#after-tab-form');
  await page.click('#state-due');
  await page.waitForTimeout(300);
  const comparisonMain = page.locator('main');
  await comparisonMain.screenshot({ path: path.join(artifactDir, 'checkin_before_after_390px.png') });
  console.log('7. Captured Before/After 390px');

  // 8. Viewport 375px
  await page.click('#btn-375');
  await page.waitForTimeout(300);
  await frameAfter.screenshot({ path: path.join(artifactDir, 'checkin_viewport_375px.png') });
  console.log('8. Captured 375px Viewport');

  // 9. Viewport 430px
  await page.click('#btn-430');
  await page.waitForTimeout(300);
  await frameAfter.screenshot({ path: path.join(artifactDir, 'checkin_viewport_430px.png') });
  console.log('9. Captured 430px Viewport');

  await browser.close();
  console.log('All 9 visual QA screenshots completed successfully.');
}

main().catch(err => {
  console.error('Error running QA capture:', err);
  process.exit(1);
});

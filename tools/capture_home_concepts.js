import fs from 'fs';
import path from 'path';

const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const pwImport = await import(`file://${pwModulePath}`);
const pw = pwImport.default || pwImport;
const { chromium } = pw;

const OUTPUT_DIR = 'C:/Users/Fannan/.gemini/antigravity/brain/b18eb724-0caf-4c71-a8f7-2a9df1328823/home_concepts_review';
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function capture() {
  console.log('Launching browser to capture Home Concepts...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--disable-extensions', '--no-sandbox']
  });

  const url = 'http://localhost:5173/home_concepts_comparison.html';

  // 1. Overview Comparison (All 3 concepts side-by-side)
  {
    const page = await browser.newPage({ viewport: { width: 1350, height: 1050 } });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    const mainEl = await page.$('.comparison-container');
    if (mainEl) {
      await mainEl.screenshot({ path: path.join(OUTPUT_DIR, '00_concepts_overview_all_390px.png') });
      console.log('Captured: 00_concepts_overview_all_390px.png');
    }
    await page.close();
  }

  // 2. Individual 390px frames (Concept A, B, C)
  {
    const page = await browser.newPage({ viewport: { width: 1350, height: 1050 } });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // Frame A
    const frameA = await page.$('#frame-a');
    if (frameA) {
      await frameA.screenshot({ path: path.join(OUTPUT_DIR, '01_concept_a_hero_390px.png') });
      console.log('Captured: 01_concept_a_hero_390px.png');
    }

    // Frame B
    const frameB = await page.$('#frame-b');
    if (frameB) {
      await frameB.screenshot({ path: path.join(OUTPUT_DIR, '02_concept_b_pillars_390px.png') });
      console.log('Captured: 02_concept_b_pillars_390px.png');
    }

    // Frame C
    const frameC = await page.$('#frame-c');
    if (frameC) {
      await frameC.screenshot({ path: path.join(OUTPUT_DIR, '03_concept_c_stream_390px.png') });
      console.log('Captured: 03_concept_c_stream_390px.png');
    }

    // Switch to Rest Day State
    await page.click('#btn-state-rest');
    await page.waitForTimeout(300);
    const frameARest = await page.$('#frame-a');
    if (frameARest) {
      await frameARest.screenshot({ path: path.join(OUTPUT_DIR, '04_concept_a_rest_day_390px.png') });
      console.log('Captured: 04_concept_a_rest_day_390px.png');
    }

    // Switch to Empty State (No Active Program)
    await page.click('#btn-state-empty');
    await page.waitForTimeout(300);
    const frameAEmpty = await page.$('#frame-a');
    if (frameAEmpty) {
      await frameAEmpty.screenshot({ path: path.join(OUTPUT_DIR, '05_concept_a_no_program_390px.png') });
      console.log('Captured: 05_concept_a_no_program_390px.png');
    }

    // Switch back to Workout State and test 375px width
    await page.click('#btn-state-workout');
    await page.click('#btn-w-375');
    await page.waitForTimeout(400);
    const frameA375 = await page.$('#frame-a');
    if (frameA375) {
      await frameA375.screenshot({ path: path.join(OUTPUT_DIR, '06_concept_a_375px_compact.png') });
      console.log('Captured: 06_concept_a_375px_compact.png');
    }

    // Test 430px width
    await page.click('#btn-w-430');
    await page.waitForTimeout(400);
    const frameA430 = await page.$('#frame-a');
    if (frameA430) {
      await frameA430.screenshot({ path: path.join(OUTPUT_DIR, '07_concept_a_430px_large.png') });
      console.log('Captured: 07_concept_a_430px_large.png');
    }

    await page.close();
  }

  await browser.close();
  console.log('All visual screenshots successfully generated in:', OUTPUT_DIR);
}

capture().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});

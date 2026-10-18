import fs from 'fs';
import path from 'path';

const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const pwImport = await import(`file://${pwModulePath}`);
const pw = pwImport.default || pwImport;
const { chromium } = pw;

const OUTPUT_DIR = 'C:/Users/Fannan/.gemini/antigravity/brain/b18eb724-0caf-4c71-a8f7-2a9df1328823/font_review';
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function capture() {
  console.log('Launching browser to capture Font Specimens...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--disable-extensions', '--no-sandbox']
  });

  const url = 'http://localhost:5173/font_specimen.html';
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000); // ensure web fonts finish rendering

  // 1. Overall Grid Comparison
  const gridEl = await page.$('.specimen-grid');
  if (gridEl) {
    await gridEl.screenshot({ path: path.join(OUTPUT_DIR, '00_font_specimen_comparison.png') });
    console.log('Captured: 00_font_specimen_comparison.png');
  }

  // 2. Individual Columns
  const segoeEl = await page.$('#specimen-segoe');
  if (segoeEl) {
    await segoeEl.screenshot({ path: path.join(OUTPUT_DIR, '01_specimen_segoe_ui.png') });
    console.log('Captured: 01_specimen_segoe_ui.png');
  }

  const ibmEl = await page.$('#specimen-ibm');
  if (ibmEl) {
    await ibmEl.screenshot({ path: path.join(OUTPUT_DIR, '02_specimen_ibm_plex.png') });
    console.log('Captured: 02_specimen_ibm_plex.png');
  }

  const readexEl = await page.$('#specimen-readex');
  if (readexEl) {
    await readexEl.screenshot({ path: path.join(OUTPUT_DIR, '03_specimen_readex_pro.png') });
    console.log('Captured: 03_specimen_readex_pro.png');
  }

  const alexEl = await page.$('#specimen-alexandria');
  if (alexEl) {
    await alexEl.screenshot({ path: path.join(OUTPUT_DIR, '04_specimen_alexandria.png') });
    console.log('Captured: 04_specimen_alexandria.png');
  }

  await browser.close();
  console.log(`All font specimens successfully generated in: ${OUTPUT_DIR}`);
}

capture().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});

import fs from 'fs';
import path from 'path';

const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const pwImport = await import(`file://${pwModulePath}`);
const pw = pwImport.default || pwImport;

async function captureSheet() {
  const browser = await pw.chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1200 }, deviceScaleFactor: 2 });
  await page.goto('file:///d:/zcc/frontend/public/icon_audit_sheet.html', { waitUntil: 'load' });
  await page.waitForTimeout(600);

  const outPath = 'C:/Users/Fannan/.gemini/antigravity/brain/81dd76d6-ffef-4b71-b47f-0fc28953b459/icon_audit_sheet_p1.png';
  await page.screenshot({ path: outPath, fullPage: true });
  console.log('Captured:', outPath);
  await browser.close();
}

captureSheet();

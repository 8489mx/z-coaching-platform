import path from 'path';
import fs from 'fs';

const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const pwImport = await import(`file://${pwModulePath}`);
const pw = pwImport.default || pwImport;

const auditDir = 'C:/Users/Fannan/.gemini/antigravity/brain/4e0e0f3a-2130-4f00-8c43-e6b3dc5f46c2/visual_audit';
if (!fs.existsSync(auditDir)) {
  fs.mkdirSync(auditDir, { recursive: true });
}

const browser = await pw.chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--disable-extensions', '--no-sandbox']
});

const page = await browser.newPage({ viewport: { width: 1200, height: 980 } });
const filePath = path.resolve('tools/workout_card_redesign_proposals.html');
await page.goto(`file://${filePath}`, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);

// Capture full proposals board
await page.screenshot({ path: path.join(auditDir, 'workout_card_proposals_board.png'), fullPage: true });
console.log('Saved workout_card_proposals_board.png');

// Capture frame A (390px)
const frameA = await page.$('div.w-\\[390px\\]:nth-of-type(1)');
// Or select by index
const frames = await page.$$('div.w-\\[390px\\]');
if (frames.length >= 2) {
  await frames[0].screenshot({ path: path.join(auditDir, 'workout_card_proposal_a_390px.png') });
  console.log('Saved workout_card_proposal_a_390px.png');
  await frames[1].screenshot({ path: path.join(auditDir, 'workout_card_proposal_b_390px.png') });
  console.log('Saved workout_card_proposal_b_390px.png');
}

await page.close();
await browser.close();
console.log('Capture finished successfully.');

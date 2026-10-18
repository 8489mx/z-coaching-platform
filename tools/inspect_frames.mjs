import path from 'path';

const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const pwImport = await import(`file://${pwModulePath}`);
const pw = pwImport.default || pwImport;

const browser = await pw.chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 1100 } });
await page.goto(`file://${path.resolve('tools/workout_card_redesign_proposals.html')}`, { waitUntil: 'networkidle' });

const frameA = await page.$('#proposal-frame-a');
const frameB = await page.$('#proposal-frame-b');
console.log('Frame A box:', await frameA?.boundingBox());
console.log('Frame B box:', await frameB?.boundingBox());

const auditDir = 'C:/Users/Fannan/.gemini/antigravity/brain/4e0e0f3a-2130-4f00-8c43-e6b3dc5f46c2/visual_audit';

const board = await page.$('.max-w-5xl');
if (board) await board.screenshot({ path: path.join(auditDir, 'workout_card_proposals_board.png') });
if (frameA) await frameA.screenshot({ path: path.join(auditDir, 'workout_card_proposal_a_390px.png') });
if (frameB) await frameB.screenshot({ path: path.join(auditDir, 'workout_card_proposal_b_390px.png') });

await page.close();
await browser.close();
console.log('Done');

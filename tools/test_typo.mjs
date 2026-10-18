import path from 'path';

const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const { chromium } = (await import(`file://${pwModulePath}`)).default;

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true
  });
  const page = await browser.newPage();

  const testHtml = `
  <!DOCTYPE html>
  <html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@600&display=swap" rel="stylesheet">
  </head>
  <body class="p-4 bg-slate-50">
    <div style="width: 311px;" class="bg-white p-4 rounded-2xl shadow space-y-4">
      <div id="opt1">
        <h3 dir="ltr" class="text-[16.5px] font-semibold text-[#1C1C1E] font-inter text-right tracking-tight leading-snug">
          Single Arm Dumbbell Overhead Triceps Extension
        </h3>
      </div>
      <div id="opt2">
        <h3 class="text-[16.5px] font-semibold text-[#1C1C1E] font-inter text-right tracking-tight leading-snug">
          <span dir="ltr">Single Arm Dumbbell Overhead Triceps Extension</span>
        </h3>
      </div>
      <div id="opt3">
        <h3 dir="ltr" class="text-[16.5px] font-semibold text-[#1C1C1E] font-inter text-left tracking-tight leading-snug">
          Single Arm Dumbbell Overhead Triceps Extension
        </h3>
      </div>
      <div id="opt-single-r">
        <h3 dir="ltr" class="text-[16.5px] font-semibold text-[#1C1C1E] font-inter text-right tracking-tight leading-snug">
          Incline Dumbbell Bench Press
        </h3>
      </div>
      <div id="opt-single-l">
        <h3 dir="ltr" class="text-[16.5px] font-semibold text-[#1C1C1E] font-inter text-left tracking-tight leading-snug">
          Incline Dumbbell Bench Press
        </h3>
      </div>
    </div>
  </body>
  </html>
  `;

  await page.setContent(testHtml, { waitUntil: 'networkidle' });

  for (const id of ['opt1', 'opt2', 'opt3', 'opt-single-r', 'opt-single-l']) {
    const el = await page.$(`#${id} h3`);
    const box = await el.boundingBox();
    console.log(`${id}: ${Math.round(box.width)}x${Math.round(box.height)}`);
  }

  await browser.close();
})();

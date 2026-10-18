import path from 'path';

const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const pwImport = await import(`file://${pwModulePath}`);
const pw = pwImport.default || pwImport;
const { chromium } = pw;

const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--disable-extensions', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
await page.goto('http://localhost:5173/liquid_glass_nav_prototype.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);

const baseDir = 'C:/Users/Fannan/.gemini/antigravity/brain/b18eb724-0caf-4c71-a8f7-2a9df1328823';
const frameDir = path.join(baseDir, 'liquid_glass_frames');

import fs from 'fs';
if (!fs.existsSync(frameDir)) {
  fs.mkdirSync(frameDir, { recursive: true });
}

// Function to capture bottom nav crop
async function captureNav(filename) {
  const nav = await page.$('#liquid-glass-nav');
  if (nav) {
    const out = path.join(frameDir, filename);
    await nav.screenshot({ path: out });
    console.log(`Captured ${filename}`);
  }
}

// Helper to manually set animation state between two tabs
async function setFrameState(fromIdx, toIdx, progress, settled = false) {
  await page.evaluate(({ fromIdx, toIdx, progress, settled }) => {
    const startM = getTabMetrics(fromIdx);
    const targetM = getTabMetrics(toIdx);
    const totalDist = targetM.center - startM.center;

    // Easing & Stretch
    const springT = springEasing(progress);
    const currentCenter = startM.center + totalDist * springT;
    const maxStretch = Math.min(Math.abs(totalDist) * 0.48, 55);
    const restingWidth = Math.max(targetM.width - 8, 68);
    const currentWidth = restingWidth + (settled ? 0 : maxStretch * stretchEnvelope(progress));

    lensEl.style.left = `${currentCenter - currentWidth / 2}px`;
    lensEl.style.width = `${currentWidth}px`;

    if (settled) {
      lensEl.classList.add('settled');
    } else {
      lensEl.classList.remove('settled');
    }

    // Color active target
    for (let i = 0; i < tabCount; i++) {
      const contentEl = document.getElementById(`tab-content-${i}`);
      if (!contentEl) continue;
      const span = contentEl.querySelector('span');
      const isActive = settled ? i === toIdx : (progress > 0.3 ? i === toIdx : i === fromIdx);
      if (isActive) {
        contentEl.classList.remove('text-slate-800');
        contentEl.classList.add('text-sky-600');
        if (span) {
          span.classList.remove('text-slate-500');
          span.classList.add('text-sky-600', 'font-bold');
        }
      } else {
        contentEl.classList.remove('text-sky-600');
        contentEl.classList.add('text-slate-800');
        if (span) {
          span.classList.remove('text-sky-600', 'font-bold');
          span.classList.add('text-slate-500', 'font-semibold');
        }
      }
    }

    updateOptics(currentCenter, currentWidth);
  }, { fromIdx, toIdx, progress, settled });

  await page.waitForTimeout(100);
}

console.log('Capturing 9 Frames of Liquid Glass Animation...');

// 01: START — Home (اليوم) selected
await setFrameState(0, 0, 1.0, true);
await captureNav('frame_01_start_home.png');

// 02: TAP — Liquid lens begins toward التمارين (15% progress)
await setFrameState(0, 1, 0.15, false);
await captureNav('frame_02_tap_lens_begins.png');

// 03: TRAVEL — Glass magnification (45% progress)
await setFrameState(0, 1, 0.45, false);
await captureNav('frame_03_travel_magnification.png');

// 04: ARRIVAL — Arriving at التمارين with overshoot (85% progress)
await setFrameState(0, 1, 0.85, false);
await captureNav('frame_04_arrival_workout.png');

// 05: SETTLED — Settled at التمارين
await setFrameState(1, 1, 1.0, true);
await captureNav('frame_05_settled_workout.png');

// 06: NEW TRANSITION — Tapping التغذية (18% progress)
await setFrameState(1, 2, 0.18, false);
await captureNav('frame_06_new_transition.png');

// 07: MOVING TO Nutrition — Mid-flight refraction & stretch (50% progress)
await setFrameState(1, 2, 0.50, false);
await captureNav('frame_07_moving_nutrition.png');

// 08: LIQUID ARRIVAL — Reaching التغذية (88% progress)
await setFrameState(1, 2, 0.88, false);
await captureNav('frame_08_liquid_arrival.png');

// 09: SETTLED — Settled at التغذية
await setFrameState(2, 2, 1.0, true);
await captureNav('frame_09_settled_nutrition.png');

// Also capture the full prototype screen
const shell = await page.$('#phone-shell');
if (shell) {
  await shell.screenshot({ path: path.join(baseDir, 'liquid_glass_prototype_shell.png') });
  console.log('Captured liquid_glass_prototype_shell.png');
}

// Generate an HTML composite page showing the 9 frames in a 3x3 grid matching the reference!
const compositeHtml = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>Liquid Glass Navigation — 9 Frames Verification</title>
  <style>
    body { font-family: sans-serif; background: #0F172A; color: #F8FAFC; padding: 24px; margin: 0; }
    h1 { font-size: 20px; font-weight: 800; margin-bottom: 4px; color: #FFFFFF; }
    p { font-size: 13px; color: #94A3B8; margin-top: 0; margin-bottom: 20px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; max-width: 1200px; margin: 0 auto; }
    .card { background: #1E293B; border: 1px solid #334155; border-radius: 16px; padding: 12px; }
    .card-title { font-size: 12px; font-weight: 700; color: #38BDF8; margin-bottom: 8px; display: flex; justify-content: space-between; }
    .card-title span.desc { color: #94A3B8; font-weight: 500; font-size: 11px; }
    .img-wrap { background: #F8FAFC; border-radius: 12px; padding: 16px 8px; display: flex; align-items: center; justify-content: center; }
    .img-wrap img { width: 100%; height: auto; border-radius: 8px; }
  </style>
</head>
<body>
  <div style="max-width: 1200px; margin: 0 auto;">
    <h1>LIQUID GLASS NAVIGATION — 9-FRAME IMPLEMENTATION BENCHMARK</h1>
    <p>مطابقة حركة العدسة الزجاجية السائلة، التمدد، الانكسار، والتكبير عبر الفريمات التسعة المتتالية</p>
    <div class="grid">
      <div class="card">
        <div class="card-title"><span>01 START</span><span class="desc">اليوم مستقر (Settled)</span></div>
        <div class="img-wrap"><img src="liquid_glass_frames/frame_01_start_home.png"></div>
      </div>
      <div class="card">
        <div class="card-title"><span>02 TAP</span><span class="desc">بداية تمدد الفقاعة (Lens Begins)</span></div>
        <div class="img-wrap"><img src="liquid_glass_frames/frame_02_tap_lens_begins.png"></div>
      </div>
      <div class="card">
        <div class="card-title"><span>03 TRAVEL</span><span class="desc">تكبير وانكسار الزجاج (Magnification)</span></div>
        <div class="img-wrap"><img src="liquid_glass_frames/frame_03_travel_magnification.png"></div>
      </div>
      <div class="card">
        <div class="card-title"><span>04 ARRIVAL</span><span class="desc">وصول وارتداد التمارين (Overshoot)</span></div>
        <div class="img-wrap"><img src="liquid_glass_frames/frame_04_arrival_workout.png"></div>
      </div>
      <div class="card">
        <div class="card-title"><span>05 SETTLED</span><span class="desc">استقرار عند التمارين (Settled)</span></div>
        <div class="img-wrap"><img src="liquid_glass_frames/frame_05_settled_workout.png"></div>
      </div>
      <div class="card">
        <div class="card-title"><span>06 NEW TRANSITION</span><span class="desc">انتقال جديد نحو التغذية</span></div>
        <div class="img-wrap"><img src="liquid_glass_frames/frame_06_new_transition.png"></div>
      </div>
      <div class="card">
        <div class="card-title"><span>07 MOVING TO NUTRITION</span><span class="desc">تمدد وانكسار العناصر العابرة</span></div>
        <div class="img-wrap"><img src="liquid_glass_frames/frame_07_moving_nutrition.png"></div>
      </div>
      <div class="card">
        <div class="card-title"><span>08 LIQUID ARRIVAL</span><span class="desc">وصول الفقاعة وانكماشها</span></div>
        <div class="img-wrap"><img src="liquid_glass_frames/frame_08_liquid_arrival.png"></div>
      </div>
      <div class="card">
        <div class="card-title"><span>09 SETTLED</span><span class="desc">استقرار تام عند التغذية (Settled)</span></div>
        <div class="img-wrap"><img src="liquid_glass_frames/frame_09_settled_nutrition.png"></div>
      </div>
    </div>
  </div>
</body>
</html>
`;

const compositePath = path.join(baseDir, 'liquid_glass_9_frames_composite.html');
fs.writeFileSync(compositePath, compositeHtml, 'utf8');

// Now render the composite HTML to a single image for direct user viewing!
const compositePage = await browser.newPage({ viewport: { width: 1240, height: 760 } });
await compositePage.goto(`file:///${compositePath.replace(/\\\\/g, '/')}`, { waitUntil: 'networkidle' });
await compositePage.screenshot({ path: path.join(baseDir, 'liquid_glass_9_frames_benchmark.png') });
console.log('Saved liquid_glass_9_frames_benchmark.png');

await browser.close();
console.log('All 9 frames captured and composite generated successfully!');

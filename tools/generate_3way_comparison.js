import path from 'path';
import fs from 'fs';

const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const pwImport = await import(`file://${pwModulePath}`);
const pw = pwImport.default || pwImport;
const { chromium } = pw;

const baseDir = 'C:/Users/Fannan/.gemini/antigravity/brain/b18eb724-0caf-4c71-a8f7-2a9df1328823';
const enhancedDir = path.join(baseDir, 'liquid_glass_enhanced_frames');
if (!fs.existsSync(enhancedDir)) {
  fs.mkdirSync(enhancedDir, { recursive: true });
}

const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--disable-extensions', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
await page.goto('http://localhost:5173/liquid_glass_nav_prototype.html', { waitUntil: 'networkidle' });
await page.waitForTimeout(500);

// Capture bottom nav crop
async function captureNav(filename) {
  const nav = await page.$('#liquid-glass-nav');
  if (nav) {
    const out = path.join(enhancedDir, filename);
    await nav.screenshot({ path: out });
    console.log(`Captured enhanced: ${filename}`);
  }
}

// Set frame state using the upgraded prototype logic
async function setFrameState(fromIdx, toIdx, progress, settled = false) {
  await page.evaluate(({ fromIdx, toIdx, progress, settled }) => {
    const startM = getTabMetrics(fromIdx);
    const targetM = getTabMetrics(toIdx);
    const totalDist = targetM.center - startM.center;

    // Snappy Spring Easing & Dynamic Stretch
    const springT = springEasing(progress);
    const currentCenter = startM.center + totalDist * springT;
    const maxStretch = Math.min(Math.abs(totalDist) * 0.42, 48);
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
      const isActive = settled ? i === toIdx : (progress > 0.35 ? i === toIdx : i === fromIdx);
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

    // Call updateOptics with isMovingNow = !settled for true optical meniscus shear & dome magnification
    updateOptics(currentCenter, currentWidth, !settled);
  }, { fromIdx, toIdx, progress, settled });

  await page.waitForTimeout(100);
}

console.log('Capturing Upgraded Enhanced 9 Frames...');

// 01: START — Home (اليوم) selected (Resting Pill)
await setFrameState(0, 0, 1.0, true);
await captureNav('frame_01_start_home.png');

// 02: TAP — Liquid lens begins toward التمارين (Liquid Droplet with Meniscus Edge Shear)
await setFrameState(0, 1, 0.18, false);
await captureNav('frame_02_tap_lens_begins.png');

// 03: TRAVEL — Glass dome optical magnification (45% progress)
await setFrameState(0, 1, 0.45, false);
await captureNav('frame_03_travel_magnification.png');

// 04: ARRIVAL — Arriving at التمارين (85% progress)
await setFrameState(0, 1, 0.85, false);
await captureNav('frame_04_arrival_workout.png');

// 05: SETTLED — Settled at التمارين (Resting Pill)
await setFrameState(1, 1, 1.0, true);
await captureNav('frame_05_settled_workout.png');

// 06: NEW TRANSITION — Tapping التغذية (Meniscus Shearing of Workout Tab)
await setFrameState(1, 2, 0.20, false);
await captureNav('frame_06_new_transition.png');

// 07: MOVING TO Nutrition — Mid-flight optical refraction & stretch (50% progress)
await setFrameState(1, 2, 0.50, false);
await captureNav('frame_07_moving_nutrition.png');

// 08: LIQUID ARRIVAL — Reaching التغذية (88% progress)
await setFrameState(1, 2, 0.88, false);
await captureNav('frame_08_liquid_arrival.png');

// 09: SETTLED — Settled at التغذية (Resting Pill)
await setFrameState(2, 2, 1.0, true);
await captureNav('frame_09_settled_nutrition.png');

console.log('Generating 3-Way Grand Comparison Benchmark...');

const refImagePath = path.join(baseDir, '.user_uploaded', 'media_1791747481326_8cedd2d0.png');
const refBase64 = fs.readFileSync(refImagePath).toString('base64');

// Read current frames
const currentFrames = {};
const curDir = path.join(baseDir, 'liquid_glass_current_implementation_frames');
[
  'frame_01_start_home.png',
  'frame_02_tap_lens_begins.png',
  'frame_03_travel_magnification.png',
  'frame_04_arrival_workout.png',
  'frame_05_settled_workout.png',
  'frame_06_new_transition.png',
  'frame_07_moving_nutrition.png',
  'frame_08_liquid_arrival.png',
  'frame_09_settled_nutrition.png'
].forEach(f => {
  currentFrames[f] = fs.readFileSync(path.join(curDir, f)).toString('base64');
});

// Read enhanced frames
const enhancedFrames = {};
[
  'frame_01_start_home.png',
  'frame_02_tap_lens_begins.png',
  'frame_03_travel_magnification.png',
  'frame_04_arrival_workout.png',
  'frame_05_settled_workout.png',
  'frame_06_new_transition.png',
  'frame_07_moving_nutrition.png',
  'frame_08_liquid_arrival.png',
  'frame_09_settled_nutrition.png'
].forEach(f => {
  enhancedFrames[f] = fs.readFileSync(path.join(enhancedDir, f)).toString('base64');
});

const frameLabels = [
  { id: 'frame_01_start_home.png', num: '01', title: 'START — اليوم مستقر (Resting Pill)', phase: 'استقرار هادئ' },
  { id: 'frame_02_tap_lens_begins.png', num: '02', title: 'TAP — انطلاق العدسة السائلة', phase: 'تشوه انكساري وتمدد' },
  { id: 'frame_03_travel_magnification.png', num: '03', title: 'TRAVEL — تكبير القبة البصرية', phase: 'أقصى تمدد وانكسار' },
  { id: 'frame_04_arrival_workout.png', num: '04', title: 'ARRIVAL — وصول التمارين', phase: 'انكماش تدريجي' },
  { id: 'frame_05_settled_workout.png', num: '05', title: 'SETTLED — استقرار التمارين (Pill)', phase: 'تلاشي اللمعان' },
  { id: 'frame_06_new_transition.png', num: '06', title: 'TRANSITION — انطلاق نحو التغذية', phase: 'انكسار حواف الأيقونة' },
  { id: 'frame_07_moving_nutrition.png', num: '07', title: 'MOVING — عبور السائل الزجاجي', phase: 'تكبير الحروف العابرة' },
  { id: 'frame_08_liquid_arrival.png', num: '08', title: 'ARRIVAL — وصول التغذية', phase: 'تخامد حركي' },
  { id: 'frame_09_settled_nutrition.png', num: '09', title: 'SETTLED — استقرار التغذية (Pill)', phase: 'استقرار الكبسولة' },
];

const comparisonHtml = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>Liquid Glass Navigation — 3-Way Comparative Benchmark</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0B0F19;
      color: #F8FAFC;
      margin: 0;
      padding: 32px 24px;
    }
    .container {
      max-width: 1400px;
      margin: 0 auto;
    }
    .header {
      margin-bottom: 28px;
      border-bottom: 1px solid #1E293B;
      padding-bottom: 20px;
    }
    h1 {
      font-size: 24px;
      font-weight: 800;
      margin: 0 0 6px 0;
      color: #FFFFFF;
      letter-spacing: -0.5px;
    }
    .subtitle {
      font-size: 13px;
      color: #94A3B8;
      margin: 0;
    }
    .section {
      background: #111827;
      border: 1px solid #1F2937;
      border-radius: 20px;
      padding: 20px;
      margin-bottom: 28px;
    }
    .section-title {
      font-size: 16px;
      font-weight: 700;
      margin: 0 0 14px 0;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .badge-ref { background: #3B82F6; color: white; padding: 3px 10px; border-radius: 9999px; font-size: 11px; }
    .badge-cur { background: #EF4444; color: white; padding: 3px 10px; border-radius: 9999px; font-size: 11px; }
    .badge-enh { background: #10B981; color: white; padding: 3px 10px; border-radius: 9999px; font-size: 11px; }

    .ref-img {
      width: 100%;
      border-radius: 14px;
      border: 1px solid #374151;
      display: block;
    }

    .grid-9 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;
    }
    .card {
      background: #1F2937;
      border: 1px solid #374151;
      border-radius: 14px;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      font-weight: 600;
      color: #E2E8F0;
    }
    .card-img-wrap {
      background: #0F172A;
      border-radius: 10px;
      padding: 6px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .card img {
      width: 100%;
      max-width: 380px;
      height: auto;
      border-radius: 28px;
      display: block;
    }
    .card-phase {
      font-size: 10px;
      color: #94A3B8;
    }
  </style>
</head>
<body>
  <div class="container">
    
    <div class="header">
      <h1>لوحة المقارنة الثلاثية الشاملة — Liquid Glass Navigation Benchmark</h1>
      <p class="subtitle">تحليل وتطابق دقيق بين: (1) الفيديو المرجعي الأصلي، (2) التنفيذ السابق، (3) التنفيذ المحسن بعد تطبيق الانكسار البصري المحدب وفيزياء النابض السريعة (400ms).</p>
    </div>

    <!-- PANEL 1: THE ORIGINAL 9 FRAMES REFERENCE -->
    <div class="section">
      <div class="section-title">
        <span class="badge-ref">1. المرجع الأصلي</span>
        <span>الصورة المرجعية الحقيقية (9 فريمات متتابعة من الفيديو الأصلي)</span>
      </div>
      <img src="data:image/png;base64,${refBase64}" class="ref-img" alt="Reference 9 Frames">
    </div>

    <!-- PANEL 2: CURRENT IMPLEMENTATION (BEFORE IMPROVEMENT) -->
    <div class="section">
      <div class="section-title">
        <span class="badge-cur">2. التنفيذ السابق</span>
        <span>التنفيذ السابق (حاوية زجاجية معتمة بنمط ثابت دون تمايز بين الحركة والاستقرار، وتكبير موحد للعنصر بأكمله)</span>
      </div>
      <div class="grid-9">
        ${frameLabels.map(f => `
          <div class="card">
            <div class="card-header">
              <span>فريم ${f.num}: ${f.title}</span>
              <span class="card-phase">${f.phase}</span>
            </div>
            <div class="card-img-wrap">
              <img src="data:image/png;base64,${currentFrames[f.id]}" alt="Current Frame ${f.num}">
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- PANEL 3: ENHANCED IMPLEMENTATION (AFTER IMPROVEMENT) -->
    <div class="section">
      <div class="section-title">
        <span class="badge-enh">3. التنفيذ بعد التحسين</span>
        <span>التنفيذ المحسن الجديد (انكسار محدب per-pixel، تشوه حواف الحروف والأيقونات عند العبور، تمايز كبسولة الاستقرار والفقاعة، وتوقيت نابض 400ms)</span>
      </div>
      <div class="grid-9">
        ${frameLabels.map(f => `
          <div class="card">
            <div class="card-header">
              <span>فريم ${f.num}: ${f.title}</span>
              <span class="card-phase">${f.phase}</span>
            </div>
            <div class="card-img-wrap">
              <img src="data:image/png;base64,${enhancedFrames[f.id]}" alt="Enhanced Frame ${f.num}">
            </div>
          </div>
        `).join('')}
      </div>
    </div>

  </div>
</body>
</html>
`;

const compFilePath = path.join(baseDir, 'liquid_glass_3way_comparison.html');
fs.writeFileSync(compFilePath, comparisonHtml, 'utf8');
console.log('Saved liquid_glass_3way_comparison.html');

// Render comparison HTML and take full screenshot
const compPage = await browser.newPage({ viewport: { width: 1440, height: 2600 } });
await compPage.setContent(comparisonHtml, { waitUntil: 'load' });
await compPage.waitForTimeout(600);

const outImagePath = path.join(baseDir, 'liquid_glass_3way_comparison_benchmark.png');
await compPage.screenshot({ path: outImagePath, fullPage: true });
console.log('Saved liquid_glass_3way_comparison_benchmark.png');

await browser.close();
console.log('All comparisons captured successfully!');

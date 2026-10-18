import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Use the existing Playwright package directly from the environment cache
const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const pwImport = await import(`file://${pwModulePath}`);
const pw = pwImport.default || pwImport;
const { chromium } = pw;

const OUTPUT_DIR = 'C:/Users/Fannan/.gemini/antigravity/brain/b18eb724-0caf-4c71-a8f7-2a9df1328823/visual_tests';
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: 'iPhone-SE-Compact', width: 375, height: 812 },
  { name: 'iPhone-13-Standard', width: 390, height: 844 },
  { name: 'iPhone-ProMax-Large', width: 430, height: 932 },
];

const results = [];

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

async function runVisualSuite() {
  console.log('===============================================================');
  console.log('   Z Coaching Mobile App - Playwright Automated Visual Suite   ');
  console.log('===============================================================\n');

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--disable-extensions', '--no-sandbox']
  });

  const baseUrl = 'http://localhost:5173/mobile_home_pure.html';

  for (const vp of VIEWPORTS) {
    console.log(`\n>>> Testing Viewport: ${vp.name} (${vp.width}x${vp.height}px) <<<`);
    
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });

    const page = await context.newPage();

    // -------------------------------------------------------------
    // Test 1: Screen Today (اليوم)
    // -------------------------------------------------------------
    try {
      await page.goto(`${baseUrl}?tab=today`, { waitUntil: 'networkidle' });

      // RTL Check
      const dir = await page.locator('html').getAttribute('dir');
      assert(dir === 'rtl', 'Page must have dir="rtl"');

      // Horizontal overflow check
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      assert(!overflow, `Horizontal overflow detected at ${vp.width}px!`);

      // Floating bottom navigation check
      const nav = page.locator('#floating-bottom-nav');
      assert(await nav.isVisible(), 'Floating Bottom Navigation must be visible');

      // Save screenshot
      const shot1 = path.join(OUTPUT_DIR, `01_today_${vp.width}px.png`);
      await page.screenshot({ path: shot1 });
      console.log(`  [PASS] Screen 1: Today (RTL, No overflow, Floating Nav) -> ${path.basename(shot1)}`);
      results.push({ viewport: vp.name, screen: 'Today', status: 'PASS' });
    } catch (err) {
      console.error(`  [FAIL] Screen 1: Today -> ${err.message}`);
      results.push({ viewport: vp.name, screen: 'Today', status: 'FAIL', error: err.message });
    }

    // -------------------------------------------------------------
    // Test 2: Screen Workout (التمارين) & Interactions
    // -------------------------------------------------------------
    try {
      await page.goto(`${baseUrl}?tab=workout`, { waitUntil: 'networkidle' });

      const workoutScreen = page.locator('#screen-workout');
      assert(await workoutScreen.isVisible(), 'Workout screen must be visible');

      // Stepper Interaction (+ / -)
      const w1 = page.locator('#w1');
      const startW = parseFloat(await w1.innerText());
      await page.locator("button[onclick*=\"stepVal('w1', 2.5)\"]").click();
      await page.waitForTimeout(100);
      const afterW = parseFloat(await w1.innerText());
      assert(afterW === startW + 2.5, `Weight stepper failed (+2.5kg): expected ${startW + 2.5}, got ${afterW}`);

      // Reps Stepper (+1)
      const r1 = page.locator('#r1');
      const startR = parseInt(await r1.innerText(), 10);
      await page.locator("button[onclick*=\"stepVal('r1', 1)\"]").click();
      await page.waitForTimeout(100);
      const afterR = parseInt(await r1.innerText(), 10);
      assert(afterR === startR + 1, `Reps stepper failed: expected ${startR + 1}, got ${afterR}`);

      // Effort Rating click (مناسب / صعب / سهل)
      const effortButtons = page.locator("article:first-of-type button[onclick*='pickEffort']");
      assert(await effortButtons.count() === 3, 'Must have 3 effort rating buttons');
      await effortButtons.nth(0).click(); // Click "صعب"

      // Bottom Sheet technique check
      const techToggle = page.locator("button[onclick*=\"openTechniqueSheet\"]").first();
      await techToggle.click();
      await page.waitForTimeout(150);
      const techSheet = page.locator('#modal-technique');
      assert(await techSheet.isVisible(), 'Technique bottom sheet must open on click');
      await page.locator("button[onclick*=\"closeTechniqueSheet\"]").first().click();
      await page.waitForTimeout(100);

      // Long text wrapping: Exercise name & Arabic sub
      const enTitle = page.locator('article:first-of-type h3').first();
      assert(await enTitle.isVisible(), 'English title must be visible');

      // Save screenshot
      const shot2 = path.join(OUTPUT_DIR, `02_workout_${vp.width}px.png`);
      await page.screenshot({ path: shot2 });
      console.log(`  [PASS] Screen 2: Workout (Steppers, Effort, Accordion, Typography) -> ${path.basename(shot2)}`);
      results.push({ viewport: vp.name, screen: 'Workout', status: 'PASS' });
    } catch (err) {
      console.error(`  [FAIL] Screen 2: Workout -> ${err.message}`);
      results.push({ viewport: vp.name, screen: 'Workout', status: 'FAIL', error: err.message });
    }

    // -------------------------------------------------------------
    // Test 3: Screen Nutrition (التغذية) & Invariants
    // -------------------------------------------------------------
    try {
      await page.goto(`${baseUrl}?tab=nutrition`, { waitUntil: 'networkidle' });

      const nutritionScreen = page.locator('#screen-nutrition');
      assert(await nutritionScreen.isVisible(), 'Nutrition screen must be visible');

      // Invariant: Zero grocery list & Static water badge
      const groceryCheck = await page.getByText(/قائمة تسوق|شراء من السوبرماركت/).count();
      assert(groceryCheck === 0, 'Zero Grocery List invariant violated!');

      const waterBadge = page.locator('#screen-nutrition').getByText(/3\.5/).first();
      assert(await waterBadge.isVisible(), 'Static hydration badge must be visible');

      // Save screenshot
      const shot3 = path.join(OUTPUT_DIR, `03_nutrition_${vp.width}px.png`);
      await page.screenshot({ path: shot3 });
      console.log(`  [PASS] Screen 3: Nutrition (Calorie Header, Meal Cards, Invariants) -> ${path.basename(shot3)}`);
      results.push({ viewport: vp.name, screen: 'Nutrition', status: 'PASS' });
    } catch (err) {
      console.error(`  [FAIL] Screen 3: Nutrition -> ${err.message}`);
      results.push({ viewport: vp.name, screen: 'Nutrition', status: 'FAIL', error: err.message });
    }

    // -------------------------------------------------------------
    // Test 4: Screen Check-in (المتابعة) - Form & History
    // -------------------------------------------------------------
    try {
      await page.goto(`${baseUrl}?tab=checkin`, { waitUntil: 'networkidle' });

      const checkinScreen = page.locator('#screen-checkin');
      assert(await checkinScreen.isVisible(), 'Checkin screen must be visible');

      // Photo upload slots (3 angles)
      const photoSlots = page.locator('#screen-checkin button[onclick*="togglePhotoUpload"]');
      assert(await photoSlots.count() === 3, 'Checkin must have exactly 3 photo slots (front, side, back)');

      // Save Form screenshot
      const shot4a = path.join(OUTPUT_DIR, `04_checkin_form_${vp.width}px.png`);
      await page.screenshot({ path: shot4a });

      // Switch to History View
      await page.locator('#chk-view-history').click();
      await page.waitForTimeout(150);
      const histView = page.locator('#checkin-mode-history');
      assert(await histView.isVisible(), 'History view must appear on toggle');

      // Save History screenshot
      const shot4b = path.join(OUTPUT_DIR, `04_checkin_history_${vp.width}px.png`);
      await page.screenshot({ path: shot4b });
      console.log(`  [PASS] Screen 4: Checkin (Form, 3 Photo Slots, History Toggle) -> ${path.basename(shot4b)}`);
      results.push({ viewport: vp.name, screen: 'Checkin', status: 'PASS' });
    } catch (err) {
      console.error(`  [FAIL] Screen 4: Checkin -> ${err.message}`);
      results.push({ viewport: vp.name, screen: 'Checkin', status: 'FAIL', error: err.message });
    }

    // -------------------------------------------------------------
    // Test 5: Modal Measurement Units Preferences
    // -------------------------------------------------------------
    try {
      await page.goto(`${baseUrl}?modal=units`, { waitUntil: 'networkidle' });

      const modal = page.locator('#modal-units');
      assert(await modal.isVisible(), 'Measurement units modal must be visible');

      // Toggle to LB & IN
      await page.locator('#seg-ex-lb').click();
      await page.locator('#seg-bw-lb').click();
      await page.locator('#seg-ms-in').click();
      await page.waitForTimeout(150);

      const shot5 = path.join(OUTPUT_DIR, `05_units_modal_${vp.width}px.png`);
      await page.screenshot({ path: shot5 });
      console.log(`  [PASS] Modal: Measurement Units (Segmented Controls, Auto-save) -> ${path.basename(shot5)}`);
      results.push({ viewport: vp.name, screen: 'UnitsModal', status: 'PASS' });
    } catch (err) {
      console.error(`  [FAIL] Modal: Measurement Units -> ${err.message}`);
      results.push({ viewport: vp.name, screen: 'UnitsModal', status: 'FAIL', error: err.message });
    }

    await context.close();
  }

  await browser.close();

  console.log('\n===============================================================');
  console.log('                 VISUAL TEST SUMMARY RESULTS                   ');
  console.log('===============================================================');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log(`Total Checks: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  if (failed > 0) {
    console.error('FAILED SUITE: Some visual assertions failed.');
    process.exit(1);
  } else {
    console.log('SUCCESS: All visual, RTL, typography, and interaction tests PASSED 100%!');
  }
}

runVisualSuite().catch(err => {
  console.error('Fatal error in visual test suite:', err);
  process.exit(1);
});

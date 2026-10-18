import fs from 'fs';
import path from 'path';

const pwModulePath = 'C:/Users/Fannan/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const pwImport = await import(`file://${pwModulePath}`);
const pw = pwImport.default || pwImport;

async function main() {
  const outputDir = path.resolve('d:/zcc/temp_screenshots/targeted_fixes');
  const artifactDir = 'C:/Users/Fannan/.gemini/antigravity/brain/81dd76d6-ffef-4b71-b47f-0fc28953b459';
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('Launching browser for targeted screenshots...');
  const browser = await pw.chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--disable-extensions', '--no-sandbox']
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 1200 },
    deviceScaleFactor: 2
  });

  await page.goto('http://localhost:5173/mobile_app_preview.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  const scrollContainer = async (top) => {
    await page.evaluate((t) => {
      const el = document.querySelector('#device-shell .overflow-y-auto');
      if (el) el.scrollTop = t;
    }, top);
    await page.waitForTimeout(250);
  };

  // 1. Confirmation: Home Calories Ring Untouched
  console.log('Capturing Home calories ring...');
  await page.evaluate(() => { if (typeof switchTab === 'function') switchTab(0); });
  await scrollContainer(0);
  const homeNutrCard = page.locator('#home-nutrition-card');
  await homeNutrCard.screenshot({ path: path.join(outputDir, '01_confirmation_home_calories_ring_untouched.png') });

  // 2. Bottom Nav Salad Bowl Closeup
  console.log('Capturing Bottom Nav Salad Bowl...');
  const bottomNav = page.locator('#floating-bottom-nav');
  await bottomNav.screenshot({ path: path.join(outputDir, '02_corrected_bottom_nav_salad_bowl.png') });

  // 3. Workout: Incline Dumbbell Bench Press (Full Name Unclipped)
  console.log('Capturing Workout Exercise Names...');
  await page.evaluate(() => { if (typeof switchTab === 'function') switchTab(1); });
  await scrollContainer(280);
  const exCard2 = page.locator('#ex-card-2');
  if (await exCard2.count() > 0) {
    await exCard2.screenshot({ path: path.join(outputDir, '03_corrected_workout_exercise_names.png') });
  } else {
    // If dynamically numbered, find by text
    const card = page.locator('article:has-text("Incline Dumbbell Bench Press")').first();
    await card.screenshot({ path: path.join(outputDir, '03_corrected_workout_exercise_names.png') });
  }

  // 4. Workout: Static Stretch with new flexibility icon
  console.log('Capturing Workout Stretch Card...');
  await scrollContainer(750);
  const stretchCard = page.locator('#workout-stretch-card');
  await stretchCard.screenshot({ path: path.join(outputDir, '04_corrected_workout_stretch_card.png') });

  // 5. Nutrition: Oats 303 kcal in Meal 1
  console.log('Capturing Nutrition Oats in Meal 1...');
  await page.evaluate(() => { if (typeof switchTab === 'function') switchTab(2); });
  await scrollContainer(0);
  const meal1Card = page.locator('article:has-text("الإفطار")').first();
  await meal1Card.screenshot({ path: path.join(outputDir, '05_corrected_nutrition_oats_303kcal.png') });

  // 6. Nutrition: Food Swap with 303 kcal and clean tags
  console.log('Capturing Food Swap Sheet...');
  const swapBtn = page.locator('button:has-text("تبديل")').first();
  await swapBtn.click();
  await page.waitForTimeout(400);
  const swapModal = page.locator('#modal-swap-sheet .max-w-\\[390px\\]');
  if (await swapModal.count() > 0) {
    await swapModal.screenshot({ path: path.join(outputDir, '06_corrected_nutrition_food_swap.png') });
  } else {
    const swapSheet = page.locator('#modal-swap-sheet');
    await swapSheet.screenshot({ path: path.join(outputDir, '06_corrected_nutrition_food_swap.png') });
  }
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // 7. Check-in: Submitted State cleanly organized
  console.log('Capturing Check-in Submitted State...');
  await page.evaluate(() => {
    if (typeof switchTab === 'function') switchTab(3);
    if (typeof setCheckinState === 'function') setCheckinState('submitted');
  });
  await scrollContainer(0);
  const checkinCard = page.locator('#chk-schedule-card');
  await checkinCard.screenshot({ path: path.join(outputDir, '07_corrected_checkin_submitted_state.png') });

  await browser.close();
  console.log('Targeted screenshots captured.');

  // Copy to artifact directory
  const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.png'));
  for (const f of files) {
    fs.copyFileSync(path.join(outputDir, f), path.join(artifactDir, f));
  }
  console.log('Targeted screenshots copied to artifacts.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
